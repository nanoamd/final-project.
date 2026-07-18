import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("terms");
  return { title: page?.title ?? "Terms & Conditions" };
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
