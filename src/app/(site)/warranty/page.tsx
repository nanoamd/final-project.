import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("warranty");
  return { title: page?.title ?? "Warranty" };
}

export default async function WarrantyPage() {
  const page = await getPageBySlug("warranty");
  return (
    <GenericPage
      page={page}
      fallbackTitle="Warranty"
      fallbackIntro="How product warranties work at Kaiku."
    />
  );
}
