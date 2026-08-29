"use client";

import { useSearchParams } from "next/navigation";

import { parseShopQuery } from "@/lib/catalog/shop-query";

import { ShopResults, type ShopResultsProps } from "./shop-results";

/**
 * The filtered view, read from the URL on the client.
 *
 * This exists so the shop pages can be prerendered.
 *
 * `/shop/[category]`, `/shop/room/[room]` and `/shop/all` used to `await
 * searchParams` in the page, and awaiting it makes the whole route dynamic —
 * which silently made `generateStaticParams` and `revalidate = 86400` dead
 * code on the three most-crawled routes on the site. Every request for every
 * category page ran a fresh serverless function and several Sanity queries,
 * cached nothing, and did it again for the next visitor. Live headers showed
 * it plainly: `x-vercel-cache: MISS` on every one of them, forever, while the
 * product and guide pages returned PRERENDER.
 *
 * Reading the same values through `useSearchParams` in a client component
 * under a Suspense boundary leaves the route prerendered, per Next's own
 * guidance for this exact case. The static HTML carries the unfiltered grid —
 * which is what a crawler should see anyway — and the filters apply on
 * hydration.
 */
export function ShopResultsClient(props: Omit<ShopResultsProps, "query">) {
  const searchParams = useSearchParams();
  return (
    <ShopResults
      {...props}
      query={parseShopQuery(Object.fromEntries(searchParams.entries()))}
    />
  );
}
