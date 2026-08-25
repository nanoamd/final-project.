/**
 * Gives every product image alt text.
 *
 * 7,205 of 7,682 gallery images had none, which fails a screen reader outright
 * and throws away the only text Google reads about an image.
 *
 * **Existing alt text is never overwritten.** A few hundred entries were
 * written by somebody looking at the photograph — "cropped view styled with
 * soap products and flowers on top" — and nothing generated from a product
 * record will better that. Those are left exactly as they are.
 *
 *   pnpm tsx --env-file=.env.local scripts/set-image-alt.ts
 *   pnpm tsx --env-file=.env.local scripts/set-image-alt.ts --apply
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { buildAlt } from "../src/lib/catalog/image-alt";

const apply = process.argv.includes("--apply");

/**
 * Products whose name and supplier disagree on the material, so the material
 * is not asserted anywhere. Hill records the Glass Candle Holder as stone
 * while its own description calls it glass with transparent glass walls.
 */
const DISPUTED_MATERIAL = new Set([
  "hill-decor-16210",
  "drafts.hill-decor-16210",
]);

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface GalleryImage {
  _key?: string;
  _type?: string;
  alt?: string;
  asset?: { _ref?: string };
}

async function main() {
  const harvested: Record<string, { material?: string }> = existsSync(
    ".audit/harvested-facts.json",
  )
    ? JSON.parse(readFileSync(".audit/harvested-facts.json", "utf8"))
    : {};

  const rows: {
    _id: string;
    title?: string;
    category?: string;
    primaryColour?: string;
    gallery?: GalleryImage[];
  }[] = await client.fetch(
    `*[_type == "product" && count(gallery) > 0]{
      _id, title, primaryColour,
      "category": category->title,
      gallery
    }`,
  );

  const patches: { id: string; gallery: GalleryImage[] }[] = [];
  let written = 0;
  let kept = 0;
  const samples: string[] = [];

  for (const row of rows) {
    const gallery = row.gallery ?? [];
    let touched = false;

    const next = gallery.map((image, index) => {
      const existing = (image.alt ?? "").trim();
      // Existing alt text is kept, with one exception: text this script wrote
      // itself from an unsanitised material field. "Wimslow Smoked Glass Dining
      // Table with 6 Chairs Set, in glass 0%,metal 100% cart weight" is not
      // alt text a person would have written, and leaving it because it is
      // "existing" would leave 467 products reading a spreadsheet aloud.
      const isPolluted =
        /\d{1,3}\s?%/.test(existing) ||
        /\b(?:cart|carton|gross|net|pack)\s+(?:weight|qty|quantity|size)\b/i.test(
          existing,
        );
      if (existing && !isPolluted) {
        kept++;
        return image;
      }
      const alt = buildAlt({
        title: row.title ?? "",
        index,
        total: gallery.length,
        material: DISPUTED_MATERIAL.has(row._id)
          ? null
          : (harvested[row._id]?.material ?? null),
        primaryColour: row.primaryColour ?? null,
        category: row.category ?? null,
      });
      if (existing === alt) {
        kept++;
        return image;
      }
      written++;
      touched = true;
      if (samples.length < 10) samples.push(alt);
      return { ...image, alt };
    });

    if (touched) patches.push({ id: row._id, gallery: next });
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — image alt text\n`);
  console.log(`Products with images: ${rows.length}`);
  console.log(`Alt text to write:    ${written}`);
  console.log(`Existing, untouched:  ${kept}`);
  console.log(`Documents to patch:   ${patches.length}`);
  console.log(`\n──── sample ────`);
  samples.forEach((s) => console.log(`  ${s}`));

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  writeFileSync(
    `docs/change-log/${stamp.slice(0, 10)}-image-alt.json`,
    JSON.stringify(
      { generatedAt: stamp, applied: apply, written, kept },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  let done = 0;
  for (const patch of patches) {
    await client.patch(patch.id).set({ gallery: patch.gallery }).commit();
    if (++done % 100 === 0) console.log(`  patched ${done}/${patches.length}`);
  }
  console.log(`\nPatched ${done} products.`);
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
