/**
 * Takes supplier material percentages out of summaries and descriptions.
 *
 * Damien, on a planter summary reading "made of 90% stoneware and 10% plating":
 * "90% 10% what is the need in saying that, you have weird descriptions".
 *
 * None. A composition breakdown belongs in a customs declaration. 659 products
 * carry one. The numbers come out and the materials stay, because the materials
 * are the part a shopper wanted.
 *
 *   pnpm tsx --env-file=.env.local scripts/strip-percentages.ts
 *   pnpm tsx --env-file=.env.local scripts/strip-percentages.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import {
  hasPercentages,
  stripPercentages,
  stripPercentagesFromBlocks,
} from "../src/lib/catalog/percentages";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Row {
  _id: string;
  title?: string | null;
  tagline?: string | null;
  summary?: string | null;
  description?: unknown;
}

async function main() {
  const rows: Row[] = await client.fetch(
    `*[_type == "product"]{ _id, title, tagline, summary, description }`,
  );

  const changes: {
    id: string;
    title: string;
    published: boolean;
    patch: Record<string, unknown>;
    samples: { field: string; before: string; after: string }[];
  }[] = [];

  for (const row of rows) {
    const patch: Record<string, unknown> = {};
    const samples: { field: string; before: string; after: string }[] = [];

    for (const field of ["tagline", "summary"] as const) {
      const value = row[field];
      if (typeof value !== "string" || !hasPercentages(value)) continue;
      const cleaned = stripPercentages(value);
      patch[field] = cleaned;
      samples.push({ field, before: value, after: cleaned });
    }

    if (Array.isArray(row.description)) {
      const { blocks, changed } = stripPercentagesFromBlocks(row.description);
      if (changed.length) {
        patch.description = blocks;
        for (const change of changed.slice(0, 2))
          samples.push({
            field: "description",
            before: change.before,
            after: change.after,
          });
      }
    }

    if (Object.keys(patch).length)
      changes.push({
        id: row._id,
        title: row.title ?? "",
        published: !row._id.startsWith("drafts."),
        patch,
        samples,
      });
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — material percentages\n`);
  console.log(`Products:            ${rows.length}`);
  console.log(`To clean:            ${changes.length}`);
  console.log(
    `  published:         ${changes.filter((c) => c.published).length}`,
  );
  console.log(
    `  drafts:            ${changes.filter((c) => !c.published).length}`,
  );
  const fields = new Map<string, number>();
  for (const change of changes)
    for (const field of Object.keys(change.patch))
      fields.set(field, (fields.get(field) ?? 0) + 1);
  for (const [field, count] of fields)
    console.log(`  ${String(count).padStart(5)}  ${field}`);

  console.log(`\n──── before and after ────`);
  for (const change of changes.slice(0, 10))
    for (const sample of change.samples.slice(0, 1)) {
      console.log(
        `\n${change.published ? "LIVE " : "draft"}  [${sample.field}]`,
      );
      console.log(`  −  ${sample.before.slice(0, 150)}`);
      console.log(`  +  ${sample.after.slice(0, 150) || "(removed)"}`);
    }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-percentages.json`,
    JSON.stringify(
      {
        generatedAt: stamp,
        applied: apply,
        changes: changes.map((c) => ({
          id: c.id,
          title: c.title,
          published: c.published,
          samples: c.samples,
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
    await client.patch(change.id).set(change.patch).commit();
    if (++done % 100 === 0) console.log(`  cleaned ${done}/${changes.length}`);
  }
  console.log(`\nCleaned ${done} products.`);
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
