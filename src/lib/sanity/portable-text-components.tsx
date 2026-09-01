import type { PortableTextComponents } from "@portabletext/react";
import Image from "next/image";

/**
 * Shared PortableText renderer config for page/post/buying-guide bodies —
 * maps rich-text blocks onto the site's existing typography tokens rather
 * than default browser styling.
 */
export const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-graphite mb-5 text-[15px] leading-relaxed last:mb-0">
        {children}
      </p>
    ),
    /**
     * Rendered as an `<h2>` element on purpose, despite being an `h1` block.
     *
     * 227 blocks across 42 product descriptions are styled `h1`, and this style
     * had no entry here at all — so PortableText fell back to its default and
     * they came out at body-text size, indistinguishable from the paragraph above
     * them. That is the bug: a heading that does not look like one.
     *
     * The element is `h2` rather than `h1` because the page template already
     * emits the one `h1` a document should have (the product or page title). Two
     * `h1`s on a page is an outline error screen readers announce and Google
     * reads. So: largest heading size in the body, correct position in the
     * outline.
     */
    h1: ({ children }) => (
      <h2 className="text-ink font-display mt-10 mb-4 text-[1.75rem] tracking-tight first:mt-0 sm:text-3xl">
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h2 className="text-ink font-display mt-10 mb-4 text-2xl font-bold tracking-tight first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-ink font-display mt-8 mb-3 text-xl font-semibold tracking-tight first:mt-0">
        {children}
      </h3>
    ),
    // Not used in the dataset today, but mapped so a fourth level added in Studio
    // cannot silently render at paragraph size the way h1 did.
    h4: ({ children }) => (
      <h4 className="text-ink font-display mt-6 mb-2 text-lg tracking-tight first:mt-0">
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
      <ul className="text-graphite mb-5 ml-5 list-disc space-y-2 text-[15px] leading-relaxed">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="text-graphite mb-5 ml-5 list-decimal space-y-2 text-[15px] leading-relaxed">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="text-ink font-semibold">{children}</strong>
    ),
    link: ({ value, children }) => (
      <a
        href={value?.href}
        className="text-brass underline underline-offset-2"
        target={value?.href?.startsWith("http") ? "_blank" : undefined}
        rel={
          value?.href?.startsWith("http") ? "noopener noreferrer" : undefined
        }
      >
        {children}
      </a>
    ),
  },
  types: {
    /**
     * A reference table.
     *
     * Wrapped in its own horizontally scrollable container rather than left to
     * the page: a five-column table of measurements is wider than a phone, and
     * a body that scrolls sideways is worse than a table that does.
     */
    guideTable: ({ value }) => {
      const headers: string[] = Array.isArray(value?.headers)
        ? value.headers
        : [];
      const rows: { cells?: string[] }[] = Array.isArray(value?.rows)
        ? value.rows
        : [];
      if (!headers.length || !rows.length) return null;
      return (
        <figure className="my-8">
          {value?.caption ? (
            <figcaption className="text-muted mb-3 text-[13px]">
              {value.caption}
            </figcaption>
          ) : null}
          <div className="border-line overflow-x-auto rounded-xl border">
            <table className="w-full border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-line border-b">
                  {headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="text-ink px-4 py-3 font-medium whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={(row.cells ?? []).join("|") || index}
                    className="border-line text-graphite border-b last:border-b-0"
                  >
                    {(row.cells ?? []).map((cell, cellIndex) => (
                      <td
                        key={`${cell}-${cellIndex}`}
                        className={`px-4 py-3 ${cellIndex === 0 ? "text-ink font-medium" : ""}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );
    },
    image: ({ value }) => {
      const url: string | undefined = value?.asset?.url;
      if (!url) return null;
      return (
        <span className="border-line relative my-8 block aspect-[16/10] w-full overflow-hidden rounded-xl border">
          <Image
            src={url}
            alt={value?.alt ?? ""}
            fill
            className="object-cover"
          />
        </span>
      );
    },
  },
};
