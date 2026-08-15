/**
 * Makes the product fill its own photograph, so a Kaiku listing looks bigger than
 * the one next to it.
 *
 * Damien sent a Google Shopping listing for the same product from a competitor: a
 * landscape photograph letterboxed into a square tile with thick white bars top and
 * bottom, the product small in the middle. Kaiku is not doing that — every one of the
 * 120 published hero images is already square, so nothing gets letterboxed. It is
 * losing in a quieter way. Measured across all 120, **the product occupies 82% of
 * its frame on average and as little as 49%**: Elmley Grey End Table is a 139×195
 * object inside a 400×400 photograph, so more than half that Shopping tile is empty
 * white. Trimming the wasted margin makes the product **1.3–1.9× larger** in exactly
 * the same tile, for the same click and the same photograph.
 *
 * How it does it: `sharp().trim()` finds the product's bounding box against the white
 * sweep, and `scripts/lib/hero-crop.ts` turns that into a square Sanity crop with a
 * 6% margin. A margin, not flush — Merchant Center wants the whole product visible
 * and warns on images that look cropped, and a product jammed against the frame edge
 * looks like an accident next to competitors who all leave air.
 *
 * The crop is stored on the gallery entry, not baked into a new asset. Nothing is
 * re-uploaded and nothing is destroyed: the original photograph is untouched and the
 * product page's main gallery still shows the whole frame, because `normalizeProduct`
 * deliberately keeps `gallery[].url` as the raw asset and applies hotspot/crop only
 * to the card and feed sizes.
 *
 * **Pack shots only.** A lifestyle photograph has no white margin to reclaim, and
 * trimming one would crop into the room. Products whose hero is not flagged
 * `isStudioShot` are skipped, which is why `derive-studio-shots.ts` has to have run
 * first.
 *
 *   pnpm tsx --env-file=.env.local scripts/tighten-hero-crops.ts
 *   pnpm tsx --env-file=.env.local scripts/tighten-hero-crops.ts --apply
 *
 * Dry run by default, and always writes .image-work/hero-crops.png — a before/after
 * sheet, because this changes the one image that represents every product.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";
import sharp from "sharp";

import {
  fullHotspot,
  magnification,
  type SanityCrop,
  squareCrop,
} from "./lib/hero-crop";

const apply = process.argv.includes("--apply");

const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

interface Row {
  id: string;
  title: string;
  slug: string;
  key: string | null;
  url: string | null;
  studio: boolean | null;
  hasCrop: boolean;
  /** The asset's real pixel size — see the note in `cropped`. */
  assetWidth: number | null;
  assetHeight: number | null;
}

const QUERY = /* groq */ `
*[_type == "product" && !(_id in path("drafts.**")) && count(gallery) > 0]{
  "id": _id, title, "slug": slug.current,
  "key": gallery[0]._key,
  "url": gallery[0].asset->url,
  "studio": gallery[0].isStudioShot,
  "hasCrop": defined(gallery[0].crop),
  "assetWidth": gallery[0].asset->metadata.dimensions.width,
  "assetHeight": gallery[0].asset->metadata.dimensions.height
} | order(slug asc)`;

/** Measure on a modest render — a bounding box does not need the original. */
const MEASURE = 400;

async function trimBox(url: string) {
  const res = await fetch(`${url}?w=${MEASURE}&fm=png`);
  if (!res.ok) return null;
  const image = sharp(Buffer.from(await res.arrayBuffer())).removeAlpha();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) return null;
  try {
    // threshold 12 rather than 0: a studio sweep is not mathematically #ffffff, and
    // a JPEG smears its edges, so an exact-match trim finds nothing to remove.
    const { info } = await image
      .clone()
      .trim({ background: "#ffffff", threshold: 12 })
      .toBuffer({ resolveWithObject: true });
    return {
      frame: { width: meta.width, height: meta.height },
      // sharp reports the removed offsets as negative numbers on info.
      box: {
        left: Math.abs(info.trimOffsetLeft ?? 0),
        top: Math.abs(info.trimOffsetTop ?? 0),
        width: info.width,
        height: info.height,
      },
    };
  } catch {
    return null;
  }
}

const CELL = 150;
const GAP = 6;
const LABEL = 26;

async function tile(url: string): Promise<Buffer> {
  const res = await fetch(
    `${url}&w=${CELL * 2}&h=${CELL * 2}&fit=crop&fm=png`.replace("?&", "?"),
  );
  return sharp(Buffer.from(await res.arrayBuffer()))
    .resize(CELL, CELL, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();
}

/**
 * The URL the CDN serves for a crop, so the sheet shows the real result.
 *
 * `rect` is in the **original asset's** pixels, while the trim was measured on a
 * 400px render. Passing the measurement-space numbers straight through asks for a
 * rectangle outside a smaller original, and the CDN answers with an error page that
 * sharp then rejects as "unsupported image format". The stored crop is unaffected by
 * this either way — it is fractional — but the preview has to scale.
 */
function cropped(
  url: string,
  crop: SanityCrop,
  asset: { width: number; height: number },
) {
  const left = Math.round(crop.left * asset.width);
  const top = Math.round(crop.top * asset.height);
  const width = Math.round(asset.width * (1 - crop.left - crop.right));
  const height = Math.round(asset.height * (1 - crop.top - crop.bottom));
  return `${url}?rect=${left},${top},${width},${height}`;
}

async function main() {
  const products = await client.fetch<Row[]>(QUERY);
  console.log(
    `\n${products.length} published products. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const changes: {
    row: Row;
    crop: SanityCrop;
    gain: number;
    frame: { width: number; height: number };
  }[] = [];
  let notStudio = 0;
  let alreadyTight = 0;
  let unmeasurable = 0;

  for (const row of products) {
    if (!row.url || !row.key) continue;
    if (row.studio !== true) {
      notStudio += 1;
      continue;
    }
    const measured = await trimBox(row.url);
    if (!measured) {
      unmeasurable += 1;
      continue;
    }
    const crop = squareCrop(measured.box, measured.frame);
    if (!crop) {
      alreadyTight += 1;
      continue;
    }
    changes.push({
      row,
      crop,
      gain: magnification(crop, measured.frame),
      frame: measured.frame,
    });
    process.stdout.write(".");
  }
  console.log("\n");

  changes.sort((a, b) => b.gain - a.gain);
  for (const change of changes)
    console.log(
      `  ${change.gain.toFixed(2)}×  ${change.row.slug}${change.row.hasCrop ? "  (replacing an existing crop)" : ""}`,
    );

  console.log(
    `\n${changes.length} to tighten · ${alreadyTight} already fill their frame · ` +
      `${notStudio} skipped (hero is not a pack shot) · ${unmeasurable} could not be measured`,
  );

  // The sheet is written on a dry run too: this changes the one image representing
  // every product, so it should never be applied unseen.
  if (changes.length) {
    const perRow = 6;
    const rows = Math.ceil(changes.length / perRow);
    const unit = CELL * 2 + GAP * 3;
    const width = GAP + Math.min(perRow, changes.length) * unit;
    const height = GAP + rows * (CELL + LABEL + GAP * 2);
    const composites: sharp.OverlayOptions[] = [];
    let svg = "";

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i]!;
      const x = GAP + (i % perRow) * unit;
      const y = GAP + Math.floor(i / perRow) * (CELL + LABEL + GAP * 2);
      composites.push({
        input: await tile(`${change.row.url!}?`),
        left: x,
        top: y,
      });
      composites.push({
        input: await tile(
          cropped(change.row.url!, change.crop, {
            width: change.row.assetWidth ?? change.frame.width,
            height: change.row.assetHeight ?? change.frame.height,
          }),
        ),
        left: x + CELL + GAP,
        top: y,
      });
      const name =
        change.row.slug.length > 36
          ? `${change.row.slug.slice(0, 35)}…`
          : change.row.slug;
      svg +=
        `<text x="${x}" y="${y + CELL + 12}" font-family="sans-serif" font-size="10" fill="#111">${name}</text>` +
        `<text x="${x}" y="${y + CELL + 23}" font-family="sans-serif" font-size="9" fill="#a33">${change.gain.toFixed(2)}× larger</text>`;
    }

    const dir = path.join(process.cwd(), ".image-work");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, "hero-crops.png");
    await sharp({
      create: { width, height, channels: 3, background: "#efedE8" },
    })
      .composite([
        ...composites,
        {
          input: Buffer.from(
            `<svg width="${width}" height="${height}">${svg}</svg>`,
          ),
          left: 0,
          top: 0,
        },
      ])
      .png()
      .toFile(file);
    console.log(`\nBefore/after written to ${file}`);
  }

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const change of changes) {
    // Patch the one gallery entry by key rather than rewriting the array: the
    // whole-array rewrite in set-gallery-hero.ts is only needed for reordering, and
    // a targeted patch cannot disturb anything it does not name.
    await client
      .patch(change.row.id)
      .set({
        [`gallery[_key=="${change.row.key}"].crop`]: change.crop,
        // urlForImage ignores a crop unless a hotspot is present — see fullHotspot.
        [`gallery[_key=="${change.row.key}"].hotspot`]: fullHotspot(),
      })
      .commit();
    console.log(`  ✓ ${change.row.slug}`);
  }
  console.log(`\nTightened ${changes.length} hero images.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
