import { cache } from "react";

import { sanityFetch } from "@/lib/sanity/fetch";
import { AUTHOR_PROJECTION } from "@/lib/sanity/queries/author";
import { ARTICLE_PRODUCT_PROJECTION } from "@/lib/sanity/queries/fragments";
import type { SanityPost } from "@/types/sanity-content";

const POST_PROJECTION = /* groq */ `{
  "slug": slug.current,
  title,
  excerpt,
  "coverImage": coverImage.asset->url,
  body,
  "author": author-> ${AUTHOR_PROJECTION},
  publishedAt,
  tags,
  "relatedProducts": relatedProducts[]-> ${ARTICLE_PRODUCT_PROJECTION}
}`;

const POSTS_QUERY = /* groq */ `
*[_type == "post" && defined(publishedAt)]
  | order(publishedAt desc)
  [$start...$end]
  ${POST_PROJECTION}`;

const POST_BY_SLUG_QUERY = /* groq */ `
*[_type == "post" && slug.current == $slug][0] ${POST_PROJECTION}`;

export async function getPosts({
  limit = 12,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<SanityPost[]> {
  return sanityFetch<SanityPost[]>(
    POSTS_QUERY,
    { start: offset, end: offset + limit },
    [],
  );
}

// Cached per-request (React's `cache()`, not a time-based cache) — the
// article page calls this once in generateMetadata and again in the page
// body; without this every article view fired the same Sanity query twice.
export const getPost = cache(async function getPost(
  slug: string,
): Promise<SanityPost | null> {
  return sanityFetch<SanityPost | null>(POST_BY_SLUG_QUERY, { slug }, null);
});
