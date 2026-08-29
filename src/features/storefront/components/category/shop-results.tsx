import { PortableText } from "@portabletext/react";

import { FilterBar } from "@/components/shared/filter-bar";
import { AppLink } from "@/components/ui/app-link";
import {
  applyShopQuery,
  describeQuery,
  type ShopQuery,
  variantImageForQuery,
} from "@/lib/catalog/shop-query";
import { formatPrice } from "@/lib/format";
import { portableTextComponents } from "@/lib/sanity/portable-text-components";
import type {
  SanityCategory,
  SanityProduct,
  SanityProductGalleryImage,
} from "@/types/sanity-content";

import { ProductCardImage } from "./product-card-image";

/**
 * A product as the grid and the filters need it, and no more.
 *
 * These props are serialised into the page for the client component that
 * applies the filters, so every field here is paid for twice — once in the
 * rendered HTML and again in the flight payload. The full `SanityProduct`
 * carries the rich-text description, the spec table, the FAQs, the SEO block
 * and the downloads; sending all of it took the Lighting page to 2MB, of which
 * the grid used a fraction.
 */
export type ShopTileProduct = Pick<
  SanityProduct,
  | "slug"
  | "name"
  | "category"
  | "price"
  | "additionalCategorySlugs"
  | "cardImage"
  | "cardImageSquare"
  | "hoverImage"
  | "hoverImageSquare"
  | "image"
  | "stockStatus"
  | "colourTags"
  | "materialTags"
  | "styleTags"
  | "roomTags"
  | "useTags"
> & {
  /** Only the fields the colour-variant photo lookup reads. */
  gallery: Pick<SanityProductGalleryImage, "url" | "optionValue">[];
};

/** Drops everything the grid and the facets never look at. */
export function toShopTile(product: SanityProduct): ShopTileProduct {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: product.price,
    additionalCategorySlugs: product.additionalCategorySlugs,
    cardImage: product.cardImage,
    cardImageSquare: product.cardImageSquare,
    hoverImage: product.hoverImage,
    hoverImageSquare: product.hoverImageSquare,
    image: product.image,
    stockStatus: product.stockStatus,
    colourTags: product.colourTags,
    materialTags: product.materialTags,
    styleTags: product.styleTags,
    roomTags: product.roomTags,
    useTags: product.useTags,
    gallery: (product.gallery ?? []).map((image) => ({
      url: image.url,
      optionValue: image.optionValue,
    })),
  };
}

export interface ShopResultsProps {
  /** The filters to apply. Everything here is a pure function of this plus `products`. */
  query: ShopQuery;
  /** The unfiltered set. Facet counts are computed from it, so ticking Black
   *  does not make every other swatch read as unavailable. */
  products: ShopTileProduct[];
  title: string;
  category?: SanityCategory | null;
  roomName?: string | null;
  categorySlug?: string;
  pathname: string;
  /**
   * Ordered categories to group the grid under, on a room page. Empty on a
   * category page, which is already one group.
   *
   * Passed as a list rather than as pre-built groups so the products are not
   * serialised twice — this component is rendered on the client after
   * hydration, and a room page holding 58 products would otherwise send all of
   * them down once in the grid and again inside the groups.
   */
  groupCategories: { slug: string; name: string }[];
  stockedSiblings: SanityCategory[];
  siblingRoom?: { slug: string; name: string } | null;
}

/**
 * Everything on a shop page that depends on the filters.
 *
 * Deliberately has no `"use client"` of its own, so it renders on the server
 * for the unfiltered case (which is every crawler and almost every first
 * visit) and on the client once a filter is applied. `ShopAll` puts the server
 * render in a Suspense fallback and the client one inside the boundary; the
 * markup is this one component either way, so the two can never drift.
 */
export function ShopResults({
  query,
  products,
  title,
  category,
  roomName,
  categorySlug,
  pathname,
  groupCategories,
  stockedSiblings,
  siblingRoom,
}: ShopResultsProps) {
  const visible = applyShopQuery(products, query);
  const filterDescription = describeQuery(query);

  const grouped = groupCategories
    .map((group) => ({
      category: group,
      products: products.filter(
        (product) =>
          product.category === group.slug ||
          (product.additionalCategorySlugs ?? []).includes(group.slug),
      ),
    }))
    .filter((group) => group.products.length > 0);

  // Anything the grouping missed keeps its place rather than vanishing — a
  // product whose category is not attached to this room would otherwise be
  // counted in the header and then rendered nowhere.
  const groupedSlugs = new Set(
    grouped.flatMap((group) => group.products.map((product) => product.slug)),
  );
  const ungrouped = grouped.length
    ? products.filter((product) => !groupedSlugs.has(product.slug))
    : [];

  // The one facet that gets its own removable chip, because the drill-nav's
  // third tier links straight to it and a shopper arriving that way has not
  // seen the filter bar set itself.
  const styleTag = query.facets.style?.[0];

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4">
        <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-muted shrink-0 text-[13px]">
          {filterDescription
            ? `${visible.length} of ${products.length} products`
            : `${products.length} ${products.length === 1 ? "product" : "products"}`}
        </p>
      </div>

      {/* The category's own introduction, above the grid.
          Two or three paragraphs written for someone deciding what to buy. A
          grid with a heading over it ranks for nothing, because there is no text
          on the page for a query to match — this is the text it ranks on. Absent
          on a category nobody has written yet, so the page is unchanged there. */}
      {category?.intro?.length ? (
        <div className="mb-9 max-w-[68ch]">
          <PortableText
            value={category.intro}
            components={portableTextComponents}
          />
        </div>
      ) : null}

      {/* Only where there is enough to filter. On a category of three products
          a filter bar is furniture for its own sake, and it pushes the products
          themselves below the fold on a phone. */}
      {products.length >= 6 ? (
        <FilterBar products={products} query={query} pathname={pathname} />
      ) : null}

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

      {visible.length ? (
        grouped.length && !filterDescription ? (
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
                    More in {roomName}
                  </h2>
                </div>
                <ProductGrid products={ungrouped} />
              </section>
            ) : null}
          </div>
        ) : (
          // Grouping is dropped once a filter is on: a filtered set spread
          // across category headings reads as several small empty shelves
          // rather than one answer to what was asked for.
          <ProductGrid products={visible} query={query} />
        )
      ) : filterDescription ? (
        <NoFilterMatches pathname={pathname} description={filterDescription} />
      ) : (
        /* An empty catalogue must still offer somewhere to go. 21 of 36
           categories currently hold no products, and on mobile a category
           tile now links straight here — so without these onward links this
           page is where an interested visitor stops, having tapped exactly
           the thing they wanted. The sibling list is filtered to stocked
           categories only, so it can never point at another empty page. */
        <div className="border-line flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="font-display text-2xl">{title} — coming soon</p>
          <p className="text-muted mt-3 max-w-sm text-[14px] leading-relaxed">
            We&rsquo;re curating this range now. In the meantime, here&rsquo;s
            what we do have.
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
                {stockedSiblings.map((sibling) => (
                  <AppLink
                    key={sibling.slug}
                    href={`/shop/${sibling.slug}`}
                    className="border-line text-ink hover:border-ink/50 rounded-full border px-3.5 py-2 text-[13px] transition-colors"
                  >
                    {sibling.name}{" "}
                    <span className="text-muted">({sibling.productCount})</span>
                  </AppLink>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
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
function ProductGrid({
  products,
  query,
}: {
  products: ShopTileProduct[];
  /** Only so a filtered colour can pick its own photograph. Optional because
   *  the room-page groups render before any filter is applied. */
  query?: ShopQuery;
}) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-5 xl:grid-cols-6">
      {products.map((product) => (
        <ShopAllTile key={product.slug} product={product} query={query} />
      ))}
    </div>
  );
}

function ShopAllTile({
  product,
  query,
}: {
  product: ShopTileProduct;
  query?: ShopQuery;
}) {
  /**
   * When a colour is filtered, show that colour's photograph.
   *
   * The brief: "when users select black furniture, the black version should
   * appear — do not only show default images". A card answering a Black filter
   * with the white variant's photo is the shop appearing not to know its own
   * stock, at the exact moment a shopper is deciding whether to trust it.
   */
  const variant = query ? variantImageForQuery(product, query) : null;
  const base =
    variant ??
    product.cardImageSquare ??
    product.cardImage ??
    product.image ??
    null;

  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className="group block"
    >
      <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-lg border">
        {base ? (
          <ProductCardImage
            src={base}
            /* No hover swap while a variant photo is showing: the point of the
               variant is that the card answers the filter, and swapping to a
               different finish on hover would undo exactly that. */
            hoverSrc={
              variant ? null : (product.hoverImageSquare ?? product.hoverImage)
            }
            alt={product.name}
            /* Three columns on mobile, three at sm, five at lg, six at xl
               inside a 1480px container. This said 50vw below 640px, which is
               a two-column grid's figure — so every phone fetched an image
               half again as wide as the tile it went into, at 44KB instead of
               18KB, forty times over on a category page. */
            sizes="(max-width: 1024px) 33vw, (max-width: 1280px) 20vw, 250px"
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

/**
 * What a filtered grid says when nothing matches.
 *
 * Distinct from the empty-category state on purpose: this category *has*
 * products, the combination just excludes them all. Telling someone "coming
 * soon" here would be a lie, and offering them "browse all products" throws away
 * the narrowing they have done. Clearing the filters is the one useful action.
 */
function NoFilterMatches({
  pathname,
  description,
}: {
  pathname: string;
  description: string;
}) {
  return (
    <div className="border-line flex flex-col items-center rounded-none border border-dashed px-6 py-16 text-center">
      <p className="font-display text-2xl">Nothing matches that combination</p>
      <p className="text-muted mt-3 max-w-md text-[14px] leading-relaxed">
        No piece here is {description}. Loosen one of the filters and there will
        be — everything in this category is still a tap away.
      </p>
      <AppLink
        href={pathname}
        className="bg-ink text-canvas hover:bg-ink/90 mt-7 flex h-11 items-center rounded-none px-5 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
      >
        Clear the filters
      </AppLink>
    </div>
  );
}
