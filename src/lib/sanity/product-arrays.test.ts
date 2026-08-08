import { describe, expect, it } from "vitest";

import { withProductArrayDefaults } from "@/lib/sanity/product-arrays";

describe("withProductArrayDefaults", () => {
  /**
   * The shape that took a live product page down: a fully filled-in product
   * with a description, price, gallery and FAQs, and no specs or highlights,
   * because nothing in Studio requires them. GROQ returned null for each and
   * `product.highlights.map` threw.
   */
  it("replaces the nulls GROQ returns for absent arrays", () => {
    const raw = {
      name: "Portable Charcoal BBQ Grill with Wheels & Lid | Kaiku",
      price: 64.95,
      gallery: [{ url: "https://example.com/a.jpg" }],
      faqs: [{ question: "Is this charcoal?", answer: "Yes." }],
      specs: null,
      highlights: null,
      badges: null,
      styleTags: null,
      options: null,
      downloads: null,
      relatedSlugs: null,
    };

    const product = withProductArrayDefaults(raw);

    expect(product.specs).toEqual([]);
    expect(product.highlights).toEqual([]);
    expect(product.badges).toEqual([]);
    expect(product.styleTags).toEqual([]);
    expect(product.options).toEqual([]);
    expect(product.downloads).toEqual([]);
    expect(product.relatedSlugs).toEqual([]);
  });

  it("fills in fields the projection omitted entirely", () => {
    const product = withProductArrayDefaults({ name: "Bare" });
    expect(product.gallery).toEqual([]);
    expect(product.specs).toEqual([]);
    expect(product.faqs).toEqual([]);
  });

  it("leaves populated arrays exactly as they were", () => {
    const gallery = [{ url: "https://example.com/a.jpg" }];
    const highlights = ["Charcoal fired", "Wheeled"];
    const product = withProductArrayDefaults({ gallery, highlights });
    expect(product.gallery).toBe(gallery);
    expect(product.highlights).toBe(highlights);
  });

  it("does not mutate the document it was given", () => {
    const raw = { specs: null };
    withProductArrayDefaults(raw);
    expect(raw.specs).toBeNull();
  });

  it("treats an empty array as already correct", () => {
    const product = withProductArrayDefaults({ specs: [] });
    expect(product.specs).toEqual([]);
  });
});
