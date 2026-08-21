// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ASKS_SOMETHING_ELSE, stripMarkdown } from "./fix-specs-and-markup";

describe("a label that mentions weight or size but means something else", () => {
  it("never fills a capacity from the product's own mass", () => {
    // "Weight capacity: 10 kg" derived from a 10kg shelf would tell a buyer
    // the shelf supports 10kg. It does not; it weighs 10kg.
    for (const label of [
      "Weight capacity",
      "Weight limit",
      "Maximum load",
      "Max screen size",
      "Internal size",
      "Packed dimensions",
      "Carton weight",
    ]) {
      expect(ASKS_SOMETHING_ELSE.test(label), label).toBe(true);
    }
  });

  it("still allows the plain labels", () => {
    for (const label of ["Weight", "Dimensions", "Size", "Measurements"]) {
      expect(ASKS_SOMETHING_ELSE.test(label), label).toBe(false);
    }
  });
});

describe("stripMarkdown keeps every figure exactly as written", () => {
  it("turns an asterisk list into prose without changing a number", () => {
    const before =
      "The dining table measures: * Length: 180 cm * Width: 77 cm * Height: 80 cm";
    const after = stripMarkdown(before);
    expect(after).not.toContain("*");
    for (const figure of ["180 cm", "77 cm", "80 cm"]) {
      expect(after, figure).toContain(figure);
    }
    expect(after).toBe(
      "The dining table measures: Length: 180 cm, Width: 77 cm, Height: 80 cm",
    );
  });

  it("removes bold markers but keeps the words", () => {
    expect(stripMarkdown("Made from **solid teak** throughout.")).toBe(
      "Made from solid teak throughout.",
    );
  });

  it("unwraps a link to its text", () => {
    expect(stripMarkdown("See our [returns policy](https://x.com/r).")).toBe(
      "See our returns policy.",
    );
  });

  it("decodes an entity that was showing literally", () => {
    expect(stripMarkdown("Glass Holder &amp; LED Lights")).toBe(
      "Glass Holder & LED Lights",
    );
  });

  it("leaves a footnote asterisk alone", () => {
    const text = "Delivery is free*. Teak greys within 12 months.";
    expect(stripMarkdown(text)).toBe(text);
  });

  it("leaves clean prose untouched", () => {
    const text = "Solid teak, finished with a light oil. It stands 90cm tall.";
    expect(stripMarkdown(text)).toBe(text);
  });
});
