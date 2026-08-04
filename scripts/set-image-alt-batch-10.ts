/**
 * Batch 10 of the image alt-text pass — every image individually viewed
 * before writing its description. Same asset-fragment-matching pattern as
 * batches 4-9. This is the final batch of the pass — every gallery image
 * across the catalog has now been reviewed (viewable formats described;
 * .avif files that couldn't be rendered left blank, as noted in earlier
 * batches).
 *
 * Covers:
 *   - SaunaPlunge™ Yorkshire Cabin 2-Person Outdoor Infrared Sauna (7 images)
 *   - SaunaPlunge™ Yorkshire Cabin 4-Person Outdoor Infrared Sauna (8 images)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-10.ts
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
  "saunaplunge-yorkshire-cabin-2-person-outdoor-infrared-sauna": {
    edaadf5868017919299e1ed1d8aa5f4788c5575a:
      "SaunaPlunge Yorkshire Cabin 2-Person Outdoor Infrared Sauna, front view with turquoise colour therapy lighting, on a white background",
    "2293b2f61753cc3d287f003afde703e287a01f22":
      "SaunaPlunge Yorkshire Cabin 2-Person Outdoor Infrared Sauna, angled exterior view showing the pitched roof and cedar cladding",
    "1c6e71b7c804e1eb53c07b0562b7a71d0c091bf1":
      "SaunaPlunge Yorkshire Cabin 2-Person Outdoor Infrared Sauna, interior view of the digital control panel and safety warning label",
    "496215635bf0801228984984b9bdd8be98fbc3f1":
      "SaunaPlunge Yorkshire Cabin 2-Person Outdoor Infrared Sauna, interior corner view of the ioniser unit with blue colour therapy lighting",
    "8cff259ccf17e70b041783018e1fcfc7d27286cd":
      "SaunaPlunge Yorkshire Cabin 2-Person Outdoor Infrared Sauna, close-up of the glass door handle and hinge with the SaunaPlunge logo",
    a170f096ef7356e8d6b2d13b0c8b4e9f2ca3d21d:
      "SaunaPlunge Yorkshire Cabin 2-Person Outdoor Infrared Sauna, interior close-up of the infrared panels and bench",
    "6f6c58c363ab3a600328dd307e5073abfc808106":
      "SaunaPlunge Yorkshire Cabin 2-Person Outdoor Infrared Sauna, interior close-up of the glass door hinge and infrared panels",
  },
  "saunaplunge-yorkshire-cabin-4-person-outdoor-infrared-sauna": {
    "3dd2dd73c2a23709c0c4ff9fe7155dc5a46f616b":
      "SaunaPlunge Yorkshire Cabin 4-Person Outdoor Infrared Sauna, front view with pink colour therapy lighting, on a white background",
    c6e0166ca0e3a143df70fd9115186acfa8226739:
      "SaunaPlunge Yorkshire Cabin 4-Person Outdoor Infrared Sauna, angled exterior view showing the pitched roof and cedar cladding",
    f58025b327c42b3d280c6fbea3ad68c1861ead39:
      "SaunaPlunge Yorkshire Cabin 4-Person Outdoor Infrared Sauna, angled exterior view from the opposite side",
    b6ab93441bdfabe562d612f83d10dca9e7c6253a:
      "SaunaPlunge Yorkshire Cabin 4-Person Outdoor Infrared Sauna, interior corner view of the infrared panel wall with green colour therapy lighting",
    ac455d33416b608df84e03b50f1b2d9b4c408de9:
      "SaunaPlunge Yorkshire Cabin 4-Person Outdoor Infrared Sauna, close-up of the infrared panel wall and built-in cup holder with green colour therapy lighting",
    "7c5776dcbdca8964015f5645c8bb07c00afe0b36":
      "SaunaPlunge Yorkshire Cabin 4-Person Outdoor Infrared Sauna, wider interior view of the infrared panel wall and cup holder",
    f760db7cb6c3041b227a64fb2d5a2b0f503f2e5b:
      "SaunaPlunge Yorkshire Cabin 4-Person Outdoor Infrared Sauna, close-up of the round chrome ioniser control knob with purple colour therapy lighting",
    bd34b7cd7eb7bb565391b89fa3c82fb4d832288a:
      "SaunaPlunge Yorkshire Cabin 4-Person Outdoor Infrared Sauna, overhead ceiling view showing the central light fixture and speakers with pink colour therapy lighting",
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

  console.log("\nDone with batch 10 — image alt-text pass complete.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-10 failed:", err);
  process.exit(1);
});
