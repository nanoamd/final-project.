import Image from "next/image";

import { PromoBanner } from "@/components/shared/promo-banner";
import { ShopDrillNav } from "@/components/shared/shop-drill-nav";
import { AppLink } from "@/components/ui/app-link";
import { formatPrice } from "@/lib/format";
import {
  getAllProducts,
  getCategories,
  getDepartments,
  getProductsByCategory,
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
export async function ShopAll({
  roomSlug,
  categorySlug,
}: {
  roomSlug?: string;
  categorySlug?: string;
}) {
  const [rooms, categories, products] = await Promise.all([
    getDepartments(),
    getCategories(),
    categorySlug
      ? getProductsByCategory(categorySlug, { limit: 200 })
      : roomSlug
        ? getProductsByDepartment(roomSlug)
        : getAllProducts(),
  ]);
  const room = roomSlug ? rooms.find((r) => r.slug === roomSlug) : undefined;
  const category = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  // Onward routes for the empty state below. The owning room comes from the
  // category when we're on a category page, so "All <Room>" is offered even
  // though roomSlug is absent. Siblings are restricted to stocked categories in
  // the same room, so a visitor can never be sent from one empty page to
  // another, and capped at six so the empty state stays a signpost.
  const siblingRoom =
    room ?? rooms.find((r) => r.slug === category?.departmentSlug);
  const stockedSiblings = categories
    .filter(
      (c) =>
        c.slug !== categorySlug &&
        (c.productCount ?? 0) > 0 &&
        (!siblingRoom || c.departmentSlug === siblingRoom.slug),
    )
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 6);

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
            {category?.name ?? room?.name ?? "All Products"}
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
          /* An empty catalogue must still offer somewhere to go. 21 of 36
             categories currently hold no products, and on mobile a category
             tile now links straight here — so without these onward links this
             page is where an interested visitor stops, having tapped exactly
             the thing they wanted. The sibling list is filtered to stocked
             categories only, so it can never point at another empty page. */
          <div className="border-line flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
            <p className="font-display text-2xl">
              {category?.name ?? room?.name ?? "This catalogue"} — coming soon
            </p>
            <p className="text-muted mt-3 max-w-sm text-[14px] leading-relaxed">
              We’re curating this range now. In the meantime, here’s what we do
              have.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <AppLink
                href="/shop/all"
                className="bg-ink text-canvas hover:bg-ink/90 flex h-11 items-center rounded-md px-5 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
              >
                All Products
              </AppLink>
              {siblingRoom ? (
                <AppLink
                  href={`/shop/room/${siblingRoom.slug}/all`}
                  className="border-line text-ink hover:border-ink/50 flex h-11 items-center rounded-md border px-5 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
                >
                  All {siblingRoom.name}
                </AppLink>
              ) : null}
            </div>

            {stockedSiblings.length ? (
              <div className="mt-8 w-full max-w-md">
                <p className="text-muted text-[11px] font-medium tracking-[0.16em] uppercase">
                  In stock nearby
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {stockedSiblings.map((c) => (
                    <AppLink
                      key={c.slug}
                      href={`/shop/${c.slug}/all`}
                      className="border-line text-ink hover:border-ink/50 rounded-full border px-3.5 py-2 text-[13px] transition-colors"
                    >
                      {c.name}{" "}
                      <span className="text-muted">({c.productCount})</span>
                    </AppLink>
                  ))}
                </div>
              </div>
            ) : null}
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
