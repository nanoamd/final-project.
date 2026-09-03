# Hill Interiors: what competitors charge, and where we still have room

Researched 2 September 2026, after the carriage correction and reprice.

Hill Interiors is a wholesaler, so the same products appear across dozens of UK
retailers under identical names. That makes them unusually easy to price-check —
and it means our price is directly comparable, not an approximation.

## What we found

| Product                                 | Ours now   | Cheapest found               | Also seen       | Verdict                              |
| --------------------------------------- | ---------- | ---------------------------- | --------------- | ------------------------------------ |
| Provence Outdoor 4 Seater Dining Set    | **£1,259** | £1,295                       | £1,899.95       | Cheapest by £36                      |
| Capri Outdoor Foot Stool                | **£276**   | £320 (Norfolk Luxury)        | £410 (Olivia's) | Cheapest by £44 — real headroom      |
| Antique Gold Hare Table Lamp            | **£76**    | £99.95 (Decor Sanctuary)     | —               | Cheapest by £24 — real headroom      |
| Garda Grey Glazed Juniper Vase 37cm     | **£124**   | £128.99 (My Italian Living)  | —               | Cheapest by £4.99 — thin             |
| Vellis Blue Wingback Armchair           | **£374**   | £355.81 (ManoMano, on offer) | £374.53 list    | **We are £18 above** the offer price |
| Luxe Natural Glow S/2 Ivory LED Candles | **£23**    | £19.99 (Avoir)               | £20.00 (Casas)  | **We are £3 above market**           |

## The pattern

We beat the market comfortably from about £70 upward, and the reprice pushed us
**above** the market at the bottom of the range.

That is not a coincidence. £6.99 of carriage on a £20 candle is 35% of the sale
price. Nobody selling that candle at £19.99 is absorbing £6.99 per unit — so
either they hold stock, or they only ship it alongside something else, or they
are losing money on solo orders too.

## The thing I got wrong

The reprice charged every product its full carriage. **Hill's rates are per
consignment, not per item** — their table bands the whole parcel by weight, so
£6.99 covers everything up to 10kg in one shipment.

So the same candle is:

- **£6.99 of carriage** as a solo order — genuinely unviable at £20
- **£2.33** if it ships with two other small items
- **£0 marginal** if it goes in a parcel that was already under 10kg

`shipping-rules.ts` already distinguishes `flatPerOrder` from `flatPerItem` and
says exactly why. The reprice used the per-item reading, which is right for a
single-item basket and pessimistic for any other, and on cheap items the
difference is the whole margin.

## What to do about it

Three moves, in the order they matter:

1. **Take the cheap items back to market price.** £23 for those candles loses the
   sale to a dozen retailers at £19.99. Better to be at £20 and thin than at £23
   and invisible. Same review for everything we raised under about £30.
2. **Stop solo orders being the problem.** A minimum order value, or a small-order
   handling charge, or free delivery over £X to push basket size — any of them
   turns the per-consignment rate into an advantage instead of a leak. This is
   the structural fix and it does not cost us a single sale on price.
3. **Raise where we have headroom.** The Capri footstool at £276 against Olivia's
   £410 is £134 left on the table; £310 would still be the cheapest listing by
   £10. The Hare lamp at £76 against £99.95 is the same story.

Points 1 and 3 are the same script run in both directions. Point 2 is a decision
about the shape of the offer, and it is Damien's.

## Method, for repeating this

Search the exact product name in quotes — these names are unique to Hill and
every reseller keeps them verbatim, so results are almost all the same product.
Confirm the match on dimensions before comparing price: the Garda range has both
a "Juniper Vase" and a "Tall Juniper Vase", and a 37cm cube is the one we sell.

Generic names ("Light Up Bookcase", "Multi Shelf Industrial Shelf Unit") are not
findable this way and need Hill's own SKU or a reverse image search.

---

# Update: with VAT counted, dropshipping is the problem — not the price

Damien: _"you need to account for cost prices, vat and shipping."_

Landed cost of one unit is all three:

    landed = costPrice × 1.20      trade price plus VAT Kaiku cannot reclaim
           + shippingCost × 1.20   carriage plus VAT, per Hill's terms
           + price × 1.5% + 20p    card processing

Kaiku is not VAT-registered, so the 20% Hill add is a real cost, not a
pass-through. Run over the whole Hill range, **116 of 139 products fall below
their margin floor**, and net margin at today's prices is around 4–5%, not 20%.

## The six we price-checked, honestly

| Product                | Ours   | Cheapest rival | Landed solo | Net solo      | Price needed for floor |
| ---------------------- | ------ | -------------- | ----------- | ------------- | ---------------------- |
| Luxe LED Candles       | £23    | £19.99         | £20.22      | £2.24 (9.7%)  | £25.06                 |
| Garda Juniper Vase     | £124   | £128.99        | £116.39     | £5.55 (4.5%)  | £148.52                |
| Antique Gold Hare Lamp | £76    | £99.95         | £71.03      | £3.63 (4.8%)  | £90.74                 |
| Capri Foot Stool       | £276   | £320           | £258.95     | £12.71 (4.6%) | £330.12                |
| Provence 4 Seater Set  | £1,259 | £1,295         | £1,185.59   | £54.33 (4.3%) | £1,510.56              |
| Vellis Wingback        | £374   | £355.81        | £352.07     | £16.12 (4.3%) | £448.75                |

On four of the six, the price needed to hit the floor is **above** what rivals
charge. We cannot be both profitable and cheapest — while dropshipping.

## Why rivals can do it and we can't

They are almost certainly VAT-registered and reclaiming input VAT. On the
Provence set their real cost is £928; ours is £1,113.60. Same supplier, same
product, a 20% handicap before anyone opens a laptop.

Registering does not obviously fix it either: registered, we would charge output
VAT on the sale too, which on a B2C sale usually costs more than the reclaim is
worth. Not registering keeps a 20% consumer-price advantage and pays for it in
input VAT. That is the trade, and it is not the real lever.

## The real lever: Hill's own price tiers

Our recorded costs are Hill's **dropship** price — their most expensive tier.
From Hill's own product pages:

|                                | Dropship | Wholesale | Volume         |
| ------------------------------ | -------- | --------- | -------------- |
| Luxe LED Candles S/2           | £9.86    | £8.50     | £7.65 (qty 12) |
| Capri Outdoor Large Corner Set | £1,682   | £1,450    | £1,305 (qty 3) |

Both land on the same ratios: **wholesale is 86.2% of dropship, volume is
77.6%**. And a stocked order over £500 ships carriage-free by Palletways, which
removes the per-order carriage entirely.

The candles at the market price of £19.99:

| How we buy                           | Landed    | Net        | Margin    |
| ------------------------------------ | --------- | ---------- | --------- |
| Dropship, single-item order          | £20.22    | **−£0.73** | loss      |
| Dropship, three items in one parcel  | £14.63    | £4.86      | 24.3%     |
| Wholesale, order over £500           | £10.20    | £9.29      | 46.5%     |
| **Volume (qty 12), order over £500** | **£9.18** | **£10.31** | **51.6%** |

Same product, same shelf price, and the margin runs from a loss to 51.6% purely
on how it is bought.

## What this means for the £350 minimum

Damien was treating Premier Housewares' £350 first-order minimum as an obstacle,
and floated shipping unordered goods to a customer to clear it. It is the
opposite of an obstacle. On Hill the equivalent thresholds — £200 to despatch at
all, £500 for free carriage — are the doorway to the only pricing at which this
range is competitive and profitable at the same time.

The move is to stock the fast-moving small items rather than dropship them, and
keep dropshipping the large, expensive, low-frequency pieces where carriage is a
small share of the price and holding stock would tie up cash.

## Garden furniture sets — the five imported 3 Sep 2026

Checked against live UK retailers selling the same Hill SKUs, before the prices
were written. Every one of the five clears Damien's 20% net floor _and_ lands
inside the market range, which is why they were priced at the floor rather than
held back for a manual decision.

| Set                               | Code  | Kaiku  | Market found                                                                        | Position                    |
| --------------------------------- | ----- | ------ | ----------------------------------------------------------------------------------- | --------------------------- |
| Capri Large Corner + Coffee Table | 23913 | £2,679 | £2,409 Felker · £2,805 Green & Gable                                                | mid                         |
| Provence 4 Seater Lounge          | 24513 | £1,866 | £2,399.95 Haddon                                                                    | **cheapest found, by £534** |
| Amalfi Large Corner               | 23912 | £2,968 | £2,799 eFurn (flash) · £2,992 Style Our Home · £3,780 Modern Rattan · RRP £3,999.95 | mid, £1,032 under RRP       |
| Amalfi Corner + Riser + 2 Stools  | 23914 | £4,209 | £4,131 Luxe Realms · £4,433 Style Our Home · £5,650 Bed Kingdom                     | near cheapest               |
| Capri Corner + Riser + 2 Stools   | 23099 | £4,298 | £3,387 JDC · £7,308 Haffertys                                                       | mid                         |

Two notes that matter commercially:

- The floor charges **20% VAT on trade cost with no reclaim**, the same
  conservative assumption used on the other 139 Hill products. If Kaiku is VAT
  registered and reclaims input VAT, the true floor on these five drops to
  £1,554–£3,581 — roughly 17% lower — and Kaiku undercuts every retailer above
  on all five rather than three. Worth confirming before a sale campaign.
- Buying at Hill's **volume** tier rather than dropship saves £2,262 across just
  these five sets. At these order values that is the single highest-leverage
  supplier conversation on the account.
