import { sanityFetch } from "@/lib/sanity/fetch";
import type { SanityDepartment } from "@/types/sanity-content";

const DEPARTMENTS_QUERY = /* groq */ `
*[_type == "department"] | order(order asc) {
  "slug": slug.current,
  "name": title,
  description,
  "image": heroImage.asset->url,
  // A real photograph for a room with no hero of its own.
  //
  // 10 of the 11 departments have no heroImage, so every room page fell back
  // to the same /images/garden-after.jpg — one garden photo standing in for
  // Bedroom, Kitchen, Lighting and Sauna alike. This is the first photo of
  // the first photographed product in the room, which is at least a picture
  // of what the page is about.
  //
  // Separate from image rather than coalesced, so an editor setting a real
  // hero always wins and an audit can still count the stand-ins.
  "fallbackImage": *[_type == "product" && count(gallery) > 0
    && category->department._ref == ^._id]
    | order(price desc)[0].gallery[0].asset->url,
  "fallbackImageAlt": *[_type == "product" && count(gallery) > 0
    && category->department._ref == ^._id]
    | order(price desc)[0].gallery[0].alt,
  order,
  // Defaults to true so a room saved before this field existed keeps its slot.
  "showInMainNav": coalesce(showInMainNav, true)
}`;

export async function getDepartments(): Promise<SanityDepartment[]> {
  return sanityFetch<SanityDepartment[]>(DEPARTMENTS_QUERY, {}, []);
}

const ROOM_OVERVIEW_QUERY = /* groq */ `{
  "priceLow": math::min(*[_type == "product" && defined(price)
    && category->department->slug.current == $roomSlug].price),
  "priceHigh": math::max(*[_type == "product" && defined(price)
    && category->department->slug.current == $roomSlug].price),
  "guides": *[_type == "buyingGuide" && defined(publishedAt)
    && relatedCategory->department->slug.current == $roomSlug]
    | order(publishedAt desc)[0...3]{
      "slug": slug.current,
      title,
      excerpt
    }
}`;

/**
 * The facts a room page can state about itself.
 *
 * A department has no body field in Sanity — only a title, a two-row
 * description, a hero and an order — so a room page could carry **35 words of
 * prose** against 366 on a category page, measured in the browser. Eleven
 * indexable, self-canonical pages on terms as commercial as "Bedroom" and
 * "Lighting", each saying almost nothing.
 *
 * Rather than wait for eleven pieces of copy to be written, the page states
 * what is true of its own contents: how many pieces, across how many
 * categories, at what prices, and what Kaiku has written about them. Computed,
 * so it cannot go stale and cannot be filler.
 *
 * One query for both, because a room page already makes four and the price
 * range and the guides are both one-line aggregates.
 */
export async function getRoomOverview(roomSlug: string): Promise<{
  priceLow: number | null;
  priceHigh: number | null;
  guides: { slug: string; title: string; excerpt?: string }[];
}> {
  const empty = { priceLow: null, priceHigh: null, guides: [] };
  if (!roomSlug) return empty;
  return sanityFetch(ROOM_OVERVIEW_QUERY, { roomSlug }, empty);
}
