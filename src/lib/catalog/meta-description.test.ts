import { describe, expect, it } from "vitest";

import {
  buildMetaDescription,
  META_LIMIT,
  type MetaInput,
} from "./meta-description";

const HOLDER: MetaInput = {
  title: "Glass Candle Holder | Kaiku",
  category: "Candles & Lanterns",
  dimensions: { height: 33, length: 14, width: 14, unit: "cm" },
  weight: { value: 3.5, unit: "kg" },
  material: "glass",
  extra: { "Candle Type": "Use With LED Faux Candles Only" },
};

describe("it leads with a fact, not with boilerplate", () => {
  it("puts a real measurement in front of the reader", () => {
    const meta = buildMetaDescription(HOLDER);
    expect(meta).toContain("33cm tall");
    expect(meta.startsWith("Glass Candle Holder")).toBe(true);
  });

  it("drops the phrases that were identical across 287 products", () => {
    const meta = buildMetaDescription(HOLDER);
    expect(meta).not.toMatch(/Shop the/i);
    expect(meta).not.toMatch(/Premium UK homewares/i);
    expect(meta).not.toMatch(/modern living/i);
  });

  it("keeps the free delivery promise, which is true and worth the space", () => {
    expect(buildMetaDescription(HOLDER)).toContain("Free UK delivery.");
  });

  it("never exceeds what Google will show", () => {
    const long: MetaInput = {
      ...HOLDER,
      title:
        "Set Of Three Wooden Lanterns With Traditional Cross Section And Extra Words | Kaiku",
      material: "reclaimed weathered oak timber",
    };
    expect(buildMetaDescription(long).length).toBeLessThanOrEqual(META_LIMIT);
  });

  it("never cuts a word in half when trimming", () => {
    const meta = buildMetaDescription({
      ...HOLDER,
      title: "A Very Long Product Name That Goes On And On And On | Kaiku",
    });
    expect(meta.endsWith("Free UK delivery.")).toBe(true);
  });
});

describe("nothing is claimed that is not known", () => {
  it("says only the name when no facts exist", () => {
    expect(buildMetaDescription({ title: "Mystery Item | Kaiku" })).toBe(
      "Mystery Item. Free UK delivery.",
    );
  });

  it("omits the material claim when the supplier and name disagree", () => {
    // The name still says Glass — that is the product's name and is not in
    // dispute. What is suppressed is Kaiku asserting the material as fact.
    const meta = buildMetaDescription({ ...HOLDER, materialDisputed: true });
    expect(meta).not.toMatch(/\bin glass\b/i);
    expect(meta).toContain("33cm tall");
    expect(buildMetaDescription(HOLDER)).toMatch(/\bin glass\b/i);
  });

  it("does not mention weight for something light", () => {
    expect(buildMetaDescription(HOLDER)).not.toMatch(/3\.5kg/);
  });

  it("mentions weight when it is a two-person lift and there is room", () => {
    const meta = buildMetaDescription({
      title: "Drinks Unit | Kaiku",
      dimensions: null,
      weight: { value: 29, unit: "kg" },
    });
    expect(meta).toContain("29kg");
  });
});

describe("two products do not read the same", () => {
  it("varies with the facts each product holds", () => {
    const a = buildMetaDescription(HOLDER);
    const b = buildMetaDescription({
      ...HOLDER,
      title: "Stone Lantern | Kaiku",
      dimensions: { height: 104, length: 31, width: 31, unit: "cm" },
      material: "wood",
    });
    expect(a).not.toBe(b);
  });
});
