/**
 * The comprehensive audit Damien asked for after the SKU/artefact fixes:
 * every product, drafts included this time (the read-only version earlier
 * today couldn't see them — no write token in that pass). Same scoring
 * engine as the live readiness screen, so this cannot disagree with it.
 *
 * Beyond tier counts, this classifies every REVIEW-tier "zero facts" product
 * by whether the underlying document actually holds real dimensions/weight/
 * specs the description just failed to use (fixable — real facts exist,
 * just need writing up properly) versus genuinely having none recorded at
 * all (blocked — nothing true to write until the data exists).
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-full-catalogue.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import {
  ARTEFACTS,
  DIMENSIONS,
  scoreProduct,
} from "../src/lib/catalog/quality";
import { toQualityInput } from "../src/lib/catalog/quality-input";
import { isCanonicalSku } from "../src/lib/catalog/sku";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set.");
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
  _id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  description: unknown;
  faqs: { question?: string | null; answer?: string | null }[] | null;
  price: number | null;
  costPrice: number | null;
  shippingCost: number | null;
  sku: string | null;
  supplierSku: string | null;
  gtin: string | null;
  supplier: string | null;
  category: string | null;
  categorySlug: string | null;
  primaryColour: string | null;
  dimensions: unknown;
  weight: unknown;
  stockStatus: string | null;
  galleryCount: number | null;
  specs: { label?: string | null; value?: string | null }[] | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

function hasRealDims(d: unknown): boolean {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  return ["length", "width", "height"].some(
    (k) => typeof o[k] === "number" && (o[k] as number) > 0,
  );
}
function hasRealWeight(w: unknown): boolean {
  if (!w || typeof w !== "object") return false;
  const o = w as Record<string, unknown>;
  return typeof o.value === "number" && (o.value as number) > 0;
}
function hasRealSpecs(specs: Row["specs"]): boolean {
  return (specs ?? []).some((s) => s?.label && s?.value);
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product"]{
      _id, title, "slug": slug.current, summary, description, faqs,
      price, costPrice, shippingCost, sku, supplierSku, gtin,
      "supplier": supplier->name,
      "category": category->title,
      "categorySlug": category->slug.current,
      primaryColour,
      stockStatus, dimensions, weight,
      "galleryCount": count(gallery),
      specs,
      "seoTitle": seo.metaTitle,
      "seoDescription": seo.metaDescription
    }`,
  );

  const scored = rows.map((row) => ({
    row,
    result: scoreProduct(toQualityInput(row)),
  }));

  const published = scored.filter((s) => !s.row._id.startsWith("drafts."));
  const drafts = scored.filter((s) => s.row._id.startsWith("drafts."));

  const tierCounts = { GOLD: 0, SILVER: 0, REVIEW: 0 };
  for (const { result } of scored) tierCounts[result.tier] += 1;
  const publishedTierCounts = { GOLD: 0, SILVER: 0, REVIEW: 0 };
  for (const { result } of published) publishedTierCounts[result.tier] += 1;

  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
  };
  const medians = Object.fromEntries(
    DIMENSIONS.map((d) => [
      d,
      median(published.map((s) => s.result.scores[d])),
    ]),
  );

  // REVIEW-tier, zero-fact products: classify fixable vs blocked.
  const zeroFactReview = scored.filter(
    (s) =>
      s.result.tier === "REVIEW" &&
      s.result.findings.some((f) => /not one measurement/.test(f.message)),
  );
  const fixable = zeroFactReview.filter(
    ({ row }) =>
      hasRealDims(row.dimensions) ||
      hasRealWeight(row.weight) ||
      hasRealSpecs(row.specs),
  );
  const blocked = zeroFactReview.filter(
    ({ row }) =>
      !hasRealDims(row.dimensions) &&
      !hasRealWeight(row.weight) &&
      !hasRealSpecs(row.specs),
  );

  // SKU + artefact spot-check (should be clean after today's fixes).
  const noSku = rows.filter((r) => !r.sku).length;
  const nonCanonical = rows.filter(
    (r) => r.sku && !isCanonicalSku(r.sku),
  ).length;
  const artefactHits: Record<string, number> = {};
  for (const { result } of scored) {
    for (const finding of result.findings) {
      if (!ARTEFACTS.some((a) => a.message === finding.message)) continue;
      artefactHits[finding.message] = (artefactHits[finding.message] ?? 0) + 1;
    }
  }

  console.log(
    `\nTOTAL: ${rows.length} (${published.length} published, ${drafts.length} drafts)\n`,
  );
  console.log("TIER — ALL:", tierCounts);
  console.log("TIER — PUBLISHED:", publishedTierCounts);
  console.log("\nMEDIANS (published):");
  for (const d of DIMENSIONS)
    console.log(`  ${d.padEnd(14)} ${medians[d]!.toFixed(1)}`);

  console.log(
    `\nSKU: missing=${noSku} non-canonical=${nonCanonical} (should both be 0)`,
  );
  console.log(
    "ARTEFACTS remaining:",
    Object.keys(artefactHits).length === 0 ? "none" : artefactHits,
  );

  console.log(`\nREVIEW, zero-fact pattern: ${zeroFactReview.length} total`);
  console.log(
    `  fixable (real dims/weight/specs exist, description just doesn't use them): ${fixable.length}`,
  );
  console.log(
    `  blocked (no dims, no weight, no specs recorded at all): ${blocked.length}`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-full-catalogue-audit.json`,
    JSON.stringify(
      {
        total: rows.length,
        publishedCount: published.length,
        draftCount: drafts.length,
        tierCounts,
        publishedTierCounts,
        medians,
        sku: { missing: noSku, nonCanonical },
        artefactHits,
        fixable: fixable.map(({ row, result }) => ({
          id: row._id,
          title: row.title,
          slug: row.slug,
          published: !row._id.startsWith("drafts."),
          overall: result.overall,
          words: result.stats.words,
          hasDims: hasRealDims(row.dimensions),
          hasWeight: hasRealWeight(row.weight),
          hasSpecs: hasRealSpecs(row.specs),
          dimensions: row.dimensions,
          weight: row.weight,
          specs: row.specs,
          category: row.category,
          supplier: row.supplier,
          price: row.price,
        })),
        blocked: blocked.map(({ row, result }) => ({
          id: row._id,
          title: row.title,
          slug: row.slug,
          published: !row._id.startsWith("drafts."),
          overall: result.overall,
          words: result.stats.words,
          category: row.category,
          supplier: row.supplier,
        })),
      },
      null,
      2,
    ),
  );
  console.log("\nFull detail written to docs/change-log.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
