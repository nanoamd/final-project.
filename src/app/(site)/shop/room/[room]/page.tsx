import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ShopAll } from "@/features/storefront/components/category/shop-all";
import { getDepartments } from "@/lib/sanity/queries";

/**
 * Fifteen minutes, not a day.
 *
 * A Sanity publish revalidates this path on demand through /api/revalidate, so
 * the timer is only the fallback for a page nobody has told us changed. At a
 * day, that fallback is useless: Damien published eighteen planters and the
 * page kept serving the eighteen it had, because the webhook is the only thing
 * that would have refreshed it and nothing proved it fired.
 *
 * A listing page is the one thing on this site that changes whenever stock
 * does, so it gets the short timer. It is affordable now for a reason worth
 * remembering: the Vercel bill came from these routes being *dynamic* — a
 * serverless invocation on every single request, cached never. Prerendered,
 * sixty listing pages regenerating at most four times an hour is a few
 * thousand regenerations a day, against one per request before.
 */
export const revalidate = 900;

export async function generateStaticParams() {
  try {
    const departments = await getDepartments();
    return departments.map((d) => ({ room: d.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ room: string }>;
}): Promise<Metadata> {
  const { room } = await params;
  const departments = await getDepartments();
  const department = departments.find((d) => d.slug === room);
  return {
    title: department?.name ?? "Shop",
    description:
      department?.description ??
      "The UK's most helpful home store, room by room.",
    /**
     * Self-canonical. This page and /shop/room/<room>/all list the same
     * products, and neither declared a preference — so Search Console reports
     * them as duplicates without a user-selected canonical and picks one
     * itself, which is how eleven rooms became twenty-two competing URLs.
     * Declaring the editorial page as canonical consolidates the pair.
     */
    alternates: { canonical: `${siteConfig.url}/shop/room/${room}` },
  };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;
  // White shopping page, for the same reason as the category route.
  // `searchParams` is deliberately not read — see the note on /shop/[category].
  return <ShopAll roomSlug={room} />;
}
