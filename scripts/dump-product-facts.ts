/**
 * Everything known about a product, for writing copy against.
 *
 * Reading facts out of Studio one field at a time is slow and it is how a wrong
 * dimension ends up in a paragraph. This prints the whole fact set for a list of slugs,
 * and downloads the photographs, because several of the corrections in this catalogue
 * (the sage-green "French Grey" range, the tractor-seat stool filed under sofas) came
 * from looking at the picture rather than the fields.
 *
 *   pnpm tsx --env-file=.env.local scripts/dump-product-facts.ts slug-one slug-two
 *   pnpm tsx --env-file=.env.local scripts/dump-product-facts.ts --batch-01
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { BATCH_01 } from "./copy/batch-01";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

const args = process.argv.slice(2);
const slugs = args.includes("--batch-01")
  ? BATCH_01.map((c) => c.slug)
  : args.filter((a) => !a.startsWith("--"));
const download = args.includes("--images");
const out = "/tmp/product-photos";

async function main() {
  if (download) mkdirSync(out, { recursive: true });

  for (const slug of slugs) {
    const doc = await client.fetch<
      (Record<string, unknown> & { images?: { url: string }[] | null }) | null
    >(
      `*[_type == "product" && slug.current == $slug] | order(_id asc) [0]{
        _id, title, price, "category": category->title, "dept": category->department->title,
        materialTags, colourTags, primaryColour, styleTags, roomTags, useTags,
        badges, highlights, specs, weight, gtin, sourceUrl, dimensions,
        "images": gallery[]{ "url": asset->url, alt, isStudioShot }
      }`,
      { slug },
    );
    if (!doc) {
      console.log(`\n=== ${slug} — NOT FOUND`);
      continue;
    }
    console.log(`\n=== ${slug}`);
    for (const [k, v] of Object.entries(doc)) {
      if (k === "images" || v === null || v === undefined) continue;
      console.log(`  ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
    }
    const images: { url: string }[] = doc.images ?? [];
    console.log(`  images: ${images.length}`);
    if (!download) continue;
    for (const [i, image] of images.slice(0, 3).entries()) {
      const url = `${image.url}?w=900&fit=max&auto=format`;
      const response = await fetch(url);
      const file = `${out}/${slug}-${i}.jpg`;
      writeFileSync(file, Buffer.from(await response.arrayBuffer()));
      console.log(`    ${file}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
