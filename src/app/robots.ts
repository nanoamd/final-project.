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
      allow: "/",
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
