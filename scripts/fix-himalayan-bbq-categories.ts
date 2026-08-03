/**
 * Ensures the Himalayan Salt BBQ Cooking Plate is listed in BOTH
 * Wellness Accessories (its original category) and Outdoor Kitchens
 * (added later, per scripts/cross-list-remaining-products.ts) — not one
 * or the other. Whichever of the two is currently the product's primary
 * `category` is left as primary; the other is added to
 * `additionalCategories` if it isn't already there. Nothing else on the
 * product is touched.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/fix-himalayan-bbq-categories.ts
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

const PRODUCT_SLUG = "himalayan-salt-bbq-cooking-plate-30x20x5cm";
const WANTED_CATEGORY_SLUGS = ["outdoor-kitchens", "wellness-accessories"];

async function main() {
  const product = await client.fetch<{
    _id: string;
    title: string;
    primaryCategorySlug: string | null;
    additionalCategorySlugs: string[];
  } | null>(
    `*[_type == "product" && slug.current == $slug][0]{
      _id, title,
      "primaryCategorySlug": category->slug.current,
      "additionalCategorySlugs": additionalCategories[]->slug.current
    }`,
    { slug: PRODUCT_SLUG },
  );

  if (!product) {
    console.error(`✗ No product with slug "${PRODUCT_SLUG}" found — aborting.`);
    process.exit(1);
  }

  console.log(
    `Found "${product.title}": primary="${product.primaryCategorySlug}", additional=[${(product.additionalCategorySlugs ?? []).join(", ")}]`,
  );

  const missing = WANTED_CATEGORY_SLUGS.filter(
    (slug) =>
      slug !== product.primaryCategorySlug &&
      !(product.additionalCategorySlugs ?? []).includes(slug),
  );

  if (!missing.length) {
    console.log(
      "Already in both Outdoor Kitchens and Wellness Accessories — nothing to do.",
    );
    return;
  }

  const missingIds: string[] = [];
  for (const slug of missing) {
    const category = await client.fetch<{ _id: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{ _id }`,
      { slug },
    );
    if (!category) {
      console.warn(`⚠ No category with slug "${slug}" — skipping that one.`);
      continue;
    }
    missingIds.push(category._id);
  }

  if (!missingIds.length) {
    console.warn("Nothing resolvable to add — aborting without changes.");
    return;
  }

  const existingRefs = await client.fetch<string[] | null>(
    `*[_id == $id][0].additionalCategories[]._ref`,
    { id: product._id },
  );
  const idSet = new Set(existingRefs ?? []);
  for (const id of missingIds) idSet.add(id);

  const additionalCategories = [...idSet].map((id, index) => ({
    _type: "reference" as const,
    _key: `additional-category-${index}`,
    _ref: id,
  }));

  await client.patch(product._id).set({ additionalCategories }).commit();
  console.log(
    `✓ Added [${missing.join(", ")}] to additionalCategories — now in both Outdoor Kitchens and Wellness Accessories.`,
  );
}

main().catch((err) => {
  console.error("fix-himalayan-bbq-categories failed:", err);
  process.exit(1);
});
