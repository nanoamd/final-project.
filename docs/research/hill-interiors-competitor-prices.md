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
