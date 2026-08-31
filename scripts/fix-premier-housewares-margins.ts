/**
 * Corrects `costPrice` for the 20% VAT Premier Housewares actually charges,
 * and — where that correction drops a product below Damien's floor — raises
 * `price` to the minimum that lands inside the band he set.
 *
 * Damien: *"i think ive messed up my prices for premier housewares products,
 * i forgot about tax, i have hundreds of products listed from them"* — on a
 * screenshot of a Premier Housewares order summary showing 20% tax added on
 * top of the trade subtotal. Kaiku is not VAT-registered
 * (`siteConfig.vatRegistered === false`), so that 20% is not reclaimable — a
 * real, permanent cost that was never in `costPrice`.
 *
 * `premier-housewares-margin-review.ts` listed 193 of 401 products below a
 * 20% margin once that cost is used, seven of them at an outright loss.
 * Damien, on that list: *"fix all these products to ensure we have a 17-39%
 * margin on these products then rewrite the list"*.
 *
 * **Two different fields, two different rules, run together because they
 * have to land in the same commit or one becomes wrong reading the other.**
 * If cost were corrected by one script and price raised by a separate one
 * run afterwards, the order matters: run twice, or in the wrong order, the
 * same ×1.2 would double-count the VAT. One script, one pass, no ambiguity
 * about what has already happened to a given product:
 *
 *   - `costPrice` — corrected once per product, straightforwardly true for
 *     what it claims to be (the actual trade cost, VAT included). This is
 *     the same narrow departure from Damien's standing "never touch cost
 *     price" rule already agreed for this specific, confirmed case: that
 *     rule exists to stop cost being used as a margin lever, and this is
 *     the opposite — the stored number is factually wrong, and "cost price
 *     must remain truthful" is exactly what this corrects. **Guarded by
 *     `costPriceVatCorrected`** — a product already flagged is skipped
 *     entirely, so re-running this on the whole supplier (safe and correct
 *     the first time) can never multiply an already-corrected cost by 1.2 a
 *     second time. Caught exactly this near-miss dry-running a second pass
 *     after "add drafts too" was asked for: without the flag, every already-
 *     fixed published product would have been re-taxed.
 *   - `price` — only raised where the corrected cost pushes true margin
 *     below 17%, and only up to the minimum that clears 17% — never padded
 *     towards the 39% ceiling of the band Damien gave. A product already
 *     inside 17–39% is left exactly as it is. Every price change gets a
 *     `priceAdjustment` document (previous/new price, previous/new margin,
 *     the corrected cost, why) — mandatory per Damien's own standing rule
 *     for `audit-and-fix-margins.ts`, which this reuses rather than
 *     reinvents. A stale `compareAtPrice` (already at/below the new price,
 *     or stored as 0) is cleared for the same reason that script clears
 *     one — a "was/now" figure that no longer makes sense is worse than none.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-premier-housewares-margins.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-premier-housewares-margins.ts --apply
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

const VAT_RATE = 0.2;
/** The band Damien gave: never raise a price further than the floor needs. */
const MARGIN_FLOOR = 0.17;
const MARGIN_CEILING = 0.39;
const SUPPLIER = "Premier Housewares";
const SOURCE = "scripts/fix-premier-housewares-margins.ts";

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
  // Drafts included on purpose — Damien: "they should also be done for
  // unpublished products". A product waiting to be published still has a
  // real supplier cost, and if it sits as a draft for a week the wrong
  // number would otherwise go live the moment it's published.
  //
  // costPriceVatCorrected != true excludes anything this script (or the
  // "Add supplier VAT" Studio button) has already fixed — see the note on
  // the flag above. Without it, a second run re-taxes an already-true cost.
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && supplier->name == $supplier && costPriceVatCorrected != true]{
      _id, title, sku, supplierSku, price, costPrice, compareAtPrice
    }`,
    { supplier: SUPPLIER },
  );

  console.log(
    `\n${rows.length} ${SUPPLIER} products not yet VAT-corrected. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const results: {
    title: string;
    costBefore: number | null;
    costAfter: number | null;
    priceBefore: number | null;
    priceAfter: number | null;
    marginBefore: number | null;
    marginAfter: number | null;
    status: string;
  }[] = [];

  let costFixes = 0;
  let priceRaises = 0;
  let compareAtClears = 0;

  for (const row of rows) {
    if (typeof row.costPrice !== "number" || typeof row.price !== "number") {
      results.push({
        title: row.title,
        costBefore: row.costPrice,
        costAfter: null,
        priceBefore: row.price,
        priceAfter: null,
        marginBefore: null,
        marginAfter: null,
        status: "missing price or cost — skipped",
      });
      continue;
    }

    const trueCost = +(row.costPrice * (1 + VAT_RATE)).toFixed(2);
    const marginBefore = margin(row.price, trueCost);
    let newPrice = row.price;
    const raised = marginBefore < MARGIN_FLOOR;
    if (raised) newPrice = Math.ceil(trueCost / (1 - MARGIN_FLOOR));
    const marginAfter = margin(newPrice, trueCost);

    const staleCompareAt =
      typeof row.compareAtPrice === "number" &&
      (row.compareAtPrice <= newPrice || row.compareAtPrice === 0);

    results.push({
      title: row.title,
      costBefore: row.costPrice,
      costAfter: trueCost,
      priceBefore: row.price,
      priceAfter: newPrice,
      marginBefore: +(marginBefore * 100).toFixed(1),
      marginAfter: +(marginAfter * 100).toFixed(1),
      status: raised ? "cost + price fixed" : "cost fixed only",
    });
    costFixes += 1;
    if (raised) priceRaises += 1;
    if (staleCompareAt) compareAtClears += 1;

    console.log(
      `  ${(raised ? "cost + price fixed" : "cost fixed only").padEnd(20)} ` +
        `${row.title.slice(0, 46).padEnd(48)} cost £${row.costPrice.toFixed(2)} -> £${trueCost.toFixed(2)}` +
        (raised
          ? `  price £${row.price.toFixed(2)} -> £${newPrice.toFixed(2)}  ${(marginBefore * 100).toFixed(1)}% -> ${(marginAfter * 100).toFixed(1)}%`
          : `  margin ${(marginAfter * 100).toFixed(1)}% (already inside 17–${MARGIN_CEILING * 100}%)`) +
        (staleCompareAt ? "  (clearing stale compare-at)" : ""),
    );

    if (!apply) continue;

    const patch = client
      .patch(row._id)
      .set({ costPrice: trueCost, costPriceVatCorrected: true });
    if (raised) patch.set({ price: newPrice });
    if (staleCompareAt) patch.unset(["compareAtPrice"]);
    await patch.commit();

    if (raised) {
      await client.create({
        _type: "priceAdjustment",
        // Weak: a strong reference from this audit trail can block Sanity
        // from deleting a draft it points at, which is exactly what
        // publishing a draft does. See sku-assignment.ts's schema comment.
        product: { _type: "reference", _ref: row._id, _weak: true },
        productTitle: row.title,
        sku: row.sku,
        supplierSku: row.supplierSku,
        previousPrice: row.price,
        newPrice,
        costPrice: trueCost,
        shippingCost: 0,
        previousMarginPct: +(marginBefore * 100).toFixed(2),
        newMarginPct: +(marginAfter * 100).toFixed(2),
        compareAtPriceCleared: staleCompareAt,
        reason: `Premier Housewares cost price was missing the 20% VAT they actually charge (Kaiku is not VAT-registered, so it isn't reclaimable). Corrected cost dropped true margin to ${(marginBefore * 100).toFixed(1)}%, below the 17% floor Damien set — raised to the minimum price clearing it.`,
        source: SOURCE,
        adjustedAt: new Date().toISOString(),
      });
    }
  }

  console.log(
    `\n${costFixes} cost prices corrected, ${priceRaises} of those also needed a price raise to clear the 17% floor, ${compareAtClears} stale compare-at prices cleared.`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-premier-housewares-margin-fix.json`,
    JSON.stringify(
      { applied: apply, vatRate: VAT_RATE, marginFloor: MARGIN_FLOOR, results },
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
