import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { META_LIMIT } from "@/lib/catalog/meta-description";
import { META_TITLE_MAX } from "@/lib/catalog/meta-title";

/**
 * Every hand-written page title and description, measured against the limits
 * the catalogue already enforces on Sanity-driven ones.
 *
 * ## Why this exists
 *
 * `scripts/audit-seo-metadata.ts` builds its rows from Sanity, so it only ever
 * sees products, categories, posts and buying guides. The 18 calculators and
 * the ~20 static pages are written in code and were measured by nothing —
 * which is how nine of them ended up with titles Google truncates, including
 * seven calculators that were already earning impressions at average
 * positions 6-8 and almost no clicks. A title cut at ~60 characters loses its
 * tail, and on a page whose whole proposition is "calculator" that is an
 * expensive word to lose.
 *
 * ## Why it reads source rather than importing the routes
 *
 * A route module pulls in components and Sanity queries, some of which import
 * `server-only`, so importing them here would fail for reasons that have
 * nothing to do with metadata. Reading the literal is uglier but it cannot
 * break for an unrelated reason, and the repo is Prettier-formatted so the
 * shape is stable. A file whose literal cannot be parsed is reported rather
 * than silently skipped, so this cannot quietly stop checking.
 */

const APP = path.join(process.cwd(), "src", "app");

/** The suffix `buildMetadata` appends unless the title already ends in it. */
const BRAND_SUFFIX = " — Kaiku";

/**
 * Routes allowed to exceed a limit, each with the reason.
 *
 * Deliberately a named list rather than a loosened limit: an exception has to
 * be argued for, and the argument is readable here.
 */
const TITLE_EXEMPT: Record<string, string> = {
  "(site)/tools/wall-art-size-calculator":
    "Kaiku's single best-performing page. Google truncates it after " +
    '"...on a Bare Wall?" and loses only the word "Calculator", so the whole ' +
    "question — which is the query — still shows. Shortening it means " +
    "dropping either the furniture clause or the bare-wall clause, and those " +
    "are two different query clusters. Not worth guessing on the one page " +
    "that works; change it as a measured test, not on a rule.",
};

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...pageFiles(full));
    else if (entry === "page.tsx") out.push(full);
  }
  return out;
}

/**
 * The first string literal for `key` inside a `buildMetadata({ ... })` call.
 *
 * Returns null when the value is not a plain literal — a template string or a
 * variable is a deliberate "not measurable here" rather than a failure.
 */
function literal(source: string, key: string): string | null {
  const call = /buildMetadata\(\{([\s\S]*?)\n\}\)/.exec(source);
  if (!call) return null;
  const body = call[1]!;
  // Prettier puts a long value on the next line, so allow a break after the
  // colon, and allow an adjacent-concatenated second literal on its own line.
  const match = new RegExp(`${key}:\\s*\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(
    body,
  );
  return match ? match[1]!.replace(/\\"/g, '"') : null;
}

const pages = pageFiles(APP).map((file) => {
  const source = readFileSync(file, "utf8");
  return {
    route: path.relative(APP, file).replace(/\/page\.tsx$/, "") || "/",
    title: literal(source, "title"),
    description: literal(source, "description"),
    usesBuildMetadata: source.includes("buildMetadata({"),
  };
});

/** Pages whose metadata is built from Sanity at request time. */
const measurable = pages.filter((page) => page.usesBuildMetadata);

describe("hand-written route metadata", () => {
  it("finds the pages to measure", () => {
    // A guard on the guard: if a refactor moves buildMetadata and this stops
    // matching anything, the suite must fail rather than pass vacuously.
    expect(measurable.length).toBeGreaterThan(20);
  });

  it.each(measurable.filter((page) => page.title && !TITLE_EXEMPT[page.route]))(
    "$route has a title Google will show in full",
    ({ route, title }) => {
      const rendered = title!.endsWith("Kaiku")
        ? title!
        : title! + BRAND_SUFFIX;
      expect(
        rendered.length,
        `${route}: ${rendered.length} chars — "${rendered}"`,
      ).toBeLessThanOrEqual(META_TITLE_MAX);
    },
  );

  it.each(measurable.filter((page) => page.description))(
    "$route has a description Google will show in full",
    ({ route, description }) => {
      expect(
        description!.length,
        `${route}: ${description!.length} chars`,
      ).toBeLessThanOrEqual(META_LIMIT);
    },
  );
});
