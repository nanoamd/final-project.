import { describe, expect, it } from "vitest";

import {
  GALLERY_CENTRE_CM,
  GAP_ABOVE_FURNITURE_CM,
  wallArtSize,
} from "./wall-art-size";

describe("wallArtSize", () => {
  it("needs the matching measurement for its placement", () => {
    expect(wallArtSize({ placement: "furniture" })).toBeNull();
    expect(
      wallArtSize({ placement: "furniture", furnitureWidth: 0 }),
    ).toBeNull();
    expect(wallArtSize({ placement: "wall" })).toBeNull();
    expect(wallArtSize({ placement: "wall", wallWidth: -5 })).toBeNull();
  });

  it("sizes a single piece to two-thirds of the furniture below it", () => {
    const result = wallArtSize({
      placement: "furniture",
      furnitureWidth: 150,
    })!;
    expect(result.widthRange).toEqual({ min: 90, max: 113 });
    expect(result.idealWidth).toBe(Math.round((90 + 113) / 2));
  });

  it("sizes bare-wall art to a proportion of the usable run", () => {
    const result = wallArtSize({ placement: "wall", wallWidth: 200 })!;
    expect(result.widthRange).toEqual({ min: 100, max: 150 });
  });

  it("applies the identical width proportion to a gallery arrangement", () => {
    const single = wallArtSize({
      placement: "furniture",
      furnitureWidth: 150,
    })!;
    const gallery = wallArtSize({
      placement: "furniture",
      furnitureWidth: 150,
      isGallery: true,
    })!;
    expect(gallery.widthRange).toEqual(single.widthRange);
    expect(gallery.idealWidth).toBe(single.idealWidth);
  });

  it("adds gallery-specific spacing notes only when isGallery is set", () => {
    const single = wallArtSize({ placement: "wall", wallWidth: 200 })!;
    const gallery = wallArtSize({
      placement: "wall",
      wallWidth: 200,
      isGallery: true,
    })!;
    expect(
      single.notes.some((n) => n.includes("Space individual frames")),
    ).toBe(false);
    expect(
      gallery.notes.some((n) => n.includes("Space individual frames")),
    ).toBe(true);
  });

  it("computes the bottom edge from furniture height, matching the mirror calculator's gap", () => {
    const result = wallArtSize({
      placement: "furniture",
      furnitureWidth: 150,
      furnitureHeight: 80,
    })!;
    expect(result.bottomEdge).toBe(80 + GAP_ABOVE_FURNITURE_CM);
  });

  it("falls back to the gallery centre convention with nothing beneath it", () => {
    const result = wallArtSize({ placement: "wall", wallWidth: 200 })!;
    expect(result.bottomEdge).toBeUndefined();
    expect(result.notes.some((n) => n.includes(`${GALLERY_CENTRE_CM}cm`))).toBe(
      true,
    );
  });
});
