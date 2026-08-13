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
