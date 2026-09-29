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

  it("takes the dearest of a hero category and the best affordable one of a value category", () => {
    // Not the cheapest. `group[0]` was the old rule and it is what put a £32
    // pink wall clock and a framed Labrador on the homepage between a £2,745
    // marble table and a £2,118 sofa.
    const chosen = selectRailProducts(
      [
        p("hero-top", "lighting", 689),
        p("hero-low", "lighting", 400),
        p("value-tat", "baskets", 80),
        p("value-good", "baskets", 300),
      ],
      4,
    );
    expect(chosen.map((c) => c.slug)).toEqual(["hero-top", "value-good"]);
  });

  it("falls back to the cheapest when a value category has nothing under the ceiling", () => {
    // A category where everything is expensive has no breather to give, and a
    // missing slot is worse than a dear one.
    const chosen = selectRailProducts(
      [
        p("hero-top", "lighting", 2000),
        p("hero-low", "lighting", 1500),
        p("dear-low", "sofas", 900),
        p("dear-top", "sofas", 1800),
      ],
      4,
    );
    expect(chosen.map((c) => c.slug)).toEqual(["hero-top", "dear-low"]);
  });

  it("excludes a category that cannot field a single piece worth showing", () => {
    // "Accessories" is 35 products between £19 and £49, the top seven of them
    // the same towel set in different colours. Deep, and worth nothing to a
    // page that opens at £1,561.
    const chosen = selectRailProducts(
      [
        p("towels-a", "accessories", 49),
        p("towels-b", "accessories", 43),
        p("towels-c", "accessories", 39),
        p("towels-d", "accessories", 19),
        p("real", "sofas", 900),
      ],
      12,
    );
    expect(chosen.map((c) => c.slug)).toEqual(["real"]);
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
        // Above MIN_CATEGORY_TOP, so this tests the render filter rather than
        // the price floor.
        p("ok", "d", 900),
      ],
      12,
    );
    expect(chosen.map((c) => c.slug)).toEqual(["ok"]);
  });
});

describe("selectRailProducts with a markup index", () => {
  it("takes the keenest-priced piece in a category, not the dearest or cheapest", () => {
    const chosen = selectRailProducts(
      [
        p("dear-but-greedy", "sofas", 2000),
        p("keen", "sofas", 900),
        p("cheap-and-greedy", "sofas", 300),
      ],
      1,
      { "dear-but-greedy": 1.9, keen: 1.24, "cheap-and-greedy": 2.4 },
    );
    expect(chosen.map((c) => c.slug)).toEqual(["keen"]);
  });

  it("breaks a tie on keenness toward the better piece", () => {
    const chosen = selectRailProducts(
      [p("small", "sofas", 400), p("big", "sofas", 1200)],
      1,
      { small: 1.25, big: 1.25 },
    );
    expect(chosen.map((c) => c.slug)).toEqual(["big"]);
  });

  it("still alternates dear and affordable so prices are not four deep", () => {
    // Real category names: the affordable half is restricted to the ones
    // people buy for how they look, so a fixture of invented names has no
    // breathers at all and the alternation never happens.
    const chosen = selectRailProducts(
      [
        p("sofa", "Sofas", 1200),
        p("bed", "Beds", 1100),
        p("vase", "Vases", 80),
        p("clock", "Wall Clocks", 130),
      ],
      4,
      { sofa: 1.25, bed: 1.25, vase: 1.25, clock: 1.25 },
    );
    const prices = chosen.map((c) => c.price!);
    expect(prices[0]).toBeGreaterThan(prices[1]!);
    expect(prices[2]).toBeGreaterThan(prices[3]!);
  });

  it("keeps a desk out of the slots between the heroes", () => {
    // A veneer desk between a chandelier and a marble table is what made the
    // rail read as a warehouse. Desks are bought for what they hold.
    const chosen = selectRailProducts(
      [
        p("sofa", "Sofas", 1200),
        p("desk", "Desks", 149),
        p("mirror", "Mirrors", 378),
      ],
      3,
      { sofa: 1.25, desk: 1.2, mirror: 1.3 },
    );
    expect(chosen.map((c) => c.slug)).not.toContain("desk");
    expect(chosen.map((c) => c.slug)).toContain("mirror");
  });

  it("drops anything above the rail price cap", () => {
    // Damien on a £4,567 bookcase: "I don't want the bookcase there".
    const chosen = selectRailProducts(
      [p("bookcase", "Shelving", 4567), p("table", "Furniture", 2745)],
      4,
      { bookcase: 1.27, table: 1.23 },
    );
    expect(chosen.map((c) => c.slug)).toEqual(["table"]);
  });

  it("ignores a product with no cost recorded rather than ranking it first", () => {
    // A missing entry means "cannot rank", not "free". Ranking it first would
    // put every product without a cost price on the homepage.
    const chosen = selectRailProducts(
      [p("unknown-cost", "sofas", 900), p("known", "sofas", 800)],
      1,
      { known: 1.4 },
    );
    expect(chosen.map((c) => c.slug)).toEqual(["known"]);
  });
});

describe("filling the rail", () => {
  it("draws a second piece from a category rather than stopping short", () => {
    // One pick per category left the rail at sixteen of twenty-four. Damien:
    // "Don't reduce product count in new and noteworthy. Only add it in."
    const many = [
      p("sofa-1", "Sofas", 1200),
      p("sofa-2", "Sofas", 1100),
      p("mirror-1", "Mirrors", 300),
      p("mirror-2", "Mirrors", 280),
    ];
    const chosen = selectRailProducts(many, 4, {
      "sofa-1": 1.2,
      "sofa-2": 1.3,
      "mirror-1": 1.2,
      "mirror-2": 1.3,
    });
    expect(chosen).toHaveLength(4);
    expect(new Set(chosen.map((c) => c.slug)).size).toBe(4);
  });

  it("gives every category one slot before any category gets two", () => {
    // Price-sorting the pool instead collapsed the live rail into four
    // near-identical sofas and eleven small planters.
    const chosen = selectRailProducts(
      [
        p("sofa-1", "Sofas", 2000),
        p("sofa-2", "Sofas", 1900),
        p("mirror-1", "Mirrors", 300),
        p("mirror-2", "Mirrors", 290),
      ],
      3,
      {
        "sofa-1": 1.2,
        "sofa-2": 1.21,
        "mirror-1": 1.5,
        "mirror-2": 1.6,
      },
    );
    const categories = chosen.map((c) => c.category);
    expect(categories.slice(0, 2)).toEqual(
      expect.arrayContaining(["Sofas", "Mirrors"]),
    );
  });
});
