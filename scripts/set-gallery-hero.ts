/**
 * Moves one gallery image to position 1, by hand.
 *
 * The companion to `scripts/preview-product-heroes.ts`. That script renders every
 * published product's hero as a contact sheet precisely because some wrong heroes
 * can only be seen, never measured — a dimensioned technical render, a detail crop,
 * a rear view, a photo of a different item in the same range. This is how the ones
 * you find get fixed.
 *
 * Damien found the first: **Abberley Coffee Table in Brown** led with its
 * measurements diagram. `derive-studio-shots.ts` will never fix that, and the
 * reason is worth stating — a dimensions drawing is a product on a pure white
 * sweep, so it measures as the *best possible* catalogue shot. The border test
 * cannot see the difference and neither could two pixel heuristics I tried against
 * the real images (a margin-ink test put known diagrams at 0.000–0.034 and ordinary
 * photographs at 0.000–0.149; a hairline-detection pass scored the diagrams 0–1 and
 * plain furniture 4–6). So the decision stays with a person, and this applies it.
 *
 * It reorders only. Nothing is deleted, no flags are changed, and the demoted image
 * stays in the gallery one place further down — a measurements drawing is genuinely
 * useful to a shopper, just not as the photograph that represents the product in a
 * category grid or a Shopping listing.
 *
 *   pnpm tsx --env-file=.env.local scripts/set-gallery-hero.ts --slug abberley-coffee-table-brown --image 2
 *   pnpm tsx --env-file=.env.local scripts/set-gallery-hero.ts --slug abberley-coffee-table-brown --image 2 --apply
 *
 * `--image` is 1-based, matching the numbering `preview-product-heroes.ts` prints.
 * Dry run by default. Published documents only; a draft belongs to its editor.
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const slug = arg("slug");
const imageArg = arg("image");

if (!slug || !imageArg) {
  console.error(
    "Usage: scripts/set-gallery-hero.ts --slug <slug> --image <n> [--apply]\n" +
      "  --image is 1-based, as printed by scripts/preview-product-heroes.ts",
  );
  process.exit(1);
}

const position = Number(imageArg);
if (!Number.isInteger(position) || position < 1) {
  console.error(
    `--image must be a whole number of 1 or more, got "${imageArg}"`,
  );
  process.exit(1);
}

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

interface GalleryImage {
  _key: string;
  filename: string | null;
  isStudioShot?: boolean;
}

async function main() {
  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  const product = await client.fetch<{
    _id: string;
    title: string;
    gallery: GalleryImage[] | null;
  } | null>(
    `*[_type == "product" && !(_id in path("drafts.**")) && slug.current == $slug][0]{
      _id, title,
      "gallery": gallery[]{ _key, "filename": asset->originalFilename, isStudioShot }
    }`,
    { slug },
  );

  if (!product) {
    console.error(`No published product at "${slug}".`);
    process.exit(1);
  }

  const gallery = product.gallery ?? [];
  if (position > gallery.length) {
    console.error(
      `${product.title} has ${gallery.length} images; --image ${position} is out of range.`,
    );
    process.exit(1);
  }

  const index = position - 1;
  console.log(`  ${product.title}`);
  gallery.forEach((image, i) => {
    const marker = i === index ? "→" : i === 0 ? "×" : " ";
    console.log(
      `   ${marker} #${i + 1}  ${image.filename ?? "(no filename)"}${
        image.isStudioShot ? "  [studio]" : ""
      }`,
    );
  });

  if (index === 0) {
    console.log("\nThat image already leads the gallery. Nothing to do.\n");
    return;
  }

  /* One move, not a sort. Everything else keeps its relative order, so an
   * arrangement someone made deliberately is disturbed as little as possible —
   * the same principle as preferredOrder in scripts/lib/studio-shot.ts. */
  const keys = [
    gallery[index]!._key,
    ...gallery.filter((_, i) => i !== index).map((image) => image._key),
  ];

  console.log(`\n   #${position} becomes the hero; #1 moves to #2.`);

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  /* Reorder the *stored* objects, not the projection.
   *
   * The fetch above is a projection — `_key`, a filename joined from the asset, a
   * flag. Writing that shape back would replace each gallery entry with an object
   * holding a key and nothing else: no asset reference, no alt text, no hotspot, no
   * `isStudioShot`. The images would simply vanish from the product. So the array is
   * read again unprojected and its real objects are permuted.
   *
   * Re-read rather than reuse: Sanity has no reorder operation, the whole array has
   * to be rewritten, and rewriting a stale copy would silently undo anything changed
   * in between. If the gallery has moved underneath us, abort instead of guessing. */
  const current = await client.fetch<{ gallery: { _key?: string }[] } | null>(
    `*[_id == $id][0]{ gallery }`,
    { id: product._id },
  );
  const stored = current?.gallery ?? [];
  const ordered = keys
    .map((key) => stored.find((image) => image._key === key))
    .filter((image): image is { _key?: string } => Boolean(image));

  if (ordered.length !== stored.length) {
    console.error(
      `\nAborted — the gallery changed while this ran (${ordered.length} of ${stored.length} matched). Nothing written.\n`,
    );
    process.exit(1);
  }

  await client.patch(product._id).set({ gallery: ordered }).commit();

  console.log("\nDone.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
