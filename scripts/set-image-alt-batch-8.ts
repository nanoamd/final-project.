/**
 * Batch 8 of the image alt-text pass — every image individually viewed
 * before writing its description. Same asset-fragment-matching pattern as
 * batches 4-7.
 *
 * Covers:
 *   - Brown Wooden Storage Crates (Set of 3) (4 of 7 images — the other 3
 *     are .avif files that couldn't be viewed, left blank rather than
 *     guessed)
 *   - Large Brown Wooden Storage Tub (1 of 3 images — the other 2 are
 *     .avif, same reason)
 *   - Set of 3 Gamal Wood Plant Stands (4 of 6 images — the other 2 are
 *     .avif, same reason)
 *   - Natural Folding Wooden A-Frame Shelf – Brown (4 images — NOTE: the
 *     4th photo shows a WHITEWASHED shelf, not the brown finish this
 *     product is titled/sold as. Alt text describes what the photo
 *     actually shows; the product's own gallery photo assignment looks
 *     wrong and needs a human to check in Studio — not fixed here.)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-8.ts
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
  "brown-wooden-storage-crates-set-of-3": {
    dd6a29a6b337c1340c78f0f8e0a20185f052648c:
      "Set of 3 brown wooden storage crates nested and stacked at different sizes, on a white background",
    bfd6254bd17680ba1d467da2baeff8b3d13e0885:
      "Brown wooden storage crates styled with potted aloe vera and a small flowering plant on top",
    "63165a616325bdbabf3403af36cb6af2dd97b47e":
      "Set of 3 brown wooden storage crates nested and stacked, angled view on a white background",
    "317c50fe7b1fa1c2d1e3a95b7412222609c6bd73":
      "Brown, blue and turquoise painted wooden storage crates shown together, styled with potted plants",
  },
  "large-brown-wooden-storage-tub": {
    ffc14a270f3ba29826ff62034122be19e7452ccd:
      "Large whitewash wooden storage tub with rope trim around the rim and base, on a white background",
  },
  "set-of-3-gamal-wood-plant-stands-natural": {
    f12c694803956d1484bbf1007e2346f2fcdab849:
      "Set of 3 Gamal wood plant stands with hairpin legs, styled with potted houseplants including a pothos and spider plant against a brick wall",
    b8746be0f1b1f99bc1eaa6dc4e17253f55df9cc5:
      "Set of 3 Gamal wood plant stands with hairpin legs, closer view styled with potted houseplants including a pothos, anthurium and spider plants against a brick wall",
    ae88716a5d3945a549e508bdad57eab5dac51bfd:
      "Set of 3 Gamal wood plant stands with hairpin legs, three heights shown empty on a white background",
    d8f7e0055b762f276bcce85e4a3ca8ee58e9c549:
      "Set of 3 Gamal wood plant stands with hairpin legs, close-up styled view with potted houseplants including a pothos, anthurium and spider plants against a brick wall",
  },
  "natural-folding-wooden-a-frame-shelf-brown": {
    fd6fc3609d327089e26e432a4024aefa358c141b:
      "Brown wooden A-frame folding shelf, styled with white candles, salt bowls and pink Himalayan salt spheres on the shelves",
    a3e2cf335370d76ec3288f1afc05da593fe3ac17:
      "Brown wooden A-frame folding shelf, empty, on a white background",
    cb127a69639201cf61161405950137aad60711d8:
      "Brown wooden A-frame folding shelf, styled with candles, packets of Himalayan bath salts and carved salt ornaments on the shelves",
    "4b0f17cdcf0f8d02e417fb2b887c08881d3ff0a7":
      "Whitewashed wooden A-frame folding shelf, styled with potted plants, a Himalayan salt lamp and a vase of flowers on the shelves",
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

  console.log("\nDone with batch 8.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-8 failed:", err);
  process.exit(1);
});
