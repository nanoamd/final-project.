/**
 * Curated importer for AW Dropship (aw-dropship.com) — pulls specific
 * product codes from their public data feed and creates ready-to-review
 * Sanity product DRAFTS in the wellness-accessories category. Deliberately
 * curation-first: you pass the exact codes you want on the shelf; it never
 * bulk-imports the 7,000-item giftware catalogue.
 *
 * Prices: sale price = their Unit RRP, trade cost = their Unit price —
 * both editable in Studio before publishing. Drafts use deterministic ids
 * (drafts.product-aw-<code>), so re-running refreshes rather than
 * duplicates; already-published products are left untouched.
 *
 * Run with:
 *   pnpm tsx --env-file=.env.local scripts/import-aw-products.ts FSH-01 EO-03 ...
 * or with no args to import the default sauna-accessories shortlist.
 */
import { createClient } from "@sanity/client";

const FEED_URL = "https://www.aw-dropship.com/data-feed.csv";
const CATEGORY_SLUG = "wellness-accessories";
const SUPPLIER_NAME = "AW Dropship";
const MAX_IMAGES = 4;

const DEFAULT_CODES = [
  "FSH-01",
  "FSH-02",
  "FSH-03",
  "FSH-04",
  "FSH-05",
  "FSH-06",
  "EO-03",
  "EO-76",
  "PrEO-76",
  "CSalt-01",
];

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token,
  useCdn: false,
});

/** Minimal RFC-4180 CSV parser (quoted fields, embedded commas/newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function uploadImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload("image", buffer, {
      filename: url.split("/").pop()?.slice(0, 60) || "aw-image.jpg",
    });
    return asset._id;
  } catch {
    return null;
  }
}

async function main() {
  const codes = process.argv.slice(2).length
    ? process.argv.slice(2)
    : DEFAULT_CODES;

  console.log(`Fetching feed (${codes.length} codes requested)…`);
  const feedRes = await fetch(FEED_URL);
  if (!feedRes.ok) {
    console.error(`Feed download failed: HTTP ${feedRes.status}`);
    process.exit(1);
  }
  const rows = parseCsv(await feedRes.text());
  const header = rows[0]!;
  const col = (name: string) => header.indexOf(name);
  const records = new Map(
    rows.slice(1).map((r) => [r[col("Product code")], r] as const),
  );

  const category = await client.fetch<{ _id: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id }`,
    { slug: CATEGORY_SLUG },
  );
  if (!category) {
    console.error(`Category not found: ${CATEGORY_SLUG}`);
    process.exit(1);
  }

  const supplierId = `supplier-${slugify(SUPPLIER_NAME)}`;
  await client.createIfNotExists({
    _id: supplierId,
    _type: "supplier",
    name: SUPPLIER_NAME,
  });

  for (const code of codes) {
    const record = records.get(code);
    if (!record) {
      console.warn(`✗ ${code}: not found in feed, skipped`);
      continue;
    }
    const get = (name: string) => record[col(name)]?.trim() ?? "";
    if (get("Status") !== "Active") {
      console.warn(`✗ ${code}: not Active in feed, skipped`);
      continue;
    }

    const name = get("Unit Name");
    const rrp = parseFloat(get("Unit RRP"));
    const trade = parseFloat(get("Unit price"));
    const qty = parseInt(get("Available Quantity") || "0", 10);
    const plainDescription = get("Webpage description (plain text)");
    const imageUrls = get("Images")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, MAX_IMAGES);

    const gallery: {
      _type: "image";
      _key: string;
      asset: { _type: "reference"; _ref: string };
    }[] = [];
    for (const [index, url] of imageUrls.entries()) {
      const assetId = await uploadImage(url);
      if (assetId) {
        gallery.push({
          _type: "image",
          _key: `gallery-${index}`,
          asset: { _type: "reference", _ref: assetId },
        });
      }
    }

    await client.createOrReplace({
      _id: `drafts.product-aw-${slugify(code)}`,
      _type: "product",
      title: name,
      slug: { _type: "slug", current: slugify(name) },
      category: { _type: "reference", _ref: category._id },
      supplier: { _type: "reference", _ref: supplierId },
      price: rrp,
      costPrice: trade,
      currency: "GBP",
      sku: `AW-${code}`,
      gtin: get("Barcode") || undefined,
      summary: plainDescription.slice(0, 280),
      highlights: [],
      stockStatus: qty > 0 ? "In Stock" : "Out of Stock",
      stockQuantity: qty,
      sourceUrl: "https://www.aw-dropship.com/",
      gallery,
    });
    console.log(
      `✓ ${code}: "${name}" — £${rrp} (trade £${trade}), ${gallery.length} images, qty ${qty} → draft`,
    );
  }

  console.log(
    "\nDone. Review the drafts in Studio (Content → Products), polish the copy, and publish the ones you want live.",
  );
}

main().catch((err) => {
  console.error("import-aw-products failed:", err);
  process.exit(1);
});
