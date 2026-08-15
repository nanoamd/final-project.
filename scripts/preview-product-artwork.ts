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

const PAD = 28;
const LABEL = 26;
const CELL_W = ART_WIDTH * 0.62;
const CELL_H = ART_HEIGHT * 0.62;

function panel(motif: ArtMotif, slug: string): string {
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
    `<svg x="0" y="0" width="${CELL_W}" height="${CELL_H}" viewBox="0 0 ${ART_WIDTH} ${ART_HEIGHT}" ` +
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
  const cols = SEEDS.length;
  const rows = MOTIFS.length;
  const width = PAD + cols * (CELL_W + PAD);
  const height = PAD + rows * (CELL_H + LABEL + PAD);

  let body = `<rect width="${width}" height="${height}" fill="${CANVAS}"/>`;
  MOTIFS.forEach((motif, row) => {
    const y = PAD + row * (CELL_H + LABEL + PAD);
    body +=
      `<text x="${PAD}" y="${y + 14}" font-family="sans-serif" font-size="13" ` +
      `letter-spacing="2" fill="${MUTED}">${motif.toUpperCase()}</text>`;
    SEEDS.forEach((slug, col) => {
      const x = PAD + col * (CELL_W + PAD);
      body +=
        `<g transform="translate(${x} ${y + LABEL})">` +
        panel(motif, slug) +
        `<rect width="${CELL_W}" height="${CELL_H}" fill="none" stroke="${LINE}" rx="12"/>` +
        `</g>`;
    });
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
