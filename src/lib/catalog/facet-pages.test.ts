import { describe, expect, it } from "vitest";

import {
  facetHeading,
  facetPagesFor,
  facetPath,
  type FacetProduct,
  facetSlug,
  MAX_SHARE,
  MIN_PRODUCTS,
  productsForFacet,
} from "./facet-pages";

/** `n` products carrying `tags` as their colour, at `price`. */
function many(n: number, over: Partial<FacetProduct> = {}): FacetProduct[] {
  return Array.from({ length: n }, () => ({ price: 200, ...over }));
}

describe("facetPagesFor", () => {
  it("generates nothing for a category too small to split", () => {
    expect(
      facetPagesFor(many(MIN_PRODUCTS - 1, { colourTags: ["Grey"] })),
    ).toEqual([]);
  });

  it("generates a page once a tag clears the floor", () => {
    const products = [
      ...many(MIN_PRODUCTS, { colourTags: ["Grey"] }),
      ...many(20, { colourTags: ["Black"] }),
    ];
    const pages = facetPagesFor(products);
    expect(pages.map((page) => page.value)).toContain("grey");
    expect(pages.find((page) => page.value === "grey")?.count).toBe(
      MIN_PRODUCTS,
    );
  });

  it("does not generate a page one product below the floor", () => {
    const products = [
      ...many(MIN_PRODUCTS - 1, { colourTags: ["Grey"] }),
      ...many(30, { colourTags: ["Black"] }),
    ];
    expect(facetPagesFor(products).some((page) => page.value === "grey")).toBe(
      false,
    );
  });

  /**
   * The rule that stops this becoming the crawl trap it replaces. A tag on
   * nearly every product in a category produces a page that IS the category
   * page — which is duplicate content, not a new page.
   */
  it("refuses a tag that covers almost the whole category", () => {
    const products = many(100, { colourTags: ["Grey"] });
    expect(facetPagesFor(products).some((page) => page.value === "grey")).toBe(
      false,
    );
  });

  it("allows a tag just inside the ceiling", () => {
    const share = Math.floor(100 * MAX_SHARE) - 1;
    const products = [
      ...many(share, { colourTags: ["Grey"] }),
      ...many(100 - share, { colourTags: ["Black"] }),
    ];
    expect(facetPagesFor(products).some((page) => page.value === "grey")).toBe(
      true,
    );
  });

  /**
   * Style tags are excluded on purpose: "Modern" and "Contemporary" are each
   * on 115 of the 138 lighting products, so those pages would duplicate each
   * other and the category at once.
   */
  it("never generates a style page", () => {
    const products = many(40, {
      colourTags: ["Grey"],
      materialTags: ["Oak"],
    }) as (FacetProduct & { styleTags?: string[] })[];
    for (const product of products) product.styleTags = ["Modern"];
    expect(
      facetPagesFor(products).some((page) => page.value === "modern"),
    ).toBe(false);
  });

  it("generates price bands, and only the ones that split the category", () => {
    const products = [
      ...many(20, { price: 50, colourTags: ["Grey"] }),
      ...many(20, { price: 800, colourTags: ["Black"] }),
    ];
    const bands = facetPagesFor(products).filter(
      (page) => page.kind === "under",
    );
    // under £100 holds 20 of 40 — a real split.
    expect(bands.map((band) => band.value)).toContain("100");
    // under £1,000 holds all 40, which is the category page again.
    expect(bands.map((band) => band.value)).not.toContain("1000");
  });

  it("orders colour, then material, then price", () => {
    const products = [
      ...many(12, { colourTags: ["Grey"], materialTags: ["Oak"], price: 50 }),
      ...many(12, {
        colourTags: ["Black"],
        materialTags: ["Glass"],
        price: 900,
      }),
    ];
    const kinds = facetPagesFor(products).map((page) => page.kind);
    expect(kinds).toEqual(
      [...kinds].sort((a, b) => {
        const order = { colour: 0, material: 1, under: 2 };
        return order[a] - order[b];
      }),
    );
  });

  it("matches a tag whatever case it was written in", () => {
    // Mixed with other products on purpose: a tag on 100% of a category is
    // refused by the ceiling regardless of case, which would make this pass
    // for the wrong reason.
    const products = [
      ...many(10, { colourTags: ["grey"] }),
      ...many(10, { colourTags: ["Black"] }),
    ];
    expect(facetPagesFor(products).some((page) => page.value === "grey")).toBe(
      true,
    );
  });
});

describe("productsForFacet", () => {
  const products = [
    { price: 50, colourTags: ["Grey"], materialTags: ["Oak"] },
    { price: 300, colourTags: ["Black"], materialTags: ["Oak"] },
    { price: 900, colourTags: ["Grey"], materialTags: ["Glass"] },
  ];

  it("selects by colour", () => {
    expect(productsForFacet(products, "colour", "grey")).toHaveLength(2);
  });

  it("selects by material", () => {
    expect(productsForFacet(products, "material", "oak")).toHaveLength(2);
  });

  it("selects by price band, exclusive of the boundary", () => {
    expect(productsForFacet(products, "under", "500")).toHaveLength(2);
    expect(productsForFacet(products, "under", "100")).toHaveLength(1);
  });

  it("returns nothing for a value outside the vocabulary", () => {
    // The route uses this to 404 rather than render an empty page for any
    // string somebody types into the URL bar.
    expect(productsForFacet(products, "colour", "banana")).toEqual([]);
    expect(productsForFacet(products, "under", "7")).toEqual([]);
  });

  it("ignores a product with no price when filtering by price", () => {
    expect(
      productsForFacet([{ price: null, colourTags: [] }], "under", "500"),
    ).toEqual([]);
  });
});

describe("naming", () => {
  it("slugs a multi-word tag", () => {
    expect(facetSlug("Art Deco")).toBe("art-deco");
  });

  it("leads with the adjective, the way the search is typed", () => {
    expect(facetHeading("Garden Furniture", "material", "Rattan")).toBe(
      "Rattan Garden Furniture",
    );
    expect(facetHeading("Sofas", "under", "under £500")).toBe(
      "Sofas under £500",
    );
  });

  it("builds a path that cannot collide with a product slug", () => {
    // /shop/sofas/grey would be caught by [product]; four segments cannot be.
    expect(facetPath("sofas", "colour", "grey")).toBe(
      "/shop/sofas/colour/grey",
    );
  });
});
