/**
 * Strips the "we don't actually know" answers out of product FAQs.
 *
 * `scripts/audit-copy-quality.ts` put the real number at 436 hedge
 * occurrences across 294 published products, and 362 of them are in
 * `faqs[].answer` — a field every previous pass ignored while reporting the
 * catalogue clean. Damien's objection, twice: _"why cant be saying were the
 * most helpful then saying stuff like this still we cant be openly saying we
 * dont know something about a product"_.
 *
 * This script owns no patterns. It calls `cleanParagraph()` from
 * `src/lib/catalog/admissions.ts` — the same detector the description
 * writer's own gate uses — so a phrasing that slips through gets fixed in one
 * place and both the generator and the audit learn it at once.
 *
 * Two outcomes per answer:
 *
 *   TRIM   Some sentences survive. The hedge sentences go, the facts stay.
 *          "The clock weighs 3.5 kg. The specification does not state if
 *          fixings are included." becomes "The clock weighs 3.5 kg."
 *
 *   DELETE Nothing survives the strip. The whole question-and-answer pair is
 *          removed, not just the answer — a question left sitting there with
 *          its answer gutted is worse than no question. A page that can't
 *          answer "are fixings included?" should not ask it on the
 *          customer's behalf.
 *
 * Deletion is keyed on "nothing survived", never on length. A first draft of
 * this script also dropped anything under 30 characters and would have
 * deleted "The basket weighs 3.89 kg." — a complete, useful answer — from a
 * live product. Short is not the same as empty.
 *
 * Sentences that carry a fact *and* a hedge in one breath ("Weight details
 * are not available, but it is designed to be securely mounted") lose the
 * whole sentence. That is deliberate: there is no safe way to split one
 * sentence, and keeping the hedge is the worse of the two failures.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-faq-hedges.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-faq-hedges.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { cleanParagraph, isAdmission } from "@/lib/catalog/admissions";

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
 * Answers where a real fact and a hedge share one sentence, and the fact is
 * worth keeping. Sentence-level stripping would bin the whole thing, so these
 * are rewritten by hand instead.
 *
 * Found by filtering the dry run's deletions for any containing a number and
 * a unit — 3 of 246 did, and only this one was a fact a shopper would want.
 * (The other two: a chandelier drop-length question we genuinely can't
 * answer, and a lamp height that was an invented "typically stands between
 * 140 cm and 180 cm" guess rather than a measurement. Both correctly go.)
 */
const OVERRIDES: { id: string; questionIncludes: string; answer: string }[] = [
  {
    id: "premier-housewares-2405831",
    questionIncludes: "weight capacity",
    answer: "The sofa bed can accommodate up to 360 kg.",
  },
];

interface Faq {
  _key?: string;
  _type?: string;
  question: string;
  answer: string;
}
interface Doc {
  _id: string;
  title: string;
  slug: string | null;
  faqs: Faq[] | null;
}

interface Change {
  action: "TRIM" | "DELETE";
  question: string;
  before: string;
  after?: string;
}

async function main() {
  const docs: Doc[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(faqs)]{
      _id, title, "slug": slug.current, faqs
    } | order(_id asc)`,
  );

  const results: {
    id: string;
    title: string;
    slug: string | null;
    faqsBefore: number;
    faqsAfter: number;
    changes: Change[];
  }[] = [];

  let trimmed = 0;
  let deleted = 0;
  const transaction = client.transaction();
  let queued = 0;

  for (const doc of docs) {
    const faqs = doc.faqs || [];
    const changes: Change[] = [];
    const kept: Faq[] = [];

    for (const faq of faqs) {
      const answer = faq?.answer ?? "";
      const question = faq?.question ?? "";

      const override = OVERRIDES.find(
        (o) =>
          o.id === doc._id &&
          question.toLowerCase().includes(o.questionIncludes.toLowerCase()),
      );
      if (override) {
        changes.push({
          action: "TRIM",
          question,
          before: answer,
          after: override.answer,
        });
        trimmed += 1;
        kept.push({ ...faq, answer: override.answer });
        continue;
      }

      // A question that is itself a hedge goes regardless of its answer.
      const questionHedges = question ? isAdmission(question) : false;
      const cleaned = cleanParagraph(answer);

      if (questionHedges || cleaned.length === 0) {
        changes.push({ action: "DELETE", question, before: answer });
        deleted += 1;
        continue;
      }
      if (cleaned !== answer.trim()) {
        changes.push({
          action: "TRIM",
          question,
          before: answer,
          after: cleaned,
        });
        trimmed += 1;
        kept.push({ ...faq, answer: cleaned });
        continue;
      }
      kept.push(faq);
    }

    if (changes.length === 0) continue;

    results.push({
      id: doc._id,
      title: doc.title,
      slug: doc.slug,
      faqsBefore: faqs.length,
      faqsAfter: kept.length,
      changes,
    });

    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ faqs: kept }));
      queued += 1;
    }
  }

  console.log(`Products scanned:  ${docs.length}`);
  console.log(`Products changed:  ${results.length}`);
  console.log(`Answers trimmed:   ${trimmed}`);
  console.log(`FAQ pairs removed: ${deleted}\n`);

  const gutted = results.filter(
    (r) => r.faqsAfter <= Math.floor(r.faqsBefore / 2),
  );
  if (gutted.length) {
    console.log(
      `NOTE: ${gutted.length} products lose half or more of their FAQs — these had the most hedging:\n`,
    );
    gutted
      .slice(0, 15)
      .forEach((r) =>
        console.log(`  ${r.id} ${r.faqsBefore} -> ${r.faqsAfter} | ${r.title}`),
      );
    console.log("");
  }

  for (const r of results.slice(0, 8)) {
    console.log(`\n=== ${r.id} (${r.faqsBefore} -> ${r.faqsAfter} FAQs) ===`);
    for (const c of r.changes) {
      console.log(`  [${c.action}] Q: ${c.question.trim()}`);
      console.log(`      before: "${c.before.trim().slice(0, 150)}"`);
      if (c.after) console.log(`      after:  "${c.after.slice(0, 150)}"`);
    }
  }
  if (results.length > 8) {
    console.log(
      `\n… and ${results.length - 8} more products (see change log).`,
    );
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-fix-faq-hedges.json",
    JSON.stringify(
      { apply, queued, trimmed, deleted, products: results },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
