-- Multi-user admin roles (docs/kaiku-hq-design.md §1.4 — deferred until a
-- second person actually needs access, now doing so).
--
-- Run this once in the Supabase Dashboard's SQL Editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is idempotent.
--
-- ADMIN_EMAIL (the env var) is always the implicit 'owner' and never needs a
-- row here. To add a second admin: create their Supabase Auth user the same
-- way as today (Authentication > Users > Add user — there's no self-signup),
-- then insert a row here with their email and role.
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'staff',   -- 'owner'|'staff'
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
