/**
 * Flags every gallery image as a catalogue shot or a lifestyle shot, and puts
 * the catalogue shot first.
 *
 * The brief: image one is the clean white-background product shot, the hover is
 * the lifestyle photo, and it must not require hand-editing hundreds of
 * products. The audit found `isStudioShot` set on **0 of 439 images**, which
 * means the card-hover swap has never fired on a single product — the frontend
 * looks for a flagged image, finds none, and renders no hover image at all.
 *
 * How it decides is in scripts/lib/studio-shot.ts: the border of each image's
 * stored thumbnail is measured for lightness and uniformity. No originals are
 * downloaded.
 *
 * Two changes per product, both conservative:
 *
 *   1. `isStudioShot` is set on images confidently identified as catalogue
 *      shots, and left alone otherwise. An image the rule cannot call is never
 *      flagged either way.
 *   2. The gallery is reordered so catalogue shots lead, with the editor's own
 *      sequence preserved inside each group. A product whose order already
 *      satisfies the rule is not written at all.
 *
 * Published documents only. Drafts are left for their editor, because a draft is
 * unfinished by definition and reordering someone's work-in-progress gallery
 * underneath them is not a kindness.
 *
 * Dry run by default — prints every decision with the measurement behind it:
 *   pnpm tsx --env-file=.env.local scripts/derive-studio-shots.ts
 * Write it:
 *   pnpm tsx --env-file=.env.local scripts/derive-studio-shots.ts --apply
 * Reorder as well as flag (off by default, since it changes what a shopper sees
 * first):
 *   pnpm tsx --env-file=.env.local scripts/derive-studio-shots.ts --apply --reorder
 */
import { createClient } from "@sanity/client";
import sharp from "sharp";

import {
  canReorder,
  classifyShot,
  isPlainBackground,
  orderChanges,
  preferredOrder,
  type Shot,
  type ShotKind,
} from "./lib/studio-shot";

const apply = process.argv.includes("--apply");
const reorder = process.argv.includes("--reorder");

const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  useCdn: false,
  token,
});

interface RawImage {
  key: string | null;
  assetId: string | null;
  filename: string | null;
  lqip: string | null;
  isStudioShot: boolean | null;
}

interface RawProduct {
  id: string;
  title: string | null;
  slug: string | null;
  gallery: RawImage[] | null;
}

/** Decode the stored base64 thumbnail to raw RGB. Never throws — an asset with
 *  a malformed or missing lqip is simply undecidable, which the caller handles. */
async function decodeLqip(lqip: string | null) {
  if (!lqip) return null;
  const base64 = lqip.replace(/^data:image\/[a-z+]+;base64,/, "");
  try {
    const { data, info } = await sharp(Buffer.from(base64, "base64"))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    return null;
  }
}

function shorten(text: string | null, length = 52): string {
  if (!text) return "(untitled)";
  return text.length <= length ? text : `${text.slice(0, length - 1)}…`;
}

async function main() {
  const products = await client.fetch<RawProduct[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && count(gallery) > 0]{
      "id": _id, title, "slug": slug.current,
      "gallery": gallery[]{
        "key": _key,
        "assetId": asset->_id,
        "filename": asset->originalFilename,
        "lqip": asset->metadata.lqip,
        isStudioShot
      }
    }|order(title asc)`,
  );

  console.log(
    `\n${products.length} published products with a gallery. ${
      apply
        ? reorder
          ? "APPLYING (flags + order)"
          : "APPLYING (flags only)"
        : "DRY RUN"
    }\n`,
  );

  const counts: Record<ShotKind, number> = {
    catalogue: 0,
    lifestyle: 0,
    unknown: 0,
  };
  let undecodable = 0;
  const flagPatches: { id: string; key: string }[] = [];
  const reorderPatches: { id: string; title: string; keys: string[] }[] = [];
  let alreadyLeading = 0;

  for (const product of products) {
    const images = product.gallery ?? [];
    const shots: Shot[] = [];
    const lines: string[] = [];

    for (const image of images) {
      const decoded = await decodeLqip(image.lqip);
      if (!decoded) {
        undecodable += 1;
        shots.push({ kind: "unknown", whiteFraction: 0 });
        lines.push(
          `      ?  no usable thumbnail  ${shorten(image.filename, 40)}`,
        );
        continue;
      }
      const verdict = classifyShot(decoded);
      shots.push({ kind: verdict.kind, whiteFraction: verdict.whiteFraction });
      counts[verdict.kind] += 1;

      const mark =
        verdict.kind === "catalogue"
          ? "▪"
          : verdict.kind === "lifestyle"
            ? "▫"
            : "?";
      const already = image.isStudioShot === true ? " (already flagged)" : "";
      lines.push(
        `      ${mark}  ${verdict.kind.padEnd(9)} ${verdict.reason}${already}`,
      );

      if (
        isPlainBackground(verdict.kind) &&
        image.isStudioShot !== true &&
        image.key
      )
        flagPatches.push({ id: product.id, key: image.key });
    }

    const order = preferredOrder(shots);
    const needsReorder = canReorder(shots) && orderChanges(order);
    if (!needsReorder) alreadyLeading += 1;

    // Only print products where something is decided or changes — a fully
    // undecidable product is noise in a report meant to be read.
    const interesting = needsReorder || shots.some((s) => s.kind !== "unknown");
    if (interesting) {
      console.log(
        `  ${needsReorder ? "↻" : " "} ${shorten(product.title)}  [${shots
          .map(({ kind }) =>
            kind === "catalogue" ? "C" : kind === "lifestyle" ? "L" : "?",
          )
          .join("")}]`,
      );
      for (const line of lines) console.log(line);
      if (needsReorder)
        console.log(
          `      → reorder to ${order.map((i) => i + 1).join(", ")} (catalogue shot first)`,
        );
    }

    if (needsReorder && images.every((image) => image.key))
      reorderPatches.push({
        id: product.id,
        title: product.title ?? product.slug ?? product.id,
        keys: order.map((index) => images[index]!.key!),
      });
  }

  console.log(
    `\n${counts.catalogue} catalogue shots, ${counts.lifestyle} lifestyle shots, ${counts.unknown} undecided (${undecodable} with no usable thumbnail)`,
  );
  console.log(
    `${flagPatches.length} images to flag; ${reorderPatches.length} products to reorder; ${alreadyLeading} already lead with a catalogue shot`,
  );

  if (!apply) {
    console.log(
      "\nDry run — nothing written. Re-run with --apply (add --reorder to change gallery order too).\n",
    );
    return;
  }

  // Flags first, in one transaction per product, so a failure part-way leaves
  // the catalogue in a coherent state rather than half-flagged galleries.
  const byProduct = new Map<string, string[]>();
  for (const patch of flagPatches)
    byProduct.set(patch.id, [...(byProduct.get(patch.id) ?? []), patch.key]);

  let flagged = 0;
  for (const [id, keys] of byProduct) {
    let transaction = client.transaction();
    const patch = client.patch(id);
    transaction = transaction.patch(
      keys.reduce(
        (accumulated, key) =>
          accumulated.set({ [`gallery[_key=="${key}"].isStudioShot`]: true }),
        patch,
      ),
    );
    await transaction.commit({ visibility: "async" });
    flagged += keys.length;
  }
  console.log(`Flagged ${flagged} images across ${byProduct.size} products.`);

  if (!reorder) {
    console.log(
      "Order left alone — pass --reorder to move catalogue shots to position one.\n",
    );
    return;
  }

  for (const patch of reorderPatches) {
    // Sanity has no "reorder" operation, so the move is expressed as an
    // unset-and-reinsert of the whole array. Read the current array back rather
    // than trusting the fetch above: the flag write just changed these
    // documents, and reinserting a stale copy would undo it.
    const current = await client.fetch<{ gallery: unknown[] }>(
      `*[_id == $id][0]{ gallery }`,
      { id: patch.id },
    );
    const gallery = (current?.gallery ?? []) as { _key?: string }[];
    const ordered = patch.keys
      .map((key) => gallery.find((image) => image._key === key))
      .filter((image): image is { _key?: string } => Boolean(image));
    if (ordered.length !== gallery.length) {
      console.log(
        `  ! skipped ${patch.title} — gallery changed underneath us (${ordered.length} of ${gallery.length} matched)`,
      );
      continue;
    }
    await client.patch(patch.id).set({ gallery: ordered }).commit();
    console.log(`  ↻ ${patch.title}`);
  }
  console.log(`Reordered ${reorderPatches.length} galleries.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
