import { describe, expect, it } from "vitest";

import { colourTagForOptionValue } from "@/lib/catalog/facets";
import type { SanityProduct } from "@/types/sanity-content";

import {
  applyShopQuery,
  describeQuery,
  EMPTY_QUERY,
  facetCounts,
  isEmptyQuery,
  parseShopQuery,
  sortHref,
  toggleFacetHref,
  variantImageForQuery,
} from "./shop-query";

function product(overrides: Partial<SanityProduct> = {}): SanityProduct {
  return {
    slug: "a",
    name: "A",
    category: "coffee-tables",
    categoryName: "Coffee Tables",
    price: 100,
    currency: "GBP",
    summary: "",
    specs: [],
    highlights: [],
    gallery: [],
    faqs: [],
    stockStatus: "In Stock",
    ...overrides,
  } as SanityProduct;
}

describe("parseShopQuery", () => {
  it("reads a comma-separated facet", () => {
    expect(parseShopQuery({ colour: "Black,Grey" }).facets.colour).toEqual([
      "Black",
      "Grey",
    ]);
  });

  it("accepts a hand-typed lower-case URL but stores the vocabulary's casing", () => {
    // So a shared or hand-edited link works, and so the rendered chip and the
    // comparison agree on one spelling.
    expect(parseShopQuery({ colour: "black" }).facets.colour).toEqual([
      "Black",
    ]);
  });

  it("ignores a value outside the vocabulary rather than emptying the grid", () => {
    // A URL is user input. An unknown value must not constrain anything, or the
    // shop looks broken instead of unfiltered.
    expect(
      parseShopQuery({ colour: "Chartreuse" }).facets.colour,
    ).toBeUndefined();
  });

  it("keeps the valid half of a mixed list", () => {
    expect(
      parseShopQuery({ colour: "Black,Chartreuse" }).facets.colour,
    ).toEqual(["Black"]);
  });

  it("deduplicates", () => {
    expect(parseShopQuery({ colour: "Black,black" }).facets.colour).toEqual([
      "Black",
    ]);
  });

  it("falls back to featured for an unknown sort", () => {
    expect(parseShopQuery({ sort: "cheapest-ever" }).sort).toBe("featured");
  });

  it("reads in-stock and a price ceiling", () => {
    const query = parseShopQuery({ "in-stock": "1", under: "500" });
    expect(query.inStockOnly).toBe(true);
    expect(query.maxPrice).toBe(500);
  });

  it("ignores a nonsense price ceiling", () => {
    expect(parseShopQuery({ under: "-5" }).maxPrice).toBeNull();
    expect(parseShopQuery({ under: "lots" }).maxPrice).toBeNull();
  });

  it("is the empty query for no params", () => {
    expect(isEmptyQuery(parseShopQuery({}))).toBe(true);
  });
});

describe("applyShopQuery", () => {
  const black = product({ slug: "black", colourTags: ["Black"] });
  const grey = product({ slug: "grey", colourTags: ["Grey"] });
  const blackOak = product({
    slug: "black-oak",
    colourTags: ["Black"],
    materialTags: ["Oak"],
  });

  it("ORs values within one facet, so two swatches widens the results", () => {
    const result = applyShopQuery([black, grey, blackOak], {
      ...EMPTY_QUERY,
      facets: { colour: ["Black", "Grey"] },
    });
    expect(result.map((p) => p.slug)).toEqual(["black", "grey", "black-oak"]);
  });

  it("ANDs across facets, so Black plus Oak means a black oak piece", () => {
    // Getting this pair the wrong way round is the most common way a filter
    // feels broken: it would return everything black plus everything oak.
    const result = applyShopQuery([black, grey, blackOak], {
      ...EMPTY_QUERY,
      facets: { colour: ["Black"], material: ["Oak"] },
    });
    expect(result.map((p) => p.slug)).toEqual(["black-oak"]);
  });

  it("filters to buyable stock", () => {
    const out = product({ slug: "out", stockStatus: "Out of Stock" });
    const result = applyShopQuery([black, out], {
      ...EMPTY_QUERY,
      inStockOnly: true,
    });
    expect(result.map((p) => p.slug)).toEqual(["black"]);
  });

  it("applies a price ceiling inclusively", () => {
    const items = [
      product({ slug: "a", price: 100 }),
      product({ slug: "b", price: 101 }),
    ];
    expect(
      applyShopQuery(items, { ...EMPTY_QUERY, maxPrice: 100 }).map(
        (p) => p.slug,
      ),
    ).toEqual(["a"]);
  });

  it("sorts by price both ways, and by name", () => {
    const items = [
      product({ slug: "mid", name: "M", price: 50 }),
      product({ slug: "low", name: "A", price: 10 }),
      product({ slug: "high", name: "Z", price: 90 }),
    ];
    expect(
      applyShopQuery(items, { ...EMPTY_QUERY, sort: "price-asc" }).map(
        (p) => p.slug,
      ),
    ).toEqual(["low", "mid", "high"]);
    expect(
      applyShopQuery(items, { ...EMPTY_QUERY, sort: "price-desc" }).map(
        (p) => p.slug,
      ),
    ).toEqual(["high", "mid", "low"]);
    expect(
      applyShopQuery(items, { ...EMPTY_QUERY, sort: "name" }).map(
        (p) => p.name,
      ),
    ).toEqual(["A", "M", "Z"]);
  });

  it("leaves featured in the order the query returned, which is Studio's", () => {
    const items = [
      product({ slug: "b", price: 90 }),
      product({ slug: "a", price: 10 }),
    ];
    expect(
      applyShopQuery(items, { ...EMPTY_QUERY, sort: "featured" }).map(
        (p) => p.slug,
      ),
    ).toEqual(["b", "a"]);
  });

  it("does not mutate the input array", () => {
    const items = [
      product({ slug: "b", price: 90 }),
      product({ slug: "a", price: 10 }),
    ];
    applyShopQuery(items, { ...EMPTY_QUERY, sort: "price-asc" });
    expect(items.map((p) => p.slug)).toEqual(["b", "a"]);
  });
});

describe("facetCounts", () => {
  const items = [
    product({ slug: "1", colourTags: ["Black"], materialTags: ["Oak"] }),
    product({ slug: "2", colourTags: ["Grey"], materialTags: ["Oak"] }),
    product({ slug: "3", colourTags: ["Grey"], materialTags: ["Glass"] }),
  ];

  it("counts what is actually present, so no dead swatch is offered", () => {
    const counts = facetCounts(items, EMPTY_QUERY, "colour");
    expect(counts.get("Black")).toBe(1);
    expect(counts.get("Grey")).toBe(2);
    expect(counts.has("Green")).toBe(false);
  });

  it("counts a facet against the pool before that facet is applied", () => {
    // Ticking Black must not reduce Grey to zero and make the rest of the row
    // look unavailable — this is the behaviour people notice when it is missing.
    const counts = facetCounts(
      items,
      { ...EMPTY_QUERY, facets: { colour: ["Black"] } },
      "colour",
    );
    expect(counts.get("Grey")).toBe(2);
  });

  it("does narrow a facet by the *other* facets", () => {
    const counts = facetCounts(
      items,
      { ...EMPTY_QUERY, facets: { material: ["Glass"] } },
      "colour",
    );
    expect(counts.get("Grey")).toBe(1);
    expect(counts.has("Black")).toBe(false);
  });
});

describe("toggleFacetHref", () => {
  it("adds a value and keeps the rest of the query", () => {
    const query = {
      ...EMPTY_QUERY,
      facets: { material: ["Oak"] },
      inStockOnly: true,
    };
    expect(toggleFacetHref("/shop/all", query, "colour", "Black")).toBe(
      "/shop/all?colour=Black&material=Oak&in-stock=1",
    );
  });

  it("removes a value that is already on", () => {
    const query = { ...EMPTY_QUERY, facets: { colour: ["Black", "Grey"] } };
    expect(toggleFacetHref("/shop/all", query, "colour", "Black")).toBe(
      "/shop/all?colour=Grey",
    );
  });

  it("returns the bare path when the last filter comes off", () => {
    // Not `/shop/all?` — a trailing question mark is a second URL for the same
    // page, which is a duplicate-content problem for the sake of nothing.
    const query = { ...EMPTY_QUERY, facets: { colour: ["Black"] } };
    expect(toggleFacetHref("/shop/all", query, "colour", "Black")).toBe(
      "/shop/all",
    );
  });

  it("omits the default sort, so the unsorted URL stays canonical", () => {
    const query = { ...EMPTY_QUERY, sort: "featured" as const };
    expect(toggleFacetHref("/shop/all", query, "colour", "Black")).toBe(
      "/shop/all?colour=Black",
    );
  });
});

describe("sortHref", () => {
  it("keeps the filters", () => {
    const query = { ...EMPTY_QUERY, facets: { colour: ["Black"] } };
    expect(sortHref("/shop/all", query, "price-asc")).toBe(
      "/shop/all?colour=Black&sort=price-asc",
    );
  });

  it("drops the parameter entirely when returning to featured", () => {
    const query = { ...EMPTY_QUERY, sort: "price-asc" as const };
    expect(sortHref("/shop/all", query, "featured")).toBe("/shop/all");
  });
});

describe("describeQuery", () => {
  it("is null when nothing is filtered", () => {
    expect(describeQuery(EMPTY_QUERY)).toBeNull();
  });

  it("reads as a sentence fragment", () => {
    expect(
      describeQuery({
        ...EMPTY_QUERY,
        facets: { colour: ["Black", "Grey"], material: ["Oak"] },
        maxPrice: 500,
      }),
    ).toBe("Black or Grey, Oak, under £500");
  });
});

describe("colourTagForOptionValue", () => {
  it("trims the stray whitespace the catalogue actually carries", () => {
    // "Ivory " and "White " are real values in the data. Exact matching would
    // have made the variant swap silently never fire.
    expect(colourTagForOptionValue("Ivory ")).toBe("Ivory");
    expect(colourTagForOptionValue(" White")).toBe("White");
  });

  it("maps a supplier shade name onto the filter's word", () => {
    expect(colourTagForOptionValue("Natural Wood")).toBe("Natural");
    expect(colourTagForOptionValue("Sky Blue")).toBe("Blue");
    expect(colourTagForOptionValue("Pigeon Grey")).toBe("Grey");
  });

  it("is null for a finish name that is not a colour", () => {
    // "Classic" describes a finish. Guessing would put the wrong photograph on
    // a card, which is worse than showing the default.
    expect(colourTagForOptionValue("Classic")).toBeNull();
    expect(colourTagForOptionValue("")).toBeNull();
  });
});

describe("variantImageForQuery", () => {
  const withVariants = product({
    gallery: [
      { url: "/white.jpg", optionValue: "White" },
      { url: "/black.jpg", optionValue: "Black" },
      { url: "/lifestyle.jpg" },
    ],
  } as Partial<SanityProduct>);

  it("returns the filtered colour's photograph", () => {
    expect(
      variantImageForQuery(withVariants, {
        ...EMPTY_QUERY,
        facets: { colour: ["Black"] },
      }),
    ).toBe("/black.jpg");
  });

  it("matches a wash to its own filter, not to the solid colour", () => {
    const washed = product({
      gallery: [{ url: "/ww.jpg", optionValue: "Whitewash " }],
    } as Partial<SanityProduct>);
    // Its own tag: yes.
    expect(
      variantImageForQuery(washed, {
        ...EMPTY_QUERY,
        facets: { colour: ["Whitewash"] },
      }),
    ).toBe("/ww.jpg");
    // Filed under White: no. A limed finish is not a painted one, and answering
    // a White filter with this photograph is the bug this test exists for.
    expect(
      variantImageForQuery(washed, {
        ...EMPTY_QUERY,
        facets: { colour: ["White"] },
      }),
    ).toBeNull();
  });

  it("is null with no colour filter, so the default photo is kept", () => {
    expect(variantImageForQuery(withVariants, EMPTY_QUERY)).toBeNull();
    expect(
      variantImageForQuery(withVariants, {
        ...EMPTY_QUERY,
        facets: { material: ["Oak"] },
      }),
    ).toBeNull();
  });

  it("is null when the wanted colour has no photograph of its own", () => {
    expect(
      variantImageForQuery(withVariants, {
        ...EMPTY_QUERY,
        facets: { colour: ["Green"] },
      }),
    ).toBeNull();
  });

  it("ignores untagged images rather than treating them as a variant", () => {
    const untagged = product({
      gallery: [{ url: "/a.jpg" }, { url: "/b.jpg" }],
    } as Partial<SanityProduct>);
    expect(
      variantImageForQuery(untagged, {
        ...EMPTY_QUERY,
        facets: { colour: ["Black"] },
      }),
    ).toBeNull();
  });
});

describe("colourTagForOptionValue — washes are not their base colour", () => {
  it("keeps a wash finish distinct from the solid colour", () => {
    // A wash is a finish over timber with the grain showing through; a painted
    // white hides it. Folding them together answered a White filter with a
    // whitewashed photograph.
    expect(colourTagForOptionValue("Whitewash")).toBe("Whitewash");
    expect(colourTagForOptionValue("Greenwash")).toBe("Greenwash");
    expect(colourTagForOptionValue("Bluewash")).toBe("Bluewash");
    expect(colourTagForOptionValue("White")).toBe("White");
  });

  it("still folds a spelling variant of the same finish", () => {
    expect(colourTagForOptionValue("Whitewashed")).toBe("Whitewash");
  });

  it("folds a named shade into the family a shopper filters by", () => {
    // Pigeon Grey is a grey. Somebody filtering Grey wants it included, and a
    // swatch per paint name would produce a row nobody can scan.
    expect(colourTagForOptionValue("Pigeon Grey")).toBe("Grey");
    expect(colourTagForOptionValue("Sky Blue")).toBe("Blue");
    expect(colourTagForOptionValue("Natural Wood")).toBe("Natural");
  });

  it("takes only the colour from a colour-plus-material value", () => {
    // The shagreen is a material, and materials are their own facet.
    expect(colourTagForOptionValue("Ivory Shagreen")).toBe("Ivory");
    expect(colourTagForOptionValue("Grey Shagreen")).toBe("Grey");
  });
});
