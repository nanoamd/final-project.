import type { Metadata } from "next";

import { SHOP_MIRRORS_ROOM } from "@/config/site";
import { siteConfig } from "@/config/site";
import { CollectionIndex } from "@/features/storefront/components/category/collection-index";
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
  /**
   * The room's own photograph for a shared link.
   *
   * This route builds its Metadata by hand rather than through
   * `buildMetadata`, so it inherited the root layout's Open Graph image —
   * meaning every room link shared on WhatsApp, Slack or LinkedIn showed the
   * same generic garden photo. 10 of the 11 rooms have no `heroImage`, so the
   * flagship product's photo is what there is, and it is a picture of the
   * room rather than of nothing in particular.
   */
  const ogImage = department?.image ?? department?.fallbackImage;

  return {
    title: department?.name ?? "Shop",
    description:
      department?.description ??
      "The UK's most helpful home store, room by room.",
    ...(ogImage
      ? {
          openGraph: { images: [{ url: ogImage }] },
          twitter: { card: "summary_large_image", images: [ogImage] },
        }
      : {}),
    /**
     * Self-canonical, except for Outdoor Living.
     *
     * This page and /shop/room/<room>/all list the same products, and neither
     * declared a preference — so Search Console reported them as duplicates
     * with no user-selected canonical and picked one itself, which is how
     * eleven rooms became twenty-two competing URLs. Declaring the editorial
     * page as canonical consolidates the pair.
     *
     * Outdoor Living is a third copy of the same page: `/shop` renders
     * `<CollectionIndex roomSlug="outdoor-living" />`, so /shop and
     * /shop/room/outdoor-living are **byte-identical** with different
     * self-canonicals — a genuine duplicate pair, with /shop in the sitemap
     * and the better claim to the traffic. So that one points at /shop rather
     * than at itself, and the sitemap leaves it out (see app/sitemap.ts).
     *
     * Not fixed by changing what /shop renders: that is the second most
     * important page on the site and what it shows is Damien's call, not a
     * side effect of a canonical fix.
     */
    alternates: {
      canonical:
        room === SHOP_MIRRORS_ROOM
          ? `${siteConfig.url}/shop`
          : `${siteConfig.url}/shop/room/${room}`,
    },
  };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;
  /**
   * The dark category grid, not the white product listing.
   *
   * `/shop` rendered this grid hardcoded to `outdoor-living`, while every room
   * route rendered the white `ShopAll`. So the grid existed for exactly one
   * room, and clicking any other room in the header — the bar drawn over that
   * very grid — dropped you onto a white product listing instead of the same
   * grid for the room you picked. Two different page types behind one row of
   * sibling tabs.
   *
   * `CollectionIndex` was always room-generic (it takes `roomSlug` and filters
   * the tiles by department); its own docstring already claimed this route
   * rendered it. Only the wiring was wrong. The dense white grid is still one
   * tap away at `/shop/room/<room>/all`, which is where this page's
   * "Shop All …" button points.
   */
  return <CollectionIndex roomSlug={room} />;
}
