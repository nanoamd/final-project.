# First sale in eight weeks

Written 12 August 2026. Target: one completed, paid, delivered order by mid-October.

## The uncomfortable part first

**SEO will not deliver this.** Not because the work is wrong, but because of the
clock: 63 pages are not indexed, the domain has no trading history, and even a
perfect page takes two to eight weeks to be crawled and settle into a position.
Organic is what makes month four onwards work. It is not what makes October work.

So the first sale comes from a channel that already has buyers in it.

## Four blockers, and nothing else matters until they are gone

Every one of these makes a sale **impossible**, not unlikely.

| #   | Blocker                                                                           | Why it is fatal                                                                          | Whose job                                                  |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | **The site is not deployed.** 143 commits sit on a branch; `main` is from 17 July | The live site is a month old. None of the mobile, routing or category work is on it      | Merge to main                                              |
| 2   | **Stripe is on `pk_test_`**                                                       | No card can be charged. At any traffic level, the answer is zero                         | Damien — live keys in Vercel                               |
| 3   | **`RESEND_API_KEY` unset**                                                        | A buyer pays and receives nothing. The order confirmation exists in code and cannot send | Damien — Resend account, verify kaikuhome.com, set the key |
| 4   | **No real test purchase**                                                         | Nobody has ever proved payment → webhook → order record → email works end to end         | Buy something, then refund it                              |

Number 4 is not box-ticking. The webhook, the Supabase write and the email are all
untested against a real card. Finding out from a customer is the expensive way.

## The channel decision

Ranked by how likely each is to produce a first sale inside eight weeks.

### 1. Sell the cheap things first — highest probability, lowest cost

The catalogue opens at **£6.95** (10ml essential oil), **£17.50** (50ml), **£40**
(wooden storage tub), **£49** (crate set), **£65** (plant stands).

These are impulse prices. A £6.95 sale is a real sale: it proves checkout, fires the
first confirmation email, and earns the first review — and the absence of reviews is
the single biggest reason a stranger will not spend £409 on a coffee table from a
domain they have never heard of.

Nobody's first order from an unknown shop is a £1,095 sofa. Stop optimising for that
sale and win the small one.

### 2. A second marketplace — fastest route to a stranger's money

The Reclaimed Collection (20 products, £40–£850, one-of-a-kind reclaimed teak) is
exactly what sells on **Etsy**, and eBay works for the same stock. Both already have
buyers with their card out; neither requires ranking for anything.

This is not a retreat from building the brand. It is a way to have revenue,
photography feedback and reviews while the brand's own SEO matures. The reviews are
transferable social proof; the listing fees are the cost of learning what converts.

### 3. Google Shopping — the best paid option, with real caveats

Merchant Center is already configured and the feed is built (currently gated off).
Shopping ads put products in front of people already searching to buy.

Honest arithmetic: furniture CPCs run roughly £0.40–£1.50. **£300** buys around
300–500 clicks. A new brand with no reviews converts at perhaps 0.3–1%, so expect
**1–5 orders** — genuinely uncertain, and possibly zero.

What it definitely buys is data: which products get clicked, what search terms people
actually use, and where they abandon. That is worth the £300 even if the orders do
not come, because it tells the SEO work what to target instead of guessing.

Do not run Performance Max first. Run **standard Shopping** on the furniture, so the
search terms are visible instead of hidden inside an automated campaign.

### 4. Local — affluent catchment, zero cost

Bourne End, Marlow, Beaconsfield and Gerrards Cross are wealthy areas. Facebook
Marketplace and local groups will move a £409 coffee table or a £350 shelf unit,
collected or delivered by hand. No shipping cost, no supplier carriage, full margin,
immediate cash.

Least glamorous, and possibly the first sale.

### 5. Pinterest — free, slow, worth starting anyway

Interiors and garden design are Pinterest's core subject matter, and pins have a very
long tail. It will not produce October's sale reliably, but it costs nothing and
compounds. Start it now so it is working by month four.

### What will not produce the first sale

- **Saunas.** £5,279, a 12-month consideration cycle, and nobody buys one from a
  brand with no reviews. Right product, wrong timescale.
- **Organic search.** For the reasons at the top.
- **The blog.** Informational readers convert at approximately zero. Buying guides
  come later, to catch demand that already exists.

## Week by week

**Week 1 — unblock**
Merge to main and confirm the deploy. Stripe live keys. Resend account, domain
verified, key set. One real purchase of a £6.95 oil with a real card, then refund it.
Confirm the confirmation email arrives and the order appears in the admin.

**Week 2 — list where buyers already are**
Etsy shop with 10–15 Reclaimed Collection pieces. Own photography where the supplier's
is thin. Price to include postage.

**Week 3 — turn on Shopping**
Standard Shopping campaign, furniture only, £10/day. Submit the Merchant feed as a
daily scheduled fetch. Watch search terms, not conversions, for the first fortnight.

**Week 4 — local**
Three or four Marketplace listings on the pieces that are cheap to move. Say Kaiku in
the listing; a local buyer who likes the piece looks the shop up.

**Weeks 5–8 — compound whatever moved**
Whichever channel produced a click, do more of it. Ask every buyer for a review, by
name, in a personal email. Two reviews change the conversion rate on every other page
more than any design change will.

## What "achieved" looks like

One order. Any channel. Any value. It proves the machine works end to end, gives the
first review, and converts an argument about whether this can work into a fact.

Not: 500 daily visitors. That is a different goal on a different clock, and chasing it
in September is what would cause October to have no sale in it.

## Probability, stated plainly

- Blockers cleared, low-ticket items promoted, Etsy live, £300 on Shopping:
  **roughly 60–75%** of a first sale inside eight weeks.
- Blockers cleared, organic only, no paid, no marketplace: **roughly 20–30%**.
- Blockers not cleared: **zero**. Not unlikely — impossible.

The difference between those first two lines is not the website. It is whether the
products are put in front of people who are already shopping.
