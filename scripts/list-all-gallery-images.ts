/**
 * Dumps every gallery image on every product — title, slug, image index,
 * current alt text (if any), and its CDN URL — so each photo can be
 * reviewed and given real, descriptive alt text (schema already supports
 * a per-image `alt` field; nothing was ever writing to it before).
 *
 * Read-only: makes no changes. Paste the full output back for review.
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/list-all-gallery-images.ts
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

interface ProductRow {
  title: string;
  slug: string;
  gallery: { url: string; alt?: string }[];
}

async function main() {
  const products = await client.fetch<ProductRow[]>(
    `*[_type == "product"] | order(title asc) {
      title,
      "slug": slug.current,
      "gallery": gallery[]{ "url": asset->url, alt }
    }`,
  );

  let totalImages = 0;
  let missingAlt = 0;

  for (const product of products) {
    if (!product.gallery?.length) continue;
    console.log(`\n=== ${product.title} (${product.slug}) ===`);
    product.gallery.forEach((img, i) => {
      totalImages++;
      if (!img.alt) missingAlt++;
      console.log(`  [${i}] alt="${img.alt ?? ""}" — ${img.url}`);
    });
  }

  console.log(
    `\n\nTOTAL: ${totalImages} images across ${products.length} products, ${missingAlt} missing alt text.`,
  );
}

main().catch((err) => {
  console.error("list-all-gallery-images failed:", err);
  process.exit(1);
});
