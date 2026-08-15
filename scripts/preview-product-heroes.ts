/**
 * Contact sheet of the hero image of every published product — or of one
 * product's whole gallery.
 *
 * The hero is the single photograph that represents a product in a category grid,
 * in on-site search, in a Google Shopping listing and in a share card. There are
 * 120 published products and no view anywhere — Studio included — that shows all
 * 120 heroes together, so a wrong one (a measurements diagram, a detail crop, the
 * back of a cabinet) is invisible until a customer sees it. Damien found one by
 * chance; this is how the rest get found.
 *
 * Deliberately not a classifier. Measuring the background cannot distinguish a
 * pack shot from a dimensioned render on the same white sweep — see the note in
 * scripts/preview-gallery-reorder.ts for the two attempts and the numbers that
 * killed them. Judging 120 thumbnails by eye takes a minute and is correct.
 *
 *   pnpm tsx --env-file=.env.local scripts/preview-product-heroes.ts
 *   pnpm tsx --env-file=.env.local scripts/preview-product-heroes.ts --slug serene-three-drawer-bedside-table
 *
 * Writes .image-work/heroes-*.png (gitignored). Read-only.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";
import sharp from "sharp";

const slugArg = (() => {
  const i = process.argv.indexOf("--slug");
  return i > -1 ? process.argv[i + 1] : undefined;
})();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const CELL = 118;
const GAP = 5;
const LABEL = 24;
const COLS = 8;
/** Split into several images: one sheet of 120 tiles is unreadable. */
const PER_SHEET = 40;

async function tile(url: string): Promise<Buffer> {
  const res = await fetch(
    `${url}?w=${CELL * 2}&h=${CELL * 2}&fit=fill&bg=ffffff&fm=png`,
  );
  return sharp(Buffer.from(await res.arrayBuffer()))
    .resize(CELL, CELL, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();
}

async function sheet(
  entries: { url: string; caption: string; note?: string }[],
  file: string,
) {
  const cols = Math.min(COLS, entries.length);
  const rows = Math.ceil(entries.length / cols);
  const width = GAP + cols * (CELL + GAP);
  const height = GAP + rows * (CELL + LABEL + GAP);

  const composites: sharp.OverlayOptions[] = [];
  let svg = "";
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const x = GAP + (i % cols) * (CELL + GAP);
    const y = GAP + Math.floor(i / cols) * (CELL + LABEL + GAP);
    composites.push({ input: await tile(entry.url), left: x, top: y });
    const caption =
      entry.caption.length > 24
        ? `${entry.caption.slice(0, 23)}…`
        : entry.caption;
    svg +=
      `<text x="${x}" y="${y + CELL + 11}" font-family="sans-serif" font-size="9" fill="#111">${caption}</text>` +
      (entry.note
        ? `<text x="${x}" y="${y + CELL + 21}" font-family="sans-serif" font-size="9" fill="#a33">${entry.note}</text>`
        : "");
  }

  await sharp({
    create: { width, height, channels: 3, background: "#efedE8" },
  })
    .composite([
      ...composites,
      {
        input: Buffer.from(
          `<svg width="${width}" height="${height}">${svg}</svg>`,
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toFile(file);
  console.log(`  ${file}  (${entries.length} tiles)`);
}

async function main() {
  const dir = path.join(process.cwd(), ".image-work");
  await mkdir(dir, { recursive: true });

  if (slugArg) {
    const product = await client.fetch<{
      title: string;
      images: { url: string | null }[];
    } | null>(
      `*[_type == "product" && !(_id in path("drafts.**")) && slug.current == $slug][0]{
        title, "images": gallery[]{ "url": asset->url }
      }`,
      { slug: slugArg },
    );
    if (!product) {
      console.error(`No published product at ${slugArg}`);
      process.exit(1);
    }
    const entries = product.images
      .map((image, index) => ({ url: image.url, index }))
      .filter((e): e is { url: string; index: number } => Boolean(e.url))
      .map((e) => ({ url: e.url, caption: `#${e.index + 1}` }));
    console.log(`\n${product.title} — ${entries.length} images\n`);
    await sheet(entries, path.join(dir, `heroes-${slugArg}.png`));
    return;
  }

  const products = await client.fetch<
    { title: string; slug: string; url: string | null; count: number }[]
  >(`
  *[_type == "product" && !(_id in path("drafts.**")) && count(gallery) > 0]{
    title, "slug": slug.current, "url": gallery[0].asset->url, "count": count(gallery)
  } | order(slug asc)`);

  const entries = products
    .filter((p): p is typeof p & { url: string } => Boolean(p.url))
    .map((p) => ({
      url: p.url,
      caption: p.slug,
      note: `${p.count} image${p.count === 1 ? "" : "s"}`,
    }));

  console.log(`\n${entries.length} published products with a hero image\n`);
  for (let i = 0; i < entries.length; i += PER_SHEET) {
    const part = Math.floor(i / PER_SHEET) + 1;
    await sheet(
      entries.slice(i, i + PER_SHEET),
      path.join(dir, `heroes-${part}.png`),
    );
  }
  console.log(
    "\nLook for: a measurements diagram, a detail crop, a rear view, or a photo of a\n" +
      "different item in the same range. None of those can be measured — only seen.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
