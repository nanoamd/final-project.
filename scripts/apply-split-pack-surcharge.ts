/**
 * Folds Premier Housewares' 10% split-pack surcharge into the cost price of
 * the products judged to be pack items.
 *
 * Damien asked for this twice, so it ships — but with the original invoice
 * figure preserved in `costPriceBeforeSplitPack` and the change flagged on
 * `splitPackApplied`, because the selection below is a JUDGEMENT and some of
 * it will be wrong. When Premier send real pack sizes, `--revert` puts back
 * everything this got wrong, exactly.
 *
 * THE RULE, and why it is not "all of them":
 *
 *   1. Categories that are plainly single units are excluded outright. A sofa
 *      is not sold in a pack of twelve.
 *
 *   2. Of the 328 that remain, only those with a trade cost under £60 are
 *      treated as pack items. The catalogue's own medians make the line:
 *      Accessories £15, Wall Clocks £28, Vases £45 — small decorative goods
 *      that wholesale in sixes and twelves. Lighting £191, Mirrors £189 and
 *      Storage £489 are a different kind of object: a pack of six £190 lamps
 *      would be an £1,145 wholesale unit, and mirrors ship singly because
 *      they break. Applying the surcharge to those would overstate the cost
 *      of products that never carried it, which is the same error as
 *      understating the ones that do — just in the direction that loses
 *      sales rather than money.
 *
 * The 10% is applied to the VAT-inclusive cost, which is arithmetically the
 * same as applying it before VAT: the supplier surcharges the trade price and
 * then charges VAT on the total, and 1.1 x 1.2 is 1.2 x 1.1.
 *
 * Idempotent — a product already carrying `splitPackApplied` is skipped, so
 * this cannot compound to 21%.
 *
 *   pnpm tsx --env-file=.env.local scripts/apply-split-pack-surcharge.ts
 *   pnpm tsx --env-file=.env.local scripts/apply-split-pack-surcharge.ts --apply
 *   pnpm tsx --env-file=.env.local scripts/apply-split-pack-surcharge.ts --revert --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const revert = process.argv.includes("--revert");
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
const RATE = 0.1;
/** Above this trade cost a wholesale multipack stops being plausible. */
const PACK_COST_CEILING = 60;

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
  splitPackApplied: boolean | null;
  costPriceBeforeSplitPack: number | null;
}

const keep = (price: number, cost: number, ship: number) =>
  price - cost - ship - (price * CARD_RATE + CARD_FIXED);

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && supplier->name==$s && defined(costPrice) && defined(price)]{
      _id, title, "slug": slug.current, price, costPrice, shippingCost,
      "category": category->title, splitPackApplied, costPriceBeforeSplitPack }`,
    { s: SUPPLIER },
  );

  if (revert) {
    const done = rows.filter(
      (r) =>
        r.splitPackApplied && typeof r.costPriceBeforeSplitPack === "number",
    );
    console.log(`\n${done.length} products to restore to their invoice cost.`);
    if (!apply) return console.log("Dry run — add --apply.");
    for (const r of done)
      await client
        .patch(r._id)
        .set({ costPrice: r.costPriceBeforeSplitPack! })
        .unset(["splitPackApplied", "costPriceBeforeSplitPack"])
        .commit();
    return console.log(`Restored ${done.length}.`);
  }

  const already = rows.filter((r) => r.splitPackApplied);
  const candidates = rows.filter(
    (r) =>
      !r.splitPackApplied &&
      !SINGLE_UNIT_CATEGORIES.has(r.category ?? "") &&
      r.costPrice! < PACK_COST_CEILING,
  );

  const changes = candidates.map((r) => {
    const before = r.costPrice!;
    const after = Math.round(before * (1 + RATE) * 100) / 100;
    const ship = r.shippingCost ?? 0;
    return {
      _id: r._id,
      slug: r.slug,
      title: r.title.replace(" | Kaiku", ""),
      category: r.category,
      price: r.price!,
      before,
      after,
      keepBefore: Number(keep(r.price!, before, ship).toFixed(2)),
      keepAfter: Number(keep(r.price!, after, ship).toFixed(2)),
    };
  });

  const nowThin = changes.filter(
    (c) => c.keepBefore / c.price >= 0.2 && c.keepAfter / c.price < 0.2,
  );
  const nowLoss = changes.filter((c) => c.keepBefore >= 0 && c.keepAfter < 0);

  console.log(`\n${SUPPLIER} — ${rows.length} priced products`);
  console.log(`  ${already.length} already carry the surcharge (skipped)`);
  console.log(
    `  ${changes.length} judged to be pack items and will take +${RATE * 100}%`,
  );
  console.log(
    `  ${rows.length - changes.length - already.length} left alone\n`,
  );

  const byCat = new Map<string, number>();
  for (const c of changes)
    byCat.set(
      c.category ?? "(none)",
      (byCat.get(c.category ?? "(none)") ?? 0) + 1,
    );
  for (const [cat, n] of [...byCat].sort((a, b) => b[1] - a[1]))
    console.log(`    ${String(n).padStart(4)}  ${cat}`);

  console.log(`\n  ${nowThin.length} fall below 20% margin as a result`);
  console.log(`  ${nowLoss.length} become a loss\n`);
  for (const c of [...changes]
    .sort((a, b) => a.keepAfter - b.keepAfter)
    .slice(0, 12))
    console.log(
      `    cost £${c.before.toFixed(2).padStart(7)} → £${c.after.toFixed(2).padStart(7)}   ` +
        `keep £${c.keepBefore.toFixed(2).padStart(7)} → £${c.keepAfter.toFixed(2).padStart(7)}   ${c.title.slice(0, 38)}`,
    );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-14-split-pack-applied.json",
    `${JSON.stringify({ generatedAt: new Date().toISOString(), supplier: SUPPLIER, rate: RATE, ceiling: PACK_COST_CEILING, changes }, null, 2)}\n`,
  );

  if (!apply) return console.log("\nDry run — re-run with --apply.");

  for (const c of changes)
    await client
      .patch(c._id)
      .set({
        costPrice: c.after,
        costPriceBeforeSplitPack: c.before,
        splitPackApplied: true,
      })
      .commit();
  console.log(
    `\nApplied to ${changes.length} products. Reversible with --revert --apply.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
