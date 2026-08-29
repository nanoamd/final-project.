import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/features/storefront";
import { TrackViewItem } from "@/features/storefront/components/analytics/track-view-item";
import { getProduct, getProductParams } from "@/lib/sanity/queries";
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
