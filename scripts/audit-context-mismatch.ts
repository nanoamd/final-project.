/**
 * Finds every product described as if it lived somewhere it does not.
 *
 * Damien, after seeing the first fault the long-form writer shipped — a pergola
 * told how it would read "in the room" — asked for the same class of mistake to
 * be found across the whole catalogue. It is the most visible kind of error we
 * carry: a shopper reading about their hallway on a garden page knows instantly
 * that nobody looked at the product.
 *
 * Covers published documents and drafts, because a draft is what gets published
 * next and a fault left in one is a fault scheduled for release.
 *
 *   pnpm tsx --env-file=.env.local scripts/audit-context-mismatch.ts
 *   pnpm tsx --env-file=.env.local scripts/audit-context-mismatch.ts --all
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import {
  type ContextFault,
  contextFaults,
  sitingFor,
} from "../src/lib/catalog/context-check";
import { plainTextOf } from "../src/lib/catalog/quality-input";

const showAll = process.argv.includes("--all");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Row {
  _id: string;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  description?: unknown;
  category?: string | null;
}

async function main() {
  const rows: Row[] = await client.fetch(
    `*[_type == "product"]{ _id, title, summary, description,
      "slug": slug.current, "category": category->title }`,
  );

  const findings: {
    id: string;
    title: string;
    slug: string;
    category: string;
    siting: string;
    published: boolean;
    faults: ContextFault[];
  }[] = [];

  let checked = 0;
  const bySiting = { outdoor: 0, indoor: 0, either: 0 };

  for (const row of rows) {
    const siting = sitingFor(row.category);
    bySiting[siting] += 1;
    if (siting === "either") continue;
    checked += 1;
    // The summary counts. It is the first thing read and the thing that shows
    // in listings, so a slip there is more visible than one buried at the
    // bottom of a description, not less.
    const text = [row.summary ?? "", plainTextOf(row.description)]
      .filter(Boolean)
      .join("\n");
    const faults = contextFaults(text, siting);
    if (faults.length)
      findings.push({
        id: row._id,
        title: row.title ?? "",
        slug: row.slug ?? "",
        category: row.category ?? "",
        siting,
        published: !row._id.startsWith("drafts."),
        faults,
      });
  }

  const affected = findings.length;
  const faultCount = findings.reduce((n, f) => n + f.faults.length, 0);

  console.log(`\nContext mismatches — copy describing the wrong place\n`);
  console.log(`Products in catalogue:   ${rows.length}`);
  console.log(
    `  outdoor: ${bySiting.outdoor}   indoor: ${bySiting.indoor}   either (not checked): ${bySiting.either}`,
  );
  console.log(`Checked:                 ${checked}`);
  console.log(`Products with faults:    ${affected}`);
  console.log(
    `  published:             ${findings.filter((f) => f.published).length}`,
  );
  console.log(
    `  drafts:                ${findings.filter((f) => !f.published).length}`,
  );
  console.log(`Total faults:            ${faultCount}`);

  const byPhrase = new Map<string, number>();
  for (const f of findings)
    for (const fault of f.faults)
      byPhrase.set(fault.phrase, (byPhrase.get(fault.phrase) ?? 0) + 1);
  console.log(`\nMost common slips:`);
  for (const [phrase, count] of [...byPhrase]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20))
    console.log(`  ${String(count).padStart(4)}  "${phrase}"`);

  const byCategory = new Map<string, number>();
  for (const f of findings)
    byCategory.set(f.category, (byCategory.get(f.category) ?? 0) + 1);
  console.log(`\nBy category:`);
  for (const [category, count] of [...byCategory].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(count).padStart(4)}  ${category}`);

  console.log(`\n──── ${showAll ? "every finding" : "first 15"} ────`);
  for (const f of showAll ? findings : findings.slice(0, 15)) {
    console.log(
      `\n${f.published ? "LIVE " : "draft"}  ${f.title}  [${f.category}, ${f.siting}]`,
    );
    for (const fault of f.faults)
      console.log(`   "${fault.phrase}"  →  ${fault.sentence}`);
  }

  mkdirSync(".audit", { recursive: true });
  writeFileSync(
    ".audit/context-mismatches.json",
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        checked,
        affected,
        faultCount,
        findings,
      },
      null,
      2,
    ),
  );
  console.log(`\nWritten to .audit/context-mismatches.json`);
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
