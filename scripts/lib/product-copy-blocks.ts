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
  /** `**bold**` inside a paragraph becomes a strong span, as in the existing copy. */
  paragraphs?: string[];
  bullets?: string[];
  /** Bullets rendered as "**Label:** value" — the specification list. */
  labelled?: { label: string; value: string }[];
  /** Paragraphs *after* the bullets. The Returns section closes on one. */
  after?: string[];
  /**
   * A policy section — Delivery, Returns, the caveat about natural variation.
   *
   * Excluded from the padding measurement, because a returns policy is *supposed* to
   * be identical on every product. padding.ts makes the same distinction ("Boilerplate
   * is not automatically padding") and scripts/audit-padding.ts splits the body from
   * the policy at exactly these headings. Marking it here keeps the three in step.
   */
  policy?: boolean;
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

/**
 * Splits `a **bold** b` into spans.
 *
 * The existing hand-written documents bold the product name inside the opening
 * paragraph and nowhere else, so the copy needs a way to say that without the source
 * file turning into span arrays.
 */
export function spansFor(text: string): { text: string; marks?: string[] }[] {
  const spans: { text: string; marks?: string[] }[] = [];
  for (const [i, part] of text.split(/\*\*/).entries()) {
    if (!part) continue;
    spans.push(i % 2 ? { text: part, marks: ["strong"] } : { text: part });
  }
  return spans.length ? spans : [{ text }];
}

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

/** An observed feature was described in prose but not recorded on the document. */
export class UnrecordedFactError extends Error {
  constructor(
    readonly slug: string,
    readonly terms: string[],
  ) {
    super(
      `${slug}: observed features not recorded in highlights, badges or specs: ${terms.join(", ")}`,
    );
    this.name = "UnrecordedFactError";
  }
}

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
      blocks.push(block(copy.slug, "normal", spansFor(paragraph)));
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
    for (const paragraph of section.after ?? [])
      blocks.push(block(copy.slug, "normal", spansFor(paragraph)));
  }

  /* An observed feature has to be recorded, not just described. Anything listed in
   * `facts.observed` must appear in a highlight or a spec on the same document, so the
   * anchor it earns is backed by something a reader can see in the page's own data. */
  const recorded = [
    ...(copy.highlights ?? []),
    ...(copy.badges ?? []),
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
  if (unrecorded.length) throw new UnrecordedFactError(copy.slug, unrecorded);

  const verdict = judgeCopy(bodyProse(copy), anchorsWithObserved(copy));
  if (verdict.ratio > MAX_PADDING_RATIO)
    throw new PaddingError(
      copy.slug,
      verdict.ratio,
      verdict.padded.map((p) => p.sentence),
    );

  return blocks;
}

/**
 * The prose the padding check judges: the summary plus the body paragraphs.
 *
 * Headings and bullets are excluded because scripts/audit-padding.ts excludes them —
 * a four-word bullet is a label, not a padded sentence. Policy sections are excluded
 * for the reason given on `CopySection.policy`.
 */
function bodyProse(copy: ProductCopy): string[] {
  return [
    copy.summary,
    ...copy.sections
      .filter((section) => !section.policy)
      .flatMap((section) => [
        ...(section.paragraphs ?? []),
        ...(section.after ?? []),
      ]),
  ].map((text) => text.replace(/\*\*/g, ""));
}

/**
 * The document's anchors, plus the features read off the photograph.
 *
 * The room, use and style tags come from the copy itself rather than from `facts`,
 * because this module is what writes them to the document — a sentence about a kitchen
 * on a product tagged Kitchen is anchored to something a reader can check.
 */
function anchorsWithObserved(copy: ProductCopy): Set<string> {
  const anchors = anchorsFor({
    ...copy.facts,
    roomTags: copy.roomTags,
    useTags: copy.useTags,
    styleTags: copy.styleTags,
  });
  for (const term of copy.facts.observed ?? [])
    for (const token of term.toLowerCase().split(/\s+/)) {
      anchors.add(token);
      anchors.add(token.endsWith("s") ? token.slice(0, -1) : `${token}s`);
    }
  return anchors;
}

/** The padding score for a piece of copy, for reporting without throwing. */
export function paddingRatio(copy: ProductCopy): number {
  return judgeCopy(bodyProse(copy), anchorsWithObserved(copy)).ratio;
}

/**
 * The sentences carrying no anchor, whether or not the copy passes.
 *
 * Copy that passes at exactly the limit is one edit away from failing, so the ones
 * that scraped through are worth seeing rather than only the ones that did not.
 */
export function paddedSentences(copy: ProductCopy): string[] {
  return judgeCopy(bodyProse(copy), anchorsWithObserved(copy)).padded.map(
    (verdict) => verdict.sentence,
  );
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
      ...(s.after ?? []),
    ]),
  ]
    .join(" ")
    .replace(/\*\*/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Re-exported so batch-level checks normalise text the same way the audit does. */
export { fingerprint as fingerprintOf } from "./padding";
