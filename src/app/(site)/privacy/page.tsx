import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("privacy");
  return { title: page?.title ?? "Privacy Policy" };
}

export default async function PrivacyPage() {
  const page = await getPageBySlug("privacy");
  return (
    <GenericPage
      page={page}
      fallbackTitle="Privacy Policy"
      fallbackIntro="Our privacy policy is being finalised and reviewed before publication — it will explain exactly what we collect, why, and how it's protected."
    />
  );
}
