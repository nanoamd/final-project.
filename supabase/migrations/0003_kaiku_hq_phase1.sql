-- Kaiku HQ, Phase 1: the operational tables the internal admin platform
-- runs on. See docs/kaiku-hq-design.md §2 for the full design.
--
-- Run this once in the Supabase Dashboard's SQL Editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).
--
-- Every table below is admin-only. RLS is enabled with NO policies, which
-- denies all access to the anon/authenticated roles by default — only the
-- service-role client (used by admin server actions, exactly like
-- src/server/supabase/admin.ts already does for `orders`) can read or write.
-- Customers never query these tables directly.

-- ---------------------------------------------------------------------------
-- orders: new columns for the lifecycle engine (§3).
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists stage text not null default 'paid',
  add column if not exists workflow text not null default 'standard',
  add column if not exists flagged boolean not null default false,
  add column if not exists promised_dispatch_date date,
  add column if not exists promised_delivery_date date,
  add column if not exists actual_dispatch_date date,
  add column if not exists actual_delivery_date date,
  add column if not exists tracking_carrier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists trade_cost_total integer,
  add column if not exists review_requested_at timestamptz,
  add column if not exists warranty_registered_at timestamptz,
  add column if not exists customer_name text;

create index if not exists orders_stage_idx on public.orders (stage);

-- ---------------------------------------------------------------------------
-- order_events: append-only timeline. Every stage change, note, email, file,
-- and system action on an order writes one row here — this table IS the
-- order detail page's visual timeline.
-- ---------------------------------------------------------------------------
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  type text not null,        -- 'stage_change'|'note'|'email'|'file'|'edit'|'system'
  stage text,                -- for stage_change: the new stage key
  title text not null,       -- human line shown on the timeline
  detail text,
  actor text not null default 'admin',   -- 'admin'|'system'|'stripe'|'resend'
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.order_events enable row level security;
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------------------
-- notifications: every automation rule that decides "the admin should know
-- this" writes one row here. The bell icon, the notifications page, and the
-- daily digest email all read from this one table.
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  severity text not null default 'info',   -- 'info'|'action'|'urgent'
  title text not null,
  body text,
  href text,
  dedupe_key text unique,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
create index if not exists notifications_unread_idx on public.notifications (created_at desc) where read_at is null;

-- ---------------------------------------------------------------------------
-- suppliers: operational layer (contacts, terms, performance). Sanity keeps
-- the supplier's public identity (name, product references); this table
-- keeps the private operational relationship.
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  sanity_supplier_id text unique,
  name text not null,
  contact_name text,
  email text,
  phone text,
  order_method text default 'email',       -- 'email'|'portal'|'phone'
  portal_url text,
  payment_terms text,
  default_lead_time_days int,
  dispatch_sla_days int,
  returns_policy text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;

create table if not exists public.supplier_files (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  kind text not null,          -- 'catalogue'|'price_list'|'agreement'|'other'
  label text not null,
  storage_path text not null,  -- Supabase Storage bucket: 'supplier-files'
  uploaded_at timestamptz not null default now()
);

alter table public.supplier_files enable row level security;
create index if not exists supplier_files_supplier_idx on public.supplier_files (supplier_id);

create table if not exists public.supplier_price_events (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  sku text,
  product_slug text,
  old_trade_price integer,
  new_trade_price integer,
  effective_date date,
  source text,
  created_at timestamptz not null default now()
);

alter table public.supplier_price_events enable row level security;
create index if not exists supplier_price_events_supplier_idx on public.supplier_price_events (supplier_id, created_at desc);

-- ---------------------------------------------------------------------------
-- tickets: every customer enquiry (contact form and future channels)
-- becomes one row here — nothing a customer sends can disappear again.
-- ---------------------------------------------------------------------------
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  source text not null,             -- 'contact_form'|'manual'|'email'
  category text,                    -- 'product'|'delivery'|'warranty'|'supplier'|'general'|'technical'
  status text not null default 'open',   -- 'open'|'waiting_customer'|'waiting_supplier'|'resolved'
  priority text not null default 'normal',
  customer_name text,
  customer_email text not null,
  customer_phone text,
  subject text not null,
  order_id uuid references public.orders (id),
  first_response_at timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.tickets enable row level security;
create index if not exists tickets_status_idx on public.tickets (status, last_message_at desc);
create index if not exists tickets_email_idx on public.tickets (customer_email);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  direction text not null,     -- 'inbound'|'outbound'|'internal_note'
  body text not null,
  attachments jsonb,
  email_log_id uuid,
  created_at timestamptz not null default now()
);

alter table public.ticket_messages enable row level security;
create index if not exists ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

-- ---------------------------------------------------------------------------
-- email_log: every email the business sends (transactional and marketing),
-- with delivery/open/click status updated by the Resend webhook.
-- ---------------------------------------------------------------------------
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  resend_id text unique,
  to_email text not null,
  subject text not null,
  template_key text,
  order_id uuid references public.orders (id),
  ticket_id uuid references public.tickets (id),
  status text not null default 'sent',  -- 'sent'|'delivered'|'opened'|'clicked'|'bounced'|'failed'
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.email_log enable row level security;
create index if not exists email_log_order_idx on public.email_log (order_id);
create index if not exists email_log_to_idx on public.email_log (to_email);

-- ---------------------------------------------------------------------------
-- tasks: the single to-do list, optionally attached to the record it's about.
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text,
  status text not null default 'open',   -- 'open'|'done'|'snoozed'
  priority text not null default 'normal',
  due_date date,
  snoozed_until date,
  checklist jsonb,
  order_id uuid references public.orders (id),
  supplier_id uuid references public.suppliers (id),
  ticket_id uuid references public.tickets (id),
  product_slug text,
  customer_email text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.tasks enable row level security;
create index if not exists tasks_status_idx on public.tasks (status, due_date);

-- ---------------------------------------------------------------------------
-- subscribers: the newsletter list, migrating from Sanity (a content lake is
-- the wrong home for PII with GDPR deletion duties). Synced to a Resend
-- Audience for sending.
-- ---------------------------------------------------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,                 -- 'footer'|'homepage'|'checkout'|'product'|'guide'|'coming_soon'
  resend_contact_id text,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.subscribers enable row level security;

-- ---------------------------------------------------------------------------
-- abandoned_checkouts: every expired Stripe Checkout Session with a captured
-- email becomes a recoverable lead. The webhook already receives
-- `checkout.session.expired` today and only logs it — this is the one-insert
-- upgrade that turns that into money.
-- ---------------------------------------------------------------------------
create table if not exists public.abandoned_checkouts (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  email text,
  amount_total integer,
  line_items jsonb,
  recovery_email_sent_at timestamptz,
  recovered_order_id uuid references public.orders (id),
  created_at timestamptz not null default now()
);

alter table public.abandoned_checkouts enable row level security;
create index if not exists abandoned_checkouts_email_idx on public.abandoned_checkouts (email);

-- ---------------------------------------------------------------------------
-- Views: read-only aggregates over `orders`, safe to build now because they
-- only depend on data already flowing through the app. Views that would
-- depend on order_events/tickets conventions the application code doesn't
-- write yet (supplier performance, ticket stats) are deferred to the
-- migration that ships alongside that code, rather than guessing their
-- shape now — see docs/kaiku-hq-design.md §2.8.
-- ---------------------------------------------------------------------------
create or replace view public.v_orders_flat as
select
  o.id as order_id,
  o.created_at,
  o.status,
  o.stage,
  o.currency,
  o.email,
  item ->> 'description' as description,
  item ->> 'slug' as slug,
  item ->> 'sku' as sku,
  item ->> 'category' as category,
  item ->> 'supplier' as supplier,
  coalesce((item ->> 'quantity')::int, 1) as quantity,
  coalesce((item ->> 'amount_total')::int, 0) as line_amount_total,
  coalesce((item ->> 'trade_cost')::int, 0) as line_trade_cost,
  coalesce((item ->> 'amount_total')::int, 0) - coalesce((item ->> 'trade_cost')::int, 0) as line_gross_profit
from public.orders o
cross join lateral jsonb_array_elements(o.line_items) as item
where o.status = 'paid';

create or replace view public.v_daily_revenue as
select
  date_trunc('day', created_at)::date as day,
  count(*) as orders,
  sum(amount_total) as revenue,
  sum(coalesce(trade_cost_total, 0)) as trade_cost,
  sum(amount_total) - sum(coalesce(trade_cost_total, 0)) as gross_profit
from public.orders
where status = 'paid'
group by 1
order by 1 desc;

create or replace view public.v_product_sales as
select
  slug,
  sku,
  category,
  supplier,
  count(*) as line_count,
  sum(quantity) as units_sold,
  sum(line_amount_total) as revenue,
  sum(line_gross_profit) as gross_profit
from public.v_orders_flat
where slug is not null
group by 1, 2, 3, 4;
