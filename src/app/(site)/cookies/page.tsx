import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("cookies");
  return { title: page?.title ?? "Cookie Policy" };
}

export default async function CookiesPage() {
  const page = await getPageBySlug("cookies");
  return (
    <GenericPage
      page={page}
      fallbackTitle="Cookie Policy"
      fallbackIntro="How Kaiku uses cookies on this website."
    />
  );
}
