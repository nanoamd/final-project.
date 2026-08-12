import { AppLink } from "@/components/ui/app-link";
import {
  COLOUR_FACETS,
  FACET_DEFINITIONS,
  type FacetKey,
} from "@/lib/catalog/facets";
import {
  describeQuery,
  facetCounts,
  isEmptyQuery,
  type ShopQuery,
  SORT_OPTIONS,
  sortHref,
  toggleFacetHref,
} from "@/lib/catalog/shop-query";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * The shopping filters.
 *
 * **Every control is a link, not a button.** That is the whole design. Links mean
 * the filtered grid is a real URL — shareable, indexable, and working with
 * JavaScript off — and it means this entire component is a server component with
 * no client bundle at all. `?colour=Black` on the coffee tables page is a page
 * that can rank for "black coffee table", which is the sort of query the brief
 * names directly.
 *
 * Only facets that actually appear in the current set are offered, and each shows
 * its count. Offering a swatch that returns nothing is the fastest way to make a
 * shop feel broken, and it is the reason `facetCounts` counts against the pool
 * before the facet in question is applied.
 */
export function FilterBar({
  products,
  query,
  pathname,
}: {
  /** The unfiltered set for this page — what the facet counts are computed from. */
  products: SanityProduct[];
  query: ShopQuery;
  pathname: string;
}) {
  const active = describeQuery(query);

  return (
    <div className="border-line mb-8 border-b pb-6">
      {/* Colour first, and as circles. The brief asks for visual swatches
          specifically, and colour is the facet people actually shop furniture
          by — a row of circles is scanned in a moment where a list of words has
          to be read. */}
      <ColourSwatches products={products} query={query} pathname={pathname} />

      {/**
       * Everything except colour sits behind a native `<details>`.
       *
       * Measured before deciding: with all five facets expanded, the first
       * product on Coffee Tables started at **965px** on a 390px screen — the
       * entire grid below the fold, on the page whose job is to show products.
       * That is precisely the "excessive spacing, desktop layout forced into
       * mobile" the brief opens with.
       *
       * Colour stays out here because it is two rows, it is the facet people
       * actually shop furniture by, and a row of swatches is the thing that makes
       * the page look like a shop. The rest — four more facets and the sort —
       * is the part that was costing 700px.
       *
       * `<details>` rather than a client component: no JavaScript, no bundle, the
       * content stays in the DOM for a crawler, and the browser gives keyboard
       * and screen-reader behaviour for free. It stays closed on desktop too.
       * That is not a compromise — one tap to open a filter panel is what every
       * large retailer does, and it keeps one implementation instead of two.
       */}
      <details className="group mt-5">
        <summary className="border-line text-ink hover:border-ink/50 flex w-fit cursor-pointer list-none items-center gap-2 border px-4 py-2 text-[12px] font-semibold tracking-[0.12em] uppercase transition-colors">
          <span>More filters &amp; sort</span>
          <span aria-hidden className="text-muted group-open:hidden">
            +
          </span>
          <span aria-hidden className="text-muted hidden group-open:inline">
            −
          </span>
        </summary>

        <div className="mt-5 flex flex-wrap items-start gap-x-8 gap-y-4">
          {FACET_DEFINITIONS.filter((d) => d.key !== "colour").map(
            (definition) => (
              <ChipFacet
                key={definition.key}
                label={definition.label}
                facetKey={definition.key}
                tags={definition.tags}
                products={products}
                query={query}
                pathname={pathname}
              />
            ),
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* In-stock is a single toggle rather than a facet, because "Out of
            Stock" is never something a shopper wants to filter *for*. */}
          <AppLink
            href={
              query.inStockOnly
                ? sortHref(
                    pathname,
                    { ...query, inStockOnly: false },
                    query.sort,
                  )
                : sortHref(
                    pathname,
                    { ...query, inStockOnly: true },
                    query.sort,
                  )
            }
            className={`flex items-center gap-2 text-[13px] transition-colors ${
              query.inStockOnly
                ? "text-ink font-medium"
                : "text-muted hover:text-ink"
            }`}
          >
            <span
              aria-hidden
              className={`flex size-4 items-center justify-center border ${
                query.inStockOnly
                  ? "border-ink bg-ink text-canvas"
                  : "border-line"
              }`}
            >
              {query.inStockOnly ? "✓" : ""}
            </span>
            In stock only
          </AppLink>

          <div className="flex items-center gap-3">
            <span className="text-muted text-[12px] tracking-[0.12em] uppercase">
              Sort
            </span>
            <div className="flex flex-wrap gap-3">
              {SORT_OPTIONS.map((option) => (
                <AppLink
                  key={option.key}
                  href={sortHref(pathname, query, option.key)}
                  className={`text-[13px] transition-colors ${
                    query.sort === option.key
                      ? "text-ink font-medium underline underline-offset-4"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {option.label}
                </AppLink>
              ))}
            </div>
          </div>
        </div>
      </details>

      {active ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-muted text-[12px] tracking-[0.12em] uppercase">
            Filtered by
          </span>
          <span className="text-ink text-[13px]">{active}</span>
          {!isEmptyQuery(query) ? (
            <AppLink
              href={pathname}
              className="text-brass ml-2 text-[13px] underline underline-offset-4"
            >
              Clear all
            </AppLink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ColourSwatches({
  products,
  query,
  pathname,
}: {
  products: SanityProduct[];
  query: ShopQuery;
  pathname: string;
}) {
  const counts = facetCounts(products, query, "colour");
  const available = COLOUR_FACETS.filter((colour) => counts.has(colour.tag));
  if (available.length < 2) return null;

  const chosen = query.facets.colour ?? [];

  return (
    <div>
      <p className="text-muted mb-3 text-[12px] tracking-[0.12em] uppercase">
        Colour
      </p>
      <div className="flex flex-wrap gap-2.5">
        {available.map((colour) => {
          const isOn = chosen.includes(colour.tag);
          const count = counts.get(colour.tag) ?? 0;
          return (
            <AppLink
              key={colour.tag}
              href={toggleFacetHref(pathname, query, "colour", colour.tag)}
              // The name and the count are the accessible label. A circle of
              // colour alone tells a screen reader nothing, and "Black" is also
              // what someone with any degree of colour blindness needs.
              aria-label={`${colour.tag} (${count})`}
              aria-pressed={isOn}
              title={`${colour.tag} (${count})`}
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                aria-hidden
                style={{ backgroundColor: colour.hex }}
                className={`block size-8 rounded-full ring-offset-2 transition-all ${
                  isOn
                    ? "ring-ink ring-2"
                    : "ring-line group-hover:ring-ink/40 ring-1"
                }`}
              />
              <span
                className={`text-[11px] transition-colors ${
                  isOn
                    ? "text-ink font-medium"
                    : "text-muted group-hover:text-ink"
                }`}
              >
                {colour.tag}
              </span>
            </AppLink>
          );
        })}
      </div>
    </div>
  );
}

function ChipFacet({
  label,
  facetKey,
  tags,
  products,
  query,
  pathname,
}: {
  label: string;
  facetKey: FacetKey;
  tags: readonly string[];
  products: SanityProduct[];
  query: ShopQuery;
  pathname: string;
}) {
  const counts = facetCounts(products, query, facetKey);
  const available = tags.filter((tag) => counts.has(tag));
  // One option filters nothing — every product would match it.
  if (available.length < 2) return null;

  const chosen = query.facets[facetKey] ?? [];

  return (
    <div className="min-w-0">
      <p className="text-muted mb-2.5 text-[12px] tracking-[0.12em] uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {available.map((tag) => {
          const isOn = chosen.includes(tag);
          return (
            <AppLink
              key={tag}
              href={toggleFacetHref(pathname, query, facetKey, tag)}
              aria-pressed={isOn}
              className={`flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-[13px] transition-colors ${
                isOn
                  ? "border-ink bg-ink text-canvas"
                  : "border-line text-graphite hover:border-ink/50 hover:text-ink"
              }`}
            >
              {tag}
              <span className={isOn ? "text-canvas/60" : "text-muted"}>
                {counts.get(tag)}
              </span>
            </AppLink>
          );
        })}
      </div>
    </div>
  );
}
