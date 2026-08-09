# Definition of complete

Damien's own four criteria, recorded 9 August 2026 so they survive a lost
conversation. Every "now" figure below was measured on that date, not estimated —
the commands are named so any of it can be re-run.

| #   | Criterion                                  | Now                                     | Target       |
| --- | ------------------------------------------ | --------------------------------------- | ------------ |
| 1   | Interactive tools                          | **5**                                   | 50           |
| 2   | One blog post per product, at 300 products | **1 post, 1 buying guide**, 45 products | 300 posts    |
| 3   | Shop by aesthetic                          | **query layer built, no UI**            | live         |
| 4   | Organic traffic                            | **~0** (GA4 installed 9 Aug)            | hundreds/day |

The five tools built: `cold-plunge-size-calculator`, `contrast-therapy-planner`,
`garden-furniture-material-selector`, `garden-visualiser`,
`sauna-size-calculator`.

Re-measure with:

```
ls -d "src/app/(site)/tools/"*/ | wc -l
pnpm tsx --env-file=.env.local scripts/audit-products.ts
```

---

## Criterion 4 is not a build task

Items 1–3 are work with a duration. "Hundreds of views daily" is an outcome that
depends on Google, and it sets the real timeline:

- Hundreds daily is 3,000–9,000 sessions a month. For home and garden that means
  **50–150 pages ranking on page one**.
- Google generally takes **3–6 months** before it trusts a new commercial domain
  enough to rank it for anything worth having. kaikuhome.com currently has 45
  products, one post and no backlinks.
- So the floor is roughly **6–12 months from when the content actually lands**,
  and finishing items 1–3 early does not move it much.

Being at 20 views a day two months after launch is normal, not failure. The
metric that matters before rankings arrive is whether individual pages get
_impressions_ in Search Console — that is the leading indicator, and it moves
weeks before traffic does.

---

## Criterion 2: what decides whether 300 posts help or hurt

A post per product is a pattern that usually fails on ecommerce, for one specific
and fixable reason: **keyword cannibalisation**. If the post and the product page
both target "Abberley brown coffee table", they compete with each other, Google
picks one — usually neither ranks well — and the post adds nothing.

It works only when each post targets a query the product page cannot:

| Page                             | Query it should own                                        |
| -------------------------------- | ---------------------------------------------------------- |
| `/shop/coffee-tables/abberley-…` | "abberley brown coffee table", "brown glass coffee table"  |
| The post                         | "how to style a glass coffee table in a small living room" |

That distinction is also what separates a content library from what Google's
**scaled content abuse** policy targets. The policy does not care whether a human
or a machine wrote the page; it asks whether pages exist mainly to rank rather
than to help.

### Calibrating the risk

300 posts for 300 products is **not itself a violation** — neither the count nor
the ratio is a trigger, and plenty of legitimate retailers carry more content
pages than products. What is judged is whether each page stands up on its own. So
the realistic outcomes of getting it wrong, in order of likelihood:

| Outcome                  | Likelihood      | What it looks like                                                                                                              |
| ------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Posts simply never index | **Most likely** | "Crawled – currently not indexed" in Search Console. No penalty; the hours are just gone                                        |
| Algorithmic suppression  | **Real risk**   | No warning and no message. Site-wide quality signals fall, so the _good_ pages rank worse                                       |
| Manual action            | Uncommon        | Shows in Search Console as "Thin content with little or no added value". Reversible after cleanup and a reconsideration request |
| Whole site deindexed     | **Rare**        | Egregious cases — thousands of auto-generated pages, doorway networks                                                           |

The cost of getting this wrong is therefore **600 hours of pages Google ignores**,
with a real secondary risk of dragging down the pages that matter. It is not
losing the site. Worth stating plainly, because "risks suppression" reads as
"risks a ban", and planning around the wrong one leads to the wrong decision.

**So: 300 posts is achievable and safe, on three conditions.**

1. Every post is pegged to a distinct informational query, decided before it is
   written. No post ships without one.
2. Every post passes one test: would someone who is not buying anything get
   something out of reading it? If it is the product description reworded, it is
   thin whether there are 5 or 300.
3. Publishing is paced. A young domain that goes from 1 post to 300 in a few
   weeks looks like what it looks like.

### Test it at 30 posts, not 300

Publish the first 20–30, then read Search Console's indexing report.

- Mostly "Crawled – currently not indexed" → the model is not working. Change
  approach after ~40 hours rather than ~600.
- Indexed and collecting impressions → it works, scale it.

Impressions move weeks before traffic does, so this is readable long before any
of it shows up in GA4.

### What that costs

| Item                                                        | Estimate                                           |
| ----------------------------------------------------------- | -------------------------------------------------- |
| Per post: keyword research, writing, internal links, images | **~2 hours** done properly                         |
| 300 posts                                                   | **~600 hours**                                     |
| Safe cadence, young domain                                  | 3–5/week at first, 8–10/week once authority builds |
| Wall clock at that cadence                                  | **9–18 months**                                    |

The blog is therefore the single largest item in the definition — larger than the
45 remaining tools, and larger than the catalogue.

---

## Estimates for the rest

| Item                                               | Effort        |
| -------------------------------------------------- | ------------- |
| Shop by aesthetic (clean taxonomy, build routes)   | **2–3 days**  |
| 45 more tools, at 2–4 h each done properly         | **3–4 weeks** |
| Order confirmation email + owner alert (see below) | **~4 hours**  |
| Highlights for the 22 products missing them        | **~3 hours**  |
| GA4 `purchase` event                               | **~1 hour**   |

### Shop by aesthetic is closer than it looks

`styleTags` is already on the product schema, and
`src/lib/sanity/queries/product.ts` already carries both the filter-by-tag query
and the list-available-tags query. Nothing surfaces them — that is the whole gap.

The taxonomy needs cleaning first. The 25 values in use mix real aesthetics
(Scandinavian, Minimalist, Contemporary, Vintage & Reclaimed) with product types
(Coffee Table, TV Stand, Shelving, Console Table), colours (Oak, Ivory, White,
Brown Finish) and one `null`. Reduce to 6–8 aesthetics before building the routes,
or the filter is unusable on day one.

---

## Sequencing: the thing most likely to go wrong

Building 50 tools and 300 posts against a 45-product catalogue produces a large
thin site with no commercial depth, which suppresses rankings rather than earning
them. Tools would outnumber products.

**150 products across filled categories with 15 tools will out-rank 45 products
with 50 tools.** Twelve supplier applications are outstanding (see
`supplier-pipeline.md`); the catalogue is the constraint, so it goes first.

Tools should also be chosen by search demand rather than counted to 50. A
calculator nobody searches for earns nothing however well it is built.

---

## Realistic timeline

| Milestone                                          | When               |
| -------------------------------------------------- | ------------------ |
| Can take a real order correctly                    | **2–3 days**       |
| Items 1–3 built (tools, aesthetic, guides started) | **~6 weeks**       |
| 300 products listed                                | gated on suppliers |
| 300 posts published at a safe cadence              | **9–18 months**    |
| Hundreds of views daily                            | **12–18 months**   |

Complete-as-built is about six weeks. **Complete-as-defined is 12–18 months**,
and the gap is Google's patience and supplier replies, not our throughput.

---

## Still blocking a first sale

These are unchanged from `supplier-pipeline.md` and none of them is a code
problem except the first:

- [ ] **No order confirmation email exists.** `sendEmail` is wired only to the
      newsletter and the contact form. A paying customer gets the success page and
      whatever Stripe sends; **nothing tells Damien a sale happened**, which
      matters when fulfilment means placing a trade order by hand
- [ ] Stripe live keys — still `pk_test_`
- [ ] `RESEND_API_KEY` unset, and the sending domain needs verifying (DNS wait)
- [ ] Confirm the four `supabase/migrations/` files have run against the live
      project. `orders` and `order_events` are defined in `0001` and `0003`; that
      they exist in production is unverified
- [ ] Rotate the Sanity write token
- [ ] Five nav destinations are `ComingSoon` placeholders — `inspiration`,
      `guided-buying`, `compare`, `quote`, `faq`. Correctly noindexed, so they
      cost nothing in search, but they go nowhere for a visitor
