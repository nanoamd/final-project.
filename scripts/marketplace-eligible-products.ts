/**
 * Which products may actually be listed on eBay, Amazon or OnBuy.
 *
 * Damien: "find all my products which are eligible to go on ebay and amazon.
 * some suppliers i have dont allow it".
 *
 * The permission is a supplier's rule rather than a product's, so it is
 * recorded once per supplier on `marketplacesAllowed`, and this reads it.
 *
 * **An unset supplier is treated as "not permitted", never as "allowed".**
 * Dropship trade terms commonly forbid Amazon and eBay outright, and breaching
 * that closes the trade account rather than generating a warning. The cost of
 * wrongly withholding a product is a delayed listing; the cost of wrongly
 * listing one is losing the supplier. Those are not symmetric, so silence
 * means no.
 *
 * Eligibility is then narrowed to products worth the effort, because a
 * marketplace takes 10-15% off the top: a product that keeps £8 before fees
 * keeps nothing after them. The bar is the same one
 * `promotable-products.ts` uses, and the fee is modelled explicitly so the
 * figure shown is what actually lands.
 *
 * Read-only.
 *   pnpm tsx --env-file=.env.local scripts/marketplace-eligible-products.ts
 *   pnpm tsx --env-file=.env.local scripts/marketplace-eligible-products.ts --all
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

/** Show every permitted product, not only the ones that clear the bar. */
const showAll = process.argv.includes("--all");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

/** Typical all-in marketplace commission, applied to the sale price. */
const FEES: Record<string, number> = {
  eBay: 0.129,
  Amazon: 0.151,
  OnBuy: 0.09,
  Etsy: 0.095,
};

/** What a product must still keep after the marketplace has taken its cut. */
const MIN_KEEP_AFTER_FEE = 15;

interface Row {
  slug: string | null;
  title: string;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  supplier: string | null;
  category: string | null;
  allowed: string[] | null;
  source: string | null;
  gtin: string | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && defined(slug.current)]{
      "slug": slug.current, title, price, costPrice, shippingCost, gtin,
      "supplier": supplier->name,
      "category": category->title,
      "allowed": supplier->marketplacesAllowed,
      "source": supplier->marketplacePolicySource
    }`,
  );

  const suppliers = new Map<
    string,
    { allowed: string[]; source: string | null; total: number }
  >();
  for (const row of rows) {
    const name = row.supplier ?? "(no supplier)";
    const entry = suppliers.get(name) ?? {
      allowed: row.allowed ?? [],
      source: row.source,
      total: 0,
    };
    entry.total += 1;
    suppliers.set(name, entry);
  }

  console.log("\nSupplier permissions as recorded\n");
  let anyRecorded = false;
  for (const [name, entry] of [...suppliers.entries()].sort(
    (a, b) => b[1].total - a[1].total,
  )) {
    const permitted = entry.allowed.length
      ? entry.allowed.join(", ")
      : "none recorded — treated as NOT permitted";
    if (entry.allowed.length) anyRecorded = true;
    console.log(
      `  ${name.padEnd(38)} ${String(entry.total).padStart(4)} products`,
    );
    console.log(
      `      ${permitted}${entry.source ? `   (${entry.source})` : ""}`,
    );
  }

  if (!anyRecorded) {
    console.log(
      "\nNo supplier has a marketplace permission recorded yet, so nothing is\n" +
        "eligible. That is the safe answer rather than a broken one: tick\n" +
        "`marketplacesAllowed` in Studio under Catalog -> Suppliers for the\n" +
        "suppliers whose terms you have actually checked, then re-run this.\n",
    );
    return;
  }

  const eligible: Record<string, typeof analysed> = {};
  const analysed = rows
    .filter(
      (r) =>
        typeof r.price === "number" &&
        typeof r.costPrice === "number" &&
        (r.allowed ?? []).length > 0,
    )
    .map((r) => {
      const price = r.price!;
      const carriage = r.shippingCost ?? 0;
      const keep =
        price - r.costPrice! - carriage - (price * CARD_RATE + CARD_FIXED);
      return {
        slug: r.slug,
        title: r.title.replace(" | Kaiku", ""),
        supplier: r.supplier ?? "(none)",
        category: r.category ?? "(none)",
        price,
        keep,
        gtin: r.gtin,
        allowed: r.allowed ?? [],
      };
    });

  for (const marketplace of Object.keys(FEES)) {
    const fee = FEES[marketplace]!;
    const list = analysed
      .filter((p) => p.allowed.includes(marketplace))
      .map((p) => ({ ...p, keepAfterFee: p.keep - p.price * fee }))
      .filter((p) => showAll || p.keepAfterFee >= MIN_KEEP_AFTER_FEE)
      .sort((a, b) => b.keepAfterFee - a.keepAfterFee);

    if (!list.length) continue;
    eligible[marketplace] = list as never;

    console.log(
      `\n\n=== ${marketplace} — ${list.length} product(s)` +
        `${showAll ? "" : ` keeping £${MIN_KEEP_AFTER_FEE}+ after ${Math.round(fee * 100)}% fees`} ===\n`,
    );
    console.log("  keep after fee   price   GTIN  product");
    for (const p of list.slice(0, 40)) {
      console.log(
        `  £${p.keepAfterFee.toFixed(2).padStart(13)}  £${p.price.toFixed(2).padStart(7)}   ` +
          `${p.gtin ? " y" : " n"}   ${p.title.slice(0, 52)}`,
      );
    }
    if (list.length > 40) console.log(`  … and ${list.length - 40} more`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/marketplace-eligible-products.json",
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        fees: FEES,
        minKeepAfterFee: MIN_KEEP_AFTER_FEE,
        eligible,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    "\n\nFull lists: docs/change-log/marketplace-eligible-products.json",
  );
  console.log(
    "\nNote: products without a GTIN are harder to list on Amazon, which\n" +
      "usually wants one unless you apply for a brand exemption.",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
