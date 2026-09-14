/**
 * Every Premier Housewares product to a 20% net margin, with a 17% floor.
 *
 * Damien: "just make sure everything from ph makes money. more than 20%. if
 * its too different to a competitors price then go down a few % minimum
 * margining should be 17% for every single product".
 *
 * **There is no competitor price anywhere in this catalogue.** `compareAtPrice`
 * is empty on all 546 Premier products and nothing else records a market
 * price, so the "too different to a competitor" test cannot be executed as
 * written. Inventing competitor prices would be worse than not having them.
 *
 * What stands in for it is the SIZE OF THE RISE, which is a real signal about
 * market risk. The median product needs 1.9% to reach 20% — a shopper cannot
 * see that, and there is no competitive question to ask. A £689 mirror that
 * needs 15.4% is a £106 move, which is exactly where a competitor would
 * matter. So:
 *
 *   rise <= 10%   price to 20%. Too small to change how the product sits.
 *   rise >  10%   price to the 17% floor instead, and flag it for Damien to
 *                 check against a competitor by hand. This is his "go down a
 *                 few %, minimum 17%" rule applied where it actually bites.
 *
 * Products already at or above 20% are NOT touched. The instruction is a
 * floor, not a target, and cutting a healthy margin to hit a number would
 * throw away money.
 *
 * Prices round UP to the whole pound: the catalogue is priced in whole pounds
 * and rounding down would break the very floor this exists to enforce.
 *
 * CARRIAGE IS STILL UNKNOWN on these products, and that undoes this if it
 * turns out to be charged. Pricing to exactly 20% leaves no headroom, so the
 * report states how many fall back under the floor at several carriage
 * assumptions. Re-run once the real terms are known.
 *
 *   pnpm tsx --env-file=.env.local scripts/reprice-premier-to-floor.ts
 *   pnpm tsx --env-file=.env.local scripts/reprice-premier-to-floor.ts --apply
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

const SUPPLIER = "Premier Housewares";
const TARGET = 0.2;
const FLOOR = 0.17;
/** Above this rise, a competitor check matters, so drop to the floor instead. */
const RISE_NEEDING_REVIEW = 0.1;

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  category: string | null;
}

const keep = (price: number, cost: number, ship: number, extra = 0) =>
  price - cost - ship - extra - (price * CARD_RATE + CARD_FIXED);

/** The price at which this product nets exactly `target`. */
const priceFor = (cost: number, ship: number, target: number) =>
  (cost + ship + CARD_FIXED) / (1 - target - CARD_RATE);

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && supplier->name==$s && defined(price) && defined(costPrice)]{
      _id, title, "slug": slug.current, price, costPrice, shippingCost, "category": category->title }`,
    { s: SUPPLIER },
  );

  const changes: {
    _id: string;
    slug: string | null;
    title: string;
    category: string | null;
    from: number;
    to: number;
    risePct: number;
    marginFrom: number;
    marginTo: number;
    atFloor: boolean;
  }[] = [];
  let alreadyFine = 0;

  for (const row of rows) {
    const cost = row.costPrice!;
    const ship = row.shippingCost ?? 0;
    const from = row.price!;
    const marginFrom = keep(from, cost, ship) / from;
    if (marginFrom >= TARGET) {
      alreadyFine += 1;
      continue;
    }

    const wanted = priceFor(cost, ship, TARGET);
    const rise = wanted / from - 1;
    const atFloor = rise > RISE_NEEDING_REVIEW;
    const to = Math.ceil(atFloor ? priceFor(cost, ship, FLOOR) : wanted);

    if (to <= from) continue;
    changes.push({
      _id: row._id,
      slug: row.slug,
      title: row.title.replace(" | Kaiku", ""),
      category: row.category,
      from,
      to,
      risePct: (to / from - 1) * 100,
      marginFrom: marginFrom * 100,
      marginTo: (keep(to, cost, ship) / to) * 100,
      atFloor,
    });
  }

  const flagged = changes.filter((c) => c.atFloor);
  console.log(`\n${SUPPLIER} — ${rows.length} products`);
  console.log(
    `  ${alreadyFine} already at or above ${TARGET * 100}% — left alone`,
  );
  console.log(`  ${changes.length} repriced`);
  console.log(`      ${changes.length - flagged.length} to ${TARGET * 100}%`);
  console.log(
    `      ${flagged.length} held at the ${FLOOR * 100}% floor (rise would exceed ${RISE_NEEDING_REVIEW * 100}%) — CHECK THESE AGAINST A COMPETITOR\n`,
  );

  const rises = changes.map((c) => c.risePct).sort((a, b) => a - b);
  console.log(
    `  median rise: ${(rises[Math.floor(rises.length / 2)] ?? 0).toFixed(1)}%   largest: ${(rises.at(-1) ?? 0).toFixed(1)}%`,
  );
  console.log(
    `  total price uplift across the range: £${changes.reduce((n, c) => n + (c.to - c.from), 0).toFixed(2)}\n`,
  );

  if (flagged.length) {
    console.log("  Held at the floor — eyeball these against a competitor:");
    for (const c of [...flagged].sort((a, b) => b.from - a.from))
      console.log(
        `    £${c.from.toFixed(2).padStart(8)} → £${String(c.to).padStart(7)}  (+${c.risePct.toFixed(1)}%, ${c.marginTo.toFixed(1)}%)  ` +
          `${(c.category ?? "").slice(0, 14).padEnd(16)} ${c.title.slice(0, 36)}`,
      );
    console.log("");
  }

  // Post-conditions, checked rather than assumed.
  const after = rows.map((r) => {
    const c = changes.find((x) => x._id === r._id);
    const price = c ? c.to : r.price!;
    return { price, cost: r.costPrice!, ship: r.shippingCost ?? 0 };
  });
  const belowFloor = after.filter(
    (a) => keep(a.price, a.cost, a.ship) / a.price < FLOOR,
  ).length;
  console.log(
    `  post-check: ${belowFloor} products below the ${FLOOR * 100}% floor (must be 0)`,
  );

  console.log(`\n  If carriage turns out to be charged, this is undone:`);
  for (const extra of [4.95, 7.95, 9.95, 14.95]) {
    const under = after.filter(
      (a) => keep(a.price, a.cost, a.ship, extra) / a.price < FLOOR,
    ).length;
    const neg = after.filter(
      (a) => keep(a.price, a.cost, a.ship, extra) < 0,
    ).length;
    console.log(
      `    +£${String(extra).padEnd(6)} →  ${String(under).padStart(3)} back under ${FLOOR * 100}%,  ${String(neg).padStart(3)} at a loss`,
    );
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-14-premier-reprice.json",
    `${JSON.stringify({ generatedAt: new Date().toISOString(), target: TARGET, floor: FLOOR, alreadyFine, changes }, null, 2)}\n`,
  );

  if (belowFloor > 0) {
    console.error("\nRefusing to write: the post-check failed.");
    process.exit(1);
  }
  if (!apply) return console.log("\nDry run — re-run with --apply.");

  for (const c of changes)
    await client.patch(c._id).set({ price: c.to }).commit();
  console.log(`\nRepriced ${changes.length} products.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
