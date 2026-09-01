# Getting live price and stock data from suppliers

Requested by Damien, not urgent ("soon"). This is the guide for how to actually
get a live price/stock feed working per supplier — grounded in what's real
today (see `docs/supplier-pipeline.md` for the current state of each
relationship), not a generic "how APIs work" explainer.

**The short version**: this is mostly a business step (asking each supplier
for a feed) followed by a small, format-specific code step (once you have one,
tell me its shape and I build the script that reads it). Nothing here can be
automated without you first getting the thing from the supplier — no
legitimate feed exists yet for any live supplier.

## Where things actually stand right now

Per `docs/supplier-pipeline.md`:

| Supplier               | Relationship                                                                                          | What a live feed would need                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hill Interiors**     | Accepted trade account                                                                                | Already flagged as the next action: ask their account manager for the CSV/XML feed URL for our account                                                                               |
| **SaunaPlunge**        | Trade account, range-extension request sent                                                           | Ask whether they publish a trade price/stock feed alongside the product range                                                                                                        |
| **D.I. Designs**       | Trade account                                                                                         | Not yet asked — same question as above                                                                                                                                               |
| **AW Dropship**        | Trade account (dropship)                                                                              | Not yet asked                                                                                                                                                                        |
| **Premier Housewares** | Trade account                                                                                         | Not yet asked                                                                                                                                                                        |
| **Aosom**              | **Not a real trade relationship** — "keep for range filler only, sells direct and on Amazon, cheaper" | No feed exists or is being sought. Checking their price/stock means checking their own retail site by hand, product by product — there's nothing to automate here until that changes |

So step one for every _real_ supplier relationship (everyone except Aosom) is
literally: ask them. Most trade accounts that offer a feed at all offer it as
one of:

- A **CSV/XML export** from their trade portal (Hill Interiors' likely shape)
- An **EDI/API feed** (rarer for a business this size, but some do)
- A **daily/weekly emailed spreadsheet** (common with smaller suppliers)

## Step by step

1. **Ask the account manager directly**: "Do you provide a live price and
   stock feed for trade accounts — CSV, XML, or an API? If so, what's the URL
   or endpoint, and how do we authenticate?" This is exactly the question
   `docs/supplier-pipeline.md` already flags as the next action for Hill
   Interiors — the same question just needs asking of every other live
   supplier too.
2. **Get the actual file or endpoint**, and one real sample of it. Don't
   guess the format — a feed's column names, units (kg vs g, cm vs mm) and
   stock-status vocabulary ("in stock" vs a raw quantity number vs a lead-time
   string) vary a lot supplier to supplier, and the import has to match
   exactly what's actually there.
3. **Confirm the refresh cadence** they update it on (hourly, daily, on
   change) — that sets how often it's worth checking, not the other way
   round. Checking more often than their own feed updates is wasted requests.
4. **Send me the sample** once you have it. Given the shape (CSV columns, XML
   structure, or API response), I build a script that reads it and either:
   - Feeds straight into `scripts/import-supplier-products.ts --csv` for
     **new** products (it already exists and handles CSV/HTML/JSON — see its
     own doc comment), or
   - A new, purpose-built script for **refreshing price/stock on existing
     published products** — this doesn't exist yet because no feed has
     existed yet to build it against. Same standing discipline as everywhere
     else in this codebase: dry-run first, a mandatory audit-log document
     for every price change (per your own instruction — see
     `scripts/audit-and-fix-margins.ts`), never touch anything the feed
     doesn't explicitly cover.

## The one constraint that matters here

`scripts/enrich-from-supplier.ts` documents a standing rule worth knowing
before this goes further: **no supplier content feed** — every product
description is still written individually, never copied from a supplier's
own prose. That rule is about _description text_, not numbers. A price and a
stock count aren't copywriting — pulling those from a feed doesn't touch that
rule at all. Worth stating plainly so it's clear a live price/stock feed
isn't in tension with anything already decided.

## What this can't shortcut

I can't get you access to a supplier's trade portal, request a feed on your
behalf, or invent a feed format to build against speculatively — that part is
the business relationship, and it's yours to run. What I can do the moment
you have something real: build the exact script that reads it correctly,
matched to its actual shape, with the same audit-trail discipline as every
other data-changing script in this repo.
