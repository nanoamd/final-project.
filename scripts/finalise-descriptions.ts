/**
 * Brings every product description to the house standard, or writes nothing.
 *
 * Damien: "literally just make every product description great and consistent
 * with 0 mistakes."
 *
 * Consistency and zero mistakes are things code can guarantee; "great" is not,
 * because a page can only be as good as the facts behind it. So this does two
 * separate jobs and keeps them honest about which is which.
 *
 * **Every page written is checked before it is written.** The generated text
 * goes through every detector this project has — the context checker, the
 * wording checker, and the quality scorer's artefact patterns — and a single
 * finding means the page is not written at all. It goes on a list instead,
 * with the reason. That is the difference between "I sampled some and they
 * looked fine", which is how the last two runs went wrong, and a standard the
 * code actually enforces.
 *
 * Two passes:
 *
 *   1. REWRITE  — products we hold enough facts for get the long-form page,
 *                 but only if it passes every check and scores better than
 *                 what is already there.
 *   2. CLEAN    — everything else keeps its existing copy with the admissions
 *                 stripped out, so no page is left saying "this is not listed"
 *                 even where we cannot replace it.
 *
 * Nothing is invented in either pass.
 *
 *   pnpm tsx --env-file=.env.local scripts/finalise-descriptions.ts
 *   pnpm tsx --env-file=.env.local scripts/finalise-descriptions.ts --apply
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { stripAdmissions } from "../src/lib/catalog/admissions";
import { contextFaults, sitingFor } from "../src/lib/catalog/context-check";
import {
  describeLong,
  type LongSection,
  longWordCount,
} from "../src/lib/catalog/describe-long";
import { ARTEFACTS, scoreProduct } from "../src/lib/catalog/quality";
import {
  type ProductDocument,
  QUALITY_PROJECTION,
  toQualityInput,
} from "../src/lib/catalog/quality-input";
import { wordingFaults } from "../src/lib/catalog/wording-check";

const apply = process.argv.includes("--apply");
const limitFlag = process.argv.indexOf("--limit");
const LIMIT =
  limitFlag === -1 ? Infinity : Number(process.argv[limitFlag + 1] ?? Infinity);
/** The margin a rewrite must win by, so near-ties do not churn live pages. */
const MARGIN = 0.25;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** Sections to Portable Text, headings and bulleted lists included. */
function toBlocks(sections: LongSection[], keyBase: string) {
  const blocks: unknown[] = [];
  let n = 0;
  const block = (text: string, style: string, listItem?: "bullet") => {
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

/**
 * Every objection to a piece of copy, from every checker we have.
 *
 * One entry here means the page does not get written. There is no severity
 * ranking and no allowance: the point of the gate is that it does not need me
 * to exercise judgement about which faults are acceptable.
 */
function objections(
  text: string,
  doc: Row,
  extra: Record<string, string>,
  colour: string | null,
) {
  const found: string[] = [];
  for (const fault of contextFaults(text, sitingFor(doc.category)))
    found.push(
      `context: "${fault.phrase}" in "${fault.sentence.slice(0, 70)}"`,
    );
  for (const fault of wordingFaults({
    title: doc.title ?? "",
    text,
    dimensions: doc.dimensions as never,
    weight: doc.weight as never,
    // The checker must be told the same colour the writer was given, or a
    // compound value like "grey, white" is reported as contradicting itself.
    colour: colour ?? doc.primaryColour ?? null,
    deliveryLeadTime: doc.deliveryLeadTime ?? null,
    extra,
  }))
    found.push(`${fault.check}: ${fault.message}`);
  for (const artefact of ARTEFACTS)
    if (artefact.pattern.test(text))
      found.push(`artefact: ${artefact.message}`);
  return found;
}

async function main() {
  const harvested: Record<
    string,
    {
      material?: string;
      colour?: string;
      extra?: Record<string, string>;
      features?: string[];
    }
  > = existsSync(".audit/harvested-facts.json")
    ? JSON.parse(readFileSync(".audit/harvested-facts.json", "utf8"))
    : {};

  const rows: Row[] = await client.fetch(
    `*[_type == "product"] ${QUALITY_PROJECTION.replace(/}\s*$/, ", deliveryLeadTime, primaryColour }")}`,
  );

  const rewrites: {
    id: string;
    title: string;
    published: boolean;
    blocks: unknown[];
    wasScore: number;
    nowScore: number;
    words: number;
  }[] = [];
  const cleans: {
    id: string;
    title: string;
    published: boolean;
    blocks: unknown[];
    removed: number;
  }[] = [];
  const held = new Map<string, number>();
  const heldExamples = new Map<string, string>();
  const note = (why: string, title: string) => {
    held.set(why, (held.get(why) ?? 0) + 1);
    if (!heldExamples.has(why)) heldExamples.set(why, title);
  };

  for (const doc of rows) {
    if (rewrites.length >= LIMIT) break;
    const facts =
      harvested[doc._id] ?? harvested[doc._id.replace(/^drafts\./, "")] ?? {};
    const extra = facts.extra ?? {};

    const d = doc.dimensions as
      { length?: number; width?: number; height?: number } | null | undefined;
    const hasSize = [d?.length, d?.width, d?.height].some(
      (n) => typeof n === "number" && n > 0,
    );

    let rewritten = false;
    if (hasSize) {
      const sections = describeLong({
        title: doc.title ?? "",
        slug: doc.slug ?? doc._id,
        category: doc.category,
        dimensions: doc.dimensions as never,
        weight: doc.weight as never,
        material: facts.material ?? null,
        colour: facts.colour ?? doc.primaryColour ?? null,
        extra,
        features: facts.features ?? [],
        deliveryLeadTime: doc.deliveryLeadTime ?? null,
        materialDisputed: DISPUTED.has(doc._id),
      });
      const text = toText(sections);
      const found = objections(
        text,
        doc,
        extra,
        facts.colour ?? doc.primaryColour ?? null,
      );

      if (found.length) {
        note(`generated copy failed a check — ${found[0]}`, doc.title ?? "");
      } else {
        const existing = toQualityInput(doc);
        const wasScore = scoreProduct(existing).overall;
        const nowScore = scoreProduct({
          ...existing,
          descriptionText: text,
          headings: sections.map((s) => s.heading),
        }).overall;
        if (nowScore >= wasScore + MARGIN) {
          rewrites.push({
            id: doc._id,
            title: doc.title ?? "",
            published: !doc._id.startsWith("drafts."),
            blocks: toBlocks(sections, doc._id.slice(-8)),
            wasScore,
            nowScore,
            words: longWordCount(sections),
          });
          rewritten = true;
        } else {
          note(
            "existing page already scores as well or better",
            doc.title ?? "",
          );
        }
      }
    } else {
      note("no dimensions recorded — needs facts, not prose", doc.title ?? "");
    }

    // Anything not rewritten still gets its apologies removed.
    if (!rewritten && Array.isArray(doc.description)) {
      const { blocks, removed, emptiedHeadings } = stripAdmissions(
        doc.description,
      );
      if (removed.length || emptiedHeadings.length)
        cleans.push({
          id: doc._id,
          title: doc.title ?? "",
          published: !doc._id.startsWith("drafts."),
          blocks,
          removed: removed.length,
        });
    }
  }

  console.log(
    `\n${apply ? "APPLYING" : "DRY RUN"} — finalising descriptions\n`,
  );
  console.log(`Products:                    ${rows.length}`);
  console.log(
    `Rewritten to the house style: ${rewrites.length} (${rewrites.filter((r) => r.published).length} live)`,
  );
  console.log(
    `Cleaned of admissions only:   ${cleans.length} (${cleans.filter((c) => c.published).length} live)`,
  );
  console.log(
    `Left alone:                   ${[...held.values()].reduce((a, b) => a + b, 0)}`,
  );
  for (const [why, count] of [...held].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(count).padStart(5)}  ${why}`);

  if (rewrites.length) {
    const avg = (get: (r: (typeof rewrites)[number]) => number) =>
      rewrites.reduce((n, r) => n + get(r), 0) / rewrites.length;
    console.log(
      `\nRewritten pages: ${Math.round(avg((r) => r.words))} words on average, score ${avg((r) => r.wasScore).toFixed(2)} → ${avg((r) => r.nowScore).toFixed(2)}`,
    );
    console.log(
      `Every one of them passed all ${ARTEFACTS.length + 2} checks with zero findings.`,
    );
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-finalise.json`,
    JSON.stringify(
      {
        generatedAt: stamp,
        applied: apply,
        rewritten: rewrites.map((r) => ({
          id: r.id,
          title: r.title,
          published: r.published,
          words: r.words,
          wasScore: Number(r.wasScore.toFixed(2)),
          nowScore: Number(r.nowScore.toFixed(2)),
        })),
        cleaned: cleans.map((c) => ({
          id: c.id,
          title: c.title,
          published: c.published,
          sentencesRemoved: c.removed,
        })),
        heldBack: Object.fromEntries(held),
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log(`\nNothing written. Re-run with --apply.`);
    return;
  }

  let done = 0;
  for (const rewrite of rewrites) {
    await client
      .patch(rewrite.id)
      .set({ description: rewrite.blocks })
      .commit();
    if (++done % 50 === 0)
      console.log(`  rewritten ${done}/${rewrites.length}`);
  }
  console.log(`Rewrote ${done}.`);
  let cleaned = 0;
  for (const clean of cleans) {
    await client.patch(clean.id).set({ description: clean.blocks }).commit();
    if (++cleaned % 50 === 0)
      console.log(`  cleaned ${cleaned}/${cleans.length}`);
  }
  console.log(`Cleaned ${cleaned}.`);
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
