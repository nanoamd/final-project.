import { describe, expect, it } from "vitest";

import {
  describeRule,
  resolveShippingCost,
  ruleNeedsWeight,
  type ShippingRule,
} from "./shipping-rules";

describe("resolveShippingCost", () => {
  it("returns 0 when carriage is inside the trade price", () => {
    expect(resolveShippingCost({ kind: "included" })).toBe(0);
  });

  it("returns the flat amount per item", () => {
    expect(resolveShippingCost({ kind: "flatPerItem", amount: 80 })).toBe(80);
  });

  it("returns the flat amount per order", () => {
    expect(resolveShippingCost({ kind: "flatPerOrder", amount: 4.95 })).toBe(
      4.95,
    );
  });

  describe("weight bands", () => {
    const rule: ShippingRule = {
      kind: "weightBands",
      bands: [
        { maxKg: 0.099, amount: 2.79 },
        { maxKg: 2, amount: 2.99 },
        { maxKg: 25, amount: 5.99 },
      ],
    };

    it("picks the first band the weight fits", () => {
      expect(resolveShippingCost(rule, { weightKg: 0.05 })).toBe(2.79);
      expect(resolveShippingCost(rule, { weightKg: 1.5 })).toBe(2.99);
      expect(resolveShippingCost(rule, { weightKg: 20 })).toBe(5.99);
    });

    it("treats a band's own maximum as inside it", () => {
      expect(resolveShippingCost(rule, { weightKg: 2 })).toBe(2.99);
    });

    it("returns null above the heaviest band rather than inventing a rate", () => {
      // Those are quoted individually by the supplier — unknown, not free.
      expect(resolveShippingCost(rule, { weightKg: 40 })).toBeNull();
    });

    it("returns null when the product records no weight", () => {
      // The load-bearing case: most of the catalogue has no weight, and a
      // guessed carriage cost produces a guessed margin.
      expect(resolveShippingCost(rule, {})).toBeNull();
      expect(resolveShippingCost(rule, { weightKg: null })).toBeNull();
    });

    it("treats a zero or negative weight as unrecorded, not as featherweight", () => {
      expect(resolveShippingCost(rule, { weightKg: 0 })).toBeNull();
      expect(resolveShippingCost(rule, { weightKg: -1 })).toBeNull();
    });
  });

  describe("free over an order value", () => {
    const rule: ShippingRule = {
      kind: "freeOverOrderValue",
      threshold: 250,
      amountBelowThreshold: 9.95,
    };

    it("is free at or above the threshold", () => {
      expect(resolveShippingCost(rule, { orderValue: 250 })).toBe(0);
      expect(resolveShippingCost(rule, { orderValue: 400 })).toBe(0);
    });

    it("charges below the threshold", () => {
      expect(resolveShippingCost(rule, { orderValue: 100 })).toBe(9.95);
    });

    it("returns null with no order value to compare", () => {
      expect(resolveShippingCost(rule, {})).toBeNull();
    });
  });

  it("returns null for a supplier with no rule recorded", () => {
    expect(resolveShippingCost(null)).toBeNull();
    expect(resolveShippingCost(undefined)).toBeNull();
  });

  it("never confuses an unknown with a free delivery", () => {
    // £0 means "they deliver free"; null means "nobody has worked it out".
    expect(resolveShippingCost({ kind: "included" })).toBe(0);
    expect(resolveShippingCost(null)).not.toBe(0);
  });
});

describe("ruleNeedsWeight", () => {
  it("is true only for a weight-banded rule", () => {
    expect(ruleNeedsWeight({ kind: "weightBands", bands: [] })).toBe(true);
    expect(ruleNeedsWeight({ kind: "flatPerItem", amount: 80 })).toBe(false);
    expect(ruleNeedsWeight(null)).toBe(false);
  });
});

describe("describeRule", () => {
  it("describes each shape in one line", () => {
    expect(describeRule({ kind: "included" })).toBe(
      "carriage included in the trade price",
    );
    expect(describeRule({ kind: "flatPerItem", amount: 80 })).toBe(
      "£80.00 per item",
    );
    expect(
      describeRule({
        kind: "weightBands",
        bands: [{ maxKg: 2, amount: 2.99 }],
      }),
    ).toBe("by weight: ≤2kg £2.99");
    expect(
      describeRule({
        kind: "freeOverOrderValue",
        threshold: 250,
        amountBelowThreshold: 9.95,
      }),
    ).toBe("free over £250, otherwise £9.95");
    expect(describeRule(null)).toBe("no rule recorded");
  });
});
