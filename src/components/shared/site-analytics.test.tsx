// @vitest-environment node
import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";

/**
 * The filter itself, extracted so it can be tested without rendering.
 * Mirrors the `beforeSend` in site-analytics.tsx.
 */
function shouldRecord(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    const production = new URL(siteConfig.url).hostname;
    const allowed = new Set([production, production.replace(/^www\./, "")]);
    return allowed.has(host);
  } catch {
    return false;
  }
}

describe("only the live site is measured", () => {
  it("records the production domain, with or without www", () => {
    expect(shouldRecord("https://www.kaikuhome.com/shop/mirrors")).toBe(true);
    expect(shouldRecord("https://kaikuhome.com/")).toBe(true);
  });

  it("drops preview deployments", () => {
    // 2,842 bot visits to one preview URL took the bounce rate to 99%.
    expect(
      shouldRecord(
        "https://final-project-coral-mu-92.vercel.app/shop/room/kitchen",
      ),
    ).toBe(false);
    expect(shouldRecord("https://final-project-git-branch.vercel.app/")).toBe(
      false,
    );
  });

  it("drops localhost, so development never reaches the figures", () => {
    expect(shouldRecord("http://localhost:3000/shop/all")).toBe(false);
  });

  it("drops anything it cannot parse rather than guessing", () => {
    expect(shouldRecord("not-a-url")).toBe(false);
    expect(shouldRecord("")).toBe(false);
  });

  it("is not fooled by a lookalike hostname", () => {
    expect(shouldRecord("https://kaikuhome.com.evil.example/")).toBe(false);
    expect(shouldRecord("https://notkaikuhome.com/")).toBe(false);
  });
});
