# Kaiku HQ — The Internal Operating System

**Version 1.0 · Designed for one operator today, a company tomorrow.**

This is the complete design for Kaiku's internal operating system: the software that runs the business. It is not a generic admin panel and it is not a wishlist — every table, page, automation, and email in this document is specified against the _actual_ production stack (Next.js 16 on Vercel, Supabase Postgres + Auth, Sanity CMS, Stripe, Resend) and the _actual_ data already flowing through it (the `orders` table verified end-to-end on 28 July, the Sanity product schema with `costPrice`/`sku`/`supplier` references, the working Stripe webhook).

**How to read this document:**

- §1 is the architecture: where HQ lives, how data is split, and — critically — the features I evaluated and **refused to build**, with reasons.
- §2 is the full database design: every new table as runnable SQL.
- §3 is the order lifecycle engine — the heart of the system.
- §4 designs every page individually (purpose, layout, tables, filters, actions, automations, edge cases, future improvements).
- §5 is the email system, §6 the complete automation catalogue (the "brain"), §7 the build roadmap with honest effort estimates, §8 the decisions and dashboard configuration only you can do.

---

## §1 — Architecture Decision Record

### 1.1 Where Kaiku HQ lives

**Decision: HQ is the existing `/admin` area of kaikuhome.com, expanded. Not a separate app, repo, subdomain, or platform.**

Why:

- You already have working admin auth (`ADMIN_EMAIL` gate), a deploy pipeline, a design system, and two admin pages (`/admin/import`, `/admin/orders`). Every HQ page inherits all of it for free.
- One codebase means the storefront and HQ share types. When an order's shape changes, both sides update in the same commit. A separate app would drift — this is exactly the "muddled" failure mode you're worried about.
- The Lovable prototype, Shopify, Monday, ClickUp, HubSpot: each would be _another_ login, another subscription, another sync to break. The entire point of HQ is that the count of systems goes **down**, not up.

### 1.2 The data boundary (this rule prevents 90% of future mess)

> **Sanity holds what customers see. Supabase holds what the business does.**

| Data                                                                                  | Home                                            | Why                                                                    |
| ------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Products, categories, brands, content, images, FAQs, guides                           | **Sanity**                                      | Already there; Studio is a world-class editor; the storefront reads it |
| Supplier _identity_ (name, linked from products)                                      | **Sanity**                                      | Products reference it                                                  |
| Supplier _operations_ (contacts, lead times, SLAs, price history, files, performance) | **Supabase**                                    | Operational, relational, private                                       |
| Orders, order events, tracking, margins                                               | **Supabase**                                    | Already there; transactional                                           |
| Tickets, tasks, notifications, email log                                              | **Supabase**                                    | Operational, high-write, relational                                    |
| Newsletter subscribers                                                                | **Supabase** (migrating from Sanity — see §1.4) | PII belongs in Postgres, not a content lake                            |
| Payments (source of truth)                                                            | **Stripe**                                      | Always. HQ keeps a queryable copy, never the authority                 |
| Email sending + open/click tracking                                                   | **Resend**                                      | Transport layer; HQ owns templates and the log                         |

### 1.3 The event spine — how HQ becomes "the brain"

Your core principle — _"if something changes, I should immediately know"_ — is implemented with two tables, not a platform:

1. **`order_events`** — an append-only timeline. Every stage change, note, email, file, and system action on an order writes one row. The order detail page's visual timeline _is_ this table. Nothing important can happen silently, because happening _means_ writing an event.
2. **`notifications`** — every rule in the automation catalogue (§6) that decides "Damien should know this" writes one row here. The bell icon, the notifications page, and the 8 a.m. daily digest email all read from this one table.

No websockets, no message queue, no third-party notification service. At your volume, a badge that updates on page load plus one daily digest email covers "immediately know" honestly. Supabase Realtime can be switched on for the `notifications` table later with ~10 lines of code when sub-minute latency actually matters.

### 1.4 Features evaluated and REFUSED (with reasons)

Per your final instruction — every feature challenged. These were cut:

| Feature requested                                   | Verdict                        | Reason                                                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| In-house keyword rank tracker                       | **Cut**                        | This is an entire SaaS category (Ahrefs exists). Google Search Console's API gives you real clicks/impressions/position for _your_ pages free. HQ integrates GSC (§4.12); it does not scrape Google.                                                                              |
| Full email-marketing engine (Klaviyo clone)         | **Cut**                        | Resend Broadcasts + Audiences already does campaign sends, opens, clicks, unsubscribes. HQ owns the subscriber list, segmentation, and signup-source attribution, and pushes to Resend. Building the sending engine yourself is months of deliverability pain for zero advantage. |
| Warehouse/inventory module                          | **Cut (until you hold stock)** | Kaiku is dropship. There is no stock to count. "Stock alerts" becomes _supplier availability flags_ on products. The moment you lease a warehouse, §7 Phase 3 has the upgrade path.                                                                                               |
| Multi-user roles & permissions                      | **Deferred**                   | One admin. Every table carries an `actor`/`created_by` column from day one so roles can be added _without migration_, but building role UI now is pure overhead.                                                                                                                  |
| Real-time push/websockets                           | **Deferred**                   | See §1.3. Badge + daily digest first; Realtime is a config flip later.                                                                                                                                                                                                            |
| DB-driven workflow builder (drag-drop stage editor) | **Cut**                        | Workflows are code constants in one file (§3.2) — typed, versioned in git, reviewed in PRs. A visual builder is what you build when you have 50 ops staff, not one founder.                                                                                                       |
| Bounce rate / behavioural analytics rebuild         | **Cut**                        | GA4 does behaviour. HQ owns **money** analytics (revenue, profit, AOV, margin, abandoned checkouts) because GA can't know your trade costs. One link-out to GA4 for the rest.                                                                                                     |
| Document management system                          | **Cut**                        | Files attach to orders and suppliers via Supabase Storage. Two buckets, two join tables. Done.                                                                                                                                                                                    |
| "Warranty Registered" as a pipeline stage           | **Changed**                    | Warranty isn't a stage of delivery — it's a property of the order. It's a flag + date, set from the order page. Keeps the timeline honest.                                                                                                                                        |
| AI assistant with write access                      | **Deferred**                   | Ask Kaiku (§4.14) is read-only over whitelisted views in v1. An AI that can _modify_ orders is a Phase 3 decision to make deliberately, not a default.                                                                                                                            |

### 1.5 The Integration Health principle (born from today)

Today a **stale Stripe key in Vercel** silently broke checkout, and a **localhost Site URL in Supabase** broke email confirmation. Nothing in any dashboard said so — we found out by testing.

So HQ's Settings page (§4.15) includes an **Integration Health panel**: on load, it live-pings every credential the business depends on — Stripe key validity, Resend key, Sanity write token, Supabase service role, GSC connection — and shows green/red per service with the error text when red. The class of failure that cost us two hours today becomes a 5-second glance.

---

## §2 — Data Architecture

All new tables live in Supabase Postgres. All are **service-role only** (RLS: no public policies; every access goes through server actions that verify `ADMIN_EMAIL`, exactly like `/admin/orders` does today). The existing customer-facing policy on `orders` (customers read their own rows) is unchanged.

### 2.1 Extensions to the existing `orders` table

```sql
alter table orders
  add column stage text not null default 'paid',
  add column workflow text not null default 'standard',
  add column flagged boolean not null default false,
  add column promised_dispatch_date date,
  add column promised_delivery_date date,
  add column actual_dispatch_date date,
  add column actual_delivery_date date,
  add column tracking_carrier text,
  add column tracking_number text,
  add column tracking_url text,
  add column trade_cost_total integer,          -- pence; snapshot + editable
  add column review_requested_at timestamptz,
  add column warranty_registered_at timestamptz,
  add column customer_name text;                -- from Stripe shipping details

create index orders_stage_idx on orders (stage);
create index orders_created_idx on orders (created_at desc);
```

Line items (the JSONB array) gain one field per line, written by the webhook at order time: `trade_cost` — the product's Sanity `costPrice` **snapshotted at the moment of sale** (costs change; recorded history must not). Editable afterwards from the order page, because the supplier's actual invoice is the final truth.

**Gross profit per order** = `amount_total − trade_cost_total`. **Margin** = GP ÷ amount_total. Computed, never stored redundantly.

### 2.2 The event spine

```sql
create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  type text not null,        -- 'stage_change'|'note'|'email'|'file'|'edit'|'system'
  stage text,                -- for stage_change: the new stage key
  title text not null,       -- human line shown on the timeline
  detail text,
  actor text not null default 'admin',   -- 'admin'|'system'|'stripe'|'resend'
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on order_events (order_id, created_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,            -- key from the automation catalogue (§6)
  severity text not null default 'info',   -- 'info'|'action'|'urgent'
  title text not null,
  body text,
  href text,                     -- deep link into HQ, e.g. /admin/orders/<id>
  dedupe_key text unique,        -- stops the same alert firing twice
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_unread_idx on notifications (created_at desc) where read_at is null;
```

### 2.3 Suppliers (operations layer)

```sql
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  sanity_supplier_id text unique,        -- links to the Sanity supplier doc products reference
  name text not null,
  contact_name text,
  email text,
  phone text,
  order_method text default 'email',     -- 'email'|'portal'|'phone'
  portal_url text,
  payment_terms text,                    -- 'proforma'|'net 30'|...
  default_lead_time_days int,
  dispatch_sla_days int,                 -- their promise: confirm→dispatch
  returns_policy text,
  notes text,
  created_at timestamptz not null default now()
);

create table supplier_files (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  kind text not null,          -- 'catalogue'|'price_list'|'agreement'|'other'
  label text not null,
  storage_path text not null,  -- Supabase Storage: bucket 'supplier-files'
  uploaded_at timestamptz not null default now()
);

create table supplier_price_events (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  sku text,
  product_slug text,
  old_trade_price integer,     -- pence
  new_trade_price integer,
  effective_date date,
  source text,                 -- 'price list July 2026', 'email', ...
  created_at timestamptz not null default now()
);
```

**Supplier performance is derived, never stored** (stored scores drift; derived ones can't lie):

- _Response time_ = avg(`supplier_confirmed` event − `supplier_notified` event)
- _Dispatch time_ = avg(`actual_dispatch_date` − confirm date)
- _Late rate_ = share of orders where `actual_dispatch_date` > `promised_dispatch_date`

### 2.4 Inbox (tickets)

```sql
create table tickets (
  id uuid primary key default gen_random_uuid(),
  source text not null,            -- 'contact_form'|'manual'|'email'
  category text,                   -- 'product'|'delivery'|'warranty'|'supplier'|'general'|'technical'
  status text not null default 'open',  -- 'open'|'waiting_customer'|'waiting_supplier'|'resolved'
  priority text not null default 'normal',  -- 'low'|'normal'|'high'
  customer_name text,
  customer_email text not null,
  customer_phone text,
  subject text not null,
  order_id uuid references orders(id),
  first_response_at timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  direction text not null,     -- 'inbound'|'outbound'|'internal_note'
  body text not null,
  attachments jsonb,
  email_log_id uuid,           -- set when the outbound went via Resend
  created_at timestamptz not null default now()
);
```

The existing contact form (which currently writes to Sanity) is rewired to create a ticket + notification. Nothing a customer sends can disappear into a content lake again.

### 2.5 Email log

```sql
create table email_log (
  id uuid primary key default gen_random_uuid(),
  resend_id text unique,
  to_email text not null,
  subject text not null,
  template_key text,               -- 'outdoor_sauna/supplier_confirmed' etc.
  order_id uuid references orders(id),
  ticket_id uuid references tickets(id),
  status text not null default 'sent',  -- 'sent'|'delivered'|'opened'|'clicked'|'bounced'|'failed'
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now()
);
```

A Resend webhook (`/api/webhooks/resend`) updates `status`/`opened_at`/`clicked_at` and raises a notification on `bounced`/`failed`. Every email the business sends is in this table — "did they get it?" becomes a lookup, not a memory.

### 2.6 Tasks

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text,
  status text not null default 'open',   -- 'open'|'done'|'snoozed'
  priority text not null default 'normal',
  due_date date,
  snoozed_until date,
  checklist jsonb,                       -- [{label, done}]
  order_id uuid references orders(id),
  supplier_id uuid references suppliers(id),
  ticket_id uuid references tickets(id),
  product_slug text,
  customer_email text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
```

Deliberately _not_ ClickUp: no projects, no sprints, no sub-tasks. A task is "a thing that must be done, optionally attached to the record it's about, surfaced until done."

### 2.7 Newsletter & abandoned checkouts

```sql
create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,                 -- 'footer'|'homepage'|'checkout'|'product'|'guide'|'coming_soon'
  resend_contact_id text,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table abandoned_checkouts (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  email text,                  -- present only if Stripe captured it before expiry
  amount_total integer,
  line_items jsonb,
  recovery_email_sent_at timestamptz,
  recovered_order_id uuid references orders(id),
  created_at timestamptz not null default now()
);
```

Two notes:

- **Subscribers migrate from Sanity to Supabase** (one small script). A mailing list is PII with GDPR deletion duties — it belongs in Postgres with the rest of the operational data, synced to a Resend Audience for sending.
- **Abandoned checkouts are nearly free**: the Stripe webhook _already receives_ `checkout.session.expired` and currently just logs it. One insert turns every expiry into a recoverable lead. High-ticket + captured email = the single highest-ROI automation in this document.

### 2.8 Storage buckets & views

- Buckets: `order-files`, `supplier-files` (private; served via signed URLs from server actions).
- Read-only SQL views for analytics and Ask Kaiku (§4.14): `v_orders_flat` (one row per line item with margin), `v_supplier_performance`, `v_product_sales`, `v_ticket_stats`, `v_daily_revenue`. Views are the _only_ surface the AI assistant can query.

---

## §3 — The Order Lifecycle Engine

This is the heart of Kaiku. Every other system (emails, notifications, tasks, supplier performance, dashboard) hangs off it.

### 3.1 The stage model

Kaiku sells high-ticket dropship. An order is not a parcel to batch-process — it is a _case_ to be walked through a supplier-coordination lifecycle. Stages (superset; workflows below choose which apply):

```
paid → review → supplier_notified → supplier_confirmed → production
  → ready_dispatch → tracking → in_transit → delivered
  → follow_up → review_requested → closed
```

Exception states (reachable from anywhere): `cancelled`, `refunded`, `on_hold`.

Notes against your original list:

- "Order Placed" and "Payment Confirmed" collapse into `paid` — with Stripe Checkout you never see an unpaid order; pretending otherwise adds a dead stage.
- "Warranty Registered" is a **flag** (`warranty_registered_at`), not a stage (§1.4).
- `on_hold` exists because real orders stall (customer on holiday, access problem) and a stalled order must not look like a moving one.

### 3.2 Workflows per product type

One constant file — `src/server/hq/workflows.ts` — typed, versioned, reviewed in git:

```
outdoor_sauna:   all 12 stages          (production matters, install follow-up matters)
indoor_sauna:    all 12 stages
cold_plunge:     skips production        (typically supplier-stocked)
garden_building: all 12 + optional install_scheduled between tracking and in_transit
accessory:       paid → supplier_notified → tracking → delivered → review_requested → closed
standard:        fallback = accessory workflow
```

The workflow is assigned automatically at webhook time from the order's line-item category (`outdoor-saunas` → `outdoor_sauna`, etc.), and is editable on the order page. **Mixed-category carts** take the _heaviest_ item's workflow (a sauna + a cover ships on the sauna's timeline).

### 3.3 What a stage change does (the one-click contract)

Clicking the next stage on an order page triggers, in order:

1. `orders.stage` updates; relevant date fields prompt inline (moving to `tracking` asks for carrier + number; moving to `supplier_confirmed` asks for promised dispatch date).
2. An `order_events` row is written (the timeline updates instantly).
3. The email drawer opens **pre-filled with the suggested template** for this workflow × stage (§5) — Preview / Edit / Send / Skip. Sending logs to `email_log` and writes a second event.
4. Any automation rules for the stage fire (§6) — e.g. entering `supplier_notified` starts the "no confirmation in 2 business days" watchdog; entering `delivered` schedules the follow-up and review nudges.

One click, and the customer is informed, the record is complete, and the watchdogs are armed. That is the entire operating philosophy of HQ in one interaction.

### 3.4 Multi-supplier orders (edge case, decided now)

Line items each carry their own supplier. When one order spans two suppliers, the timeline stays singular but the **Supplier panel** on the order page renders one coordination block per supplier (notify/confirm per supplier, tracked in `order_events.metadata.supplier`). The order reaches `supplier_confirmed` only when _all_ suppliers have confirmed. If mixed-supplier orders become common, Phase 3 introduces a proper `fulfilments` table — the event data migrates cleanly because it's already per-supplier. Decided, documented, not over-built.

---

## §4 — Page Designs

Every page follows the same contract: keyboard-first, dense, fast (server components + targeted server actions, zero client-side data fetching waterfalls), and consistent with the existing admin's neutral-50 canvas with the storefront's ink/brass accents and display serif for headline numbers.

### 4.1 Shell & Navigation

**Purpose:** Make every part of the business reachable in ≤2 interactions from anywhere.

**Layout:** Fixed left sidebar (collapsible to icons), top bar, content area.

- **Sidebar:** Dashboard · Orders (badge: needs-action count) · Inbox (badge: open tickets) · Customers · Suppliers · Products · Newsletter · Tasks (badge: due today) · Analytics · SEO · Settings.
- **Top bar:** global search field (also ⌘K) · "Ask Kaiku" button · notification bell (badge: unread) · account menu.

**Global search (⌘K command palette):** One server action fans out to: orders (customer name/email, tracking number, session ID, SKU), tickets (subject/email), tasks, subscribers, suppliers — Postgres `ilike`/FTS — plus a GROQ query over Sanity products (title, SKU, slug). Results grouped by type, arrow-key navigable, Enter deep-links. Phone-number search strips formatting before matching. Sub-100ms perceived: results stream in per group.

**Automations:** none — the shell _displays_ the badges the automation catalogue produces.

**Edge cases:** search with zero results offers "Create task" and "Create ticket" prefilled with the query text; long supplier lists never paginate in the palette (top 5 per group + "view all →").

**Future:** pin recent records; per-entity keyboard shortcuts (G then O = orders).

---

### 4.2 Executive Dashboard (`/admin`)

**Purpose:** The complete health of the business in one screen, ≤5 seconds to scan, every number clickable through to its source.

**Layout:** Three bands.

**Band 1 — Money (this month, vs last month):**

- Revenue · Gross profit (needs trade costs — the number no other tool can show you) · Orders · AOV · Checkout completion rate (orders ÷ (orders + abandoned), honestly labelled — real conversion arrives with GA4 in Phase 2).
- Each tile: big display-serif number, small delta arrow, 30-day sparkline. Click → Analytics filtered to that metric.

**Band 2 — Needs action now (the queue that replaces your memory):**
A single prioritized list, merged from:

- Orders in `paid`/`review` older than 24h ("unacknowledged order" — the most expensive thing in the business to drop)
- `supplier_notified` with no confirmation ≥ 2 business days
- Promised dispatch date passed without tracking
- Tickets unanswered > 24h · Tasks due/overdue
- Abandoned checkouts with a captured email (recoverable £)
- Bounced/failed emails
  Each row: severity dot, one-line description, age, and a **single resolving action** (open order / reply / send recovery email). Empty state: "Nothing needs you. Go sell something."

**Band 3 — Pulse:**

- Recent activity feed (last 20 `order_events` + notifications, merged)
- Newsletter: subscriber count, +this week, top source
- Pipeline mini-board: order count per stage (click → Orders filtered)
- Supplier watch: any supplier currently late on anything

**Database:** reads `orders`, `notifications`, `tickets`, `tasks`, `subscribers`, `abandoned_checkouts`, `v_daily_revenue`. No new tables.

**Edge cases:** zero-data day one — every tile has a real empty state, no fake zeros pretending to be data (the site's established "never fake it" rule applies to HQ too). Month boundaries use Europe/London.

**Future:** revenue targets with pace-to-goal; period comparator (this week vs same week last year).

---

### 4.3 Orders List (`/admin/orders`)

**Purpose:** Every order, filterable to any operational question in one click. Upgrades the page shipped on 28 July.

**Layout:** Filter bar → stage tabs → table.

**Stage tabs (with live counts):** All · Needs action · Awaiting supplier · In production · In transit · Delivered · Closed · Exceptions (cancelled/refunded/on-hold).

**Table columns:** Order (short ID + date) · Customer (name, city) · Items (first item + "+n") · Supplier(s) · Total · **GP / Margin%** · Stage (coloured chip) · Age in stage · ⚑ flag.
Sort by any column; default = needs-action first, then newest.

**Filters:** date range · supplier · category · workflow · margin below X% · flagged · has open task · has open ticket · search within results.

**Row actions (hover / ⌘-click):** open · advance stage · flag · add task · copy customer email.
**Bulk actions:** deliberately minimal — flag, export CSV. (Bulk stage-changes invite mistakes on high-ticket orders; each order deserves its click.)

**Automations surfaced here:** rows whose watchdog fired get an amber left border; overdue-vs-promise rows get red.

**Edge cases:** guest orders (no account) render identically — the email is the customer key; refunded orders show struck-through totals and are excluded from revenue rollups automatically (status filter in the views).

**Future:** saved filter presets ("Mercia orders this month"); column chooser.

---

### 4.4 Order Detail (`/admin/orders/[id]`) — the heart

**Purpose:** Everything about one order on one screen; every next step one click away.

**Layout:** Three-column on desktop.

**Left column — The timeline (the spine of the page):**
Vertical stepper of this order's workflow stages. Completed = filled dot + timestamp + actor; current = pulsing ring; future = hollow. Every `order_events` row renders inline between stages in chronological position: notes, emails (with open/click status pulled live from `email_log`), files, edits. The **"Advance to [next stage]"** button sits pinned at the current stage and executes the §3.3 contract. Any _earlier_ stage can be re-opened (mis-click recovery) — that itself writes an event, so history never lies.

**Centre column — The facts:**

- **Customer card:** name, email (click = compose), phone (click = tel:), full delivery address (click = copy / open in Maps), account link if registered, "other orders by this customer" count.
- **Line items:** image thumb, title (→ live product page), SKU, qty, options, sale price, **trade cost (inline-editable)**, per-line GP. Footer: totals — revenue, trade cost, **GP, margin%** in display serif.
- **Logistics card:** promised dispatch / promised delivery / actual dates (inline-editable, each edit = event), carrier + tracking number + link (moving to `tracking` stage prompts these), delivery estimate shown to customer at purchase (from line-item snapshot).
- **Payment card:** amount, Stripe payment-intent link-out (one click to the money), payment status, refund note if any.

**Right column — The work:**

- **Supplier panel:** per supplier on this order — contact card, order method, "Notify supplier" button = prefilled email (their template: SKUs, quantities, delivery address, your PO reference = short order ID) via the same email drawer. Confirmed state + promised date once entered.
- **Tasks:** inline list scoped to this order; add in one keystroke.
- **Files:** upload (supplier confirmations, delivery PODs, customer photos) → `order-files` bucket; listed with kind + date.
- **Notes:** free text → becomes a timeline event. No separate notes silo.
- **Flags & properties:** ⚑ needs-attention toggle · warranty registered (date) · review requested (date, auto-set by the automation).

**Email history:** every `email_log` row for this order renders in the timeline with status chips (delivered/opened/clicked/bounced) — "did they get the dispatch email?" is answered by looking at the page you're already on.

**Automations on this page:** stage-change contract (§3.3); watchdogs armed per stage (§6); trade-cost edit recomputes GP live.

**Edge cases:** order with items no longer in Sanity (deleted product) — line renders from its snapshot, link disabled, badge "product removed"; multi-supplier per §3.4; currency is stored per order (GBP today; the column already exists for later).

**Future:** printable PO PDF per supplier; customer-facing order-status page sharing the same timeline (massive support deflection at scale).

---

### 4.5 Inbox (`/admin/inbox`) — the Contact Centre

**Purpose:** No customer message ever lost, no reply ever slower than it needs to be.

**Layout:** Classic two-pane: ticket list left, conversation right.

**Ticket list:** status tabs (Open · Waiting on customer · Waiting on supplier · Resolved) with counts. Each row: priority dot, customer name, subject, category chip, **time waiting** (since last inbound without reply — the number that matters), linked-order chip if attached.

**Filters:** category · priority · has order attached · older than 24h/48h.

**Conversation pane:**

- Header: customer name/email/phone; "Link to order" selector (search by email — matching orders suggested automatically); category + priority selectors.
- Thread: inbound messages, outbound replies (with delivery/open status from `email_log`), internal notes (visually distinct, never sent).
- **Reply box:** rich-text-lite; **quick-insert snippets** (delivery policy, warranty summary, returns process, lead-time explanation — maintained in Settings); attachment support.
- **Suggested reply (AI):** one button — drafts a reply from the thread + linked order context + the site's own delivery/returns/warranty pages, using the existing OpenAI key. Always a draft in the editor, never auto-sent. (Same honesty rule as the storefront: no fake instant answers.)
- Actions: Reply & resolve · Reply & wait-on-customer · Escalate to supplier (composes supplier email, sets status waiting_supplier) · Convert to task.

**Automations:**

- Contact-form submission → ticket + `action` notification, auto-categorised by keyword heuristics (warranty/delivery/product terms), category always editable.
- Inbound on resolved ticket → reopens it.
- Open ticket unanswered > 24h → `urgent` notification (the dashboard queue shows it too).
- First outbound reply sets `first_response_at` (your response-time stat derives from this).

**Database:** `tickets`, `ticket_messages`, `email_log`.

**Edge cases:** duplicate rapid submissions from the same email collapse into one ticket (dedupe window 10 min); spam → resolve-with-reason "spam", excluded from stats; a ticket with no reply-to (malformed form input) is flagged at creation.

**Future:** true inbound email (support@ via Resend Inbound or a forwarding parser) so email replies land in the thread automatically — the schema (`source='email'`) is already shaped for it.

---

### 4.6 Customers (`/admin/customers` + detail)

**Purpose:** One page that answers "who is this person and what's our whole history?"

**Decision (challenged):** No separate CRM database. A **customer = the union of everything keyed by their email** — auth account (if any), orders, tickets, subscription, emails. A synced "customers" table would drift; a view can't. `v_customers` materialises: email, name (latest known), first/last order dates, order count, **lifetime value, lifetime GP**, open tickets, subscriber status.

**List:** table of `v_customers` — Name · Email · Orders · LTV · Last order · Subscriber? · Open tickets. Sort by LTV default. Filters: has account / guest · subscriber · ordered in last 90d · LTV above £X.

**Detail (`/admin/customers/[email]`):**

- Header: name, email, phone(s) seen, account badge, subscriber badge + source, **LTV + GP** in display serif.
- Tabs: **Orders** (compact rows → order pages) · **Conversations** (tickets) · **Emails** (every `email_log` row to this address — marketing and transactional both) · **Notes & reminders** (tasks with `customer_email` set; "remind me in March about their garden room" is just a task with a due date).
- Actions: compose email · create task · create ticket · GDPR block: **export everything** (JSON of all rows keyed by this email) and **erase** (delete auth user, anonymise orders email to a hash, purge subscriber row) — a legal obligation designed in now, not bolted on after the first request.

**Edge cases:** same human, two emails — a "merge view" is Phase 3; guest-then-registered is automatic (same email). Corporate buyers with one email, many recipients: fine — the address book lives on orders.

**Future:** LTV cohorts; automatic "VIP" flag (LTV > threshold) that surfaces in Inbox so their tickets jump the queue.

---

### 4.7 Suppliers (`/admin/suppliers` + detail)

**Purpose:** Everything about each supplier relationship, and receipts when renegotiating.

**List:** Name · Products count (from Sanity) · Orders (90d) · Avg response time · Avg dispatch time · **Late rate** · Lead time. Red highlight when late rate > 20%.

**Detail:**

- **Contact & terms card:** contacts, order method + portal URL, payment terms, returns policy, dispatch SLA, notes.
- **Performance strip** (derived live, §2.3): response time · dispatch time · late rate · orders fulfilled — each with trend vs previous quarter. This is your negotiation ammunition and your early-warning system in one strip.
- **Products tab:** GROQ query of every Sanity product referencing this supplier — title, SKU, sale price, trade cost, **margin** — sortable by margin (instantly answers "which of their products are worth pushing?").
- **Price history tab:** `supplier_price_events` timeline; "log price change" action. When Mercia's 2027 list lands, log the deltas here — margin erosion becomes visible instead of discovered.
- **Files tab:** catalogues, price lists, trade agreements (`supplier-files` bucket).
- **Orders tab:** every order containing their lines, with per-order stage.
- **Emails tab:** `email_log` to their address.

**Automations:** supplier late on ≥2 open orders → `urgent` notification; price event logged that pushes any product's margin below a floor you set → `action` notification listing affected products.

**Edge cases:** supplier existing in Sanity but not yet in Supabase → list shows them with "complete profile" prompt (auto-created on first order instead of blocking); a supplier you stop using keeps history forever (no deletes, an `archived` flag).

**Future:** supplier login portal (they confirm orders & upload tracking themselves — the schema's per-supplier events make this a UI project, not a data migration).

---

### 4.8 Products (`/admin/products`) — the ops overlay

**Purpose:** The _commercial_ view of the catalogue. **Challenged and decided:** Sanity Studio remains the product _editor_ — rebuilding editing UI would be pure waste. HQ adds the layer Studio can't: money and completeness.

**Layout:** Table of all products (drafts included):
Title · Category · Supplier · Price · Trade cost · **Margin%** · Stock status · **Completeness score** · Sales (90d) · Status (Draft/Live).

**Completeness score** = checklist computed per product: has ≥3 images · has description ≥ 300 chars · has specs · has delivery lead time · has trade cost · has SKU · has FAQs · has meta description. Shown as n/8 with the missing items on hover. This is your "products needing updates" list, computed rather than remembered.

**Filters:** category · supplier · below margin floor · incomplete · draft · no sales ever.

**Row actions:** **Edit in Studio** (deep link — the one true editor) · view live · flag for review (creates a task).

**Automations:** nightly job recomputes completeness; product goes live with score < 6 → `action` notification. Margin recomputed on any price/cost change via the existing Sanity revalidate webhook.

**Edge cases:** products with no `costPrice` show margin "—" and count as incomplete (not 100% margin — a lie the dashboard would then repeat); import-created drafts appear immediately with their score, which becomes your post-import checklist.

**Future:** AI content assistant _inside the importer_ is already live; extending it to batch-fill FAQs/meta for incomplete products is a natural Phase 2 upgrade using the same anti-fabrication prompt rules.

---

### 4.9 Newsletter (`/admin/newsletter`)

**Purpose:** Own the audience; let Resend do the sending.

**Layout:**

- **Header stats:** total subscribers · +7d / +30d · unsubscribe rate · best source.
- **Growth chart:** subscribers over time, stacked by source.
- **Sources table:** footer / homepage / checkout / product page / buying guide / coming-soon — signups + share for each. (Capture = a one-line `source` prop on the existing Newsletter component instances; ~30 minutes of work, permanent attribution.)
- **Subscribers table:** email · source · date · status; search; CSV export; unsubscribe/delete (GDPR).
- **Campaigns:** list of Resend Broadcasts with opens/clicks pulled via API; "New campaign" deep-links into Resend's composer with the audience preselected. **Deliberately not** an in-house campaign composer (§1.4).

**Automations:** new subscriber → welcome email (already built, needs the Resend key) + synced to Resend Audience + `info` notification (digest only); bounce → subscriber flagged; unsubscribe webhook → status update, never emailed again.

**Edge cases:** duplicate signup = silent success (already handled); signup from checkout uses the order email verbatim; imports from a future list swap require a `source='import'` tag to keep attribution honest.

**Future:** automated flows (welcome series, abandoned-checkout sequence) via Resend's API on top of the same tables.

---

### 4.10 Tasks (`/admin/tasks`)

**Purpose:** The single to-do list, attached to the records the work is about.

**Layout:** Three tabs — Today (due/overdue + unsnoozed) · Upcoming · Done. Rows: checkbox · title · priority dot · due date · linked-record chip (order/supplier/ticket/customer/product — click-through) · checklist progress (2/5). Quick-add bar at top parses "call Mercia about pallet damage friday" → title + due date.

**Filters:** priority · linked type · overdue only.

**Automations that create tasks** (§6): new paid order ("Review & notify supplier — [order]") · watchdog escalations · "follow up" stage suggestions. Completing a task writes an `order_event` when order-linked — the order's timeline shows the work.

**Edge cases:** snooze always requires a date (no snooze-to-nowhere); tasks auto-complete when their triggering condition resolves (tracking task completes when tracking is entered) — no zombie tasks.

**Future:** recurring tasks (monthly supplier price check) — a `recurrence` column already anticipated in design, added when first needed.

---

### 4.11 Analytics (`/admin/analytics`)

**Purpose:** The money truth GA4 can never show, because GA4 doesn't know your trade costs.

**Layout:**

- **Period selector** (7d / 30d / 90d / 12m / custom, always vs previous period).
- **Money row:** Revenue · **Gross profit** · Margin% · Orders · AOV — display serif, deltas.
- **Revenue & GP chart:** daily bars (revenue) with GP line overlaid.
- **Products table:** by revenue and by GP (they differ — a £7k sauna at 18% can earn less than a £4k one at 35%; this table is where pricing decisions come from). Includes "never sold" filter — your dead-stock list.
- **Categories table:** same cuts by category.
- **Abandoned checkouts:** count · value · with-email count · recovered count + recovered £ — the recovery loop's scoreboard.
- **Customers:** new vs returning (by email), repeat rate.
- **Link-out card:** "Behavioural analytics (sessions, bounce, sources) → GA4" — one honest link instead of a half-rebuilt clone.

**Database:** entirely `v_orders_flat`, `v_daily_revenue`, `abandoned_checkouts`. Zero new infrastructure.

**Edge cases:** refunds subtract from the period they were _refunded_ in (cash truth), with a footnote toggle for booked-period view; VAT — figures are gross; a "show ex-VAT (÷1.2)" toggle for supplier-negotiation framing.

**Future (Phase 2):** GA4 Data API for sessions → real conversion rate per product page; funnel (product → basket → checkout → paid) once sessions exist.

---

### 4.12 SEO & Site Health (`/admin/seo`)

**Purpose:** Findability and site integrity, from data you own or Google gives you free — nothing scraped, nothing bought.

**Layout:**

- **Search Console band** (via GSC API, service-account connect in Settings): clicks · impressions · CTR · avg position (28d, deltas) · top 20 queries table · top 20 pages table · index coverage count. The "Opportunities" view is a _computed filter_: queries ranking 5–15 with high impressions and low CTR — page-two terms one content push from page one. That list **is** your content calendar.
- **Site health band** (internal nightly crawler — a Vercel cron walking your own sitemap):
  - Broken internal links (404s) · missing/duplicate titles & meta descriptions · images missing alt text · thin product descriptions (< 300 chars) · pages missing from sitemap · empty categories still linked in nav.
  - Each issue row: severity · URL · one-line fix hint · "create task" action.
- **Content ideas:** the opportunities list cross-referenced with existing guides — "queries you rank #8 for with no dedicated guide."

**Automations:** crawl finds a _new_ 404 → `action` notification (dedupe-keyed by URL so it fires once); GSC clicks drop > 30% week-over-week on a top-10 page → `action` notification.

**Database:** `site_issues` table (url, issue_type, detail, first_seen, resolved_at) — added in Phase 2 with this page.

**Edge cases:** crawler respects a page budget (sitemap order, 200 pages/night at current size — full coverage nightly, still bounded at 10k products); GSC not yet connected → band renders the connect instructions, not fake zeros.

**Future:** Core Web Vitals via CrUX API; per-guide revenue attribution (guide → product click → order) once GA4 events land.

---

### 4.13 Notifications Centre (`/admin/notifications`)

**Purpose:** The full ledger behind the bell.

**Layout:** filter chips (All · Unread · Urgent · Action · Info) → list: severity dot, title, body, age, **one action button** (the deep link), mark-read. "Mark all read" per filter. Every notification is actionable by construction — a notification without a next step is noise and doesn't get a rule in §6.

**Delivery channels:**

1. Bell badge (on every HQ page load).
2. **The 08:00 daily digest email** — one Vercel cron, one email: overnight orders, everything in the needs-action queue, yesterday's revenue. This is the "brain reports to you every morning" mechanism, and it works even on days you never open HQ.
3. Urgent-class rules also send an immediate email (new paid order — you want that one on your phone the second it happens).

**Edge cases:** `dedupe_key` guarantees one alert per condition (the "supplier late" check can run nightly without re-nagging); resolved conditions auto-mark their notification read (order confirmed → its watchdog notification clears).

**Future:** WhatsApp/SMS channel for urgent class; per-rule channel preferences in Settings.

---

### 4.14 Ask Kaiku (`/admin/ask`) — the AI assistant

**Purpose:** Natural-language questions over your own business data.

**Mechanism (deliberately constrained):** the assistant (existing OpenAI key) can call **one tool**: read-only SQL against the whitelisted views (`v_orders_flat`, `v_customers`, `v_supplier_performance`, `v_product_sales`, `v_ticket_stats`, `v_daily_revenue`). It cannot touch base tables, cannot write, cannot see credentials. Answers render as a short sentence + the actual result table + the SQL it ran (auditable, always).

**Handles, from your list:** "show delayed orders" · "which supplier has the highest average margin?" · "which products have never sold?" · "which enquiries are unanswered?" · "customers waiting over 30 days" — all are single-view queries by design; that's _why_ the views exist.

**Layout:** chat pane + suggested-question chips; every answer offers "save as dashboard tile" (Phase 3) and "export CSV."

**Edge cases:** unanswerable-from-views questions get "I can't see that data" — never a hallucinated number (the storefront's no-fabrication rule is a company value, and it binds the AI hardest of all); query timeout 5s with a friendly retry.

**Future:** write actions behind explicit per-action confirmation (Phase 3, deliberate decision, §1.4).

---

### 4.15 Settings (`/admin/settings`)

**Purpose:** Configuration and — critically — proof the machine is plugged in.

**Sections:**

- **Integration Health (§1.5):** live green/red checks — Stripe key (fetch balance) · Resend key (fetch domains) · Sanity write token (dry-run mutation) · Supabase service role · GSC connection · webhook endpoints registered (Stripe event list, Resend webhook). Red rows show the raw error + the fix location. _Today's entire debugging session, reduced to a glance._
- **Email templates:** every workflow × stage template — subject + body preview, edit, test-send to yourself. Snippets library for Inbox quick-replies.
- **Workflow reference:** read-only view of stages per workflow (the code constant, §3.2) so the source of truth is visible without opening the repo.
- **Business rules:** margin floor (%) · watchdog thresholds (days) · digest send time · VAT-display toggle.
- **Notification rules:** per-rule toggle + channel (bell / digest / instant email), defaults per §6.

**Edge cases:** template edits are versioned (previous versions kept in a `template_versions` table) — a bad edit is a one-click revert, and sent-mail history stays reproducible.

---

## §5 — The Email System

**Transport:** Resend. **Templates:** typed functions in `src/server/hq/emails/` sharing one Kaiku layout (the Georgia-serif, ink-on-ivory design already used for the newsletter welcome — customers should feel the brand in transactional mail too). **Log:** every send → `email_log`; Resend webhook → delivery/open/click/bounce status.

### 5.1 Template matrix (workflow × stage)

Rows = stage on entering which the email is _suggested_ (never auto-sent — you stay in control until you trust each template, then per-template auto-send is a Settings toggle):

| Stage                   | outdoor/indoor_sauna                                                                         | cold_plunge                    | garden_building                                                     | accessory    |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------- | ------------ |
| paid                    | **Order confirmation** (immediate, auto — the one exception; customers expect it in seconds) | same                           | same                                                                | same         |
| supplier_confirmed      | "Your sauna is confirmed — here's what happens next" (+ promised window)                     | "Confirmed & preparing"        | "Confirmed — site-prep guide attached"                              | —            |
| production              | "Your sauna has entered production"                                                          | — (skipped)                    | "Being manufactured"                                                | —            |
| tracking                | "Dispatched — tracking inside"                                                               | same                           | "Dispatch + delivery-day guide (access, base, what the drivers do)" | "Dispatched" |
| delivered +3d           | "How's everything? Care tips inside"                                                         | "First-use & water-care guide" | "Settling-in checklist"                                             | —            |
| review_requested (+10d) | Review request (one, polite, with direct link)                                               | same                           | same                                                                | same (+5d)   |
| Exception: on_hold      | "A quick update on your order" (honest delay note)                                           | same                           | same                                                                | same         |

Supplier-facing templates (from the order page's supplier panel): **New PO** (SKUs, qty, delivery address, your reference), **Chase confirmation**, **Chase dispatch**. Same log, same tracking.

### 5.2 Sample copy — "supplier_confirmed", outdoor sauna

> **Subject: Your Kaiku sauna is confirmed and scheduled**
>
> Hello {firstName},
>
> Good news — {productTitle} is confirmed with our workshop and is scheduled for dispatch the week of {promisedDispatchWeek}.
>
> Here's what happens next: we'll email you tracking the moment it leaves. Delivery is kerbside on a pallet — two people and a clear path to your garden make unloading easy. Full delivery guidance: {deliveryGuideUrl}.
>
> Any questions before then, just reply to this email — it comes straight to us.
>
> — Kaiku

Every template follows the same rules: plain language, one clear next thing, reply-to goes to the Inbox, zero marketing in transactional mail.

---

## §6 — The Automation Catalogue (the brain's reflexes)

Every rule: **Trigger → Condition → Actions.** Severity: 🔴 urgent (bell + instant email) · 🟠 action (bell + digest) · ⚪ info (digest only).

| #   | Trigger                             | Condition                     | Actions                                                                                                                                                           | Sev |
| --- | ----------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| 1   | Stripe `checkout.session.completed` | —                             | Create order (exists) · snapshot trade costs · assign workflow · event `paid` · **auto-send order confirmation** · task "Review & notify supplier" · notification | 🔴  |
| 2   | Stripe `checkout.session.expired`   | has email                     | Insert `abandoned_checkouts` · notification "Recoverable £X"                                                                                                      | 🟠  |
| 3   | Stripe `checkout.session.expired`   | no email                      | Insert row (stats only)                                                                                                                                           | ⚪  |
| 4   | Stripe `charge.refunded`            | —                             | Stage → `refunded` · event · notification                                                                                                                         | 🔴  |
| 5   | Order in `paid`/`review`            | > 24h                         | Notification "Unacknowledged order" (dedupe/order)                                                                                                                | 🔴  |
| 6   | Order in `supplier_notified`        | > 2 business days             | Notification + task "Chase {supplier}"                                                                                                                            | 🟠  |
| 7   | `promised_dispatch_date` passed     | no tracking                   | Notification "Dispatch overdue — {supplier}"                                                                                                                      | 🔴  |
| 8   | Order enters `tracking`             | —                             | Suggest dispatch email · set `actual_dispatch_date`                                                                                                               | —   |
| 9   | Order in `in_transit`               | > promised delivery + 2d      | Notification "Delivery overdue" + suggest on_hold email                                                                                                           | 🟠  |
| 10  | Order enters `delivered`            | —                             | Schedule follow-up (+3d) and review (+10d) suggestions                                                                                                            | —   |
| 11  | Delivered +3d                       | follow-up not sent            | Task + suggested email queued                                                                                                                                     | 🟠  |
| 12  | Delivered +10d                      | review not requested          | Suggested review-request email                                                                                                                                    | 🟠  |
| 13  | Contact form submitted              | —                             | Ticket + auto-categorise · notification                                                                                                                           | 🟠  |
| 14  | Ticket inbound                      | on resolved ticket            | Reopen · notification "Customer replied"                                                                                                                          | 🟠  |
| 15  | Ticket open, no reply               | > 24h                         | Notification (dedupe/ticket/day)                                                                                                                                  | 🔴  |
| 16  | Resend webhook                      | bounce/fail                   | `email_log` update · notification "Email failed to {to}"                                                                                                          | 🟠  |
| 17  | Resend webhook                      | open/click                    | `email_log` update (timeline chips)                                                                                                                               | —   |
| 18  | Newsletter signup                   | —                             | Welcome email · Resend Audience sync · digest line                                                                                                                | ⚪  |
| 19  | Supplier                            | late on ≥2 open orders        | Notification "Supplier {name} slipping"                                                                                                                           | 🔴  |
| 20  | Price event logged                  | margin < floor on any product | Notification listing affected products                                                                                                                            | 🟠  |
| 21  | Nightly crawl                       | new 404 / missing meta        | `site_issues` insert · notification (dedupe/url)                                                                                                                  | 🟠  |
| 22  | Product published                   | completeness < 6/8            | Notification "Live but incomplete"                                                                                                                                | 🟠  |
| 23  | Daily 08:00 cron                    | —                             | **Digest email**: overnight orders, needs-action queue, yesterday's £                                                                                             | —   |
| 24  | Task due date                       | reached, open                 | Appears in Today + digest                                                                                                                                         | ⚪  |
| 25  | New review submitted (future)       | —                             | Notification "New review to approve"                                                                                                                              | 🟠  |

**Scheduling note (honest constraint):** Vercel Hobby allows limited cron frequency. All time-based checks (5–7, 9, 11–12, 19, 21–23) run in **one daily 08:00 job**. At your volume, daily is genuinely fine — a supplier chase at 08:00 vs 14:00 changes nothing. Upgrade to hourly = flip to Vercel Pro later, zero redesign.

---

## §7 — Build Roadmap

Honest estimates in working sessions (a session ≈ one of our focused build blocks).

### Phase 1 — "Run the first 50 orders perfectly" (7–9 sessions)

1. Migrations: §2 tables + orders columns + views (1)
2. Order lifecycle: stages, workflows, timeline UI, order detail page rebuild (2)
3. Email engine: layout, matrix v1 (confirmation, confirmed, dispatched, follow-up, review), drawer, log + Resend webhook (2)
4. Notifications: table, rules 1–17, bell, centre, daily digest cron (1)
5. Dashboard v1: money band, needs-action queue, pulse (1)
6. Inbox v1: contact-form rewire, ticket UI, snippets (1)
7. Subscribers migration + source capture + abandoned-checkout insert + Integration Health panel (1)

**Exit criteria:** a real order can be run end-to-end — paid → supplier → delivered → review — entirely inside HQ, with every email logged and every delay self-announcing.

### Phase 2 — "See everything" (5–7 sessions)

Customers view + GDPR tools · Suppliers module + performance + price history · Products ops overlay + completeness · Newsletter page + Resend campaigns · Analytics page · SEO page (GSC + crawler) · Global search ⌘K · Ask Kaiku v1.

### Phase 3 — "Scale" (when revenue demands it)

Multi-user roles (schema-ready) · supplier logins (schema-ready) · customer-facing order tracking page · trade/wholesale accounts · installer & booking management · multi-currency (column exists) · inventory (if you ever hold stock) · affiliate programme · finance exports (Xero CSV) · AI write-actions.

### Future-expansion mapping (proof the architecture holds)

| Future need                     | Already accommodated by                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Multiple warehouses / inventory | Dropship model isolated in workflow layer; add `locations` + `stock_levels` without touching orders |
| International / multi-currency  | `orders.currency` exists; prices per-order snapshots                                                |
| Wholesale/trade                 | `customers` keyed by email + a `pricing_tier` — storefront checkout already re-prices server-side   |
| Supplier logins                 | per-supplier events already exist; add scoped auth                                                  |
| Multi-admin                     | `actor` columns everywhere from day one                                                             |
| Booking/installers              | tasks + calendar layer over the same orders                                                         |

---

## §8 — Needs your hand (not code)

The machine can't be plugged in from the repo. Standing items, all from today's session:

1. **Supabase → Auth → URL Configuration:** Site URL `https://www.kaikuhome.com`, redirect `https://www.kaikuhome.com/**` (fixes the broken confirmation link at the root).
2. **Supabase → SMTP:** finish the custom SMTP config (kills the 2-emails-per-hour default limit that produced today's "rate limit exceeded").
3. **Resend account:** create, verify `kaikuhome.com` domain, put `RESEND_API_KEY` (+ `RESEND_FROM_EMAIL`) into Vercel, redeploy. Unlocks the entire §5 email system and the newsletter welcome that's already coded.
4. **Google Search Console service account** (Phase 2, when we build §4.12).
5. After **any** env-var change in Vercel: **redeploy** (today's lesson — settings don't apply to running deployments).

---

_End of design. Every page above is buildable on the current stack without adding a single new platform. The order of construction is §7; the first commit is the §2 migration._
