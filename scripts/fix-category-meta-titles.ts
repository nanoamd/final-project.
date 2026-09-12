/**
 * Category page titles, written rather than generated.
 *
 * 24 of 49 categories carry an effective `<title>` under 30 characters —
 * "Vases | Decor | Kaiku", "Desks | Office | Kaiku" — on the pages most likely
 * to be a shopper's entry point. Google renders about 60, so those are using
 * under half the strongest ranking surface on the page.
 *
 * One of them is a straight bug: the Lighting category sits in the Lighting
 * department, and the generated title doubled it to **"Lighting Lighting |
 * Kaiku"**. That is the largest category on the site at 138 products.
 *
 * These are hand-written, not derived, because a category title is a
 * positioning decision — which of the many true things about a range to put in
 * front of a shopper. Every qualifier below is checked against what the
 * category actually contains: the materials come from its products'
 * `materialTags` and the types from its products' titles, so "Reclaimed Teak"
 * appears only where there is reclaimed teak in it.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-category-meta-titles.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-category-meta-titles.ts --apply
 */
import { createClient } from "@sanity/client";

import { META_TITLE_MAX } from "@/lib/catalog/meta-title";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
  perspective: "raw",
});

/** Category slug → the title that should render. Suffix included deliberately. */
const TITLES: Record<string, string> = {
  // 138 products, and the one that was rendering "Lighting Lighting".
  lighting: "Lighting | Ceiling, Floor & Table Lights | Kaiku",
  mirrors: "Mirrors | Wall, Full-Length & Arched | Kaiku",
  "living-room-storage": "Living Room Storage | Sideboards & Cabinets | Kaiku",
  sofas: "Sofas | 2 & 3 Seater, Corner & Chenille | Kaiku",
  vases: "Vases | Ceramic & Glass, Tall & Table | Kaiku",
  beds: "Beds | Ottoman, Storage & Upholstered Frames | Kaiku",
  "living-room-lighting": "Living Room Lighting | Floor & Table Lamps | Kaiku",
  shelving: "Shelving | Reclaimed Teak & Open Shelf Units | Kaiku",
  desks: "Desks | Oak, Walnut & Home Office Desks | Kaiku",
  "office-storage": "Office Storage | Cabinets, Drawers & Shelves | Kaiku",
  "kitchen-storage": "Kitchen Storage | Reclaimed Wood Cabinets | Kaiku",
  "wall-art": "Wall Art | Framed Prints & Canvases | Kaiku",
  "bathroom-storage": "Bathroom Storage | Cabinets & Shelf Units | Kaiku",
  "bedroom-lighting": "Bedroom Lighting | Bedside & Table Lamps | Kaiku",
  "bedroom-storage": "Bedroom Storage | Chests, Drawers & Wardrobes | Kaiku",
  "bedroom-mirrors": "Bedroom Mirrors | Full-Length & Dressing | Kaiku",
  "bathroom-mirrors": "Bathroom Mirrors | Round, Arched & Framed | Kaiku",
  "kitchen-shelving": "Kitchen Shelving | Reclaimed Teak Units | Kaiku",
  "office-shelving": "Office Shelving | Bookcases & Shelf Units | Kaiku",
  "office-lighting": "Office Lighting | Desk & Task Lamps | Kaiku",
  "outdoor-kitchens": "Outdoor Kitchens | Garden Cooking & Prep | Kaiku",
  "indoor-saunas": "Indoor Saunas | Hemlock Cabins for the Home | Kaiku",
  "cold-plunges": "Cold Plunges | Stainless Steel Ice Baths | Kaiku",
  // Currently empty, and therefore excluded from the sitemap, but still
  // navigable — so it still needs a title rather than a placeholder.
  rugs: "Rugs | Living Room Rugs & Runners | Kaiku",
};

async function main() {
  // Fail before touching anything if a title breaks its own rules.
  const invalid = Object.entries(TITLES).filter(
    ([, title]) => title.length > META_TITLE_MAX || !title.endsWith(" | Kaiku"),
  );
  if (invalid.length) {
    console.error("These titles break the length or brand rule:");
    for (const [slug, title] of invalid) {
      console.error(`  [${title.length}] ${slug}: ${title}`);
    }
    process.exit(1);
  }

  /**
   * Drafts are included deliberately. Five categories have an unpublished
   * draft sitting alongside the published document, and patching only the
   * published one would mean this title silently reverts the moment somebody
   * hits publish. Setting a field the draft does not otherwise use is additive
   * and cannot disturb whatever edit is in progress there.
   */
  const rows = await client.fetch<
    {
      _id: string;
      slug: string;
      title: string;
      metaTitle: string | null;
      draft: boolean;
    }[]
  >(
    `*[_type=="category" && slug.current in $slugs]{
      _id, "slug": slug.current, title, "metaTitle": seo.metaTitle,
      "draft": _id in path("drafts.**") }`,
    { slugs: Object.keys(TITLES) },
  );

  const missing = Object.keys(TITLES).filter(
    (slug) => !rows.some((row) => row.slug === slug && !row.draft),
  );
  if (missing.length) {
    console.error(`No published category for: ${missing.join(", ")}`);
    process.exit(1);
  }

  const drafts = rows.filter((row) => row.draft);
  console.log(
    `\n${rows.length} documents — ${rows.length - drafts.length} published, ` +
      `${drafts.length} draft${drafts.length === 1 ? "" : "s"} patched too so the title survives publishing.\n`,
  );
  for (const row of rows.filter((r) => !r.draft)) {
    const next = TITLES[row.slug]!;
    const before = row.metaTitle?.trim() || row.title;
    console.log(`  [${String(before.length).padStart(2)}] ${before}`);
    console.log(`  [${String(next.length).padStart(2)}] ${next}\n`);
  }

  if (!apply) {
    console.log("Dry run — re-run with --apply.");
    return;
  }

  for (const row of rows) {
    await client
      .patch(row._id)
      .set({ "seo.metaTitle": TITLES[row.slug]! })
      .commit();
  }
  console.log(`Applied ${rows.length} category titles.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
