import { describe, expect, it } from "vitest";

import {
  categoryCode,
  colourCode,
  formatSku,
  isCanonicalSku,
  nameSegment,
  skuStem,
} from "./sku";

describe("categoryCode", () => {
  it("uses the tuned code for a known category", () => {
    expect(categoryCode("coffee-tables")).toBe("CT");
    expect(categoryCode("candles-and-lanterns")).toBe("CAND");
  });

  it("keeps codes distinct for categories that share a prefix", () => {
    const codes = [
      categoryCode("bedside-tables"),
      categoryCode("bedroom-storage"),
      categoryCode("bedroom-lighting"),
      categoryCode("bedroom-mirrors"),
    ];
    expect(new Set(codes).size).toBe(4);
  });

  it("derives initials for a category not in the map, so a new one still works", () => {
    expect(categoryCode("bathroom-towel-rails")).toBe("BTR");
  });

  it("takes the first four letters of a single-word slug", () => {
    expect(categoryCode("hammocks")).toBe("HAMM");
  });

  it("falls back to GEN with no category at all", () => {
    expect(categoryCode(null)).toBe("GEN");
  });
});

describe("colourCode", () => {
  it("maps a canonical colour", () => {
    expect(colourCode("Brown")).toBe("BRN");
    expect(colourCode("Ivory")).toBe("IVY");
  });

  it("returns null for no colour, so the segment is omitted entirely", () => {
    expect(colourCode(null)).toBeNull();
    expect(colourCode("Chartreuse")).toBeNull();
  });
});

describe("nameSegment", () => {
  it("takes the distinctive words, not the category noun", () => {
    expect(nameSegment("Abberley Coffee Table")).toBe("ABBERLEY");
  });

  it("strips the Kaiku suffix", () => {
    expect(nameSegment("Witley Coffee Table | Kaiku")).toBe("WITLEY");
  });

  it("skips size words that identify nothing", () => {
    expect(nameSegment("Large Reclaimed Wood Coffee Table")).toBe("RECLAIMED");
  });

  it("takes the range name, not the second descriptive word", () => {
    expect(nameSegment("Hampton Shagreen Bedside Table")).toBe("HAMPTON");
  });

  it("does not repeat the category noun the code already carries", () => {
    expect(nameSegment("Bentley Coffee Table in Oak")).toBe("BENTLEY");
  });

  it("falls back to the title's own first word when every word is noise", () => {
    // Otherwise this would produce an empty segment and a malformed code.
    expect(nameSegment("Coffee Table")).toBe("COFFEE");
  });

  it("survives a title with no letters at all", () => {
    expect(nameSegment("123 456")).toBe("ITEM");
  });

  it("drops punctuation rather than encoding it", () => {
    expect(nameSegment("Elmley & Sons' Table")).toBe("ELMLEY");
  });

  it("never exceeds the 12-character cap the format allows", () => {
    expect(nameSegment("Northumberlandshire Sideboard").length).toBe(12);
  });

  it("never yields a one-letter segment from a stripped measurement", () => {
    // "13.6m" reduces to a bare "m" once digits go, which identifies nothing
    // and fails isCanonicalSku — so every re-run would rewrite it forever.
    const segment = nameSegment(
      "13.6m Warm White Decorative LED String Lights",
    );
    expect(segment.length).toBeGreaterThanOrEqual(2);
    expect(segment).toBe("WARM");
  });

  it("produces a code that passes its own validity check", () => {
    for (const title of [
      "13.6m Warm White Decorative LED String Lights",
      "2.75m\\9ft Plug-In LED 8 Sequence Warm White Cluster String",
      "7.2m Plug In LED Warm White Cluster Micro Lights",
      "Coffee Table",
      "123 456",
    ]) {
      const sku = formatSku(skuStem({ title, categorySlug: "lighting" }), 1);
      expect(isCanonicalSku(sku), `${title} -> ${sku}`).toBe(true);
    }
  });
});

describe("skuStem", () => {
  it("builds the documented shape", () => {
    expect(
      skuStem({
        title: "Abberley Coffee Table",
        categorySlug: "coffee-tables",
        primaryColour: "Brown",
      }),
    ).toBe("KK-CT-ABBERLEY-BRN");
  });

  it("omits the colour segment when the product has none", () => {
    expect(
      skuStem({
        title: "Abberley Coffee Table",
        categorySlug: "coffee-tables",
      }),
    ).toBe("KK-CT-ABBERLEY");
  });
});

describe("formatSku", () => {
  it("zero-pads the sequence", () => {
    expect(formatSku("KK-CT-ABBERLEY-BRN", 1)).toBe("KK-CT-ABBERLEY-BRN-001");
    expect(formatSku("KK-CT-ABBERLEY-BRN", 42)).toBe("KK-CT-ABBERLEY-BRN-042");
  });
});

describe("isCanonicalSku", () => {
  it("accepts a code this module would produce, with and without colour", () => {
    expect(isCanonicalSku("KK-CT-ABBERLEY-BRN-001")).toBe(true);
    expect(isCanonicalSku("KK-SA-PENNINE-001")).toBe(true);
  });

  it("rejects every legacy format found in the catalogue", () => {
    expect(isCanonicalSku("24456")).toBe(false);
    expect(isCanonicalSku("HIL-23674")).toBe(false);
    expect(isCanonicalSku("AW-ACShop-01")).toBe(false);
    expect(isCanonicalSku("KA-HILL-20696")).toBe(false);
    expect(isCanonicalSku("KK-DL-23677")).toBe(false);
    expect(isCanonicalSku("DI-CT-ABB-BLK-001")).toBe(false);
  });

  it("rejects an absent code", () => {
    expect(isCanonicalSku(null)).toBe(false);
    expect(isCanonicalSku("")).toBe(false);
  });
});
