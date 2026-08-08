import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { ShopAll } from "@/features/storefront/components/category/shop-all";
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
