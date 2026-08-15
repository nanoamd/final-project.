/**
 * Turns hand-written product copy into Sanity Portable Text, and refuses to hand back
 * anything that fails the padding test.
 *
 * The copy itself is written by hand, one product at a time, in scripts/copy/*.ts.
 * That separation is the point: a generator would produce the templated prose Damien
 * has spent months avoiding, and the padding audit showed exactly what that looks like
 * — 67 headings repeated across 3+ products and 26% of sentences saying nothing only
 * that product could say. So this module does the mechanical half only: block
 * structure, marks, list items, and the gate.
 *
 * The gate is the part worth trusting. `buildDescription` measures its own output with
 * scripts/lib/padding.ts and throws rather than returning copy over the threshold. It
 * is not possible to write a padded description through this path and have it reach
 * Sanity, which is a stronger guarantee than remembering to check.
 */
import { anchorsFor, judgeCopy } from "./padding";

export interface CopySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Bullets rendered as "**Label:** value" — the specification list. */
  labelled?: { label: string; value: string }[];
}

export interface ProductCopy {
  slug: string;
  /** Two sentences. Becomes the summary and the meta description. */
  summary: string;
  sections: CopySection[];
  /** Delivery *and* returns, per Damien: both live in the delivery box. */
  deliveryNotes: string;
  /** Same shape as the delivery note. Returns is deliberately left empty. */
  warrantyNotes: string;
  badges?: string[];
  highlights?: string[];
  styleTags?: string[];
  roomTags?: string[];
  useTags?: string[];
  /** For the padding check — the facts this copy is allowed to lean on. */
  facts: {
    title: string;
    materialTags?: string[];
    colourTags?: string[];
    primaryColour?: string | null;
    /**
     * Distinctive features read off the product photograph — "slats", "woven",
     * "pedestal", "wings".
     *
     * The padding check knows the title and the tag vocabularies, and nothing else. So
     * a sentence about the open slats on a garden chair scored as padding even though
     * "slats" is one of the most specific things that chair has: the word is simply not
     * recorded anywhere on the document.
     *
     * The honest fix is not to loosen the gate. It is to require that an observed
     * feature is *recorded* as well as described — every term listed here must also
     * appear in the copy's own `highlights` or `labelled` specs, which is asserted
     * below. That keeps the rule intact: an anchor is a fact on the document, never
     * just a word I liked in a sentence.
     */
    observed?: string[];
  };
}

interface Span {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
}

export interface Block {
  _type: "block";
  _key: string;
  style: string;
  listItem?: "bullet";
  level?: number;
  markDefs: never[];
  children: Span[];
}

/** Keys must be stable so re-running does not churn every block in the document. */
let counter = 0;
const key = (slug: string) =>
  `${slug.slice(0, 12)}-${(counter++).toString(36)}`;

function block(
  slug: string,
  style: string,
  spans: { text: string; marks?: string[] }[],
  listItem?: "bullet",
): Block {
  return {
    _type: "block",
    _key: key(slug),
    style,
    ...(listItem ? { listItem, level: 1 } : {}),
    markDefs: [],
    children: spans.map((span) => ({
      _type: "span" as const,
      _key: key(slug),
      text: span.text,
      marks: span.marks ?? [],
    })),
  };
}

/** How much of a description may say nothing specific. */
export const MAX_PADDING_RATIO = 0.1;

export class PaddingError extends Error {
  constructor(
    readonly slug: string,
    readonly ratio: number,
    readonly offenders: string[],
  ) {
    super(
      `${slug}: ${(ratio * 100).toFixed(0)}% of sentences carry nothing specific ` +
        `(limit ${MAX_PADDING_RATIO * 100}%)\n` +
        offenders.map((s) => `    "${s}"`).join("\n"),
    );
    this.name = "PaddingError";
  }
}

/**
 * The blocks for one product, in the order they appear on the page.
 *
 * Headings carry the `strong` mark to match the existing hand-written documents —
 * `product-description-components.tsx` renders them either way, but a mixed catalogue
 * would show up as inconsistent weight to anyone scrolling two products in a row.
 */
export function buildDescription(copy: ProductCopy): Block[] {
  counter = 0;
  const blocks: Block[] = [];

  for (const section of copy.sections) {
    blocks.push(
      block(copy.slug, "h2", [{ text: section.heading, marks: ["strong"] }]),
    );
    for (const paragraph of section.paragraphs ?? [])
      blocks.push(block(copy.slug, "normal", [{ text: paragraph }]));
    for (const bullet of section.bullets ?? [])
      blocks.push(block(copy.slug, "normal", [{ text: bullet }], "bullet"));
    for (const item of section.labelled ?? [])
      blocks.push(
        block(
          copy.slug,
          "normal",
          [
            { text: `${item.label}: `, marks: ["strong"] },
            { text: item.value },
          ],
          "bullet",
        ),
      );
  }

  /* An observed feature has to be recorded, not just described. Anything listed in
   * `facts.observed` must appear in a highlight or a spec on the same document, so the
   * anchor it earns is backed by something a reader can see in the page's own data. */
  const recorded = [
    ...(copy.highlights ?? []),
    ...copy.sections.flatMap((s) => [
      ...(s.bullets ?? []),
      ...(s.labelled ?? []).map((l) => `${l.label} ${l.value}`),
    ]),
  ]
    .join(" ")
    .toLowerCase();
  const unrecorded = (copy.facts.observed ?? []).filter(
    (term) => !recorded.includes(term.toLowerCase()),
  );
  if (unrecorded.length)
    throw new Error(
      `${copy.slug}: observed features not recorded in highlights or specs: ${unrecorded.join(", ")}`,
    );

  // Measured on the same input the audit measures: the summary plus body prose.
  // Bullets and headings are excluded there, so they are excluded here too.
  const prose = [
    copy.summary,
    ...copy.sections.flatMap((section) => section.paragraphs ?? []),
  ];
  const anchors = anchorsFor(copy.facts);
  for (const term of copy.facts.observed ?? [])
    for (const token of term.toLowerCase().split(/\s+/)) {
      anchors.add(token);
      anchors.add(token.endsWith("s") ? token.slice(0, -1) : `${token}s`);
    }
  const verdict = judgeCopy(prose, anchors);
  if (verdict.ratio > MAX_PADDING_RATIO)
    throw new PaddingError(
      copy.slug,
      verdict.ratio,
      verdict.padded.map((p) => p.sentence),
    );

  return blocks;
}

/** The padding score for a piece of copy, for reporting without throwing. */
export function paddingRatio(copy: ProductCopy): number {
  const anchors = anchorsFor(copy.facts);
  for (const term of copy.facts.observed ?? [])
    for (const token of term.toLowerCase().split(/\s+/)) {
      anchors.add(token);
      anchors.add(token.endsWith("s") ? token.slice(0, -1) : `${token}s`);
    }
  return judgeCopy(
    [copy.summary, ...copy.sections.flatMap((s) => s.paragraphs ?? [])],
    anchors,
  ).ratio;
}

/** Words in the rendered description, so length can be reported against price. */
export function wordCount(copy: ProductCopy): number {
  return [
    copy.summary,
    ...copy.sections.flatMap((s) => [
      s.heading,
      ...(s.paragraphs ?? []),
      ...(s.bullets ?? []),
      ...(s.labelled ?? []).map((l) => `${l.label} ${l.value}`),
    ]),
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}
