/**
 * The same hedge strip as `fix-faq-hedges.ts`, applied to `description`
 * blocks instead of FAQ answers. After the FAQ pass, 67 hedge occurrences
 * were left across 48 products and all of them were in descriptions.
 *
 * Scope is deliberately narrowed to products NOT in the rewrite work queue
 * (`scripts/list-description-work-queue.ts`). Five agents are concurrently
 * rewriting the 312 thin/bare descriptions wholesale, and this script works
 * by reading the whole `description` array, editing it, and setting it back —
 * so running it over a document an agent is mid-way through would clobber the
 * agent's better rewrite with my stale copy. Those 8 overlapping products are
 * skipped and left to the rewrite, which replaces the hedge anyway.
 *
 * Structural rules, in order:
 *   1. Strip admission sentences from each paragraph (`cleanParagraph`).
 *   2. A paragraph with nothing left is dropped.
 *   3. A heading whose section is then empty is dropped too — an orphaned
 *      "Drainage and Planting" with no text under it is worse than neither.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-description-hedges.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-description-hedges.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { cleanParagraph } from "@/lib/catalog/admissions";

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
  marks: string[];
  text: string;
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

const isHeading = (b: Block) =>
  b.style === "h1" || b.style === "h2" || b.style === "h3" || b.style === "h4";

const textOf = (b: Block) => (b.children || []).map((c) => c.text).join("");

function tierOf(blocks: Block[] | null): string {
  const heads = (blocks || []).filter(isHeading).length;
  const words = (blocks || [])
    .flatMap((b) => (b.children || []).map((c) => c.text))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (heads === 0) return "NO_HEADINGS";
  if (heads <= 2) return "BARE";
  if (heads <= 3 || words < 140) return "THIN";
  return "OK";
}

/** Rewrites one block's text, keeping its key, style and list settings. */
function withText(block: Block, text: string): Block {
  return {
    ...block,
    children: [
      {
        _key: `${block._key}s`,
        _type: "span",
        marks: [],
        text,
      },
    ],
  };
}

function stripHedges(blocks: Block[]): { blocks: Block[]; removed: string[] } {
  const removed: string[] = [];

  // Pass 1 — clean or drop each non-heading block.
  const cleaned: Block[] = [];
  for (const block of blocks) {
    if (isHeading(block)) {
      cleaned.push(block);
      continue;
    }
    const original = textOf(block);
    if (!original.trim()) {
      cleaned.push(block);
      continue;
    }
    const kept = cleanParagraph(original);
    if (kept === original.trim()) {
      cleaned.push(block);
      continue;
    }
    if (!kept) {
      removed.push(original);
      continue;
    }
    removed.push(original.replace(kept, "").trim());
    cleaned.push(withText(block, kept));
  }

  // Pass 2 — drop headings whose section is now empty.
  const out: Block[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    // Indexed reads are `Block | undefined` under `noUncheckedIndexedAccess`,
    // so each one is bound to a local and guarded before use.
    const block = cleaned[i];
    if (!block) continue;
    if (!isHeading(block)) {
      out.push(block);
      continue;
    }
    let hasBody = false;
    for (let j = i + 1; j < cleaned.length; j++) {
      const next = cleaned[j];
      if (!next) continue;
      if (isHeading(next)) break;
      if (textOf(next).trim()) {
        hasBody = true;
        break;
      }
    }
    if (hasBody) out.push(block);
    else removed.push(`(heading) ${textOf(block)}`);
  }

  return { blocks: out, removed };
}

async function main() {
  const docs: { _id: string; title: string; description: Block[] | null }[] =
    await client.fetch(
      `*[_type == "product" && !(_id in path("drafts.**")) && defined(description)]{
        _id, title, description
      } | order(_id asc)`,
    );

  const results: {
    id: string;
    title: string;
    blocksBefore: number;
    blocksAfter: number;
    removed: string[];
  }[] = [];
  const skipped: string[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const doc of docs) {
    const blocks = doc.description || [];
    const { blocks: next, removed } = stripHedges(blocks);
    if (removed.length === 0) continue;

    if (tierOf(blocks) !== "OK") {
      skipped.push(doc._id);
      continue;
    }

    results.push({
      id: doc._id,
      title: doc.title,
      blocksBefore: blocks.length,
      blocksAfter: next.length,
      removed,
    });
    if (apply) {
      transaction.patch(doc._id, (p) => p.set({ description: next }));
      queued += 1;
    }
  }

  console.log(`Products changed: ${results.length}`);
  console.log(
    `Skipped (in the rewrite queue, agents are replacing these): ${skipped.length}`,
  );
  for (const r of results.slice(0, 12)) {
    console.log(
      `\n=== ${r.id} (${r.blocksBefore} -> ${r.blocksAfter} blocks) ===`,
    );
    r.removed.forEach((t) => console.log(`  removed: "${t.slice(0, 140)}"`));
  }
  if (results.length > 12) {
    console.log(`\n… and ${results.length - 12} more (see change log).`);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-fix-description-hedges.json",
    JSON.stringify({ apply, queued, skipped, products: results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
