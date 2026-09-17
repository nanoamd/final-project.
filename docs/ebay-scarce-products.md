# The products worth listing, ranked by how few shops sell them

> **Superseded in scope, 17 September.** Damien: _"we have much more furniture
> products than this."_ Correct — this page was built from the 128-row
> marketplace sheet, which was already filtered to promotable stock with
> confirmed carriage. The real figure is **409 published furniture products, 97
> of them listable today**. See
> `docs/change-log/2026-09-17-furniture-ebay-ranked.csv` and
> `scripts/rank-furniture-for-ebay.ts`.
>
> The seven hand-verified retailer counts below still stand, and the three
> highest-profit permitted products are not in them — they are Hill's outdoor
> sets, which the old sheet had filtered out.

Damien: _"a list of products... most likely to sell organically on ebay and make
the most money with 0 retailers selling the same product on ebay."_

## What I could and could not do

**I cannot check eBay.** It returns 403 to automated requests on both search and
category pages. That is bot protection and not something to work around, so the
"0 retailers on eBay" part of the brief is the one thing in here I have not
measured.

What I measured instead is **how many UK websites sell the same product**. It is
a strong proxy — a piece carried by three shops is far less likely to be on eBay
than one carried by fifteen — but it is a proxy. **Searching the product name on
eBay takes you ten seconds and settles it.** That is the one step only you can do.

Three of the four suppliers are also closed to me:

| Supplier            | Status                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D.I. Designs**    | 403, bot protection. Their catalogue is unreachable — but their 54 products and trade prices are already in Sanity, so this list is built from those |
| **Furniture To Go** | Serves _"Making sure you're not a bot!"_                                                                                                             |
| Hill Interiors      | Browsable for product names, **no prices** — trade login                                                                                             |
| Furniture100        | Browsable, **no prices** — trade login                                                                                                               |

So this list is D.I. Designs only. It is also the right place to start: they are
trade-vetted and sell through a handful of shops, where Hill is mass wholesale
with the same vase on fifteen sites using the same photograph.

## The verified list

Every retailer count below was searched by hand. Profit is at the eBay floor
price with the corrected 0% private-seller fee.

| #   | Product                                 | List at | You keep | **UK retailers** |
| --- | --------------------------------------- | ------: | -------: | ---------------: |
| 1   | **Himbleton Green 3 Seater Sofa**       |  £1,064 |     £213 |            **3** |
| 2   | **Wadborough 3 Seater Sofa, Neutral**   |  £1,141 |     £228 |            **4** |
| 3   | **Abberley Black Oak Sideboard**        |  £1,186 |     £238 |            **5** |
| 4   | **Huddington Black Sideboard**          |  £1,033 |     £207 |            **6** |
| 5   | Hampton Ivory Shagreen Chest of Drawers |  £1,186 |     £238 |                8 |
| 6   | Candover Neutral Upholstered Sofa       |  £1,171 |     £235 |                8 |
| 7   | Charlton Ribbed Walnut Chest of Drawers |  £1,079 |     £216 |                8 |

For comparison, the Symi Slim Table Lamp — the one with 54,000 impressions and
almost no clicks — is carried by **15+**.

### Two price findings worth having

- **Charlton Ribbed Walnut Chest** sells at **£1,145** elsewhere. Your floor is
  £1,079, so you can be the cheapest and still keep £216.
- **Himbleton Green Sofa** is listed at **£2,544** by one of its three
  retailers. That may be a different upholstery grade — worth checking before
  you price off it — but if it is the same piece there is a great deal of room.

## Start with the top four

Himbleton, Wadborough, Abberley and Huddington. Three to six competing websites,
£207 to £238 profit each, and the sofa you already have evidence for — 44 clicks
and a save — is the same shape of product.

**Check each on eBay before you list.** If one of the three Himbleton retailers
is already there, it drops down the list; if none are, it goes first.

## The 34 others

`scripts/rank-by-scarcity.ts` ranks all 41 D.I. Designs pieces scoring 5+ on
supplier and price. The seven above are the ones verified by hand. Work down
that list, search each name, and note the retailer count as you go.

## To extend this to Hill and Furniture100

Their product names are browsable; their prices are not. Pull a trade price
export for either and the same ranking runs against it — the margin model and
the scarcity scoring are already written.
