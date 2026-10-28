import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/shared/json-ld";
import { AppLink } from "@/components/ui/app-link";
import {
  ShopAllTile,
  toShopTile,
} from "@/features/storefront/components/category/shop-results";
import {
  facetHeading,
  type FacetPage,
  facetPath,
} from "@/lib/catalog/facet-pages";
import { formatPrice } from "@/lib/format";
import type { SanityCategory, SanityProduct } from "@/types/sanity-content";

/**
 * A curated filtered view of a category — "Rattan Garden Furniture".
 *
 * ## What makes this a page rather than a filter
 *
 * A thin page is one that restates its parent. This one has to carry
 * something the category page does not, and the only honest source for that
 * is the products on it, so every sentence below is computed from them: how
 * many there are, what they cost, what else they are made of. No written
 * copy, because 67 pages of written copy would be 67 pages of filler, and
 * this catalogue has had that problem before.
 *
 * The facts are chosen to be the ones a shopper actually wants before
 * clicking a tile — the price floor and ceiling, and what the alternatives
 * are — rather than the ones that are easiest to generate.
 */
export function FacetLanding({
  category,
  page,
  products,
  siblings,
  categoryTotal,
}: {
  category: SanityCategory;
  page: FacetPage;
  products: SanityProduct[];
  siblings: FacetPage[];
  categoryTotal: number;
}) {
  const heading = facetHeading(category.name, page.kind, page.label);
  const path = facetPath(category.slug, page.kind, page.value);

  const prices = products
    .map((product) => product.price)
    .filter((price): price is number => typeof price === "number")
    .sort((a, b) => a - b);
  const low = prices[0] ?? null;
  const high = prices[prices.length - 1] ?? null;

  /** The other facets of this category, so each page is a way into the rest. */
  const others = siblings.filter(
    (sibling) => !(sibling.kind === page.kind && sibling.value === page.value),
  );

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "All Collections", url: "/shop" },
    { name: category.name, url: `/shop/${category.slug}` },
    { name: heading, url: path },
  ];

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ItemListJsonLd
        items={products.map((product) => ({
          name: product.name,
          url: `/shop/${product.category}/${product.slug}`,
        }))}
      />

      <div className="mx-auto max-w-[1480px] px-6 py-10 sm:px-8 lg:px-12">
        <nav
          aria-label="Breadcrumb"
          className="text-muted mb-6 flex flex-wrap items-center gap-2 text-[12px]"
        >
          {breadcrumbItems.map((crumb, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return (
              <span key={crumb.url} className="flex items-center gap-2">
                {isLast ? (
                  <span className="text-ink" aria-current="page">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <AppLink
                      href={crumb.url}
                      className="hover:text-ink -my-[13px] inline-flex min-h-11 items-center transition-colors"
                    >
                      {crumb.name}
                    </AppLink>
                    <span aria-hidden>/</span>
                  </>
                )}
              </span>
            );
          })}
        </nav>

        <h1 className="font-display text-ink text-3xl tracking-tight sm:text-4xl">
          {heading}
        </h1>

        {/* Computed, not written. The count, the range and the share of the
            category are the three things a shopper wants before they start
            scrolling, and all three are true by construction. */}
        <p className="text-graphite mt-4 max-w-2xl text-[15px] leading-relaxed">
          {products.length} of our {categoryTotal} {category.name.toLowerCase()}
          {page.kind === "under"
            ? ` come in ${page.label}`
            : ` are ${page.label.toLowerCase()}`}
          {low !== null && high !== null && low !== high
            ? `, from ${formatPrice(low)} to ${formatPrice(high)}`
            : low !== null
              ? `, at ${formatPrice(low)}`
              : ""}
          . Every piece lists its dimensions, materials and delivery window, and
          UK delivery is included in the price.
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {products.map((product) => (
            <li key={product.slug}>
              <ShopAllTile product={toShopTile(product)} />
            </li>
          ))}
        </ul>

        {others.length ? (
          <section className="border-line mt-16 border-t pt-10">
            <h2 className="font-display text-ink text-xl tracking-tight">
              Other ways to narrow {category.name.toLowerCase()}
            </h2>
            {/* Real internal links between sibling pages, which is what the
                blocked query strings could never be: a crawler following
                these reaches every curated view of the category and nothing
                else. */}
            <ul className="mt-5 flex flex-wrap gap-2">
              {others.map((sibling) => (
                <li key={`${sibling.kind}-${sibling.value}`}>
                  <AppLink
                    href={facetPath(category.slug, sibling.kind, sibling.value)}
                    className="border-line hover:border-ink text-graphite hover:text-ink inline-flex min-h-11 items-center rounded-full border px-4 text-[13px] transition-colors"
                  >
                    {facetHeading(category.name, sibling.kind, sibling.label)}
                    <span className="text-muted ml-2">{sibling.count}</span>
                  </AppLink>
                </li>
              ))}
            </ul>
            <AppLink
              href={`/shop/${category.slug}`}
              className="text-brass-deep mt-6 inline-flex min-h-11 items-center text-[13px] font-medium underline underline-offset-4"
            >
              All {categoryTotal} {category.name.toLowerCase()} →
            </AppLink>
          </section>
        ) : null}
      </div>
    </div>
  );
}
