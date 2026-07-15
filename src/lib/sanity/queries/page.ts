import { sanityFetch } from "@/lib/sanity/fetch";
import type { SanityPage } from "@/types/sanity-content";

const PAGE_BY_SLUG_QUERY = /* groq */ `
*[_type == "page" && slug.current == $slug][0] {
  "slug": slug.current,
  title,
  intro,
  body
}`;

export async function getPageBySlug(slug: string): Promise<SanityPage | null> {
  return sanityFetch<SanityPage | null>(PAGE_BY_SLUG_QUERY, { slug }, null);
}
