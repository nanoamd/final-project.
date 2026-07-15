import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { portableTextComponents } from "@/lib/sanity/portable-text-components";
import type { SanityAuthor } from "@/types/sanity-content";

/** Shared detail view for a /journal/[slug] post or /learn/[slug] buying guide. */
export function ArticleDetail({
  eyebrowLabel,
  backHref,
  title,
  coverImage,
  author,
  publishedAt,
  body,
}: {
  eyebrowLabel: string;
  backHref: string;
  title: string;
  coverImage?: string | null;
  author?: SanityAuthor | null;
  publishedAt: string;
  body: PortableTextBlock[];
}) {
  return (
    <article>
      <Container className="pt-12 pb-8 md:pt-16">
        <AppLink
          href={backHref}
          className="text-muted hover:text-ink text-[12px] tracking-[0.08em] uppercase transition-colors"
        >
          ← {eyebrowLabel}
        </AppLink>
        <h1 className="font-display text-ink mt-5 max-w-3xl text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <div className="text-muted mt-5 flex items-center gap-3 text-[13px]">
          {author?.name ? <span>{author.name}</span> : null}
          {author?.name ? <span aria-hidden>·</span> : null}
          <span>
            {new Date(publishedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </Container>

      {coverImage ? (
        <Container>
          <div className="border-line relative aspect-[16/9] w-full overflow-hidden rounded-2xl border">
            <Image src={coverImage} alt="" fill sizes="100vw" className="object-cover" />
          </div>
        </Container>
      ) : null}

      <Container className="py-14">
        <div className="mx-auto max-w-2xl">
          <PortableText value={body} components={portableTextComponents} />
        </div>
      </Container>
    </article>
  );
}
