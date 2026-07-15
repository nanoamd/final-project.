import { env } from "@/env";
import { getMerchantFeedProducts } from "@/lib/sanity/queries";

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
 * Google Merchant Center product feed (RSS 2.0 + the `g:` shopping
 * namespace). Configure this URL as a "Scheduled fetch" in Merchant Center:
 * `${NEXT_PUBLIC_SITE_URL}/api/feeds/google-merchant`.
 */
export async function GET() {
  const products = await getMerchantFeedProducts();
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  const items = products
    .map((product) => {
      const link = `${siteUrl}/shop/${product.category}/${product.slug}`;
      const priceValue = `${product.price.toFixed(2)} ${(product.currency || "GBP").toUpperCase()}`;

      return `  <item>
    <g:id>${escapeXml(product.slug)}</g:id>
    <title>${escapeXml(product.title)}</title>
    <description>${escapeXml(product.summary)}</description>
    <link>${escapeXml(link)}</link>
    ${product.image ? `<g:image_link>${escapeXml(product.image)}</g:image_link>` : ""}
    <g:availability>${mapAvailability(product.stockStatus)}</g:availability>
    <g:price>${priceValue}</g:price>
    <g:condition>new</g:condition>
    ${product.brand ? `<g:brand>${escapeXml(product.brand)}</g:brand>` : ""}
    ${product.gtin ? `<g:gtin>${escapeXml(product.gtin)}</g:gtin>` : ""}
    ${product.mpn ? `<g:mpn>${escapeXml(product.mpn)}</g:mpn>` : ""}
    ${product.sku ? `<g:sku>${escapeXml(product.sku)}</g:sku>` : ""}
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
