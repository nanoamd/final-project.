"use client";

import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { formatPriceExact } from "@/lib/format";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Records the current product into browsing history, and shows the other
 * products a customer has looked at this session/device — a nudge back
 * toward something they were close to buying, not just a generic upsell.
 * Renders nothing until there's a second product to show.
 */
export function RecentlyViewed({ product }: { product: SanityProduct }) {
  const { items, record } = useRecentlyViewed();

  React.useEffect(() => {
    record({
      slug: product.slug,
      category: product.category,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    // Only re-record if the viewed product itself changes — `record` is
    // stable (useCallback with no deps) but including it would still be
    // harmless; omitted deliberately to keep the intent ("run when the
    // product changes") obvious.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  const others = items.filter((i) => i.slug !== product.slug);
  if (!others.length) return null;

  return (
    <section className="border-line bg-canvas border-t">
      <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-8 lg:px-12">
        <h2 className="text-ink font-display mb-8 text-3xl tracking-tight">
          Recently viewed
        </h2>
        <div className="-mx-6 flex snap-x [scrollbar-width:none] gap-5 overflow-x-auto px-6 pb-2 sm:mx-0 sm:px-0">
          {others.slice(0, 4).map((item) => (
            <AppLink
              key={item.slug}
              href={`/shop/${item.category}/${item.slug}`}
              className="group w-[70%] shrink-0 snap-start sm:w-[calc((100%-3.75rem)/4)]"
            >
              {item.image ? (
                <div className="border-line bg-paper relative aspect-[4/5] overflow-hidden rounded-xl border">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 70vw, 22vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
              ) : (
                <PlaceholderImage
                  tone="sand"
                  illustration="leaf"
                  aspect="aspect-[4/5]"
                  className="rounded-xl"
                />
              )}
              <p className="text-ink group-hover:text-brass mt-3 text-[14px] font-medium transition-colors">
                {item.name}
              </p>
              <p className="text-muted mt-1 text-[13px]">
                {formatPriceExact(item.price)}
              </p>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}
