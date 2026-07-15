import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/features/storefront";
import { getProduct, getProductParams } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateStaticParams() {
  return getProductParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  const found = await getProduct(product);
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
  const found = await getProduct(product);
  if (!found || found.category !== category) notFound();
  return <ProductDetail product={found} />;
}
