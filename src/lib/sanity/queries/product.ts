import { sanityFetch } from "@/lib/sanity/fetch";
import {
  FAQ_ENTRY_PROJECTION,
  PRODUCT_OPTION_PROJECTION,
  PRODUCT_SPEC_PROJECTION,
} from "@/lib/sanity/queries/fragments";
import type { SanityProduct } from "@/types/sanity-content";

const PRODUCT_PROJECTION = /* groq */ `{
  "slug": slug.current,
  "name": title,
  "category": category->slug.current,
  "categoryName": category->title,
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
  "specs": specs[] ${PRODUCT_SPEC_PROJECTION},
  "options": options[] ${PRODUCT_OPTION_PROJECTION},
  "gallery": gallery[].asset->url,
  "image": gallery[0].asset->url,
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

const PRODUCT_BY_SLUG_QUERY = /* groq */ `
*[_type == "product" && slug.current == $slug][0] ${PRODUCT_PROJECTION}`;

const PRODUCTS_BY_CATEGORY_QUERY = /* groq */ `
*[_type == "product" && category->slug.current == $categorySlug]
  | order(_createdAt desc)
  [$start...$end]
  ${PRODUCT_PROJECTION}`;

const FEATURED_PRODUCTS_QUERY = /* groq */ `
*[_type == "product"] | order(_createdAt desc) [0...$limit] ${PRODUCT_PROJECTION}`;

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

const SEARCH_PRODUCTS_QUERY = /* groq */ `
*[_type == "product" && (title match $term + "*" || tagline match $term + "*")]
  | order(_createdAt desc)
  [0...$limit]
  ${PRODUCT_PROJECTION}`;

export async function getProduct(slug: string): Promise<SanityProduct | null> {
  return sanityFetch<SanityProduct | null>(
    PRODUCT_BY_SLUG_QUERY,
    { slug },
    null,
  );
}

export async function getProductsByCategory(
  categorySlug: string,
  { limit = 24, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<SanityProduct[]> {
  return sanityFetch<SanityProduct[]>(
    PRODUCTS_BY_CATEGORY_QUERY,
    { categorySlug, start: offset, end: offset + limit },
    [],
  );
}

export async function getFeaturedProducts(limit = 4): Promise<SanityProduct[]> {
  return sanityFetch<SanityProduct[]>(FEATURED_PRODUCTS_QUERY, { limit }, []);
}

/** Every product across every category in a room — powers the room's "Shop All" page. */
export async function getProductsByDepartment(
  departmentSlug: string,
  limit = 200,
): Promise<SanityProduct[]> {
  return sanityFetch<SanityProduct[]>(
    PRODUCTS_BY_DEPARTMENT_QUERY,
    { departmentSlug, limit },
    [],
  );
}

export async function getProductsBySlugs(
  slugs: string[],
): Promise<SanityProduct[]> {
  if (!slugs.length) return [];
  return sanityFetch<SanityProduct[]>(PRODUCTS_BY_SLUGS_QUERY, { slugs }, []);
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
  return sanityFetch<SanityProduct[]>(
    RELATED_BY_CATEGORY_QUERY,
    { categorySlug: product.category, excludeSlug: product.slug, limit },
    [],
  );
}

export async function searchProducts(
  term: string,
  limit = 12,
): Promise<SanityProduct[]> {
  if (!term.trim()) return [];
  return sanityFetch<SanityProduct[]>(
    SEARCH_PRODUCTS_QUERY,
    { term, limit },
    [],
  );
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
