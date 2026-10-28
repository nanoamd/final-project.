import Image from "next/image";

import { ComingSoon } from "@/components/shared/coming-soon";
import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

export interface ArticleSummary {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string | null;
  /** A related product photo, for an article with no cover of its own. */
  fallbackImage?: string | null;
  fallbackImageAlt?: string | null;
  publishedAt: string;
}

/** An article's own cover, or a photo of what it is about. */
function coverFor(article: ArticleSummary): string | null {
  return article.coverImage ?? article.fallbackImage ?? null;
}

/** Shared listing grid for /journal and /learn — title, excerpt and date. */
export function ArticleList({
  eyebrow,
  title,
  intro,
  basePath,
  articles,
  emptyTitle,
  emptyIntro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  basePath: string;
  articles: ArticleSummary[];
  emptyTitle: string;
  emptyIntro: string;
}) {
  if (!articles.length) {
    return (
      <ComingSoon eyebrow={eyebrow} title={emptyTitle} intro={emptyIntro} />
    );
  }

  return (
    <Container className="py-20 md:py-28">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="text-muted mt-5 text-lg leading-relaxed text-pretty">
          {intro}
        </p>
      </div>

      <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <AppLink
            key={article.slug}
            href={`${basePath}/${article.slug}`}
            className="group"
          >
            {/* Every one of the 43 guides and 3 posts has an empty
                coverImage, so this frame was always empty — 46 bordered grey
                boxes across /learn and /journal. `fallbackImage` is a real
                photo of the first product the article is about, which every
                article has. object-contain for the fallback, because a
                product shot is composed for a square and cover-cropping one
                into 4:3 lops the piece in half. */}
            {coverFor(article) ? (
              <div className="border-line bg-paper relative aspect-[4/3] overflow-hidden rounded-xl border">
                <Image
                  src={coverFor(article)!}
                  alt={
                    article.coverImage
                      ? ""
                      : (article.fallbackImageAlt ?? article.title)
                  }
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`transition-transform duration-700 group-hover:scale-[1.04] ${
                    article.coverImage ? "object-cover" : "object-contain p-6"
                  }`}
                />
              </div>
            ) : null}
            <p className="text-muted mt-4 text-[12px] tracking-[0.08em] uppercase">
              {new Date(article.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-ink group-hover:text-brass font-display mt-1.5 text-xl leading-tight transition-colors">
              {article.title}
            </p>
            {article.excerpt ? (
              <p className="text-graphite mt-2 text-[14px] leading-relaxed">
                {article.excerpt}
              </p>
            ) : null}
          </AppLink>
        ))}
      </div>
    </Container>
  );
}
