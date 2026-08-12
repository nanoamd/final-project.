import { describe, expect, it } from "vitest";

import type { SanityProduct } from "@/types/sanity-content";

import {
  buildCompareRows,
  formatDimensions,
  formatWeight,
  NOT_SPECIFIED,
  parseCompareSlugs,
} from "./compare-fields";

/** A product with only what a test needs; the rest is irrelevant to these functions. */
function product(overrides: Partial<SanityProduct> = {}): SanityProduct {
  return {
    slug: "a-table",
    name: "A Table",
    category: "coffee-tables",
    categoryName: "Coffee Tables",
    price: 409,
    currency: "GBP",
    specs: [],
    highlights: [],
    gallery: [],
    faqs: [],
    stockStatus: "In Stock",
    ...overrides,
  } as SanityProduct;
}

describe("formatDimensions", () => {
  it("reads as W × D × H with the stored unit", () => {
    expect(
      formatDimensions(
        product({
          dimensions: { length: 110, width: 80, height: 40, unit: "cm" },
        } as Partial<SanityProduct>),
      ),
    ).toBe("W110 × D80 × H40cm");
  });

  it("omits a missing axis rather than printing a gap", () => {
    expect(
      formatDimensions(
        product({
          dimensions: { length: 90, height: 45, unit: "cm" },
        } as Partial<SanityProduct>),
      ),
    ).toBe("W90 × H45cm");
  });

  it("is null when nothing is recorded", () => {
    expect(formatDimensions(product())).toBeNull();
    expect(
      formatDimensions(
        product({ dimensions: { unit: "cm" } } as Partial<SanityProduct>),
      ),
    ).toBeNull();
  });
});

describe("formatWeight", () => {
  it("includes the unit", () => {
    expect(
      formatWeight(
        product({
          weight: { value: 28, unit: "kg" },
        } as Partial<SanityProduct>),
      ),
    ).toBe("28 kg");
  });

  it("is null when the value is absent", () => {
    expect(formatWeight(product())).toBeNull();
  });
});

describe("buildCompareRows", () => {
  it("returns nothing for no products", () => {
    expect(buildCompareRows([])).toEqual([]);
  });

  it("puts price first, so the comparison starts where the buyer does", () => {
    const rows = buildCompareRows([product(), product({ price: 599 })]);
    expect(rows[0]!.label).toBe("Price");
    expect(rows[0]!.values).toEqual(["£409", "£599"]);
    expect(rows[0]!.differs).toBe(true);
  });

  it("formats pence only when a price has them", () => {
    const rows = buildCompareRows([product({ price: 148.8 })]);
    expect(rows[0]!.values[0]).toBe("£148.80");
  });

  it("marks a row identical across products as not differing", () => {
    const rows = buildCompareRows([product(), product()]);
    expect(rows.find((r) => r.label === "Price")!.differs).toBe(false);
  });

  it("treats a missing value as a difference — one product tells you, the other does not", () => {
    const rows = buildCompareRows([
      product({ deliveryLeadTime: "2–5 days" }),
      product({ deliveryLeadTime: undefined }),
    ]);
    const row = rows.find((r) => r.label === "Delivery")!;
    expect(row.values).toEqual(["2–5 days", null]);
    expect(row.differs).toBe(true);
  });

  it("drops a row no product answers, rather than showing a column of blanks", () => {
    const rows = buildCompareRows([product(), product()]);
    expect(rows.some((r) => r.label === "Materials")).toBe(false);
  });

  it("folds supplier label variants into one comparable row", () => {
    const rows = buildCompareRows([
      product({
        specs: [{ label: "Material", value: "Solid oak" }],
      } as Partial<SanityProduct>),
      product({
        specs: [{ label: "Materials", value: "Walnut veneer" }],
      } as Partial<SanityProduct>),
    ]);
    const materials = rows.filter((r) => r.label === "Materials");
    expect(materials).toHaveLength(1);
    expect(materials[0]!.values).toEqual(["Solid oak", "Walnut veneer"]);
  });

  it("keeps a spec only one product carries", () => {
    const rows = buildCompareRows([
      product({
        specs: [{ label: "Bulb fitting", value: "E27" }],
      } as Partial<SanityProduct>),
      product(),
    ]);
    const row = rows.find((r) => r.label === "Bulb fitting")!;
    expect(row.values).toEqual(["E27", null]);
  });

  it("prefers the structured dimensions over a free-text spec", () => {
    const rows = buildCompareRows([
      product({
        dimensions: { length: 110, width: 80, height: 40, unit: "cm" },
        specs: [{ label: "Dimensions", value: "roughly a metre" }],
      } as Partial<SanityProduct>),
    ]);
    expect(rows.find((r) => r.label === "Dimensions")!.values[0]).toBe(
      "W110 × D80 × H40cm",
    );
  });

  it("exposes NOT_SPECIFIED for the renderer to use", () => {
    expect(NOT_SPECIFIED).toBe("Not specified");
  });
});

describe("parseCompareSlugs", () => {
  it("splits, trims and preserves order", () => {
    expect(parseCompareSlugs("a, b ,c")).toEqual(["a", "b", "c"]);
  });

  it("drops duplicates so a product cannot be compared with itself", () => {
    expect(parseCompareSlugs("a,b,a")).toEqual(["a", "b"]);
  });

  it("caps the list, because a fifth column fits nowhere on a phone", () => {
    expect(parseCompareSlugs("a,b,c,d,e")).toEqual(["a", "b", "c", "d"]);
  });

  it("is empty for nothing at all", () => {
    expect(parseCompareSlugs(undefined)).toEqual([]);
    expect(parseCompareSlugs("")).toEqual([]);
    expect(parseCompareSlugs(" , ")).toEqual([]);
  });
});
