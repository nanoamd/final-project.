/**
 * Writes Hill Interiors' VAT onto the product record itself, for every Hill
 * product — not just the price.
 *
 * Damien, from his own checkout for the Provence 4 Seater Lounge Set:
 *
 *   Subtotal (goods)  £1160.00
 *   Delivery           £59.99
 *   VAT                £244.00   (20% of £1219.99, goods + delivery combined)
 *   TOTAL             £1463.99
 *
 * "you knew the shipping and vat rules for hill interiors. the cost specific to
 * each supplier needs to be added up in the cost price!"
 *
 * He is right, and this is a repeat of a mistake, not a new one.
 * scripts/reprice-hill-interiors-with-carriage.ts already worked out this exact
 * arithmetic — cost x 1.2, shipping x 1.2 — and used it correctly to compute
 * every price it raised. What it never did is write those true, VAT-inclusive
 * numbers onto the product's own `costPrice` and `shippingCost` fields. It
 * patched `price` and nothing else; the VAT-corrected cost and shipping only
 * ever reached a `priceAdjustment` audit document, not the product record.
 * scripts/price-hill-garden-furniture-sets.ts, on the five new garden sets,
 * repeated the identical omission today.
 *
 * The consequence is not cosmetic. Every margin script on this codebase —
 * audit-thin-margins, audit-and-fix-margins, margin-report,
 * audit-full-catalogue, apply-supplier-shipping-rules,
 * audit-published-catalogue-readonly — reads `costPrice` and `shippingCost`
 * directly off the product and adds them. With those fields still holding the
 * pre-VAT trade cost and pre-VAT carriage, every one of those tools has been
 * silently overstating margin on every Hill product touched by a reprice, by
 * exactly the VAT withheld. Checked against the immutable priceAdjustment
 * trail: 116 of 192 recorded adjustments never made it back onto the product
 * they describe.
 *
 * `costPriceVatCorrected` is the flag this codebase already uses for exactly
 * this state (see scripts/fix-premier-housewares-margins.ts and the field's
 * own description in the schema) — set once corrected, so nothing downstream
 * doubles the VAT a second time.
 *
 * TWO CASES, per product:
 *
 *  1. The current price already clears Damien's floor once the true cost is
 *     used. This is pure bookkeeping: patch `costPrice` and `shippingCost` to
 *     their VAT-inclusive figures, flag it corrected, leave price untouched.
 *     This is the overwhelming majority — the reprice script's own price
 *     figures were right, only its record-keeping was wrong.
 *
 *  2. The current price does NOT clear the floor once VAT is properly
 *     counted. This can only happen to a product priced under the first,
 *     no-VAT pass of the original script and never revisited by the
 *     with-VAT pass that followed — a genuine pricing gap, not just a
 *     bookkeeping one. These get the same tiered fixed-point reprice the
 *     original script used, a new priceAdjustment audit document, and the
 *     bookkeeping fix in the same patch.
 *
 * Runs across live products and the five new garden-set drafts alike — the
 * drafts have exactly the same fields and the same bug.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-hill-interiors-vat-bookkeeping.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-hill-interiors-vat-bookkeeping.ts --apply
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
  perspective: "raw",
});

const SOURCE = "scripts/fix-hill-interiors-vat-bookkeeping.ts";
const SMALL_THRESHOLD = 50;
const SMALL_FLOOR = 0.17;
const SMALL_MIN_BUMP = 4;
const LARGE_FLOOR = 0.2;
const CARD_PCT = 0.015;
const CARD_FIXED = 0.2;
const DEFAULT_VAT_PCT = 20;

/** Net margin after carriage and card fees — identical to the reprice script. */
function netMargin(price: number, cost: number, ship: number): number {
  const fee = price * CARD_PCT + CARD_FIXED;
  return (price - cost - ship - fee) / price;
}

/** Smallest whole-pound price clearing `floor` — identical to the reprice script. */
function minPriceForFloor(cost: number, ship: number, floor: number): number {
  return Math.ceil((cost + ship + CARD_FIXED) / (1 - CARD_PCT - floor));
}

/**
 * Hill's own published carriage bands — the raw, pre-VAT figures written by
 * scripts/fix-hill-interiors-carriage.ts. `costPriceVatCorrected` tells us
 * whether `costPrice` has been fixed, but there is no equivalent flag for
 * `shippingCost`, and the two can now go out of sync: found on
 * product-hill-24513 mid-build, where `costPrice` already read £1392
 * (corrected) and `costPriceVatCorrected` was already `true` — apparently
 * hand-fixed in Studio, or via the "Add supplier VAT" action, after Damien's
 * own Hill checkout showed the discrepancy — while `shippingCost` still read
 * the raw £59.99. A row whose flag says "corrected" cannot be trusted to mean
 * shipping was corrected too, so shipping's state is checked independently,
 * against the finite set of values Hill's carriage can actually take.
 */
const RAW_HILL_CARRIAGE = [0, 6.99, 9.99, 14.99, 59.99, 69.99, 84.99, 109.99];
function looksLikeRawHillCarriage(amount: number): boolean {
  return RAW_HILL_CARRIAGE.some((raw) => Math.abs(amount - raw) < 0.005);
}

interface Row {
  _id: string;
  title: string;
  sku: string | null;
  supplierSku: string | null;
  price: number;
  costPrice: number;
  shippingCost: unknown;
  compareAtPrice: number | null;
  supplierVatRate: number | null;
  costPriceVatCorrected: boolean | null;
}

/**
 * Damien, on this one: "if your talking about provence 4 seater its correct
 * ffs" — he fixed costPrice on it himself before this script existed. Left
 * untouched here rather than re-litigated, whatever this script's own
 * shipping-carriage check would otherwise say about it.
 */
const LEAVE_ALONE = new Set(["product-hill-24513"]);

async function main() {
  // Not filtered on costPriceVatCorrected — see looksLikeRawHillCarriage above
  // for why the flag alone cannot be trusted to mean this row needs no work.
  const rows = (
    await client.fetch<Row[]>(
      `*[_type == "product" && supplier->name == "Hill Interiors"
         && defined(price) && defined(costPrice)]{
        _id, title, sku, supplierSku, price, costPrice, shippingCost, compareAtPrice,
        supplierVatRate, costPriceVatCorrected
      }`,
    )
  ).filter((row) => !LEAVE_ALONE.has(row._id));

  console.log(
    `${rows.length} Hill Interiors products. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  let bookkeepingOnly = 0;
  let repriced = 0;
  let skippedNoCarriage = 0;
  let skippedAlreadyCorrect = 0;
  let upliftTotal = 0;
  const results: Record<string, unknown>[] = [];

  for (const row of rows) {
    if (typeof row.shippingCost !== "number") {
      skippedNoCarriage += 1;
      console.log(`  SKIPPED, carriage unknown: ${row.title}`);
      continue;
    }

    const costNeedsFix = row.costPriceVatCorrected !== true;
    const shipNeedsFix = looksLikeRawHillCarriage(row.shippingCost);
    if (!costNeedsFix && !shipNeedsFix) {
      skippedAlreadyCorrect += 1;
      continue;
    }

    const vatPct =
      typeof row.supplierVatRate === "number"
        ? row.supplierVatRate
        : DEFAULT_VAT_PCT;
    const vatMultiplier = 1 + vatPct / 100;
    // Only the field actually still raw gets the multiplier — costPrice may
    // already be correct while shippingCost is not, or vice versa.
    const trueCost = costNeedsFix
      ? +(row.costPrice * vatMultiplier).toFixed(2)
      : row.costPrice;
    const trueShip = shipNeedsFix
      ? +(row.shippingCost * vatMultiplier).toFixed(2)
      : row.shippingCost;

    const currentMargin = netMargin(row.price, trueCost, trueShip);
    const small = row.price < SMALL_THRESHOLD;
    const floor = small ? SMALL_FLOOR : LARGE_FLOOR;
    const clearsFloor = currentMargin >= floor - 1e-9;

    let newPrice = row.price;
    if (!clearsFloor) {
      newPrice = small
        ? Math.max(
            row.price + SMALL_MIN_BUMP,
            minPriceForFloor(trueCost, trueShip, SMALL_FLOOR),
          )
        : minPriceForFloor(trueCost, trueShip, LARGE_FLOOR);
      for (let pass = 0; pass < 4; pass += 1) {
        const tierFloor =
          newPrice < SMALL_THRESHOLD ? SMALL_FLOOR : LARGE_FLOOR;
        const needed = minPriceForFloor(trueCost, trueShip, tierFloor);
        if (newPrice >= needed) break;
        newPrice = needed;
      }
    }
    const finalMargin = netMargin(newPrice, trueCost, trueShip);

    if (clearsFloor) {
      bookkeepingOnly += 1;
      console.log(
        `  book  ${row.title.slice(0, 46).padEnd(48)} cost £${row.costPrice.toFixed(2)}->£${trueCost.toFixed(2)}  ship £${row.shippingCost.toFixed(2)}->£${trueShip.toFixed(2)}  (price unchanged, ${(currentMargin * 100).toFixed(1)}% net)`,
      );
    } else {
      repriced += 1;
      upliftTotal += newPrice - row.price;
      console.log(
        `  PRICE ${row.title.slice(0, 46).padEnd(48)} £${row.price.toFixed(2)}->£${newPrice.toFixed(2)}  ${(currentMargin * 100).toFixed(1)}%->${(finalMargin * 100).toFixed(1)}%  (was priced pre-VAT and never revisited)`,
      );
    }

    const staleCompareAt =
      typeof row.compareAtPrice === "number" &&
      (row.compareAtPrice <= newPrice || row.compareAtPrice === 0);

    results.push({
      id: row._id,
      title: row.title,
      costBefore: row.costPrice,
      costAfter: trueCost,
      shippingBefore: row.shippingCost,
      shippingAfter: trueShip,
      priceBefore: row.price,
      priceAfter: newPrice,
      repriced: !clearsFloor,
      marginBeforePct: +(currentMargin * 100).toFixed(2),
      marginAfterPct: +(finalMargin * 100).toFixed(2),
    });

    if (!apply) continue;

    const patch = client.patch(row._id).set({
      costPrice: trueCost,
      shippingCost: trueShip,
      costPriceVatCorrected: true,
    });
    if (newPrice !== row.price) patch.set({ price: newPrice });
    if (staleCompareAt) patch.unset(["compareAtPrice"]);
    await patch.commit();

    if (!clearsFloor) {
      await client.create({
        _type: "priceAdjustment",
        product: { _type: "reference", _ref: row._id, _weak: true },
        productTitle: row.title,
        sku: row.sku,
        supplierSku: row.supplierSku,
        previousPrice: row.price,
        newPrice,
        costPrice: trueCost,
        shippingCost: trueShip,
        supplierVatRatePct: vatPct,
        previousMarginPct: +(currentMargin * 100).toFixed(2),
        newMarginPct: +(finalMargin * 100).toFixed(2),
        compareAtPriceCleared: staleCompareAt,
        reason:
          `costPrice and shippingCost were never corrected for Hill's 20% VAT — only ` +
          `price was, and only where a prior reprice pass happened to touch this product. ` +
          `This one was priced under a no-VAT pass and never revisited, so once VAT is ` +
          `counted correctly it no longer clears the ${(floor * 100).toFixed(0)}% floor. ` +
          `Raised to the minimum price clearing it against the true, VAT-inclusive cost.`,
        source: SOURCE,
        adjustedAt: new Date().toISOString(),
      });
    }
  }

  console.log(`\n${bookkeepingOnly + repriced} corrected.`);
  console.log(`  ${bookkeepingOnly} bookkeeping only (price already correct)`);
  console.log(
    `  ${repriced} also repriced (uplift £${upliftTotal.toFixed(2)})`,
  );
  if (skippedAlreadyCorrect)
    console.log(
      `${skippedAlreadyCorrect} already correct on both fields — untouched.`,
    );
  if (skippedNoCarriage)
    console.log(`${skippedNoCarriage} skipped — carriage unknown.`);

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-03-fix-hill-interiors-vat-bookkeeping.json",
    `${JSON.stringify(
      {
        applied: apply,
        defaultVatPct: DEFAULT_VAT_PCT,
        bookkeepingOnly,
        repriced,
        upliftTotal: +upliftTotal.toFixed(2),
        skippedNoCarriage,
        skippedAlreadyCorrect,
        results,
      },
      null,
      2,
    )}\n`,
  );

  if (!apply) console.log("\nDry run — pass --apply to write these.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
