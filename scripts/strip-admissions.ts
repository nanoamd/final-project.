/**
 * Removes copy that admits we do not know something.
 *
 * Damien, on the live Lennox Black 2 Door Side Cupboard page, whose first
 * paragraph read "The details regarding assembly requirements … are not listed.
 * For further information, please refer to the supplied instruction manual or
 * contact customer support":
 *
 *   "thats language we shouldnt be using"
 *
 * A page has two honest options about a fact it does not hold: state it, or say
 * nothing. Announcing the gap tells a shopper we did not check, and sends them
 * away for the thing they came to find out.
 *
 * Deletion only. Nothing is generated, nothing is reworded, and no fact is
 * invented — which is what makes this safe to run across the catalogue in a way
 * the rewrite was not.
 *
 *   pnpm tsx --env-file=.env.local scripts/strip-admissions.ts
 *   pnpm tsx --env-file=.env.local scripts/strip-admissions.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { stripAdmissions } from "../src/lib/catalog/admissions";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
  const rows: {
    _id: string;
    title?: string;
    description?: unknown;
    category?: string;
  }[] = await client.fetch(
    `*[_type == "product"]{ _id, title, description, "category": category->title }`,
  );

  const changes: {
    id: string;
    title: string;
    category: string;
    published: boolean;
    removed: string[];
    emptiedHeadings: string[];
    blocks: unknown[];
    before: number;
    after: number;
    wordsBefore: number;
    wordsAfter: number;
  }[] = [];

  const wordsIn = (blocks: unknown): number =>
    (Array.isArray(blocks) ? blocks : [])
      .flatMap((b) =>
        ((b as { children?: { text?: string }[] }).children ?? []).map(
          (c) => c?.text ?? "",
        ),
      )
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;

  for (const row of rows) {
    if (!Array.isArray(row.description)) continue;
    const { blocks, removed, emptiedHeadings } = stripAdmissions(
      row.description,
    );
    if (!removed.length && !emptiedHeadings.length) continue;
    changes.push({
      id: row._id,
      title: row.title ?? "",
      category: row.category ?? "",
      published: !row._id.startsWith("drafts."),
      removed,
      emptiedHeadings,
      blocks,
      before: row.description.length,
      after: blocks.length,
      wordsBefore: wordsIn(row.description),
      wordsAfter: wordsIn(blocks),
    });
  }

  const sentences = changes.reduce((n, c) => n + c.removed.length, 0);
  const headings = changes.reduce((n, c) => n + c.emptiedHeadings.length, 0);

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — removing admissions\n`);
  console.log(
    `Products with a description: ${rows.filter((r) => Array.isArray(r.description)).length}`,
  );
  console.log(`Products affected:           ${changes.length}`);
  console.log(
    `  published:                 ${changes.filter((c) => c.published).length}`,
  );
  console.log(
    `  drafts:                    ${changes.filter((c) => !c.published).length}`,
  );
  console.log(`Sentences removed:           ${sentences}`);
  console.log(`Headings left empty:         ${headings}`);

  const byCategory = new Map<string, number>();
  for (const change of changes)
    byCategory.set(change.category, (byCategory.get(change.category) ?? 0) + 1);
  // Stripping an admission does not add a fact, so a page held up mostly by
  // apologies becomes a short page. That is the honest state of it, and worth
  // saying plainly rather than discovering later on the site.
  const thin = changes.filter((c) => c.wordsAfter < 120);
  const gutted = changes.filter((c) => c.wordsAfter < 60);
  console.log(
    `\nWords removed:               ${changes.reduce((n, c) => n + (c.wordsBefore - c.wordsAfter), 0).toLocaleString()}`,
  );
  console.log(
    `Pages left under 120 words:  ${thin.length} (${thin.filter((c) => c.published).length} live)`,
  );
  console.log(
    `Pages left under 60 words:   ${gutted.length} (${gutted.filter((c) => c.published).length} live)`,
  );

  if (thin.length) {
    console.log(`\n  The live ones that end up thin:`);
    for (const c of thin.filter((x) => x.published))
      console.log(
        `    ${c.wordsBefore}w → ${c.wordsAfter}w  ${c.title.slice(0, 60)}`,
      );
  }

  console.log(`\nBy category:`);
  for (const [category, count] of [...byCategory]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15))
    console.log(`  ${String(count).padStart(4)}  ${category || "(none)"}`);

  console.log(`\n──── what is being removed (worst first) ────`);
  for (const change of [...changes]
    .sort((a, b) => b.removed.length - a.removed.length)
    .slice(0, 12)) {
    console.log(
      `\n${change.published ? "LIVE " : "draft"}  ${change.title.slice(0, 62)}`,
    );
    for (const sentence of change.removed.slice(0, 4))
      console.log(`   − ${sentence.slice(0, 130)}`);
    for (const emptied of change.emptiedHeadings)
      console.log(`   − heading left empty: "${emptied}"`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-admissions.json`,
    JSON.stringify(
      {
        generatedAt: stamp,
        applied: apply,
        products: changes.length,
        sentences,
        changes: changes.map((c) => ({
          id: c.id,
          title: c.title,
          published: c.published,
          removed: c.removed,
          emptiedHeadings: c.emptiedHeadings,
        })),
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
  for (const change of changes) {
    await client.patch(change.id).set({ description: change.blocks }).commit();
    if (++done % 50 === 0) console.log(`  cleaned ${done}/${changes.length}`);
  }
  console.log(`\nCleaned ${done} descriptions.`);
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
