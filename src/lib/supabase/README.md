# lib/supabase

Supabase client factories.

- `client.ts` — browser client (safe for Client Components; anon key only).
- `server.ts` — server client bound to request cookies (Server Components / actions).

The privileged service-role client lives in `server/` — never here, never client-side.
