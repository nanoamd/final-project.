import { sanityFetch } from "@/lib/sanity/fetch";
import type { SanityCollection } from "@/types/sanity-content";

const COLLECTION_PROJECTION = /* groq */ `{
  "slug": slug.current,
  title,
  description,
  "image": heroImage.asset->url,
  "productSlugs": products[]->slug.current
}`;

const COLLECTIONS_QUERY = /* groq */ `*[_type == "collection"] ${COLLECTION_PROJECTION}`;

const COLLECTION_BY_SLUG_QUERY = /* groq */ `
*[_type == "collection" && slug.current == $slug][0] ${COLLECTION_PROJECTION}`;

export async function getCollections(): Promise<SanityCollection[]> {
  return sanityFetch<SanityCollection[]>(COLLECTIONS_QUERY, {}, []);
}

export async function getCollection(slug: string): Promise<SanityCollection | null> {
  return sanityFetch<SanityCollection | null>(
    COLLECTION_BY_SLUG_QUERY,
    { slug },
    null,
  );
}
