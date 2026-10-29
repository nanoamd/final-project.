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
