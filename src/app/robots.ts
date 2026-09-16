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
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
