import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { formatPrice } from "@/lib/format";
import { getProductsBySupplier } from "@/lib/sanity/queries";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * New & Noteworthy — a horizontally scrolling rail of the furniture range, cheapest
 * first, on the same white panel as the category rail above it.
 *
 * The homepage previously went from picking a category straight into editorial
 * bands, so the only actual products a visitor met before roughly 3,000px were the
 * two pinned ones. This is the section that answers "what do you sell?" with stock
 * rather than with mood, and it earns its place by needing no editorial upkeep: it
 * is whatever was added last, so it is never stale.
 *
 * Cards are white on white, separated by a hairline border rather than a shadow —
 * shadows on white are the fastest way to make a page look like a template.
 *
 * Ordered cheapest to dearest, and drawn from the furniture range rather than the
 * whole catalogue. Two reasons. The lowest entry point is the easiest thing to say
 * yes to, so it belongs on the first card, and the prices climbing as someone swipes
 * is a gentler introduction than opening with a £1,190 chest of drawers — which
 * reads as "not for me" before anyone has scrolled. And a rail mixing a £6.95 bottle
 * of essential oil with a £5,279 sauna cabin describes no coherent shop; the
 * furniture is the range with enough depth to carry a rail on its own.
 *
 * Deliberately not a curated "featured" list either: that is a field somebody has to
 * remember to update, and a stale featured rail is worse than none. This orders
 * itself.
 */
/**
 * The supplier whose range fills this rail. An exact name, matched against the
 * supplier document — a `match` on a wildcard would quietly pick up a second
 * supplier with a similar name later and change what the homepage shows.
 */
const FURNITURE_SUPPLIER = "D.I. Designs";

export async function NewAndNoteworthy() {
  // Twelve is about three screens of swiping on a phone and two rows' worth of
  // choice on desktop — enough to feel like a range, short enough that the last
  // card is reachable.
  const products = (await getProductsBySupplier(FURNITURE_SUPPLIER, 12)).filter(
    (p) => p.slug,
  );

  // Nothing to show is not a section. An empty rail with a heading over it reads
  // as broken, where absence reads as nothing at all.
  if (products.length < 4) return null;

  return (
    <section className="bg-canvas text-ink border-line border-b">
      <div className="mx-auto max-w-[1440px] px-6 pt-10 pb-4 sm:px-8 lg:px-12 lg:pt-16">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-brass text-[11px] font-medium tracking-[0.24em] uppercase sm:text-[12px]">
              Just Landed
            </p>
            <h2 className="font-display mt-2 text-xl tracking-tight sm:text-2xl">
              New &amp; Noteworthy
            </h2>
          </div>
          <AppLink
            href="/shop/all"
            className="text-muted hover:text-ink flex shrink-0 items-center gap-2 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors"
          >
            View All <span aria-hidden>→</span>
          </AppLink>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] pb-12 lg:pb-16">
        <ul
          data-lenis-prevent
          className="flex touch-pan-x snap-x snap-proximity scroll-px-6 [scrollbar-width:none] gap-3 overflow-x-auto overscroll-x-contain px-6 pb-2 sm:scroll-px-8 sm:gap-5 sm:px-8 lg:scroll-px-12 lg:px-12 [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <li
              key={product.slug}
              className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%] xl:w-[19%]"
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: SanityProduct }) {
  const primary =
    product.cardImageSquare ?? product.cardImage ?? product.image ?? null;
  const lifestyle = product.studioImageSquare ?? product.studioImage ?? null;
  const isNew = product.stockStatus === "Coming Soon";

  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className="group block"
    >
      <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-lg border">
        {primary ? (
          <Image
            src={primary}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 19vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : null}
        {/* The lifestyle shot on hover, where one exists. Same behaviour as the
            shop grid, so a card behaves identically wherever it appears. */}
        {lifestyle ? (
          <Image
            src={lifestyle}
            alt=""
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 19vw"
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : null}
        {/* A word, not a sticker. Discount-style badges are the single loudest
            signal that a shop is not a premium one, so this is a hairline chip in
            the brand's own register and it only appears when it is true. */}
        {isNew ? (
          <span className="border-line bg-canvas/90 text-ink absolute top-2 left-2 border px-2 py-1 text-[9px] font-semibold tracking-[0.14em] uppercase backdrop-blur-sm">
            Coming Soon
          </span>
        ) : null}
      </div>
      <p className="text-ink group-hover:text-brass mt-3 line-clamp-2 text-[13px] leading-snug font-medium transition-colors sm:text-[14px]">
        {product.name}
      </p>
      <p className="text-muted mt-1 text-[12px] sm:text-[13px]">
        {formatPrice(product.price)}
      </p>
    </AppLink>
  );
}
