/**
 * Rebuilds Hill Interiors costs from their own dropship feed, then reprices.
 *
 * Damien supplied the trade feeds and asked for "the same as we did with
 * premier housewares yesterday with the pricing, make as many promotable
 * competitive products as possible".
 *
 * WHAT THE FEEDS SHOWED, before any repricing was possible:
 *
 *   1. THE DROPSHIP PRICE IS 1.16x THE STOCK PRICE, on every single row —
 *      min, median and max are all 1.16. Kaiku dropships, so the dropship
 *      column is the one that counts, and any cost taken from the stock list
 *      understates what Kaiku actually pays by 16%.
 *
 *   2. HILL QUOTE EX VAT. Damien's own Provence invoice settles it: subtotal
 *      £1,160 + delivery £59.99, VAT £244.00, total £1,463.99 — 20% charged on
 *      goods AND carriage. So the true cost is the feed price x1.2, and the
 *      carriage band x1.2 with it.
 *
 *   3. 384 OF 615 HILL PRODUCTS HELD AN EX-VAT COST. Their recorded cost was
 *      exactly the dropship price with no VAT on it, so every margin tool in
 *      this repo has been reading them 20% cheaper than they are. 155 were
 *      already correct. The rest were neither: Hill have moved their prices
 *      since the costs were captured, in both directions.
 *
 * That is the same class of fault as the September VAT bookkeeping bug, and it
 * is why this script rebuilds cost from the feed rather than adjusting what is
 * already stored. A stored number of unknown provenance is not a base to build
 * on.
 *
 * PRICING. Hill is a wholesaler, so the same goods sit on dozens of UK sites
 * under identical names and RRP is what most of them charge. Kaiku therefore
 * aims 5% UNDER RRP where the margin allows it — a visible saving rather than
 * a price match — and never above RRP, because a shopper who finds the same
 * piece cheaper elsewhere has been taught not to come back. Where a 5%
 * undercut will not clear the floor, the price rises only as far as it must,
 * and a product that cannot clear 17% even at RRP is left alone and reported.
 *
 * CARRIAGE IS PER CONSIGNMENT, NOT PER ITEM — `hill-interiors-competitor-prices.md`
 * established that and the last reprice got it wrong. Charging every item its
 * full band is right for a single-item basket and pessimistic for any other. It
 * is used here anyway, because pricing on the optimistic reading means losing
 * money on exactly the orders that are easiest to win. The consequence is
 * visible in the output: small items cannot be promotable, and that is a real
 * finding rather than an arithmetic slip.
 *
 *   pnpm tsx --env-file=.env.local scripts/reprice-hill-from-dropship-feed.ts
 *   pnpm tsx --env-file=.env.local scripts/reprice-hill-from-dropship-feed.ts --apply
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { columnReader, parseCsv } from "./lib/csv";
import { hillCarriage } from "./lib/hill-carriage";
import { cashKept, promotionTier } from "./lib/promotion-tier";

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

/**
 * The feed, exported from Hill's trade portal.
 *
 * This used to default to a path under /root/.claude/uploads. Container
 * rebuilds delete those, so the default was a file that no longer exists and
 * the failure looked like a missing feed rather than a stale constant. Pass
 * --feed=, or set HILL_DROPSHIP_CSV.
 */
function dropshipCsv(): string {
  const arg = process.argv.find((a) => a.startsWith("--feed="));
  const path = arg
    ? arg.slice("--feed=".length)
    : process.env.HILL_DROPSHIP_CSV;
  if (!path) {
    console.error(
      "No feed. Pass --feed=/path/to/HillInteriorsDropship.csv (export it today),\n" +
        "or set HILL_DROPSHIP_CSV.",
    );
    process.exit(1);
  }
  return path;
}

const VAT = 1.2;
const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

/** Aim here first — a saving a shopper can see, not a price match. */
const RRP_UNDERCUT = 0.05;
/** Preferred floor. */
const TARGET_MARGIN = 0.2;
/** Absolute floor. Below this a sale is not worth making. */
const HARD_FLOOR = 0.17;

/**
 * Carriage ex VAT, from scripts/lib/hill-carriage.ts.
 *
 * The previous version of this banded on weight alone and consulted
 * `Delivery Size` only when weight was missing. That is backwards: the column
 * chooses the rate card and weight only chooses the band inside it. A 15kg
 * Large sideboard was costed at £9.99 when Hill charged £49.99, which fed
 * every margin figure this script produced.
 */
function carriageExVat(weightKg: number | null, deliverySize: string): number {
  return hillCarriage({ weightKg, deliverySize }).exVat;
}

/**
 * The tiers, from scripts/lib/promotion-tier.ts.
 *
 * This file used to carry its own copy under a comment saying it was "kept
 * identical on purpose". It was, until the shared version gained the `basket`
 * route — which is exactly how two copies stop being identical.
 */

/** Same formula the tiers use, so a reprice and a tier cannot disagree. */
const netKeep = (price: number, cost: number, ship: number) =>
  cashKept(price, cost, ship);

/** Lowest price clearing `margin` once cost and carriage are paid. */
const priceForMargin = (cost: number, ship: number, margin: number) =>
  Math.ceil((cost + ship + CARD_FIXED) / (1 - CARD_RATE - margin));

interface Feed {
  code: string;
  title: string;
  priceExVat: number;
  rrp: number;
  stock: number;
  weight: number | null;
  deliverySize: string;
  status: string;
}

function readFeed(): Map<string, Feed> {
  const rows = parseCsv(readFileSync(dropshipCsv(), "utf8"));
  const at = columnReader(rows[0]!);
  const out = new Map<string, Feed>();
  for (const r of rows.slice(1)) {
    if (!r[0]) continue;
    const weight = Number(at(r, "Weight"));
    out.set(r[0]!.trim(), {
      code: r[0]!.trim(),
      title: at(r, "Title"),
      priceExVat: Number(at(r, "Price")),
      rrp: Number(at(r, "RRP")),
      stock: Number(at(r, "Available Stock")) || 0,
      weight: weight > 0 ? weight : null,
      deliverySize: at(r, "Delivery Size"),
      status: at(r, "Status"),
    });
  }
  return out;
}

interface Product {
  _id: string;
  title: string;
  slug: string | null;
  code: string | null;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  promotionTier: string | null;
  draft: boolean;
}

async function main() {
  const feed = readFeed();
  const products = await client.fetch<Product[]>(
    `*[_type=="product" && supplier->name=="Hill Interiors"]{
      _id, title, "slug": slug.current,
      "code": coalesce(supplierSku, sku),
      price, costPrice, shippingCost, promotionTier,
      "draft": _id in path("drafts.**") }`,
  );

  const changes: Record<string, unknown>[] = [];
  const unviable: Record<string, unknown>[] = [];
  let unmatched = 0;
  const tiersBefore: Record<string, number> = {};
  const tiersAfter: Record<string, number> = {};

  for (const p of products) {
    const row = feed.get(String(p.code ?? "").trim());
    if (!row || row.priceExVat <= 0 || row.rrp <= 0) {
      unmatched++;
      continue;
    }

    const cost = Number((row.priceExVat * VAT).toFixed(2));
    const ship = Number(
      (carriageExVat(row.weight, row.deliverySize) * VAT).toFixed(2),
    );

    const wanted = Math.ceil(row.rrp * (1 - RRP_UNDERCUT));
    const at20 = priceForMargin(cost, ship, TARGET_MARGIN);
    const at17 = priceForMargin(cost, ship, HARD_FLOOR);

    let price: number;
    let basis: string;
    if (wanted >= at20) {
      price = wanted;
      basis = `5% under RRP, clears ${TARGET_MARGIN * 100}%`;
    } else if (row.rrp >= at20) {
      price = at20;
      basis = `lowest price holding ${TARGET_MARGIN * 100}%, still under RRP`;
    } else if (row.rrp >= at17) {
      price = at17;
      basis = `lowest price holding ${HARD_FLOOR * 100}%, still under RRP`;
    } else {
      const keepAtRrp = netKeep(row.rrp, cost, ship);
      unviable.push({
        _id: p._id,
        title: p.title.replace(" | Kaiku", ""),
        code: row.code,
        rrp: row.rrp,
        cost,
        ship,
        marginAtRrp: Number(((keepAtRrp / row.rrp) * 100).toFixed(1)),
        needsFor17: at17,
        reason: `even at Hill's own RRP of £${row.rrp} it keeps ${((keepAtRrp / row.rrp) * 100).toFixed(1)}% — carriage of £${ship} is the reason`,
      });
      continue;
    }

    const keep = netKeep(price, cost, ship);
    // The shared tier takes cost and carriage rather than the already-netted
    // keep, because the basket route has to re-derive the figure with carriage
    // excluded — a second item in a consignment does not pay it again.
    const tier = promotionTier(price, cost, ship);
    const before = p.promotionTier ?? "unset";
    tiersBefore[before] = (tiersBefore[before] ?? 0) + 1;
    tiersAfter[tier] = (tiersAfter[tier] ?? 0) + 1;

    changes.push({
      _id: p._id,
      draft: p.draft,
      title: p.title.replace(" | Kaiku", ""),
      slug: p.slug,
      code: row.code,
      inStock: row.stock,
      status: row.status,
      rrp: row.rrp,
      costWas: p.costPrice,
      cost,
      shipWas: p.shippingCost,
      ship,
      priceWas: p.price,
      price,
      basis,
      keep: Number(keep.toFixed(2)),
      margin: Number(((keep / price) * 100).toFixed(1)),
      undercutVsRrp: Number((row.rrp - price).toFixed(2)),
      tierWas: before,
      tier,
    });
  }

  const sellable = changes.filter(
    (c) => (c.inStock as number) > 0 && c.status === "ACT",
  );
  const promotable = sellable.filter(
    (c) => c.tier === "strong" || c.tier === "viable" || c.tier === "cash",
  );

  console.log(`\nHill Interiors, rebuilt from the dropship feed.\n`);
  console.log(`  products in Sanity:            ${products.length}`);
  console.log(
    `  matched to a dropship code:    ${changes.length + unviable.length}`,
  );
  console.log(`  no match in the feed:          ${unmatched}`);
  console.log(`  repriced:                      ${changes.length}`);
  console.log(`  left alone as unviable at RRP: ${unviable.length}\n`);

  const costFixed = changes.filter(
    (c) =>
      c.costWas == null ||
      Math.abs((c.costWas as number) - (c.cost as number)) > 0.02,
  ).length;
  const shipFixed = changes.filter(
    (c) =>
      c.shipWas == null ||
      Math.abs((c.shipWas as number) - (c.ship as number)) > 0.02,
  ).length;
  console.log(`  cost price corrected on:       ${costFixed}`);
  console.log(`  carriage corrected on:         ${shipFixed}\n`);

  console.log(`  In stock and active: ${sellable.length}`);
  console.log(`  Promotable of those: ${promotable.length}`);
  const tierCount = (tier: string) =>
    sellable.filter((c) => c.tier === tier).length;
  for (const tier of ["strong", "viable", "cash", "below"])
    console.log(`      ${tier.padEnd(7)} ${tierCount(tier)}`);

  const margins = sellable.map((c) => c.margin as number).sort((a, b) => a - b);
  if (margins.length)
    console.log(
      `\n  Margin across sellable: min ${margins[0]}%, median ${margins[Math.floor(margins.length / 2)]}%, max ${margins[margins.length - 1]}%`,
    );

  const top = [...promotable]
    .sort((a, b) => (b.keep as number) - (a.keep as number))
    .slice(0, 12);
  console.log(`\n  Best twelve by cash kept per sale:\n`);
  for (const c of top)
    console.log(
      `    £${String(c.keep).padStart(7)}  ${String(c.margin).padStart(5)}%  ${c.tier as string}` +
        `   £${c.price as number} (RRP £${c.rrp as number})  ${(c.title as string).slice(0, 44)}`,
    );

  if (unviable.length) {
    const worst = unviable.slice(0, 6);
    console.log(
      `\n  ${unviable.length} cannot clear ${HARD_FLOOR * 100}% even at Hill's RRP. First few:\n`,
    );
    for (const u of worst)
      console.log(
        `    RRP £${String(u.rrp).padStart(7)}  cost £${u.cost as number} + carriage £${u.ship as number}` +
          `  → ${u.marginAtRrp as number}%   ${(u.title as string).slice(0, 40)}`,
      );
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-15-hill-dropship-reprice.json",
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        vat: VAT,
        rrpUndercut: RRP_UNDERCUT,
        targetMargin: TARGET_MARGIN,
        hardFloor: HARD_FLOOR,
        changes,
        unviable,
      },
      null,
      2,
    )}\n`,
  );

  if (!apply) return console.log("\nDry run — re-run with --apply.");

  for (const c of changes)
    await client
      .patch(c._id as string)
      .set({
        costPrice: c.cost as number,
        shippingCost: c.ship as number,
        price: c.price as number,
        promotionTier: c.tier as string,
        costPriceVatCorrected: true,
      })
      .commit();

  console.log(`\nRepriced ${changes.length} Hill products from the feed.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
