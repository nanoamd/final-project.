import { PortableText } from "@portabletext/react";
import Image from "next/image";

import { FilterBar } from "@/components/shared/filter-bar";
import { PromoBanner } from "@/components/shared/promo-banner";
import { ShopDrillNav } from "@/components/shared/shop-drill-nav";
import { AppLink } from "@/components/ui/app-link";
import {
  applyShopQuery,
  describeQuery,
  parseShopQuery,
  type ShopQuery,
  variantImageForQuery,
} from "@/lib/catalog/shop-query";
import { formatPrice } from "@/lib/format";
import { categoryInRoom } from "@/lib/sanity/category-rooms";
import { portableTextComponents } from "@/lib/sanity/portable-text-components";
import {
  getAllProducts,
  getCategories,
  getDepartments,
  getProductsByCategory,
  getProductsByDepartment,
} from "@/lib/sanity/queries";
import type { SanityCategory, SanityProduct } from "@/types/sanity-content";

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
  searchParams,
}: {
  roomSlug?: string;
  categorySlug?: string;
  /** From `?style=` — the drill-nav's third tier links to it, and before this
   *  page owned the category route the filter was applied by CollectionIndex.
   *  Without it here, tapping a style tag returned the unfiltered category and
   *  looked like the filter did nothing. */
  styleTag?: string;
  /**
   * The raw query string, for the filters. Passed down rather than read here so
   * this stays one server component with no client bundle — see
   * src/lib/catalog/shop-query.ts for why the filters are URL-driven at all.
   */
  searchParams?: Record<string, string | string[] | undefined>;
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

  /**
   * The filters.
   *
   * `products` stays the unfiltered set on purpose — the facet counts are
   * computed from it, so ticking Black does not make every other swatch read as
   * unavailable. `visible` is what actually renders.
   *
   * The path is rebuilt rather than read from a hook because this is a server
   * component: `usePathname` would force the whole page into a client bundle for
   * the sake of a string we already know.
   */
  const query = parseShopQuery(searchParams ?? {});
  const pathname = categorySlug
    ? `/shop/${categorySlug}`
    : roomSlug
      ? `/shop/room/${roomSlug}`
      : "/shop/all";
  const visible = applyShopQuery(products, query);
  const filterDescription = describeQuery(query);

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
                      More in {room?.name}
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
          <NoFilterMatches
            pathname={pathname}
            description={filterDescription}
          />
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

        {/* Everything below the grid: how to choose, the questions people ask, and
            where to go next. Below rather than above because someone who arrived
            here wants the products first — but it is in the same document, which is
            all a crawler cares about. */}
        <CategoryContent category={category} />
      </div>
    </div>
  );
}

/**
 * Buying guidance, FAQs and related categories.
 *
 * The three things the brief asks every category page to carry beyond its grid,
 * and the reason a category can rank for "how to choose a coffee table" rather
 * than only for its own name. Renders nothing at all when none of it is written,
 * so the copy can land a few categories at a time.
 *
 * The FAQs emit `FAQPage` structured data as well as visible text. That is the
 * same pattern the product pages use, and it is what puts a question and its
 * answer directly into a search result.
 */
function CategoryContent({ category }: { category?: SanityCategory | null }) {
  const faqs = category?.faqs?.length ? category.faqs : null;
  // Guarded twice on purpose. A broken reference in Studio projects as null, and a
  // null in this array took the whole production build down once already.
  const relatedAll = (category?.relatedCategories ?? []).filter(
    (c): c is NonNullable<typeof c> => Boolean(c?.slug),
  );
  const stocked = relatedAll.filter((c) => c.stocked !== false);
  const related = stocked.length ? stocked : null;
  if (!faqs && !related) return null;

  return (
    <div className="border-line mt-16 border-t pt-12">
      {faqs ? (
        <section className="mb-12 max-w-[68ch]">
          <h2 className="font-display mb-5 text-2xl tracking-tight">
            Common questions
          </h2>
          <dl className="flex flex-col gap-5">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-ink text-[15px] font-medium">
                  {faq.question}
                </dt>
                <dd className="text-graphite mt-1.5 text-[15px] leading-relaxed">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
          <script
            type="application/ld+json"
            // Same structured data the product pages emit. The questions are
            // already in the DOM above, so this describes markup that exists —
            // which is the condition Google states for using it.
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.answer,
                  },
                })),
              }),
            }}
          />
        </section>
      ) : null}

      {related ? (
        <section>
          <h2 className="font-display mb-5 text-2xl tracking-tight">
            Where to look next
          </h2>
          <div className="flex flex-wrap gap-3">
            {related.map((c) => (
              <AppLink
                key={c.slug}
                href={`/shop/${c.slug}`}
                className="border-line text-ink hover:border-ink/50 rounded-lg border px-4 py-2.5 text-[14px] transition-colors"
              >
                {c.name}
              </AppLink>
            ))}
          </div>
        </section>
      ) : null}
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
function ProductGrid({
  products,
  query,
}: {
  products: SanityProduct[];
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
  product: SanityProduct;
  query?: ShopQuery;
}) {
  /**
   * When a colour is filtered, show that colour's photograph.
   *
   * The brief: "when users select black furniture, the black version should
   * appear — do not only show default images". A card answering a Black filter
   * with the white variant's photo is the shop appearing not to know its own
   * stock, at the exact moment a shopper is deciding whether to trust it.
   *
   * The gallery's plain URL rather than a hotspot crop: the variant entries do
   * not carry the asset reference the crop builder needs, and these are
   * catalogue shots on white, which `object-cover` handles at square without
   * losing the product.
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
          <Image
            src={base}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 18vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : null}
        {/* No hover swap while a variant photo is showing: the point of the
            variant is that the card answers the filter, and swapping to a
            different finish on hover would undo exactly that. */}
        {!variant && (product.hoverImageSquare ?? product.hoverImage) ? (
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
