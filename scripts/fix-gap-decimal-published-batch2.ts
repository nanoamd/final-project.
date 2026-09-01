/**
 * Batch 2 of the gap-admission/decimal-dump cleanup, closing what batch1
 * missed. Two distinct failures found by re-verifying batch1 live (never
 * trust a script's own console output — the rule that caught this):
 *
 *   1. Sanai White Cotton Mache Large Planter reported "applied: 2" for its
 *      two whole-heading-drop cases, but the live description was completely
 *      unchanged afterward. Whatever batch1's heading-drop logic did, it
 *      didn't reach Sanity. Rather than debug that logic, this batch does
 *      the safer thing for a structural edit: fetch the product's current
 *      full description array and `set()` a hand-built replacement array,
 *      rather than patch individual spans.
 *   2. Three more products — Lentigo, Relic Onyx, Manado Relax — had the
 *      exact same "admits a gap" pattern and were never in batch1's list at
 *      all. batch1's own scan simply missed them.
 *
 * Each fix below was read by hand against the product's own live Portable
 * Text blocks (dumped via a throwaway script, not guessed at). Where a whole
 * heading + paragraph is 100% hedge with nothing else in it, the heading is
 * dropped entirely. Where a hedge clause sits inside a sentence with a real
 * fact, only the hedge clause is removed and the fact stays. Two headings
 * (Manado's "Weather Resistance..." and "Covers, Cleaning...") are renamed
 * rather than dropped, because what's left after removing the hedge is a
 * real, generic-but-true care tip that no longer matches what the original
 * heading promised — renamed to what the remaining sentence actually says,
 * not left overpromising.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-gap-decimal-published-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-gap-decimal-published-batch2.ts --apply
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

interface Block {
  _key: string;
  _type: string;
  style?: string;
  listItem?: string;
  level?: number;
  markDefs: unknown[];
  children: { _key: string; _type: string; marks: string[]; text: string }[];
}

function block(key: string, text: string, style = "normal"): Block {
  return {
    _key: key,
    _type: "block",
    style,
    markDefs: [],
    children: [{ _key: `${key}s`, _type: "span", marks: [], text }],
  };
}

/** Drops the heading at `headingKey` and every block after it up to (not
 * including) the next h2, replacing that whole run with `replacement`
 * blocks (empty array = delete the section outright). */
function replaceSection(
  blocks: Block[],
  headingText: string,
  replacement: Block[],
): Block[] {
  const start = blocks.findIndex(
    (b) =>
      b.style === "h2" &&
      b.children.map((c) => c.text).join("") === headingText,
  );
  if (start === -1) throw new Error(`Heading not found: "${headingText}"`);
  let end = start + 1;
  while (end < blocks.length && blocks[end]?.style !== "h2") end++;
  return [...blocks.slice(0, start), ...replacement, ...blocks.slice(end)];
}

function setBlockText(blocks: Block[], key: string, newText: string): Block[] {
  return blocks.map((b) =>
    b._key === key
      ? {
          ...b,
          children: [
            { _key: `${key}s`, _type: "span", marks: [], text: newText },
          ],
        }
      : b,
  );
}

interface Fix {
  id: string;
  title: string;
  apply: (blocks: Block[]) => Block[];
}

const FIXES: Fix[] = [
  {
    id: "premier-housewares-5506889",
    title: "Sanai White Cotton Mache Large Planter | Kaiku",
    apply: (blocks) => {
      let b = replaceSection(blocks, "Drainage and Planting", []);
      b = replaceSection(b, "Indoor and Outdoor Use", []);
      const dimsBlock = b.find((blk) =>
        blk.children.some((c) => c.text.includes("w45.000000")),
      );
      if (dimsBlock) {
        b = setBlockText(b, dimsBlock._key, "Dimensions: 45 x 45 x 45 cm");
      }
      return b;
    },
  },
  {
    id: "premier-housewares-1411603",
    title: "Lentigo Set Of Two Natural Planters | Kaiku",
    apply: (blocks) => {
      let b = replaceSection(blocks, "Drainage and Planting", []);
      b = replaceSection(b, "Indoor and Outdoor Use", []);
      return b;
    },
  },
  {
    id: "premier-housewares-5511154",
    title: "Relic Onyx Stone Floor Lamp | Kaiku",
    apply: (blocks) => {
      const target = blocks.find((b) =>
        b.children.some((c) =>
          c.text.includes("does not mention any additional fittings"),
        ),
      );
      if (!target) throw new Error("Relic Onyx sentence not found");
      return setBlockText(
        blocks,
        target._key,
        "The Relic Onyx Stone Floor Lamp arrives fully assembled, making it easy to set up in your desired space. The box includes the lamp itself.",
      );
    },
  },
  {
    id: "premier-housewares-5528625",
    title: "Manado Relax Natural Rattan Chair | Kaiku",
    apply: (blocks) => {
      let b = replaceSection(blocks, "What's in the Set", []);
      b = replaceSection(b, "Assembly: People, Time and Tools", [
        block("assembly-heading", "Assembly: People, Time and Tools", "h2"),
        block(
          "assembly-fix",
          "Assembly is required for this chair. It ships in one box.",
        ),
      ]);
      b = replaceSection(b, "Weather Resistance and Leaving It Outside", [
        block("weather-heading", "Cushion Care", "h2"),
        block(
          "weather-fix",
          "Store cushions dry when not in use to help them last.",
        ),
      ]);
      b = replaceSection(b, "Dimensions, Seating and Weight Limits", [
        block("dims-heading", "Dimensions", "h2"),
        block(
          "dims-fix",
          "The overall dimensions of the chair are 68 cm (W) x 80 cm (D) x 75 cm (H).",
        ),
      ]);
      b = replaceSection(b, "Covers, Cleaning and Winter Storage", [
        block("cleaning-heading", "Cleaning and Care", "h2"),
        block(
          "cleaning-fix",
          "The care guidelines suggest taking care due to the natural wood material and potential colour variations.",
        ),
      ]);
      return b;
    },
  },
];

async function main() {
  const results: { id: string; title: string; ok: boolean; error?: string }[] =
    [];
  const transaction = client.transaction();
  let queued = 0;

  for (const fix of FIXES) {
    try {
      const doc = await client.fetch<{ description: Block[] } | null>(
        `*[_id == $id][0]{description}`,
        { id: fix.id },
      );
      if (!doc) {
        results.push({
          id: fix.id,
          title: fix.title,
          ok: false,
          error: "not found",
        });
        continue;
      }
      const newBlocks = fix.apply(doc.description);
      results.push({ id: fix.id, title: fix.title, ok: true });
      if (apply) {
        transaction.patch(fix.id, (p) => p.set({ description: newBlocks }));
        queued += 1;
      }
    } catch (error) {
      results.push({
        id: fix.id,
        title: fix.title,
        ok: false,
        error: String(error),
      });
    }
  }

  console.table(results);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-gap-decimal-fix-batch2.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
