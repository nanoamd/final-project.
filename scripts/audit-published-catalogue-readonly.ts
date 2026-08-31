/**
 * Read-only audit of every PUBLISHED product's description quality and SKU
 * status, run without SANITY_API_WRITE_TOKEN — this session's sandbox came up
 * with no `.env.local` at all, and Sanity's public dataset happens to be
 * readable unauthenticated for published documents, so this is the honest
 * subset of the full audit that's actually possible right now. Drafts are
 * invisible without a token and are NOT counted here — do not read "726
 * published" below as "the whole catalogue".
 *
 * Reuses the exact scoring engine the live admin screen uses
 * (src/lib/catalog/quality.ts) and the exact SKU canonicalisation rules
 * (src/lib/catalog/sku.ts), so this cannot disagree with either.
 *
 *   pnpm tsx scripts/audit-published-catalogue-readonly.ts
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

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
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

  console.log(
    `\n${rows.length} documents visible without a write token (published only — drafts are invisible from here).\n`,
  );

  const scored = rows.map((row) => ({
    row,
    result: scoreProduct(toQualityInput(row)),
  }));

  // --- Tier / grade distribution -----------------------------------------
  const tierCounts = { GOLD: 0, SILVER: 0, REVIEW: 0 };
  for (const { result } of scored) tierCounts[result.tier] += 1;

  // --- Median per dimension ------------------------------------------------
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
  };
  const medians = Object.fromEntries(
    DIMENSIONS.map((d) => [d, median(scored.map((s) => s.result.scores[d]))]),
  );

  // --- Artefact instances, with real examples ------------------------------
  const artefactHits: Record<string, { title: string; slug: string | null }[]> =
    {};
  for (const { row, result } of scored) {
    for (const finding of result.findings) {
      if (!ARTEFACTS.some((a) => a.message === finding.message)) continue;
      const list = artefactHits[finding.message] ?? [];
      if (list.length < 8) list.push({ title: row.title, slug: row.slug });
      artefactHits[finding.message] = list;
    }
  }

  // --- SKU status -----------------------------------------------------------
  const noSku = rows.filter((r) => !r.sku);
  const nonCanonical = rows.filter((r) => r.sku && !isCanonicalSku(r.sku));
  const canonical = rows.filter((r) => r.sku && isCanonicalSku(r.sku));
  const formatSamples = new Map<string, string[]>();
  for (const r of nonCanonical) {
    // Bucket by rough shape so six formats show as six groups, not 400 rows.
    const shape = r.sku!.replace(/[A-Za-z]/g, "A").replace(/\d/g, "9");
    const list = formatSamples.get(shape) ?? [];
    if (list.length < 3) list.push(r.sku!);
    formatSamples.set(shape, list);
  }

  // --- Worst 30, worst first --------------------------------------------
  const worst = [...scored]
    .sort((a, b) => a.result.overall - b.result.overall)
    .slice(0, 30);

  console.log("TIER DISTRIBUTION (published, live-read):");
  console.log(`  GOLD   ${tierCounts.GOLD}`);
  console.log(`  SILVER ${tierCounts.SILVER}`);
  console.log(`  REVIEW ${tierCounts.REVIEW}`);

  console.log("\nMEDIAN SCORE PER DIMENSION (published):");
  for (const d of DIMENSIONS)
    console.log(`  ${d.padEnd(14)} ${medians[d]!.toFixed(1)}`);

  console.log(
    "\nARTEFACTS FOUND LIVE (HTML entities, markdown left in, etc.):",
  );
  for (const [message, examples] of Object.entries(artefactHits)) {
    console.log(`  ${message}`);
    for (const ex of examples) console.log(`    - ${ex.title}`);
  }
  if (Object.keys(artefactHits).length === 0) console.log("  none found");

  console.log("\nSKU STATUS (published, live-read):");
  console.log(`  canonical      ${canonical.length}`);
  console.log(`  non-canonical  ${nonCanonical.length}`);
  console.log(`  missing        ${noSku.length}`);
  console.log("  non-canonical formats seen:");
  for (const [shape, examples] of formatSamples) {
    console.log(`    ${shape.padEnd(24)} e.g. ${examples.join(", ")}`);
  }

  console.log("\nWORST 30 PUBLISHED PRODUCTS:");
  for (const { row, result } of worst) {
    const worstFinding =
      result.findings.find((f) => f.severity === "blocker") ??
      result.findings.find((f) => f.severity === "major") ??
      result.findings[0];
    console.log(
      `  ${result.overall.toFixed(1).padStart(4)} ${result.tier.padEnd(6)} ${row.title.slice(0, 46).padEnd(48)} ${worstFinding?.message ?? ""}`,
    );
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-published-catalogue-audit-readonly.json`,
    JSON.stringify(
      {
        countVisible: rows.length,
        note: "Published only — no write token this session, drafts invisible.",
        tierCounts,
        medians,
        artefactHits,
        sku: {
          canonical: canonical.length,
          nonCanonical: nonCanonical.length,
          missing: noSku.length,
          formatsSeen: Object.fromEntries(formatSamples),
        },
        worst30: worst.map(({ row, result }) => ({
          title: row.title,
          slug: row.slug,
          overall: result.overall,
          tier: result.tier,
          findings: result.findings.map((f) => f.message),
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
