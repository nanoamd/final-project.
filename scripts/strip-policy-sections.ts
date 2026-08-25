/**
 * Removes duplicated site policy from product descriptions.
 *
 * Damien, on a garden dining set whose whole description was a parts list
 * followed by "Delivery" and "Returns": "wow".
 *
 * The product page already renders a "Delivery, Returns & Warranty" tab from
 * the real fields, so a Delivery heading inside the description shows the same
 * words twice on the same page — and shows them identically on 1,623 product
 * pages, which is duplicate content across almost the whole catalogue.
 *
 * It also hid something. Boilerplate is words, and words are what the quality
 * scorer counts, so a description of nothing but a parts list and a returns
 * policy scored as a written page. That is how products with nothing to say
 * about themselves reached the "publishable now" list.
 *
 * Deletion only, and nothing is lost: everything removed is either already
 * rendered by the delivery tab or identical on every order.
 *
 *   pnpm tsx --env-file=.env.local scripts/strip-policy-sections.ts
 *   pnpm tsx --env-file=.env.local scripts/strip-policy-sections.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import {
  describesTheProduct,
  stripPolicySections,
} from "../src/lib/catalog/policy-sections";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
  const rows: { _id: string; title?: string; description?: unknown }[] =
    await client.fetch(
      `*[_type == "product" && defined(description)]{ _id, title, description }`,
    );

  const changes: {
    id: string;
    title: string;
    published: boolean;
    blocks: unknown[];
    removed: string[];
    words: number;
    saysNothing: boolean;
  }[] = [];
  const saysNothingAlready: {
    id: string;
    title: string;
    published: boolean;
  }[] = [];

  for (const row of rows) {
    const { blocks, removedSections, wordsRemoved } = stripPolicySections(
      row.description,
    );
    const published = !row._id.startsWith("drafts.");
    const saysNothing = !describesTheProduct(row.description);
    if (saysNothing)
      saysNothingAlready.push({
        id: row._id,
        title: row.title ?? "",
        published,
      });
    if (!removedSections.length) continue;
    changes.push({
      id: row._id,
      title: row.title ?? "",
      published,
      blocks,
      removed: removedSections,
      words: wordsRemoved,
      saysNothing,
    });
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — duplicated site policy\n`);
  console.log(`Products with a description: ${rows.length}`);
  console.log(`Repeating site policy:       ${changes.length}`);
  console.log(
    `  published:                 ${changes.filter((c) => c.published).length}`,
  );
  console.log(
    `Words of duplication removed: ${changes.reduce((n, c) => n + c.words, 0).toLocaleString()}`,
  );

  const bySection = new Map<string, number>();
  for (const change of changes)
    for (const section of change.removed)
      bySection.set(section, (bySection.get(section) ?? 0) + 1);
  console.log(`\nSections removed:`);
  for (const [section, count] of [...bySection]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12))
    console.log(`  ${String(count).padStart(5)}  ${section}`);

  console.log(
    `\n──── ${saysNothingAlready.length} descriptions say nothing about the product ────`,
  );
  console.log(
    `These are the ones the readiness check was passing on boilerplate alone.`,
  );
  for (const item of saysNothingAlready.slice(0, 15))
    console.log(
      `  ${item.published ? "LIVE " : "draft"}  ${item.title.slice(0, 62)}`,
    );

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-policy-sections.json`,
    JSON.stringify(
      {
        generatedAt: stamp,
        applied: apply,
        changes: changes.map((c) => ({
          id: c.id,
          title: c.title,
          published: c.published,
          removed: c.removed,
          words: c.words,
        })),
        saysNothingAboutTheProduct: saysNothingAlready,
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
  const failed: string[] = [];
  for (const change of changes) {
    try {
      await client
        .patch(change.id)
        .set({ description: change.blocks })
        .commit();
      done += 1;
    } catch {
      failed.push(change.id);
    }
    if ((done + failed.length) % 100 === 0)
      console.log(`  ${done + failed.length}/${changes.length}`);
  }
  console.log(`\nCleaned ${done} descriptions.`);
  if (failed.length)
    console.log(`Skipped ${failed.length} that could not be patched.`);
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
