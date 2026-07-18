import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("about");
  return { title: page?.title ?? "About" };
}

export default async function AboutPage() {
  const page = await getPageBySlug("about");
  return (
    <GenericPage
      page={page}
      fallbackTitle="A knowledge-first retailer"
      fallbackIntro="We're building the UK's most considered home improvement platform — one where the advice is as carefully made as the products. More on our approach, and the people behind it, soon."
    />
  );
}
