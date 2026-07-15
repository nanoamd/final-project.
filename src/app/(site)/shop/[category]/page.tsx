import type { Metadata } from "next";

import { CollectionIndex } from "@/features/storefront";
import { getCategories, getCategory } from "@/lib/sanity/queries";

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
  return {
    title: found?.name ?? "Shop",
    description: found?.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <CollectionIndex categorySlug={category} />;
}
