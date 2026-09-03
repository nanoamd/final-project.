import { describe, expect, it } from "vitest";

import {
  FRONT_CLEARANCE_CM,
  SOFA_DEPTH_CM,
  SOFA_WIDTHS_CM,
  sofaSize,
  WALKWAY_CLEARANCE_CM,
} from "./sofa-size";

describe("sofaSize", () => {
  it("needs both measurements to say anything", () => {
    expect(sofaSize({})).toBeNull();
    expect(sofaSize({ wallWidth: 300 })).toBeNull();
    expect(sofaSize({ wallWidth: 0, roomDepth: 300 })).toBeNull();
    expect(sofaSize({ wallWidth: 300, roomDepth: -1 })).toBeNull();
  });

  it("fits everything in a generous room", () => {
    const result = sofaSize({ wallWidth: 400, roomDepth: 300 })!;
    expect(result.largestThatFits).toBe("fourSeater");
    expect(result.sizes.every((s) => s.fits)).toBe(true);
  });

  it("stops at 3-seater when the wall is too narrow for a 4-seater", () => {
    const result = sofaSize({ wallWidth: 220, roomDepth: 300 })!;
    expect(result.largestThatFits).toBe("threeSeater");
  });

  it("fails everything when the room is too shallow", () => {
    // Depth needs SOFA_DEPTH_CM + FRONT_CLEARANCE_CM to clear a 2-seater.
    const result = sofaSize({
      wallWidth: 400,
      roomDepth: SOFA_DEPTH_CM + FRONT_CLEARANCE_CM - 1,
    })!;
    expect(result.sizes.every((s) => !s.fits)).toBe(true);
  });

  it("demands more depth when the front doubles as a walkway", () => {
    const tight = sofaSize({
      wallWidth: 400,
      roomDepth: SOFA_DEPTH_CM + WALKWAY_CLEARANCE_CM - 1,
      frontIsWalkway: true,
    })!;
    const tightNoWalkway = sofaSize({
      wallWidth: 400,
      roomDepth: SOFA_DEPTH_CM + WALKWAY_CLEARANCE_CM - 1,
      frontIsWalkway: false,
    })!;
    expect(tight.sizes.find((s) => s.size === "threeSeater")!.fits).toBe(false);
    expect(
      tightNoWalkway.sizes.find((s) => s.size === "threeSeater")!.fits,
    ).toBe(true);
  });

  it("reports the front clearance a fitted size actually leaves", () => {
    const result = sofaSize({ wallWidth: 400, roomDepth: 250 })!;
    const threeSeater = result.sizes.find((s) => s.size === "threeSeater")!;
    expect(threeSeater.frontClearance).toBe(250 - SOFA_DEPTH_CM);
  });

  it("requires the wall to clear the nominal width, not just leave a sliver", () => {
    const result = sofaSize({
      wallWidth: SOFA_WIDTHS_CM.threeSeater - 1,
      roomDepth: 300,
    })!;
    expect(result.sizes.find((s) => s.size === "threeSeater")!.fits).toBe(
      false,
    );
  });

  it("names the next size up when one is out of reach", () => {
    const result = sofaSize({ wallWidth: 220, roomDepth: 300 })!;
    expect(result.notes.some((n) => n.includes("4-seater"))).toBe(true);
  });

  it("always flags that corner and chaise sofas are out of scope", () => {
    const result = sofaSize({ wallWidth: 400, roomDepth: 300 })!;
    expect(result.notes.some((n) => n.includes("corner"))).toBe(true);
  });

  it("every straight-sofa size is represented", () => {
    expect(Object.keys(SOFA_WIDTHS_CM).sort()).toEqual([
      "fourSeater",
      "threeSeater",
      "twoSeater",
    ]);
  });
});
