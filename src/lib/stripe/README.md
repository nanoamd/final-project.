# lib/stripe

Browser-side Stripe setup.

- `client.ts` — lazily loads and memoizes Stripe.js using the publishable key,
  for use in Client Components.

The secret-key Stripe client lives in `server/stripe/` (server-only), never here.
