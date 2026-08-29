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
  type ShopFacetable,
  type ShopQuery,
  SORT_OPTIONS,
  sortHref,
  toggleFacetHref,
} from "@/lib/catalog/shop-query";

/**
 * The shopping filters, as a tab on the edge of the screen that opens a sidebar.
 *
 * **Every control is a link, not a button.** That is the whole design. Links mean
 * the filtered grid is a real URL — shareable, indexable, and working with
 * JavaScript off — and it means this entire component is a server component with
 * no client bundle at all. `?colour=Black` on the coffee tables page is a page
 * that can rank for "black coffee table", which is the sort of query the brief
 * names directly.
 *
 * **Why a sidebar rather than a band above the grid.** Damien: *"I think it should
 * be a tab on the side which says filters and when you press it it opens up a
 * sidebar rather than having it as the first thing you see"*. He is right, and the
 * measurement agrees: with the facets laid out above the products, the first
 * product on Coffee Tables started 965px down a 390px screen — the grid entirely
 * below the fold, on the page whose job is to show products. Even with most of it
 * folded away, the swatch rows were still the first thing on a shop page.
 *
 * **Still `<details>`, not a client component.** No JavaScript, no bundle, the
 * links stay in the DOM for a crawler whether the panel is open or shut, and the
 * browser supplies the keyboard and screen-reader behaviour for free. The tab is
 * pinned to the panel's outer edge, so it travels out with the panel and the same
 * control that opened it closes it — which is what a backdrop click would do, and
 * a backdrop click is the one part of this that would need script.
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
  products: ShopFacetable[];
  query: ShopQuery;
  pathname: string;
}) {
  const active = describeQuery(query);
  const chosenCount = Object.values(query.facets).reduce(
    (total, tags) => total + (tags?.length ?? 0),
    query.inStockOnly ? 1 : 0,
  );

  return (
    <>
      {/* What is currently filtered stays in the page, not in the drawer. Hiding
          the controls behind a tab is fine; hiding the *state* is not — a shopper
          looking at 11 of 88 products needs to know why without opening anything,
          and needs one tap to undo it. */}
      {active ? (
        <div className="border-line mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-4">
          <span className="text-muted text-[12px] tracking-[0.12em] uppercase">
            Filtered by
          </span>
          <span className="text-ink text-[13px]">{active}</span>
          {!isEmptyQuery(query) ? (
            <AppLink
              href={pathname}
              className="text-brass text-[13px] underline underline-offset-4"
            >
              Clear all
            </AppLink>
          ) : null}
        </div>
      ) : null}

      <details className="group/filters">
        {/* The tab. `left-0` closed, and out at the panel's edge once open, so it
            reads as the handle on the drawer rather than a button that vanished.
            Vertical text keeps it narrow.

            **It has to fit the page gutter or it clips the grid.** Measured: the
            product cards start at x=24 on a 390px screen, and the first version of
            this tab was 31.5px wide — 7.5px of it sitting on top of the leftmost
            column, cutting the corner off "Witley Coffee Table". Sized down to
            ~22px it sits in the margin and touches nothing. Tall rather than wide
            for the same reason: the tap target has to come from the height,
            because the width belongs to the gutter. */}
        <summary
          aria-label={
            chosenCount
              ? `Filters (${chosenCount} applied)`
              : "Filters and sorting"
          }
          className="border-line bg-canvas text-ink hover:border-ink/50 fixed top-1/2 left-0 z-50 flex -translate-y-1/2 cursor-pointer list-none items-center justify-center rounded-r-lg border border-l-0 px-1 py-7 shadow-sm transition-[left] duration-200 group-open/filters:left-[min(88vw,340px)]"
        >
          <span
            className="text-[10px] font-semibold tracking-[0.16em] uppercase"
            style={{ writingMode: "vertical-rl" }}
          >
            {chosenCount ? `Filters · ${chosenCount}` : "Filters"}
          </span>
        </summary>

        {/* `data-lenis-prevent` — Lenis owns the wheel on this site, and without
            it a scroll inside the drawer scrolls the page behind it instead. */}
        <div
          data-lenis-prevent
          className="border-line bg-canvas fixed inset-y-0 left-0 z-40 w-[min(88vw,340px)] overflow-y-auto border-r px-5 py-8"
        >
          <p className="text-ink font-display mb-6 text-xl">
            Filter &amp; sort
          </p>

          {/* Colour first, and as circles. The brief asks for visual swatches
              specifically, and colour is the facet people actually shop furniture
              by — a row of circles is scanned in a moment where a list of words
              has to be read. */}
          <ColourSwatches
            products={products}
            query={query}
            pathname={pathname}
          />

          <div className="mt-7 flex flex-col gap-7">
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

          <div className="border-line mt-7 flex flex-col gap-5 border-t pt-6">
            {/* In-stock is a single toggle rather than a facet, because "Out of
                Stock" is never something a shopper wants to filter *for*. */}
            <AppLink
              href={sortHref(
                pathname,
                { ...query, inStockOnly: !query.inStockOnly },
                query.sort,
              )}
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

            <div>
              <p className="text-muted mb-2.5 text-[12px] tracking-[0.12em] uppercase">
                Sort
              </p>
              <div className="flex flex-col gap-2">
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

          {!isEmptyQuery(query) ? (
            <AppLink
              href={pathname}
              className="border-line text-ink hover:border-ink/50 mt-7 flex items-center justify-center border py-2.5 text-[12px] font-semibold tracking-[0.12em] uppercase transition-colors"
            >
              Clear all filters
            </AppLink>
          ) : null}
        </div>
      </details>
    </>
  );
}

function ColourSwatches({
  products,
  query,
  pathname,
}: {
  products: ShopFacetable[];
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
      <div className="flex flex-wrap gap-x-2.5 gap-y-3">
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
  products: ShopFacetable[];
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
