/**
 * Batch 3 of the image alt-text pass — every image individually viewed
 * before writing its description. Same safe pattern as batches 1-2: only
 * patches `gallery[N].alt`, checks the gallery length matches before
 * writing anything, never touches anything else.
 *
 * Covers:
 *   - SaunaPlunge™ Dales Glow 4-Person Indoor Infrared Sauna (7 images)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-3.ts
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
  "saunaplunge-dales-glow-4-person-indoor-infrared-sauna": [
    "SaunaPlunge Dales Glow 4-Person Indoor Infrared Sauna, front view with pink colour therapy lighting, on a white background",
    "SaunaPlunge Dales Glow 4-Person Indoor Infrared Sauna, angled exterior view showing the full cabin",
    "SaunaPlunge Dales Glow 4-Person Indoor Infrared Sauna, angled exterior view from the opposite side",
    "SaunaPlunge Dales Glow 4-Person Indoor Infrared Sauna, interior corner detail of the digital control panel and infrared heater panels",
    "SaunaPlunge Dales Glow 4-Person Indoor Infrared Sauna, interior corner view of the infrared panels and built-in cup holder",
    "SaunaPlunge Dales Glow 4-Person Indoor Infrared Sauna, straight-on interior view of the infrared panel wall and control panel",
    "SaunaPlunge Dales Glow 4-Person Indoor Infrared Sauna, close-up of the smart touch control panel with colour therapy lighting controls",
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

  console.log("\nDone with batch 3.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-3 failed:", err);
  process.exit(1);
});
