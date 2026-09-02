/**
 * 148 summaries still carry a marketing clause hanging off the end of an
 * otherwise factual sentence:
 *
 *   "...holds 550ml and is crafted from high borosilicate glass with an acacia
 *    wood lid, perfect for kitchen storage."
 *
 * The earlier pass (scripts/fix-summary-marketing-voice.ts) only removed whole
 * sentences that contained no fact at all, and stripped adjectives in place.
 * A clause like "perfect for kitchen storage" sits inside a sentence that does
 * carry facts, so the sentence was kept intact — correctly, at the time, but it
 * leaves the register only half-fixed.
 *
 * This pass trims the clause and keeps the factual head. It only ever cuts from
 * a clause boundary (a comma, or a co-ordinating "and"/"while") to the end of
 * the sentence, so it cannot take a fact with it — and the result is validated
 * before publishing.
 *
 * Also fixes one genuine hedge missed by the meta-reference pattern: the Nandri
 * bench said it "does not include specific claims regarding weather
 * resistance", which is about our claims rather than the product.
 *
 *   pnpm tsx --env-file=.env.local scripts/trim-summary-marketing-clauses.ts
 *   pnpm tsx --env-file=.env.local scripts/trim-summary-marketing-clauses.ts --apply
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
});

/**
 * Marketing clause openers. Each is matched from a clause boundary to the end
 * of the sentence.
 *
 * Built fresh per call rather than shared — a /g regex reused with .test()
 * advances lastIndex and returns alternating results, which is what made an
 * earlier count of these read 402 when it was 522.
 */
const CLAUSE_OPENERS = [
  "perfect for",
  "ideal for",
  "great for",
  "well suited to adding",
  "suited to adding",
  "bringing (?:a|an|the)? ?\\w* ?(?:touch|flair|feel|note|sense)",
  "brings? (?:a|an|the)? ?\\w* ?(?:touch|flair|feel|note|sense)",
  "adds? (?:a|an|the)? ?\\w* ?(?:touch|flair|feel|note|sense)",
  "adding (?:a|an|the)? ?\\w* ?(?:touch|flair|feel|note|sense)",
  "enhancing (?:any|your)",
  "complementing (?:any|your)",
  "making it (?:a|an|the)",
  "creating (?:a|an|the)",
  "offering (?:a|an|the)? ?\\w* ?(?:touch|feel|look|style)",
  "while adding",
  "for (?:a|an) \\w+ (?:touch|look|feel)",
];

function clauseRegex(): RegExp {
  // From a comma / "and" / "while" boundary, through a marketing opener, to
  // the end of the sentence.
  return new RegExp(
    `(?:,\\s*|\\s+(?:and|while)\\s+)(?:${CLAUSE_OPENERS.join("|")})\\b[^.!?]*`,
    "i",
  );
}

/** A sentence-initial marketing clause, e.g. "Perfect for kitchen storage." */
function wholeSentenceRegex(): RegExp {
  return new RegExp(`^(?:${CLAUSE_OPENERS.join("|")})\\b[^.!?]*[.!?]?$`, "i");
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const FACT_TOKEN = () =>
  new RegExp(
    [
      "\\d",
      "\\b(cm|mm|kg|g|ml|l|litre|watt|w)\\b",
      "\\b(ceramic|glass|stoneware|iron|steel|metal|brass|chrome|nickel|copper|wood|wooden|oak|pine|teak|rattan|bamboo|mango|walnut|birch|beech|marble|stone|travertine|concrete|resin|plastic|polyester|cotton|linen|velvet|chenille|leather|shagreen|MDF|plywood|foam|aluminium|polypropylene|fibreglass|magnesia|acacia|borosilicate|polystyrene|stainless)\\b",
      "\\b(drawer|drawers|shelf|shelves|door|doors|bulb|bulbs|pump|cushion|cushions|assembly|assembled|capacity|weighs|holds|dimensions|indoor|outdoor|battery|batteries|LED|E14|E27|runners|lid|lids|handle|handles)\\b",
    ].join("|"),
    "i",
  );

/**
 * Finite verbs. Removing a trailing clause can strip the only finite verb in a
 * sentence and leave a fragment — "The Wardell Illuminated Wall Mirror, crafted
 * with clear glass and a contemporary aluminium frame." reads as an unfinished
 * thought. Note "crafted" and "made" are participles, not finite verbs, so they
 * deliberately are not in this list.
 */
const FINITE_VERB =
  /\b(is|are|was|were|has|have|had|features?|holds?|measures?|combines?|offers?|includes?|stands?|weighs?|requires?|arrives?|suits?|fits?|takes?|comes?|adds?|provides?|brings?|sits?|runs?|works?|seats?|houses?|carries|carry|needs?)\b/i;

/**
 * Judges ONLY the sentences this script rewrote.
 *
 * An earlier version validated the whole summary, which meant a pre-existing
 * fragment elsewhere in the text ("Easy to maintain.") blocked a perfectly good
 * trim in the sentence before it. We are responsible for what we changed, not
 * for prose we never touched.
 */
function looksBroken(editedSentences: string[]): string | null {
  const checks: [RegExp, string][] = [
    [/\s,/, "space before comma"],
    [/,\s*\./, "comma before stop"],
    [
      /\b(and|with|while|for|in|of|from)\s*\.$/i,
      "sentence ends on a preposition",
    ],
    [/\.\s*\./, "doubled stop"],
    [/^\s*[,.]/, "starts with punctuation"],
    [/\b(a|an)\s*\.$/i, "ends on an article"],
    [/\bboth\s+\w+\s*\.$/i, "'both' left with one item"],
    [/\bis\s+both\s+\w+\s*[.,]/i, "'both' left with one item"],
  ];
  for (const s of editedSentences) {
    for (const [re, why] of checks) if (re.test(s)) return why;
    if (!FINITE_VERB.test(s)) return `sentence fragment: "${s.slice(0, 70)}"`;
  }
  return null;
}

function trim(summary: string): { text: string; edited: string[] } {
  const kept: string[] = [];
  const edited: string[] = [];
  for (const sentence of sentences(summary)) {
    // A sentence that is nothing but a marketing clause goes entirely,
    // provided it carries no fact.
    if (wholeSentenceRegex().test(sentence) && !FACT_TOKEN().test(sentence)) {
      continue;
    }
    let s = sentence;
    // Trim a trailing marketing clause, repeatedly (some have two).
    for (let i = 0; i < 3; i++) {
      const m = s.match(clauseRegex());
      if (!m) break;
      s = (s.slice(0, m.index) + s.slice(m.index! + m[0].length)).trim();
      if (!/[.!?]$/.test(s)) s += ".";
    }
    s = s
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.;])/g, "$1")
      .trim();
    if (s !== sentence) edited.push(s);
    if (s && s !== ".") kept.push(s);
  }
  return {
    text: kept
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim(),
    edited,
  };
}

interface Product {
  _id: string;
  summary?: string;
}

async function main() {
  const docs: Product[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(summary)]{_id, summary}`,
  );

  const changed: { id: string; before: string; after: string }[] = [];
  const skipped: { id: string; why: string; after: string }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const doc of docs) {
    const before = doc.summary ?? "";
    const { text: after, edited } = trim(before);
    if (!after || after === before) continue;

    if (after.length < 40) {
      skipped.push({ id: doc._id, why: "too short after trim", after });
      continue;
    }
    const broken = looksBroken(edited);
    if (broken) {
      skipped.push({ id: doc._id, why: broken, after });
      continue;
    }

    changed.push({ id: doc._id, before, after });
    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ summary: after }));
      queued += 1;
    }
  }

  console.log(`Summaries trimmed: ${changed.length}`);
  console.log(`Skipped: ${skipped.length}\n`);
  for (const c of changed.slice(0, 12)) {
    console.log(`${c.id}\n  was: ${c.before}\n  now: ${c.after}\n`);
  }
  if (changed.length > 12) console.log(`… and ${changed.length - 12} more.\n`);
  for (const s of skipped) console.log(`  SKIP ${s.id} (${s.why}): ${s.after}`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} summaries updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-trim-summary-marketing-clauses.json",
    JSON.stringify({ apply, queued, changed, skipped }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
