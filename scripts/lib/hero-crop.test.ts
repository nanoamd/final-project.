import { describe, expect, it } from "vitest";

import {
  fullHotspot,
  magnification,
  MARGIN,
  squareCrop,
  type TrimBox,
} from "./hero-crop";

const FRAME = { width: 400, height: 400 };

/** The crop's surviving region, back in pixels — what a reader can check by hand. */
function region(
  crop: NonNullable<ReturnType<typeof squareCrop>>,
  frame = FRAME,
) {
  return {
    left: crop.left * frame.width,
    top: crop.top * frame.height,
    width: frame.width * (1 - crop.left - crop.right),
    height: frame.height * (1 - crop.top - crop.bottom),
  };
}

describe("squareCrop", () => {
  it("crops to the product plus a margin, and stays square", () => {
    // Elmley Grey End Table as measured: a 139×195 product in a 400×400 frame.
    const box: TrimBox = { left: 130, top: 100, width: 139, height: 195 };
    const crop = squareCrop(box, FRAME);
    expect(crop).not.toBeNull();
    const r = region(crop!);
    // 195 / (1 - 0.12) = 221.6
    expect(r.width).toBeCloseTo(221.6, 0);
    expect(r.height).toBeCloseTo(221.6, 0);
    expect(r.width).toBeCloseTo(r.height, 4);
  });

  it("leaves the product centred in the crop", () => {
    const box: TrimBox = { left: 130, top: 100, width: 139, height: 195 };
    const r = region(squareCrop(box, FRAME)!);
    expect(r.left + r.width / 2).toBeCloseTo(130 + 139 / 2, 0);
    expect(r.top + r.height / 2).toBeCloseTo(100 + 195 / 2, 0);
  });

  it("keeps roughly the intended margin around the product", () => {
    const box: TrimBox = { left: 100, top: 100, width: 200, height: 200 };
    const r = region(squareCrop(box, FRAME)!);
    const marginPx = (r.width - 200) / 2;
    expect(marginPx / r.width).toBeCloseTo(MARGIN, 2);
  });

  it("never asks for a region larger than the photograph", () => {
    // A product that already fills its frame: expanding for a margin would need
    // pixels that were never photographed, and the CDN would letterbox instead.
    const box: TrimBox = { left: 0, top: 0, width: 400, height: 400 };
    expect(squareCrop(box, FRAME)).toBeNull();
  });

  it("slides the crop inside the frame rather than clipping it", () => {
    // Product hard against the right edge. Clipping would leave the product
    // off-centre in the tile; sliding keeps it centred.
    const box: TrimBox = { left: 320, top: 180, width: 80, height: 80 };
    const crop = squareCrop(box, FRAME)!;
    const r = region(crop);
    expect(crop.right).toBeGreaterThanOrEqual(0);
    expect(crop.left).toBeGreaterThanOrEqual(0);
    expect(r.left + r.width).toBeLessThanOrEqual(FRAME.width + 0.01);
  });

  it("declines a crop that would barely change anything", () => {
    // 380 of 400 — a 1.02x gain is not worth writing to 120 documents.
    expect(
      squareCrop({ left: 10, top: 10, width: 360, height: 360 }, FRAME),
    ).toBeNull();
  });

  it("refuses nonsense rather than producing a broken crop", () => {
    expect(
      squareCrop({ left: 0, top: 0, width: 0, height: 0 }, FRAME),
    ).toBeNull();
    expect(
      squareCrop(
        { left: 0, top: 0, width: 100, height: 100 },
        { width: 0, height: 0 },
      ),
    ).toBeNull();
  });

  it("never emits a negative or out-of-range fraction", () => {
    // Sanity would accept them and the CDN would return something unrecognisable.
    const boxes: TrimBox[] = [
      { left: 0, top: 0, width: 40, height: 300 },
      { left: 360, top: 0, width: 40, height: 40 },
      { left: 0, top: 360, width: 400, height: 40 },
      { left: 199, top: 199, width: 2, height: 2 },
    ];
    for (const box of boxes) {
      const crop = squareCrop(box, FRAME);
      if (!crop) continue;
      for (const side of ["top", "bottom", "left", "right"] as const) {
        expect(
          crop[side],
          `${side} of ${JSON.stringify(box)}`,
        ).toBeGreaterThanOrEqual(0);
        expect(crop[side], `${side} of ${JSON.stringify(box)}`).toBeLessThan(1);
      }
      expect(crop.left + crop.right).toBeLessThan(1);
      expect(crop.top + crop.bottom).toBeLessThan(1);
    }
  });

  it("works on a non-square photograph", () => {
    const crop = squareCrop(
      { left: 100, top: 50, width: 300, height: 200 },
      { width: 800, height: 400 },
    );
    const r = region(crop!, { width: 800, height: 400 });
    // Precision 1, not 3: the fractions are stored to four decimals, which on an
    // 800px frame quantises to 0.08px, so the two sides can differ by that much
    // while still being the same square.
    expect(r.width).toBeCloseTo(r.height, 1);
    expect(r.height).toBeLessThanOrEqual(400);
  });
});

describe("magnification", () => {
  it("reports how much bigger the product gets", () => {
    const crop = squareCrop(
      { left: 130, top: 100, width: 139, height: 195 },
      FRAME,
    )!;
    // 400 / 221.6 = 1.80
    expect(magnification(crop, FRAME)).toBeCloseTo(1.8, 1);
  });
});

describe("fullHotspot", () => {
  it("covers the whole crop", () => {
    // urlForImage ignores a crop unless a hotspot is present, so this is not
    // decoration — without it the crop has no effect at all.
    expect(fullHotspot()).toEqual({
      _type: "sanity.imageHotspot",
      x: 0.5,
      y: 0.5,
      width: 1,
      height: 1,
    });
  });
});
