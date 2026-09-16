/**
 * One sheet with everything needed to list a product, plus what it costs us.
 *
 * Damien: _"give me a list with there cost prices, descriptions titles and
 * every other bit of info ebay requires"_.
 *
 * COST PRICE IS IN HERE AND MUST NOT GO TO EBAY. The internal columns come
 * first and are prefixed `_`, so they are easy to delete before anything is
 * uploaded. This is a planning sheet; `build-ebay-file-exchange.ts` writes the
 * file eBay actually reads, and that one carries no cost data at all.
 *
 * MARKETPLACE PERMISSION IS A COLUMN, NOT AN ASSUMPTION. Only Hill Interiors
 * and D.I. Designs have one on record. AW Dropship holds the best low-price
 * margins in the catalogue — 41% to 71% with carriage confirmed — and has never
 * been asked. Premier Housewares is 546 products and has never been asked.
 * Every row says which it is, because Aosom went on a list once by mistake.
 *
 * CARRIAGE UNKNOWN IS NOT CARRIAGE FREE. `_carriageKnown` is `NO` where
 * shippingCost is absent, and those margins are overstated by whatever it turns
 * out to cost. 217 of 303 products under £100 are in that position.
 *
 *   pnpm tsx --env-file=.env.local scripts/build-listing-prep-sheet.ts
 *   pnpm tsx --env-file=.env.local scripts/build-listing-prep-sheet.ts --max 250
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
const CEILING = argMax > -1 ? Number(process.argv[argMax + 1]) : 100;

interface Row {
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  supplier: string | null;
  allowed: string[] | null;
  price: number | null;
  cost: number | null;
  carriage: number | null;
  sku: string | null;
  supplierSku: string | null;
  gtin: string | null;
  mpn: string | null;
  brand: string | null;
  colours: string[] | null;
  primaryColour: string | null;
  materials: string[] | null;
  rooms: string[] | null;
  styles: string[] | null;
  length: number | null;
  width: number | null;
  height: number | null;
  unit: string | null;
  weight: number | null;
  weightUnit: string | null;
  stockStatus: string | null;
  stockQuantity: number | null;
  leadTime: string | null;
  photos: string[] | null;
  highlights: string[] | null;
}

const q = (v: string | number | null | undefined) =>
  `"${String(v ?? "")
    .replace(/"/g, "'")
    .replace(/\r?\n/g, " ")}"`;

/** eBay description: stored facts only, no marketing language. */
function description(r: Row): string {
  const parts: string[] = [];
  if (r.summary) parts.push(`<p>${r.summary}</p>`);
  if (r.highlights?.length)
    parts.push(`<ul>${r.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>`);
  const facts: string[] = [];
  if (r.length && r.width && r.height)
    facts.push(
      `Dimensions: ${r.length} x ${r.width} x ${r.height} ${r.unit ?? "cm"}`,
    );
  if (r.weight) facts.push(`Weight: ${r.weight}${r.weightUnit ?? "kg"}`);
  if (r.materials?.length) facts.push(`Material: ${r.materials.join(", ")}`);
  if (r.colours?.length) facts.push(`Colour: ${r.colours.join(", ")}`);
  if (facts.length)
    parts.push(`<ul>${facts.map((f) => `<li>${f}</li>`).join("")}</ul>`);
  parts.push("<p>Free UK delivery. Sold by Kaiku.</p>");
  return parts.join("");
}

/** eBay allows 80 characters. Colour and material in front of the item name. */
function ebayTitle(r: Row): string {
  const base = r.title.replace(/\s*\|\s*Kaiku\s*$/i, "").trim();
  const lead: string[] = [];
  for (const a of [r.primaryColour ?? r.colours?.[0], r.materials?.[0]]) {
    if (a && !base.toLowerCase().includes(a.toLowerCase()))
      lead.push(a.charAt(0).toUpperCase() + a.slice(1));
  }
  let t = [...lead, base].join(" ").replace(/\s+/g, " ").trim();
  if (r.length && r.width) {
    const size = `${Math.round(r.length)}x${Math.round(r.width)}cm`;
    if (t.length + size.length + 1 <= 80) t += ` ${size}`;
  }
  return t.slice(0, 80);
}

/** Handling time in days, from the stated lead time. eBay wants a number. */
function handlingDays(lead: string | null): string {
  if (!lead) return "3";
  const m = lead.match(/(\d+)/g);
  if (!m?.length) return "3";
  return String(Math.max(Number(m[m.length - 1]), 1));
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && defined(price) && defined(costPrice) && price <= ${CEILING}]{
      "slug": slug.current, title, summary,
      "category": category->slug.current,
      "supplier": supplier->name, "allowed": supplier->marketplacesAllowed,
      price, "cost": costPrice, "carriage": shippingCost,
      sku, supplierSku, gtin, mpn, "brand": brand->name,
      "colours": colourTags, primaryColour, "materials": materialTags,
      "rooms": roomTags, "styles": styleTags,
      "length": dimensions.length, "width": dimensions.width,
      "height": dimensions.height, "unit": dimensions.unit,
      "weight": weight.value, "weightUnit": weight.unit,
      stockStatus, stockQuantity, "leadTime": deliveryLeadTime,
      "photos": gallery[].asset->url,
      "highlights": highlights
    }`,
  );

  const priced = rows
    .filter(
      (r) =>
        r.price! > 0 && !(r.stockStatus ?? "").toLowerCase().includes("out"),
    )
    .map((r) => {
      const keep =
        r.price! -
        r.cost! -
        (r.carriage ?? 0) -
        (r.price! * CARD_RATE + CARD_FIXED);
      return { ...r, keep, pct: (keep / r.price!) * 100 };
    })
    .filter((r) => r.keep > 0)
    .sort((a, b) => b.pct - a.pct);

  const HEAD = [
    // Internal — delete this block before uploading anything.
    "_costPrice",
    "_carriage",
    "_carriageKnown",
    "_profit",
    "_marginPct",
    "_supplier",
    "_supplierSku",
    "_marketplacePermitted",
    "_stockQty",
    "_photoCount",
    // eBay
    "Title",
    "Description",
    "KaikuCategory",
    "eBayCategoryID",
    "ConditionID",
    "StartPrice",
    "Quantity",
    "Format",
    "Duration",
    "Location",
    "PostalCode",
    "HandlingTimeDays",
    "CustomLabel",
    "EAN",
    "MPN",
    "C:Brand",
    "C:Colour",
    "C:Material",
    "C:Room",
    "C:Style",
    "C:Length",
    "C:Width",
    "C:Height",
    "C:Unit",
    "C:Weight",
    "PicURLs",
  ];

  const out = [HEAD.join(",")];
  for (const r of priced) {
    out.push(
      [
        r.cost!.toFixed(2),
        r.carriage != null ? r.carriage.toFixed(2) : "",
        r.carriage != null ? "yes" : "NO — margin overstated",
        r.keep.toFixed(2),
        r.pct.toFixed(1),
        q(r.supplier),
        q(r.supplierSku),
        (r.allowed ?? []).includes("eBay")
          ? "yes"
          : "NOT PERMITTED — ask supplier",
        r.stockQuantity ?? "",
        r.photos?.length ?? 0,

        q(ebayTitle(r)),
        q(description(r)),
        r.category ?? "",
        "FILL",
        "1000",
        r.price!.toFixed(2),
        Math.min(r.stockQuantity ?? 1, 5) || 1,
        "FixedPrice",
        "GTC",
        "Bourne End",
        "SL8 5NF",
        handlingDays(r.leadTime),
        q(r.sku),
        r.gtin ?? "",
        r.mpn ?? "",
        q(r.brand),
        q(r.primaryColour ?? r.colours?.[0]),
        q(r.materials?.[0]),
        q(r.rooms?.[0]),
        q(r.styles?.[0]),
        r.length ?? "",
        r.width ?? "",
        r.height ?? "",
        r.unit ?? "cm",
        r.weight ? `${r.weight}${r.weightUnit ?? "kg"}` : "",
        q(r.photos?.join(" | ")),
      ].join(","),
    );
  }

  const OUT = `docs/change-log/2026-09-17-listing-prep-under-${CEILING}.csv`;
  writeFileSync(OUT, `${out.join("\n")}\n`);

  const permitted = priced.filter((r) => (r.allowed ?? []).includes("eBay"));
  const carriageOk = priced.filter((r) => r.carriage != null);
  console.log(
    `\n${priced.length} products at or under £${CEILING}, in stock, positive margin.\n`,
  );
  console.log(
    `  ${permitted.length} marketplace-permitted, ${priced.length - permitted.length} need a supplier ask`,
  );
  console.log(
    `  ${carriageOk.length} with carriage confirmed, ${priced.length - carriageOk.length} overstated`,
  );
  console.log(
    `  ${priced.filter((r) => !r.gtin).length} with no EAN — limits eBay catalogue matching`,
  );
  console.log(
    `  ${priced.filter((r) => !r.weight).length} with no weight — needed for postage`,
  );
  console.log(
    `  ${priced.filter((r) => (r.photos?.length ?? 0) < 2).length} with fewer than 2 photographs\n`,
  );
  console.log(
    `  ${HEAD.length} columns. The 10 prefixed "_" are internal — DELETE THEM before uploading.\n`,
  );
  console.log(`  -> ${OUT}\n`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
