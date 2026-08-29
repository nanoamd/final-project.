import { describe, expect, it } from "vitest";

import {
  formatMinimum,
  SECOND_ORDER_MINIMUM_PENCE,
  secondOrderCode,
  shouldOfferSecondOrderDiscount,
} from "./second-order-offer";

describe("shouldOfferSecondOrderDiscount", () => {
  it("offers it after a first order by a signed-in customer", () => {
    expect(
      shouldOfferSecondOrderDiscount({ userId: "u1", ordersByThisUser: 1 }),
    ).toBe(true);
  });

  it("does not offer it twice", () => {
    // The second order spends the code; it does not earn another.
    expect(
      shouldOfferSecondOrderDiscount({ userId: "u1", ordersByThisUser: 2 }),
    ).toBe(false);
    expect(
      shouldOfferSecondOrderDiscount({ userId: "u1", ordersByThisUser: 9 }),
    ).toBe(false);
  });

  it("does not offer it to a guest", () => {
    expect(
      shouldOfferSecondOrderDiscount({ userId: null, ordersByThisUser: 1 }),
    ).toBe(false);
  });
});

describe("secondOrderCode", () => {
  it("builds a typeable code from the order number", () => {
    expect(secondOrderCode("KH-1042")).toBe("THANKYOUKH1042");
  });

  it("is uppercase and alphanumeric whatever the order number looks like", () => {
    expect(secondOrderCode("kh/10 42")).toMatch(/^THANKYOU[A-Z0-9]+$/);
  });

  it("still produces a code when the order has no number yet", () => {
    // Stripe rejects a duplicate promotion code, so this must never be empty.
    expect(secondOrderCode(null)).toMatch(/^THANKYOU[A-Z0-9]+$/);
  });
});

describe("formatMinimum", () => {
  it("states the floor the way the copy has to say it", () => {
    expect(formatMinimum()).toBe("£100");
    expect(SECOND_ORDER_MINIMUM_PENCE).toBe(10_000);
  });

  it("keeps the pence when there are any", () => {
    expect(formatMinimum(12_550)).toBe("£125.50");
  });
});
