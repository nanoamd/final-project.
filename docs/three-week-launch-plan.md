# Three weeks to launch

14 August → 4 September 2026. Asked for: _"in 3 weeks i want the website done and
ready (blogs, products, guides, ai tool needs to be finished and actually working as it
should because right now its really bad). this needs to include literally everything we
need to do to get our first sale on launch."_

Budget: **£100 now**, £200–300 on the 28th.

---

## The one number that decides this plan

Search Console, today: **6 pages indexed.** Not 6 pages with problems — 6 pages that
Google will serve at all, out of 152 live URLs.

| Why pages aren't indexed                  | Pages |
| ----------------------------------------- | ----- |
| Discovered – currently not indexed        | 44    |
| Page with redirect                        | 11    |
| Not found (404)                           | 2     |
| Alternative page with proper canonical    | 2     |
| Duplicate without user-selected canonical | 1     |
| Crawled – currently not indexed           | 1     |

**It is not a technical fault.** I fetched all 152 sitemap URLs from the live site an
hour ago: **151 return HTTP 200 and not one carries a `noindex`** (the 152nd timed out
on a cold start and answers fine on retry). The redirects are the non-`www` variants and
the seven retired product URLs, which is correct behaviour.

So this is crawl trust on a four-month-old domain, and the two things that cause it were
only fixed 48 hours ago: nothing linked to most pages (10 orphan categories, 96 products
with no editorial link) and the sitemap carried no `lastmod`. Google has not had time to
react.

**What that means for three weeks:** organic search cannot deliver the first sale in this
window, because 6 indexed pages cannot rank for anything. The first sale has to come from
Shopping listings and paid, and the indexing work runs underneath it for September.
Plan accordingly — that is what the weeks below do.

---

## The AI tool — what is actually wrong with it

You are right that it is bad, and the cause is specific rather than general.

**It never sends the product photo.** `buildPrompt()` in
`src/server/actions/garden-visualiser.ts` sends the model a text list of product _names_
— "Reclaimed Teak Dining Table 180cm" — alongside the customer's garden photo, and
nothing else. So the model invents a plausible teak table from the words. It cannot show
your table, because it has never seen it.

That is why the output feels wrong: a shopper is looking at a garden containing furniture
they cannot buy, with a "buy this" card attached to it.

Three more faults, in order of how much they hurt:

1. **The output is forced to a 1024×1024 square** while a phone photo of a garden is
   4:3 or 16:9, so the customer's own garden comes back cropped and stretched.
2. **The hotspots are guessed by a vision model.** `locateHotspots()` asks
   `gpt-4o-mini` for x/y percentages. Vision models are poor at precise localisation, so
   the tap-to-buy cards land on a fence panel, or vanish entirely because the model could
   not find the product it was told about.
3. **`gpt-image-1-mini` at medium quality** is the weakest and cheapest option, chosen
   originally because higher settings took ~60 seconds and risked the serverless timeout.

**The fix, and it is a real one.** OpenAI's edits endpoint now accepts **multiple input
images** — verified in their current docs today — so the garden photo goes in as the base
and each product's own pack shot goes in as a reference. Same call, same endpoint. That
single change is the difference between "a table like that" and "that table".

Then: move to `gpt-image-2` (their docs state it processes every image input at high
fidelity automatically, so there is no fidelity setting left to get wrong), match the
output aspect to the photo rather than forcing square, and replace the guessed hotspots
with a product strip under the image that is always correct — with an overlay marker only
where the model is confident.

**Cost.** gpt-image-2 is billed per token, not per image: at $30 per million output
tokens, a 1024px medium render is roughly 3–10p depending on quality. The existing cap of
3 generations per visitor per week stays, and I will add a hard monthly ceiling so a bot
cannot spend the ad budget. You will need a paid OpenAI account with a **£15/month spend
limit set in their dashboard** — that is a real budget line, not an optional one.

---

## The limited company question

**Online incorporation with Companies House costs £100** today; £124 by post. (It was
£50 until the fees rose, so older advice online will understate it.)

But there is a fork before you spend anything:

- **If Project Kaiku Ltd is already registered**, the company number is free — look it up
  on the Companies House register, send it to me, and it goes in the footer in two
  minutes. That is the blocker I have been asking about.
- **If it is not registered**, then the site currently names a company that does not
  exist: `companyDetails.registeredName` is set to "Project Kaiku Ltd" and it is rendered
  in the footer. That has to be resolved one of two ways — incorporate for £100, or trade
  as a sole trader and I change the footer to your own name and address, which is
  perfectly legal and costs nothing.

**My recommendation: spend the £100 on incorporation rather than on ads.** Three reasons.
The site already claims it, and the claim has to be true. Merchant Centre and Stripe both
verify business details, and a mismatch there is exactly the kind of silent rejection
that has already cost you weeks with trade suppliers. And £100 of Shopping ads on a feed
with no click history and no analytics teaches you almost nothing — whereas the £200–300
on the 28th, spent on a feed that has been live for a fortnight, teaches you a lot.
Shopping **free** listings cost nothing and start the day the feed is approved.

---

## Week 1 — 14 to 21 August. Make it a shop.

Right now it is a catalogue. Nothing below matters until a card can be charged.

### Yours (about two hours, spread over the week)

1. **Stripe live keys.** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and
   `STRIPE_WEBHOOK_SECRET` from a live-mode webhook endpoint pointed at the site. The
   webhook is what writes the order record — without it a payment succeeds and no order
   exists.
2. **`RESEND_API_KEY` and `RESEND_FROM_EMAIL`**, with the sending domain verified in
   Resend (three DNS records). Free tier is 3,000 emails a month, which is ample.
3. **The GA4 measurement ID into Vercel.** You said the property is done — the tag is
   still not in the page, which means the ID has not reached
   `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel, or it was added without a redeploy.
   Creating the property and installing the tag are two separate jobs. **Do not tick
   Sensitive.**
4. **`MERCHANT_FEED_ENABLED=true`**, then create Merchant Centre, verify the site, add a
   daily fetch of `/api/feeds/google-merchant`, and opt in to free listings.
5. **The company decision** above.
6. **Check whether the Vercel plan allows commercial use.** Hobby does not. If the
   project is on Hobby it needs Pro at roughly £16–20 a month, and that is a cost the
   business has from launch day.

### Mine

- **Rebuild the AI tool** as described above. Biggest single job of the three weeks.
- **Google Shopping readiness pass** on all 99 published products: GTIN, brand, MPN,
  condition, availability, price, and the shipping and returns settings Merchant Centre
  wants in the account rather than on the site.
- **Structured data audit** — `Product`, `Offer`, `BreadcrumbList`, `FAQPage`. This is
  what earns the rich result that lifts click-through without lifting rank, and Merchant
  Centre reads it too.
- **Write the fulfilment procedure** (see below) — the piece that turns a website into a
  business.
- **Request indexing by hand** on the 10 highest-value URLs, and again each day the quota
  allows. On a young site this is the fastest indexing lever there is.

## Week 2 — 21 to 28 August. Fill it, and get found.

### Yours

1. **Prices.** 130 of the 151 drafts have no price, and prices are yours — I will not
   guess them. **Do not price all 130.** Price **40**, and pick them for two things:
   filling the 13 categories that currently hold nothing, and adding stock under £100.
   Your cheapest published products are essential oils at £6.95 and crates at £49; a
   first sale is far likelier at £40 than at £900, and one completed order teaches you
   more about the plumbing than fifty listings do.
2. **One real test order** on your own card, once Stripe is live. Refund it afterwards —
   it costs about 20p in fees. This is the only way to know that payment → webhook →
   order record → confirmation email actually works end to end.
3. **Pinterest business account** and domain verification, once I have the pack shots
   ready.

### Mine

- **Descriptions, summaries and FAQs for the 40 you price** — individually written, not
  from the supplier feed, and held to the same banned-phrase validator as the rest.
- **The image pass**, on your word: 62 lead images regraded to one white with a floor
  shadow, before/after sheets for you first.
- **Comparison pages** — indoor vs outdoor sauna, wood vs aluminium garden furniture,
  coffee table materials, chenille vs linen. Highest-converting content type in
  furniture, and it gives the last 26 unreferenced products an editorial link.
- **Category copy** for the 18 stocked categories that still have none.
- **IndexNow** for Bing and Yandex — instant submission on publish. Google does not use
  it; Bing is 5% of UK search and it is nearly free to add.

## Week 3 — 28 August to 4 September. Launch and spend.

By now: cards work, emails send, the feed is approved, the tool is good, and 140 products
are live.

### The money, on the 28th

| Spend                     | Amount  | Why                                                                                                                                                     |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Shopping, standard | £150    | £10/day for 15 days. Standard Shopping, not Performance Max — PMax hides where the money went, which is the one thing a first campaign has to teach you |
| Reserve                   | £50–100 | Vercel Pro, the OpenAI cap, and whatever the first week of real orders needs                                                                            |
| Meta and Pinterest ads    | £0      | Skip. Furniture needs creative and an audience to work there, and £50 buys neither. Pinterest organic is free and does the same job slower              |

**Not paid search.** Bidding on "oak coffee table" against Wayfair with £150 is buying
the most expensive clicks on the internet. Shopping puts your price next to theirs, which
is the argument you actually win.

### Mine, week 3

- Watch Merchant Centre diagnostics daily and clear disapprovals the same day — a first
  submission always comes back with some.
- Wire GA4 conversion events to the real checkout so the campaign has something to
  optimise towards.
- Add reviews to product pages once there are real orders to review. Not before: seeded
  ratings were removed from this site once already, and inventing them is both a policy
  breach at Merchant Centre and the fastest way to lose a customer's trust.
- Ask Hill Interiors and Ancient Wisdom for a stockist listing. Free, relevant, and it is
  the kind of external link that makes Google index the other 146 pages.

---

## The fulfilment procedure — the piece that is missing

A shop is not the website. When an order lands, this has to happen without you inventing
it on the spot, and it does not exist in writing yet. I will draft it this week:

1. Order confirmation email reaches you and the customer.
2. You place the order with the supplier — Hill Interiors trade account 127298, AW
   Dropship, D.I. Designs — with the SKU and the customer's delivery address.
3. Supplier confirms and gives a dispatch date. That date goes on the order record.
4. Tracking, when it exists, goes to the customer.
5. The customer's own delivery expectation matches the supplier's lead time, per product.
6. If it arrives damaged: 48 hours, photographs, Kaiku pays the return. If they change
   their mind: 14 days, they arrange and pay for the return, and you issue the address.

That last line is already what the returns page says. The rest needs writing down before
the first order, not during it.

---

## What "done in three weeks" means, honestly

**Done:**

- Payments, order records and confirmation emails working, proven by a real order
- ~140 products live, every one with its own description, FAQs, specifications and images
- One white and a floor shadow across every pack shot
- 15+ guides and comparison pages, each linking the products it names
- The AI visualiser showing the actual products, at the right aspect ratio, with buy
  cards that land in the right place
- Merchant Centre approved, free listings live, £150 of Shopping ads running
- Analytics recording every session, and conversion events on the checkout
- A written fulfilment procedure, and a real company number in the footer

**Not done, and I would rather say so now:**

- **All 151 drafts.** 40 done properly beats 130 half-finished, and 130 prices is not a
  reasonable ask of your evenings.
- **Organic search traffic.** 6 indexed pages today. Indexing takes weeks to move even
  when everything is right, and everything only became right two days ago. September and
  October are when that pays.
- **Reviews.** There is nothing honest to put there until customers exist.
- **A guaranteed first sale.** Nobody can promise that. What this plan does is make every
  part of the path work, put your prices in front of people who are already shopping, and
  measure it — so if three weeks pass without a sale, we will know exactly which step
  lost them instead of guessing.
