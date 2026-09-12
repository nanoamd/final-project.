import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  googleProductCategory,
  MAPPED_CATEGORY_SLUGS,
} from "./google-product-category";

/**
 * Google's published taxonomy, checked in as a fixture.
 *
 * The whole value of `google_product_category` depends on the string matching
 * a real node exactly: a path with a typo, a British spelling where Google
 * uses American, or an "&" written as "and" is silently ignored, and nothing
 * anywhere reports it. Asserting every mapped path against the real file is
 * the only way that failure becomes visible before Merchant Center sees it.
 */
const TAXONOMY_PATHS = new Set(
  readFileSync(join(__dirname, "__fixtures__/google-taxonomy.txt"), "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    // "1395 - Furniture > Tables > Accent Tables > Coffee Tables"
    .map((line) => line.split(" - ").slice(1).join(" - ").trim())
    .filter(Boolean),
);

describe("googleProductCategory", () => {
  it("has a taxonomy fixture to check against", () => {
    expect(TAXONOMY_PATHS.size).toBeGreaterThan(5000);
  });

  it("maps every slug to a path that exists in Google's taxonomy", () => {
    const invalid = MAPPED_CATEGORY_SLUGS.filter(
      (slug) => !TAXONOMY_PATHS.has(googleProductCategory(slug)!),
    );
    expect(invalid).toEqual([]);
  });

  it("returns null rather than guessing for a genuinely mixed category", () => {
    // Deliberate omissions. Google's per-product classification beats one
    // blanket category that is wrong for part of the range.
    expect(googleProductCategory("kitchen-furniture")).toBeNull();
    expect(googleProductCategory("rustic-reclaimed-furniture")).toBeNull();
  });

  it("returns null for an unknown or absent slug", () => {
    expect(googleProductCategory("not-a-category")).toBeNull();
    expect(googleProductCategory(null)).toBeNull();
    expect(googleProductCategory(undefined)).toBeNull();
  });

  it("maps the categories carrying the most cash", () => {
    // The promotable-products analysis put the business in these.
    expect(googleProductCategory("fire-pits")).toContain("Patio Heaters");
    expect(googleProductCategory("outdoor-saunas")).toContain("Saunas");
    expect(googleProductCategory("desks")).toContain("Desks");
    expect(googleProductCategory("sofas")).toBe("Furniture > Sofas");
  });
});
