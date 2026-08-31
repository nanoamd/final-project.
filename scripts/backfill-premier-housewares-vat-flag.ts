/**
 * One-time backfill: marks every Premier Housewares product already
 * corrected by `fix-premier-housewares-margins.ts` (applied 31 August,
 * before `costPriceVatCorrected` existed) as corrected, so the guard added
 * to that script afterwards actually takes effect.
 *
 * **Sets `costPriceVatCorrected` only — never touches `costPrice` or
 * `price`.** Deliberately separate from the main script so there is no way
 * for this run to also reapply the ×1.2. Safe to re-run: skips anything
 * already flagged.
 *
 *   pnpm tsx --env-file=.env.local scripts/backfill-premier-housewares-vat-flag.ts
 *   pnpm tsx --env-file=.env.local scripts/backfill-premier-housewares-vat-flag.ts --apply
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

const SUPPLIER = "Premier Housewares";

async function main() {
  const rows = await client.fetch<{ _id: string; title: string }[]>(
    `*[_type == "product" && supplier->name == $supplier && defined(costPrice) && costPriceVatCorrected != true]{ _id, title }`,
    { supplier: SUPPLIER },
  );

  console.log(
    `\n${rows.length} ${SUPPLIER} products to flag. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );
  for (const row of rows) console.log(`  flag  ${row.title}`);

  if (apply) {
    for (const row of rows) {
      await client.patch(row._id).set({ costPriceVatCorrected: true }).commit();
    }
  }

  console.log(`\n${rows.length} flagged.`);
  if (!apply) console.log("Nothing written. Re-run with --apply.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
