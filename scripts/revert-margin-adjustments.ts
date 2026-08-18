/**
 * Reverts most of scripts/audit-and-fix-margins.ts's price corrections, per
 * Damien's direct follow-up after reviewing them:
 *
 *   "i know which products you mean for number 1, if its di designs products
 *   then revert changes, if it will genuinely lose money or make hardly
 *   anything then up it but if its like 18% dont worry"
 *
 * Two rules, applied to every `priceAdjustment` log entry that actually
 * changed a price (the pure compare-at-price clean-ups are untouched — those
 * corrected objectively broken data, not a margin judgement, and nothing
 * about this instruction concerns them):
 *
 * 1. **D.I. Designs — revert unconditionally**, regardless of how thin the
 *    margin was. Damien's call on that supplier specifically, not a
 *    calculation.
 * 2. **Everyone else — only keep the correction if the original margin was
 *    genuinely thin ("hardly anything") or negative.** Damien named ~18% as
 *    the "don't worry" example. As it happens, every single non-D.I.-Designs
 *    correction in this batch sat between 15.6% and 19.9% — there is no
 *    non-D.I.-Designs product below 15% in the whole set — so the practical
 *    effect of rule 2 here is that all of them revert too. The threshold
 *    (previousMarginPct >= 15) is applied generally rather than hard-coded
 *    to this batch, so a future run with a genuinely thin non-D.I.-Designs
 *    product would still correct it.
 *
 * Where reverting a price also means an until-then-valid compareAtPrice
 * would become true again (it exceeded the *original* price, before this
 * script's own margin fix pushed the price up to meet or pass it), that
 * figure is restored — looked up from this conversation's own earlier
 * queries, run before anything was cleared, not re-guessed. One case
 * (Charlton Ribbed Walnut 2 Drawer Bedside Table) had a compareAtPrice of
 * literal 0 before the clear — that was broken regardless of this price
 * question, so it stays cleared.
 *
 * Every reversal gets its own `priceAdjustment` log entry, same as the
 * original changes — a revert is still a change Damien might want to trace
 * in six months.
 *
 *   pnpm tsx --env-file=.env.local scripts/revert-margin-adjustments.ts
 *   pnpm tsx --env-file=.env.local scripts/revert-margin-adjustments.ts --apply
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
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

const SOURCE = "scripts/revert-margin-adjustments.ts";
/** Don't-worry-about-it floor, per Damien's own "if it's like 18% don't worry". */
const KEEP_BELOW_MARGIN_PCT = 15;

/**
 * Original compareAtPrice values, read directly from Sanity earlier in the
 * same review that led to this script — not reconstructed from memory —
 * before scripts/audit-and-fix-margins.ts cleared any of them. Only listed
 * where genuinely valid to restore; Charlton's is deliberately absent (it
 * was 0, i.e. already broken before this question of price ever came up).
 */
const ORIGINAL_COMPARE_AT: Record<string, number> = {
  "Witley Coffee Table | Kaiku": 650,
  "SaunaPlunge™ Yorkshire Cabin 4-Person Outdoor Infrared Sauna | Kaiku": 4070,
  "Bentley Grey Aged Oak Console Table | Luxury Oak Console Table | Kaiku": 710,
  "Hampton Ivory Shagreen Square Wall Mirror | Luxury Designer Mirror | Kaiku": 490,
  "Leckford Ribbed Black Oak Occasional Table | Luxury Round Side Table | Kaiku": 510,
};

interface Adjustment {
  _id: string;
  productTitle: string;
  previousPrice: number;
  newPrice: number;
  previousMarginPct?: number;
  compareAtPriceCleared?: boolean;
  costPrice?: number;
  shippingCost?: number;
  productId: string;
  supplier: string | null;
}

async function main() {
  const adjustments = await client.fetch<Adjustment[]>(
    `*[_type == "priceAdjustment" && previousPrice != newPrice]{
      _id, productTitle, previousPrice, newPrice, previousMarginPct,
      compareAtPriceCleared, costPrice, shippingCost,
      "productId": product._ref, "supplier": product->supplier->name
    }`,
  );

  console.log(
    `\n${adjustments.length} price-changing adjustments on record.\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  let reverted = 0;
  let kept = 0;

  for (const adj of adjustments) {
    const isDiDesigns = adj.supplier === "D.I. Designs";
    const isThin = (adj.previousMarginPct ?? 100) < KEEP_BELOW_MARGIN_PCT;
    const shouldRevert = isDiDesigns || !isThin;

    if (!shouldRevert) {
      kept += 1;
      console.log(
        `  = KEPT   ${adj.productTitle.slice(0, 55).padEnd(55)} £${adj.newPrice} stays — ${adj.previousMarginPct}% was genuinely thin`,
      );
      continue;
    }

    reverted += 1;
    const restoreCompareAt =
      adj.compareAtPriceCleared && ORIGINAL_COMPARE_AT[adj.productTitle];
    console.log(
      `  ✓ REVERT ${adj.productTitle.slice(0, 55).padEnd(55)} £${adj.newPrice} -> £${adj.previousPrice}` +
        (isDiDesigns
          ? "  (D.I. Designs)"
          : `  (${adj.previousMarginPct}% margin, not thin)`) +
        (restoreCompareAt
          ? `  + restoring compareAtPrice £${restoreCompareAt}`
          : ""),
    );

    if (!apply) continue;

    const patch = client.patch(adj.productId).set({ price: adj.previousPrice });
    if (restoreCompareAt) patch.set({ compareAtPrice: restoreCompareAt });
    await patch.commit();

    const totalCost = (adj.costPrice ?? 0) + (adj.shippingCost ?? 0);
    const revertedMargin = totalCost
      ? ((adj.previousPrice - totalCost) / adj.previousPrice) * 100
      : undefined;

    await client.create({
      _type: "priceAdjustment",
      product: { _type: "reference", _ref: adj.productId },
      productTitle: adj.productTitle,
      previousPrice: adj.newPrice,
      newPrice: adj.previousPrice,
      costPrice: adj.costPrice,
      shippingCost: adj.shippingCost,
      newMarginPct: revertedMargin ? +revertedMargin.toFixed(2) : undefined,
      compareAtPriceCleared: false,
      reason: isDiDesigns
        ? "Reverted: Damien's instruction was to leave D.I. Designs pricing untouched regardless of margin."
        : `Reverted: original margin was ${adj.previousMarginPct}%, which Damien classed as "don't worry about it" (his example was ~18%) rather than genuinely thin.`,
      source: SOURCE,
      adjustedAt: new Date().toISOString(),
    });
  }

  console.log(`\n${reverted} reverted, ${kept} kept.\n`);
  console.log(
    apply ? "Applied.\n" : "Dry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
