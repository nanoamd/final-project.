import { describe, expect, it } from "vitest";

import { wordingFaults, type WordingInput } from "./wording-check";

const base: WordingInput = { title: "Test Product | Kaiku", text: "" };
const on = (input: Partial<WordingInput>) =>
  wordingFaults({ ...base, ...input } as WordingInput);
const checks = (input: Partial<WordingInput>) => on(input).map((f) => f.check);

describe("wordingFaults", () => {
  it("says nothing about an empty description", () => {
    expect(on({ text: "" })).toEqual([]);
    expect(on({ text: "   \n " })).toEqual([]);
  });

  describe("articles", () => {
    it("catches a disagreeing article", () => {
      expect(checks({ text: "It makes a excellent centrepiece." })).toContain(
        "article-disagreement",
      );
      expect(checks({ text: "An sturdy frame supports it." })).toContain(
        "article-disagreement",
      );
    });

    it("leaves correct articles alone, including the ones spelling gets wrong", () => {
      for (const fine of [
        "It makes an excellent centrepiece.",
        "A sturdy frame supports it.",
        "Allow an hour for assembly.",
        "It is a unique piece.",
        "A one-piece moulded seat.",
      ])
        expect(checks({ text: fine })).not.toContain("article-disagreement");
    });
  });

  describe("repeated words", () => {
    it("catches a word repeated back to back", () => {
      expect(checks({ text: "It sits in in the corner." })).toContain(
        "repeated-word",
      );
    });

    it("does not join two sentences to invent one", () => {
      // A heading above a paragraph is not a repeated word. This exact
      // mistake produced 152 false findings earlier in the project.
      expect(
        checks({ text: "Care and Cleaning.\nCleaning the vase is simple." }),
      ).not.toContain("repeated-word");
    });
  });

  describe("placeholders", () => {
    it("catches what should have been filled in", () => {
      expect(checks({ text: "Dimensions to be confirmed." })).toContain(
        "placeholder-left-in",
      );
      expect(checks({ text: "Weight: TBC" })).toContain("placeholder-left-in");
    });

    it("does not fire inside an ordinary word", () => {
      expect(checks({ text: "The natural finish suits it." })).not.toContain(
        "placeholder-left-in",
      );
    });
  });

  describe("units", () => {
    it("catches mm and cm mixed on one page", () => {
      expect(
        checks({ text: "It stands 180cm tall on a 40mm thick top." }),
      ).toContain("mixed-units");
    });

    it("is happy with one unit throughout", () => {
      expect(
        checks({ text: "It stands 180cm tall on a 4cm thick top." }),
      ).not.toContain("mixed-units");
    });
  });

  describe("dimensions", () => {
    const dimensions = { length: 90, width: 180, height: 75, unit: "cm" };

    it("catches a length the record contradicts", () => {
      const faults = on({ text: "The 160cm top seats six.", dimensions });
      expect(faults.map((f) => f.check)).toContain("dimension-contradiction");
      expect(faults[0]!.message).toContain("160cm");
    });

    it("accepts any recorded figure, and their total", () => {
      expect(
        checks({
          text: "It is 180cm wide, 90cm deep and 75cm tall, 345cm in all.",
          dimensions,
        }),
      ).not.toContain("dimension-contradiction");
    });

    it("ignores small detail measurements", () => {
      // A 2cm lip is a real detail our three recorded figures never carry.
      expect(
        checks({ text: "A 2cm lip runs around the edge.", dimensions }),
      ).not.toContain("dimension-contradiction");
    });

    it("says nothing when we hold no dimensions", () => {
      expect(checks({ text: "The 160cm top seats six." })).not.toContain(
        "dimension-contradiction",
      );
    });
  });

  describe("colour", () => {
    it("catches copy calling the product a colour it is not", () => {
      expect(
        checks({
          title: "Lean-To Steel Pergola, Dark Grey | Kaiku",
          text: "The green frame anchors the space.",
        }),
      ).toContain("colour-contradiction");
    });

    it("does not mistake pairing advice for a claim", () => {
      // Pairing advice is most of what our copy does.
      expect(
        checks({
          title: "Lean-To Steel Pergola, Dark Grey | Kaiku",
          text: "Pair it with muted greens and warm beige.",
        }),
      ).not.toContain("colour-contradiction");
    });

    it("treats near-synonyms as the same colour", () => {
      expect(
        checks({
          title: "Charcoal Steel Pergola | Kaiku",
          text: "The grey frame anchors the space.",
        }),
      ).not.toContain("colour-contradiction");
    });
  });

  describe("quantities", () => {
    it("catches a piece count that disagrees with the title", () => {
      const faults = on({
        title: "5-Piece Garden Sofa Set | Kaiku",
        text: "This four piece set seats four.",
      });
      expect(faults.map((f) => f.check)).toContain("quantity-contradiction");
    });

    it("is happy when the counts agree, in words or figures", () => {
      expect(
        checks({
          title: "5-Piece Garden Sofa Set | Kaiku",
          text: "This five piece set is generous.",
        }),
      ).not.toContain("quantity-contradiction");
    });
  });

  describe("lead time", () => {
    it("catches a delivery promise the record does not support", () => {
      expect(
        checks({
          text: "Delivered in 2-3 days.",
          deliveryLeadTime: "3-4 weeks",
        }),
      ).toContain("lead-time-contradiction");
    });

    it("accepts the recorded lead time", () => {
      expect(
        checks({
          text: "Dispatched within 3-4 weeks.",
          deliveryLeadTime: "3-4 weeks",
        }),
      ).not.toContain("lead-time-contradiction");
    });

    it("ignores durations that are not about delivery", () => {
      expect(
        checks({
          text: "Allow 2 days for the oil to cure.",
          deliveryLeadTime: "3-4 weeks",
        }),
      ).not.toContain("lead-time-contradiction");
    });
  });

  describe("assembly", () => {
    it("catches copy promising no assembly against the supplier's record", () => {
      expect(
        checks({
          text: "It arrives assembled and ready to use.",
          extra: { "Assembly Required": "Yes" },
        }),
      ).toContain("assembly-contradiction");
    });

    it("catches the reverse", () => {
      expect(
        checks({
          text: "Assembly is required, and the fixings are supplied.",
          extra: { "Assembly Required": "No" },
        }),
      ).toContain("assembly-contradiction");
    });
  });

  describe("weight offered as capacity", () => {
    it("catches the product's own weight sold as a load rating", () => {
      // Made three times by hand on this project.
      expect(
        checks({
          text: "The chest holds up to 50kg.",
          weight: { value: 50, unit: "kg" },
        }),
      ).toContain("weight-as-capacity");
    });

    it("allows the same figure used correctly as mass", () => {
      expect(
        checks({
          text: "It weighs 50kg, so allow for a two-person lift.",
          weight: { value: 50, unit: "kg" },
        }),
      ).not.toContain("weight-as-capacity");
    });

    it("allows a capacity that is genuinely different from the weight", () => {
      expect(
        checks({
          text: "The shelf holds up to 15kg.",
          weight: { value: 50, unit: "kg" },
        }),
      ).not.toContain("weight-as-capacity");
    });
  });

  describe("typography", () => {
    it("catches a space before punctuation", () => {
      expect(checks({ text: "It is sturdy , and it lasts." })).toContain(
        "spacing-before-punctuation",
      );
    });

    it("catches doubled punctuation but allows an ellipsis", () => {
      expect(checks({ text: "It is sturdy,, and it lasts." })).toContain(
        "doubled-punctuation",
      );
      expect(checks({ text: "It waits… and lasts." })).not.toContain(
        "doubled-punctuation",
      );
    });

    it("catches an unclosed bracket", () => {
      expect(checks({ text: "It is sturdy (and it lasts." })).toContain(
        "unbalanced-brackets",
      );
      expect(checks({ text: "It is sturdy (and it lasts)." })).not.toContain(
        "unbalanced-brackets",
      );
    });
  });
});
