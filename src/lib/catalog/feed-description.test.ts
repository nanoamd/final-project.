import { describe, expect, it } from "vitest";

import {
  feedDescription,
  type FeedDescriptionInput,
  MAX_DESCRIPTION,
  truncateAtSentence,
} from "./feed-description";

function input(
  overrides: Partial<FeedDescriptionInput> = {},
): FeedDescriptionInput {
  return {
    summary:
      "A ceramic vase in white with a glossy glaze, 18 x 18cm at the base and 51cm tall, weighing 2.5kg.",
    body: "The Garda Glazed Gisela Vase is a masterpiece of contemporary design. Its sleek silhouette becomes a statement piece in any setting.",
    specs: [{ label: "Care", value: "Wipe clean with a damp cloth" }],
    dimensions: { length: 18, width: 18, height: 51 },
    dimensionUnit: "cm",
    weight: 2.5,
    colours: ["White"],
    materials: ["Ceramic"],
    ...overrides,
  };
}

describe("feedDescription", () => {
  it("sends the page copy, not just the one-line summary", () => {
    // The whole point. The feed was sending an average of 181 characters when
    // every product has at least 645 written for it.
    const out = feedDescription(input());
    expect(out).toContain("glossy glaze");
    expect(out).toContain("statement piece");
    expect(out.length).toBeGreaterThan(200);
  });

  it("appends the attributes a query is matched against", () => {
    const out = feedDescription(input());
    expect(out).toContain("Dimensions: 18 × 18 × 51cm");
    expect(out).toContain("Weight: 2.5kg");
    expect(out).toContain("Material: Ceramic");
    expect(out).toContain("Colour: White");
    expect(out).toContain("Care: Wipe clean with a damp cloth");
  });

  it("does not repeat the summary when the body opens with it", () => {
    // Caught a real bug: the first version compared fixed 60-character slices,
    // so a summary shorter than 60 never matched and the duplicate survived on
    // exactly the products whose summary is one short line — most of them.
    const summary = "A ceramic vase in white with a glossy glaze.";
    const out = feedDescription(
      input({ summary, body: `${summary} It suits a hallway console.` }),
    );
    expect(out.indexOf("A ceramic vase")).toBe(
      out.lastIndexOf("A ceramic vase"),
    );
    // And the rest of the body survives rather than being dropped with it.
    expect(out).toContain("It suits a hallway console.");
  });

  it("does not repeat a summary that differs only in case or spacing", () => {
    const out = feedDescription(
      input({
        summary: "A ceramic vase in white.",
        body: "a  ceramic   vase in white.\nIt suits a hallway console.",
      }),
    );
    expect(out.toLowerCase().indexOf("ceramic vase")).toBe(
      out.toLowerCase().lastIndexOf("ceramic vase"),
    );
  });

  it("falls back to the summary alone when there is no body", () => {
    // A feed row with no description is disapproved outright, so this is the
    // floor rather than an edge case.
    const out = feedDescription(input({ body: null }));
    expect(out).toContain("glossy glaze");
    expect(out.length).toBeGreaterThan(0);
  });

  it("still produces something when only the body exists", () => {
    const out = feedDescription(input({ summary: null }));
    expect(out).toContain("statement piece");
  });

  it("returns an empty string only when there is genuinely nothing", () => {
    expect(
      feedDescription({
        summary: null,
        body: null,
        specs: null,
        dimensions: null,
        dimensionUnit: null,
        weight: null,
        colours: null,
        materials: null,
      }),
    ).toBe("");
  });

  it("collapses the whitespace Portable Text leaves behind", () => {
    const out = feedDescription(
      input({ body: "Line one.\n\n\nLine two.\t\tLine three." }),
    );
    expect(out).not.toMatch(/\s{2}/);
    expect(out).not.toContain("\n");
  });

  it("stays inside Google's 5,000 character limit", () => {
    const out = feedDescription(
      input({ body: "The quick brown fox jumps over it. ".repeat(600) }),
    );
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
  });

  it("keeps the attribute tail even when the prose is enormous", () => {
    // The tail is worth more per character than another paragraph, so it must
    // survive truncation rather than being the first thing cut.
    const out = feedDescription(
      input({ body: "A sentence about the vase. ".repeat(800) }),
    );
    expect(out).toContain("Dimensions: 18 × 18 × 51cm");
    expect(out).toContain("Colour: White");
  });

  it("omits measurements that are missing rather than printing zeroes", () => {
    const out = feedDescription(
      input({
        dimensions: { length: 40, width: null, height: null },
        weight: null,
      }),
    );
    expect(out).toContain("Dimensions: 40cm");
    expect(out).not.toContain("Weight:");
    // Not `not.toContain("0cm")` — the summary itself says "51cm tall", and an
    // assertion that matches the prose tests nothing about the tail.
    expect(out).not.toMatch(/Dimensions:[^.]*×/);
  });

  it("honours a dimension unit that is not centimetres", () => {
    const out = feedDescription(
      input({ dimensionUnit: "mm", dimensions: { length: 400, width: 200 } }),
    );
    expect(out).toContain("Dimensions: 400 × 200mm");
  });

  it("skips a spec row missing either half", () => {
    const out = feedDescription(
      input({
        specs: [
          { label: "Care", value: null },
          { label: null, value: "Orphaned" },
          { label: "Assembly", value: "Flat packed" },
        ],
      }),
    );
    expect(out).not.toContain("Care:");
    expect(out).not.toContain("Orphaned");
    expect(out).toContain("Assembly: Flat packed");
  });
});

describe("truncateAtSentence", () => {
  it("leaves a short string alone", () => {
    expect(truncateAtSentence("Short enough.", 100)).toBe("Short enough.");
  });

  it("cuts on a full stop when one is near the limit", () => {
    const value = "First sentence here. Second sentence runs past the limit.";
    expect(truncateAtSentence(value, 30)).toBe("First sentence here.");
  });

  it("falls back to a word boundary when there is no sentence break", () => {
    const value = "alpha bravo charlie delta echo foxtrot golf hotel india";
    const out = truncateAtSentence(value, 30);
    expect(out.length).toBeLessThanOrEqual(30);
    expect(value.startsWith(out)).toBe(true);
    expect(out.endsWith(" ")).toBe(false);
    // Never mid-word: whatever it ends on is a whole token from the input.
    expect(value.split(" ")).toContain(out.split(" ").at(-1));
  });

  it("hard-cuts rather than returning almost nothing", () => {
    // One 200-character word: no sentence break, no space in the last third.
    const out = truncateAtSentence("x".repeat(200), 50);
    expect(out).toHaveLength(50);
  });
});
