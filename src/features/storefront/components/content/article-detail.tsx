import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { productDisplayName } from "@/lib/catalog/product-name";
import { formatPrice } from "@/lib/format";
import type { ArticleSidebarData } from "@/lib/sanity/queries";
import type {
  SanityAuthor,
  SanityRelatedProductRef,
} from "@/types/sanity-content";

import { articlePortableTextComponents } from "./article-portable-text";
import { ArticleSidebar } from "./article-sidebar";

/** Shared detail view for a /journal/[slug] post or /learn/[slug] buying guide. */
export function ArticleDetail({
  eyebrowLabel,
  backHref,
  title,
  coverImage,
  author,
  publishedAt,
  body,
  relatedCategory,
  relatedProducts,
  faqs,
  sidebar,
}: {
  eyebrowLabel: string;
  backHref: string;
  title: string;
  coverImage?: string | null;
  author?: SanityAuthor | null;
  publishedAt: string;
  body: PortableTextBlock[];
  relatedCategory?: { slug: string; name: string } | null;
  relatedProducts?: SanityRelatedProductRef[];
  faqs?: { question: string; answer: string }[];
  /** Related reading for the left rail. Absent on pages that have none. */
  sidebar?: ArticleSidebarData | null;
}) {
  // A reference is only useful if it resolves to a URL, and the URL needs the
  // category segment. Anything missing one is dropped rather than linked to a path
  // that would 404.
  const products = (relatedProducts ?? []).filter(
    (product) => product.title && product.category,
  );
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
            <Image
              src={coverImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </Container>
      ) : null}

      {/*
        Two columns from `lg` up, one below it.

        The sidebar is written after the body in the DOM and pulled to the left
        with `order` on desktop, so on a phone the article still comes first —
        a reader who tapped a search result wants the answer, not a list of
        other things to read. The rail sticks to the viewport on desktop
        because a guide runs long and links that scroll away stop being links.
      */}
      <Container className="py-14">
        <div className="mx-auto flex max-w-2xl flex-col gap-14 lg:max-w-5xl lg:flex-row lg:items-start lg:gap-12">
          <div className="min-w-0 lg:order-2 lg:max-w-2xl lg:flex-1">
            <PortableText
              value={body}
              components={articlePortableTextComponents}
            />

            {relatedCategory ? (
              <div className="border-line mt-10 border-t pt-10">
                <AppLink
                  href={`/shop/${relatedCategory.slug}`}
                  className={buttonVariants({ className: "w-fit" })}
                >
                  Shop {relatedCategory.name} →
                </AppLink>
              </div>
            ) : null}
          </div>

          {sidebar ? (
            <div className="lg:sticky lg:top-24 lg:order-1 lg:w-60 lg:shrink-0 lg:self-start">
              <ArticleSidebar
                sidebar={sidebar}
                categorySlug={relatedCategory?.slug}
                categoryName={relatedCategory?.name}
              />
            </div>
          ) : null}
        </div>
      </Container>

      {faqs?.length ? <ArticleFaqs faqs={faqs} /> : null}

      {products.length ? <ArticleProducts products={products} /> : null}
    </article>
  );
}

/**
 * The questions the guide gets asked, answered in full sentences.
 *
 * These are the same pairs emitted as FAQPage schema by the page above, so the
 * text a reader sees and the text Google quotes are the one thing. Rendering
 * them as headings rather than an accordion keeps them in the HTML for both.
 */
function ArticleFaqs({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <section className="border-line border-t">
      <Container className="py-14">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-ink font-display text-2xl tracking-tight">
            Common questions
          </h2>
          <dl className="mt-8 space-y-8">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-display text-ink text-[17px] leading-snug">
                  {faq.question}
                </dt>
                <dd className="text-muted mt-2 text-[15px] leading-relaxed">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

/**
 * The pieces the article discusses, linked.
 *
 * Worth its own section rather than a line of text: an article that names eleven
 * bedside tables and links to none of them is a dead end for the reader and worth
 * nothing to the crawler. The measurements quoted in the prose are the reason to
 * click, so the card carries the name and the price and lets the article do the
 * arguing.
 */
function ArticleProducts({
  products,
}: {
  products: SanityRelatedProductRef[];
}) {
  return (
    <section className="border-line bg-paper border-t">
      <Container className="py-14">
        <h2 className="text-ink font-display text-2xl tracking-tight">
          The pieces in this guide
        </h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.slug}>
              <AppLink
                href={`/shop/${product.category}/${product.slug}`}
                className="group block"
              >
                <div className="border-line bg-canvas relative aspect-[4/5] w-full overflow-hidden rounded-xl border">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <p className="text-ink group-hover:text-brass font-display mt-4 text-[16px] leading-snug transition-colors">
                  {/* The brand suffix is for the browser tab, not for a card in a
                      list of eight. This was `title.split("|")[0]`, which also threw
                      away a legitimate pipe — "Provence Dining Set | 4 Seater |
                      Kaiku" became "Provence Dining Set", losing the one detail that
                      distinguishes it from the 6-seater. */}
                  {productDisplayName(product.title ?? "")}
                </p>
                {typeof product.price === "number" ? (
                  <p className="text-muted mt-1 text-[13px]">
                    {formatPrice(product.price)}
                  </p>
                ) : null}
              </AppLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
