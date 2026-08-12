/**
 * Removes every Aosom product, keeping a full copy first.
 *
 * "For now" is the operative part of the request, so this exports each document
 * verbatim to a timestamped JSON file before deleting anything. Restoring is then
 * a `createOrReplace` per document — and it restores faithfully, because deleting
 * a product does not delete its uploaded image assets, so the gallery references
 * in the export stay valid.
 *
 * Matched on the supplier reference and on the Aosom house brands in the title
 * (HOMCOM, Outsunny), since the supplier document is named "AOSON" — a typo for
 * Aosom that predates this script and would make a name-only match miss nothing
 * but is worth not relying on alone.
 *
 * 32 documents: 4 published and 28 drafts. Checked for inbound references first;
 * there are none, so nothing is left pointing at a deleted document.
 *
 * Deleting the 4 published ones empties three categories that have no other
 * published product — outdoor-kitchens, lighting and water-features. They are not
 * hidden from the nav, so each will show its empty state until something else
 * lands there. The 4 D.I. Designs Gesso lamps already imported as drafts refill
 * lighting as soon as they are published.
 *
 * The supplier and brand documents are left alone: they are referenced by the
 * export, and by the pipeline notes.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/delete-aosom-products.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const BACKUP_DIR = "backups";

const QUERY = `*[_type == "product" && (
  supplier->name match "*AOSON*" || supplier->name match "*Aosom*" ||
  title match "*HOMCOM*" || title match "*Outsunny*" ||
  _id match "*outsunny*" || _id match "*homcom*" ||
  sourceUrl match "*aosom*"
)]`;

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

async function main() {
  const docs = await client.fetch<Record<string, unknown>[]>(
    `${QUERY} | order(title asc)`,
  );
  if (!docs.length) {
    console.log("\nNo Aosom products found — nothing to do.\n");
    return;
  }

  const published = docs.filter((d) => !String(d._id).startsWith("drafts."));
  const drafts = docs.length - published.length;

  console.log(
    `\n${docs.length} Aosom product(s): ${published.length} published, ${drafts} draft(s).\n`,
  );
  console.log("Published — these are live on the site now:");
  for (const d of published)
    console.log(
      `  £${String(d.price ?? "—").padEnd(7)} ${String(d.title).slice(0, 56)}`,
    );

  // Refuse rather than orphan a reference. There are none today, but a featured
  // product on the homepage or a link from a buying guide would leave a broken
  // card rather than an error, which is the sort of thing found weeks later.
  const blocked: string[] = [];
  for (const d of docs) {
    const refs = await client.fetch<{ _type: string; _id: string }[]>(
      `*[references($id) && _id != $id]{_type, _id}`,
      { id: d._id },
    );
    if (refs.length)
      blocked.push(
        `${String(d.title).slice(0, 40)} ← ${refs.map((r) => `${r._type}:${r._id}`).join(", ")}`,
      );
  }
  if (blocked.length) {
    console.error(
      `\nAborting: ${blocked.length} product(s) are referenced elsewhere.\n` +
        blocked.map((b) => `  - ${b}`).join("\n") +
        `\n\nClear those references first, or the deletion leaves them pointing at nothing.\n`,
    );
    process.exit(1);
  }

  if (!apply) {
    console.log(
      `\nDry run — nothing written or deleted.\n` +
        `Re-run with --apply to export to ${BACKUP_DIR}/ and delete.\n`,
    );
    return;
  }

  // Export before the first delete, not alongside it: a failure halfway through
  // must not leave some documents gone and unrecorded.
  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(BACKUP_DIR, `aosom-products-${stamp}.json`);
  writeFileSync(file, JSON.stringify(docs, null, 2), "utf8");
  console.log(`\nExported ${docs.length} document(s) to ${file}`);

  let deleted = 0;
  for (const d of docs) {
    await client.delete(String(d._id));
    deleted++;
  }

  console.log(
    `\nDeleted ${deleted} document(s).\n\n` +
      "outdoor-kitchens, lighting and water-features now have no published\n" +
      "product and will show their empty state. Publishing the four D.I. Designs\n" +
      "Gesso lamps refills lighting.\n\n" +
      `To restore: read ${file} and createOrReplace each document. The image\n` +
      "assets were not deleted, so the galleries come back intact.\n",
  );
}

main().catch((err) => {
  console.error("delete-aosom-products failed:", err);
  process.exit(1);
});
