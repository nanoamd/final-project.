# External data requirements

Everything Kaiku needs **from outside Kaiku** to run without a human retyping
it. Four areas, as asked: **shipping rules, live prices, live stock, auto
fulfilment** — plus the identifiers that make all four joinable, because none of
them work if we cannot say which of our products is which of theirs.

Written 20 August 2026 against the live dataset: **237 published products across
five suppliers**, 970 drafts behind them.

## The rule that shapes this whole document

**Every item below has to be something a supplier can legitimately hand over.**
Nothing here is obtained by defeating bot protection — not Aosom's Akamai, not
D.I. Designs' CAPTCHA, not anyone else's. That is a standing constraint and it
is not up for renegotiation, so the list is written as _asks_, not as _scrapes_.

This is less limiting than it sounds. Trade accounts almost always have the data
sitting behind the portal login already; it just has not been requested. The
work is asking the right question in an email, not writing a crawler.

## The five channels, best to worst

How the data arrives decides how much of it stays true without someone
remembering to update it.

| #     | Channel                       | Refresh            | What it costs us                                       |
| ----- | ----------------------------- | ------------------ | ------------------------------------------------------ |
| **1** | **API with a key**            | On demand          | Best case. Stock checked at add-to-basket, live.       |
| **2** | **Hosted feed URL** (CSV/XML) | Hourly–daily       | A cron job. Good enough for everything below.          |
| **3** | **Emailed CSV on a schedule** | Daily–weekly       | A mailbox rule plus an importer. Workable.             |
| **4** | **Manual portal export**      | Whenever we log in | A human, every time. Fine for carriage, not for stock. |
| **5** | **A PDF price list**          | Quarterly at best  | Fine for terms. Useless for stock.                     |

**Channel 2 is the realistic target for all five suppliers.** Ask for 1, accept
2, settle for 3. Anything at 4 or 5 needs a named day of the week when a person
does it, or it silently rots.

---

## A. Shipping rules — what carriage costs Kaiku

The customer pays **£0 delivery on everything**, always. This section is about
what carriage costs _us_, because that is the difference between a real margin
and an optimistic one.

The shapes are already built and tested (`src/lib/suppliers/shipping-rules.ts`).
We do not need a supplier to fit a format — we need the facts, and one of these
five will hold them:

| Rule                 | Means                                      |
| -------------------- | ------------------------------------------ |
| `included`           | Carriage is inside the trade price         |
| `flatPerOrder`       | One charge per order                       |
| `flatPerItem`        | A charge per item                          |
| `weightBands`        | Banded by item weight, lightest band first |
| `freeOverOrderValue` | Free above a threshold, flat below it      |

### What to ask every supplier

1. **Is carriage inside your trade price, or billed on top?**
2. **If billed on top — per order, per item, or by weight?** If by weight, the
   full band table.
3. **Is there a carriage-paid threshold?** The value, and whether it is measured
   on trade cost or RRP.
4. **Surcharges.** Highlands and Islands, Northern Ireland, offshore postcodes,
   and any postcode list that attracts them. _This is the most commonly omitted
   answer and the one most likely to eat a margin without warning._
5. **Two-person / pallet / kerbside delivery** — which products need it and what
   it adds.
6. **Failed delivery and refused delivery** — who pays the return leg.
7. **Do you deliver direct to our customer's address?** For a stockholding
   supplier this single answer decides whether the account behaves like a
   dropship one at all.

### Where each supplier actually stands

| Supplier           |      Published | Rule recorded                                                              | Still needed                                                                                                                             |
| ------------------ | -------------: | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Hill Interiors** |            136 | `included` — evidenced by 70 products already at exactly £0 and none above | Written confirmation, plus the surcharge postcodes. Currently inferred, not stated by them.                                              |
| **D.I. Designs**   |             54 | None on the supplier record; £80/item is known but sits per-product        | Enter it as `flatPerItem` £80 so it derives instead of being typed 54 times. **4 products still carry no carriage figure.**              |
| **AW Dropship**    |             38 | None                                                                       | The full **weight-band table**. This is the blocking ask — 6 products have no carriage figure and the rule cannot resolve without bands. |
| **SaunaPlunge**    |              8 | `included`                                                                 | Confirmation for accessories, which may not be included the way the saunas are.                                                          |
| **Aosom**          | 1 (+24 drafts) | None                                                                       | Everything. Account is live but no terms recorded.                                                                                       |

**Known unknowns right now: 10 published products have no carriage figure at
all** (D.I. Designs 4, AW Dropship 6). Those ten have an unknown margin, not a
zero one — the code is deliberate about the difference.

---

## B. Live prices — what the goods cost us

Cost prices are external. **Retail prices are Damien's and are never imported.**
That is the whole point of the split and nothing in this section changes it.

### What to ask

1. **A cost price file** — supplier SKU and current trade price, nothing else
   required.
2. **How much notice of a price increase**, and by what route. A trade price
   that moves 8% without warning turns a 18% margin into 10% on every sale until
   someone notices.
3. **Volume or tier breaks** — do we get a better price at a certain spend?
4. **VAT treatment** — are the quoted prices ex-VAT? Which lines are zero-rated
   or reduced-rate?
5. **RRP and MAP policy** — is there a minimum advertised price we are
   contractually held to, and do they sell direct to the public at that price?
   _If a supplier undercuts us on their own site, that line is unsellable and we
   should know before we write the page, not after._
6. **Currency and surcharges** — anything priced in EUR, plus fuel or material
   surcharges applied at invoice rather than in the price list.
7. **Discontinued and end-of-line** — a list, so we retire the URL properly
   instead of leaving a page that cannot be bought.

### Where we stand

**Cost prices are in good shape.** Of 237 published products, exactly **one**
(D.I. Designs) has no cost price recorded. Zero products are loss-making.

The gap is not the number, it is the **freshness of the number**. Every cost
price in Sanity was typed by hand at import and nothing tells us when the
supplier last changed it. There is no field recording when a cost was last
verified, and no supplier has told us their notice period.

> **Recommendation:** a `costPriceCheckedAt` timestamp per product, and a
> monthly diff of the supplier's current file against ours. Cheap to build,
> and it is the only thing that turns "we think we make 18%" into "we make 18%".

---

## C. Live stock — is it actually there

The weakest area, and the one most likely to produce a bad customer experience:
we sell it, the supplier hasn't got it, and the first person to find out is the
customer.

### What to ask

1. **A stock feed** — supplier SKU and quantity, or at minimum in/out. **How
   often it refreshes** matters as much as its existence.
2. **Incoming stock dates** for anything out of stock, so "back in three weeks"
   is a fact rather than a hope.
3. **Is stock ring-fenced when we order, or first-come-first-served?** Decides
   whether we can promise anything at checkout.
4. **Per-variant stock**, where a product has colourways or sizes. A
   product-level number is wrong the moment one colour sells out.
5. **Minimum order quantity and order cut-off time** — the hour after which an
   order ships the next working day.
6. **Real lead times per product**, and whether the quoted figure is dispatch or
   delivery. Ours say "7–14 days"; nobody has confirmed which end that measures.
7. **Discontinued lines** — see above; a discontinued product is permanently out
   of stock and should stop being a live URL.

### Where we stand

|                                                   |  Count |
| ------------------------------------------------- | -----: |
| Published products                                |    237 |
| With a stock **quantity** recorded                |    182 |
| With **no** quantity — status only                | **55** |
| Marked "In Stock"                                 |    228 |
| Marked Out of Stock / Coming Soon / Made to Order |      9 |

Checkout already enforces both: Out of Stock and Coming Soon are refused, and a
basket quantity above the recorded stock quantity is refused with a real message
(`src/server/actions/checkout.ts`). **That guard is only as good as the number
behind it, and every one of those numbers was typed by a human at import.** No
supplier stock feed is connected. Nothing refreshes.

The 55 products with no quantity have no quantity guard at all — they pass
checkout on status alone.

**Lead times are inconsistent in a way worth flagging but not worth silently
fixing:** Hill Interiors carries `7–14 days` on 57 products and `7-14 days` on
13 more, plus `3-4 weeks ` with a trailing space on 43. Same lead time, four
spellings. Standing constraint says lead times are not to be changed, so I have
not touched them — `scripts/normalise-lead-time-punctuation.ts` already exists
and would fix only the punctuation, on your say-so.

---

## D. Auto-fulfilment — placing the order without a human

Today a purchase order is composed and sent by email from the admin
(`src/server/suppliers/purchase-order.ts`). It works and it is honest — no
prices, supplier SKU leading, the customer's phone but never their email. It is
also a person pressing a button, and it needs three supplier emails it does not
have.

### What to ask

1. **How can we submit an order without a human?** In descending order of
   preference: an ordering API, an EDI or XML drop, a monitored orders@ mailbox
   with a fixed format, or a portal we have to type into.
2. **What is the exact acceptance response?** An order confirmation number we
   can store against ours, so "did they get it" is answerable.
3. **A dispatch notification** — ideally a webhook, otherwise an email we can
   parse — carrying **the tracking number and the carrier**.
4. **Which carriers do you use**, so we can build tracking links rather than
   pasting a number the customer has to go and find a site for.
5. **How do we ask about an order in flight**, and what response time do you
   commit to?
6. **Returns**: does the supplier issue an **RMA number**, what is their return
   window, who books the collection, what is the restocking fee, and what is the
   return address per product. _Ours is a dropship model — the customer's item
   goes back to the supplier's warehouse, not to us, and an unannounced delivery
   there can be refused._
7. **Damage in transit** — the claim window (ours assumes 48 hours), what
   evidence they need, and whether a replacement or a credit is the default.
8. **A named human, plus an escalation path**, for when the automated route
   fails at four o'clock on a Friday.

### Where we stand

**Only one supplier of five has a trade email on record.**

| Supplier       | Trade email                          | Published products |
| -------------- | ------------------------------------ | -----------------: |
| D.I. Designs   | `trade@didesigns.co.uk`              |                 54 |
| Hill Interiors | **missing**                          |                136 |
| AW Dropship    | **missing**                          |                 38 |
| SaunaPlunge    | **missing** (contact: Kelly Marsden) |                  8 |
| Aosom          | **missing**                          |                  1 |

**183 of 237 published products cannot be ordered from the admin at all**,
because there is no address to send the purchase order to. This is the single
highest-value line in this document: three email addresses typed into Studio
takes ten minutes and unblocks 76% of the catalogue.

Nothing beyond email exists yet — no supplier confirmation capture, no dispatch
webhook, no tracking ingestion, no RMA flow.

---

## E. The identifiers that make all of the above work

A stock feed is useless if we cannot match its rows to our products. Everything
above joins on the **supplier SKU**; everything Google-facing joins on the
**GTIN**.

| Field                    |    Missing on | Why it matters                                                                                                                                                                           |
| ------------------------ | ------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supplierSku`**        | **36** of 237 | Without it a stock or price feed row cannot be matched, and a purchase order names a product the warehouse cannot pick. AW Dropship 20, SaunaPlunge 8, D.I. Designs 7, Hill Interiors 1. |
| **`gtin`** (EAN/barcode) | **68** of 237 | Google Merchant Center penalises listings without one; it is also the only cross-supplier identity a product has. D.I. Designs 54 (i.e. all of them), Hill Interiors 11, SaunaPlunge 7.  |
| **`weight`**             |      6 of 237 | A weight-banded carriage rule cannot resolve without it — this is what makes AW Dropship's carriage unknown.                                                                             |
| **`dimensions`**         |      7 of 237 | Packed size drives pallet vs parcel, and answers the most common pre-sale question.                                                                                                      |

Good news worth recording, because an earlier note in this project said
otherwise: **every published product has images** (`gallery` is populated on all 237) and **every one has a `sourceUrl`**. An earlier count that claimed
otherwise was querying a field name that does not exist — `images` rather than
`gallery`. The images are fine.

Also worth asking each supplier for, since they hold it and we are otherwise
writing it ourselves:

- **High-resolution imagery**, with permission in writing to use it.
- **Packed dimensions and weight**, which differ from the product's own.
- **Materials, finish, care instructions, assembly requirements, warranty
  length** — the specification fields, from their data rather than our
  inference. We write our own descriptions either way; that is a deliberate
  choice and does not change.
- **Certifications** — FSC, fire-retardancy, electrical compliance. Needed on
  anything we make a claim about.

---

## F. What to send, and to whom, this week

One email per supplier. Short, specific, and asking for a file rather than a
conversation — a warehouse inbox answers a specific question far more often than
an open one.

### The template

> Subject: Trade account — data feed and carriage terms
>
> Hi,
>
> We're setting up automated stock and ordering on our side for the
> [SUPPLIER] range and need a few things confirmed:
>
> 1. **Stock** — do you offer a stock feed or API for trade accounts? A CSV at
>    a URL is perfect; SKU and quantity is all we need, and we'd take it as
>    often as you refresh it.
> 2. **Prices** — a current trade price file against your SKUs, and how much
>    notice you give of a price change.
> 3. **Carriage** — is delivery inside the trade price or billed on top? If on
>    top, is it per order, per item, or by weight, and could you send the band
>    table? Also any Highlands/Islands or Northern Ireland surcharges.
> 4. **Ordering** — the best address or system for placing dropship orders, and
>    whether you send a dispatch notification with a tracking number.
> 5. **Returns** — your process for a customer return or a transit damage
>    claim, including the window and the return address.
>
> Happy to work to whatever format suits you.
>
> Thanks,
> Damien — Kaiku

### The order to send them in

1. **Hill Interiors** — 136 products, no email on file, carriage only inferred.
   Biggest single unlock. The pipeline notes already flag "ask for the CSV/XML
   feed URL for our account"; `import-supplier-products.ts --csv` takes it
   directly.
2. **AW Dropship** — 38 products, no email, and the **weight-band table** is the
   one fact that makes 6 unknown margins knowable.
3. **SaunaPlunge (Kelly)** — 8 products, no email, and all 8 lack a supplier
   SKU, so none of them can be ordered by code.
4. **D.I. Designs** — the only reachable one. Ask only for the 4 missing
   carriage figures and the GTINs. **Their pricing is untouchable — do not
   raise prices with them.**
5. **Aosom** — newly accepted. Ask what access type the account gives (feed,
   CSV, API, portal) before importing the 24 drafts. Whatever the answer,
   **their bot protection stays untouched.**

---

## G. What we build once the answers arrive

Listed so the asks above have somewhere to land — none of this is worth
building speculatively.

- [ ] **A feed ingestion job** per supplier: fetch, match on `supplierSku`,
      write `stockQuantity` / `stockStatus` / `costPrice`, and **report** rather
      than write when a row does not match. A silent non-match is how a product
      goes stale forever.
- [ ] **A `lastVerifiedAt` timestamp** on stock and on cost price, surfaced in
      Kaiku HQ. A number with no date on it cannot be trusted or challenged.
- [ ] **A stale-data watchdog** in the alerts feed, alongside the existing eight
      order watchdogs — "Hill Interiors stock has not refreshed in 48 hours" is
      exactly the shape those already take.
- [ ] **A price-change audit entry** written automatically when an ingested cost
      price differs from ours. The audit log is already mandatory; this makes it
      complete rather than manual.
- [ ] **Capture `supplierSku` into the order line-item snapshot at checkout**, so
      a purchase order for a product later deleted from Sanity still knows what
      to order. Flagged in `src/server/suppliers/contacts.ts` as the durable fix.
- [ ] **Dispatch and tracking ingestion**, feeding the tracking number already on
      the order record.
- [ ] **A supplier RMA field** on the returns table, so a return has the
      supplier's reference as well as ours.

## What cannot be automated, and should stop being treated as if it can

- **Anything behind bot protection.** Aosom (Akamai) and D.I. Designs (CAPTCHA)
  are off limits. If they will not provide a feed, those two ranges stay manual —
  that is an accepted cost, not a problem to engineer around.
- **Retail prices.** Damien's, always. No feed ever writes one.
- **Product descriptions.** Written individually. A supplier feed may inform the
  specification fields; it does not write the page.
- **Lead times.** Not to be changed by any import.
