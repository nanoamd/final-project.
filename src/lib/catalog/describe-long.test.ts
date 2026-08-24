import { describe, expect, it } from "vitest";

import {
  describeLong,
  type LongFormInput,
  type LongSection,
  longWordCount,
  trimToSubstance,
} from "./describe-long";
import { FACT_PATTERN } from "./quality";

/** A product we hold real measurements for — the case that earns full length. */
const pergola: LongFormInput = {
  title: "Lean-To Steel Pergola with Sliding Canopy, Dark Grey | Kaiku",
  slug: "lean-to-steel-pergola-with-sliding-canopy-dark-grey",
  category: "Pergolas",
  dimensions: { length: 297, width: 397, height: 220, unit: "cm" },
  weight: { value: 27.5, unit: "kg" },
  material: "steel",
  colour: "dark grey",
  deliveryLeadTime: "3-4 weeks",
};

/** The same shape indoors, to catch garden vocabulary leaking the other way. */
const sofa: LongFormInput = {
  title: "Sorelle Two Seater Sofa with Cushions | Kaiku",
  slug: "sorelle-two-seater-sofa-with-cushions",
  category: "Sofas",
  dimensions: { length: 85, width: 197, height: 78, unit: "cm" },
  weight: { value: 34, unit: "kg" },
  material: "fabric",
  colour: "white",
};

function text(sections: LongSection[]): string {
  return sections
    .flatMap((s) => [
      s.heading,
      ...s.paragraphs,
      ...(s.list ? [s.list.intro, ...s.list.items] : []),
      ...(s.close ? [s.close] : []),
    ])
    .join("\n");
}

describe("describeLong", () => {
  it("reaches the length of the page Damien pointed at", () => {
    // The Sorelle Two Seater Sofa runs to 1,628 words and is the benchmark.
    // A product we hold full measurements for should land in the same region,
    // not at the 300 words a short generator produces.
    expect(longWordCount(describeLong(pergola))).toBeGreaterThan(1200);
    expect(longWordCount(describeLong(sofa))).toBeGreaterThan(1200);
  });

  it("never calls a garden a room", () => {
    // The first draft told a pergola buyer how the piece would read "in the
    // room" and how to keep "a room feeling generous". "Room to spare" and
    // "outdoor room" are ordinary English and stay.
    const body = text(describeLong(pergola)).toLowerCase();
    for (const wrong of [
      "in the room",
      "a room feeling",
      "across the room",
      "the room can",
      "register in a room",
      "smaller room",
    ])
      expect(body).not.toContain(wrong);
  });

  it("never sends indoor materials outside", () => {
    // Steel indoors pairs with linen, leather and marble. Steel in a garden
    // does not, and pairing lists that ignore that are simply wrong advice.
    const body = text(describeLong(pergola)).toLowerCase();
    for (const indoors of [
      "linen",
      "leather",
      "marble",
      "velvet",
      "woven rugs",
    ])
      expect(body).not.toContain(indoors);
  });

  it("keeps garden vocabulary out of an indoor product", () => {
    const body = text(describeLong(sofa)).toLowerCase();
    for (const outdoors of ["paving", "gravel", "shingle", "planting scheme"])
      expect(body).not.toContain(outdoors);
  });

  it("uses the short name after introducing the full one", () => {
    const sections = describeLong(pergola);
    // The full 60-character name in every paragraph is what makes generated
    // copy unmistakable.
    expect(sections[0]!.paragraphs[0]).toContain(
      "Lean-To Steel Pergola with Sliding Canopy, Dark Grey",
    );
    const rest = text(sections.slice(1));
    expect(rest).toContain("the Lean-To Steel Pergola");
    expect(rest).not.toContain("Sliding Canopy, Dark Grey");
  });

  it("drops the ' | Kaiku' suffix from the prose, not from the title", () => {
    expect(text(describeLong(pergola))).not.toContain("| Kaiku");
  });

  it("states only measurements the product records", () => {
    const body = text(describeLong(pergola));
    for (const figure of ["397cm", "220cm", "297", "27.5kg"])
      expect(body).toContain(figure);
    // Nothing invented: every number in the copy is one of ours. No word
    // boundary after the digits — "397cm" has none, and requiring one is how
    // this check silently passed while reading almost nothing.
    const numbers = body.match(/\d+(?:\.\d+)?/g) ?? [];
    const known = new Set([
      "297", // depth
      "397", // width
      "220", // height
      "27.5", // weight
      "3", // lead time, "3-4 weeks"
      "4",
    ]);
    const unknown = numbers.filter((n) => !known.has(n));
    expect(unknown).toEqual([]);
  });

  it("says nothing about material when the material is disputed", () => {
    const sections = describeLong({ ...pergola, materialDisputed: true });
    expect(text(sections).toLowerCase()).not.toContain("steel construction");
  });

  it("puts the closing line after its list, not before it", () => {
    // The Sorelle ends a section with the list, then one line telling you what
    // to do with it. Pushing that line into `paragraphs` prints it first.
    const withClose = describeLong(pergola).find((s) => s.close);
    expect(withClose).toBeDefined();
    expect(withClose!.paragraphs).not.toContain(withClose!.close);
  });

  it("varies its headings between products", () => {
    const a = describeLong(pergola).map((s) => s.heading);
    const b = describeLong({
      ...pergola,
      slug: "another-pergola-entirely",
    }).map((s) => s.heading);
    expect(a).not.toEqual(b);
  });

  it("carries the lead time without altering it", () => {
    const delivery = describeLong(pergola).find(
      (s) => s.heading === "Delivery",
    );
    expect(delivery!.paragraphs.join(" ")).toContain("3-4 weeks");
  });
});

describe("trimToSubstance", () => {
  const dense: LongSection = {
    heading: "Measurements",
    paragraphs: ["It is 200cm wide, 90cm deep, 75cm tall and weighs 40kg."],
  };
  const padding = (n: number): LongSection => ({
    heading: `Styling ${n}`,
    optional: true,
    paragraphs: [
      Array(120).fill("styling advice with no figure in it").join(" "),
    ],
  });

  it("removes styling sections when length is not earned by fact", () => {
    const trimmed = trimToSubstance([
      dense,
      padding(1),
      padding(2),
      padding(3),
    ]);
    expect(trimmed.length).toBeLessThan(4);
    expect(trimmed[0]!.heading).toBe("Measurements");
  });

  it("keeps every section when the page is dense enough", () => {
    const facty = Array.from({ length: 12 }, (_, i) => ({
      heading: `Part ${i}`,
      optional: true,
      paragraphs: [`This part is 100cm wide and weighs ${i + 1}kg.`],
    }));
    expect(trimToSubstance([dense, ...facty])).toHaveLength(13);
  });

  it("never trims a section that is not optional", () => {
    const core = Array.from({ length: 10 }, (_, i) => ({
      heading: `Core ${i}`,
      paragraphs: [Array(120).fill("no figures here at all").join(" ")],
    }));
    expect(trimToSubstance(core)).toHaveLength(10);
  });

  it("strips the internal marker from what it returns", () => {
    const [first] = trimToSubstance([dense, padding(1)]);
    expect(first).not.toHaveProperty("optional");
  });

  it("agrees with the scorer about what counts as a fact", () => {
    // Both sides must use the same pattern or the trim optimises for a
    // threshold the scorer is not actually applying.
    expect("200cm and 40kg".match(FACT_PATTERN)).toHaveLength(2);
  });
});
