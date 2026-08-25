/**
 * Title, item code and photograph URLs off a Hill Interiors item page.
 *
 * scripts/enrich-from-supplier.ts already reads the specification table (colour,
 * material, weight, barcode, dimensions) off these same pages for products that exist.
 * Creating a new product needs three things that module never had to extract: what to
 * call it, the supplier's own code for it (`supplierSku` — the field exists specifically
 * so a re-import recognises a product already listed, per its comment in
 * src/sanity/schemaTypes/documents/product.ts), and its photographs.
 *
 * There is no JSON-LD on these pages — checked directly rather than assumed, because
 * scripts/import-supplier-products.ts's `--html` mode depends on it and would silently
 * find nothing here. The `<h1>` carries the title, cleanly, twice. The photographs are
 * plain `<img>` tags at `/images/giant/<code>[-a|-b|...].jpg`, and the same page also
 * shows small thumbnails for unrelated "Customers Also Bought" products — those carry a
 * different code, so filtering to the item's own code excludes them without needing to
 * know where one block of the page ends and the next begins.
 */

/** The item code, read from the "Code:" line the page prints beside "Dimensions:". */
function itemCode(html: string): string | null {
  const stripped = html.replace(/<[^>]+>/g, "\n");
  const lines = stripped
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const index = lines.findIndex((line) => line === "Code:");
  return index === -1 ? null : (lines[index + 1] ?? null);
}

function title(html: string): string | null {
  const match = /<h1[^>]*>([^<]+)<\/h1>/.exec(html);
  return match ? match[1]!.trim() : null;
}

/**
 * Full-size photograph URLs belonging to this item, in the order the page lists them —
 * which is the order the supplier chose to display them, main shot first.
 */
function images(html: string, code: string): string[] {
  const pattern = new RegExp(
    `https://www\\.hill-interiors\\.com/images/giant/${code}(?:-[a-z])?\\.jpg`,
    "g",
  );
  return [...new Set(html.match(pattern) ?? [])];
}

export interface HillItemPage {
  code: string;
  title: string;
  images: string[];
}

/** `null` when the page is missing the code or the title — too thin to import from. */
export function parseItemPage(html: string): HillItemPage | null {
  const code = itemCode(html);
  const pageTitle = title(html);
  if (!code || !pageTitle) return null;
  return { code, title: pageTitle, images: images(html, code) };
}
