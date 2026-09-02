import { Suspense } from "react";

import { ShopDrillNav } from "@/components/shared/shop-drill-nav";
import { AppLink } from "@/components/ui/app-link";
import { SiteBanner } from "@/features/storefront/components/shared/site-banner";
import { EMPTY_QUERY } from "@/lib/catalog/shop-query";
import { categoryInRoom } from "@/lib/sanity/category-rooms";
import {
  getAllProducts,
  getCategories,
  getDepartments,
  getProductsByCategory,
  getProductsByDepartment,
} from "@/lib/sanity/queries";
import type { SanityCategory } from "@/types/sanity-content";

import { ShopResults, toShopTile } from "./shop-results";
import { ShopResultsClient } from "./shop-results-client";

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
   *
   * Only the slug and name travel to the results component, which fills each
   * group from `products` itself; sending the built groups would serialise every
   * product on the page twice.
   */
  const groupCategories =
    room && !categorySlug
      ? categories
          .filter((c) => categoryInRoom(c, room.slug) && !c.excludeFromRoomGrid)
          .map((c) => ({ slug: c.slug, name: c.name }))
      : [];

  const pathname = categorySlug
    ? `/shop/${categorySlug}`
    : roomSlug
      ? `/shop/room/${roomSlug}`
      : "/shop/all";

  const resultsProps = {
    // Trimmed before it crosses to the client — see toShopTile.
    products: products.map(toShopTile),
    title: category?.name ?? room?.name ?? "All Products",
    category,
    roomName: room?.name ?? null,
    categorySlug,
    pathname,
    groupCategories,
    stockedSiblings,
    siblingRoom: siblingRoom ?? null,
  };

  return (
    <div className="bg-canvas text-ink min-h-screen">
      {/* The claim, with its evidence attached.
       *
       * Damien: *"we can say the uks most helpful/informative home
       * improvement store because we are"* — and on the substance he is
       * right. Twelve free tools and fourteen buying guides is genuinely rare
       * for a shop this size, and it is the one thing here a competitor
       * cannot copy in a weekend.
       *
       * Two edits to what he wrote. **"Home improvement" is not what this
       * is**: in the UK that phrase means B&Q and Wickes — timber, paint,
       * power tools. Kaiku sells furniture, lighting, decor, garden and
       * sauna. Borrowing the DIY category word would set the wrong
       * expectation at the door and put the shop in a fight it is not in.
       * And **the numbers travel with the claim**, because a bare superlative
       * is something a stranger has to take on faith, while "12 free tools
       * and 14 buying guides" is something they can go and check — which is
       * both more persuasive and the way to keep a superlative on the right
       * side of the CAP Code.
       *
       * No first-order discount. Damien: *"the first order discounts dont
       * work when most products are at 20% margin"*. On a 20-point margin a
       * 10% order discount is half the gross. The second order gets one
       * instead, on the strength of a floor Damien put under it: *"the second
       * order discount is fine, as long as its on orders over £100"* — see
       * `lib/commerce/second-order-offer.ts`, sent by email after the first
       * order rather than shown here.
       *
       * The text is shared with home-page.tsx through SiteBanner, so the two
       * surfaces cannot say different things — see that component for why. */}
      <SiteBanner />

      {/* The "/all" suffix is back, because `/shop/room/<room>` is the dark
          category grid again. Without it, tapping a room from this white
          listing would throw the shopper out to the editorial grid mid-shop;
          with it, room tabs move sideways between listings, and the grid is
          reached deliberately from the header or the hero. */}
      <ShopDrillNav
        rooms={rooms}
        categories={categories}
        theme="light"
        roomHrefSuffix="/all"
      />

      <div className="mx-auto max-w-[1480px] px-6 py-10 sm:px-8 lg:px-12">
        {/*
         * The grid, the filter bar and the counts — everything that depends on
         * the query string.
         *
         * Behind a Suspense boundary so this route stays prerendered. The
         * fallback is the same component rendered on the server with no
         * filters, so the static HTML a crawler receives is the full unfiltered
         * grid, and the client takes over on hydration to apply whatever is in
         * the URL. See shop-results-client.tsx for why this matters.
         */}
        <Suspense
          fallback={<ShopResults {...resultsProps} query={EMPTY_QUERY} />}
        >
          <ShopResultsClient {...resultsProps} />
        </Suspense>

        {/* Everything below the grid: how to choose, the questions people ask, and
            where to go next. Below rather than above because someone who arrived
            here wants the products first — but it is in the same document, which is
            all a crawler cares about. Outside the boundary, so the buying guidance
            and its FAQ schema are in the static HTML unconditionally. */}
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
