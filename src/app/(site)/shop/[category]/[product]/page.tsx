import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/features/storefront";
import { TrackViewItem } from "@/features/storefront/components/analytics/track-view-item";
import { getProduct, getProductParams } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * Six hours.
 *
 * Longer than the listings because there are 1,600 of these and only sixty of
 * those, and shorter than a day because this is the page that carries the
 * price. A publish still revalidates it immediately through /api/revalidate;
 * this is what catches a change the webhook missed.
 */
export const revalidate = 21600;

export async function generateStaticParams() {
  return getProductParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}): Promise<Metadata> {
  const { category, product } = await params;
  const found = await getProduct(product);
  const fallbackDescription = found
    ? `Shop the ${found.name}${found.categoryName ? ` — part of our ${found.categoryName} range` : ""} at Kaiku Home.`
    : "A premium piece from the Kaiku collection.";
  return buildMetadata({
    title: found?.name ?? "Product",
    description: found?.summary ?? fallbackDescription,
    path: `/shop/${category}/${product}`,
    image: found?.image ?? found?.gallery?.[0]?.url ?? undefined,
    seo: found?.seo,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { category, product } = await params;
  const found = await getProduct(product);
  if (!found || found.category !== category) notFound();
  return (
    <>
      <TrackViewItem
        item={{
          slug: found.slug,
          name: found.name,
          price: found.price,
          category: found.category,
        }}
      />
      <ProductDetail product={found} />
    </>
  );
}
