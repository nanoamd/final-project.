# Getting to the first sale, or 10 clicks a day

Written 23 September 2026, from Search Console, the live site, Sanity and the
Merchant feed rather than from memory. Every number here has a query behind it.

---

## The number that reframes everything

Damien's read is right: about **300 impressions and 3 clicks a day**. What that
figure hides is where the impressions are.

Search Console, 8–22 September, all countries, `search_type = web`:

| Page                                  | Impressions | Clicks | Avg position |
| ------------------------------------- | ----------: | -----: | -----------: |
| `/tools/wall-clock-size-calculator`   |         225 |      0 |         7.43 |
| `/tools/vase-size-calculator`         |         210 |      0 |         6.52 |
| `/tools/tv-unit-size-calculator`      |          78 |      0 |         6.64 |
| `/tools/mirror-size-calculator`       |          58 |      0 |         8.14 |
| `/tools/sofa-size-calculator`         |          47 |      0 |        11.77 |
| `/tools/dining-table-size-calculator` |          45 |      0 |        10.98 |
| `/tools/coffee-table-size-calculator` |          44 |      1 |         6.77 |
| **Total**                             |     **707** |  **1** |            — |

The same fifteen days, **filtered to the United Kingdom**, those same pages
total **4 impressions**. Two on the wall clock calculator, two on the sofa one.

It is not only the tools. The Yorkshire Cabin sauna page took 209 impressions
at average position 1.54 — **9 of them in the UK**. `what-size-kitchen-storage-jar`
took 118 — **1 in the UK**.

**Across every page on the site, the UK produced about 110 impressions and 2
clicks in fifteen days.** Roughly **7 UK impressions a day**, not 300. The other
293 are the United States, the Netherlands, Germany and India, looking at pages
about how to measure a vase, on a shop that delivers to Great Britain only.

### At least 239 of those impressions are not people

Found while checking a different claim, and it is the more useful half of this
page. Filtering the same fifteen days to queries containing `| kaiku`:

| Query (the page's own `<title>`, verbatim)                             | Impressions | Clicks |
| ---------------------------------------------------------------------- | ----------: | -----: |
| `saunaplunge yorkshire cabin 2-person outdoor infrared sauna \| kaiku` |         182 |      0 |
| `five-tier cascading fountain with led lights, rustic brown \| kaiku`  |          34 |      0 |
| `saunaplunge dales glow 2 person indoor infrared sauna \| kaiku`       |          20 |      0 |
| `computer desk with hutch shelf, black \| kaiku`                       |           3 |      0 |
| **Total**                                                              |     **239** |  **0** |

Every one at average position 1. **No human types a search containing a pipe
character and a brand suffix** — that is a page title being looked up verbatim,
which is what price-comparison and catalogue scrapers do. The geography says the
same thing: 153 of the 239 are Germany and the Netherlands, on one product.

Three consequences, all of which matter for reading any future report:

1. **The impression count is inflated and the click-through rate is
   correspondingly deflated.** About 9% of all impressions in this window are
   robotic, and because they all sit at position 1 with no clicks, they drag the
   site's average CTR down while making its average position look healthy.
2. **It explains the Netherlands and Germany.** Those two countries showed 539
   impressions between them in the last report. At least 153 are this one
   pattern.
3. **A page at "position 1 with no clicks" is not necessarily a click-through
   problem.** It is worth checking which query produced the impressions before
   concluding anything — which is how this was found, after a wrong conclusion
   about a slug had already been written down.

Nothing needs fixing here. Scrapers are not an attack and blocking them would
cost more than it saves. It needs knowing, so that the next person reading a
300-impression day understands what a good part of it is.

### What follows from that, and it is the whole plan

Ten clicks a day from the UK needs roughly **200–300 UK impressions a day** at a
realistic 3–5% click-through rate. Today there are seven. That is a thirty-fold
increase, and **no amount of title-tag tuning produces it**, because there is
almost no UK traffic to tune. The clicks have to come from UK commercial
surface that does not exist yet.

Three channels can produce it, in order of how fast they can:

1. **Google Shopping free listings** — 908 products already in the feed. This is
   the only channel where a UK buyer searching "5 tier water fountain" can see a
   Kaiku product this month rather than next year.
2. **Category pages ranking for UK commercial queries** — `/shop/sofas` already
   gets UK impressions at position 37.6. Position 37 to position 8 is a real
   piece of work, but it is a known one.
3. **Product pages for genuinely uncontested items** — the scarcity work already
   identified these.

Everything below is ordered by how much it moves one of those three.

---

## Tier 1 — unlock UK commercial impressions

Nothing else on this page matters as much as this tier.

### 1. Resolve the brand ↔ GTIN contradiction in the Merchant feed

**899 of 908 products declare brand "Kaiku". 728 of those also carry a GTIN that
belongs to Aosom, Hill Interiors or D.I. Designs**, because that is who
registered the barcode. Google validates the brand/GTIN pair. A mismatch does
two things: it is a documented disapproval reason, and — worse — it stops the
item matching the catalogue entry other retailers list against, which is how a
free listing gets shown for a generic product query at all.

All 729 GTINs are structurally valid with correct check digits and no
duplicates, so the barcodes are not the fault. The brand declaration is.

Two coherent options, and the current state is neither:

- **Send the manufacturer's brand with the manufacturer's GTIN.** Recommended.
  It is what the data says is true, it unlocks product matching, and the brand
  shown in a Shopping tile does not change what the website says about Kaiku.
- **Drop the GTIN and declare `identifier_exists: no`** on genuinely own-brand
  goods. Honest, but it forfeits matching entirely.

This is a positioning decision, so it is Damien's. Everything else in Tier 1 is
downstream of it.

### 2. Get the issue name for the 136 items still not showing

Merchant Center → Products → **Needs attention**. Copy the issue name. Ten
minutes. Every theory that can be tested from our own data has been tested and
cleared — landing pages, prices, required fields, duplicate IDs, ID length,
shipping, image size, GTIN validity. The brand mismatch above is the last
standing candidate, and Merchant Center's own wording settles it.

### 3. Populate `mpn` from `supplierSku` on the 162 products with no identifier

179 products carry neither GTIN nor MPN; **162 of them have the supplier's own
product code already stored**. Writing that into `mpn` removes
`identifier_exists: no` from 162 items and gives Google something to match on.
Blocked behind item 1, because MPN is only meaningful next to the right brand.

### 4. Fix two malformed slugs — cosmetic, and here is the correction

```
/shop/indoor-saunas/saunaplunge-tm-dales-glow-2-person-indoor-infrared-sauna-or-kaiku
/shop/privacy-screens/rhombus-metal-privacy-screen-with-stand-black-or-kaiku
```

The "™" became `-tm-` and the "|" became `-or-`. Every sibling sauna has a clean
slug, so these two were generated before the rule was fixed. Worth repairing,
with a 301 through `src/lib/seo/retired-urls.ts`.

**I first wrote here that the sauna slug was costing clicks — 44 impressions at
position 1 with none — and that was wrong.** Checking which query produced them
showed all 44 came from `saunaplunge dales glow 2 person indoor infrared sauna |
kaiku`, out of Germany, the Netherlands and France. That is the page's own
`<title>`, pipe and brand suffix included. No person types that. It got no
clicks because nothing human ever saw it. See the section below — it turned out
to be the more useful finding of the two.

So: fix the slugs because a broken URL is worth not having, not because they are
losing anybody.

### 5. Shorten the 66 slugs truncated mid-word at 90 characters

`...pine-storage-bed-3ft-single-solid-wooden-bed-frame-with-drawers-headboard-wood-slat-suppor`.
Same credibility problem as item 4, lower urgency because none of them is
ranking yet. All 66 are Aosom products whose supplier titles are enormous.

### 6. Settle the 127 blank `stockStatus` values

The feed maps a blank status to `backorder`, which is the honest default but
suppresses the item. 127 products are affected — mostly Premier Housewares. One
answer from Damien ("are these generally in stock?") converts 127 suppressed
items into servable ones.

### 7. Submit the commercial pages for indexing

347 URLs sit in "Discovered — currently not indexed". That is a crawl-budget and
authority problem, not a technical fault, and the technical side has been
audited clean. What can be done by hand is requesting indexing for the twenty or
thirty pages that actually matter commercially, rather than all 908.

---

## Tier 2 — make new content target what a UK buyer types

### 8. Stop building globally-topical guides, start building UK-commercial pages

The tool pages are well made and they rank — at position 6 to 8, worldwide, for
queries with no country in them. "What size vase" is the same question in
Ohio and Oldham, so Google serves it to both, and the Ohio reader cannot buy.

That is not an argument for deleting them. It is an argument that **the next ten
pages must be shaped differently**: query phrasings that only a UK buyer uses,
attached to stock we can sell.

### 9. `/shop/sofas` is the single best striking-distance page on the site

12 UK impressions at average position 37.6 in fifteen days. It is the only
commercial category page with repeat UK impressions. Getting one page from 37 to
the first page is a more realistic target than lifting forty pages a little.

### 10. Split the broadest categories into tightly-scoped sub-pages

A page called "Sofas" competes with DFS. A page called "Velvet Sofa Beds" or
"Chenille 3-Seater Sofas" competes with far fewer, and the stock already exists
to fill both. Six to ten of these, built from stock we hold, on the categories
with real UK impressions: sofas, coffee tables, wall clocks, mirrors, beds.

### 11. Point three existing guides at purchase intent rather than measurement

`coffee-table-size-guide` gets UK impressions at position 48. The measurement
question is answered; the buying question is not.

### 12. Write the UK into the pages that should be UK-only

Delivery terms, UK sizing conventions, £ pricing in the copy rather than only in
the price field. It will not reassign a global query, but it will help on the
mixed ones, and it costs nothing on pages being written anyway.

---

## Tier 3 — convert the clicks that already arrive

### 13. Category pages ship three quarters of a megabyte of HTML

`/shop/sofas` is **758 KB**, `/shop/coffee-tables` **723 KB** — of HTML, before
images. Time to first byte is fine (0.43–0.62s), so the server is not the
problem; the inlined payload is. On a phone on mobile data, that is the
largest-contentful-paint problem, and mobile is where furniture is searched.

### 14. There is not one review anywhere on the site

Google Customer Reviews is installed but only fires after an order, so it cannot
seed itself. A first-party review capability — even one review on one product —
changes a product page from a stranger's claim into a record.

### 15. Say who Kaiku is, above the fold, on product pages

Unknown brand, no reviews, no high-street presence. A visitor who has never
heard of the shop needs the delivery promise, the returns window and a sentence
about who is behind it, before the specification, not three scrolls below it.

### 16. Show the real dispatch window and the reason for it

Damien: _"i also dont have the money right now to even pay for them so i
overstate my shipping times."_ An unexplained long lead time on a £1,300 sofa
is a reason to leave. An explained one — made to order, shipped direct from the
maker — is a reason to trust. Same number, different outcome.

### 17. Arm the abandoned-basket email

Written, tested and previewable at `/admin/emails`. Resend has been live since
20 August, so arming it means real mail to real customers — which is why it is
waiting on Damien reading the copy rather than on anything technical.

### 18. Capture the visitor who will not buy today

An "ask about this piece" or "tell me when it ships faster" field on a product
page turns a bounce into an email address. At seven UK impressions a day, every
single visitor is worth keeping hold of.

---

## Tier 4 — the compounding work

### 19. Send the outreach pack

`docs/link-outreach.md` and `docs/press-pitch.md` are written and have not been
sent to anyone. The 347 discovered-not-indexed URLs are a domain-authority
symptom, and external links are the only real treatment. This is the highest
long-term item on the page and it needs a person, not code.

### 20. Link the tool pages into the commercial pages harder

The tools do earn traffic, even if it is the wrong nationality. Fourteen carry a
category rail already; the internal link from a tool to the category it serves
is free authority flow to exactly the pages in Tier 2.

### 21. Fix 96 thin product descriptions

Under two sections of copy. Thin pages are the textbook cause of "Crawled —
currently not indexed", and these can be written from dimensions, materials and
colour that are already stored, without inventing anything.

### 22. Fill 159 missing spec tables and 13 missing dimension sets

Specifications are what Google matches a product query against, and the compare
page reads them too. Where the data is not held it cannot be invented — but it
can be asked of the supplier once the trade emails exist.

### 23. Operational: the first sale must be fulfillable

**854 of 908 products cannot currently be ordered** — only D.I. Designs has a
trade email on record. Migration `0005` has not been run, so orders are still
labelled by UUID. Neither is an SEO item; both stop a first sale from becoming a
second one.

### 24. Rotate the Sanity write token

It was pasted into a chat in plaintext. It still authenticates, which makes it
worse rather than better.

---

## Honest expectations

- **Ten clicks a day is achievable, and Shopping is the route.** 908 products in
  a working feed, in front of UK buyers, is the only thing on this list capable
  of producing hundreds of UK impressions a day inside a month. Tier 1 is
  therefore not "first among equals" — it is the plan, and the rest supports it.
- **Organic blue links will not get there this quarter.** Position 37 to
  position 8 on a nine-month-old domain with no external links takes longer than
  that, and saying otherwise would be the fourth time on this project that a
  ranking claim did not survive contact with a real search.
- **The first sale may well not come from search at all.** It may come from
  eBay, from one hand-written email to somebody who abandoned a basket, or from
  one local press mention. The site being ready matters either way — but the
  first sale and 10 organic clicks a day are two different projects, and the
  first one is closer.
