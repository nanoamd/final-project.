import { cache } from "react";

import { sanityFetch } from "@/lib/sanity/fetch";
import { urlForImage } from "@/lib/sanity/image";
import { withProductArrayDefaults } from "@/lib/sanity/product-arrays";
import {
  FAQ_ENTRY_PROJECTION,
  PRODUCT_OPTION_PROJECTION,
  PRODUCT_SPEC_PROJECTION,
  SEO_PROJECTION,
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
  primaryColour,
  colourTags,
  materialTags,
  roomTags,
  useTags,
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
  returnsNotes,
  warrantyNotes,
  "downloads": downloads[]{ label, "url": file.asset->url },
  "relatedSlugs": relatedProducts[]->slug.current,
  rating,
  reviewCount,
  "faqs": faqs[] ${FAQ_ENTRY_PROJECTION},
  "seo": seo ${SEO_PROJECTION}
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
  "gallery" | "image" | "cardImage" | "hoverImage" | "video"
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
 * editor's hotspot; `hoverImage` (and its Wide/Square counterparts) is the
 * setting photograph a card swaps to on hover.
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
  const primary = raw.gallery[0];
  /**
   * The hover photo: the product in a setting.
   *
   * Position one is now the clean catalogue shot — see
   * scripts/derive-studio-shots.ts, which flags every gallery image and puts the
   * sweep shots first — so the hover is the first image that is *not* flagged.
   *
   * This used to be the other way round: it looked for the flagged image and
   * used that as the hover. Two things were wrong with it. The flag was set on
   * zero of 439 images, so no card on the site ever swapped anything on hover;
   * and where it had been set, the swap would have run backwards, revealing the
   * plain shot from a lifestyle photo instead of the setting from the catalogue
   * shot.
   *
   * The fallback to the second image matters more than it looks: 57 products are
   * photographed exclusively on white, and for those a hover that shows a second
   * angle is far better than a hover that does nothing.
   */
  const hoverSource =
    raw.gallery.slice(1).find((img) => !img.isStudioShot) ?? raw.gallery[1];
  return {
    ...raw,
    /* `name` is deliberately left exactly as Sanity has it, brand suffix included.
     *
     * Stripping it here would fix a real defect — the <h1> reads "13.6m Warm White
     * Decorative LED String Lights | Kaiku", the Reviews panel builds a sentence
     * around the same string, and the Product structured data hands it to Google as
     * the product's name. It is also forbidden: "Do not change product names, or
     * strip the `| Kaiku` suffix" is a standing constraint in
     * docs/master-brief.md, restated more than once.
     *
     * So it stays, and the decision is Damien's. `productDisplayName()` exists and
     * is tested; if he wants the page cleaned up, it goes here, on this line. */
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
    hoverImage: hoverSource
      ? resolveCardImageUrl(hoverSource, 1000, 1250)
      : null,
    hoverImageWide: hoverSource
      ? resolveCardImageUrl(hoverSource, 1200, 900)
      : null,
    hoverImageSquare: hoverSource
      ? resolveCardImageUrl(hoverSource, 1000, 1000)
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
 *
 * The subquery form does three things at once that a flat filter cannot. It counts
 * the primary and secondary categories together; it honours a category being
 * shoppable from several rooms via `additionalDepartments`; and it skips categories
 * flagged `excludeFromRoomGrid` — so tapping Sauna returns saunas rather than four
 * bottles of oil beside a £5,279 cabin. A product still appears if *any* of its
 * categories in this room is unflagged, which is the behaviour wanted: an item that
 * is both a sauna and an accessory is a sauna.
 */
const PRODUCTS_BY_DEPARTMENT_QUERY = /* groq */ `
*[_type == "product"
  && defined(slug.current)
  && count(*[_type == "category"
       && excludeFromRoomGrid != true
       && (department->slug.current == $departmentSlug
           || $departmentSlug in additionalDepartments[]->slug.current)
       && (_id == ^.category._ref || _id in ^.additionalCategories[]._ref)]) > 0]
  | order(_createdAt desc)
  [0...$limit]
  ${PRODUCT_PROJECTION}`;

/**
 * One supplier's products, cheapest first.
 *
 * Ordered by price ascending on purpose: the homepage rail leads with the lowest
 * entry point into the range, so the first card a visitor sees is the easiest thing
 * to say yes to, and the prices climb as they swipe. Leading with a £1,190 chest of
 * drawers reads as "not for me" before anyone has scrolled.
 */
const PRODUCTS_BY_SUPPLIER_QUERY = /* groq */ `
*[_type == "product"
  && defined(slug.current)
  && supplier->name == $supplierName]
  | order(price asc)
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
/** One supplier's range, cheapest first. */
export async function getProductsBySupplier(
  supplierName: string,
  limit = 12,
): Promise<SanityProduct[]> {
  const raw = await sanityFetch<RawProduct[]>(
    PRODUCTS_BY_SUPPLIER_QUERY,
    { supplierName, limit },
    [],
  );
  return normalizeProducts(raw);
}

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

/**
 * The number of products a shopper can actually reach.
 *
 * This was `count(*[_type == "product"])` — every product document, with no filter
 * at all. It is rendered as "All Collections — N" on the department hubs, so it is a
 * claim made to a customer, and it counted things they cannot get to: a product with
 * no category has no URL and appears in no listing, and the count would include
 * every unpublished draft the moment the client that runs it ever carried a token.
 * With 102 never-published drafts sitting in the dataset, that is not a hypothetical
 * off-by-one.
 *
 * Now the same predicate every listing uses, so the number and the pages agree.
 */
const TOTAL_PRODUCT_COUNT_QUERY = /* groq */ `count(*[
  _type == "product"
  && !(_id in path("drafts.**"))
  && defined(category->slug.current)
])`;

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
  /** The original, uncropped URL. Kept as the fallback. */
  image: string | null;
  /** A square 1:1 render honouring the hero's crop — what the feed should send. */
  feedImage: string | null;
  brand: string | null;
  gtin: string | null;
  mpn: string | null;
  sku: string | null;
  stockStatus: string;
  /** Same string the product page renders; parsed into handling days. */
  deliveryLeadTime: string | null;
  /** Needed to apply the same delivery rule the storefront applies — a
   * made-to-order supplier's real lead time beats the price band. See
   * src/lib/catalog/delivery.ts. */
  supplierName: string | null;
}

const MERCHANT_FEED_QUERY = /* groq */ `
*[_type == "product" && !(_id in path("drafts.**")) && defined(category->slug.current)] {
  "slug": slug.current,
  "category": category->slug.current,
  "categoryName": category->title,
  "departmentName": category->department->title,
  "title": title,
  summary,
  price,
  currency,
  // The asset ref plus hotspot/crop, not the plain URL: the feed image is built
  // with urlForImage so the hero's stored crop is honoured. See buildFeedImage.
  "heroImage": gallery[0]{ "assetRef": asset._ref, hotspot, crop },
  "image": gallery[0].asset->url,
  "brand": brand->name,
  gtin,
  mpn,
  sku,
  stockStatus,
  deliveryLeadTime,
  "supplierName": supplier->name
}`;

/**
 * The square image a Shopping listing should show.
 *
 * Google renders a Shopping tile square. Send it a landscape photograph and it pads
 * the image with white bars, which is why competitors' listings for the same product
 * appear with a band of white above and below and the product small in the middle.
 * Kaiku's hero photographs are already square, so nothing is letterboxed — but
 * measured across all 120 published heroes the *product* filled only 82% of its frame
 * on average and as little as 49%, so half of some tiles was empty white.
 *
 * `scripts/tighten-hero-crops.ts` stores a square crop on each hero that reclaims
 * that margin. This is the half that spends it: without building the URL through
 * `urlForImage`, the feed keeps sending `asset->url` and the crop has no effect on
 * the one surface it was computed for.
 *
 * 1200px because Merchant Center's recommended minimum for furniture is 800 and the
 * originals are large enough to give more without upscaling.
 */
const FEED_IMAGE_SIZE = 1200;

function buildFeedImage(hero: RawFeedHeroImage | null): string | null {
  if (!hero?.assetRef) return null;
  try {
    return (
      urlForImage({
        asset: { _ref: hero.assetRef, _type: "reference" },
        hotspot: hero.hotspot,
        crop: hero.crop,
      })
        .width(FEED_IMAGE_SIZE)
        .height(FEED_IMAGE_SIZE)
        .fit("crop")
        .auto("format")
        .url() || null
    );
  } catch {
    // A malformed ref must not take the whole feed down — the caller falls back to
    // the plain asset URL, which is what was sent before this existed.
    return null;
  }
}

interface RawFeedHeroImage {
  assetRef?: string | null;
  hotspot?: Record<string, unknown> | null;
  crop?: Record<string, unknown> | null;
}

/** Full, uncapped product list for the Google Merchant Center feed — unlike
 * page generation, a merchant feed genuinely needs every product.
 *
 * The drafts filter in the query above is defence in depth rather than a live fix:
 * `sanityClient` carries no token, so drafts are not returned to it today. But an
 * untokened client is the only thing preventing an unpublished, half-priced,
 * half-written product from being advertised in Google Shopping, and that is too
 * much to rest on a setting in a different file. */
export async function getMerchantFeedProducts(): Promise<
  MerchantFeedProduct[]
> {
  const raw = await sanityFetch<
    (Omit<MerchantFeedProduct, "feedImage"> & {
      heroImage?: RawFeedHeroImage | null;
    })[]
  >(MERCHANT_FEED_QUERY, {}, []);
  return raw.map(({ heroImage, ...product }) => ({
    ...product,
    feedImage: buildFeedImage(heroImage ?? null),
  }));
}
