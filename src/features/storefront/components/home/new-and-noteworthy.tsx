import { AppLink } from "@/components/ui/app-link";
import { ProductCardImage } from "@/features/storefront/components/category/product-card-image";
import { selectRailProducts } from "@/lib/catalog/product-rail";
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
 * The suppliers this rail draws on, in order of preference.
 *
 * Exact names, matched against the supplier document — a `match` on a wildcard
 * would quietly pick up a second supplier with a similar name later and change
 * what the homepage shows.
 *
 * Premier Housewares leads because Damien asked for it and because it is the
 * broadest range in the shop: 84 live products across roughly twenty
 * categories, which is what makes "one of each type" possible at all. D.I.
 * Designs follows so the rail still fills if the first range thins out.
 */
const RAIL_SUPPLIERS = ["Premier Housewares", "D.I. Designs"];

/**
 * Eighteen, up from twelve.
 *
 * Damien: *"you can make the scroll bar longer too"*. At roughly a fifth of
 * the viewport per card this is three and a half screens of swiping on
 * desktop, and the selection below has enough distinct categories to fill it
 * without repeating a type.
 */
const RAIL_SIZE = 18;

export async function NewAndNoteworthy() {
  // A wide pool rather than the first N: the selection below needs to see the
  // whole range to pick one of each type, and taking twelve up front is what
  // produced a rail of four near-identical lamps.
  const pool = (
    await Promise.all(
      RAIL_SUPPLIERS.map((supplier) => getProductsBySupplier(supplier, 200)),
    )
  ).flat();

  const products = selectRailProducts(pool, RAIL_SIZE);

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
  const lifestyle = product.hoverImageSquare ?? product.hoverImage ?? null;
  const isNew = product.stockStatus === "Coming Soon";

  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className="group block"
    >
      <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-lg border">
        {/* Same treatment as the shop grid, so a card behaves identically
            wherever it appears: the whole product rather than a crop of its
            middle, and the lifestyle shot only downloaded on hover. */}
        {primary ? (
          <ProductCardImage
            src={primary}
            hoverSrc={lifestyle}
            alt={product.name}
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 19vw"
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
