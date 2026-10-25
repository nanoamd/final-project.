import { describe, expect, it } from "vitest";

import { parseCsv, statusFor } from "./sync-hill-stock";

describe("statusFor", () => {
  it("is In Stock only when there is stock and the line is active", () => {
    expect(statusFor(10, "ACT")).toBe("In Stock");
  });

  it("is Out of Stock at zero — the Mistora case", () => {
    // Sold on 25 October with the site saying In Stock. Hill had none until
    // 26 January 2027.
    expect(statusFor(0, "ACT")).toBe("Out of Stock");
  });

  it("is Out of Stock for a discontinued line even if a number lingers", () => {
    expect(statusFor(4, "DIS")).toBe("Out of Stock");
    expect(statusFor(4, "")).toBe("Out of Stock");
  });

  it("ignores case and padding on the status column", () => {
    expect(statusFor(3, " act ")).toBe("In Stock");
  });

  it("never invents Backorder — the feed carries no restock date", () => {
    // "Backorder" tells a shopper a date is known. It is not.
    for (const s of [statusFor(0, "ACT"), statusFor(0, "DIS")])
      expect(["In Stock", "Out of Stock"]).toContain(s);
  });
});

describe("parseCsv", () => {
  it("keeps commas inside quoted fields", () => {
    expect(parseCsv('a,"b,c",d')).toEqual([["a", "b,c", "d"]]);
  });

  it("handles doubled quotes and CRLF", () => {
    expect(parseCsv('x,"say ""hi""",z\r\n1,2,3')).toEqual([
      ["x", 'say "hi"', "z"],
      ["1", "2", "3"],
    ]);
  });

  it("drops blank lines rather than emitting empty rows", () => {
    expect(parseCsv("a,b\n\nc,d\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});
