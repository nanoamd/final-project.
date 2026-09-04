/**
 * Third and final pass on the supplier-leak cleanup. The main sweep
 * (fix-supplier-leaks-in-descriptions.ts) only touches a block if a span in
 * it currently carries a mark pointing to a hill-interiors.com link. One
 * product's affected span had already been edited by earlier, unrelated
 * work before this pass ran — its text was replaced but the block's
 * `markDefs` array still carried the now-unreferenced link definition,
 * which the main sweep's `blockHasSupplierLink` check correctly didn't
 * flag, since nothing pointed to it any more.
 *
 * An unreferenced markDef renders as nothing — Portable Text only renders
 * marks a span actually uses — so this was never a live, clickable leak.
 * It's a tidiness pass: strip any markDef whose href points to
 * hill-interiors.com and that no surviving span references.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-leaks-orphan-markdefs.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-leaks-orphan-markdefs.ts --apply
 */
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
  marks?: string[];
}
interface MarkDef {
  _key: string;
  href?: string;
}
interface Block {
  _key: string;
  children?: Span[];
  markDefs?: MarkDef[];
}

async function main() {
  const rows: { _id: string; description: Block[] }[] = await client.fetch(
    `*[_type=="product"]{_id, description}`,
  );

  let fixedCount = 0;
  for (const row of rows) {
    const blocks = row.description ?? [];
    let changed = false;
    const newBlocks = blocks.map((block) => {
      const markDefs = block.markDefs ?? [];
      const usedKeys = new Set(
        (block.children ?? []).flatMap((s) => s.marks ?? []),
      );
      const orphaned = markDefs.filter(
        (md) =>
          md.href?.includes("hill-interiors.com") && !usedKeys.has(md._key),
      );
      if (orphaned.length === 0) return block;
      changed = true;
      return {
        ...block,
        markDefs: markDefs.filter((md) => !orphaned.includes(md)),
      };
    });

    if (!changed) continue;
    fixedCount += 1;
    console.log(`${row._id}: cleaning orphaned supplier-link markDefs`);
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
