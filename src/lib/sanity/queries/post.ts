import { sanityFetch } from "@/lib/sanity/fetch";
import { AUTHOR_PROJECTION } from "@/lib/sanity/queries/author";
import type { SanityPost } from "@/types/sanity-content";

const POST_PROJECTION = /* groq */ `{
  "slug": slug.current,
  title,
  excerpt,
  "coverImage": coverImage.asset->url,
  body,
  "author": author-> ${AUTHOR_PROJECTION},
  publishedAt,
  tags
}`;

const POSTS_QUERY = /* groq */ `
*[_type == "post" && defined(publishedAt)]
  | order(publishedAt desc)
  [$start...$end]
  ${POST_PROJECTION}`;

const POST_BY_SLUG_QUERY = /* groq */ `
*[_type == "post" && slug.current == $slug][0] ${POST_PROJECTION}`;

export async function getPosts(
  { limit = 12, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<SanityPost[]> {
  return sanityFetch<SanityPost[]>(
    POSTS_QUERY,
    { start: offset, end: offset + limit },
    [],
  );
}

export async function getPost(slug: string): Promise<SanityPost | null> {
  return sanityFetch<SanityPost | null>(POST_BY_SLUG_QUERY, { slug }, null);
}
