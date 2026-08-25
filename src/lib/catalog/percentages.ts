/**
 * Takes supplier material percentages out of customer copy.
 *
 * Damien, on a planter summary reading "a beautifully crafted piece made of 90%
 * stoneware and 10% plating": _"90% 10% what is the need in saying that, you
 * have weird descriptions"_.
 *
 * There is no need. A composition breakdown is a line in a supplier's data
 * feed, useful for customs and for nobody else. A shopper wants to know it is
 * stoneware. 659 products carry one of these in their summary or description.
 *
 * The rule is to remove the numbers and keep the materials, because the
 * materials are the true and useful part:
 *
 *   "made of 90% stoneware and 10% plating"  →  "made of stoneware and plating"
 *   "made from 100% iron"                    →  "made from iron"
 *   "MDF (10%), glass (40%)"                 →  "MDF, glass"
 *
 * Some phrasings do not survive losing the number — "comprising 95% of the
 * material" becomes "comprising of the material" — so where the result does not
 * read as English the whole sentence goes instead. A missing sentence is
 * recoverable; a broken one is on the page.
 */

/** A material with a percentage against it, in the orders the catalogue uses. */
const PERCENT_BEFORE = /\b(\d{1,3})\s?%\s+(?=[a-z])/gi;
const PERCENT_AFTER = /\s*\(\s*(\d{1,3})\s?%\s*\)/gi;
const PERCENT_TRAILING = /\s+(\d{1,3})\s?%(?=[\s,.;)]|$)/gi;

/**
 * Phrases that only make sense with a number in them.
 *
 * Removing the figure from "comprising 95% of the material" leaves nonsense, so
 * the sentence carrying it is dropped rather than repaired.
 */
const NEEDS_ITS_NUMBER =
  /\b(?:compris\w+|account\w+ for|making up|makes up|represent\w+|constitut\w+|by (?:weight|volume)|of the (?:material|composition|total))\b/i;

/** A composition list with nothing but zeroes — meaningless either way. */
const ALL_ZERO = /\b0\s?%/;

export function hasPercentages(text: string): boolean {
  return /\b\d{1,3}\s?%/.test(text);
}

/** Sentences, keeping their terminators. */
function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** One sentence with its percentages removed, or null to drop it. */
export function cleanSentence(sentence: string): string | null {
  if (!hasPercentages(sentence)) return sentence;
  // "Materials: MDF 0%, Mirrored Glass 0%" says nothing at all.
  if (ALL_ZERO.test(sentence) && !/\b[1-9]\d{0,2}\s?%/.test(sentence))
    return null;
  if (NEEDS_ITS_NUMBER.test(sentence)) {
    // Drop only the clause that needs its number, not the whole sentence:
    // "constructed from high-quality carbon steel, comprising 95% of the
    // material" still carries the fact that it is carbon steel, and throwing
    // that away to remove a percentage is a worse trade than keeping it.
    const clauses = sentence.split(/\s*[,;]\s*/);
    const kept = clauses.filter(
      (clause) => !NEEDS_ITS_NUMBER.test(clause) && !hasPercentages(clause),
    );
    if (!kept.length) return null;
    const rebuilt = kept
      .join(", ")
      .replace(/\s+([.!?])/g, "$1")
      .trim();
    const ended = /[.!?]$/.test(rebuilt) ? rebuilt : `${rebuilt}.`;
    return ended.split(/\s+/).filter(Boolean).length >= 4 ? ended : null;
  }

  let cleaned = sentence
    .replace(PERCENT_AFTER, "")
    .replace(PERCENT_BEFORE, "")
    .replace(PERCENT_TRAILING, "");

  // Tidy what removal leaves behind: doubled spaces, a space before a comma,
  // an "and" or comma left dangling, an empty bracket pair.
  cleaned = cleaned
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/,\s*(?=[,.])/g, "")
    .replace(/\b(?:and|with|of|from)\s*([.,;])/gi, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  if (hasPercentages(cleaned)) return null;
  // A sentence reduced to a fragment is worse than no sentence.
  if (cleaned.split(/\s+/).filter(Boolean).length < 4) return null;
  return cleaned;
}

/** A whole passage with its percentages removed. */
export function stripPercentages(text: string): string {
  if (!hasPercentages(text)) return text;
  return sentencesOf(text)
    .map(cleanSentence)
    .filter((s): s is string => Boolean(s))
    .join(" ")
    .trim();
}

export interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  children?: {
    _type?: string;
    _key?: string;
    text?: string;
    marks?: string[];
  }[];
  [key: string]: unknown;
}

const textOf = (block: Block) =>
  (block.children ?? []).map((c) => c?.text ?? "").join("");

export interface StripBlocksResult {
  blocks: Block[];
  changed: { before: string; after: string }[];
}

/** Portable Text with percentages removed, blocks emptied entirely dropped. */
export function stripPercentagesFromBlocks(
  description: unknown,
): StripBlocksResult {
  if (!Array.isArray(description)) return { blocks: [], changed: [] };
  const changed: { before: string; after: string }[] = [];
  const blocks: Block[] = [];

  for (const block of description as Block[]) {
    if (block._type !== "block") {
      blocks.push(block);
      continue;
    }
    const original = textOf(block);
    if (!hasPercentages(original)) {
      blocks.push(block);
      continue;
    }
    const cleaned = stripPercentages(original);
    changed.push({ before: original, after: cleaned });
    if (!cleaned) continue;
    blocks.push({
      ...block,
      children: [
        {
          _type: "span",
          _key: `${block._key ?? "k"}-0`,
          text: cleaned,
          marks: [],
        },
      ],
    });
  }
  return { blocks, changed };
}
