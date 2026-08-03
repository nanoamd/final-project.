/**
 * Repoints the homepage Hero's floating "featured product" card
 * (heroFeaturedProduct — the small card in the bottom-right of the Hero,
 * distinct from the lower-page "Flagship" and curated sections) at the
 * Tamarind & Resin Coffee Table – Aqua. Previously pointed at the
 * SaunaPlunge™ Pennine Barrel sauna (itself a fix for the corrupted
 * Auroom sauna reference before that) — this is a further, explicit
 * change of which product the card should show. Patches both the draft
 * and published homepage document if both exist.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-hero-featured-product.ts
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

const TARGET_SLUG = "tamarind-resin-coffee-table-aqua";

async function main() {
  const product = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "product" && slug.current == $slug][0]{ _id, title }`,
    { slug: TARGET_SLUG },
  );
  if (!product) {
    console.error(`✗ No product with slug "${TARGET_SLUG}" found — aborting.`);
    process.exit(1);
  }
  console.log(`Found product: "${product.title}" (${product._id})`);

  const homepageIds = ["homepage", "drafts.homepage"];
  let patched = 0;
  for (const id of homepageIds) {
    const exists = await client.fetch<boolean>(
      `defined(*[_id == $id][0]._id)`,
      { id },
    );
    if (!exists) continue;
    await client
      .patch(id)
      .set({
        heroFeaturedProduct: {
          _type: "reference",
          _ref: product._id,
        },
      })
      .commit();
    console.log(`✓ Patched ${id}`);
    patched++;
  }

  if (!patched) {
    console.error(
      '✗ No "homepage" document found (draft or published) — aborting.',
    );
    process.exit(1);
  }

  console.log(
    `\nDone — the Hero's floating product card now points at "${product.title}".`,
  );
}

main().catch((err) => {
  console.error("set-hero-featured-product failed:", err);
  process.exit(1);
});
