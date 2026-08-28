import { describe, expect, it } from "vitest";

import {
  MIN_HEADROOM_CM,
  OVER_TABLE_GAP_CM,
  pendantSize,
} from "./pendant-light";

describe("pendantSize", () => {
  it("needs either a table or a room to say anything", () => {
    expect(pendantSize({})).toBeNull();
    expect(pendantSize({ roomWidth: 300 })).toBeNull();
    expect(pendantSize({ ceilingHeight: 250 })).toBeNull();
  });

  it("lets the table decide when there is one", () => {
    // A 90cm table wants roughly half to two-thirds of its width.
    const result = pendantSize({ tableWidth: 90 })!;
    expect(result.basis).toBe("table");
    expect(result.diameter).toEqual({ min: 45, max: 59, ideal: 52 });
  });

  it("ignores the room when a table is given", () => {
    const withRoom = pendantSize({
      tableWidth: 90,
      roomWidth: 400,
      roomLength: 500,
    })!;
    expect(withRoom.basis).toBe("table");
    expect(withRoom.diameter.ideal).toBe(52);
  });

  it("uses the room when there is no table", () => {
    // 3.5m + 4.5m = 8, so 80cm.
    const result = pendantSize({ roomWidth: 350, roomLength: 450 })!;
    expect(result.basis).toBe("room");
    expect(result.diameter.ideal).toBe(80);
  });

  it("hangs over a table by the tabletop, not the floor", () => {
    const result = pendantSize({ tableWidth: 90 })!;
    expect(result.aboveTable).toEqual(OVER_TABLE_GAP_CM);
    expect(result.bottomAboveFloor).toBeUndefined();
  });

  it("keeps walkway headroom when there is no table", () => {
    const result = pendantSize({ roomWidth: 350, roomLength: 450 })!;
    expect(result.bottomAboveFloor).toBe(MIN_HEADROOM_CM);
  });

  it("drops further under a tall ceiling", () => {
    const tall = pendantSize({
      roomWidth: 350,
      roomLength: 450,
      ceilingHeight: 305,
    })!;
    expect(tall.bottomAboveFloor).toBeGreaterThan(MIN_HEADROOM_CM);
  });

  it("recommends a flush fitting under a low ceiling", () => {
    const low = pendantSize({
      roomWidth: 300,
      roomLength: 300,
      ceilingHeight: 225,
    })!;
    expect(low.notes.join(" ")).toMatch(/flush/i);
  });

  it("does not mention a ceiling it was not told about", () => {
    expect(pendantSize({ tableWidth: 90 })!.notes.join(" ")).not.toMatch(
      /ceiling/i,
    );
  });
});
