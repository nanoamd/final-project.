import { describe, expect, it } from "vitest";

import {
  BREATHING_SPACE,
  DECORATIVE_CENTRE_CM,
  FUNCTIONAL_CENTRE_CM,
  wallClockSize,
} from "./wall-clock-size";

describe("wallClockSize", () => {
  it("needs the measurement its placement depends on", () => {
    expect(wallClockSize({ placement: "furniture" })).toBeNull();
    expect(wallClockSize({ placement: "wall" })).toBeNull();
    expect(wallClockSize({ placement: "kitchen" })).toBeNull();
    expect(
      wallClockSize({ placement: "furniture", furnitureWidth: 0 }),
    ).toBeNull();
    // The wrong measurement for the placement does not rescue it.
    expect(
      wallClockSize({ placement: "wall", furnitureWidth: 120 }),
    ).toBeNull();
  });

  it("sizes to roughly two-thirds of the furniture below", () => {
    const result = wallClockSize({
      placement: "furniture",
      furnitureWidth: 120,
    })!;
    expect(result.diameterRange).toEqual({ min: 65, max: 85 });
    expect(result.idealDiameter).toBe(75);
  });

  it("takes the wall run rather than the room on a bare wall", () => {
    // 200cm of usable wall takes a clock up to about 100cm, because the clock
    // wants half its own diameter clear on each side.
    const result = wallClockSize({ placement: "wall", wallWidth: 200 })!;
    expect(result.diameterRange.max).toBe(100);
    expect(result.idealDiameter).toBe(85);
  });

  it("reports the clear wall the recommended clock needs", () => {
    const result = wallClockSize({
      placement: "furniture",
      furnitureWidth: 120,
    })!;
    expect(result.wallNeeded).toBe(
      Math.round((result.idealDiameter * (1 + BREATHING_SPACE * 2)) / 5) * 5,
    );
  });

  it("hangs a clock you read higher than one you do not", () => {
    const functional = wallClockSize({
      placement: "furniture",
      furnitureWidth: 120,
      read: true,
    })!;
    const decorative = wallClockSize({
      placement: "furniture",
      furnitureWidth: 120,
      read: false,
    })!;
    expect(functional.centreHeight).toBe(FUNCTIONAL_CENTRE_CM.min);
    expect(decorative.centreHeight).toBe(DECORATIVE_CENTRE_CM);
    expect(functional.centreHeight).toBeGreaterThan(decorative.centreHeight);
  });

  it("defaults to a clock that gets read", () => {
    const result = wallClockSize({
      placement: "furniture",
      furnitureWidth: 120,
    })!;
    expect(result.centreHeight).toBe(FUNCTIONAL_CENTRE_CM.min);
  });

  it("works from the cabinet gap in a kitchen, not the floor", () => {
    const result = wallClockSize({ placement: "kitchen", cabinetGap: 60 })!;
    expect(result.diameterRange).toEqual({ min: 35, max: 50 });
    // Cabinets top out around 210cm, so the centre of a 60cm gap is 240cm.
    expect(result.centreHeight).toBe(240);
  });

  it("never recommends a clock larger than a tight cabinet gap", () => {
    const result = wallClockSize({ placement: "kitchen", cabinetGap: 30 })!;
    expect(result.diameterRange.max).toBeLessThan(30);
    expect(result.notes.join(" ")).toContain("small gap");
  });

  it("warns that a narrow console wants the clock centred on it", () => {
    const result = wallClockSize({
      placement: "furniture",
      furnitureWidth: 60,
    })!;
    expect(result.notes.join(" ")).toContain("centred on the furniture");
  });

  it("suggests a group rather than one clock over a very wide sideboard", () => {
    const result = wallClockSize({
      placement: "furniture",
      furnitureWidth: 200,
    })!;
    expect(result.notes.join(" ")).toContain("flanked");
  });

  it("tells a bare-wall shopper to measure the usable run", () => {
    const result = wallClockSize({ placement: "wall", wallWidth: 240 })!;
    expect(result.notes.join(" ")).toContain("corner to corner");
  });

  it("keeps the ideal inside the range it reports", () => {
    for (const width of [70, 90, 120, 150, 180, 220]) {
      const result = wallClockSize({
        placement: "furniture",
        furnitureWidth: width,
      })!;
      expect(result.idealDiameter).toBeGreaterThanOrEqual(
        result.diameterRange.min,
      );
      expect(result.idealDiameter).toBeLessThanOrEqual(
        result.diameterRange.max,
      );
    }
  });
});
