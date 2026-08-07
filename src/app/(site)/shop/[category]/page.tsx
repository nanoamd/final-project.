import type { Metadata } from "next";

import { CollectionIndex } from "@/features/storefront";
import { getCategories, getCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

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
    // An empty category is a thin page. `noindex, follow` keeps it reachable and
    // keeps link equity flowing through it, while keeping it out of the index
    // until it has products — better than being ranked for a page that shows
    // nothing. Reverses itself automatically once stocked.
    noindex: (found?.productCount ?? 0) === 0,
  });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ style?: string }>;
}) {
  const { category } = await params;
  const { style } = await searchParams;
  return <CollectionIndex categorySlug={category} styleTag={style} />;
}
