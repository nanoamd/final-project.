/**
 * Curated importer for AW Dropship (aw-dropship.com) — pulls specific
 * product codes from their public data feed and creates ready-to-review
 * Sanity product DRAFTS. Deliberately curation-first: you pass the exact
 * codes you want on the shelf; it never bulk-imports the 7,000-item
 * giftware catalogue.
 *
 * Prices: sale price = their Unit RRP, trade cost = their Unit price —
 * both editable in Studio before publishing. Weight comes from the feed's
 * "Package weight (shipping)" column, which also sets shippingCost via AW's
 * published UK Mainland (Zone 1) courier rate table — see
 * src/lib/suppliers/aw-dropship-shipping.ts. Each item also carries
 * hand-picked styleTags (e.g. "Vintage & Reclaimed", "Coffee Table") that
 * power the shop drill-nav's third tier. Drafts use deterministic ids
 * (drafts.product-aw-<code>), so re-running refreshes rather than
 * duplicates; already-published products are left untouched. Categories
 * are created on demand (createIfNotExists) if they don't exist yet.
 *
 * Run with:
 *   pnpm tsx --env-file=.env.local scripts/import-aw-products.ts FSH-01 EO-03 ...
 *     — imports the given codes into wellness-accessories.
 *   pnpm tsx --env-file=.env.local scripts/import-aw-products.ts
 *     — no args: imports the default sauna-accessories shortlist.
 *   pnpm tsx --env-file=.env.local scripts/import-aw-products.ts furniture
 *     — imports the full curated furniture shortlist (65 items) across two
 *       new categories: "Rustic & Reclaimed Furniture" for the weathered/
 *       reclaimed-wood pieces, and "Interior Furniture" for everything else
 *       (teak shelving, barrel tables, bathroom cabinets, etc). 15 items
 *       from AW's "Furniture & Displays" subdepartment were deliberately
 *       left out as retail merchandising fixtures (candle/soap/incense
 *       display stands), not furniture a customer would buy for their home.
 */
import { createClient } from "@sanity/client";

import { getAwDropshipShippingCost } from "../src/lib/suppliers/aw-dropship-shipping";

const FEED_URL = "https://www.aw-dropship.com/data-feed.csv";
const SUPPLIER_NAME = "AW Dropship";
const MAX_IMAGES = 4;
const DEFAULT_DEPARTMENT_SLUG = "living-room";

interface ImportItem {
  code: string;
  /** Free-text facets, e.g. ["Vintage & Reclaimed", "Coffee Table"] — power
   * the shop drill-nav's third tier. */
  styleTags?: string[];
}

interface ImportSet {
  categorySlug: string;
  categoryTitle: string;
  items: ImportItem[];
}

const WELLNESS_SET: ImportSet = {
  categorySlug: "wellness-accessories",
  categoryTitle: "Wellness Accessories",
  items: [
    { code: "FSH-01", styleTags: ["Bath & Body"] },
    { code: "FSH-02", styleTags: ["Bath & Body"] },
    { code: "FSH-03", styleTags: ["Bath & Body"] },
    { code: "FSH-04", styleTags: ["Bath & Body"] },
    { code: "FSH-05", styleTags: ["Bath & Body"] },
    { code: "FSH-06", styleTags: ["Bath & Body"] },
    { code: "EO-03", styleTags: ["Essential Oils"] },
    { code: "EO-76", styleTags: ["Essential Oils"] },
    { code: "PrEO-76", styleTags: ["Essential Oils"] },
    { code: "CSalt-01", styleTags: ["Bath & Body"] },
  ],
};

// Weathered/whitewashed reclaimed-wood pieces — the "older aesthetic" set.
const RUSTIC_FURNITURE_SET: ImportSet = {
  categorySlug: "rustic-reclaimed-furniture",
  categoryTitle: "Rustic & Reclaimed Furniture",
  items: [
    { code: "RDS-123", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "RDS-152", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "RDS-150", styleTags: ["Vintage & Reclaimed", "Shelving"] },
    { code: "RDS-145", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "RDS-146", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "RDS-147", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "RDS-148", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "RDS-151", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "RDS-153", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "RDS-154", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "RDS-149", styleTags: ["Vintage & Reclaimed", "Shelving"] },
    { code: "RDS-155", styleTags: ["Vintage & Reclaimed", "Shelving"] },
    { code: "ACShop-01", styleTags: ["Vintage & Reclaimed", "Dining Table"] },
    { code: "ACShop-02", styleTags: ["Vintage & Reclaimed", "Console Table"] },
    { code: "ACShop-03", styleTags: ["Vintage & Reclaimed", "Shelving"] },
    { code: "ACShop-07", styleTags: ["Vintage & Reclaimed", "Dining Table"] },
    { code: "ACSHOP-08", styleTags: ["Vintage & Reclaimed", "Shelving"] },
    { code: "ACSHOP-09", styleTags: ["Vintage & Reclaimed", "Coffee Table"] },
    { code: "ACSHOP-10", styleTags: ["Vintage & Reclaimed", "Coffee Table"] },
    { code: "ACShop-11", styleTags: ["Vintage & Reclaimed", "Coffee Table"] },
    { code: "ACShop-12", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "ACShop-13", styleTags: ["Vintage & Reclaimed", "TV Stand"] },
    { code: "ACShop-14", styleTags: ["Vintage & Reclaimed", "Bedside Table"] },
    { code: "ACShop-15", styleTags: ["Vintage & Reclaimed", "Storage"] },
    {
      code: "ACShop-16",
      styleTags: ["Vintage & Reclaimed", "Display Stand"],
    },
    { code: "ACShop-17", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "ACShop-18", styleTags: ["Vintage & Reclaimed", "TV Stand"] },
    { code: "ACShop-19", styleTags: ["Vintage & Reclaimed", "Bedside Table"] },
    { code: "ACShop-21", styleTags: ["Vintage & Reclaimed", "Coffee Table"] },
    { code: "ACShop-20", styleTags: ["Vintage & Reclaimed", "Storage"] },
    { code: "ACShop-07A", styleTags: ["Vintage & Reclaimed", "Dining Table"] },
    { code: "ACShop-06", styleTags: ["Vintage & Reclaimed", "Dining Table"] },
    { code: "ACShop-05", styleTags: ["Vintage & Reclaimed", "Dining Table"] },
    { code: "ACShop-04X", styleTags: ["Vintage & Reclaimed", "Dining Table"] },
    { code: "ACShop-07B", styleTags: ["Vintage & Reclaimed", "Dining Table"] },
  ],
};

// Everything else in AW's furniture range: teak shelving, barrel tables,
// bathroom cabinets, resin coffee tables, tribal stools, plant stands.
const INTERIOR_FURNITURE_SET: ImportSet = {
  categorySlug: "interior-furniture",
  categoryTitle: "Interior Furniture",
  items: [
    { code: "PSS-01", styleTags: ["Plant Stand"] },
    { code: "PSS-02", styleTags: ["Plant Stand"] },
    { code: "PSS-03", styleTags: ["Plant Stand"] },
    { code: "PSS-04", styleTags: ["Plant Stand"] },
    { code: "TTS-01", styleTags: ["Stool", "Side Table"] },
    { code: "TTS-02", styleTags: ["Stool", "Side Table"] },
    { code: "TTS-03", styleTags: ["Stool", "Side Table"] },
    { code: "TTS-04", styleTags: ["Stool", "Side Table"] },
    { code: "TTS-05", styleTags: ["Stool", "Side Table"] },
    { code: "TTS-06", styleTags: ["Stool", "Side Table"] },
    { code: "RWA-01", styleTags: ["Coffee Table", "Modern"] },
    { code: "RWA-02", styleTags: ["Coffee Table", "Modern"] },
    { code: "BCab-01", styleTags: ["Bathroom Cabinet"] },
    { code: "BCab-02", styleTags: ["Bathroom Cabinet"] },
    { code: "BCab-03", styleTags: ["Bathroom Cabinet"] },
    { code: "BCab-04", styleTags: ["Bathroom Cabinet"] },
    { code: "BCab-05", styleTags: ["Bathroom Cabinet"] },
    { code: "TDS-02", styleTags: ["Shelving"] },
    { code: "TDS-03", styleTags: ["Shelving"] },
    { code: "TDS-04", styleTags: ["Shelving"] },
    { code: "TDS-05", styleTags: ["Shelving"] },
    { code: "TDS-06", styleTags: ["Shelving"] },
    { code: "TDS-07", styleTags: ["Shelving"] },
    { code: "TDS-08", styleTags: ["Shelving"] },
    { code: "BTS-01", styleTags: ["Side Table"] },
    { code: "BTS-02", styleTags: ["Stool"] },
    { code: "BTS-03", styleTags: ["Side Table"] },
    { code: "BTS-04", styleTags: ["Stool"] },
    { code: "BTS-05", styleTags: ["Side Table"] },
    { code: "BTS-06", styleTags: ["Stool"] },
  ],
};

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

/** Looks up a category by slug, creating it (with a department ref) if missing. */
async function ensureCategory(
  slug: string,
  title: string,
): Promise<{ _id: string }> {
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id }`,
    { slug },
  );
  if (existing) return existing;

  const departmentId = `department-${DEFAULT_DEPARTMENT_SLUG}`;
  await client.createIfNotExists({
    _id: departmentId,
    _type: "department",
    title: "Living Room",
    slug: { _type: "slug", current: DEFAULT_DEPARTMENT_SLUG },
  });

  const created = await client.create({
    _id: `category-${slug}`,
    _type: "category",
    title,
    slug: { _type: "slug", current: slug },
    department: { _type: "reference", _ref: departmentId },
  });
  console.log(`+ Created category "${title}" (${slug})`);
  return created;
}

async function importSet(
  set: ImportSet,
  records: Map<string | undefined, string[]>,
  col: (name: string) => number,
) {
  const category = await ensureCategory(set.categorySlug, set.categoryTitle);
  const supplierId = `supplier-${slugify(SUPPLIER_NAME)}`;
  await client.createIfNotExists({
    _id: supplierId,
    _type: "supplier",
    name: SUPPLIER_NAME,
  });

  for (const { code, styleTags } of set.items) {
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
    const weightKg = parseFloat(get("Package weight (shipping)")) || 0;
    const shippingCost = weightKg ? getAwDropshipShippingCost(weightKg) : null;
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
      shippingCost: shippingCost ?? undefined,
      currency: "GBP",
      sku: `AW-${code}`,
      gtin: get("Barcode") || undefined,
      summary: plainDescription.slice(0, 280),
      highlights: [],
      styleTags: styleTags ?? undefined,
      stockStatus: qty > 0 ? "In Stock" : "Out of Stock",
      stockQuantity: qty,
      sourceUrl: "https://www.aw-dropship.com/",
      weight: weightKg
        ? { _type: "weight", value: weightKg, unit: "kg" }
        : undefined,
      gallery,
    });
    console.log(
      `✓ ${code}: "${name}" — £${rrp} (trade £${trade}, shipping £${shippingCost ?? "?"}), ${gallery.length} images, qty ${qty} → draft [${set.categoryTitle}]`,
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const sets: ImportSet[] =
    args[0] === "furniture"
      ? [RUSTIC_FURNITURE_SET, INTERIOR_FURNITURE_SET]
      : [
          {
            ...WELLNESS_SET,
            items: args.length
              ? args.map((code) => ({ code }))
              : WELLNESS_SET.items,
          },
        ];

  console.log(
    `Fetching feed (${sets.reduce((n, s) => n + s.items.length, 0)} codes requested across ${sets.length} categor${sets.length === 1 ? "y" : "ies"})…`,
  );
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

  for (const set of sets) {
    await importSet(set, records, col);
  }

  console.log(
    "\nDone. Review the drafts in Studio (Content → Products), polish the copy, and publish the ones you want live.",
  );
}

main().catch((err) => {
  console.error("import-aw-products failed:", err);
  process.exit(1);
});
