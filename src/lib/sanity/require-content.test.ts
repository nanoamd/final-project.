import { describe, expect, it } from "vitest";

import { requireContent } from "./require-content";

describe("requireContent", () => {
  it("passes a populated catalogue straight through", () => {
    const items = [{ path: "/shop/a" }, { path: "/shop/b" }];
    expect(requireContent(items, "sitemap")).toBe(items);
  });

  it("throws on the empty fallback, which is the whole point", () => {
    // sanityFetch returns [] when the request fails. That is indistinguishable
    // from a genuinely empty dataset, and both should stop a deploy.
    expect(() => requireContent([], "merchant feed")).toThrow(
      /Refusing to publish an empty catalogue/,
    );
  });

  it("names the artefact, so the build log says which one", () => {
    expect(() => requireContent([], "merchant feed")).toThrow(/merchant feed/);
  });

  it("points at credentials, because that is what it has always been", () => {
    expect(() => requireContent([], "sitemap")).toThrow(
      /SANITY_API_READ_TOKEN/,
    );
  });

  it("honours a higher floor for an artefact that should never be nearly empty", () => {
    expect(() => requireContent([1, 2], "sitemap", { min: 10 })).toThrow(
      /at least 10/,
    );
    expect(requireContent([1, 2], "sitemap", { min: 2 })).toEqual([1, 2]);
  });
});
