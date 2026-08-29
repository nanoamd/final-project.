import { describe, expect, it } from "vitest";

import { VASE_RATIO, vaseSize } from "./vase-size";

describe("vaseSize", () => {
  it("needs a vase or some stems to say anything", () => {
    expect(vaseSize({ neck: "medium" })).toBeNull();
    expect(
      vaseSize({ neck: "medium", vaseHeight: 0, stemLength: 0 }),
    ).toBeNull();
  });

  it("carries an arrangement of one and a half to twice the vase", () => {
    const result = vaseSize({ vaseHeight: 30, neck: "medium" })!;
    expect(result.arrangementHeight).toEqual({
      min: Math.round(30 / VASE_RATIO.max),
      max: 60,
    });
  });

  it("asks for stems longer than the arrangement stands", () => {
    const result = vaseSize({ vaseHeight: 30, neck: "medium" })!;
    expect(result.stemsToBuy).toEqual({ min: 51, max: 66 });
    expect(result.stemsToBuy.min).toBeGreaterThan(result.arrangementHeight.min);
  });

  it("counts stems by the neck rather than by the height", () => {
    const tall = vaseSize({ vaseHeight: 50, neck: "narrow" })!;
    const short = vaseSize({ vaseHeight: 15, neck: "narrow" })!;
    expect(tall.stemCount).toEqual(short.stemCount);
    expect(vaseSize({ vaseHeight: 30, neck: "wide" })!.stemCount).toEqual({
      min: 15,
      max: 20,
    });
  });

  it("works backwards from stems the shopper already has", () => {
    const result = vaseSize({ stemLength: 60, neck: "medium" })!;
    expect(result.suggestedVaseHeight).toBeDefined();
    expect(result.suggestedVaseHeight!.min).toBeLessThan(
      result.suggestedVaseHeight!.max,
    );
    // 60cm stems stand about 45-54cm, so the vase is roughly 23-36cm.
    expect(result.suggestedVaseHeight!.min).toBe(23);
    expect(result.suggestedVaseHeight!.max).toBe(36);
  });

  it("says when the stems in hand are short for the vase", () => {
    const result = vaseSize({
      vaseHeight: 40,
      stemLength: 40,
      neck: "medium",
    })!;
    expect(result.notes.join(" ")).toContain("short for this vase");
  });

  it("says when they are long for it", () => {
    const result = vaseSize({
      vaseHeight: 20,
      stemLength: 70,
      neck: "medium",
    })!;
    expect(result.notes.join(" ")).toContain("top-heavy");
  });

  it("confirms a match rather than staying silent", () => {
    const result = vaseSize({
      vaseHeight: 30,
      stemLength: 60,
      neck: "medium",
    })!;
    expect(result.notes.join(" ")).toContain("good match");
  });

  it("keeps anything from 30cm up off the dining table", () => {
    expect(
      vaseSize({ vaseHeight: 35, neck: "wide" })!.notes.join(" "),
    ).toContain("dining table");
    expect(
      vaseSize({ vaseHeight: 25, neck: "wide" })!.notes.join(" "),
    ).not.toContain("too tall for a dining table");
  });

  it("suggests branches once the vase is tall enough to need them", () => {
    expect(
      vaseSize({ vaseHeight: 50, neck: "narrow" })!.notes.join(" "),
    ).toContain("branches");
  });

  it("explains the neck every time, whichever way round the question came", () => {
    for (const neck of ["narrow", "medium", "wide"] as const) {
      expect(vaseSize({ vaseHeight: 30, neck })!.notes.length).toBeGreaterThan(
        1,
      );
      expect(vaseSize({ stemLength: 50, neck })!.notes.length).toBeGreaterThan(
        1,
      );
    }
  });
});
