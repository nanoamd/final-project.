import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleDetail } from "@/features/storefront/components/content/article-detail";
import { getBuyingGuide, getBuyingGuides } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

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

  return (
    <ArticleDetail
      eyebrowLabel="Buying Guides"
      backHref="/learn"
      title={guide.title}
      coverImage={guide.coverImage}
      author={guide.author}
      publishedAt={guide.publishedAt}
      body={guide.body}
      relatedCategory={guide.relatedCategory}
    />
  );
}
