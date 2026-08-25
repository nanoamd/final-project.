/**
 * Creates five categories under Decor: wall clocks, candles & lanterns, vases, wall art
 * and mirrors.
 *
 * Decor has stood at two categories since it was created — christmas-decorations and
 * christmas-trees, both empty — while Hill Interiors, a supplier account already open,
 * lists hundreds of items in exactly these ranges that nothing on the site could hold.
 * scripts/import-hill-decor.ts is what fills them; this only builds the shelves.
 *
 * No category is hidden from navigation. Categories appear in the shop drill-down the
 * moment the document exists — CATEGORIES_QUERY has no product-count filter, which is
 * why the two empty Christmas categories already show today — so creating these five is
 * enough on its own to satisfy "don't hide anything from the navigation."
 *
 * Idempotent: skips any slug that already exists, so re-running after Studio edits does
 * not clobber them.
 *
 *   pnpm tsx --env-file=.env.local scripts/create-decor-categories.ts
 *   pnpm tsx --env-file=.env.local scripts/create-decor-categories.ts --apply
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

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

const DEPARTMENT_SLUG = "decor";

interface NewCategory {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
}

/** Matches the classification in scripts/import-hill-decor.ts, so the two agree. */
export const DECOR_CATEGORIES: NewCategory[] = [
  {
    slug: "wall-clocks",
    title: "Wall Clocks",
    tagline: "Skeleton, panelled and mirrored faces",
    description:
      "Wall clocks in metal, glass and mirrored finishes, from small skeleton faces to statement pieces.",
    iconName: "home",
  },
  {
    slug: "candles-and-lanterns",
    title: "Candles & Lanterns",
    tagline: "Hurricane lanterns, candle holders and LED wax candles",
    description:
      "Lanterns and candle holders in glass, ceramic and wood, plus flameless LED wax candles for everyday use.",
    iconName: "flame",
  },
  {
    slug: "vases",
    title: "Vases",
    tagline: "Ceramic and stoneware, from posy to floor-standing",
    description:
      "Vases in ceramic, stoneware and glass, from a small posy vase to a floor-standing urn.",
    iconName: "package",
  },
  {
    slug: "wall-art",
    title: "Wall Art",
    tagline: "Hand-painted canvases and framed prints",
    description:
      "Hand-painted canvases, framed prints and decorative wall plaques for a finished room.",
    iconName: "rows3",
  },
  {
    slug: "mirrors",
    title: "Mirrors",
    tagline: "Decorative wall mirrors for every room",
    description:
      "Decorative wall mirrors in metal, glass and mirrored-tray finishes — living room and hallway pieces, distinct from the bathroom range.",
    iconName: "columns3",
  },
];

async function main() {
  const department = await client.fetch<{ _id: string } | null>(
    `*[_type == "department" && !(_id in path("drafts.**")) && slug.current == $slug][0]{ _id }`,
    { slug: DEPARTMENT_SLUG },
  );
  if (!department) {
    console.error(`No "${DEPARTMENT_SLUG}" department found — aborting.`);
    process.exit(1);
  }

  const existing = await client.fetch<string[]>(
    `*[_type == "category" && !(_id in path("drafts.**"))].slug.current`,
  );
  const existingSet = new Set(existing);

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  for (const category of DECOR_CATEGORIES) {
    if (existingSet.has(category.slug)) {
      console.log(`  = ${category.slug} already exists — skipped`);
      continue;
    }
    console.log(`  + ${category.slug}  (${category.title})`);
    if (!apply) continue;
    await client.create({
      _id: `category-${category.slug}`,
      _type: "category",
      title: category.title,
      slug: { _type: "slug", current: category.slug },
      department: { _type: "reference", _ref: department._id },
      tagline: category.tagline,
      description: category.description,
      iconName: category.iconName,
      order: 0,
    });
  }

  console.log(
    apply ? "\nDone.\n" : "\nDry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
