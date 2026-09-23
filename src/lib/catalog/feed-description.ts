/**
 * The description a Shopping listing is matched against.
 *
 * ## What was wrong
 *
 * The feed sent `summary` and nothing else. Measured across all 908 products:
 *
 * | Field                    | Min | Average |    Max |
 * | ------------------------ | --: | ------: | -----: |
 * | `summary` (what we sent) |  44 |     181 |    877 |
 * | the page's own copy      | 645 |   2,496 | 11,735 |
 *
 * Google allows 5,000 characters. **Every product already has at least 645
 * characters of written copy and the feed was sending an average of 181** —
 * about 7% of what exists, on the field Shopping matches a query against.
 * 220 products were going out with under 100 characters.
 *
 * That copy is not filler. It is the text on the product page, written per
 * product, and the machine-voice pass has already been through it. It was
 * simply never wired to the feed.
 *
 * ## Shape
 *
 * Three parts, in the order a reader would want them:
 *
 * 1. **The summary**, because it is the precise factual line — material,
 *    colour, dimensions, weight — and the one sentence written to stand alone.
 * 2. **The page copy**, which carries the design and use language a search
 *    like "ribbed glass storage jar with wooden lid" matches on.
 * 3. **A specification tail** built from the stored specs, dimensions and
 *    weight. Short, concrete, and full of the attribute words a query uses.
 *
 * Deduplicated, because a good many summaries are the opening line of the body
 * and repeating it wastes the budget and reads badly.
 *
 * ## Why plain text and why a hard cap
 *
 * Google's specification is plain text up to 5,000 characters; markup is
 * stripped or rejected. Portable Text is flattened before it gets here, so the
 * only shaping left is whitespace. The cap cuts at a sentence boundary rather
 * than mid-word — an item truncated at "the drawers run on soft-clo" reads as
 * broken, and the description is customer-facing wherever Google chooses to
 * show it.
 */

/** Google's documented maximum for `description`. */
export const MAX_DESCRIPTION = 5000;

/**
 * Left well under the ceiling on purpose. Nothing is gained past a few
 * thousand characters of matching text, and a description that runs to the
 * limit on every item is the kind of thing that reads as generated.
 */
const TARGET_LENGTH = 2200;

export interface FeedDescriptionInput {
  summary: string | null;
  /** The product page's own copy, already flattened out of Portable Text. */
  body: string | null;
  specs: { label?: string | null; value?: string | null }[] | null;
  dimensions: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
  dimensionUnit: string | null;
  weight: number | null;
  colours: string[] | null;
  materials: string[] | null;
}

/** Collapse runs of whitespace, drop control characters, trim. */
function tidy(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Does the body already open with the summary?
 *
 * A good many summaries are simply the body's first sentence, and printing
 * both wastes the budget and reads like a stutter. Comparing fixed-length
 * slices was the first attempt and it was wrong: a summary shorter than the
 * slice never matched, so the duplicate survived for exactly the products
 * where the summary is one short line — which is most of them.
 *
 * `startsWith` is the real question being asked, with a prefix comparison
 * behind it to catch a body that diverges after a few words.
 */
function bodyRepeatsSummary(body: string, summary: string): boolean {
  if (!summary || !body) return false;
  const lowerBody = body.toLowerCase();
  const lowerSummary = summary.toLowerCase();
  if (lowerBody.startsWith(lowerSummary)) return true;
  const shared = Math.min(60, lowerSummary.length);
  return lowerBody.slice(0, shared) === lowerSummary.slice(0, shared);
}

/**
 * Cut to `limit` characters, ending on a sentence where one is available.
 *
 * Falls back to a word boundary, then to a hard cut, so a body with no full
 * stop in its last stretch still comes out clean rather than mid-word.
 */
export function truncateAtSentence(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const window = value.slice(0, limit);
  const sentence = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("! "),
    window.lastIndexOf("? "),
  );
  // Only honour a sentence break in the last third, or a long paragraph with
  // no punctuation would be cut back to almost nothing.
  if (sentence > limit * 0.6) return window.slice(0, sentence + 1);
  const word = window.lastIndexOf(" ");
  return word > limit * 0.6 ? window.slice(0, word) : window;
}

/** "Dimensions: 18 × 18 × 51cm. Weight: 2.5kg. Material: ceramic." */
function specificationTail(input: FeedDescriptionInput): string {
  const parts: string[] = [];

  const unit = input.dimensionUnit?.trim() || "cm";
  const { length, width, height } = input.dimensions ?? {};
  const measured = [length, width, height].filter(
    (n): n is number => typeof n === "number" && n > 0,
  );
  if (measured.length) {
    parts.push(`Dimensions: ${measured.join(" × ")}${unit}`);
  }
  if (typeof input.weight === "number" && input.weight > 0) {
    parts.push(`Weight: ${input.weight}kg`);
  }
  if (input.materials?.length) {
    parts.push(`Material: ${input.materials.join(", ")}`);
  }
  if (input.colours?.length) {
    parts.push(`Colour: ${input.colours.join(", ")}`);
  }
  for (const spec of input.specs ?? []) {
    const label = spec.label?.trim();
    const value = spec.value?.trim();
    if (label && value) parts.push(`${label}: ${value}`);
  }

  return parts.length ? `${parts.join(". ")}.` : "";
}

/**
 * Builds the `description` for one feed item.
 *
 * Never returns an empty string when any input has text: a feed row with no
 * description is disapproved outright, so the summary alone is the floor.
 */
export function feedDescription(input: FeedDescriptionInput): string {
  const summary = tidy(input.summary ?? "");
  const body = tidy(input.body ?? "");
  const tail = specificationTail(input);

  // Where the body already opens with the summary it is a superset of it, so
  // the body alone is both shorter and more complete than printing the pair.
  const sections = bodyRepeatsSummary(body, summary)
    ? [body]
    : [summary, body].filter(Boolean);

  const prose = truncateAtSentence(
    sections.join(" "),
    // Leave room for the tail, which carries the attribute words and is worth
    // more per character than another paragraph of prose.
    Math.max(TARGET_LENGTH - tail.length - 1, 400),
  );

  const out = tail ? `${prose} ${tail}`.trim() : prose;
  return truncateAtSentence(out, MAX_DESCRIPTION);
}
