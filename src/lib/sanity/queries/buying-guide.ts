import { cache } from "react";

import { sanityFetch } from "@/lib/sanity/fetch";
import { AUTHOR_PROJECTION } from "@/lib/sanity/queries/author";
import {
  ARTICLE_PRODUCT_PROJECTION,
  RICH_TEXT_PROJECTION,
  SEO_PROJECTION,
} from "@/lib/sanity/queries/fragments";
import type { SanityBuyingGuide } from "@/types/sanity-content";

const BUYING_GUIDE_PROJECTION = /* groq */ `{
  "slug": slug.current,
  title,
  excerpt,
  "coverImage": coverImage.asset->url,
  // A real photograph for an article that has no cover of its own.
  //
  // Every one of the 43 buying guides and all 3 journal posts has an empty
  // coverImage, so /learn was a 43-card grid of empty bordered boxes and every
  // article opened with no hero. This is the first photo of the first product
  // the article is actually about: real product photography rather than a
  // generated image on a retail site, and all 46 articles carry
  // relatedProducts so it covers every one.
  //
  // Kept separate from coverImage rather than coalesced, so an editor adding a
  // real cover always wins and a later audit can still count the stand-ins.
  //
  // NOTE: line comments only. GROQ has no block comments, and a JSDoc block
  // here is a syntax error that sanityFetch catches and turns into an empty
  // result — see lib/sanity/groq-syntax.test.ts.
  "fallbackImage": relatedProducts[0]->gallery[0].asset->url,
  "fallbackImageAlt": relatedProducts[0]->gallery[0].alt,
  "body": body ${RICH_TEXT_PROJECTION},
  "author": author-> ${AUTHOR_PROJECTION},
  publishedAt,
  "relatedCategory": relatedCategory->{"slug": slug.current, "name": title},
  "relatedProducts": relatedProducts[]-> ${ARTICLE_PRODUCT_PROJECTION},
  "faqs": faqs[]{ question, answer },
  "seo": seo ${SEO_PROJECTION}
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

// Cached per-request (React's `cache()`, not a time-based cache) — the
// guide page calls this once in generateMetadata and again in the page
// body; without this every view fired the same Sanity query twice.
export const getBuyingGuide = cache(async function getBuyingGuide(
  slug: string,
): Promise<SanityBuyingGuide | null> {
  return sanityFetch<SanityBuyingGuide | null>(
    BUYING_GUIDE_BY_SLUG_QUERY,
    { slug },
    null,
  );
});
