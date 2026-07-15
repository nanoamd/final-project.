import type { Metadata } from "next";

import { ArticleList } from "@/features/storefront/components/content/article-list";
import { getBuyingGuides } from "@/lib/sanity/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Buying Guides",
  description:
    "Practical, jargon-free buying guides on saunas, cold therapy and building a wellness garden that lasts.",
};

export default async function LearnPage() {
  const guides = await getBuyingGuides({ limit: 24 });

  return (
    <ArticleList
      eyebrow="Buying Guides"
      title="In-depth guides, honestly written"
      intro="Practical, jargon-free buying guides on saunas, cold therapy and building a wellness garden that lasts."
      basePath="/learn"
      articles={guides}
      emptyTitle="In-depth guides, publishing soon"
      emptyIntro="Practical, jargon-free buying guides on saunas, cold therapy and building a wellness garden that lasts. This is where our knowledge base will live."
    />
  );
}
