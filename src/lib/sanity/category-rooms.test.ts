import { describe, expect, it } from "vitest";

import {
  categoryInRoom,
  shoppableCategories,
} from "@/lib/sanity/category-rooms";

describe("categoryInRoom", () => {
  it("matches on the full room list", () => {
    const category = {
      departmentSlug: "sauna",
      departmentSlugs: ["sauna", "outdoor-living"],
    };
    expect(categoryInRoom(category, "outdoor-living")).toBe(true);
    expect(categoryInRoom(category, "bathroom")).toBe(false);
  });

  it("falls back to departmentSlug when the list is absent or empty", () => {
    expect(categoryInRoom({ departmentSlug: "bathroom" }, "bathroom")).toBe(
      true,
    );
    expect(
      categoryInRoom(
        { departmentSlug: "bathroom", departmentSlugs: [] },
        "bathroom",
      ),
    ).toBe(true);
  });
});

describe("shoppableCategories", () => {
  const categories = [
    { slug: "sofas", productCount: 12 },
    { slug: "rugs", productCount: 0 },
    { slug: "towel-rails", productCount: null },
    { slug: "coffee-tables" },
  ];

  it("drops categories with no products", () => {
    expect(shoppableCategories(categories).map((c) => c.slug)).toEqual([
      "sofas",
    ]);
  });

  it("treats a missing or null count as empty", () => {
    const slugs = shoppableCategories(categories).map((c) => c.slug);
    expect(slugs).not.toContain("towel-rails");
    expect(slugs).not.toContain("coffee-tables");
  });

  it("always keeps the active category, however empty", () => {
    expect(shoppableCategories(categories, "rugs").map((c) => c.slug)).toEqual([
      "sofas",
      "rugs",
    ]);
  });

  it("does not reorder what it keeps", () => {
    const many = [
      { slug: "a", productCount: 1 },
      { slug: "b", productCount: 0 },
      { slug: "c", productCount: 5 },
    ];
    expect(shoppableCategories(many).map((c) => c.slug)).toEqual(["a", "c"]);
  });

  it("returns an empty list rather than throwing on an empty input", () => {
    expect(shoppableCategories([])).toEqual([]);
  });
});
