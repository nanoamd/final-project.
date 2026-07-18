import type { Metadata } from "next";

import { ArticleList } from "@/features/storefront/components/content/article-list";
import { getPosts } from "@/lib/sanity/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Editorial and writing on home improvement, wellness living and outdoor living.",
};

export default async function JournalPage() {
  const posts = await getPosts({ limit: 24 });

  return (
    <ArticleList
      eyebrow="The Journal"
      title="Considered writing, occasionally"
      intro="Editorial on home improvement, wellness living and the rituals that make a house feel like home."
      basePath="/journal"
      articles={posts}
      emptyTitle="The journal, publishing soon"
      emptyIntro="Editorial on home improvement and outdoor living — this is where it will live."
    />
  );
}
