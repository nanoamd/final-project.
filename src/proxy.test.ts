import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ALLOWED_TOP_LEVEL_SEGMENTS } from "./proxy";

/**
 * Every routable top-level path must be on the proxy's allowlist.
 *
 * This test exists because the allowlist silently 404'd a real page. `/blog`
 * was added, built (`○ /blog` in the build output), deployed, and listed in
 * the sitemap — and still answered 404, because the proxy rejects any
 * top-level segment it does not recognise *before* the route is reached.
 *
 * The comment above the list had already predicted it: "it can't misclassify
 * a real route added later without this file being updated too." True, and
 * nothing enforced it, so the next person pays the same hour working out why
 * a page that exists cannot be opened.
 *
 * Reading the route directories rather than listing them here is the whole
 * point — a hand-written second list would drift exactly like the first one.
 */

const APP = join(process.cwd(), "src", "app");

/** A directory that produces a URL segment: not a route group, not dynamic. */
function isRoutableSegment(name: string): boolean {
  if (name.startsWith("(") || name.startsWith("[") || name.startsWith("_")) {
    return false;
  }
  // Next's own file-convention routes (sitemap.ts, robots.ts) are files, and
  // anything with a dot is let through by the proxy already.
  return !name.includes(".");
}

function topLevelRoutes(): string[] {
  const segments = new Set<string>();

  for (const entry of readdirSync(APP, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    // A route group like (site) contributes its children, not itself.
    if (entry.name.startsWith("(")) {
      for (const child of readdirSync(join(APP, entry.name), {
        withFileTypes: true,
      })) {
        if (child.isDirectory() && isRoutableSegment(child.name)) {
          segments.add(child.name);
        }
      }
      continue;
    }
    if (isRoutableSegment(entry.name)) segments.add(entry.name);
  }

  return [...segments].sort();
}

describe("the proxy allowlist", () => {
  it("covers every top-level route the app actually has", () => {
    const missing = topLevelRoutes().filter(
      (segment) => !ALLOWED_TOP_LEVEL_SEGMENTS.has(segment),
    );
    expect(
      missing,
      `These routes exist under src/app but the proxy will 404 them before ` +
        `they render. Add them to ALLOWED_TOP_LEVEL_SEGMENTS in src/proxy.ts.`,
    ).toEqual([]);
  });

  it("finds the routes at all, so an empty scan cannot pass silently", () => {
    // Without this, a change to the app directory layout would make the test
    // above vacuously true and stop protecting anything.
    const routes = topLevelRoutes();
    expect(routes.length).toBeGreaterThan(10);
    expect(routes).toContain("shop");
    expect(routes).toContain("blog");
  });
});
