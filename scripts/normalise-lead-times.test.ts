import { describe, expect, it } from "vitest";

import { normaliseLeadTime } from "./normalise-lead-times";

/** Every fixture is a value that was actually in the catalogue. */
describe("normaliseLeadTime", () => {
  it("trims trailing whitespace, which was splitting one value into two", () => {
    expect(normaliseLeadTime("2-4 weeks ")).toEqual({ value: "2–4 weeks" });
    expect(normaliseLeadTime("2-4 weeks")).toEqual({ value: "2–4 weeks" });
  });

  it("drops a stray digit typed after the unit", () => {
    expect(normaliseLeadTime("4-6 weeks4")).toEqual({ value: "4–6 weeks" });
  });

  it("turns process wording into a lead time", () => {
    expect(normaliseLeadTime("2-4 week dispatch")).toEqual({
      value: "2–4 weeks",
    });
    expect(normaliseLeadTime("2-5 days shipping time ")).toEqual({
      value: "2–5 days",
    });
  });

  it("resolves the two bare ranges using their siblings' unit", () => {
    // Rendered as "Delivered in 4-6" on two SaunaPlunge product pages.
    expect(normaliseLeadTime("4-6")).toEqual({ value: "4–6 weeks" });
  });

  it("refuses to guess a unit it has not been told", () => {
    const result = normaliseLeadTime("10-12");
    expect(result).toHaveProperty("skip");
  });

  it("leaves an already-correct value untouched", () => {
    expect(normaliseLeadTime("3–4 weeks")).toEqual({ value: "3–4 weeks" });
    expect(normaliseLeadTime("4–8 weeks")).toEqual({ value: "4–8 weeks" });
  });

  it("uses an en dash whichever dash was typed", () => {
    expect(normaliseLeadTime("7-14 days ")).toEqual({ value: "7–14 days" });
  });

  it("pluralises a range's unit", () => {
    expect(normaliseLeadTime("1-2 week")).toEqual({ value: "1–2 weeks" });
  });
});
