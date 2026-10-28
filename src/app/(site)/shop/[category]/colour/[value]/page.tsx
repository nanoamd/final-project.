import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FacetLanding } from "@/features/storefront/components/category/facet-landing";
import {
  facetMetadata,
  facetParamsFor,
  resolveFacet,
} from "@/features/storefront/components/category/facet-route";

/**
 * A curated filtered view of a category — see facet-route.ts for why the
 * kind is a literal path segment rather than a dynamic one.
 */
export const revalidate = 3600;

const KIND = "colour" as const;

export async function generateStaticParams() {
  return facetParamsFor(KIND);
}

type Params = Promise<{ category: string; value: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { category, value } = await params;
  return facetMetadata(await resolveFacet(category, KIND, value));
}

export default async function Page({ params }: { params: Params }) {
  const { category, value } = await params;
  const data = await resolveFacet(category, KIND, value);
  if (!data) notFound();
  return <FacetLanding {...data} />;
}
