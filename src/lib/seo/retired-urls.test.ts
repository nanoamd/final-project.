import { describe, expect, it } from "vitest";

import { RETIRED_PRODUCT_URLS } from "./retired-urls";

describe("RETIRED_PRODUCT_URLS", () => {
  it("redirects every retired product URL somewhere else", () => {
    for (const { from, to } of RETIRED_PRODUCT_URLS) expect(from).not.toBe(to);
  });

  it("uses absolute paths with no trailing slash", () => {
    for (const { from, to } of RETIRED_PRODUCT_URLS) {
      expect(from).toMatch(/^\/[^\s]*[^/]$/);
      expect(to).toMatch(/^\/[^\s]*[^/]$/);
    }
  });

  it("redirects into the category the product belonged to", () => {
    // A retired product's closest surviving page is its own category, not the
    // homepage — the visitor asked for a floor lamp, so send them to the lamps.
    for (const { from, to } of RETIRED_PRODUCT_URLS) {
      expect(to).toMatch(/^\/shop\/[a-z0-9-]+$/);
      expect(from.startsWith(`${to}/`)).toBe(true);
    }
  });

  it("lists each source path once", () => {
    // A duplicated source is a redirect that silently loses to whichever entry
    // Next matches first, so the second one never applies.
    const sources = RETIRED_PRODUCT_URLS.map((u) => u.from);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("does not redirect a path that is itself a redirect target", () => {
    // Chained redirects lose ranking signals and can loop.
    const targets = new Set(RETIRED_PRODUCT_URLS.map((u) => u.to));
    for (const { from } of RETIRED_PRODUCT_URLS)
      expect(targets.has(from)).toBe(false);
  });
});
