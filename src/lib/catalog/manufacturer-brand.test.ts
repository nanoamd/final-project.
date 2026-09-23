import { describe, expect, it } from "vitest";

import { registrantForGtin, resolveIdentity } from "./manufacturer-brand";

/**
 * The GTINs here are real prefixes from the live catalogue with the remaining
 * digits made up, because the prefix is the only part this module reads and a
 * real barcode in a test file is somebody else's product identifier.
 */
const HILL = "5050140123457";
const PREMIER = "5018705123452";
const PREMIER_SECOND = "5063227123456";
const ANCIENT_WISDOM = "5055796123458";
const UNKNOWN = "4062100123456"; // a German prefix, no registrant on record here

describe("registrantForGtin", () => {
  it("identifies the four registrants in this catalogue", () => {
    expect(registrantForGtin(HILL)).toBe("Hill Interiors");
    expect(registrantForGtin(PREMIER)).toBe("Premier Housewares");
    expect(registrantForGtin(ANCIENT_WISDOM)).toBe("Ancient Wisdom");
    expect(registrantForGtin("5061121123453")).toBe("SaunaPlunge");
  });

  it("maps both Premier Housewares prefixes to one name", () => {
    // 489 products on one prefix and 57 on another. Two GS1 ranges, one
    // company — splitting them would advertise two brands for one supplier.
    expect(registrantForGtin(PREMIER)).toBe(registrantForGtin(PREMIER_SECOND));
  });

  it("maps all three Ancient Wisdom prefixes to one name", () => {
    expect(registrantForGtin("5056368123450")).toBe("Ancient Wisdom");
    expect(registrantForGtin("5055796123458")).toBe("Ancient Wisdom");
    expect(registrantForGtin("5056422123459")).toBe("Ancient Wisdom");
  });

  it("returns null rather than guessing at an unknown prefix", () => {
    expect(registrantForGtin(UNKNOWN)).toBeNull();
  });

  it("is not fooled by whitespace or a non-numeric value", () => {
    expect(registrantForGtin(` ${HILL} `)).toBe("Hill Interiors");
    expect(registrantForGtin("not-a-barcode")).toBeNull();
    expect(registrantForGtin("")).toBeNull();
    expect(registrantForGtin(null)).toBeNull();
  });
});

describe("resolveIdentity", () => {
  it("replaces our brand with the registrant and keeps the barcode", () => {
    // The whole point: brand and GTIN now agree, so the item can match the
    // catalogue entry other retailers list against.
    expect(resolveIdentity({ brand: "Kaiku", gtin: HILL, mpn: null })).toEqual({
      brand: "Hill Interiors",
      gtin: HILL,
      mpn: null,
      identifierExists: true,
    });
  });

  it("drops a barcode whose registrant it cannot name", () => {
    // Sending a wrong brand beside a real GTIN rebuilds the exact mismatch
    // this module exists to remove, so the barcode goes instead.
    expect(
      resolveIdentity({ brand: "Kaiku", gtin: UNKNOWN, mpn: null }),
    ).toEqual({
      brand: "Kaiku",
      gtin: null,
      mpn: null,
      identifierExists: false,
    });
  });

  it("keeps an MPN alive when the unknown barcode is dropped", () => {
    expect(
      resolveIdentity({ brand: "Kaiku", gtin: UNKNOWN, mpn: "CT-04B" }),
    ).toEqual({
      brand: "Kaiku",
      gtin: null,
      mpn: "CT-04B",
      identifierExists: true,
    });
  });

  it("leaves a product with no barcode exactly as it was", () => {
    expect(resolveIdentity({ brand: "Kaiku", gtin: null, mpn: null })).toEqual({
      brand: "Kaiku",
      gtin: null,
      mpn: null,
      identifierExists: false,
    });
    expect(
      resolveIdentity({ brand: "Kaiku", gtin: null, mpn: "831-804V70CW" }),
    ).toEqual({
      brand: "Kaiku",
      gtin: null,
      mpn: "831-804V70CW",
      identifierExists: true,
    });
  });

  it("never claims an identifier exists while sending none", () => {
    // The one combination Google treats as a lie: no gtin, no mpn, and no
    // identifier_exists:no to explain it.
    for (const gtin of [null, UNKNOWN, HILL]) {
      for (const mpn of [null, "CT-04B"]) {
        const out = resolveIdentity({ brand: "Kaiku", gtin, mpn });
        if (!out.gtin && !out.mpn) expect(out.identifierExists).toBe(false);
        if (out.gtin || out.mpn) expect(out.identifierExists).toBe(true);
      }
    }
  });

  it("does not invent a brand for a product that has none", () => {
    expect(
      resolveIdentity({ brand: null, gtin: null, mpn: null }).brand,
    ).toBeNull();
  });

  it("passes a SaunaPlunge product through with its own name intact", () => {
    // Already correctly branded; the registrant agrees, so nothing changes.
    expect(
      resolveIdentity({
        brand: "SaunaPlunge",
        gtin: "5061121123453",
        mpn: null,
      }).brand,
    ).toBe("SaunaPlunge");
  });
});
