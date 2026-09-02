/**
 * Where the catalogue does not look premium, by category.
 *
 * Damien: "we have empty categories or categories with the low budget products
 * which isnt what you expect we need more premium products and brands."
 *
 * This is a merchandising question, not a data-quality one, so it is measured
 * differently from every other audit here. A category fails not because a field
 * is empty but because of what a shopper sees when they land on it:
 *
 *   - **Empty** — nothing to buy. Reads as an abandoned shop.
 *   - **Entry-price problem** — the cheapest thing is so cheap it sets the
 *     category's tone. A £15 planter at the top of the grid tells the shopper
 *     what kind of shop this is before they see the £246 one.
 *   - **No ceiling** — nothing expensive enough to anchor the range. Premium
 *     positioning needs a top of the market, even if it rarely sells: it is
 *     what makes the mid-price piece look like the sensible choice rather than
 *     the expensive one.
 *   - **Thin** — too few products to look like a range at all.
 *
 * The thresholds below are judgements, not facts, and they are stated as
 * constants so Damien can move them. They are set for a premium home and garden
 * brand, deliberately not for a marketplace.
 *
 * Read-only.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-price-positioning.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

/** Below this, the cheapest product in a category drags its tone down. */
const ENTRY_FLOOR = 25;
/** A category with nothing above this has no anchor at the top. */
const CEILING_TARGET = 250;
/** Fewer than this and it does not read as a range. */
const THIN_COUNT = 6;
/** Share of a category priced under the entry floor before it defines the feel. */
const CHEAP_SHARE_LIMIT = 0.3;

interface Row {
  slug: string;
  title: string;
  department: string | null;
  prices: number[];
}

function median(sorted: number[]): number {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="category" && !(_id in path("drafts.**"))]{
      "slug": slug.current,
      title,
      "department": department->title,
      "prices": *[_type=="product" && !(_id in path("drafts.**")) && references(^._id) && defined(price)].price
    } | order(department asc, title asc)`,
  );

  const analysed = rows.map((r) => {
    const prices = [...(r.prices ?? [])].sort((a, b) => a - b);
    const count = prices.length;
    const min = count ? prices[0]! : null;
    const max = count ? prices[count - 1]! : null;
    const med = median(prices);
    const cheapShare = count
      ? prices.filter((p) => p < ENTRY_FLOOR).length / count
      : 0;

    const issues: string[] = [];
    if (count === 0) issues.push("EMPTY");
    else {
      if (count < THIN_COUNT) issues.push(`thin (${count})`);
      if (min !== null && min < ENTRY_FLOOR)
        issues.push(`entry £${min.toFixed(0)}`);
      if (cheapShare > CHEAP_SHARE_LIMIT)
        issues.push(`${(cheapShare * 100).toFixed(0)}% under £${ENTRY_FLOOR}`);
      if (max !== null && max < CEILING_TARGET)
        issues.push(`no anchor (top £${max.toFixed(0)})`);
    }

    return {
      slug: r.slug,
      title: r.title,
      department: r.department,
      count,
      min,
      med,
      max,
      cheapShare: +(cheapShare * 100).toFixed(0),
      issues,
    };
  });

  const header =
    "Room".padEnd(17) +
    "Category".padEnd(26) +
    "n".padStart(4) +
    "entry".padStart(8) +
    "median".padStart(9) +
    "top".padStart(9) +
    "  issues";
  console.log(header);
  console.log("-".repeat(header.length));

  for (const a of analysed) {
    console.log(
      (a.department ?? "—").slice(0, 16).padEnd(17) +
        a.title.slice(0, 25).padEnd(26) +
        String(a.count).padStart(4) +
        (a.min === null ? "—" : `£${a.min.toFixed(0)}`).padStart(8) +
        (a.count ? `£${a.med.toFixed(0)}` : "—").padStart(9) +
        (a.max === null ? "—" : `£${a.max.toFixed(0)}`).padStart(9) +
        "  " +
        a.issues.join(", "),
    );
  }

  const empty = analysed.filter((a) => a.count === 0);
  const noAnchor = analysed.filter(
    (a) => a.count > 0 && a.max !== null && a.max < CEILING_TARGET,
  );
  const cheapLed = analysed.filter(
    (a) => a.cheapShare > CHEAP_SHARE_LIMIT * 100,
  );
  const thin = analysed.filter((a) => a.count > 0 && a.count < THIN_COUNT);

  console.log(`\n${"=".repeat(70)}`);
  console.log(`Empty categories:                       ${empty.length}`);
  empty.forEach((a) => console.log(`   ${a.department} / ${a.title}`));
  console.log(
    `\nNo product above £${CEILING_TARGET} to anchor the range: ${noAnchor.length}`,
  );
  noAnchor.forEach((a) =>
    console.log(`   ${a.department} / ${a.title} — top is £${a.max}`),
  );
  console.log(
    `\nMore than ${CHEAP_SHARE_LIMIT * 100}% of stock under £${ENTRY_FLOOR}:  ${cheapLed.length}`,
  );
  cheapLed.forEach((a) =>
    console.log(
      `   ${a.department} / ${a.title} — ${a.cheapShare}% under £${ENTRY_FLOOR}, entry £${a.min}`,
    ),
  );
  console.log(
    `\nToo thin to read as a range (<${THIN_COUNT}):        ${thin.length}`,
  );
  thin.forEach((a) =>
    console.log(`   ${a.department} / ${a.title} — ${a.count}`),
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-price-positioning.json",
    JSON.stringify(
      {
        thresholds: {
          ENTRY_FLOOR,
          CEILING_TARGET,
          THIN_COUNT,
          CHEAP_SHARE_LIMIT,
        },
        categories: analysed,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
