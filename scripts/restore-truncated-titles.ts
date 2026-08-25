/**
 * Restores titles that the regex simplifier chopped.
 *
 * `simplify-marketplace-titles.ts` cut any title over seventy characters at
 * the nearest space. On marketplace listings that removed keyword padding; on
 * ordinary Kaiku names it removed the noun:
 *
 *   Kensington Townhouse Nickel Finish Small Floorstanding Pillar Candle Holder
 *   Kensington Townhouse Nickel Finish Small Floorstanding Pillar Candle
 *
 *   Hanah Black Snake Leather Effect Floor Lamp with Chrome Base and Black Shade
 *   Hanah Black Snake Leather Effect Floor Lamp with Chrome Base
 *
 * That was my error, and it reached live data. This puts those titles back
 * exactly as they were, from the change log written before the edit.
 *
 * Aosom titles are deliberately skipped: those are being replaced by
 * hand-written names in scripts/apply-aosom-titles.ts, so restoring the old
 * marketplace strings first would only undo the work.
 *
 *   pnpm tsx --env-file=.env.local scripts/restore-truncated-titles.ts
 *   pnpm tsx --env-file=.env.local scripts/restore-truncated-titles.ts --apply
 */
import { existsSync, readFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const LOG = "docs/change-log/2026-08-21-titles.json";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const strip = (title: string) =>
  title.replace(/\s*\|\s*Kaiku(?:\s+Tagline)?\s*$/i, "").trim();

async function main() {
  if (!existsSync(LOG)) {
    console.error(`No change log at ${LOG}; nothing to restore from.`);
    process.exit(1);
  }
  const log: { changes: { id: string; before: string; after: string }[] } =
    JSON.parse(readFileSync(LOG, "utf8"));

  // A pure truncation: what was written is a prefix of what was there before.
  const truncated = log.changes.filter((change) => {
    const before = strip(change.before);
    const after = strip(change.after);
    return before.startsWith(after) && before.length > after.length;
  });

  const ids = truncated.map((c) => c.id);
  const suppliers: { _id: string; supplier?: string; title?: string }[] =
    await client.fetch(
      `*[_type == "product" && _id in $ids]{ _id, "supplier": supplier->name, title }`,
      { ids },
    );
  const bySupplier = new Map(suppliers.map((s) => [s._id, s]));

  const restore: { id: string; from: string; to: string }[] = [];
  let skippedAosom = 0;
  let alreadyRight = 0;

  for (const change of truncated) {
    const current = bySupplier.get(change.id);
    if (!current) continue;
    if (current.supplier === "Aosom") {
      skippedAosom++;
      continue;
    }
    const wanted = `${strip(change.before)} | Kaiku`;
    if (current.title === wanted) {
      alreadyRight++;
      continue;
    }
    restore.push({ id: change.id, from: current.title ?? "", to: wanted });
  }

  console.log(
    `\n${apply ? "APPLYING" : "DRY RUN"} — restore truncated titles\n`,
  );
  console.log(`Truncations in the log:     ${truncated.length}`);
  console.log(`  Aosom, left alone:        ${skippedAosom}`);
  console.log(`  already correct:          ${alreadyRight}`);
  console.log(`  to restore:               ${restore.length}`);

  for (const item of restore) {
    console.log(`\n  −  ${item.from}`);
    console.log(`  +  ${item.to}`);
  }

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  let done = 0;
  for (const item of restore) {
    await client.patch(item.id).set({ title: item.to }).commit();
    done++;
  }
  console.log(`\nRestored ${done} titles.`);
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
