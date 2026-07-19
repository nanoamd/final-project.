-- Customer accounts: profiles, saved addresses, and order history.
-- Run this once in the Supabase Dashboard's SQL Editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).

-- ---------------------------------------------------------------------------
-- profiles: one row per signed-up customer, created automatically on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- addresses: a customer's saved delivery addresses.
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text,
  postcode text not null,
  country text not null default 'GB',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

drop policy if exists "addresses_all_own" on public.addresses;
create policy "addresses_all_own" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists addresses_user_id_idx on public.addresses (user_id);

-- ---------------------------------------------------------------------------
-- orders: a local, queryable record of completed Stripe checkouts.
-- Stripe's own dashboard remains the source of truth for payment state;
-- this table exists so logged-in customers can see their own order history.
-- Written only by the Stripe webhook (service-role client bypasses RLS) —
-- customers can read their own rows but never write here directly.
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  email text not null,
  amount_total integer not null,
  currency text not null,
  status text not null default 'paid',
  line_items jsonb not null default '[]'::jsonb,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

create index if not exists orders_user_id_idx on public.orders (user_id);
