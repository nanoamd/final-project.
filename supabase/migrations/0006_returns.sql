-- Returns.
--
-- Kaiku publishes a returns policy but has no way to act on one: a customer who
-- reads it is told to "contact us", which means an email into an inbox with no
-- reference, no record, and nothing tying it to the order. Under the Consumer
-- Contracts Regulations 2013 a customer has a right to cancel, and a shop that
-- cannot receive a cancellation reliably is a shop that will eventually fail to
-- honour one.
--
-- Run this once in the Supabase Dashboard: Project > SQL Editor > New query.
-- Safe to re-run — every statement is idempotent.

-- ---------------------------------------------------------------------------
-- Reference numbers, the same shape as order numbers.
--
-- The policy tells customers not to post anything back until Kaiku has given
-- them "the reference the warehouse needs", because an unannounced delivery to
-- a supplier's warehouse can be refused. That reference has to exist.
-- ---------------------------------------------------------------------------
create sequence if not exists public.return_number_seq start with 1000;

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  return_number text not null default 'KR-' || nextval('public.return_number_seq')::text,
  order_id uuid not null references public.orders (id) on delete cascade,

  -- Who asked. Denormalised from the order so a return is still readable if the
  -- order row is ever trimmed, and so an email can be sent without a join.
  email text not null,
  customer_name text,

  -- What they said.
  reason text not null check (
    reason in (
      'change-of-mind',
      'faulty',
      'damaged-in-transit',
      'not-as-described',
      'wrong-item'
    )
  ),
  -- Their own description, and the questionnaire answers behind the decision.
  detail text,
  unused boolean not null default true,
  original_packaging boolean not null default true,
  -- Which line items are coming back. Whole-order returns list them all.
  line_items jsonb not null default '[]'::jsonb,
  -- Sanity asset URLs for the photographs supplied as evidence.
  photo_urls jsonb not null default '[]'::jsonb,

  -- What the rules decided, and why. Stored rather than recomputed, because the
  -- customer was told this answer on this date, and the rules may change.
  decision text not null check (decision in ('accept', 'review', 'decline')),
  decision_notes jsonb not null default '[]'::jsonb,
  return_shipping_paid_by text not null check (
    return_shipping_paid_by in ('kaiku', 'customer')
  ),
  supplier_window_likely_closed boolean not null default false,

  -- Where it has got to, as an operator moves it along.
  status text not null default 'requested' check (
    status in (
      'requested',
      'approved',
      'awaiting_item',
      'received',
      'refunded',
      'replaced',
      'rejected'
    )
  ),
  -- Set when a human overrides the automatic decision, with their reasoning.
  resolution_note text,

  refund_amount integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists returns_return_number_idx
  on public.returns (return_number);
create index if not exists returns_order_id_idx on public.returns (order_id);
create index if not exists returns_status_idx on public.returns (status);

-- ---------------------------------------------------------------------------
-- Row level security.
--
-- Same shape as `orders`: a customer reads their own, and every write goes
-- through a server action holding the service role. There is deliberately no
-- customer UPDATE policy — a return's status is Kaiku's to set, and letting a
-- customer mark their own return "refunded" is not a hypothetical risk.
-- ---------------------------------------------------------------------------
alter table public.returns enable row level security;

drop policy if exists "returns_select_own" on public.returns;
create policy "returns_select_own" on public.returns
  for select
  using (
    exists (
      select 1
      from public.orders
      where orders.id = returns.order_id
        and orders.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Keep updated_at honest without anybody remembering to set it.
-- ---------------------------------------------------------------------------
create or replace function public.touch_returns_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists returns_touch_updated_at on public.returns;
create trigger returns_touch_updated_at
  before update on public.returns
  for each row
  execute function public.touch_returns_updated_at();
