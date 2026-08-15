import { describe, expect, it } from "vitest";

import {
  anchorsFor,
  fingerprint,
  judgeCopy,
  judgeSentence,
  sentences,
} from "./padding";

const SIDEBOARD = {
  title: "Reclaimed Teak Sideboard Console Table with 6 Drawers | Kaiku",
  materialTags: ["Teak", "Reclaimed wood"],
  colourTags: ["Brown"],
  roomTags: ["Living room"],
  useTags: ["Storage", "Console"],
};

describe("anchorsFor", () => {
  it("takes the product's own words from its title", () => {
    const anchors = anchorsFor(SIDEBOARD);
    for (const word of ["reclaimed", "teak", "sideboard", "console", "drawers"])
      expect(anchors.has(word), word).toBe(true);
  });

  it("matches singular against plural", () => {
    // Copy says "six drawers" where the title says "6 Drawers", and a title says
    // "Drawer" where copy says "drawers".
    const anchors = anchorsFor(SIDEBOARD);
    expect(anchors.has("drawer")).toBe(true);
    expect(anchors.has("drawers")).toBe(true);
  });

  it("excludes the words that appear on everything", () => {
    // These are the giveaway: if "luxury" or "timeless" counted as specific, every
    // padded sentence in the catalogue would pass.
    const anchors = anchorsFor({
      title: "Luxury Timeless Elegant Piece | Kaiku",
    });
    for (const word of ["luxury", "timeless", "elegant", "piece", "kaiku"])
      expect(anchors.has(word), word).toBe(false);
  });

  it("keeps the SEO tail, which is still the product's own words", () => {
    const anchors = anchorsFor({
      title:
        "Alton White Console Table | Luxury 3 Drawer Birch Console Table | Kaiku",
    });
    expect(anchors.has("birch")).toBe(true);
    expect(anchors.has("alton")).toBe(true);
  });

  it("takes the tag vocabularies too", () => {
    const anchors = anchorsFor(SIDEBOARD);
    expect(anchors.has("teak")).toBe(true);
    expect(anchors.has("brown")).toBe(true);
  });
});

describe("judgeSentence", () => {
  const anchors = anchorsFor(SIDEBOARD);

  it("calls out a sentence that would fit any product", () => {
    // Both are real lines from the live catalogue.
    for (const line of [
      "Beautiful furniture should enhance both the function and atmosphere of a room.",
      "Its elegant proportions allow it to integrate effortlessly into both residential and commercial environments.",
    ]) {
      expect(judgeSentence(line, anchors).anchors, line).toEqual([]);
    }
  });

  it("passes a sentence carrying something only this product can say", () => {
    expect(
      judgeSentence(
        "Made primarily from reclaimed teak recovered from retired Indonesian fishing boats.",
        anchors,
      ).anchors.length,
    ).toBeGreaterThan(0);
  });

  it("treats a number as specific on its own", () => {
    // "Delivered within 2-4 weeks" names no product and is still concrete.
    expect(
      judgeSentence("Estimated delivery within 2-4 weeks.", anchors).anchors,
    ).toContain("(number)");
  });
});

describe("sentences", () => {
  it("splits on sentence ends", () => {
    expect(sentences("One thing. Two things! Three?")).toHaveLength(3);
  });

  it("does not split inside a measurement or a range", () => {
    // The two cases that break a naive split on ".": "5mm" and "3-4 weeks".
    expect(
      sentences("The 5mm weave is tight. Delivery is 3-4 weeks."),
    ).toHaveLength(2);
    expect(sentences("It measures 180.5cm across the top.")).toHaveLength(1);
  });

  it("keeps a sentence opening with a price or a quote intact", () => {
    expect(sentences('It is worth it. "Superb," said one buyer.')).toHaveLength(
      2,
    );
  });
});

describe("judgeCopy", () => {
  const anchors = anchorsFor(SIDEBOARD);

  it("reports the share of sentences carrying nothing", () => {
    const result = judgeCopy(
      [
        "The Reclaimed Teak Sideboard offers six drawers.",
        "Beautiful furniture should enhance the atmosphere of a room. Quality is what matters most to us here.",
      ],
      anchors,
    );
    expect(result.total).toBe(3);
    expect(result.padded).toHaveLength(2);
    expect(result.ratio).toBeCloseTo(2 / 3, 2);
  });

  it("ignores short lines, which are labels not padding", () => {
    // A spec bullet ("Drawers: 6") or a heading is not a padded paragraph, and
    // counting them would swamp the real signal.
    const result = judgeCopy(
      ["Unused", "In their original packaging"],
      anchors,
    );
    expect(result.total).toBe(0);
    expect(result.ratio).toBe(0);
  });

  it("is zero for copy that is entirely specific", () => {
    expect(
      judgeCopy(
        ["Six spacious drawers provide room for tableware and cutlery."],
        anchors,
      ).ratio,
    ).toBe(0);
  });

  it("does not divide by zero on empty copy", () => {
    expect(judgeCopy([], anchors).ratio).toBe(0);
  });
});

describe("fingerprint", () => {
  it("ignores casing and punctuation, so the same paragraph matches itself", () => {
    expect(fingerprint("Free UK mainland delivery.")).toBe(
      fingerprint("free uk mainland  delivery"),
    );
  });

  it("keeps genuinely different paragraphs apart", () => {
    expect(fingerprint("Free UK delivery")).not.toBe(
      fingerprint("Free UK returns"),
    );
  });
});
