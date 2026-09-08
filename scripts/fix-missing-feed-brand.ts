/**
 * The single product that Google Merchant Center would reject outright.
 *
 * `audit-merchant-feed-readiness.ts` found exactly one blocking fault across
 * all 907 published products: "Rattan Solar Floor Lantern, Grey"
 * (product-aosom-867-154v00gy) carries no `brand` reference, and Google
 * requires a brand for home and garden goods — `identifier_exists: no`
 * excuses a missing barcode, not a missing brand.
 *
 * The value is not a guess. Aosom is a dropship supplier with no consumer
 * brand of its own, and every other published Aosom product references the
 * own-brand "Kaiku" document. This one was missed; nothing else about it
 * differs.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-missing-feed-brand.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-missing-feed-brand.ts --apply
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
  perspective: "raw",
});

const PRODUCT_ID = "product-aosom-867-154v00gy";
const BRAND_SLUG = "kaiku";

async function main() {
  const product = await client.fetch<{
    _id: string;
    title: string;
    brand: unknown;
    supplier: string | null;
  } | null>(
    `*[_id == $id][0]{ _id, title, brand, "supplier": supplier->name }`,
    { id: PRODUCT_ID },
  );

  if (!product) {
    console.error(`${PRODUCT_ID} no longer exists — nothing to do.`);
    process.exit(1);
  }
  if (product.brand) {
    console.log(`${product.title} already has a brand set. Nothing to do.`);
    return;
  }

  const brand = await client.fetch<{ _id: string; name: string } | null>(
    `*[_type == "brand" && slug.current == $slug][0]{ _id, name }`,
    { slug: BRAND_SLUG },
  );
  if (!brand) {
    console.error(`No brand document with slug "${BRAND_SLUG}".`);
    process.exit(1);
  }

  console.log(`${product.title}`);
  console.log(`  supplier: ${product.supplier ?? "(none)"}`);
  console.log(`  brand:    (unset) -> ${brand.name}`);

  if (!apply) {
    console.log("\nDry run — re-run with --apply.");
    return;
  }

  await client
    .patch(PRODUCT_ID)
    .set({ brand: { _type: "reference", _ref: brand._id } })
    .commit();
  console.log("\nApplied.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
