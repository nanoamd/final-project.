"use client";

import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { parseCapacityRange } from "@/lib/capacity";
import { formatPrice } from "@/lib/format";
import type { SanityProduct } from "@/types/sanity-content";

const PEOPLE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

interface Match {
  product: SanityProduct;
  range: { min: number; max: number };
}

/**
 * Deterministic, no-AI capacity calculator, shared across every department
 * that sells by "how many people" (saunas, cold plunges, and whatever's
 * next) — matches real in-stock products by parsing each one's own
 * "Capacity" spec rather than a separate hardcoded taxonomy, so the
 * recommendation always traces back to a real spec on a real product.
 */
export function CapacityMatchCalculator({
  products,
  noun,
  extraSpecLabel,
  minPeople = 2,
}: {
  products: SanityProduct[];
  /** Singular noun for copy, e.g. "sauna", "cold plunge". */
  noun: string;
  /** An additional real spec to surface on each match, e.g. "Water volume". */
  extraSpecLabel?: string;
  minPeople?: number;
}) {
  const [people, setPeople] = React.useState<number | null>(null);
  const peopleOptions = PEOPLE_OPTIONS.filter((n) => n >= minPeople);
  const maxOption = peopleOptions[peopleOptions.length - 1];

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
        {peopleOptions.map((n) => (
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
            {n === maxOption ? `${n}+` : n}
          </button>
        ))}
      </div>

      {people ? (
        <div className="mt-10">
          {matches.length ? (
            <>
              <p className="text-ink font-display text-xl">
                {matches.length} {noun}
                {matches.length > 1 ? "s" : ""} fit{" "}
                {people === maxOption ? `${people} or more` : people} people
              </p>
              <ul className="mt-6 flex flex-col gap-4">
                {matches.map(({ product, range }) => {
                  const extraSpec = extraSpecLabel
                    ? product.specs.find(
                        (spec) =>
                          spec.label.toLowerCase() ===
                          extraSpecLabel.toLowerCase(),
                      )
                    : undefined;
                  return (
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
                            {extraSpec ? ` · ${extraSpec.value}` : ""}
                          </p>
                        </div>
                        <p className="text-ink font-display shrink-0 text-[17px]">
                          {formatPrice(product.price)}
                        </p>
                      </AppLink>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-muted text-[15px] leading-relaxed">
              Nothing in stock fits{" "}
              {people === maxOption ? `${people} or more` : people} people right
              now — check back soon, or{" "}
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
