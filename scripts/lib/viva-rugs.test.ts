import { describe, expect, it } from "vitest";

import {
  colourTagsFrom,
  deriveTitle,
  designFrom,
  dimensionsFrom,
  distinguishingWord,
  materialTagFrom,
  representativeVariant,
  type VivaProduct,
} from "./viva-rugs";

const body = (colour: string, material: string, design: string) => `
<p data-mce-fragment="1">Soft Woven Quality Low Pile Rugs</p>
<p>✔️ Easy-Care and Non-Shedding</p>
<p>✔️ 4 Sides Overlocking</p>
<p>- Colour: ${colour}</p>
<p>- Design: ${design}</p>
<p>- Material:  ${material}</p>
<p>- Pile Height approx: 10 mm</p>
`;

const product = (overrides: Partial<VivaProduct> = {}): VivaProduct => ({
  id: 1,
  title:
    "Deep Purple Rug Geometric Large XL Small Soft Modern Room Carpet Abstract Rug",
  handle: "deep-purple-rug",
  body_html: body(
    "Dark Purple and Black",
    "100% Soft Polypropylene",
    "Abstract Geometric Pattern",
  ),
  images: [{ src: "https://cdn.shopify.com/a.jpg" }],
  variants: [
    {
      title: "120x170cm (4'x5'6'')",
      sku: "sku-s",
      price: "37.99",
      available: false,
    },
    {
      title: "160x225cm (5'4x7'4'')",
      sku: "sku-m",
      price: "66.98",
      available: true,
    },
  ],
  tags: [],
  ...overrides,
});

describe("colourTagsFrom", () => {
  it("finds every mappable colour word regardless of punctuation", () => {
    const p = product({ body_html: body("Dark Purple and Black", "x", "x") });
    expect(colourTagsFrom(p)).toEqual(["Black"]);
  });

  it("handles a comma-separated list", () => {
    const p = product({
      body_html: body("Cream, Beige, Brown, Black", "x", "x"),
    });
    expect(colourTagsFrom(p)).toEqual(["Cream", "Neutral", "Brown", "Black"]);
  });

  it("handles a space-separated list with no punctuation at all", () => {
    const p = product({
      body_html: body(
        "Grey Beige White Mustard Yellow Purple Green Blue",
        "x",
        "x",
      ),
    });
    const tags = colourTagsFrom(p);
    expect(tags).toContain("Grey");
    expect(tags).toContain("Green");
    expect(tags).toContain("Blue");
    // "Mustard" and mapped-null words (Yellow, Purple) are correctly absent.
    expect(tags).not.toContain("Yellow");
  });

  it("returns nothing when there is no Colour line or Color_ tag", () => {
    const p = product({ body_html: "<p>no spec table here</p>", tags: [] });
    expect(colourTagsFrom(p)).toEqual([]);
  });

  it("reads Shopify's own Color_ tags", () => {
    const p = product({
      body_html: "<p>Colour: See photos</p>",
      tags: ["Color_Grey", "Design_Modern"],
    });
    expect(colourTagsFrom(p)).toEqual(["Grey"]);
  });

  it("combines a Color_ tag with a colour word found only in the text", () => {
    const p = product({
      body_html: body("Cream", "x", "x"),
      tags: ["Color_Grey"],
    });
    const tags = colourTagsFrom(p);
    expect(tags).toContain("Grey");
    expect(tags).toContain("Cream");
  });
});

describe("materialTagFrom", () => {
  it("maps the supplier's three misspellings of the same shag texture", () => {
    for (const spelling of ["Frisee", "Friese", "Frese"])
      expect(
        materialTagFrom(
          body("x", `100% ${spelling} (Soft Polypropylene)`, "x"),
        ),
      ).toBe("Polypropylene");
  });

  it("maps a plain polypropylene line", () => {
    expect(materialTagFrom(body("x", "100% Polypropylene", "x"))).toBe(
      "Polypropylene",
    );
  });

  it("maps cotton and wool", () => {
    expect(materialTagFrom(body("x", "100% Cotton (Flatweave)", "x"))).toBe(
      "Cotton",
    );
    expect(materialTagFrom(body("x", "100% Wool", "x"))).toBe("Wool");
  });

  it("keeps polyester distinct from polypropylene", () => {
    expect(materialTagFrom(body("x", "100% Polyester", "x"))).toBe("Polyester");
  });

  it("returns null for a bare percentage with nothing after it", () => {
    expect(materialTagFrom(body("x", "100%", "x"))).toBeNull();
  });

  it("returns null for a blend too rare to tag", () => {
    expect(materialTagFrom(body("x", "100% Nylone", "x"))).toBeNull();
  });
});

describe("designFrom", () => {
  it("reads the design line and trims a trailing parenthetical", () => {
    expect(
      designFrom(body("x", "x", "African Safari Pattern (Animal Print)")),
    ).toBe("African Safari Pattern");
  });

  it("returns null when there is no Design line", () => {
    expect(designFrom("<p>nothing here</p>")).toBeNull();
  });

  it("strips a design line that already ends in 'Rug', so titles never double it", () => {
    expect(designFrom(body("x", "x", "Monochrome Plain Rug"))).toBe(
      "Monochrome Plain",
    );
  });
});

describe("deriveTitle", () => {
  it("builds a plain title from colour and design rather than the keyword-stuffed original", () => {
    expect(deriveTitle(product())).toBe("Black Abstract Geometric Pattern Rug");
  });

  it("falls back to the design alone when no colour maps", () => {
    const p = product({
      body_html: body("Mustard", "x", "Oriental Greek Key Border"),
    });
    expect(deriveTitle(p)).toBe("Oriental Greek Key Border Rug");
  });

  it("falls back to a de-duplicated slice of the original title when neither is present", () => {
    const p = product({
      title: "Large Small XL Large Rug",
      body_html: "<p>no spec table</p>",
    });
    const title = deriveTitle(p);
    expect(title.endsWith("Rug")).toBe(true);
    // "Large" appeared twice in the source title and must not appear twice here.
    expect(title.match(/Large/g)).toHaveLength(1);
  });
});

describe("distinguishingWord", () => {
  it("finds a real word from the supplier's title not already in the derived title", () => {
    const p = product({
      title: "Modern Animal Alpaca Pattern Large Small Rug",
    });
    expect(distinguishingWord(p, "Modern Rug")).toBe("Animal");
  });

  it("skips generic filler words the supplier repeats for search coverage", () => {
    const p = product({ title: "Large Small XL Soft Modern Room Carpet Rug" });
    expect(distinguishingWord(p, "Modern Rug")).toBeNull();
  });

  it("returns null when every word in the source title is already present", () => {
    const p = product({ title: "Modern Rug" });
    expect(distinguishingWord(p, "Modern Rug")).toBeNull();
  });
});

describe("dimensionsFrom", () => {
  it("reads metric dimensions ahead of the imperial parenthetical", () => {
    expect(dimensionsFrom("120x170cm (4'x5'6'')")).toEqual({
      length: 120,
      width: 170,
    });
  });

  it("returns null when the variant title has no metric size", () => {
    expect(dimensionsFrom("Small")).toBeNull();
  });
});

describe("representativeVariant", () => {
  it("prefers the first variant that is actually available", () => {
    expect(representativeVariant(product()).sku).toBe("sku-m");
  });

  it("falls back to the first variant when none are available", () => {
    const p = product({
      variants: [
        { title: "120x170cm", sku: "a", price: "1", available: false },
        { title: "160x225cm", sku: "b", price: "2", available: false },
      ],
    });
    expect(representativeVariant(p).sku).toBe("a");
  });
});
