import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import {
  getBuyingGuides,
  getCategories,
  getPosts,
  getProductParams,
} from "@/lib/sanity/queries";

const STATIC_ROUTES = [
  "",
  "/shop",
  "/about",
  "/contact",
  "/faq",
  "/delivery",
  "/returns",
  "/privacy",
  "/terms",
  "/learn",
  "/journal",
  "/tools",
  "/tools/garden-visualiser",
];

/**
 * Dynamically includes every category and product, plus published posts and
 * buying guides. Cart/account/checkout/search and the studio are deliberately
 * excluded — not content worth indexing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const [categories, products, posts, guides] = await Promise.all([
    getCategories(),
    getProductParams(1000),
    getPosts({ limit: 200 }),
    getBuyingGuides({ limit: 200 }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  // Only stocked categories. 21 of 36 currently hold no products, and
  // submitting an empty page for indexing asks Google to spend crawl budget on
  // nothing and to judge the domain on thin content — costly on a young site.
  // They stay fully navigable; they are simply not advertised until they have
  // something to show. Derived from productCount, so a category re-enters the
  // sitemap the moment it is stocked, with no flag to remember to flip.
  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => (c.productCount ?? 0) > 0)
    .map((c) => ({
      url: `${base}/shop/${c.slug}`,
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/shop/${p.category}/${p.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/journal/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const guideEntries: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${base}/learn/${g.slug}`,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
    ...postEntries,
    ...guideEntries,
  ];
}
