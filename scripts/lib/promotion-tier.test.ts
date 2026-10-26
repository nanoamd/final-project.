import { describe, expect, it } from "vitest";

import { cashKept, promotionTier, TIER_RULES } from "./promotion-tier";

describe("cashKept", () => {
  it("takes the supplier, the carriage and the card fee", () => {
    // £100 sold, £40 cost, £8.39 carriage, card 1.5% + 20p = £1.70
    expect(cashKept(100, 40, 8.39)).toBeCloseTo(49.91, 2);
  });

  it("treats absent carriage as zero rather than as unknown", () => {
    expect(cashKept(100, 40, null)).toBeCloseTo(58.3, 2);
  });
});

describe("the advertising tiers", () => {
  it("needs both tests, not either — the £9 candle holder case", () => {
    // 60% margin and keeps about £5. Percentage alone would pass it.
    expect(promotionTier(9, 3, 0)).not.toBe("strong");
    expect(promotionTier(9, 3, 0)).not.toBe("viable");
  });

  it("needs both tests the other way — the £800 table at 8%", () => {
    // Keeps about £64 in cash, which one redelivery erases.
    expect(promotionTier(800, 720, 0)).toBe("below");
  });

  it("passes a sauna on the cash route despite a thin percentage", () => {
    // 19% of £6,000 is over a thousand pounds kept.
    expect(promotionTier(6000, 4800, 0)).toBe("cash");
  });

  it("puts the Sorelle sofa in an advertising tier", () => {
    expect(["strong", "viable", "cash"]).toContain(
      promotionTier(1378, 907.19, 0),
    );
  });
});

describe("the basket route", () => {
  it("catches a cheap piece that pays as an add-on but not alone", () => {
    // £53 keeping about £17 once carriage rides the first item. Fails viable's
    // £20 cash floor standalone; worth having in a basket.
    const tier = promotionTier(53, 34, 8.39);
    expect(tier).toBe("basket");
  });

  it("does not promote anything that already pays its own way", () => {
    // A product clearing the advertising floors must not be downgraded to an
    // add-on just because it is cheap.
    expect(promotionTier(95, 40, 0)).toBe("strong");
  });

  it("stops at £100, where a thing stops being an add-on", () => {
    const justUnder = promotionTier(TIER_RULES.basket.maxPrice, 70, 12);
    const justOver = promotionTier(TIER_RULES.basket.maxPrice + 1, 71, 12);
    expect(justUnder).toBe("basket");
    expect(justOver).toBe("below");
  });

  it("still refuses the genuinely unprofitable cheap end", () => {
    // Nothing under £25 clears £15 kept at dropship margins, and this is the
    // reason no new decor supplier changes that.
    const cheap: [number, number][] = [
      [9, 3],
      [19, 12],
      [23, 15],
    ];
    for (const [price, cost] of cheap)
      expect(promotionTier(price, cost, 0)).toBe("below");
  });

  it("excludes carriage from the add-on test but not from the others", () => {
    // Same product, £50 of carriage. Standalone it is a loss; as an add-on
    // riding the first item's carriage it is worth £15.
    expect(promotionTier(60, 42, 50)).toBe("basket");
    expect(cashKept(60, 42, 50)).toBeLessThan(0);
  });
});

describe("degenerate input", () => {
  it("is below for a price of zero or less, without dividing by it", () => {
    for (const price of [0, -1])
      expect(promotionTier(price, 10, 0)).toBe("below");
  });
});
