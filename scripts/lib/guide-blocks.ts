/**
 * Portable-text builders for the scripts that write buying guides.
 *
 * Guides are written in code rather than typed into Studio because they carry
 * measurements read from the catalogue, and a figure typed by hand is a figure
 * that drifts. These are the block shapes the renderer understands, in the
 * order a guide tends to use them.
 */

let seq = 0;
/** Portable text needs a stable key per node; uniqueness within a document. */
export const k = (): string => `gb${seq++}`;

/** A run of text, or a run of text that links somewhere. */
export type Part = string | [text: string, href: string];

export interface Span {
  _key: string;
  _type: "span";
  marks: string[];
  text: string;
}
export interface MarkDef {
  _key: string;
  _type: "inlineLink";
  href: string;
}
export interface Block {
  _key: string;
  _type: "block";
  style: string;
  markDefs: MarkDef[];
  children: Span[];
}

const block = (style: string, parts: Part[]): Block => {
  const markDefs: MarkDef[] = [];
  const children = parts.map((part): Span => {
    if (typeof part === "string") {
      return { _key: k(), _type: "span", marks: [], text: part };
    }
    const defKey = k();
    markDefs.push({ _key: defKey, _type: "inlineLink", href: part[1] });
    return { _key: k(), _type: "span", marks: [defKey], text: part[0] };
  });
  return { _key: k(), _type: "block", style, markDefs, children };
};

export const p = (...parts: Part[]): Block => block("normal", parts);
export const h2 = (text: string): Block => block("h2", [text]);

export interface ImageSlot {
  _key: string;
  _type: "image";
  alt: string;
  brief: string;
  caption?: string;
}

/**
 * A reserved space for a picture.
 *
 * No `asset` key at all. The renderer draws nothing without one, so a reader
 * sees no gap and Google indexes no instruction; Studio shows the block
 * reading "IMAGE NEEDED —" followed by this brief, sitting in the body exactly
 * where the picture belongs.
 */
export const imageSlot = (
  alt: string,
  brief: string,
  caption?: string,
): ImageSlot => ({
  _key: k(),
  _type: "image",
  alt,
  brief,
  ...(caption ? { caption } : {}),
});

export const table = (
  caption: string,
  headers: string[],
  rows: string[][],
) => ({
  _key: k(),
  _type: "guideTable",
  caption,
  headers,
  rows: rows.map((cells) => ({ _key: k(), _type: "guideTableRow", cells })),
});

export const tool = (name: string, caption: string) => ({
  _key: k(),
  _type: "guideTool",
  tool: name,
  caption,
});

export const linkRow = (
  intro: string,
  links: [label: string, href: string][],
) => ({
  _key: k(),
  _type: "guideLinkRow",
  intro,
  links: links.map(([label, href]) => ({
    _key: k(),
    _type: "guideLink",
    label,
    href,
  })),
});

export const faq = (question: string, answer: string, key: string) => ({
  _key: key,
  _type: "faqEntry",
  question,
  answer,
});

/** Words of prose, ignoring tables and captions — the length that matters. */
export const wordCount = (body: { _type: string }[]): number =>
  body
    .filter((b): b is Block => b._type === "block")
    .flatMap((b) => b.children.map((c) => c.text))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

/** Every href used inside a sentence, so a script can report on its own work. */
export const inlineHrefs = (body: { _type: string }[]): string[] =>
  body
    .filter((b): b is Block => b._type === "block")
    .flatMap((b) => b.markDefs.map((d) => d.href));
