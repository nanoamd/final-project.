/**
 * One-off: adds "Also shown in these categories" cross-listings to
 * EXISTING AW-imported products — WITHOUT re-importing or touching
 * anything else on them. Title, description, gallery (including any
 * colour tags you've added), specs, styleTags, price — all left exactly
 * as they are in Studio right now. This only ever patches the single
 * additionalCategories field.
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
// RUSTIC_FURNITURE_SET in scripts/import-aw-products.ts.
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

async function crossList(codes: string[], categorySlugs: string[]) {
  const categoryIds = (
    await Promise.all(categorySlugs.map(resolveExistingCategoryId))
  ).filter((id): id is string => Boolean(id));
  if (!categoryIds.length) return;

  const additionalCategories = categoryIds.map((id, index) => ({
    _type: "reference" as const,
    _key: `additional-category-${index}`,
    _ref: id,
  }));

  for (const code of codes) {
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
      `✓ ${sku}: cross-listed into ${categorySlugs.join(", ")} (${docs.length} doc${docs.length > 1 ? "s" : ""})`,
    );
  }
}

async function main() {
  await crossList(RUSTIC_CODES, ["interior-furniture"]);
  await crossList(PLANT_STAND_CODES, ["planters"]);
  console.log(
    "\nDone — only the 'Also shown in these categories' field was changed on these products; nothing else was touched.",
  );
}

main().catch((err) => {
  console.error("add-cross-category-listings failed:", err);
  process.exit(1);
});
