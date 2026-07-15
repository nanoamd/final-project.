"use client";

import {
  Armchair,
  Flame,
  Heart,
  type LucideIcon,
  Scale,
  Share2,
  Square,
  Star,
  Sun,
  Trees,
  Truck,
} from "lucide-react";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { formatPriceExact } from "@/lib/format";
import type { SanityProduct } from "@/types/sanity-content";

const FEATURE_ICONS: LucideIcon[] = [Trees, Square, Armchair, Flame, Sun];

export function ProductSummary({ product }: { product: SanityProduct }) {
  const [selected, setSelected] = React.useState<Record<string, number>>(() =>
    Object.fromEntries((product.options ?? []).map((o) => [o.label, 0])),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-brass text-[12px] font-semibold tracking-[0.18em] uppercase">
          {product.categoryName}
        </p>
        <h1 className="text-ink font-display mt-2 text-4xl leading-[1.04] tracking-tight text-balance sm:text-[2.75rem]">
          {product.name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {typeof product.rating === "number" ? (
            <div className="flex items-center gap-2.5">
              <StarRating rating={product.rating} />
              <span className="text-ink text-[14px] font-medium">
                {product.rating.toFixed(1)}
              </span>
              {product.reviewCount ? (
                <span className="text-muted text-[13px]">
                  ({product.reviewCount} reviews)
                </span>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          {product.sku ? (
            <span className="text-muted text-[12px] tracking-[0.08em] uppercase">
              SKU: {product.sku}
            </span>
          ) : null}
        </div>
      </div>

      <p className="text-graphite max-w-prose text-[15px] leading-relaxed">
        {product.summary}
      </p>

      <ul className="border-line grid gap-3 border-y py-6">
        {product.highlights.map((highlight, i) => {
          const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length] ?? Trees;
          return (
            <li key={highlight} className="flex items-center gap-3 text-[14px]">
              <Icon
                className="text-ink/50 size-[18px] shrink-0"
                strokeWidth={1.5}
                aria-hidden
              />
              <span className="text-graphite">{highlight}</span>
            </li>
          );
        })}
      </ul>

      {product.options?.map((option) => (
        <div key={option.label}>
          <p className="text-muted mb-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
            {option.label}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {option.values.map((value, index) => {
              const active = selected[option.label] === index;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setSelected((s) => ({ ...s, [option.label]: index }))
                  }
                  className={`rounded-lg border px-4 py-2.5 text-[13px] transition-colors ${
                    active
                      ? "border-brass text-ink bg-brass/[0.06]"
                      : "border-line text-graphite hover:border-ink/40"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="border-line border-t pt-6">
        <p className="text-ink text-[1.9rem] leading-none font-medium">
          {formatPriceExact(product.price)}
        </p>
        <p className="text-muted mt-2 text-[13px]">
          Tax included. Shipping calculated at checkout.
        </p>
        <div className="text-graphite mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          <span className="flex items-center gap-2">
            <Truck className="text-ink/50 size-[18px]" strokeWidth={1.5} aria-hidden />
            {product.stockStatus}
          </span>
          {product.deliveryLeadTime ? (
            <span className="text-muted">Delivered in {product.deliveryLeadTime}</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="bg-ink hover:bg-ink/90 text-canvas flex h-13 w-full items-center justify-center rounded-lg text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
        >
          Add to Basket
        </button>
        <AppLink
          href="/quote"
          className="border-ink/25 text-ink hover:border-ink flex h-13 w-full items-center justify-center rounded-lg border text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
        >
          Request a Quote
        </AppLink>
      </div>

      <div className="text-muted flex items-center justify-center gap-8 text-[12px]">
        <AppLink
          href="/compare"
          className="hover:text-ink flex items-center gap-2 transition-colors"
        >
          <Scale className="size-4" strokeWidth={1.5} aria-hidden /> Compare
        </AppLink>
        <button
          type="button"
          className="hover:text-ink flex items-center gap-2 transition-colors"
        >
          <Share2 className="size-4" strokeWidth={1.5} aria-hidden /> Share
        </button>
        <button
          type="button"
          className="hover:text-ink flex items-center gap-2 transition-colors"
        >
          <Heart className="size-4" strokeWidth={1.5} aria-hidden /> Save for later
        </button>
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span className="relative inline-flex" aria-hidden>
      <span className="text-ink/20 flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-[15px]" fill="currentColor" stroke="none" />
        ))}
      </span>
      <span
        className="text-brass absolute inset-0 flex overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-[15px] shrink-0" fill="currentColor" stroke="none" />
        ))}
      </span>
    </span>
  );
}
