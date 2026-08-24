/**
 * Rewrites every product description in the long house style.
 *
 * Damien: "make every single product description like the pergola, improve all
 * descriptions published and unpublished".
 *
 * Uses src/lib/catalog/describe-long.ts, which reproduces the Sorelle Two
 * Seater Sofa's structure — a short prose section that says something
 * specific, then a themed list, repeated — and writes only sentences a
 * recorded fact supports.
 *
 * **A rewrite is only written where it scores better than what is there.**
 * That is the whole guard, and it is deliberately the only one. "Improve all
 * descriptions" is the instruction, and a rewrite that scores worse is not an
 * improvement however consistent it looks. The scorer is the same one the
 * admin readiness screen uses, so this cannot drift from what Damien sees.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-long.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-long.ts --limit 20
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-long.ts --apply
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { contextFaults, sitingFor } from "../src/lib/catalog/context-check";
import {
  describeLong,
  type LongSection,
  longWordCount,
} from "../src/lib/catalog/describe-long";
import { scoreProduct } from "../src/lib/catalog/quality";
import {
  headingsOf,
  plainTextOf,
  type ProductDocument,
  QUALITY_PROJECTION,
  toQualityInput,
} from "../src/lib/catalog/quality-input";

const apply = process.argv.includes("--apply");
const limitFlag = process.argv.indexOf("--limit");
const LIMIT =
  limitFlag === -1 ? Infinity : Number(process.argv[limitFlag + 1] ?? Infinity);
/** The score a rewrite must beat by, so near-ties do not churn live pages. */
const MARGIN = 0.25;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** Sections to Portable Text, headings and bulleted lists included. */
export function toBlocks(sections: LongSection[], keyBase: string) {
  const blocks: unknown[] = [];
  let n = 0;
  const block = (text: string, style: string, listItem?: "bullet"): unknown => {
    const key = `${keyBase}-${n++}`;
    return {
      _type: "block",
      _key: key,
      style,
      markDefs: [],
      ...(listItem ? { listItem, level: 1 } : {}),
      children: [{ _type: "span", _key: `${key}-t`, text, marks: [] }],
    };
  };
  for (const section of sections) {
    blocks.push(block(section.heading, "h2"));
    for (const paragraph of section.paragraphs)
      blocks.push(block(paragraph, "normal"));
    if (section.list) {
      if (section.list.intro) blocks.push(block(section.list.intro, "normal"));
      for (const item of section.list.items)
        blocks.push(block(item, "normal", "bullet"));
    }
    if (section.close) blocks.push(block(section.close, "normal"));
  }
  return blocks;
}

/** Plain text of the generated sections, for scoring before anything is written. */
function toText(sections: LongSection[]): string {
  return sections
    .flatMap((s) => [
      s.heading,
      ...s.paragraphs,
      ...(s.list ? [s.list.intro, ...s.list.items] : []),
      ...(s.close ? [s.close] : []),
    ])
    .join("\n");
}

type Row = ProductDocument & {
  deliveryLeadTime?: string;
  primaryColour?: string;
};

interface Harvested {
  material?: string;
  colour?: string;
  extra?: Record<string, string>;
  features?: string[];
}

async function main() {
  const harvested: Record<string, Harvested> = existsSync(
    ".audit/harvested-facts.json",
  )
    ? JSON.parse(readFileSync(".audit/harvested-facts.json", "utf8"))
    : {};

  const rows: Row[] = await client.fetch(
    `*[_type == "product"] ${QUALITY_PROJECTION.replace(/}\s*$/, ", deliveryLeadTime, primaryColour }")}`,
  );

  const rewrites: {
    id: string;
    title: string;
    category: string;
    published: boolean;
    wasWords: number;
    nowWords: number;
    wasScore: number;
    nowScore: number;
    sections: LongSection[];
    /** The copy being replaced, so this run can be undone. */
    previous: string;
  }[] = [];
  const skipped = new Map<string, number>();
  /** Skipped-by-score, kept so the report can say whether the skip was right. */
  const held: {
    title: string;
    was: number;
    now: number;
    published: boolean;
  }[] = [];
  const note = (why: string) => skipped.set(why, (skipped.get(why) ?? 0) + 1);
  let contextFaultsFixed = 0;

  for (const doc of rows) {
    if (rewrites.length >= LIMIT) break;
    // Harvested facts are keyed by the published id; a draft shares them.
    const facts =
      harvested[doc._id] ?? harvested[doc._id.replace(/^drafts\./, "")] ?? {};

    const sections = describeLong({
      title: doc.title ?? "",
      slug: doc.slug ?? doc._id,
      category: doc.category,
      dimensions: doc.dimensions as never,
      weight: doc.weight as never,
      material: facts.material ?? null,
      colour: facts.colour ?? doc.primaryColour ?? null,
      extra: facts.extra ?? {},
      features: facts.features ?? [],
      deliveryLeadTime: doc.deliveryLeadTime ?? null,
      materialDisputed: DISPUTED.has(doc._id),
    });

    // A product we hold no measurements and no weight for cannot be given a
    // long page honestly: every specific sentence in the writer is built from
    // one of those, so what comes out is the generic frame and nothing else.
    // Damien caught this on "Sweet Birch Essential Oil 50ml" — a consumable
    // introduced as having "considered proportions and a restrained design".
    // These products need their facts harvested, not more prose.
    const d = doc.dimensions as
      { length?: number; width?: number; height?: number } | null | undefined;
    const hasSize = [d?.length, d?.width, d?.height].some(
      (n) => typeof n === "number" && n > 0,
    );
    if (!hasSize) {
      // Dimensions specifically, not "any fact at all". A 115g bottle of
      // essential oil has a weight, and weight alone buys one sentence about
      // being light. Everything else the long form does — how it sits in a
      // space, what it needs beside it, whether it fits — is built from size.
      // Without that, what comes out is the frame with nothing in it, which is
      // exactly what Damien saw on "Sweet Birch Essential Oil 50ml".
      note("no dimensions recorded — needs facts, not prose");
      continue;
    }

    const nowWords = longWordCount(sections);
    if (nowWords < 250) {
      note("too few facts to write a long page");
      continue;
    }

    const existing = toQualityInput(doc);
    const wasScore = scoreProduct(existing).overall;
    const nowScore = scoreProduct({
      ...existing,
      descriptionText: toText(sections),
      headings: sections.map((s) => s.heading),
    }).overall;

    if (nowScore < wasScore + MARGIN) {
      note("existing page already scores as well or better");
      held.push({
        title: doc.title ?? "",
        was: wasScore,
        now: nowScore,
        published: !doc._id.startsWith("drafts."),
      });
      continue;
    }

    const siting = sitingFor(doc.category);
    if (contextFaults(plainTextOf(doc.description), siting).length)
      contextFaultsFixed += 1;

    rewrites.push({
      id: doc._id,
      title: doc.title ?? "",
      category: doc.category ?? "",
      published: !doc._id.startsWith("drafts."),
      wasWords: scoreProduct(existing).stats.words,
      nowWords,
      wasScore,
      nowScore,
      sections,
      previous: plainTextOf(doc.description),
    });
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — long-form descriptions\n`);
  console.log(`Products in catalogue:  ${rows.length}`);
  console.log(`To rewrite:             ${rewrites.length}`);
  console.log(
    `  published:            ${rewrites.filter((r) => r.published).length}`,
  );
  console.log(
    `  drafts:               ${rewrites.filter((r) => !r.published).length}`,
  );
  for (const [why, count] of [...skipped].sort((a, b) => b[1] - a[1]))
    console.log(`  skipped, ${why}: ${count}`);

  if (rewrites.length) {
    const avg = (get: (r: (typeof rewrites)[number]) => number) =>
      rewrites.reduce((n, r) => n + get(r), 0) / rewrites.length;
    console.log(
      `\nWords:  ${Math.round(avg((r) => r.wasWords))} → ${Math.round(avg((r) => r.nowWords))} on average`,
    );
    console.log(
      `Score:  ${avg((r) => r.wasScore).toFixed(2)} → ${avg((r) => r.nowScore).toFixed(2)} on average`,
    );
    console.log(`Context faults corrected: ${contextFaultsFixed}`);

    const worst = [...rewrites].sort(
      (a, b) => b.nowScore - b.wasScore - (a.nowScore - a.wasScore),
    );
    console.log(`\nBiggest improvements:`);
    for (const r of worst.slice(0, 10))
      console.log(
        `  ${r.wasScore.toFixed(1)} → ${r.nowScore.toFixed(1)}  ${r.wasWords}w → ${r.nowWords}w  ${r.title.slice(0, 58)}`,
      );
  }

  // A skip is only the right answer if the page being kept is actually good.
  // Where both versions score badly the product needs facts, not prose, and
  // saying so is more use than a silent skip count.
  if (held.length) {
    const strong = held.filter((h) => h.was >= 8.5);
    const weak = held.filter((h) => h.was < 7.5);
    console.log(`\nOf the ${held.length} left alone:`);
    console.log(`  ${strong.length} are already strong pages (8.5+)`);
    console.log(
      `  ${held.length - strong.length - weak.length} are middling (7.5–8.5)`,
    );
    console.log(
      `  ${weak.length} score under 7.5 and the rewrite could not beat them — these need facts, not prose`,
    );
    if (weak.length) {
      console.log(`\n  Weakest pages the rewrite could not improve:`);
      for (const h of [...weak].sort((a, b) => a.was - b.was).slice(0, 10))
        console.log(
          `    ${h.was.toFixed(1)} (rewrite ${h.now.toFixed(1)})  ${h.published ? "LIVE " : "draft"}  ${h.title.slice(0, 52)}`,
        );
    }
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-descriptions-long.json`,
    JSON.stringify(
      {
        generatedAt: stamp,
        applied: apply,
        margin: MARGIN,
        // The *previous* copy is what makes this reversible. The new copy is
        // not recorded: this script is deterministic, so re-running it
        // reproduces it exactly, and storing both doubled the file to 7.6MB
        // for nothing.
        rewrites: rewrites.map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          published: r.published,
          wasWords: r.wasWords,
          nowWords: r.nowWords,
          wasScore: Number(r.wasScore.toFixed(2)),
          nowScore: Number(r.nowScore.toFixed(2)),
          previous: r.previous,
        })),
      },
      null,
      2,
    ),
  );
  console.log(
    `\nEvery rewrite recorded in docs/change-log/${stamp.slice(0, 10)}-descriptions-long.json`,
  );

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  let done = 0;
  for (const rewrite of rewrites) {
    // Only the description is touched. Titles, prices and lead times are not
    // this script's business and are left exactly as they are.
    await client
      .patch(rewrite.id)
      .set({ description: toBlocks(rewrite.sections, rewrite.id.slice(-8)) })
      .commit();
    if (++done % 50 === 0)
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
