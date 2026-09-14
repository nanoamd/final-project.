/**
 * Repricing Premier Housewares products against VERIFIED competitor prices.
 *
 * This corrects a mistake of mine. `reprice-premier-to-floor.ts` held 26
 * products at a 17% margin floor on the reasoning that a large price rise was
 * a market risk — I could not see competitor prices, so I used the size of
 * the rise as a proxy for how exposed the new price would be.
 *
 * The proxy was inverted. It assumed Kaiku was priced AT market and a big rise
 * would push it above. Kaiku is priced well BELOW market, so the products
 * needing the biggest rises were the ones with the most headroom, not the
 * least. Three verified listings, three different retailers:
 *
 *   Brando Acacia dining table    Royalcraft         £1,566.99
 *   Riza Large Panelled Mirror    House of Isabella  £1,244.00
 *   Kensington Townhouse table    (sale price)         £499.95   RRP £1,120.95
 *
 * Against the VAT-inclusive trade cost, the market sells these at about 2x.
 * Kaiku sells at 1.23x. That is not a rounding difference — it is roughly
 * half the market price, and it is why the catalogue can look "competitive"
 * and still make £158 on a dining table.
 *
 * WHAT THIS DOES NOT DO: it does not apply a 2x multiplier to 546 products on
 * the strength of three data points. That would repeat the error in the other
 * direction. Only products with a verified, sourced competitor price are
 * touched; everything else waits for its own check.
 *
 * The undercut is deliberate. Kaiku is an unknown shop, so matching a known
 * retailer's price exactly is not a real offer — 15% below a verified market
 * price is a reason to buy here, and still multiples of the current margin.
 *
 *   pnpm tsx --env-file=.env.local scripts/reprice-premier-against-market.ts
 *   pnpm tsx --env-file=.env.local scripts/reprice-premier-against-market.ts --apply
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

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;
/** How far below a verified market price Kaiku lists. */
const UNDERCUT = 0.15;
/** Sanity check — a repriced product must still clear this. */
const MIN_MARGIN = 0.2;

interface Verified {
  /** Substring that identifies the product title uniquely. */
  match: string;
  market: number;
  source: string;
  note?: string;
}

/**
 * Every entry here was read off a live retail listing. Add to this list as
 * prices are checked; nothing goes in on an estimate.
 */
const VERIFIED: Verified[] = [
  {
    match: "Brando Acacia Wood effect Dining Table",
    market: 1566.99,
    source: "royalcraft.co.uk, 10 in stock",
  },
  {
    match: "Riza Large Panelled Wall Mirror",
    market: 1244.0,
    source: "houseofisabella.co.uk (SKU 5503222)",
  },
  {
    match: "Kensington Townhouse Brown And White Hair on Leather",
    market: 499.95,
    source: "UK stockist sale price",
    note: "Sale price used as the anchor, not the £1,120.95 RRP — the conservative choice.",
  },
];

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && supplier->name=="Premier Housewares" && defined(price) && defined(costPrice)]{
      _id, title, "slug": slug.current, price, costPrice, shippingCost }`,
  );

  const changes = [];
  for (const v of VERIFIED) {
    const matches = rows.filter((r) => r.title.includes(v.match));
    if (matches.length !== 1) {
      console.error(
        `\n"${v.match}" matched ${matches.length} products — refusing to guess.`,
      );
      matches.forEach((m) => console.error(`    ${m.title}`));
      process.exit(1);
    }
    const row = matches[0]!;
    const cost = row.costPrice!;
    const ship = row.shippingCost ?? 0;
    const to = Math.ceil(v.market * (1 - UNDERCUT));
    const keep = to - cost - ship - (to * CARD_RATE + CARD_FIXED);
    const keepNow =
      row.price! - cost - ship - (row.price! * CARD_RATE + CARD_FIXED);

    if (keep / to < MIN_MARGIN) {
      console.error(`\n${row.title}: repriced margin below floor. Refusing.`);
      process.exit(1);
    }

    changes.push({
      _id: row._id,
      slug: row.slug,
      title: row.title.replace(" | Kaiku", ""),
      cost,
      market: v.market,
      source: v.source,
      note: v.note ?? null,
      from: row.price!,
      to,
      keepNow: Number(keepNow.toFixed(2)),
      keepAfter: Number(keep.toFixed(2)),
      marginNow: Number(((keepNow / row.price!) * 100).toFixed(1)),
      marginAfter: Number(((keep / to) * 100).toFixed(1)),
    });
  }

  console.log(
    `\n${changes.length} products with a verified market price.` +
      `  Listing at ${UNDERCUT * 100}% under it.\n`,
  );
  let gained = 0;
  for (const c of changes) {
    gained += c.keepAfter - c.keepNow;
    console.log(`  ${c.title}`);
    console.log(
      `      trade cost £${c.cost.toFixed(2)}   market £${c.market.toFixed(2)}   (${c.source})`,
    );
    if (c.note) console.log(`      ${c.note}`);
    console.log(
      `      £${c.from} → £${c.to}        profit £${c.keepNow} → £${c.keepAfter}` +
        `        margin ${c.marginNow}% → ${c.marginAfter}%`,
    );
    console.log(
      `      still ${Math.round((1 - c.to / c.market) * 100)}% below the listing it was checked against\n`,
    );
  }
  console.log(
    `  Extra profit per sale, across these ${changes.length}: £${gained.toFixed(2)}`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-14-premier-market-reprice.json",
    `${JSON.stringify({ generatedAt: new Date().toISOString(), undercut: UNDERCUT, changes }, null, 2)}\n`,
  );

  if (!apply) return console.log("\nDry run — re-run with --apply.");
  for (const c of changes)
    await client.patch(c._id).set({ price: c.to }).commit();
  console.log(
    `\nRepriced ${changes.length} products against verified market prices.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
