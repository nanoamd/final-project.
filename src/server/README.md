# server

**Server-only** application logic. Every module must start with:

```ts
import "server-only";
```

so an accidental import from client code fails the build. This is the only place
secrets (Stripe secret key, Supabase service-role key) may be referenced.

- `actions/` — shared server actions (`"use server"`).
- `data/` — data-access layer: repositories and queries against Supabase/Postgres.
- `webhooks/` — webhook processing (Stripe events, etc.).
