/**
 * Puts deleted Aosom products back from the export.
 *
 * delete-aosom-products.ts took all 32 Aosom documents, and the export it wrote
 * first is what makes that reversible. This restores from it.
 *
 * Restores everything in the export by default. `--drafts` or `--published`
 * narrows it, because the two sets have been wanted separately: the published four
 * are the ones on the site filling outdoor-kitchens, lighting and water-features,
 * and the 28 drafts are half-finished work with nothing published behind them.
 *
 * A restored draft whose published version is gone is a normal state in Sanity —
 * it shows in Studio as unpublished, like any other draft.
 *
 * Uses createOrReplace, so re-running is harmless. System fields are stripped from
 * the top level — _rev in particular, because passing a stale revision back is
 * either rejected or wrong. Nested _key, _ref and _type are left alone; those are
 * content, not metadata.
 *
 * Image assets were never deleted, so the galleries come back intact.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/restore-aosom-drafts.ts --file backups/<name>.json --published
 */
import { readFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const fileIndex = process.argv.indexOf("--file");
const file = fileIndex === -1 ? undefined : process.argv[fileIndex + 1];

if (!file) {
  console.error(
    "Give the export to restore from: --file backups/aosom-products-<stamp>.json",
  );
  process.exit(1);
}

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

/** Sanity owns these. Sending them back is at best ignored, at worst a conflict. */
const SYSTEM_FIELDS = ["_rev", "_createdAt", "_updatedAt", "_system"];

function stripSystemFields(doc: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc))
    if (!SYSTEM_FIELDS.includes(key)) clean[key] = value;
  return clean;
}

async function main() {
  const exported = JSON.parse(readFileSync(file!, "utf8")) as Record<
    string,
    unknown
  >[];

  const isDraft = (d: Record<string, unknown>) =>
    String(d._id).startsWith("drafts.");
  const wantDrafts = process.argv.includes("--drafts");
  const wantPublished = process.argv.includes("--published");
  // Neither flag means everything in the export, which is the safe reading of a
  // bare restore command.
  const drafts = exported.filter((d) =>
    wantDrafts === wantPublished ? true : wantDrafts ? isDraft(d) : !isDraft(d),
  );

  if (!drafts.length) {
    console.log(`\nNothing in ${file} matches — nothing to restore.\n`);
    return;
  }

  console.log(
    `\n${drafts.length} document(s) to restore from ${file}` +
      ` (${exported.length - drafts.length} left out by the flags given).\n`,
  );

  // Report what is already back before writing, so a re-run reads honestly rather
  // than claiming to have restored documents that were never missing.
  const ids = drafts.map((d) => String(d._id));
  const existing = new Set(
    await client.fetch<string[]>(`*[_id in $ids]._id`, { ids }),
  );

  for (const d of drafts)
    console.log(
      `  ${existing.has(String(d._id)) ? "already there" : apply ? "restored    " : "missing     "}  ` +
        `${String(d.title ?? d._id).slice(0, 62)}`,
    );

  if (!apply) {
    console.log(
      `\nDry run — nothing written. Re-run with --apply.\n` +
        `${drafts.length - existing.size} of ${drafts.length} are currently missing.\n`,
    );
    return;
  }

  let transaction = client.transaction();
  for (const d of drafts)
    transaction = transaction.createOrReplace(
      stripSystemFields(d) as { _id: string; _type: string },
    );
  await transaction.commit();

  console.log(`\n${drafts.length} document(s) restored.\n`);
}

main().catch((err) => {
  console.error("restore-aosom-drafts failed:", err);
  process.exit(1);
});
