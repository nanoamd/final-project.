import { siteConfig } from "@/config/site";
import { env } from "@/env";
import { deliveryWindow } from "@/lib/catalog/delivery";
import { getMerchantFeedProducts } from "@/lib/sanity/queries";
import type { SanityProduct } from "@/types/sanity-content";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Google's allowed availability enum: in stock | out of stock | preorder | backorder. */
function mapAvailability(stockStatus: string): string {
  switch (stockStatus) {
    case "In Stock":
      return "in stock";
    case "Out of Stock":
      return "out of stock";
    case "Made to Order":
      // Closest fit: available to buy now, ships once produced.
      return "backorder";
    case "Backorder":
      return "backorder";
    default:
      return "out of stock";
  }
}

/**
 * Handling time, per product, from the same `deliveryLeadTime` string the
 * product page shows.
 *
 * Merchant Center splits delivery into handling time (order to dispatch) and
 * transit time (dispatch to doorstep), and shows a delivery estimate built from
 * both. Transit is a courier constant, so it belongs in the account settings.
 * Handling is our supplier's lead time, and ours runs from 2-5 days on an
 * essential oil to 4-6 weeks on a barrel sauna — a 20x spread that no single
 * account-level figure can represent.
 *
 * Setting one account default would mean either promising a sauna in days, or
 * telling someone their £48 bottle of oil takes six weeks. The first invites a
 * complaint on every order and is a misrepresentation Merchant Center suspends
 * accounts for; the second loses the sale outright. Per-product overrides the
 * account setting, so each listing shows its own truth.
 *
 * Lead times were normalised to "N–M weeks" / "N–M days" by
 * scripts/normalise-lead-times.ts, so parsing is a small, closed problem. A
 * value that does not parse returns null and falls back to the account default
 * rather than guessing.
 */
function handlingDays(
  leadTime: string | null,
): { min: number; max: number } | null {
  if (!leadTime) return null;
  // En dash from the normaliser, hyphen from anything added since.
  const match = /(\d+)\s*[-–—]\s*(\d+)\s*(day|week|month)/i.exec(leadTime);
  if (!match) return null;
  const perUnit = { day: 1, week: 7, month: 30 }[match[3]!.toLowerCase()];
  if (!perUnit) return null;
  const min = Number(match[1]) * perUnit;
  const max = Number(match[2]) * perUnit;
  // Google rejects a max below the min, and a 0-day handling time.
  if (!min || max < min) return null;
  return { min, max };
}

/**
 * Own-brand products have no manufacturer barcode, and Google will not accept
 * that silently: an item with no `gtin` and no `mpn` is disapproved with
 * "Missing value: GTIN" unless the feed states outright that no identifier
 * exists. 20 of 45 products were in that position — 44% of the catalogue, all
 * rejected, with nothing on the site to indicate it.
 *
 * Declaring `identifier_exists: no` is the documented way to say "this product
 * genuinely has no barcode", which is true of anything sold under our own name.
 * It must NOT be set on a product that does have one, so it is keyed off the
 * absence of both fields rather than applied everywhere.
 */
function identifierExists(product: {
  gtin: string | null;
  mpn: string | null;
}): boolean {
  return Boolean(product.gtin ?? product.mpn);
}

/**
 * Google's own taxonomy is optional — it classifies items itself — but
 * `product_type` is our taxonomy, and it is what campaign structure and
 * reporting are later built on. "Outdoor Living > Fire Pits" costs nothing to
 * emit and cannot be reconstructed after the fact.
 */
function productType(product: {
  departmentName: string | null;
  categoryName: string | null;
}): string | null {
  const parts = [product.departmentName, product.categoryName].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length ? parts.join(" > ") : null;
}

/**
 * Google Merchant Center product feed (RSS 2.0 + the `g:` shopping
 * namespace). Configure this URL as a "Scheduled fetch" in Merchant Center:
 * `https://www.kaikuhome.com/api/feeds/google-merchant`.
 */
export async function GET() {
  /**
   * `siteConfig.url`, not `env.NEXT_PUBLIC_SITE_URL`.
   *
   * Two reasons, and the second is the important one.
   *
   * It crashed the build. Every route module is evaluated while collecting page
   * data, and this one is prerendered, so with the variable unset the escape
   * helper was handed `undefined` and the build died on
   * `Cannot read properties of undefined (reading 'replace')` — taking the whole
   * deploy down over one feed nobody had switched on yet.
   *
   * And a feed link must match the page's canonical exactly. Every canonical,
   * OG tag, JSON-LD url and sitemap entry on this site is built from
   * `siteConfig.url`, which is the `www` host the site actually serves from —
   * the bare domain 308-redirects to it. A feed pointing at a URL that redirects
   * is a routine cause of Merchant Center disapprovals, so reading the same
   * constant as everything else is the correct answer rather than the convenient
   * one.
   */
  const siteUrl = siteConfig.url;

  // Off until MERCHANT_FEED_ENABLED=true. Merchant Center fetches on its own
  // schedule, so one scheduled fetch is enough for it to keep collecting
  // whatever happens to be published — including a batch of imported drafts the
  // moment they go live, before their prices have been checked. Submitting the
  // range deliberately, in one go, is the intent.
  //
  // Answers 200 with an empty channel rather than 404ing: an empty feed makes
  // Merchant Center withdraw the items it already holds, while a failed fetch
  // leaves the last successful set live and just logs an error.
  if (!env.MERCHANT_FEED_ENABLED) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Kaiku</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>Kaiku product feed — not yet published. Set MERCHANT_FEED_ENABLED=true to serve products.</description>
</channel>
</rss>`,
      {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const products = await getMerchantFeedProducts();

  const items = products
    .map((product) => {
      const link = `${siteUrl}/shop/${product.category}/${product.slug}`;
      const priceValue = `${product.price.toFixed(2)} ${(product.currency || "GBP").toUpperCase()}`;
      const type = productType(product);
      // The same window the product page states, via the shared rule — a feed
      // that promised a different lead time from the page it links to is
      // exactly the misrepresentation Merchant Center suspends accounts for.
      const handling = handlingDays(
        deliveryWindow({
          price: product.price,
          deliveryLeadTime: product.deliveryLeadTime ?? undefined,
          supplier: product.supplierName
            ? { name: product.supplierName }
            : null,
        } as SanityProduct),
      );

      return `  <item>
    <g:id>${escapeXml(product.slug)}</g:id>
    <title>${escapeXml(product.title)}</title>
    <description>${escapeXml(product.summary)}</description>
    <link>${escapeXml(link)}</link>
    ${
      // feedImage first: a square 1:1 render honouring the hero's tightened crop, so
      // the product fills the Shopping tile instead of sitting in reclaimable white
      // space. Falls back to the raw asset for any product whose hero has no crop —
      // which is what was sent before, so a missing crop degrades rather than breaks.
      product.feedImage || product.image
        ? `<g:image_link>${escapeXml(product.feedImage || product.image!)}</g:image_link>`
        : ""
    }
    <g:availability>${mapAvailability(product.stockStatus)}</g:availability>
    <g:price>${priceValue}</g:price>
    <g:condition>new</g:condition>
    ${product.brand ? `<g:brand>${escapeXml(product.brand)}</g:brand>` : ""}
    ${product.gtin ? `<g:gtin>${escapeXml(product.gtin)}</g:gtin>` : ""}
    ${product.mpn ? `<g:mpn>${escapeXml(product.mpn)}</g:mpn>` : ""}
    ${product.sku ? `<g:sku>${escapeXml(product.sku)}</g:sku>` : ""}
    ${identifierExists(product) ? "" : "<g:identifier_exists>no</g:identifier_exists>"}
    ${type ? `<g:product_type>${escapeXml(type)}</g:product_type>` : ""}
    ${handling ? `<g:min_handling_time>${handling.min}</g:min_handling_time>` : ""}
    ${handling ? `<g:max_handling_time>${handling.max}</g:max_handling_time>` : ""}
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Kaiku</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>Kaiku product feed for Google Merchant Center</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
