/**
 * Builds the sheet to list from, for eBay and the other marketplaces.
 *
 * Damien: _"i feel like these more medium profit ones we can upload too"_ —
 * right, the top ten was a ranking, not a limit. A marketplace listing costs
 * almost nothing until it sells, so the question per product is not "is this
 * the best" but "does this clear the floor once the marketplace takes its cut".
 *
 * THE FEE IS THE WHOLE STORY. eBay takes about 13% of the sale in home and
 * garden, against roughly 9% on OnBuy. On a product keeping 30% on Kaiku's own
 * site, 13% is nearly half the margin, which is why a price that works here
 * does not automatically work there. So this does not reuse the site price: it
 * computes, per product and per marketplace, the LOWEST price that still keeps
 * the floor after that marketplace's fee, the card fee, the trade cost and
 * carriage.
 *
 * TWO WARNINGS CARRIED IN THE OUTPUT RATHER THAN LEFT IN A CHAT MESSAGE.
 *
 *   RRP IS NOT THE MARKET PRICE. Hill's RRP is what their trade customers are
 *   advised to charge, and `hill-interiors-competitor-prices.md` found real
 *   retailers well below it — a Vellis armchair at £355.81 against a £600 RRP.
 *   The `vsRrp` column therefore says how the price sits against Hill's
 *   recommendation, NOT against what a shopper will find elsewhere. Anything
 *   listed needs a real price check first.
 *
 *   CARRIAGE UNKNOWN IS NOT CARRIAGE FREE. 81 of Aosom's 103 products have no
 *   recorded carriage, so their margins read high and are not. They are in the
 *   sheet, flagged, rather than quietly dropped or quietly trusted.
 *
 *   pnpm tsx --env-file=.env.local scripts/build-marketplace-listing-sheet.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
  perspective: "raw",
});

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;
/** Floor after the marketplace has taken its cut. */
const FLOOR = 0.2;

/**
 * Marketplace fees, as a share of the sale.
 *
 * Both are the published headline rate for home and garden and both should be
 * confirmed against the current rate card before anything is listed — they
 * move, and they vary by category within each site.
 */
const MARKETPLACES = [
  { name: "eBay", fee: 0.13 },
  { name: "OnBuy", fee: 0.09 },
];

/** Hill stock, as at the CSV export. Absent for everyone else. */
const HILL_REPRICE = "docs/change-log/2026-09-15-hill-dropship-reprice.json";

const minPrice = (landed: number, fee: number) =>
  Math.ceil((landed + CARD_FIXED) / (1 - CARD_RATE - fee - FLOOR));

interface Row {
  title: string;
  slug: string | null;
  cat: string | null;
  supplier: string | null;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  gtin: string | null;
  sku: string | null;
  photos: number | null;
  tier: string | null;
}

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**"))
       && count(supplier->marketplacesAllowed) > 0
       && defined(price) && defined(costPrice)]{
      title, "slug": slug.current, "cat": category->slug.current,
      "supplier": supplier->name,
      price, costPrice, shippingCost, gtin, "sku": coalesce(supplierSku, sku),
      "photos": count(gallery), "tier": promotionTier
    }`,
  );

  // Hill stock and RRP, where the reprice recorded them.
  const hill = new Map<
    string,
    { stock: number; rrp: number; status: string }
  >();
  if (existsSync(HILL_REPRICE)) {
    const parsed = JSON.parse(readFileSync(HILL_REPRICE, "utf8")) as {
      changes: { code: string; inStock: number; rrp: number; status: string }[];
    };
    for (const c of parsed.changes)
      hill.set(c.code, { stock: c.inStock, rrp: c.rrp, status: c.status });
  }

  const out = [];
  for (const r of rows) {
    const landed = r.costPrice! + (r.shippingCost ?? 0);
    const feedRow = r.sku ? hill.get(String(r.sku).trim()) : undefined;
    // Out of stock or discontinued in the feed: no point listing it.
    if (feedRow && (feedRow.stock <= 0 || feedRow.status !== "ACT")) continue;

    const entry: Record<string, string | number> = {
      supplier: r.supplier ?? "",
      category: r.cat ?? "",
      title: r.title.replace(" | Kaiku", ""),
      sku: r.sku ?? "",
      gtin: r.gtin ?? "",
      sitePrice: r.price!,
      landedCost: Number(landed.toFixed(2)),
      carriageKnown: r.shippingCost == null ? "NO — margin overstated" : "yes",
      photos: r.photos ?? 0,
      tier: r.tier ?? "",
      rrp: feedRow ? feedRow.rrp : "",
      stock: feedRow ? feedRow.stock : "",
    };
    let anyViable = false;
    for (const m of MARKETPLACES) {
      const p = minPrice(landed, m.fee);
      entry[`min${m.name}`] = p;
      const keep = p - landed - (p * CARD_RATE + CARD_FIXED) - p * m.fee;
      entry[`keep${m.name}`] = Number(keep.toFixed(2));
      if (!feedRow || p <= feedRow.rrp) anyViable = true;
    }
    entry.vsRrp = feedRow
      ? Number(
          (((feedRow.rrp - Number(entry.mineBay)) / feedRow.rrp) * 100).toFixed(
            1,
          ),
        )
      : "";
    entry.viableOnEbayUnderRrp = anyViable ? "yes" : "no";
    out.push(entry);
  }

  out.sort((a, b) => Number(b.keepeBay) - Number(a.keepeBay));

  const headers = Object.keys(out[0] ?? {});
  const csv = [
    headers.join(","),
    ...out.map((r) => headers.map((h) => csvCell(r[h] ?? "")).join(",")),
  ].join("\n");

  mkdirSync("docs/change-log", { recursive: true });
  const path = "docs/change-log/2026-09-15-marketplace-listing-sheet.csv";
  writeFileSync(path, `${csv}\n`);

  const bySupplier: Record<string, number> = {};
  for (const r of out)
    bySupplier[r.supplier as string] =
      (bySupplier[r.supplier as string] ?? 0) + 1;

  console.log(`\n${out.length} products worth listing. ${path}\n`);
  for (const [s, n] of Object.entries(bySupplier))
    console.log(`  ${String(n).padStart(4)}  ${s}`);

  const carriageUnknown = out.filter((r) => r.carriageKnown !== "yes").length;
  const noGtin = out.filter((r) => !r.gtin).length;
  // Only Hill rows carry an RRP, so counting the rest as "under RRP" would be
  // counting products that have no ceiling to be under.
  const withRrp = out.filter((r) => r.rrp !== "");
  const underRrp = withRrp.filter(
    (r) => r.viableOnEbayUnderRrp === "yes",
  ).length;
  console.log(
    `\n  ${underRrp} of ${withRrp.length} Hill products can be listed on eBay below Hill's` +
      ` RRP and still keep ${FLOOR * 100}%`,
  );
  console.log(
    `  ${out.length - withRrp.length} others have no RRP recorded, so there is no ceiling to check against`,
  );
  console.log(
    `  ${carriageUnknown} have NO recorded carriage — margins overstated`,
  );
  console.log(`  ${noGtin} have no GTIN, which limits eBay catalogue matching`);

  const bands: [string, number, number][] = [
    ["under £100", 0, 100],
    ["£100–250", 100, 250],
    ["£250–500", 250, 500],
    ["£500+", 500, 1e9],
  ];
  console.log("\n  By minimum eBay price:");
  for (const [label, lo, hi] of bands) {
    const b = out.filter(
      (r) => Number(r.mineBay) >= lo && Number(r.mineBay) < hi,
    );
    console.log(
      `    ${label.padEnd(12)} ${String(b.length).padStart(4)}  keeping £${Math.min(...b.map((x) => Number(x.keepeBay))).toFixed(0)}–£${Math.max(...b.map((x) => Number(x.keepeBay))).toFixed(0)}`,
    );
  }

  // What OnBuy's lower fee actually buys is a LOWER PRICE at the same margin,
  // not more cash. Comparing cash kept at each marketplace's own minimum price
  // makes OnBuy look worse, because both are pinned to the same 20% and 20% of
  // a smaller number is less money. The competitive edge is the price gap.
  console.log(
    "\n  OnBuy's lower fee buys a cheaper listing at the same 20% margin:",
  );
  const gaps = out
    .map((r) => Number(r.mineBay) - Number(r.minOnBuy))
    .sort((a, b) => a - b);
  const pct = out
    .map((r) => (1 - Number(r.minOnBuy) / Number(r.mineBay)) * 100)
    .sort((a, b) => a - b);
  console.log(
    `    £${gaps[0]?.toFixed(0)}–£${gaps[gaps.length - 1]?.toFixed(0)} cheaper` +
      `  (median £${gaps[Math.floor(gaps.length / 2)]?.toFixed(0)}, about ${pct[Math.floor(pct.length / 2)]?.toFixed(1)}% off the eBay price)`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
