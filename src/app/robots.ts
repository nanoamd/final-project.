import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * `/search` and `/compare` are excluded deliberately.
 *
 * They are the last two publicly reachable routes that cannot be prerendered —
 * both answer a query string, so both run a serverless function on every
 * request and cache nothing. Left crawlable, a bot walking query-string
 * variants pays for one invocation each, indefinitely, for pages Google's own
 * guidance says not to index anyway: internal search results are thin
 * duplicates of the category pages that already rank.
 *
 * Neither is in the sitemap and neither carries a ranking we would lose.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      /**
       * `/api/feeds/` is allowed back, and it is not a loosening.
       *
       * `Disallow: /api/` blocked `/api/feeds/google-merchant`, and Merchant
       * Center's scheduled fetch obeys robots.txt. So the feed was configured
       * as a product source, answered 200 with 908 items to anything that
       * asked, and was refused to the one client that mattered — which is why
       * Merchant Center read **"Provided by you: 0"** while holding 524
       * products it had crawled off the site by itself.
       *
       * Per RFC 9309 the longest matching rule wins, so `/api/feeds/` (11
       * characters) beats `/api/` (5) and the rest of `/api/` stays blocked.
       * Listing it before the disallow is for humans reading the file; the
       * spec does not care about order.
       *
       * Nothing under `/api/feeds/` is private: it is a product catalogue we
       * are actively trying to get indexed.
       */
      allow: ["/", "/api/feeds/"],
      disallow: [
        "/studio",
        "/admin",
        "/api/",
        "/cart",
        "/account",
        "/checkout",
        "/search",
        "/compare",
        /**
         * The facet and sort parameters, which were a crawl trap.
         *
         * `FilterBar` is a server component and every control in it is a real
         * `<a href>` — deliberately, so filtering works without JavaScript and
         * the links stay crawlable. It renders on every listing with six or
         * more products, and `toggleFacetHref` preserves every other
         * selection, so the link graph is the power set of the facet
         * vocabulary: about 20 colours, 16 materials, 8 styles, 7 rooms and 18
         * types, times 4 sorts, times `in-stock`, times `under`.
         *
         * Across roughly 22 stocked categories, 11 rooms and /shop/all that is
         * tens of thousands of crawlable URLs, **every one of which returns
         * byte-identical HTML** — filtering moved to the client to keep the
         * route prerendered, so the parameters change nothing the server
         * sends. The only thing pointing a crawler back at the clean path was
         * the canonical tag, and a canonical is a hint, not an instruction.
         *
         * Kaiku earns about one organic click a day with 908 product URLs in
         * its sitemap. Crawl budget spent re-fetching
         * `?colour=grey&material=oak&sort=price-asc` is crawl budget not spent
         * on a product, and this is the most plausible single reason those
         * product URLs are not being fetched.
         *
         * Named one parameter at a time rather than as a blanket `/*?` so the
         * `/api/feeds/` allow above is not disturbed. No indexable canonical
         * on this site carries a query string, so nothing rankable is lost.
         */
        "/*?colour=",
        "/*?material=",
        "/*?style=",
        "/*?room=",
        "/*?type=",
        "/*?sort=",
        "/*?in-stock=",
        "/*?under=",
        // Client-only wishlist with no canonical and no metadata export of its
        // own — it cannot be noindexed from the page, so it is blocked here.
        "/saved",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
