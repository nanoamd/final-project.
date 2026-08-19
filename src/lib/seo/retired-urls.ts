/**
 * Products that were removed from the catalogue, and where their URLs now send
 * people.
 *
 * These seven were the Aosom listings, deleted on 12 August once it was clear
 * the account had not actually been approved. They had been live, linked and
 * crawled, so the URLs still exist as far as Google and anyone's bookmarks are
 * concerned.
 *
 * **Why a redirect rather than letting them 404.** Next's documented behaviour is
 * that a `notFound()` reached after the response has begun streaming cannot change
 * the status code, so the page answers HTTP 200 with
 * `<meta name="robots" content="noindex">` in the body. Verified on the live site:
 * all seven answer 200 and all seven carry the noindex tag, as does a product URL
 * that never existed. That is enough to keep them out of the index — the docs are
 * explicit that a streamed 404 does not lead to indexation because of the noindex —
 * so this is not the indexation emergency it first looked like.
 *
 * It is still the wrong answer for a *retired product*. A page that was indexed
 * has accumulated link equity, and a shopper arriving from a search result or an
 * old link deserves the range they were looking for rather than a dead end. A
 * permanent redirect to the category keeps both. A 404 throws both away.
 *
 * **Why not force a real 404 status.** The documented way to get one is to check
 * the resource exists in `proxy`, before the body streams. That would mean a
 * Sanity round-trip on every product URL on the site to change a status code that
 * Google is already handling correctly via the noindex — and the same docs warn to
 * keep proxy checks fast and not to fetch content there. Not worth the latency on
 * every page view.
 *
 * Add to this list whenever a product is permanently removed. The category it
 * belonged to is the right target: it is the closest surviving page to what the
 * visitor asked for.
 */
export interface RetiredUrl {
  /** The path the product used to live at. */
  from: string;
  /** Where it goes now — the category it belonged to. */
  to: string;
}

export const RETIRED_PRODUCT_URLS: readonly RetiredUrl[] = [
  {
    from: "/shop/lighting/arc-tree-floor-lamp-three-adjustable-lights",
    to: "/shop/lighting",
  },
  {
    from: "/shop/lighting/solar-garden-lamp-post-dimmable-led-black",
    to: "/shop/lighting",
  },
  {
    from: "/shop/lighting/solar-outdoor-garden-floor-lantern-led-light",
    to: "/shop/lighting",
  },
  {
    from: "/shop/lighting/steel-duo-head-floor-lamp-adjustable-brightness",
    to: "/shop/lighting",
  },
  {
    from: "/shop/lighting/vintage-tripod-floor-lamp-adjustable-height",
    to: "/shop/lighting",
  },
  {
    from: "/shop/outdoor-kitchens/portable-charcoal-bbq-grill-with-wheels",
    to: "/shop/outdoor-kitchens",
  },
  {
    from: "/shop/water-features/solar-garden-water-feature-led-pump",
    to: "/shop/water-features",
  },
];

/**
 * Products whose slug was repaired, and the addresses they used to answer on.
 *
 * The slug audit (`scripts/audit-slugs.ts`) found two live products whose slug was not
 * a slug: one held the entire title including a pipe character, the other held the
 * marketing excerpt including a full stop. Both were being handed to Google in the
 * sitemap as URLs full of `%20`.
 *
 * Renaming them is right, but a rename without a redirect is how a site loses pages it
 * already had — so the old addresses keep answering, permanently, pointing at the new
 * one. Unlike the retired URLs above these are not dead ends being softened: the exact
 * page the visitor asked for still exists, it just lives at a readable address now.
 *
 * `from` is written **percent-encoded**, exactly as the character sequence a browser or
 * a crawler puts on the wire. Next matches `redirects()` sources against the raw
 * pathname, not the decoded one: verified on a running server, where a source written
 * with literal spaces did not match the request at all, and the encoded source
 * answered 308 to the new address.
 */
export const RENAMED_PRODUCT_URLS: readonly RetiredUrl[] = [
  {
    from: "/shop/rustic-reclaimed-furniture/Reclaimed%20Teak%20Dining%20Table%20180cm%20%7C%20Kaiku",
    to: "/shop/rustic-reclaimed-furniture/reclaimed-teak-dining-table-180cm",
  },
  {
    from: "/shop/lighting/Soft%20ambient%20lighting%20with%20timeless%20sculptural%20elegance.",
    to: "/shop/lighting/small-rectangular-gesso-table-lamp",
  },
];

/**
 * Products that moved to a different category.
 *
 * Distinct from `RENAMED_PRODUCT_URLS` on purpose: that list is slug repairs,
 * and it carries a tested invariant that the category segment never changes —
 * which is what makes it obvious when an entry is describing something else.
 * These entries change exactly that segment.
 *
 * A product's URL is built from its primary category, so re-parenting one moves
 * its address. The two Tristan photo frames had been sitting in Mirrors long
 * enough to be indexed there, and the Mirrors page is the one Damien was looking
 * at when he said "all mirrors should be in this category" — they are frames.
 * See scripts/canonicalise-categories.ts for the reasoning per product.
 */
export const RECATEGORISED_PRODUCT_URLS: readonly RetiredUrl[] = [
  {
    from: "/shop/mirrors/tristan-mirror-and-wood-4x6-frame",
    to: "/shop/wall-art/tristan-mirror-and-wood-4x6-frame",
  },
  {
    from: "/shop/mirrors/tristan-mirror-and-wood-5x7-frame",
    to: "/shop/wall-art/tristan-mirror-and-wood-5x7-frame",
  },
  {
    from: "/shop/wall-art/antique-etched-foxed-wall-art-mirror",
    to: "/shop/mirrors/antique-etched-foxed-wall-art-mirror",
  },
  {
    from: "/shop/christmas-decorations/large-grey-stone-effect-hurricane-lantern",
    to: "/shop/candles-and-lanterns/large-grey-stone-effect-hurricane-lantern",
  },
];
