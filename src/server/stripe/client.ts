import "server-only";

import Stripe from "stripe";

import { env } from "@/env";

/**
 * Server-side Stripe client (secret key). Never import this from client code.
 *
 * The API version is intentionally left to the SDK's pinned default so the
 * types stay in sync with the installed library; pin it explicitly here once
 * the integration is built and tested against a known version.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
