import { describe, expect, it } from "vitest";

import {
  buildDescription,
  MAX_PADDING_RATIO,
  paddedSentences,
  PaddingError,
  paddingRatio,
  type ProductCopy,
  spansFor,
  UnrecordedFactError,
  wordCount,
} from "./product-copy-blocks";

/** A minimal product that passes, so each test can break one thing about it. */
const base: ProductCopy = {
  slug: "test-carver-chair",
  summary:
    "A sage green garden carver 60cm wide with seven vertical slats in the back. It weighs 4.7kg.",
  sections: [
    {
      heading: "Seven Slats",
      paragraphs: [
        "The back of this carver is formed as seven vertical slats fanning slightly outwards.",
        "At 60cm wide it needs 9cm more room around a table than the armless version does.",
      ],
    },
    {
      heading: "Product Specifications",
      labelled: [
        { label: "Width", value: "60 cm" },
        { label: "Back", value: "Seven vertical slats" },
      ],
    },
  ],
  deliveryNotes: "Free UK mainland delivery.",
  warrantyNotes: "Statutory rights apply.",
  highlights: ["60cm wide", "Seven vertical slats"],
  styleTags: ["Industrial"],
  roomTags: ["Garden"],
  useTags: ["Seating"],
  facts: {
    title: "Test Carver Chair | Kaiku",
    observed: ["slats"],
    materialTags: ["Plastic"],
    colourTags: ["Green"],
    primaryColour: "Green",
  },
};

describe("spansFor", () => {
  it("bolds the text between double asterisks", () => {
    expect(spansFor("The **Axis Chair** is green")).toEqual([
      { text: "The " },
      { text: "Axis Chair", marks: ["strong"] },
      { text: " is green" },
    ]);
  });

  it("leaves plain text as one unmarked span", () => {
    expect(spansFor("no marks here")).toEqual([{ text: "no marks here" }]);
  });

  it("handles a paragraph that opens on the bold run", () => {
    expect(spansFor("**Axis Chair** in sage")).toEqual([
      { text: "Axis Chair", marks: ["strong"] },
      { text: " in sage" },
    ]);
  });
});

describe("buildDescription", () => {
  it("emits h2 headings carrying the strong mark", () => {
    const heading = buildDescription(base)[0]!;
    expect(heading.style).toBe("h2");
    expect(heading.children[0]!.marks).toEqual(["strong"]);
  });

  it("renders labelled specs as bullets with a bold label", () => {
    const spec = buildDescription(base).find(
      (block) => block.children[0]!.text === "Width: ",
    )!;
    expect(spec.listItem).toBe("bullet");
    expect(spec.level).toBe(1);
    expect(spec.children[0]!.marks).toEqual(["strong"]);
    expect(spec.children[1]).toMatchObject({ text: "60 cm", marks: [] });
  });

  it("puts `after` paragraphs below the bullets, not above them", () => {
    const blocks = buildDescription({
      ...base,
      sections: [
        ...base.sections,
        {
          heading: "Returns",
          policy: true,
          paragraphs: ["Items must be:"],
          bullets: ["Unused"],
          after: ["Natural variation is not a defect."],
        },
      ],
    });
    const texts = blocks.map((block) =>
      block.children.map((span) => span.text).join(""),
    );
    expect(texts.indexOf("Unused")).toBeGreaterThan(
      texts.indexOf("Items must be:"),
    );
    expect(texts.indexOf("Natural variation is not a defect.")).toBeGreaterThan(
      texts.indexOf("Unused"),
    );
  });

  it("is deterministic, so an unchanged rerun is not a fake edit", () => {
    expect(buildDescription(base)).toEqual(buildDescription(base));
  });

  it("strips the bold markers from the text it stores", () => {
    const blocks = buildDescription({
      ...base,
      sections: [
        {
          heading: "Lead",
          paragraphs: ["The **Test Carver Chair** is 60cm wide."],
        },
        ...base.sections.slice(1),
      ],
    });
    const text = blocks
      .flatMap((block) => block.children.map((span) => span.text))
      .join("");
    expect(text).not.toContain("**");
    expect(text).toContain("Test Carver Chair");
  });
});

describe("the padding gate", () => {
  it("passes copy where every sentence carries a fact", () => {
    expect(paddingRatio(base)).toBe(0);
    expect(() => buildDescription(base)).not.toThrow();
  });

  it("throws on copy over the limit, naming the sentences", () => {
    const padded: ProductCopy = {
      ...base,
      sections: [
        {
          heading: "Seven Slats",
          paragraphs: [
            ...base.sections[0]!.paragraphs!,
            "Beautiful furniture should enhance the atmosphere of any room it is placed in.",
            "Its proportions allow it to integrate effortlessly into residential settings.",
          ],
        },
        base.sections[1]!,
      ],
    };
    expect(paddingRatio(padded)).toBeGreaterThan(MAX_PADDING_RATIO);
    expect(() => buildDescription(padded)).toThrow(PaddingError);
    expect(paddedSentences(padded)).toHaveLength(2);
  });

  it("counts a room, use or style tag as an anchor", () => {
    // "Industrial" is a styleTag on the document, so a sentence leaning on it is
    // anchored. Without styleTags in the anchor set this sentence scored as padding.
    const withStyle: ProductCopy = {
      ...base,
      sections: [
        {
          heading: "Seven Slats",
          paragraphs: [
            "An industrial finish is what makes this worth having in the garden.",
          ],
        },
        base.sections[1]!,
      ],
    };
    expect(paddedSentences(withStyle)).toEqual([]);
  });

  it("does not judge policy sections, which are meant to be identical", () => {
    const withPolicy: ProductCopy = {
      ...base,
      sections: [
        ...base.sections,
        {
          heading: "Delivery",
          policy: true,
          paragraphs: [
            "Your order is checked and prepared before dispatch so that it arrives well.",
          ],
        },
      ],
    };
    // That sentence carries no anchor at all, and is correctly ignored.
    expect(paddingRatio(withPolicy)).toBe(0);
  });

  it("judges an `after` paragraph in a body section", () => {
    const withAfter: ProductCopy = {
      ...base,
      sections: [
        {
          heading: "Seven Slats",
          bullets: ["A bullet"],
          after: [
            "Every home deserves something that feels considered and effortlessly put together.",
          ],
        },
        base.sections[1]!,
      ],
    };
    expect(paddedSentences(withAfter)).toHaveLength(1);
  });
});

describe("recording what the copy describes", () => {
  it("rejects an observed feature that appears nowhere on the document", () => {
    const unrecorded: ProductCopy = {
      ...base,
      facts: { ...base.facts, observed: ["slats", "pedestal"] },
    };
    expect(() => buildDescription(unrecorded)).toThrow(UnrecordedFactError);
    expect(() => buildDescription(unrecorded)).toThrow(/pedestal/);
  });

  it("accepts a feature recorded in a badge", () => {
    const inBadge: ProductCopy = {
      ...base,
      badges: ["Stackable"],
      facts: { ...base.facts, observed: ["slats", "stackable"] },
    };
    expect(() => buildDescription(inBadge)).not.toThrow();
  });

  it("accepts a feature recorded only in a spec value", () => {
    const inSpec: ProductCopy = {
      ...base,
      facts: { ...base.facts, observed: ["slats", "vertical"] },
    };
    expect(() => buildDescription(inSpec)).not.toThrow();
  });
});

describe("wordCount", () => {
  it("counts headings, prose, bullets, specs and trailing paragraphs", () => {
    const counted = wordCount({
      ...base,
      summary: "One two three.",
      sections: [
        {
          heading: "Four five",
          paragraphs: ["six seven eight"],
          bullets: ["nine ten"],
          labelled: [{ label: "Eleven", value: "twelve" }],
          after: ["thirteen"],
        },
      ],
    });
    expect(counted).toBe(13);
  });

  it("does not count the bold markers as words", () => {
    expect(
      wordCount({ ...base, summary: "A **bold** word.", sections: [] }),
    ).toBe(3);
  });
});
