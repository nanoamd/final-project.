# Tomorrow morning: stock, carriage, prices

Written the night of the first organic sale. The order was for a canvas Hill had
none of until January 2027, and the replacement offered was also out of stock.
Both were listed In Stock because nothing had ever written that field.

Work down the list. Steps 1–3 make the shop honest. Steps 4–5 make it
profitable. Do not start 5 before 4 finishes, or you will reprice against
carriage figures that are wrong in both directions.

---

## 0. Before the shop takes another order

- [ ] Refund £81 in Stripe
- [ ] Take **Mistora** and **Silvra** hand-painted canvases off sale in Studio
- [ ] Send the apology/refund email to Jennifer
- [ ] Reply to Dot Turley — that enquiry is eleven days old
- [ ] Put `hello@kaikuhome.com` on your phone with notifications on

Steps 1–3 stop this recurring. Step 0 settles the two it already happened to.

---

## 1. Hill Interiors stock

Export the dropship CSV from Hill's trade portal **this morning** — the script
is only as fresh as the file, and container uploads do not survive a rebuild,
so pass the path rather than hoping last month's is still there.

```
pnpm tsx --env-file=.env.local scripts/sync-hill-stock.ts --feed=/path/to/HillInteriorsDropship.csv
```

Dry run. Read the two lists it prints:

- **"being sold that Hill cannot send"** — every product the shop is currently
  lying about. This is the Mistora list.
- **"not in the feed — left alone"** — these are _not_ out of stock, they are
  unknown. The script deliberately does not touch them. Check them by hand.

Then, when the lists look right:

```
pnpm tsx --env-file=.env.local scripts/sync-hill-stock.ts --feed=... --apply
```

140 products.

---

## 2. Premier Housewares stock — no export needed

Premier has no dropship CSV and does not need one. Its storefront is
BigCommerce and every product page carries the live figure without logging in.
Validated against fourteen live pages last night, including one genuinely out of
stock.

```
pnpm tsx --env-file=.env.local scripts/sync-premier-stock.ts
```

**This takes about an hour and a half.** Premier's `robots.txt` asks for a
10-second crawl delay and the script honours it. Start it, leave it, come back.
Use `--limit 20` first if you want to see the shape of the output in three
minutes.

Then `--apply` once the dry run reads right.

546 products, all of which currently claim In Stock on the strength of an
import default.

---

## 3. What the two scripts will not do

Neither marks anything **Backorder** or **Coming Soon**. Both feeds give a
number, not a restock date, and "Backorder" tells a shopper a date is known. Out
of Stock is the honest word for "we cannot send this today".

Neither touches a product it could not read. A failed fetch is not evidence of
anything, and flipping a line to Out of Stock on a 503 takes a sellable product
off the shop.

---

## 4. Carriage — the thing that has been wrong twice

`scripts/lib/hill-carriage.ts` (new last night) models the real rule and is
pinned against the two invoices you actually paid:

| Product           | kg   | Delivery Size | Hill charged ex VAT |
| ----------------- | ---- | ------------- | ------------------- |
| Contour sideboard | 15   | Large         | £49.99              |
| Sorelle sofa      | 39.9 | Large         | £59.99              |

The rule both previous attempts missed: **`Delivery Size` chooses the service,
weight only chooses the band within it.**

- `Small` → courier: £6.99 / £9.99 / £14.99 / £24.99
- `Large` → two-man: £49.99 / £59.99 / £69.99 / £84.99 / £109.99

Why that matters in both directions:

- Banding on weight alone charged a 15kg sideboard £9.99. Hill charged £49.99.
  That understated landed cost by roughly £49 a unit across the Hill range.
- Two-man at every weight charges a 2.6kg framed canvas £49.99. Hill charges
  £6.99. **That is why 84 of 140 Hill products currently read as loss-making** —
  most of them are candles, frames and clocks wearing a sofa's delivery cost.

The same CSV from step 1 carries the `Delivery Size` column.
`scripts/reprice-hill-from-dropship-feed.ts:184` has been reading it all along
and only consulted it when weight was missing.

**To do:** point `fix-hill-interiors-carriage.ts` and
`reprice-hill-from-dropship-feed.ts` at `hillCarriage()` instead of their own
band tables, then dry-run and check the loss-making count collapses. Rows the
model flags as `estimated` need a decision, not a silent number — that habit is
what caused this.

---

## 5. Reprice — only after 4

With honest carriage, the six furniture lines where Kaiku is already the
cheapest in the market and still makes 24–34% stay as they are. The question is
everything else, and it cannot be asked until step 4 is done.

---

## 6. Still blocked on you, unrelated to stock

- [ ] **Approve the Vercel consent link.** £80/week against £81 of revenue.
      Pro base is about $20/month, so almost all of it is usage overage —
      findable, but not without access.
- [ ] Check whether the Stripe webhook wrote Jennifer's order to Supabase.
      Admin analytics shows £0 revenue and no add-to-carts, which is wrong, and
      if the webhook silently failed she may never have had a confirmation.

---

## Known gap: the two-man note on product pages

`TWO_MAN_FROM_KG = 40` in `src/lib/suppliers/delivery-zones.ts` still gates the
customer-facing two-man delivery warning on weight, and weight cannot decide it.
The 39.9kg Sorelle shows no warning although it ships two-man.

The fix is a `Delivery Size` field on the product schema populated from the
feed, not a different number in that file — changing the number alone only
moves which customers get the wrong answer. Left alone last night for that
reason; the comment there now says so.
