import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ShopAll } from "@/features/storefront/components/category/shop-all";
import { getTotalProductCount } from "@/lib/sanity/queries";

/**
 * A day, not an hour.
 *
 * A Sanity publish already revalidates this path on demand through
 * /api/revalidate, so the timer is not what makes an edit appear — it is only
 * the fallback for a page nobody has told us changed. At an hour, a crawler
 * walking the catalogue regenerates every page it touches every hour, and each
 * regeneration is a function invocation, several Sanity queries and an ISR
 * write. At a day it is a twenty-fourth of that, and an edit still shows
 * immediately.
 */
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const count = await getTotalProductCount();
  return {
    title: "All Products",
    description: count
      ? `Browse all ${count} products across every room — saunas, cold plunges, pergolas, garden furniture and more.`
      : "Browse every product across every room.",
    // Self-canonical. This page is its own destination, not a duplicate of any
    // other, but it emitted no canonical at all — so a crawler arriving with a
    // tracking parameter on the URL saw a second, unrelated page.
    alternates: { canonical: `${siteConfig.url}/shop/all` },
  };
}

/**
 * The whole catalogue at one URL. Previously the only way to see a product list
 * was to pick a room first (/shop/room/[room]/all), so "show me everything you
 * sell" took several steps and had no address you could link to or share. Same
 * dense grid as the per-room page — ShopAll with no roomSlug lists everything.
 */
export default async function AllProductsPage() {
  // `searchParams` is deliberately not read here — see the note on
  // /shop/[category]. The filters come from the URL on the client so this
  // route can stay prerendered.
  return <ShopAll />;
}
