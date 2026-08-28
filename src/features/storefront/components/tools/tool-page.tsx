import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/shared/json-ld";
import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { formatPrice } from "@/lib/format";
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
  /** Answered on the page and emitted as FAQPage schema, so they can win the rich result. */
  faqs: ToolFaq[];
  /** Real products the tool is about, so the page passes link equity into stock. */
  products?: SanityProduct[];
  productsHeading?: string;
  /** Further reading, by slug and title — buying guides live at /learn/<slug>. */
  guides?: { slug: string; title: string }[];
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
  faqs,
  products = [],
  productsHeading,
  guides = [],
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

      <Container width="narrow" className="py-20 md:py-28">
        <Eyebrow>Tools</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          {heading}
        </h1>
        <p className="text-muted mt-6 max-w-lg text-[15px] leading-relaxed">
          {intro}
        </p>

        <div className="mt-12">{children}</div>

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
                    <span className="text-ink text-[15px]">{product.name}</span>
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
      </Container>
    </>
  );
}
