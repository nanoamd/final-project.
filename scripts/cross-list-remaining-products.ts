/**
 * Second cross-listing pass — additive only, matched by SLUG rather than
 * SKU. The first pass (add-cross-category-listings.ts) matched by a
 * guessed `AW-{code}` SKU, which silently missed any product whose SKU
 * changed after a colour-variant merge (e.g. the Beer Barrel Table is now
 * `KK-IF-AW-002`, not `AW-BTS-01`/`AW-BTS-03`) — this script is keyed off
 * real live slugs instead, pulled directly from the current product feed,
 * so it can't have that same blind spot.
 *
 * Every assignment below is evidence-based from each product's own title/
 * description — coffee tables into "coffee-tables", literal shelf/display
 * units into "shelving", TV stands and a storage chest whose own copy says
 * "any room" into "living-room-storage", a BBQ cooking plate into
 * "outdoor-kitchens". The two Beer Barrel pieces go into "outdoor-storage"
 * per explicit instruction (in addition to garden-furniture, which the
 * table was supposed to get in the first pass but never did, per the SKU
 * mismatch above).
 *
 * Only ever patches `additionalCategories` — primary `category`, pricing,
 * copy, images, everything else is untouched.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/cross-list-remaining-products.ts
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

const GROUPS: { slugs: string[]; categorySlugs: string[] }[] = [
  {
    // Literal coffee tables, wherever their primary category is.
    slugs: [
      "small-reclaimed-teak-coffee-table",
      "large-reclaimed-wood-coffee-table",
      "tamarind-resin-coffee-table-aqua",
    ],
    categorySlugs: ["coffee-tables"],
  },
  {
    // Literal shelf/shelving/display units.
    slugs: [
      "reclaimed-teak-six-shelf-display-unit-castors",
      "large-reclaimed-wood-tv-stand-2-drawers", // has explicit "open shelving"
      "natural-folding-wooden-a-frame-shelf-brown",
      "natural-teak-corner-shelf-unit-4-tier-135cm",
      "natural-teak-corner-shelf-unit-3-tier-90cm",
      "natural-teak-log-shelf-display-3-tier-100cm",
    ],
    categorySlugs: ["shelving"],
  },
  {
    // TV stands and a storage chest whose own copy says "any room" —
    // general living-room storage furniture, not room-specific by design.
    slugs: [
      "4-drawer-recycled-wood-storage-chest",
      "small-recycled-teak-tv-stand-2-drawers",
      "large-reclaimed-wood-tv-stand-2-drawers",
    ],
    categorySlugs: ["living-room-storage"],
  },
  {
    // A literal BBQ cooking plate, currently only under wellness-accessories.
    slugs: ["himalayan-salt-bbq-cooking-plate-30x20x5cm"],
    categorySlugs: ["outdoor-kitchens"],
  },
  {
    // The two Beer Barrel pieces — per explicit instruction, into
    // outdoor-storage. Also re-asserts garden-furniture for the Table,
    // which never actually landed there in the first pass (its SKU
    // changed to KK-IF-AW-002 after the colour-variant merge, so the
    // original AW-BTS-01/03 SKU match silently missed it).
    slugs: [
      "beer-barrel-table-natural-wood",
      "natural-wooden-beer-barrel-storage-stool",
    ],
    categorySlugs: ["outdoor-storage", "garden-furniture"],
  },
];

async function main() {
  const allCategorySlugs = [...new Set(GROUPS.flatMap((g) => g.categorySlugs))];
  const idBySlug = new Map<string, string | null>();
  for (const slug of allCategorySlugs) {
    const found = await client.fetch<{ _id: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{ _id }`,
      { slug },
    );
    if (!found) console.warn(`⚠ No category with slug "${slug}" — skipping.`);
    idBySlug.set(slug, found?._id ?? null);
  }

  // Merge groups into one full category-slug set per product slug, so a
  // product appearing in more than one group (the barrel table, the large
  // TV stand) gets every category in one patch, not overwritten by the
  // last group to touch it.
  const categorySlugsByProductSlug = new Map<string, Set<string>>();
  for (const group of GROUPS) {
    for (const slug of group.slugs) {
      const set = categorySlugsByProductSlug.get(slug) ?? new Set<string>();
      for (const catSlug of group.categorySlugs) set.add(catSlug);
      categorySlugsByProductSlug.set(slug, set);
    }
  }

  for (const [productSlug, catSlugs] of categorySlugsByProductSlug) {
    const categoryIds = [...catSlugs]
      .map((s) => idBySlug.get(s))
      .filter((id): id is string => Boolean(id));
    if (!categoryIds.length) continue;

    const docs = await client.fetch<{ _id: string }[]>(
      `*[_type == "product" && slug.current == $productSlug]{ _id }`,
      { productSlug },
    );
    if (!docs.length) {
      console.warn(`✗ ${productSlug}: no product found, skipped`);
      continue;
    }

    // Merge with whatever additionalCategories the product already has
    // (e.g. from the first pass) rather than clobbering it — fetch the
    // current value per doc since draft/published can differ.
    for (const doc of docs) {
      const current = await client.fetch<string[] | null>(
        `*[_id == $id][0].additionalCategories[]._ref`,
        { id: doc._id },
      );
      const existingIds = new Set(current ?? []);
      for (const id of categoryIds) existingIds.add(id);

      const additionalCategories = [...existingIds].map((id, index) => ({
        _type: "reference" as const,
        _key: `additional-category-${index}`,
        _ref: id,
      }));
      await client.patch(doc._id).set({ additionalCategories }).commit();
    }
    console.log(
      `✓ ${productSlug}: cross-listed into ${[...catSlugs].join(", ")} (${docs.length} doc${docs.length > 1 ? "s" : ""})`,
    );
  }

  console.log(
    "\nDone — only 'Also shown in these categories' was changed on these products; nothing else was touched.",
  );
}

main().catch((err) => {
  console.error("cross-list-remaining-products failed:", err);
  process.exit(1);
});
