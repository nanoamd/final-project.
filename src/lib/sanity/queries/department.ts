import { sanityFetch } from "@/lib/sanity/fetch";
import type { SanityDepartment } from "@/types/sanity-content";

const DEPARTMENTS_QUERY = /* groq */ `
*[_type == "department"] | order(order asc) {
  "slug": slug.current,
  "name": title,
  description,
  "image": heroImage.asset->url,
  order
}`;

export async function getDepartments(): Promise<SanityDepartment[]> {
  return sanityFetch<SanityDepartment[]>(DEPARTMENTS_QUERY, {}, []);
}
