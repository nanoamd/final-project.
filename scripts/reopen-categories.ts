/**
 * "Reopen" every category — clears the `comingSoon` editorial override
 * (schema: src/sanity/schemaTypes/documents/category.ts) wherever it's
 * currently set to true. Doesn't touch anything else on the category, and
 * never deletes a category document.
 *
 * Note for whoever runs this: a category page's "X — coming soon" empty
 * state (src/features/storefront/components/category/collection-index.tsx,
 * `EmptyCollection`) is actually driven by having ZERO products assigned to
 * it, not by this `comingSoon` field — that field is captured in the
 * schema/query but isn't currently read anywhere in the storefront. So if a
 * category still shows "coming soon" after running this, it genuinely has
 * no products assigned to it yet; this script can't fix that part.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/reopen-categories.ts
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

async function main() {
  const categories = await client.fetch<
    { _id: string; title: string; comingSoon?: boolean }[]
  >(`*[_type == "category" && comingSoon == true]{ _id, title, comingSoon }`);

  if (!categories.length) {
    console.log("No categories currently have comingSoon set — nothing to do.");
    return;
  }

  for (const category of categories) {
    await client.patch(category._id).set({ comingSoon: false }).commit();
    console.log(`✓ Reopened "${category.title}"`);
  }

  console.log(
    `\nDone — reopened ${categories.length} categor${categories.length === 1 ? "y" : "ies"}.`,
  );
}

main().catch((err) => {
  console.error("reopen-categories failed:", err);
  process.exit(1);
});
