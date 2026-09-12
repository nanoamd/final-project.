/**
 * Which categories could Kaiku credibly be a specialist in.
 *
 * `promotable-products.ts` found that 158 of 907 products can fund the customer
 * who buys them. This asks the strategic question that follows: **where do
 * those 158 sit, and is there enough depth there to look like a specialist
 * rather than a general store that happens to stock the thing.**
 *
 * That matters because of a structural fact this catalogue cannot work around.
 * Kaiku dropships SKUs that Wayfair, Dunelm and B&Q also sell, so it will not
 * win a product-name search against them on a four-month-old domain — not with
 * more effort, not this year. What a small site can win is topical depth:
 * Google rewards a site that demonstrably covers one subject completely over a
 * larger site that covers it incidentally. Depth is available to a small
 * catalogue in a way that breadth never is.
 *
 * So a category is a candidate to own when three things line up:
 *
 *   MARGIN    enough promotable products that selling them is worth doing.
 *   DEPTH     enough products overall to read as a range, not a sample.
 *   PURITY    a high share of the category being promotable, so promoting the
 *             category does not mostly promote products that lose money.
 *
 * Read-only.
 *   pnpm tsx --env-file=.env.local scripts/category-strength.ts
 */
import { createClient } from "@sanity/client";

const CARD_RATE = 0.015;
const CARD_FIXED = 0.2;
const STRONG_MARGIN = 0.35;
const STRONG_CASH = 25;
const VIABLE_MARGIN = 0.3;
const VIABLE_CASH = 20;
/** See promotable-products.ts: a high enough cash margin funds acquisition
 *  regardless of percentage, which the percentage tests alone got wrong. */
const HIGH_TICKET_CASH = 250;
const HIGH_TICKET_MARGIN_FLOOR = 0.15;

function isPromotable(margin: number, keep: number): boolean {
  if (keep >= HIGH_TICKET_CASH && margin >= HIGH_TICKET_MARGIN_FLOOR)
    return true;
  if (margin >= STRONG_MARGIN && keep >= STRONG_CASH) return true;
  return margin >= VIABLE_MARGIN && keep >= VIABLE_CASH;
}

/** Below this a category reads as a sample, not a range worth landing on. */
const MIN_DEPTH = 8;

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
  title: string;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  category: string | null;
  department: string | null;
  carriageIncluded: boolean | null;
}

interface CategoryStat {
  category: string;
  department: string;
  total: number;
  promotable: number;
  cashIfEachSoldOnce: number;
  meanKeep: number;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      title, price, costPrice, shippingCost,
      "category": category->title,
      "department": category->department->title,
      "carriageIncluded": supplier->carriageIncludedInCost
    }`,
  );

  const stats = new Map<string, CategoryStat>();

  for (const row of rows) {
    const category = row.category ?? "(uncategorised)";
    const entry = stats.get(category) ?? {
      category,
      department: row.department ?? "—",
      total: 0,
      promotable: 0,
      cashIfEachSoldOnce: 0,
      meanKeep: 0,
    };
    entry.total += 1;

    if (typeof row.price === "number" && typeof row.costPrice === "number") {
      const price = row.price;
      const carriage = row.shippingCost ?? 0;
      const keep =
        price - row.costPrice - carriage - (price * CARD_RATE + CARD_FIXED);
      const margin = price > 0 ? keep / price : 0;
      if (isPromotable(margin, keep)) {
        entry.promotable += 1;
        entry.cashIfEachSoldOnce += keep;
      }
    }
    stats.set(category, entry);
  }

  for (const entry of stats.values()) {
    entry.meanKeep = entry.promotable
      ? entry.cashIfEachSoldOnce / entry.promotable
      : 0;
  }

  const all = [...stats.values()];

  // Candidates to own: real depth, and a meaningful share of it promotable.
  const candidates = all
    .filter((c) => c.total >= MIN_DEPTH && c.promotable >= 5)
    .sort((a, b) => b.promotable / b.total - a.promotable / a.total);

  console.log(
    `\n${all.length} categories across ${rows.length} published products.\n`,
  );
  console.log(
    "Categories with real depth and real margin — candidates to specialise in:\n",
  );
  console.log(
    "  prom/total   pure%   mean keep   cash/round   category (department)",
  );
  for (const c of candidates) {
    const purity = Math.round((c.promotable / c.total) * 100);
    console.log(
      `  ${String(c.promotable).padStart(4)}/${String(c.total).padEnd(5)} ${String(purity).padStart(4)}%   ` +
        `£${c.meanKeep.toFixed(0).padStart(7)}   £${c.cashIfEachSoldOnce.toFixed(0).padStart(8)}   ` +
        `${c.category} (${c.department})`,
    );
  }

  const deepButPoor = all
    .filter((c) => c.total >= 20 && c.promotable / c.total < 0.05)
    .sort((a, b) => b.total - a.total);

  console.log(
    `\n\nDeep but unprofitable — ${deepButPoor.length} categories carrying ` +
      `${deepButPoor.reduce((n, c) => n + c.total, 0)} products with almost nothing promotable:\n`,
  );
  for (const c of deepButPoor.slice(0, 12)) {
    console.log(
      `  ${String(c.promotable).padStart(4)}/${String(c.total).padEnd(5)} ` +
        `${String(Math.round((c.promotable / c.total) * 100)).padStart(4)}%   ${c.category}`,
    );
  }

  const byDepartment = new Map<string, { total: number; promotable: number }>();
  for (const c of all) {
    const e = byDepartment.get(c.department) ?? { total: 0, promotable: 0 };
    e.total += c.total;
    e.promotable += c.promotable;
    byDepartment.set(c.department, e);
  }
  console.log("\n\nBy department");
  for (const [name, e] of [...byDepartment.entries()].sort(
    (a, b) => b[1].promotable - a[1].promotable,
  )) {
    console.log(
      `  ${String(e.promotable).padStart(4)}/${String(e.total).padEnd(5)} ` +
        `${String(Math.round((e.promotable / e.total) * 100)).padStart(4)}%   ${name}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
