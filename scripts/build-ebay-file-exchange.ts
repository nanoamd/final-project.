/**
 * Every marketplace-permitted product as one eBay File Exchange CSV.
 *
 * Damien: _"How can we import all products to eBay in one go rather than
 * manually doing all of them?"_
 *
 * You do not need Linnworks or a listing tool. eBay's own File Exchange takes a
 * CSV that creates listings in bulk, and everything it wants is already in
 * Sanity — title, summary, GTIN, SKU, dimensions, colour, material, stock, and
 * image URLs that are already on a public CDN.
 *
 * TWO THINGS THIS SCRIPT WILL NOT GUESS.
 *
 *   **eBay category IDs.** Every listing needs one and there is no safe way to
 *   infer it. Listing 127 products into the wrong category is worse than
 *   listing none: eBay suppresses or removes them and it counts against the
 *   account. So the CSV writes `FILL-<category>` and the upload FAILS LOUDLY
 *   until the mapping in `EBAY_CATEGORY_IDS` below is filled.
 *
 *   Getting them is one download, not nineteen lookups. eBay returns 403 to
 *   automated requests on both its search and its category pages, so the list
 *   has to come from inside the seller account:
 *
 *     Seller Hub > Reports > Upload > Get template
 *       Source: Listings   Type: Create new listings template
 *
 *   ("File Exchange" is the old name — eBay folded it into Seller Hub Reports.)
 *   Save it to `docs/change-log/ebay-categories.csv` and run
 *   `scripts/map-ebay-categories.ts`, which proposes all nineteen for
 *   confirmation.
 *
 *   **Business policy names.** Shipping, returns and payment are set up once in
 *   eBay and referenced by name. The names below are placeholders.
 *
 * THE JOIN KEY IS NOT THE SKU. `build-marketplace-listing-sheet.ts` writes
 * `coalesce(supplierSku, sku)` into its sku column, so the sheet holds Hill's
 * "24370" and D.I.'s "SB-02" — the codes you order against. Sanity's own `sku`
 * is Kaiku's internal "KK-CAND-GLASS-WHT-001", and 193 of 194 products carry
 * that form. Joining on the wrong one matched 8 products out of 194. This
 * queries both: the supplier code to find the price, Kaiku's own for eBay's
 * CustomLabel, which is what reconciles an eBay order back to the site.
 *
 * ONLY PERMITTED SUPPLIERS. Hill Interiors and D.I. Designs are the only two
 * with a marketplace permission on record and any live stock. The GROQ filter
 * enforces it rather than trusting the caller — Aosom was included once on a
 * misread and Damien had to catch it.
 *
 * QUANTITY IS CAPPED. This is dropship: overselling a line we cannot fulfil is
 * a cancelled order, and cancelled orders on a new account are worse than no
 * orders. Where the Hill feed records stock the quantity is the lower of that
 * and the cap; where it does not, the product is listed at 1 or skipped.
 *
 *   pnpm tsx --env-file=.env.local scripts/build-ebay-file-exchange.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  useCdn: false,
});

/**
 * Kaiku category slug -> eBay UK category ID.
 *
 * FILL THESE IN. To find one: start listing that kind of item on eBay by hand,
 * let eBay suggest the category, and the ID is the number at the end of the
 * category's own URL. Do it once per row here and it applies to every product
 * in that category forever.
 */
const EBAY_CATEGORY_IDS: Record<string, string> = {
  "wall-clocks": "",
  mirrors: "",
  "bedroom-mirrors": "",
  vases: "",
  planters: "",
  lighting: "",
  "living-room-lighting": "",
  "bedroom-lighting": "",
  "candles-and-lanterns": "",
  "coffee-tables": "",
  "side-tables": "",
  "console-tables": "",
  "bedside-tables": "",
  "tv-units": "",
  sofas: "",
  shelving: "",
  "living-room-storage": "",
  "wall-art": "",
  "water-features": "",
  "garden-furniture": "",
  "kitchen-furniture": "",
  desks: "",
  beds: "",
};

/** Set these up once in eBay (Account > Business policies), then put the names here. */
const SHIPPING_POLICY = "FILL-shipping-policy-name";
const RETURN_POLICY = "FILL-return-policy-name";
const PAYMENT_POLICY = "FILL-payment-policy-name";

const ITEM_LOCATION = "Bourne End";
const POSTCODE = "SL8 5NF";
/** Never list more than this, whatever the feed says. Dropship, not our shelf. */
const QUANTITY_CAP = 5;
const CONDITION_NEW = "1000";

interface Product {
  slug: string;
  title: string;
  summary: string | null;
  sku: string | null;
  joinKey: string | null;
  gtin: string | null;
  mpn: string | null;
  brand: string | null;
  category: string | null;
  supplier: string | null;
  photos: string[] | null;
  colours: string[] | null;
  materials: string[] | null;
  length: number | null;
  width: number | null;
  height: number | null;
  stockStatus: string | null;
}

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

/**
 * The category as an eBay item specific, in English.
 *
 * `C:Type` is shown to buyers and matched against their filters, so it takes
 * the slug turned back into words — "candles-and-lanterns" reads as "Candles
 * And Lanterns", not as a URL fragment.
 */
function typeSpecific(slug: string | null): string {
  if (!slug) return "";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * The listing description, built from stored facts only.
 *
 * No marketing language: the catalogue has spent weeks having that removed and
 * putting it back for eBay would undo it. Dimensions and materials are what a
 * buyer is actually trying to find, and they are what reduces returns.
 */
function description(p: Product): string {
  const parts: string[] = [];
  if (p.summary) parts.push(`<p>${p.summary}</p>`);
  const facts: string[] = [];
  if (p.length && p.width && p.height)
    facts.push(`Dimensions: ${p.length} x ${p.width} x ${p.height} cm`);
  if (p.materials?.length) facts.push(`Material: ${p.materials.join(", ")}`);
  if (p.colours?.length) facts.push(`Colour: ${p.colours.join(", ")}`);
  if (facts.length)
    parts.push(`<ul>${facts.map((f) => `<li>${f}</li>`).join("")}</ul>`);
  parts.push("<p>Free UK delivery. Sold by Kaiku.</p>");
  return parts.join("");
}

async function main() {
  const products = await client.fetch<Product[]>(
    `*[_type=="product" && !(_id in path("drafts.**"))
       && supplier->name in ["Hill Interiors","D.I. Designs"]
       && count(supplier->marketplacesAllowed[@ == "eBay"]) > 0
     ]{
      "slug": slug.current, title, summary, sku, gtin, mpn,
      "joinKey": coalesce(supplierSku, sku),
      "brand": brand->name,
      "category": category->slug.current,
      "supplier": supplier->name,
      "photos": gallery[].asset->url,
      "colours": colourTags, "materials": materialTags,
      "length": dimensions.length, "width": dimensions.width,
      "height": dimensions.height, stockStatus
    }`,
  );
  console.log(`${products.length} products from permitted suppliers.\n`);

  // Prices and stock come from the marketplace sheet, which already applies the
  // margin floor and the corrected (zero) eBay fee.
  const SHEET = "docs/change-log/2026-09-15-marketplace-listing-sheet.csv";
  const priceBySku = new Map<string, { price: number; stock: number | null }>();
  if (existsSync(SHEET)) {
    const lines = readFileSync(SHEET, "utf8").trim().split("\n");
    const head = lines[0]!.split(",");
    for (const line of lines.slice(1)) {
      const c = line.split(",");
      const row = Object.fromEntries(head.map((h, i) => [h, c[i] ?? ""]));
      const price = Number(row.mineBay);
      if (row.sku && Number.isFinite(price))
        priceBySku.set(row.sku.trim(), {
          price,
          stock: Number(row.stock) || null,
        });
    }
  }

  const COLUMNS = [
    "*Action(SiteID=UK|Country=GB|Currency=GBP|Version=1193)",
    "*Category",
    "*Title",
    "*Description",
    "*ConditionID",
    "PicURL",
    "*Quantity",
    "*Format",
    "*StartPrice",
    "*Duration",
    "*Location",
    "PostalCode",
    "CustomLabel",
    "Product:EAN",
    "C:Brand",
    "C:Colour",
    "C:Material",
    "C:Type",
    "ShippingProfileName",
    "ReturnProfileName",
    "PaymentProfileName",
  ];

  const rows: string[] = [COLUMNS.join(",")];
  const skipped: { slug: string; why: string }[] = [];
  const missingCategory = new Set<string>();

  for (const p of products) {
    const pricing = p.joinKey ? priceBySku.get(p.joinKey.trim()) : undefined;
    if (!pricing) {
      skipped.push({ slug: p.slug, why: "no price on the marketplace sheet" });
      continue;
    }
    if (!p.photos?.length) {
      skipped.push({ slug: p.slug, why: "no photograph" });
      continue;
    }
    if ((p.stockStatus ?? "").toLowerCase().includes("out")) {
      skipped.push({ slug: p.slug, why: "out of stock" });
      continue;
    }
    const catId = p.category ? EBAY_CATEGORY_IDS[p.category] : undefined;
    if (!catId) {
      if (p.category) missingCategory.add(p.category);
    }

    const title = p.title.replace(/\s*\|\s*Kaiku\s*$/i, "").slice(0, 80);
    const qty = Math.min(pricing.stock ?? 1, QUANTITY_CAP);

    rows.push(
      [
        "Add",
        catId || `FILL-${p.category ?? "unknown"}`,
        esc(title),
        esc(description(p)),
        CONDITION_NEW,
        esc(p.photos.slice(0, 12).join("|")),
        String(Math.max(qty, 1)),
        "FixedPrice",
        pricing.price.toFixed(2),
        "GTC",
        ITEM_LOCATION,
        POSTCODE,
        esc(p.sku ?? p.slug),
        p.gtin ?? "",
        esc(p.brand ?? "Kaiku"),
        esc(p.colours?.[0] ?? ""),
        esc(p.materials?.[0] ?? ""),
        esc(typeSpecific(p.category)),
        SHIPPING_POLICY,
        RETURN_POLICY,
        PAYMENT_POLICY,
      ].join(","),
    );
  }

  const OUT = "docs/change-log/2026-09-16-ebay-file-exchange.csv";
  writeFileSync(OUT, `${rows.join("\n")}\n`);

  console.log(`  ${rows.length - 1} listings written`);
  console.log(`  ${skipped.length} skipped\n`);
  const why = new Map<string, number>();
  for (const s of skipped) why.set(s.why, (why.get(s.why) ?? 0) + 1);
  for (const [w, n] of why) console.log(`    ${String(n).padStart(4)}  ${w}`);

  if (missingCategory.size) {
    console.log(
      `\n  BLOCKED — ${missingCategory.size} eBay category IDs not set.`,
    );
    console.log(
      "  The file is written but WILL BE REJECTED until these are filled",
    );
    console.log(
      "  in EBAY_CATEGORY_IDS. Fill each once; it covers every product in it:\n",
    );
    for (const c of [...missingCategory].sort()) {
      const n = products.filter((p) => p.category === c).length;
      console.log(`    ${String(n).padStart(4)} products   "${c}": "",`);
    }
  }
  console.log(`\n  -> ${OUT}`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
