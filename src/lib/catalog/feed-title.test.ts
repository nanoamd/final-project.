import { describe, expect, it } from "vitest";

import { FEED_TITLE_MAX, feedTitle } from "./feed-title";

describe("feedTitle", () => {
  it("adds the attributes a name does not already carry, before the brand", () => {
    expect(
      feedTitle({
        name: "Garda Glazed Gisela Vase | Kaiku",
        colours: ["Grey"],
        materials: ["Ceramic"],
        categoryName: "Vases",
      }),
      // "Vase" is already in the name, so the noun is not repeated.
    ).toBe("Garda Glazed Gisela Vase — Grey Ceramic | Kaiku");
  });

  it("never repeats a word the name already has", () => {
    // Real catalogue title. Black and Rattan are both already present, and
    // Chair is the category noun — nothing should be appended at all.
    expect(
      feedTitle({
        name: "Lagom Black Natural Rattan Chair | Kaiku",
        colours: ["Black"],
        materials: ["Rattan"],
        categoryName: "Chairs",
      }),
    ).toBe("Lagom Black Natural Rattan Chair | Kaiku");
  });

  it("adds the category noun when the name lacks it", () => {
    expect(
      feedTitle({
        name: "Pershore Rectangular Aged Oak | Kaiku",
        colours: [],
        materials: [],
        categoryName: "Coffee Tables",
      }),
    ).toBe("Pershore Rectangular Aged Oak — Coffee Table | Kaiku");
  });

  it("keeps the brand suffix exactly, and never alters the name", () => {
    const out = feedTitle({
      name: "Marble Effect Ellipse Large Vase | Kaiku",
      colours: ["White"],
      materials: [],
      categoryName: "Vases",
    });
    expect(out.startsWith("Marble Effect Ellipse Large Vase")).toBe(true);
    expect(out.endsWith("| Kaiku")).toBe(true);
  });

  it("works on a product with no brand suffix", () => {
    expect(
      feedTitle({
        name: "Willow Branch Metal Privacy Screen with Stand",
        colours: ["Black"],
        materials: [],
        categoryName: "Privacy Screens",
      }),
    ).toBe("Willow Branch Metal Privacy Screen with Stand — Black");
  });

  it("adds no noun at all for a compound category", () => {
    // "Candles & Lanterns" singularised to "Candles & Lantern", which is
    // broken English, and either half alone misdescribes the range.
    expect(
      feedTitle({
        name: "Aurora Hanging Light",
        categoryName: "Candles & Lanterns",
      }),
    ).toBe("Aurora Hanging Light");
    expect(
      feedTitle({
        name: "Ember Bowl",
        colours: ["Black"],
        categoryName: "Fire Pits & Heating",
      }),
    ).toBe("Ember Bowl — Black");
  });

  it("capitalises a tag without destroying deliberate casing", () => {
    // materialTags holds "Mirrored glass", which read as a data-entry slip.
    expect(
      feedTitle({ name: "Tristan Frame", materials: ["Mirrored glass"] }),
    ).toBe("Tristan Frame — Mirrored Glass");
    expect(feedTitle({ name: "Aurora Strip", materials: ["LED"] })).toBe(
      "Aurora Strip — LED",
    );
  });

  it("singularises the category noun", () => {
    expect(
      feedTitle({ name: "Bramble Storage Box", categoryName: "Accessories" }),
    ).toContain("Accessory");
    // The bug this caught: "Vases" became "Vas" under a naive -ses rule.
    expect(
      feedTitle({ name: "Bramble Stem Holder", categoryName: "Vases" }),
    ).toBe("Bramble Stem Holder — Vase");
    expect(
      feedTitle({ name: "Bramble Tumbler", categoryName: "Glasses" }),
    ).toBe("Bramble Tumbler — Glass");
  });

  it("returns the name untouched when there is nothing to add", () => {
    expect(feedTitle({ name: "Solo Lamp | Kaiku" })).toBe("Solo Lamp | Kaiku");
    expect(feedTitle({ name: "" })).toBe("");
  });

  it("never exceeds Google's cap, falling back to the plain name", () => {
    const long = `${"Extremely Detailed Product Name ".repeat(4).trim()} | Kaiku`;
    const out = feedTitle({
      name: long,
      colours: ["Charcoal Grey"],
      materials: ["Reclaimed Teak"],
      categoryName: "Coffee Tables",
    });
    expect(out.length).toBeLessThanOrEqual(FEED_TITLE_MAX);
  });

  it("dedupes repeated attribute values", () => {
    expect(
      feedTitle({
        name: "Siena Planter | Kaiku",
        colours: ["Brown", "Brown"],
        materials: ["Brown"],
        categoryName: "Planters",
      }),
    ).toBe("Siena Planter — Brown | Kaiku");
  });
});
