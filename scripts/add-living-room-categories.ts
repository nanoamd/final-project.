/**
 * Creates the three Living Room categories the D.I. Designs import needs.
 *
 * 28 of the 74 saved pages matched no category and were skipped, in three clean
 * groups:
 *
 *   Console Tables  13 — Abberley, Alton x2, Bentley Oak, Berkeley x2,
 *                        Elmley x2, Five, Grafton, Hampton x2
 *   Side Tables     11 — end tables (Abberley x3, Elmley, Grafton, Norton,
 *                        Neathan), occasion tables (Leckford x2) and nest of
 *                        tables (Hampton x2)
 *   TV Units         4 — Abberley Black, Hampton Black, Hampton Brown,
 *                        Hampton Ivory
 *
 * Side Tables deliberately covers end, occasion and nest tables together. They
 * are one shopping intent, and splitting them would leave three categories of
 * nine, two and two.
 *
 * Orders 6, 7 and 8 — appended rather than slotted in. Putting Side Tables next
 * to Coffee Tables would read better, but that means renumbering categories that
 * were arranged by hand, and the order is a drag-and-drop away in Studio.
 *
 * No hero images, for the same reason as Sofas: the only pictures available are
 * of the products themselves, and category heroes are uploaded by hand.
 *
 * Idempotent: an existing category is reported and left alone.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/add-living-room-categories.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const DEPARTMENT = "department-living-room";

interface NewCategory {
  slug: string;
  title: string;
  iconName: string;
  order: number;
  tagline: string;
  description: string;
}

const CATEGORIES: NewCategory[] = [
  {
    slug: "console-tables",
    title: "Console Tables",
    iconName: "columns3",
    order: 6,
    tagline: "Narrow tables for halls and behind sofas",
    description:
      "Console tables in oak, glass and painted finishes — narrow enough for a hallway, deep enough to be useful. Every listing carries the real dimensions, so you can check the depth against your space before you order.",
  },
  {
    slug: "side-tables",
    title: "Side Tables",
    iconName: "leaf",
    order: 7,
    tagline: "End tables, occasion tables and nests",
    description:
      "End tables, occasion tables and nests of tables for beside a chair or sofa. Real dimensions and real lead times on every one, so you know both that it fits and when it arrives.",
  },
  {
    slug: "tv-units",
    title: "TV Units",
    iconName: "rows3",
    order: 8,
    tagline: "Media storage that suits the room",
    description:
      "TV units and media consoles with drawers and open shelving. Dimensions are listed in full, including the top surface, so you can check your screen's stand actually fits.",
  },
];

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
  // Fail before writing anything rather than leaving orphan categories that
  // render detached from the nav with an empty breadcrumb.
  const department = await client.fetch<{ title: string } | null>(
    `*[_id == $id][0]{title}`,
    { id: DEPARTMENT },
  );
  if (!department) {
    console.error(`Department "${DEPARTMENT}" does not exist — aborting.`);
    process.exit(1);
  }

  let created = 0;
  for (const category of CATEGORIES) {
    const existing = await client.fetch<{ _id: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{_id}`,
      { slug: category.slug },
    );
    if (existing) {
      console.log(
        `· ${category.title.padEnd(16)} already exists (${existing._id})`,
      );
      continue;
    }
    if (apply) {
      await client.createIfNotExists({
        _id: `category-${category.slug}`,
        _type: "category",
        title: category.title,
        slug: { _type: "slug", current: category.slug },
        department: { _type: "reference", _ref: DEPARTMENT },
        iconName: category.iconName,
        order: category.order,
        comingSoon: false,
        tagline: category.tagline,
        description: category.description,
      });
    }
    console.log(
      `${apply ? "✓" : "·"} ${category.title.padEnd(16)} /shop/${category.slug}` +
        `   icon ${category.iconName}, order ${category.order}`,
    );
    created++;
  }

  console.log(
    `\n${created} category(ies) ${apply ? "created" : "to create"} under ${department.title}.` +
      (apply
        ? "\nNone has a hero image — add one in Studio.\n"
        : "\nDry run — nothing written. Re-run with --apply.\n"),
  );
}

main().catch((err) => {
  console.error("add-living-room-categories failed:", err);
  process.exit(1);
});
