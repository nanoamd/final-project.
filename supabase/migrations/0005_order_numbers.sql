-- Human order numbers.
--
-- Damien, after his first live order: "why is the order hidden and labelled by
-- random numbers". He is right. Orders were identified only by their UUID
-- (`3f9c8a12-...`), which is unusable out loud, unusable on an invoice, and
-- unusable in a supplier email. Every real shop has an order number a person
-- can read back over the phone.
--
-- A sequence, not a hash of the UUID: order numbers should count upwards, so
-- "KH-1042" is visibly the forty-third order and two orders placed a minute
-- apart sort correctly. Starting at 1000 rather than 1 so the first order does
-- not announce itself as the first order.
--
-- Run this once in the Supabase Dashboard: Project > SQL Editor > New query.
-- Safe to re-run — every statement is idempotent.

-- ---------------------------------------------------------------------------
-- The sequence and the column.
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start with 1000;

alter table public.orders
  add column if not exists order_number text;

-- ---------------------------------------------------------------------------
-- Backfill any orders that already exist, oldest first, so the numbering
-- reflects the order they were actually placed in.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select id from public.orders where order_number is null order by created_at asc
  loop
    update public.orders
      set order_number = 'KH-' || nextval('public.order_number_seq')::text
      where id = r.id;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- New orders get one automatically. Done as a default rather than in
-- application code so an order can never exist without a number — including
-- one created by a Stripe webhook retry, a manual insert, or any future code
-- path nobody has written yet.
-- ---------------------------------------------------------------------------
alter table public.orders
  alter column order_number set default 'KH-' || nextval('public.order_number_seq')::text;

-- Unique so two orders can never share a number, and indexed because looking
-- an order up *by* its number is the whole point of having one.
create unique index if not exists orders_order_number_idx
  on public.orders (order_number);
