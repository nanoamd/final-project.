/**
 * A second, simpler shape of the JSON-leak bug fixed in
 * fix-json-leak-descriptions.ts: product-import-echo-putty-grey-chair has
 * eight blocks whose entire content is just the opening fragment
 * `bullets":[` (curly quote, no closing bracket) sitting on its own line —
 * unlike the other three affected products, the real bullet items here
 * already exist as proper, correctly-formed bullet blocks immediately
 * after each fragment. Nothing to recover; the fragment is pure debris and
 * is simply removed.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-json-leak-open-fragments.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-json-leak-open-fragments.ts --apply
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

interface Block {
  _key: string;
  children?: { text: string }[];
}

const OPEN_FRAGMENT = /^bullets["'”]?\s*:\s*\[\s*$/;

async function main() {
  const rows: { _id: string; description: Block[] }[] = await client.fetch(
    `*[_type=="product" && !(_id in path("drafts.**"))]{_id, description}`,
  );

  let fixedCount = 0;
  for (const row of rows) {
    const blocks = row.description ?? [];
    const newBlocks = blocks.filter((block) => {
      const text = (block.children ?? [])
        .map((s) => s.text)
        .join("")
        .trim();
      return !OPEN_FRAGMENT.test(text);
    });
    if (newBlocks.length === blocks.length) continue;

    fixedCount += 1;
    console.log(
      `${row._id}: removing ${blocks.length - newBlocks.length} stray "bullets":[ fragment(s)`,
    );
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
