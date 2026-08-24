import { describe, expect, it } from "vitest";

import {
  type Block,
  cleanParagraph,
  isAdmission,
  stripAdmissions,
} from "./admissions";

const para = (text: string, key = "p1"): Block => ({
  _type: "block",
  _key: key,
  style: "normal",
  children: [{ _type: "span", _key: `${key}-s`, text }],
});
const heading = (text: string, key = "h1"): Block => ({
  _type: "block",
  _key: key,
  style: "h2",
  children: [{ _type: "span", _key: `${key}-s`, text }],
});
const textOf = (b: Block) => (b.children ?? []).map((c) => c.text).join("");

describe("isAdmission", () => {
  it("catches the sentence Damien found on a live page", () => {
    expect(
      isAdmission(
        "The details regarding assembly requirements or whether the Lennox Black 2 Door Side Cupboard arrives fully assembled or flat-packed are not listed.",
      ),
    ).toBe(true);
  });

  it("catches the deflection that followed it", () => {
    expect(
      isAdmission(
        "For further information, please refer to the supplied instruction manual or contact customer support.",
      ),
    ).toBe(true);
  });

  it("catches the other ways of saying it", () => {
    for (const sentence of [
      "The carton count is not provided.",
      "Material is not specified by the manufacturer.",
      "Weight is not stated.",
      "No information is available on the finish.",
      "The bulb type is unknown.",
      "Please enquire for delivery timescales.",
      "Check with the supplier for the exact shade.",
    ])
      expect(isAdmission(sentence)).toBe(true);
  });

  it("leaves real product copy alone", () => {
    for (const sentence of [
      "It measures 180cm wide and 75cm tall.",
      "Assembly is required, and the fixings are supplied.",
      "It is advisable to check your access points regarding width and height.",
      "The oak is left unfinished so it can be oiled to taste.",
      "Two people are needed to lift it safely.",
    ])
      expect(isAdmission(sentence)).toBe(false);
  });
});

describe("cleanParagraph", () => {
  it("keeps the useful sentence and drops the admission beside it", () => {
    // The exact paragraph from the Lennox page: one admission, one real
    // instruction. Dropping the whole paragraph loses the only useful part.
    const cleaned = cleanParagraph(
      "The specifics on the number of cartons it ships in and their sizes are also not provided. It is advisable to check your access points regarding width and height to ensure a smooth delivery process.",
    );
    expect(cleaned).toBe(
      "It is advisable to check your access points regarding width and height to ensure a smooth delivery process.",
    );
  });

  it("returns nothing when the whole paragraph is an admission", () => {
    expect(
      cleanParagraph(
        "The details regarding assembly are not listed. For further information, please refer to the supplied instruction manual or contact customer support.",
      ),
    ).toBe("");
  });

  it("leaves a clean paragraph untouched", () => {
    const good = "It measures 180cm wide. Two people are needed to lift it.";
    expect(cleanParagraph(good)).toBe(good);
  });
});

describe("stripAdmissions", () => {
  it("removes the paragraph and keeps the heading that still has content", () => {
    const { blocks, removed } = stripAdmissions([
      heading("Assembly and Delivery Access"),
      para(
        "The details regarding assembly are not listed. For further information, please refer to the supplied instruction manual or contact customer support.",
        "p1",
      ),
      para(
        "The specifics on the number of cartons are also not provided. It is advisable to check your access points.",
        "p2",
      ),
      heading("Materials, Finish and Construction", "h2"),
      para("The frame is solid oak.", "p3"),
    ]);
    expect(blocks.map(textOf)).toEqual([
      "Assembly and Delivery Access",
      "It is advisable to check your access points.",
      "Materials, Finish and Construction",
      "The frame is solid oak.",
    ]);
    expect(removed).toHaveLength(3);
  });

  it("drops a heading left with nothing beneath it", () => {
    const { blocks, emptiedHeadings } = stripAdmissions([
      heading("Dimensions"),
      para("Exact dimensions are not provided.", "p1"),
      heading("Materials", "h2"),
      para("Solid oak throughout.", "p2"),
    ]);
    expect(blocks.map(textOf)).toEqual(["Materials", "Solid oak throughout."]);
    expect(emptiedHeadings).toEqual(["Dimensions"]);
  });

  it("drops a trailing heading with nothing after it", () => {
    const { blocks } = stripAdmissions([
      para("Solid oak throughout.", "p1"),
      heading("Delivery"),
      para("Lead time is not stated.", "p2"),
    ]);
    expect(blocks.map(textOf)).toEqual(["Solid oak throughout."]);
  });

  it("keeps the block key so Sanity sees an edit, not a delete", () => {
    const { blocks } = stripAdmissions([
      para("Carton count is not provided. It ships flat-packed.", "keep-me"),
    ]);
    expect(blocks[0]!._key).toBe("keep-me");
    expect(textOf(blocks[0]!)).toBe("It ships flat-packed.");
  });

  it("changes nothing in a description with no admissions", () => {
    const input = [heading("Materials"), para("Solid oak throughout.", "p1")];
    const { blocks, removed, emptiedHeadings } = stripAdmissions(input);
    expect(blocks).toEqual(input);
    expect(removed).toEqual([]);
    expect(emptiedHeadings).toEqual([]);
  });

  it("copes with a missing or non-array description", () => {
    expect(stripAdmissions(null).blocks).toEqual([]);
    expect(stripAdmissions(undefined).blocks).toEqual([]);
    expect(stripAdmissions("a string").blocks).toEqual([]);
  });

  it("leaves list items and non-block content alone", () => {
    const image = { _type: "image", _key: "img1" };
    const bullet: Block = {
      _type: "block",
      _key: "b1",
      style: "normal",
      listItem: "bullet",
      children: [{ _type: "span", _key: "b1-s", text: "Solid oak" }],
    };
    const { blocks } = stripAdmissions([image as Block, bullet]);
    expect(blocks).toHaveLength(2);
  });
});
