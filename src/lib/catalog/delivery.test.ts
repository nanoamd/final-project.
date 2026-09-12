import { describe, expect, it } from "vitest";

import type { SanityProduct } from "@/types/sanity-content";

import {
  deliveryWindow,
  googleAvailability,
  leadTimeLine,
  schemaOrgAvailability,
  standardWindowForPrice,
} from "./delivery";

const product = (overrides: Partial<SanityProduct> = {}): SanityProduct =>
  ({
    name: "Test Product",
    price: 100,
    stockStatus: "In Stock",
    faqs: [],
    ...overrides,
  }) as SanityProduct;

describe("standardWindowForPrice", () => {
  it("gives 7–14 days under £50", () => {
    expect(standardWindowForPrice(19)).toBe("7–14 days");
    expect(standardWindowForPrice(49.99)).toBe("7–14 days");
  });

  it("gives 2–3 weeks from £50 up to £120", () => {
    expect(standardWindowForPrice(50)).toBe("2–3 weeks");
    expect(standardWindowForPrice(120)).toBe("2–3 weeks");
  });

  it("gives 3–4 weeks above £120", () => {
    expect(standardWindowForPrice(120.01)).toBe("3–4 weeks");
    expect(standardWindowForPrice(6379)).toBe("3–4 weeks");
  });
});

describe("deliveryWindow", () => {
  it("uses the price band when no supplier-confirmed lead time applies", () => {
    expect(deliveryWindow(product({ price: 19 }))).toBe("7–14 days");
    expect(deliveryWindow(product({ price: 300 }))).toBe("3–4 weeks");
  });

  it("ignores a recorded lead time from a supplier that has not confirmed one", () => {
    // Hill Interiors' stored "3–4 weeks" values were normalised punctuation,
    // not a supplier commitment — the band decides for them.
    const p = product({
      price: 65,
      deliveryLeadTime: "3–4 weeks",
      supplier: { name: "Hill Interiors" },
    });
    expect(deliveryWindow(p)).toBe("2–3 weeks");
  });

  it("keeps a made-to-order supplier's real lead time over the band", () => {
    const sauna = product({
      price: 6379,
      deliveryLeadTime: "4–6 weeks",
      supplier: { name: "SaunaPlunge (Outdoor Living 365 Ltd)" },
    });
    expect(deliveryWindow(sauna)).toBe("4–6 weeks");
  });

  it("falls back to the band for a confirmed-lead-time supplier with no recorded value", () => {
    const sauna = product({
      price: 3000,
      supplier: { name: "SaunaPlunge (Outdoor Living 365 Ltd)" },
    });
    expect(deliveryWindow(sauna)).toBe("3–4 weeks");
  });

  it("always answers, even with no price recorded at all", () => {
    expect(deliveryWindow(product({ price: undefined }))).toBe("7–14 days");
  });
});

describe("leadTimeLine", () => {
  it("reads as a sentence", () => {
    expect(leadTimeLine(product({ price: 19 }))).toBe("Delivered in 7–14 days");
  });
});

describe("googleAvailability", () => {
  it("maps the statuses Studio can set", () => {
    expect(googleAvailability("In Stock")).toBe("in stock");
    expect(googleAvailability("Made to Order")).toBe("backorder");
    expect(googleAvailability("Backorder")).toBe("backorder");
    expect(googleAvailability("Out of Stock")).toBe("out of stock");
  });

  it("treats a missing status as backorder, not out of stock", () => {
    // The 127 importer-created products. The storefront sells them, so
    // withholding them from free listings as 'out of stock' is both untrue
    // and the expensive answer.
    expect(googleAvailability(null)).toBe("backorder");
    expect(googleAvailability(undefined)).toBe("backorder");
    expect(googleAvailability("   ")).toBe("backorder");
  });

  it("keeps Coming Soon out of stock, since it cannot be ordered", () => {
    expect(googleAvailability("Coming Soon")).toBe("out of stock");
  });

  it("stays conservative on a status it has not been taught", () => {
    expect(googleAvailability("Discontinued")).toBe("out of stock");
  });
});

describe("schemaOrgAvailability", () => {
  it("maps the statuses Studio can set", () => {
    expect(schemaOrgAvailability("In Stock")).toBe(
      "https://schema.org/InStock",
    );
    expect(schemaOrgAvailability("Backorder")).toBe(
      "https://schema.org/BackOrder",
    );
    expect(schemaOrgAvailability("Out of Stock")).toBe(
      "https://schema.org/OutOfStock",
    );
    expect(schemaOrgAvailability("Coming Soon")).toBe(
      "https://schema.org/OutOfStock",
    );
  });

  it("always returns a value, so the Offer never ships without availability", () => {
    // The bug this replaced: a Record lookup returned undefined for the 127
    // products with no status, and JSON.stringify drops undefined keys, so
    // availability — a required attribute — was absent entirely.
    expect(schemaOrgAvailability(null)).toBe("https://schema.org/BackOrder");
    expect(schemaOrgAvailability(undefined)).toBe(
      "https://schema.org/BackOrder",
    );
    expect(schemaOrgAvailability("Discontinued")).toBe(
      "https://schema.org/OutOfStock",
    );
  });

  it("agrees with the feed on every input", () => {
    const equivalent: Record<string, string> = {
      "in stock": "https://schema.org/InStock",
      backorder: "https://schema.org/BackOrder",
      "out of stock": "https://schema.org/OutOfStock",
    };
    for (const status of [
      "In Stock",
      "Out of Stock",
      "Backorder",
      "Made to Order",
      "Coming Soon",
      "Discontinued",
      null,
      undefined,
      "  ",
    ]) {
      expect(schemaOrgAvailability(status)).toBe(
        equivalent[googleAvailability(status)],
      );
    }
  });
});
