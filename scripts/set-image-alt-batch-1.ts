/**
 * Batch 1 of the image alt-text pass — every gallery image was individually
 * downloaded and viewed (not guessed from filename) before writing its
 * description. Patches only `gallery[N].alt` on the named products; nothing
 * else is touched. Safe to re-run — it always sets the same values.
 *
 * Covers:
 *   - Small Recycled Teak TV Stand with 2 Drawers (2 images)
 *   - Tall Reclaimed Teak Chest of 5 Drawers (2 images)
 *   - Tamarind & Resin Coffee Table – Aqua (4 images)
 *   - SaunaPlunge™ Bronte 2-Person Outdoor Cabin Sauna (6 images)
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-1.ts
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
  "small-recycled-teak-tv-stand-2-drawers": [
    "Small recycled teak TV stand with 2 drawers, front angled view on a white studio background",
    "Small recycled teak TV stand with 2 drawers, styled outdoors in front of carved wooden wall panels",
  ],
  "tall-reclaimed-teak-chest-5-drawers": [
    "Tall reclaimed teak chest of 5 drawers, styled in a living room next to a matching TV stand",
    "Tall reclaimed teak chest of 5 drawers, front angled view on a plain background",
  ],
  "tamarind-resin-coffee-table-aqua": [
    "Tamarind & Resin Coffee Table in aqua, styled with two floral teacups on a patterned rug",
    "Tamarind & Resin Coffee Table in aqua, angled studio view showing the full tabletop grain and resin pattern",
    "Tamarind & Resin Coffee Table in aqua, high-angle view of the resin inlay at the centre of the tabletop",
    "Tamarind & Resin Coffee Table in aqua, shown at scale beside a seated person in a styled room",
  ],
  "saunaplunge-bronte-2-person-outdoor-cabin-sauna": [
    "SaunaPlunge Bronte 2-Person Outdoor Cabin Sauna, front view with glass doors open, on a white background",
    "SaunaPlunge Bronte 2-Person Outdoor Cabin Sauna, angled exterior view showing the pitched roof and cedar cladding",
    "SaunaPlunge Bronte 2-Person Outdoor Cabin Sauna, angled exterior view from the opposite side",
    "SaunaPlunge Bronte 2-Person Outdoor Cabin Sauna, close-up of the Harvia electric heater and sauna stones",
    "SaunaPlunge Bronte 2-Person Outdoor Cabin Sauna, overhead interior view showing the bench and heater",
    "SaunaPlunge Bronte 2-Person Outdoor Cabin Sauna, interior corner view of the door handle and heater",
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

  console.log("\nDone with batch 1.");
}

main().catch((err) => {
  console.error("set-image-alt-batch-1 failed:", err);
  process.exit(1);
});
