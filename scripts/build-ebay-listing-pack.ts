/**
 * The eBay upload list, and why it is 27 products rather than 128.
 *
 * Damien: 2 products live, ~6,000 impressions, 6 clicks. A 0.1% click-through
 * rate reads like a title problem and is not one.
 *
 * eBay takes about 13%. Holding the same margin therefore means charging more
 * on eBay than on our own site — and across the 128-product marketplace sheet,
 * **101 of them have to be priced roughly 16% ABOVE kaikuhome.com**. A buyer
 * comparing a £41 photo frame on eBay against the same frame at £33 on our own
 * website does not click. The listings are uncompetitive by construction, and
 * no title rewrite fixes that.
 *
 * So this selects the 27 where the eBay floor lands at or below our own site
 * price — the ones fees do not price out — and writes an upload pack for them.
 *
 * TITLES ARE BUILT FROM STORED ATTRIBUTES, NOT INVENTED. eBay gives 80
 * characters and Cassini keyword-matches them hard, so the supplier's own
 * naming is actively wasteful: "Hill Interior Contour Collection" is 31
 * characters of brand nobody searches for. What a buyer types is material,
 * colour and item type. Anything this script cannot read from Sanity is left
 * out rather than guessed, and a row that ends up thin is flagged for Damien
 * to finish by hand.
 *
 *   pnpm tsx --env-file=.env.local scripts/build-ebay-listing-pack.ts
 */
import { writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

const EBAY_TITLE_MAX = 80;

interface Product {
  slug: string;
  title: string;
  sku: string | null;
  category: string | null;
  colours: string[] | null;
  materials: string[] | null;
  length: number | null;
  width: number | null;
  height: number | null;
  photos: number;
}

/**
 * Words that cost characters and return nothing on eBay.
 *
 * Supplier collection names carry no search volume — nobody types "Contour
 * Collection". They are the first thing to go when 80 characters is the budget.
 */
const DEAD_WORDS =
  /\b(collection|hill interior|hill interiors|d\.?i\.? designs|kaiku)\b/gi;

function titleCase(s: string) {
  return s
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * The noun phrase a buyer types, taken from our own title with the brand and
 * collection words removed.
 */
function itemType(product: Product): string {
  return product.title
    .replace(/\s*\|\s*Kaiku\s*$/i, "")
    .replace(DEAD_WORDS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build an eBay title within 80 characters, adding detail only while it fits. */
function ebayTitle(product: Product): { title: string; thin: boolean } {
  const base = itemType(product);
  const colour = product.colours?.[0];
  const material = product.materials?.[0];

  // Lead with what is searched: colour and material in front of the item type,
  // but only where the item's own name does not already carry them.
  const lead: string[] = [];
  for (const attr of [colour, material]) {
    if (!attr) continue;
    const word = titleCase(attr);
    if (!base.toLowerCase().includes(attr.toLowerCase())) lead.push(word);
  }

  let title = [...lead, base].join(" ").replace(/\s+/g, " ").trim();

  // Size sells furniture, and it is the first thing a buyer asks. Added only
  // when it fits and only from stored dimensions.
  if (product.length && product.width) {
    const size = `${Math.round(product.length)}x${Math.round(product.width)}cm`;
    if (title.length + size.length + 1 <= EBAY_TITLE_MAX) title += ` ${size}`;
  }

  if (title.length > EBAY_TITLE_MAX)
    title = title.slice(0, EBAY_TITLE_MAX).trim();

  // Under 45 characters means we had almost nothing to work with and the row
  // needs a human. Better to say so than to pad it with filler.
  return { title, thin: title.length < 45 };
}

async function main() {
  const products = await client.fetch<Product[]>(
    `*[_type=="product" && !(_id in path("drafts.**"))]{
      "slug": slug.current, title, sku,
      "category": category->slug.current,
      "colours": colourTags, "materials": materialTags,
      "length": dimensions.length, "width": dimensions.width,
      "height": dimensions.height,
      "photos": count(gallery)
    }`,
  );
  const byTitle = new Map(
    products.map((p) => [
      p.title
        .replace(/\s*\|\s*Kaiku\s*$/i, "")
        .toLowerCase()
        .trim(),
      p,
    ]),
  );
  console.log(`${products.length} published products loaded.`);

  const { createReadStream } = await import("node:fs");
  const { createInterface } = await import("node:readline");
  const rl = createInterface({
    input: createReadStream(
      "docs/change-log/2026-09-15-marketplace-listing-sheet.csv",
    ),
  });
  const rows: Record<string, string>[] = [];
  let header: string[] = [];
  for await (const line of rl) {
    const cells = line.split(",");
    if (!header.length) {
      header = cells;
      continue;
    }
    rows.push(Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])));
  }

  const num = (v: string | undefined) => {
    const n = Number(v);
    return v !== undefined && v !== "" && Number.isFinite(n) ? n : null;
  };

  const selected = rows.filter((r) => {
    const min = num(r.mineBay),
      site = num(r.sitePrice),
      keep = num(r.keepeBay);
    return min !== null && site !== null && keep !== null && min <= site;
  });
  selected.sort((a, b) => (num(b.keepeBay) ?? 0) - (num(a.keepeBay) ?? 0));

  const out: string[][] = [
    [
      "rank",
      "cashProfit",
      "listAt",
      "sitePrice",
      "stock",
      "photos",
      "ebayTitle",
      "titleChars",
      "needsWork",
      "sku",
      "siteSlug",
      "sourceTitle",
    ],
  ];
  let matched = 0,
    thin = 0,
    unmatched = 0;

  selected.forEach((r, i) => {
    const key = (r.title ?? "")
      .replace(/^(Hill Interior|D\.I\. Designs)\s+/i, "")
      .toLowerCase()
      .trim();
    const p =
      byTitle.get(key) ??
      [...byTitle.entries()].find(([k]) => k.startsWith(key.slice(0, 28)))?.[1];
    if (!p) {
      unmatched++;
      return;
    }
    matched++;
    const { title, thin: isThin } = ebayTitle(p);
    if (isThin) thin++;
    out.push([
      String(i + 1),
      r.keepeBay ?? "",
      r.mineBay ?? "",
      r.sitePrice ?? "",
      r.stock || "-",
      r.photos ?? "0",
      `"${title.replace(/"/g, "'")}"`,
      String(title.length),
      isThin ? "YES — too little stored detail, finish by hand" : "",
      r.sku || "",
      p.slug,
      `"${(r.title ?? "").replace(/"/g, "'")}"`,
    ]);
  });

  writeFileSync(
    "docs/change-log/2026-09-16-ebay-listing-pack.csv",
    `${out.map((r) => r.join(",")).join("\n")}\n`,
  );

  console.log(
    `\n  ${selected.length} products where the eBay floor is at or below our site price`,
  );
  console.log(`  ${matched} matched to a live product, ${unmatched} unmatched`);
  console.log(`  ${thin} titles need finishing by hand\n`);
  for (const row of out.slice(1, 11))
    console.log(
      `  £${(row[1] ?? "").padStart(4)}  ${(row[7] ?? "").padStart(2)}ch  ${(row[6] ?? "").slice(1, 62)}`,
    );
  console.log(`\n  -> docs/change-log/2026-09-16-ebay-listing-pack.csv`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
