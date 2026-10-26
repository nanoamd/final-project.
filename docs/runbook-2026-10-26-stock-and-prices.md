# Tomorrow morning: stock, carriage, prices

Written the night of the first organic sale. The order was for a canvas Hill had
none of until January 2027, and the replacement offered was also out of stock.
Both were listed In Stock because nothing had ever written that field.

Work down the list. Step 0 is new and comes first. Steps 2–4 make the shop honest, 5–6 make it
profitable. Do not start 6 before 5 finishes, or you will reprice against
carriage figures that are wrong in both directions.

---

## 0. Do this first — your cost base and your customers' emails are public

Found late on the 25th, by accident, looking for the newsletter numbers. An
anonymous HTTP request to the Sanity API returns:

- `costPrice` on all **908** products — your margin on everything
- `shippingCost` on 268
- **4 newsletter subscribers and 6 contact submissions, with names, email
  addresses and message bodies**
- 11 supplier records and 786 price adjustments

The project ID cannot be secret — it is in every `cdn.sanity.io/images/huh1e45n/…`
URL the site serves. The dataset being public is the problem, and it has been
public the whole time.

Check it yourself, no credentials needed:

```
pnpm tsx scripts/audit-public-dataset.ts
```

**Fix, in this order, or the site goes contentless between steps:**

1. Sanity → API → Tokens → create a token with the **Viewer** role
2. Put it in Vercel as `SANITY_API_READ_TOKEN` and redeploy.
   `src/lib/sanity/client.ts` already uses it when present, and it is harmless
   while the dataset is still public
3. Sanity → API → Datasets → set `production` to **private**
4. Run the audit again. All six lines should read **CLOSED**

The ten personal records are the urgent half — that is a UK GDPR matter and it
does not depend on anyone having looked. The trade prices are the commercial
half, and given the scraper traffic already in Search Console, assuming nobody
has looked is not safe.

Longer term the form submissions should not be in Sanity at all — Supabase
already has `subscribers` and `tickets`. Private is correct regardless.

---

## 1. Before the shop takes another order

- [ ] Refund £81 in Stripe
- [ ] Take **Mistora** and **Silvra** hand-painted canvases off sale in Studio
- [ ] Send the apology/refund email to Jennifer
- [ ] Reply to Dot Turley — that enquiry is eleven days old
- [ ] Put `hello@kaikuhome.com` on your phone with notifications on

Steps 2–4 stop this recurring; this step settles the two it already happened to.

---

## 2. Hill Interiors stock

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

## 3. Premier Housewares stock — no export needed

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

## 3b. What the two syncs cannot reach

Counted from the live dataset overnight. **768 of 908 products currently claim
In Stock. Only 4 in the whole catalogue are marked Out of Stock.**

| Supplier           | In Stock | Verifiable                               |
| ------------------ | -------: | ---------------------------------------- |
| Premier Housewares |      419 | yes — step 3                             |
| Hill Interiors     |      133 | yes — step 2                             |
| Aosom              |      103 | **no route**                             |
| AW Dropship        |       55 | **no route**                             |
| D.I. Designs       |       54 | no — serves bot challenges               |
| SaunaPlunge        |        3 | no — but only 8 products, just ask Kelly |

Steps 2 and 3 cover **552 of the 768**. The other **212 stay guesses**, each one
telling a customer the item is available.

So when you say stock needs to be accurate: after tomorrow it is accurate for
72% of what the shop promises. The remaining 28% is a supplier conversation,
not a script. Three emails to write:

- [ ] **Aosom** — ask for a B2B/stock feed. 103 products rest on it, and their
      cost is still recorded as "estimated at ~58% of Aosom sale".
- [ ] **AW Dropship** — 56 products and no website or portal recorded on the
      supplier record at all. Ask where stock is published.
- [ ] **SaunaPlunge** — 8 products, highest cash per sale in the catalogue
      (£793). Worth asking first because it is the smallest ask with the
      biggest consequence.

D.I. Designs I would leave. Their site serves bot challenges, I will not work
around those, so it needs a feed or a trade login from them.

---

## 4. What the two scripts will not do

Neither marks anything **Backorder** or **Coming Soon**. Both feeds give a
number, not a restock date, and "Backorder" tells a shopper a date is known. Out
of Stock is the honest word for "we cannot send this today".

Neither touches a product it could not read. A failed fetch is not evidence of
anything, and flipping a line to Out of Stock on a 503 takes a sellable product
off the shop.

---

## 5. Carriage — now wired, needs the CSV

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

The same CSV from step 2 carries the `Delivery Size` column.
`scripts/reprice-hill-from-dropship-feed.ts:184` has been reading it all along
and only consulted it when weight was missing.

**Both scripts are now wired to it** (done overnight), and Sanity has a
`deliverySize` field to hold the flag. So this is a run, not a build:

```
pnpm tsx --env-file=.env.local scripts/fix-hill-interiors-carriage.ts --feed=/path/to/HillInteriorsDropship.csv
```

Read three things in the output before applying:

- **By service** — how many go courier vs two-man. If nearly everything comes
  out two-man, the column is not what we think it is. Stop and tell me.
- **"Written, but from an incomplete row"** — resolved from a partial feed row.
  Worth a glance.
- **"Left alone, nothing to go on"** — no `Delivery Size` and no weight.
  Reported rather than guessed, because a guess here is worth anywhere between
  £6.99 and £109.99.

Then `--apply`. It writes `deliverySize` as well as `shippingCost`, which is
what makes the product-page two-man warning correct.

Expect the loss-making count to collapse. 84 of 140 was mostly candles and
picture frames carrying a sofa's carriage.

---

## 6. Reprice — only after 5

With honest carriage, the six furniture lines where Kaiku is already the
cheapest in the market and still makes 24–34% stay as they are. The question is
everything else, and it cannot be asked until step 5 is done.

---

## 7. Still blocked on you, unrelated to stock

- [ ] **Approve the Vercel consent link.** £80/week against £81 of revenue.
      Pro base is about $20/month, so almost all of it is usage overage —
      findable, but not without access.
- [ ] Check whether the Stripe webhook wrote Jennifer's order to Supabase.
      Admin analytics shows £0 revenue and no add-to-carts, which is wrong, and
      if the webhook silently failed she may never have had a confirmation.

---

## Fixed overnight: the two-man note on product pages

`needsTwoManDelivery()` now believes the supplier's `deliverySize` flag and
falls back to weight only where there is no flag.

The case it fixes: the **Sorelle sofa is 39.9kg and ships two-man.** Under the
old 40kg threshold it fell 0.1kg short and showed no warning at all — so a
customer in Belfast could have bought it and had the sale unwound after paying.
A 2.6kg framed canvas had the opposite problem waiting for it.

The flag is only populated once step 5 runs, so until then everything still
falls back to weight. `TWO_MAN_FROM_KG = 40` survives as that fallback, and its
comment now explains which way it deliberately errs: a warning nobody needed
costs a question, a missing warning costs the order.

Only Hill publish this flag. Premier, AW Dropship and D.I. Designs products
keep falling back to weight until someone finds their equivalent column.
