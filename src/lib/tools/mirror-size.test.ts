import { describe, expect, it } from "vitest";

import {
  GALLERY_CENTRE_CM,
  GAP_ABOVE_FURNITURE_CM,
  mirrorSize,
} from "./mirror-size";

describe("mirrorSize", () => {
  it("needs a furniture width to say anything", () => {
    expect(mirrorSize({})).toBeNull();
    expect(mirrorSize({ furnitureWidth: 0 })).toBeNull();
    expect(mirrorSize({ furnitureWidth: -10 })).toBeNull();
  });

  it("sizes the mirror to two-thirds of the furniture", () => {
    const result = mirrorSize({ furnitureWidth: 120 })!;
    expect(result.widthRange).toEqual({ min: 72, max: 90 });
    expect(result.idealWidth).toBe(84);
  });

  it("puts the bottom edge a deliberate gap above the furniture", () => {
    const result = mirrorSize({ furnitureWidth: 120, furnitureHeight: 80 })!;
    expect(result.bottomEdge).toBe(80 + GAP_ABOVE_FURNITURE_CM);
  });

  it("stacks the top edge on top of the bottom edge", () => {
    const result = mirrorSize({
      furnitureWidth: 120,
      furnitureHeight: 80,
      mirrorHeight: 70,
    })!;
    expect(result.topEdge).toBe(100 + 70);
  });

  it("falls back to the gallery convention with no furniture height", () => {
    // A mirror on a bare wall is centred at 145cm, so a 70cm mirror tops out
    // at 180cm.
    const result = mirrorSize({ furnitureWidth: 120, mirrorHeight: 70 })!;
    expect(result.topEdge).toBe(GALLERY_CENTRE_CM + 35);
    expect(result.bottomEdge).toBeUndefined();
  });

  it("suggests a round mirror on narrow furniture", () => {
    expect(mirrorSize({ furnitureWidth: 45 })!.notes.join(" ")).toMatch(
      /round/i,
    );
    expect(mirrorSize({ furnitureWidth: 120 })!.notes.join(" ")).not.toMatch(
      /round/i,
    );
  });

  it("suggests a pair on very wide furniture", () => {
    expect(mirrorSize({ furnitureWidth: 200 })!.notes.join(" ")).toMatch(
      /two matching mirrors/i,
    );
  });

  it("never invents a measurement it was not given", () => {
    const result = mirrorSize({ furnitureWidth: 120 })!;
    expect(result.bottomEdge).toBeUndefined();
    expect(result.topEdge).toBeUndefined();
    expect(result.notes.join(" ")).not.toMatch(/from the floor/i);
  });
});
