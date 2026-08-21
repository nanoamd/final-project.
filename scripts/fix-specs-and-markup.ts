/**
 * Replaces placeholder specifications with the facts we hold, and strips
 * markdown that is being rendered literally.
 *
 * Both were found by Damien on live pages, not by the audit — which had never
 * looked at the `specs` array at all, and whose markdown check only knew about
 * `**bold**` and links.
 *
 *   "Dimensions | To be confirmed"  on a product whose dimensions we hold
 *   "The dining table measures: * Length: 180 cm * Width: 77 cm"
 *
 * A placeholder is only replaced when there is a real value to replace it with.
 * Where there is not, the row is **removed** rather than left: a specification
 * table that says "To be confirmed" is worse than one that simply does not list
 * that row, because it advertises that nobody checked.
 *
 * Weasel values — "High-Quality Wood", "Neutral Finish" — are reported, never
 * rewritten. Turning "High-Quality Wood" into "Oak" would be inventing a fact.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-specs-and-markup.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-specs-and-markup.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { PLACEHOLDER_SPEC, WEASEL_SPEC } from "../src/lib/catalog/quality";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

/**
 * Turns "* Length: 180 cm * Width: 77 cm * Height: 80 cm" into prose.
 *
 * The asterisks are markdown list markers that never got rendered. Joining the
 * items with commas keeps every number exactly as written — this is a
 * formatting fix, not a rewrite, so no figure may change.
 */
export function stripMarkdown(text: string): string {
  let next = text;
  // A bullet run: turn the markers into separators.
  if (/(?:^|\s)\*\s+\w/.test(next)) {
    next = next
      .replace(/\s*\*\s+/g, " | ")
      .replace(/:\s*\|/g, ": ")
      .replace(/\s*\|\s*/g, ", ")
      .replace(/,\s*,/g, ", ")
      .replace(/,\s*$/, "");
  }
  next = next
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?:^|\n)#{1,4}\s+/g, "\n")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return next;
}

/** The dimensions we hold, formatted for a specification row. */
function dimensionValue(d: Dimensions | undefined): string | null {
  if (!d) return null;
  const unit = d.unit ?? "cm";
  const has = (n: unknown): n is number => typeof n === "number" && n > 0;
  if (has(d.length) && has(d.width) && has(d.height))
    return `${d.length}L x ${d.width}W x ${d.height}H ${unit}`;
  const parts: string[] = [];
  if (has(d.height)) parts.push(`${d.height}${unit} H`);
  if (has(d.length)) parts.push(`${d.length}${unit} L`);
  if (has(d.width)) parts.push(`${d.width}${unit} W`);
  return parts.length ? parts.join(" x ") : null;
}

/**
 * Labels that mention weight or size but mean something else entirely.
 *
 * "Weight capacity" is what a shelf holds; `weight` is what the shelf itself
 * weighs. Filling one from the other told a buyer a shelf supported 10kg when
 * 10kg was simply its own mass — the third time this exact confusion has
 * appeared in this audit, which is why it now has a name and a test.
 */
export const ASKS_SOMETHING_ELSE =
  /\b(?:capacity|limit|load|max|maximum|holds?|supports?|internal|inside|inner|usable|packed|carton|screen)\b/i;

/**
 * Whether two strings differ in more than whitespace.
 *
 * HTML collapses consecutive spaces, so a whitespace-only edit rewrites the
 * document and changes nothing a customer can see. Without this guard 48 of
 * the 60 markdown fixes were invisible churn.
 */
function differsInContent(before: string, after: string): boolean {
  return (
    before.replace(/\s+/g, " ").trim() !== after.replace(/\s+/g, " ").trim()
  );
}

interface Change {
  id: string;
  title: string;
  field: string;
  kind: string;
  before: string;
  after: string;
}

async function main() {
  const rows: {
    _id: string;
    title?: string;
    dimensions?: Dimensions;
    weight?: { value?: number; unit?: string };
    specs?: { _key?: string; label?: string; value?: string }[];
    faqs?: { _key?: string; question?: string; answer?: string }[];
    summary?: string;
  }[] = await client.fetch(
    `*[_type == "product"]{ _id, title, dimensions, weight, specs, faqs, summary }`,
  );

  const changes: Change[] = [];
  const flags: { title: string; detail: string }[] = [];
  const patches: { id: string; set: Record<string, unknown> }[] = [];

  for (const row of rows) {
    const title = row.title ?? "(untitled)";
    const set: Record<string, unknown> = {};

    // ---- Specifications ------------------------------------------------
    if (Array.isArray(row.specs) && row.specs.length) {
      let touched = false;
      const kept: unknown[] = [];
      for (const spec of row.specs) {
        const value = (spec.value ?? "").trim();
        const label = (spec.label ?? "").trim();

        if (PLACEHOLDER_SPEC.test(value)) {
          // Can we fill it from something we actually hold?
          let replacement: string | null = null;
          if (!ASKS_SOMETHING_ELSE.test(label)) {
            if (/dimension|size|measurement/i.test(label))
              replacement = dimensionValue(row.dimensions);
            else if (/weight/i.test(label) && row.weight?.value)
              replacement = `${row.weight.value} ${row.weight.unit ?? "kg"}`;
          }

          touched = true;
          if (replacement) {
            changes.push({
              id: row._id,
              title,
              field: "specs",
              kind: "placeholder-filled",
              before: `${label}: ${value}`,
              after: `${label}: ${replacement}`,
            });
            kept.push({ ...spec, value: replacement });
          } else {
            changes.push({
              id: row._id,
              title,
              field: "specs",
              kind: "placeholder-removed",
              before: `${label}: ${value}`,
              after: "(row removed — nothing to put there)",
            });
          }
          continue;
        }

        if (WEASEL_SPEC.test(value)) {
          // "High-Quality Wood" cannot be turned into "Oak" without inventing
          // the fact. Reported for a human.
          flags.push({ title, detail: `${label}: ${value}` });
        }
        kept.push(spec);
      }
      if (touched) set.specs = kept;
    }

    // ---- Markdown in FAQs ----------------------------------------------
    if (Array.isArray(row.faqs) && row.faqs.length) {
      let touched = false;
      const next = row.faqs.map((faq) => {
        const answer = faq.answer ?? "";
        const cleaned = stripMarkdown(answer);
        if (!differsInContent(answer, cleaned)) return faq;
        touched = true;
        changes.push({
          id: row._id,
          title,
          field: "faqs",
          kind: "markdown-stripped",
          before: answer,
          after: cleaned,
        });
        return { ...faq, answer: cleaned };
      });
      if (touched) set.faqs = next;
    }

    // ---- Markdown in the summary ---------------------------------------
    if (row.summary) {
      const cleaned = stripMarkdown(row.summary);
      if (differsInContent(row.summary, cleaned)) {
        set.summary = cleaned;
        changes.push({
          id: row._id,
          title,
          field: "summary",
          kind: "markdown-stripped",
          before: row.summary,
          after: cleaned,
        });
      }
    }

    if (Object.keys(set).length) patches.push({ id: row._id, set });
  }

  const byKind = new Map<string, number>();
  for (const change of changes)
    byKind.set(change.kind, (byKind.get(change.kind) ?? 0) + 1);

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — specs and markup\n`);
  console.log(`Documents to patch: ${patches.length}`);
  for (const [kind, count] of [...byKind].sort((a, b) => b[1] - a[1]))
    console.log(`   ${String(count).padStart(4)}  ${kind}`);
  console.log(`\nWeasel values flagged for a human: ${flags.length}`);
  for (const flag of flags.slice(0, 10))
    console.log(`   ${flag.title.slice(0, 42)} — ${flag.detail}`);

  console.log("\n──── sample ────");
  for (const change of changes.slice(0, 10)) {
    console.log(`\n[${change.kind}] ${change.title.slice(0, 44)}`);
    console.log(`  −  ${change.before.slice(0, 130)}`);
    console.log(`  +  ${change.after.slice(0, 130)}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  const path = `docs/change-log/${stamp.slice(0, 10)}-specs-markup.json`;
  writeFileSync(
    path,
    JSON.stringify(
      { generatedAt: stamp, applied: apply, changes, flags },
      null,
      2,
    ),
  );
  console.log(`\nChange log: ${path}`);

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  let done = 0;
  for (const patch of patches) {
    await client.patch(patch.id).set(patch.set).commit();
    if (++done % 25 === 0) console.log(`  patched ${done}/${patches.length}`);
  }
  console.log(`\nPatched ${done} documents.`);
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
