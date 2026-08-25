// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  ANSWERABLE,
  describeDimensions,
  describeWeight,
} from "./fix-catalogue-tier2-facts";

/**
 * These tests exist because the first version of this script answered three
 * questions confidently and wrongly. The worst of them told a customer asking
 * "How much weight can the chest hold?" that the chest weighs 50kg — load
 * capacity reported as mass. Anyone acting on that could overload a shelf.
 */

describe("only questions about the product's own size or mass are answered", () => {
  const answerable = [
    "What are the dimensions of the chest?",
    "What are the measurements of the table?",
    "What size is the mirror?",
    "How big is the coffee table?",
    "How much does the lamp weigh?",
    "How heavy is the mirror?",
    "What is the weight of the planter?",
  ];

  const mustNotAnswer = [
    // Capacity, not mass. The dangerous one.
    "How much weight can the chest hold?",
    "Is there a weight limit for the bedside table?",
    "What is the weight limit of the Beer Barrel Table?",
    "What load can the shelf support?",
    // A different measurement to the one we hold.
    "What is the internal size of the planter? Can I fit my pot inside?",
    "What size plants can fit in this planter?",
    "What is the maximum screen size this media unit can hold?",
    "What are the dimensions of the cartons?",
    "What are the packaged dimensions?",
    // Not a measurement question at all.
    "Can I adjust the height of the chandelier?",
    "What size bulb does it take?",
    "What are the dimensions of the shade?",
  ];

  for (const question of answerable) {
    it(`answers: ${question}`, () => {
      expect(ANSWERABLE(question)).not.toBeNull();
    });
  }

  for (const question of mustNotAnswer) {
    it(`refuses: ${question}`, () => {
      expect(ANSWERABLE(question)).toBeNull();
    });
  }
});

describe("dimensions are reported without inventing an orientation", () => {
  it("uses L × W × H notation when all three are known", () => {
    // `length` and `width` are stored with no defined orientation, so calling
    // one of them "deep" would assert something the data does not support.
    const text = describeDimensions(
      { length: 90, width: 55, height: 47, unit: "cm" },
      "Westbury Media Unit | Kaiku",
    );
    expect(text).toContain("90 × 55 × 47cm");
    expect(text).toContain("length × width × height");
    expect(text).not.toContain("deep");
  });

  it("names the axes it does know when some are missing", () => {
    const text = describeDimensions({ height: 33, unit: "cm" }, "Vase | Kaiku");
    expect(text).toBe("The Vase measures 33cm high.");
  });

  it("returns null rather than an empty sentence", () => {
    expect(describeDimensions({ unit: "cm" }, "Vase | Kaiku")).toBeNull();
    expect(describeDimensions({ height: 0 }, "Vase | Kaiku")).toBeNull();
  });

  it("drops the Kaiku suffix from the product's name in prose", () => {
    const text = describeDimensions({ height: 10 }, "Small Vase | Kaiku");
    expect(text).toContain("The Small Vase");
    expect(text).not.toContain("| Kaiku");
  });
});

describe("weight mentions handling only where it is warranted", () => {
  it("recommends two people for a heavy item", () => {
    expect(describeWeight({ value: 50, unit: "kg" }, "Chest")).toContain(
      "Two people",
    );
  });

  it("says nothing about handling for a light one", () => {
    const text = describeWeight({ value: 1.2, unit: "kg" }, "Lamp");
    expect(text).toBe("The Lamp weighs 1.2kg.");
  });

  it("returns null when there is no usable figure", () => {
    expect(describeWeight({}, "Lamp")).toBeNull();
    expect(describeWeight({ value: 0 }, "Lamp")).toBeNull();
  });
});
