import { describe, expect, it } from "vitest";

import {
  type Block,
  cleanSentence,
  dominantMaterial,
  hasPercentages,
  stripPercentages,
  stripPercentagesFromBlocks,
} from "./percentages";

describe("stripPercentages", () => {
  it("removes the numbers and keeps the materials", () => {
    // The summary Damien objected to.
    expect(
      stripPercentages(
        "The Honna Small White Silver Ceramic Planter is a beautifully crafted piece made of 90% stoneware and 10% plating.",
      ),
    ).toBe(
      "The Honna Small White Silver Ceramic Planter is a beautifully crafted piece made of stoneware and plating.",
    );
  });

  it("handles a bare 100%", () => {
    expect(
      stripPercentages(
        "The basket is crafted from 100% iron with a matt finish.",
      ),
    ).toBe("The basket is crafted from iron with a matt finish.");
  });

  it("handles percentages in brackets", () => {
    expect(
      stripPercentages(
        "This mirror features a frame composed of MDF (10%), glass (40%) and oak wood (50%).",
      ),
    ).toBe("This mirror features a frame composed of MDF, glass and oak wood.");
  });

  it("handles a colon-led composition list", () => {
    expect(
      stripPercentages(
        "The frame is constructed from a combination of materials: 10% MDF, 50% polyurethane and 40% steel.",
      ),
    ).toBe(
      "The frame is constructed from a combination of materials: MDF, polyurethane and steel.",
    );
  });

  it("drops only the clause that needs its number", () => {
    // "constructed from carbon steel" is a real fact and must survive.
    expect(
      stripPercentages(
        "This roasting tin is constructed from high-quality carbon steel, comprising 95% of the material.",
      ),
    ).toBe("This roasting tin is constructed from high-quality carbon steel.");
  });

  it("drops a composition list that is all zeroes", () => {
    expect(stripPercentages("Materials: MDF 0%, Mirrored Glass 0%")).toBe("");
  });

  it("drops a sentence that is nothing but the percentage claim", () => {
    expect(stripPercentages("Comprising 95% of the material.")).toBe("");
  });

  it("leaves copy with no percentages exactly as it is", () => {
    const clean = "It measures 15cm across and needs no assembly.";
    expect(stripPercentages(clean)).toBe(clean);
  });

  it("never leaves a percentage behind", () => {
    for (const awkward of [
      "Made of 90% stoneware, 5% plating, 5% other materials.",
      "Iron 60%, brass 40%.",
      "It is 50 % cotton.",
    ])
      expect(hasPercentages(stripPercentages(awkward))).toBe(false);
  });

  it("does not mistake other numbers for a composition", () => {
    const sizes = "It stands 45cm tall and weighs 2.5kg, and holds 3 litres.";
    expect(stripPercentages(sizes)).toBe(sizes);
  });
});

describe("cleanSentence", () => {
  it("returns null rather than a fragment", () => {
    expect(cleanSentence("90% iron.")).toBeNull();
  });

  it("passes a clean sentence straight through", () => {
    expect(cleanSentence("Solid oak throughout.")).toBe(
      "Solid oak throughout.",
    );
  });
});

describe("stripPercentagesFromBlocks", () => {
  const para = (text: string, key = "p1"): Block => ({
    _type: "block",
    _key: key,
    style: "normal",
    children: [{ _type: "span", _key: `${key}-s`, text }],
  });
  const textOf = (b: Block) => (b.children ?? []).map((c) => c.text).join("");

  it("cleans the blocks that need it and leaves the rest", () => {
    const { blocks, changed } = stripPercentagesFromBlocks([
      para("Made of 90% stoneware and 10% plating.", "a"),
      para("It needs no assembly.", "b"),
    ]);
    expect(blocks.map(textOf)).toEqual([
      "Made of stoneware and plating.",
      "It needs no assembly.",
    ]);
    expect(changed).toHaveLength(1);
  });

  it("drops a block left with nothing", () => {
    const { blocks } = stripPercentagesFromBlocks([
      para("Materials: MDF 0%, Mirrored Glass 0%", "a"),
      para("Solid oak throughout.", "b"),
    ]);
    expect(blocks.map(textOf)).toEqual(["Solid oak throughout."]);
  });

  it("keeps the block key so Sanity sees an edit", () => {
    const { blocks } = stripPercentagesFromBlocks([
      para("Crafted from 100% iron with a matt finish.", "keep-me"),
    ]);
    expect(blocks[0]!._key).toBe("keep-me");
  });

  it("copes with a non-array description", () => {
    expect(stripPercentagesFromBlocks(null).blocks).toEqual([]);
    expect(stripPercentagesFromBlocks("a string").blocks).toEqual([]);
  });
});

describe("dominantMaterial", () => {
  it("takes the largest real component", () => {
    expect(dominantMaterial("mdf 10%, mirror 40%, oak wood 50%")).toBe(
      "oak wood",
    );
    expect(dominantMaterial("carbon steel 90%,silicon 10%")).toBe(
      "carbon steel",
    );
  });

  it("ignores a component that is 0% of the product", () => {
    // "glass 0%,metal 100%" produced alt text calling a glass table glass 0%.
    expect(dominantMaterial("glass 0%,metal 100%")).toBe("metal");
  });

  it("drops supplier spreadsheet column names", () => {
    // "iron 100% cart weight" reached 467 products' image alt text.
    expect(dominantMaterial("iron 100% cart weight")).toBe("iron");
    expect(dominantMaterial("carbon steel 90%,silicon 10% cart weight")).toBe(
      "carbon steel",
    );
  });

  it("leaves a plain material alone", () => {
    expect(dominantMaterial("steel")).toBe("steel");
    expect(dominantMaterial("solid oak")).toBe("solid oak");
  });

  it("returns null rather than guess at a long component name", () => {
    expect(dominantMaterial("gold electroplating hardware leg 95%")).toBeNull();
    expect(dominantMaterial("")).toBeNull();
  });
});
