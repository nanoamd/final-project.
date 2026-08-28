import { describe, expect, it } from "vitest";

import { CIRCULATION_COMFORTABLE_CM, diningSpace } from "./dining-space";

describe("diningSpace", () => {
  it("says nothing without a space or a table", () => {
    expect(diningSpace({})).toBeNull();
    expect(diningSpace({ spaceWidth: 300 })).toBeNull();
    expect(diningSpace({ tableWidth: 90 })).toBeNull();
  });

  it("subtracts clearance from every side by default", () => {
    const result = diningSpace({ spaceWidth: 400, spaceLength: 500 })!;
    expect(result.maxTable).toEqual({
      width: 400 - CIRCULATION_COMFORTABLE_CM * 2,
      length: 500 - CIRCULATION_COMFORTABLE_CM * 2,
    });
  });

  it("only needs clearance on one side when against a wall", () => {
    const result = diningSpace({
      spaceWidth: 400,
      spaceLength: 500,
      againstWall: true,
    })!;
    expect(result.maxTable!.width).toBe(400 - CIRCULATION_COMFORTABLE_CM);
  });

  it("says so when nothing fits", () => {
    const result = diningSpace({ spaceWidth: 200, spaceLength: 200 })!;
    expect(result.maxTable).toBeUndefined();
    expect(result.notes.join(" ")).toMatch(/no table that fits/i);
  });

  it("counts seats on a rectangular table, losing the corners", () => {
    // 180cm long: 140cm of usable edge each side, so two per side plus two heads.
    const result = diningSpace({ tableWidth: 90, tableLength: 180 })!;
    expect(result.seats).toEqual({ comfortable: 6, maximum: 7 });
  });

  it("gives no head seats on a narrow table", () => {
    const narrow = diningSpace({ tableWidth: 70, tableLength: 180 })!;
    const wide = diningSpace({ tableWidth: 90, tableLength: 180 })!;
    expect(narrow.seats!.comfortable).toBeLessThan(wide.seats!.comfortable);
  });

  it("uses circumference for a round table", () => {
    // A 120cm round table is 377cm around, so six comfortably.
    const result = diningSpace({ tableWidth: 120, tableLength: 120 })!;
    expect(result.seats!.comfortable).toBe(6);
  });

  it("judges fit against the space", () => {
    expect(
      diningSpace({
        spaceWidth: 400,
        spaceLength: 500,
        tableWidth: 90,
        tableLength: 180,
      })!.fit,
    ).toBe("comfortable");
    expect(
      diningSpace({
        spaceWidth: 250,
        spaceLength: 340,
        tableWidth: 90,
        tableLength: 180,
      })!.fit,
    ).toBe("tight");
    expect(
      diningSpace({
        spaceWidth: 200,
        spaceLength: 220,
        tableWidth: 90,
        tableLength: 180,
      })!.fit,
    ).toBe("no");
  });

  it("suggests a round table when a rectangle will not fit", () => {
    const result = diningSpace({
      spaceWidth: 200,
      spaceLength: 220,
      tableWidth: 90,
      tableLength: 180,
    })!;
    expect(result.notes.join(" ")).toMatch(/round table/i);
  });
});
