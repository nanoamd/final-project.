/**
 * eBay listings for the products Kaiku is actually permitted to sell there.
 *
 * ## Why this exists tonight
 *
 * Damien: _"i have 2 hours to get some work done now... should i just upload on
 * ebay?"_ — alongside the number that answers it: one chair listing took **60
 * views and 5 watchers**, against a whole website earning about 40 UK search
 * impressions and one click a day.
 *
 * The constraint was never whether to list. It was that listing is slow, and
 * deciding what to list is slower. This turns both into copy and paste.
 *
 * ## What it selects, and why that band
 *
 * Only **Hill Interiors and D.I. Designs**, because those are the two suppliers
 * with recorded eBay permission — 194 products, no email to send, no approval
 * to wait for.
 *
 * Then the band. The full permitted range runs to a £2,328 lounge set making
 * £863 of profit, and listing that first is a trap: four-figure garden
 * furniture sells rarely, and a first seller with no feedback is the last
 * person a buyer spends £2,000 with. The chair that pulled 60 views was £179.
 *
 * So the default is **£120–600 with at least £60 of profit**: expensive enough
 * to be worth the postage and the listing slot, cheap enough that somebody
 * buys it from an unknown seller. 68 products qualify. Both bounds are flags,
 * so the judgement can be overridden rather than argued with.
 *
 * ## The profit figure
 *
 * `price − costPrice − shippingCost − £0.35`.
 *
 * The £0.35 is the insertion fee past the free allowance. **There is no
 * percentage fee**: a private seller on eBay has paid 0% final value fee since
 * October 2024. This ledger had 13% hardcoded for weeks and every conclusion
 * built on it was wrong, which is why the number is spelled out here rather
 * than buried in a helper.
 *
 * ## The cost basis, and the one place it is not trustworthy
 *
 * `costPrice` is the **landed** cost: Kaiku is not VAT-registered, so VAT a
 * supplier charges is money that never comes back, and the field holds the
 * trade price with that VAT already added. Hill Interiors publishes a dropship
 * price of £266.80 for the Avia Mist Armchair and Sanity stores £320.16 —
 * exactly ×1.2, and correct. All 140 Hill products carry
 * `costPriceVatCorrected`.
 *
 * **D.I. Designs products do not.** Not one of the 54 has been corrected, so
 * either that supplier genuinely invoices VAT-inclusive prices, or every
 * D.I. Designs profit figure here is overstated by 20% of its cost — which on
 * the Alton chest is the difference between £150.65 and £63.05. The script
 * cannot tell which from the data, so it marks those rows instead of quietly
 * averaging two different cost bases into one table.
 *
 *   pnpm tsx scripts/build-ebay-tonight.ts
 *   pnpm tsx scripts/build-ebay-tonight.ts --min-profit=100 --max-price=900
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

function flag(name: string, fallback: number): number {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  const value = hit ? Number(hit.slice(name.length + 3)) : NaN;
  return Number.isFinite(value) ? value : fallback;
}

const MIN_PRICE = flag("min-price", 120);
const MAX_PRICE = flag("max-price", 600);
const MIN_PROFIT = flag("min-profit", 60);
const LIMIT = flag("limit", 25);

/** eBay truncates a listing title at 80 characters. */
const TITLE_LIMIT = 80;

/** The insertion fee past the free allowance. No percentage — see the header. */
const INSERTION_FEE = 0.35;

interface Row {
  title: string;
  slug: string;
  /** Needed with the slug: the route is /shop/[category]/[product]. */
  categorySlug: string | null;
  sku: string | null;
  supplier: string | null;
  category: string | null;
  price: number;
  costPrice: number | null;
  /** Whether `costPrice` already has the supplier's unreclaimable VAT in it. */
  costPriceVatCorrected: boolean | null;
  shippingCost: number | null;
  summary: string | null;
  body: string | null;
  colours: string[] | null;
  materials: string[] | null;
  dimensions: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
    unit?: string | null;
  } | null;
  weight: number | null;
  images: string[] | null;
}

const QUERY = /* groq */ `
*[_type == "product"
  && !(_id in path("drafts.**"))
  && supplier->name in ["Hill Interiors", "D.I. Designs"]
  && defined(costPrice)
] {
  title,
  "slug": slug.current,
  "categorySlug": category->slug.current,
  sku,
  "supplier": supplier->name,
  "category": category->title,
  price,
  costPrice,
  costPriceVatCorrected,
  shippingCost,
  summary,
  "body": pt::text(description),
  "colours": colourTags,
  "materials": materialTags,
  dimensions,
  "weight": weight.value,
  "images": gallery[].asset->url
}`;

/**
 * An eBay title within 80 characters.
 *
 * eBay search matches the title and almost nothing else, so the words a buyer
 * types have to be in it. The site's own name is dropped — "| Kaiku" is three
 * wasted characters of a brand nobody is searching for yet — and the material
 * and colour are added where they fit, because "oak" and "grey" are how people
 * actually search for furniture.
 *
 * Truncation is on a word boundary. A title cut mid-word reads as a scam
 * listing, which is the opposite of the problem being solved.
 */
export function ebayTitle(row: {
  title: string;
  materials: string[] | null;
  colours: string[] | null;
}): string {
  const base = row.title.replace(/\s*\|\s*Kaiku\s*$/i, "").trim();
  const extras: string[] = [];
  const lower = base.toLowerCase();

  for (const word of [...(row.materials ?? []), ...(row.colours ?? [])]) {
    const clean = word.trim();
    if (!clean || lower.includes(clean.toLowerCase())) continue;
    extras.push(clean);
  }

  let out = base;
  for (const extra of extras) {
    const candidate = `${out} ${extra}`;
    if (candidate.length <= TITLE_LIMIT) out = candidate;
  }

  if (out.length <= TITLE_LIMIT) return out;
  const cut = out.slice(0, TITLE_LIMIT);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
}

/**
 * Cut at a sentence, never mid-word.
 *
 * The first version cut at exactly 900 characters and ended a listing on
 * "constructed with high-quality materi", which reads as a broken scrape —
 * precisely the impression a new seller with no feedback cannot afford.
 */
function sentenceSafe(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const window = value.slice(0, limit);
  const stop = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "));
  if (stop > limit * 0.5) return window.slice(0, stop + 1);
  const space = window.lastIndexOf(" ");
  return space > limit * 0.5 ? window.slice(0, space) : window;
}

function dimensionLine(row: Row): string | null {
  const unit = row.dimensions?.unit ?? "cm";
  const parts = [
    ["Length", row.dimensions?.length],
    ["Width", row.dimensions?.width],
    ["Height", row.dimensions?.height],
  ].filter(([, v]) => typeof v === "number" && v > 0) as [string, number][];
  if (!parts.length) return null;
  return parts.map(([k, v]) => `${k} ${v}${unit}`).join(" · ");
}

/**
 * The VAT warning for one row, or null if its cost basis is sound.
 *
 * Exported so the test can pin it: a row whose profit is computed on an
 * ex-VAT cost while the rest of the table is inclusive is not a rounding
 * difference, it is a fifth of the cost missing, and it belongs on the row
 * rather than in a footnote nobody reads before pasting.
 */
export function vatWarning(row: {
  costPrice: number | null;
  costPriceVatCorrected: boolean | null;
  shippingCost: number | null;
}): string | null {
  if (row.costPriceVatCorrected === true) return null;
  const worst = (row.costPrice ?? 0) * 0.2 + (row.shippingCost ?? 0) * 0.2;
  return (
    `Cost basis unconfirmed — this supplier's prices have never been checked ` +
    `for VAT. If they invoice VAT on top, the profit above is £` +
    `${worst.toFixed(2)} too high. Check one invoice before pricing this one.`
  );
}

async function main() {
  const rows = await client.fetch<Row[]>(QUERY);

  const priced = rows
    .map((row) => ({
      row,
      profit:
        Math.round(
          (row.price -
            (row.costPrice ?? 0) -
            (row.shippingCost ?? 0) -
            INSERTION_FEE) *
            100,
        ) / 100,
    }))
    .filter(
      ({ row, profit }) =>
        row.price >= MIN_PRICE &&
        row.price <= MAX_PRICE &&
        profit >= MIN_PROFIT,
    )
    .sort((a, b) => b.profit - a.profit);

  const picked = priced.slice(0, LIMIT);

  const lines: string[] = [];
  lines.push("# eBay listings, ready to paste");
  lines.push("");
  lines.push(
    `Generated by \`scripts/build-ebay-tonight.ts\`. ${priced.length} products ` +
      `qualify at £${MIN_PRICE}–${MAX_PRICE} with £${MIN_PROFIT}+ profit; the ` +
      `top ${picked.length} are below, best profit first.`,
  );
  lines.push("");
  lines.push(
    "**Before listing each one, search its name on eBay.** Ten seconds, and it " +
      "is the one check no script can do — eBay returns 403 to automated " +
      "requests. Few or no sellers is the whole reason to list it; a page of " +
      "them means skip it and take the next.",
  );
  lines.push("");
  lines.push(
    "Profit is `price − trade cost − carriage − £0.35`. No percentage: a " +
      "private seller pays 0% final value fee.",
  );
  lines.push("");

  let totalProfit = 0;
  picked.forEach(({ row, profit }, i) => {
    totalProfit += profit;
    const title = ebayTitle(row);
    const dims = dimensionLine(row);

    lines.push(`---`);
    lines.push("");
    lines.push(`## ${i + 1}. ${title}`);
    lines.push("");
    lines.push(
      `**£${row.price.toFixed(2)}** · profit **£${profit.toFixed(2)}** · ` +
        `${row.supplier} · ${row.category ?? "—"} · SKU \`${row.sku ?? "—"}\``,
    );
    lines.push("");
    const warning = vatWarning(row);
    if (warning) {
      lines.push(`> ⚠️ ${warning}`);
      lines.push("");
    }
    lines.push(`**Title** (${title.length}/80 characters — paste as-is)`);
    lines.push("```");
    lines.push(title);
    lines.push("```");
    lines.push("");
    lines.push("**Item specifics**");
    lines.push("");
    lines.push(`| Field | Value |`);
    lines.push(`| --- | --- |`);
    lines.push(`| Brand | ${row.supplier ?? "Unbranded"} |`);
    if (row.materials?.length)
      lines.push(`| Material | ${row.materials.join(", ")} |`);
    if (row.colours?.length)
      lines.push(`| Colour | ${row.colours.join(", ")} |`);
    if (dims) lines.push(`| Dimensions | ${dims} |`);
    if (typeof row.weight === "number")
      lines.push(`| Item weight | ${row.weight}kg |`);
    lines.push(`| Condition | New |`);
    lines.push("");
    lines.push("**Description** (paste into the description box)");
    lines.push("```");
    lines.push(row.summary?.trim() ?? "");
    if (row.body?.trim()) {
      lines.push("");
      lines.push(sentenceSafe(row.body.trim(), 900));
    }
    if (dims) {
      lines.push("");
      lines.push(`Dimensions: ${dims}.`);
    }
    lines.push("");
    lines.push(
      "Dispatched direct from the supplier. Free UK mainland delivery.",
    );
    lines.push("```");
    lines.push("");
    if (row.images?.length) {
      lines.push(`**Photos** — ${row.images.length} available, download from:`);
      for (const url of row.images.slice(0, 6)) lines.push(`- ${url}`);
      lines.push("");
    }
    // Both halves. A slug on its own 404s — the route is
    // /shop/[category]/[product] — and a dead link in a listing pack is worse
    // than no link, because it gets pasted into eBay before anyone clicks it.
    lines.push(
      row.categorySlug
        ? `**Live page** https://www.kaikuhome.com/shop/${row.categorySlug}/${row.slug}`
        : `**Live page** — no category, link not built`,
    );
    lines.push("");
  });

  lines.push("---");
  lines.push("");
  lines.push(
    `**If all ${picked.length} sell: £${totalProfit.toFixed(2)} of profit.** ` +
      `Listing cost £${(picked.length * INSERTION_FEE).toFixed(2)}.`,
  );
  lines.push("");

  const out = "docs/ebay-tonight.md";
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, lines.join("\n"));

  console.log(`${priced.length} qualify, wrote top ${picked.length} to ${out}`);
  console.log(`Combined profit if all sell: £${totalProfit.toFixed(2)}`);
  const unconfirmed = picked.filter(({ row }) => vatWarning(row));
  if (unconfirmed.length) {
    console.log(
      `${unconfirmed.length} of ${picked.length} have an unconfirmed cost basis: ` +
        unconfirmed
          .map(({ row }) => `${row.sku ?? row.slug} (${row.supplier})`)
          .join(", "),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
