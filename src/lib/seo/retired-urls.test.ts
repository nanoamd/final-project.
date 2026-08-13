import { describe, expect, it } from "vitest";

import { RENAMED_PRODUCT_URLS, RETIRED_PRODUCT_URLS } from "./retired-urls";

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

describe("RENAMED_PRODUCT_URLS", () => {
  it("sends the old address to a real product URL, not a category", () => {
    // The distinction from a retired product: the page still exists, so the
    // visitor should land on it rather than on the range it belongs to.
    for (const { to } of RENAMED_PRODUCT_URLS)
      expect(to).toMatch(/^\/shop\/[a-z0-9-]+\/[a-z0-9-]+$/);
  });

  it("keeps the product in the same category it was already in", () => {
    // A slug repair changes the last path segment only. If the category segment
    // moved too, the entry is describing something other than a rename.
    for (const { from, to } of RENAMED_PRODUCT_URLS) {
      const fromCategory = from.split("/").slice(0, 3).join("/");
      const toCategory = to.split("/").slice(0, 3).join("/");
      expect(fromCategory).toBe(toCategory);
    }
  });

  it("writes the source percent-encoded, since that is what Next matches", () => {
    // A source with a literal space silently matches nothing — checked on a running
    // server. Anything needing an escape must therefore already be escaped here.
    for (const { from } of RENAMED_PRODUCT_URLS) {
      expect(from).not.toMatch(/\s/);
      expect(from).toBe(from.replace(/ /g, "%20"));
    }
  });

  it("repairs to a slug that is actually URL-safe", () => {
    // The whole point. The old slugs held spaces, a pipe and a full stop, so the
    // new one has to be checked rather than assumed.
    for (const { from, to } of RENAMED_PRODUCT_URLS) {
      const newSlug = to.split("/").pop()!;
      expect(newSlug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(from).not.toBe(to);
    }
  });

  it("does not collide with the retired list or itself", () => {
    // Two entries matching the same path means one silently never applies, and a
    // renamed URL that is also a retired URL would send a live product to a
    // category page.
    const sources = [...RETIRED_PRODUCT_URLS, ...RENAMED_PRODUCT_URLS].map(
      (u) => u.from,
    );
    expect(new Set(sources).size).toBe(sources.length);

    const renamedTargets = new Set(RENAMED_PRODUCT_URLS.map((u) => u.to));
    for (const { from } of [...RETIRED_PRODUCT_URLS, ...RENAMED_PRODUCT_URLS])
      expect(renamedTargets.has(from)).toBe(false);
  });
});
