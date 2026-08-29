import { describe, expect, it } from "vitest";

import { selectRailProducts } from "./product-rail";

const p = (slug: string, category: string, price: number) => ({
  slug,
  category,
  price,
});

describe("selectRailProducts", () => {
  it("never shows the same category twice", () => {
    // The shape of the bug: one supplier's lamps clustered at one price.
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

  it("takes the middle of a category, not its extremes", () => {
    const chosen = selectRailProducts(
      [p("cheap", "vases", 10), p("mid", "vases", 50), p("dear", "vases", 500)],
      12,
    );
    expect(chosen.map((c) => c.slug)).toEqual(["mid"]);
  });

  it("orders cheapest to dearest", () => {
    const chosen = selectRailProducts(
      [p("c", "a", 300), p("a", "b", 100), p("b", "c", 200)],
      12,
    );
    expect(chosen.map((c) => c.price)).toEqual([100, 200, 300]);
  });

  it("keeps both ends of the range when it has to thin the list", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      p(`s${i}`, `cat${i}`, (i + 1) * 10),
    );
    const chosen = selectRailProducts(many, 6);
    expect(chosen).toHaveLength(6);
    // The cheapest and the dearest must survive — taking the first six would
    // hand back only the cheap end, which is the fault being fixed.
    expect(chosen[0]!.price).toBe(10);
    expect(chosen.at(-1)!.price).toBe(300);
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

  it("returns everything it has when there is less than a full rail", () => {
    const chosen = selectRailProducts([p("a", "x", 1), p("b", "y", 2)], 12);
    expect(chosen).toHaveLength(2);
  });
});
