/**
 * Deletes specification rows whose value is a non-answer.
 *
 * The Specifications tab was rendering rows like:
 *
 *   Finish            Not specified
 *   Weight capacity   Not specified
 *   Packed size       Please contact our team for more details.
 *
 * A spec table exists to answer questions. A row that says we don't know is
 * worse than no row — it draws the eye to the gap and reads as carelessness,
 * which is the opposite of "the UK's most helpful home store". One product
 * (the Amalfi bistro table) had all five of its rows like this, so its
 * Specifications tab was five lines of nothing.
 *
 * Detection reuses `isAdmission` from `src/lib/catalog/admissions.ts` rather
 * than a fresh regex — the rule this session keeps re-learning — plus a short
 * list of exact junk values that are non-answers without being admissions
 * ("N/A", "-", "TBC").
 *
 * Values that merely *contain* a hedge in brackets are trimmed rather than
 * dropped, because the useful part is real: "Glass (exact specifications not
 * provided)" becomes "Glass".
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-spec-nonanswers.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-spec-nonanswers.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { isAdmission } from "@/lib/catalog/admissions";

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

/**
 * Non-answers that aren't phrased as admissions, so `isAdmission` misses them.
 *
 * "No" is deliberately NOT in this list. "Bulb Included: No" and "Dishwasher
 * Safe: No" are definitive answers and among the most useful rows in the
 * table — a first draft of this script dropped 9 of them as junk, which would
 * have left customers to guess whether a bulb was in the box.
 */
const JUNK_VALUES = new Set([
  "n/a",
  "na",
  "-",
  "--",
  "tbc",
  "tba",
  "unknown",
  "not applicable",
  "not stated",
  "not specified",
]);

/**
 * A hedge in brackets after a real value: "Glass (exact specs not provided)".
 *
 * The bracket must be about the *information* being absent, never about the
 * *item* being absent. "1 x AA (not supplied)" and "8 x E14 40W (not
 * included)" are facts a shopper needs — they mean "buy a battery" — and an
 * earlier version of this regex matched any bracket containing "not" and
 * stripped exactly those, turning a warning into an implied promise. This is
 * the same distinction `admissions.ts` documents for its own verb list.
 */
const PARENTHETICAL_HEDGE =
  /\s*\([^)]*\bnot\s+(?:specified|provided|listed|stated|detailed|known|confirmed|available|disclosed)\b[^)]*\)\s*$/i;

/**
 * Two products had a whole scraped page crammed into one spec value:
 *
 *   Packed size: "130.5W x 49.5D x 28.5H cm, 30kg Shipping Our products are
 *   typically ready to ship within 7-10 days… Please contact our team for more
 *   details. Care Instructions – Please wipe with a clean, damp cloth…"
 *
 * The row opens with a real packed size, so dropping it (which is what the
 * deflection check wanted to do, on the strength of "contact our team") would
 * bin a genuine fact to remove the noise after it. Truncating at the first
 * section heading keeps the fact and loses the scrape.
 */
const BLOB_MARKERS = /\s+(?:Shipping|Care Instructions|Delivery Information)\b/;

interface Spec {
  _key?: string;
  _type?: string;
  label: string;
  value: string;
}

function classify(
  value: string,
): { action: "keep" } | { action: "drop" } | { action: "trim"; to: string } {
  const raw = (value ?? "").trim();
  if (!raw) return { action: "drop" };
  if (JUNK_VALUES.has(raw.toLowerCase().replace(/\.$/, ""))) {
    return { action: "drop" };
  }

  const blobMatch = raw.match(BLOB_MARKERS);
  if (blobMatch && blobMatch.index && blobMatch.index > 0) {
    const head = raw
      .slice(0, blobMatch.index)
      .trim()
      .replace(/[,;:]$/, "");
    if (head && !isAdmission(head)) return { action: "trim", to: head };
  }

  const trimmed = raw.replace(PARENTHETICAL_HEDGE, "").trim();
  if (trimmed && trimmed !== raw && !isAdmission(trimmed)) {
    return { action: "trim", to: trimmed };
  }

  if (isAdmission(raw)) return { action: "drop" };
  return { action: "keep" };
}

async function main() {
  const docs: { _id: string; title: string; specs: Spec[] | null }[] =
    await client.fetch(
      `*[_type == "product" && !(_id in path("drafts.**")) && defined(specs)]{
        _id, title, specs
      } | order(_id asc)`,
    );

  const results: {
    id: string;
    title: string;
    before: number;
    after: number;
    dropped: string[];
    trimmed: string[];
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;
  let totalDropped = 0;
  let totalTrimmed = 0;

  for (const doc of docs) {
    const specs = doc.specs || [];
    const kept: Spec[] = [];
    const dropped: string[] = [];
    const trimmed: string[] = [];

    for (const spec of specs) {
      const verdict = classify(spec?.value ?? "");
      if (verdict.action === "drop") {
        dropped.push(`${spec.label}: "${spec.value}"`);
        continue;
      }
      if (verdict.action === "trim") {
        trimmed.push(`${spec.label}: "${spec.value}" -> "${verdict.to}"`);
        kept.push({ ...spec, value: verdict.to });
        continue;
      }
      kept.push(spec);
    }

    if (dropped.length === 0 && trimmed.length === 0) continue;
    totalDropped += dropped.length;
    totalTrimmed += trimmed.length;

    results.push({
      id: doc._id,
      title: doc.title,
      before: specs.length,
      after: kept.length,
      dropped,
      trimmed,
    });
    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ specs: kept }));
      queued += 1;
    }
  }

  console.log(`Products scanned: ${docs.length}`);
  console.log(`Products changed: ${results.length}`);
  console.log(`Spec rows dropped: ${totalDropped}`);
  console.log(`Spec rows trimmed: ${totalTrimmed}\n`);

  const emptied = results.filter((r) => r.after === 0);
  if (emptied.length) {
    console.log(
      `${emptied.length} products end up with no specs at all (every row was a non-answer):`,
    );
    emptied.forEach((r) => console.log(`  ${r.id} | ${r.title}`));
    console.log("");
  }

  for (const r of results.slice(0, 20)) {
    console.log(`=== ${r.id} (${r.before} -> ${r.after} rows) ===`);
    r.dropped.forEach((d) => console.log(`  drop: ${d}`));
    r.trimmed.forEach((t) => console.log(`  trim: ${t}`));
  }
  if (results.length > 20) {
    console.log(`\n… and ${results.length - 20} more (see change log).`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-fix-spec-nonanswers.json",
    JSON.stringify(
      { apply, queued, totalDropped, totalTrimmed, products: results },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
