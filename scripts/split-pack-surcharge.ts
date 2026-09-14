/**
 * The 10% a supplier charges for breaking a wholesale pack.
 *
 * Premier Housewares state it in their own trade FAQ: "you can split packs,
 * but a 10% surcharge will apply, this will be automatically added depending
 * on the quantity you add to your shopping basket". On a dropship account
 * every order is one unit, so for anything sold in sixes or twelves that is
 * not an occasional fee — it is a permanent 10% on cost, on every sale.
 *
 * Two facts are needed and only one of them is known:
 *
 *   The RATE is confirmed by the supplier's own words, and is written to
 *   `splitPackSurchargeRate` on the supplier by `--apply`.
 *
 *   The SCOPE — which products are pack items — is not. A Google AI Overview
 *   asserts that furniture is exempt and packs run 6/12/24, which is plausible
 *   and carries its own "may include mistakes" disclaimer. That is an
 *   inference about somebody else's terms, and inflating 546 cost prices on
 *   it would do two kinds of damage: it would overstate costs on furniture
 *   that never carried the charge, and it would make `costPrice` impossible
 *   to reconcile against a real invoice afterwards. `costPrice` is what the
 *   invoice says. Nothing else belongs in it.
 *
 * So this reports the exposure as a RANGE and leaves the field unset until a
 * pack quantity is known per product. What converts the range into a number
 * is one request to the supplier: a pack-size column on the trade price list.
 *
 * Read-only unless --apply, which writes ONLY the supplier's rate.
 *   pnpm tsx --env-file=.env.local scripts/split-pack-surcharge.ts
 *   pnpm tsx --env-file=.env.local scripts/split-pack-surcharge.ts --apply
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

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

/** Confirmed from the supplier's own published trade FAQ. */
const RATES: Record<string, number> = { "Premier Housewares": 0.1 };

/**
 * Categories whose products are plainly single units — a sofa is not sold in
 * a pack of twelve. Used ONLY to narrow the range shown, never to write a
 * value: a category is a weak proxy for a pack size and the point of this
 * script is to stop weak proxies reaching the database.
 */
const SINGLE_UNIT_CATEGORIES = new Set([
  "Sofas",
  "Beds",
  "Furniture",
  "Desks",
  "TV Units",
  "Sideboards",
  "Wardrobes",
  "Bedside Tables",
  "Console Tables",
  "Coffee Tables",
  "Side Tables",
  "Shelving",
  "Garden Furniture",
  "Outdoor Saunas",
  "Indoor Saunas",
  "Cold Plunges",
]);

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  supplier: string | null;
  supplierId: string | null;
  category: string | null;
  packQuantity: number | null;
}

function keep(row: Row, surcharge: number): number {
  const price = row.price!;
  const cost = row.costPrice! * (1 + surcharge);
  return (
    price - cost - (row.shippingCost ?? 0) - (price * CARD_RATE + CARD_FIXED)
  );
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && defined(price) && defined(costPrice)]{
      _id, title, "slug": slug.current, price, costPrice, shippingCost, packQuantity,
      "supplier": supplier->name, "supplierId": supplier->_id, "category": category->title }`,
  );

  for (const [name, rate] of Object.entries(RATES)) {
    const affected = rows.filter((r) => r.supplier === name);
    const known = affected.filter((r) => typeof r.packQuantity === "number");
    const exempt = affected.filter((r) =>
      SINGLE_UNIT_CATEGORIES.has(r.category ?? ""),
    );
    const atRisk = affected.filter(
      (r) =>
        !SINGLE_UNIT_CATEGORIES.has(r.category ?? "") &&
        typeof r.packQuantity !== "number",
    );

    console.log(
      `\n=== ${name} — ${Math.round(rate * 100)}% split-pack surcharge ===\n`,
    );
    console.log(`  ${affected.length} products`);
    console.log(
      `  ${exempt.length} plainly single units (furniture and large goods)`,
    );
    console.log(`  ${atRisk.length} could be pack items — pack size unknown`);
    console.log(`  ${known.length} with a pack quantity actually recorded\n`);

    const band = (n: number) =>
      n < 0
        ? "LOSS"
        : n < 0.1
          ? "0–10%"
          : n < 0.2
            ? "10–20%"
            : n < 0.3
              ? "20–30%"
              : "30%+";

    for (const [label, surcharge] of [
      ["without the surcharge", 0],
      [`with the surcharge`, rate],
    ] as const) {
      const counts = new Map<string, number>();
      for (const r of atRisk) {
        const b = band(keep(r, surcharge) / r.price!);
        counts.set(b, (counts.get(b) ?? 0) + 1);
      }
      console.log(`  ${atRisk.length} unknown-pack products, ${label}:`);
      for (const b of ["LOSS", "0–10%", "10–20%", "20–30%", "30%+"])
        console.log(
          `      ${b.padEnd(7)} ${String(counts.get(b) ?? 0).padStart(4)}`,
        );
    }

    // The products where the 10% is the difference between viable and not.
    const decisive = atRisk
      .filter(
        (r) => keep(r, 0) / r.price! >= 0.2 && keep(r, rate) / r.price! < 0.2,
      )
      .sort((a, b) => keep(a, rate) - keep(b, rate));
    const sinks = atRisk.filter((r) => keep(r, 0) >= 0 && keep(r, rate) < 0);

    console.log(
      `\n  DECISIVE: ${decisive.length} products drop below 20% margin if the surcharge applies.`,
    );
    console.log(`  ${sinks.length} go from profitable to a loss.\n`);
    for (const r of decisive.slice(0, 20))
      console.log(
        `    £${keep(r, 0).toFixed(2).padStart(7)} → £${keep(r, rate).toFixed(2).padStart(7)}   ` +
          `${(r.category ?? "").slice(0, 18).padEnd(20)} ${r.title.replace(" | Kaiku", "").slice(0, 40)}`,
      );
    if (decisive.length > 20)
      console.log(`    … and ${decisive.length - 20} more`);

    const byCat = new Map<string, number>();
    for (const r of atRisk)
      byCat.set(
        r.category ?? "(none)",
        (byCat.get(r.category ?? "(none)") ?? 0) + 1,
      );
    console.log(`\n  Categories to get pack sizes for first:`);
    for (const [cat, n] of [...byCat].sort((a, b) => b[1] - a[1]).slice(0, 10))
      console.log(`    ${String(n).padStart(4)}  ${cat}`);

    mkdirSync("docs/change-log", { recursive: true });
    writeFileSync(
      "docs/change-log/split-pack-exposure.json",
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          supplier: name,
          rate,
          counts: {
            total: affected.length,
            exempt: exempt.length,
            atRisk: atRisk.length,
            known: known.length,
          },
          decisive: decisive.map((r) => ({
            slug: r.slug,
            title: r.title.replace(" | Kaiku", ""),
            category: r.category,
            price: r.price,
            keepWithout: Number(keep(r, 0).toFixed(2)),
            keepWith: Number(keep(r, rate).toFixed(2)),
          })),
        },
        null,
        2,
      )}\n`,
    );

    if (apply) {
      const supplierId = affected.find((r) => r.supplierId)?.supplierId;
      if (supplierId) {
        await client
          .patch(supplierId)
          .set({ splitPackSurchargeRate: rate })
          .commit();
        console.log(
          `\n  Recorded ${Math.round(rate * 100)}% on the ${name} supplier record.`,
        );
      }
    }
  }

  console.log(
    "\nFull list: docs/change-log/split-pack-exposure.json" +
      (apply
        ? ""
        : "\nDry run — re-run with --apply to record the rate on the supplier."),
  );
  console.log(
    "\nTo turn this range into a number: ask Premier Housewares for a pack-size\n" +
      "column on the trade price list, then set packQuantity per product.\n",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
