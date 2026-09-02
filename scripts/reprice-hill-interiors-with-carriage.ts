/**
 * Hill Interiors repriced against LANDED cost, not trade cost.
 *
 * Damien's tiered margin floor, set for Premier Housewares and applied here
 * unchanged — it is his rule, not a new one:
 *
 *   under £50  — the higher of a flat £4 bump or the minimum clearing 17%
 *   £50 and up — the minimum clearing 20%
 *
 * The difference from the Premier run is what "cost" means. That script computed
 * margin as (price − costPrice) / price and recorded `shippingCost: 0` in the
 * audit trail, which was true for Premier and false for Hill: Hill charge
 * carriage per consignment, the customer pays £0 shipping by Damien's rule, so
 * carriage is a cost of goods on every single order. Card processing is too.
 *
 * So the floor here is measured against:
 *
 *   landed = costPrice + shippingCost + (price × 1.5% + 20p)
 *
 * The card fee moves with price, so the minimum price that clears a floor has to
 * be solved rather than divided:
 *
 *   p − c − s − (0.015p + 0.20) = f·p
 *   p(1 − 0.015 − f) = c + s + 0.20
 *   p = (c + s + 0.20) / (0.985 − f)
 *
 * VAT is deliberately NOT applied. Hill's site says trade prices are "subject to
 * additional VAT", and Premier Housewares do invoice 20% on top which Kaiku
 * cannot reclaim — but Damien has not confirmed Hill do the same, and inflating
 * 139 costs by 20% on an inference would raise prices on his whole Hill range
 * off my guess. If he confirms it, VAT_ON_COST becomes true and this reruns.
 *
 * Every raise writes a `priceAdjustment` document, the same audit trail every
 * other margin-driven price change on this site uses.
 *
 *   pnpm tsx --env-file=.env.local scripts/reprice-hill-interiors-with-carriage.ts
 *   pnpm tsx --env-file=.env.local scripts/reprice-hill-interiors-with-carriage.ts --apply
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

const SUPPLIER = "Hill Interiors";
const SOURCE = "scripts/reprice-hill-interiors-with-carriage.ts";
const SMALL_THRESHOLD = 50;
const SMALL_FLOOR = 0.17;
const SMALL_MIN_BUMP = 4;
const LARGE_FLOOR = 0.2;
/** Card processing, the rate Kaiku actually pays. */
const CARD_PCT = 0.015;
const CARD_FIXED = 0.2;
/** Flip to true only once Hill's invoices confirm 20% on top. */
const VAT_ON_COST = false;

/** Net margin after carriage and card fees. */
function netMargin(price: number, cost: number, ship: number): number {
  const fee = price * CARD_PCT + CARD_FIXED;
  return (price - cost - ship - fee) / price;
}

/** Smallest whole-pound price clearing `floor` once carriage and fees are paid. */
function minPriceForFloor(cost: number, ship: number, floor: number): number {
  return Math.ceil((cost + ship + CARD_FIXED) / (1 - CARD_PCT - floor));
}

interface Row {
  _id: string;
  title: string;
  sku: string | null;
  supplierSku: string | null;
  price: number;
  costPrice: number;
  shippingCost: number | null;
  compareAtPrice: number | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && supplier->name == $supplier
       && defined(price) && defined(costPrice)]{
      _id, title, sku, supplierSku, price, costPrice, shippingCost, compareAtPrice
    }`,
    { supplier: SUPPLIER },
  );

  console.log(
    `\n${rows.length} ${SUPPLIER} products with a price and cost. ${apply ? "APPLYING" : "DRY RUN"}`,
  );
  console.log(
    `Floor: under £${SMALL_THRESHOLD} -> ${SMALL_FLOOR * 100}% or +£${SMALL_MIN_BUMP}; ` +
      `£${SMALL_THRESHOLD}+ -> ${LARGE_FLOOR * 100}%. Net of carriage and ${CARD_PCT * 100}%+${CARD_FIXED * 100}p card fees. ` +
      `VAT on cost: ${VAT_ON_COST ? "yes" : "no"}\n`,
  );

  let raises = 0;
  let skippedNoCarriage = 0;
  let upliftTotal = 0;
  const results: Record<string, unknown>[] = [];

  for (const row of rows) {
    // No recorded carriage means unknown, not free. Repricing off a £0 carriage
    // is the exact mistake this whole pass exists to undo, so it is skipped and
    // reported rather than treated as zero.
    if (typeof row.shippingCost !== "number") {
      skippedNoCarriage += 1;
      console.log(`  SKIPPED, carriage unknown: ${row.title}`);
      continue;
    }

    const cost = VAT_ON_COST ? row.costPrice * 1.2 : row.costPrice;
    const ship = VAT_ON_COST ? row.shippingCost * 1.2 : row.shippingCost;
    const before = netMargin(row.price, cost, ship);
    const small = row.price < SMALL_THRESHOLD;
    const floor = small ? SMALL_FLOOR : LARGE_FLOOR;
    if (before >= floor - 1e-9) continue;

    /*
     * The tier is decided by price, and raising the price can change the tier.
     *
     * First run: four vases at £49 were raised to £53 to clear the 17% small
     * floor, which put them over £50 — so they became large-tier products
     * needing 20%, and landed at 19.3%. Below their floor immediately after
     * being "fixed".
     *
     * Settling it is a two-line fixed point: recompute against whichever tier
     * the new price falls into, until the tier stops changing. It converges in
     * at most a couple of passes because the price only ever moves up and there
     * are only two tiers.
     */
    let newPrice = small
      ? Math.max(
          row.price + SMALL_MIN_BUMP,
          minPriceForFloor(cost, ship, SMALL_FLOOR),
        )
      : minPriceForFloor(cost, ship, LARGE_FLOOR);
    for (let pass = 0; pass < 4; pass += 1) {
      const tierFloor = newPrice < SMALL_THRESHOLD ? SMALL_FLOOR : LARGE_FLOOR;
      const needed = minPriceForFloor(cost, ship, tierFloor);
      if (newPrice >= needed) break;
      newPrice = needed;
    }
    const after = netMargin(newPrice, cost, ship);

    const staleCompareAt =
      typeof row.compareAtPrice === "number" &&
      (row.compareAtPrice <= newPrice || row.compareAtPrice === 0);

    raises += 1;
    upliftTotal += newPrice - row.price;
    results.push({
      title: row.title,
      tier: small
        ? `under £${SMALL_THRESHOLD} (${SMALL_FLOOR * 100}% or +£${SMALL_MIN_BUMP})`
        : `£${SMALL_THRESHOLD}+ (${LARGE_FLOOR * 100}%)`,
      costPrice: cost,
      shippingCost: ship,
      priceBefore: row.price,
      priceAfter: newPrice,
      netMarginBefore: +(before * 100).toFixed(1),
      netMarginAfter: +(after * 100).toFixed(1),
    });

    console.log(
      `  ${(small ? "small" : "large").padEnd(5)} ${row.title.slice(0, 42).padEnd(44)} ` +
        `£${row.price.toFixed(2).padStart(8)} -> £${newPrice.toFixed(2).padStart(8)}  ` +
        `${(before * 100).toFixed(1).padStart(6)}% -> ${(after * 100).toFixed(1)}%` +
        (staleCompareAt ? "  (clearing stale compare-at)" : ""),
    );

    if (!apply) continue;

    const patch = client.patch(row._id).set({ price: newPrice });
    if (staleCompareAt) patch.unset(["compareAtPrice"]);
    await patch.commit();

    await client.create({
      _type: "priceAdjustment",
      product: { _type: "reference", _ref: row._id, _weak: true },
      productTitle: row.title,
      sku: row.sku,
      supplierSku: row.supplierSku,
      previousPrice: row.price,
      newPrice,
      costPrice: cost,
      // The real figure, not the 0 the Premier run recorded.
      shippingCost: ship,
      previousMarginPct: +(before * 100).toFixed(2),
      newMarginPct: +(after * 100).toFixed(2),
      compareAtPriceCleared: staleCompareAt,
      reason:
        `Hill Interiors carriage was recorded as £0 (supplier marked "carriage included" on ` +
        `circular evidence). Real rate for this item is £${row.shippingCost.toFixed(2)} from Hill's ` +
        `published bands, and the customer pays £0 shipping, so it is a cost of goods. ` +
        (small
          ? `Under £${SMALL_THRESHOLD}: raised to the higher of a flat £${SMALL_MIN_BUMP} bump or the minimum clearing ${SMALL_FLOOR * 100}% net.`
          : `£${SMALL_THRESHOLD}+: raised to the minimum clearing ${LARGE_FLOOR * 100}% net.`),
      source: SOURCE,
      adjustedAt: new Date().toISOString(),
    });
  }

  console.log(`\n${raises} of ${rows.length} products raised.`);
  console.log(
    `Total price uplift across the range: £${upliftTotal.toFixed(2)}`,
  );
  if (skippedNoCarriage)
    console.log(`${skippedNoCarriage} skipped because carriage is unknown.`);

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/2026-09-02-reprice-hill-interiors-with-carriage.json`,
    JSON.stringify(
      {
        applied: apply,
        smallThreshold: SMALL_THRESHOLD,
        smallFloor: SMALL_FLOOR,
        smallMinBump: SMALL_MIN_BUMP,
        largeFloor: LARGE_FLOOR,
        cardPct: CARD_PCT,
        cardFixed: CARD_FIXED,
        vatOnCost: VAT_ON_COST,
        raises,
        upliftTotal: +upliftTotal.toFixed(2),
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
