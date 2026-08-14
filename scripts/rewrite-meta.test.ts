import { describe, expect, it } from "vitest";

import {
  categoryDescription,
  categoryLabel,
  categoryTitle,
  fitDescription,
  MAX_DESCRIPTION,
  MIN_DESCRIPTION,
  sentences,
  singular,
} from "./rewrite-meta";

describe("sentences", () => {
  it("does not split a measurement in half", () => {
    // "35.5cm" is one token. Splitting on every full stop cut it, and produced a
    // description that ended mid-measurement.
    expect(
      sentences("The Elmley is 35.5cm high. The Crofton is 37cm."),
    ).toEqual(["The Elmley is 35.5cm high.", "The Crofton is 37cm."]);
  });

  it("keeps a sentence that opens on a price or a number", () => {
    expect(sentences("A three-seater sofa. £1,095 at Kaiku.")).toHaveLength(2);
  });
});

describe("fitDescription", () => {
  it("removes a leaked prompt", () => {
    // Verbatim from the live Abberley White End Table, 352 characters of which the
    // last sentence was chat output pasted into a shipping field.
    const live =
      "Discover the Abberley White End Table, handcrafted from solid oak and oak veneer with a white painted finish. " +
      "A luxury side table for contemporary homes, boutique hotels and designer interiors. " +
      "Once you send the product page screenshot, I'll generate the full SEO page with the official dimensions, specifications, FAQs, delivery, returns and warranty.";

    const fitted = fitDescription(live);
    expect(fitted).toBe(
      "Discover the Abberley White End Table, handcrafted from solid oak and oak veneer with a white painted finish.",
    );
    expect(fitted).not.toMatch(/I'?ll generate/);
    // And the trade-language sentence went with it.
    expect(fitted).not.toMatch(/boutique hotels/);
  });

  it("keeps the sentences that fit and drops the ones that do not", () => {
    const fitted = fitDescription(
      "Shop the Abberley Black Oak Sideboard featuring four ribbed doors, handcrafted solid oak construction and spacious internal shelving. " +
        "Luxury designer furniture for boutique hotels.",
    );
    expect(fitted).toBe(
      "Shop the Abberley Black Oak Sideboard featuring four ribbed doors, handcrafted solid oak construction and spacious internal shelving.",
    );
    expect(fitted!.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
  });

  it("returns null rather than a fragment when nothing whole fits", () => {
    // Whole sentences only. Cutting one to fit produced "…and timeless rustic
    // character for stylish." on the recycled wood chest, which is why these are
    // reported for hand-writing instead.
    expect(
      fitDescription(
        "Made from reclaimed teak wood with four spacious drawers and timeless rustic character for stylish, functional home storage that lasts for many decades to come in any room.",
      ),
    ).toBeNull();
  });

  it("returns null when every sentence is trade language", () => {
    expect(
      fitDescription(
        "A luxury piece for boutique hotels. Ideal for property developers and show homes.",
      ),
    ).toBeNull();
  });

  it("leaves a description that is already fine alone", () => {
    const fine =
      "Round side table, 45cm across and 60cm high, which sits level with the arm of most armchairs.";
    expect(fitDescription(fine)).toBeNull();
  });
});

describe("categoryLabel", () => {
  it("puts the room in front of a title that means nothing alone", () => {
    // Half the categories are named for the room they sit under — "Storage" under
    // Kitchen. That reads correctly in the navigation and badly in a search result.
    expect(categoryLabel({ title: "Storage", department: "Kitchen" })).toBe(
      "Kitchen Storage",
    );
    expect(
      categoryLabel({ title: "Lighting", department: "Living Room" }),
    ).toBe("Living Room Lighting");
    expect(categoryLabel({ title: "Mirrors", department: "Bathroom" })).toBe(
      "Bathroom Mirrors",
    );
  });

  it("leaves a title that already says what it is", () => {
    expect(
      categoryLabel({ title: "Outdoor Storage", department: "Outdoor Living" }),
    ).toBe("Outdoor Storage");
    expect(
      categoryLabel({ title: "Wellness Accessories", department: "Sauna" }),
    ).toBe("Wellness Accessories");
    expect(categoryLabel({ title: "Desks", department: "Office" })).toBe(
      "Desks",
    );
  });
});

describe("categoryDescription", () => {
  const kitchenStorage = {
    title: "Storage",
    department: "Kitchen",
    products: 6,
    productTitles: [
      "Large Brown Wooden Storage Tub | Kaiku",
      "Brown Wooden Storage Crates (Set of 3) | Kaiku",
    ],
  };

  it("counts the range and names two of it", () => {
    const description = categoryDescription(kitchenStorage)!;
    expect(description).toContain("Six kitchen storage pieces at Kaiku");
    expect(description).toContain("the Large Brown Wooden Storage Tub");
    // The keyword half of the product title has no business in a snippet.
    expect(description).not.toContain("| Kaiku |");
    expect(description.length).toBeGreaterThanOrEqual(MIN_DESCRIPTION);
    expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
  });

  it("does not add a noun to a title that is already plural", () => {
    const description = categoryDescription({
      title: "Mirrors",
      department: "Bathroom",
      products: 2,
      productTitles: [
        "Hampton Ivory Shagreen Square Wall Mirror | Kaiku",
        "Hampton Ivory Octagonal Wall Mirror | Kaiku",
      ],
    })!;
    expect(description).toContain("Two bathroom mirrors at Kaiku");
    expect(description).not.toContain("mirrors pieces");
  });

  it("drops the second name rather than overflowing", () => {
    const description = categoryDescription({
      title: "Indoor Saunas",
      department: "Sauna",
      products: 2,
      productTitles: [
        "SaunaPlunge™ Dales Glow 2 Person Indoor Infrared Sauna | Kaiku",
        "SaunaPlunge™ Dales Glow 4-Person Indoor Infrared Sauna | Kaiku",
      ],
    })!;
    expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    expect(description).toContain("Two indoor saunas at Kaiku");
  });

  it("makes no claim about who ships it", () => {
    // Kaiku dropships, so "direct from the maker" would be untrue, and a claim in a
    // meta description is still a claim.
    const description = categoryDescription(kitchenStorage)!;
    expect(description).not.toMatch(/maker|manufacturer|our workshop/i);
  });

  it("returns null for a category with nothing in it", () => {
    expect(
      categoryDescription({
        title: "Fire Pits",
        department: "Outdoor Living",
        products: 0,
        productTitles: [],
      }),
    ).toBeNull();
  });
});

describe("categoryTitle", () => {
  it("does not repeat the room it just added", () => {
    expect(categoryTitle({ title: "Storage", department: "Kitchen" })).toBe(
      "Kitchen Storage | Kaiku",
    );
  });

  it("adds the room as context when the label does not carry it", () => {
    expect(categoryTitle({ title: "Desks", department: "Office" })).toBe(
      "Desks | Office | Kaiku",
    );
  });

  it("drops the context rather than overrun the title limit", () => {
    const title = categoryTitle({
      title: "Wellness Accessories",
      department: "Sauna and Cold Water Immersion Therapy",
    });
    expect(title).toBe("Wellness Accessories | Kaiku");
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it("keeps the context when the pair still fits", () => {
    const title = categoryTitle({
      title: "Wellness Accessories",
      department: "Sauna and Cold Water Therapy",
    });
    expect(title).toBe(
      "Wellness Accessories | Sauna and Cold Water Therapy | Kaiku",
    );
    expect(title.length).toBeLessThanOrEqual(60);
  });
});

describe("singular", () => {
  it("handles the endings this catalogue actually has", () => {
    // Driven by a real mistake: the first run published "One TV units at Kaiku" on
    // the media console category, which is the sort of line that makes a shopper
    // distrust every other word on the page.
    expect(singular("TV units")).toBe("TV unit");
    expect(singular("cold plunges")).toBe("cold plunge");
    expect(singular("wellness accessories")).toBe("wellness accessory");
    // Uncountable, so it takes a noun rather than losing a letter.
    expect(singular("kitchen storage")).toBe("kitchen storage piece");
    expect(singular("bedroom lighting")).toBe("bedroom lighting piece");
  });
});
