import { sanityFetch } from "@/lib/sanity/fetch";
import { AUTHOR_PROJECTION } from "@/lib/sanity/queries/author";
import type { SanityBuyingGuide } from "@/types/sanity-content";

const BUYING_GUIDE_PROJECTION = /* groq */ `{
  "slug": slug.current,
  title,
  excerpt,
  "coverImage": coverImage.asset->url,
  body,
  "author": author-> ${AUTHOR_PROJECTION},
  publishedAt,
  "relatedCategory": relatedCategory->{"slug": slug.current, "name": title},
  "relatedProducts": relatedProducts[]->{"slug": slug.current}
}`;

const BUYING_GUIDES_QUERY = /* groq */ `
*[_type == "buyingGuide" && defined(publishedAt)]
  | order(publishedAt desc)
  [$start...$end]
  ${BUYING_GUIDE_PROJECTION}`;

const BUYING_GUIDE_BY_SLUG_QUERY = /* groq */ `
*[_type == "buyingGuide" && slug.current == $slug][0] ${BUYING_GUIDE_PROJECTION}`;

export async function getBuyingGuides({
  limit = 12,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<SanityBuyingGuide[]> {
  return sanityFetch<SanityBuyingGuide[]>(
    BUYING_GUIDES_QUERY,
    { start: offset, end: offset + limit },
    [],
  );
}

export async function getBuyingGuide(
  slug: string,
): Promise<SanityBuyingGuide | null> {
  return sanityFetch<SanityBuyingGuide | null>(
    BUYING_GUIDE_BY_SLUG_QUERY,
    { slug },
    null,
  );
}
