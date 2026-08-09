/**
 * Creates the Sofas category, under Living Room.
 *
 * Needed before the D.I. Designs import: sofas are among the ~50 saved pages and
 * there was nowhere for them to go. Worse than nowhere, in fact — the only
 * sofa-shaped rule in import-supplier-products.ts is
 * `/(rattan|garden|patio|outdoor).*(sofa|chair|…)/`, so an indoor sofa either
 * landed in garden-furniture on an incidental word or matched nothing and was
 * skipped.
 *
 * Placed at `order: 1`, which is the gap in Living Room's sequence —
 * coffee-tables is 0 and the rest run 2 to 5, so sofas slots in second without
 * renumbering anything. `iconName: "sofa"` already exists in the category
 * schema's icon list.
 *
 * No `heroImage`. Every other Living Room category has one and this will look
 * unfinished beside them, but a hero picked from the product gallery would be a
 * coffee table standing in for a sofa. Category heroes are desktop-only and
 * uploaded by hand — this one is yours to add.
 *
 * `comingSoon` is left false, matching the 19 other categories that currently
 * have no products. Nothing is hidden from the nav.
 *
 * Idempotent: re-running reports the existing category and writes nothing.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/add-sofas-category.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const CATEGORY = {
  _id: "category-sofas",
  _type: "category",
  title: "Sofas",
  slug: { _type: "slug", current: "sofas" },
  department: { _type: "reference", _ref: "department-living-room" },
  iconName: "sofa",
  order: 1,
  comingSoon: false,
  tagline: "Seating built to be lived on",
  description:
    "Sofas, armchairs and occasional seating for the living room. Every listing carries the real dimensions and the real lead time, so you can check it fits and know when it arrives before you order.",
} as const;

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

async function main() {
  const existing = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "category" && (_id == $id || slug.current == "sofas")][0]{_id, title}`,
    { id: CATEGORY._id },
  );
  if (existing) {
    console.log(
      `\nAlready exists: ${existing._id} (${existing.title}) — nothing to do.\n`,
    );
    return;
  }

  // The department has to be real, or the category renders detached from the nav
  // and the breadcrumb has nothing to show.
  const department = await client.fetch<{ title: string } | null>(
    `*[_id == $id][0]{title}`,
    { id: CATEGORY.department._ref },
  );
  if (!department) {
    console.error(
      `Department "${CATEGORY.department._ref}" does not exist — aborting rather than creating an orphan category.`,
    );
    process.exit(1);
  }

  const clash = await client.fetch<{
    _id: string;
    order: number | null;
  } | null>(
    `*[_type == "category" && department._ref == $dept && order == $order][0]{_id, order}`,
    { dept: CATEGORY.department._ref, order: CATEGORY.order },
  );

  console.log(`\nWould create:\n`);
  console.log(`  ${CATEGORY.title}  /shop/${CATEGORY.slug.current}`);
  console.log(`  department: ${department.title}`);
  console.log(`  icon: ${CATEGORY.iconName}   order: ${CATEGORY.order}`);
  console.log(`  tagline: ${CATEGORY.tagline}`);
  console.log(`  heroImage: none — upload one in Studio\n`);
  if (clash)
    console.warn(
      `  ⚠ ${clash._id} already uses order ${CATEGORY.order} in this department;\n` +
        `    both will appear, in an arbitrary order between themselves.\n`,
    );

  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }

  await client.createIfNotExists(CATEGORY);
  console.log(
    `Created ${CATEGORY._id}.\n\n` +
      "It has no products yet, so the category page shows its empty state until\n" +
      "the sofas are imported and published. Add a hero image in Studio.\n",
  );
}

main().catch((err) => {
  console.error("add-sofas-category failed:", err);
  process.exit(1);
});
