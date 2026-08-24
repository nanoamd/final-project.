import { describe, expect, it } from "vitest";

import {
  buildPrompt,
  checkWritten,
  factSheet,
  parseSections,
  type ProductFacts,
  sectionsToBlocks,
  sectionsToText,
} from "./write-description";

const pergola: ProductFacts = {
  title: "Lean-To Steel Pergola with Sliding Canopy, Dark Grey | Kaiku",
  category: "Pergolas",
  dimensions: { length: 297, width: 397, height: 220, unit: "cm" },
  weight: { value: 27.5, unit: "kg" },
  material: "steel",
  colour: "dark grey",
  deliveryLeadTime: "3-4 weeks",
};

const section = (heading: string, ...paragraphs: string[]) => ({
  heading,
  paragraphs,
});

describe("factSheet", () => {
  it("writes out every fact we hold", () => {
    const sheet = factSheet(pergola);
    expect(sheet).toContain("width 397cm");
    expect(sheet).toContain("height 220cm");
    expect(sheet).toContain("27.5kg");
    expect(sheet).toContain("steel");
    expect(sheet).toContain("3-4 weeks");
  });

  it("omits what we do not hold rather than saying it is missing", () => {
    // A fact sheet that says "Material: not specified" invites the model to
    // repeat that on the page, which is the exact fault being designed out.
    const sheet = factSheet({ title: "A Thing", category: "Vases" });
    expect(sheet).not.toMatch(/not specified|unknown|null|undefined/i);
    expect(sheet).toContain("A Thing");
  });

  it("skips zero and negative measurements", () => {
    const sheet = factSheet({
      title: "A Thing",
      dimensions: { length: 0, width: 40, height: -1, unit: "cm" },
    });
    expect(sheet).toContain("width 40cm");
    expect(sheet).not.toContain("depth");
    expect(sheet).not.toContain("height");
  });
});

describe("buildPrompt", () => {
  it("gives the model the facts and forbids inventing more", () => {
    const prompt = buildPrompt(pergola);
    expect(prompt).toContain("397cm");
    expect(prompt).toContain("Never invent a fact");
    expect(prompt).toContain("Never say a fact is missing");
  });

  it("tells it not to reuse a shape between products", () => {
    // The whole reason this exists: templates made every page the same.
    const prompt = buildPrompt(pergola);
    expect(prompt).toContain("should not share a shape");
    expect(prompt).toContain("Choose your own headings");
  });

  it("feeds objections back on a retry, and not otherwise", () => {
    expect(buildPrompt(pergola)).not.toContain("previous attempt was rejected");
    const retry = buildPrompt(pergola, ['It admits a gap: "not listed"']);
    expect(retry).toContain("previous attempt was rejected");
    expect(retry).toContain('It admits a gap: "not listed"');
  });
});

describe("parseSections", () => {
  it("reads a well-formed response", () => {
    const sections = parseSections(
      JSON.stringify({
        sections: [
          {
            heading: "Built for the Garden",
            paragraphs: ["It is 397cm wide."],
          },
        ],
      }),
    );
    expect(sections).toHaveLength(1);
    expect(sections[0]!.heading).toBe("Built for the Garden");
  });

  it("keeps bullets when given, and omits the key when not", () => {
    const [withBullets] = parseSections(
      JSON.stringify({
        sections: [{ heading: "H", paragraphs: ["p"], bullets: ["a", "b"] }],
      }),
    );
    expect(withBullets!.bullets).toEqual(["a", "b"]);
    const [without] = parseSections(
      JSON.stringify({ sections: [{ heading: "H", paragraphs: ["p"] }] }),
    );
    expect(without!.bullets).toBeUndefined();
  });

  it("returns nothing for junk rather than throwing", () => {
    // A model that returns prose instead of JSON must fail the gate, not the
    // request.
    for (const junk of ["", "not json at all", "{}", '{"sections":"nope"}'])
      expect(parseSections(junk)).toEqual([]);
  });

  it("drops sections with no heading or no content", () => {
    const sections = parseSections(
      JSON.stringify({
        sections: [
          { heading: "", paragraphs: ["orphaned"] },
          { heading: "Empty", paragraphs: [] },
          { heading: "Good", paragraphs: ["real"] },
        ],
      }),
    );
    expect(sections.map((s) => s.heading)).toEqual(["Good"]);
  });
});

describe("checkWritten", () => {
  it("passes clean copy", () => {
    expect(
      checkWritten(
        [
          section(
            "Built for the Garden",
            "The 397cm span covers a dining set comfortably. At 220cm it clears head height without crowding a boundary.",
          ),
        ],
        pergola,
      ),
    ).toEqual([]);
  });

  it("rejects an empty response", () => {
    expect(checkWritten([], pergola)).toHaveLength(1);
  });

  it("rejects copy that admits a gap", () => {
    // The fault Damien found on the live Lennox page.
    const found = checkWritten(
      [
        section(
          "Assembly",
          "The assembly requirement is not listed. Please refer to the instruction manual.",
        ),
      ],
      pergola,
    );
    expect(found.join(" ")).toMatch(/admits a gap/);
  });

  it("rejects a garden product described as being in a room", () => {
    const found = checkWritten(
      [section("Placing It", "It anchors the living room beautifully.")],
      pergola,
    );
    expect(found.join(" ")).toMatch(/wrong place/);
  });

  it("rejects a measurement the facts do not support", () => {
    const found = checkWritten(
      [section("Size", "The 500cm span covers a large dining set.")],
      pergola,
    );
    expect(found.join(" ")).toMatch(/dimension-contradiction/);
  });

  it("rejects marketing filler", () => {
    const found = checkWritten(
      [
        section(
          "Why You Will Love It",
          "It will effortlessly elevate your space and transform your garden into somewhere special.",
        ),
      ],
      pergola,
    );
    expect(found.length).toBeGreaterThan(0);
  });

  it("rejects markdown left in the text", () => {
    const found = checkWritten(
      [section("Details", "It is **397cm** wide and covers a dining set.")],
      pergola,
    );
    expect(found.join(" ")).toMatch(/[Mm]arkdown/);
  });

  it("allows pairing advice that names other colours", () => {
    // Naming what to put beside it is the useful half of the page.
    expect(
      checkWritten(
        [
          section(
            "What to Put Beside It",
            "Pair it with warm timber, terracotta pots and brass lanterns for a softer scheme.",
          ),
        ],
        pergola,
      ),
    ).toEqual([]);
  });
});

describe("sectionsToBlocks", () => {
  it("makes headings, paragraphs and bullets", () => {
    const blocks = sectionsToBlocks([
      { heading: "H", paragraphs: ["p1", "p2"], bullets: ["b1"] },
    ]) as { style: string; listItem?: string }[];
    expect(blocks.map((b) => b.style)).toEqual([
      "h2",
      "normal",
      "normal",
      "normal",
    ]);
    expect(blocks[3]!.listItem).toBe("bullet");
  });

  it("gives every block and span a unique key", () => {
    // Sanity refuses to edit a list whose items share or lack keys — the
    // "Missing keys" warning Damien has already hit in the Studio.
    const blocks = sectionsToBlocks([
      { heading: "A", paragraphs: ["x"] },
      { heading: "B", paragraphs: ["y"] },
    ]) as { _key: string; children: { _key: string }[] }[];
    const keys = blocks.flatMap((b) => [
      b._key,
      ...b.children.map((c) => c._key),
    ]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every(Boolean)).toBe(true);
  });
});

describe("sectionsToText", () => {
  it("includes headings and bullets, so the gate sees everything", () => {
    const text = sectionsToText([
      { heading: "Heading", paragraphs: ["Body."], bullets: ["Bullet"] },
    ]);
    expect(text).toContain("Heading");
    expect(text).toContain("Body.");
    expect(text).toContain("Bullet");
  });
});
