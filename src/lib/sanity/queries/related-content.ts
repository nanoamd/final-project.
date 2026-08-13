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

/**
 * Whether this product's own category carries buying guidance on its page.
 *
 * The product page used to say "We're still writing a guide for this category"
 * whenever no buyingGuide document matched — advertising an absence on every
 * product page, which is a strange thing for a shop to volunteer. Eight categories
 * now carry a written "How to choose" section, so where one exists the product page
 * can point at real content instead. Only the flag and the name are fetched: the
 * guidance itself belongs on the category page, not duplicated here.
 */
const CATEGORY_GUIDE_QUERY = /* groq */ `
*[_type == "category" && slug.current == $categorySlug][0]{
  "name": title,
  "hasGuide": count(buyingGuide) > 0
}`;

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
}): Promise<{
  buyingGuides: SanityBuyingGuide[];
  posts: SanityPost[];
  /** The product's own category, where its page carries buying guidance. */
  categoryGuide: { name: string; slug: string } | null;
}> {
  const limit = 2;

  const [byProduct, posts, category] = await Promise.all([
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
    sanityFetch<{ name: string; hasGuide: boolean } | null>(
      CATEGORY_GUIDE_QUERY,
      { categorySlug },
      null,
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

  return {
    buyingGuides,
    posts,
    categoryGuide: category?.hasGuide
      ? { name: category.name, slug: categorySlug }
      : null,
  };
}
