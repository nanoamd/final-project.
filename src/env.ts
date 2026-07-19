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
  },

  /**
   * Exposed to the browser. Must be prefixed with `NEXT_PUBLIC_` and are
   * inlined into the client bundle at build time.
   */
  client: {
    NEXT_PUBLIC_SITE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
    NEXT_PUBLIC_SANITY_API_VERSION: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    // Optional: enables Google Analytics 4 tracking. Without it, the site
    // just renders with no analytics script — nothing else is affected.
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().min(1).optional(),
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
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
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
});
