import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config/site";
import { ShopAll } from "@/features/storefront/components/category/shop-all";
import { getCategories } from "@/lib/sanity/queries";

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

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((c) => ({ category: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const found = (await getCategories()).find((c) => c.slug === category);
  return {
    title: found ? `Shop ${found.name}` : "Shop",
    description:
      found?.description ?? "Every product in this category, in one place.",
    /**
     * Canonical points at the editorial /shop/<category>, not at this URL.
     * The two pages list the same products, so without this they compete as
     * duplicates and split whatever ranking signal the category has earned —
     * and /shop/<category> is the one already indexed. This page exists for
     * mobile shoppers, so it should consolidate into that rather than fork it.
     */
    alternates: { canonical: `${siteConfig.url}/shop/${category}` },
  };
}

/**
 * The white, buy-mode page for a single category — counterpart to the dark
 * editorial /shop/[category].
 *
 * Exists because tapping a category tile on the dark room page expanded its
 * products *below the fold* on the same black page, which on a phone reads as
 * nothing having happened at all. Mobile links straight here instead. Desktop
 * keeps the inline accordion, where the expansion is visible without scrolling.
 */
export default async function CategoryShopAllPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const exists = (await getCategories()).some((c) => c.slug === category);
  // A real 404 rather than an empty white grid for a slug that does not exist —
  // this route is publicly linkable and gets crawled.
  if (!exists) notFound();
  return <ShopAll categorySlug={category} />;
}
