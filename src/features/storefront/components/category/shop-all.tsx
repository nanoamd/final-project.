import Image from "next/image";

import { PromoBanner } from "@/components/shared/promo-banner";
import { ShopDrillNav } from "@/components/shared/shop-drill-nav";
import { AppLink } from "@/components/ui/app-link";
import { formatPrice } from "@/lib/format";
import { categoryInRoom } from "@/lib/sanity/category-rooms";
import {
  getAllProducts,
  getCategories,
  getDepartments,
  getProductsByCategory,
  getProductsByDepartment,
} from "@/lib/sanity/queries";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Shop All — the white shopping page, and now the default destination for every
 * category and room URL.
 *
 * One dense grid, no sidebar. It used to be the counterpart to the dark editorial
 * room pages, reachable only at `/shop/<something>/all`; the dark page owned the
 * clean URL and therefore owned every tap from the nav and the homepage. That is
 * reversed: `/shop/[category]` and `/shop/room/[room]` render this, and the dark
 * CollectionIndex remains the `/shop` index for deliberate browsing.
 *
 * With no `roomSlug` it lists the entire catalogue, which is what /shop/all
 * renders.
 */
export async function ShopAll({
  roomSlug,
  categorySlug,
  styleTag,
}: {
  roomSlug?: string;
  categorySlug?: string;
  /** From `?style=` — the drill-nav's third tier links to it, and before this
   *  page owned the category route the filter was applied by CollectionIndex.
   *  Without it here, tapping a style tag returned the unfiltered category and
   *  looked like the filter did nothing. */
  styleTag?: string;
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
        (!siblingRoom || categoryInRoom(c, siblingRoom.slug)),
    )
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 6);

  /**
   * On a room page, products are grouped under their category with a heading each.
   *
   * Living Room holds 58 products. As one grid that is a wall a phone shopper
   * scrolls past without landing anywhere — sofas, lamps, chests and side tables
   * interleaved by creation date, which is the order they happened to be imported
   * in and means nothing to anyone. Grouped, the same page reads as a set of
   * shelves: Coffee Tables, Sofas, TV Units.
   *
   * Only on room pages. A category page is already one group, and heading it with
   * its own name would just repeat the h1 above.
   *
   * Groups follow the categories' own display order, so Studio controls the
   * sequence. A product is filed under its primary category when that category
   * belongs to this room, and otherwise under whichever of its categories does —
   * a teak bench whose primary category is Garden Furniture appears under Garden
   * Furniture here, not under a heading from a different room.
   */
  const grouped =
    room && !categorySlug
      ? categories
          .filter((c) => categoryInRoom(c, room.slug) && !c.excludeFromRoomGrid)
          .map((c) => ({
            category: c,
            products: products.filter(
              (p) =>
                p.category === c.slug ||
                (p.additionalCategorySlugs ?? []).includes(c.slug),
            ),
          }))
          .filter((group) => group.products.length > 0)
      : [];

  // Anything the grouping missed keeps its place rather than vanishing — a product
  // whose category is not attached to this room would otherwise be counted in the
  // header and then rendered nowhere.
  const groupedSlugs = new Set(
    grouped.flatMap((g) => g.products.map((p) => p.slug)),
  );
  const ungrouped = grouped.length
    ? products.filter((p) => !groupedSlugs.has(p.slug))
    : [];

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <PromoBanner>
        Get 10% OFF your first order. Join the Kaiku Home newsletter.
      </PromoBanner>

      {/* No "/all" suffix any more. The room and category routes themselves now
          render this page, so the clean URL is the shopping URL — appending /all
          would send a shopper to a duplicate of the page they are already on. */}
      <ShopDrillNav rooms={rooms} categories={categories} theme="light" />

      <div className="mx-auto max-w-[1480px] px-6 py-10 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {category?.name ?? room?.name ?? "All Products"}
          </h1>
          <p className="text-muted shrink-0 text-[13px]">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* An applied filter has to be visible and removable. The count alone
            does not tell a shopper why they are seeing eleven products instead
            of forty. */}
        {styleTag && categorySlug ? (
          <div className="-mt-4 mb-8 flex items-center gap-2">
            <span className="text-muted text-[12px] tracking-[0.12em] uppercase">
              Filtered by
            </span>
            <AppLink
              href={`/shop/${categorySlug}`}
              className="border-ink/25 text-ink hover:border-ink flex items-center gap-2 rounded-none border px-3 py-1.5 text-[12px] font-medium transition-colors"
            >
              {styleTag}
              <span aria-hidden className="text-muted">
                ×
              </span>
            </AppLink>
          </div>
        ) : null}

        {products.length ? (
          grouped.length ? (
            <div className="flex flex-col gap-12">
              {grouped.map((group) => (
                <section key={group.category.slug}>
                  {/* The heading links to the category's own page, so a shopper who
                      recognises the group they want can narrow to it in one tap
                      rather than scrolling the rest of the room. */}
                  <div className="border-line mb-5 flex items-end justify-between gap-4 border-b pb-3">
                    <h2 className="font-display text-xl tracking-tight sm:text-2xl">
                      <AppLink
                        href={`/shop/${group.category.slug}`}
                        className="hover:text-brass transition-colors"
                      >
                        {group.category.name}
                      </AppLink>
                    </h2>
                    <p className="text-muted shrink-0 text-[12px]">
                      {group.products.length}
                    </p>
                  </div>
                  <ProductGrid products={group.products} />
                </section>
              ))}
              {ungrouped.length ? (
                <section>
                  <div className="border-line mb-5 border-b pb-3">
                    <h2 className="font-display text-xl tracking-tight sm:text-2xl">
                      More in {room?.name}
                    </h2>
                  </div>
                  <ProductGrid products={ungrouped} />
                </section>
              ) : null}
            </div>
          ) : (
            <ProductGrid products={products} />
          )
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
                  href={`/shop/room/${siblingRoom.slug}`}
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
                      href={`/shop/${c.slug}`}
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

/**
 * The product grid.
 *
 * Three across on mobile rather than two, with tighter gutters. Two columns of
 * large tiles meant roughly four products per screen; three fits about nine, so
 * the catalogue can be scanned by scrolling instead of paged through. Every width
 * from sm up keeps the gutters and column counts it already had.
 */
function ProductGrid({ products }: { products: SanityProduct[] }) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-5 xl:grid-cols-6">
      {products.map((product) => (
        <ShopAllTile key={product.slug} product={product} />
      ))}
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
        {(product.hoverImageSquare ?? product.hoverImage) ? (
          <Image
            src={(product.hoverImageSquare ?? product.hoverImage)!}
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
