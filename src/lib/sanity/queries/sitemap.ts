import { sanityFetch } from "@/lib/sanity/fetch";

/**
 * Everything the sitemap needs, with the date each thing last changed, in one
 * round trip.
 *
 * `lastmod` was missing from every entry. Google treats it as a crawl hint — a
 * date that moves tells it to come back and look, and its absence means the whole
 * sitemap looks equally stale on every fetch. On a site whose whole problem is
 * getting 88 products and 22 categories crawled and ranked in three months, that
 * is a free signal being thrown away.
 *
 * It is one query rather than reusing `getCategories`, `getProductParams`,
 * `getPosts` and `getBuyingGuides` because those four exist to serve pages: they
 * project images, taglines, descriptions and related documents that the sitemap
 * has no use for, and none of them carry `_updatedAt`. Widening all four to add a
 * field only the sitemap reads would push a sitemap concern into the routing
 * helpers and fetch four times as much data to build an XML file of URLs.
 *
 * `_updatedAt` is Sanity's own — it moves whenever the document is published with
 * a change, which is exactly the semantics `lastmod` wants.
 */

export interface SitemapEntry {
  /** Path, with a leading slash. */
  path: string;
  /** ISO timestamp of the document's last change. */
  updatedAt: string;
}

export interface SitemapContent {
  categories: SitemapEntry[];
  products: SitemapEntry[];
  posts: SitemapEntry[];
  guides: SitemapEntry[];
  /** The most recent change anywhere, for the pages that list this content. */
  latest: string | null;
}

/**
 * Note the `productCount` on categories: an unstocked category stays out of the
 * sitemap, and the filter belongs in the query so an empty category cannot be
 * advertised by accident. The reasoning for that exclusion is in
 * src/app/sitemap.ts.
 */
const SITEMAP_QUERY = /* groq */ `{
  "categories": *[_type == "category" && defined(slug.current)
    && count(*[_type == "product" && references(^._id)]) > 0] | order(order asc) {
    "path": "/shop/" + slug.current,
    "updatedAt": _updatedAt
  },
  "products": *[_type == "product" && defined(slug.current)
    && defined(category->slug.current)] | order(_updatedAt desc) [0...$limit] {
    "path": "/shop/" + category->slug.current + "/" + slug.current,
    "updatedAt": _updatedAt
  },
  "posts": *[_type == "post" && defined(slug.current)] | order(_updatedAt desc) [0...$limit] {
    "path": "/journal/" + slug.current,
    "updatedAt": _updatedAt
  },
  "guides": *[_type == "buyingGuide" && defined(slug.current)] | order(_updatedAt desc) [0...$limit] {
    "path": "/learn/" + slug.current,
    "updatedAt": _updatedAt
  },
  "latest": *[_type in ["product", "category", "post", "buyingGuide"]]
    | order(_updatedAt desc) [0]._updatedAt
}`;

const EMPTY: SitemapContent = {
  categories: [],
  products: [],
  posts: [],
  guides: [],
  latest: null,
};

export async function getSitemapContent(limit = 1000): Promise<SitemapContent> {
  return sanityFetch<SitemapContent>(SITEMAP_QUERY, { limit }, EMPTY);
}
