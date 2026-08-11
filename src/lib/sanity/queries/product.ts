import { cache } from "react";

import { sanityFetch } from "@/lib/sanity/fetch";
import { urlForImage } from "@/lib/sanity/image";
import { withProductArrayDefaults } from "@/lib/sanity/product-arrays";
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
    alt,
    optionValue,
    isStudioShot
  },
  // url is null when no file has been uploaded — an editor who opens the
  // collapsed Video field and closes it again leaves an object behind.
  // normalizeProduct turns that into a plain null, because a truthy object with
  // no url renders an empty slide in the gallery. Line comments only: GROQ
  // parses // but rejects /* */, which fails the query at runtime, not at build.
  "video": video{
    "url": file.asset->url,
    "poster": poster.asset->url,
    alt
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
  alt?: string;
  optionValue?: string | null;
  isStudioShot?: boolean;
}

interface RawProduct extends Omit<
  SanityProduct,
  "gallery" | "image" | "cardImage" | "studioImage" | "video"
> {
  gallery: RawGalleryImage[];
  /** Straight off the projection, so `url` may be null even when the object
   * exists. normalizeProduct is what makes it null-or-usable. */
  video?: { url: string | null; poster?: string | null; alt?: string | null };
}

/**
 * Zoomed only when an editor has actually set a hotspot/crop on that
 * specific gallery image in Studio — otherwise returns the exact same
 * plain URL untouched. That's deliberate: forcing every product photo
 * through a fixed crop would risk cutting into photos that already look
 * fine and were never touched in Studio; this only ever changes a photo
 * an editor has explicitly asked to be cropped.
 *
 * `width`/`height` must match the aspect ratio of whatever box the result
 * is rendered in. Sanity's crop is computed to satisfy that exact ratio
 * around the hotspot — asking for the wrong ratio here means the browser's
 * own `object-cover` then re-crops the already-cropped image a second
 * time, on the raw rectangle rather than the intended focal point, which
 * is what produces an over-zoomed/oddly-cropped card even though the
 * editor set a perfectly good hotspot.
 */
function resolveCardImageUrl(
  img: RawGalleryImage | undefined,
  width: number,
  height: number,
): string | null {
  if (!img?.url) return null;
  if (!img.hotspot || !img.assetRef) return img.url;
  try {
    return (
      urlForImage({
        asset: { _ref: img.assetRef, _type: "reference" },
        hotspot: img.hotspot,
        crop: img.crop,
      })
        .width(width)
        .height(height)
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
 * always show the whole photo, never a crop); `cardImage`/`cardImageWide`/
 * `cardImageSquare` are the same hotspot crop computed at 4:5, 4:3 and 1:1
 * respectively, so every container gets a crop matching its own aspect
 * ratio instead of a second, unintended browser-side crop on top of the
 * editor's hotspot; `studioImage` (and its Wide/Square counterparts) is
 * whichever photo is tagged as the plain-background shot, for the
 * card-hover swap.
 */
function normalizeProduct<T extends RawProduct | null>(
  raw: T,
): T extends null ? SanityProduct | null : SanityProduct {
  if (!raw) return null as never;
  // Before anything reads an array off it: GROQ gives null, not [], for a field
  // the document does not have, and a product published without specs or
  // highlights used to 500 its own page.
  raw = withProductArrayDefaults(raw);
  const gallery: SanityProductGalleryImage[] = raw.gallery.map((img) => ({
    url: img.url,
    alt: img.alt,
    optionValue: img.optionValue,
    isStudioShot: img.isStudioShot,
  }));
  const studioSource = raw.gallery.find((img) => img.isStudioShot);
  const primary = raw.gallery[0];
  return {
    ...raw,
    gallery,
    // An empty Video object — opened in Studio, never filled — must not read as
    // "this product has a video", or the gallery grows a black slide.
    video: raw.video?.url
      ? {
          url: raw.video.url,
          poster: raw.video.poster ?? null,
          alt: raw.video.alt ?? null,
        }
      : null,
    image: primary?.url ?? null,
    cardImage: resolveCardImageUrl(primary, 1000, 1250),
    cardImageWide: resolveCardImageUrl(primary, 1200, 900),
    cardImageSquare: resolveCardImageUrl(primary, 1000, 1000),
    studioImage: studioSource
      ? resolveCardImageUrl(studioSource, 1000, 1250)
      : null,
    studioImageWide: studioSource
      ? resolveCardImageUrl(studioSource, 1200, 900)
      : null,
    studioImageSquare: studioSource
      ? resolveCardImageUrl(studioSource, 1000, 1000)
      : null,
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

/**
 * Every product in a room, counting secondary categories.
 *
 * This matched on `category->department` alone, so a product appeared on a room
 * page only if its *primary* category belonged to that room. Outdoor Living was the
 * visible casualty: its eight categories hold ten products between them — garden
 * furniture, garden lighting, outdoor storage, planters — and every one is attached
 * as a secondary category, so the page showed the single product whose primary
 * category is Water Features and nothing else.
 *
 * `additionalCategories` is how a product is deliberately placed in more than one
 * room, which is exactly the case a room page needs to honour: a teak bench belongs
 * in Garden Furniture and in Outdoor Living. The category query has always
 * understood that; only this one did not.
 *
 * `defined(slug.current)` matches ALL_PRODUCTS_QUERY — a product with no slug has no
 * URL, so its tile would link nowhere.
 */
const PRODUCTS_BY_DEPARTMENT_QUERY = /* groq */ `
*[_type == "product"
  && defined(slug.current)
  && (category->department->slug.current == $departmentSlug
      || $departmentSlug in additionalCategories[]->department->slug.current)]
  | order(_createdAt desc)
  [0...$limit]
  ${PRODUCT_PROJECTION}`;

const ALL_PRODUCTS_QUERY = /* groq */ `
*[_type == "product" && defined(slug.current)]
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

// Tier 3: the same room. Ordered newest-first like the category tier, so a
// newly added product gets seen rather than sinking behind the original stock.
const RELATED_BY_DEPARTMENT_QUERY = /* groq */ `
*[_type == "product"
  && category->department->slug.current == $departmentSlug
  && !(slug.current in $exclude)]
  | order(_createdAt desc)
  [0...$limit]
  ${PRODUCT_PROJECTION}`;

// Tier 4: a similar price, anywhere. Ordered by price so what surfaces sits as
// close to the product's own price as the band allows.
const RELATED_BY_PRICE_QUERY = /* groq */ `
*[_type == "product"
  && defined(price) && price >= $min && price <= $max
  && !(slug.current in $exclude)]
  | order(price asc)
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

/**
 * Every product on the site, newest first — powers /shop/all, the single
 * destination that lists the whole catalogue without first choosing a room.
 * Filtered on a defined slug because a product without one has no reachable
 * URL, so a tile for it would link nowhere.
 */
export async function getAllProducts(limit = 500): Promise<SanityProduct[]> {
  const raw = await sanityFetch<RawProduct[]>(
    ALL_PRODUCTS_QUERY,
    { limit },
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
 * Related products, in four tiers, stopping as soon as the row is full:
 *
 *   1. Curated `relatedProducts` refs, in the order an editor set them.
 *   2. Other products in the same category.
 *   3. Other products in the same room.
 *   4. Products in a similar price band, anywhere in the catalogue.
 *
 * Tiers 3 and 4 exist because same-category alone left five product pages with
 * an empty related row and eight more with a half-empty one — a third of the
 * catalogue. Two of the five were the worst possible pages for it: the £4,000
 * cold plunge, the most valuable thing in the shop, and the only product in
 * Outdoor Kitchens. A visitor who reaches either has nowhere to go but back.
 *
 * The price band is what keeps tier 4 from being nonsense. Offering a £4 bottle
 * of essential oil beside a £4,000 ice bath is not a suggestion, it is a
 * non-sequitur; 0.4x to 2.5x puts saunas next to the plunge and keeps the £65
 * barbecue among things someone might add to the same order.
 */
const PRICE_BAND_LOW = 0.4;
const PRICE_BAND_HIGH = 2.5;

export async function getRelatedProducts(
  product: SanityProduct,
  limit = 4,
): Promise<SanityProduct[]> {
  const picked: SanityProduct[] = [];
  const seen = new Set<string>([product.slug]);

  const take = (candidates: SanityProduct[]) => {
    for (const candidate of candidates) {
      if (picked.length >= limit) return;
      if (seen.has(candidate.slug)) continue;
      seen.add(candidate.slug);
      picked.push(candidate);
    }
  };

  if (product.relatedSlugs?.length) {
    const curated = await getProductsBySlugs(product.relatedSlugs);
    // Editor order, not query order.
    take(
      product.relatedSlugs
        .map((slug) => curated.find((p) => p.slug === slug))
        .filter((p): p is SanityProduct => Boolean(p)),
    );
  }

  if (picked.length < limit) {
    take(
      normalizeProducts(
        await sanityFetch<RawProduct[]>(
          RELATED_BY_CATEGORY_QUERY,
          { categorySlug: product.category, excludeSlug: product.slug, limit },
          [],
        ),
      ),
    );
  }

  if (picked.length < limit && product.departmentSlug) {
    take(
      normalizeProducts(
        await sanityFetch<RawProduct[]>(
          RELATED_BY_DEPARTMENT_QUERY,
          {
            departmentSlug: product.departmentSlug,
            exclude: [...seen],
            limit,
          },
          [],
        ),
      ),
    );
  }

  if (picked.length < limit && product.price) {
    take(
      normalizeProducts(
        await sanityFetch<RawProduct[]>(
          RELATED_BY_PRICE_QUERY,
          {
            exclude: [...seen],
            min: product.price * PRICE_BAND_LOW,
            max: product.price * PRICE_BAND_HIGH,
            limit,
          },
          [],
        ),
      ),
    );
  }

  return picked;
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
  /** Human-readable names, for the feed's `product_type` breadcrumb. */
  categoryName: string | null;
  departmentName: string | null;
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
  /** Same string the product page renders; parsed into handling days. */
  deliveryLeadTime: string | null;
}

const MERCHANT_FEED_QUERY = /* groq */ `
*[_type == "product" && defined(category->slug.current)] {
  "slug": slug.current,
  "category": category->slug.current,
  "categoryName": category->title,
  "departmentName": category->department->title,
  "title": title,
  summary,
  price,
  currency,
  "image": gallery[0].asset->url,
  "brand": brand->name,
  gtin,
  mpn,
  sku,
  stockStatus,
  deliveryLeadTime
}`;

/** Full, uncapped product list for the Google Merchant Center feed — unlike
 * page generation, a merchant feed genuinely needs every product. */
export async function getMerchantFeedProducts(): Promise<
  MerchantFeedProduct[]
> {
  return sanityFetch<MerchantFeedProduct[]>(MERCHANT_FEED_QUERY, {}, []);
}
