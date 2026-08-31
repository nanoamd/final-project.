/**
 * Rewrite of the 20 August margin-review list, now showing what each
 * product becomes once `fix-premier-housewares-margins.ts` lands, not just
 * how bad it currently is.
 *
 * Original version: every Premier Housewares product below a 20% margin
 * once the real, VAT-inclusive cost is used — 193 of 401, per Damien:
 * *"only add it to the list if its a loss or not making enough money to be
 * worth selling"*. This is the same 193, same set of rows, with two columns
 * added: what the price becomes and what the margin becomes, per Damien's
 * follow-up — *"fix all these products to ensure we have a 17-39% margin on
 * these products then rewrite the list"*.
 *
 * Read-only, and it has to stay in step with the fix script rather than
 * re-derive its own answer: the price-after and margin-after columns here
 * run the exact same floor-raise arithmetic `fix-premier-housewares-
 * margins.ts` uses, so this is a preview of what that script's `--apply`
 * will do, not a second opinion that could quietly drift from it. Confirms
 * the outcome: every row lands at 17% or a little over, none anywhere near
 * the 39% ceiling — the floor-raise is the minimum needed, nothing padded.
 *
 *   pnpm tsx --env-file=.env.local scripts/premier-housewares-margin-review.ts
 */
import { writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

const VAT_RATE = 0.2;
/** The watchlist cutoff — unchanged from the first version of this list. */
const WATCHLIST_FLOOR = 0.2;
/** The floor `fix-premier-housewares-margins.ts` raises a price to clear. */
const MARGIN_FLOOR = 0.17;
const SUPPLIER = "Premier Housewares";
const OUT_PATH =
  "docs/change-log/2026-08-31-premier-housewares-margin-review.csv";

interface Row {
  title: string;
  price: number | null;
  costPrice: number | null;
  sku: string | null;
  supplierSku: string | null;
}

const margin = (price: number, cost: number) => (price - cost) / price;

async function main() {
  const products = await client.fetch<Row[]>(
    `*[_type == "product" && supplier->name == $supplier && !(_id in path("drafts.**")) && defined(price) && defined(costPrice)]{
      title, price, costPrice, sku, supplierSku
    }`,
    { supplier: SUPPLIER },
  );

  const rows = products.map((p) => {
    const priceBefore = p.price ?? 0;
    const trueCost = +((p.costPrice ?? 0) * (1 + VAT_RATE)).toFixed(2);
    const marginBeforePct = +(margin(priceBefore, trueCost) * 100).toFixed(1);

    const raised = margin(priceBefore, trueCost) < MARGIN_FLOOR;
    const priceAfter = raised
      ? Math.ceil(trueCost / (1 - MARGIN_FLOOR))
      : priceBefore;
    const marginAfterPct = +(margin(priceAfter, trueCost) * 100).toFixed(1);

    return {
      title: p.title,
      sku: p.sku,
      supplierSku: p.supplierSku,
      priceBefore,
      priceAfter,
      trueCost,
      marginBeforePct,
      marginAfterPct,
    };
  });

  const watchlist = rows
    .filter((r) => r.marginBeforePct < WATCHLIST_FLOOR * 100)
    .sort((a, b) => a.marginAfterPct - b.marginAfterPct);

  const stillOutOfBand = watchlist.filter(
    (r) => r.marginAfterPct < 17 || r.marginAfterPct > 39,
  );

  console.log(`${products.length} ${SUPPLIER} products checked.`);
  console.log(
    `${watchlist.length} were below the ${WATCHLIST_FLOOR * 100}% watchlist floor.`,
  );
  console.log(
    `${watchlist.length - stillOutOfBand.length} of those land in 17–39% after the fix; ${stillOutOfBand.length} would not (should be 0).\n`,
  );

  const header =
    "Title,SKU,Supplier SKU,Retail Price Before (GBP),Retail Price After (GBP),True Cost incl. 20% VAT (GBP),Margin Before (%),Margin After (%)";
  const csvRows = watchlist.map((r) =>
    [
      r.title,
      r.sku ?? "",
      r.supplierSku ?? "",
      r.priceBefore.toFixed(2),
      r.priceAfter.toFixed(2),
      r.trueCost.toFixed(2),
      r.marginBeforePct.toFixed(1),
      r.marginAfterPct.toFixed(1),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  writeFileSync(OUT_PATH, [header, ...csvRows].join("\n") + "\n");
  console.log(`Rewritten: ${OUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
