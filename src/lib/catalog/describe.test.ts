import { describe, expect, it } from "vitest";

import {
  type DescribeInput,
  describeProduct,
  familyFor,
  wordsIn,
} from "./describe";
import { AI_PHRASES } from "./quality";

const VASE: DescribeInput = {
  title: "Garda Grey Glazed Gisela Vase | Kaiku",
  slug: "garda-grey-glazed-gisela-vase",
  category: "Vases",
  dimensions: { height: 57, length: 17, width: 17, unit: "cm" },
  weight: { value: 3.2, unit: "kg" },
  material: "ceramic",
  colour: "grey",
  extra: { "Product Warning": "Use Florist Cellophane For Real Flowers" },
  deliveryLeadTime: "7–14 days",
};

describe("nothing is written that a fact does not support", () => {
  it("produces no copy at all for a product with no facts", () => {
    // The correct outcome. Padding this out is what produced 1,105-word
    // listings with no measurements in them.
    const sections = describeProduct({
      title: "Mystery Object | Kaiku",
      slug: "mystery-object",
      category: "Vases",
    });
    expect(sections.filter((s) => s.heading !== "Delivery")).toHaveLength(1);
  });

  it("omits weight entirely when none is recorded", () => {
    const sections = describeProduct({ ...VASE, weight: null });
    expect(JSON.stringify(sections)).not.toMatch(/weigh/i);
  });

  it("omits the material when the supplier and the name disagree", () => {
    // The Glass Candle Holder is named glass and recorded as stone. Until
    // somebody decides, neither goes into a sentence.
    const sections = describeProduct({ ...VASE, materialDisputed: true });
    expect(JSON.stringify(sections)).not.toMatch(/ceramic/i);
  });

  it("states the measurements it does hold", () => {
    const text = JSON.stringify(describeProduct(VASE));
    expect(text).toContain("57cm tall");
    expect(text).toContain("17cm across");
  });
});

describe("it cannot produce the filler it replaces", () => {
  const cases: DescribeInput[] = [
    VASE,
    {
      ...VASE,
      category: "Beds",
      title: "Pine Storage Bed | Kaiku",
      slug: "pine-bed",
    },
    {
      ...VASE,
      category: "Mirrors",
      title: "Antique Wall Mirror | Kaiku",
      slug: "antique-mirror",
    },
    {
      ...VASE,
      category: "Fire Pits & Heating",
      title: "Gas Fire Pit | Kaiku",
      slug: "gas-fire-pit",
    },
    {
      ...VASE,
      category: "Candles & Lanterns",
      title: "Stone Lantern | Kaiku",
      slug: "stone-lantern",
    },
  ];

  for (const input of cases) {
    it(`writes ${input.category} without a single filler phrase`, () => {
      const text = JSON.stringify(describeProduct(input)).toLowerCase();
      for (const phrase of AI_PHRASES) {
        expect(text, `${input.category} contained "${phrase}"`).not.toContain(
          phrase,
        );
      }
    });
  }

  it("stays well under the length that made the old copy useless", () => {
    for (const input of cases) {
      expect(wordsIn(describeProduct(input))).toBeLessThan(300);
    }
  });
});

describe("what matters differs by what the thing is", () => {
  it("tells a mirror buyer about fixings, by weight", () => {
    const heavy = JSON.stringify(
      describeProduct({
        ...VASE,
        category: "Mirrors",
        weight: { value: 14, unit: "kg" },
      }),
    );
    expect(heavy).toMatch(/stud|masonry/i);
  });

  it("tells a planter buyer about drainage", () => {
    expect(
      JSON.stringify(describeProduct({ ...VASE, category: "Planters" })),
    ).toMatch(/drainage/i);
  });

  it("tells a candle buyer it is not for a live flame", () => {
    const text = JSON.stringify(
      describeProduct({
        ...VASE,
        category: "Candles & Lanterns",
        extra: { "Candle Type": "Use With LED Faux Candles Only" },
      }),
    );
    expect(text).toMatch(/not designed to hold a burning wick/i);
  });

  it("warns about a two-person lift only when it is one", () => {
    const heavy = JSON.stringify(
      describeProduct({
        ...VASE,
        category: "Beds",
        weight: { value: 40, unit: "kg" },
      }),
    );
    const light = JSON.stringify(
      describeProduct({
        ...VASE,
        category: "Beds",
        weight: { value: 6, unit: "kg" },
      }),
    );
    expect(heavy).toMatch(/two-person lift/i);
    expect(light).not.toMatch(/two-person lift/i);
  });

  it("does not write a vase like a bed", () => {
    const vase = JSON.stringify(describeProduct(VASE));
    const bed = JSON.stringify(
      describeProduct({ ...VASE, category: "Beds", slug: "a-bed" }),
    );
    expect(vase).not.toBe(bed);
  });

  it("maps every catalogue category to a family", () => {
    for (const category of [
      "Vases",
      "Planters",
      "Candles & Lanterns",
      "Lighting",
      "Mirrors",
      "Beds",
      "Garden Furniture",
      "Outdoor Saunas",
    ]) {
      expect(typeof familyFor(category)).toBe("string");
    }
  });
});

describe("wording varies but never changes", () => {
  it("spreads openings across the catalogue rather than repeating one", () => {
    // Two given slugs may legitimately land on the same opening — with three
    // to choose from that happens a third of the time. What matters is that no
    // single phrasing dominates a whole category, which is how the old copy
    // came to read as one voice repeating itself.
    const openings = new Map<string, number>();
    for (let i = 0; i < 300; i++) {
      const sections = describeProduct({ ...VASE, slug: `product-${i}-vase` });
      const opening = `${sections[0]?.heading} | ${sections[0]?.paragraphs[0]?.slice(0, 24)}`;
      openings.set(opening, (openings.get(opening) ?? 0) + 1);
    }
    // Three headings x three sentence shapes, so every combination should be
    // reachable and none should take more than a quarter of the catalogue.
    expect(openings.size).toBeGreaterThanOrEqual(6);
    expect(Math.max(...openings.values())).toBeLessThan(300 * 0.25);
  });

  it("gives the same product the same words every time", () => {
    // Copy that changed on refresh would be a hydration mismatch.
    expect(describeProduct(VASE)).toEqual(describeProduct(VASE));
  });
});
