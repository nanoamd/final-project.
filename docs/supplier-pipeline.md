# Supplier pipeline

Thirteen applications, sent 8 August 2026. Trade suppliers typically reply in
two to five working days; anything silent after that needs a chase, because a
trade enquiry that goes unanswered is almost always sitting in a warehouse inbox
rather than having been declined.

**Chase date for everything sent today: Friday 15 August.** One short email each,
same thread, no apology — "following up on my enquiry below, happy to provide
company details or trade references if that helps."

## Live

| Supplier            | Fills                                                  | Status       | Next action                                                                                         |
| ------------------- | ------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------- |
| **Hill Interiors**  | 5 room lighting categories, mirrors, storage, planters | **Accepted** | Ask for the CSV/XML feed URL for our account. `import-supplier-products.ts --csv` takes it directly |
| SaunaPlunge (Kelly) | Range extension: accessories, more plunges             | Sent         | Chase 15 Aug. Accessories are the highest-margin ask                                                |

## Pending — trade only, cannot undercut us

| Supplier                | Fills                                       | Contact                                        |
| ----------------------- | ------------------------------------------- | ---------------------------------------------- |
| **Nova Outdoor Living** | Pergolas, fire pit tables, garden furniture | `trade@novaoutdoorliving.co.uk` · 01268 578770 |
| **Gallery Direct**      | Mirrors, desks, lighting, wall décor        | Trade form submitted                           |
| **Esschert Design**     | Fire pits, fountains, water ornaments       | Contact form — ask who the UK distributor is   |
| **Asiatic Carpets**     | Rugs                                        | `sales@asiatic.co.uk` · +44 208 800 2000       |
| **Endon Lighting**      | Outdoor: bollards, lamp posts, wall, solar  | `sales@endonlighting.com` · 03300 552 789      |
| **Apollo Gardening**    | Ubbink water features                       | `orders@apollogarden.com` · 0114 221 5555      |

## Pending — also sell direct, so confirm RRP policy before listing

| Supplier             | Fills                          | Contact                                   |
| -------------------- | ------------------------------ | ----------------------------------------- |
| **där lighting**     | Indoor + outdoor lighting      | `sales@darlighting.co.uk` · 01295 672222  |
| **Elstead Lighting** | Decorative indoor + outdoor    | `sales@elsteadlighting.com` · 01420 82377 |
| **Smart Garden**     | Solar lighting, water features | Trade form submitted                      |
| **Bramblecrest**     | Fire pits, pergolas, teak      | `sales@bramblecrest.com` · 01285 760974   |
| **Auroom Wellness**  | Premium saunas                 | Contact form                              |

The distinction matters: a supplier who sells direct will match your price, which
is survivable. One who undercuts it is not. That is what question 3 in every
email was for — get the answer in writing before listing anything.

## Dead — do not pursue

- **Kelkay** — ceased trading (AMES Companies UK wind-down)
- **La Hacienda** — same wind-down
- **Spa Dispatch** — not accepting new trade accounts
- **Gardening Naturally** — sells direct to the public, and its dropship range is
  netting and pest control, not planters
- **Aosom** — keep for range filler only. Sells direct and on Amazon, cheaper

## Still empty after all thirteen land

privacy-screens · towel-rails · bathroom-accessories · kitchen-furniture

Towel rails and bathroom accessories are plumbing trade — a different supplier
world (Eastbrook, JIS, Reina) worth entering only if the bathroom room matters.
Privacy screens have no trade-only source found.

## When one says yes

1. Get the **data feed URL** first. Everything else is manual work that a feed
   removes.
2. Confirm the **RRP or minimum advertised price policy** in writing.
3. Confirm whether they **ship direct to the customer** or expect stock holding.
   This decides whether the category is viable at all.
4. Import with `scripts/import-supplier-products.ts --csv <file>`, dry run
   first, then `--apply`. Check `scripts/audit-product-images.ts` afterwards for
   low-resolution images and missing alt text.

## Blocking everything above

None of these accounts earn anything until the shop can take money.

- [ ] **Stripe live keys** — site is still on `pk_test_`. No sale is possible at
      any traffic level
- [ ] **Resend** — `RESEND_API_KEY` unset, so no email leaves the site. Supplier
      replies come to your inbox, but customer enquiries and order
      confirmations go nowhere
- [ ] **One real test purchase**, then refund it. The only check that proves
      payment, webhook, order record and email together
- [ ] **Submit the Merchant feed** as a daily Scheduled fetch:
      `https://www.kaikuhome.com/api/feeds/google-merchant`
- [ ] **Rotate the Sanity write token** — the current one was shared in a chat
      transcript

## Carriage — what each supplier's terms actually are

`shippingCost` on a product is what the supplier charges to get the item to the
customer. Delivery is free on the storefront, so it comes out of the margin.
Where the terms are known they are recorded as `carriageIncludedInCost` on the
supplier document, and `scripts/margin-report.ts` reads it.

| Supplier     | Terms                                       | Status                                                    |
| ------------ | ------------------------------------------- | --------------------------------------------------------- |
| SaunaPlunge  | Pallet delivery inside the trade price      | Confirmed, recorded                                       |
| AW Dropship  | Per-parcel by weight, £2.79 / £2.99 / £5.99 | Band table in `src/lib/suppliers/aw-dropship-shipping.ts` |
| D.I. Designs | £80 an item                                 | **Unresolved — see below**                                |
| Aosom        | Unknown                                     | Four products carry a placeholder £0                      |

### Open: settle the D.I. Designs £80

Four of their seven products record £80 of carriage; three record a placeholder
£0. The open question is whether that £80 sits **on top of** the trade price or
is **already inside** it. It decides real money either way:

| If the £80 is…            | Consequence                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| On top of the trade price | The three £0 tables really cost £80 to ship, so the **Elmley (−£11) and Overbury (−£13) sell at a loss** and the Bentley clears £3 |
| Already inside it         | The four £80 entries double-count, so those four are under-reported by £80 each — the Pershore nets 68%, not 57%                   |

Either way the Bentley, Elmley and Overbury clear only 9–16% at best, so they
need repricing or delisting regardless of the answer.

- [ ] Confirm which it is with D.I. Designs
- [ ] Set `carriageIncludedInCost` on the supplier, fix the three placeholder
      zeros, then re-run `scripts/margin-report.ts`
- [ ] Reprice or delist the Bentley, Elmley and Overbury

### Open: ask Aosom whether carriage is in their trade price

Four products carry a placeholder £0, weights 1.1 kg to 10.2 kg. Their margins
(43%, 38%, 26%, 19%) are a best case until this is answered.

- [ ] Ask, then record it on the supplier document
