"use client";

import {
  Armchair,
  Flame,
  Heart,
  Lock,
  type LucideIcon,
  RotateCcw,
  Scale,
  Share2,
  Square,
  Star,
  Sun,
  Trees,
  Truck,
} from "lucide-react";
import * as React from "react";

import { Newsletter } from "@/components/shared/newsletter";
import { AppLink } from "@/components/ui/app-link";
import { GARDEN_VISUALISER_DEPARTMENT_SLUGS } from "@/config/garden-visualiser";
import { useCart } from "@/hooks/use-cart";
import { useSavedProducts } from "@/hooks/use-saved-products";
import { formatPriceExact } from "@/lib/format";
import { subscribeToNewsletter } from "@/server/actions/newsletter";
import type { SanityProduct } from "@/types/sanity-content";

const FEATURE_ICONS: LucideIcon[] = [Trees, Square, Armchair, Flame, Sun];

// Only ever reflects a real, editor-entered stockQuantity — most products
// don't set one, and this stays silent for those rather than inventing an
// urgency signal that isn't backed by real inventory data.
const LOW_STOCK_THRESHOLD = 5;

function isGardenRelevant(departmentSlug?: string | null): boolean {
  return Boolean(
    departmentSlug &&
    (GARDEN_VISUALISER_DEPARTMENT_SLUGS as readonly string[]).includes(
      departmentSlug,
    ),
  );
}

export function ProductSummary({
  product,
  selected,
  onSelectOption,
  displayImage,
}: {
  product: SanityProduct;
  /** Which value index is chosen per option label — owned by the parent
   * ProductDetailInteractive so the gallery can react to the same choice. */
  selected: Record<string, number>;
  onSelectOption: (label: string, index: number) => void;
  /** The photo currently shown in the gallery (post colour/option reorder) —
   * falls back to product.image so callers that don't track a live selection
   * still work. Without this, adding to basket after picking a colour saves
   * the product's original gallery[0] photo instead of the one the customer
   * actually just looked at. */
  displayImage?: string;
}) {
  const isComingSoon = product.stockStatus === "Coming Soon";
  const { addItem } = useCart();
  const { isSaved, toggle } = useSavedProducts();
  const [added, setAdded] = React.useState(false);
  const [shareState, setShareState] = React.useState<"idle" | "copied">("idle");
  const saved = isSaved(product.slug);
  const image = displayImage ?? product.image;

  function handleAddToBasket() {
    const selectedOptions = product.options?.length
      ? Object.fromEntries(
          product.options.map((option) => [
            option.label,
            option.values[selected[option.label] ?? 0] ?? option.values[0]!,
          ]),
        )
      : undefined;

    addItem({
      slug: product.slug,
      category: product.category,
      name: product.name,
      price: product.price,
      image,
      selectedOptions,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  function handleSaveForLater() {
    toggle({
      slug: product.slug,
      category: product.category,
      name: product.name,
      price: product.price,
      image,
    });
  }

  async function handleShare() {
    const url =
      typeof window !== "undefined" ? window.location.href : undefined;
    if (!url) return;
    // Native share sheet on mobile/supporting browsers; clipboard copy is
    // the honest fallback everywhere else, rather than a button that does
    // nothing if the Web Share API isn't available.
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
        return;
      } catch {
        // User cancelled the share sheet, or it failed — fall through to
        // clipboard so the button still does something useful.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // Clipboard access denied — nothing more we can do without a backend.
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-brass text-[12px] font-semibold tracking-[0.18em] uppercase">
            {product.categoryName}
          </p>
          <h1 className="text-ink font-display mt-2 text-4xl leading-[1.04] tracking-tight text-balance sm:text-[2.75rem]">
            {product.name}
          </h1>

          {product.rating && product.reviewCount ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < Math.round(product.rating!)
                        ? "fill-brass text-brass size-4"
                        : "text-line size-4"
                    }
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span className="text-muted text-[13px]">
                {product.rating.toFixed(1)} ({product.reviewCount}{" "}
                {product.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          ) : null}

          {product.sku ? (
            <p className="text-muted mt-4 text-[12px] tracking-[0.08em] uppercase">
              SKU: {product.sku}
            </p>
          ) : null}
        </div>

        <p className="text-graphite max-w-prose text-[15px] leading-relaxed">
          {product.summary}
        </p>

        <ul className="border-line grid gap-3 border-y py-6">
          {product.highlights.map((highlight, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length] ?? Trees;
            return (
              <li
                key={highlight}
                className="flex items-center gap-3 text-[14px]"
              >
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
            {/* The count alongside the label, so the page states how many
                choices there are rather than leaving the shopper to count
                swatches — "2 colours" next to COLOUR. Pluralised off the
                option's own label so a Size option reads "3 sizes"; a label
                that is already plural is left alone. */}
            <div className="mb-2.5 flex items-baseline justify-between gap-3">
              <p className="text-muted text-[11px] font-semibold tracking-[0.14em] uppercase">
                {option.label}
              </p>
              {option.values.length > 1 ? (
                <p className="text-muted/70 text-[11px]">
                  {option.values.length}{" "}
                  {option.label.toLowerCase().replace(/s$/, "")}s
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {option.values.map((value, index) => {
                const active = selected[option.label] === index;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelectOption(option.label, index)}
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
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <div className="flex items-baseline gap-3">
              <p className="text-ink text-[1.9rem] leading-none font-medium">
                {formatPriceExact(product.price)}
              </p>
              <p className="text-muted text-[1.15rem] leading-none line-through">
                {formatPriceExact(product.compareAtPrice)}
              </p>
            </div>
          ) : (
            <p className="text-ink text-[1.9rem] leading-none font-medium">
              {formatPriceExact(product.price)}
            </p>
          )}
          <p className="text-muted mt-2 text-[13px]">
            Tax included. Shipping calculated at checkout.
          </p>
          <div className="text-graphite mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
            <span className="flex items-center gap-2">
              <Truck
                className="text-ink/50 size-[18px]"
                strokeWidth={1.5}
                aria-hidden
              />
              {product.stockStatus}
            </span>
            {product.deliveryLeadTime ? (
              <span className="text-muted">
                Delivered in {product.deliveryLeadTime}
              </span>
            ) : null}
          </div>
          {product.stockStatus === "In Stock" &&
          typeof product.stockQuantity === "number" &&
          product.stockQuantity > 0 &&
          product.stockQuantity <= LOW_STOCK_THRESHOLD ? (
            <p className="mt-2 text-[13px] font-medium text-amber-700">
              Only {product.stockQuantity} left in stock
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {isComingSoon ? (
            <div className="border-line bg-sand/20 rounded-lg border p-5">
              <p className="text-ink text-[13px] font-semibold tracking-[0.04em]">
                Still in production
              </p>
              <p className="text-graphite mt-1.5 text-[13px] leading-relaxed">
                This one isn&rsquo;t available to order yet. Sign up and
                we&rsquo;ll email you the moment it&rsquo;s ready.
              </p>
              <Newsletter
                tone="light"
                className="mt-4"
                onSubscribe={subscribeToNewsletter}
              />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAddToBasket}
                className="bg-ink hover:bg-ink/90 text-canvas flex h-13 w-full items-center justify-center rounded-lg text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
              >
                {added ? "Added ✓" : "Add to Basket"}
              </button>
              <AppLink
                href="/quote"
                className="border-ink/25 text-ink hover:border-ink flex h-13 w-full items-center justify-center rounded-lg border text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
              >
                Request a Quote
              </AppLink>
            </>
          )}
          {isGardenRelevant(product.departmentSlug) ? (
            <AppLink
              href={`/tools/garden-visualiser?product=${product.slug}`}
              className="border-ink/25 text-ink hover:border-ink flex h-13 w-full items-center justify-center rounded-lg border text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
            >
              See it in your garden
            </AppLink>
          ) : null}
        </div>

        {!isComingSoon ? (
          <div className="text-muted flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5" strokeWidth={1.5} aria-hidden />
              Secure checkout
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="size-3.5" strokeWidth={1.5} aria-hidden />
              14-day returns
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="size-3.5" strokeWidth={1.5} aria-hidden />
              UK-based team
            </span>
          </div>
        ) : null}

        <div className="text-muted flex items-center justify-center gap-8 text-[12px]">
          <AppLink
            href="/compare"
            className="hover:text-ink flex items-center gap-2 transition-colors"
          >
            <Scale className="size-4" strokeWidth={1.5} aria-hidden /> Compare
          </AppLink>
          <button
            type="button"
            onClick={handleShare}
            className="hover:text-ink flex items-center gap-2 transition-colors"
          >
            <Share2 className="size-4" strokeWidth={1.5} aria-hidden />
            {shareState === "copied" ? "Link copied ✓" : "Share"}
          </button>
          <button
            type="button"
            onClick={handleSaveForLater}
            aria-pressed={saved}
            className="hover:text-ink flex items-center gap-2 transition-colors"
          >
            <Heart
              className={saved ? "fill-brass text-brass size-4" : "size-4"}
              strokeWidth={1.5}
              aria-hidden
            />
            {saved ? "Saved ✓" : "Save for later"}
          </button>
        </div>
      </div>

      {/* Mobile only — the full CTA above sits below the gallery, options
          and highlights, so on a phone it can be a full scroll away. This
          keeps buying reachable at all times without duplicating the
          desktop layout. */}
      {!isComingSoon ? (
        <div className="border-line bg-canvas/95 fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t p-3 backdrop-blur-md lg:hidden">
          <p className="text-ink shrink-0 pl-1 text-[15px] font-medium">
            {formatPriceExact(product.price)}
          </p>
          <button
            type="button"
            onClick={handleAddToBasket}
            className="bg-ink hover:bg-ink/90 text-canvas flex h-12 flex-1 items-center justify-center rounded-lg text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
          >
            {added ? "Added ✓" : "Add to Basket"}
          </button>
        </div>
      ) : null}
    </>
  );
}
