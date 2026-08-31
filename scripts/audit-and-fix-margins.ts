/**
 * Margin audit and minimum-necessary price correction, per Damien's explicit
 * instruction on how this must work:
 *
 *   "I would not tell Claude to alter the cost price. That's your internal
 *   supplier cost and should remain truthful. Tell it to adjust the retail
 *   selling price when necessary, while preserving the actual supplier cost
 *   and recording the adjustment... I would absolutely make the price-change
 *   audit log mandatory."
 *
 * So this script never touches `costPrice` or `shippingCost` — both are read
 * as given, trusted as the supplier facts they are. It only ever raises
 * `price`, and only on products that are already profitable but thin, up to
 * — not past — a 20% margin floor. That floor is not invented for this
 * script: it is the exact threshold src/sanity/components/margin-display.tsx
 * already uses to colour a product's margin "caution" versus "positive" in
 * Studio, so this brings every product up to what the UI already calls
 * acceptable rather than asserting a new number.
 *
 * The adjustment is the minimum that clears the floor, rounded up to the
 * next whole pound — never a round-number jump, never "while we're at it"
 * padding. A product already at or above 20% is untouched.
 *
 * A `priceAdjustment` document is created for every change (see
 * src/sanity/schemaTypes/documents/price-adjustment.ts) recording the
 * before/after price, the cost figures the calculation used, and why —
 * mandatory, not optional, per the instruction above.
 *
 * **compareAtPrice clean-up rides along, because raising `price` can turn a
 * genuine "was/now" figure into nonsense.** A compareAtPrice that is already
 * broken — stored as 0, or already at or below the current price — is
 * cleared regardless of whether this product's margin needed fixing at all.
 * And where a margin correction would push `price` to meet or exceed an
 * otherwise-valid compareAtPrice, that figure is cleared too, rather than
 * left standing as a "was £650, now £655" that no longer makes sense. No
 * compareAtPrice is ever invented or raised — only removed when it stops
 * being true.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-and-fix-margins.ts
 *   pnpm tsx --env-file=.env.local scripts/audit-and-fix-margins.ts --apply
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

/** Matches the "caution" threshold in src/sanity/components/margin-display.tsx. */
const TARGET_MARGIN = 0.2;
const SOURCE = "scripts/audit-and-fix-margins.ts";

interface Row {
  _id: string;
  title: string;
  sku?: string;
  supplierSku?: string;
  price: number;
  costPrice?: number;
  shippingCost?: number;
  compareAtPrice?: number;
}

const margin = (price: number, totalCost: number) =>
  (price - totalCost) / price;

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(price)]{
      _id, title, sku, supplierSku, price, costPrice, shippingCost, compareAtPrice
    }`,
  );

  console.log(
    `\n${rows.length} published products with a price.\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  let marginFixes = 0;
  let compareAtClears = 0;
  let skippedNoCost = 0;

  for (const row of rows) {
    if (typeof row.costPrice !== "number") {
      skippedNoCost += 1;
      continue;
    }

    const totalCost = row.costPrice + (row.shippingCost ?? 0);
    const previousMargin = margin(row.price, totalCost);
    let newPrice = row.price;
    let reason: string | null = null;

    if (previousMargin < TARGET_MARGIN) {
      newPrice = Math.ceil(totalCost / (1 - TARGET_MARGIN));
      reason = `Margin was ${(previousMargin * 100).toFixed(1)}%, below the 20% floor. Raised to the minimum price clearing it — cost price and shipping cost were not touched.`;
    }

    const staleCompareAt =
      typeof row.compareAtPrice === "number" &&
      (row.compareAtPrice <= newPrice || row.compareAtPrice === 0);

    if (reason === null && !staleCompareAt) continue;

    const newMargin = margin(newPrice, totalCost);
    if (reason) {
      marginFixes += 1;
      console.log(
        `  ✓ ${row.title.slice(0, 55).padEnd(55)} £${row.price} -> £${newPrice}  ` +
          `${(previousMargin * 100).toFixed(1)}% -> ${(newMargin * 100).toFixed(1)}%` +
          (staleCompareAt ? "  (clearing stale compare-at)" : ""),
      );
    } else if (staleCompareAt) {
      compareAtClears += 1;
      console.log(
        `  · ${row.title.slice(0, 55).padEnd(55)} price unchanged — clearing stale compare-at (was £${row.compareAtPrice}, price £${row.price})`,
      );
    }

    if (!apply) continue;

    const patch = client.patch(row._id).set({ price: newPrice });
    if (staleCompareAt) patch.unset(["compareAtPrice"]);
    await patch.commit();

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
      costPrice: row.costPrice,
      shippingCost: row.shippingCost ?? 0,
      previousMarginPct: +(previousMargin * 100).toFixed(2),
      newMarginPct: +(newMargin * 100).toFixed(2),
      compareAtPriceCleared: staleCompareAt,
      reason:
        reason ??
        `compareAtPrice (£${row.compareAtPrice}) was ${row.compareAtPrice === 0 ? "stored as 0" : "at or below the selling price"} — cleared as stale rather than shown as a false discount.`,
      source: SOURCE,
      adjustedAt: new Date().toISOString(),
    });
  }

  console.log(
    `\n${marginFixes} price corrections, ${compareAtClears} compare-at-only clears, ` +
      `${skippedNoCost} skipped (no cost price recorded — cannot compute a margin).\n`,
  );
  console.log(
    apply
      ? "Applied. Every change has a priceAdjustment document recording why.\n"
      : "Dry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
