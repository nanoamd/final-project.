/**
 * Audits every image the catalogue points at, straight from Sanity's asset
 * records.
 *
 * Written to settle a question that cannot be answered by looking at the site:
 * when a higher-quality image "does not publish", is the pipeline degrading it,
 * or was the file that reached Sanity already small? The asset document holds
 * the original's real dimensions and byte size, so the answer is in the data.
 *
 * Also reports the things that quietly break image publishing and are invisible
 * in Studio:
 *
 *   - products whose gallery is empty, so every card falls back to a placeholder
 *   - draft-only image changes: a draft carrying a different first image from
 *     its published version, which is exactly what "I changed it and it
 *     reverted" looks like from the outside, because the site reads published
 *     documents only
 *   - assets referenced by more than one product, where replacing the image on
 *     one product silently changes the other
 *   - missing alt text, which the brief requires per image
 *   - images whose aspect ratio is far from the square the grid crops to, since
 *     those are the ones that look wrong rather than merely soft
 *
 * Read-only. Prints a report and writes nothing.
 *   pnpm tsx --env-file=.env.local scripts/audit-images.ts
 */
import { createClient } from "@sanity/client";

/** Below this, a full-bleed phone hero or a 2x product zoom will look soft. */
const MIN_LONG_EDGE = 1200;
/** Below this it is unusable at any size we render. */
const CRITICAL_LONG_EDGE = 700;

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  // Never the CDN here: a stale edge response is the thing we are trying to
  // rule out, so reading through it would beg the question.
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

interface GalleryImage {
  assetId: string | null;
  alt: string | null;
  isStudioShot: boolean | null;
  width: number | null;
  height: number | null;
  size: number | null;
  mimeType: string | null;
  originalFilename: string | null;
}

interface ProductImages {
  id: string;
  slug: string | null;
  title: string | null;
  gallery: GalleryImage[] | null;
}

const IMAGE_PROJECTION = `{
  "assetId": asset->_id,
  alt,
  isStudioShot,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  "size": asset->size,
  "mimeType": asset->mimeType,
  "originalFilename": asset->originalFilename
}`;

function longEdge(image: GalleryImage): number {
  return Math.max(image.width ?? 0, image.height ?? 0);
}

function ratio(image: GalleryImage): number | null {
  if (!image.width || !image.height) return null;
  return image.width / image.height;
}

function kb(bytes: number | null): string {
  return bytes == null ? "?" : `${Math.round(bytes / 1024)}kB`;
}

function heading(text: string) {
  console.log(`\n${text}\n${"─".repeat(text.length)}`);
}

async function main() {
  const published = await client.fetch<ProductImages[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{
      _id, "id": _id, "slug": slug.current, title,
      "gallery": gallery[]${IMAGE_PROJECTION}
    }|order(title asc)`,
  );

  const drafts = await client.fetch<ProductImages[]>(
    `*[_type == "product" && _id in path("drafts.**")]{
      _id, "id": _id, "slug": slug.current, title,
      "gallery": gallery[]${IMAGE_PROJECTION}
    }`,
  );

  console.log(
    `\n${published.length} published products, ${drafts.length} drafts\n`,
  );

  // --- Coverage -----------------------------------------------------------
  const noImages = published.filter((p) => !p.gallery?.length);
  const oneImage = published.filter((p) => (p.gallery?.length ?? 0) === 1);
  const allImages = published.flatMap((p) =>
    (p.gallery ?? []).map((image) => ({ product: p, image })),
  );

  heading("Coverage");
  console.log(`${allImages.length} images across the catalogue`);
  console.log(`${noImages.length} products with no image at all`);
  console.log(
    `${oneImage.length} products with a single image — no hover shot possible`,
  );
  for (const product of noImages)
    console.log(`  ✗ no images   ${product.title ?? product.slug}`);

  // --- Resolution ---------------------------------------------------------
  const missingDimensions = allImages.filter(
    ({ image }) => !image.width || !image.height,
  );
  const critical = allImages.filter(
    ({ image }) => longEdge(image) > 0 && longEdge(image) < CRITICAL_LONG_EDGE,
  );
  const soft = allImages.filter(
    ({ image }) =>
      longEdge(image) >= CRITICAL_LONG_EDGE && longEdge(image) < MIN_LONG_EDGE,
  );

  heading("Resolution of the original uploads");
  const edges = allImages
    .map(({ image }) => longEdge(image))
    .filter((edge) => edge > 0)
    .sort((a, b) => a - b);
  if (edges.length) {
    const at = (fraction: number) =>
      edges[Math.min(edges.length - 1, Math.floor(edges.length * fraction))];
    console.log(
      `long edge — smallest ${edges[0]}px, median ${at(0.5)}px, 90th ${at(0.9)}px, largest ${edges[edges.length - 1]}px`,
    );
  }
  console.log(
    `${critical.length} unusable (under ${CRITICAL_LONG_EDGE}px), ${soft.length} soft (under ${MIN_LONG_EDGE}px), ${missingDimensions.length} with no recorded dimensions`,
  );
  for (const { product, image } of [...critical, ...soft].slice(0, 40))
    console.log(
      `  ${longEdge(image) < CRITICAL_LONG_EDGE ? "✗" : "!"} ${String(image.width)}×${String(image.height)} ${kb(image.size).padStart(7)}  ${product.title ?? product.slug}  ${image.originalFilename ?? ""}`,
    );
  if (critical.length + soft.length > 40)
    console.log(`  … and ${critical.length + soft.length - 40} more`);

  // --- Draft-only image changes -------------------------------------------
  // The site reads published documents only, so an image changed on a draft is
  // invisible on the site however many times it is saved.
  heading("Image changes sitting unpublished in a draft");
  const publishedById = new Map(published.map((p) => [p.id, p]));
  let draftDiffs = 0;
  for (const draft of drafts) {
    const liveId = draft.id.replace(/^drafts\./, "");
    const live = publishedById.get(liveId);
    if (!live) continue;
    const draftIds = (draft.gallery ?? []).map((i) => i.assetId).join(",");
    const liveIds = (live.gallery ?? []).map((i) => i.assetId).join(",");
    if (draftIds === liveIds) continue;
    draftDiffs += 1;
    console.log(
      `  ! ${live.title ?? live.slug}: draft has ${draft.gallery?.length ?? 0} image(s), published has ${live.gallery?.length ?? 0}`,
    );
  }
  console.log(
    draftDiffs === 0
      ? "  none — every image change has been published"
      : `  ${draftDiffs} product(s) — these look "reverted" on the site because the change was never published`,
  );

  // --- Shared assets ------------------------------------------------------
  heading("Assets used by more than one product");
  const byAsset = new Map<string, Set<string>>();
  for (const { product, image } of allImages) {
    if (!image.assetId) continue;
    const users = byAsset.get(image.assetId) ?? new Set<string>();
    users.add(product.title ?? product.slug ?? product.id);
    byAsset.set(image.assetId, users);
  }
  const shared = [...byAsset.entries()].filter(([, users]) => users.size > 1);
  console.log(
    shared.length === 0
      ? "  none"
      : `  ${shared.length} asset(s) shared — replacing the image on one product changes the others too`,
  );
  for (const [assetId, users] of shared.slice(0, 20))
    console.log(`  ! ${assetId}\n      ${[...users].join("\n      ")}`);

  // --- Alt text -----------------------------------------------------------
  heading("Alt text");
  const missingAlt = allImages.filter(
    ({ image }) => !image.alt || !image.alt.trim(),
  );
  console.log(
    `${allImages.length - missingAlt.length} of ${allImages.length} images have alt text`,
  );

  // --- Studio-shot flag ---------------------------------------------------
  // The brief wants image one to be the clean catalogue shot and the hover to
  // be the lifestyle photo, without hand-editing hundreds of products. That
  // ordering is driven off this flag, so its coverage is the ceiling on how
  // much of the ordering can be automated today.
  heading("Studio-shot flag (drives first image vs hover image)");
  const flagged = allImages.filter(({ image }) => image.isStudioShot === true);
  const withFlag = published.filter((p) =>
    (p.gallery ?? []).some((i) => i.isStudioShot === true),
  );
  console.log(
    `${flagged.length} images flagged as studio shots, across ${withFlag.length} of ${published.length} products`,
  );

  // --- Shape --------------------------------------------------------------
  // The grid crops square and the product hero crops 4:5. An image far off
  // those ratios loses its subject to the crop, which reads as a broken image
  // rather than a soft one.
  heading("Shape (the grid crops to a square)");
  const veryWide = allImages.filter(({ image }) => (ratio(image) ?? 1) > 1.6);
  const veryTall = allImages.filter(({ image }) => (ratio(image) ?? 1) < 0.62);
  console.log(
    `${veryWide.length} much wider than square, ${veryTall.length} much taller — these are the ones the square crop damages`,
  );
  for (const { product, image } of [...veryWide, ...veryTall].slice(0, 15))
    console.log(
      `  ! ${String(image.width)}×${String(image.height)}  ${product.title ?? product.slug}`,
    );

  // --- Filenames ----------------------------------------------------------
  // The brief asks for descriptive filenames for image SEO. Sanity serves the
  // original filename in the CDN path, so this one is worth knowing.
  heading("Filenames (image SEO)");
  const badFilename = allImages.filter(({ image }) =>
    /^(img|image|dsc|photo|screenshot|untitled)[-_ ]?\d*\.|^\d+\./i.test(
      image.originalFilename ?? "",
    ),
  );
  console.log(
    `${badFilename.length} of ${allImages.length} filenames are undescriptive`,
  );
  for (const { product, image } of badFilename.slice(0, 20))
    console.log(
      `  ! ${image.originalFilename}  ${product.title ?? product.slug}`,
    );

  // --- Formats ------------------------------------------------------------
  heading("Source formats");
  const byMime = new Map<string, number>();
  for (const { image } of allImages)
    byMime.set(
      image.mimeType ?? "unknown",
      (byMime.get(image.mimeType ?? "unknown") ?? 0) + 1,
    );
  for (const [mime, count] of [...byMime].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(count).padStart(4)}  ${mime}`);

  const totalBytes = allImages.reduce(
    (sum, { image }) => sum + (image.size ?? 0),
    0,
  );
  console.log(
    `\n  ${(totalBytes / 1024 / 1024).toFixed(1)}MB of originals in the dataset\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
