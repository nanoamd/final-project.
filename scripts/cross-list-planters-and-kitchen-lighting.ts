/**
 * Eight products, each into one more category their own title already
 * proves they belong in.
 *
 * Damien: *"alot of products should be in multiple categories but alot of
 * categories feel empty when i know they shouldnt be"*. Most of that turned
 * out to already be fixed and live — `fill-empty-categories.ts` filled eight
 * room-lighting/storage/shelving categories from real stock, and a separate
 * pass already cross-listed the sofa beds into Beds and the reclaimed teak
 * coffee tables into Coffee Tables. Checking each one against the live data
 * before writing anything new here (see the 31 August ledger entry) is what
 * found the three that are still genuinely empty for lack of matching
 * stock — Bathroom Lighting, Rugs, Towel Rails — and ruled out reopening
 * Tristan Mirror And Wood 4X6/5X7 Frame, which a keyword scan flagged as
 * mirrors but which a five-day-old, already-live decision correctly moved
 * to Wall Art (photo frames with a mirrored border, not mirrors).
 *
 * What was left, each evidenced by the product's own title or summary
 * rather than assumed from its type:
 *
 *   - **Kitchen Lighting had no pendant in it** — the reason
 *     `fill-empty-categories.ts` refused it outright ("there are no
 *     pendants or strips in the catalogue") is no longer true. Lenno Large
 *     Gold Pendant Light and Wyra Black Finish Frame Pendant Light are both
 *     ceiling pendants whose own summaries name kitchens specifically
 *     ("dining room, kitchen, or living area"; "above kitchen islands") —
 *     not the generic every-room boilerplate this catalogue is full of, and
 *     not a table lamp, which is the real safety reason that category stays
 *     closed to most of Lighting.
 *   - **Three garden lighting/water pieces double as planters** — their own
 *     titles say "with Planter": the Three-Head Solar Lamp Post, the Solar
 *     Lamp Post Light, and the Four-Tier Rustic Pot Fountain. A shopper
 *     browsing Planters for something with a light or a trickle of water
 *     built in should find these.
 *   - **Two solar floor lanterns and a bollard lantern are, by their own
 *     name, lanterns** — Rattan Solar Floor Lantern (Brown, Grey) and the
 *     1.77m Solar Bollard Lantern. Filed only under Garden Lighting; Candles
 *     & Lanterns is the other page a shopper looking for a lantern checks.
 *
 * Additive only — `additionalCategories`. No primary category changes, no
 * product is renamed, nothing is removed from anywhere it already appears.
 *
 *   pnpm tsx --env-file=.env.local scripts/cross-list-planters-and-kitchen-lighting.ts
 *   pnpm tsx --env-file=.env.local scripts/cross-list-planters-and-kitchen-lighting.ts --apply
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

const ADDITIONS: { title: string; add: string; why: string }[] = [
  {
    title: "Lenno Large Gold Pendant Light | Kaiku",
    add: "kitchen-lighting",
    why: 'Own summary: "dining room, kitchen, or living area" — a ceiling pendant, not a table lamp.',
  },
  {
    title: "Wyra Black Finish Frame Pendant light | Kaiku",
    add: "kitchen-lighting",
    why: 'Own summary: "above kitchen islands" — a ceiling pendant, not a table lamp.',
  },
  {
    title: "Three-Head Solar Lamp Post with Planter, Black | Kaiku",
    add: "planters",
    why: 'Its own title: "with Planter".',
  },
  {
    title: "Solar Lamp Post Light with Planter, Black | Kaiku",
    add: "planters",
    why: 'Its own title: "with Planter".',
  },
  {
    title: "Four-Tier Rustic Pot Fountain with Planter, Rustic Brown | Kaiku",
    add: "planters",
    why: 'Its own title: "with Planter".',
  },
  {
    title: "Rattan Solar Floor Lantern, Brown | Kaiku",
    add: "candles-and-lanterns",
    why: "Its own title names it a lantern.",
  },
  {
    title: "Rattan Solar Floor Lantern, Grey | Kaiku",
    add: "candles-and-lanterns",
    why: "Its own title names it a lantern.",
  },
  {
    title: "1.77m Solar Bollard Lantern, Black | Kaiku",
    add: "candles-and-lanterns",
    why: "Its own title names it a lantern.",
  },
];

async function main() {
  const results: {
    title: string;
    add: string;
    why: string;
    status: string;
  }[] = [];

  for (const item of ADDITIONS) {
    const product = await client.fetch<{
      _id: string;
      existing: string[] | null;
    } | null>(
      `*[_type == "product" && !(_id in path("drafts.**")) && title == $title][0]{
         _id, "existing": additionalCategories[]->slug.current }`,
      { title: item.title },
    );
    if (!product) {
      results.push({ ...item, status: "NOT FOUND" });
      continue;
    }
    if ((product.existing ?? []).includes(item.add)) {
      results.push({ ...item, status: "already listed there" });
      continue;
    }

    const target = await client.fetch<{ _id: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{_id}`,
      { slug: item.add },
    );
    if (!target) {
      results.push({ ...item, status: "NO SUCH CATEGORY" });
      continue;
    }

    results.push({ ...item, status: "add" });

    if (apply) {
      try {
        await client
          .patch(product._id)
          .setIfMissing({ additionalCategories: [] })
          .append("additionalCategories", [
            { _type: "reference", _ref: target._id, _key: `add-${item.add}` },
          ])
          .commit();
      } catch (error) {
        console.log(`  FAILED ${item.title}: ${(error as Error).message}`);
      }
    }
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — cross-listings\n`);
  for (const r of results)
    console.log(
      `  ${r.status.padEnd(20)} +${r.add.padEnd(20)} ${r.title.slice(0, 52)}`,
    );
  console.log(`\n${results.filter((r) => r.status === "add").length} to add.`);

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-cross-listings-planters-kitchen.json`,
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
