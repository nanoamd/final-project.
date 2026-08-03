/**
 * Repoints the homepage's curated "Kaiku's Product of the Week" reference
 * (used both by the homepage's own featured section and the category-page
 * sidebar card) at the Tamarind & Resin Coffee Table — replacing whatever
 * it currently points at (the fake "Kaiku Horizon Cabin Sauna" product,
 * per scripts/delete-fake-sauna-product.ts). Matched by a distinctive title
 * substring rather than a guessed slug. Patches both the draft and
 * published homepage document if both exist.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/set-featured-product.ts
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

async function main() {
  const product = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "product" && title match "Tamarind*"][0]{ _id, title }`,
  );
  if (!product) {
    console.error(
      '✗ No product with a title starting "Tamarind" found — aborting.',
    );
    process.exit(1);
  }
  console.log(`Found product: "${product.title}" (${product._id})`);

  const homepageIds = ["homepage", "drafts.homepage"];
  let patched = 0;
  for (const id of homepageIds) {
    const exists = await client.fetch<boolean>(
      `defined(*[_id == $id][0]._id)`,
      {
        id,
      },
    );
    if (!exists) continue;
    await client
      .patch(id)
      .set({
        curatedFeaturedProduct: {
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
    `\nDone — homepage's curated featured product now points at "${product.title}".`,
  );
}

main().catch((err) => {
  console.error("set-featured-product failed:", err);
  process.exit(1);
});
