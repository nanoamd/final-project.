# Kaiku catalogue quality audit

**20 August 2026. 1,472 products scored — 237 published, 1,235 drafts. Nothing
has been rewritten.** This is the findings pass you asked for before any
execution.

The scoring is not a one-off script. It is `src/lib/catalog/quality.ts` (26
tests), it runs live at **`/admin/products`**, and it can be re-run against new
products tomorrow without redoing any of this work.

---

## 1. The headline

Product drift is real, it is measurable, and **it has a date**.

| When written      | Published | Failing (REVIEW) | Median score | Median words | Facts per 100 words |
| ----------------- | --------: | ---------------: | -----------: | -----------: | ------------------: |
| **Before 13 Aug** |        88 |     **2 (2.3%)** |      **9.0** |          717 |            **0.70** |
| **13–16 Aug**     |       148 |   **35 (23.6%)** |          7.8 |    **1,150** |            **0.20** |

**The failure rate went up tenfold, and the descriptions got 60% longer while
carrying a third of the facts.** That is the whole story of the drift in one
line: the later products are not shorter or lazier-looking. They are _longer_.
Length was used as a substitute for knowing anything about the product.

Current standing, published catalogue:

- **GOLD 24 · SILVER 176 · REVIEW 37**
- Grades: A 126 · B 74 · C 35 · D 2 · E 0

And behind it, the real backlog: **674 drafts have no description at all**, 691
of them Premier Housewares.

---

## 2. What "quality" is measured as

Ten dimensions, as briefed. The one that decides everything is **specificity**,
measured as _facts per hundred words_ — a fact being a number carrying a unit
(90cm, 9kW, 1.5mm, 6-person, 3-tier).

This measure was chosen because it is the only one that separates the good early
products from the bad later ones. Word count does the opposite: it ranks the
worst products highest. Every other plausible signal — heading style, paragraph
count, vocabulary — turned out to be noise.

> **A correction to my own first attempt.** I initially assumed bespoke-sounding
> headings marked the good products. They don't. "Effortless Placement in Any
> Room" is a bespoke-_sounding_ heading on a page that says nothing. I threw
> that signal away and rebuilt on fact density, which survives inspection.

Median scores across the published catalogue:

| Dimension       |  Median |               |
| --------------- | ------: | ------------- |
| Accuracy        |    10.0 |               |
| Usefulness      |    10.0 |               |
| Human quality   |    10.0 |               |
| Brand fit       |    10.0 |               |
| **Specificity** | **1.5** | ← the problem |
| SEO             |    10.0 |               |
| Commercial      |    10.0 |               |
| Return risk     |    10.0 |               |
| Readability     |    10.0 |               |
| AI-pattern risk |     8.1 |               |

Nine dimensions are healthy. One is on the floor. That is a much better position
than "the catalogue is bad" — the structure, the commerce data and the SEO
plumbing are sound, and the writing has one specific, fixable disease.

---

## 3. The Kaiku Gold Standard

The benchmark, taken from the highest-scoring published products. These are **not
to be rewritten** unless something in them is factually wrong.

| Score | Words | Facts/100w | Product                                           |
| ----: | ----: | ---------: | ------------------------------------------------- |
|   9.7 |   563 |       1.80 | Himalayan Salt BBQ Cooking Plate \| 30 x 20 x 5cm |
|   9.7 |   354 |       1.40 | 4 Drawer Recycled Wood Storage Chest              |
|   9.7 |   528 |       1.50 | Bentley Coffee Table in Oak                       |
|   9.6 |   823 |       2.10 | SaunaPlunge™ Peak Plunge Ice Bath with Chiller    |
|   9.6 |   340 |       2.10 | Natural Teak Corner Shelf Unit – 3 Tier 90cm      |
|   9.6 |   378 |       2.10 | Set of 3 Gamal Wood Plant Stands                  |
|   9.5 |   319 |       1.60 | Natural Teak Log Shelf Display – 3 Tier 100cm     |

**What they have in common — this is the standard to restore:**

1. **Between 320 and 830 words.** Not one of the best products is over 1,100.
2. **1.4 to 2.1 facts per hundred words.** A measurement, a material weight, a
   capacity or a tolerance roughly every other sentence.
3. **They answer the question the buyer actually has.** The teak shelf says each
   tier holds 8kg. The Peak Plunge says 1.5mm stainless and down to 3°C.
4. **They state limitations.** The teak listing says it greys outdoors within 12
   months unless re-oiled. That sentence prevents a return.
5. **The title carries the spec** — "30 x 20 x 5cm" is in the Himalayan salt
   plate's name, so search and shopper both get it before the click.

**What they are _not_:** they are not free of florid phrasing. The Peak Plunge
opens with "Transform your recovery routine". I am telling you this rather than
presenting the benchmark as flawless — the early products win on _substance_, not
on prose hygiene, and the filler should come out of them too.

---

## 4. The drift, precisely

### The worst of it — all 13–16 August

| Score | Words | Facts | Product                                          |
| ----: | ----: | ----: | ------------------------------------------------ |
|   6.1 | 1,105 |  0.10 | Glass Candle Holder                              |
|   6.1 | 1,091 |  0.10 | Blue Agapanthus Plant In Pot                     |
|   6.2 | 1,304 |  0.10 | Set Of Three Wooden Lanterns With Archway Design |
|   6.3 | 1,231 |  0.10 | Large Conical Ceramic Lattice Hurricane Lantern  |
|   6.4 | 1,495 |  0.10 | Large Grey Stone Effect Hurricane Lantern        |

The Glass Candle Holder is the archetype. **1,105 words that never state its
height, its diameter, the candle size it takes, or whether it can go outside.**
It has three headings — "Sophisticated Design for Every Occasion", "Effortless
Placement in Any Room", "Easy to Care For and Maintain" — and an FAQ whose answer
reads _"Dimensions are not specified for this product."_

That FAQ is the clearest evidence of what went wrong: the generator knew it was
missing the fact, and wrote a paragraph anyway.

### Concentrated in décor, not furniture

REVIEW-tier published products by category:

```
  9  Candles & Lanterns      2  Side Tables
  9  Vases                   2  Mirrors
  7  Wall Clocks             2  Shelving
  4  Wall Art                1  Planters · 1 Water Features
```

**29 of the 37 failures are small decorative items.** Furniture and wellness
largely held their standard. This makes sense and it makes the fix cheaper: a
coffee table has obvious facts to state, whereas nobody pushed to find out what a
vase actually measures — so the copy filled the space with mood instead.

### What specifically changed, early vs late

|                     | Before 13 Aug                                                                  | 13–16 Aug                                                                          |
| ------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Length              | ~717 words                                                                     | ~1,150 words                                                                       |
| Facts per 100 words | 0.70                                                                           | 0.20                                                                               |
| Headings            | Product-aware — "Bulb Requirements", "Fitting and Wiring", "Burn Time and Wax" | Generic — "Features", "Specifications", "Care & Maintenance"                       |
| Missing information | Named as missing                                                               | Papered over with prose                                                            |
| Filler phrases      | Present but sparse                                                             | "effortlessly", "seamlessly", "perfect for", "whether you" in nearly every product |

For scale: **"perfect for" appears in 617 documents, "seamlessly" in 536,
"whether you" in 479.**

---

## 5. Everything else the audit turned up

Counted across published products.

|  Count | Finding                                           | Note                              |
| -----: | ------------------------------------------------- | --------------------------------- |
| **93** | Length standing in for substance                  | >900 words, <0.5 facts/100w       |
| **83** | Only one concrete fact in the whole description   |                                   |
| **40** | **Supplier name or link left in the description** |                                   |
| **36** | No supplier SKU                                   | cannot be ordered or feed-matched |
| **17** | **Title missing `\| Kaiku`**                      |                                   |
|     16 | Every heading is a generic template heading       |                                   |
|     16 | Meta description over 160 characters              | Google truncates                  |
|     10 | No carriage cost — margin is optimistic           |                                   |
|      7 | No dimensions recorded                            |                                   |
|      4 | FAQs that answer nothing                          |                                   |

### Two corrections to your expectations

**The supplier leaks are not D.I. Designs.** You said "you will see this a lot
for di designs". All 40 are **Hill Interiors** — D.I. Designs has zero. Examples:
Echo French Grey Chair, Alto Putty Grey Outdoor Table, Provence Collection
Outdoor Dining Chair.

**D.I. Designs is the best-scoring supplier in the catalogue**, not the worst:

| Supplier           | Published | Median score | GOLD | REVIEW |
| ------------------ | --------: | -----------: | ---: | -----: |
| D.I. Designs       |        54 |      **9.0** |   16 |      2 |
| SaunaPlunge        |         8 |      **9.0** |    0 |      0 |
| AW Dropship        |        38 |          8.8 |    1 |      1 |
| **Hill Interiors** |   **136** |      **7.9** |    7 | **34** |

**34 of the 37 failures are Hill Interiors**, and so are all 40 supplier leaks
and 16 of the 17 unwritten-draft leftovers. The drift is very close to being a
Hill-Interiors-shaped problem.

### The 17 titles missing the suffix

Includes one outright bug: **"White Beaded Ceramic Table Lamp with Linen Shade |
Kaiku Tagline"** — a template placeholder written into a live product title. The
rest are the Soft Squiggly mirrors, the Tabletop Water Features, the Himalayan
Salt plates and three furniture pieces.

---

## 6. What I recommend, in order

Costed against a 24-hour window.

### Tier 1 — mechanical, safe, no judgement required (~1 hour)

Scripted, reviewable as a diff, no writing involved.

1. **Strip the 40 supplier references** from Hill Interiors descriptions.
2. **Fix the 17 titles**, including the "Kaiku Tagline" bug.
3. **Delete the 4 FAQs that answer nothing.** An absent FAQ beats one that says
   "not specified".
4. **Trim the 16 over-long meta descriptions.**

### Tier 2 — the actual rewrite (the real work)

**37 REVIEW products first, then the 93 padded ones.** Not all 237 — the 24 GOLD
and most of the 176 SILVER should be left alone, per your Step 5.

The method matters more than the volume:

- **Get the facts first, write second.** Every one of these products has a
  `sourceUrl`, so the dimensions exist and simply were not fetched. Where a fact
  genuinely cannot be verified, **it gets flagged, not invented** — that is what
  produced the "not specified" FAQ in the first place.
- **Target 350–650 words**, matching the benchmark. Most of these will get
  _shorter_ by half. That is the point.
- **Vary the structure deliberately.** A vase, a wall clock and a lantern must
  not share a heading set.

### Tier 3 — the 674 unwritten drafts

**691 Premier Housewares drafts have no copy and no prices.** They are not a
quality problem; they are an unstarted one. My recommendation is **do not bulk-
generate them.** That is precisely the process that produced the 13–16 August
cohort. Take the Cassini vanity-mirror range first as a contained block, write it
properly, and measure it against the benchmark before opening the tap.

---

## 7. What I need from you before executing

Three things, all quick:

1. **Confirm the 350–650 word target.** It means deliberately deleting roughly
   half the words on ~130 products. I think that is right; it is your call.
2. **Confirm I should shorten rather than pad.** Some of these pages will lose
   700 words and gain five measurements.
3. **The `| Kaiku` suffix in the on-page `<h1>`** — still open from the earlier
   ledger, still one line either way.

I have **not** rewritten anything. On your word I will start with Tier 1, which
is mechanical and reversible, and bring you the first ten Tier 2 rewrites to
check tone before touching the remaining 120.

---

## 8. How to re-run this tomorrow

Both routes use the same engine, so they cannot disagree.

- **Live:** `/admin/products` — filter by tier, supplier, published/draft, or
  the unwritten backlog. Click any row for its ten scores and every finding.
- **Written report:** `pnpm tsx --env-file=.env.local scripts/audit-product-quality.ts`

New products written tomorrow are scored automatically the moment they exist. No
part of this audit has to be repeated by hand.
