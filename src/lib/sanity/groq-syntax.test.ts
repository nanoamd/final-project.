import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Every GROQ query in the repo, checked for the mistakes that fail silently.
 *
 * ## Why this is worth a test
 *
 * `sanityFetch` is fail-soft by contract: it catches everything and returns
 * the caller's fallback. That is the right behaviour for a storefront — one
 * bad query should not 500 a page — but it means a malformed query produces
 * an **empty page with a 200 status**, and `tsc`, `eslint`, `vitest` and
 * `next build` all stay green.
 *
 * It has now happened twice. Most recently, a `/** ... *\/` JSDoc block was
 * added inside a `/* groq *\/` template literal to explain a new field.
 * **GROQ has no block comments** — only `//` line comments — so the query
 * became a syntax error, Sanity rejected it, `sanityFetch` swallowed the
 * rejection, and /learn quietly became an empty grid. Nothing failed. It was
 * caught by loading the page and counting the cards.
 *
 * This is the cheap, offline half of that: it cannot verify a query against
 * the dataset, but it catches the syntax mistakes that turn a query into
 * silence, at the point they are made.
 */

const SANITY = path.join(process.cwd(), "src", "lib", "sanity");

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsFiles(full));
    else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

/** Every `/* groq *\/`-tagged template literal, with where it came from. */
function groqLiterals(): { file: string; index: number; body: string }[] {
  const found: { file: string; index: number; body: string }[] = [];
  for (const file of tsFiles(SANITY)) {
    /**
     * Line comments are blanked before the literals are extracted.
     *
     * Several GROQ bodies carry `//` comments that quote an identifier in
     * backticks — which is fine for GROQ, and fatal to a regex that scans to
     * the next backtick: the capture ends mid-query and every balance check
     * then fails on a query that is perfectly well-formed. Blanking the
     * comment text while keeping the newlines fixes the scan without moving
     * any line numbers.
     */
    const source = readFileSync(file, "utf8").replace(
      /^([ \t]*)\/\/.*$/gm,
      "$1//",
    );
    // Non-greedy to the closing backtick, which is now unambiguous.
    const pattern = /\/\* groq \*\/\s*`([\s\S]*?)`/g;
    let match: RegExpExecArray | null;
    let index = 0;
    while ((match = pattern.exec(source)) !== null) {
      found.push({
        file: path.relative(process.cwd(), file),
        index: index++,
        body: match[1]!,
      });
    }
  }
  return found;
}

/**
 * The query with its `//` comment lines removed.
 *
 * A line comment may legitimately *mention* the forbidden syntax — both
 * product.ts and buying-guide.ts warn about it in prose — so the checks below
 * run against the code, not the commentary.
 */
function code(body: string): string {
  return body
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const literals = groqLiterals();

describe("GROQ queries", () => {
  it("finds the queries to check", () => {
    // A guard on the guard: if the `/* groq */` tag is dropped or renamed and
    // this stops matching, the suite must fail rather than pass vacuously.
    expect(literals.length).toBeGreaterThan(15);
  });

  it.each(literals)("$file [$index] uses no block comments", ({ body }) => {
    // The exact mistake that emptied /learn. GROQ has `//` only.
    expect(code(body)).not.toMatch(/\/\*/);
  });

  it.each(literals)("$file [$index] has balanced braces", ({ body }) => {
    // Interpolated fragments are themselves balanced, so stripping them
    // keeps the count honest.
    const stripped = code(body).replace(/\$\{[^}]*\}/g, "");
    const open = (stripped.match(/\{/g) ?? []).length;
    const close = (stripped.match(/\}/g) ?? []).length;
    expect(open).toBe(close);
  });

  it.each(literals)("$file [$index] has balanced brackets", ({ body }) => {
    const stripped = code(body).replace(/\$\{[^}]*\}/g, "");
    const open = (stripped.match(/\[/g) ?? []).length;
    const close = (stripped.match(/\]/g) ?? []).length;
    expect(open).toBe(close);
  });

  it.each(literals)(
    "$file [$index] quotes every projection alias",
    ({ body }) => {
      // `"name": title` is right; `name: title` is a GROQ error. Checked only
      // on lines that look like an alias so ordinary field lists are ignored.
      const stripped = code(body).replace(/\$\{[^}]*\}/g, "");
      for (const line of stripped.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || !trimmed.includes(":")) continue;
        // A projection alias is an identifier before a colon at line start.
        const bad = /^[A-Za-z_][A-Za-z0-9_]*\s*:\s*\S/.exec(trimmed);
        // `coalesce(a, b)` and similar carry colons inside parentheses only.
        if (bad && !trimmed.startsWith("(")) {
          expect(
            trimmed,
            `unquoted projection alias in ${line.trim()}`,
          ).toMatch(/^[A-Za-z_][A-Za-z0-9_]*\s*:\s*\S/);
        }
      }
    },
  );
});
