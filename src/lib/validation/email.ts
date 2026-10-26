/**
 * A trimmed, lightly validated email address, or undefined.
 *
 * Deliberately permissive. This is a convenience filter, not an identity
 * check: Stripe validates properly on its own hosted page. The only job here
 * is to make sure a typo, a pasted sentence or an empty box is never handed to
 * the Stripe API as `customer_email`, which it rejects — turning a checkout
 * into an error for a customer who was trying to be helpful.
 *
 * It lives in `lib/` rather than beside the checkout action because
 * `src/server/actions/checkout.ts` carries `"use server"`, and **every export
 * from a "use server" module must be an async function.** Exporting a
 * synchronous helper from there compiles under `tsc` and passes its unit
 * tests, then fails the Turbopack build — which is exactly how it was found.
 */
export function cleanEmail(value: string | undefined): string | undefined {
  const email = value?.trim();
  if (!email || email.length > 254) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}
