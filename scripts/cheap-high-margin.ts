/**
 * The low-priced products that actually make money, across every supplier.
 *
 * Damien: _"give me the cheapest most profitable products from all suppliers"_.
 *
 * Those two pull against each other — the highest cash profits in this
 * catalogue are £1,400 sideboards — so this reads the request the way it is
 * meant: a low enough price to sell quickly to an account with no history, and
 * the best margin available at that price.
 *
 * Margin is the site's own model, not a guess:
 *
 *   keep = price - costPrice - shippingCost - (price * 0.015 + 0.20)
 *
 * TWO FLAGS CARRIED IN THE OUTPUT RATHER THAN LEFT IN A CHAT MESSAGE.
 *
 *   CARRIAGE UNKNOWN IS NOT CARRIAGE FREE. A product with no recorded
 *   shippingCost computes a margin that is too high by whatever the carriage
 *   turns out to be. Those are marked rather than dropped, because for some
 *   suppliers carriage genuinely is included.
 *
 *   MARKETPLACE ELIGIBILITY IS NOT UNIVERSAL. Only Hill Interiors and D.I.
 *   Designs have a permission on record. Premier Housewares is 546 products and
 *   nobody has asked them. Anything not permitted is website-only, and the
 *   column says so — Aosom was listed once on a misread and had to be pulled.
 *
 *   pnpm tsx --env-file=.env.local scripts/cheap-high-margin.ts
 *   pnpm tsx --env-file=.env.local scripts/cheap-high-margin.ts --max 50
 */
import { writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;

const argMax = process.argv.indexOf("--max");
const PRICE_CEILING = argMax > -1 ? Number(process.argv[argMax + 1]) : 100;

interface Row {
  slug: string;
  title: string;
  category: string | null;
  supplier: string | null;
  allowed: string[] | null;
  price: number | null;
  cost: number | null;
  carriage: number | null;
  stockStatus: string | null;
  photos: number;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && defined(price) && defined(costPrice)]{
      "slug": slug.current, title,
      "category": category->slug.current,
      "supplier": supplier->name,
      "allowed": supplier->marketplacesAllowed,
      price, "cost": costPrice, "carriage": shippingCost,
      stockStatus, "photos": count(gallery)
    }`,
  );

  const priced = rows
    .filter((r) => r.price! > 0 && r.price! <= PRICE_CEILING)
    .filter((r) => !(r.stockStatus ?? "").toLowerCase().includes("out"))
    .map((r) => {
      const carriage = r.carriage ?? 0;
      const keep =
        r.price! - r.cost! - carriage - (r.price! * CARD_RATE + CARD_FIXED);
      return {
        ...r,
        keep,
        pct: (keep / r.price!) * 100,
        carriageKnown: r.carriage != null,
        ebay: (r.allowed ?? []).includes("eBay"),
      };
    })
    .filter((r) => r.keep > 0);

  console.log(
    `\n${priced.length} products at or under £${PRICE_CEILING}, in stock, with a positive margin.\n`,
  );

  const show = (label: string, list: typeof priced) => {
    console.log(`\n${label}\n`);
    console.log(
      `  ${"price".padStart(7)} ${"keep".padStart(7)} ${"margin".padStart(7)}  ${"eBay?".padEnd(6)} ${"carr".padEnd(5)} product`,
    );
    for (const r of list) {
      console.log(
        `  £${r.price!.toFixed(2).padStart(6)} £${r.keep.toFixed(2).padStart(6)} ${r.pct.toFixed(0).padStart(6)}%  ` +
          `${(r.ebay ? "yes" : "NO").padEnd(6)} ${(r.carriageKnown ? "ok" : "??").padEnd(5)} ` +
          `${r.title.replace(" | Kaiku", "").slice(0, 44)}  [${r.supplier ?? "?"}]`,
      );
    }
  };

  const byPct = [...priced].sort((a, b) => b.pct - a.pct);
  const byCash = [...priced].sort((a, b) => b.keep - a.keep);

  show(
    `BEST MARGIN — under £40 (fastest to sell)`,
    byPct.filter((r) => r.price! < 40).slice(0, 15),
  );
  show(
    `BEST MARGIN — £40 to £${PRICE_CEILING}`,
    byPct.filter((r) => r.price! >= 40).slice(0, 15),
  );
  show(`MOST CASH PER SALE — under £${PRICE_CEILING}`, byCash.slice(0, 15));

  const ebayOnly = byCash.filter((r) => r.ebay);
  show(
    `MOST CASH — marketplace-permitted only (Hill and D.I. Designs)`,
    ebayOnly.slice(0, 15),
  );

  /**
   * The only list worth acting on.
   *
   * A margin computed without carriage is not a margin, and 217 of 303 have no
   * carriage recorded. Ranking the full set by percentage puts Aosom's "86%"
   * at the top of a list where the carriage is simply missing. This view keeps
   * only products whose cost is fully known and that have more than one
   * photograph, which is what a listing actually needs.
   */
  const trustworthy = byPct.filter((r) => r.carriageKnown && r.photos >= 2);
  show(
    `VERIFIED — carriage known, 2+ photos (the only list worth acting on)`,
    trustworthy.slice(0, 20),
  );

  const noCarriage = priced.filter((r) => !r.carriageKnown).length;
  console.log(
    `\n  ${noCarriage} of ${priced.length} have NO recorded carriage — their margin is overstated by whatever it costs.`,
  );
  console.log(
    `  ${priced.filter((r) => r.ebay).length} are marketplace-permitted; the rest are website-only.`,
  );
  console.log(
    `  ${priced.filter((r) => r.photos <= 1).length} have a single photograph.\n`,
  );

  const csv = [
    "price,keep,marginPct,ebayPermitted,carriageKnown,photos,supplier,category,title,slug",
    ...byPct.map((r) =>
      [
        r.price!.toFixed(2),
        r.keep.toFixed(2),
        r.pct.toFixed(1),
        r.ebay ? "yes" : "no",
        r.carriageKnown ? "yes" : "NO",
        r.photos,
        `"${r.supplier ?? ""}"`,
        r.category ?? "",
        `"${r.title.replace(" | Kaiku", "").replace(/"/g, "'")}"`,
        r.slug,
      ].join(","),
    ),
  ];
  const out = `docs/change-log/2026-09-17-cheap-high-margin.csv`;
  writeFileSync(out, `${csv.join("\n")}\n`);
  console.log(`  -> ${out}\n`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
