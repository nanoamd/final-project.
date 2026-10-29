import type { Metadata } from "next";

import {
  facetHeading,
  type FacetKind,
  facetPagesFor,
  LISTING_CEILING,
  productsForFacet,
} from "@/lib/catalog/facet-pages";
import { getCategories, getCategory } from "@/lib/sanity/queries";
import { getProductsByCategory } from "@/lib/sanity/queries/product";
import { buildMetadata } from "@/lib/seo/metadata";
import type { SanityCategory, SanityProduct } from "@/types/sanity-content";

/**
 * The shared half of the three facet routes.
 *
 * ## Why three routes and not one
 *
 * `/shop/[category]/[facet]/[value]` looks like the obvious shape and Next
 * rejects it: two different slug names cannot share a position in the route
 * tree, and `[product]` already owns the third segment
 * (`/shop/sofas/roza-wall-clock`). So the kind is a **literal** segment —
 * `colour`, `material`, `under` — which is the same thing `/shop/[category]/all`
 * already does one level up, and a static segment beats a dynamic one, so a
 * product slugged "colour" would be shadowed rather than ambiguous.
 *
 * Everything except that literal is identical between the three, and lives
 * here so the three route files cannot drift apart.
 */

export interface FacetRouteData {
  category: SanityCategory;
  page: ReturnType<typeof facetPagesFor>[number];
  products: SanityProduct[];
  siblings: ReturnType<typeof facetPagesFor>;
  categoryTotal: number;
}

/** Build-time params for one kind: every category that has such a page. */
export async function facetParamsFor(
  kind: FacetKind,
): Promise<{ category: string; value: string }[]> {
  const categories = await getCategories();
  const params: { category: string; value: string }[] = [];
  for (const category of categories) {
    if (!category.productCount) continue;
    const products = await getProductsByCategory(category.slug, {
      limit: LISTING_CEILING,
    });
    for (const page of facetPagesFor(products)) {
      if (page.kind !== kind) continue;
      params.push({ category: category.slug, value: page.value });
    }
  }
  return params;
}

/**
 * The category, the facet and its products — or null when there is no page.
 *
 * The page must be one `facetPagesFor` would generate. Without that check any
 * string in the URL bar renders a thin page, which is how a curated set turns
 * back into the crawl trap it was built to replace.
 */
export async function resolveFacet(
  categorySlug: string,
  kind: FacetKind,
  value: string,
): Promise<FacetRouteData | null> {
  const [category, products] = await Promise.all([
    getCategory(categorySlug),
    getProductsByCategory(categorySlug, { limit: LISTING_CEILING }),
  ]);
  if (!category) return null;

  const siblings = facetPagesFor(products);
  const page = siblings.find(
    (candidate) => candidate.kind === kind && candidate.value === value,
  );
  if (!page) return null;

  return {
    category,
    page,
    products: productsForFacet(products, kind, value),
    siblings,
    categoryTotal: products.length,
  };
}

/** Title and description, both computed from the products on the page. */
export function facetMetadata(data: FacetRouteData | null): Metadata {
  if (!data) {
    return buildMetadata({
      title: "Not found",
      description: "This page does not exist.",
      path: "/shop",
    });
  }
  const { category, page, products } = data;
  const heading = facetHeading(category.name, page.kind, page.label);
  const prices = products
    .map((product) => product.price)
    .filter((price): price is number => typeof price === "number");
  const from = prices.length ? Math.min(...prices) : null;

  return buildMetadata({
    title: heading,
    // The first product on this facet. Without it an 83-page set of shared
    // links all showed the same generic garden photo.
    image:
      products[0]?.cardImage ??
      products[0]?.image ??
      category.image ??
      category.fallbackImage ??
      undefined,
    description:
      `${products.length} ${heading.toLowerCase()} at Kaiku` +
      (from ? `, from £${from}` : "") +
      ". Free UK delivery, with dimensions and lead times on every piece.",
    path: `/shop/${category.slug}/${page.kind}/${page.value}`,
  });
}
