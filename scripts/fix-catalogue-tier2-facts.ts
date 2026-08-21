/**
 * Tier 2, first pass: answer the questions we can already answer.
 *
 * The audit found 1,199 products whose copy admits it does not know something.
 * The assumption was that those facts were missing and would have to come from
 * a supplier. They are not missing: **1,183 of those products already carry the
 * dimensions in Sanity**, and 589 carry the weight. The generator wrote "not
 * specified" beside a populated field.
 *
 * So an FAQ reading
 *
 *     Q: What are the dimensions of the Glass Candle Holder?
 *     A: Dimensions are not specified for this product.
 *
 * should not be deleted, which is what Tier 1 would do. It should be answered —
 * 33cm high, 14cm wide, 14cm deep — from the record we already hold.
 *
 * **Nothing here invents anything.** Every replacement answer is built from a
 * structured field on that product. A question about something we genuinely do
 * not hold — burn time, fragrance, battery type — is left exactly as it is, for
 * Tier 1 to remove, because a confident wrong answer is far worse than a
 * missing one.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-catalogue-tier2-facts.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-catalogue-tier2-facts.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}
interface Weight {
  value?: number;
  unit?: string;
}

/** An answer that admits it has nothing to say. */
const ADMITS_UNKNOWN =
  /\bnot specified\b|\bnot stated\b|\bnot provided\b|\bnot listed\b|\bN\/A\b|\bare not explicitly\b/i;

/**
 * Questions that unambiguously ask this product's own overall size.
 *
 * Deliberately a narrow whitelist rather than a keyword match. A keyword match
 * on "size" or "weight" produced answers that were confidently wrong: "What
 * size plants can fit in this planter?" answered with the planter's external
 * dimensions, "Can I adjust the height of the chandelier?" answered with its
 * height, and — the one that made this rewrite non-negotiable — "How much
 * weight can the chest hold?" answered with what the chest itself weighs.
 * Load capacity and mass are different quantities, and confusing them could
 * put somebody under a collapsing shelf.
 */
const ASKS_SIZE =
  /^(?:what (?:are|is) the (?:dimensions|measurements|size)\b|what size is\b|how (?:big|tall) is\b)/i;

/**
 * Questions that mention size but are not asking for the overall size.
 *
 * "What is the internal size of the planter? Can I fit my pot inside?" cannot
 * be answered with external dimensions — doing so looks like an answer while
 * being about a different measurement, which is worse than admitting we do not
 * know. Same for a media unit's maximum screen size.
 */
const ASKS_SOMETHING_ELSE =
  /\b(?:internal|inside|interior|inner|usable|screen|maximum|capacity|volume|litre|seat height|drop|limit|hold|support|load|adjust|fit|plants?|bulb|shade|cartons?|packaging|packaged|packed|boxe?s?|holder)\b/i;
/** Questions that unambiguously ask this product's own mass. */
const ASKS_WEIGHT =
  /^(?:how much does .{0,60}weigh|what does .{0,60}weigh|how heavy is\b|what is the weight of\b)/i;

/**
 * Dimensions as a sentence a person would say.
 *
 * Ordered height, width, depth because that is how furniture is described out
 * loud and how a buyer pictures it against a wall. Any missing measurement is
 * simply left out rather than guessed or shown as zero.
 */
export function describeDimensions(
  d: Dimensions,
  title: string,
): string | null {
  const unit = d.unit ?? "cm";
  const name = title.replace(/\s*\|\s*Kaiku\s*$/i, "");

  // Height is the one axis whose meaning is unambiguous. `length` and `width`
  // are stored without a defined orientation — a media unit recorded as
  // 90 x 55 could be 90 wide or 90 deep — so they are reported in standard
  // L x W x H notation with the axes named, rather than being translated into
  // "wide" and "deep", which would state something we cannot support.
  const { length, width, height } = d;
  const has = (n: unknown): n is number => typeof n === "number" && n > 0;

  if (has(length) && has(width) && has(height)) {
    return `The ${name} measures ${length} × ${width} × ${height}${unit} (length × width × height).`;
  }
  const parts: string[] = [];
  if (has(height)) parts.push(`${height}${unit} high`);
  if (has(length)) parts.push(`${length}${unit} long`);
  if (has(width)) parts.push(`${width}${unit} wide`);
  if (parts.length === 0) return null;
  const measured =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `The ${name} measures ${measured}.`;
}

export function describeWeight(w: Weight, title: string): string | null {
  if (typeof w.value !== "number" || w.value <= 0) return null;
  const unit = w.unit ?? "kg";
  const name = title.replace(/\s*\|\s*Kaiku\s*$/i, "");
  // Above roughly 25kg one person should not be lifting it alone; the HSE
  // guideline figure for a two-handed lift at waist height is 25kg for men and
  // 16kg for women, so 20kg is a sensible point to mention a second pair of
  // hands without being alarmist about a 5kg lamp.
  const handling =
    w.value >= 20
      ? " Two people are recommended for unpacking and positioning."
      : w.value >= 5
        ? " One person can manage it comfortably."
        : "";
  return `The ${name} weighs ${w.value}${unit}.${handling}`;
}

/**
 * Which field, if any, can answer this question — the single decision the whole
 * script turns on. Exported so it is tested directly rather than inferred from
 * the output.
 */
export function ANSWERABLE(question: string): "dimensions" | "weight" | null {
  if (ASKS_SOMETHING_ELSE.test(question)) return null;
  if (ASKS_SIZE.test(question)) return "dimensions";
  if (ASKS_WEIGHT.test(question)) return "weight";
  return null;
}

interface Change {
  id: string;
  title: string;
  question: string;
  before: string;
  after: string;
  source: string;
}

async function main() {
  const rows: {
    _id: string;
    title?: string;
    faqs?: { _key?: string; question?: string; answer?: string }[];
    dimensions?: Dimensions;
    weight?: Weight;
  }[] = await client.fetch(
    `*[_type == "product" && count(faqs) > 0]{ _id, title, faqs, dimensions, weight }`,
  );

  const changes: Change[] = [];
  const unanswerable: { title: string; question: string }[] = [];
  const patches: { id: string; faqs: unknown[] }[] = [];

  for (const row of rows) {
    const title = row.title ?? "(untitled)";
    let touched = false;
    const next = (row.faqs ?? []).map((faq) => {
      const answer = faq.answer ?? "";
      const question = faq.question ?? "";
      if (!ADMITS_UNKNOWN.test(answer)) return faq;

      let replacement: string | null = null;
      let source = "";
      const answerableBy = ANSWERABLE(question);
      if (answerableBy === "dimensions" && row.dimensions) {
        replacement = describeDimensions(row.dimensions, title);
        source = "dimensions field";
      } else if (answerableBy === "weight" && row.weight) {
        replacement = describeWeight(row.weight, title);
        source = "weight field";
      }

      if (!replacement) {
        // Burn time, fragrance, battery type: we genuinely do not hold these.
        // Left untouched for Tier 1 to remove — a made-up answer would be far
        // worse than no answer.
        unanswerable.push({ title, question });
        return faq;
      }

      touched = true;
      changes.push({
        id: row._id,
        title,
        question,
        before: answer,
        after: replacement,
        source,
      });
      return { ...faq, answer: replacement };
    });

    if (touched) patches.push({ id: row._id, faqs: next });
  }

  console.log(
    `\n${apply ? "APPLYING" : "DRY RUN"} — Tier 2, facts we already hold\n`,
  );
  console.log(`FAQs answered from our own records: ${changes.length}`);
  console.log(`  across products:                  ${patches.length}`);
  console.log(`FAQs we genuinely cannot answer:    ${unanswerable.length}`);
  console.log(`  (left for Tier 1 to remove)`);

  const bySource = new Map<string, number>();
  for (const change of changes)
    bySource.set(change.source, (bySource.get(change.source) ?? 0) + 1);
  for (const [source, count] of bySource)
    console.log(`    ${String(count).padStart(4)}  from the ${source}`);

  console.log("\n──── sample ────");
  for (const change of changes.slice(0, 6)) {
    console.log(`\n${change.title.slice(0, 52)}`);
    console.log(`  Q  ${change.question.slice(0, 88)}`);
    console.log(`  −  ${change.before.slice(0, 88)}`);
    console.log(`  +  ${change.after.slice(0, 140)}`);
  }

  console.log("\n──── genuinely unknown, a sample ────");
  for (const item of unanswerable.slice(0, 8))
    console.log(`  ${item.title.slice(0, 34)} — ${item.question.slice(0, 62)}`);

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  const path = `docs/change-log/${stamp.slice(0, 10)}-tier2-facts.json`;
  writeFileSync(
    path,
    JSON.stringify({ generatedAt: stamp, applied: apply, changes }, null, 2),
  );
  console.log(`\nChange log: ${path}`);

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  let done = 0;
  for (const patch of patches) {
    await client.patch(patch.id).set({ faqs: patch.faqs }).commit();
    if (++done % 50 === 0) console.log(`  patched ${done}/${patches.length}`);
  }
  console.log(`\nPatched ${done} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
