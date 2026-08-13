/**
 * Gives every stocked category somewhere to send a shopper next.
 *
 * The internal-link audit found **10 stocked categories with no inbound link from
 * any other category** — office-storage with 15 products, bedside-tables with 11,
 * lighting, outdoor-saunas. They are reachable from the navigation, so a person can
 * find them, but no page on the site points at them, so they accumulate nothing from
 * within the site and a crawler has one route in rather than several. That is the
 * likeliest reason 44 URLs sit in Search Console as "Discovered – currently not
 * indexed".
 *
 * Links run both ways here on purpose. Setting `relatedCategories` on A pointing at B
 * gives B an inbound link, and the audit counts exactly that. So the pairs below are
 * chosen to be reciprocal where it makes sense — bathroom mirrors and bedroom mirrors
 * each pointing at the other — because a one-directional link only helps one of them.
 *
 * **Every target has to be a category a shopper would actually want next**, and every
 * target has to hold products. The rendering already filters unstocked ones out, but
 * writing them would be storing a link that does nothing, and the empty categories
 * are the ones most likely to change.
 *
 *   pnpm tsx --env-file=.env.local scripts/link-related-categories.ts
 *   pnpm tsx --env-file=.env.local scripts/link-related-categories.ts --apply
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

/**
 * Where each category sends people, and why it is defensible.
 *
 * The test applied to every line: would somebody browsing the first category be
 * pleased to be shown the second? Room adjacency is the strongest signal — a person
 * buying a bedside table is furnishing a bedroom — followed by the same object in a
 * different room, then the same room in a different object.
 */
const LINKS: Record<string, string[]> = {
  // Office. Nobody furnishes one thing in a home office; they furnish the corner.
  "office-storage": ["desks", "office-shelving", "living-room-storage"],
  "office-shelving": ["office-storage", "desks", "shelving"],
  "office-lighting": ["desks", "office-storage", "lighting"],
  desks: ["office-storage", "office-shelving", "office-lighting"],

  // Bedroom. A bedside table is bought while furnishing a bedroom, not in isolation.
  "bedside-tables": ["bedroom-storage", "bedroom-lighting", "bedroom-mirrors"],
  "bedroom-storage": [
    "bedside-tables",
    "bedroom-mirrors",
    "living-room-storage",
  ],
  "bedroom-lighting": ["bedside-tables", "lighting", "bedroom-storage"],
  "bedroom-mirrors": ["bedroom-storage", "bathroom-mirrors", "bedside-tables"],

  // Bathroom. Small range, so the links have to reach outside it to be useful.
  "bathroom-mirrors": [
    "bedroom-mirrors",
    "bathroom-storage",
    "bathroom-accessories",
  ],
  "bathroom-storage": ["bathroom-mirrors", "shelving", "living-room-storage"],

  // Kitchen.
  "kitchen-storage": ["kitchen-shelving", "shelving", "living-room-storage"],
  "kitchen-shelving": ["kitchen-storage", "shelving", "office-shelving"],

  // Lighting. The generic category is the hub, so it should reach every room's.
  lighting: ["living-room-lighting", "bedroom-lighting", "office-lighting"],
  "living-room-lighting": ["lighting", "side-tables", "bedroom-lighting"],

  // Wellness. The highest-value range on the site and the most obviously connected —
  // a sauna buyer is the most likely cold-plunge buyer there is.
  "outdoor-saunas": ["indoor-saunas", "cold-plunges", "wellness-accessories"],
  "indoor-saunas": ["outdoor-saunas", "cold-plunges", "wellness-accessories"],
  "cold-plunges": ["outdoor-saunas", "indoor-saunas", "wellness-accessories"],
  "wellness-accessories": ["outdoor-saunas", "cold-plunges", "indoor-saunas"],

  // Outdoor.
  "garden-furniture": ["planters", "outdoor-storage", "outdoor-kitchens"],
  planters: ["garden-furniture", "outdoor-storage", "garden-lighting"],
  "outdoor-storage": ["garden-furniture", "planters", "kitchen-storage"],
  "outdoor-kitchens": ["garden-furniture", "outdoor-storage", "fire-pits"],

  // Living room, filling the gaps the content script did not cover.
  "tv-units": ["living-room-storage", "console-tables", "shelving"],
};

async function main() {
  const categories = await client.fetch<
    {
      id: string;
      slug: string;
      title: string;
      products: number;
      related: number;
    }[]
  >(
    `*[_type == "category" && !(_id in path("drafts.**")) && defined(slug.current)]{
      "id": _id, "slug": slug.current, title,
      "products": count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id)]),
      "related": count(relatedCategories)
    }`,
  );
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  let written = 0;
  let skipped = 0;
  for (const [slug, targets] of Object.entries(LINKS)) {
    const category = bySlug.get(slug);
    if (!category) {
      console.log(`  !  ${slug} — no such category`);
      continue;
    }
    if (category.related > 0) {
      skipped += 1;
      continue;
    }

    // Unstocked targets are dropped, not written. A stored link to an empty page is
    // a link that renders as nothing and helps nothing.
    const resolved = targets
      .map((target) => bySlug.get(target))
      .filter(
        (target): target is NonNullable<typeof target> =>
          Boolean(target) && target!.products > 0,
      );
    const dropped = targets.filter(
      (t) => !bySlug.get(t) || (bySlug.get(t)?.products ?? 0) === 0,
    );

    if (!resolved.length) {
      console.log(`  ?  ${slug} — every target is empty, nothing to link`);
      continue;
    }

    console.log(
      `  →  ${slug.padEnd(22)} → ${resolved.map((r) => r.slug).join(", ")}` +
        (dropped.length
          ? `   (dropped, unstocked: ${dropped.join(", ")})`
          : ""),
    );

    if (!apply) continue;

    await client
      .patch(category.id)
      .set({
        relatedCategories: resolved.map((target) => ({
          _type: "reference",
          _ref: target.id,
          _key: `rel-${target.slug}`,
        })),
      })
      .commit();
    written += 1;
  }

  console.log(
    `\n${skipped} already had related categories and were left alone.` +
      (apply
        ? `\nLinked ${written} categories.\n`
        : "\nDry run — nothing written.\n"),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
