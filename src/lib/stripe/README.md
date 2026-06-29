# lib/stripe

Stripe SDK initialization.

- Server-side Stripe (secret key) is constructed here and consumed only from `server/`.
- Browser publishable-key usage (Stripe.js) is set up separately for Client Components.
