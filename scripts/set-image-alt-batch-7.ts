/**
 * Batch 7 of the image alt-text pass — every image individually viewed
 * before writing its description. Same asset-fragment-matching pattern as
 * batches 4-6.
 *
 * Covers:
 *   - Natural Teak Corner Shelf Unit 3-Tier 90cm (3 images)
 *   - Natural Teak Corner Shelf Unit 4-Tier 135cm (4 images)
 *   - Natural Teak Log Shelf Display 3-Tier 100cm (4 images)
 *   - Reclaimed Teak Six Shelf Display Unit with Castors (4 images)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-7.ts
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token,
  useCdn: false,
});

const ALT_BY_ASSET_FRAGMENT: Record<string, Record<string, string>> = {
  "natural-teak-corner-shelf-unit-3-tier-90cm": {
    "21b6a4284dbad37196b92ca95437cb1a5b9416b0":
      "Natural teak corner shelf unit, 3-tier, styled in a room corner with a potted spider plant on top and dried pampas grass beside it",
    "70532d9250a9aa409a0f53a1d39efe324fcee8c1":
      "Natural teak corner shelf unit, 3-tier, front view on a white background",
    "554347e03f7a52f0e5b532810011a33b56062a56":
      "Natural teak corner shelf unit, 3-tier, side profile view on a white background",
  },
  "natural-teak-corner-shelf-unit-4-tier-135cm": {
    "24d38f941c022c86732b5ef48dec866ca89c4183":
      "Natural teak corner shelf unit, 4-tier, front view on a white background",
    "9831baad5ec972373cec4cea4cdbe3923f1365e6":
      "Natural teak corner shelf unit, 4-tier, styled in a room corner with a candle jar, reed diffuser, soap and a potted plant on the shelves",
    "73196b23f5ef14ba6da447b34635df662bf093e9":
      "Natural teak corner shelf unit, 4-tier, side profile view on a white background",
    "63b87c5ae9e2d103495cfaeb5c80c711ce45cb3a":
      "Natural teak corner shelf unit, 4-tier, angled three-quarter view on a white background",
  },
  "natural-teak-log-shelf-display-3-tier-100cm": {
    cd5ede3e95cc95e1e6c085be91475ecd0ae31c28:
      "Natural teak log shelf display, 3-tier, side profile view on a white background",
    "3955321a352b747b525c0d1be4a7646c272e9ecc":
      "Natural teak log shelf display, 3-tier, styled in a room corner with a potted plant, glass jar and houseplant on the shelves",
    "4965c3a93201ee2c5ed0006bc5ff428f358883ba":
      "Natural teak log shelf display, 3-tier, close-up view of the top shelf and post",
    ad4e17fd67ae70c0264c6bf0b8a84eae8ae0768a:
      "Natural teak log shelf display, 3-tier, close-up view of the bottom shelf and legs",
  },
  "reclaimed-teak-six-shelf-display-unit-castors": {
    "7def4c5498269c118fdae3782b819d57615355fa":
      "Reclaimed teak six-shelf display unit on castors, front view on a white background",
    "4a48411a672a173055791b40a1fa94e439edd3b5":
      "Reclaimed teak six-shelf display unit on castors, front view on a white background with the shelves empty",
    "83bb5d63a7ec8f68c84efa716cd789fd2dd48f71":
      "Reclaimed teak six-shelf display unit on castors, styled in a living room with decorative ornaments, boxes and handbags on the shelves",
    e931d08522d9d3dd0c4dd9a87e066bf990020a37:
      "Reclaimed teak six-shelf display unit on castors, side profile view on a white background",
  },
};

async function main() {
  for (const [slug, altByFragment] of Object.entries(ALT_BY_ASSET_FRAGMENT)) {
    const products = await client.fetch<
      { _id: string; title: string; gallery: { url: string }[] }[]
    >(
      `*[_type == "product" && slug.current == $slug]{
        _id, title, "gallery": gallery[]{ "url": asset->url }
      }`,
      { slug },
    );
    if (!products.length) {
      console.warn(`✗ ${slug}: no product found, skipped`);
      continue;
    }

    for (const product of products) {
      const patch: Record<string, string> = {};
      let matched = 0;
      product.gallery.forEach((img, i) => {
        const fragment = Object.keys(altByFragment).find((f) =>
          img.url.includes(f),
        );
        if (fragment) {
          patch[`gallery[${i}].alt`] = altByFragment[fragment]!;
          matched++;
        }
      });

      if (!matched) {
        console.warn(
          `✗ ${slug} (${product._id}): no gallery images matched expected assets, skipped`,
        );
        continue;
      }

      await client.patch(product._id).set(patch).commit();
      console.log(
        `✓ ${product.title} (${product._id}): set alt text on ${matched} image(s)`,
      );
    }
  }

  console.log("\nDone with batch 7.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-7 failed:", err);
  process.exit(1);
});
