import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShopAll } from "@/features/storefront/components/category/shop-all";
import { getCategories } from "@/lib/sanity/queries";

export const revalidate = 60;

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
