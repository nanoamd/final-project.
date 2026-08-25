import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("warranty");
  return buildMetadata({
    title: page?.title ?? "Warranty",
    description: page?.intro ?? "How product warranties work at Kaiku.",
    path: "/warranty",
  });
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
