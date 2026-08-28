import { describe, expect, it } from "vitest";

import { planterSize } from "./planter-size";

describe("planterSize", () => {
  it("says nothing with neither a pot nor a plant", () => {
    expect(planterSize({})).toBeNull();
    expect(planterSize({ depth: 30 })).toBeNull();
  });

  it("calculates compost volume for a pot", () => {
    // 30cm across, 30cm deep, less 3cm headspace, times the taper factor.
    const result = planterSize({ diameter: 30, depth: 30 })!;
    expect(result.litres).toBe(15);
  });

  it("needs both diameter and depth for a volume", () => {
    expect(planterSize({ diameter: 30 })!.litres).toBeUndefined();
  });

  it("steps a small plant up gently", () => {
    const result = planterSize({ rootBall: 12 })!;
    expect(result.recommendedDiameter).toEqual({ min: 14, max: 16 });
  });

  it("allows a bigger step for a larger plant", () => {
    const result = planterSize({ rootBall: 30 })!;
    expect(result.recommendedDiameter).toEqual({ min: 35, max: 40 });
  });

  it("warns when the chosen pot is far too big for the plant", () => {
    const result = planterSize({ rootBall: 12, diameter: 40, depth: 40 })!;
    expect(result.notes.join(" ")).toMatch(/considerably wider/i);
  });

  it("does not warn when the pot is a sensible step up", () => {
    const result = planterSize({ rootBall: 12, diameter: 16, depth: 16 })!;
    expect(result.notes.join(" ")).not.toMatch(/considerably wider/i);
  });

  it("gives different drainage advice inside and out", () => {
    expect(
      planterSize({ diameter: 30, depth: 30, outdoors: true })!.notes.join(" "),
    ).toMatch(/drainage holes are not optional/i);
    expect(planterSize({ diameter: 30, depth: 30 })!.notes.join(" ")).toMatch(
      /cover pot/i,
    );
  });

  it("suggests bulking out a large planter", () => {
    expect(planterSize({ diameter: 60, depth: 60 })!.notes.join(" ")).toMatch(
      /fill the bottom third/i,
    );
  });
});
