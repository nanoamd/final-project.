"use client";

import { ArrowUpRight, Loader2, type LucideIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { formatPrice } from "@/lib/format";
import { resolveIcon } from "@/lib/icons";
import { fetchCategoryProducts } from "@/server/actions/products";
import type {
  SanityCategory,
  SanityDepartment,
  SanityProduct,
} from "@/types/sanity-content";

/**
 * Room page's category grid — clicking a category expands its products
 * directly below the grid instead of navigating away, matching the black
 * editorial room page's "stay on the page" browsing mode (Shop All is the
 * separate white page for full commercial browsing). Only one category is
 * expanded at a time; products are fetched on demand and cached per category
 * so re-opening one already viewed is instant.
 */
export function CategoryAccordion({
  categories,
  room,
}: {
  categories: SanityCategory[];
  room?: SanityDepartment;
}) {
  const [expandedSlug, setExpandedSlug] = React.useState<string | null>(null);
  const [loadingSlug, setLoadingSlug] = React.useState<string | null>(null);
  const [productsBySlug, setProductsBySlug] = React.useState<
    Record<string, SanityProduct[]>
  >({});

  const handleSelect = (slug: string) => {
    if (expandedSlug === slug) {
      setExpandedSlug(null);
      return;
    }
    setExpandedSlug(slug);
    if (productsBySlug[slug]) return;
    setLoadingSlug(slug);
    fetchCategoryProducts(slug)
      .then((products) => {
        setProductsBySlug((prev) => ({ ...prev, [slug]: products }));
      })
      .finally(() => setLoadingSlug(null));
  };

  const expandedCategory = categories.find((c) => c.slug === expandedSlug);

  return (
    <div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryButton
            key={category.slug}
            category={category}
            icon={resolveIcon(category.iconName)}
            active={category.slug === expandedSlug}
            onSelect={() => handleSelect(category.slug)}
          />
        ))}
        {room ? (
          <ShopAllTile
            href={`/shop/room/${room.slug}/all`}
            roomName={room.name}
          />
        ) : null}
      </div>

      {expandedSlug ? (
        <div className="border-brass/30 bg-basalt-card/40 mt-8 rounded-xl border p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-canvas font-display text-xl">
              {expandedCategory?.name}
            </p>
            <AppLink
              href={`/shop/${expandedSlug}`}
              className="text-brass text-[12px] font-medium tracking-[0.1em] uppercase transition-colors hover:underline"
            >
              View full collection →
            </AppLink>
          </div>

          {loadingSlug === expandedSlug ? (
            <div className="flex items-center justify-center py-16">
              <Loader2
                className="text-brass size-6 animate-spin"
                strokeWidth={1.8}
              />
            </div>
          ) : productsBySlug[expandedSlug]?.length ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {productsBySlug[expandedSlug].map((product) => (
                <InlineProductTile key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-canvas/55 py-8 text-center text-[14px]">
              This category is being stocked — check back soon.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ShopAllTile({ href, roomName }: { href: string; roomName: string }) {
  return (
    <AppLink
      href={href}
      className="group border-brass/25 hover:border-brass bg-basalt-card/40 relative flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-xl border text-center transition-colors"
    >
      <span className="bg-brass text-basalt-deep flex size-12 items-center justify-center rounded-full transition-transform group-hover:scale-110">
        <ArrowUpRight className="size-6" strokeWidth={2} />
      </span>
      <span className="text-canvas font-display px-4 text-[16px] leading-tight">
        Shop All {roomName}
      </span>
    </AppLink>
  );
}

function CategoryButton({
  category,
  icon: Icon,
  active,
  onSelect,
}: {
  category: SanityCategory;
  icon: LucideIcon;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative block aspect-[4/3] overflow-hidden rounded-xl border text-left transition-colors ${
        active ? "border-brass" : "hover:border-brass/40 border-white/8"
      }`}
    >
      {category.image ? (
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
      ) : (
        <div className="from-basalt-card to-basalt absolute inset-0 flex items-center justify-center bg-gradient-to-br">
          <Icon
            className="text-brass/60 size-8"
            strokeWidth={1.2}
            aria-hidden
          />
        </div>
      )}
      <div className="from-basalt/95 via-basalt/20 absolute inset-0 bg-gradient-to-t to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-canvas font-display text-[18px] leading-tight">
          {category.name}
        </p>
        <p className="text-brass mt-1 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase">
          {category.productCount} Products
        </p>
      </div>
    </button>
  );
}

function InlineProductTile({ product }: { product: SanityProduct }) {
  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className="group hover:border-brass/40 relative block overflow-hidden rounded-lg border border-white/8 transition-colors"
    >
      <div className="relative aspect-[4/5]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="from-basalt-card to-basalt absolute inset-0 bg-gradient-to-br" />
        )}
      </div>
      <div className="p-3">
        <p className="text-canvas text-[13px] leading-tight font-medium">
          {product.name}
        </p>
        <p className="text-brass mt-1 text-[12px]">
          From {formatPrice(product.price)}
        </p>
      </div>
    </AppLink>
  );
}
