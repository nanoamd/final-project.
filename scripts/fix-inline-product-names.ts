/**
 * Makes every mention of a product inside its own copy use its simple name.
 *
 * Damien: "all references to products must just be the simple product name not
 * ending with | kaiku". He was looking at a delivery line reading
 *
 *   Your Led Wall Lamp 2 Pack, 5W Modern Indoor Starry Wall Light, Colour
 *   Temperature Adjustable 3000K/4000K/6500K, for Bedroom, Living Room,
 *   Hallway, Stairs, Gold Tone will be carefully packaged before dispatch.
 *
 * The title was rewritten; the copy that quoted it was not. Renaming a product
 * is only half the job — the old name survives wherever the generator had
 * pasted it into a sentence.
 *
 * Old names are taken from the change logs this audit has written, so nothing
 * is guessed. Current titles are matched too, which catches the "| Kaiku"
 * suffix appearing mid-sentence.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-inline-product-names.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-inline-product-names.ts --apply
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** Every previous title this audit has recorded, keyed by document ID. */
function priorNames(): Map<string, Set<string>> {
  const byId = new Map<string, Set<string>>();
  const dir = "docs/change-log";
  if (!existsSync(dir)) return byId;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(`${dir}/${file}`, "utf8"));
    } catch {
      continue;
    }
    const changes = (parsed as { changes?: unknown[] })?.changes ?? [];
    for (const change of changes) {
      const entry = change as {
        id?: string;
        field?: string;
        before?: string;
        after?: string;
      };
      if (!entry.id || !entry.before) continue;
      // Title changes only; a description diff is not a name.
      const isTitle =
        entry.field === "title" ||
        (!entry.field && /\| Kaiku/.test(entry.after ?? ""));
      if (!isTitle) continue;
      const set = byId.get(entry.id) ?? new Set<string>();
      set.add(entry.before.trim());
      byId.set(entry.id, set);
    }
  }
  return byId;
}

/** The name a sentence should use: the title without its brand suffix. */
export function simpleName(title: string): string {
  return title.replace(/\s*\|\s*Kaiku(?:\s+Tagline)?\s*$/i, "").trim();
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Replaces any of `names` appearing in `text` with `replacement`.
 *
 * Longest first, so "Pine Storage Bed, 3ft Single Solid Wooden Bed Frame with
 * Drawers, Grey" is matched before the shorter "Pine Storage Bed" leaves a
 * trailing fragment behind.
 */
export function replaceNames(
  text: string,
  names: string[],
  replacement: string,
): string {
  let next = text;
  for (const name of [...names].sort((a, b) => b.length - a.length)) {
    if (!name || name === replacement) continue;
    if (name.length < 12) continue; // too short to match safely
    next = next.replace(new RegExp(escapeRegExp(name), "g"), replacement);
  }
  // A brand suffix that ended up mid-sentence goes regardless of its name.
  return next.replace(/\s*\|\s*Kaiku\b/g, "");
}

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  children?: {
    _type?: string;
    _key?: string;
    text?: string;
    marks?: string[];
  }[];
}

async function main() {
  const prior = priorNames();
  const rows: {
    _id: string;
    title?: string;
    summary?: string;
    description?: Block[];
    faqs?: { _key?: string; question?: string; answer?: string }[];
    seo?: { metaDescription?: string };
  }[] = await client.fetch(
    `*[_type == "product"]{ _id, title, summary, description, faqs, seo }`,
  );

  const changes: {
    id: string;
    field: string;
    before: string;
    after: string;
  }[] = [];
  const patches: { id: string; set: Record<string, unknown> }[] = [];

  for (const row of rows) {
    const title = row.title ?? "";
    const name = simpleName(title);
    if (!name) continue;
    const names = [...(prior.get(row._id) ?? []), title];
    const fix = (text: string) => replaceNames(text, names, name);
    const set: Record<string, unknown> = {};

    if (row.summary) {
      const next = fix(row.summary);
      if (next !== row.summary) {
        set.summary = next;
        changes.push({
          id: row._id,
          field: "summary",
          before: row.summary,
          after: next,
        });
      }
    }

    if (Array.isArray(row.description)) {
      let touched = false;
      const blocks = row.description.map((block) => {
        if (block._type !== "block" || !Array.isArray(block.children))
          return block;
        const original = block.children.map((c) => c.text ?? "").join("");
        const next = fix(original);
        if (next === original) return block;
        touched = true;
        changes.push({
          id: row._id,
          field: "description",
          before: original,
          after: next,
        });
        return {
          ...block,
          children: [
            {
              _type: "span",
              _key: block.children[0]?._key ?? `${block._key}-s`,
              text: next,
              marks: [],
            },
          ],
        };
      });
      if (touched) set.description = blocks;
    }

    if (Array.isArray(row.faqs)) {
      let touched = false;
      const faqs = row.faqs.map((faq) => {
        const q = fix(faq.question ?? "");
        const a = fix(faq.answer ?? "");
        if (q === (faq.question ?? "") && a === (faq.answer ?? "")) return faq;
        touched = true;
        changes.push({
          id: row._id,
          field: "faqs",
          before: `${faq.question} / ${faq.answer}`,
          after: `${q} / ${a}`,
        });
        return { ...faq, question: q, answer: a };
      });
      if (touched) set.faqs = faqs;
    }

    const meta = row.seo?.metaDescription;
    if (meta) {
      const next = fix(meta);
      if (next !== meta) {
        set["seo.metaDescription"] = next;
        changes.push({
          id: row._id,
          field: "seo.metaDescription",
          before: meta,
          after: next,
        });
      }
    }

    if (Object.keys(set).length) patches.push({ id: row._id, set });
  }

  const byField = new Map<string, number>();
  for (const change of changes)
    byField.set(change.field, (byField.get(change.field) ?? 0) + 1);

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — inline product names\n`);
  console.log(`Documents to patch: ${patches.length}`);
  console.log(`Replacements:       ${changes.length}`);
  for (const [field, count] of [...byField].sort((a, b) => b[1] - a[1]))
    console.log(`   ${String(count).padStart(4)}  ${field}`);

  console.log(`\n──── sample ────`);
  for (const change of changes.slice(0, 12)) {
    console.log(`\n  −  ${change.before.slice(0, 140)}`);
    console.log(`  +  ${change.after.slice(0, 140)}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-inline-names.json`,
    JSON.stringify({ generatedAt: stamp, applied: apply, changes }, null, 2),
  );

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
