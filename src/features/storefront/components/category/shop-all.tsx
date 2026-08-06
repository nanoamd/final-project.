import Image from "next/image";

import { PromoBanner } from "@/components/shared/promo-banner";
import { ShopDrillNav } from "@/components/shared/shop-drill-nav";
import { AppLink } from "@/components/ui/app-link";
import { formatPrice } from "@/lib/format";
import {
  getAllProducts,
  getCategories,
  getDepartments,
  getProductsByDepartment,
} from "@/lib/sanity/queries";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Shop All — the white, commercial-browsing counterpart to the black room
 * pages. One dense grid, no sidebar. Distinct from the room page's editorial
 * black ground on purpose — the contrast signals "you've moved from
 * inspiration to buying." The room/category/style drill-nav stays on this page
 * when switching rooms (links to the `/all` route, not the dark room page).
 *
 * With no `roomSlug` it lists the entire catalogue, which is what /shop/all
 * renders. Reaching the full product list previously meant picking a room
 * first, so there was no single URL for "everything you sell".
 */
export async function ShopAll({ roomSlug }: { roomSlug?: string }) {
  const [rooms, categories, products] = await Promise.all([
    getDepartments(),
    getCategories(),
    roomSlug ? getProductsByDepartment(roomSlug) : getAllProducts(),
  ]);
  const room = roomSlug ? rooms.find((r) => r.slug === roomSlug) : undefined;

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <PromoBanner>
        Get 10% OFF your first order. Join the Kaiku Home newsletter.
      </PromoBanner>

      <ShopDrillNav
        rooms={rooms}
        categories={categories}
        theme="light"
        roomHrefSuffix="/all"
      />

      <div className="mx-auto max-w-[1480px] px-6 py-10 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {room?.name ?? "All Products"}
          </h1>
          <p className="text-muted shrink-0 text-[13px]">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Three across on mobile rather than two, with tighter gutters. Two
            columns of large tiles meant roughly four products per screen;
            three fits about nine, so the catalogue can be scanned by scrolling
            instead of paged through. Every width from sm up keeps the gutters
            and column counts it already had. */}
        {products.length ? (
          <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-5 xl:grid-cols-6">
            {products.map((product) => (
              <ShopAllTile key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="border-line flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-24 text-center">
            <p className="font-display text-2xl">
              {room ? `${room.name} — coming soon` : "No products yet"}
            </p>
            <p className="text-muted mt-3 max-w-sm text-[14px] leading-relaxed">
              {room
                ? "We’re curating this room’s catalogue now — check back soon."
                : "The catalogue is being set up — check back soon."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ShopAllTile({ product }: { product: SanityProduct }) {
  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className="group block"
    >
      <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-lg border">
        {(product.cardImageSquare ?? product.cardImage ?? product.image) ? (
          <Image
            src={
              (product.cardImageSquare ?? product.cardImage ?? product.image)!
            }
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 18vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : null}
        {(product.studioImageSquare ?? product.studioImage) ? (
          <Image
            src={(product.studioImageSquare ?? product.studioImage)!}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 18vw"
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : null}
      </div>
      {/* Clamped to two lines on mobile only. At three columns a tile is
          ~100px wide, and these titles carry size and supplier detail
          ("… | 30 x 20 x 5cm | Kaiku"), so an unclamped name ran to five or
          six lines and pushed the next row of images off the screen — which
          would have undone the point of the denser grid. Full title still
          shows from sm up, and on the product page itself. */}
      <p className="text-ink group-hover:text-brass mt-2 line-clamp-2 text-[12px] leading-snug font-medium transition-colors sm:mt-3 sm:line-clamp-none sm:text-[14px]">
        {product.name}
      </p>
      <p className="text-muted mt-1 text-[11px] sm:text-[13px]">
        From {formatPrice(product.price)}
      </p>
    </AppLink>
  );
}
