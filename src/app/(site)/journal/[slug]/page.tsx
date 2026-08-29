import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleDetail } from "@/features/storefront/components/content/article-detail";
import { getPost, getPosts } from "@/lib/sanity/queries";
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
  const posts = await getPosts({ limit: 200 });
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return buildMetadata({
    title: post?.title ?? "Journal",
    description: post?.excerpt ?? "Stories and ideas from Kaiku.",
    path: `/journal/${slug}`,
    image: post?.coverImage ?? undefined,
    seo: post?.seo,
  });
}

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <ArticleDetail
      eyebrowLabel="The Journal"
      backHref="/journal"
      title={post.title}
      coverImage={post.coverImage}
      author={post.author}
      publishedAt={post.publishedAt}
      body={post.body}
      relatedProducts={post.relatedProducts}
    />
  );
}
