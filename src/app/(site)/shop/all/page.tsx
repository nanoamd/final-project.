import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ShopAll } from "@/features/storefront/components/category/shop-all";
import { getTotalProductCount } from "@/lib/sanity/queries";

/**
 * Fifteen minutes, not a day.
 *
 * A Sanity publish revalidates this path on demand through /api/revalidate, so
 * the timer is only the fallback for a page nobody has told us changed. At a
 * day, that fallback is useless: Damien published eighteen planters and the
 * page kept serving the eighteen it had, because the webhook is the only thing
 * that would have refreshed it and nothing proved it fired.
 *
 * A listing page is the one thing on this site that changes whenever stock
 * does, so it gets the short timer. It is affordable now for a reason worth
 * remembering: the Vercel bill came from these routes being *dynamic* — a
 * serverless invocation on every single request, cached never. Prerendered,
 * sixty listing pages regenerating at most four times an hour is a few
 * thousand regenerations a day, against one per request before.
 */
export const revalidate = 900;

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
