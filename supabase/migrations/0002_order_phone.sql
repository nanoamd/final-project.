-- Adds the customer's phone number to stored orders — needed to actually
-- fulfil an order via a trade supplier's order form (booking delivery or
-- installation requires calling the customer). Collected at checkout via
-- Stripe's phone_number_collection, written by the same webhook that
-- already persists the shipping address.
alter table public.orders
  add column if not exists phone text;
