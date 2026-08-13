# Ankorstore — what to buy, and how to list it

13 August 2026. Written the day the Ankorstore account was approved.

---

## Read this first: Ankorstore is wholesale, not dropshipping

This changes how you use it. You **buy the stock, hold it, and ship it yourself**,
and each brand sets its own minimum first order. That has one big consequence for
how to spend:

**Buy deep from few brands, not one product from many.** Eleven empty categories
filled from eleven different brands means eleven separate minimum orders. Two or
three brands that each cover several categories is the same shelf space for a
fraction of the outlay.

Check the minimum on each brand's own page before adding anything to a basket —
they vary, and they are the number that decides what this costs.

You will also need somewhere to put it, and a way to post it. That is a real
change from the dropship model, and it is worth being clear-eyed about before the
first order rather than after.

---

## The gap in the catalogue is the cheap end, not the empty categories

The numbers, from the live catalogue:

| Band      | Products     |
| --------- | ------------ |
| Under £50 | **6** of 88  |
| £50–£150  | **4** of 88  |
| £150+     | **78** of 88 |

Median price **£545**. The cheapest thing Kaiku sells is £6.95 and the next rung
up is a long way above it.

**Nobody's first order from a shop they have never heard of is a £545 chest of
drawers.** `docs/first-sale-plan.md` reached the same conclusion from the other
direction. So the most valuable thing Ankorstore can do is not "fill categories" —
it is give the site **an entry price point**, £15 to £120, that a stranger will
risk on a brand with no reviews.

That is also what unlocks the premium suppliers who are ignoring the emails: they
want trading history, and trading history comes from cheap orders first.

So the buying rule is: **£15–£120, and it must genuinely belong in one of the
eleven empty categories.** Anything above £150 is a category Kaiku already
competes in.

---

## Priority order

Ranked by how much each purchase unblocks. Ankorstore's lighting and homeware
ranges are the deepest, which happens to match the biggest gaps.

1. **Bathroom accessories + towel rails** (2 categories, one brand). Soap dishes,
   trays, hooks, rails. Naturally £15–£60, which is exactly the band the site
   lacks. One bathroom-homeware brand covers both categories and probably clears
   its minimum in a single order.
2. **Kitchen lighting** (1 category, and the one that currently cannot be filled
   honestly). Kitchens are lit from above, so this needs **pendants** — the reason
   the cross-listing script refused to put your table lamps here.
3. **Rugs** (1 category). Runners and small rugs stay under £120; large ones will
   not, and they are expensive to post.
4. **Garden lighting** (1 category). Solar lanterns and festoon strings, £20–£80.
   This is what the deleted Aosom range used to hold.
5. **Bathroom lighting** — only if the fitting states an **IP rating** (IP44 or
   above for most bathroom zones). No rating, do not buy it for this category. This
   is a safety matter, not a merchandising one, and it is why the cross-listing
   script left the category empty rather than filling it with a table lamp.

Leave for later, because Ankorstore is the wrong shape for them: **fire pits,
privacy screens, kitchen furniture** — heavy, bulky, expensive to hold and to
post. These want a UK dropship supplier or a direct trade account.

**Pergolas: untouched, per your standing instruction.**

---

## Before you add anything to a basket — check the photographs

The audit standard, from `scripts/audit-images.ts`: **1200px on the long edge is
the minimum**, and anything under that is unusable. Two Hampton images in the
current catalogue are 146×146 and still need re-uploading.

A supplier whose photography is 800×800 will look soft on a phone and there is no
fixing it afterwards. Ankorstore brand pages show the images at usable size — if
they look soft there, they are soft.

Three questions, in this order:

1. **Is there a clean product shot on a plain background?** It becomes the tile
   image on every grid. Without one the product cannot be merchandised.
2. **Is the long edge 1200px or more?**
3. **Is there a second, different angle?** The card hover swap needs one, and a
   single-photograph product converts worse.

---

## Listing it — the importer already exists

Do **not** type these into Studio one at a time. `scripts/import-supplier-products.ts`
reads pages you have saved from your own logged-in browser, via the JSON-LD
structured data almost every platform emits. No scraping, nothing that touches bot
protection.

1. On each Ankorstore product page: **File → Save Page As**, into one folder — say
   `~/ankorstore-lighting/`.
2. Dry run, which writes nothing and prints exactly what it would create:
   ```
   pnpm tsx --env-file=.env.local scripts/import-supplier-products.ts \
     --html ~/ankorstore-lighting --category kitchen-lighting
   ```
3. Read the output, then re-run with `--apply`. Everything lands as a **draft**.

Then, per product, in Studio:

4. **Set your price.** The importer never writes one — prices are yours, and the
   schema requires a positive price, so a draft stays invalid until you set it.
   That is the guard that makes publishing without a price impossible.
5. **Write the description yourself.** The validator in
   `scripts/lib/product-copy.ts` refuses banned phrases and duplicated FAQ
   answers, so pasted supplier wording will not pass.
6. **Record the brand as the supplier, and the Ankorstore product URL as
   `sourceUrl`.** Each Ankorstore brand is its own supplier — create a supplier
   document per brand, not one called "Ankorstore". Three `sourceUrl`s have already
   had to be corrected, two of which pointed at a basket page.
7. **Publish.** The category leaves the empty list and enters the sitemap on its
   own, because the sitemap filters on product count.

---

## Keep the positioning intact

Stated once, because this is the one way cheap stock can do damage. Marketplace
homeware appears on hundreds of sites, and used carelessly it undoes the premium
position that is the whole point of Kaiku.

- Fill the **empty** categories. Do not pad the ones that already work.
- Keep the **homepage and the New & Noteworthy rail** on D.I. Designs and
  SaunaPlunge.
- Every description written from scratch. The rule has not changed.
