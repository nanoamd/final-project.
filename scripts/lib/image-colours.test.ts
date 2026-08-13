import { describe, expect, it } from "vitest";

import {
  coloursInImage,
  dedupeSwatches,
  hexToOklab,
  labDistance,
  MIN_COLOUR_SHARE,
  type RawImage,
  type Swatch,
  toOklab,
} from "./image-colours";

const WHITE = "#f6f5f2";
const BLACK = "#1a1a1a";
const GOLD = "#c9a24a";
const BRASS = "#b08d4f";
const AQUA = "#6fa8a3";
const OAK = "#c19a63";

const swatches: Record<string, Swatch> = {
  White: { tag: "White", hex: WHITE },
  Black: { tag: "Black", hex: BLACK },
  Gold: { tag: "Gold", hex: GOLD },
  Brass: { tag: "Brass", hex: BRASS },
  Aqua: { tag: "Aqua", hex: AQUA },
  Oak: { tag: "Oak", hex: OAK },
};

/**
 * Builds a test photograph: a white sweep with rectangles painted on it.
 *
 * `sweep` defaults to pure paper. Rectangles are drawn in order, so a later one
 * paints over an earlier one — which is how the enclosed-sweep case is set up.
 */
function photo(
  width: number,
  height: number,
  rects: { x: number; y: number; w: number; h: number; hex: string }[],
  sweep = "#ffffff",
): RawImage {
  const data = new Uint8Array(width * height * 3);
  const paint = (index: number, hex: string) => {
    data[index * 3] = parseInt(hex.slice(1, 3), 16);
    data[index * 3 + 1] = parseInt(hex.slice(3, 5), 16);
    data[index * 3 + 2] = parseInt(hex.slice(5, 7), 16);
  };
  for (let i = 0; i < width * height; i += 1) paint(i, sweep);
  for (const rect of rects)
    for (let y = rect.y; y < rect.y + rect.h; y += 1)
      for (let x = rect.x; x < rect.x + rect.w; x += 1)
        if (x >= 0 && x < width && y >= 0 && y < height)
          paint(y * width + x, rect.hex);
  return { width, height, data };
}

function shareOf(
  reading: { colours: { tag: string; share: number }[] },
  tag: string,
): number {
  return reading.colours.find((c) => c.tag === tag)?.share ?? 0;
}

describe("toOklab", () => {
  it("keeps the sign of the blue-yellow axis", () => {
    // The reason this file converts colour itself: sharp's 8-bit CIELAB clips
    // negative a/b to zero, so every blue arrives as a neutral grey and a navy
    // sofa becomes unmatchable.
    expect(toOklab(60, 79, 104).b).toBeLessThan(0);
    expect(toOklab(201, 162, 74).b).toBeGreaterThan(0);
  });

  it("separates dull gold from dark green", () => {
    // The first version of this file weighted hue over lightness and put gold
    // nearer to green than to gold, tagging a brass-legged table Green.
    const gold = hexToOklab(GOLD);
    const green = hexToOklab("#4f6152");
    expect(labDistance(gold, green)).toBeGreaterThan(
      labDistance(gold, hexToOklab(BRASS)),
    );
  });
});

describe("dedupeSwatches", () => {
  it("keeps only the first of two colours a photograph cannot separate", () => {
    // Oak and Gold are 0.040 apart in OKLab — closer than Gold is to Brass. Pale
    // timber and warm metal are the same colour to a thumbnail, so the caller's
    // preference decides rather than a coin toss between two half-shares.
    expect(dedupeSwatches([swatches.Oak!, swatches.Gold!]).map((s) => s.tag)) //
      .toEqual(["Oak"]);
    expect(dedupeSwatches([swatches.Gold!, swatches.Oak!]).map((s) => s.tag)) //
      .toEqual(["Gold"]);
  });

  it("keeps colours that are genuinely different", () => {
    const kept = dedupeSwatches([
      swatches.Black!,
      swatches.White!,
      swatches.Aqua!,
      swatches.Gold!,
    ]);
    expect(kept).toHaveLength(4);
  });
});

describe("coloursInImage", () => {
  it("ignores the sweep a catalogue shot stands on", () => {
    const image = photo(40, 40, [{ x: 12, y: 12, w: 16, h: 16, hex: BLACK }]);
    const reading = coloursInImage(image, [swatches.Black!, swatches.White!]);
    expect(shareOf(reading, "Black")).toBeGreaterThan(0.9);
    expect(shareOf(reading, "White")).toBe(0);
  });

  it("keeps a white product standing on a white sweep", () => {
    // The flood fill ate the white Abberley chest whole on the first attempt —
    // 25 subject pixels out of 9216 — because it walked across the soft boundary
    // between a white product and white paper. A slightly-off-white product with
    // its own edge has to survive.
    const image = photo(40, 40, [
      { x: 10, y: 10, w: 20, h: 20, hex: "#d8d8d6" },
      { x: 12, y: 12, w: 16, h: 16, hex: WHITE },
    ]);
    const reading = coloursInImage(image, [swatches.White!, swatches.Black!]);
    expect(shareOf(reading, "White")).toBeGreaterThan(0.5);
    expect(reading.subjectShare).toBeGreaterThan(0.15);
  });

  it("does not count sweep the product encloses", () => {
    // Grafton's open steel frame: the paper inside it is not reachable from the
    // frame edge, and counting it reported a black console as 76% White.
    const frame = photo(48, 48, [
      { x: 8, y: 8, w: 32, h: 32, hex: BLACK },
      { x: 12, y: 12, w: 24, h: 24, hex: "#ffffff" },
    ]);
    const reading = coloursInImage(frame, [swatches.Black!, swatches.White!]);
    expect(shareOf(reading, "White")).toBe(0);
    expect(shareOf(reading, "Black")).toBeGreaterThan(0.9);
  });

  it("reports a secondary colour that holds enough of the object", () => {
    // "White and gold for a white table with gold legs" — the case the
    // text-based derivation could never see.
    const table = photo(48, 48, [
      { x: 8, y: 10, w: 32, h: 10, hex: "#e9e7e2" },
      { x: 11, y: 20, w: 4, h: 18, hex: GOLD },
      { x: 33, y: 20, w: 4, h: 18, hex: GOLD },
    ]);
    const reading = coloursInImage(table, [swatches.White!, swatches.Gold!]);
    expect(shareOf(reading, "White")).toBeGreaterThan(shareOf(reading, "Gold"));
    expect(shareOf(reading, "Gold")).toBeGreaterThan(MIN_COLOUR_SHARE);
  });

  it("reports nothing for a colour the product does not have", () => {
    const image = photo(40, 40, [{ x: 12, y: 12, w: 16, h: 16, hex: AQUA }]);
    const reading = coloursInImage(image, [
      swatches.Aqua!,
      swatches.Oak!,
      swatches.Black!,
    ]);
    expect(shareOf(reading, "Aqua")).toBeGreaterThan(0.9);
    expect(shareOf(reading, "Oak")).toBe(0);
    expect(shareOf(reading, "Black")).toBe(0);
  });

  it("counts what the palette cannot match rather than forcing it", () => {
    // A palette missing the product's actual colour must say so, not hand the
    // pixels to whichever swatch happens to be least wrong.
    const image = photo(40, 40, [{ x: 12, y: 12, w: 16, h: 16, hex: AQUA }]);
    const reading = coloursInImage(image, [swatches.Black!]);
    expect(reading.unmatchedShare).toBeGreaterThan(0.9);
    expect(reading.colours).toHaveLength(0);
  });

  it("finds no subject in a frame that is all sweep", () => {
    const blank = photo(32, 32, []);
    const reading = coloursInImage(blank, [swatches.White!]);
    expect(reading.subjectShare).toBe(0);
    expect(reading.colours).toHaveLength(0);
  });
});
