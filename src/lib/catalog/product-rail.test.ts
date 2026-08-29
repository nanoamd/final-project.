import { describe, expect, it } from "vitest";

import { selectRailProducts } from "./product-rail";

const p = (slug: string, category: string, price: number) => ({
  slug,
  category,
  price,
});

describe("selectRailProducts", () => {
  it("never shows the same category twice", () => {
    // The original fault: one supplier's lamps clustered at one price.
    const chosen = selectRailProducts(
      [
        p("lamp-a", "lighting", 205),
        p("lamp-b", "lighting", 210),
        p("lamp-c", "lighting", 230),
        p("lamp-d", "lighting", 290),
        p("bedside", "bedside-tables", 179),
      ],
      12,
    );
    expect(chosen).toHaveLength(2);
    expect(chosen.map((c) => c.category).sort()).toEqual([
      "bedside-tables",
      "lighting",
    ]);
  });

  it("leads with the shop's best piece, not its average", () => {
    // The second fault: taking each category's median filled the rail with
    // the unremarkable middle of the catalogue.
    const chosen = selectRailProducts(
      [
        p("chandelier", "lighting", 689),
        p("small-lamp", "lighting", 39),
        p("board", "kitchen-storage", 29),
      ],
      12,
    );
    expect(chosen[0]!.slug).toBe("chandelier");
  });

  it("puts something cheap between each expensive piece", () => {
    const many = [
      p("hero1", "a", 1000),
      p("hero2", "b", 900),
      p("hero3", "c", 800),
      p("cheap1", "x", 10),
      p("cheap2", "y", 20),
      p("cheap3", "z", 30),
    ];
    const prices = selectRailProducts(many, 6).map((c) => c.price!);
    // Alternating, so no two four-figure pieces sit next to each other.
    for (let i = 0; i + 1 < prices.length; i += 2) {
      expect(prices[i]!).toBeGreaterThan(prices[i + 1]!);
    }
  });

  it("takes the dearest of a hero category and the cheapest of a value one", () => {
    const chosen = selectRailProducts(
      [
        p("hero-top", "lighting", 689),
        p("hero-low", "lighting", 400),
        p("value-low", "baskets", 12),
        p("value-top", "baskets", 60),
      ],
      4,
    );
    expect(chosen.map((c) => c.slug)).toEqual(["hero-top", "value-low"]);
  });

  it("never repeats a product when the two ends meet", () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      p(`s${i}`, `cat${i}`, (i + 1) * 100),
    );
    const chosen = selectRailProducts(many, 20);
    expect(new Set(chosen.map((c) => c.slug)).size).toBe(chosen.length);
    expect(chosen).toHaveLength(5);
  });

  it("drops anything that cannot be rendered or linked", () => {
    const chosen = selectRailProducts(
      [
        { slug: "", category: "a", price: 10 },
        { slug: "b", category: null, price: 10 },
        { slug: "c", category: "c", price: null },
        p("ok", "d", 10),
      ],
      12,
    );
    expect(chosen.map((c) => c.slug)).toEqual(["ok"]);
  });
});
