/**
 * Builds and checks product page copy.
 *
 * The rewrite covers most of the catalogue, so the copy is written as structured
 * data and turned into Portable Text here rather than each author hand-rolling
 * blocks. Two reasons: a block written by hand without a `_key` breaks Studio and
 * the renderer, and a structure decided per product produces forty pages that each
 * look slightly different.
 *
 * The validator enforces the house rules. It is deliberately strict and it fails
 * rather than warns, because the whole point of the rewrite is that the previous
 * copy passed nobody's check.
 */

export interface CopySection {
  /** Every section is titled. A section with no heading is what made the old
   *  pages read as one unbroken block of text. */
  heading: string;
  paragraphs?: string[];
  /** Rendered as green ticks. Short, concrete, no full stops. */
  bullets?: string[];
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface ProductCopy {
  /** Sanity document _id, published (no `drafts.` prefix). */
  productId: string;
  /** For the reviewer's benefit in dry-run output; not written. */
  title: string;
  /** One or two sentences. Shown above the description and used as the Merchant
   *  feed description, so it has to stand alone. */
  summary: string;
  tagline?: string;
  sections: CopySection[];
  faqs: ProductFaq[];
  specs?: { label: string; value: string }[];
  highlights?: string[];
  deliveryNotes?: string;
  warrantyNotes?: string;
}

export interface Span {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
}

export interface Block {
  _type: "block";
  _key: string;
  style: string;
  listItem?: string;
  level?: number;
  markDefs: never[];
  children: Span[];
}

/**
 * Deterministic key from the content and its position.
 *
 * Deterministic rather than random so that re-running with unchanged copy produces
 * an identical document — a diff in Studio's history should mean the copy changed,
 * not that the script ran again.
 */
function keyFor(prefix: string, index: number, text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++)
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return `${prefix}${index}${Math.abs(hash).toString(36).slice(0, 6)}`;
}

function block(
  style: string,
  text: string,
  index: number,
  listItem?: string,
): Block {
  return {
    _type: "block",
    _key: keyFor(listItem ? "li" : style, index, text),
    style,
    ...(listItem ? { listItem, level: 1 } : {}),
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: keyFor("s", index, text),
        text,
        marks: [],
      },
    ],
  };
}

/**
 * Sections to Portable Text.
 *
 * Headings are `h2`, never `h1`: the page template already emits the page's only
 * `h1`, and two is an outline error that screen readers announce.
 */
export function buildDescription(sections: CopySection[]): Block[] {
  const blocks: Block[] = [];
  let index = 0;
  for (const section of sections) {
    blocks.push(block("h2", section.heading, index++));
    for (const paragraph of section.paragraphs ?? [])
      blocks.push(block("normal", paragraph, index++));
    for (const bullet of section.bullets ?? [])
      blocks.push(block("normal", bullet, index++, "bullet"));
  }
  return blocks;
}

/** Phrases the brief bans outright, with what to do instead. */
export const BANNED_PHRASES: [RegExp, string][] = [
  [/\bluxury homes\b/i, "name the room or the buyer instead"],
  [/\bboutique hotels?\b/i, "trade language — write for one household"],
  [/\btimeless craftsmanship\b/i, "say what was actually made, and how"],
  [/\binterior designers?\b/i, "trade language — write for one household"],
  [/\bpremium materials\b/i, "name the material"],
  [/\bcontemporary elegance\b/i, "describe the shape or the finish"],
  [/\bcommercial interiors?\b/i, "trade language — write for one household"],
  [/\bproperty developers?\b/i, "trade language — write for one household"],
  [/\bshow homes?\b/i, "trade language — write for one household"],
  [/\bhospitality\b/i, "trade language — write for one household"],
  [/\bspecification[- ]ready\b/i, "trade language"],
  [/\beffortlessly\b/i, "cut it; the sentence works without it"],
  [/\belevate\b/i, "cut it"],
  [/\bfocal point\b/i, "say what the eye actually goes to"],
  [/\bstand the test of time\b/i, "say what makes it durable"],
  [/\bperfect for\b/i, "too easy — be specific about who and why"],
  [/\bstunning\b/i, "show it instead of asserting it"],
  [/\bexquisite\b/i, "overwrought"],
  [/\bnestled\b/i, "overwrought"],
  [/\bin today's world\b/i, "filler"],
  [/\bwhether you're\b/i, "the whether-you're construction is a tell"],
  [/\bmore than just\b/i, "the more-than-just construction is a tell"],
  [
    /\bnot only\b.*\bbut also\b/i,
    "the not-only-but-also construction is a tell",
  ],
];

/**
 * Names that must never appear in customer copy, each with the name to print when
 * it is found. Paired with a label rather than deriving one from the pattern
 * source, which produces unreadable output for anything with escapes in it.
 */
export const BANNED_NAMES: [RegExp, string][] = [
  [/D\.?I\.? Designs/i, "D.I. Designs"],
  [/didesigns/i, "didesigns.co.uk"],
  [/sooxos/i, "Sooxos"],
  [/cp ?light/i, "CP Lighting"],
  [/olivia'?s/i, "Olivia's"],
  [/nicholas john/i, "Nicholas John Interiors"],
  [/cuckooland/i, "Cuckooland"],
  [/wayfair/i, "Wayfair"],
  [/dunelm/i, "Dunelm"],
  [/john lewis/i, "John Lewis"],
  [/\bamazon\b/i, "Amazon"],
];

const URL_RE = /https?:\/\/|\bwww\.[a-z0-9-]+\.[a-z]{2,}/i;

/** Tells that the text came out of a chat window. */
const TOOL_TELLS =
  /\bas an AI\b|\bI hope this helps\b|\bCertainly[!,]|\bfeel free to\b|\bIn conclusion\b|\bLet me know\b|^note\s*:|\bSEO[- ]friendly\b|\bplaceholder\b|\b(TODO|FIXME|TBC)\b|\[\d+\]/i;

export interface ValidationIssue {
  severity: "error" | "warning";
  what: string;
}

/**
 * Checks one product's copy against the house rules.
 *
 * `otherFaqQuestions` is every FAQ question already used elsewhere in the
 * catalogue, so that "Does it require assembly?" appearing on thirty products is
 * caught. The brief asks for FAQs someone would genuinely search, which means
 * questions specific enough that they cannot be shared.
 */
export function validateCopy(
  copy: ProductCopy,
  otherFaqQuestions: Set<string> = new Set(),
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (what: string) => issues.push({ severity: "error", what });
  const warn = (what: string) => issues.push({ severity: "warning", what });

  // Shape first. A file missing `sections` or `faqs` entirely used to throw here
  // rather than report, which turned one malformed file into a crash with no
  // indication of which file caused it.
  if (!copy || typeof copy !== "object") {
    err("not an object");
    return issues;
  }
  if (typeof copy.productId !== "string" || !copy.productId)
    err("no productId");
  if (typeof copy.summary !== "string") err("summary is missing");
  if (!Array.isArray(copy.sections)) err("sections is missing or not an array");
  if (!Array.isArray(copy.faqs)) err("faqs is missing or not an array");
  if (issues.some((i) => i.severity === "error")) return issues;

  const allText = [
    copy.summary,
    copy.tagline ?? "",
    ...copy.sections.flatMap((s) => [
      s.heading,
      ...(s.paragraphs ?? []),
      ...(s.bullets ?? []),
    ]),
    ...copy.faqs.flatMap((f) => [f.question, f.answer]),
    ...(copy.highlights ?? []),
  ].join("\n");

  for (const [pattern, why] of BANNED_PHRASES) {
    const hit = pattern.exec(allText);
    if (hit) err(`banned phrase "${hit[0]}" — ${why}`);
  }

  for (const [pattern, name] of BANNED_NAMES)
    if (pattern.test(allText)) err(`names ${name} — remove it`);

  if (URL_RE.test(allText)) err("contains a URL");
  if (TOOL_TELLS.test(allText)) err("contains a drafting artefact");

  if (!copy.summary.trim()) err("no summary");
  else if (copy.summary.length > 320)
    err(`summary is ${copy.summary.length} chars; Merchant Center truncates`);
  else if (copy.summary.length < 60) warn("summary is very short");

  if (copy.sections.length < 3)
    err(`only ${copy.sections.length} sections; needs at least 3`);
  for (const section of copy.sections) {
    if (!section.heading.trim()) err("a section has no heading");
    if (!(section.paragraphs ?? []).length && !(section.bullets ?? []).length)
      err(`section "${section.heading}" has no content`);
    for (const bullet of section.bullets ?? [])
      if (/[.]$/.test(bullet.trim()))
        warn(`bullet ends in a full stop: "${bullet.slice(0, 40)}"`);
  }

  // Headings should agree on capitalisation within a document. Sentence case is
  // the house choice, being easier to keep consistent across forty products than
  // Title Case, which invites arguments about "and" and "the".
  const titleCased = copy.sections.filter((s) => {
    const words = s.heading.split(/\s+/).filter((w) => w.length > 3);
    return words.length > 1 && words.every((w) => /^[A-Z]/.test(w));
  });
  if (titleCased.length && titleCased.length < copy.sections.length)
    warn(
      `${titleCased.length} of ${copy.sections.length} headings are Title Case and the rest are not`,
    );

  if (copy.faqs.length < 4)
    err(`only ${copy.faqs.length} FAQs; needs at least 4`);
  const seen = new Set<string>();
  for (const faq of copy.faqs) {
    const normalised = faq.question.trim().toLowerCase().replace(/\s+/g, " ");
    if (seen.has(normalised)) err(`duplicate FAQ: "${faq.question}"`);
    seen.add(normalised);
    if (otherFaqQuestions.has(normalised))
      err(`FAQ already used on another product: "${faq.question}"`);
    if (!faq.question.trim().endsWith("?"))
      warn(`FAQ is not a question: "${faq.question.slice(0, 44)}"`);
    if (!faq.answer.trim()) err(`FAQ "${faq.question}" has no answer`);
  }

  // Two spaces or a trailing space in a question is how the previous FAQs were
  // stored, and it shows in the rendered page.
  for (const faq of copy.faqs)
    if (/\s{2,}|\s$/.test(faq.question))
      warn(`FAQ has stray whitespace: "${faq.question}"`);

  return issues;
}

/** Normalised question text, for cross-product duplicate detection. */
export function faqKey(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}
