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
    SANITY_REVALIDATE_SECRET: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
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
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
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
