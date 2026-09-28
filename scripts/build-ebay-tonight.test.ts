import { describe, expect, it } from "vitest";

import { ebayTitle, vatWarning } from "./build-ebay-tonight";

describe("ebayTitle", () => {
  const base = {
    title: "Avia Mist Armchair | Kaiku",
    materials: ["Fabric", "Wood"],
    colours: ["Grey"],
  };

  it("drops the brand suffix, which is wasted characters on eBay", () => {
    expect(ebayTitle(base)).not.toContain("Kaiku");
  });

  it("adds the material and colour a buyer actually searches for", () => {
    const out = ebayTitle(base);
    expect(out).toContain("Fabric");
    expect(out).toContain("Grey");
  });

  it("never exceeds eBay's 80-character limit", () => {
    const out = ebayTitle({
      title:
        "Provence Collection Outdoor Four Seater Lounge Set With Weatherproof Cushions And Coffee Table | Kaiku",
      materials: ["Rattan", "Aluminium", "Polyester"],
      colours: ["Natural", "Cream"],
    });
    expect(out.length).toBeLessThanOrEqual(80);
  });

  it("cuts on a word boundary, because a half-word reads as a scam listing", () => {
    const out = ebayTitle({
      title:
        "Extremely Long Product Name That Runs Well Past The Limit Without Any Convenient Break At All",
      materials: null,
      colours: null,
    });
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.endsWith(" ")).toBe(false);
    // Whatever it ends on is a whole word from the input.
    const words = out.split(" ");
    expect(
      "Extremely Long Product Name That Runs Well Past The Limit Without Any Convenient Break At All".split(
        " ",
      ),
    ).toContain(words[words.length - 1]);
  });

  it("does not repeat a word already in the name", () => {
    const out = ebayTitle({
      title: "Grey Fabric Armchair",
      materials: ["Fabric"],
      colours: ["Grey"],
    });
    expect(out.match(/Grey/g)).toHaveLength(1);
    expect(out.match(/Fabric/g)).toHaveLength(1);
  });
});

describe("vatWarning", () => {
  const base = {
    costPrice: 100,
    costPriceVatCorrected: true,
    shippingCost: 10,
  };

  it("stays silent when the cost already carries the supplier's VAT", () => {
    expect(vatWarning(base)).toBeNull();
  });

  // The whole point of the warning: Hill is corrected, D.I. Designs is not,
  // and the pack mixes both. Silence on an uncorrected row would put an
  // ex-VAT cost in a table of inclusive ones.
  it("warns when the flag is missing, not just when it is false", () => {
    expect(vatWarning({ ...base, costPriceVatCorrected: null })).toContain(
      "Cost basis unconfirmed",
    );
    expect(vatWarning({ ...base, costPriceVatCorrected: false })).toContain(
      "Cost basis unconfirmed",
    );
  });

  it("sizes the exposure from carriage as well as goods", () => {
    // Supplier carriage is VATable the same way the goods are, so both
    // count: 20% of 100 plus 20% of 10.
    expect(vatWarning({ ...base, costPriceVatCorrected: null })).toContain(
      "£22.00",
    );
  });

  it("survives a product with no recorded cost", () => {
    expect(
      vatWarning({
        costPrice: null,
        costPriceVatCorrected: null,
        shippingCost: null,
      }),
    ).toContain("£0.00");
  });
});
