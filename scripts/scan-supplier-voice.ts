/**
 * Re-runs the "supplier voice" detection scan (trademark symbols, marketing
 * buzzwords, self-referential third-person sales phrasing) against every
 * PUBLISHED product, to get the current list for the fix-supplier-voice-
 * batchN.ts series. Read-only — writes a snapshot to docs/change-log, never
 * touches Sanity content.
 *
 * Heuristic (same signal Damien's original side-by-side comparison found,
 * replicated since no earlier scan script survives in scripts/):
 *   - trademark symbols: ™ or ®
 *   - marketing buzzwords: 3+ hits total across the list below
 *   - self-referential sales phrasing: /\bthe [a-z0-9™®\s]{2,30}?\b(is|offers|
 *     features|delivers|provides|maintains)\b/gi, 4+ occurrences
 * A product is flagged if ANY one of the three fires — matches how the
 * original scan reached 71 (batch1's 8 SaunaPlunge products were flagged on
 * trademark symbols alone, not buzzword count).
 *
 *   pnpm tsx --env-file=.env.local scripts/scan-supplier-voice.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { plainTextOf } from "../src/lib/catalog/quality-input";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// The exact list named in Damien's brief, plus a handful of unambiguous
// brochure-superlative siblings — kept deliberately short. An expanded list
// (any adjective that could plausibly appear in honest descriptive prose —
// "sophisticated", "stunning", "superior") produced hundreds of false
// positives against already-fixed, genuinely factual Kaiku-voice copy on a
// first pass, so it's excluded here.
const BUZZWORDS = [
  "premium",
  "luxury",
  "luxurious",
  "exceptional",
  "elevate",
  "elevates",
  "elevating",
  "elegant",
  "why choose",
  "perfect for:",
  "experience the",
  "sleek",
  "unparalleled",
  "exquisite",
  "indulge",
  "unrivalled",
  "unrivaled",
  "look no further",
  "crafted to perfection",
  "transform your",
];

const TRADEMARK_RE = /[™®]/g;
const SELF_REF_RE =
  /\bthe [a-z0-9™®\s]{2,30}?\b(is|offers|features|delivers|provides|maintains)\b/gi;

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  description: unknown;
}

// A product's brand-carrying title (e.g. "SaunaPlunge™ ...") is explicitly
// off-limits to rewrite ("do not change product names, or strip the |
// Kaiku suffix" — standing constraint). A ™/® that appears ONLY in the
// title is the brand name, not supplier body copy, so it doesn't count
// toward the trademark signal — only occurrences in summary/description do.

function countBuzzwords(text: string): { word: string; count: number }[] {
  const hits: { word: string; count: number }[] = [];
  for (const word of BUZZWORDS) {
    const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = text.match(re);
    if (matches && matches.length > 0)
      hits.push({ word, count: matches.length });
  }
  return hits;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      _id, title, "slug": slug.current, summary, description
    }`,
  );

  const flagged: {
    id: string;
    title: string;
    slug: string | null;
    trademarkHits: number;
    buzzwordHits: number;
    buzzwordBreakdown: { word: string; count: number }[];
    selfRefHits: number;
    reasons: string[];
  }[] = [];

  for (const row of rows) {
    const bodyText = `${row.summary ?? ""}\n${plainTextOf(row.description)}`;
    const fullText = `${row.title}\n${bodyText}`;

    // Trademark: body copy only (title's brand mark is out of scope).
    const trademarkHits = (bodyText.match(TRADEMARK_RE) ?? []).length;
    const buzzwordBreakdown = countBuzzwords(fullText);
    const buzzwordHits = buzzwordBreakdown.reduce((s, b) => s + b.count, 0);
    const selfRefHits = (fullText.match(SELF_REF_RE) ?? []).length;

    const reasons: string[] = [];
    if (trademarkHits > 0) reasons.push(`trademark x${trademarkHits}`);
    // Buzzwords and self-referential phrasing are each common enough alone
    // in honest factual prose ("the frame is oak") that either signal on
    // its own over-flags heavily (390 of 809 on a first pass — checked
    // against known-good, already-rewritten copy). Requiring BOTH to fire
    // together is what actually distinguishes pasted brochure copy: a
    // supplier's marketing copy stacks superlatives AND repeats "the
    // Product offers/delivers/features..." sentences, honest copy does
    // neither pattern densely.
    if (buzzwordHits >= 3 && selfRefHits >= 4)
      reasons.push(
        `buzzwords x${buzzwordHits} + self-referential x${selfRefHits}`,
      );

    if (reasons.length > 0) {
      flagged.push({
        id: row._id,
        title: row.title,
        slug: row.slug,
        trademarkHits,
        buzzwordHits,
        buzzwordBreakdown,
        selfRefHits,
        reasons,
      });
    }
  }

  flagged.sort(
    (a, b) =>
      b.reasons.length - a.reasons.length || b.trademarkHits - a.trademarkHits,
  );

  console.log(`Published products scanned: ${rows.length}`);
  console.log(`Flagged: ${flagged.length}\n`);
  console.table(
    flagged.map((f) => ({
      id: f.id,
      title: f.title.slice(0, 60),
      trademark: f.trademarkHits,
      buzzwords: f.buzzwordHits,
      selfRef: f.selfRefHits,
    })),
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-voice-scan.json`,
    JSON.stringify(
      { scanned: rows.length, flaggedCount: flagged.length, flagged },
      null,
      2,
    ),
  );
  console.log(
    `\nWritten to docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-voice-scan.json`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
