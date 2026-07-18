import type { Metadata } from "next";

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
