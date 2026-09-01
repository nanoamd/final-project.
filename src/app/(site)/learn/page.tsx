import type { Metadata } from "next";

import { ArticleList } from "@/features/storefront/components/content/article-list";
import { getBuyingGuides } from "@/lib/sanity/queries";
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
  title: "Buying Guides",
  description:
    "Practical, jargon-free buying guides on furniture, saunas, cold therapy and garden structures that last.",
  path: "/learn",
});

export default async function LearnPage() {
  const guides = await getBuyingGuides({ limit: 24 });

  return (
    <ArticleList
      eyebrow="Buying Guides"
      title="In-depth guides, honestly written"
      intro="Practical, jargon-free buying guides on furniture, saunas, cold therapy and garden structures that last."
      basePath="/learn"
      articles={guides}
      emptyTitle="In-depth guides, publishing soon"
      emptyIntro="Practical, jargon-free buying guides on furniture, saunas, cold therapy and garden structures that last. This is where our knowledge base will live."
    />
  );
}
