/**
 * Un-does a mistake in `backfill-premier-housewares-vat-flag.ts`.
 *
 * Damien: *"youve done it again i cant add vat because it thinks its
 * already been added"* — on a brand-new draft (Allegra Brown Glass
 * Bathroom Tumbler, never published, price still empty) whose "+20% VAT"
 * button was permanently disabled before he ever clicked it.
 *
 * The backfill assumed "a Premier Housewares product with a cost price
 * already went through the fix" — true for the 401 that existed before
 * 31 August, wrong for a draft Damien is creating fresh and typing a raw
 * supplier price into for the first time. It ran while he had exactly 17
 * such drafts open with a cost price already typed in, and flagged all of
 * them as done without ever multiplying anything.
 *
 * Exact 17 IDs, found by tracing which drafts were flagged `true` with no
 * published counterpart and no evidence in Sanity's transaction history of
 * this token ever writing a new costPrice to them — only ever the flag.
 * Unsets `costPriceVatCorrected` only. Never touches `costPrice` — these
 * are Damien's own freshly-typed numbers, his to correct with the button
 * now that it works again.
 *
 *   pnpm tsx --env-file=.env.local scripts/unflag-premature-vat-drafts.ts
 *   pnpm tsx --env-file=.env.local scripts/unflag-premature-vat-drafts.ts --apply
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

const IDS = [
  "drafts.premier-housewares-5506418",
  "drafts.premier-housewares-5506455",
  "drafts.premier-housewares-5506457",
  "drafts.premier-housewares-1102243",
  "drafts.premier-housewares-1102244",
  "drafts.premier-housewares-1102245",
  "drafts.premier-housewares-5100307",
  "drafts.premier-housewares-5535001",
  "drafts.premier-housewares-5535005",
  "drafts.premier-housewares-5535006",
  "drafts.premier-housewares-5535007",
  "drafts.premier-housewares-5535028",
  "drafts.premier-housewares-5535029",
  "drafts.premier-housewares-5535031",
  "drafts.premier-housewares-5535032",
  "drafts.premier-housewares-5502320",
  "drafts.premier-housewares-5501257",
];

async function main() {
  const docs = await client.fetch<
    { _id: string; title: string; costPrice: number | null }[]
  >(`*[_id in $ids]{_id, title, costPrice}`, { ids: IDS });

  console.log(
    `\n${docs.length} of ${IDS.length} drafts found. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );
  for (const doc of docs) {
    console.log(
      `  unflag  ${doc.title}  (cost price ${doc.costPrice} left untouched)`,
    );
    if (apply) {
      await client.patch(doc._id).unset(["costPriceVatCorrected"]).commit();
    }
  }

  if (!apply) console.log("\nNothing written. Re-run with --apply.");
  else console.log(`\n${docs.length} unflagged.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
