import { describe, expect, it } from "vitest";

import {
  classifyPostcode,
  needsTwoManDelivery,
  REMOTE_SURCHARGE,
  TWO_MAN_FROM_KG,
} from "./delivery-zones";

describe("classifyPostcode", () => {
  it("excludes two-man delivery for whole excluded areas", () => {
    for (const pc of ["BT1 1AA", "HS1 2AB", "IM1 1AA", "KW1 4YT", "ZE1 0AA"]) {
      expect(classifyPostcode(pc).twoManAvailable).toBe(false);
    }
  });

  /**
   * The case that makes a range list necessary rather than an area list:
   * Hill exclude IV26-99, so Inverness is served and Ullapool is not.
   */
  it("splits IV correctly at district 26", () => {
    expect(classifyPostcode("IV1 1AA").twoManAvailable).toBe(true);
    expect(classifyPostcode("IV25 1AA").twoManAvailable).toBe(true);
    expect(classifyPostcode("IV26 2XX").twoManAvailable).toBe(false);
    expect(classifyPostcode("IV99 9ZZ").twoManAvailable).toBe(false);
  });

  it("excludes only KA27 and KA28, not the rest of KA", () => {
    expect(classifyPostcode("KA1 1AA").twoManAvailable).toBe(true);
    expect(classifyPostcode("KA27 8AA").twoManAvailable).toBe(false);
    expect(classifyPostcode("KA28 0AA").twoManAvailable).toBe(false);
    expect(classifyPostcode("KA29 0AA").twoManAvailable).toBe(true);
  });

  it("excludes PA15-78 and PH19-50 but not below those", () => {
    expect(classifyPostcode("PA1 1AA").twoManAvailable).toBe(true);
    expect(classifyPostcode("PA15 1AA").twoManAvailable).toBe(false);
    expect(classifyPostcode("PA78 6AA").twoManAvailable).toBe(false);
    expect(classifyPostcode("PH1 1AA").twoManAvailable).toBe(true);
    expect(classifyPostcode("PH19 1AA").twoManAvailable).toBe(false);
  });

  it("surcharges the Isle of Wight but not the rest of PO", () => {
    expect(classifyPostcode("PO30 1AA").surcharge).toBe(REMOTE_SURCHARGE);
    expect(classifyPostcode("PO41 0AA").surcharge).toBe(REMOTE_SURCHARGE);
    expect(classifyPostcode("PO1 1AA").surcharge).toBe(0);
  });

  it("surcharges Northern Ireland and the islands", () => {
    for (const pc of ["BT1 1AA", "IM1 1AA", "HS1 2AB", "ZE1 0AA"]) {
      expect(classifyPostcode(pc).surcharge).toBe(REMOTE_SURCHARGE);
    }
  });

  it("leaves ordinary mainland postcodes alone", () => {
    for (const pc of ["M1 1AA", "SW1A 1AA", "LS1 4AP", "EH1 1YZ"]) {
      const zone = classifyPostcode(pc);
      expect(zone.twoManAvailable).toBe(true);
      expect(zone.surcharge).toBe(0);
    }
  });

  it("tolerates the formats people actually type", () => {
    expect(classifyPostcode("iv26 2xx").twoManAvailable).toBe(false);
    expect(classifyPostcode("IV262XX").twoManAvailable).toBe(false);
    expect(classifyPostcode("  bt1  ").twoManAvailable).toBe(false);
  });

  /**
   * A malformed or missing postcode must never block a sale — the fallback is
   * permissive on purpose, and order handling is the backstop.
   */
  it("treats unusable input as unrestricted", () => {
    for (const pc of [null, undefined, "", "   ", "?!", "12345"]) {
      const zone = classifyPostcode(pc);
      expect(zone.twoManAvailable).toBe(true);
      expect(zone.surcharge).toBe(0);
    }
  });
});

describe("needsTwoManDelivery", () => {
  it("is true at and above 40kg", () => {
    expect(needsTwoManDelivery(39.9)).toBe(false);
    expect(needsTwoManDelivery(40)).toBe(true);
    expect(needsTwoManDelivery(63)).toBe(true);
  });

  it("is false when the weight is unknown", () => {
    expect(needsTwoManDelivery(null)).toBe(false);
    expect(needsTwoManDelivery(undefined)).toBe(false);
  });
});

describe("needsTwoManDelivery", () => {
  it("believes the supplier's flag over the weight", () => {
    // The Sorelle sofa is 39.9kg and ships two-man. Under the weight-only
    // rule it fell 0.1kg short of the threshold and showed no warning at all,
    // so a customer in Belfast could buy it and we would unwind the sale.
    expect(needsTwoManDelivery(39.9, "Large")).toBe(true);

    // A 2.6kg framed canvas goes by courier. Flagging it two-man would put a
    // Northern Ireland exclusion on a picture frame.
    expect(needsTwoManDelivery(2.6, "Small")).toBe(false);

    // And a flag beats the threshold in the other direction too.
    expect(needsTwoManDelivery(120, "Small")).toBe(false);
  });

  it("ignores case and padding on the flag", () => {
    expect(needsTwoManDelivery(1, " large ")).toBe(true);
    expect(needsTwoManDelivery(99, "SMALL")).toBe(false);
  });

  it("falls back to weight when there is no flag", () => {
    for (const absent of [undefined, null, "", "   ", "Medium"]) {
      expect(needsTwoManDelivery(63, absent)).toBe(true);
      expect(needsTwoManDelivery(5, absent)).toBe(false);
    }
  });

  it("warns on an unknown heavy item rather than staying quiet", () => {
    // Of the two available errors, a warning nobody needed costs a question
    // and a missing warning costs the order.
    expect(needsTwoManDelivery(TWO_MAN_FROM_KG)).toBe(true);
  });

  it("does not warn when there is no weight and no flag", () => {
    expect(needsTwoManDelivery(null)).toBe(false);
    expect(needsTwoManDelivery(undefined)).toBe(false);
  });
});
