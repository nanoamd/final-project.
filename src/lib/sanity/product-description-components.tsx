import type { PortableTextComponents } from "@portabletext/react";
import { Check } from "lucide-react";

/**
 * PortableText config for product descriptions specifically.
 *
 * The shared `portableTextComponents` config serves pages, posts and buying
 * guides, where a description is an article. A product description is a different
 * shape of thing: it is scanned rather than read, in sections, with lists of
 * concrete facts. Rendering it with the article styles produced pages that were
 * one long undifferentiated column — the complaint being that it takes ages to
 * scroll and nothing signals where one idea ends and the next begins.
 *
 * Three differences from the article config:
 *
 *   - Every `h2` opens with a rule across the column. A heading alone is a weak
 *     divider once the page is long; a rule makes each section visibly its own.
 *   - Bullets are green ticks, not discs. Product bullets are almost always
 *     "this is included / this is true of it", and a tick reads as confirmation
 *     where a disc reads as an inventory.
 *   - Wider spacing between blocks, because the sections are short and the gaps
 *     are what make them legible as sections.
 *
 * `h1` is mapped to an `<h2>` element for the same reason as in the article
 * config: the page template already emits the page's only `h1`.
 */
export const productDescriptionComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-graphite mb-4 text-[15px] leading-[1.75] last:mb-0">
        {children}
      </p>
    ),
    h1: ({ children }) => <SectionHeading>{children}</SectionHeading>,
    h2: ({ children }) => <SectionHeading>{children}</SectionHeading>,
    // Third level sits inside a section, so it gets no rule of its own —
    // another rule here would break the section back apart.
    h3: ({ children }) => (
      <h3 className="text-ink font-display mt-8 mb-3 text-lg tracking-tight">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-ink mt-6 mb-2 text-[15px] font-semibold">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-brass text-graphite my-6 border-l-2 pl-5 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mb-6 grid gap-2.5 sm:grid-cols-2">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="text-graphite mb-6 ml-5 list-decimal space-y-2 text-[15px] leading-relaxed">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-2.5 text-[14px] leading-relaxed">
        <Check
          className="mt-[3px] size-4 shrink-0 text-emerald-600"
          strokeWidth={2.5}
          aria-hidden
        />
        <span className="text-graphite">{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li className="text-graphite text-[15px] leading-relaxed">{children}</li>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="text-ink font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    /**
     * Renders as plain text, not an anchor.
     *
     * Product descriptions arrived with eight outbound links, every one a
     * citation to an external retailer — four to our own trade supplier, two to
     * shops selling the same item. Those are removed from the data, but the
     * renderer should not be the thing that makes the next one clickable either.
     * An internal link belongs in the copy an editor writes, not in imported
     * supplier text.
     */
    link: ({ children }) => <>{children}</>,
  },
};

function SectionHeading({ children }: { children?: React.ReactNode }) {
  return (
    <h2 className="border-line text-ink font-display mt-10 mb-4 border-t pt-8 text-[1.4rem] tracking-tight first:mt-0 first:border-t-0 first:pt-0">
      {children}
    </h2>
  );
}
