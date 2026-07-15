import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("returns");
  return { title: page?.title ?? "Returns" };
}

export default async function ReturnsPage() {
  const page = await getPageBySlug("returns");
  return (
    <GenericPage
      page={page}
      fallbackTitle="Our returns policy"
      fallbackIntro="Our full returns policy, including timeframes and made-to-order exceptions, is being finalised — get in touch and we'll confirm the details for your order directly."
    />
  );
}
