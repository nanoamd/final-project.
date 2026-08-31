/**
 * Lists every Premier Housewares product whose margin falls below 20% once
 * the real, VAT-inclusive cost is used — the loss-making and the too-thin-
 * to-be-worth-selling, not the whole 401-product range.
 *
 * Damien: *"we have hundreds of premier housewares products this should
 * include all products, only add it to the list if its a loss or not making
 * enough money to be worth selling"*. 20% is not invented for this report —
 * it is the exact "caution" floor `src/sanity/components/margin-display.tsx`
 * already uses in Studio and the one `audit-and-fix-margins.ts` already
 * treats as the acceptable minimum, so this uses the number the business
 * already agreed on rather than a new one.
 *
 * Read-only — no Sanity write. `costPrice` here is read as-is and 20% VAT is
 * added for the calculation only; the actual correction to the stored field
 * is `scripts/fix-premier-housewares-vat-costs.ts`, run separately.
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
/** Matches the "caution" threshold in src/sanity/components/margin-display.tsx. */
const MARGIN_FLOOR = 0.2;
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

async function main() {
  const products = await client.fetch<Row[]>(
    `*[_type == "product" && supplier->name == $supplier && !(_id in path("drafts.**")) && defined(price) && defined(costPrice)]{
      title, price, costPrice, sku, supplierSku
    }`,
    { supplier: SUPPLIER },
  );

  const rows = products.map((p) => {
    const price = p.price ?? 0;
    const trueCost = +((p.costPrice ?? 0) * (1 + VAT_RATE)).toFixed(2);
    const marginGBP = +(price - trueCost).toFixed(2);
    const marginPct = price ? +((marginGBP / price) * 100).toFixed(1) : 0;
    return {
      title: p.title,
      sku: p.sku,
      supplierSku: p.supplierSku,
      price,
      trueCost,
      marginGBP,
      marginPct,
    };
  });

  const concerning = rows
    .filter((r) => r.marginPct < MARGIN_FLOOR * 100)
    .sort((a, b) => a.marginPct - b.marginPct);

  console.log(`${products.length} ${SUPPLIER} products checked.`);
  console.log(
    `${concerning.length} below the ${MARGIN_FLOOR * 100}% margin floor once the real, VAT-inclusive cost is used.\n`,
  );

  const header =
    "Title,SKU,Supplier SKU,Retail Price (GBP),True Cost incl. 20% VAT (GBP),Margin (GBP),Margin (%)";
  const csvRows = concerning.map((r) =>
    [
      r.title,
      r.sku ?? "",
      r.supplierSku ?? "",
      r.price.toFixed(2),
      r.trueCost.toFixed(2),
      r.marginGBP.toFixed(2),
      r.marginPct.toFixed(1),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  writeFileSync(OUT_PATH, [header, ...csvRows].join("\n") + "\n");
  console.log(`Written to ${OUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
