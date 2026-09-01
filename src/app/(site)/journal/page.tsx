import type { Metadata } from "next";

import { ArticleList } from "@/features/storefront/components/content/article-list";
import { getPosts } from "@/lib/sanity/queries";
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

export const metadata: Metadata = buildMetadata({
  title: "Journal",
  description:
    "Editorial and writing on furniture, garden and outdoor living, and wellness living.",
  path: "/journal",
});

export default async function JournalPage() {
  const posts = await getPosts({ limit: 24 });

  return (
    <ArticleList
      eyebrow="The Journal"
      title="Considered writing, occasionally"
      intro="Editorial on furniture, garden and outdoor living, and the rituals that make a house feel like home."
      basePath="/journal"
      articles={posts}
      emptyTitle="The journal, publishing soon"
      emptyIntro="Editorial on furniture and outdoor living — this is where it will live."
    />
  );
}
