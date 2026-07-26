/**
 * One-time cleanup — permanently deletes every product document whose
 * "brand" reference does NOT point at the SaunaPlunge brand document
 * (brand-saunaplunge), keeping only real SaunaPlunge products.
 *
 * Deliberately outside src/: it needs a write-scoped API token that must
 * never be part of the app's own runtime environment. Reads
 * SANITY_API_WRITE_TOKEN directly from process.env (see .env.example),
 * same precedent as scripts/seed-sanity.ts.
 *
 * SAFE BY DEFAULT: running this script with no flags only prints what it
 * WOULD delete — nothing is removed. You must pass --confirm to actually
 * delete. This is permanent: both the published and draft version of each
 * matching product are deleted, and there is no undo.
 *
 * Run with:
 *   pnpm tsx scripts/delete-non-saunaplunge-products.ts            # dry run
 *   pnpm tsx scripts/delete-non-saunaplunge-products.ts --confirm  # deletes
 */
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in your environment.\n" +
      "Set both in .env.local (see .env.example) before running this script.\n" +
      "The write token needs Editor permission — create one at sanity.io/manage under the project's API settings.",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

const SAUNAPLUNGE_BRAND_ID = "brand-saunaplunge";
const confirmed = process.argv.includes("--confirm");

interface ProductRow {
  _id: string;
  title: string;
  brandRef: string | null;
}

async function main() {
  // "*[_type == 'product']" naturally includes both drafts.<id> and <id>
  // documents if both exist — dedupe by the base id (stripping "drafts.")
  // so a product with both a draft and published version is only listed
  // (and deleted) once per base id, not twice.
  const rows = await client.fetch<ProductRow[]>(
    `*[_type == "product"]{ _id, title, "brandRef": brand->_id }`,
  );

  const byBaseId = new Map<string, ProductRow>();
  for (const row of rows) {
    const baseId = row._id.replace(/^drafts\./, "");
    // Prefer the published version's data if both exist, but either is fine
    // for deciding brand — they should agree.
    if (!byBaseId.has(baseId) || !row._id.startsWith("drafts.")) {
      byBaseId.set(baseId, row);
    }
  }

  const toDelete = [...byBaseId.entries()].filter(
    ([, row]) => row.brandRef !== SAUNAPLUNGE_BRAND_ID,
  );
  const toKeep = [...byBaseId.entries()].filter(
    ([, row]) => row.brandRef === SAUNAPLUNGE_BRAND_ID,
  );

  console.log(`Found ${byBaseId.size} product(s) total.\n`);

  console.log(`KEEPING (${toKeep.length}) — brand is SaunaPlunge:`);
  for (const [baseId, row] of toKeep) {
    console.log(`  ✓ ${row.title}  (${baseId})`);
  }

  console.log(`\nDELETING (${toDelete.length}) — brand is not SaunaPlunge:`);
  for (const [baseId, row] of toDelete) {
    console.log(`  ✗ ${row.title}  (${baseId})`);
  }

  if (!toDelete.length) {
    console.log("\nNothing to delete.");
    return;
  }

  if (!confirmed) {
    console.log(
      `\nDry run only — no changes made. Re-run with --confirm to permanently delete the ${toDelete.length} product(s) listed above.`,
    );
    return;
  }

  console.log(`\nDeleting ${toDelete.length} product(s)...`);
  for (const [baseId] of toDelete) {
    // Delete both possible document forms — a product may have only a
    // published version, only a draft, or both. Sanity's delete is a no-op
    // (not an error) for an id that doesn't exist.
    await client.delete(baseId);
    await client.delete(`drafts.${baseId}`);
    console.log(`  deleted ${baseId}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
