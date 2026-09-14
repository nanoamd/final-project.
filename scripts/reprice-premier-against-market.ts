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
 * retailer's price exactly is not a real offer — being visibly cheaper is a
 * reason to buy here, and still multiples of the current margin.
 *
 * TWO RULES LEARNED THE HARD WAY, both from Damien pushing back with "dont
 * make them too expensive we still need to beat competitors":
 *
 *   1. ANCHOR ON THE LOWEST verified price, never the first one found. The
 *      Brando was checked against Royalcraft at £1,566.99 and priced at
 *      £1,332 — then Abigail Ahern turned out to sell it at £1,334.50. A
 *      £2.50 saving is a price match, not an undercut. `market` is therefore
 *      an array of every price seen, and the minimum is what counts.
 *
 *   2. A SINGLE SOURCE gets a deeper cut. One listing might be the dearest
 *      in the market and there is no way to tell from one number, so a
 *      product checked against one retailer is priced 20% under it rather
 *      than 15%. Uncertainty is paid for out of margin, not out of the
 *      chance of a sale.
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
/** How far below the LOWEST verified price Kaiku lists, on 2+ sources. */
const UNDERCUT = 0.15;
/** Deeper cut when only one listing was found — one price may be the dearest. */
const UNDERCUT_SINGLE_SOURCE = 0.2;
/** Sanity check — a repriced product must still clear this. */
const MIN_MARGIN = 0.2;

interface Verified {
  /** Substring that identifies the product title uniquely. */
  match: string;
  /** Every price seen, with where it came from. The LOWEST is the anchor. */
  seen: { price: number; source: string }[];
  note?: string;
}

/**
 * Every entry here was read off a live retail listing. Add to this list as
 * prices are checked; nothing goes in on an estimate.
 */
const VERIFIED: Verified[] = [
  {
    match: "Brando Acacia Wood effect Dining Table",
    seen: [
      { price: 1566.99, source: "royalcraft.co.uk, 10 in stock" },
      { price: 1334.5, source: "abigailahern.com, reduced from £1,570" },
    ],
  },
  {
    match: "Riza Large Panelled Wall Mirror",
    seen: [{ price: 1244.0, source: "houseofisabella.co.uk (SKU 5503222)" }],
  },
  {
    match: "Kensington Townhouse Brown And White Hair on Leather",
    seen: [{ price: 499.95, source: "UK stockist, sale price" }],
    note: "Anchored on the sale price, not the £1,120.95 RRP — the conservative choice.",
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
    // The lowest listing is the one a shopper will find, so it is the anchor.
    const lowest = v.seen.reduce((a, b) => (b.price < a.price ? b : a));
    const singleSource = v.seen.length === 1;
    const cut = singleSource ? UNDERCUT_SINGLE_SOURCE : UNDERCUT;
    const to = Math.ceil(lowest.price * (1 - cut));
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
      market: lowest.price,
      source: lowest.source,
      allSeen: v.seen,
      singleSource,
      cut,
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
      `  Anchored on the LOWEST listing found.\n`,
  );
  let gained = 0;
  for (const c of changes) {
    gained += c.keepAfter - c.keepNow;
    console.log(`  ${c.title}`);
    for (const seen of c.allSeen)
      console.log(
        `      seen at £${seen.price.toFixed(2).padStart(8)}   ${seen.source}`,
      );
    console.log(
      `      trade cost £${c.cost.toFixed(2)}   anchor £${c.market.toFixed(2)}` +
        `   cut ${Math.round(c.cut * 100)}%${c.singleSource ? " (single source)" : ""}`,
    );
    if (c.note) console.log(`      ${c.note}`);
    console.log(
      `      £${c.from} → £${c.to}        profit £${c.keepNow} → £${c.keepAfter}` +
        `        margin ${c.marginNow}% → ${c.marginAfter}%`,
    );
    console.log(
      `      undercuts the cheapest listing by £${(c.market - c.to).toFixed(2)}` +
        ` (${Math.round((1 - c.to / c.market) * 100)}%)\n`,
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
