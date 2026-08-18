import { describe, expect, it } from "vitest";

import type { SanityProduct } from "@/types/sanity-content";

import {
  deliveryWindow,
  leadTimeLine,
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
