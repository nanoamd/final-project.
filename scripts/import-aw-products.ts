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
 * src/lib/suppliers/aw-dropship-shipping.ts. Drafts use deterministic ids
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

interface ImportSet {
  categorySlug: string;
  categoryTitle: string;
  codes: string[];
}

const WELLNESS_SET: ImportSet = {
  categorySlug: "wellness-accessories",
  categoryTitle: "Wellness Accessories",
  codes: [
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
  ],
};

// Weathered/whitewashed reclaimed-wood pieces — the "older aesthetic" set.
const RUSTIC_FURNITURE_SET: ImportSet = {
  categorySlug: "rustic-reclaimed-furniture",
  categoryTitle: "Rustic & Reclaimed Furniture",
  codes: [
    "RDS-123",
    "RDS-152",
    "RDS-150",
    "RDS-145",
    "RDS-146",
    "RDS-147",
    "RDS-148",
    "RDS-151",
    "RDS-153",
    "RDS-154",
    "RDS-149",
    "RDS-155",
    "ACShop-01",
    "ACShop-02",
    "ACShop-03",
    "ACShop-07",
    "ACSHOP-08",
    "ACSHOP-09",
    "ACSHOP-10",
    "ACShop-11",
    "ACShop-12",
    "ACShop-13",
    "ACShop-14",
    "ACShop-15",
    "ACShop-16",
    "ACShop-17",
    "ACShop-18",
    "ACShop-19",
    "ACShop-21",
    "ACShop-20",
    "ACShop-07A",
    "ACShop-06",
    "ACShop-05",
    "ACShop-04X",
    "ACShop-07B",
  ],
};

// Everything else in AW's furniture range: teak shelving, barrel tables,
// bathroom cabinets, resin coffee tables, tribal stools, plant stands.
const INTERIOR_FURNITURE_SET: ImportSet = {
  categorySlug: "interior-furniture",
  categoryTitle: "Interior Furniture",
  codes: [
    "PSS-01",
    "PSS-02",
    "PSS-03",
    "PSS-04",
    "TTS-01",
    "TTS-02",
    "TTS-03",
    "TTS-04",
    "TTS-05",
    "TTS-06",
    "RWA-01",
    "RWA-02",
    "BCab-01",
    "BCab-02",
    "BCab-03",
    "BCab-04",
    "BCab-05",
    "TDS-02",
    "TDS-03",
    "TDS-04",
    "TDS-05",
    "TDS-06",
    "TDS-07",
    "TDS-08",
    "BTS-01",
    "BTS-02",
    "BTS-03",
    "BTS-04",
    "BTS-05",
    "BTS-06",
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

  for (const code of set.codes) {
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
      : [{ ...WELLNESS_SET, codes: args.length ? args : WELLNESS_SET.codes }];

  console.log(
    `Fetching feed (${sets.reduce((n, s) => n + s.codes.length, 0)} codes requested across ${sets.length} categor${sets.length === 1 ? "y" : "ies"})…`,
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
