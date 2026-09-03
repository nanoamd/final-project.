import { describe, expect, it } from "vitest";

import {
  BED_WIDTHS_CM,
  bedSize,
  SIDE_CLEARANCE_CM,
  WALKWAY_CLEARANCE_CM,
} from "./bed-size";

describe("bedSize", () => {
  it("needs both measurements to say anything", () => {
    expect(bedSize({})).toBeNull();
    expect(bedSize({ wallWidth: 300 })).toBeNull();
    expect(bedSize({ wallWidth: 0, roomDepth: 300 })).toBeNull();
    expect(bedSize({ wallWidth: 300, roomDepth: -1 })).toBeNull();
  });

  it("fits everything in a generous room", () => {
    const result = bedSize({ wallWidth: 400, roomDepth: 400 })!;
    expect(result.largestThatFits).toBe("superking");
    expect(result.sizes.every((s) => s.fits)).toBe(true);
  });

  it("stops at King when the wall is too narrow for Super King", () => {
    // Super King needs 180cm + 60cm clearance = 240cm of wall.
    const result = bedSize({ wallWidth: 239, roomDepth: 400 })!;
    expect(result.largestThatFits).toBe("king");
  });

  it("fails everything when the room is too shallow", () => {
    // King is 200cm long; 200 + 60 clearance = 260cm needed.
    const result = bedSize({ wallWidth: 400, roomDepth: 259 })!;
    const king = result.sizes.find((s) => s.size === "king")!;
    expect(king.fits).toBe(false);
  });

  it("demands more depth when the foot doubles as a walkway", () => {
    const withWalkway = bedSize({
      wallWidth: 400,
      roomDepth: 200 + WALKWAY_CLEARANCE_CM,
      footIsWalkway: true,
    })!;
    const withoutWalkway = bedSize({
      wallWidth: 400,
      roomDepth: 200 + WALKWAY_CLEARANCE_CM,
      footIsWalkway: false,
    })!;
    expect(withWalkway.sizes.find((s) => s.size === "king")!.fits).toBe(true);
    expect(withoutWalkway.sizes.find((s) => s.size === "king")!.fits).toBe(
      true,
    );
    // One clearance short of the walkway figure: only the non-walkway case fits.
    const tight = bedSize({
      wallWidth: 400,
      roomDepth: 200 + WALKWAY_CLEARANCE_CM - 1,
      footIsWalkway: true,
    })!;
    const tightNoWalkway = bedSize({
      wallWidth: 400,
      roomDepth: 200 + WALKWAY_CLEARANCE_CM - 1,
      footIsWalkway: false,
    })!;
    expect(tight.sizes.find((s) => s.size === "king")!.fits).toBe(false);
    expect(tightNoWalkway.sizes.find((s) => s.size === "king")!.fits).toBe(
      true,
    );
  });

  it("reports the side clearance a fitted size actually leaves", () => {
    // King is 150cm wide; a 250cm wall leaves 100cm to split across both sides.
    const result = bedSize({ wallWidth: 250, roomDepth: 400 })!;
    const king = result.sizes.find((s) => s.size === "king")!;
    expect(king.sideClearance).toBe(100);
  });

  it("requires the minimum side clearance even when the width difference is positive but small", () => {
    // King is 150cm; 150 + 59cm of wall clears the mattress but not the
    // minimum walking clearance.
    const result = bedSize({
      wallWidth: 150 + SIDE_CLEARANCE_CM - 1,
      roomDepth: 400,
    })!;
    const king = result.sizes.find((s) => s.size === "king")!;
    expect(king.fits).toBe(false);
  });

  it("names the next size up and its shortfall when one is out of reach", () => {
    const result = bedSize({ wallWidth: 239, roomDepth: 400 })!;
    expect(result.notes.some((n) => n.includes("Super King"))).toBe(true);
  });

  it("every UK width is represented", () => {
    expect(Object.keys(BED_WIDTHS_CM).sort()).toEqual([
      "double",
      "king",
      "single",
      "superking",
    ]);
  });
});
