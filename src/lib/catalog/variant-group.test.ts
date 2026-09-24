import { describe, expect, it } from "vitest";

import {
  type VariantCandidate,
  variantGroups,
  variantStem,
} from "./variant-group";

function product(
  id: string,
  title: string,
  category = "bathroom-accessories",
  supplier = "Premier Housewares",
): VariantCandidate {
  return { id, title, category, supplier };
}

describe("variantStem", () => {
  it("strips the colour so three finishes of one product match", () => {
    expect(variantStem("Canyon Grey Soap Dish")).toBe(
      variantStem("Canyon Black Soap Dish"),
    );
  });

  it("strips a size so four capacities of one jar match", () => {
    expect(variantStem("Freska Glass Jar 250ml")).toBe(
      variantStem("Freska Glass Jar 1100ml"),
    );
  });

  it("strips the em-dash colour suffix some titles use", () => {
    expect(variantStem("Glass Candle Holder — White")).toBe(
      variantStem("Glass Candle Holder — Black"),
    );
  });

  it("drops the brand suffix without touching the name", () => {
    expect(variantStem("Camden Round Side Table | Kaiku")).toBe(
      "camden round side table",
    );
  });

  it("keeps different products apart", () => {
    expect(variantStem("Canyon Grey Tumbler")).not.toBe(
      variantStem("Canyon Grey Toothbrush Holder"),
    );
    expect(variantStem("Hutchinson Crystal Table Lamp")).not.toBe(
      variantStem("Hutchinson Crystal Floor Lamp"),
    );
  });

  it("does not half-strip a two-word colour", () => {
    // "french grey" must go whole, or "french" survives and the stems differ.
    expect(variantStem("Echo French Grey Chair")).toBe(
      variantStem("Echo Putty Grey Chair"),
    );
  });
});

describe("variantGroups", () => {
  it("groups a family and gives every member the same id", () => {
    const groups = variantGroups([
      product("a", "Canyon Grey Soap Dish"),
      product("b", "Canyon White Soap Dish"),
      product("c", "Canyon Black Soap Dish"),
    ]);
    expect(groups.size).toBe(3);
    expect(new Set(groups.values()).size).toBe(1);
  });

  it("does not group a product with no sibling", () => {
    const groups = variantGroups([
      product("a", "Canyon Grey Soap Dish"),
      product("b", "Riza Hexagonal Wall Mirror", "mirrors"),
    ]);
    expect(groups.size).toBe(0);
  });

  it("never groups across categories or suppliers", () => {
    const groups = variantGroups([
      product("a", "Grey Velvet Sofa", "sofas", "Hill Interiors"),
      product("b", "Black Velvet Sofa", "sofas", "D.I. Designs"),
      product("c", "Grey Velvet Sofa", "garden-furniture", "Hill Interiors"),
    ]);
    expect(groups.size).toBe(0);
  });

  it("does not collide two families that share 50 leading characters", () => {
    // The regression this file exists for. The first version used the family
    // key truncated to Google's 50-character limit as the group id, so
    // "…::canyon tumbler" and "…::canyon toothbrush holder" both became
    // "bathroom-accessories::Premier Housewares::canyon t" — a tumbler and a
    // toothbrush holder declared the same product in two finishes. It also put
    // a table lamp with a floor lamp, and two different saunas together.
    const groups = variantGroups([
      product("t1", "Canyon Grey Tumbler"),
      product("t2", "Canyon Black Tumbler"),
      product("h1", "Canyon Grey Toothbrush Holder"),
      product("h2", "Canyon Black Toothbrush Holder"),
    ]);
    expect(groups.get("t1")).toBe(groups.get("t2"));
    expect(groups.get("h1")).toBe(groups.get("h2"));
    expect(groups.get("t1")).not.toBe(groups.get("h1"));
  });

  it("keeps every id inside Google's 50-character limit", () => {
    const groups = variantGroups([
      product(
        "a",
        "Freska Ribbed Round Glass Jar with Acacia Wood Lid and a Very Long Name 250ml",
        "kitchen-storage",
      ),
      product(
        "b",
        "Freska Ribbed Round Glass Jar with Acacia Wood Lid and a Very Long Name 550ml",
        "kitchen-storage",
      ),
    ]);
    for (const id of groups.values()) expect(id.length).toBeLessThanOrEqual(50);
  });

  it("gives the same family the same id on a rebuild", () => {
    // Google remembers a grouping; an id that changed per build would re-split
    // the family on every fetch.
    const items = [
      product("a", "Canyon Grey Soap Dish"),
      product("b", "Canyon White Soap Dish"),
    ];
    expect([...variantGroups(items).values()]).toEqual([
      ...variantGroups(items).values(),
    ]);
  });

  it("ignores a title that is nothing but variant words", () => {
    // "Black" and "White" are not two colours of the same product.
    const groups = variantGroups([
      product("a", "Black"),
      product("b", "White"),
    ]);
    expect(groups.size).toBe(0);
  });
});
