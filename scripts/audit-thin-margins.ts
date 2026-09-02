/**
 * Where the profit is too small to be worth the order.
 *
 * Damien: "how many of our products leave us with minimal profit or too small
 * numbers in comparison to what were selling."
 *
 * Two separate questions, and a product can fail either:
 *
 *   - **Percentage** — the margin as a share of the sale price. A 12% margin is
 *     thin whatever the pounds.
 *   - **Absolute pounds** — what actually lands. £4 on a £19 candle is 21%,
 *     which passes a percentage floor, and it is still £4 for handling an order,
 *     answering a question about it and carrying the return risk. This is the
 *     "too small numbers in comparison to what we're selling" half, and no
 *     percentage floor catches it.
 *
 * Both are computed net of the two costs that are real on every single order and
 * that the customer never pays: supplier carriage (Damien's rule is £0 shipping
 * at checkout) and card processing at 1.5% + 20p.
 *
 * `shippingCost` of null means unknown, not free — those are reported in their
 * own bucket rather than being scored as if carriage were zero. That distinction
 * is the whole reason the Hill Interiors range looked healthy for a month.
 *
 * Read-only.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-thin-margins.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

const CARD_PCT = 0.015;
const CARD_FIXED = 0.2;

/**
 * The pounds below which an order is not worth having.
 *
 * Not a number Damien has set — it is here to put a shape on the question. £5 is
 * roughly what it costs in time to handle one order end to end: place it with the
 * supplier, answer one email, and carry the odds of a return.
 */
const MIN_POUNDS = 5;

interface Row {
  _id: string;
  title: string;
  price: number;
  costPrice: number;
  shippingCost: number | null;
  supplier: string | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && defined(price) && defined(costPrice)]{
      _id, title, price, costPrice, shippingCost, "supplier": supplier->name
    }`,
  );

  const scored = rows.map((r) => {
    const ship = typeof r.shippingCost === "number" ? r.shippingCost : null;
    const fee = r.price * CARD_PCT + CARD_FIXED;
    const net = ship === null ? null : r.price - r.costPrice - ship - fee;
    return {
      ...r,
      ship,
      net,
      pct: net === null ? null : (net / r.price) * 100,
    };
  });

  const known = scored.filter(
    (s): s is typeof s & { net: number; pct: number } => s.net !== null,
  );
  const unknownCarriage = scored.filter((s) => s.net === null);

  const negative = known.filter((s) => s.net <= 0);
  const underFive = known.filter((s) => s.net > 0 && s.net < MIN_POUNDS);
  const under10pct = known.filter((s) => s.pct < 10);
  const under15pct = known.filter((s) => s.pct < 15);
  const under20pct = known.filter((s) => s.pct < 20);

  console.log(`Scored ${known.length} of ${rows.length} products.`);
  console.log(
    `Carriage unknown, not scored: ${unknownCarriage.length} — these are NOT safe, just unmeasured.\n`,
  );

  console.log(`LOSING MONEY (net <= £0):            ${negative.length}`);
  console.log(
    `UNDER £${MIN_POUNDS} NET per order:            ${underFive.length}`,
  );
  console.log(`Under 10% net margin:                ${under10pct.length}`);
  console.log(`Under 15% net margin:                ${under15pct.length}`);
  console.log(`Under 20% net margin:                ${under20pct.length}`);

  // By supplier, because the answer is usually a supplier's terms, not a product.
  console.log(
    `\nBy supplier — products under £${MIN_POUNDS} net, or negative:`,
  );
  const bySupplier = new Map<
    string,
    { total: number; scored: number; bad: number; unknown: number }
  >();
  for (const s of scored) {
    const key = s.supplier ?? "(no supplier)";
    const e = bySupplier.get(key) ?? {
      total: 0,
      scored: 0,
      bad: 0,
      unknown: 0,
    };
    e.total += 1;
    if (s.net === null) e.unknown += 1;
    else {
      e.scored += 1;
      if (s.net < MIN_POUNDS) e.bad += 1;
    }
    bySupplier.set(key, e);
  }
  for (const [name, e] of [...bySupplier].sort((a, b) => b[1].bad - a[1].bad)) {
    console.log(
      `  ${name.padEnd(34)} ${String(e.bad).padStart(4)} thin of ${String(e.scored).padStart(4)} scored` +
        (e.unknown ? `   (${e.unknown} unmeasured)` : ""),
    );
  }

  const show = (label: string, list: typeof known, n = 25) => {
    if (!list.length) return;
    console.log(`\n${label}`);
    for (const s of [...list].sort((a, b) => a.net - b.net).slice(0, n)) {
      console.log(
        `  £${s.price.toFixed(2).padStart(8)}  cost £${s.costPrice.toFixed(2).padStart(8)}` +
          `  ship £${(s.ship ?? 0).toFixed(2).padStart(6)}  => £${s.net.toFixed(2).padStart(8)}` +
          ` (${s.pct.toFixed(1).padStart(5)}%)  ${(s.supplier ?? "?").slice(0, 18).padEnd(19)} ${s.title.slice(0, 40)}`,
      );
    }
    if (list.length > n) console.log(`  ... and ${list.length - n} more`);
  };

  show("LOSING MONEY on every sale:", negative);
  show(
    `Under £${MIN_POUNDS} net — the order costs more to handle than it earns:`,
    underFive,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-thin-margin-audit.json",
    JSON.stringify(
      {
        cardPct: CARD_PCT,
        cardFixed: CARD_FIXED,
        minPounds: MIN_POUNDS,
        counts: {
          scored: known.length,
          unknownCarriage: unknownCarriage.length,
          negative: negative.length,
          underMinPounds: underFive.length,
          under10pct: under10pct.length,
          under15pct: under15pct.length,
          under20pct: under20pct.length,
        },
        negative: negative.map((s) => ({
          title: s.title,
          supplier: s.supplier,
          price: s.price,
          cost: s.costPrice,
          ship: s.ship,
          net: +s.net.toFixed(2),
        })),
        underMinPounds: underFive.map((s) => ({
          title: s.title,
          supplier: s.supplier,
          price: s.price,
          cost: s.costPrice,
          ship: s.ship,
          net: +s.net.toFixed(2),
          pct: +s.pct.toFixed(1),
        })),
        unknownCarriage: unknownCarriage.map((s) => ({
          title: s.title,
          supplier: s.supplier,
          price: s.price,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
