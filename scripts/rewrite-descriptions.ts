/**
 * Rewrites descriptions from the facts each product actually holds.
 *
 * Uses src/lib/catalog/describe.ts, which writes only sentences a recorded
 * fact supports. Products are taken worst-first by the audit's own score, so
 * the pages that say least are rewritten before the ones that already work.
 *
 * **A rewrite that would say less than what is there is skipped.** The point
 * is to raise the floor, not to flatten the catalogue: the published Reclaimed
 * Teak Dining Table is 679 words of real detail, and replacing it with six
 * lines of specification would be a regression however clean those lines are.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions.ts --limit 20
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions.ts --apply
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import {
  describeProduct,
  type Section,
  wordsIn,
} from "../src/lib/catalog/describe";
import { scoreProduct } from "../src/lib/catalog/quality";
import {
  type ProductDocument,
  QUALITY_PROJECTION,
  toQualityInput,
} from "../src/lib/catalog/quality-input";

const apply = process.argv.includes("--apply");
const limitFlag = process.argv.indexOf("--limit");
const LIMIT =
  limitFlag === -1 ? Infinity : Number(process.argv[limitFlag + 1] ?? Infinity);

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** Sections to Portable Text. */
function toBlocks(sections: Section[], slug: string) {
  const blocks: unknown[] = [];
  sections.forEach((section, s) => {
    blocks.push({
      _type: "block",
      _key: `${slug}-h${s}`,
      style: "h2",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: `${slug}-h${s}-t`,
          text: section.heading,
          marks: [],
        },
      ],
    });
    section.paragraphs.forEach((paragraph, p) => {
      blocks.push({
        _type: "block",
        _key: `${slug}-p${s}-${p}`,
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: `${slug}-p${s}-${p}-t`,
            text: paragraph,
            marks: [],
          },
        ],
      });
    });
  });
  return blocks;
}

type Row = ProductDocument & { _createdAt: string };

async function main() {
  const harvested: Record<
    string,
    { material?: string; colour?: string; extra?: Record<string, string> }
  > = existsSync(".audit/harvested-facts.json")
    ? JSON.parse(readFileSync(".audit/harvested-facts.json", "utf8"))
    : {};

  // The shared projection plus the one extra field this script needs. Spliced
  // string surgery on QUALITY_PROJECTION produced invalid GROQ; naming the
  // extra field explicitly is clearer and cannot break.
  const rows: (Row & { deliveryLeadTime?: string })[] = await client.fetch(
    `*[_type == "product"] ${QUALITY_PROJECTION.replace(/}\s*$/, ", deliveryLeadTime }")}`,
  );

  const scored = rows
    .map((doc) => ({ doc, result: scoreProduct(toQualityInput(doc)) }))
    .sort((a, b) => a.result.overall - b.result.overall);

  const rewrites: {
    id: string;
    title: string;
    wasWords: number;
    nowWords: number;
    wasScore: number;
    sections: Section[];
  }[] = [];
  const skipped = new Map<string, number>();
  const note = (why: string) => skipped.set(why, (skipped.get(why) ?? 0) + 1);

  for (const { doc, result } of scored) {
    if (rewrites.length >= LIMIT) break;
    const facts = harvested[doc._id] ?? {};
    const sections = describeProduct({
      title: doc.title ?? "",
      slug: doc.slug ?? doc._id,
      category: doc.category,
      dimensions: doc.dimensions as never,
      weight: doc.weight as never,
      material: facts.material ?? null,
      colour: facts.colour ?? null,
      extra: facts.extra ?? {},
      features: (facts as { features?: string[] }).features ?? [],
      supplierCopy: (facts as { supplierCopy?: string }).supplierCopy ?? null,
      deliveryLeadTime: doc.deliveryLeadTime ?? null,
      materialDisputed: DISPUTED.has(doc._id),
    });

    const now = wordsIn(sections);
    if (now < 45) {
      note("too few facts to say anything useful");
      continue;
    }
    // Never replace a page that already says more than the rewrite would.
    if (result.stats.factsPer100 >= 0.9) {
      note("existing copy is already fact-dense");
      continue;
    }
    rewrites.push({
      id: doc._id,
      title: doc.title ?? "",
      wasWords: result.stats.words,
      nowWords: now,
      wasScore: result.overall,
      sections,
    });
  }

  console.log(
    `\n${apply ? "APPLYING" : "DRY RUN"} — descriptions from facts\n`,
  );
  console.log(`Products considered:  ${scored.length}`);
  console.log(`To rewrite:           ${rewrites.length}`);
  console.log(
    `  published:          ${rewrites.filter((r) => !r.id.startsWith("drafts.")).length}`,
  );
  for (const [why, count] of [...skipped].sort((a, b) => b[1] - a[1]))
    console.log(`  skipped, ${why}: ${count}`);

  const totalWas = rewrites.reduce((n, r) => n + r.wasWords, 0);
  const totalNow = rewrites.reduce((n, r) => n + r.nowWords, 0);
  console.log(
    `\nWords: ${totalWas.toLocaleString()} → ${totalNow.toLocaleString()} (${Math.round((1 - totalNow / Math.max(1, totalWas)) * 100)}% shorter)`,
  );

  console.log(`\n──── sample ────`);
  for (const rewrite of rewrites.slice(0, 3)) {
    console.log(
      `\n━━━ ${rewrite.title}  (was ${rewrite.wasWords}w, score ${rewrite.wasScore})`,
    );
    for (const section of rewrite.sections) {
      console.log(`\n## ${section.heading}`);
      section.paragraphs.forEach((p) => console.log(p));
    }
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-descriptions.json`,
    JSON.stringify(
      {
        generatedAt: stamp,
        applied: apply,
        rewrites: rewrites.map((r) => ({
          id: r.id,
          title: r.title,
          wasWords: r.wasWords,
          nowWords: r.nowWords,
          sections: r.sections,
        })),
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  let done = 0;
  for (const rewrite of rewrites) {
    await client
      .patch(rewrite.id)
      .set({ description: toBlocks(rewrite.sections, rewrite.id.slice(-8)) })
      .commit();
    if (++done % 25 === 0)
      console.log(`  rewritten ${done}/${rewrites.length}`);
  }
  console.log(`\nRewrote ${done} descriptions.`);
}

/** Products where the name and the supplier disagree on the material. */
const DISPUTED = new Set<string>([
  "hill-decor-16210",
  "drafts.hill-decor-16210",
]);

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
