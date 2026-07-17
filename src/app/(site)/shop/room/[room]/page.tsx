import type { Metadata } from "next";

import { CollectionIndex } from "@/features/storefront";
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
  };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;
  return <CollectionIndex roomSlug={room} />;
}
