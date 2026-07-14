"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { BrandIllustration } from "@/components/ui/brand-illustration";
import { formatPriceExact } from "@/lib/format";
import type { Product } from "@/types/catalog";

/** "You may also like" — a light product carousel closing the product page. */
export function RelatedProducts({ products }: { products: Product[] }) {
  const scroller = React.useRef<HTMLDivElement>(null);

  if (!products.length) return null;

  const scroll = (delta: number) => {
    scroller.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="border-line bg-canvas border-t">
      <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 className="text-ink font-display text-3xl tracking-tight">
            You may also like
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll(-320)}
              aria-label="Previous"
              className="border-line text-ink/60 hover:text-ink hover:border-ink/40 flex size-10 items-center justify-center rounded-full border transition-colors"
            >
              <ChevronLeft className="size-4" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => scroll(320)}
              aria-label="Next"
              className="border-line text-ink/60 hover:text-ink hover:border-ink/40 flex size-10 items-center justify-center rounded-full border transition-colors"
            >
              <ChevronRight className="size-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="-mx-6 flex snap-x gap-5 overflow-x-auto px-6 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none]"
        >
          {products.map((product) => (
            <AppLink
              key={product.slug}
              href={`/shop/${product.category}/${product.slug}`}
              className="group w-[70%] shrink-0 snap-start sm:w-[calc((100%-3.75rem)/4)]"
            >
              <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-xl border">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 70vw, 22vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="text-ink/15 flex h-full w-full items-center justify-center p-10">
                    <BrandIllustration
                      kind={product.illustration}
                      className="h-auto w-full max-w-[70%]"
                    />
                  </span>
                )}
              </div>
              <p className="text-ink group-hover:text-brass mt-3 text-[14px] font-medium transition-colors">
                {product.name}
              </p>
              <p className="text-muted mt-1 text-[13px]">
                {formatPriceExact(product.priceFrom)}
              </p>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}
