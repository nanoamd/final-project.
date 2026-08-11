/**
 * Puts Wellness Accessories in two rooms, and keeps it out of both room grids.
 *
 * The requirement: tapping Sauna shows saunas and nothing else, while Wellness
 * Accessories stays one tap away from Sauna *and* from Outdoor Living, as its own
 * selectable category.
 *
 * Three things make that true, and the first two are schema, already in place:
 *
 *   - `additionalDepartments` on the category, so it is shoppable from more than
 *     one room. `department` is a single reference and could only ever be Sauna.
 *   - `excludeFromRoomGrid`, so its products stay out of the combined grids while
 *     the category itself stays in the navigation.
 *   - This script, which sets both on the live document.
 *
 * Sauna currently shows 11 products: seven saunas and four bottles of essential
 * oil, the oils sitting beside a £5,279 cabin. After this it shows the seven.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/set-category-rooms.ts
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

/** Category slug → the extra rooms it should be shoppable from, and whether its
 *  products belong in a room's combined grid. */
const PLACEMENTS: {
  category: string;
  alsoInRooms: string[];
  excludeFromRoomGrid: boolean;
  why: string;
}[] = [
  {
    category: "wellness-accessories",
    alsoInRooms: ["outdoor-living"],
    excludeFromRoomGrid: true,
    why: "oils and buckets belong to the sauna world and the garden, but should not fill either room's grid",
  },
  {
    category: "cold-plunges",
    alsoInRooms: ["outdoor-living"],
    excludeFromRoomGrid: false,
    why: "one product does not earn a top-level nav slot; it belongs in the garden",
  },
  {
    category: "outdoor-kitchens",
    alsoInRooms: ["outdoor-living"],
    excludeFromRoomGrid: false,
    why: "two products; same reasoning as cold plunges",
  },
];

/**
 * Rooms that keep their page and URL but give up their top-level nav slot.
 *
 * Not a deletion. /shop/room/cold-plunge still renders, still has its categories,
 * and is now reachable from Outdoor Living — which is where a shopper looking for a
 * plunge pool would look anyway. The slot is what is being reclaimed: Cold Plunge
 * and Outdoor Kitchen cost the same header space as Living Room's fifty-eight
 * products and lead somewhere near-empty.
 */
const HIDE_FROM_NAV = ["cold-plunge", "outdoor-kitchen"];

async function main() {
  for (const placement of PLACEMENTS) {
    const category = await client.fetch<{
      _id: string;
      title: string;
      department: string | null;
      additional: string[] | null;
      excluded: boolean | null;
    } | null>(
      `*[_type == "category" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
        _id, title,
        "department": department->slug.current,
        "additional": additionalDepartments[]->slug.current,
        "excluded": excludeFromRoomGrid
      }`,
      { slug: placement.category },
    );

    if (!category) {
      console.log(`✗ no published category "${placement.category}"`);
      continue;
    }

    // Resolve room slugs to ids, and never add the primary room a second time.
    const wanted = placement.alsoInRooms.filter(
      (slug) => slug !== category.department,
    );
    const rooms = await client.fetch<{ _id: string; slug: string }[]>(
      `*[_type == "department" && slug.current in $slugs && !(_id in path("drafts.**"))]{_id, "slug": slug.current}`,
      { slugs: wanted },
    );

    const missing = wanted.filter((s) => !rooms.some((r) => r.slug === s));
    if (missing.length) {
      console.log(
        `✗ ${category.title} — no such room(s): ${missing.join(", ")}. Nothing written for this category.`,
      );
      continue;
    }

    console.log(`${apply ? "✓" : "·"} ${category.title}`);
    console.log(`    primary room        ${category.department ?? "—"}`);
    console.log(
      `    also shown in       ${(category.additional ?? []).join(", ") || "—"} → ${rooms.map((r) => r.slug).join(", ") || "—"}`,
    );
    console.log(
      `    out of room grids   ${category.excluded ?? false} → ${placement.excludeFromRoomGrid}`,
    );
    console.log(`    ${placement.why}`);

    if (apply)
      await client
        .patch(category._id)
        .set({
          additionalDepartments: rooms.map((room) => ({
            _key: room.slug,
            _type: "reference",
            _ref: room._id,
          })),
          excludeFromRoomGrid: placement.excludeFromRoomGrid,
        })
        .commit();
  }

  for (const slug of HIDE_FROM_NAV) {
    const room = await client.fetch<{ _id: string; title: string } | null>(
      `*[_type == "department" && slug.current == $slug && !(_id in path("drafts.**"))][0]{_id, title}`,
      { slug },
    );
    if (!room) {
      console.log(`✗ no published room "${slug}"`);
      continue;
    }
    console.log(
      `${apply ? "✓" : "·"} ${room.title} — out of the main nav, page and URL kept`,
    );
    if (apply)
      await client.patch(room._id).set({ showInMainNav: false }).commit();
  }

  console.log(
    apply
      ? "\nDone. Sauna shows saunas; Wellness Accessories is selectable from Sauna and\nOutdoor Living without filling either grid; Cold Plunge and Outdoor Kitchen sit\nunder Outdoor Living instead of holding their own nav slots.\n"
      : "\nDry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((err) => {
  console.error("set-category-rooms failed:", err);
  process.exit(1);
});
