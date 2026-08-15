import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { CollectionIndex } from "@/features/storefront/components/category/collection-index";
import { getDepartments } from "@/lib/sanity/queries";

export const revalidate = 60;

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
  /**
   * The dark hub of the categories inside this department.
   *
   * This route rendered `ShopAll` — the white product grid — for one release, and
   * that was an overcorrection. The complaint it answered was that tapping a
   * *category* landed on the black editorial page instead of on products, and that
   * was right: a category is a list of things to buy. The same fix was applied to
   * the room route, and a department is not the same kind of thing. "Outdoor Living"
   * is a hub of eleven categories, and flattening it into one undifferentiated grid
   * of every product in the department throws away the only structure a shopper has
   * for finding their way in.
   *
   * So the split now follows the structure rather than applying one rule to both:
   *
   *   /shop/room/<room>       this page — the categories in the department, dark
   *   /shop/room/<room>/all   every product in the department, white grid
   *   /shop/<category>        products in one category, white grid
   *
   * `CollectionIndex` already links prominently to the `/all` variant, so the route
   * that sells stays one tap away rather than being hidden again — which was the
   * substance of the original complaint.
   *
   * Dropping `searchParams` also restores static generation for the eleven
   * department pages: reading them is what made this route server-rendered, and a
   * style filter means nothing on a page of category tiles.
   */
  return <CollectionIndex roomSlug={room} />;
}
