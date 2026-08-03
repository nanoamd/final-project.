/**
 * Fixes a real data-corruption bug on the actual "Auroom Horizon Sauna"
 * product (_id: product-auroom-horizon-sauna, slug: auroom-horizon-sauna)
 * — its title and SKU had been overwritten to "Kaiku Horizon Cabin Sauna" /
 * "KAI-HRZN" at some point, which made it LOOK like a separate fake
 * placeholder product. It isn't one: it's the same real, live document,
 * referenced from the homepage as the flagship spotlight, with £6,995 of
 * real price/specs/copy underneath the wrong title. A previous script
 * (delete-fake-sauna-product.ts) mistakenly targeted this document for
 * deletion based on that wrong title — do NOT run that script. Sanity's
 * own reference-integrity check has been correctly blocking every delete
 * attempt so far (it's referenced from `homepage`), so nothing was ever
 * actually lost.
 *
 * This script only touches `title` and `sku`, restoring them to the
 * original seed values from scripts/seed-sanity.ts. It does NOT touch
 * price, summary, images or specs — if those also look wrong, they need a
 * human to check in Studio, since overwriting them here without confirming
 * an editor didn't intentionally change them would be its own mistake.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/fix-auroom-sauna-title.ts
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

const BASE_ID = "product-auroom-horizon-sauna";
const CORRECT_TITLE = "Auroom Horizon Sauna";
const CORRECT_SKU = "AUR-HRZN";
const EXPECTED_PRICE = 6995;

async function fixOne(id: string) {
  const doc = await client.fetch<{
    _id: string;
    title?: string;
    sku?: string;
    price?: number;
  } | null>(`*[_id == $id][0]{ _id, title, sku, price }`, { id });

  if (!doc) {
    console.log(`- ${id}: doesn't exist, skipped`);
    return;
  }

  console.log(
    `Found ${id}: title="${doc.title}", sku="${doc.sku}", price=${doc.price}`,
  );

  const patch: Record<string, string> = {};
  if (doc.title !== CORRECT_TITLE) patch.title = CORRECT_TITLE;
  if (doc.sku !== CORRECT_SKU) patch.sku = CORRECT_SKU;

  if (!Object.keys(patch).length) {
    console.log(`  already correct, nothing to do`);
  } else {
    await client.patch(id).set(patch).commit();
    console.log(`  ✓ fixed: ${JSON.stringify(patch)}`);
  }

  if (typeof doc.price === "number" && doc.price !== EXPECTED_PRICE) {
    console.warn(
      `  ⚠ price is £${doc.price}, expected £${EXPECTED_PRICE} from the original seed data — check this by hand in Studio, not auto-changed here.`,
    );
  }
}

async function main() {
  await fixOne(BASE_ID);
  await fixOne(`drafts.${BASE_ID}`);
  console.log(
    "\nDone. This was the same document your delete script kept failing on — it's now fine, and there was never a separate fake product to delete.",
  );
}

main().catch((err) => {
  console.error("fix-auroom-sauna-title failed:", err);
  process.exit(1);
});
