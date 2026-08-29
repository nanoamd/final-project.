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
    title: department ? `Shop All — ${department.name}` : "Shop All",
    description:
      department?.description ?? "Every product in this room, in one place.",
    /**
     * Points at the editorial /shop/room/<room>, matching what
     * /shop/[category]/all already does. This route exists so a phone can
     * reach a dense product grid in one tap, not to rank separately — and
     * without this it competed with the room page for the same query.
     */
    alternates: { canonical: `${siteConfig.url}/shop/room/${room}` },
  };
}

export default async function ShopAllPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;
  return <ShopAll roomSlug={room} />;
}
