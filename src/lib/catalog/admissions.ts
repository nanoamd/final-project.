/**
 * Removes copy that admits we do not know something.
 *
 * Damien, on a live product page opening with "The details regarding assembly
 * requirements … are not listed. For further information, please refer to the
 * supplied instruction manual or contact customer support":
 *
 *   "how is the first paragraph of this saying somethings not listed, why is
 *    it even a paragraph in the first place let alone, the first paragraph,
 *    thats language we shouldnt be using"
 *
 * He is right, and the fix is deletion rather than rewriting. A product page
 * has two honest options about a fact: state it, or say nothing. Announcing
 * the gap is worse than silence — it tells a shopper we did not check, and it
 * sends them to "customer support" for something they came here to find out.
 *
 * The work is done a sentence at a time, not a paragraph at a time. The same
 * paragraph often carries a real instruction beside the admission:
 *
 *   "The specifics on the number of cartons it ships in are also not provided.
 *    It is advisable to check your access points regarding width and height."
 *
 * The first sentence goes. The second is genuine advice and stays. Cutting the
 * whole paragraph would throw away the only useful thing in it.
 */

/** A Portable Text block, in the shape this file needs to reason about. */
export interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: {
    _type?: string;
    _key?: string;
    text?: string;
    marks?: string[];
  }[];
  [key: string]: unknown;
}

/**
 * Sentences that admit a gap.
 *
 * "not listed" is the one the existing quality scorer missed — it knew "not
 * specified", "not stated" and "not provided", which is why this page scored
 * as publishable while opening with an apology.
 */
const ADMITS_A_GAP =
  /\b(?:not (?:listed|specified|stated|provided|available|detailed|mentioned|disclosed|given|confirmed|known)|no information|not been (?:listed|provided|specified)|unspecified|remains? unclear|unclear from|we do not (?:know|have)|is unknown|are unknown)\b/i;

/**
 * Sentences that send the reader somewhere else for the answer.
 *
 * A shopper is on the page precisely to avoid doing this. "Contact customer
 * support" for a dimension is the page admitting it failed.
 */
const DEFLECTS =
  /\b(?:refer to (?:the )?(?:supplied |product |manufacturer'?s? )?(?:instruction|instructions|manual|packaging|documentation|product page|listing)|contact (?:customer )?(?:support|us|our team)|please enquire|check with (?:the|your) (?:supplier|manufacturer)|see the (?:supplier|manufacturer)'?s? (?:site|website|page)|for (?:further|more) information,? please)\b/i;

/** Splits a paragraph into sentences, keeping their terminators. */
export function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Whether one sentence should be removed from customer-facing copy. */
export function isAdmission(sentence: string): boolean {
  return ADMITS_A_GAP.test(sentence) || DEFLECTS.test(sentence);
}

/**
 * The sentences worth keeping from one paragraph.
 *
 * Returns an empty string when nothing survives, which is the caller's signal
 * to drop the block entirely.
 */
export function cleanParagraph(text: string): string {
  return sentencesOf(text)
    .filter((sentence) => !isAdmission(sentence))
    .join(" ")
    .trim();
}

const textOf = (block: Block): string =>
  (block.children ?? []).map((child) => child?.text ?? "").join("");

const isHeading = (block: Block): boolean =>
  typeof block.style === "string" && /^h[1-6]$/.test(block.style);

export interface StripResult {
  blocks: Block[];
  /** Sentences removed, for the change log and the report. */
  removed: string[];
  /** Headings dropped because nothing was left underneath them. */
  emptiedHeadings: string[];
}

/**
 * Strips admissions from a whole description.
 *
 * Two passes, because they cannot be done together: a heading is only empty
 * once its paragraphs have been cleaned, and a paragraph cannot know whether
 * it was the last one under its heading.
 */
export function stripAdmissions(description: unknown): StripResult {
  if (!Array.isArray(description))
    return { blocks: [], removed: [], emptiedHeadings: [] };

  const blocks = description as Block[];
  const removed: string[] = [];

  // Pass one: clean the text of every non-heading block.
  const cleaned: Block[] = [];
  for (const block of blocks) {
    if (block._type !== "block" || isHeading(block)) {
      cleaned.push(block);
      continue;
    }
    const original = textOf(block);
    if (!original.trim()) {
      cleaned.push(block);
      continue;
    }
    const kept = cleanParagraph(original);
    if (kept === original) {
      cleaned.push(block);
      continue;
    }
    for (const sentence of sentencesOf(original))
      if (isAdmission(sentence)) removed.push(sentence);
    if (!kept) continue;
    // Rewriting the children to a single span loses any per-span marks. The
    // blocks this touches are plain prose — a paragraph carrying a link is not
    // one that also announces a missing fact — and keeping the block's own
    // _key means Sanity treats it as an edit rather than a delete and insert.
    cleaned.push({
      ...block,
      children: [
        {
          _type: "span",
          _key: `${block._key ?? "k"}-0`,
          text: kept,
          marks: [],
        },
      ],
    });
  }

  // Pass two: drop headings with nothing left beneath them.
  const emptiedHeadings: string[] = [];
  const result: Block[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const block = cleaned[i]!;
    if (!isHeading(block)) {
      result.push(block);
      continue;
    }
    let hasContent = false;
    for (let j = i + 1; j < cleaned.length; j++) {
      const next = cleaned[j]!;
      if (isHeading(next)) break;
      if (textOf(next).trim()) {
        hasContent = true;
        break;
      }
    }
    if (hasContent) result.push(block);
    else emptiedHeadings.push(textOf(block));
  }

  return { blocks: result, removed, emptiedHeadings };
}
