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

const DROPSHIP_CSV =
  process.env.HILL_DROPSHIP_CSV ??
  "/root/.claude/uploads/faaf1922-1604-5b81-b3ee-c4782f0da6af/417a1813-HillInteriorsDropship-2.csv";

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
 * Hill's published rate card, ex VAT. Standard courier to 40kg; above that this
 * catalogue is sofas and dining sets that a single courier will not carry, so
 * the two-man bands apply.
 */
const BANDS: { maxKg: number; amount: number }[] = [
  { maxKg: 10, amount: 6.99 },
  { maxKg: 20, amount: 9.99 },
  { maxKg: 40, amount: 14.99 },
  { maxKg: 60, amount: 59.99 },
  { maxKg: 100, amount: 69.99 },
  { maxKg: 150, amount: 84.99 },
  { maxKg: 200, amount: 109.99 },
];

function carriageExVat(weightKg: number | null, deliverySize: string): number {
  if (weightKg && weightKg > 0) {
    const band = BANDS.find((b) => weightKg <= b.maxKg);
    return band ? band.amount : BANDS[BANDS.length - 1]!.amount;
  }
  // No weight in the feed for 210 rows. Hill's own Small/Large flag is the
  // only other signal, and guessing light would understate the cost.
  return deliverySize === "Large" ? 59.99 : 6.99;
}

/** The tiers `set-promotion-tier.ts` uses. Kept identical on purpose. */
function promotionTier(price: number, keep: number): string {
  const margin = keep / price;
  if (margin >= 0.35 && keep >= 25) return "strong";
  if (margin >= 0.3 && keep >= 20) return "viable";
  if (price >= 250 && margin >= 0.15) return "cash";
  return "below";
}

const netKeep = (price: number, cost: number, ship: number) =>
  price - cost - ship - (price * CARD_RATE + CARD_FIXED);

/** Lowest price clearing `margin` once cost and carriage are paid. */
const priceForMargin = (cost: number, ship: number, margin: number) =>
  Math.ceil((cost + ship + CARD_FIXED) / (1 - CARD_RATE - margin));

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += char;
    } else if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

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
  const rows = parseCsv(readFileSync(DROPSHIP_CSV, "utf8"));
  const header = rows[0]!;
  const at = (r: string[], name: string) => r[header.indexOf(name)] ?? "";
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
    const tier = promotionTier(price, keep);
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
