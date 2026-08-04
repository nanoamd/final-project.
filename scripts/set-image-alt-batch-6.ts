/**
 * Batch 6 of the image alt-text pass — every image individually viewed
 * before writing its description. Same asset-fragment-matching pattern as
 * batches 4-5.
 *
 * Covers:
 *   - Interlocking Table/Stool set of 2 - Lrg Turquoise (4 images)
 *   - Interlocking Table/Stool set of 2 - Lrg Whitewash (4 images)
 *   - Interlocking Table/Stool set of 2 - Natural (4 images)
 *   - Round Folding Coffee Table - 50cm - Recycled Wood (4 images)
 *   - Large Reclaimed Wood TV Stand with 2 Drawers & Open Shelving
 *     (3 images — NOTE: the first two photos show a single-drawer,
 *     natural-teak TV stand styled in a lifestyle room, which doesn't
 *     match this product's "2 Drawers" reclaimed/painted-wood finish
 *     seen in the third photo. Described as shown; looks like a
 *     mismatched pair of photos that needs a Studio check.)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-6.ts
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
  "interlocking-table-stool-set-of-2-lrg-turquoise": {
    "3630275cb2f2a177eb56d00976aac1c4d595bf53":
      "Interlocking table and stool set, turquoise wash finish with gold-painted lotus carving, front view of both pieces side by side on a white background",
    "6efdf21c464acab58e928dbb880e5a3b6b8318af":
      "Interlocking table and stool set, turquoise wash finish with gold-painted lotus carving, angled view showing the circular mandala carving on the seat",
    "33031e94340c96e08b67b378f46676687977894f":
      "Interlocking table stool, turquoise wash finish, close-up side view showing the V-notch cut and gold lotus carving",
    "85297d60a05a906fff36172b61ea69ba38f02ce7":
      "Turquoise interlocking stools styled outdoors among other painted and natural-finish wooden stools",
  },
  "interlocking-table-stool-set-of-2-lrg-whitewash": {
    "5980f04156166f5479ee677f003ead1bb63b5325":
      "Interlocking table and stool set, whitewash finish with carved lotus flower, front view of both pieces on a white background",
    "518115c474ecbe4e22f3b27afbb67d837830af87":
      "Interlocking table stool, whitewash finish, angled view showing the circular mandala carving on the seat",
    d647461c0cfed9b143fd8351d197cbea8161bf05:
      "Interlocking table and stool set, whitewash finish, close-up view showing the carved lotus flowers and V-notch joins",
    "714c5b3b3076f9643abca6ec32e5ff236957a767":
      "Whitewash interlocking stools styled outdoors among other painted and natural-finish wooden stools",
  },
  "interlocking-table-stool-set-of-2-natural": {
    e94df5d4574175b6bc54113200dc96406f21f140:
      "Interlocking table and stool set, natural wood finish, front view showing the circular mandala carving on the seat",
    f04e6fbfb3d999aa2aff5060c8cb90cff470951a:
      "Interlocking table stool, natural wood finish, close-up view showing the carved lotus flowers and V-notch join",
    fa3a6f786bb350d08f88df0a92e1863f74d7f82f:
      "Natural wood interlocking stools styled outdoors, front view of both pieces side by side",
    ebaf4a87682b1abb08f9ac2aea6f90156fb1b119:
      "Natural wood interlocking stools styled outdoors among other painted stools, close-up view",
  },
  "round-folding-coffee-table-50cm-recycled-wood": {
    bd91f8d433665e812c803ce829fe7ff10f5d2a6f:
      "Round folding teak coffee table, angled view showing the criss-cross folding legs, on a white background",
    "3cb7033bdac8e945fe8360ee3bfb8896c203736f":
      "Round folding teak coffee table, side profile view of the folding X-frame legs, on a white background",
    "381dc2749e1e9af882300813a9828de90f5a2901":
      "Round folding teak coffee table, side profile view from the opposite angle, on a white background",
    "31865cd8d8fe0d536af4a15df21024f19b3da058":
      "Round folding teak coffee table, three-quarter view showing the tabletop and folding legs, on a white background",
  },
  "large-reclaimed-wood-tv-stand-2-drawers": {
    "18afe50b068c43ce63ecdd44cbc5f5c9093fdb38":
      "Natural wood TV stand and media console with cabinet doors, styled in a room with a wall-mounted TV, plants and decorative trinket boxes",
    "4d8fc0bc1c93f7ca9b01f8a9b000d5c105e07b77":
      "Natural wood TV stand and media console with cabinet doors, closer view styled with a TV, snake plant and trinket boxes on top",
    "05c1738fa62353eb9febd25b8074cd3d3ff600e5":
      "Large reclaimed wood TV stand with 2 drawers and open shelving, front view on a white background",
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

  console.log("\nDone with batch 6.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-6 failed:", err);
  process.exit(1);
});
