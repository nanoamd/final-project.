/**
 * Validated Sanity connection settings.
 *
 * Every Sanity client in the app builds its host from these three values —
 * `@sanity/client` requests `https://<projectId>.apicdn.sanity.io/v<apiVersion>/
 * data/query/<dataset>` — so a malformed value doesn't produce a helpful error,
 * it produces a hostname that doesn't exist. That surfaces as
 * `getaddrinfo ENOTFOUND <garbage>.apicdn.sanity.io`, and because `sanityFetch`
 * is deliberately fail-soft (see ./fetch.ts) every query then quietly resolves
 * to its fallback. A build in that state completes green while baking the empty
 * state of the site into every statically rendered page. That exact failure has
 * happened in production: a Sanity API token was pasted into the
 * NEXT_PUBLIC_SANITY_PROJECT_ID field in the hosting dashboard, and the only
 * visible symptom was a site with no content.
 *
 * So each value is shape-checked here and replaced with the known-good default
 * if it can't possibly be right. The defaults are safe to hard-code: none of
 * these three are secrets. The project ID is already public in every
 * `cdn.sanity.io` image URL the site serves, the dataset name is `production`,
 * and the API version is a date. `sanity.config.ts` and `sanity.cli.ts` have
 * always carried literal defaults for the same reason.
 *
 * Reads `process.env` directly rather than importing `@/env`, for two reasons:
 * `@t3-oss/env-nextjs` skips its Zod transforms entirely under
 * `SKIP_ENV_VALIDATION`, which is precisely when bad input most needs
 * catching; and it means content still loads when some unrelated variable is
 * missing. The references have to stay static and fully written out —
 * `process.env.NEXT_PUBLIC_SANITY_PROJECT_ID` — because Next.js inlines
 * `NEXT_PUBLIC_` variables into the browser bundle by literal text
 * substitution at build time. A dynamic lookup like `process.env[name]` is not
 * inlined and would read as `undefined` in the browser.
 */

/**
 * Public: appears in every cdn.sanity.io asset URL this site serves — which is
 * how it was verified. The live production HTML references
 * `cdn.sanity.io/images/huh1e45n/production/…`, and a tokenless GROQ query
 * against `huh1e45n.apicdn.sanity.io` returns HTTP 200 with the real catalogue.
 * Note the `1`: Sanity project IDs are 8 characters, and a 7-character
 * near-miss (`huhe45n`) is a plausible typo that returns a 404 reading
 * "Dataset not found for project ID …" — which looks like a permissions or
 * dataset problem rather than a wrong ID. Don't change this without
 * re-checking it against a live request.
 */
const DEFAULT_PROJECT_ID = "huh1e45n";
const DEFAULT_DATASET = "production";
const DEFAULT_API_VERSION = "2025-01-01";

/**
 * Sanity project IDs are short lowercase alphanumeric strings (`huhe45n`).
 * `@sanity/client` itself only requires /^[-a-z0-9]+$/i with no length bound,
 * which is what let a ~180-character token through. The upper bound is the
 * part that actually catches it.
 */
const PROJECT_ID_PATTERN = /^[a-z0-9-]{1,24}$/;

/** Sanity dataset names: lowercase, and must start alphanumeric. */
const DATASET_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

/** A date (`2025-01-01`, optionally `v`-prefixed), or the `X`/`1` aliases. */
const API_VERSION_PATTERN = /^(v?\d{4}-\d{2}-\d{2}|X|1)$/;

/** Sanity API tokens start with `sk`. Worth calling out by name if we see one. */
const TOKEN_PATTERN = /^sk[a-z0-9]{20,}$/i;

const warned = new Set<string>();

/**
 * Warn once per variable. Deliberately loud and repeated across the build
 * output rather than thrown: throwing here would take down the whole site over
 * a typo in one dashboard field, when falling back keeps it serving correctly.
 * The point is that a misconfiguration stops being invisible.
 */
function warnOnce(name: string, message: string) {
  if (warned.has(name)) return;
  warned.add(name);
  console.warn(`[sanity/config] ${name} ${message}`);
}

function resolve(
  name: string,
  raw: string | undefined,
  pattern: RegExp,
  fallback: string,
): string {
  const value = raw?.trim();

  if (!value) {
    // Not necessarily a fault: local tooling and CI often run without a full
    // env file. Note it and carry on with the default.
    warnOnce(name, `is not set — falling back to "${fallback}".`);
    return fallback;
  }

  if (pattern.test(value)) return value;

  // Truncate: if this is a leaked credential, don't reprint it in full in a
  // build log that other people can read.
  const preview =
    value.length > 12 ? `${value.slice(0, 8)}…(${value.length} chars)` : value;

  if (TOKEN_PATTERN.test(value)) {
    warnOnce(
      name,
      `looks like a Sanity API TOKEN (${preview}), not a config value. ` +
        `Falling back to "${fallback}" so the site keeps working. ` +
        `Treat that token as compromised — it is a NEXT_PUBLIC_ variable, ` +
        `so it was inlined into the browser bundle and served publicly. ` +
        `Revoke it in Sanity (Manage → API → Tokens), then correct the variable.`,
    );
  } else {
    warnOnce(
      name,
      `is not a valid value (${preview}) — falling back to "${fallback}".`,
    );
  }

  return fallback;
}

export const sanityProjectId = resolve(
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  PROJECT_ID_PATTERN,
  DEFAULT_PROJECT_ID,
);

export const sanityDataset = resolve(
  "NEXT_PUBLIC_SANITY_DATASET",
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  DATASET_PATTERN,
  DEFAULT_DATASET,
);

export const sanityApiVersion = resolve(
  "NEXT_PUBLIC_SANITY_API_VERSION",
  process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  API_VERSION_PATTERN,
  DEFAULT_API_VERSION,
);

/** Exported for the unit tests, which need to exercise `resolve` directly. */
export const __testing = {
  resolve,
  PROJECT_ID_PATTERN,
  DATASET_PATTERN,
  API_VERSION_PATTERN,
  DEFAULT_PROJECT_ID,
  DEFAULT_DATASET,
  DEFAULT_API_VERSION,
  resetWarnings: () => warned.clear(),
};
