/**
 * The other half of the raw-decimal cleanup: 76 published products carry
 * supplier-padded decimals inside their `description` Portable Text — e.g.
 * "Dimensions: w65.000000 x d4.500000 x h80.000000 cm" — as well as in the
 * `specs` field that scripts/fix-specs-raw-decimals.ts already cleaned.
 *
 * These were under-reported for most of a session by a genuine regex bug in
 * the scan, worth recording so it isn't repeated: the pattern was
 * `/\b\d+\.\d{4,}\b/`, and the leading `\b` can never match in "w65.000000"
 * because there is no word boundary between "w" and "6". It reported 1 hit
 * where there were 76. Detection here drops the leading boundary.
 *
 * As with the specs fix, the transform is exact rather than a rounding call:
 * `parseFloat(...).toString()` strips zero padding losslessly (65.000000 ->
 * "65", 4.500000 -> "4.5") and never alters a real value.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-description-raw-decimals.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-description-raw-decimals.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

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

interface Span {
  _key: string;
  _type: string;
  marks?: string[];
  text?: string;
}
interface Block {
  _key: string;
  _type: string;
  style?: string;
  listItem?: string;
  level?: number;
  markDefs?: unknown[];
  children?: Span[];
}
interface Product {
  _id: string;
  title: string;
  description: Block[];
}

const DECIMAL_RE = /\d+\.\d{4,}/g;

function clean(text: string): string {
  return text.replace(DECIMAL_RE, (m) => parseFloat(m).toString());
}

async function main() {
  const docs: Product[] = await client.fetch(
    `*[_type == "product" && !(_id in path("drafts.**")) && defined(description)]{_id, title, description}`,
  );

  const results: {
    id: string;
    title: string;
    changes: { before: string; after: string }[];
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const doc of docs) {
    const changes: { before: string; after: string }[] = [];
    const newDescription = doc.description.map((block) => {
      if (!Array.isArray(block.children)) return block;
      const children = block.children.map((span) => {
        if (typeof span.text !== "string") return span;
        const after = clean(span.text);
        if (after !== span.text) {
          changes.push({ before: span.text, after });
        }
        return after === span.text ? span : { ...span, text: after };
      });
      return { ...block, children };
    });

    if (changes.length === 0) continue;
    results.push({ id: doc._id, title: doc.title, changes });
    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ description: newDescription }));
      queued += 1;
    }
  }

  console.log(`Products affected: ${results.length}`);
  for (const r of results.slice(0, 10)) {
    console.log(`\n${r.id} — ${r.title}`);
    for (const c of r.changes.slice(0, 2)) {
      console.log(`  "${c.before.slice(0, 90)}"`);
      console.log(`  -> "${c.after.slice(0, 90)}"`);
    }
  }
  if (results.length > 10) {
    console.log(`\n… and ${results.length - 10} more.`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fix-description-raw-decimals.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
