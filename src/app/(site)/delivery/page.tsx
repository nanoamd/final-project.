import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { DeliveryRules } from "@/features/storefront/components/content/delivery-rules";
import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("delivery");
  return buildMetadata({
    title: page?.title ?? "Delivery",
    description:
      page?.intro ??
      "Delivery windows vary by product and are shown on each product page.",
    path: "/delivery",
  });
}

export default async function DeliveryPage() {
  const page = await getPageBySlug("delivery");
  return (
    <>
      <GenericPage
        slug="delivery"
        page={page}
        fallbackTitle="What to expect once you order"
        fallbackIntro="Delivery windows vary by product and are shown on each product page. White-glove delivery and installation is available on selected products — get in touch for specifics on your order."
      />
      <Container className="pb-20 md:pb-28">
        <div className="mx-auto max-w-2xl">
          <DeliveryRules />
        </div>
      </Container>
    </>
  );
}
