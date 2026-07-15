import { PortableText } from "@portabletext/react";

import { ComingSoon } from "@/components/shared/coming-soon";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { portableTextComponents } from "@/lib/sanity/portable-text-components";
import type { SanityPage } from "@/types/sanity-content";

/**
 * Renders a `page` document (Contact/Returns/Delivery/Privacy/Terms/About) —
 * title, intro and a rich-text body. Falls back to the existing ComingSoon
 * placeholder when the page hasn't been created in Studio yet, so the route
 * never 404s or breaks — it just looks like it did before content existed.
 */
export function GenericPage({
  page,
  fallbackTitle,
  fallbackIntro,
}: {
  page: SanityPage | null;
  fallbackTitle: string;
  fallbackIntro: string;
}) {
  if (!page) {
    return <ComingSoon title={fallbackTitle} intro={fallbackIntro} />;
  }

  return (
    <Container className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <Eyebrow>{page.title}</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          {page.title}
        </h1>
        {page.intro ? (
          <p className="text-muted mt-6 text-lg leading-relaxed text-pretty">
            {page.intro}
          </p>
        ) : null}
        {page.body?.length ? (
          <div className="mt-10">
            <PortableText value={page.body} components={portableTextComponents} />
          </div>
        ) : null}
      </div>
    </Container>
  );
}
