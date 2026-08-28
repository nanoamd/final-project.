import { describe, expect, it } from "vitest";

import { btuToKw, kwToBtu, patioHeat } from "./patio-heat";

describe("kW and BTU conversion", () => {
  it("converts both ways with the real constant", () => {
    // A "50,000 BTU" fire pit is a 14.6kW appliance.
    expect(btuToKw(50000)).toBe(14.7);
    expect(kwToBtu(2.1)).toBe(7165);
  });
});

describe("patioHeat", () => {
  it("says nothing without an area or a rating", () => {
    expect(patioHeat({})).toBeNull();
  });

  it("sizes output to the area", () => {
    const result = patioHeat({ areaSqm: 10, shelter: "sheltered" })!;
    expect(result.needed!.kw).toBe(4);
  });

  it("asks for more output in an exposed spot", () => {
    const sheltered = patioHeat({ areaSqm: 10, shelter: "sheltered" })!;
    const exposed = patioHeat({ areaSqm: 10, shelter: "exposed" })!;
    expect(exposed.needed!.kw).toBeGreaterThan(sheltered.needed!.kw);
    expect(exposed.notes.join(" ")).toMatch(/screen or a hedge/i);
  });

  it("converts a rating the shopper is looking at", () => {
    const result = patioHeat({ rating: { value: 50000, unit: "btu" } })!;
    expect(result.converted).toEqual({ kw: 14.7, btu: 50000 });
  });

  it("judges a rating against the area when it has both", () => {
    expect(
      patioHeat({
        areaSqm: 10,
        shelter: "sheltered",
        rating: { value: 5, unit: "kw" },
      })!.verdict,
    ).toBe("enough");
    expect(
      patioHeat({
        areaSqm: 10,
        shelter: "sheltered",
        rating: { value: 1, unit: "kw" },
      })!.verdict,
    ).toBe("short");
  });

  it("gives no verdict without both halves", () => {
    expect(patioHeat({ areaSqm: 10 })!.verdict).toBeUndefined();
    expect(
      patioHeat({ rating: { value: 5, unit: "kw" } })!.verdict,
    ).toBeUndefined();
  });

  it("always says heat is line of sight, not air temperature", () => {
    expect(patioHeat({ areaSqm: 10 })!.notes.join(" ")).toMatch(
      /line of sight/i,
    );
  });
});
