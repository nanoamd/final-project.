import type { Metadata } from "next";

import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("delivery");
  return { title: page?.title ?? "Delivery" };
}

export default async function DeliveryPage() {
  const page = await getPageBySlug("delivery");
  return (
    <GenericPage
      page={page}
      fallbackTitle="What to expect once you order"
      fallbackIntro="Delivery windows vary by product and are shown on each product page. Our full delivery and installation process is being finalised — get in touch for specifics on your order."
    />
  );
}
