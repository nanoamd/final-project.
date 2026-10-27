import { describe, expect, it } from "vitest";

import {
  checkBasketDeliverability,
  type DeliverabilityItem,
  TWO_MAN_EXCLUDED_PLACES,
} from "./deliverability";

/** A 63kg bookcase: the real piece this guard exists for. */
const bookcase: DeliverabilityItem = {
  slug: "light-up-bookcase",
  title: "Light Up Bookcase",
  weightKg: 63,
  deliverySize: "Large",
};

/** A framed canvas: 2.6kg, courier, goes anywhere. */
const canvas: DeliverabilityItem = {
  slug: "framed-canvas",
  title: "Framed Canvas",
  weightKg: 2.6,
  deliverySize: "Small",
};

describe("checkBasketDeliverability", () => {
  it("refuses a two-man piece to an excluded postcode", () => {
    const verdict = checkBasketDeliverability([bookcase], "BT1 5GS");
    expect(verdict.deliverable).toBe(false);
    expect(verdict.blocked).toEqual([
      { slug: "light-up-bookcase", title: "Light Up Bookcase" },
    ]);
    expect(verdict.message).toContain("Light Up Bookcase");
  });

  it("allows the same piece to a served postcode", () => {
    expect(checkBasketDeliverability([bookcase], "M1 1AE").deliverable).toBe(
      true,
    );
  });

  /**
   * The case that makes this worth having at all: a courier item is fine
   * everywhere, so an excluded postcode must not block a basket that happens
   * to contain one.
   */
  it("does not block a courier item in an excluded area", () => {
    const verdict = checkBasketDeliverability([canvas], "BT1 5GS");
    expect(verdict.deliverable).toBe(true);
    expect(verdict.message).toBeNull();
    // Still reported, because Kaiku absorbs the £10 either way.
    expect(verdict.surcharged).toBe(true);
  });

  it("names only the blocked lines in a mixed basket", () => {
    const verdict = checkBasketDeliverability([canvas, bookcase], "HS1 2AB");
    expect(verdict.deliverable).toBe(false);
    expect(verdict.blocked.map((item) => item.slug)).toEqual([
      "light-up-bookcase",
    ]);
    expect(verdict.message).not.toContain("Framed Canvas");
  });

  it("switches to plural wording for several blocked lines", () => {
    const verdict = checkBasketDeliverability(
      [bookcase, { ...bookcase, slug: "other", title: "Oak Sideboard" }],
      "ZE1 0AA",
    );
    expect(verdict.message).toContain("2 items in your basket");
    expect(verdict.message).toContain("They need");
  });

  /**
   * IV26-99 is excluded and IV1-25 is not, so the district half of the rule
   * has to survive the trip through this function rather than collapsing to
   * an area check.
   */
  it("respects a part-excluded area", () => {
    expect(checkBasketDeliverability([bookcase], "IV27 4XX").deliverable).toBe(
      false,
    );
    expect(checkBasketDeliverability([bookcase], "IV2 3BW").deliverable).toBe(
      true,
    );
  });

  /**
   * Documented behaviour, and the reason the field on the basket can stay
   * optional: an address we were not given never blocks a sale, because
   * guessing wrong costs an order we could have fulfilled.
   */
  it("stays quiet with no postcode, a blank one, or nonsense", () => {
    for (const input of [undefined, null, "", "   ", "not a postcode"]) {
      const verdict = checkBasketDeliverability([bookcase], input);
      expect(verdict.deliverable).toBe(true);
      expect(verdict.message).toBeNull();
    }
  });

  it("falls back to weight when the supplier gave no routing flag", () => {
    const unflagged = { ...bookcase, deliverySize: null };
    expect(checkBasketDeliverability([unflagged], "BT1 5GS").deliverable).toBe(
      false,
    );
    expect(
      checkBasketDeliverability([{ ...unflagged, weightKg: 12 }], "BT1 5GS")
        .deliverable,
    ).toBe(true);
  });

  it("tidies the postcode it reports back", () => {
    expect(checkBasketDeliverability([canvas], "  bt1   5gs ").postcode).toBe(
      "BT1 5GS",
    );
  });
});

/**
 * The copy and the classifier have to describe the same set of places. A new
 * exclusion added to delivery-zones.ts without a matching word here would
 * otherwise produce a refusal that lists the wrong areas — the one failure
 * mode of explaining a postcode rule in prose.
 */
describe("TWO_MAN_EXCLUDED_PLACES", () => {
  const cases: [string, RegExp][] = [
    ["BT1 1AA", /Northern Ireland/],
    ["IM1 1AA", /Isle of Man/],
    ["HS1 2AB", /Outer Hebrides/],
    ["KW1 4YT", /Orkney/],
    ["ZE1 0AA", /Shetland/],
    ["IV27 4XX", /Scottish Highlands/],
    ["PA20 0AA", /Argyll/],
  ];

  it.each(cases)("names the place %s falls in", (postcode, named) => {
    const verdict = checkBasketDeliverability([bookcase], postcode);
    // Each of these is an excluded postcode, so each must actually refuse —
    // otherwise the copy assertion below passes for the wrong reason.
    expect(verdict.deliverable).toBe(false);
    expect(TWO_MAN_EXCLUDED_PLACES).toMatch(named);
    expect(verdict.message).toContain(TWO_MAN_EXCLUDED_PLACES);
  });

  /** KA27-28 is Arran and Cumbrae, which the sentence covers under Argyll. */
  it("covers the Clyde islands", () => {
    expect(checkBasketDeliverability([bookcase], "KA27 8AA").deliverable).toBe(
      false,
    );
  });
});
