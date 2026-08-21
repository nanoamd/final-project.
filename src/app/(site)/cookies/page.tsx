import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("cookies");
  return buildMetadata({
    title: page?.title ?? "Cookie Policy",
    description: page?.intro ?? "How Kaiku uses cookies on this website.",
    path: "/cookies",
  });
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
