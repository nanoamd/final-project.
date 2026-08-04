/**
 * Batch 4 of the image alt-text pass — every image individually viewed
 * before writing its description (one exception noted below). Same safe
 * pattern as batches 1-3: patches `gallery[N].alt` by matching each
 * specific image URL (not by index), so it's correct even for products
 * where the same photo asset is reused in a different order across
 * duplicate/near-duplicate product documents.
 *
 * Covers:
 *   - 10 ml Eucalyptus Essential Oil / Eucalyptus Essential Oil 10ml
 *     (duplicate products, same 3 photos) — these are generic Ancient
 *     Wisdom range shots (Myrrh/Lavender/Orange bottles), not actually
 *     Eucalyptus-specific photos, so the alt text describes what's truly
 *     in each photo rather than claiming they show Eucalyptus.
 *   - 10 ml Sweet Birch Essential Oil / Sweet Birch Essential Oil 10ml
 *     (duplicate products, 1 photo, genuinely Sweet Birch)
 *   - Sweet Birch 50ml / Sweet Birch Essential Oil 50ml (duplicate
 *     products, 3 photos — 2 are generic range shots, 1 is genuine)
 *   - 4 Drawer Recycled Wood Storage Chest (2 images)
 *   - Bedside Table - Classic - Recycled Wood (2 images)
 *   - Beer Barrel Table – Natural Wood (5 images — NOTE: one of these,
 *     2507fad36eb13b9bcb79502a739cf6d075027d2e, actually shows a
 *     WHITEWASH barrel with chrome bands, not this product's natural
 *     wood/black-band finish. Alt text describes what the photo actually
 *     shows; the product's own gallery photo assignment looks wrong and
 *     needs a human to check in Studio — not fixed here.)
 *   - Natural Wooden Beer Barrel Storage Stool (4 of 5 images — the 5th,
 *     2474f55cba5285eb83f708e0ed551797f1179b92, is an .avif file that
 *     couldn't actually be viewed, so it's left blank rather than guessed)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-4.ts
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

// Keyed by product slug -> { assetFilenameFragment -> alt text }. Matched
// by a distinctive fragment of the asset URL (its hash), not by array
// index, since the same photo can appear at a different index on
// duplicate product documents.
const ALT_BY_ASSET_FRAGMENT: Record<string, Record<string, string>> = {
  "10-ml-eucalyptus-essential-oil": {
    "017b6ec0ecaaa992e8cef88dc94ab2e2f3f275c3":
      "Ancient Wisdom 10ml Eucalyptus essential oil bottle, front label view on a white background",
    eb4052220290960ff9d83b3ec152b5aa973f956f:
      "Ancient Wisdom essential oil bottles including Myrrh and Lavender, styled with dried rose buds and a decorative trunk",
    "9c1f7d607c36db1aa609ea233a6cb3aaf6dfa104":
      "Ancient Wisdom Lavender and Orange essential oil bottles, close-up styled shot with dried rose buds",
  },
  "eucalyptus-essential-oil-10ml": {
    eb4052220290960ff9d83b3ec152b5aa973f956f:
      "Ancient Wisdom essential oil bottles including Myrrh and Lavender, styled with dried rose buds and a decorative trunk",
    "017b6ec0ecaaa992e8cef88dc94ab2e2f3f275c3":
      "Ancient Wisdom 10ml Eucalyptus essential oil bottle, front label view on a white background",
    "9c1f7d607c36db1aa609ea233a6cb3aaf6dfa104":
      "Ancient Wisdom Lavender and Orange essential oil bottles, close-up styled shot with dried rose buds",
  },
  "10-ml-sweet-birch-essential-oil": {
    "21cf781c4a18d53b31a8272ca1be1c8acc26e4a2":
      "Ancient Wisdom 10ml Sweet Birch essential oil bottle, front label view on a white background",
  },
  "sweet-birch-essential-oil-10ml": {
    "21cf781c4a18d53b31a8272ca1be1c8acc26e4a2":
      "Ancient Wisdom 10ml Sweet Birch essential oil bottle, front label view on a white background",
  },
  "sweet-birch-50ml": {
    b019d24d802c983e396eb84687c1f3dde92d6873:
      "Ancient Wisdom 50ml essential oil range including Rose Absolute, Lemongrass and Orange",
    a9072d6beb0934d7ea5134daf9eef0051f8675e1:
      "Ancient Wisdom 50ml Lavender essential oil bottles, front and back label view",
    "520796491e837f80dd4306d60d39df7d811325a1":
      "Ancient Wisdom 50ml Sweet Birch essential oil bottle, front label view on a white background",
  },
  "sweet-birch-essential-oil-50ml": {
    b019d24d802c983e396eb84687c1f3dde92d6873:
      "Ancient Wisdom 50ml essential oil range including Rose Absolute, Lemongrass and Orange",
    a9072d6beb0934d7ea5134daf9eef0051f8675e1:
      "Ancient Wisdom 50ml Lavender essential oil bottles, front and back label view",
    "520796491e837f80dd4306d60d39df7d811325a1":
      "Ancient Wisdom 50ml Sweet Birch essential oil bottle, front label view on a white background",
  },
  "4-drawer-recycled-wood-storage-chest": {
    "02afd662fac63bbe0d7cc7bab8326045b306c622":
      "4 drawer recycled wood storage chest, front view on a white studio background",
    "8f7291adde816086e2a4a9ecd5dc3348a3f61aec":
      "4 drawer recycled wood storage chest, styled outdoors in front of carved wooden wall panels",
  },
  "classic-recycled-wood-bedside-table": {
    "498df71bd74f3341f7a61376cff09e9d061e7157":
      "Classic recycled wood bedside table with drawer and open shelf, styled outdoors with a decorative woven lamp on top",
    e809accc8e92c4078b92347bdcad6d96779844a1:
      "Classic recycled wood bedside table with drawer and open shelf, cropped view with a decorative woven lamp on top",
  },
  "beer-barrel-table-natural-wood": {
    "11254ab46cb62143a0608cf6a7ac604e27b73116":
      "Beer barrel table and matching storage stool shown together outdoors on grass",
    "6b2e1be1b38a2272da22f8edb199aba79f04f1ca":
      "Beer barrel table, straight-on view of the barrel body on a white background",
    d02757929a308997d04fe9a7dd7ae318617290e8:
      "Beer barrel table, top-down view into the hollow barrel interior",
    "5790da09c6552e1f0b36b9df4b0ebb5435984c20":
      "Beer barrel table in use as a side table with drinks on top, styled with a person seated on the matching barrel stool",
    "2507fad36eb13b9bcb79502a739cf6d075027d2e":
      "Whitewash-finish wooden barrel with chrome metal bands, on a white background",
  },
  "natural-wooden-beer-barrel-storage-stool": {
    "9d67028757f8fa7ee43ffe0eee11d8ab557744c8":
      "Natural wooden beer barrel storage stool, straight-on view on a white background",
    "6ee8c9ed73d4b90ffcc37ee873bd61702706e883":
      "Natural wooden beer barrel storage stool with the lid removed, showing the hollow storage interior",
    f448e9c3a3c4a194332fe0db62f20df6548879f7:
      "Natural wooden beer barrel storage stool with the lid removed, closer view of the storage interior and lid hinge",
    "11254ab46cb62143a0608cf6a7ac604e27b73116":
      "Beer barrel table and matching storage stool shown together outdoors on grass",
  },
};

async function main() {
  for (const [slug, altByFragment] of Object.entries(ALT_BY_ASSET_FRAGMENT)) {
    const product = await client.fetch<{
      _id: string;
      title: string;
      gallery: { url: string }[];
    } | null>(
      `*[_type == "product" && slug.current == $slug][0]{
        _id, title, "gallery": gallery[]{ "url": asset->url }
      }`,
      { slug },
    );
    if (!product) {
      console.warn(`✗ ${slug}: no product found, skipped`);
      continue;
    }

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
        `✗ ${slug}: no gallery images matched expected assets, skipped`,
      );
      continue;
    }

    await client.patch(product._id).set(patch).commit();
    console.log(`✓ ${product.title}: set alt text on ${matched} image(s)`);
  }

  console.log("\nDone with batch 4.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-4 failed:", err);
  process.exit(1);
});
