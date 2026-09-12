/**
 * Which products cannot be made to work by pricing, and which are priced
 * higher than they need to be.
 *
 * Damien: "why cant we just alter the prices to make every single product
 * worth it" — then, on being shown that the profitable price is sometimes
 * already above what rivals charge: "yes and make sure the price of them makes
 * them as likely as possible to sell".
 *
 * Two different questions, and they need opposite answers, so this separates
 * them rather than producing one list.
 *
 *   DOOMED      The price needed to clear a viable margin is so far above
 *               today's price that no shopper would pay it. Hill's own terms
 *               are the clearest case: a £20 item carrying £6.99 of dropship
 *               carriage cannot be sold at market price at all. Raising the
 *               price does not rescue these, it just converts a thin-margin
 *               product into a zero-sales product. These are a delist
 *               conversation, not a repricing one.
 *
 *   OVERPRICED  The opposite problem: margin comfortably clear of the floor,
 *               meaning the price could come down, the product would still
 *               pay, and it would be likelier to sell. This is the only set
 *               where "price it to sell" is both safe and true.
 *
 *   BLEEDING    Keeping less than nothing at today's price. Every sale costs
 *               money. Listed separately because it is urgent rather than
 *               strategic.
 *
 * The required price solves for a target net margin after card fees:
 *   p - cost - carriage - (p*rate + fixed) = target * p
 * which rearranges to p = (cost + carriage + fixed) / (1 - rate - target).
 *
 * **A caution that governs how far this can be trusted.** 639 published
 * products have no `shippingCost` recorded, and the supplier carriage and VAT
 * rules that would settle them have not been written down yet. For those, the
 * margin here is a ceiling and the real one is lower — so a product that looks
 * merely thin may in fact be bleeding. Every output below is split by whether
 * carriage is known, and nothing in the unknown half should be acted on until
 * it is.
 *
 * Read-only. Changes nothing.
 *   pnpm tsx --env-file=.env.local scripts/audit-structurally-unviable.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

/** The net margin a product should reach to be worth the listing effort. */
const TARGET_MARGIN = 0.3;

/**
 * How far a price can rise before it stops being a market price.
 *
 * Not a law — a judgement, stated here so it can be moved. The six Hill
 * products price-checked on 2 September needed uplifts of roughly 3% to 27%
 * to clear their floor, and the two largest (Capri footstool at +3%, Provence
 * set at +17%) were both already above the cheapest rival. So a product
 * needing more than a quarter on top of today's price is not one uplift away
 * from working; it is in the wrong catalogue.
 */
const MAX_PLAUSIBLE_UPLIFT = 0.25;

/** Below this cash kept, one support email or one return costs more than the sale. */
const TRIVIAL_KEEP = 5;

/** Margin this far above target means the price has room to come down. */
const OVERPRICED_MARGIN = 0.45;

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
}

interface Assessed {
  slug: string | null;
  title: string;
  supplier: string;
  category: string;
  price: number;
  cost: number;
  carriage: number;
  keep: number;
  margin: number;
  requiredPrice: number;
  upliftNeeded: number;
  /** Price that still clears the target margin — the floor it could fall to. */
  floorPrice: number;
  carriageKnown: boolean;
  carriageShareOfCost: number;
}

function requiredPriceFor(cost: number, carriage: number): number {
  return (cost + carriage + CARD_FIXED) / (1 - CARD_RATE - TARGET_MARGIN);
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      _id, title, "slug": slug.current, price, costPrice, shippingCost,
      "supplier": supplier->name,
      "category": category->title,
      "carriageIncluded": supplier->carriageIncludedInCost
    }`,
  );

  const assessed: Assessed[] = rows
    .filter(
      (r) => typeof r.price === "number" && typeof r.costPrice === "number",
    )
    .map((r) => {
      const price = r.price!;
      const cost = r.costPrice!;
      const carriageKnown =
        r.shippingCost !== null || Boolean(r.carriageIncluded);
      const carriage = r.shippingCost ?? 0;
      const keep = price - cost - carriage - (price * CARD_RATE + CARD_FIXED);
      const required = requiredPriceFor(cost, carriage);
      return {
        slug: r.slug,
        title: r.title.replace(" | Kaiku", ""),
        supplier: r.supplier ?? "(none)",
        category: r.category ?? "(none)",
        price,
        cost,
        carriage,
        keep,
        margin: price > 0 ? keep / price : 0,
        requiredPrice: required,
        upliftNeeded: price > 0 ? required / price - 1 : 0,
        floorPrice: required,
        carriageKnown,
        carriageShareOfCost: cost > 0 ? carriage / cost : 0,
      };
    });

  const bleeding = assessed.filter((p) => p.keep < 0);
  const doomed = assessed.filter(
    (p) =>
      p.keep >= 0 &&
      (p.upliftNeeded > MAX_PLAUSIBLE_UPLIFT || p.keep < TRIVIAL_KEEP),
  );
  const overpriced = assessed.filter(
    (p) => p.margin >= OVERPRICED_MARGIN && p.price > p.floorPrice,
  );

  const split = (list: Assessed[]) => ({
    known: list.filter((p) => p.carriageKnown).length,
    unknown: list.filter((p) => !p.carriageKnown).length,
  });

  console.log(`\n${assessed.length} published products with cost and price.\n`);

  const b = split(bleeding);
  const d = split(doomed);
  const o = split(overpriced);

  console.log(
    `BLEEDING    losing money at today's price          ${String(bleeding.length).padStart(4)}   (carriage known ${b.known}, unknown ${b.unknown})`,
  );
  console.log(
    `DOOMED      needs >${Math.round(MAX_PLAUSIBLE_UPLIFT * 100)}% uplift, or keeps <£${TRIVIAL_KEEP}   ${String(doomed.length).padStart(4)}   (carriage known ${d.known}, unknown ${d.unknown})`,
  );
  console.log(
    `OVERPRICED  margin >=${Math.round(OVERPRICED_MARGIN * 100)}%, could come down       ${String(overpriced.length).padStart(4)}   (carriage known ${o.known}, unknown ${o.unknown})`,
  );

  // Carriage as the specific killer: the "£20 item, £6.99 carriage" shape.
  const carriageKilled = doomed
    .filter((p) => p.carriageKnown && p.carriageShareOfCost >= 0.25)
    .sort((a, b2) => b2.carriageShareOfCost - a.carriageShareOfCost);
  console.log(
    `\nOf the doomed with carriage actually recorded, ${carriageKilled.length} are killed by carriage specifically` +
      ` (carriage >=25% of the item cost).`,
  );

  const bySupplier = new Map<string, { doomed: number; total: number }>();
  for (const p of assessed) {
    const e = bySupplier.get(p.supplier) ?? { doomed: 0, total: 0 };
    e.total += 1;
    if (bleeding.includes(p) || doomed.includes(p)) e.doomed += 1;
    bySupplier.set(p.supplier, e);
  }
  console.log("\nUnviable share by supplier");
  for (const [name, e] of [...bySupplier.entries()].sort(
    (a, b2) => b2[1].doomed / b2[1].total - a[1].doomed / a[1].total,
  )) {
    console.log(
      `  ${String(e.doomed).padStart(4)}/${String(e.total).padEnd(5)} ${String(Math.round((e.doomed / e.total) * 100)).padStart(4)}%   ${name}`,
    );
  }

  console.log("\nWorst 12 bleeding (every sale costs money)");
  for (const p of [...bleeding]
    .sort((a, b2) => a.keep - b2.keep)
    .slice(0, 12)) {
    console.log(
      `  ${p.keep >= 0 ? " " : "-"}£${Math.abs(p.keep).toFixed(2).padStart(7)}  ` +
        `price £${p.price.toFixed(2).padStart(8)}  cost £${p.cost.toFixed(2).padStart(8)}  ` +
        `carr £${p.carriage.toFixed(2).padStart(6)}${p.carriageKnown ? " " : "?"}  ${p.title.slice(0, 40)}`,
    );
  }

  console.log(
    `\nOverpriced, with carriage known — safe to reduce (top 12 by room):`,
  );
  const reducible = overpriced
    .filter((p) => p.carriageKnown)
    .sort((a, b2) => b2.price - b2.floorPrice - (a.price - a.floorPrice));
  if (!reducible.length) {
    console.log(
      "  none — every product with known carriage is at or under its floor.",
    );
  }
  for (const p of reducible.slice(0, 12)) {
    console.log(
      `  £${p.price.toFixed(2).padStart(8)} -> £${p.floorPrice.toFixed(2).padStart(8)}  ` +
        `(${Math.round(p.margin * 100)}% -> ${Math.round(TARGET_MARGIN * 100)}%)  ${p.title.slice(0, 42)}`,
    );
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-12-structurally-unviable.json",
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        settings: {
          TARGET_MARGIN,
          MAX_PLAUSIBLE_UPLIFT,
          TRIVIAL_KEEP,
          OVERPRICED_MARGIN,
        },
        counts: {
          assessed: assessed.length,
          bleeding: bleeding.length,
          doomed: doomed.length,
          overpriced: overpriced.length,
          carriageKilled: carriageKilled.length,
        },
        bleeding,
        doomed,
        overpriced,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    "\nFull lists: docs/change-log/2026-09-12-structurally-unviable.json",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
