/**
 * The Merchant Center feed, built once and served from two addresses.
 *
 * It used to live entirely inside `app/api/feeds/google-merchant/route.ts`.
 * It moved here when a second route was needed at `/google-merchant.xml`,
 * because robots.txt carried `Disallow: /api/` and Merchant Center's scheduled
 * fetch obeys it — so the feed answered 200 with 908 items to everything except
 * the one client it exists for.
 *
 * A route module cannot re-export another route's handler, and copying the
 * builder would have given us two feeds that disagree the first time a field
 * changed. So the work lives here and both routes are three lines.
 */
import { siteConfig } from "@/config/site";
import { env } from "@/env";
import {
  deliveryWindow,
  googleAvailability,
  handlingDays,
} from "@/lib/catalog/delivery";
import { feedTitle } from "@/lib/catalog/feed-title";
import { googleProductCategory } from "@/lib/catalog/google-product-category";
import { resolveIdentity } from "@/lib/catalog/manufacturer-brand";
import { getMerchantFeedProducts } from "@/lib/sanity/queries";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * The item's `id`, which is the SKU rather than the slug.
 *
 * Google caps `id` at 50 characters. **227 of our 908 slugs are longer** —
 * `set-of-three-wooden-lanterns-with-traditional-cross-section` is 59 — so the
 * first successful fetch ingested 669 of 908 and the shortfall was almost
 * exactly those 227.
 *
 * Truncating the slug was the obvious fix and the wrong one: cutting at 50
 * characters collides
 * `freska-ribbed-round-glass-jar-with-acacia-wood-lid-1100ml` with its 800ml
 * sibling, and two products sharing an `id` is worse than one being rejected.
 *
 * The SKU is already what we need and was sitting there: **908 products, 908
 * present, 908 distinct, longest 26 characters.** It is also the identifier the
 * rest of the business uses, so a Merchant Center row now reconciles against a
 * purchase order without a lookup.
 *
 * The slug stays as the fallback for anything that somehow has no SKU, still
 * truncated to 50 so a long one degrades to rejected-by-Google rather than
 * silently colliding.
 */
function feedId(product: { sku: string | null; slug: string }): string {
  const sku = product.sku?.trim();
  if (sku && sku.length <= 50) return sku;
  return product.slug.slice(0, 50);
}

/**
 * Shipping, declared per item rather than left to account settings.
 *
 * The feed sent handling time and no `g:shipping` at all. Merchant Center needs
 * shipping from one of two places — the feed, or the account's shipping
 * settings — and with neither it disapproves the lot. The first successful
 * fetch bore that out: 669 products ingested and 666 immediately "Not showing
 * on Google".
 *
 * £0.00 is not a guess and not an optimistic rounding. "Free UK delivery" is
 * the site-wide claim on the cart, the product summary, the delivery tab and
 * the homepage, and checkout adds no shipping line. Declaring anything else
 * here would be the feed disagreeing with the landing page, which is the
 * mismatch Merchant Center suspends accounts over.
 *
 * GB only, deliberately. Hill Interiors cannot dropship to the EU at all, so
 * there is no rate to declare for anywhere else and inventing one would invite
 * orders that cannot be fulfilled.
 */
const SHIPPING_ELEMENT = `<g:shipping>
      <g:country>GB</g:country>
      <g:service>Free UK delivery</g:service>
      <g:price>0.00 GBP</g:price>
    </g:shipping>`;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
 * namespace). Point Merchant Center's scheduled fetch at
 * **`https://www.kaikuhome.com/google-merchant.xml`** — the `/api/` path still
 * serves the same bytes, but robots.txt disallowed `/api/` for years and a
 * future edit to that list would silently break the fetch again.
 */
export async function buildMerchantFeedResponse(): Promise<Response> {
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
      // Who actually made it, read from the barcode's GS1 company prefix
      // rather than from our own brand field. 728 items were declaring brand
      // "Kaiku" beside a GTIN registered to Hill Interiors, Premier Housewares
      // or Ancient Wisdom — a pair Google validates, and a mismatch both risks
      // disapproval and blocks product matching. See manufacturer-brand.ts.
      const identity = resolveIdentity(product);
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
    <g:id>${escapeXml(feedId(product))}</g:id>
    <title>${escapeXml(
      // Not the page's title. A <title> tag is cut off past ~60 characters
      // and these names average 51; a feed title allows 150. See feed-title.ts.
      feedTitle({
        name: product.title,
        colours: product.colourTags,
        materials: product.materialTags,
        categoryName: product.categoryName,
      }),
    )}</title>
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
    <g:availability>${googleAvailability(product.stockStatus)}</g:availability>
    <g:price>${priceValue}</g:price>
    <g:condition>new</g:condition>
    ${identity.brand ? `<g:brand>${escapeXml(identity.brand)}</g:brand>` : ""}
    ${identity.gtin ? `<g:gtin>${escapeXml(identity.gtin)}</g:gtin>` : ""}
    ${identity.mpn ? `<g:mpn>${escapeXml(identity.mpn)}</g:mpn>` : ""}
    ${product.sku ? `<g:sku>${escapeXml(product.sku)}</g:sku>` : ""}
    ${identity.identifierExists ? "" : "<g:identifier_exists>no</g:identifier_exists>"}
    ${type ? `<g:product_type>${escapeXml(type)}</g:product_type>` : ""}
    ${
      // Which auction the product competes in. Absent for the few genuinely
      // mixed categories, where Google's per-product classification beats one
      // blanket category that is wrong for part of the range.
      googleProductCategory(product.category, product.title)
        ? `<g:google_product_category>${escapeXml(googleProductCategory(product.category, product.title)!)}</g:google_product_category>`
        : ""
    }
    ${
      // Colour and material are matched against attribute-filtered queries
      // ("grey glazed vase", "oak console table"). Joined with "/" where a
      // product has several, per Merchant Center's documented convention.
      product.colourTags?.length
        ? `<g:color>${escapeXml(product.colourTags.join("/"))}</g:color>`
        : ""
    }
    ${
      product.materialTags?.length
        ? `<g:material>${escapeXml(product.materialTags.join("/"))}</g:material>`
        : ""
    }
    ${
      // Up to 10 extra photos, which is Merchant Center's cap.
      (product.extraImages ?? [])
        .filter(Boolean)
        .slice(0, 10)
        .map(
          (url) =>
            `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`,
        )
        .join("\n    ")
    }
    ${
      /* custom_label_0 is how a Performance Max campaign is pointed at the
         products that actually pay. Left to itself an automated campaign buys
         the cheapest clicks, which are the 707 products making nothing. */
      product.promotionTier
        ? `<g:custom_label_0>${escapeXml(product.promotionTier)}</g:custom_label_0>`
        : ""
    }
    ${handling ? `<g:min_handling_time>${handling.min}</g:min_handling_time>` : ""}
    ${handling ? `<g:max_handling_time>${handling.max}</g:max_handling_time>` : ""}
    ${SHIPPING_ELEMENT}
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
