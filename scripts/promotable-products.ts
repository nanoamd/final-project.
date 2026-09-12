/**
 * Which products can actually pay for a customer.
 *
 * `margin-report.ts` answers "what does each product keep". This answers the
 * question that follows from it, and it is the one that decides where effort
 * goes: **which products earn enough to survive the cost of acquiring the
 * buyer.**
 *
 * That distinction matters because every paid or marketplace channel takes its
 * cut off the top, and the cut is roughly fixed while the margin is not:
 *
 *   Google/Meta ads   a new, unknown brand in UK home and garden converts at
 *                     perhaps 0.5-1.5%, at roughly £0.50-£1.50 a click. That
 *                     is £50-£200 to buy one order, so a product keeping £40
 *                     cannot be advertised at any volume without losing money
 *                     on every sale.
 *   eBay / OnBuy      around 10-15% of the sale price in fees.
 *   Etsy              around 9-11% all-in once payment and listing fees land.
 *
 * So a product is only worth promoting if it clears the acquisition cost with
 * something left. Both tests have to pass, because each catches a different
 * failure: percentage alone passes a £9 candle holder at 60% that keeps £5,
 * and cash alone passes an £800 table at 8% that keeps £64 and is wiped out by
 * one redelivery.
 *
 * Everything below the bar is not necessarily a mistake to delist — it is fine
 * as a basket-filler next to something bigger. It is simply not where the
 * listing effort, the ad spend or the next guide should go.
 *
 * Read-only.
 *   pnpm tsx --env-file=.env.local scripts/promotable-products.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

/** Stripe UK standard pricing for a UK card, matching margin-report.ts. */
const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

/**
 * The bar. Both must pass.
 *
 * 35% net leaves room for a marketplace's ~12% and still returns a real
 * profit; 30% does on a good day and is the softer second tier below.
 * £25 cash is the point at which a single return stops erasing several
 * sales — deliberately above margin-report's £15 "not worth listing" floor,
 * because surviving a listing and funding an advert are different bars.
 */
const STRONG_MARGIN = 0.35;
const STRONG_CASH = 25;
const VIABLE_MARGIN = 0.3;
const VIABLE_CASH = 20;

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  supplier: string | null;
  category: string | null;
  carriageIncluded: boolean | null;
  stockStatus: string | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      _id, title, "slug": slug.current, price, costPrice, shippingCost,
      "supplier": supplier->name,
      "category": category->title,
      "carriageIncluded": supplier->carriageIncludedInCost,
      stockStatus
    }`,
  );

  const analysed = rows
    .filter(
      (r) => typeof r.price === "number" && typeof r.costPrice === "number",
    )
    .map((r) => {
      const price = r.price!;
      const carriageUnknown = r.shippingCost === null && !r.carriageIncluded;
      const carriage = r.shippingCost ?? 0;
      const keep =
        price - r.costPrice! - carriage - (price * CARD_RATE + CARD_FIXED);
      return {
        title: r.title.replace(" | Kaiku", ""),
        slug: r.slug,
        supplier: r.supplier,
        category: r.category,
        price,
        keep,
        margin: price > 0 ? keep / price : 0,
        // A margin computed without known carriage is a ceiling, not a figure.
        carriageUnknown,
      };
    })
    .sort((a, b) => b.keep - a.keep);

  const strong = analysed.filter(
    (p) => p.margin >= STRONG_MARGIN && p.keep >= STRONG_CASH,
  );
  const viable = analysed.filter(
    (p) =>
      !(p.margin >= STRONG_MARGIN && p.keep >= STRONG_CASH) &&
      p.margin >= VIABLE_MARGIN &&
      p.keep >= VIABLE_CASH,
  );

  const pct = (n: number) => `${Math.round((n / analysed.length) * 100)}%`;

  console.log(`\n${analysed.length} published products with a cost price.\n`);
  console.log(
    `STRONG  (>=${Math.round(STRONG_MARGIN * 100)}% and >=£${STRONG_CASH})   ${strong.length}  (${pct(strong.length)})`,
  );
  console.log(
    `VIABLE  (>=${Math.round(VIABLE_MARGIN * 100)}% and >=£${VIABLE_CASH})   ${viable.length}  (${pct(viable.length)})`,
  );
  console.log(
    `BELOW   the bar                ${analysed.length - strong.length - viable.length}  (${pct(analysed.length - strong.length - viable.length)})`,
  );

  const promotable = [...strong, ...viable];
  const certain = promotable.filter((p) => !p.carriageUnknown);
  console.log(
    `\nOf the ${promotable.length} promotable, ${certain.length} have carriage recorded; ` +
      `${promotable.length - certain.length} are a best case until it is.`,
  );

  const bySupplier = new Map<string, { n: number; keep: number }>();
  for (const p of promotable) {
    const key = p.supplier ?? "(no supplier)";
    const e = bySupplier.get(key) ?? { n: 0, keep: 0 };
    e.n += 1;
    e.keep += p.keep;
    bySupplier.set(key, e);
  }
  console.log("\nPromotable, by supplier");
  for (const [name, e] of [...bySupplier.entries()].sort(
    (a, b) => b[1].n - a[1].n,
  )) {
    console.log(
      `  ${name.padEnd(22)} ${String(e.n).padStart(4)}   mean keep £${(e.keep / e.n).toFixed(2)}`,
    );
  }

  const byCategory = new Map<string, number>();
  for (const p of promotable) {
    const key = p.category ?? "(none)";
    byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
  }
  console.log("\nPromotable, top categories");
  for (const [name, n] of [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)) {
    console.log(`  ${String(n).padStart(4)}  ${name}`);
  }

  console.log("\nTop 15 by cash kept");
  for (const p of promotable.slice(0, 15)) {
    console.log(
      `  £${p.keep.toFixed(2).padStart(8)}  ${String(Math.round(p.margin * 100)).padStart(3)}%  ` +
        `£${p.price.toFixed(2).padStart(8)}  ${p.carriageUnknown ? "?" : " "}  ${p.title.slice(0, 52)}`,
    );
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-12-promotable-products.json",
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        thresholds: { STRONG_MARGIN, STRONG_CASH, VIABLE_MARGIN, VIABLE_CASH },
        counts: {
          analysed: analysed.length,
          strong: strong.length,
          viable: viable.length,
          below: analysed.length - strong.length - viable.length,
        },
        strong,
        viable,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    "\nFull lists: docs/change-log/2026-09-12-promotable-products.json",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
