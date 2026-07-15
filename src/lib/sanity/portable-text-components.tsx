import Image from "next/image";
import type { PortableTextComponents } from "@portabletext/react";

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
    h2: ({ children }) => (
      <h2 className="text-ink font-display mt-10 mb-4 text-2xl tracking-tight first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-ink font-display mt-8 mb-3 text-xl tracking-tight first:mt-0">
        {children}
      </h3>
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
    strong: ({ children }) => <strong className="text-ink font-semibold">{children}</strong>,
    link: ({ value, children }) => (
      <a
        href={value?.href}
        className="text-brass underline underline-offset-2"
        target={value?.href?.startsWith("http") ? "_blank" : undefined}
        rel={value?.href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) => {
      const url: string | undefined = value?.asset?.url;
      if (!url) return null;
      return (
        <span className="border-line relative my-8 block aspect-[16/10] w-full overflow-hidden rounded-xl border">
          <Image src={url} alt={value?.alt ?? ""} fill className="object-cover" />
        </span>
      );
    },
  },
};
