/**
 * "Garden Furniture" was cross-listing every reclaimed-teak dining table,
 * console table, coffee table, display stand etc. from the rustic
 * furniture range (scripts/add-cross-category-listings.ts's
 * GARDEN_FURNITURE_CODES) on the reasoning that teak is a weatherproof
 * material — but these are genuinely indoor pieces (dining tables,
 * console tables, sideboards), not outdoor furniture. Only the two Beer
 * Barrel pieces actually belong here.
 *
 * This finds every product currently cross-listed into Garden Furniture
 * via `additionalCategories`, and removes that one reference from every
 * one of them EXCEPT the two Beer Barrel products — leaving each
 * product's primary category and every other cross-listing untouched.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/clean-garden-furniture-category.ts
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

const CATEGORY_SLUG = "garden-furniture";
const KEEP_SLUGS = new Set([
  "beer-barrel-table-natural-wood",
  "natural-wooden-beer-barrel-storage-stool",
]);

async function main() {
  const category = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id, title }`,
    { slug: CATEGORY_SLUG },
  );
  if (!category) {
    console.error(`✗ No category with slug "${CATEGORY_SLUG}" — aborting.`);
    process.exit(1);
  }
  console.log(`Found category "${category.title}" (${CATEGORY_SLUG})`);

  const products = await client.fetch<
    {
      _id: string;
      title: string;
      slug: string;
      additionalCategoryRefs: string[];
    }[]
  >(
    `*[_type == "product" && $categoryId in additionalCategories[]._ref]{
      _id, title, "slug": slug.current,
      "additionalCategoryRefs": additionalCategories[]._ref
    }`,
    { categoryId: category._id },
  );

  console.log(
    `${products.length} product(s) currently cross-listed into Garden Furniture.`,
  );

  let removed = 0;
  let kept = 0;
  for (const product of products) {
    if (KEEP_SLUGS.has(product.slug)) {
      console.log(`- ${product.title}: kept (Beer Barrel product)`);
      kept++;
      continue;
    }

    const remainingIds = product.additionalCategoryRefs.filter(
      (id) => id !== category._id,
    );
    const additionalCategories = remainingIds.map((id, index) => ({
      _type: "reference" as const,
      _key: `additional-category-${index}`,
      _ref: id,
    }));
    await client.patch(product._id).set({ additionalCategories }).commit();
    console.log(`✓ ${product.title}: removed from Garden Furniture`);
    removed++;
  }

  console.log(
    `\nDone. Removed ${removed}, kept ${kept} (the Beer Barrel products). Nothing else on any of these products was touched.`,
  );
}

main().catch((err) => {
  console.error("clean-garden-furniture-category failed:", err);
  process.exit(1);
});
