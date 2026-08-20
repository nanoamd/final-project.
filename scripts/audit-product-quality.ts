/**
 * Scores every product in the catalogue and writes the audit report.
 *
 * Read-only. Changes nothing, ever — the point of the exercise is to decide
 * what to change before changing it.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-product-quality.ts
 *   pnpm tsx --env-file=.env.local scripts/audit-product-quality.ts --json .audit/scores.json
 */
import { writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import {
  type Dimension,
  DIMENSIONS,
  scoreProduct,
} from "../src/lib/catalog/quality";
import {
  type ProductDocument,
  QUALITY_PROJECTION,
  toQualityInput,
} from "../src/lib/catalog/quality-input";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

type Row = ProductDocument & { _createdAt: string; _updatedAt: string };

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

async function main() {
  const rows: Row[] = await client.fetch(
    `*[_type == "product"] ${QUALITY_PROJECTION} | order(_createdAt asc)`,
  );

  const scored = rows.map((doc) => ({
    doc,
    published: !doc._id.startsWith("drafts."),
    result: scoreProduct(toQualityInput(doc)),
  }));

  const published = scored.filter((s) => s.published);

  const jsonFlag = process.argv.indexOf("--json");
  const jsonPath = jsonFlag === -1 ? null : process.argv[jsonFlag + 1];
  if (jsonPath) {
    writeFileSync(
      jsonPath,
      JSON.stringify(
        scored.map((s) => ({
          id: s.doc._id,
          title: s.doc.title,
          supplier: s.doc.supplier,
          category: s.doc.category,
          createdAt: s.doc._createdAt,
          published: s.published,
          ...s.result,
        })),
        null,
        0,
      ),
    );
  }

  const line = (label: string, value: string | number) =>
    console.log(`${label.padEnd(34)} ${value}`);

  console.log("\n════ KAIKU CATALOGUE QUALITY AUDIT ════\n");
  line("Products scored", scored.length);
  line("Published", published.length);
  line("Drafts", scored.length - published.length);

  for (const [name, set] of [
    ["PUBLISHED", published],
    ["ALL", scored],
  ] as const) {
    console.log(`\n──── ${name} ────`);
    const tiers = { GOLD: 0, SILVER: 0, REVIEW: 0 };
    const grades = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const s of set) {
      tiers[s.result.tier]++;
      grades[s.result.grade]++;
    }
    line(
      "Tiers",
      `GOLD ${tiers.GOLD} · SILVER ${tiers.SILVER} · REVIEW ${tiers.REVIEW}`,
    );
    line(
      "Grades",
      `A ${grades.A} · B ${grades.B} · C ${grades.C} · D ${grades.D} · E ${grades.E}`,
    );
    line("Median overall", median(set.map((s) => s.result.overall)).toFixed(1));
    console.log("  by dimension (median):");
    for (const d of DIMENSIONS) {
      const m = median(set.map((s) => s.result.scores[d as Dimension]));
      const bar = "█".repeat(Math.round(m)) + "·".repeat(10 - Math.round(m));
      console.log(`    ${d.padEnd(15)} ${bar} ${m.toFixed(1)}`);
    }
  }

  // ---- Drift: quality against creation date ----------------------------
  console.log("\n──── DRIFT: quality by the day the product was written ────");
  console.log(
    "day          n   overall  specificity  aiRisk  words  facts/100w",
  );
  const byDay = new Map<string, typeof scored>();
  for (const s of scored) {
    const day = s.doc._createdAt.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(s);
  }
  for (const [day, set] of [...byDay].sort()) {
    const withCopy = set.filter((s) => s.result.stats.words > 40);
    if (!withCopy.length) {
      console.log(
        `${day}  ${String(set.length).padStart(4)}   — no written copy —`,
      );
      continue;
    }
    console.log(
      `${day}  ${String(set.length).padStart(4)}   ` +
        `${median(withCopy.map((s) => s.result.overall))
          .toFixed(1)
          .padStart(5)}   ` +
        `${median(withCopy.map((s) => s.result.scores.specificity))
          .toFixed(1)
          .padStart(9)}   ` +
        `${median(withCopy.map((s) => s.result.scores.aiRisk))
          .toFixed(1)
          .padStart(5)}   ` +
        `${String(Math.round(median(withCopy.map((s) => s.result.stats.words)))).padStart(5)}   ` +
        `${median(withCopy.map((s) => s.result.stats.factsPer100))
          .toFixed(2)
          .padStart(6)}`,
    );
  }

  // ---- By supplier ------------------------------------------------------
  console.log("\n──── PUBLISHED, BY SUPPLIER ────");
  const bySupplier = new Map<string, typeof published>();
  for (const s of published) {
    const key = s.doc.supplier ?? "(none)";
    if (!bySupplier.has(key)) bySupplier.set(key, []);
    bySupplier.get(key)!.push(s);
  }
  for (const [name, set] of [...bySupplier].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    const gold = set.filter((s) => s.result.tier === "GOLD").length;
    const review = set.filter((s) => s.result.tier === "REVIEW").length;
    console.log(
      `  ${name.padEnd(38)} n=${String(set.length).padStart(3)}  ` +
        `overall=${median(set.map((s) => s.result.overall)).toFixed(1)}  ` +
        `GOLD=${gold}  REVIEW=${review}`,
    );
  }

  // ---- The benchmark and the worst -------------------------------------
  const ranked = [...published].sort(
    (a, b) => b.result.overall - a.result.overall,
  );
  console.log("\n──── KAIKU GOLD STANDARD — highest scoring published ────");
  for (const s of ranked.slice(0, 15)) {
    console.log(
      `  ${s.result.overall.toFixed(1)}  ${s.result.tier.padEnd(6)} ` +
        `${String(s.result.stats.words).padStart(4)}w  ` +
        `${s.result.stats.factsPer100.toFixed(2).padStart(4)}f  ` +
        `${s.doc._createdAt.slice(0, 10)}  ${(s.doc.title ?? "").slice(0, 58)}`,
    );
  }
  console.log("\n──── WORST PUBLISHED ────");
  for (const s of ranked.slice(-15).reverse()) {
    console.log(
      `  ${s.result.overall.toFixed(1)}  ${s.result.tier.padEnd(6)} ` +
        `${String(s.result.stats.words).padStart(4)}w  ` +
        `${s.result.stats.factsPer100.toFixed(2).padStart(4)}f  ` +
        `${s.doc._createdAt.slice(0, 10)}  ${(s.doc.title ?? "").slice(0, 58)}`,
    );
  }

  // ---- What is actually wrong, counted ---------------------------------
  console.log("\n──── MOST COMMON FINDINGS (published) ────");
  const tally = new Map<string, number>();
  for (const s of published) {
    for (const f of s.result.findings) {
      // Group by the shape of the message, not its numbers.
      const key = f.message.replace(/\d+/g, "N").replace(/“[^”]*”/g, "…");
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }
  for (const [message, count] of [...tally]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 22)) {
    console.log(`  ${String(count).padStart(4)}  ${message.slice(0, 96)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
