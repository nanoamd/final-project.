/**
 * Finds padding in product copy — sentences that add length without adding
 * information.
 *
 * Damien asked "can you make sure none of my products will be hit for padding then",
 * which needs padding to be something measurable rather than a matter of taste. It is.
 * A padded sentence is one that would read identically on a different product:
 *
 *   "Beautiful furniture should enhance both the function and atmosphere of a room."
 *   "Its elegant proportions allow it to integrate effortlessly into both
 *    residential and commercial environments."
 *
 * Neither says anything only this product could say. Against:
 *
 *   "The generous 180cm tabletop also provides the perfect space to display lamps."
 *   "Made primarily from reclaimed teak recovered from retired Indonesian fishing
 *    boats."
 *
 * Both carry something specific — a measurement, a material, a provenance.
 *
 * So the test is: does this sentence contain at least one **anchor** — a distinctive
 * word from the product's own title, a number, or a term from the catalogue's colour,
 * material, room or use vocabularies? A sentence with no anchor at all is padding.
 *
 * Three other things Google's helpful-content systems read as thin, all checked by
 * the caller across the whole catalogue rather than per product:
 *
 *   - the same paragraph appearing verbatim on many products
 *   - the same heading appearing on many products
 *   - length with no substance behind it — words per pound of price
 *
 * Boilerplate is not automatically padding. A shared returns policy is *supposed* to
 * be identical everywhere; that is a policy, not a sales pitch. What matters is
 * duplication inside the part of the page that is meant to describe the thing.
 *
 * Pure so it can be tested against the real copy — see padding.test.ts.
 */

/** Words too common to prove a sentence is about anything in particular. */
const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "of",
  "for",
  "with",
  "in",
  "on",
  "to",
  "from",
  "by",
  "at",
  "as",
  "is",
  "are",
  "be",
  "been",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "your",
  "you",
  "our",
  "we",
  "or",
  "but",
  "if",
  "so",
  "than",
  "then",
  "also",
  "both",
  "all",
  "any",
  "each",
  "every",
  "more",
  "most",
  "very",
  "will",
  "can",
  "may",
  "into",
  "while",
  "which",
  "whether",
  "when",
  "where",
  "what",
  "there",
  "their",
  "them",
  "they",
  "has",
  "have",
  "had",
  "was",
  "were",
  // Furniture-marketing words that appear on everything and prove nothing.
  "beautiful",
  "elegant",
  "stylish",
  "luxury",
  "luxurious",
  "premium",
  "quality",
  "perfect",
  "ideal",
  "stunning",
  "timeless",
  "classic",
  "modern",
  "designed",
  "design",
  "style",
  "home",
  "homes",
  "room",
  "rooms",
  "space",
  "spaces",
  "interior",
  "interiors",
  "piece",
  "pieces",
  "furniture",
  "collection",
  "character",
  "charm",
  "warmth",
  "feel",
  "look",
  "adds",
  "add",
  "brings",
  "bring",
  "makes",
  "make",
  "offers",
  "offer",
  "provides",
  "provide",
  "features",
  "feature",
  "combines",
  "combine",
  "creates",
  "create",
  "ensures",
  "ensure",
  "allows",
  "allow",
  "kaiku",
]);

const tokens = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * The words that make a sentence specific to *this* product.
 *
 * Built from the title plus whatever vocabularies the document carries. Singular and
 * plural both go in, because copy says "drawers" where a title says "Drawer".
 */
export function anchorsFor(product: {
  title: string;
  materialTags?: readonly string[] | null;
  colourTags?: readonly string[] | null;
  roomTags?: readonly string[] | null;
  useTags?: readonly string[] | null;
  primaryColour?: string | null;
}): Set<string> {
  const anchors = new Set<string>();
  const add = (value: string) => {
    for (const token of tokens(value)) {
      if (token.length < 3 || STOPWORDS.has(token)) continue;
      anchors.add(token);
      // "drawer" should match "drawers", and vice versa.
      anchors.add(token.endsWith("s") ? token.slice(0, -1) : `${token}s`);
    }
  };

  // The SEO tail of a title is still the product's own words.
  add(product.title.replace(/\s*\|\s*Kaiku.*$/i, "").replace(/\|/g, " "));
  for (const list of [
    product.materialTags,
    product.colourTags,
    product.roomTags,
    product.useTags,
  ])
    for (const tag of list ?? []) add(tag);
  if (product.primaryColour) add(product.primaryColour);

  return anchors;
}

/** Splits prose into sentences. Handles the "5mm" and "3-4 weeks" cases. */
export function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"'£])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface PaddingVerdict {
  sentence: string;
  /** Words that made it specific. Empty means padding. */
  anchors: string[];
}

/**
 * Judges one sentence.
 *
 * A digit counts as an anchor on its own: "Delivered within 2-4 weeks" and "The
 * 180cm tabletop" are both concrete even when no title word appears. Very short
 * fragments are exempt — a three-word line is a label, not a padded paragraph.
 */
export function judgeSentence(
  sentence: string,
  anchors: Set<string>,
): PaddingVerdict {
  const found = tokens(sentence).filter((token) => anchors.has(token));
  if (/\d/.test(sentence)) found.push("(number)");
  return { sentence, anchors: [...new Set(found)] };
}

export interface ProductPadding {
  total: number;
  padded: PaddingVerdict[];
  /** 0–1. Share of sentences carrying nothing specific. */
  ratio: number;
}

/** Sentences shorter than this are labels or list items, not padded prose. */
const MIN_WORDS = 6;

export function judgeCopy(
  paragraphs: readonly string[],
  anchors: Set<string>,
): ProductPadding {
  const judged: PaddingVerdict[] = [];
  for (const paragraph of paragraphs) {
    for (const sentence of sentences(paragraph)) {
      if (tokens(sentence).length < MIN_WORDS) continue;
      judged.push(judgeSentence(sentence, anchors));
    }
  }
  const padded = judged.filter((v) => v.anchors.length === 0);
  return {
    total: judged.length,
    padded,
    ratio: judged.length ? padded.length / judged.length : 0,
  };
}

/** Normalised for cross-product comparison — casing and spacing are not content. */
export function fingerprint(text: string): string {
  return tokens(text).join(" ");
}
