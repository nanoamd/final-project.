import { describe, expect, it } from "vitest";

import { tidyTitle } from "./tidy-import-titles";

/**
 * Fixtures are the real truncated titles from the Aosom import, so these pin
 * the behaviour against the data that motivated the rule rather than against
 * invented examples.
 */
describe("tidyTitle", () => {
  it("cuts back to the last complete clause", () => {
    expect(
      tidyTitle(
        "HOMCOM Arc Tree Floor Lamp with 3 Adjustable Rotating Lights, for Bedroom Living Room, Industrial St",
      ),
    ).toBe(
      "HOMCOM Arc Tree Floor Lamp with 3 Adjustable Rotating Lights, for Bedroom Living Room",
    );
  });

  it("never ends on a dangling preposition or conjunction", () => {
    const cases = [
      "HOMCOM Industrial Style Adjustable Tripod Floor Lamp, Searchlight Reading Lamp with Wooden Legs and",
      "Outsunny Solar Floor Lamp, Outdoor Garden Lantern Pathway Light & Decorative Lighting with Auto On/O",
      "HOMCOM Bedside Lamp with USB A+C Charging Ports and 3 Phone Stands, Modern Table Lamp with Solid Woo",
    ];
    for (const c of cases) {
      expect(tidyTitle(c)).not.toMatch(
        /\b(with|and|for|in|to|of|the|a|an|plus|w|by|on|at)$/i,
      );
    }
  });

  it("falls back to a phrase break when the last clause is the whole product", () => {
    // Cutting at the only comma would leave "Outsunny Solar Floor Lamp" and
    // throw away everything that distinguishes it.
    expect(
      tidyTitle(
        "Outsunny Solar Floor Lamp, Outdoor Garden Lantern Pathway Light & Decorative Lighting with Auto On/O",
      ),
    ).toBe(
      "Outsunny Solar Floor Lamp, Outdoor Garden Lantern Pathway Light & Decorative Lighting",
    );
  });

  it("leaves no trailing punctuation", () => {
    expect(
      tidyTitle(
        "HOMCOM Ceiling Fan with Light and Remote, LED Mount Ceiling Fan with 3 Colour Temperatures, 6 Speed,",
      ),
    ).toBe(
      "HOMCOM Ceiling Fan with Light and Remote, LED Mount Ceiling Fan with 3 Colour Temperatures",
    );
  });

  it("does not strip a preposition out of a hyphenated compound", () => {
    // "Automatic-on" is one word; taking its "on" leaves a meaningless
    // "Automatic" dangling at the end of the name.
    expect(
      tidyTitle(
        "Outsunny 189cm 3-head Solar Lamp Post, Street Light with Planter, Automatic-on, 6 Hour Max Outdoor R",
      ),
    ).toBe(
      "Outsunny 189cm 3-head Solar Lamp Post, Street Light with Planter, Automatic-on",
    );
  });

  it("keeps a dash-separated title readable", () => {
    expect(
      tidyTitle(
        "Outsunny Outdoor Garden Solar Post Lamp Sensor Dimmable LED Lantern Bollard Pathway 1.2M Tall – Blac",
      ),
    ).toBe(
      "Outsunny Outdoor Garden Solar Post Lamp Sensor Dimmable LED Lantern Bollard Pathway 1.2M Tall",
    );
  });
});
