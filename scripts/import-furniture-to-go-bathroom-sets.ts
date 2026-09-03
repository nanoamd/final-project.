/**
 * Imports Furniture To Go's nine bathroom five-piece sets — see
 * scripts/data/furniture-to-go-bathroom.ts for what these are and why the
 * individual cabinets/mirrors/under-sink pieces are not included here.
 *
 * Damien: "furniture to go has accepted us too so we have plenty of bathroom
 * products now." Bathroom is the department with the thinnest anchor on the
 * whole site — Mirrors (6 live) and Storage (11 live) either side of two
 * fully empty categories (Towel Rails, Lighting). Nine substantial multi-piece
 * furniture sets is a real change to that, not a marginal one.
 *
 * WHAT THIS WRITES AND WHAT IT DOES NOT. Everything factual: title, category,
 * brand (the collection — Veris, Ipsarion, Ice Cave, Lokko, Alice Springs),
 * supplier, SKU, GTIN, packed dimensions, specs, images. It does NOT write a
 * price or a description — Furniture To Go hide trade prices behind their
 * account login, same as every other supplier on this account with a login
 * wall, and the description is Damien's voice to write or commission once a
 * price exists to write it against.
 *
 * CARRIAGE IS CONFIRMED, NOT INFERRED — a first for this session. Furniture To
 * Go publish "free next day delivery" and "no MOQ" as their own trade terms,
 * dropshipping direct to the customer. That is written onto the supplier
 * record as shippingRule.kind = "included", with the source quoted in notes,
 * so scripts/audit-supplier-readiness.ts stops flagging this supplier BLOCKED
 * the moment a price exists to measure margin against.
 *
 *   pnpm tsx --env-file=.env.local scripts/import-furniture-to-go-bathroom-sets.ts
 *   pnpm tsx --env-file=.env.local scripts/import-furniture-to-go-bathroom-sets.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { FTG_BATHROOM_SETS } from "./data/furniture-to-go-bathroom";

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

const SUPPLIER_ID = "supplier-furniture-to-go";
const CATEGORY_ID = "category-bathroom-storage";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleFor(collection: string, shortFinish: string): string {
  return `${collection} 5 Piece Bathroom Set ${shortFinish} | Kaiku`;
}

async function uploadImage(url: string, filename: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KaikuCatalogueSync/1.0)",
    },
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength < 5000)
    throw new Error(`${url} returned ${buffer.byteLength} bytes — placeholder`);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function main() {
  // Caught in dry run once already: two Veris finishes ("...Light Grey doors"
  // and "...Sage Green doors") collapsed to the same title and slug under an
  // earlier version of titleFor(). Failing loudly here if it ever recurs is
  // cheaper than a second product silently overwriting the first draft.
  const slugs = FTG_BATHROOM_SETS.map((item) =>
    slugify(
      titleFor(item.collection, item.shortFinish).replace(" | Kaiku", ""),
    ),
  );
  const duplicateSlugs = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);
  if (duplicateSlugs.length) {
    console.error(
      `Duplicate slugs would be created: ${[...new Set(duplicateSlugs)].join(", ")}`,
    );
    process.exit(1);
  }

  const existing = await client.fetch<string[]>(
    `*[_type=="product" && sku in $skus].sku`,
    { skus: FTG_BATHROOM_SETS.map((i) => i.sku) },
  );
  if (existing.length)
    console.log(`Already present, skipping: ${existing.join(", ")}`);

  const results: Record<string, unknown>[] = [];

  if (apply) {
    await client.createOrReplace({
      _id: SUPPLIER_ID,
      _type: "supplier",
      name: "Furniture To Go",
      website: "https://furniture-to-go.co.uk",
      shippingRule: {
        _type: "shippingRule",
        kind: "included",
        notes:
          "Furniture To Go's own trade terms, published on their site: free next-day delivery, no MOQ, dropship direct to the customer. Confirmed by the supplier in writing, not inferred — the first supplier on this account in that state. Re-check if their terms page changes.",
      },
      notes:
        "Trade-only furniture wholesaler, ~1,100 SKUs, 97% next-day availability. Approved as a Kaiku trade account 3 September 2026. Trade prices are hidden behind the account login — costPrice is null on every product here until Damien supplies the trade list.",
    });
  }

  for (const item of FTG_BATHROOM_SETS) {
    if (existing.includes(item.sku)) continue;

    const title = titleFor(item.collection, item.shortFinish);
    const slug = slugify(title.replace(" | Kaiku", ""));
    const brandId = `brand-ftg-${slugify(item.collection)}`;

    console.log(`\n${title.replace(" | Kaiku", "")}`);
    console.log(
      `   sku ${item.sku}   ean ${item.ean}   ${item.weightKg}kg, ${item.boxes} boxes   ${item.availability}`,
    );
    console.log(`   no trade price, no description — both to follow`);

    results.push({
      sku: item.sku,
      ean: item.ean,
      collection: item.collection,
      title,
      slug,
      weightKg: item.weightKg,
      boxes: item.boxes,
      availability: item.availability,
    });

    if (!apply) continue;

    await client.createOrReplace({
      _id: brandId,
      _type: "brand",
      name: `Furniture To Go — ${item.collection}`,
      slug: { _type: "slug", current: slugify(`ftg-${item.collection}`) },
      description: `The ${item.collection} bathroom collection from Furniture To Go.`,
      website: "https://furniture-to-go.co.uk",
    });

    let assetId: string | null = null;
    try {
      assetId = await uploadImage(item.imageUrl, `${slug}-1.jpg`);
      console.log(`   image uploaded`);
    } catch (error) {
      console.log(`   image skipped: ${(error as Error).message}`);
    }

    await client.createOrReplace({
      // A draft, with no price: see the header. Publishing is Damien's call.
      _id: `drafts.ftg-${item.sku.toLowerCase()}`,
      _type: "product",
      title,
      slug: { _type: "slug", current: slug },
      category: { _type: "reference", _ref: CATEGORY_ID },
      brand: { _type: "reference", _ref: brandId },
      supplier: { _type: "reference", _ref: SUPPLIER_ID },
      sku: item.sku,
      supplierSku: item.sku,
      gtin: item.ean,
      currency: "GBP",
      sourceUrl: item.sourceUrl,
      summary: `A five-piece bathroom furniture set in ${item.finish.toLowerCase()}: ${item.pieces.join(", ").toLowerCase()}.`,
      stockStatus: item.availability === "In Stock" ? "In Stock" : "Preorder",
      deliveryLeadTime:
        item.availability === "In Stock" ? "Next day" : item.availability,
      specs: [
        {
          _key: "spec-0",
          _type: "productSpec",
          label: "Collection",
          value: item.collection,
        },
        {
          _key: "spec-1",
          _type: "productSpec",
          label: "Finish",
          value: item.finish,
        },
        {
          _key: "spec-2",
          _type: "productSpec",
          label: "The five pieces",
          value: item.pieces.join(", "),
        },
        {
          _key: "spec-3",
          _type: "productSpec",
          label: "Largest packed carton",
          value: `${item.largestBoxCm.w} x ${item.largestBoxCm.h} x ${item.largestBoxCm.d} cm — packed size, not assembled footprint`,
        },
        {
          _key: "spec-4",
          _type: "productSpec",
          label: "Number of boxes",
          value: String(item.boxes),
        },
        {
          _key: "spec-5",
          _type: "productSpec",
          label: "Assembled weight",
          value: `${item.weightKg} kg`,
        },
      ],
      ...(assetId
        ? {
            gallery: [
              {
                _key: "img0",
                _type: "image",
                asset: { _type: "reference", _ref: assetId },
                alt: title.replace(" | Kaiku", ""),
              },
            ],
          }
        : {}),
    });
    console.log(`   created drafts.ftg-${item.sku.toLowerCase()}`);
  }

  console.log(
    `\n${apply ? "Created" : "Would create"} ${results.length} Furniture To Go drafts in Bathroom Storage.`,
  );
  console.log(
    "No prices and no descriptions written — trade prices are behind their\n" +
      "account login. Carriage is confirmed free/included, in the supplier's own\n" +
      "written terms, not inferred.",
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-03-import-furniture-to-go-bathroom-sets.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
