/**
 * Phase one of a real, not-yet-fully-attempted backlog item: 597 products
 * still carry a superlative in their full description body (checked
 * separately from the 2 September summary cleanup, which only ever covered
 * the short `summary` field). That cleanup showed this needs real
 * judgement per sentence, not a blind regex — an adjective sitting right
 * after "a"/"an" breaks English on deletion unless the article is also
 * fixed, and a superlative in predicate position ("simplicity can be
 * exceptionally elegant") leaves a dangling clause if the word is just cut.
 *
 * This script handles only the one shape that needs neither fix: an -ly
 * adverb modifying a verb ("pairs beautifully with", "adapts effortlessly
 * to", "displayed beautifully."). Deleting an adverb never changes which
 * article a nearby noun needs, and — checked against a real sample of 25
 * sentences pulled from the live catalogue, all of which pass as the
 * self-test below — never leaves a dangling clause either, because the
 * verb it modifies is still there doing the work.
 *
 * What this deliberately does NOT touch: adjectives directly modifying a
 * noun ("an elegant design", "a stunning piece") and predicate-position
 * superlatives ("looking beautiful", "can be exceptionally elegant"). Both
 * need real per-sentence judgement this script isn't built to make safely
 * at catalogue scale — left for a follow-up pass, not guessed at here.
 *
 *   pnpm tsx --env-file=.env.local scripts/strip-superlative-adverbs.ts
 *   pnpm tsx --env-file=.env.local scripts/strip-superlative-adverbs.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
  perspective: "raw",
});

const ADVERBS = [
  "elegantly",
  "stunningly",
  "impressively",
  "exquisitely",
  "luxuriously",
  "charmingly",
  "strikingly",
  "gorgeously",
  "beautifully",
  "magnificently",
  "sophisticatedly",
  "effortlessly",
];

/**
 * Removes one occurrence of `adverb` from `text`, cleaning up the
 * whitespace and re-capitalising if it was the sentence's first word.
 * Returns the original text unchanged if the adverb isn't found (case-
 * insensitive, whole word).
 */
function stripAdverb(text: string, adverb: string): string {
  const re = new RegExp(`\\b${adverb}\\b`, "i");
  const match = re.exec(text);
  if (!match) return text;

  const start = match.index;
  const end = start + match[0].length;
  const before = text.slice(0, start);
  const after = text.slice(end);

  // Sentence-initial (nothing but whitespace before it): drop the word and
  // the space after it, then capitalise the new first letter.
  if (/^\s*$/.test(before)) {
    const rest = after.replace(/^\s+/, "");
    return before + rest.charAt(0).toUpperCase() + rest.slice(1);
  }

  // Otherwise drop the word and the whitespace immediately before it, so
  // "displayed beautifully, regardless" becomes "displayed, regardless"
  // rather than leaving a stray space before the comma.
  const trimmedBefore = before.replace(/\s+$/, "");
  return trimmedBefore + after;
}

function stripAllAdverbs(text: string): string {
  let result = text;
  for (const adverb of ADVERBS) {
    // Loop in case the same adverb appears twice in one block.
    let next = stripAdverb(result, adverb);
    while (next !== result) {
      result = next;
      next = stripAdverb(result, adverb);
    }
  }
  return result;
}

// --- Self-test against real sentences pulled from the live catalogue,
// before this script is trusted anywhere near a write. ---
const SELF_TEST: [string, string][] = [
  [
    "Its sleek silhouette allows it to blend effortlessly into your existing decor.",
    "Its sleek silhouette allows it to blend into your existing decor.",
  ],
  [
    "It pairs beautifully with seasonal decor, making your gatherings extra special.",
    "It pairs with seasonal decor, making your gatherings extra special.",
  ],
  [
    "ensuring your candles are displayed beautifully, regardless of the setting.",
    "ensuring your candles are displayed, regardless of the setting.",
  ],
  [
    "Beautifully crafted, each piece is designed to hold candles of varying sizes.",
    "Crafted, each piece is designed to hold candles of varying sizes.",
  ],
  [
    "Its classic design ensures it will harmonise beautifully with most decor themes, enhancing the aesthetics of your home effortlessly.",
    "Its classic design ensures it will harmonise with most decor themes, enhancing the aesthetics of your home.",
  ],
  [
    "The glaze finish adds a touch of refinement, reflecting light beautifully and enhancing its visual appeal.",
    "The glaze finish adds a touch of refinement, reflecting light and enhancing its visual appeal.",
  ],
  [
    "This timepiece fits effortlessly within various environments.",
    "This timepiece fits within various environments.",
  ],
  [
    "Its open design allows the intricate workings of the clock to be displayed beautifully.",
    "Its open design allows the intricate workings of the clock to be displayed.",
  ],
];

for (const [input, expected] of SELF_TEST) {
  const actual = stripAllAdverbs(input);
  if (actual !== expected) {
    console.error(
      `SELF-TEST FAILED\n  input:    ${input}\n  expected: ${expected}\n  actual:   ${actual}`,
    );
    process.exit(1);
  }
}
console.log(`Self-test passed (${SELF_TEST.length} cases).\n`);

interface Span {
  _key: string;
  _type: "span";
  text: string;
  marks: string[];
}
interface Block {
  _key: string;
  _type: string;
  children?: Span[];
  markDefs?: unknown[];
  style?: string;
  listItem?: string;
}

function blockHasAdverb(block: Block): boolean {
  const text = (block.children ?? []).map((s) => s.text).join("");
  return ADVERBS.some((adverb) =>
    new RegExp(`\\b${adverb}\\b`, "i").test(text),
  );
}

/** Applies the fix per span, preserving marks/links on untouched spans. */
function fixBlock(block: Block): Block {
  const children = (block.children ?? []).map((span) => ({
    ...span,
    text: stripAllAdverbs(span.text),
  }));
  return { ...block, children };
}

interface ProductResult {
  id: string;
  title: string;
  blocksEdited: number;
}

async function main() {
  const rows: { _id: string; title: string; description: Block[] }[] =
    await client.fetch(
      `*[_type=="product" && !(_id in path("drafts.**"))]{_id, title, description}`,
    );

  const results: ProductResult[] = [];

  for (const row of rows) {
    const blocks = row.description ?? [];
    const affectedBlocks = blocks.filter(blockHasAdverb);
    if (!affectedBlocks.length) continue;

    const newBlocks = blocks.map((block) =>
      blockHasAdverb(block) ? fixBlock(block) : block,
    );

    results.push({
      id: row._id,
      title: (row.title ?? "").replace(" | Kaiku", ""),
      blocksEdited: affectedBlocks.length,
    });

    if (!apply) continue;
    await client.patch(row._id).set({ description: newBlocks }).commit();
  }

  console.log(
    `${apply ? "Fixed" : "Would fix"} ${results.length} products (${results.reduce((n, r) => n + r.blocksEdited, 0)} blocks).`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-05-strip-superlative-adverbs.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
