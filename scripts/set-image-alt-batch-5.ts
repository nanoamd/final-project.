/**
 * Batch 5 of the image alt-text pass — every image individually viewed
 * before writing its description. Matches by asset URL hash fragment (not
 * index) and patches every document matching a slug, not just the first —
 * two of these slugs have both a draft and a published copy in the
 * dataset, and this makes sure both get the alt text, not whichever one
 * GROQ happens to return first.
 *
 * Covers:
 *   - Auroom Horizon Sauna (1 image — NOTE: this photo is a generic stock
 *     shot of a misty lake and pine trees, with no sauna visible at all.
 *     Alt text describes what the photo actually shows; the product's
 *     image assignment looks wrong and needs a human to check in Studio.)
 *   - Himalayan Salt BBQ Cooking Plate (both draft+published copies under
 *     the same slug, 4 images each)
 *   - Reclaimed Teak Console Table with 3 Drawers (2 images — NOTE: the
 *     two photos show what look like different pieces, a whitewash/blue
 *     tinted table with straight tapered legs vs a natural-finish table
 *     with curved barrel-style side panels. Described as shown; may need
 *     a Studio check.)
 *   - Reclaimed Teak Dining Table 180cm (2 images — this product's slug is
 *     literally its title text, a pre-existing slugify bug, not fixed here)
 *   - Reclaimed Teak Sideboard Console Table with 6 Drawers (draft+published
 *     copies, 2 images each)
 *   - Round Reclaimed Teak Bedside Table with Drawer (2 images — NOTE: the
 *     second photo shows no drawer at all, just an open-shelf bench, and
 *     looks like it may belong to a different product instead; described
 *     as shown)
 *   - Small Reclaimed Teak Coffee Table (2 images)
 *   - Large Reclaimed Wood Coffee Table (2 images)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-5.ts
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
  "auroom-horizon-sauna": {
    "7e8caee50b25a8c6d95fc9680cb3e9d39e2793d1":
      "Misty lake at sunrise with pine trees on the shoreline — this stock photo does not show the sauna product itself",
  },
  "himalayan-salt-bbq-cooking-plate-30x20x5cm": {
    "188e67b80614dd33b290882361e79e5955329df3":
      "Himalayan salt cooking plate in use on a grill, with grilled shrimp and charred lemon slices on top",
    "4521710457d57c0ee9eaba80e90151bc71aa3441":
      "Himalayan salt cooking plate on its metal serving rack, angled studio view on a white background",
    c73f71754cddb67c9f755c447235312cae947a6d:
      "Himalayan salt cooking plate on its rack next to the product packaging box",
    b905ee5885de675f4a5128ce1736025fb6b061cf:
      "Himalayan salt cooking plate on its metal serving rack, overhead flat view on a white background",
  },
  "reclaimed-teak-console-table-3-drawers": {
    "7f4fb0ac23386291261baaedcc3871e55893703a":
      "Reclaimed wood console table with 3 drawers, weathered whitewash and blue-tinted finish, front view on a white studio background",
    fcc3fa4c3eddf1c1b9be201fd3915b7794eb53b6:
      "Reclaimed teak console table with curved side panels, styled indoors with a flower vase and woven baskets of soap on top",
  },
  "Reclaimed Teak Dining Table 180cm | Kaiku": {
    "673724b49247f8e7dd1c07dfb10f10df6e9723b7":
      "Reclaimed teak dining table with a mixed-tone weathered top, angled view on a white studio background",
    "721e8b21998b776fc5f93a8b85605bab87d3cf9d":
      "Reclaimed teak dining table with a mixed-tone weathered top, side profile view on a white studio background",
  },
  "reclaimed-teak-sideboard-console-table-6-drawers": {
    "3ebba77795389914110c0981b3c10a23497e698d":
      "Reclaimed teak sideboard console table with curved side panels and open shelving, styled indoors with soap products, a candle and flowers on top",
    ccf7a999a9ad684085abe21d07c2f178bccc78cb:
      "Reclaimed teak sideboard console table with curved side panels, cropped view styled with soap products and flowers on top",
  },
  "round-reclaimed-teak-bedside-table-drawer": {
    "2b66de7f110e2074faad11ab82098dc9b3fc0925":
      "Round reclaimed teak bedside table with a drawer and open shelf below, angled view styled outdoors against carved wooden tribal statues",
    "5ef853d46f577e98d3210064c0acc42587ad0379":
      "Small rectangular reclaimed wood table with an open shelf, styled outdoors against carved wooden tribal statues",
  },
  "small-reclaimed-teak-coffee-table": {
    a73721d55928bd9dc587df223bab9e93b1126f14:
      "Small reclaimed teak coffee table with an open shelf, angled view styled outdoors against carved wooden tribal statues",
    "4dfaec647488738909dd25da40fd55672d8cb675":
      "Small reclaimed teak coffee table with an open shelf, alternate angle styled outdoors against carved wooden tribal statues",
  },
  "large-reclaimed-wood-coffee-table": {
    d1c254ac5e7e6528f6ad8c21de4e4051bc51fc35:
      "Large reclaimed wood coffee table with an open shelf, angled view on a white studio background",
    c3d856c8e58d0b3948e022267dd303f996f9aadf:
      "Large reclaimed wood coffee table with an open shelf, cropped thumbnail view on a white studio background",
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

  console.log("\nDone with batch 5.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-5 failed:", err);
  process.exit(1);
});
