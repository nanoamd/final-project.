/**
 * Repairs a content-generation artifact found while working the backlog:
 * three products (hill-decor-21499, hill-decor-21717, product-aw-ssm-05)
 * have raw, unparsed JSON fragments sitting in their description as plain
 * text — the tail end of a `{"paragraph": "...", "bullets": [...]}, {`
 * structure that never got parsed into real Portable Text bullets, e.g.:
 *
 *   "bullets':['Marble effect finish','Contemporary ellipse shape', ...]},{"
 *
 * The actual bullet text is intact inside the array literal — this script
 * parses it out and replaces the malformed block with proper bullet-list
 * blocks in the same position, rather than deleting real content. Where
 * the array is empty (hill-decor-21717), there's nothing to recover and
 * the malformed block is just removed.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-json-leak-descriptions.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-json-leak-descriptions.ts --apply
 */
import { randomBytes } from "node:crypto";

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
  perspective: "raw",
});

interface Span {
  _key: string;
  _type: "span";
  text: string;
  marks: string[];
}
interface Block {
  _key: string;
  _type: string;
  children?: Span[];
  markDefs?: unknown[];
  style?: string;
  listItem?: string;
  level?: number;
}

const key = () => randomBytes(6).toString("hex");

/** Matches the leaked JSON tail: bullets':[...]},{  — straight or curly quotes, possibly empty. */
const LEAK_PATTERN = /bullets['"”]?\s*:\s*\[(.*?)\]\s*\}\s*,\s*\{?\s*$/;

function parseBulletArray(inner: string): string[] {
  if (!inner.trim()) return [];
  // Split on commas that separate '...'-or-"..."-quoted items.
  const items: string[] = [];
  const re = /['"]([^'"]*)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner)) !== null) {
    if (m[1]) items.push(m[1]);
  }
  return items;
}

function makeBulletBlock(text: string): Block {
  const k = key();
  return {
    _key: k,
    _type: "block",
    style: "normal",
    listItem: "bullet",
    level: 1,
    markDefs: [],
    children: [{ _key: `${k}s`, _type: "span", text, marks: [] }],
  };
}

async function main() {
  // Excludes drafts explicitly — a broad *[_type=="product"] fetch has been
  // observed intermittently returning drafts.* rows for documents that
  // direct getDocument()/exact-_id lookups confirm don't exist, apparently a
  // transient staleness in Sanity's own query index for wide queries rather
  // than real data. Only published documents are ever meant to be patched
  // here.
  const rows: { _id: string; title: string; description: Block[] }[] =
    await client.fetch(
      `*[_type=="product" && !(_id in path("drafts.**"))]{_id, title, description}`,
    );

  let fixedCount = 0;
  for (const row of rows) {
    const blocks = row.description ?? [];
    let changed = false;
    const newBlocks: Block[] = [];
    for (const block of blocks) {
      const text = (block.children ?? []).map((s) => s.text).join("");
      const match = LEAK_PATTERN.exec(text.trim());
      if (!match) {
        newBlocks.push(block);
        continue;
      }
      changed = true;
      const bullets = parseBulletArray(match[1] ?? "");
      for (const bullet of bullets) newBlocks.push(makeBulletBlock(bullet));
      console.log(
        `${row._id}: replacing malformed block with ${bullets.length} bullet(s)${bullets.length === 0 ? " (array was empty — block removed)" : ""}`,
      );
    }
    if (!changed) continue;
    fixedCount += 1;
    if (!apply) continue;
    await client.patch(row._id).set({ description: newBlocks }).commit();
  }

  console.log(`\n${apply ? "Fixed" : "Would fix"} ${fixedCount} products.`);
  if (!apply) console.log("Dry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
