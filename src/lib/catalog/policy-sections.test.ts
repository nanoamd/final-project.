import { describe, expect, it } from "vitest";

import {
  type Block,
  describesTheProduct,
  isPolicyHeading,
  stripPolicySections,
} from "./policy-sections";

const h = (text: string, level = 2, key = "h"): Block => ({
  _type: "block",
  _key: `${key}-${text.slice(0, 4)}`,
  style: `h${level}`,
  children: [{ _type: "span", _key: "s", text }],
});
const p = (text: string, key = "p"): Block => ({
  _type: "block",
  _key: `${key}-${text.slice(0, 4)}`,
  style: "normal",
  children: [{ _type: "span", _key: "s", text }],
});
const textOf = (b: Block) => (b.children ?? []).map((c) => c.text).join("");

describe("isPolicyHeading", () => {
  it("knows site policy", () => {
    for (const heading of [
      "Delivery",
      "Returns",
      "Delivery & Returns",
      "Delivery, Returns & Warranty",
      "Warranty",
      "Refunds",
      "Payment",
      "Customer Support",
    ])
      expect(isPolicyHeading(heading)).toBe(true);
  });

  it("leaves product-specific headings alone", () => {
    // These belong on the page — they are about this product, not our policy.
    for (const heading of [
      "Assembly and Delivery Access",
      "Care & Maintenance",
      "Materials, Finish and Construction",
      "What's in the Set",
      "Site and Base Requirements",
      "Dimensions",
    ])
      expect(isPolicyHeading(heading)).toBe(false);
  });
});

describe("stripPolicySections", () => {
  it("removes the heading and everything under it", () => {
    const { blocks, removedSections } = stripPolicySections([
      h("Materials"),
      p("Powder-coated steel throughout."),
      h("Delivery"),
      p("Your order will be carefully packaged before dispatch."),
      p("Please inspect your order upon arrival."),
      h("Returns"),
      p("You may return your item within 14 days."),
    ]);
    expect(blocks.map(textOf)).toEqual([
      "Materials",
      "Powder-coated steel throughout.",
    ]);
    expect(removedSections).toEqual(["Delivery", "Returns"]);
  });

  it("stops dropping at the next real heading", () => {
    const { blocks } = stripPolicySections([
      h("Delivery"),
      p("Carefully packaged."),
      h("Care & Maintenance"),
      p("Wipe down with a damp cloth."),
    ]);
    expect(blocks.map(textOf)).toEqual([
      "Care & Maintenance",
      "Wipe down with a damp cloth.",
    ]);
  });

  it("does not let a deeper heading end the section", () => {
    // An h3 inside the Delivery section is part of it.
    const { blocks } = stripPolicySections([
      h("Delivery", 2),
      h("Lead times", 3),
      p("Dispatched within 3-4 weeks."),
      h("Materials", 2),
      p("Steel."),
    ]);
    expect(blocks.map(textOf)).toEqual(["Materials", "Steel."]);
  });

  it("counts what it removed", () => {
    const { wordsRemoved } = stripPolicySections([
      h("Delivery"),
      p("One two three four five."),
    ]);
    expect(wordsRemoved).toBe(6);
  });

  it("changes nothing when there is no policy", () => {
    const input = [h("Materials"), p("Steel.")];
    const { blocks, removedSections } = stripPolicySections(input);
    expect(blocks).toEqual(input);
    expect(removedSections).toEqual([]);
  });

  it("copes with a non-array description", () => {
    expect(stripPolicySections(null).blocks).toEqual([]);
    expect(stripPolicySections("text").blocks).toEqual([]);
  });
});

describe("describesTheProduct", () => {
  it("says no to a parts list and a returns policy", () => {
    // The exact page Damien found: this passed the readiness check because
    // boilerplate is words and words were what the scorer counted.
    expect(
      describesTheProduct([
        h("What's in the Set"),
        p("- 1 x Rectangular Dining Table"),
        p("- 6 x Stackable Armchairs"),
        h("Delivery"),
        p("Carefully packaged before dispatch."),
        h("Returns"),
        p("Return within 14 days."),
      ]),
    ).toBe(false);
  });

  it("says yes when something is actually described", () => {
    expect(
      describesTheProduct([
        h("What's in the Set"),
        p("- 6 x Stackable Armchairs"),
        h("Materials and Finish"),
        p("Powder-coated steel with a woven rope seat."),
        h("Delivery"),
        p("Carefully packaged."),
      ]),
    ).toBe(true);
  });

  it("accepts unstructured prose if there is enough of it", () => {
    const long = p(
      "This dining set seats six around a rectangular table. The frame is powder-coated steel and the seats are woven rope, which stays comfortable without cushions and dries quickly after rain.",
    );
    expect(describesTheProduct([long])).toBe(true);
    expect(describesTheProduct([p("A dining set.")])).toBe(false);
  });

  it("says no to an empty or missing description", () => {
    expect(describesTheProduct([])).toBe(false);
    expect(describesTheProduct(null)).toBe(false);
  });
});
