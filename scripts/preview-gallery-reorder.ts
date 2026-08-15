/**
 * Renders what `derive-studio-shots.ts --reorder` would do to the hero image of
 * every product it wants to change, as a before/after contact sheet.
 *
 * Why this exists rather than trusting the dry run's text: the hero image is the
 * one photograph a shopper sees in a category grid, in search results and in a
 * Merchant Center listing. `derive-studio-shots.ts` decides it from the share of
 * the frame border that is plain white, which is a good rule and a *measurement of
 * the background*, not of the subject. Two things score as a perfect catalogue shot
 * and are not one:
 *
 *   - a dimensioned technical render (the product drawn on white with measurement
 *     lines and numbers) — Damien found one of these leading a product
 *   - a detail crop shot on the same sweep as the product
 *
 * Neither can be separated from a real pack shot by measuring the border, and I
 * tried: a margin-ring ink test put the known diagrams at 0.000–0.034 and ordinary
 * photographs at 0.000–0.149, thoroughly overlapping. A hairline-detection pass was
 * worse — the known diagrams scored 0–1 and plain furniture photos 4–6. So the
 * check is a person looking at 23 pictures, which takes a minute and is right,
 * rather than a classifier that is wrong in a way nobody notices.
 *
 *   pnpm tsx --env-file=.env.local scripts/preview-gallery-reorder.ts
 *
 * Writes .image-work/reorder-review.png (gitignored). Read-only.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";
import sharp from "sharp";

import {
  canReorder,
  classifyShot,
  isDimensionDiagram,
  orderChanges,
  preferredOrder,
} from "./lib/studio-shot";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Row {
  title: string;
  slug: string;
  images: {
    url: string | null;
    lqip: string | null;
    filename: string | null;
  }[];
}

const QUERY = /* groq */ `
*[_type == "product" && !(_id in path("drafts.**")) && count(gallery) > 1]{
  title,
  "slug": slug.current,
  "images": gallery[]{
    "url": asset->url,
    "lqip": asset->metadata.lqip,
    "filename": asset->originalFilename
  }
} | order(title asc)`;

/** Decode the stored LQIP to raw RGB — the same input the real script measures. */
async function raw(lqip: string) {
  const base64 = lqip.replace(/^data:image\/[a-z]+;base64,/, "");
  const { data, info } = await sharp(Buffer.from(base64, "base64"))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

const CELL = 132;
const GAP = 6;
const LABEL = 34;

async function tile(url: string): Promise<Buffer> {
  const res = await fetch(
    `${url}?w=${CELL * 2}&h=${CELL * 2}&fit=fill&bg=ffffff&fm=png`,
  );
  return sharp(Buffer.from(await res.arrayBuffer()))
    .resize(CELL, CELL, { fit: "contain", background: "#ffffff" })
    .png()
    .toBuffer();
}

async function main() {
  const products = await client.fetch<Row[]>(QUERY);
  const changing: { row: Row; from: number; to: number }[] = [];

  for (const row of products) {
    const shots = [];
    for (const image of row.images) {
      if (!image.lqip) {
        shots.push({ kind: "unknown" as const, whiteFraction: 0 });
        continue;
      }
      const verdict = classifyShot(await raw(image.lqip));
      shots.push({
        kind: verdict.kind,
        whiteFraction: verdict.whiteFraction,
        isDiagram: isDimensionDiagram(image.filename),
      });
    }
    if (!canReorder(shots)) continue;
    const order = preferredOrder(shots);
    // Only the hero matters here: a change further down the gallery does not
    // affect the one image that represents the product everywhere else.
    if (!orderChanges(order) || order[0] === 0) continue;
    changing.push({ row, from: 0, to: order[0]! });
  }

  console.log(
    `\n${changing.length} products would get a different hero image\n`,
  );
  if (!changing.length) return;

  // Two columns per product (before, after), three products per sheet row.
  const perRow = 3;
  const rows = Math.ceil(changing.length / perRow);
  const unit = CELL * 2 + GAP * 3;
  const width = GAP + perRow * unit;
  const height = GAP + rows * (CELL + LABEL + GAP * 2);

  const composites: sharp.OverlayOptions[] = [];
  let svg = "";

  for (let i = 0; i < changing.length; i++) {
    const { row, to } = changing[i]!;
    const col = i % perRow;
    const line = Math.floor(i / perRow);
    const x = GAP + col * unit;
    const y = GAP + line * (CELL + LABEL + GAP * 2);

    const beforeUrl = row.images[0]?.url;
    const afterUrl = row.images[to]?.url;
    if (beforeUrl)
      composites.push({ input: await tile(beforeUrl), left: x, top: y });
    if (afterUrl)
      composites.push({
        input: await tile(afterUrl),
        left: x + CELL + GAP,
        top: y,
      });

    const name = row.slug.length > 34 ? `${row.slug.slice(0, 33)}…` : row.slug;
    svg +=
      `<text x="${x}" y="${y + CELL + 13}" font-family="sans-serif" font-size="10" fill="#111">${name}</text>` +
      `<text x="${x}" y="${y + CELL + 25}" font-family="sans-serif" font-size="9" fill="#a33">` +
      `now: #1 → proposed: #${to + 1}</text>`;
    console.log(`  #1 → #${to + 1}  ${row.slug}`);
  }

  const sheet = sharp({
    create: { width, height, channels: 3, background: "#efedE8" },
  }).composite([
    ...composites,
    {
      input: Buffer.from(
        `<svg width="${width}" height="${height}">${svg}</svg>`,
      ),
      left: 0,
      top: 0,
    },
  ]);

  const dir = path.join(process.cwd(), ".image-work");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "reorder-review.png");
  await sheet.png().toFile(file);
  console.log(
    `\nWritten to ${file}\n\nLeft of each pair is today's hero, right is the proposed one.` +
      `\nLook for a measurements diagram or a detail crop on the right — those are the` +
      `\ntwo things the border measurement cannot tell apart from a real pack shot.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
