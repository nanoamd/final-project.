import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProduct, ProductDetail, products } from "@/features/storefront";

export function generateStaticParams() {
  return products.map((product) => ({
    category: product.category,
    product: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  const found = getProduct(product);
  return {
    title: found?.name ?? "Product",
    description: found?.summary,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { category, product } = await params;
  const found = getProduct(product);
  if (!found || found.category !== category) notFound();
  return <ProductDetail product={found} />;
}
