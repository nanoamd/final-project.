/**
 * Moves indoor furniture out of Garden Furniture.
 *
 * Damien, on the dark /shop index: *"this chair isnt outdoor furniture"* —
 * pointing at the Cebu Elm Wood and Rattan Dining Chair, a chrome cantilever
 * dining chair with a cane seat, sitting in the Garden Furniture grid between
 * two woven-rope garden sofas.
 *
 * Premier Housewares ranges imported with a default category all landed in
 * `garden-furniture`. Two of them do not belong there — see the note on MOVES
 * for which, and for the four that were nearly moved with them and should not
 * have been.
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

/**
 * Exact titles, so this can never catch a product it was not meant to.
 *
 * **This list was six and is two.** The first pass moved every Premier
 * Housewares piece filed under `garden-furniture` that looked indoor to me —
 * the Batu side tables and both Trento tables among them. Checking each
 * product's own copy rather than reasoning about the range showed that was
 * wrong: the Batu side tables are described as "perfect for any outdoor
 * space… designed to withstand regular outdoor use", and both Trento tables
 * name a garden or patio. Whatever they look like, they are sold as garden
 * furniture and they are filed correctly. Generalising from one product in a
 * range to the rest of it is the exact mistake that has come up before, and
 * this is it happening again.
 *
 * What is left is the two that survive their own copy:
 *
 *   - The **wall shelf**, whose copy says "an eco-friendly addition to any
 *     home" and never mentions outdoors. A wall shelf is not garden furniture.
 *   - The **Cebu dining chair**, which is the one Damien looked at and called
 *     out. Its supplier copy does claim an "outdoor dining space", and that
 *     claim is overselling: it is a chrome-plated cantilever frame with a
 *     natural cane back and seat. Chrome rusts and cane rots. Damien owns the
 *     shop, has seen the piece, and said plainly that it is not outdoor
 *     furniture; the physics agrees with him and the supplier's marketing does
 *     not.
 */
const MOVES: { title: string; to: string; why: string }[] = [
  {
    title: "Cebu Elm Wood and Rattan Dining Chair | Kaiku",
    to: "kitchen-furniture",
    why: "Chrome cantilever frame with a cane back and seat — indoor, whatever the supplier copy claims.",
  },
  {
    title: "Batu Large Black Rattan Wall Shelf | Kaiku",
    to: "shelving",
    why: "A wall shelf is not garden furniture, and its own copy says 'any home'.",
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
