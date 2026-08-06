import { beforeEach, describe, expect, it, vi } from "vitest";

import { __testing } from "@/lib/sanity/config";

const {
  resolve,
  PROJECT_ID_PATTERN,
  DATASET_PATTERN,
  API_VERSION_PATTERN,
  DEFAULT_PROJECT_ID,
  DEFAULT_DATASET,
  DEFAULT_API_VERSION,
  resetWarnings,
} = __testing;

/**
 * The value that was actually sitting in NEXT_PUBLIC_SANITY_PROJECT_ID in a
 * production deployment, taken verbatim from the build log. Every Sanity
 * request failed with `getaddrinfo ENOTFOUND <this>.apicdn.sanity.io` while the
 * build still reported success, because sanityFetch is fail-soft. Pinned here
 * so the guard can never regress against the real input.
 */
const LEAKED_TOKEN =
  "skznfidk3xocgsnatoxvgoqrauqr666zauuqgwhrrnbijofsxkcc7ccxmoej3dvsi6wpek1gp522ojqoqbjicc8benwbkjulhlnot63naln6bjbfaxedcyvyc6hid63rnqz0qo0srpocaezewcik9snfgsibyxwowlrxbhcyralhaslbsomo";

function resolveProjectId(raw: string | undefined) {
  return resolve(
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    raw,
    PROJECT_ID_PATTERN,
    DEFAULT_PROJECT_ID,
  );
}

/** Factory rather than an inline annotation, so the mock type is inferred. */
function silenceWarn() {
  return vi.spyOn(console, "warn").mockImplementation(() => {});
}

describe("sanity config guard", () => {
  // Re-spying on an already-spied method returns the same mock, so the call
  // log has to be cleared between cases or assertions see earlier tests' warns.
  let warn: ReturnType<typeof silenceWarn>;

  beforeEach(() => {
    resetWarnings();
    warn = silenceWarn();
    warn.mockClear();
  });

  it("passes a real project ID through untouched", () => {
    expect(resolveProjectId("huh1e45n")).toBe("huh1e45n");
  });

  it("trims incidental whitespace from a pasted value", () => {
    expect(resolveProjectId("  huh1e45n\n")).toBe("huh1e45n");
  });

  /**
   * Guards the fallback itself. `huh1e45n` is verified against the live API —
   * a tokenless query returns the real catalogue. The 7-character near-miss
   * `huhe45n` 404s with "Dataset not found", which reads like a permissions
   * problem and sends you looking in the wrong place entirely.
   */
  it("defaults to the verified 8-character project ID", () => {
    expect(DEFAULT_PROJECT_ID).toBe("huh1e45n");
    expect(DEFAULT_PROJECT_ID).toHaveLength(8);
  });

  it("rejects the token that broke production and falls back", () => {
    expect(resolveProjectId(LEAKED_TOKEN)).toBe(DEFAULT_PROJECT_ID);
  });

  it("names the leaked value as a token and says to revoke it", () => {
    resolveProjectId(LEAKED_TOKEN);
    const message = warn.mock.calls[0]?.[0] as string;
    expect(message).toContain("looks like a Sanity API TOKEN");
    expect(message).toContain("Revoke it");
  });

  it("truncates the bad value instead of reprinting a credential in full", () => {
    resolveProjectId(LEAKED_TOKEN);
    const message = warn.mock.calls[0]?.[0] as string;
    expect(message).not.toContain(LEAKED_TOKEN);
    expect(message).toContain(`(${LEAKED_TOKEN.length} chars)`);
  });

  it("warns once per variable, not once per read", () => {
    resolveProjectId(LEAKED_TOKEN);
    resolveProjectId(LEAKED_TOKEN);
    resolveProjectId("also-bad".repeat(40));
    expect(warn).toHaveBeenCalledTimes(1);

    // A different variable still gets its own warning.
    resolve(
      "NEXT_PUBLIC_SANITY_DATASET",
      "Nope",
      DATASET_PATTERN,
      DEFAULT_DATASET,
    );
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("falls back when unset or blank", () => {
    expect(resolveProjectId(undefined)).toBe(DEFAULT_PROJECT_ID);
    expect(resolveProjectId("")).toBe(DEFAULT_PROJECT_ID);
    expect(resolveProjectId("   ")).toBe(DEFAULT_PROJECT_ID);
  });

  it("rejects values that would build a malformed URL", () => {
    // A whole URL, a path fragment, and an uppercased ID pasted into the field.
    expect(resolveProjectId("https://huh1e45n.api.sanity.io")).toBe(
      DEFAULT_PROJECT_ID,
    );
    expect(resolveProjectId("huh1e45n/production")).toBe(DEFAULT_PROJECT_ID);
    expect(resolveProjectId("HUH1E45N")).toBe(DEFAULT_PROJECT_ID);
  });

  it("accepts real dataset names and rejects malformed ones", () => {
    const dataset = (raw: string) =>
      resolve(
        "NEXT_PUBLIC_SANITY_DATASET",
        raw,
        DATASET_PATTERN,
        DEFAULT_DATASET,
      );
    expect(dataset("production")).toBe("production");
    expect(dataset("staging-2")).toBe("staging-2");
    expect(dataset("Production")).toBe(DEFAULT_DATASET);
    expect(dataset("-production")).toBe(DEFAULT_DATASET);
  });

  it("accepts real API versions and rejects malformed ones", () => {
    const version = (raw: string) =>
      resolve(
        "NEXT_PUBLIC_SANITY_API_VERSION",
        raw,
        API_VERSION_PATTERN,
        DEFAULT_API_VERSION,
      );
    expect(version("2025-01-01")).toBe("2025-01-01");
    expect(version("v2025-01-01")).toBe("v2025-01-01");
    expect(version("X")).toBe("X");
    expect(version("2025")).toBe(DEFAULT_API_VERSION);
    expect(version("latest")).toBe(DEFAULT_API_VERSION);
  });
});
