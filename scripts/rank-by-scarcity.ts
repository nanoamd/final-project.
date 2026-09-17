/**
 * Which products we are NOT the thirtieth shop to list.
 *
 * Damien: _"no one else is selling that sofa... there are some profitable items
 * we have but its just going to take ages to list them all... we need suppliers
 * with not many retailers or almost none."_
 *
 * That is the right read and a better one than mine. Distribution scarcity is
 * the moat, and it is measurable. Searching the exact product name and counting
 * the UK retailers carrying it gives a clean signal:
 *
 *   Symi Slim Table Lamp      Hill Interiors   £59     **15+ retailers**
 *   Sorelle Two Seater Sofa   Hill Interiors   £1,303  8 retailers
 *   Abberley Black Sideboard  D.I. Designs     £1,421  5 retailers
 *   Wadborough 3 Seater Sofa  D.I. Designs     £1,367  **4 retailers**
 *
 * Two axes fall out of that, and this ranks on both:
 *
 *   **Supplier.** D.I. Designs is trade-vetted and sells through a handful of
 *   shops. Hill Interiors is mass wholesale — the same vase is on fifteen sites
 *   with the same photograph.
 *
 *   **Price.** Expensive stock ties up capital, so fewer retailers carry it.
 *   It is also where the cash profit is: a sofa keeps £230, a vase keeps £6.
 *
 * A PROXY, NOT A MEASUREMENT. Four products were checked by hand; the score
 * generalises from them. It is for deciding what to check first, not a
 * substitute for checking. Search the exact product name before listing.
 *
 *   pnpm tsx --env-file=.env.local scripts/rank-by-scarcity.ts
 */
import { readFileSync } from "node:fs";

const SHEET = "docs/change-log/2026-09-15-marketplace-listing-sheet.csv";

const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== "" ? n : null;
};

function scarcityScore(supplier: string, price: number): number {
  // D.I. Designs consistently showed 4-5 retailers against Hill's 8-15.
  let score = supplier.startsWith("D.I.") ? 3 : 1;
  if (price >= 800) score += 3;
  else if (price >= 400) score += 2;
  else if (price >= 150) score += 1;
  return score;
}

function main() {
  const lines = readFileSync(SHEET, "utf8").trim().split("\n");
  const head = lines[0]!.split(",");
  const rows = lines.slice(1).map((l) => {
    const c = l.split(",");
    return Object.fromEntries(head.map((h, i) => [h, c[i] ?? ""])) as Record<
      string,
      string
    >;
  });

  const ranked = rows
    .map((r) => {
      const price = num(r.mineBay);
      const keep = num(r.keepeBay);
      const supplier = r.supplier ?? "";
      const title = r.title ?? "";
      if (price === null || keep === null) return null;
      return {
        supplier,
        title,
        price,
        keep,
        score: scarcityScore(supplier, price),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.score - a.score || b.keep - a.keep);

  const worth = ranked.filter((r) => r.score >= 5);
  console.log(
    `\n${ranked.length} listable products. ${worth.length} score 5 or more.\n`,
  );
  console.log(
    `  ${"scarcity".padStart(8)} ${"profit".padStart(7)} ${"list at".padStart(8)}  supplier        product`,
  );
  for (const r of ranked.slice(0, 30))
    console.log(
      `  ${"*".repeat(r.score).padStart(8)} ${r.keep.toFixed(0).padStart(7)} ${r.price.toFixed(0).padStart(8)}  ${r.supplier.slice(0, 14).padEnd(14)}  ${r.title.slice(0, 44)}`,
    );
  const cash = worth.reduce((n, r) => n + r.keep, 0);
  console.log(
    `\n  The ${worth.length} at 5+ are worth £${cash.toFixed(0)} in total profit if each sells once.`,
  );
  console.log(
    "  Check the exact product name in a search before listing — the score is a shortlist, not proof.\n",
  );
}

main();
