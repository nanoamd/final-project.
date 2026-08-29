/**
 * Moves indoor furniture out of Garden Furniture.
 *
 * Damien, on the dark /shop index: *"this chair isnt outdoor furniture"* —
 * pointing at the Cebu Elm Wood and Rattan Dining Chair, a chrome cantilever
 * dining chair with a cane seat, sitting in the Garden Furniture grid between
 * two woven-rope garden sofas.
 *
 * It is not one product. Every Premier Housewares range imported with a
 * default category landed in `garden-furniture`, and six of them are indoor
 * pieces by any reading:
 *
 *   - A rattan **wall shelf**, which is not garden furniture in any sense.
 *   - Two sets of Batu rattan **side tables** — the same Batu range whose own
 *     copy says "add a touch of nature to any indoor space".
 *   - The Cebu **dining chair**: chrome cantilever frame, cane back and seat.
 *   - Two Trento tables in rattan and an **antique gold finish**, which is an
 *     indoor decorative finish and not something anyone leaves in the rain.
 *
 * The Manado and Opus ranges stay where they are: woven rope and outdoor
 * rattan on metal frames, sold as garden furniture, and correctly filed.
 *
 * Only the primary `category` reference moves. Nothing is renamed, no price is
 * touched, and nothing is hidden from the navigation.
 *
 *   pnpm tsx --env-file=.env.local scripts/recategorise-indoor-pieces.ts
 *   pnpm tsx --env-file=.env.local scripts/recategorise-indoor-pieces.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** Exact titles, so this can never catch a product it was not meant to. */
const MOVES: { title: string; to: string; why: string }[] = [
  {
    title: "Cebu Elm Wood and Rattan Dining Chair | Kaiku",
    to: "kitchen-furniture",
    why: "Chrome cantilever dining chair with a cane back and seat — indoor.",
  },
  {
    title: "Batu Large Black Rattan Wall Shelf | Kaiku",
    to: "shelving",
    why: "A wall shelf is not garden furniture.",
  },
  {
    title: "Batu Set Of 2 Black Rattan Side Tables | Kaiku",
    to: "side-tables",
    why: "Indoor rattan side tables; the range's own copy says indoor.",
  },
  {
    title: "Batu Set Of 2 Natural Rattan Side Tables | Kaiku",
    to: "side-tables",
    why: "Indoor rattan side tables; the range's own copy says indoor.",
  },
  {
    title: "Trento Round Rattan and Antique Gold Finish Coffee Table | Kaiku",
    to: "coffee-tables",
    why: "Antique gold finish is an indoor decorative finish.",
  },
  {
    title: "Trento Round Rattan and Antique Gold Finish Side Table | Kaiku",
    to: "side-tables",
    why: "Antique gold finish is an indoor decorative finish.",
  },
];

async function main() {
  const results: {
    title: string;
    from: string | null;
    to: string;
    why: string;
    status: string;
  }[] = [];

  for (const move of MOVES) {
    const product = await client.fetch<{
      _id: string;
      cat: string | null;
    } | null>(
      `*[_type == "product" && !(_id in path("drafts.**")) && title == $title][0]{
         _id, "cat": category->slug.current }`,
      { title: move.title },
    );
    if (!product) {
      results.push({ ...move, from: null, status: "NOT FOUND" });
      continue;
    }
    if (product.cat === move.to) {
      results.push({ ...move, from: product.cat, status: "already there" });
      continue;
    }

    const target = await client.fetch<{ _id: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{_id}`,
      { slug: move.to },
    );
    if (!target) {
      results.push({ ...move, from: product.cat, status: "NO SUCH CATEGORY" });
      continue;
    }

    results.push({ ...move, from: product.cat, status: "move" });

    if (apply) {
      try {
        await client
          .patch(product._id)
          .set({
            category: { _type: "reference", _ref: target._id },
          })
          .commit();
      } catch (error) {
        console.log(`  FAILED ${move.title}: ${(error as Error).message}`);
      }
    }
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — indoor pieces\n`);
  for (const r of results)
    console.log(
      `  ${r.status.padEnd(18)} ${r.title.slice(0, 56).padEnd(58)} ${r.from} -> ${r.to}`,
    );
  console.log(
    `\n${results.filter((r) => r.status === "move").length} to move.`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-recategorise.json`,
    JSON.stringify({ applied: apply, results }, null, 2),
  );

  if (!apply) console.log("\nNothing written. Re-run with --apply.");
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
