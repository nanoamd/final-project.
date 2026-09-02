/**
 * How far above the market the profitable price lands.
 *
 * Damien's decision: "we will just be profitable and not compete but try and
 * stay close to competitors prices." Pricing at the exact floor minimum is what
 * "as close as possible" means once profit is non-negotiable — but on some
 * products that minimum is still a long way above what rivals charge, and a
 * shopper who finds our candles 35% dearer than everywhere else does not
 * conclude "fair margin", they conclude the whole shop is expensive.
 *
 * So this reports the gap rather than hiding it. A product sitting far above
 * market is not a pricing decision any more — it is a decision about whether to
 * buy it differently (Hill's volume tier is 77.6% of dropship and kills the
 * carriage) or not to list it at all.
 *
 * Competitor prices are the ones gathered by hand on 2 September 2026 and
 * recorded in docs/research/hill-interiors-competitor-prices.md. Only six
 * products have them, which is the honest limit of this: the other 110 repriced
 * items have no market reference at all yet.
 *
 * Read-only.
 *
 *   pnpm tsx --env-file=.env.local scripts/hill-market-gap.ts
 */
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

const COMPETITOR: { title: string; cheapest: number; where: string }[] = [
  {
    title: "Luxe Collection Natural Glow S/ 2 Ivory LED Dinner Candles",
    cheapest: 19.99,
    where: "Avoir Interiors",
  },
  {
    title: "Garda Grey Glazed Juniper Vase",
    cheapest: 128.99,
    where: "My Italian Living",
  },
  {
    title: "Antique Gold Hare Table Lamp With Green Velvet Shade",
    cheapest: 99.95,
    where: "Decor Sanctuary",
  },
  {
    title: "Capri Collection Outdoor Foot Stool",
    cheapest: 320,
    where: "Norfolk Luxury",
  },
  {
    title: "Provence Collection Outdoor 4 Seater Dining Set",
    cheapest: 1295,
    where: "Style Our Home",
  },
  {
    title: "Vellis Blue Wingback Armchair",
    cheapest: 355.81,
    where: "ManoMano",
  },
];

/** Above this, the price is far enough from the market to need a decision. */
const CONCERN_PCT = 10;

async function main() {
  const rows: {
    title: string;
    ours: number;
    cheapest: number;
    where: string;
    gap: number;
    gapPct: number;
  }[] = [];

  for (const c of COMPETITOR) {
    const p = await client.fetch<{ price: number } | null>(
      `*[_type=="product" && !(_id in path("drafts.**")) && title match $q][0]{price}`,
      { q: `${c.title}*` },
    );
    if (!p) {
      console.error(`NOT FOUND: ${c.title}`);
      continue;
    }
    const gap = p.price - c.cheapest;
    rows.push({
      title: c.title,
      ours: p.price,
      cheapest: c.cheapest,
      where: c.where,
      gap: +gap.toFixed(2),
      gapPct: +((gap / c.cheapest) * 100).toFixed(1),
    });
  }

  rows.sort((a, b) => b.gapPct - a.gapPct);

  console.log(
    "Product".padEnd(50) +
      "ours".padStart(10) +
      "cheapest".padStart(11) +
      "gap".padStart(10) +
      "  vs market",
  );
  for (const r of rows) {
    const flag =
      r.gapPct <= 0
        ? "CHEAPEST"
        : r.gapPct <= CONCERN_PCT
          ? "close"
          : "FAR ABOVE";
    console.log(
      r.title.slice(0, 48).padEnd(50) +
        `£${r.ours.toFixed(2)}`.padStart(10) +
        `£${r.cheapest.toFixed(2)}`.padStart(11) +
        `${r.gap >= 0 ? "+" : ""}${r.gap.toFixed(2)}`.padStart(10) +
        `  ${r.gapPct >= 0 ? "+" : ""}${r.gapPct}%  ${flag}`,
    );
  }

  const far = rows.filter((r) => r.gapPct > CONCERN_PCT);
  console.log(
    `\n${far.length} of ${rows.length} priced more than ${CONCERN_PCT}% above the cheapest rival.`,
  );
  if (far.length) {
    console.log(
      "These are not pricing decisions any more — they are buy-differently-or-delist decisions.",
    );
    for (const r of far)
      console.log(`  ${r.title} — ${r.gapPct}% above ${r.where}`);
  }
  console.log(
    `\nOnly ${rows.length} of the repriced products have a market reference. The rest are unchecked.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
