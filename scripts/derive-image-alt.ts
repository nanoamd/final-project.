/**
 * Fills in the missing alt text across the catalogue.
 *
 * The audit found 178 of 439 images carry alt text, so 261 do not: a screen
 * reader announces nothing useful, Google Images has nothing to index, and the
 * brief asks for alt text per image.
 *
 * What it writes and why it is safe to write it is in scripts/lib/image-alt.ts —
 * the short version is that it describes only what the product document can
 * prove, and never overwrites what an editor typed.
 *
 * Run this *after* scripts/derive-studio-shots.ts. The wording depends on
 * `isStudioShot` to tell a catalogue shot from a room photograph, and before
 * that script ran the flag was set on nothing, so every image would be described
 * as a setting photograph.
 *
 * Published documents only.
 *
 * Dry run by default:
 *   pnpm tsx --env-file=.env.local scripts/derive-image-alt.ts
 * Write it:
 *   pnpm tsx --env-file=.env.local scripts/derive-image-alt.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { buildGalleryAlts } from "./lib/image-alt";

const apply = process.argv.includes("--apply");

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

interface RawProduct {
  id: string;
  title: string | null;
  department: string | null;
  gallery:
    | {
        key: string | null;
        alt: string | null;
        optionValue: string | null;
        isStudioShot: boolean | null;
      }[]
    | null;
}

async function main() {
  const products = await client.fetch<RawProduct[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && count(gallery) > 0]{
      "id": _id, title,
      "department": category->department->title,
      "gallery": gallery[]{ "key": _key, alt, optionValue, isStudioShot }
    }|order(title asc)`,
  );

  console.log(
    `\n${products.length} published products with a gallery. ${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  const patches: { id: string; title: string; key: string; alt: string }[] = [];
  let alreadyDescribed = 0;

  for (const product of products) {
    const gallery = product.gallery ?? [];
    const alts = buildGalleryAlts(
      product.title ?? "",
      product.department,
      gallery,
    );

    const written: string[] = [];
    gallery.forEach((image, index) => {
      const alt = alts[index];
      if (alt == null) {
        alreadyDescribed += 1;
        return;
      }
      if (!image.key) return;
      patches.push({
        id: product.id,
        title: product.title ?? product.id,
        key: image.key,
        alt,
      });
      written.push(`      ${index + 1}. ${alt}`);
    });

    if (written.length) {
      console.log(`  ${product.title ?? product.id}`);
      for (const line of written) console.log(line);
    }
  }

  console.log(
    `\n${patches.length} images to describe; ${alreadyDescribed} already have alt text an editor wrote`,
  );

  // Mandatory audit trail for any data correction: every image this run
  // wrote (or would write) alt text for, one entry per image, so the exact
  // before/after is checkable later without re-deriving it.
  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-image-alt-fill.json`,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: "scripts/derive-image-alt.ts",
        applied: apply,
        written: patches.length,
        alreadyDescribed,
        changes: patches,
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  // One transaction per product rather than one per image: 261 separate commits
  // would be 261 document revisions, which makes the History tab in Studio
  // useless for the next fortnight.
  const byProduct = new Map<string, typeof patches>();
  for (const patch of patches)
    byProduct.set(patch.id, [...(byProduct.get(patch.id) ?? []), patch]);

  for (const [id, group] of byProduct) {
    await group
      .reduce(
        (patch, entry) =>
          patch.set({ [`gallery[_key=="${entry.key}"].alt`]: entry.alt }),
        client.patch(id),
      )
      .commit({ visibility: "async" });
  }

  console.log(
    `Described ${patches.length} images across ${byProduct.size} products.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
