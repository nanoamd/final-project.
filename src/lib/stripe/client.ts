import { loadStripe, type Stripe } from "@stripe/stripe-js";

import { env, requireEnv } from "@/env";

let stripePromise: Promise<Stripe | null> | undefined;

/**
 * Lazily load and memoize Stripe.js in the browser using the publishable key.
 * Safe to call repeatedly; the script is only loaded once.
 */
export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(
      requireEnv(
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        "the payment form cannot load",
      ),
    );
  }

  return stripePromise;
}
