/**
 * Renders the product-page side-panel artwork to a PNG contact sheet, so it can be
 * looked at rather than assumed.
 *
 * The unit tests prove the geometry is deterministic and free of NaN. They cannot
 * tell me whether it looks like something a premium retailer would put on a page,
 * and that is the whole point of the brief item. This draws every motif, twice with
 * different seeds, on the real canvas colours.
 *
 *   pnpm tsx scripts/preview-product-artwork.ts
 *
 * Writes .image-work/product-artwork.png (gitignored).
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import {
  ART_HEIGHT,
  ART_WIDTH,
  type ArtMotif,
  artPaths,
} from "../src/lib/product/artwork";

// The real tokens from src/app/globals.css.
const CANVAS = "#f4f2ed";
const PAPER = "#ffffff";
const LINE = "#e6e2d9";
const BRASS = "#c65a2c";
const MUTED = "#8a857c";

const MOTIFS: ArtMotif[] = [
  "wood-grain",
  "architectural",
  "water",
  "steam",
  "garden",
  "botanical",
  "radiance",
];

/** Two products per motif, so the variation is visible side by side. */
const SEEDS = ["camden-round-side-table", "elmley-ivory-console-table"];

/**
 * The two slots the artwork actually appears in. The Description tab crops the
 * canvas square, which shows only the middle 400×400 — a composition that reads
 * well in portrait can lose its accent line or its baseline there, so both are
 * drawn side by side rather than only the one I designed against.
 */
const SLOTS = [
  { label: "portrait 5:7", w: ART_WIDTH * 0.62, h: ART_HEIGHT * 0.62 },
  {
    label: "square (description tab)",
    w: ART_HEIGHT * 0.62,
    h: ART_HEIGHT * 0.62,
  },
] as const;

const PAD = 28;
const LABEL = 26;
const ROW_H = ART_HEIGHT * 0.62;

function panel(motif: ArtMotif, slug: string, w: number, h: number): string {
  const layers = artPaths(motif, slug);
  const group = (
    weight: string,
    stroke: string,
    width: number,
    opacity: number,
  ) => {
    const paths = layers.filter((layer) => layer.weight === weight);
    if (!paths.length) return "";
    return (
      `<g stroke="${stroke}" stroke-width="${width}" opacity="${opacity}" fill="none" ` +
      `stroke-linecap="round" stroke-linejoin="round">` +
      paths.map((layer) => `<path d="${layer.d}"/>`).join("") +
      `</g>`
    );
  };
  return (
    `<svg x="0" y="0" width="${w}" height="${h}" viewBox="0 0 ${ART_WIDTH} ${ART_HEIGHT}" ` +
    `preserveAspectRatio="xMidYMid slice">` +
    `<rect width="${ART_WIDTH}" height="${ART_HEIGHT}" fill="${PAPER}"/>` +
    group("hair", LINE, 1, 0.75) +
    group("fine", LINE, 1.4, 1) +
    // text-brass/45
    group("accent", BRASS, 1.5, 0.45) +
    `</svg>`
  );
}

async function main() {
  // One cell per slot per seed, laid out left to right.
  const cells = SLOTS.flatMap((slot) => SEEDS.map((slug) => ({ slot, slug })));
  const rowWidth = cells.reduce((sum, cell) => sum + cell.slot.w + PAD, 0);
  const width = PAD + rowWidth;
  const height = PAD + MOTIFS.length * (ROW_H + LABEL + PAD) + LABEL;

  let body = `<rect width="${width}" height="${height}" fill="${CANVAS}"/>`;

  // Column headings, so it is obvious which pair is which slot.
  let headX = PAD;
  for (const slot of SLOTS) {
    body +=
      `<text x="${headX}" y="${LABEL - 8}" font-family="sans-serif" font-size="12" ` +
      `letter-spacing="1.5" fill="${MUTED}">${slot.label.toUpperCase()}</text>`;
    headX += SEEDS.length * (slot.w + PAD);
  }

  MOTIFS.forEach((motif, row) => {
    const y = LABEL + PAD + row * (ROW_H + LABEL + PAD);
    body +=
      `<text x="${PAD}" y="${y + 14}" font-family="sans-serif" font-size="13" ` +
      `letter-spacing="2" fill="${MUTED}">${motif.toUpperCase()}</text>`;
    let x = PAD;
    for (const { slot, slug } of cells) {
      body +=
        `<g transform="translate(${x} ${y + LABEL})">` +
        panel(motif, slug, slot.w, slot.h) +
        `<rect width="${slot.w}" height="${slot.h}" fill="none" stroke="${LINE}" rx="12"/>` +
        `</g>`;
      x += slot.w + PAD;
    }
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`;
  const outputDir = path.join(process.cwd(), ".image-work");
  await mkdir(outputDir, { recursive: true });
  const file = path.join(outputDir, "product-artwork.png");
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log(`\nWritten to ${file}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
