import { describe, expect, it } from "vitest";

import {
  coffeeTableSize,
  DEFAULT_HEIGHT_CM,
  SOFA_GAP_CM,
  WALKWAY_MIN_CM,
} from "./coffee-table-size";

describe("coffeeTableSize", () => {
  it("needs a sofa length to say anything", () => {
    expect(coffeeTableSize({})).toBeNull();
    expect(coffeeTableSize({ sofaLength: 0 })).toBeNull();
    expect(coffeeTableSize({ sofaLength: -180 })).toBeNull();
  });

  it("sizes the table to two-thirds of the sofa", () => {
    const result = coffeeTableSize({ sofaLength: 180 })!;
    expect(result.idealLength).toBe(120);
    expect(result.lengthRange).toEqual({ min: 90, max: 135 });
  });

  it("falls back to the standard height with no seat height given", () => {
    const result = coffeeTableSize({ sofaLength: 180 })!;
    expect(result.idealHeight).toBe(DEFAULT_HEIGHT_CM);
    expect(result.heightRange).toEqual({ min: 40, max: 45 });
  });

  it("matches the seat height, never exceeding it", () => {
    const result = coffeeTableSize({ sofaLength: 180, sofaSeatHeight: 46 })!;
    expect(result.idealHeight).toBe(46);
    expect(result.heightRange).toEqual({ min: 41, max: 46 });
    expect(result.heightRange.max).toBeLessThanOrEqual(46);
  });

  it("caps the depth at what the floor leaves once the gap and route come out", () => {
    // 150cm of floor: 40 in front of the sofa, 45 to get past behind it,
    // leaves 65 of table.
    const result = coffeeTableSize({ sofaLength: 180, floorDepth: 150 })!;
    expect(result.maxDepthForRoom).toBe(150 - SOFA_GAP_CM - WALKWAY_MIN_CM);
    expect(result.tooTight).toBeUndefined();
  });

  it("flags a floor that cannot take a table at all", () => {
    const result = coffeeTableSize({ sofaLength: 180, floorDepth: 110 })!;
    expect(result.tooTight).toBe(true);
    expect(result.notes.join(" ")).toContain("round table");
  });

  it("never reports a negative depth to the shopper", () => {
    const result = coffeeTableSize({ sofaLength: 180, floorDepth: 60 })!;
    expect(result.tooTight).toBe(true);
    expect(result.notes.join(" ")).not.toMatch(/-\d+cm/);
  });

  it("suggests a round table in front of a small sofa", () => {
    const result = coffeeTableSize({ sofaLength: 130 })!;
    expect(result.notes.join(" ")).toContain("round table");
  });

  it("suggests two tables in front of a very long sofa", () => {
    const result = coffeeTableSize({ sofaLength: 260 })!;
    expect(result.notes.join(" ")).toContain("two smaller tables");
  });

  it("keeps the depth inside sane bounds at both extremes", () => {
    const tiny = coffeeTableSize({ sofaLength: 100 })!;
    const huge = coffeeTableSize({ sofaLength: 400 })!;
    expect(tiny.idealDepth).toBeGreaterThanOrEqual(42);
    expect(huge.idealDepth).toBeLessThanOrEqual(70);
    expect(tiny.depthRange.min).toBeLessThan(tiny.depthRange.max);
    expect(huge.depthRange.min).toBeLessThan(huge.depthRange.max);
  });

  it("always tells the shopper the gap in front of the sofa", () => {
    expect(coffeeTableSize({ sofaLength: 180 })!.notes.join(" ")).toContain(
      `${SOFA_GAP_CM}cm between the front of the sofa`,
    );
  });
});
