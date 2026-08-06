import type { Metadata } from "next";

import { ShopAll } from "@/features/storefront/components/category/shop-all";
import { getTotalProductCount } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const count = await getTotalProductCount();
  return {
    title: "All Products",
    description: count
      ? `Browse all ${count} products across every room — saunas, cold plunges, pergolas, garden furniture and more.`
      : "Browse every product across every room.",
  };
}

/**
 * The whole catalogue at one URL. Previously the only way to see a product list
 * was to pick a room first (/shop/room/[room]/all), so "show me everything you
 * sell" took several steps and had no address you could link to or share. Same
 * dense grid as the per-room page — ShopAll with no roomSlug lists everything.
 */
export default function AllProductsPage() {
  return <ShopAll />;
}
