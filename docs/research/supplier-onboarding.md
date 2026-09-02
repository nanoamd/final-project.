# Onboarding a new supplier

Written after Hill Interiors, Premier Housewares and Aosom were all onboarded
without their carriage terms being captured. Damien's plan is to add more
suppliers, so this is the list that stops the same thing happening a fourth time.

`scripts/audit-supplier-readiness.ts` is the mechanical version — run it after
adding anyone. This is the human half: what to ask before you sign.

## Ask these before you look at their range

Range is the easy part. These are the answers that decide whether the range can
be sold profitably at all.

### Carriage — the one that has already cost money

1. **Is carriage included in the trade price, or billed on top?**
2. **If billed: what are the exact rates?** Get the table, not a summary. Hill's
   is ten bands across two services and the two-band version I inferred from a
   screenshot was wrong.
3. **Per order or per item?** Hill band the whole consignment by weight, so
   £6.99 covers everything up to 10kg. Premier's structure is unknown. This
   single distinction is the entire margin on a £20 product.
4. **Is there a carriage-free threshold?** Hill: free over £500 by pallet, £20
   between £200 and £499.99.
5. **What is the minimum order value you will despatch?** Hill will not ship
   below £200 at all. Premier require £350 on a first order.
6. **Surcharge areas and exclusions.** Hill add £10 for the Isle of Man, Isle of
   Wight, Northern Ireland and the Scottish Highlands & Islands, and their
   two-man service does not reach BT, HS, IM, IV26-99, KA27, KA28, KW, PA15-78,
   PH19-50 or ZE at all. Without knowing that, we take money for orders we
   cannot fulfil.
7. **Two-man delivery: which products need it, and at what rate?** Do not infer
   it from weight — ask them to flag it per product.

### VAT

8. **Is the trade price shown ex-VAT or inc-VAT?**
9. **Do you invoice 20% on top?** Kaiku is not VAT-registered, so it is
   unreclaimable cost. Premier do; Hill's site says prices are "subject to
   additional VAT".
10. **Any products at a different rate?** Record it in `supplierVatRate` on the
    product, not as an assumption.

### Pricing tiers

11. **What tiers exist — dropship, wholesale, volume?** Hill's dropship price is
    their most expensive: wholesale is 86.2% of it and volume 77.6%. Our recorded
    costs were all dropship, which is why margins looked thin.
12. **What quantity triggers the volume price?**
13. **Is there RRP or MAP enforcement?** Decides whether we can price freely.

### Data and operations

14. **Is there a product data feed, and in what format?** A feed is the
    difference between 100 products and 1,000.
15. **Does the feed carry weights and dimensions?** A weight-banded carriage rule
    cannot be resolved without a weight — Hill's is unresolvable on one product
    for exactly this reason.
16. **How is stock communicated?** Live feed, daily file, or nothing.
17. **Lead times, and are they per product?**
18. **Returns: who pays carriage, and what is the window?**
19. **Damage and shortage process** — who the customer talks to.

## Then record it, before listing anything

- `supplier.shippingRule` — the rule itself, with **a note naming where the
  terms came from and when**. Hill's original note cited our own product data as
  evidence for itself, and that is how a whole supplier's carriage came to read
  as free.
- `supplier.carriageIncludedInCost` — only `true` where they have said so.
- `product.shippingCost` on every product, derived from the rule.
- `product.supplierVatRate` where it is not 20%.
- Then run `scripts/audit-supplier-readiness.ts` and expect READY.

**A missing carriage figure is not zero.** It means unknown, and a margin
calculated over it is fiction. That distinction is the whole point of this page.

---

# Mercia Garden Products — the approved one

Damien is approved by Mercia. Harvia and Auroom were placeholder brand records,
not relationships.

Mercia are a UK manufacturer of timber garden buildings and describe themselves
as a market-leading dropship supplier. Their terms are not published — they are
handled in conversation, so the list above is the conversation.

## Why this is a good fit

Their range is the high-ticket end the catalogue lacks:

| Range                               | Typical retail        |
| ----------------------------------- | --------------------- |
| Overlap and standard sheds          | £200–£300             |
| Summerhouses                        | £825–£990             |
| Log cabins                          | £825–£2,587           |
| Insulated garden rooms, 100mm walls | premium, above cabins |
| Wooden greenhouses, playhouses      | mixed                 |

It also sits beside what already sells best. The eight most expensive products in
the shop are seven saunas and a bookcase, £3,263–£6,500. A £2,587 log cabin or an
insulated garden room is the same customer, the same considered purchase and the
same delivery and installation profile — and Sauna is the department with the
deepest copy, buying guides and calculators already built.

## Structure it needs

There is **no garden buildings coverage in the catalogue at all** — no department
and no category. It needs a new department rather than being forced into Outdoor
Living, because these are buildings rather than furnishings and the buying
questions are completely different (base preparation, planning permission,
treatment, installation).

Proposed **Garden Buildings** department, ordered after Outdoor Kitchen:

- Sheds
- Summerhouses
- Log Cabins
- Garden Rooms & Offices
- Greenhouses
- Playhouses

Deliberately not created yet. Damien's own complaint was empty categories that
"isnt what you expect", so these should be created **with their SEO introduction,
buying guidance and FAQs at the same time as the products land**, the way the
other 49 categories now are — not before.

## Worth knowing before pricing it

Mercia advertise "ready painted buildings and home installation" as services.
Both are upsells with real margin, and both need modelling as options rather than
being buried in a description. Their "extensive UK delivery network" is likely
carriage-included or zone-based rather than weight-banded — but that is exactly
the assumption that cost £1,250 on Hill, so it gets asked, not assumed.
