import { describe, expect, it } from "vitest";

import { tvUnitSize } from "./tv-unit-size";

describe("tvUnitSize", () => {
  it("needs at least one input to say anything", () => {
    expect(tvUnitSize({})).toBeNull();
    expect(tvUnitSize({ viewingDistanceCm: 0 })).toBeNull();
    expect(tvUnitSize({ tvDiagonalIn: -1 })).toBeNull();
  });

  it("recommends a diagonal range from viewing distance alone", () => {
    const result = tvUnitSize({ viewingDistanceCm: 250 })!;
    expect(result.recommendedDiagonal).not.toBeNull();
    expect(result.unit).toBeNull();
    expect(result.distanceCheck).toBeNull();
    // Everyday: 250 / 2 to 250 / 1.5, in inches.
    expect(result.recommendedDiagonal!.everydayMinIn).toBe(
      Math.round(250 / 2 / 2.54),
    );
    expect(result.recommendedDiagonal!.everydayMaxIn).toBe(
      Math.round(250 / 1.5 / 2.54),
    );
  });

  it("matches THX's published figure for a 55in TV", () => {
    // THX: distance(ft) = diagonal(in) / 10, so 55in -> 5.5ft -> ~168cm.
    const result = tvUnitSize({ viewingDistanceCm: 168 })!;
    expect(result.recommendedDiagonal!.immersiveIn).toBeGreaterThanOrEqual(54);
    expect(result.recommendedDiagonal!.immersiveIn).toBeLessThanOrEqual(56);
  });

  it("computes screen width and unit width from a TV diagonal alone", () => {
    const result = tvUnitSize({ tvDiagonalIn: 65 })!;
    expect(result.unit).not.toBeNull();
    expect(result.recommendedDiagonal).toBeNull();
    // A 65in 16:9 TV is about 144cm wide.
    expect(result.unit!.screenWidthCm).toBeGreaterThanOrEqual(142);
    expect(result.unit!.screenWidthCm).toBeLessThanOrEqual(146);
    expect(result.unit!.unitWidthMinCm).toBe(result.unit!.screenWidthCm + 5);
    expect(result.unit!.unitWidthMaxCm).toBe(result.unit!.screenWidthCm + 20);
  });

  it("flags a TV sat too close for its size", () => {
    // A 75in TV's everyday minimum is 75 * 2.54 * 1.5 ~= 286cm.
    const result = tvUnitSize({ tvDiagonalIn: 75, viewingDistanceCm: 200 })!;
    expect(result.distanceCheck!.tooClose).toBe(true);
    expect(result.distanceCheck!.tooFar).toBe(false);
  });

  it("flags a TV sat too far for its size", () => {
    // A 43in TV's everyday maximum is 43 * 2.54 * 2 ~= 218cm.
    const result = tvUnitSize({ tvDiagonalIn: 43, viewingDistanceCm: 400 })!;
    expect(result.distanceCheck!.tooFar).toBe(true);
    expect(result.distanceCheck!.tooClose).toBe(false);
  });

  it("finds a distance within the everyday range for its size", () => {
    // A 65in TV's everyday range is ~248-330cm.
    const result = tvUnitSize({ tvDiagonalIn: 65, viewingDistanceCm: 280 })!;
    expect(result.distanceCheck!.tooClose).toBe(false);
    expect(result.distanceCheck!.tooFar).toBe(false);
  });

  it("always includes the mounting-height note once it has any result", () => {
    const result = tvUnitSize({ tvDiagonalIn: 55 })!;
    expect(result.notes.some((n) => n.includes("100-110cm"))).toBe(true);
  });
});
