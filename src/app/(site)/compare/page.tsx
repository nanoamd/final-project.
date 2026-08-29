import type { Metadata } from "next";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import {
  buildCompareRows,
  NOT_SPECIFIED,
  parseCompareSlugs,
} from "@/features/compare/compare-fields";
import { getProductsBySlugs } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Compare Products | Kaiku",
    description:
      "Put two pieces side by side on the specifications that decide it — size, materials, delivery and price.",
    path: "/compare",
  }),
  /**
   * Not indexed. Every combination of products is its own URL, so letting this be
   * crawled would generate an unbounded set of near-identical thin pages — the
   * textbook way to spend a crawl budget on nothing. `follow`, so the product links
   * on it still pass value.
   */
  robots: { index: false, follow: true },
};

/**
 * Side-by-side product comparison, driven entirely by the URL.
 *
 * `?products=slug-a,slug-b`. Chosen over stored client state on purpose: a
 * comparison is the sort of thing people send to whoever they share a house with, and
 * a URL survives that where localStorage does not. It also keeps this a server
 * component, so the table is in the HTML rather than assembled after a fetch.
 *
 * Replaces a coming-soon placeholder that both the product page and the category
 * pages linked to.
 */
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ products?: string }>;
}) {
  const { products: raw } = await searchParams;
  const slugs = parseCompareSlugs(raw);
  const found = slugs.length ? await getProductsBySlugs(slugs) : [];

  // Restored to the order asked for. getProductsBySlugs makes no promise about
  // ordering, and a table whose columns reorder between visits is disorienting.
  const products = slugs
    .map((slug) => found.find((product) => product.slug === slug))
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product),
    );

  const rows = buildCompareRows(products);
  const differing = rows.filter((row) => row.differs).length;
  const hasUnknowns = rows.some((row) => row.values.includes(null));

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <div className="mx-auto max-w-[1180px] px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
        <p className="text-brass text-[11px] font-medium tracking-[0.24em] uppercase">
          Compare
        </p>
        <h1 className="font-display mt-3 text-[1.9rem] leading-tight tracking-tight sm:text-[2.5rem]">
          {products.length >= 2
            ? "Side by side"
            : "Put two pieces side by side"}
        </h1>

        {products.length < 2 ? (
          <EmptyState count={products.length} />
        ) : (
          <>
            <p className="text-graphite mt-4 max-w-xl text-[15px] leading-relaxed">
              {differing === 0
                ? "These match on every specification we hold. The choice is the look."
                : `${differing} of ${rows.length} specifications differ. Those are tinted, so you can go straight to what separates them.`}
            </p>

            {/* Horizontally scrolling on a narrow screen, which is the only honest
                way to show three columns at 390px. data-lenis-prevent because this
                site runs Lenis for smooth scrolling, which otherwise captures the
                gesture and lets the table travel one way only. Scrollbar hidden in
                both engines. */}
            <div
              data-lenis-prevent
              className="mt-8 [scrollbar-width:none] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
            >
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <caption className="sr-only">
                  {products
                    .map((product) => product.name)
                    .join(" compared with ")}
                </caption>
                <thead>
                  <tr>
                    {/* Empty corner cell, kept narrow: the row labels are short and
                        the products deserve the width. */}
                    <th scope="col" className="w-[7.5rem] sm:w-[9rem]" />
                    {products.map((product) => (
                      <th
                        key={product.slug}
                        scope="col"
                        className="border-line border-b p-3 align-top"
                      >
                        <AppLink
                          href={`/shop/${product.category}/${product.slug}`}
                          className="group block"
                        >
                          <span className="border-line bg-paper relative block aspect-square overflow-hidden rounded-lg border">
                            {(product.cardImageSquare ??
                            product.cardImage ??
                            product.image) ? (
                              <Image
                                src={
                                  (product.cardImageSquare ??
                                    product.cardImage ??
                                    product.image)!
                                }
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 40vw, 20vw"
                                className="object-contain"
                              />
                            ) : null}
                          </span>
                          <span className="text-ink group-hover:text-brass mt-2.5 block text-[13px] leading-snug font-medium transition-colors">
                            {product.name}
                          </span>
                        </AppLink>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-line border-b">
                      <th
                        scope="row"
                        className="text-muted py-3 pr-3 align-top text-[12px] font-medium tracking-[0.06em] uppercase"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.label}-${products[index]?.slug ?? index}`}
                          className={`p-3 align-top text-[14px] leading-relaxed ${
                            value == null
                              ? "text-muted italic"
                              : "text-graphite"
                          } ${row.differs ? "bg-brass/[0.035]" : ""}`}
                        >
                          {value ?? NOT_SPECIFIED}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-muted mt-6 max-w-2xl text-[13px] leading-relaxed">
              Tinted cells are the ones that differ.
              {hasUnknowns
                ? " “Not specified” means the maker has not published that figure — ask and we will confirm it before you order."
                : null}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {products.map((product) => (
                <AppLink
                  key={product.slug}
                  href={`/shop/${product.category}/${product.slug}`}
                  className="border-ink/25 text-ink hover:border-ink flex h-11 items-center rounded-none border px-5 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
                >
                  View {product.name.split(" ").slice(0, 2).join(" ")}
                </AppLink>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * What the page says with nothing to compare.
 *
 * The distinction matters: arriving with one product means the next step is picking
 * a second, and arriving with none means the tool has not been started. Telling both
 * "nothing selected" would leave the first case looking broken.
 */
function EmptyState({ count }: { count: number }) {
  return (
    <div className="border-line mt-8 border border-dashed p-8">
      <p className="text-graphite max-w-xl text-[15px] leading-relaxed">
        {count === 1
          ? "One piece chosen. Open another product and use Compare there to put the two side by side."
          : "Open any product and use Compare to start. Two pieces at a time works best; up to four fit."}
      </p>
      <p className="text-muted mt-3 max-w-xl text-[14px] leading-relaxed">
        Comparisons live in the address bar, so you can send one to whoever you
        are deciding with.
      </p>
      <AppLink
        href="/shop/all"
        className="bg-ink text-canvas hover:bg-ink/90 mt-6 inline-flex h-11 items-center rounded-none px-5 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
      >
        Browse products
      </AppLink>
    </div>
  );
}
