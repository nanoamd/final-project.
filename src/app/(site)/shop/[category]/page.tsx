import type { Metadata } from "next";

import { categories, CategoryPage, getCategory } from "@/features/storefront";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const found = getCategory(category);
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
  return <CategoryPage slug={category} />;
}
