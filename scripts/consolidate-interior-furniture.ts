/**
 * Retires the "Interior Furniture" category entirely, folding every
 * product it holds — as either primary category or a cross-listing —
 * into "Rustic & Reclaimed Furniture" instead, then renames that
 * category to "The Reclaimed Collection" (title only; the URL slug
 * `rustic-reclaimed-furniture` is left exactly as-is, so no existing
 * product link changes).
 *
 * Steps, in order (each one is required before the next is safe):
 *   1. Every product with `category` (primary) == Interior Furniture gets
 *      its primary category switched to Rustic & Reclaimed — and, if
 *      Rustic & Reclaimed was already sitting in that product's
 *      `additionalCategories` (e.g. via the RUSTIC_FURNITURE_SET
 *      cross-listing), that now-redundant entry is removed so it isn't
 *      listed as its own cross-listing.
 *   2. Every product with Interior Furniture in `additionalCategories`
 *      (not as primary) has just that one reference removed — nothing
 *      else about the product changes.
 *   3. Only once nothing references it any more, the Interior Furniture
 *      category document is deleted (draft and published, if both
 *      exist) — Sanity itself will refuse the delete and this script
 *      will report the exact error if some reference was missed, rather
 *      than failing silently.
 *   4. Rustic & Reclaimed Furniture's title is renamed to "The Reclaimed
 *      Collection".
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/consolidate-interior-furniture.ts
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

const OLD_SLUG = "interior-furniture";
const NEW_SLUG = "rustic-reclaimed-furniture";
const NEW_TITLE = "The Reclaimed Collection";

async function main() {
  const oldCategory = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id, title }`,
    { slug: OLD_SLUG },
  );
  const newCategory = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "category" && slug.current == $slug][0]{ _id, title }`,
    { slug: NEW_SLUG },
  );

  if (!newCategory) {
    console.error(`✗ No category with slug "${NEW_SLUG}" — aborting.`);
    process.exit(1);
  }
  if (!oldCategory) {
    console.log(
      `"${OLD_SLUG}" doesn't exist — nothing to migrate. Skipping straight to the rename.`,
    );
  } else {
    console.log(
      `Migrating "${oldCategory.title}" (${OLD_SLUG}) into "${newCategory.title}" (${NEW_SLUG})…`,
    );

    // Step 1: primary-category members.
    const primaryMembers = await client.fetch<
      { _id: string; title: string; additionalCategoryRefs: string[] }[]
    >(
      `*[_type == "product" && category._ref == $oldId]{
        _id, title, "additionalCategoryRefs": additionalCategories[]._ref
      }`,
      { oldId: oldCategory._id },
    );
    for (const product of primaryMembers) {
      const remaining = (product.additionalCategoryRefs ?? []).filter(
        (id) => id !== newCategory._id && id !== oldCategory._id,
      );
      const additionalCategories = remaining.map((id, index) => ({
        _type: "reference" as const,
        _key: `additional-category-${index}`,
        _ref: id,
      }));
      await client
        .patch(product._id)
        .set({
          category: { _type: "reference", _ref: newCategory._id },
          additionalCategories,
        })
        .commit();
      console.log(
        `✓ ${product.title}: primary category → "${newCategory.title}"`,
      );
    }

    // Step 2: cross-listed (non-primary) members.
    const crossListedMembers = await client.fetch<
      { _id: string; title: string; additionalCategoryRefs: string[] }[]
    >(
      `*[_type == "product" && $oldId in additionalCategories[]._ref && category._ref != $oldId]{
        _id, title, "additionalCategoryRefs": additionalCategories[]._ref
      }`,
      { oldId: oldCategory._id },
    );
    for (const product of crossListedMembers) {
      const remaining = product.additionalCategoryRefs.filter(
        (id) => id !== oldCategory._id,
      );
      const additionalCategories = remaining.map((id, index) => ({
        _type: "reference" as const,
        _key: `additional-category-${index}`,
        _ref: id,
      }));
      await client.patch(product._id).set({ additionalCategories }).commit();
      console.log(
        `✓ ${product.title}: removed stale cross-listing to "${oldCategory.title}"`,
      );
    }

    // Step 3: delete the now-unreferenced category (draft + published).
    for (const id of [oldCategory._id, `drafts.${oldCategory._id}`]) {
      try {
        await client.delete(id);
        console.log(`✓ Deleted ${id}`);
      } catch (err) {
        console.warn(
          `⚠ Could not delete ${id} — probably didn't exist as both draft+published, or something still references it: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  // Step 4: rename.
  for (const id of [newCategory._id, `drafts.${newCategory._id}`]) {
    const exists = await client.fetch<boolean>(
      `defined(*[_id == $id][0]._id)`,
      { id },
    );
    if (!exists) continue;
    await client.patch(id).set({ title: NEW_TITLE }).commit();
    console.log(`✓ ${id}: title renamed to "${NEW_TITLE}"`);
  }

  console.log(
    `\nDone. "${NEW_SLUG}" is now titled "${NEW_TITLE}" — its URL (/shop/${NEW_SLUG}/...) is unchanged, so no product links break.`,
  );
}

main().catch((err) => {
  console.error("consolidate-interior-furniture failed:", err);
  process.exit(1);
});
