/**
 * What a Hill Interiors product actually costs Kaiku, and whether it can be sold
 * at a competitive price at all.
 *
 * Damien: "you need to account for cost prices, vat and shipping."
 *
 * So the landed cost of one unit is all three, not just the trade price:
 *
 *   landed = costPrice × 1.20        trade price plus VAT Kaiku cannot reclaim
 *          + shippingCost × 1.20     carriage plus VAT, per Hill's terms
 *          + price × 1.5% + 20p      card processing
 *
 * Kaiku is not VAT-registered, so the 20% Hill add to their invoice is a real
 * cost and not a pass-through. Hill's own site: "All prices ... will be subject
 * to additional VAT and surcharge costs."
 *
 * The point of this script is not to set prices. It is to show which products
 * are viable at all, because for some of them the answer is no: the landed cost
 * is above what the market sells them for, and no margin floor can fix that.
 * A £19.86 landed cost on a candle the rest of the trade sells at £19.99 is not
 * a pricing problem, it is a product that should not be dropshipped one at a
 * time.
 *
 * CARRIAGE IS PER CONSIGNMENT. Hill band the whole parcel by weight, so £6.99
 * covers everything up to 10kg in one shipment. Every product is therefore shown
 * at three allocations — carriage carried alone, split two ways, split three
 * ways — because that spread is the actual decision. It is also the correction
 * to my own reprice, which charged every item its full carriage and so raised
 * the cheap end above the market.
 *
 * Read-only. Sets no prices.
 *
 *   pnpm tsx --env-file=.env.local scripts/hill-viability-with-vat.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

const VAT = 1.2;
const CARD_PCT = 0.015;
const CARD_FIXED = 0.2;
/** Damien's tiers, unchanged. */
const SMALL_THRESHOLD = 50;
const SMALL_FLOOR = 0.17;
const LARGE_FLOOR = 0.2;

/**
 * Competitor prices gathered by hand on 2 September 2026, matched on product
 * name and confirmed on dimensions. Only the cheapest found is recorded — the
 * question is whether we can be the cheapest, so the cheapest is the bar.
 * See docs/research/hill-interiors-competitor-prices.md for the sources.
 */
const COMPETITOR: Record<string, { cheapest: number; where: string }> = {
  "Provence Collection Outdoor 4 Seater Dining Set": {
    cheapest: 1295,
    where: "Style Our Home",
  },
  "Capri Collection Outdoor Foot Stool": {
    cheapest: 320,
    where: "Norfolk Luxury",
  },
  "Antique Gold Hare Table Lamp With Green Velvet Shade": {
    cheapest: 99.95,
    where: "Decor Sanctuary",
  },
  "Garda Grey Glazed Juniper Vase": {
    cheapest: 128.99,
    where: "My Italian Living",
  },
  "Vellis Blue Wingback Armchair": { cheapest: 355.81, where: "ManoMano" },
  "Luxe Collection Natural Glow S/ 2 Ivory LED Dinner Candles": {
    cheapest: 19.99,
    where: "Avoir Interiors",
  },
};

/** Minimum price clearing `floor`, given a fixed landed cost before card fees. */
function minPrice(goods: number, floor: number): number {
  return (goods + CARD_FIXED) / (1 - CARD_PCT - floor);
}

interface Row {
  title: string;
  price: number;
  costPrice: number;
  shippingCost: number | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && supplier->name=="Hill Interiors"
       && defined(price) && defined(costPrice) && defined(shippingCost)]{
      title, price, costPrice, shippingCost
    }`,
  );

  const out = rows.map((r) => {
    const costVat = r.costPrice * VAT;
    const shipVat = (r.shippingCost ?? 0) * VAT;
    const floor = r.price < SMALL_THRESHOLD ? SMALL_FLOOR : LARGE_FLOOR;

    // Carriage carried by 1, 2 or 3 items in the same consignment.
    const needed = [1, 2, 3].map((split) =>
      minPrice(costVat + shipVat / split, floor),
    );
    const fee = r.price * CARD_PCT + CARD_FIXED;
    const netNow = r.price - costVat - shipVat - fee;

    const key = r.title.replace(" | Kaiku", "");
    const comp = COMPETITOR[key];

    return {
      title: key,
      price: r.price,
      costVat: +costVat.toFixed(2),
      shipVat: +shipVat.toFixed(2),
      landedSolo: +(costVat + shipVat).toFixed(2),
      netNowSolo: +netNow.toFixed(2),
      neededSolo: +needed[0]!.toFixed(2),
      neededSplit2: +needed[1]!.toFixed(2),
      neededSplit3: +needed[2]!.toFixed(2),
      competitor: comp?.cheapest ?? null,
      competitorWhere: comp?.where ?? null,
      /** Viable solo only if the floor price is at or under the market price. */
      viableSolo: comp ? needed[0]! <= comp.cheapest : null,
      viableSplit3: comp ? needed[2]! <= comp.cheapest : null,
    };
  });

  const negative = out.filter((o) => o.netNowSolo <= 0);
  console.log(`Hill products with cost and carriage: ${out.length}`);
  console.log(
    `\nWith VAT on cost AND carriage, at today's prices, LOSING MONEY on a solo order: ${negative.length}`,
  );
  for (const o of [...negative]
    .sort((a, b) => a.netNowSolo - b.netNowSolo)
    .slice(0, 30)) {
    console.log(
      `  £${o.price.toFixed(2).padStart(8)}  landed £${o.landedSolo.toFixed(2).padStart(8)}  => £${o.netNowSolo.toFixed(2).padStart(8)}   ${o.title.slice(0, 46)}`,
    );
  }

  const under = out.filter((o) => {
    const floor = o.price < SMALL_THRESHOLD ? SMALL_FLOOR : LARGE_FLOOR;
    return o.netNowSolo / o.price < floor;
  });
  console.log(
    `\nBelow their tier floor on a solo order: ${under.length} of ${out.length}`,
  );

  console.log(`\n--- The six with a known competitor price ---`);
  for (const o of out.filter((x) => x.competitor !== null)) {
    console.log(`\n${o.title}`);
    console.log(
      `  ours £${o.price}   cheapest rival £${o.competitor} (${o.competitorWhere})`,
    );
    console.log(
      `  cost+VAT £${o.costVat}  carriage+VAT £${o.shipVat}  landed solo £${o.landedSolo}`,
    );
    console.log(
      `  net at today's price, solo order: £${o.netNowSolo} (${((o.netNowSolo / o.price) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  price needed to clear the floor:  solo £${o.neededSolo}   2 items £${o.neededSplit2}   3 items £${o.neededSplit3}`,
    );
    console.log(
      `  can we beat them?  solo: ${o.viableSolo ? "YES" : "NO"}   in a 3-item order: ${o.viableSplit3 ? "YES" : "NO"}`,
    );
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-hill-viability-with-vat.json",
    JSON.stringify(
      { vat: VAT, cardPct: CARD_PCT, cardFixed: CARD_FIXED, rows: out },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
