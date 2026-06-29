import "server-only";

import Stripe from "stripe";

import { env } from "@/env";

/**
 * Server-side Stripe client (secret key). Never import this from client code.
 *
 * The API version is pinned explicitly so that upgrading the Stripe SDK is a
 * deliberate, reviewed change rather than a silent behavioural shift.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});
