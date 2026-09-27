import { sanityFetch } from "@/lib/sanity/fetch";

/**
 * Every room Kaiku stocks, with how many pieces are in it.
 *
 * ## Why the counts are fetched rather than written down
 *
 * The homepage needs to say "this is a whole-home shop" in the first screen,
 * and the most convincing way to say it is with the real numbers. A hardcoded
 * list would drift the first time a category was stocked, and a drifted count
 * on the homepage is precisely the kind of small wrongness that makes a shop
 * feel unreal.
 *
 * The count walks `category->department`, **not** `references(^._id)`. A
 * product references its category and the category references the department,
 * so `references()` from a department matches nothing — checked against the
 * live dataset, where it returned 0 for all eleven rooms. Verifying a query
 * against real data before wiring it up is the only way that class of silent
 * zero gets caught.
 *
 * Departments with no products are excluded. Cold Plunge has one product and
 * Outdoor Kitchen four; a room tile reading "1 piece" undersells the shop more
 * than leaving the room out does, so the caller applies its own floor.
 */

export interface RoomBreadth {
  title: string;
  slug: string;
  /** Published products across every category in this department. */
  count: number;
}

const ROOMS_QUERY = /* groq */ `
*[_type == "department" && defined(slug.current)] {
  title,
  "slug": slug.current,
  "count": count(*[
    _type == "product"
    && !(_id in path("drafts.**"))
    && category->department._ref == ^._id
  ])
} | order(count desc)`;

export async function getRoomBreadth(): Promise<RoomBreadth[]> {
  return sanityFetch<RoomBreadth[]>(ROOMS_QUERY, {}, []);
}
