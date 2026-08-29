import type { Metadata } from "next";

import { ShopAll } from "@/features/storefront/components/category/shop-all";
import { getCategories, getCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

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
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  const search = await searchParams;
  const style = typeof search.style === "string" ? search.style : undefined;
  return (
    <ShopAll categorySlug={category} styleTag={style} searchParams={search} />
  );
}
