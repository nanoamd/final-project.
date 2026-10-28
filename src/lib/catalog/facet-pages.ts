import { COLOUR_TAGS, MATERIAL_TAGS } from "@/lib/catalog/facets";

/**
 * Which filtered views of the catalogue deserve a page of their own.
 *
 * ## Why this exists
 *
 * Kaiku has 908 products across 49 categories and earns about one organic
 * click a day. The pages that do earn clicks are the calculators, because
 * they answer a question somebody actually typed. A category page answers
 * "sofas"; it does not answer "rattan garden furniture", which is a different
 * search with its own intent and its own competition.
 *
 * The catalogue already holds the answer — every product carries `colourTags`
 * and `materialTags` — and until now the only way to reach those views was a
 * query string. Those query strings are now blocked in robots.txt, because
 * they were a combinatorial crawl trap returning byte-identical HTML. This is
 * the other half of that decision: a small, curated set of real URLs that are
 * worth crawling, instead of tens of thousands that are not.
 *
 * ## What stops this from becoming the same trap again
 *
 * Four rules, all enforced here rather than left to judgement:
 *
 * 1. **A floor of {@link MIN_PRODUCTS}.** A page with three products on it has
 *    nothing to say and nothing to rank for.
 * 2. **A ceiling of {@link MAX_SHARE}.** If a tag covers nearly the whole
 *    category, its page IS the category page with a different heading — which
 *    is duplicate content, the exact thing being escaped.
 * 3. **Colour and material only.** Style tags are excluded deliberately:
 *    "Modern" and "Contemporary" are each applied to 115 of the lighting
 *    products, so those two pages would duplicate each other *and* the
 *    category. A vocabulary applied to everything describes nothing.
 * 4. **Price bands are hand-written**, not derived, so the boundaries are the
 *    ones shoppers use ("under £100") rather than wherever the data happens
 *    to clump.
 *
 * Everything below is a pure function of the product list, so the set of pages
 * is a consequence of the catalogue and cannot drift from it: a tag that falls
 * out of use stops generating a page on the next build.
 */

/**
 * How many products to read when judging a category.
 *
 * The whole category, not a page of it: the counts below decide which pages
 * exist, and a count taken from the first 24 products would invent and
 * destroy pages as the catalogue was reordered.
 */
export const LISTING_CEILING = 5000;

/** Below this a page has nothing to say. */
export const MIN_PRODUCTS = 8;

/**
 * Above this share of its category, a facet page is the category page.
 *
 * 0.85 rather than 1.0 because the duplicate starts well before the tag
 * covers everything — at 90% the two grids differ by a handful of tiles and
 * no reader, or crawler, would call them different pages.
 */
export const MAX_SHARE = 0.85;

/** The price bands, in the shapes people actually search for. */
export const PRICE_BANDS = [
  { slug: "100", label: "under £100", max: 100 },
  { slug: "250", label: "under £250", max: 250 },
  { slug: "500", label: "under £500", max: 500 },
  { slug: "1000", label: "under £1,000", max: 1000 },
] as const;

export type FacetKind = "colour" | "material" | "under";

export interface FacetPage {
  kind: FacetKind;
  /** The URL segment, e.g. "rattan" or "500". */
  value: string;
  /** The tag or band as written for a reader, e.g. "Rattan", "under £500". */
  label: string;
  /** How many products are on it. */
  count: number;
}

/** The minimum a product must carry for this module to judge it. */
export interface FacetProduct {
  price?: number | null;
  colourTags?: string[] | null;
  materialTags?: string[] | null;
}

/** A tag as it appears in a URL: lower case, spaces to hyphens. */
export function facetSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

function matchTag(tags: string[] | null | undefined, tag: string): boolean {
  return (tags ?? []).some(
    (candidate) => candidate.trim().toLowerCase() === tag.toLowerCase(),
  );
}

/** The products on a given facet page, from a category's products. */
export function productsForFacet<T extends FacetProduct>(
  products: T[],
  kind: FacetKind,
  value: string,
): T[] {
  if (kind === "under") {
    const band = PRICE_BANDS.find((candidate) => candidate.slug === value);
    if (!band) return [];
    return products.filter(
      (product) =>
        typeof product.price === "number" && product.price < band.max,
    );
  }
  const tag = (kind === "colour" ? COLOUR_TAGS : MATERIAL_TAGS).find(
    (candidate) => facetSlug(candidate) === value,
  );
  if (!tag) return [];
  return products.filter((product) =>
    matchTag(
      kind === "colour" ? product.colourTags : product.materialTags,
      tag,
    ),
  );
}

/**
 * Every facet page worth generating for one category's products.
 *
 * Returned in a stable order — colour, then material, then price — so the
 * sibling links render the same way on every page and in the sitemap.
 */
export function facetPagesFor(products: FacetProduct[]): FacetPage[] {
  const total = products.length;
  if (total < MIN_PRODUCTS) return [];

  const pages: FacetPage[] = [];

  const addTagPages = (
    kind: "colour" | "material",
    tags: readonly string[],
  ) => {
    for (const tag of tags) {
      const count = products.filter((product) =>
        matchTag(
          kind === "colour" ? product.colourTags : product.materialTags,
          tag,
        ),
      ).length;
      if (count < MIN_PRODUCTS) continue;
      if (count / total > MAX_SHARE) continue;
      pages.push({ kind, value: facetSlug(tag), label: tag, count });
    }
  };

  addTagPages("colour", COLOUR_TAGS);
  addTagPages("material", MATERIAL_TAGS);

  for (const band of PRICE_BANDS) {
    const count = products.filter(
      (product) =>
        typeof product.price === "number" && product.price < band.max,
    ).length;
    if (count < MIN_PRODUCTS) continue;
    if (count / total > MAX_SHARE) continue;
    pages.push({
      kind: "under",
      value: band.slug,
      label: band.label,
      count,
    });
  }

  return pages;
}

/** The path for a facet page. */
export function facetPath(
  categorySlug: string,
  kind: FacetKind,
  value: string,
): string {
  return `/shop/${categorySlug}/${kind}/${value}`;
}

/**
 * The page's heading, in the order a person would say it.
 *
 * "Rattan Garden Furniture", not "Garden Furniture — Rattan". The adjective
 * leads because that is how the search is typed, and a heading that matches
 * the query is the strongest on-page signal there is.
 */
export function facetHeading(
  categoryName: string,
  kind: FacetKind,
  label: string,
): string {
  if (kind === "under") return `${categoryName} ${label}`;
  return `${label} ${categoryName}`;
}
