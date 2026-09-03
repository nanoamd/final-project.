/**
 * Prices and writes SEO meta for the five Hill Interiors garden furniture sets
 * imported by scripts/import-hill-garden-furniture-sets.ts.
 *
 * The import deliberately wrote no retail price. This applies Damien's tiered
 * margin floor — the same arithmetic scripts/reprice-hill-interiors-with-carriage.ts
 * used on the other 139 Hill products, so these five sit on the same rule as the
 * rest of the range rather than on a price I invented:
 *
 *   landed = costPrice x 1.2 (VAT on cost, unreclaimed) + shippingCost x 1.2
 *            + (price x 1.5% + 20p) card fees
 *   floor  = 20% net for anything £50 and up
 *   p      = (c + s + 0.20) / (0.985 - 0.20)
 *
 * Every one of these five is a two-man delivery on which the customer pays £0
 * shipping, so carriage is cost of goods on every order. That is why the floor
 * lands where it does.
 *
 * The drafts stay drafts. Publishing is Damien's call.
 *
 *   pnpm tsx --env-file=.env.local scripts/price-hill-garden-furniture-sets.ts
 *   pnpm tsx --env-file=.env.local scripts/price-hill-garden-furniture-sets.ts --apply
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

const CODES = ["23913", "24513", "23912", "23914", "23099"] as const;
const LARGE_FLOOR = 0.2;
const CARD_PCT = 0.015;
const CARD_FIXED = 0.2;
const VAT_MULTIPLIER = 1.2;

function minPriceForFloor(cost: number, ship: number, floor: number): number {
  return (cost + ship + CARD_FIXED) / (1 - CARD_PCT - floor);
}

/** Meta description copy, keyed by product code. Written, not templated. */
const META: Record<string, { title: string; description: string }> = {
  "23913": {
    title: "Capri Large Corner Sofa & Coffee Table Set | Kaiku",
    description:
      "A large flat-weave corner sofa and matching coffee table in the Capri collection, built on a powder-coated aluminium frame with deep seat and back cushions. Free two-man delivery to most of the UK.",
  },
  "24513": {
    title: "Provence 4 Seater Outdoor Lounge Set | Kaiku",
    description:
      "Two armchairs, a two-seater sofa and a coffee table in the Provence collection — woven rattan over aluminium, sized for a patio rather than a garden. Free two-man delivery to most of the UK.",
  },
  "23912": {
    title: "Amalfi Large Outdoor Corner Sofa Set | Kaiku",
    description:
      "The Amalfi large corner set: a deep modular corner sofa in flat-weave rattan with thick all-weather cushions and an aluminium frame. Free two-man delivery to most of the UK.",
  },
  "23914": {
    title: "Amalfi Corner Set, Riser Table & 2 Stools | Kaiku",
    description:
      "An Amalfi corner sofa with a height-adjustable riser table and two matching stools — dining height for a meal, coffee height for the evening. Free two-man delivery to most of the UK.",
  },
  "23099": {
    title: "Capri Corner Set, Riser Table & 2 Stools | Kaiku",
    description:
      "The largest Capri configuration: a corner sofa, a riser table that lifts from coffee to dining height, and two stools that tuck underneath. Free two-man delivery to most of the UK.",
  },
};

type Row = {
  _id: string;
  title: string;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

async function main() {
  const ids = CODES.map((c) => `drafts.product-hill-${c}`);
  const rows = await client.fetch<Row[]>(
    `*[_id in $ids]{_id, title, price, costPrice, shippingCost,
      "metaTitle": seo.metaTitle, "metaDescription": seo.metaDescription}`,
    { ids },
  );

  if (rows.length !== CODES.length) {
    console.error(
      `Expected ${CODES.length} drafts, found ${rows.length}. Run the import first.`,
    );
    process.exit(1);
  }

  const tx = client.transaction();
  const results: unknown[] = [];

  for (const code of CODES) {
    const row = rows.find((r) => r._id === `drafts.product-hill-${code}`);
    if (!row) continue;
    const meta = META[code];
    if (!meta) continue;

    const trade = row.costPrice ?? 0;
    const carriage = row.shippingCost ?? 0;
    const cost = trade * VAT_MULTIPLIER;
    const ship = carriage * VAT_MULTIPLIER;
    const price = Math.ceil(minPriceForFloor(cost, ship, LARGE_FLOOR));
    const landed = cost + ship + (price * CARD_PCT + CARD_FIXED);
    const margin = (price - landed) / price;

    console.log(row.title.replace(" | Kaiku", ""));
    console.log(
      `   trade £${trade}  +VAT £${cost.toFixed(2)}   carriage £${carriage}  +VAT £${ship.toFixed(2)}`,
    );
    console.log(
      `   price £${price}   landed £${landed.toFixed(2)}   net margin ${(margin * 100).toFixed(1)}%  (£${(price - landed).toFixed(2)})`,
    );
    console.log(`   meta  ${meta.title}  (${meta.title.length} chars)`);
    console.log(`         ${meta.description.length}-char description`);
    console.log("");

    results.push({
      code,
      id: row._id,
      title: row.title,
      trade,
      carriage,
      price,
      landed: Number(landed.toFixed(2)),
      marginPct: Number((margin * 100).toFixed(1)),
      metaTitle: meta.title,
      hadPrice: row.price,
      hadMeta: row.metaTitle,
    });

    if (apply) {
      tx.patch(row._id, (p) =>
        p.set({
          price,
          "seo.metaTitle": meta.title,
          "seo.metaDescription": meta.description,
        }),
      );
    }
  }

  if (apply) {
    await tx.commit();
    console.log(`Priced and meta-tagged ${results.length} drafts.`);
  } else {
    console.log("Dry run — pass --apply to write these.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-03-price-hill-garden-furniture-sets.json",
    `${JSON.stringify(
      {
        apply,
        rule: "20% net floor over trade+VAT, carriage+VAT and 1.5%+20p card fees",
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
