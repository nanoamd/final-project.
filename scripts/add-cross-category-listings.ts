/**
 * One-off: adds "Also shown in these categories" cross-listings to
 * EXISTING AW-imported products — WITHOUT re-importing or touching
 * anything else on them. Title, description, gallery (including any
 * colour tags you've added), specs, styleTags, price — all left exactly
 * as they are in Studio right now. This only ever patches the single
 * additionalCategories field.
 *
 * Assignments below are based on each item's real material/description
 * from the AW feed, not guesses — teak and "Beer Barrel + Parasol Stand"
 * pieces are genuinely built for outdoor use, plain wooden crates/tubs
 * suit garden storage, plant-display shelves suit Planters. TV stands,
 * bedside tables, chests of drawers, and bathroom cabinets are left
 * indoor-only — nobody buys those for a garden.
 *
 * A product can appear in more than one group below (e.g. a rustic piece
 * that's also a teak table) — this script computes each product's FULL
 * set of extra categories first, then patches once, so later groups don't
 * clobber earlier ones.
 *
 * Matches products by SKU (AW-<code>), and patches every matching
 * document — draft and published both, if both exist — so it works
 * regardless of whether you've published a given product yet.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/add-cross-category-listings.ts
 */
import { createClient } from "@sanity/client";

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

// Every Rustic & Reclaimed Furniture code — same list as
// RUSTIC_FURNITURE_SET in scripts/import-aw-products.ts. All genuine
// interior furniture too, regardless of aesthetic.
const RUSTIC_CODES = [
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
];

const PLANT_STAND_CODES = ["PSS-01", "PSS-02", "PSS-03", "PSS-04"];

// Teak / reclaimed-teak tables and display stands — teak is a classic
// weatherproof outdoor-furniture material, and these are genuine tables/
// stands, not bedroom or media furniture.
const GARDEN_FURNITURE_CODES = [
  "ACShop-01", // Centerpiece Recycled Wood Table
  "ACShop-02", // Console Table - Recycled Wood
  "ACShop-03", // Shelf Display - Recycled Wood
  "ACShop-05", // A&C 1.8m Standard Table with top shelf
  "ACShop-06", // A&C 2.2m Standard Table with top shelf
  "ACShop-07", // Recycled Teakwood Dining Table 1.8m
  "ACShop-07A", // Add-on Top Display Unit for 1.8m Table
  "ACShop-07B", // Recycled Teakwood Display/Dining Table 2.2m
  "ACSHOP-08", // Six Shelf Display with Casters
  "ACSHOP-09", // Round Folding Coffee Table
  "ACSHOP-10", // Square Folding Coffee Table
  "ACShop-11", // Small Rounded Coffee Table
  "ACShop-16", // Tall Table - Display Stand
  "ACShop-20", // Display Stand with Hooks and Storage
  "ACShop-21", // Large Coffee Table
  "TDS-02", // Natural Teak 4 Shelf Display
  "TDS-03", // Natural Teak Corner Unit 4 Shelves
  "TDS-04", // Natural Teak Corner Unit 3 Shelves
  "TDS-05", // Natural Teak Log Shelf Display
  "BTS-01", // Beer Barrel Table – Natural
  "BTS-02", // Beer Barrel Stool – Natural
  "BTS-03", // Beer Barrel Table – Whitewash
  "BTS-04", // Beer Barrel Stool – Whitewash
  "BTS-05", // Beer Barrel Table & Parasol Stand
  "BTS-06", // Beer Barrel Stool & Parasol Stand
];

// Plain wooden crates/tubs — commonly used for garden/outdoor storage
// (log stores, general garden tidying), not just indoor laundry/blankets.
const OUTDOOR_STORAGE_CODES = [
  "RDS-145", // Large Wooden Storage Tub – Brown
  "RDS-146", // Large Wooden Storage Tub – Whitewash
  "RDS-147", // Small Wooden Storage Tub – Brown
  "RDS-148", // Small Wooden Storage Tub – Whitewash
  "RDS-151", // Wooden Storage Crates – Brown
  "RDS-152", // Wooden Storage Crates – Whitewash
  "RDS-153", // Wooden Storage Crates – Bluewash
  "RDS-154", // Wooden Storage Crates – Greenwash
];

// Explicitly plant-display shelving, beyond the plant stands themselves.
const PLANTERS_EXTRA_CODES = [
  "RDS-149", // Folding Wooden A-Frame Shelf – Brown ("ideal for plants")
  "RDS-150", // Folding Wooden A-Frame Shelf – Whitewash
  "RDS-155", // Recycled Teak-wood Open Shelf Display ("plants")
];

async function resolveExistingCategoryId(slug: string): Promise<string | null> {
  const found = await client.fetch<{ _id: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id }`,
    { slug },
  );
  if (!found) {
    console.warn(`⚠ No category with slug "${slug}" — skipping.`);
  }
  return found?._id ?? null;
}

async function main() {
  const groups: { codes: string[]; categorySlugs: string[] }[] = [
    { codes: RUSTIC_CODES, categorySlugs: ["interior-furniture"] },
    { codes: PLANT_STAND_CODES, categorySlugs: ["planters"] },
    { codes: GARDEN_FURNITURE_CODES, categorySlugs: ["garden-furniture"] },
    { codes: OUTDOOR_STORAGE_CODES, categorySlugs: ["outdoor-storage"] },
    { codes: PLANTERS_EXTRA_CODES, categorySlugs: ["planters"] },
  ];

  // Resolve every distinct category slug once.
  const allSlugs = [...new Set(groups.flatMap((g) => g.categorySlugs))];
  const idBySlug = new Map<string, string | null>();
  for (const slug of allSlugs) {
    idBySlug.set(slug, await resolveExistingCategoryId(slug));
  }

  // Merge groups into one full slug-set per product code, so a code
  // appearing in multiple groups gets every category, not just the last
  // group's.
  const slugsByCode = new Map<string, Set<string>>();
  for (const group of groups) {
    for (const code of group.codes) {
      const set = slugsByCode.get(code) ?? new Set<string>();
      for (const slug of group.categorySlugs) set.add(slug);
      slugsByCode.set(code, set);
    }
  }

  for (const [code, slugs] of slugsByCode) {
    const categoryIds = [...slugs]
      .map((slug) => idBySlug.get(slug))
      .filter((id): id is string => Boolean(id));
    if (!categoryIds.length) continue;

    const additionalCategories = categoryIds.map((id, index) => ({
      _type: "reference" as const,
      _key: `additional-category-${index}`,
      _ref: id,
    }));

    const sku = `AW-${code}`;
    const docs = await client.fetch<{ _id: string }[]>(
      `*[_type == "product" && sku == $sku]{ _id }`,
      { sku },
    );
    if (!docs.length) {
      console.warn(`✗ ${sku}: no product found, skipped`);
      continue;
    }
    for (const doc of docs) {
      await client.patch(doc._id).set({ additionalCategories }).commit();
    }
    console.log(
      `✓ ${sku}: cross-listed into ${[...slugs].join(", ")} (${docs.length} doc${docs.length > 1 ? "s" : ""})`,
    );
  }

  console.log(
    "\nDone — only the 'Also shown in these categories' field was changed on these products; nothing else was touched.",
  );
}

main().catch((err) => {
  console.error("add-cross-category-listings failed:", err);
  process.exit(1);
});
