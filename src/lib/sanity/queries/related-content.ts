import { sanityFetch } from "@/lib/sanity/fetch";
import { AUTHOR_PROJECTION } from "@/lib/sanity/queries/author";
import type { SanityBuyingGuide, SanityPost } from "@/types/sanity-content";

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

const POST_PROJECTION = /* groq */ `{
  "slug": slug.current,
  title,
  excerpt,
  "coverImage": coverImage.asset->url,
  body,
  "author": author-> ${AUTHOR_PROJECTION},
  publishedAt,
  tags,
  "relatedProducts": relatedProducts[]->{"slug": slug.current}
}`;

const BUYING_GUIDES_BY_PRODUCT_QUERY = /* groq */ `
*[_type == "buyingGuide" && defined(publishedAt) && $productSlug in relatedProducts[]->slug.current]
  | order(publishedAt desc)
  [0...$limit]
  ${BUYING_GUIDE_PROJECTION}`;

const BUYING_GUIDES_BY_CATEGORY_QUERY = /* groq */ `
*[_type == "buyingGuide" && defined(publishedAt) && relatedCategory->slug.current == $categorySlug]
  | order(publishedAt desc)
  [0...$limit]
  ${BUYING_GUIDE_PROJECTION}`;

const POSTS_BY_PRODUCT_QUERY = /* groq */ `
*[_type == "post" && defined(publishedAt) && $productSlug in relatedProducts[]->slug.current]
  | order(publishedAt desc)
  [0...$limit]
  ${POST_PROJECTION}`;

/**
 * Buying guides and blog posts related to a single product, for the product
 * detail page. Buying guides prefer an exact product match over a mere
 * category match (curated-first, same pattern as `getRelatedProducts`); posts
 * only match via an explicit product reference — `post` has no category ref,
 * and tag-based fuzzy matching is too unreliable to use here.
 */
export async function getRelatedContentForProduct({
  productSlug,
  categorySlug,
}: {
  productSlug: string;
  categorySlug: string;
}): Promise<{ buyingGuides: SanityBuyingGuide[]; posts: SanityPost[] }> {
  const limit = 2;

  const [byProduct, posts] = await Promise.all([
    sanityFetch<SanityBuyingGuide[]>(
      BUYING_GUIDES_BY_PRODUCT_QUERY,
      { productSlug, limit },
      [],
    ),
    sanityFetch<SanityPost[]>(
      POSTS_BY_PRODUCT_QUERY,
      { productSlug, limit },
      [],
    ),
  ]);

  let buyingGuides = byProduct;
  if (buyingGuides.length < limit) {
    const byCategory = await sanityFetch<SanityBuyingGuide[]>(
      BUYING_GUIDES_BY_CATEGORY_QUERY,
      { categorySlug, limit },
      [],
    );
    const seen = new Set(buyingGuides.map((g) => g.slug));
    for (const guide of byCategory) {
      if (buyingGuides.length >= limit) break;
      if (seen.has(guide.slug)) continue;
      seen.add(guide.slug);
      buyingGuides = [...buyingGuides, guide];
    }
  }

  return { buyingGuides, posts };
}
