/**
 * Type-safe, validated environment variables.
 *
 * Import `env` from this module instead of reading `process.env` directly:
 *
 *   import { env } from "@/env";
 *   const url = env.NEXT_PUBLIC_SITE_URL;
 *
 * Why:
 * - Missing or malformed variables fail loudly (at boot/build) with a clear
 *   message, instead of surfacing as a runtime 500 in production.
 * - `server` values are guaranteed never to reach the browser bundle.
 * - Every consumer gets full type-safety and autocomplete.
 *
 * Set `SKIP_ENV_VALIDATION=1` to bypass validation (e.g. Docker image builds or
 * lint runs that don't have real credentials available).
 */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Available on both server and client.
   */
  shared: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Server-only secrets. Accessing these from client code is a build error.
   */
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SANITY_API_READ_TOKEN: z.string().min(1),
    // Optional: only needed to enable the /api/revalidate webhook. Every
    // page already has a 60s ISR floor, so this is a supplementary feature,
    // not something that should block the whole app from booting.
    SANITY_REVALIDATE_SECRET: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    // Optional: only needed for the AI garden visualiser tool. Without it,
    // that one tool shows an "unavailable" state — nothing else is affected.
    // Stripped down to printable ASCII: dashboard env-var UIs (Vercel
    // included) can silently inject stray non-ASCII characters (e.g. a
    // bullet point from a masked-value copy-paste) into a pasted secret,
    // which then crashes any fetch() call using it in a header with
    // "Cannot convert argument to a ByteString" — a real key never
    // legitimately contains those characters, so stripping them is safe.
    OPENAI_API_KEY: z
      .string()
      .min(1)
      .optional()
      .transform((val) => val?.replace(/[^\x21-\x7E]/g, "")),
    // Optional: signs the anonymous per-visitor usage cookie for that tool.
    // Falls back to a fixed in-code value if unset (non-critical — worst
    // case a visitor resets their own usage count by clearing cookies).
    RATE_LIMIT_SECRET: z.string().min(1).optional(),
    // Optional: the one Supabase account allowed into /admin. Without it,
    // /admin is unreachable for everyone (fails closed, not open).
    ADMIN_EMAIL: z.string().min(1).optional(),
    // Optional: logs every URL import to a Google Sheet (see
    // src/server/integrations/google-sheets.ts). All three must be set
    // together; without them, the importer just skips this step.
    GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1).optional(),
    GOOGLE_SHEETS_CLIENT_EMAIL: z.string().min(1).optional(),
    GOOGLE_SHEETS_PRIVATE_KEY: z.string().min(1).optional(),
    // Optional: sends a real confirmation email on newsletter signup (see
    // src/server/integrations/resend.ts). Without it, subscribing still
    // saves the email to Sanity — it just skips sending anything.
    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_FROM_EMAIL: z.string().min(1).optional(),
    /**
     * Whether the Google Merchant Center feed serves products.
     *
     * Off unless set to "true", deliberately. Merchant Center pulls the feed on
     * its own schedule, so as soon as one scheduled fetch exists it will keep
     * collecting whatever is published — including a half-reviewed catalogue, and
     * including the moment a batch of imported drafts gets published. Submitting
     * the range once, on purpose, is the intent; a feed that quietly fills up in
     * between is how a product reaches Google before its price is checked.
     *
     * When off, the feed still answers 200 with a valid but empty channel rather
     * than a 404 or an error. That matters: an empty feed makes Merchant Center
     * withdraw the items it already holds, which is the goal, whereas a failed
     * fetch leaves the last successful set live and reports a fetch error.
     */
    MERCHANT_FEED_ENABLED: z
      .string()
      .optional()
      .transform((val) => val === "true"),
  },

  /**
   * Exposed to the browser. Must be prefixed with `NEXT_PUBLIC_` and are
   * inlined into the client bundle at build time.
   */
  client: {
    NEXT_PUBLIC_SITE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    // Optional here on purpose, and no longer read through `env` at all —
    // src/lib/sanity/config.ts owns these three. It shape-checks each one and
    // substitutes a known-good default, which a `min(1)` check here cannot do:
    // the failure that took the site down was a variable that was *present*
    // and non-empty but wrong (an API token pasted into the project ID field),
    // which passes `min(1)` happily. Keeping them required as well would mean
    // a deleted variable still killed every page at boot, when the Sanity
    // client would otherwise have carried on correctly. Listed rather than
    // removed so this file still documents the full expected environment.
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).optional(),
    NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1).optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    // Optional: enables Google Analytics 4 tracking. Without it, the site
    // just renders with no analytics script — nothing else is affected.
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1).optional(),
    // Optional: site-ownership verification codes and Meta Pixel ID. Each
    // renders nothing until set — safe to ship ahead of actually having
    // accounts with these services. See .env.example for where to get each.
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().min(1).optional(),
    NEXT_PUBLIC_BING_SITE_VERIFICATION: z.string().min(1).optional(),
    NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION: z.string().min(1).optional(),
    NEXT_PUBLIC_META_PIXEL_ID: z.string().min(1).optional(),
  },

  /**
   * Static mapping required by Next.js so `NEXT_PUBLIC_` values are inlined
   * correctly. Each key must be referenced explicitly — no dynamic lookups.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SANITY_API_READ_TOKEN: process.env.SANITY_API_READ_TOKEN,
    SANITY_REVALIDATE_SECRET: process.env.SANITY_REVALIDATE_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    RATE_LIMIT_SECRET: process.env.RATE_LIMIT_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    GOOGLE_SHEETS_CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    GOOGLE_SHEETS_PRIVATE_KEY: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    MERCHANT_FEED_ENABLED: process.env.MERCHANT_FEED_ENABLED,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    NEXT_PUBLIC_BING_SITE_VERIFICATION:
      process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
    NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION:
      process.env.NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  },

  /**
   * Treat empty strings (`FOO=`) as undefined so they fail `min(1)` validation
   * rather than silently passing as "".
   */
  emptyStringAsUndefined: true,

  /**
   * Escape hatch for builds without real credentials.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Say which variables are wrong.
   *
   * The default message is unusable when this fails during a hosted build. A
   * missing variable produces `{ code: 'invalid_type', message: 'Invalid input:
   * expected string, received undefined' }` — with no name attached — repeated
   * once per variable, and then `Failed to collect page data for /_not-found`.
   * Faced with seven of those in a Vercel log there is nothing to act on, which
   * is how a deploy stays broken for a month while people guess at which
   * variable it is. (It has already cost one wrong guess in this repo: a commit
   * titled "Make SANITY_REVALIDATE_SECRET optional — likely Vercel build fix".)
   *
   * `issue.path` carries the variable name. Printing it turns the failure into
   * an instruction.
   */
  onValidationError: (issues) => {
    const named = issues.map((issue) => {
      const name = issue.path?.map(String).join(".") ?? "(unknown variable)";
      return `  ${name}: ${issue.message}`;
    });
    throw new Error(
      `Invalid environment variables:\n${named.join("\n")}\n\n` +
        `Set each of the above in the hosting dashboard, or set SKIP_ENV_VALIDATION=1 ` +
        `to build without them. See .env.example for what each one is for.`,
    );
  },
});
