import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/shared/json-ld";
import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ArticleSidebar } from "@/features/storefront/components/content/article-sidebar";
import { formatPrice } from "@/lib/format";
import type { ArticleSidebarData } from "@/lib/sanity/queries";
import type { SanityProduct } from "@/types/sanity-content";

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolPageProps {
  /** The `<h1>`. Written as the question someone would type, where that reads naturally. */
  heading: string;
  /** One or two sentences under the heading, saying what the tool answers. */
  intro: string;
  /** `/tools/<slug>`, for the breadcrumb. */
  path: string;
  /** The interactive part. */
  children: React.ReactNode;
  /**
   * How the answer is arrived at, in prose.
   *
   * Every tool here is deterministic arithmetic over real product specs, and
   * saying so is worth more than hiding it: a shopper trusts a number they can
   * check, and a page with an explanation on it has something for a search
   * query to match. The tools shipped as a heading, a paragraph and a widget,
   * which is roughly forty words — nothing to rank, and nothing to believe.
   */
  method: { heading: string; paragraphs: string[] };
  /**
   * Further sections, each with its own heading.
   *
   * `method` alone gave a tool page roughly 450 words of its own content, and
   * that is not enough to rank against a 1,500-word article — Damien checked
   * "how to measure clock size" by hand and found the site nowhere, which is
   * the honest test. Worse, a single block can only answer one shape of
   * question: the clock page explained what size to BUY and said nothing about
   * how to MEASURE one, so a whole cluster of real queries had nothing on the
   * page to match.
   *
   * Sections fix both. Each gets an `h2`, which is what a query matches
   * against, and the page can cover the cluster rather than one query in it.
   */
  sections?: { heading: string; paragraphs: string[] }[];
  /** Answered on the page and emitted as FAQPage schema, so they can win the rich result. */
  faqs: ToolFaq[];
  /** Real products the tool is about, so the page passes link equity into stock. */
  products?: SanityProduct[];
  productsHeading?: string;
  /** Further reading, by slug and title — buying guides live at /learn/<slug>. */
  guides?: { slug: string; title: string }[];
  /**
   * The rail of related links, the same one every guide carries.
   *
   * It was built for `/learn` and `/journal` because the brief said blogs, and
   * the tool pages never got it — which was backwards. Damien: _"theres not many
   * links in these pages... i cant see the dropdown bars etc on the left"_. He
   * was right: a tool page carried 18 internal links against a guide's 28, and
   * the tools are the pages being pushed to rank.
   */
  sidebar?: ArticleSidebarData | null;
  /** The category the rail and its tool list key off, e.g. `coffee-tables`. */
  sidebarCategorySlug?: string | null;
  sidebarCategoryName?: string | null;
}

/**
 * The shared frame for every tool page.
 *
 * The calculators themselves were fine. What was missing was everything around
 * them: the tools carried no explanation, no FAQs, no schema and no links into
 * the catalogue, so they could not rank and, having ranked, would not have sent
 * anyone anywhere. This adds the parts that do that work, in one place, so a
 * new tool gets them by construction rather than by being remembered.
 */
export function ToolPage({
  heading,
  intro,
  path,
  children,
  method,
  sections,
  faqs,
  products = [],
  productsHeading,
  guides = [],
  sidebar,
  sidebarCategorySlug,
  sidebarCategoryName,
}: ToolPageProps) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Tools", url: "/tools" },
          { name: heading, url: path },
        ]}
      />
      {faqs.length ? <FaqJsonLd faqs={faqs} /> : null}

      <Container className="py-20 md:py-28">
        {/* `narrow` (max-w-3xl) had no room for a rail beside the content, so
            the container widens and the reading width is re-imposed here —
            max-w-2xl alone until `lg`, where the second column appears. */}
        <div className="mx-auto max-w-2xl lg:max-w-5xl">
          <Eyebrow>Tools</Eyebrow>
          <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
            {heading}
          </h1>
          <p className="text-muted mt-6 max-w-lg text-[15px] leading-relaxed">
            {intro}
          </p>

          {/* Two columns from `lg`, and the rail is written AFTER the content
            then pulled left with `order` — so on a phone the calculator comes
            first. Someone who tapped a search result wants the answer, not a
            list of other pages. The rail sticks on desktop because these pages
            now run to two thousand words and links that scroll away stop being
            links. Same arrangement as a guide, for the same reasons. */}
          <div className="mt-12 flex flex-col gap-14 lg:flex-row lg:items-start lg:gap-12">
            <div className="min-w-0 lg:order-2 lg:flex-1">
              <div>{children}</div>

              <section className="border-line mt-16 border-t pt-10">
                <h2 className="font-display text-ink text-2xl tracking-tight">
                  {method.heading}
                </h2>
                <div className="mt-5 flex max-w-[68ch] flex-col gap-4">
                  {method.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="text-muted text-[15px] leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>

              {(sections ?? []).map((section) => (
                <section
                  key={section.heading}
                  className="border-line mt-14 border-t pt-10"
                >
                  <h2 className="font-display text-ink text-2xl tracking-tight">
                    {section.heading}
                  </h2>
                  <div className="mt-5 flex max-w-[68ch] flex-col gap-4">
                    {section.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className="text-muted text-[15px] leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}

              {faqs.length ? (
                <section className="border-line mt-14 border-t pt-10">
                  <h2 className="font-display text-ink text-2xl tracking-tight">
                    Common questions
                  </h2>
                  <dl className="mt-6 flex max-w-[68ch] flex-col gap-7">
                    {faqs.map((faq) => (
                      <div key={faq.question}>
                        <dt className="text-ink text-[15px] font-medium">
                          {faq.question}
                        </dt>
                        <dd className="text-muted mt-2 text-[15px] leading-relaxed">
                          {faq.answer}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              {products.length ? (
                <section className="border-line mt-14 border-t pt-10">
                  <h2 className="font-display text-ink text-2xl tracking-tight">
                    {productsHeading ?? "The products this applies to"}
                  </h2>
                  <ul className="mt-6 flex flex-col gap-3">
                    {products.slice(0, 8).map((product) => (
                      <li key={product.slug}>
                        <AppLink
                          href={`/shop/${product.category}/${product.slug}`}
                          className="border-line hover:border-ink flex items-baseline justify-between gap-4 rounded-lg border px-4 py-3 transition-colors"
                        >
                          <span className="text-ink text-[15px]">
                            {product.name}
                          </span>
                          <span className="text-muted shrink-0 text-[13px]">
                            {formatPrice(product.price)}
                          </span>
                        </AppLink>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {guides.length ? (
                <section className="border-line mt-14 border-t pt-10">
                  <h2 className="font-display text-ink text-2xl tracking-tight">
                    Read next
                  </h2>
                  <ul className="mt-6 flex flex-col gap-3">
                    {guides.map((guide) => (
                      <li key={guide.slug}>
                        <AppLink
                          href={`/learn/${guide.slug}`}
                          className="text-ink hover:text-brass text-[15px] underline underline-offset-4 transition-colors"
                        >
                          {guide.title}
                        </AppLink>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            {sidebar ? (
              <div className="lg:sticky lg:top-24 lg:order-1 lg:w-60 lg:shrink-0 lg:self-start">
                <ArticleSidebar
                  sidebar={sidebar}
                  categorySlug={sidebarCategorySlug ?? undefined}
                  categoryName={sidebarCategoryName ?? undefined}
                />
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </>
  );
}
