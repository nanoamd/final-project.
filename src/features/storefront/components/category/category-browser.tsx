"use client";

import * as React from "react";

import { ProductCard } from "@/components/shared/product-card";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

type SortKey = "featured" | "price-asc" | "price-desc";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function CategoryBrowser({ products }: { products: Product[] }) {
  const [active, setActive] = React.useState<string[]>([]);
  const [sort, setSort] = React.useState<SortKey>("featured");

  const filters = React.useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.badges ?? []))),
    [products],
  );

  const visible = React.useMemo(() => {
    let list = products;
    if (active.length) {
      list = list.filter((p) => p.badges?.some((b) => active.includes(b)));
    }
    if (sort === "price-asc") {
      list = [...list].sort((a, b) => a.priceFrom - b.priceFrom);
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => b.priceFrom - a.priceFrom);
    }
    return list;
  }, [products, active, sort]);

  function toggle(filter: string) {
    setActive((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  }

  return (
    <div>
      <div className="border-line flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = active.includes(filter);
            return (
              <button
                key={filter}
                type="button"
                onClick={() => toggle(filter)}
                aria-pressed={isActive}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] transition-colors",
                  isActive
                    ? "border-charcoal bg-charcoal text-canvas"
                    : "border-line text-graphite hover:border-ink hover:text-ink",
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <span className="text-muted text-[13px]">
            {visible.length} {visible.length === 1 ? "product" : "products"}
          </span>
          <label className="text-muted flex items-center gap-2 text-[13px]">
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="border-line bg-paper text-ink focus-visible:border-ink rounded-full border py-2 pr-8 pl-4 text-[13px] focus-visible:outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {visible.length ? (
        <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-4 py-16 text-center">
          <p className="font-display text-ink text-2xl">
            No products match yet
          </p>
          <p className="text-muted max-w-sm text-sm">
            Try removing a filter — or let guided buying find the right setup
            for your space.
          </p>
          <button
            type="button"
            onClick={() => setActive([])}
            className="text-ink decoration-line hover:decoration-ink text-sm underline underline-offset-4"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
