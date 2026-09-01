import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { companyDetails, tradingAddressLine } from "@/config/site";
import { GenericPage } from "@/features/storefront/components/content/generic-page";
import { getPageBySlug } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("terms");
  return buildMetadata({
    title: page?.title ?? "Terms & Conditions",
    description:
      page?.intro ?? "The terms that apply when you order from Kaiku.",
    path: "/terms",
  });
}

/**
 * The statutory trading disclosure lives here (and on /contact) rather than
 * in the global footer. UK law requires it to be "easily, directly and
 * permanently accessible" — a persistent footer link to this page satisfies
 * that — not printed as literal text on every single page, which is what put
 * Damien's home address into Google's search snippet for dozens of unrelated
 * pages (product categories, tools, the journal). See companyDetails in
 * src/config/site.ts.
 */
function StatutoryDetails() {
  return (
    <Container className="pb-20 md:pb-28">
      <p className="text-muted mx-auto max-w-2xl border-t pt-6 text-sm leading-relaxed">
        {companyDetails.tradingName} is a trading name of{" "}
        {companyDetails.traderName}. Trading address: {tradingAddressLine()}.
        {companyDetails.vatRegistered
          ? ""
          : " Not VAT registered, so no VAT is charged on these prices."}
      </p>
    </Container>
  );
}

export default async function TermsPage() {
  const page = await getPageBySlug("terms");
  return (
    <>
      <GenericPage
        page={page}
        fallbackTitle="Terms & Conditions"
        fallbackIntro="The terms that apply when you order from Kaiku."
      />
      <StatutoryDetails />
    </>
  );
}
