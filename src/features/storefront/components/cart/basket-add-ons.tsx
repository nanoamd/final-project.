"use client";

import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { formatPriceExact } from "@/lib/format";
import { fetchBasketAddOns } from "@/server/actions/basket-add-ons";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * A short row of cheap, profitable things from the same supplier as whatever
 * is already in the basket.
 *
 * ## Why the basket page specifically
 *
 * 91 products in the catalogue are worth having but not worth advertising:
 * £29–£100, keeping £15 or more once carriage is excluded. None of them can
 * pay for the clicks it takes to find a buyer on its own — nothing at that
 * price can, at dropship margins — so the only place they earn anything is an
 * order somebody has already decided to place.
 *
 * Product pages already carry four related items. The basket carried none,
 * which is where this sits: the one page where the decision to buy has been
 * made and the only open question is how much.
 *
 * ## Why same supplier
 *
 * Carriage is per consignment. A second piece from the same supplier ships on
 * the first one's carriage and keeps its full margin; one from a different
 * supplier starts a second consignment and pays its own. The query enforces
 * that, and it is the whole reason these products are worth showing.
 *
 * Renders nothing when there is nothing to show — an empty basket, a supplier
 * with no cheap stock, or a failed request. A rail that appears half-empty is
 * worse than one that stays away.
 */
export function BasketAddOns({ slugs }: { slugs: string[] }) {
  const [products, setProducts] = React.useState<SanityProduct[]>([]);
  // Joined so the effect re-runs when the basket's contents change rather than
  // when the array identity does, which would refetch on every render.
  const key = slugs.join(",");

  React.useEffect(() => {
    let cancelled = false;
    // Nothing to ask about. Returning without touching state keeps the effect
    // free of a synchronous setState, and an empty basket is handled at render
    // instead.
    if (!key) return;
    /**
     * The basket only exists in the browser, so what to fetch is not knowable
     * until after render — which is what an effect is for. The same
     * disable sits in use-cart, use-saved-products, use-recently-viewed and
     * use-cookie-consent for the same reason: client-only state arriving
     * asynchronously.
     */

    fetchBasketAddOns(key.split(","), 4)
      .then((found) => {
        if (!cancelled) setProducts(found);
      })
      // Silent on purpose: this is a suggestion, and a basket must never show
      // an error because an optional rail could not load.
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!key || !products.length) return null;

  return (
    <section className="border-line mt-12 border-t pt-10">
      <h2 className="text-ink font-display text-2xl tracking-tight">
        Add to your order
      </h2>
      <p className="text-muted mt-2 text-[13px]">
        These ship with what&rsquo;s already in your basket.
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {products.map((product) => (
          <li key={product.slug}>
            <AppLink
              href={`/shop/${product.category}/${product.slug}`}
              className="group block"
            >
              {(product.cardImage ?? product.image) ? (
                <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-xl border">
                  <Image
                    src={product.cardImage ?? product.image!}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 45vw, 22vw"
                    className="object-contain transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
              ) : (
                <PlaceholderImage
                  tone="sand"
                  illustration="leaf"
                  aspect="aspect-square"
                  className="rounded-xl"
                />
              )}
              <p className="text-ink group-hover:text-brass mt-3 text-[14px] font-medium transition-colors">
                {product.name}
              </p>
              <p className="text-muted mt-1 text-[13px]">
                {formatPriceExact(product.price)}
              </p>
            </AppLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
