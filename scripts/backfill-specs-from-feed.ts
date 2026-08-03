/**
 * One-off migration: for AW Dropship-sourced products (sku starting
 * "AW-") whose Specifications box is still empty, backfill it from data
 * that's ALREADY sitting on the AW Dropship feed and on the product
 * document itself — no scraping of external supplier pages, because
 * there isn't a real per-product supplier URL to scrape: every AW product
 * was imported with `sourceUrl` hardcoded to the supplier's homepage
 * (https://www.aw-dropship.com/), not a per-item deep link, and the feed
 * itself has no "product URL" column either. See scripts/import-aw-products.ts.
 *
 * What this DOES use, which is real per-product structured data:
 *   - the feed's "Unit dimensions" column (e.g. "65x51x42 (cm)")   → "Dimensions"
 *   - the feed's "Materials/Ingredients" column (e.g. "Recycled teak wood") → "Materials"
 *   - the product's own stored `weight` field (already captured at import time,
 *     just never surfaced in the Specifications tab)              → "Weight"
 *
 * Conservative by design, same as extract-product-specs.ts: only touches
 * products with a currently-empty `specs` array, never overwrites what an
 * editor already entered, and only adds a row when real data exists for
 * it — never fabricates a value. Run this alongside (either order)
 * extract-product-specs.ts, which covers the same gap for products whose
 * description has an explicit "Label: value" bullet list instead.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/backfill-specs-from-feed.ts
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token,
  useCdn: false,
});

const FEED_URL = "https://www.aw-dropship.com/data-feed.csv";

/** Minimal RFC-4180 CSV parser (quoted fields, embedded commas/newlines) —
 * identical to the one in import-aw-products.ts, kept in sync deliberately
 * rather than shared, since this is a one-off script. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

interface ProductRow {
  _id: string;
  title: string;
  sku?: string;
  specs?: unknown[];
  weight?: { value?: number; unit?: string };
}

async function main() {
  console.log("Fetching AW Dropship feed…");
  const feedRes = await fetch(FEED_URL);
  if (!feedRes.ok) {
    console.error(`Feed download failed: HTTP ${feedRes.status}`);
    process.exit(1);
  }
  const rows = parseCsv(await feedRes.text());
  const header = rows[0]!;
  const col = (name: string) => header.indexOf(name);
  const records = new Map(
    rows.slice(1).map((r) => [r[col("Product code")], r] as const),
  );

  const products = await client.fetch<ProductRow[]>(
    `*[_type == "product"]{ _id, title, sku, specs, weight }`,
  );

  let updated = 0;
  let skippedHasSpecs = 0;
  let skippedNoData = 0;

  for (const product of products) {
    if (product.specs?.length) {
      skippedHasSpecs++;
      continue;
    }

    const candidates: { label: string; value: string }[] = [];

    const code = product.sku?.startsWith("AW-")
      ? product.sku.slice(3)
      : undefined;
    const record = code ? records.get(code) : undefined;
    if (record) {
      const dims = record[col("Unit dimensions")]?.trim();
      if (dims) candidates.push({ label: "Dimensions", value: dims });
      const materials = record[col("Materials/Ingredients")]?.trim();
      if (materials) candidates.push({ label: "Materials", value: materials });
    }

    if (typeof product.weight?.value === "number" && product.weight.value > 0) {
      candidates.push({
        label: "Weight",
        value: `${product.weight.value} ${product.weight.unit ?? "kg"}`,
      });
    }

    if (!candidates.length) {
      const reason = code
        ? record
          ? "feed row has no dimensions/materials, and no weight on file"
          : "not found in feed, and no weight on file"
        : "not an AW Dropship product, and no weight on file";
      console.warn(`✗ ${product.title}: skipped (${reason})`);
      skippedNoData++;
      continue;
    }

    await client
      .patch(product._id)
      .set({
        specs: candidates.map((c) => ({
          _type: "productSpec",
          _key: slugify(c.label) || Math.random().toString(36).slice(2),
          label: c.label,
          value: c.value,
        })),
      })
      .commit();

    console.log(
      `✓ ${product.title}: added ${candidates.length} spec${candidates.length === 1 ? "" : "s"} (${candidates.map((c) => c.label).join(", ")})`,
    );
    updated++;
  }

  console.log(
    `\nDone. Updated ${updated}, already had specs ${skippedHasSpecs}, no data available ${skippedNoData} (those need a human to fill in — likely a non-AW product, or a feed row missing dimensions/materials).`,
  );
}

main().catch((err) => {
  console.error("backfill-specs-from-feed failed:", err);
  process.exit(1);
});
