/**
 * The Mercia products Damien asked for: the outdoor kitchen sets.
 *
 * Damien: "import the mercia garden products i sent you. just find them on the
 * site and add them to sanity with pictures etc its not many products i want
 * from them apart from there outdoor kitchen sets."
 *
 * Mercia is the approved trade account — Harvia and Auroom were placeholder
 * brand records, not relationships. Every fact below comes from Mercia's own
 * product pages, and the trade prices come from the screenshots Damien sent from
 * his logged-in account.
 *
 * WHAT THIS WRITES AND WHAT IT DOES NOT.
 *
 * It writes drafts, with everything factual: title, category, brand, supplier,
 * cost, dimensions where published, specs, images, SKU, stock and lead time.
 *
 * It does NOT write a price, and it does NOT write a description. That is the
 * rule every other importer here follows and today is the day it matters most:
 * the descriptions are Damien's voice and I have already done enough damage to
 * them for one session. This sets up what a description needs to be written
 * from — the construction, the guarantee, the assembly reality — not the
 * description itself.
 *
 * THE PRICING PROBLEM, stated rather than solved. Mercia's own RRP is close to
 * what Damien's margin floor would demand:
 *
 *   Trent          trade £804.00   Mercia RRP £999.99   20% floor needs £1,024
 *   Ultimate Trent trade £1,098.00 Mercia RRP £1,499.99 20% floor needs £1,399
 *   BBQ Table      trade £264.00   Mercia RRP £349.99   17% floor needs £324
 *
 * So the Ultimate Trent and the BBQ Table clear the floor comfortably below RRP,
 * and the standard Trent does not — at 20% it lands £24 above Mercia's own
 * retail price. At the 17% small-tier floor it would be £987, just under. That is
 * a decision about which floor applies to a £1,000 product, and it is Damien's.
 *
 * Carriage is unknown. Mercia advertise an "extensive UK delivery network" and
 * publish no rates; per scripts/audit-supplier-readiness.ts the supplier is
 * therefore BLOCKED until the terms are recorded, and a missing carriage figure
 * is not zero.
 *
 *   pnpm tsx --env-file=.env.local scripts/import-mercia-outdoor-kitchens.ts
 *   pnpm tsx --env-file=.env.local scripts/import-mercia-outdoor-kitchens.ts --apply
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
});

const SUPPLIER_ID = "supplier-mercia-garden-products";
const BRAND_ID = "brand-mercia-garden-products";
const CATEGORY_ID = "category-outdoor-kitchens";

interface Item {
  id: string;
  title: string;
  slug: string;
  sku: string;
  /** Damien's trade price, inc VAT, from his logged-in screenshots. */
  costPrice: number;
  /** Mercia's own retail price, for reference when Damien sets ours. */
  merciaRrp: number;
  dimensions?: { length: number; width: number; height: number };
  summary: string;
  specs: [label: string, value: string][];
  images: string[];
}

const ITEMS: Item[] = [
  {
    id: "mercia-trent-outdoor-kitchen",
    title: "Mercia Trent Outdoor Kitchen | Kaiku",
    slug: "mercia-trent-outdoor-kitchen",
    sku: "ESDXL21PT056K",
    costPrice: 804,
    merciaRrp: 999.99,
    // Published as H84 x W201 x D204cm. Stored in the schema's own order.
    dimensions: { length: 204, width: 201, height: 84 },
    summary:
      "A modular outdoor kitchen in pressure-treated European softwood with a stainless steel top made to fit its contours, 201 x 204cm and 84cm high. A double cupboard for charcoal and logs, a single cupboard, a corner shelving unit and an extra shelf, with a wind-guard trim around the back. Carries a 15-year anti-rot guarantee and arrives as a DIY kit.",
    specs: [
      ["Materials", "Pressure-treated European softwood, stainless steel top"],
      ["Dimensions", "W201 x D204 x H84 cm"],
      [
        "Storage",
        "Double cupboard, single cupboard, corner shelving unit, additional shelf",
      ],
      ["Worktop", "Custom-made stainless steel"],
      ["Weather protection", "Wind-guard trim around the rear perimeter"],
      ["Guarantee", "15-year anti-rot, with annual treatment recommended"],
      ["Assembly", "DIY kit, self-assembly"],
      ["Modular", "Expandable with individual matching units"],
    ],
    images: [
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL21PT056K-lifestyle.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL21PT056K-corner-detail2.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL21PT056K-shelf-detail.jpg",
    ],
  },
  {
    id: "mercia-ultimate-trent-outdoor-kitchen",
    title: "Mercia Ultimate Trent Outdoor Kitchen | Kaiku",
    slug: "mercia-ultimate-trent-outdoor-kitchen",
    sku: "ESDXL21PT056K2",
    costPrice: 1098,
    merciaRrp: 1499.99,
    summary:
      "The larger Trent outdoor kitchen, in pressure-treated European softwood with a custom stainless steel top. A double cupboard for charcoal and logs, a single cupboard, a corner shelving unit and an additional shelf, with a wind-guard trim around the back. Modular, so it takes further matching units. 15-year anti-rot guarantee, supplied as a DIY kit with professional installation available.",
    specs: [
      ["Materials", "Pressure-treated European softwood, stainless steel top"],
      [
        "Storage",
        "Double cupboard, single cupboard, corner shelving unit, additional shelf",
      ],
      ["Worktop", "Custom-made stainless steel"],
      ["Weather protection", "Wind-guard trim around the rear perimeter"],
      ["Guarantee", "15-year anti-rot, with annual treatment recommended"],
      ["Assembly", "DIY kit; professional installation available"],
      ["Modular", "Expandable with individual matching units"],
    ],
    images: [
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL21PT056K2-lifestyle.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL21PT056K2-lifestyle-angle.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL21PT056K-corner-detail2_50d237c9-4be2-4933-8658-95286ef01383.jpg",
    ],
  },
  {
    id: "mercia-pressure-treated-bbq-table",
    title: "Mercia Pressure Treated BBQ Table | Kaiku",
    slug: "mercia-pressure-treated-bbq-table",
    sku: "ESDXL21PT048BR",
    costPrice: 264,
    merciaRrp: 349.99,
    summary:
      "An outdoor serving station in pressure-treated timber, with a large central top, two open shelves reachable from any side, and two fold-up side panels for preparation. Strong enough to stand a pizza oven on. 15-year anti-rot guarantee, which requires a waterproof topcoat within 14 days of installation and annually after. Two people needed to build it.",
    specs: [
      ["Materials", "Pressure-treated timber"],
      [
        "Surfaces",
        "Central tabletop, two open shelves, two fold-up side panels",
      ],
      ["Suitable for", "Pizza ovens and cooking equipment"],
      ["Treatment", "Pressure treated against decay"],
      [
        "Guarantee",
        "15-year anti-rot, conditional on a waterproof topcoat within 14 days and annually",
      ],
      ["Assembly", "Two people required"],
      ["Delivery", "Kerbside only"],
    ],
    images: [
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL21PT048BR-lifestyle-1_16137718-1c93-46c3-b397-45a0b87f6a58.jpg",
    ],
  },
];

/** Downloads one image and uploads it to Sanity, returning the asset id. */
async function uploadImage(url: string, filename: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KaikuCatalogueSync/1.0)",
    },
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function main() {
  const existing = await client.fetch<string[]>(
    `*[_type=="product" && sku in $skus].sku`,
    { skus: ITEMS.map((i) => i.sku) },
  );
  if (existing.length)
    console.log(`Already present, will be skipped: ${existing.join(", ")}`);

  const results: Record<string, unknown>[] = [];

  for (const item of ITEMS) {
    if (existing.includes(item.sku)) continue;

    const floor = item.costPrice < 50 ? 0.17 : 0.2;
    // Same solve the reprice uses: price net of card fees clears the floor.
    const needed = Math.ceil((item.costPrice + 0.2) / (1 - 0.015 - floor));

    results.push({
      id: item.id,
      title: item.title,
      sku: item.sku,
      costPrice: item.costPrice,
      merciaRrp: item.merciaRrp,
      priceForFloor: needed,
      floorPct: floor * 100,
      aboveRrp: needed > item.merciaRrp,
      images: item.images.length,
      specs: item.specs.length,
    });

    console.log(
      `\n${item.title.replace(" | Kaiku", "")}` +
        `\n   sku ${item.sku}   trade £${item.costPrice.toFixed(2)}   Mercia RRP £${item.merciaRrp.toFixed(2)}` +
        `\n   price to clear ${floor * 100}% net: £${needed}` +
        (needed > item.merciaRrp
          ? `   ** £${(needed - item.merciaRrp).toFixed(2)} ABOVE Mercia's own RRP **`
          : `   (£${(item.merciaRrp - needed).toFixed(2)} under RRP)`) +
        `\n   ${item.images.length} image(s), ${item.specs.length} spec rows, no price and no description written`,
    );

    if (!apply) continue;

    // The supplier record, created once, honest about what is not yet known.
    await client.createOrReplace({
      _id: SUPPLIER_ID,
      _type: "supplier",
      name: "Mercia Garden Products",
      website: "https://merciagardenproducts.co.uk",
      notes:
        "Approved trade account. Manufacturer of timber garden buildings and outdoor " +
        "kitchens, self-described market-leading dropship supplier. CARRIAGE TERMS NOT " +
        "YET RECORDED — they advertise an 'extensive UK delivery network' and publish no " +
        "rates, so margin on their products cannot be measured until the rate card is " +
        "in. Trade prices in costPrice are inc VAT, taken from Damien's logged-in account.",
    });

    const gallery = [];
    for (const [index, url] of item.images.entries()) {
      const assetId = await uploadImage(url, `${item.slug}-${index + 1}.jpg`);
      gallery.push({
        _key: `img${index}`,
        _type: "image",
        asset: { _type: "reference", _ref: assetId },
        alt:
          index === 0
            ? item.title.replace(" | Kaiku", "")
            : `${item.title.replace(" | Kaiku", "")}, view ${index + 1}`,
      });
      console.log(`   uploaded image ${index + 1}/${item.images.length}`);
    }

    await client.createOrReplace({
      // Created as a draft: no price yet, and Damien writes the description.
      _id: `drafts.${item.id}`,
      _type: "product",
      title: item.title,
      slug: { _type: "slug", current: item.slug },
      category: { _type: "reference", _ref: CATEGORY_ID },
      brand: { _type: "reference", _ref: BRAND_ID },
      supplier: { _type: "reference", _ref: SUPPLIER_ID },
      sku: item.sku,
      supplierSku: item.sku,
      costPrice: item.costPrice,
      costPriceVatCorrected: true,
      currency: "GBP",
      summary: item.summary,
      stockStatus: "In Stock",
      deliveryLeadTime: "1–2 weeks",
      ...(item.dimensions
        ? {
            dimensions: {
              _type: "dimensions",
              ...item.dimensions,
              unit: "cm",
            },
          }
        : {}),
      specs: item.specs.map(([label, value], i) => ({
        _key: `spec-${i}`,
        _type: "productSpec",
        label,
        value,
      })),
      gallery,
    });
    console.log(`   created draft drafts.${item.id}`);
  }

  console.log(
    `\n${apply ? "Created" : "Would create"} ${results.length} Mercia drafts in Outdoor Kitchens.`,
  );
  console.log(
    "No prices and no descriptions written — both are yours. Publish from Studio once priced.",
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-import-mercia-outdoor-kitchens.json",
    JSON.stringify({ apply, results }, null, 2),
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
