import { describe, expect, it } from "vitest";

import { contextFaults, sitingFor } from "./context-check";

describe("sitingFor", () => {
  it("knows the garden categories", () => {
    expect(sitingFor("Pergolas")).toBe("outdoor");
    expect(sitingFor("Garden Furniture")).toBe("outdoor");
    expect(sitingFor("Garden Lighting")).toBe("outdoor");
  });

  it("treats an outdoor sauna as outdoor, not as wellness", () => {
    // familyFor() sends this to the wellness writing family, which is right
    // for the copy's tone and wrong for the question of whether it rains on it.
    expect(sitingFor("Outdoor Saunas")).toBe("outdoor");
    expect(sitingFor("Indoor Saunas")).toBe("indoor");
  });

  it("says 'either' for things that go in both, and for the unknown", () => {
    expect(sitingFor("Planters")).toBe("either");
    expect(sitingFor("Candles & Lanterns")).toBe("either");
    // An unrecognised category must produce no findings rather than a page of
    // invented ones.
    expect(sitingFor("Some New Category")).toBe("either");
    expect(sitingFor(null)).toBe("either");
  });
});

describe("contextFaults", () => {
  it("catches the fault the pergola shipped with", () => {
    const faults = contextFaults(
      "That balance is what keeps a room feeling generous.",
      "outdoor",
    );
    expect(faults).toHaveLength(1);
    expect(faults[0]!.phrase).toBe("room feel");
    expect(faults[0]!.kind).toBe("indoor-language-outdoor-product");
  });

  it("catches a garden product sent to the living room", () => {
    const faults = contextFaults(
      "It anchors the living room without dominating it.",
      "outdoor",
    );
    expect(faults.map((f) => f.phrase)).toContain("living room");
  });

  it("catches a low ceiling over a pergola", () => {
    expect(
      contextFaults("Under a low ceiling it will feel compressed.", "outdoor"),
    ).toHaveLength(1);
  });

  it("leaves ordinary English alone", () => {
    // These are the phrases that make a naive /\broom\b/ check useless.
    for (const fine of [
      "Not every garden has room to spare.",
      "It turns an open stretch of paving into an outdoor room.",
      "Leave room around it rather than setting it flush to a wall.",
      "There is enough room for six people to sit.",
    ])
      expect(contextFaults(fine, "outdoor")).toEqual([]);
  });

  it("catches garden language on an indoor product", () => {
    const faults = contextFaults(
      "Wipe it down and it will survive frost and rain on the patio.",
      "indoor",
    );
    expect(faults.map((f) => f.phrase)).toEqual(
      expect.arrayContaining(["patio", "frost"]),
    );
  });

  it("allows an indoor vase to hold flowers from the garden", () => {
    for (const fine of [
      "Fill it with cut flowers from the garden.",
      "It suits foliage from the garden as readily as a florist's stems.",
      "A garden room is the obvious place for it.",
    ])
      expect(contextFaults(fine, "indoor")).toEqual([]);
  });

  it("reports a repeated slip once", () => {
    const faults = contextFaults(
      "It suits the living room. Any living room, in fact. Living room or lounge.",
      "outdoor",
    );
    expect(faults.filter((f) => f.phrase === "living room")).toHaveLength(1);
  });

  it("allows an outdoor coffee table to be a coffee table", () => {
    // Rattan outdoor coffee tables are a whole category of ours. Banning the
    // phrase produced 18 findings across Garden Furniture, all of them wrong.
    expect(
      contextFaults(
        "The Depok Rattan Coffee Table blends rattan with a black metal frame.",
        "outdoor",
      ),
    ).toEqual([]);
  });

  it("does not flag copy that deliberately names both places", () => {
    // A hanging chair that works in a garden and in a lounge is not a
    // mismatch; the writer covered both on purpose.
    expect(
      contextFaults(
        "Ideal for any garden, patio, or even a spacious living room.",
        "outdoor",
      ),
    ).toEqual([]);
    expect(
      contextFaults(
        "Suitable for both indoor and outdoor settings, on patios or in living spaces.",
        "indoor",
      ),
    ).toEqual([]);
  });

  it("still flags copy that names only the wrong place", () => {
    expect(
      contextFaults("It warms up the living room beautifully.", "outdoor"),
    ).toHaveLength(1);
  });

  it("checks nothing for a product that goes in both", () => {
    expect(
      contextFaults("Perfect on the patio or in the living room.", "either"),
    ).toEqual([]);
  });

  it("keeps the offending sentence for the report", () => {
    const [fault] = contextFaults(
      "Some preamble here. It warms up the hallway nicely.",
      "outdoor",
    );
    expect(fault!.sentence).toBe("It warms up the hallway nicely.");
  });

  it("handles empty and whitespace descriptions", () => {
    expect(contextFaults("", "outdoor")).toEqual([]);
    expect(contextFaults("   \n  ", "outdoor")).toEqual([]);
  });
});
