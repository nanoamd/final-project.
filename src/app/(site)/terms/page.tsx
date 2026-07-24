import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("terms");
  return buildMetadata({
    title: page?.title ?? "Terms & Conditions",
    description:
      page?.intro ?? "The terms that apply when you order from Kaiku.",
    path: "/terms",
  });
}

export default async function TermsPage() {
  const page = await getPageBySlug("terms");
  return (
    <GenericPage
      page={page}
      fallbackTitle="Terms & Conditions"
      fallbackIntro="The terms that apply when you order from Kaiku."
    />
  );
}
