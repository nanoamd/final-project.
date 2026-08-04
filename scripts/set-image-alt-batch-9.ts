/**
 * Batch 9 of the image alt-text pass — every image individually viewed
 * before writing its description. Same asset-fragment-matching pattern as
 * batches 4-8.
 *
 * Covers:
 *   - SaunaPlunge™ Dales Glow 2-Person Indoor Infrared Sauna (4 images —
 *     this product's slug is a pre-existing slugify bug
 *     "saunaplunge-tm-dales-glow-2-person-indoor-infrared-sauna-or-kaiku",
 *     not fixed here)
 *   - SaunaPlunge™ Peak Plunge Ice Bath with Chiller (5 images)
 *   - SaunaPlunge™ Pennine Barrel 6-Person Outdoor Sauna (6 images)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-9.ts
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
  "saunaplunge-tm-dales-glow-2-person-indoor-infrared-sauna-or-kaiku": {
    df31d5d31ec799458f0c1307a188bd38a6bedd86:
      "SaunaPlunge Dales Glow 2-Person Indoor Infrared Sauna, front view with amber colour therapy lighting, on a white background",
    "4f3aea21fd69016701c0d98ae8218d3a50758150":
      "SaunaPlunge Dales Glow 2-Person Indoor Infrared Sauna, angled exterior view showing the full cabin",
    "62b0b05871b14a19bf5890f42a81915b0b1fdb79":
      "SaunaPlunge Dales Glow 2-Person Indoor Infrared Sauna, interior view with green colour therapy lighting, showing the infrared panels and bench",
    "20b070a4fab2cc222f5ae685671ae474b95b99dd":
      "SaunaPlunge Dales Glow 2-Person Indoor Infrared Sauna, interior corner view of the digital control panel with pink colour therapy lighting",
  },
  "saunaplunge-peak-plunge-ice-bath-with-chiller": {
    "7edea04879a69c9ca34c2b72307f4f2e420e7224":
      "SaunaPlunge Peak Plunge Ice Bath with Chiller, angled view styled on a garden deck surrounded by hedges",
    "4bf9222cd961b2cef88f247d0dc275049269629f":
      "SaunaPlunge Peak Plunge Ice Bath with Chiller, overhead view showing the stainless steel interior and teak trim",
    "0509a10c01903d021cfa087be13fedb3744a8530":
      "SaunaPlunge Peak Plunge Ice Bath with Chiller, overhead angled view of the empty stainless steel tub",
    "0faa6efcb86ca1c20445606906e7c8880f02b1ec":
      "SaunaPlunge Peak Plunge Ice Bath with Chiller, rear view showing the chiller unit vents and control panel",
    b0aed14b0d32d52cac9afc13b3c565b93bf78842:
      "SaunaPlunge Peak Plunge Ice Bath with Chiller, front view with the black thermal cover fitted on top",
  },
  "saunaplunge-pennine-barrel-6-person-outdoor-sauna": {
    "71bc69a586fe96c92b5f753e568e63a66af700e0":
      "SaunaPlunge Pennine Barrel 6-Person Outdoor Sauna, angled exterior view showing the barrel shape and shingled roof, on a white background",
    "96282e5da5bd2bd34e8192a399b2443985d52d97":
      "SaunaPlunge Pennine Barrel 6-Person Outdoor Sauna, front view looking through the open door into the illuminated interior",
    "21af20855dfc1c45c45f9385d1ef65e8358e86a3":
      "SaunaPlunge Pennine Barrel 6-Person Outdoor Sauna, front view with the door open, showing the interior benches and thermometer",
    ecabb99e77f02edb0c735e0a08414cb80807f5c9:
      "SaunaPlunge Pennine Barrel 6-Person Outdoor Sauna, interior view of the benches, door and thermometer panel",
    "7303a5d7b6f6e7aad3ce46a3a91cc6dd2f1b7812":
      "SaunaPlunge Pennine Barrel 6-Person Outdoor Sauna, interior view of the benches and Harvia heater",
    c1c2aea1542a80c3671ca5d0c1fa48f075badd56:
      "SaunaPlunge Pennine Barrel 6-Person Outdoor Sauna, close-up of the wooden water bucket and ladle on the bench",
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

  console.log("\nDone with batch 9.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-9 failed:", err);
  process.exit(1);
});
