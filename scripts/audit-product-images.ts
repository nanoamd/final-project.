/**
 * Read-only report on the state of every product image.
 *
 * Written because the catalogue is growing daily and each of these problems was
 * found by hand, one query at a time: a product whose six photographs are all
 * 150px, a gallery slot holding no image at all, the same photograph three
 * times, and 44 images with no alt text. None of them is visible in Studio's
 * product list, and all of them are visible to a customer.
 *
 * Checks:
 *   - alt text missing (accessibility, and how Google Images reads a photo)
 *   - resolution below 800px (Merchant Center's recommended minimum; below
 *     ~600px a product page upscales and looks broken)
 *   - gallery slots with no image asset
 *   - the same asset used twice in one gallery
 *   - products with no gallery at all
 *
 * Makes no changes. Run it whenever products have been added:
 *   pnpm tsx --env-file=.env.local scripts/audit-product-images.ts
 *
 * Add --drafts to include unpublished documents.
 */
import { createClient } from "@sanity/client";

const includeDrafts = process.argv.includes("--drafts");

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error(
    "SANITY_API_WRITE_TOKEN is not set — needed to see drafts. Aborting.",
  );
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

/** Merchant Center recommends 800px; below 600 a gallery visibly upscales. */
const RECOMMENDED_WIDTH = 800;
const BROKEN_WIDTH = 600;

interface Row {
  _id: string;
  title: string;
  slug: string | null;
  gallery:
    | {
        alt?: string;
        ref: string | null;
        width: number | null;
      }[]
    | null;
}

function label(row: Row) {
  return `${row._id.startsWith("drafts.") ? "[draft] " : ""}${row.title}`;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" ${includeDrafts ? "" : '&& !(_id in path("drafts.**"))'}]{
      _id, title, "slug": slug.current,
      "gallery": gallery[]{
        alt,
        "ref": asset._ref,
        "width": asset->metadata.dimensions.width
      }
    } | order(title asc)`,
  );

  const noGallery: Row[] = [];
  const noAsset: [Row, number][] = [];
  const noAlt: [Row, number][] = [];
  const tooSmall: [Row, number, number][] = [];
  const broken: [Row, number, number][] = [];
  const duplicated: [Row, string, number][] = [];

  for (const row of rows) {
    const gallery = row.gallery ?? [];
    if (!gallery.length) {
      noGallery.push(row);
      continue;
    }
    const seen = new Map<string, number>();
    gallery.forEach((image, index) => {
      if (!image.ref) {
        noAsset.push([row, index]);
        return;
      }
      seen.set(image.ref, (seen.get(image.ref) ?? 0) + 1);
      if (!(image.alt ?? "").trim()) noAlt.push([row, index]);
      const width = image.width ?? 0;
      if (width && width < BROKEN_WIDTH) broken.push([row, index, width]);
      else if (width && width < RECOMMENDED_WIDTH)
        tooSmall.push([row, index, width]);
    });
    for (const [ref, count] of seen)
      if (count > 1) duplicated.push([row, ref, count]);
  }

  const section = (heading: string, lines: string[], why: string) => {
    console.log(`\n${heading} — ${lines.length}`);
    if (!lines.length) {
      console.log("  none");
      return;
    }
    console.log(`  ${why}`);
    for (const line of lines.slice(0, 40)) console.log(`  ${line}`);
    if (lines.length > 40) console.log(`  … and ${lines.length - 40} more`);
  };

  const total = rows.reduce((n, r) => n + (r.gallery?.length ?? 0), 0);
  console.log(
    `\n${rows.length} product(s)${includeDrafts ? " including drafts" : ""}, ${total} gallery image(s).`,
  );

  section(
    "Images below 600px",
    broken.map(([r, i, w]) => `${w}px  ${label(r)}  [image ${i}]`),
    "these upscale on the product page and look broken",
  );
  section(
    `Images 600-${RECOMMENDED_WIDTH - 1}px`,
    tooSmall.map(([r, i, w]) => `${w}px  ${label(r)}  [image ${i}]`),
    `usable, but under Merchant Center's recommended ${RECOMMENDED_WIDTH}px`,
  );
  section(
    "Gallery slots with no image",
    noAsset.map(([r, i]) => `${label(r)}  [image ${i}]`),
    "an empty slot in the gallery; delete it in Studio",
  );
  section(
    "Duplicate images within one gallery",
    duplicated.map(([r, , n]) => `${label(r)}  — one asset used ${n} times`),
    "the same photograph shown more than once",
  );
  section(
    "Missing alt text",
    noAlt.map(([r, i]) => `${label(r)}  [image ${i}]`),
    "add to a set-image-alt-batch script, after viewing each image",
  );
  section(
    "Products with no images at all",
    noGallery.map((r) => label(r)),
    "cannot be published usefully, and are invisible in Google Shopping",
  );

  console.log("");
}

main().catch((err) => {
  console.error("audit-product-images failed:", err);
  process.exit(1);
});
