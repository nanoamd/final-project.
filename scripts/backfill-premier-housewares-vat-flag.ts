/**
 * One-time backfill, already run: marked every Premier Housewares product
 * already corrected by `fix-premier-housewares-margins.ts` (applied
 * 31 August, before `costPriceVatCorrected` existed) as corrected, so the
 * guard added to that script afterwards actually takes effect.
 *
 * **Do not re-run this.** Its whole premise — "a Premier Housewares product
 * with a cost price already went through the fix" — is only true for
 * products that existed before it ran. Damien was creating new draft
 * products at the same time (typing a fresh, un-corrected supplier price
 * straight in), and this flagged 17 of them as done before he ever added
 * VAT: *"youve done it again i cant add vat because it thinks its already
 * been added"*. Fixed by `unflag-premature-vat-drafts.ts`, which undoes
 * exactly those 17. Kept here as the record of what ran and why, not as a
 * tool to run again — a second run would make the same mistake on whatever
 * new drafts exist by then.
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
