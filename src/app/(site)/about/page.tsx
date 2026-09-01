import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("about");
  return buildMetadata({
    title: page?.title ?? "About",
    description:
      page?.intro ??
      "We're building the UK's most helpful home store — one where the advice is as carefully made as the products.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const page = await getPageBySlug("about");
  return (
    <GenericPage
      page={page}
      fallbackTitle="A knowledge-first retailer"
      fallbackIntro="We're building the UK's most helpful home store — one where the advice is as carefully made as the products. More on our approach, and the people behind it, soon."
    />
  );
}
