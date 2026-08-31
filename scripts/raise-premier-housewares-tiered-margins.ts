/**
 * Second pass over the same Premier Housewares margin fix, with a tiered
 * floor Damien set after seeing the first one land: *"for premier
 * housewares products the margin should be higher than 17%. for smaller
 * cheaper products we can just add a few pounds to the retail price but
 * larger products should be above 20%"* — then, on the exact bump amount:
 * *"4 pound but if it needs more then add more, we need to ensure we can
 * be profitable"*.
 *
 * Two tiers, split on the current retail price:
 *
 *   - **Under £50** — raise to whichever is higher: the minimum that
 *     clears 17% margin, or the current price plus a flat £4. A flat bump
 *     is what Damien asked for on cheap items rather than doing the sum by
 *     percentage; £4 is the floor of that bump, not the ceiling — if 17%
 *     needs more than £4, it gets the larger number, per "if it needs more
 *     then add more".
 *   - **£50 and over** — raise to the minimum that clears 20% margin. No
 *     flat minimum here: 20% of a £50+ item is already a real number of
 *     pounds, unlike 17% of a £15 item.
 *
 * Reads the live, already-VAT-corrected `costPrice` (from
 * `fix-premier-housewares-margins.ts`) — this script never touches cost,
 * only `price`. A product already at or above its tier's floor is left
 * exactly as it is; nothing is padded past what the floor needs. Every
 * raise gets a `priceAdjustment` document, same mandatory audit trail as
 * every other margin-driven price change on this site.
 *
 *   pnpm tsx --env-file=.env.local scripts/raise-premier-housewares-tiered-margins.ts
 *   pnpm tsx --env-file=.env.local scripts/raise-premier-housewares-tiered-margins.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

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
const SOURCE = "scripts/raise-premier-housewares-tiered-margins.ts";
const SMALL_THRESHOLD = 50; // retail price below this = "smaller cheaper"
const SMALL_FLOOR = 0.17;
const SMALL_MIN_BUMP = 4;
const LARGE_FLOOR = 0.2;

const margin = (price: number, cost: number) => (price - cost) / price;

interface Row {
  _id: string;
  title: string;
  sku: string | null;
  supplierSku: string | null;
  price: number | null;
  costPrice: number | null;
  compareAtPrice: number | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && supplier->name == $supplier && defined(price) && defined(costPrice)]{
      _id, title, sku, supplierSku, price, costPrice, compareAtPrice
    }`,
    { supplier: SUPPLIER },
  );

  console.log(
    `\n${rows.length} ${SUPPLIER} products with a price and cost. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  let raises = 0;
  let compareAtClears = 0;
  const results: {
    title: string;
    tier: string;
    priceBefore: number;
    priceAfter: number;
    marginBefore: number;
    marginAfter: number;
  }[] = [];

  for (const row of rows) {
    const price = row.price!;
    const cost = row.costPrice!;
    const currentMargin = margin(price, cost);
    const small = price < SMALL_THRESHOLD;
    const floor = small ? SMALL_FLOOR : LARGE_FLOOR;

    if (currentMargin >= floor) continue;

    let newPrice: number;
    if (small) {
      const minForFloor = Math.ceil(cost / (1 - SMALL_FLOOR));
      newPrice = Math.max(price + SMALL_MIN_BUMP, minForFloor);
    } else {
      newPrice = Math.ceil(cost / (1 - LARGE_FLOOR));
    }

    const newMargin = margin(newPrice, cost);
    const staleCompareAt =
      typeof row.compareAtPrice === "number" &&
      (row.compareAtPrice <= newPrice || row.compareAtPrice === 0);

    results.push({
      title: row.title,
      tier: small ? "under £50 (17% + £4 min)" : "£50+ (20%)",
      priceBefore: price,
      priceAfter: newPrice,
      marginBefore: +(currentMargin * 100).toFixed(1),
      marginAfter: +(newMargin * 100).toFixed(1),
    });
    raises += 1;
    if (staleCompareAt) compareAtClears += 1;

    console.log(
      `  ${(small ? "small" : "large").padEnd(6)} ${row.title.slice(0, 48).padEnd(50)} ` +
        `£${price.toFixed(2)} -> £${newPrice.toFixed(2)}  ${(currentMargin * 100).toFixed(1)}% -> ${(newMargin * 100).toFixed(1)}%` +
        (staleCompareAt ? "  (clearing stale compare-at)" : ""),
    );

    if (!apply) continue;

    const patch = client.patch(row._id).set({ price: newPrice });
    if (staleCompareAt) patch.unset(["compareAtPrice"]);
    await patch.commit();

    await client.create({
      _type: "priceAdjustment",
      product: { _type: "reference", _ref: row._id },
      productTitle: row.title,
      sku: row.sku,
      supplierSku: row.supplierSku,
      previousPrice: price,
      newPrice,
      costPrice: cost,
      shippingCost: 0,
      previousMarginPct: +(currentMargin * 100).toFixed(2),
      newMarginPct: +(newMargin * 100).toFixed(2),
      compareAtPriceCleared: staleCompareAt,
      reason: small
        ? `Under £${SMALL_THRESHOLD}: raised to the higher of a flat £${SMALL_MIN_BUMP} bump or the minimum clearing ${SMALL_FLOOR * 100}% margin, per Damien's tiered floor.`
        : `£${SMALL_THRESHOLD}+: raised to the minimum clearing ${LARGE_FLOOR * 100}% margin, per Damien's tiered floor.`,
      source: SOURCE,
      adjustedAt: new Date().toISOString(),
    });
  }

  console.log(
    `\n${raises} of ${rows.length} products raised, ${compareAtClears} stale compare-at prices cleared.`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-premier-housewares-tiered-margins.json`,
    JSON.stringify(
      {
        applied: apply,
        smallThreshold: SMALL_THRESHOLD,
        smallFloor: SMALL_FLOOR,
        smallMinBump: SMALL_MIN_BUMP,
        largeFloor: LARGE_FLOOR,
        results,
      },
      null,
      2,
    ),
  );

  if (!apply) console.log("\nNothing written. Re-run with --apply.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
