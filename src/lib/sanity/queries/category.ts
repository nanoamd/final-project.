import { sanityFetch } from "@/lib/sanity/fetch";
import type { SanityCategory } from "@/types/sanity-content";

const CATEGORY_PROJECTION = /* groq */ `{
  "slug": slug.current,
  "name": title,
  tagline,
  description,
  "departmentSlug": department->slug.current,
  "departmentName": department->title,
  iconName,
  comingSoon,
  "productCount": count(*[_type == "product" && references(^._id)]),
  "image": heroImage.asset->url
}`;

const CATEGORIES_QUERY = /* groq */ `
*[_type == "category"] | order(order asc) ${CATEGORY_PROJECTION}`;

const CATEGORY_BY_SLUG_QUERY = /* groq */ `
*[_type == "category" && slug.current == $slug][0] ${CATEGORY_PROJECTION}`;

export async function getCategories(): Promise<SanityCategory[]> {
  return sanityFetch<SanityCategory[]>(CATEGORIES_QUERY, {}, []);
}

export async function getCategory(slug: string): Promise<SanityCategory | null> {
  return sanityFetch<SanityCategory | null>(
    CATEGORY_BY_SLUG_QUERY,
    { slug },
    null,
  );
}
