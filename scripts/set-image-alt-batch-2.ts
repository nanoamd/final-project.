/**
 * Batch 2 of the image alt-text pass — every image individually viewed
 * before writing its description. Same safe pattern as batch 1: only
 * patches `gallery[N].alt`, checks the gallery length matches before
 * writing anything, never touches anything else.
 *
 * Covers:
 *   - SaunaPlunge™ Bronte 6-Person Outdoor Cabin Sauna (8 images — 2 of
 *     which are the same photo assets already described on the 2-Person
 *     variant, worded to match this product)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-2.ts
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

const ALT_TEXT: Record<string, string[]> = {
  "saunaplunge-bronte-6-person-outdoor-cabin-sauna": [
    "SaunaPlunge Bronte 6-Person Outdoor Cabin Sauna, front view with glass doors open, on a white background",
    "SaunaPlunge Bronte 6-Person Outdoor Cabin Sauna, angled exterior view showing the pitched roof and cedar cladding",
    "SaunaPlunge Bronte 6-Person Outdoor Cabin Sauna, angled exterior view from the opposite side",
    "SaunaPlunge Bronte 6-Person Outdoor Cabin Sauna, interior close-up of the tiered benches and built-in drink holder",
    "SaunaPlunge Bronte 6-Person Outdoor Cabin Sauna, overhead interior view showing the bench and heater",
    "SaunaPlunge Bronte 6-Person Outdoor Cabin Sauna, interior corner view of the Harvia heater and two-tier bench",
    "SaunaPlunge Bronte 6-Person Outdoor Cabin Sauna, interior view of the backrest slats and corner light fixture",
    "SaunaPlunge Bronte 6-Person Outdoor Cabin Sauna, interior corner view of the door handle and heater",
  ],
};

async function main() {
  for (const [slug, alts] of Object.entries(ALT_TEXT)) {
    const product = await client.fetch<{
      _id: string;
      title: string;
      galleryLength: number;
    } | null>(
      `*[_type == "product" && slug.current == $slug][0]{ _id, title, "galleryLength": count(gallery) }`,
      { slug },
    );
    if (!product) {
      console.warn(`✗ ${slug}: no product found, skipped`);
      continue;
    }
    if (product.galleryLength !== alts.length) {
      console.warn(
        `⚠ ${slug}: expected ${alts.length} gallery images, found ${product.galleryLength} — skipped to avoid mismatched alt text. Check this one by hand.`,
      );
      continue;
    }

    const patch: Record<string, string> = {};
    alts.forEach((alt, i) => {
      patch[`gallery[${i}].alt`] = alt;
    });

    await client.patch(product._id).set(patch).commit();
    console.log(`✓ ${product.title}: set alt text on ${alts.length} image(s)`);
  }

  console.log("\nDone with batch 2.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-2 failed:", err);
  process.exit(1);
});
