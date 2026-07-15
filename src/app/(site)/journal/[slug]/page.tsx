import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleDetail } from "@/features/storefront/components/content/article-detail";
import { getPost, getPosts } from "@/lib/sanity/queries";

export const revalidate = 60;

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
  return { title: post?.title ?? "Journal", description: post?.excerpt };
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
    />
  );
}
