import { describe, expect, it } from "vitest";

import { META_TITLE_MAX, shortenMetaTitle } from "./meta-title";

/** Every case below is a real catalogue title. */
describe("shortenMetaTitle", () => {
  it("leaves a title that already fits completely alone", () => {
    const title = "Medium Conran Vase | Kaiku";
    const result = shortenMetaTitle(title);
    expect(result.value).toBe(title);
    expect(result.steps).toEqual([]);
  });

  it("keeps the head noun on the site's highest-impression page", () => {
    // 68 chars. Truncation would cut "Sauna" — the word the query turns on.
    const result = shortenMetaTitle(
      "SaunaPlunge™ Yorkshire Cabin 2-Person Outdoor Infrared Sauna | Kaiku",
    );
    expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
    expect(result.value).toContain("Sauna");
    expect(result.value).toContain("Infrared");
    expect(result.value).toContain("2-Person");
    expect(result.truncated).toBe(false);
  });

  it("spends dimension strings before it spends words", () => {
    const result = shortenMetaTitle(
      "Soft Squiggly Mirror – Chunky Frame – Royal Blue (30.5x22.5x2.3cm) | Kaiku",
    );
    expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
    expect(result.value).toContain("Mirror");
    expect(result.value).toContain("Royal Blue");
    expect(result.value).not.toContain("30.5");
    expect(result.truncated).toBe(false);
  });

  it("repairs the '- -' artifact real titles carry", () => {
    const result = shortenMetaTitle(
      "Tabletop Water Feature - - Dragons, Crystal Ball & Water Wheel | Kaiku",
    );
    expect(result.value).not.toContain("- -");
    expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
  });

  it("drops a trailing 'with' clause whole rather than cutting into it", () => {
    const result = shortenMetaTitle(
      "Hanah Black Snake Leather Effect Floor Lamp with Chrome Base and Black Shade | Kaiku",
    );
    expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
    expect(result.value).toContain("Floor Lamp");
    // The earlier version produced "... Floor Lamp with Chrome", a fragment.
    expect(result.value).not.toMatch(/\bwith\s*\|/);
    expect(result.truncated).toBe(false);
  });

  it("keeps 'Effect', because Leather Effect is not leather", () => {
    const result = shortenMetaTitle(
      "Hanah Black Snake Leather Effect Floor Lamp with Chrome Base and Black Shade | Kaiku",
    );
    expect(result.value).toContain("Effect");
  });

  it("never ends on a preposition or conjunction", () => {
    for (const title of [
      "Freska Set of Five Ribbed Round Clear Glass Jars with Acacia Wood Lids | Kaiku",
      "Carta Black and White Stripe Papier Mache Table Lamp with Dome Shade | Kaiku",
      "Perdoba Cream Textured Linen Dining Chair with Black Metal Frame | Kaiku",
    ]) {
      const value = shortenMetaTitle(title).value;
      expect(value).not.toMatch(/\b(with|and|&|in|of|for|the|to|from)\s*\|/i);
    }
  });

  it("refuses to publish a title that has lost its head noun", () => {
    // Contrived: nothing droppable, and cutting to length loses "Table".
    const result = shortenMetaTitle(
      "Zephyrine Quintessential Magnificent Resplendent Ornamented Table | Kaiku",
      40,
    );
    if (result.unsafe) {
      expect(result.value).toBe(
        "Zephyrine Quintessential Magnificent Resplendent Ornamented Table | Kaiku",
      );
    } else {
      expect(result.value.toLowerCase()).toContain("table");
    }
  });

  it("caps leading drops so it cannot eat into the noun phrase", () => {
    // Uncapped, this became "Feature - Colour Changing ...".
    const result = shortenMetaTitle(
      "Grand Water Feature - Colour Changing Crystal Ball in Greek Urn in Basket | Kaiku",
    );
    expect(result.value).not.toMatch(/^Feature/);
  });

  it("drops a leading collection name rather than the product noun", () => {
    const result = shortenMetaTitle(
      "Barola Round Brown Marble and Dark Mango Wood Carved Coffee Table | Kaiku",
    );
    expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
    expect(result.value).toContain("Coffee Table");
    expect(result.truncated).toBe(false);
  });

  it("never drops a colour, material or number from the front", () => {
    // "Black" leads and is a colour, so the front is not eaten into.
    const result = shortenMetaTitle(
      "Black Rattan Effect Double Hanging Chair With Grey Cushions Extra | Kaiku",
    );
    expect(result.value).toContain("Black");
  });

  it("always keeps the brand suffix", () => {
    for (const title of [
      "Elephants in Love Tabletop Water Feature with Crystal Ball, Light & Watermill | Kaiku",
      "Hanah Black Snake Leather Effect Floor Lamp with Chrome Base and Black Shade | Kaiku",
      "Freska Set of Five Ribbed Round Clear Glass Jars with Acacia Wood Lids | Kaiku",
    ]) {
      const result = shortenMetaTitle(title);
      expect(result.value.endsWith(" | Kaiku")).toBe(true);
      expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
    }
  });

  it("works on a title with no brand suffix", () => {
    const result = shortenMetaTitle(
      "Willow Branch Metal Privacy Screen with Stand and Decorative Panel, Black",
    );
    expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
  });

  it("never leaves dangling punctuation after truncating", () => {
    const result = shortenMetaTitle(
      "Ribbed Table Aaaa Bbbb, Cccc Dddd Eeee Ffff Gggg Hhhh Iiii Jjjj | Kaiku",
    );
    expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
    expect(/[,\-–—]\s*\|/.test(result.value)).toBe(false);
  });

  it("leaves the original alone when no safe shortening exists", () => {
    // No head noun anywhere, so every cut produces a fragment. The right
    // answer is to write nothing and let Google truncate a correct title.
    const title =
      "Aaaa Bbbb Cccc Dddd Eeee Ffff, Gggg Hhhh Iiii Jjjj Kkkk Llll Mmmm | Kaiku";
    const result = shortenMetaTitle(title);
    expect(result.unsafe).toBe(true);
    expect(result.value).toBe(title);
  });

  it("never splits a compound head noun", () => {
    // "Table Lamp" cut to "Table" renames the product into a different one.
    const result = shortenMetaTitle(
      "Carta Taupe Etched Linear Design Papier Mache Domed Table Lamp | Kaiku",
    );
    expect(result.value).not.toMatch(/\bDomed Table \| Kaiku$/);
    if (!result.unsafe) {
      expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
    }
  });

  it("does not leave an orphaned half of a conjunction", () => {
    const result = shortenMetaTitle(
      "Tabletop Water Feature - - Elephants, Crystal Ball & Water Wheel | Kaiku",
    );
    expect(result.value).not.toMatch(/&\s+\w+\s*\| Kaiku$/);
    expect(result.value.length).toBeLessThanOrEqual(META_TITLE_MAX);
  });

  it("handles an empty title without throwing", () => {
    expect(shortenMetaTitle("").value).toBe("");
  });
});
