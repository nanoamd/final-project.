import { cache } from "react";

import { sanityFetch } from "@/lib/sanity/fetch";
import { urlForImage } from "@/lib/sanity/image";
import {
  FAQ_ENTRY_PROJECTION,
  PRODUCT_OPTION_PROJECTION,
  PRODUCT_SPEC_PROJECTION,
} from "@/lib/sanity/queries/fragments";
import type {
  SanityProduct,
  SanityProductGalleryImage,
} from "@/types/sanity-content";

const PRODUCT_PROJECTION = /* groq */ `{
  "slug": slug.current,
  "name": title,
  "category": category->slug.current,
  "categoryName": category->title,
  "additionalCategorySlugs": additionalCategories[]->slug.current,
  "departmentSlug": category->department->slug.current,
  "brand": brand->{ "slug": slug.current, name, "logo": logo.asset->url },
  tagline,
  summary,
  description,
  price,
  compareAtPrice,
  currency,
  badges,
  highlights,
  styleTags,
  "specs": specs[] ${PRODUCT_SPEC_PROJECTION},
  "options": options[] ${PRODUCT_OPTION_PROJECTION},
  "gallery": gallery[]{
    "url": asset->url,
    "assetRef": asset._ref,
    hotspot,
    crop,
    optionValue,
    isStudioShot
  },
  sku,
  gtin,
  mpn,
  "supplier": supplier->{ name, contactName, email, phone, defaultLeadTimeDays },
  dimensions,
  weight,
  deliveryLeadTime,
  stockStatus,
  stockQuantity,
  deliveryNotes,
  warrantyNotes,
  "downloads": downloads[]{ label, "url": file.asset->url },
  "relatedSlugs": relatedProducts[]->slug.current,
  rating,
  reviewCount,
  "faqs": faqs[] ${FAQ_ENTRY_PROJECTION}
}`;

interface RawGalleryImage {
  url: string;
  assetRef?: string;
  hotspot?: Record<string, unknown>;
  crop?: Record<string, unknown>;
  optionValue?: string | null;
  isStudioShot?: boolean;
}

interface RawProduct extends Omit<
  SanityProduct,
  "gallery" | "image" | "cardImage" | "studioImage"
> {
  gallery: RawGalleryImage[];
}

/**
 * Zoomed only when an editor has actually set a hotspot/crop on that
 * specific gallery image in Studio — otherwise returns the exact same
 * plain URL untouched. That's deliberate: forcing every product photo
 * through a fixed crop would risk cutting into photos that already look
 * fine and were never touched in Studio; this only ever changes a photo
 * an editor has explicitly asked to be cropped.
 */
function resolveCardImageUrl(img: RawGalleryImage | undefined): string | null {
  if (!img?.url) return null;
  if (!img.hotspot || !img.assetRef) return img.url;
  try {
    return (
      urlForImage({
        asset: { _ref: img.assetRef, _type: "reference" },
        hotspot: img.hotspot,
        crop: img.crop,
      })
        .width(1000)
        .height(1250)
        .fit("crop")
        .auto("format")
        .url() || img.url
    );
  } catch {
    return img.url;
  }
}

/**
 * Splits the raw gallery fetch (asset ref + hotspot/crop + tags) into the
 * public SanityProduct shape: `gallery[].url`/`image` stay the exact
 * original, untouched photo (the product-detail page's main gallery must
 * always show the whole photo, never a crop); `cardImage` is the
 * hotspot-cropped version for card/grid thumbnails; `studioImage` is
 * whichever photo is tagged as the plain-background shot, for the
 * card-hover swap.
 */
function normalizeProduct<T extends RawProduct | null>(
  raw: T,
): T extends null ? SanityProduct | null : SanityProduct {
  if (!raw) return null as never;
  const gallery: SanityProductGalleryImage[] = raw.gallery.map((img) => ({
    url: img.url,
    optionValue: img.optionValue,
    isStudioShot: img.isStudioShot,
  }));
  const studioSource = raw.gallery.find((img) => img.isStudioShot);
  return {
    ...raw,
    gallery,
    image: raw.gallery[0]?.url ?? null,
    cardImage: resolveCardImageUrl(raw.gallery[0]),
    studioImage: studioSource ? resolveCardImageUrl(studioSource) : null,
  } as never;
}

function normalizeProducts(raw: RawProduct[]): SanityProduct[] {
  return raw.map((p) => normalizeProduct(p));
}

const PRODUCT_BY_SLUG_QUERY = /* groq */ `
*[_type == "product" && slug.current == $slug][0] ${PRODUCT_PROJECTION}`;

const PRODUCTS_BY_CATEGORY_QUERY = /* groq */ `
*[_type == "product"
  && (category->slug.current == $categorySlug
      || $categorySlug in additionalCategories[]->slug.current)
  && (!defined($styleTag) || count(styleTags[lower(@) == lower($styleTag)]) > 0)]
  | order(_createdAt desc)
  [$start...$end]
  ${PRODUCT_PROJECTION}`;

const FEATURED_PRODUCTS_QUERY = /* groq */ `
*[_type == "product"] | order(_createdAt desc) [0...$limit] ${PRODUCT_PROJECTION}`;

const FLAGSHIP_PRODUCT_QUERY = /* groq */ `
*[_type == "product" && stockStatus != "Coming Soon" && stockStatus != "Out of Stock"]
  | order(price desc) [0] ${PRODUCT_PROJECTION}`;

const PRODUCTS_BY_DEPARTMENT_QUERY = /* groq */ `
*[_type == "product" && category->department->slug.current == $departmentSlug]
  | order(_createdAt desc)
  [0...$limit]
  ${PRODUCT_PROJECTION}`;

const PRODUCTS_BY_SLUGS_QUERY = /* groq */ `
*[_type == "product" && slug.current in $slugs] ${PRODUCT_PROJECTION}`;

const RELATED_BY_CATEGORY_QUERY = /* groq */ `
*[_type == "product" && category->slug.current == $categorySlug && slug.current != $excludeSlug]
  | order(_createdAt desc)
  [0...$limit]
  ${PRODUCT_PROJECTION}`;

const CATEGORY_STYLE_TAGS_QUERY = /* groq */ `
array::unique(*[_type == "product"
  && (category->slug.current == $categorySlug
      || $categorySlug in additionalCategories[]->slug.current)
  && defined(styleTags)].styleTags[])`;

/** Distinct style tags in use among a category's products — powers the shop
 * drill-nav's third tier. Returns [] rather than erroring when none are set. */
export async function getCategoryStyleTags(
  categorySlug: string,
): Promise<string[]> {
  return sanityFetch<string[]>(CATEGORY_STYLE_TAGS_QUERY, { categorySlug }, []);
}

// Widened beyond title/tagline to summary, category name, and the
// description's actual text (pt::text() flattens the portable-text blocks
// to a plain string match() can search) — a search for e.g. "teak" or
// "sauna" previously missed products where that word only appeared in the
// long description or the category, not the title.
const SEARCH_PRODUCTS_QUERY = /* groq */ `
*[_type == "product" && (
  title match $term + "*" ||
  tagline match $term + "*" ||
  summary match $term + "*" ||
  category->title match $term + "*" ||
  pt::text(description) match $term + "*"
)]
  | order(_createdAt desc)
  [0...$limit]
  ${PRODUCT_PROJECTION}`;

// Cached per-request (React's `cache()`, not a time-based cache) — the
// product page calls this once in generateMetadata and again in the page
// body; without this every product view fired the same Sanity query twice.
export const getProduct = cache(async function getProduct(
  slug: string,
): Promise<SanityProduct | null> {
  const raw = await sanityFetch<RawProduct | null>(
    PRODUCT_BY_SLUG_QUERY,
    { slug },
    null,
  );
  return normalizeProduct(raw);
});

export async function getProductsByCategory(
  categorySlug: string,
  {
    limit = 24,
    offset = 0,
    styleTag,
  }: { limit?: number; offset?: number; styleTag?: string } = {},
): Promise<SanityProduct[]> {
  const raw = await sanityFetch<RawProduct[]>(
    PRODUCTS_BY_CATEGORY_QUERY,
    {
      categorySlug,
      start: offset,
      end: offset + limit,
      styleTag: styleTag ?? null,
    },
    [],
  );
  return normalizeProducts(raw);
}

export async function getFeaturedProducts(limit = 4): Promise<SanityProduct[]> {
  const raw = await sanityFetch<RawProduct[]>(
    FEATURED_PRODUCTS_QUERY,
    { limit },
    [],
  );
  return normalizeProducts(raw);
}

/**
 * The single flagship product for the homepage's featured spotlight — the
 * highest-priced product that can actually be bought today. Deterministic
 * (no editor curation needed yet); when a curated "featured" flag earns its
 * place in the schema, only this query changes.
 */
export async function getFlagshipProduct(): Promise<SanityProduct | null> {
  const raw = await sanityFetch<RawProduct | null>(
    FLAGSHIP_PRODUCT_QUERY,
    {},
    null,
  );
  return normalizeProduct(raw);
}

/** Every product across every category in a room — powers the room's "Shop All" page. */
export async function getProductsByDepartment(
  departmentSlug: string,
  limit = 200,
): Promise<SanityProduct[]> {
  const raw = await sanityFetch<RawProduct[]>(
    PRODUCTS_BY_DEPARTMENT_QUERY,
    { departmentSlug, limit },
    [],
  );
  return normalizeProducts(raw);
}

export async function getProductsBySlugs(
  slugs: string[],
): Promise<SanityProduct[]> {
  if (!slugs.length) return [];
  const raw = await sanityFetch<RawProduct[]>(
    PRODUCTS_BY_SLUGS_QUERY,
    { slugs },
    [],
  );
  return normalizeProducts(raw);
}

/**
 * Related products: curated refs first (order preserved), falling back to
 * other products in the same category when a product has none set.
 */
export async function getRelatedProducts(
  product: SanityProduct,
  limit = 4,
): Promise<SanityProduct[]> {
  if (product.relatedSlugs?.length) {
    const curated = await getProductsBySlugs(product.relatedSlugs);
    const ordered = product.relatedSlugs
      .map((slug) => curated.find((p) => p.slug === slug))
      .filter((p): p is SanityProduct => Boolean(p));
    if (ordered.length) return ordered.slice(0, limit);
  }
  const raw = await sanityFetch<RawProduct[]>(
    RELATED_BY_CATEGORY_QUERY,
    { categorySlug: product.category, excludeSlug: product.slug, limit },
    [],
  );
  return normalizeProducts(raw);
}

export async function searchProducts(
  term: string,
  limit = 12,
): Promise<SanityProduct[]> {
  if (!term.trim()) return [];
  const raw = await sanityFetch<RawProduct[]>(
    SEARCH_PRODUCTS_QUERY,
    { term, limit },
    [],
  );
  return normalizeProducts(raw);
}

const TOTAL_PRODUCT_COUNT_QUERY = /* groq */ `count(*[_type == "product"])`;

export async function getTotalProductCount(): Promise<number> {
  return sanityFetch<number>(TOTAL_PRODUCT_COUNT_QUERY, {}, 0);
}

const PRODUCT_PARAMS_QUERY = /* groq */ `
*[_type == "product" && defined(category->slug.current)] | order(_createdAt desc) [0...$limit] {
  "category": category->slug.current,
  "slug": slug.current
}`;

/**
 * Slug pairs for generateStaticParams. Capped (not the full catalog) so a
 * 10,000+ product store never turns `next build` into a full-catalog crawl —
 * uncapped slugs still render on demand via ISR (dynamicParams stays true).
 */
export async function getProductParams(
  limit = 200,
): Promise<{ category: string; slug: string }[]> {
  return sanityFetch<{ category: string; slug: string }[]>(
    PRODUCT_PARAMS_QUERY,
    { limit },
    [],
  );
}

export interface MerchantFeedProduct {
  slug: string;
  category: string;
  title: string;
  summary: string;
  price: number;
  currency: string;
  image: string | null;
  brand: string | null;
  gtin: string | null;
  mpn: string | null;
  sku: string | null;
  stockStatus: string;
}

const MERCHANT_FEED_QUERY = /* groq */ `
*[_type == "product" && defined(category->slug.current)] {
  "slug": slug.current,
  "category": category->slug.current,
  "title": title,
  summary,
  price,
  currency,
  "image": gallery[0].asset->url,
  "brand": brand->name,
  gtin,
  mpn,
  sku,
  stockStatus
}`;

/** Full, uncapped product list for the Google Merchant Center feed — unlike
 * page generation, a merchant feed genuinely needs every product. */
export async function getMerchantFeedProducts(): Promise<
  MerchantFeedProduct[]
> {
  return sanityFetch<MerchantFeedProduct[]>(MERCHANT_FEED_QUERY, {}, []);
}
