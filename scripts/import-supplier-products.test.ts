import { describe, expect, it } from "vitest";

import {
  cleanSupplierTitle,
  freeDeliveryStated,
  leadTimeFromHtml,
  parseColours,
  parseDimensions,
  parseWeightKg,
  titleFingerprint,
  tradeLanguageIn,
} from "./import-supplier-products";

describe("cleanSupplierTitle", () => {
  it("replaces the supplier's SEO tail with ours", () => {
    expect(
      cleanSupplierTitle(
        "Abberley Brown Coffee Table | Trade Furniture | DI Designs",
      ),
    ).toBe("Abberley Brown Coffee Table | Kaiku");
  });

  it("keeps a segment that carries product information", () => {
    // The size is not branding — dropping it would lose the only thing telling
    // two variants apart.
    expect(
      cleanSupplierTitle(
        "Himalayan Salt BBQ Plate | 30 x 20 x 5cm | DI Designs",
      ),
    ).toBe("Himalayan Salt BBQ Plate | 30 x 20 x 5cm | Kaiku");
  });

  it("does not duplicate an existing Kaiku suffix on a re-import", () => {
    expect(cleanSupplierTitle("Witley Coffee Table | Kaiku")).toBe(
      "Witley Coffee Table | Kaiku",
    );
  });

  it("adds the suffix to a plain title", () => {
    expect(
      cleanSupplierTitle("Pershore Rectangular Aged Oak Coffee Table"),
    ).toBe("Pershore Rectangular Aged Oak Coffee Table | Kaiku");
  });

  it("never strips the first segment, even when it reads like a brand", () => {
    expect(cleanSupplierTitle("DI Designs | Free UK Delivery")).toBe(
      "DI Designs | Kaiku",
    );
  });

  it("drops several branding segments at once", () => {
    expect(
      cleanSupplierTitle(
        "Crofton Coffee Table | Wholesale | Buy Online | Home",
      ),
    ).toBe("Crofton Coffee Table | Kaiku");
  });
});

describe("titleFingerprint", () => {
  it("matches the same product under a different word order", () => {
    // The actual case: the supplier's page against what is already listed.
    expect(titleFingerprint("Abberley Brown Coffee Table | Kaiku")).toBe(
      titleFingerprint("Abberley Coffee Table in Brown | Kaiku"),
    );
  });

  it("keeps two colourways of one table apart", () => {
    expect(titleFingerprint("Bentley Coffee Table in Oak")).not.toBe(
      titleFingerprint("Bentley Coffee Table in Grey"),
    );
  });

  it("keeps two sizes of one product apart", () => {
    expect(titleFingerprint("Natural Teak Corner Shelf Unit 3 Tier")).not.toBe(
      titleFingerprint("Natural Teak Corner Shelf Unit 4 Tier"),
    );
  });

  it("ignores punctuation and case", () => {
    expect(titleFingerprint("Reclaimed Teak — Console Table, 3 Drawers")).toBe(
      titleFingerprint("reclaimed teak console table 3 drawers"),
    );
  });

  it("is unaffected by the Kaiku suffix, so an import matches a listed product", () => {
    expect(titleFingerprint("Witley Coffee Table | Kaiku")).toBe(
      titleFingerprint("Witley Coffee Table"),
    );
  });

  it("does not collapse genuinely different products", () => {
    expect(titleFingerprint("Small Reclaimed Teak Coffee Table")).not.toBe(
      titleFingerprint("Large Reclaimed Teak Coffee Table"),
    );
  });
});

describe("parseDimensions", () => {
  it('reads "110W x 50D x 40H cm" with W as length and D as width', () => {
    // Matches how the Abberley was entered by hand from this exact string, which
    // is the convention the product page prints in.
    expect(parseDimensions("110W x 50D x 40H cm")).toEqual({
      length: 110,
      width: 50,
      height: 40,
      unit: "cm",
    });
  });

  it("handles mm and decimals", () => {
    expect(parseDimensions("1200W x 807.5D x 450H mm")).toEqual({
      length: 1200,
      width: 807.5,
      height: 450,
      unit: "mm",
    });
  });

  it("returns null with no unit, rather than guessing one", () => {
    expect(parseDimensions("110W x 50D x 40H")).toBeNull();
  });

  it("returns null when an axis is missing", () => {
    expect(parseDimensions("110W x 50D cm")).toBeNull();
  });
});

describe("parseWeightKg", () => {
  it("reads kg", () => {
    expect(parseWeightKg("25 kg")).toBe(25);
    expect(parseWeightKg("30kg")).toBe(30);
  });

  it("converts grams", () => {
    expect(parseWeightKg("115 g")).toBeCloseTo(0.115);
  });

  it("returns null on nothing weighable", () => {
    expect(parseWeightKg("heavy")).toBeNull();
  });
});

describe("leadTimeFromHtml", () => {
  it("reads the shipping sentence into the form the page expects", () => {
    expect(
      leadTimeFromHtml(
        "<p>Shipping Our products are typically ready to ship within 7-10 days for all items in stock.</p>",
      ),
    ).toBe("7–10 days");
  });

  it("pluralises a singular unit and keeps an en dash", () => {
    expect(leadTimeFromHtml("<p>Dispatched in 2-4 week</p>")).toBe("2–4 weeks");
  });

  it("returns null when no range is stated", () => {
    expect(leadTimeFromHtml("<p>Delivery available.</p>")).toBeNull();
  });
});

describe("freeDeliveryStated", () => {
  it("detects an explicit free-delivery claim", () => {
    expect(freeDeliveryStated("<p>Free UK mainland delivery.</p>")).toBe(true);
    expect(
      freeDeliveryStated("<p>Delivery is included in the price.</p>"),
    ).toBe(true);
  });

  it("does not fire on a page that merely mentions delivery", () => {
    // The costly false positive: this would write £0 carriage and overstate the
    // margin on a product that is actually billed £80 to ship.
    expect(
      freeDeliveryStated(
        "<p>Delivery takes 7-10 days. Delivery charges apply.</p>",
      ),
    ).toBe(false);
  });
});

describe("tradeLanguageIn", () => {
  it("flags copy written for trade buyers", () => {
    const found = tradeLanguageIn(
      "Made for trade professionals. Ideal for hotel lobbies, a show home lounge, or a rental property.",
    );
    expect(found).toContain("trade professionals");
    expect(found).toContain("show home");
  });

  it("finds nothing in ordinary retail copy", () => {
    expect(
      tradeLanguageIn(
        "A glass-topped coffee table in oak, with a lower shelf for books.",
      ),
    ).toEqual([]);
  });
});

describe("parseColours", () => {
  it("splits a colourway list", () => {
    expect(parseColours("Brown, Oak")).toEqual(["Brown", "Oak"]);
  });

  it("drops stray single characters", () => {
    expect(parseColours("Brown, -, Oak")).toEqual(["Brown", "Oak"]);
  });
});
