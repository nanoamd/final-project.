import type { Metadata } from "next";

import { ShopAll } from "@/features/storefront/components/category/shop-all";
import { getCategories, getCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

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
  const categories = await getCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const found = await getCategory(category);
  return buildMetadata({
    title: found?.name ?? "Shop",
    description:
      found?.description ??
      "Browse the full Kaiku collection — premium outdoor living and wellness pieces.",
    path: `/shop/${category}`,
    image: found?.image ?? undefined,
    seo: found?.seo,
    // An empty category is a thin page. `noindex, follow` keeps it reachable and
    // keeps link equity flowing through it, while keeping it out of the index
    // until it has products — better than being ranked for a page that shows
    // nothing. Reverses itself automatically once stocked.
    noindex: (found?.productCount ?? 0) === 0,
  });
}

/**
 * A category URL now opens the white shopping page, not the dark editorial one.
 *
 * This route used to render CollectionIndex — the near-black tile page — and the
 * white commercial grid was reachable only at `/shop/[category]/all`, which
 * nothing linked to prominently. So every ordinary act of shopping (tapping a
 * category in the nav, tapping a tile on the homepage) landed on a page built for
 * browsing inspiration, and tapping a second category landed there again. That is
 * the "Sauna to Wellness Accessories sends me back to the black page" problem: it
 * was not a bug in the navigation, it was the destination.
 *
 * The dark experience is not deleted. It remains the `/shop` index, which is what
 * "Explore Collections" points at — discovery, deliberately entered.
 *
 * The URL is unchanged, so nothing that Google has already crawled moves, and the
 * URL a searcher lands on is now the one that sells.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  // `searchParams` is deliberately not read here. Awaiting it makes the route
  // dynamic, which made `generateStaticParams` and the `revalidate` above dead
  // code and turned every view of every category page into an uncached
  // serverless invocation. The filters are read from the URL on the client
  // instead — see shop-results-client.tsx.
  return <ShopAll categorySlug={category} />;
}
