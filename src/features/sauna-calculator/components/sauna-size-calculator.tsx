"use client";

import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { formatPrice } from "@/lib/format";
import type { SanityProduct } from "@/types/sanity-content";

import { parseCapacityRange } from "../parse-capacity";

const PEOPLE_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

interface Match {
  product: SanityProduct;
  range: { min: number; max: number };
}

/**
 * Deterministic, no-AI tool: matches real in-stock saunas against how many
 * people will actually use it, by parsing each product's own "Capacity" spec
 * rather than a separate hardcoded taxonomy — the recommendation always
 * traces back to a real spec on a real product.
 */
export function SaunaSizeCalculator({
  products,
}: {
  products: SanityProduct[];
}) {
  const [people, setPeople] = React.useState<number | null>(null);

  const matches: Match[] = people
    ? products
        .map((product) => {
          const capacitySpec = product.specs.find(
            (spec) => spec.label.toLowerCase() === "capacity",
          );
          const range = capacitySpec
            ? parseCapacityRange(capacitySpec.value)
            : null;
          return range ? { product, range } : null;
        })
        .filter(
          (match): match is Match =>
            match !== null &&
            people >= match.range.min &&
            people <= match.range.max,
        )
        .sort((a, b) => a.product.price - b.product.price)
    : [];

  return (
    <div>
      <p className="text-muted text-[13px] font-medium tracking-[0.1em] uppercase">
        How many people, usually?
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {PEOPLE_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPeople(n)}
            className={`flex size-12 items-center justify-center rounded-full border text-[15px] font-medium transition-colors ${
              people === n
                ? "border-ink bg-ink text-canvas"
                : "border-line text-ink hover:border-ink"
            }`}
          >
            {n === 8 ? "8+" : n}
          </button>
        ))}
      </div>

      {people ? (
        <div className="mt-10">
          {matches.length ? (
            <>
              <p className="text-ink font-display text-xl">
                {matches.length} sauna{matches.length > 1 ? "s" : ""} fit{" "}
                {people === 8 ? "8 or more" : people} people
              </p>
              <ul className="mt-6 flex flex-col gap-4">
                {matches.map(({ product, range }) => (
                  <li key={product.slug}>
                    <AppLink
                      href={`/shop/${product.category}/${product.slug}`}
                      className="group border-line hover:border-ink flex items-center justify-between gap-4 rounded-xl border p-5 transition-colors"
                    >
                      <div>
                        <p className="text-ink group-hover:text-brass font-display text-[17px] transition-colors">
                          {product.name}
                        </p>
                        <p className="text-muted mt-1 text-[13px]">
                          Fits{" "}
                          {range.min === range.max
                            ? range.min
                            : `${range.min}–${range.max}`}{" "}
                          people
                        </p>
                      </div>
                      <p className="text-ink font-display shrink-0 text-[17px]">
                        {formatPrice(product.price)}
                      </p>
                    </AppLink>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted text-[15px] leading-relaxed">
              Nothing in stock fits {people === 8 ? "8 or more" : people} people
              right now — check back soon, or{" "}
              <AppLink href="/contact" className="text-brass">
                get in touch
              </AppLink>{" "}
              and we&rsquo;ll let you know when something does.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
