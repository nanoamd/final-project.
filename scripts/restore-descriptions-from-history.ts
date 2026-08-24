/**
 * Puts descriptions back to what they were at a given moment.
 *
 * Written because the first catalogue-wide long-form run wrote 396 drafts
 * before Damien spotted that the writer was mangling product names — "Sweet
 * Birch Essential Oil 50ml" introduced as "the Sweet" — and the run had to be
 * stopped mid-flight.
 *
 * The change log records the previous copy as plain text, which is enough to
 * read but not enough to restore: it loses the block structure, the headings
 * and the keys. Sanity's history API returns the whole document as it stood at
 * a timestamp, so that is what this uses. Nothing is reconstructed.
 *
 *   pnpm tsx --env-file=.env.local scripts/restore-descriptions-from-history.ts \
 *     --since 2026-08-24T19:00:00Z
 *   ... --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const sinceFlag = process.argv.indexOf("--since");
const SINCE = sinceFlag === -1 ? null : process.argv[sinceFlag + 1];

if (!SINCE) {
  console.error(
    "Pass --since <ISO timestamp>, the moment to restore the descriptions to.",
  );
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

/** The document as it stood at `SINCE`, or null if history does not reach. */
async function documentAt(id: string): Promise<Record<string, unknown> | null> {
  try {
    const response = (await client.request({
      url: `/data/history/${dataset}/documents/${encodeURIComponent(id)}?time=${SINCE}`,
      method: "GET",
    })) as {
      documents?: Record<string, unknown>[];
      document?: Record<string, unknown>;
    };
    return response?.documents?.[0] ?? response?.document ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const touched: { _id: string; title?: string; _updatedAt: string }[] =
    await client.fetch(
      `*[_type == "product" && _updatedAt > $since]{_id, title, _updatedAt} | order(_updatedAt asc)`,
      { since: SINCE },
    );

  console.log(
    `\n${apply ? "RESTORING" : "DRY RUN"} — descriptions as at ${SINCE}\n`,
  );
  console.log(`Products changed since then: ${touched.length}`);
  console.log(
    `  published: ${touched.filter((t) => !t._id.startsWith("drafts.")).length}`,
  );
  console.log(
    `  drafts:    ${touched.filter((t) => t._id.startsWith("drafts.")).length}`,
  );

  const restores: { id: string; title: string; blocks: unknown }[] = [];
  const unavailable: string[] = [];

  for (const doc of touched) {
    const before = await documentAt(doc._id);
    if (!before) {
      unavailable.push(doc._id);
      continue;
    }
    // A document that did not exist then, or held no description, is left
    // alone rather than having an empty description written over it.
    if (!Array.isArray(before.description)) {
      unavailable.push(doc._id);
      continue;
    }
    restores.push({
      id: doc._id,
      title: doc.title ?? "",
      blocks: before.description,
    });
  }

  console.log(`Restorable from history:     ${restores.length}`);
  if (unavailable.length)
    console.log(`No usable history:           ${unavailable.length}`);

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-restore.json`,
    JSON.stringify(
      {
        generatedAt: stamp,
        restoredTo: SINCE,
        applied: apply,
        unavailable,
        ids: restores.map((r) => r.id),
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
  for (const restore of restores) {
    await client
      .patch(restore.id)
      .set({ description: restore.blocks })
      .commit();
    if (++done % 50 === 0) console.log(`  restored ${done}/${restores.length}`);
  }
  console.log(`\nRestored ${done} descriptions.`);
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
