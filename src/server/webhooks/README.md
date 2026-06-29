# server/webhooks

Webhook event processing (Stripe, Supabase, etc.). Route handlers in `app/api/`
verify signatures and delegate the actual work to handlers here.
