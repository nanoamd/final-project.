# The traffic plan

14 August 2026. Asked for directly: _"How long until we can start the marketing and
seo and all traffic plan. We need to make one."_

**The SEO work started weeks ago** — the site's URLs, internal linking, metadata,
sitemap and first nine buying guides are done and live. What did not exist was this: a
written plan saying which lever gets pulled when, what each one is expected to return,
and what is waiting on you.

Two things measured on the live site today decide the order of everything below.

| Checked on www.kaikuhome.com                      | Result                                               |
| ------------------------------------------------- | ---------------------------------------------------- |
| Google Analytics tag in the page                  | **Absent.** No `googletagmanager`, no `gtag`         |
| Meta Pixel, Bing and Pinterest verification       | **Absent**                                           |
| Google Merchant feed `/api/feeds/google-merchant` | **Serves an empty channel** — 311 bytes, no products |
| Sitemap                                           | Live, 152 URLs, correct `www` canonical              |
| robots.txt                                        | Correct, points at the sitemap                       |

So: **we are flying blind, and the fastest free traffic source on the site is switched
off.** Both are environment variables, not code. That is the whole reason the first
phase below is measured in minutes rather than weeks.

---

## The honest answer on timing

You asked in July for ~500 daily organic visitors within three months of the brief,
which lands mid-November.

**That is not happening from organic search alone, and I would rather say so now than
in November.** Here is the arithmetic. 500 organic sessions a day needs roughly 15,000
to 20,000 daily impressions at a typical 3% click-through. On a four-month-old domain
with 152 indexed URLs, competing for product names that Wayfair, Dunelm and Olivia's
also sell, that volume normally takes 9 to 18 months of consistent publishing — or one
guide that takes off and earns links.

What **is** achievable in the window, and what the plan is built around:

| By                      | Organic search | Shopping free listings | Pinterest | Blended daily sessions |
| ----------------------- | -------------- | ---------------------- | --------- | ---------------------- |
| Mid-September (1 month) | 5–20           | 10–40                  | 0–10      | **15–70**              |
| Mid-October (2 months)  | 15–45          | 20–70                  | 5–25      | **40–140**             |
| Mid-November (3 months) | 30–80          | 30–100                 | 15–50     | **75–230**             |
| Mid-February (6 months) | 100–250        | 50–150                 | 30–100    | **180–500**            |

These are estimates, not forecasts, and the ranges are wide on purpose. What moves you
to the top of each range: how fast Merchant Centre approves the feed, whether the price
advantage holds, and whether the publishing cadence in the content section actually
happens every week. What puts you at the bottom: the account sitting unapproved, or
publishing stopping after a fortnight.

**500 a day by mid-November is reachable only with paid spend on top**, and paid should
not start until measurement and a working checkout exist — otherwise you are buying
clicks you cannot see and cannot convert. That gate is in phase 1.

---

## Phase 1 — this week. Stop flying blind. (Yours, ~40 minutes total)

Nothing else in this plan is worth doing until these are done, because without them
there is no way to tell whether any of it worked.

1. **Google Analytics.** Create a GA4 property for kaikuhome.com, copy the measurement
   ID (`G-XXXXXXXXXX`), and add it in Vercel → Settings → Environment Variables as
   `NEXT_PUBLIC_GA_MEASUREMENT_ID`. The tag is already coded and waiting for it.
   **Do not mark it Sensitive** — a `NEXT_PUBLIC_` variable marked Sensitive took the
   site down once before. Redeploy after saving.
2. **Turn the product feed on.** Add `MERCHANT_FEED_ENABLED=true` in the same place.
   The feed route already exists and already serves the right XML shape; it is
   deliberately gated so an incomplete catalogue could not be submitted early.
3. **Google Merchant Centre.** Create the account, verify and claim the website, then
   add a scheduled feed fetch pointing at
   `https://www.kaikuhome.com/api/feeds/google-merchant`, daily. Opt in to **free
   listings** (Shopping tab) — this costs nothing and is the single fastest source of
   qualified traffic you have, because it is the surface where being cheaper than B&Q
   and Wayfair is the ranking factor rather than domain age.
4. **Stripe live keys and `RESEND_API_KEY`.** Still the two blockers on the site being a
   shop rather than a catalogue. Merchant Centre will also reject a store it cannot buy
   from, so these gate phase 2 as well as revenue.
5. **The Companies House number.** One field in `src/config/site.ts`. A UK limited
   company is required to publish it, and it is what Merchant Centre and the trade
   suppliers check to decide Kaiku is a real retailer.

When 1–3 are done, tell me and I will verify the tag is firing, the feed is serving all
99 products, and every item validates against Google's required attributes.

## Phase 2 — weeks 1–4. The engines that pay first.

**Shopping free listings.** Once the feed is fetching, the work is fixing the
disapprovals that always come back on a first submission: missing GTINs, price
mismatches, and the "shipping" and "returns" policies Merchant Centre wants configured
in the account rather than on the site. 126 imported drafts already carry
check-digit-validated EANs from the Hill feed; the published 99 need auditing the same
way, and I will do that as soon as the feed is live and I can read the diagnostics.

**Pinterest.** For furniture and interiors this is the highest-intent free visual
surface there is, and it indexes into Google Images as a bonus. A business account,
domain verification (`NEXT_PUBLIC_PINTEREST_SITE_VERIFICATION` is already coded), rich
pins enabled, then one board per room. The work is pinning the 62 pack shots once the
image pass has run — which is why the shadow work matters commercially and not only
aesthetically.

**Bing.** `NEXT_PUBLIC_BING_SITE_VERIFICATION` is coded and unset. Bing is roughly 5%
of UK search and its Webmaster Tools will import your Search Console setup in two
clicks. Low ceiling, near-zero effort.

**Fix what Search Console is already telling us.** 44 URLs sit at "Discovered –
currently not indexed". Both known causes have now been worked: category orphans (10 → 0) and editorial links (96 products with none → 26). The next check is whether those
44 start moving; if they have not by early September, the next lever is requesting
indexing on the highest-value 20 by hand.

## Phase 3 — months 1–3. The compounding engine.

This is the part that is genuinely already running, and the part that must not stop.

**Long-tail question content, not product names.** You cannot outrank Wayfair for
"oak coffee table" this year. You can outrank them for "what size coffee table for a
3-seater sofa", because they have not written it and you have — with your own
measurements. Nine guides are live. The cadence that works from here is **two pieces a
week**, alternating:

- a **buying guide** answering one purchase question with real measurements from the
  catalogue (garden furniture, outdoor kitchens, cold plunge, home wellness, dining
  chairs, rugs — all still unwritten)
- a **comparison page**, which is the highest-converting content type in furniture
  because it catches people at the decision: indoor vs outdoor sauna, wood vs aluminium
  garden furniture, chenille vs linen upholstery, marble vs oak coffee tables

Every piece links to the products it names, which is what turned 96 unreferenced
products into 26. That number should reach zero.

**Category pages as landing pages.** 12 of 43 categories have introduction copy, buying
guidance and FAQs. The other 18 stocked ones need it, and each one is a page that can
rank for a room-plus-object query on its own.

**Product page depth.** Unique descriptions, FAQs and specifications are largely done.
What is missing is reviews — and until there are real orders there is nothing honest to
put there, which is another reason phase 1 item 4 matters.

## Phase 4 — month 3 onwards. Only once the above is measured.

**Paid, deliberately last.** Shopping ads on a feed already proven to convert
organically, starting at £10–15 a day on the products with the widest price advantage,
and only after GA4 shows what a session is worth. Paid before measurement is a way of
finding out nothing, expensively.

**Links.** The one thing that separates a site that plateaus at 100 a day from one that
does not. Realistic sources for Kaiku: supplier and brand pages (ask Hill Interiors and
Ancient Wisdom for a stockist listing — free, relevant, and they usually say yes), local
Buckinghamshire press on the business itself, and one genuinely original piece of data
worth citing.

**Email.** The list capture is built and the sender is not connected. Once
`RESEND_API_KEY` is set, a monthly email to a list you own is the only traffic channel
nobody can switch off.

---

## What I do next, without waiting for anything

In this order, and all of it visible in `docs/master-brief.md` as it lands:

1. Comparison pages — indoor vs outdoor sauna, wood vs aluminium garden furniture,
   coffee table materials. New keyword surface, and the remaining 26 unreferenced
   products get their first editorial link.
2. Introduction, buying guidance and FAQs for the 18 stocked categories that have none.
3. Product schema and structured data audit — `Product`, `Offer`, `AggregateRating`,
   `BreadcrumbList`, `FAQPage`. This is what earns the rich result that lifts
   click-through without lifting rank, and it is also what Merchant Centre reads.
4. The 62 pack shots, on your word.
5. Google Shopping readiness pass on all 99 published products — GTIN, brand, MPN,
   condition, availability, price — so the first feed fetch does not come back a wall
   of disapprovals.

## The weekly rhythm, once phase 1 is done

Fifteen minutes on a Monday, and it is the difference between a plan and a document.

- **Search Console → Performance.** Impressions before clicks: impressions rising with
  flat clicks means the titles and descriptions need work, not the content.
- **Search Console → Pages.** Is "Discovered – currently not indexed" falling?
- **Merchant Centre → Diagnostics.** Any new disapprovals, fixed the same week.
- **GA4.** Sessions by channel, and which landing pages actually get read.
- **Publish the two pieces.** The cadence is the plan.
