import "server-only";

import Stripe from "stripe";

import { env, requireEnv } from "@/env";

/**
 * Server-side Stripe client (secret key). Never import this from client code.
 *
 * **Constructed on first use, not at import.** It used to be a module-scope
 * `new Stripe(env.STRIPE_SECRET_KEY, …)`, and that broke the build outright:
 *
 *   Error: Neither apiKey nor config.authenticator provided
 *     at Object.<anonymous> (.next/server/app/api/webhooks/stripe/route.js:10:3)
 *   > Build error occurred
 *   Error: Failed to collect page data for /api/webhooks/stripe
 *
 * `next build` evaluates every route module while collecting page data. A client
 * built at import therefore has to be constructible in the build environment,
 * which is a requirement no route actually has — the key is needed when a
 * request arrives, not when the bundle is assembled. Any environment without the
 * secret to hand (CI, which runs with `SKIP_ENV_VALIDATION=true`, or a local
 * build) fails the whole build on one API route.
 *
 * Constructing it inside the call fixes that: the build never needs the key, and
 * a missing key degrades to a failing webhook rather than a site that will not
 * ship. Stripe's own client is cheap to hold onto, so it is cached after the
 * first call.
 *
 * The API version is pinned explicitly so that upgrading the Stripe SDK is a
 * deliberate, reviewed change rather than a silent behavioural shift.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;

  // Named explicitly. Stripe's own message ("Neither apiKey nor
  // config.authenticator provided") does not say which variable is missing, and
  // this one is worth being unambiguous about: it is the difference between
  // taking payments and not.
  const key = requireEnv(
    "STRIPE_SECRET_KEY",
    env.STRIPE_SECRET_KEY,
    "checkout and the payment webhook cannot work",
  );

  client = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  return client;
}
