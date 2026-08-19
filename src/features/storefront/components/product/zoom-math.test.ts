import { describe, expect, it } from "vitest";

import { clampOffset, panLimit, zoomToPoint } from "./zoom-math";

const STAGE = { width: 1000, height: 600 };

describe("panLimit", () => {
  it("allows no panning at all when not zoomed", () => {
    // Otherwise a stray drag nudges an un-zoomed photo off-centre for no reason.
    expect(panLimit(STAGE, 1)).toEqual({ x: 0, y: 0 });
  });

  it("grows with zoom, by half the extra size in each direction", () => {
    // At 2x the image is 1000px wider than the stage; 500px each way.
    expect(panLimit(STAGE, 2)).toEqual({ x: 500, y: 300 });
    expect(panLimit(STAGE, 2.5)).toEqual({ x: 750, y: 450 });
  });

  it("never returns a negative limit", () => {
    // A zoom below 1 should not invert the clamp and trap the offset.
    expect(panLimit(STAGE, 0.5)).toEqual({ x: 0, y: 0 });
  });
});

describe("clampOffset", () => {
  it("leaves an in-range offset alone", () => {
    expect(clampOffset({ x: 100, y: -50 }, STAGE, 2)).toEqual({
      x: 100,
      y: -50,
    });
  });

  it("stops the image being dragged off the stage", () => {
    expect(clampOffset({ x: 9999, y: -9999 }, STAGE, 2)).toEqual({
      x: 500,
      y: -300,
    });
  });

  it("pins the offset to centre when not zoomed", () => {
    expect(clampOffset({ x: 400, y: 400 }, STAGE, 1)).toEqual({ x: 0, y: 0 });
  });
});

describe("zoomToPoint", () => {
  it("does not move when the centre is clicked", () => {
    expect(
      zoomToPoint({ point: { x: 500, y: 300 }, stage: STAGE, zoom: 2.5 }),
    ).toEqual({ x: 0, y: 0 });
  });

  it("moves the clicked point towards the centre, not away from it", () => {
    // A click right of centre must shift the image left — the sign here is the
    // whole bug this file exists to prevent.
    const right = zoomToPoint({
      point: { x: 600, y: 300 },
      stage: STAGE,
      zoom: 2,
    });
    expect(right.x).toBeLessThan(0);

    const left = zoomToPoint({
      point: { x: 400, y: 300 },
      stage: STAGE,
      zoom: 2,
    });
    expect(left.x).toBeGreaterThan(0);

    const below = zoomToPoint({
      point: { x: 500, y: 500 },
      stage: STAGE,
      zoom: 2,
    });
    expect(below.y).toBeLessThan(0);
  });

  it("brings the clicked point exactly to the centre when there is room", () => {
    // 100px right of centre at 2x lands 200px right; -200 puts it back.
    expect(
      zoomToPoint({ point: { x: 600, y: 300 }, stage: STAGE, zoom: 2 }),
    ).toEqual({ x: -200, y: 0 });
  });

  it("clamps a corner click instead of revealing empty background", () => {
    // Top-left corner at 2x asks for +1000/+600; only 500/300 exist.
    expect(
      zoomToPoint({ point: { x: 0, y: 0 }, stage: STAGE, zoom: 2 }),
    ).toEqual({ x: 500, y: 300 });
  });

  it("handles a zero-sized stage without producing NaN", () => {
    // getBoundingClientRect can legitimately return zeroes mid-layout.
    const result = zoomToPoint({
      point: { x: 0, y: 0 },
      stage: { width: 0, height: 0 },
      zoom: 2.5,
    });
    expect(Number.isNaN(result.x)).toBe(false);
    expect(result).toEqual({ x: 0, y: 0 });
  });
});
