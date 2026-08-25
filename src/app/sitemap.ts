import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getSitemapContent } from "@/lib/sanity/queries/sitemap";

/**
 * The pages that always exist, with how often each is worth re-crawling.
 *
 * The four marked `tracks` list Sanity content — the homepage, /shop, /learn and
 * /journal — so they take their `lastmod` from the newest thing they list, since
 * that is when what they show actually changed. The rest are written in code and
 * get no date at all rather than a made-up one.
 */
const STATIC_ROUTES: {
  path: string;
  changeFrequency: Change;
  tracks?: true;
}[] = [
  { path: "", changeFrequency: "daily", tracks: true },
  { path: "/shop", changeFrequency: "daily", tracks: true },
  { path: "/learn", changeFrequency: "weekly", tracks: true },
  { path: "/journal", changeFrequency: "weekly", tracks: true },
  { path: "/tools", changeFrequency: "monthly" },
  { path: "/tools/garden-visualiser", changeFrequency: "monthly" },
  { path: "/about", changeFrequency: "monthly" },
  { path: "/contact", changeFrequency: "monthly" },
  { path: "/faq", changeFrequency: "monthly" },
  { path: "/delivery", changeFrequency: "monthly" },
  { path: "/returns", changeFrequency: "monthly" },
  { path: "/privacy", changeFrequency: "yearly" },
  { path: "/terms", changeFrequency: "yearly" },
];

type Change = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/**
 * Re-read the catalogue hourly.
 *
 * Without this the sitemap is wrong within a day of every deploy, and it was.
 * Next's docs are explicit that `sitemap.js` "is a special Route Handler that is
 * cached by default unless it uses a Request-time API or dynamic config option" —
 * so with no config it is generated once at build time and never again. Caught by
 * publishing eight buying guides and finding the live sitemap still listing one:
 * 125 URLs when there were 133 pages to submit.
 *
 * That is the failure mode that matters here, because the catalogue changes in
 * Sanity and not in the repository. A product added on a Tuesday would have waited
 * for the next code deploy to be advertised to Google, which is exactly the wrong
 * way round for a site whose whole problem is getting crawled.
 *
 * An hour rather than the 60 seconds the content pages use: a sitemap is fetched
 * by crawlers occasionally rather than by people constantly, and nothing is gained
 * by rebuilding a 133-line XML file every minute.
 */
export const revalidate = 3600;

/**
 * Every category and product, plus published posts and buying guides, each with
 * the date it last changed.
 *
 * Cart, account, checkout, search and the Studio are deliberately absent — not
 * content worth indexing.
 *
 * **Only stocked categories.** 19 of 41 currently hold no products, and
 * submitting an empty page for indexing asks Google to spend crawl budget on
 * nothing and to judge a young domain on thin content. They stay fully navigable;
 * they are simply not advertised until they have something to show. The filter is
 * on `productCount`, so a category re-enters the sitemap the moment it is
 * stocked, with no flag for anyone to remember to flip.
 *
 * The filtered shop URLs (`/shop/all?colour=Black` and friends) are absent too.
 * They are real, server-rendered, rankable pages, but they canonicalise to
 * `/shop/all`, and listing a page whose canonical is elsewhere asks Google to
 * index something it has been told to fold away.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const content = await getSitemapContent();

  const newest = (entries: { updatedAt: string }[]) =>
    entries.length
      ? entries.reduce(
          (latest, entry) =>
            entry.updatedAt > latest ? entry.updatedAt : latest,
          entries[0]!.updatedAt,
        )
      : content.latest;

  const listingDate: Record<string, string | null> = {
    "": content.latest,
    "/shop": newest([...content.categories, ...content.products]),
    "/learn": newest(content.guides),
    "/journal": newest(content.posts),
  };

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, changeFrequency, tracks }) => ({
      url: `${base}${path}`,
      changeFrequency,
      priority: path === "" ? 1 : 0.7,
      ...lastModified(tracks ? listingDate[path] : null),
    }),
  );

  const entries = (
    items: { path: string; updatedAt: string }[],
    changeFrequency: Change,
    priority: number,
  ): MetadataRoute.Sitemap =>
    items.map((item) => ({
      url: `${base}${item.path}`,
      changeFrequency,
      priority,
      ...lastModified(item.updatedAt),
    }));

  return [
    ...staticEntries,
    ...entries(content.categories, "daily", 0.8),
    ...entries(content.products, "weekly", 0.6),
    ...entries(content.posts, "monthly", 0.4),
    ...entries(content.guides, "monthly", 0.4),
  ];
}

/**
 * A `lastmod` is only emitted when there is a real date behind it.
 *
 * An invented one — today's date on every URL, say — is worse than none: it tells
 * Google everything changed on every crawl, and once it learns the dates are
 * meaningless it stops trusting them across the whole sitemap.
 */
function lastModified(updatedAt: string | null | undefined) {
  if (!updatedAt) return {};
  const date = new Date(updatedAt);
  return Number.isNaN(date.getTime()) ? {} : { lastModified: date };
}
