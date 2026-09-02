/**
 * 522 published summaries carry the supplier marketing register Damien
 * objected to on the pergola — "This elegant Metal Pergola … offers comfort
 * and style for your garden or patio."
 *
 * The shape of the defect is consistent across the catalogue, which is what
 * makes it safe to treat mechanically rather than by hand:
 *
 *   1. A factual sentence carrying one or two marketing adjectives.
 *      "made from iron with a chic copper finish"  ->  "made from iron with a
 *      copper finish". Every fact survives; only the adjective goes.
 *   2. A trailing sentence that is pure padding, contributing no fact at all.
 *      "Perfect for adding a reflective touch to your space."  ->  dropped.
 *
 * Two things this script is deliberately careful about:
 *
 *   - Article agreement. Removing an adjective breaks a/an: "a beautiful
 *     acacia wood lid" must become "an acacia wood lid", not "a acacia".
 *     Handled by re-deriving the article from the following word.
 *   - Only dropping a sentence with NOTHING to lose. A sentence is dropped
 *     only when it trips a marketing pattern AND contains no digit, no unit,
 *     and no material or construction noun. Anything carrying a fact is kept
 *     and merely stripped.
 *
 * Products left with too little summary after trimming are reported rather
 * than published thin — those get hand-written.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-summary-marketing-voice.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-summary-marketing-voice.ts --apply
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
 * Adjectives stripped in place. Only ones that carry no information about the
 * object — "sleek" and "chic" describe nothing measurable, where "ribbed",
 * "matte" and "distressed" describe a real surface and are left alone.
 *
 * NOTE: built fresh per use, never as a shared /g regex. A global regex used
 * with .test() advances lastIndex between calls and returns alternating
 * results — that bug made an earlier scan report 402 of these when there were
 * 522.
 */
/*
 * "premium" and "timeless" were removed from this list deliberately.
 * "premium" broke real sentences — "where space is at a premium" became
 * "where space is at a." — and "timeless" is Damien's own brand voice, used
 * in the Outdoor Living hero ("Timeless design. The finest materials.").
 * Stripping it from summaries would have put the copy at odds with the site.
 */
const ADJECTIVES = [
  "elegant",
  "stunning",
  "exquisite",
  "luxurious",
  "sophisticated",
  "breathtaking",
  "captivating",
  "impressive",
  "beautiful",
  "gorgeous",
  "charming",
  "lavish",
  "opulent",
  "magnificent",
  "eye-catching",
  "chic",
  "sleek",
  "stylish",
  "effortless",
  "exceptional",
  "striking",
];

/** Whole sentences matching these, with no fact in them, are dropped. */
const MARKETING_SENTENCE = () =>
  new RegExp(
    [
      "\\bperfect for\\b",
      "\\bideal for adding\\b",
      "\\badds? (?:a )?(?:touch|sense|hint|note) of\\b",
      "\\badds? elegance\\b",
      "\\btransform your\\b",
      "\\belevate your\\b",
      "\\bindulge\\b",
      "\\benhanc\\w+ (?:any|your) (?:space|decor|home|room|interior)\\b",
      "\\bto any (?:space|decor|home|room|interior)\\b",
      "\\bfor your (?:home|space)\\b",
      "\\bmakes? (?:it|for) (?:a|an) (?:great|perfect|stylish|wonderful)\\b",
      "\\bwhile adding\\b",
      "\\bboth stylish and functional\\b",
      "\\bstyle and functionality\\b",
      "\\b(?:style|flair|elegance|charm) (?:and|to) \\w+",
      "\\baesthetic appeal\\b",
      "\\b(?:modern|contemporary) flair\\b",
      "\\bbrings? both\\b",
      "\\bto your (?:home|space|room|interior)\\b",
    ].join("|"),
    "i",
  );

/**
 * Nouns that carry no meaning without the adjective in front of them. Removing
 * "elegant" from "an elegant addition" leaves "an addition" — grammatical,
 * hollow, and worse than what it replaced. These go to hand-writing.
 */
const HOLLOW_NOUN =
  /\b(a|an|the)\s+(addition|design|solution|piece|choice|option|accent|statement|touch|look|feel|centrepiece|focal point)\b/i;

/**
 * A sentence containing any of these is carrying real information and is
 * never dropped, only stripped.
 *
 * Joined with "|". The first version of this joined the array with "" and so
 * concatenated the sub-patterns instead of alternating them — producing a
 * regex that required a digit followed by a unit followed by a material, which
 * essentially never matches. The effect was that sentences full of real facts
 * ("Made primarily from polystyrene and glass") were classified as pure
 * marketing and deleted. Caught on the dry run.
 */
const FACT_TOKEN = () =>
  new RegExp(
    [
      "\\d",
      "\\b(cm|mm|kg|g|ml|l|litre|watt|w)\\b",
      "\\b(ceramic|glass|stoneware|iron|steel|metal|brass|chrome|nickel|copper|wood|wooden|oak|pine|teak|rattan|bamboo|mango|walnut|birch|beech|marble|stone|travertine|granite|concrete|resin|plastic|polyester|cotton|linen|velvet|chenille|leather|shagreen|mdf|plywood|foam|aluminium|polypropylene|fibreglass|magnesia|porcelain|acacia|borosilicate|polystyrene|stainless|bamboo)\\b",
      "\\b(drawer|drawers|shelf|shelves|door|doors|bulb|bulbs|pump|cushion|cushions|assembly|assembled|capacity|weighs|weight|dimensions|indoor|outdoor|battery|batteries|led|e14|e27|runners|lid|lids|handle|handles|adjustable|panels|sensor)\\b",
    ].join("|"),
    "i",
  );

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Words that begin with a vowel letter but a consonant sound, and vice versa.
 * "a unique frame" is correct English; a naive vowel-letter rule turns it into
 * "an unique", which is what the first version of this script did.
 */
const SOUNDS_CONSONANT = /^(uni|use|useful|usual|one|once|euro|ewe)/i;
const SOUNDS_VOWEL = /^(hour|honest|honour|heir)/i;

function articleFor(nextWord: string): "a" | "an" {
  if (SOUNDS_VOWEL.test(nextWord)) return "an";
  if (SOUNDS_CONSONANT.test(nextWord)) return "a";
  return /^[aeiou]/i.test(nextWord) ? "an" : "a";
}

/**
 * Removes marketing adjectives, repairing the grammar they leave behind.
 *
 * Order matters. "a stylish and functional addition" must lose "stylish and",
 * not just "stylish" — otherwise it becomes "a and functional addition", which
 * is what the first version produced. Paired forms are handled before the bare
 * form for that reason.
 */
function stripAdjectives(sentence: string): string {
  let out = sentence;

  for (const adj of ADJECTIVES) {
    const a = adj.replace(/[-]/g, "\\-");
    // "stylish and functional" -> "functional"   (adjective pair, ours first)
    out = out.replace(new RegExp(`\\b${a}\\s+and\\s+`, "gi"), "");
    // "functional and stylish" -> "functional"   (adjective pair, ours second)
    out = out.replace(new RegExp(`\\s+and\\s+${a}\\b`, "gi"), "");
    // "sleek, modern frame" -> "modern frame"
    out = out.replace(new RegExp(`\\b${a},\\s*`, "gi"), "");
    // ", stylish" in a list
    out = out.replace(new RegExp(`,\\s*${a}\\b`, "gi"), "");
    // plain "a chic copper finish" -> "a copper finish"
    out = out.replace(new RegExp(`\\b${a}\\s+`, "gi"), "");
    // trailing, e.g. "... is stylish."
    out = out.replace(new RegExp(`\\s+${a}\\b`, "gi"), "");
  }

  // Repair only the articles that now sit in front of a different word.
  out = out.replace(
    /\b(a|an|A|An)\s+([A-Za-z][\w-]*)/g,
    (_m, article: string, word: string) => {
      const fixed = articleFor(word);
      const capital = article[0] === "A";
      // Capitalised without indexing into `fixed`, which is `string | undefined`
      // to the compiler under noUncheckedIndexedAccess and broke `next build`.
      const shown = capital ? (fixed === "an" ? "An" : "A") : fixed;
      return `${shown} ${word}`;
    },
  );

  return out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .replace(/,\s*\./g, ".")
    .trim();
}

/**
 * A last line of defence. If a transformation produced anything that reads as
 * broken English, the product is reported for hand-writing rather than
 * published. Cheaper than trusting the rules above to be exhaustive.
 */
function looksBroken(text: string): string | null {
  const checks: [RegExp, string][] = [
    [/\b(a|an)\s+and\b/i, "article followed by 'and'"],
    [/\band\s+and\b/i, "doubled 'and'"],
    [/\bis an?\s+(and|,|\.)/i, "dangling article"],
    [/\b(a|an)\s*[.,]/i, "article before punctuation"],
    [/,\s*,/, "doubled comma"],
    [/\s,/, "space before comma"],
    [/\b(with|from|features?|combines?)\s*[.,]/i, "preposition before stop"],
    [/^\s*(and|but|with)\b/i, "sentence starts mid-clause"],
    [/\bboth\s+(and|\.)/i, "dangling 'both'"],
    [/\bboth\s+\w+\.\s*$/i, "'both' with only one item left"],
    [/\bis\s+both\s+\w+\s*[.,]/i, "'both' with only one item left"],
    [HOLLOW_NOUN, "hollow noun left where an adjective was removed"],
  ];
  for (const [re, why] of checks) if (re.test(text)) return why;
  return null;
}

interface Product {
  _id: string;
  title: string;
  summary?: string;
}

async function main() {
  const docs: Product[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(summary)]{_id, title, summary}`,
  );

  const changed: { id: string; before: string; after: string }[] = [];
  const tooThin: {
    id: string;
    title: string;
    before: string;
    after: string;
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const doc of docs) {
    const original = doc.summary ?? "";
    const kept: string[] = [];

    for (const sentence of sentences(original)) {
      const isMarketing = MARKETING_SENTENCE().test(sentence);
      const hasFact = FACT_TOKEN().test(sentence);
      if (isMarketing && !hasFact) continue; // nothing to lose — drop it
      kept.push(stripAdjectives(sentence));
    }

    const after = kept
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!after || after === original) continue;

    // Don't publish a stub. 80 chars is about one full factual sentence.
    if (after.length < 80) {
      tooThin.push({ id: doc._id, title: doc.title, before: original, after });
      continue;
    }

    // Don't publish broken English, whatever the rules above thought.
    const broken = looksBroken(after);
    if (broken) {
      tooThin.push({
        id: doc._id,
        title: doc.title,
        before: original,
        after: `[${broken}] ${after}`,
      });
      continue;
    }

    changed.push({ id: doc._id, before: original, after });
    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ summary: after }));
      queued += 1;
    }
  }

  console.log(`Summaries rewritten: ${changed.length}`);
  console.log(`Left for hand-writing (would be too thin): ${tooThin.length}\n`);

  for (const c of changed.slice(0, 12)) {
    console.log(`${c.id}`);
    console.log(`  was: ${c.before}`);
    console.log(`  now: ${c.after}\n`);
  }
  if (changed.length > 12) console.log(`… and ${changed.length - 12} more.\n`);

  if (tooThin.length) {
    console.log("--- too thin, needs hand-writing ---");
    for (const t of tooThin.slice(0, 15)) {
      console.log(`  ${t.id}: "${t.after}"`);
    }
    if (tooThin.length > 15)
      console.log(`  … and ${tooThin.length - 15} more.`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} summaries updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-summary-marketing-voice.json",
    JSON.stringify({ apply, queued, changed, tooThin }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
