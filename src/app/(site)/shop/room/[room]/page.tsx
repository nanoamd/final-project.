import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ShopAll } from "@/features/storefront/components/category/shop-all";
import { getDepartments } from "@/lib/sanity/queries";

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
      department?.description ?? "Premium home improvement, room by room.",
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
