/**
 * Removes site policy from product descriptions.
 *
 * Damien, on a garden dining set whose entire description was a parts list
 * followed by "Delivery" and "Returns": "wow".
 *
 * The product page already has a "Delivery, Returns & Warranty" tab
 * (product-tabs.tsx) that renders the real policy from the real fields. So a
 * Delivery heading inside the description puts the same words on the same page
 * twice, and puts them on **1,623 product pages identically** — which is
 * duplicate content on almost the whole catalogue.
 *
 * It does something worse than that, though. Boilerplate is words, and words
 * are what the quality scorer counts, so a description made of nothing but a
 * parts list and a returns policy scored as a written page. That is how eight
 * products with nothing whatsoever to say about themselves reached the
 * "publishable now" list.
 *
 * Deletion only, and nothing is lost: every sentence removed here is either
 * already rendered by the delivery tab or is generic to every order.
 */

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

/**
 * Headings that introduce site policy rather than the product.
 *
 * "Assembly" and "Care" are deliberately absent: those are genuinely
 * product-specific and belong on the page. This is only the policy that is
 * identical across every product we sell.
 */
const POLICY_WORDS = new Set([
  "delivery",
  "deliveries",
  "shipping",
  "dispatch",
  "return",
  "returns",
  "refund",
  "refunds",
  "exchange",
  "exchanges",
  "warranty",
  "warranties",
  "guarantee",
  "guarantees",
  "payment",
  "payments",
  "support",
  "customer",
  "policy",
  "policies",
  "information",
  "info",
  "help",
  "promise",
  "contact",
  "us",
  "our",
]);

/** Words that join a heading together and carry no meaning of their own. */
const JOINERS = new Set(["and", "&", "or", "the", "your", "with", "plus", ","]);

const isHeading = (block: Block) =>
  typeof block.style === "string" && /^h[1-6]$/.test(block.style);

const textOf = (block: Block) =>
  (block.children ?? []).map((child) => child?.text ?? "").join("");

/**
 * A heading is policy when every meaningful word in it is a policy word.
 *
 * Written this way rather than as one long alternation because the catalogue
 * combines them freely — "Delivery", "Delivery & Returns", "Delivery, Returns
 * & Warranty" — and a pattern that lists the combinations misses the fourth
 * one. It also keeps "Assembly and Delivery Access" out, because "assembly"
 * and "access" are not policy words, so that heading stays.
 */
export function isPolicyHeading(heading: string): boolean {
  const words = heading
    .toLowerCase()
    .replace(/[^a-z&,\s]/g, " ")
    .split(/[\s,]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !JOINERS.has(word));
  if (!words.length) return false;
  return words.every((word) => POLICY_WORDS.has(word));
}

export interface StripPolicyResult {
  blocks: Block[];
  /** The headings removed, and everything that sat under them. */
  removedSections: string[];
  /** Words removed, for the report. */
  wordsRemoved: number;
}

/**
 * A description with its policy sections taken out.
 *
 * Removes the heading and every block beneath it up to the next heading of the
 * same level or higher, which is the section as a reader sees it.
 */
export function stripPolicySections(description: unknown): StripPolicyResult {
  if (!Array.isArray(description))
    return { blocks: [], removedSections: [], wordsRemoved: 0 };

  const blocks = description as Block[];
  const kept: Block[] = [];
  const removedSections: string[] = [];
  let wordsRemoved = 0;

  let dropping = false;
  let droppingLevel = 0;

  for (const block of blocks) {
    if (isHeading(block)) {
      const heading = textOf(block).trim();
      const level = Number(block.style!.slice(1));
      if (dropping && level <= droppingLevel) dropping = false;
      if (!dropping && isPolicyHeading(heading)) {
        dropping = true;
        droppingLevel = level;
        removedSections.push(heading);
        wordsRemoved += heading.split(/\s+/).filter(Boolean).length;
        continue;
      }
      if (!dropping) {
        kept.push(block);
        continue;
      }
    }
    if (dropping) {
      wordsRemoved += textOf(block).split(/\s+/).filter(Boolean).length;
      continue;
    }
    kept.push(block);
  }

  return { blocks: kept, removedSections, wordsRemoved };
}

/**
 * Whether what is left says anything about the product.
 *
 * A parts list is not a description. "What's in the Set" tells you the box has
 * six chairs in it, which is useful and is not the same as telling you what
 * they are made of, how big they are or where they suit.
 */
const NOT_ABOUT_THE_PRODUCT =
  /^\s*(?:what'?s in the (?:set|box)|box contents|in the box|included|contents)\b/i;

export function describesTheProduct(description: unknown): boolean {
  if (!Array.isArray(description)) return false;
  const { blocks } = stripPolicySections(description);
  const headings = (blocks as Block[])
    .filter(isHeading)
    .map((b) => textOf(b).trim());
  const substantive = headings.filter((h) => !NOT_ABOUT_THE_PRODUCT.test(h));
  if (substantive.length) return true;
  // No headings at all can still be a real description — a few paragraphs of
  // prose with no structure counts, provided there is enough of it.
  if (headings.length === 0) {
    const words = (blocks as Block[])
      .map(textOf)
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;
    return words >= 25;
  }
  return false;
}
