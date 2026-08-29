import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FaqJsonLd } from "@/components/shared/json-ld";
import { ArticleDetail } from "@/features/storefront/components/content/article-detail";
import { getBuyingGuide, getBuyingGuides } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * A day, not an hour.
 *
 * A Sanity publish already revalidates this path on demand through
 * /api/revalidate, so the timer is not what makes an edit appear — it is only
 * the fallback for a page nobody has told us changed. At an hour, a crawler
 * walking the catalogue regenerates every page it touches every hour, and each
 * regeneration is a function invocation, several Sanity queries and an ISR
 * write. At a day it is a twenty-fourth of that, and an edit still shows
 * immediately.
 */
export const revalidate = 86400;

export async function generateStaticParams() {
  const guides = await getBuyingGuides({ limit: 200 });
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getBuyingGuide(slug);
  return buildMetadata({
    title: guide?.title ?? "Buying Guides",
    description: guide?.excerpt ?? "Considered buying guides from Kaiku.",
    path: `/learn/${slug}`,
    image: guide?.coverImage ?? undefined,
    seo: guide?.seo,
  });
}

export default async function BuyingGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await getBuyingGuide(slug);
  if (!guide) notFound();

  // Only real, answered pairs reach the schema. An FAQPage carrying a blank
  // answer is a structured-data error, and Google reports it as one.
  const faqs = (guide.faqs ?? []).filter(
    (faq): faq is { question: string; answer: string } =>
      Boolean(faq?.question?.trim() && faq?.answer?.trim()),
  );

  return (
    <>
      {faqs.length ? <FaqJsonLd faqs={faqs} /> : null}
      <ArticleDetail
        eyebrowLabel="Buying Guides"
        backHref="/learn"
        title={guide.title}
        coverImage={guide.coverImage}
        author={guide.author}
        publishedAt={guide.publishedAt}
        body={guide.body}
        relatedCategory={guide.relatedCategory}
        relatedProducts={guide.relatedProducts}
        faqs={faqs}
      />
    </>
  );
}
