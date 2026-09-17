/**
 * Every furniture product we could list on eBay, ranked by cash profit.
 *
 * Damien: _"we have much more furniture products than this, we also have the
 * furniture to go products in sanity."_ Right — the earlier list came off the
 * 128-row marketplace sheet, which was already filtered to promotable stock
 * with confirmed carriage. The furniture catalogue is **409 published
 * products**, every one with a cost price.
 *
 * Furniture rather than the whole catalogue, deliberately. The evidence so far
 * says the money is in big, thinly distributed pieces: the Sorelle sofa took 44
 * clicks and a save at £1,303, while a £59 lamp carried by fifteen shops took
 * 54,000 impressions and almost nothing. Cheap homeware cannot carry a CPC ad
 * either — a £6 vase needs a sale every 13 clicks to break even.
 *
 * FEES, CORRECTED. eBay charges private sellers no final value fee, just an
 * insertion fee past the free allowance. So the floor price is the landed cost
 * plus the card fee and 35p, at a 20% margin — not the 13% this repo assumed
 * for weeks.
 *
 * PERMISSION IS A COLUMN, NOT A FILTER. Hill Interiors and D.I. Designs are the
 * only suppliers with marketplace permission on record. Premier Housewares is
 * 259 of the 409 and has never been asked; AW Dropship and Aosom likewise.
 * Those rows are shown and marked, because "ask Premier" is worth more than any
 * single listing on this page — but nothing goes up until they say yes.
 *
 *   pnpm tsx --env-file=.env.local scripts/rank-furniture-for-ebay.ts
 *   pnpm tsx --env-file=.env.local scripts/rank-furniture-for-ebay.ts --all
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;
const LISTING_FEE = 0.35;
const FLOOR = 0.2;

const FURNITURE = [
  "sofas",
  "coffee-tables",
  "console-tables",
  "side-tables",
  "bedside-tables",
  "tv-units",
  "living-room-storage",
  "shelving",
  "desks",
  "beds",
  "kitchen-furniture",
  "rustic-reclaimed-furniture",
  "bedroom-storage",
  "office-storage",
  "kitchen-storage",
  "bathroom-storage",
  "garden-furniture",
];

interface Row {
  slug: string;
  title: string;
  cat: string | null;
  supplier: string | null;
  allowed: string[] | null;
  price: number | null;
  cost: number | null;
  ship: number | null;
  stockStatus: string | null;
  photos: number;
}

/** Lowest price that still keeps the 20% floor once the card and listing fees come out. */
const floorPrice = (landed: number) =>
  Math.ceil((landed + CARD_FIXED + LISTING_FEE) / (1 - CARD_RATE - FLOOR));

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**"))
       && category->slug.current in $f && defined(price) && defined(costPrice)]{
      "slug": slug.current, title, "cat": category->slug.current,
      "supplier": supplier->name, "allowed": supplier->marketplacesAllowed,
      price, "cost": costPrice, "ship": shippingCost,
      stockStatus, "photos": count(gallery)
    }`,
    { f: FURNITURE },
  );

  const priced = rows
    .filter((r) => !(r.stockStatus ?? "").toLowerCase().includes("out"))
    .map((r) => {
      const landed = r.cost! + (r.ship ?? 0);
      const list = floorPrice(landed);
      const keep =
        list - landed - (list * CARD_RATE + CARD_FIXED) - LISTING_FEE;
      return {
        ...r,
        landed,
        list,
        keep,
        permitted: (r.allowed ?? []).includes("eBay"),
        carriageKnown: r.ship != null,
      };
    })
    .filter((r) => r.keep > 0)
    .sort((a, b) => b.keep - a.keep);

  const permitted = priced.filter((r) => r.permitted);
  const blocked = priced.filter((r) => !r.permitted);

  console.log(
    `\n${priced.length} furniture products in stock with a positive margin.\n`,
  );
  console.log(
    `  ${permitted.length} you can list today (Hill Interiors, D.I. Designs)`,
  );
  console.log(`  ${blocked.length} need a supplier permission first\n`);

  const show = (label: string, list: typeof priced, n = 25) => {
    console.log(`\n${label}\n`);
    console.log(
      `  ${"keep".padStart(7)} ${"list at".padStart(8)} ${"carr".padStart(5)} ${"pics".padStart(4)}  supplier        product`,
    );
    for (const r of list.slice(0, n))
      console.log(
        `  £${r.keep.toFixed(0).padStart(6)} £${r.list.toFixed(0).padStart(7)} ${(r.carriageKnown ? "ok" : "??").padStart(5)} ${String(r.photos).padStart(4)}  ${(r.supplier ?? "?").slice(0, 14).padEnd(14)}  ${r.title.replace(" | Kaiku", "").slice(0, 46)}`,
      );
  };

  show("LIST TODAY — permitted, ranked by cash profit", permitted, 30);
  if (!process.argv.includes("--all")) {
    console.log(
      `\n  (${permitted.length - 30 > 0 ? permitted.length - 30 : 0} more permitted products in the CSV)`,
    );
  }
  show(
    "BLOCKED — worth a permission email, ranked by what it would unlock",
    blocked,
    12,
  );

  const bySup = new Map<string, { n: number; cash: number }>();
  for (const r of blocked) {
    const e = bySup.get(r.supplier ?? "?") ?? { n: 0, cash: 0 };
    e.n++;
    e.cash += r.keep;
    bySup.set(r.supplier ?? "?", e);
  }
  console.log("\nWHAT EACH PERMISSION WOULD UNLOCK\n");
  for (const [k, v] of [...bySup.entries()].sort(
    (a, b) => b[1].cash - a[1].cash,
  ))
    console.log(
      `  ${String(v.n).padStart(4)} products, £${v.cash.toFixed(0).padStart(6)} of profit if each sold once   ${k}`,
    );

  mkdirSync("docs/change-log", { recursive: true });
  const csv = [
    "keep,listAt,landedCost,sitePrice,permitted,carriageKnown,photos,supplier,category,title,slug",
    ...priced.map((r) =>
      [
        r.keep.toFixed(2),
        r.list,
        r.landed.toFixed(2),
        r.price,
        r.permitted ? "yes" : "ASK SUPPLIER",
        r.carriageKnown ? "yes" : "NO",
        r.photos,
        `"${r.supplier ?? ""}"`,
        r.cat ?? "",
        `"${r.title.replace(" | Kaiku", "").replace(/"/g, "'")}"`,
        r.slug,
      ].join(","),
    ),
  ];
  const out = "docs/change-log/2026-09-17-furniture-ebay-ranked.csv";
  writeFileSync(out, `${csv.join("\n")}\n`);
  console.log(`\n  -> ${out}\n`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
