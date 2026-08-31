import {
  colourTagForOptionValue,
  FACET_DEFINITIONS,
  type FacetKey,
} from "@/lib/catalog/facets";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Filtering and sorting the shopping grid.
 *
 * **Driven entirely by the URL, and applied on the server.** That is the decision
 * everything else here follows from, and it is made for traffic rather than for
 * tidiness: a filter held in client state produces one crawlable page, whereas
 * `?colour=Black` is a URL that can be linked, shared, and — where it is worth
 * it — indexed. "Black coffee table" is a real search with real intent, and the
 * brief asks for exactly that phrase.
 *
 * It also means the grid still works with no JavaScript, and that the first paint
 * already contains the filtered products rather than assembling them afterwards.
 */

/** Which facets a product carries, by facet key. */
function productFacetValues(
  product: ShopFacetable,
  key: FacetKey,
): readonly string[] {
  switch (key) {
    case "colour":
      return product.colourTags ?? [];
    case "material":
      return product.materialTags ?? [];
    case "style":
      return product.styleTags ?? [];
    case "room":
      return product.roomTags ?? [];
    case "type":
      return product.useTags ?? [];
  }
}

export const SORT_OPTIONS = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "Name: A–Z" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["key"];

/**
 * The part of a product the filters and the grid actually read.
 *
 * Declared so the shop pages can hand the client a trimmed product rather than
 * the whole document. `SanityProduct` carries the full rich-text description,
 * the spec table, the FAQs, the SEO block and the downloads — none of which a
 * tile or a facet count touches. Sending the whole thing pushed the Lighting
 * page's payload to 2MB.
 */
export type ShopFacetable = Pick<
  SanityProduct,
  | "price"
  | "stockStatus"
  | "colourTags"
  | "materialTags"
  | "styleTags"
  | "roomTags"
  | "useTags"
  | "gallery"
  | "name"
>;

export interface ShopQuery {
  /** Selected values per facet. Absent keys mean no constraint. */
  facets: Partial<Record<FacetKey, string[]>>;
  sort: SortKey;
  /** Only products that can actually be bought. */
  inStockOnly: boolean;
  maxPrice: number | null;
}

export const EMPTY_QUERY: ShopQuery = {
  facets: {},
  sort: "featured",
  inStockOnly: false,
  maxPrice: null,
};

/**
 * Reads the query out of `searchParams`.
 *
 * Values are validated against the vocabulary rather than trusted: a URL is
 * user input, and an unrecognised value should simply not constrain anything
 * instead of producing an empty grid that looks like a broken shop. Comma
 * separated so `?colour=Black,Grey` stays readable and short enough to share.
 */
export function parseShopQuery(
  searchParams: Record<string, string | string[] | undefined>,
): ShopQuery {
  const read = (key: string): string | undefined => {
    const raw = searchParams[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  const facets: Partial<Record<FacetKey, string[]>> = {};
  for (const definition of FACET_DEFINITIONS) {
    const raw = read(definition.key);
    if (!raw) continue;
    const chosen = raw
      .split(",")
      .map((value) => value.trim())
      // Case-insensitive, because a hand-typed or lower-cased URL should still
      // work, but stored back in the vocabulary's own casing so comparisons and
      // the rendered chips agree.
      .map((value) =>
        definition.tags.find(
          (tag) => tag.toLowerCase() === value.toLowerCase(),
        ),
      )
      .filter((value): value is string => Boolean(value));
    if (chosen.length) facets[definition.key] = [...new Set(chosen)];
  }

  const sortRaw = read("sort");
  const sort =
    SORT_OPTIONS.find((option) => option.key === sortRaw)?.key ?? "featured";

  const maxPriceRaw = Number(read("under"));
  const maxPrice =
    Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : null;

  return {
    facets,
    sort,
    inStockOnly: read("in-stock") === "1",
    maxPrice,
  };
}

/** True when nothing is constrained — used to skip the "clear all" affordance. */
export function isEmptyQuery(query: ShopQuery): boolean {
  return (
    Object.keys(query.facets).length === 0 &&
    !query.inStockOnly &&
    query.maxPrice === null
  );
}

/**
 * Applies the query.
 *
 * Within one facet the selected values are OR-ed — asking for Black *and* Grey
 * means "either" and widens the results, which is what a shopper ticking two
 * swatches expects. Across facets they are AND-ed: Black plus Oak means a black
 * oak piece, not everything black plus everything oak. Getting that pair the
 * wrong way round is the most common way a filter feels broken.
 */
export function applyShopQuery<T extends ShopFacetable>(
  products: T[],
  query: ShopQuery,
): T[] {
  const filtered = products.filter((product) => {
    for (const [key, chosen] of Object.entries(query.facets)) {
      if (!chosen?.length) continue;
      const values = productFacetValues(product, key as FacetKey);
      if (!chosen.some((value) => values.includes(value))) return false;
    }
    if (query.inStockOnly && product.stockStatus !== "In Stock") return false;
    if (query.maxPrice !== null && (product.price ?? 0) > query.maxPrice)
      return false;
    return true;
  });

  switch (query.sort) {
    case "price-asc":
      return [...filtered].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case "price-desc":
      return [...filtered].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case "name":
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      // The order the query returned — `title asc` for a category grid, so
      // finish/colour variants of the same piece already sit together. Not a
      // no-op worth removing: this is where that ordering is preserved rather
      // than being overwritten by a client-side re-sort.
      return filtered;
  }
}

/**
 * Which facet values actually appear in this set of products, with counts.
 *
 * The filter bar is built from this rather than from the whole vocabulary, so a
 * shopper is never offered a swatch that returns nothing. Counted against the
 * products *before* this facet is applied, so ticking Black does not reduce the
 * other colours to zero and make the rest of the row look unavailable — the
 * standard behaviour of a good faceted search, and the thing people notice when
 * it is missing.
 */
export function facetCounts(
  products: ShopFacetable[],
  query: ShopQuery,
  key: FacetKey,
): Map<string, number> {
  const withoutThisFacet: ShopQuery = {
    ...query,
    facets: Object.fromEntries(
      Object.entries(query.facets).filter(([other]) => other !== key),
    ),
  };
  const pool = applyShopQuery(products, withoutThisFacet);

  const counts = new Map<string, number>();
  for (const product of pool)
    for (const value of productFacetValues(product, key))
      counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

/**
 * The URL for toggling one facet value, preserving everything else.
 *
 * Returned as a query string rather than applied to a router, so the filter bar
 * can be plain links — crawlable, middle-clickable, and working without
 * JavaScript.
 */
export function toggleFacetHref(
  pathname: string,
  query: ShopQuery,
  key: FacetKey,
  value: string,
): string {
  const current = query.facets[key] ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  const params = new URLSearchParams();
  for (const definition of FACET_DEFINITIONS) {
    const values = definition.key === key ? next : query.facets[definition.key];
    if (values?.length) params.set(definition.key, values.join(","));
  }
  if (query.sort !== "featured") params.set("sort", query.sort);
  if (query.inStockOnly) params.set("in-stock", "1");
  if (query.maxPrice !== null) params.set("under", String(query.maxPrice));

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

/** The URL for changing sort, preserving the filters. */
export function sortHref(
  pathname: string,
  query: ShopQuery,
  sort: SortKey,
): string {
  const params = new URLSearchParams();
  for (const definition of FACET_DEFINITIONS) {
    const values = query.facets[definition.key];
    if (values?.length) params.set(definition.key, values.join(","));
  }
  if (sort !== "featured") params.set("sort", sort);
  if (query.inStockOnly) params.set("in-stock", "1");
  if (query.maxPrice !== null) params.set("under", String(query.maxPrice));
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * A sentence describing what is filtered, for the page to show and for the
 * `<title>`.
 *
 * Worth having as one function because it is used in three places — the results
 * line, the metadata, and the empty state — and three near-identical sentences
 * that drift apart is how a page starts to read as though nobody owns it.
 */
export function describeQuery(query: ShopQuery): string | null {
  const parts: string[] = [];
  for (const definition of FACET_DEFINITIONS) {
    const values = query.facets[definition.key];
    if (values?.length) parts.push(values.join(" or "));
  }
  if (query.inStockOnly) parts.push("in stock");
  if (query.maxPrice !== null) parts.push(`under £${query.maxPrice}`);
  return parts.length ? parts.join(", ") : null;
}

/**
 * The photograph a card should show, given what the shopper filtered for.
 *
 * The brief: "When users select black furniture, the black version should
 * appear. Do not only show default images." A card that answers a Black filter
 * with the white variant's photograph is not a small blemish — it is the shop
 * appearing not to know its own stock, on the exact interaction where a shopper
 * is deciding whether to trust it.
 *
 * 24 products carry variant-tagged gallery images, so this fires on a real
 * slice of the catalogue rather than being scaffolding for later.
 *
 * Returns null when there is nothing better than the default, which is the
 * common case and must stay cheap: no filter, no colour filter, a product with
 * one photo, or a variant nobody has photographed separately.
 */
export function variantImageForQuery(
  product: Pick<SanityProduct, "gallery">,
  query: ShopQuery,
): string | null {
  const wanted = query.facets.colour;
  if (!wanted?.length) return null;

  // The gallery entry's own colour, resolved through the alias table because
  // the supplier's word ("Whitewash") is not the filter's word ("White").
  for (const image of product.gallery) {
    if (!image.optionValue) continue;
    const colour = colourTagForOptionValue(image.optionValue);
    if (colour && wanted.includes(colour)) return image.url;
  }
  return null;
}
