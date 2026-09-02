/**
 * Some FAQ answers claim a fact is unavailable while the document is storing
 * that exact fact. The wall clocks are the clearest case:
 *
 *   Q: What are the dimensions of the Rothay Large Wall Clock?
 *   A: "Specific dimensions are currently unavailable for the Rothay Large
 *       Wall Clock."
 *
 * while `dimensions` on that same document reads 80 x 80 x 5cm and `weight`
 * reads 3.08kg.
 *
 * This is worse than the hedging already cleaned out of the descriptions,
 * because it is not merely unhelpful — it is false. The store is telling a
 * customer it does not know something it does know, on a page that also
 * renders the number in the specifications tab.
 *
 * The fix answers each of these from the document's own `dimensions` and
 * `weight` fields. Where a question asks about materials and the document
 * genuinely has no material data, the answer cannot be repaired from data and
 * the FAQ entry is removed instead — an absent question is better than a
 * question answered with "high-quality materials designed for durability",
 * which is what several of these say.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-faqs-claiming-no-data.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-faqs-claiming-no-data.ts --apply
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

/** An answer that denies having information. */
const DENIES_DATA =
  /(currently unavailable|have not been supplied|has not been supplied|haven't been verified|have not been verified|not been verified|are not available|is not available)/i;

/** An answer that says nothing while appearing to answer. */
const VACUOUS =
  /(high-quality materials|durable materials that|crafted with durable materials|designed for durability and aesthetic|various finishes to complement)/i;

interface Faq {
  _key?: string;
  question?: string;
  answer?: string;
}
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
interface Product {
  _id: string;
  title: string;
  faqs: Faq[];
  dimensions?: Dimensions;
  weight?: Weight;
}

function shortName(title: string): string {
  return (title.split("|")[0] ?? title).trim();
}

function dimsSentence(p: Product): string | null {
  const d = p.dimensions;
  if (!d || d.length == null || d.width == null || d.height == null)
    return null;
  const u = d.unit ?? "cm";
  return `The ${shortName(p.title)} measures ${d.length} × ${d.width} × ${d.height}${u} (length × width × height).`;
}

function weightSentence(p: Product): string | null {
  const w = p.weight;
  if (!w || w.value == null) return null;
  return `The ${shortName(p.title)} weighs ${w.value}${w.unit ?? "kg"}.`;
}

/**
 * Does this question ask about size, or about weight?
 *
 * No trailing \b after the stems. The first version of these patterns was
 * `\b(dimension|...)\b` and `\b(weigh|...)\b`, and neither could ever match
 * "dimensions" or "weighs" — the boundary fails against the following "s".
 * It reported 0 answers repairable when 6 were, which is the same trailing-
 * boundary bug that hid 76 raw decimals earlier in this session. Worth
 * writing down twice.
 */
const ASKS_DIMENSIONS = /\b(dimension|size|how (?:big|tall|wide|large))/i;
const ASKS_WEIGHT = /\b(weigh|how heavy)/i;

async function main() {
  const docs: Product[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(faqs)]{_id, title, faqs, dimensions, weight}`,
  );

  const results: {
    id: string;
    repaired: { question: string; before: string; after: string }[];
    removed: { question: string; answer: string }[];
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const doc of docs) {
    const repaired: { question: string; before: string; after: string }[] = [];
    const removed: { question: string; answer: string }[] = [];
    const newFaqs: Faq[] = [];

    for (const faq of doc.faqs || []) {
      const q = faq.question ?? "";
      const a = faq.answer ?? "";
      const bad = DENIES_DATA.test(a) || VACUOUS.test(a);

      if (!bad) {
        newFaqs.push(faq);
        continue;
      }

      // Can we answer it properly from the document's own fields?
      let replacement: string | null = null;
      if (ASKS_DIMENSIONS.test(q)) replacement = dimsSentence(doc);
      else if (ASKS_WEIGHT.test(q)) replacement = weightSentence(doc);

      if (replacement) {
        repaired.push({ question: q, before: a, after: replacement });
        newFaqs.push({ ...faq, answer: replacement });
      } else {
        // No data to answer it with — an absent question beats an empty one.
        removed.push({ question: q, answer: a });
      }
    }

    if (repaired.length === 0 && removed.length === 0) continue;
    results.push({ id: doc._id, repaired, removed });
    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ faqs: newFaqs }));
      queued += 1;
    }
  }

  const totalRepaired = results.reduce((n, r) => n + r.repaired.length, 0);
  const totalRemoved = results.reduce((n, r) => n + r.removed.length, 0);
  console.log(
    `Products affected: ${results.length} — ${totalRepaired} answers repaired from real data, ${totalRemoved} empty questions removed.\n`,
  );

  for (const r of results.slice(0, 8)) {
    console.log(`${r.id}`);
    for (const x of r.repaired) {
      console.log(`  REPAIR Q: ${x.question.trim()}`);
      console.log(`       was: ${x.before}`);
      console.log(`       now: ${x.after}`);
    }
    for (const x of r.removed) {
      console.log(`  REMOVE Q: ${x.question.trim()}`);
      console.log(`       was: ${x.answer.slice(0, 110)}`);
    }
    console.log("");
  }
  if (results.length > 8) console.log(`… and ${results.length - 8} more.\n`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-faqs-claiming-no-data.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
