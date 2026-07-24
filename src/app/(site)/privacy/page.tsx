import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("privacy");
  return buildMetadata({
    title: page?.title ?? "Privacy Policy",
    description:
      page?.intro ?? "How we collect, use and protect your information.",
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  const page = await getPageBySlug("privacy");
  return (
    <GenericPage
      page={page}
      fallbackTitle="Privacy Policy"
      fallbackIntro="How we collect, use and protect your information."
    />
  );
}
