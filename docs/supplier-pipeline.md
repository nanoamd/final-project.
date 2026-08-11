# Supplier pipeline

Thirteen applications, sent 8 August 2026. Trade suppliers typically reply in
two to five working days; anything silent after that needs a chase, because a
trade enquiry that goes unanswered is almost always sitting in a warehouse inbox
rather than having been declined.

**Chase date for everything sent today: Friday 15 August.** One short email each,
same thread, no apology — "following up on my enquiry below, happy to provide
company details or trade references if that helps."

**Status as of 11 August:** several replies in, one acceptance — Ivyline, by
phone. The rest declined or have not answered. Which specific suppliers said no
is not recorded here yet; the ones known to be dead are in the Dead section, and
anything still in Pending is either genuinely silent or a decline that has not
been written down.

## Live

| Supplier            | Fills                                                  | Status       | Next action                                                                                         |
| ------------------- | ------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------- |
| **Hill Interiors**  | 5 room lighting categories, mirrors, storage, planters | **Accepted** | Ask for the CSV/XML feed URL for our account. `import-supplier-products.ts --csv` takes it directly |
| SaunaPlunge (Kelly) | Range extension: accessories, more plunges             | Sent         | Chase 15 Aug. Accessories are the highest-margin ask                                                |

### One acceptance, by phone — a fire pit supplier who sells to Dunelm

Not yet named here, because it has been guessed wrong once already and a supplier
file that records the wrong company is worse than one that records nothing. What
is known: fire pits, supplies Dunelm, **no dropship**, and the contact was a phone
call rather than an email.

Cross-referencing the brands Dunelm actually lists in chimineas and fire pits
against the thirteen applications leaves two candidates:

| Candidate                                       | Why it fits                                                                                                                                                                                                              | Phone         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| **Fallen Fruits Ltd** (Craven Arms, Shropshire) | The exclusive UK distributor for **Esschert Design** — the supplier we applied to, and the open question on that application was "who is the UK distributor". Trade accounts only. Dunelm lists "Fallen Fruits Firebowl" | 01584 873377  |
| **Charles Bentley** (Loughborough)              | Dunelm lists Charles Bentley chimineas and fire pit tables. Their dropship programme requires a website turning over **£500,000 a year**, so a trade account with no dropship is exactly what they would have offered    | 01509 232 757 |

Fallen Fruits is the stronger fit: it explains why the call came at all, since the
Esschert enquiry would have been passed straight to them.

- [ ] Check the call log against those two numbers and record the answer here

Either way it is a **stockholding** account, which is a different model to every
other supplier on this page — stock comes to us, is stored, and we ship to the
customer. Cash committed before a sale, storage space, and a courier cost per
order that lands in the margin because the storefront ships free. A 15 kg fire pit
is roughly £8–20 to send.

The constraint that decides whether the account is worth using at all is **SKU
overlap**. Both candidates supply Dunelm under their own brand name, so listing
those SKUs puts us beside Dunelm on an identical product in Google Shopping, which
is a comparison we lose at any price we can afford. The order has to be lines
Dunelm does not carry.

Before committing money:

- [ ] Get the **full trade price list** with the RRP against each line
- [ ] Ask which lines are **not** supplied to Dunelm, John Lewis or TK Maxx
- [ ] Ask whether they will **deliver direct to a customer address** for a fee.
      Plenty of stockholding suppliers do this without calling it dropship, and
      that one answer would make the account behave like all the others
- [ ] Confirm the **minimum order** and whether it is per order or an opening
      commitment
- [ ] Confirm the **payment terms** — proforma on a new account, most likely
- [ ] Refuse any **display-stand agreement**: they typically tie you to keeping a
      stand stocked for two years

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
| **La Hacienda**      | Fire pits, chimineas, heaters  | `lahacienda.co.uk` — not yet approached   |

**Correction: La Hacienda is still trading.** It was listed as dead here on the
basis of the AMES wind-down, which applied to Kelkay, not to them — Dunelm and
John Lewis both carry the brand today. It is the most recognised fire pit brand
on the UK high street and it has not been approached, which makes it the obvious
next application for that category.

The distinction matters: a supplier who sells direct will match your price, which
is survivable. One who undercuts it is not. That is what question 3 in every
email was for — get the answer in writing before listing anything.

## Dead — do not pursue

- **Kelkay** — ceased trading (AMES Companies UK wind-down)
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

A recorded £0 is a **real zero**, not a gap — it means carriage is already inside
`costPrice`. Only an empty field is unknown.

| Supplier     | Terms                                       | Status                                                    |
| ------------ | ------------------------------------------- | --------------------------------------------------------- |
| SaunaPlunge  | Pallet delivery inside the trade price      | Confirmed, flag set on the supplier                       |
| AW Dropship  | Per-parcel by weight, £2.79 / £2.99 / £5.99 | Band table in `src/lib/suppliers/aw-dropship-shipping.ts` |
| D.I. Designs | £80 an item, folded into `costPrice`        | Correct as recorded — see below                           |
| Aosom        | Unknown                                     | Four products record £0                                   |

D.I. Designs is deliberately **not** flagged `carriageIncludedInCost`, because
their products are mixed: three fold the £80 into `costPrice` and record £0, four
record the £80 separately. The per-product field already says which is which, and
a supplier-level flag would override it wrongly.

### The £80 is settled. Two cost prices are not

Target is £80–100 kept per table. Five of the seven land there:

| Table    | Net kept |                 |
| -------- | -------- | --------------- |
| Crofton  | £87      | ✓               |
| Bentley  | £83      | ✓               |
| Witley   | £79      | ✓               |
| Elmley   | £69      | ✓ near          |
| Overbury | £67      | ✓ near          |
| Abberley | **£261** | ✗ 3× the target |
| Pershore | **£414** | ✗ 4× the target |

Pershore records a £215 cost on a £720 retail and Abberley £195 on £544, while
their siblings sit at £275–£798. For Pershore to keep £80–100, cost plus carriage
needs to be around £620–640, so a `costPrice` of roughly £540 — not £215.

- [ ] Check the D.I. Designs invoice for the **Pershore** and **Abberley** cost
      prices. They are almost certainly understated, which flatters the margin
      report and would flatter any pricing decision made from it

### Open: ask Aosom whether carriage is in their trade price

Four products record £0, weights 1.1 kg to 10.2 kg. If that £0 means the same as
it does for D.I. Designs — carriage inside the cost — their margins (43%, 38%,
26%, 19%) are real. If Aosom bill it on top, all four are overstated.

- [ ] Ask, then record it on the supplier document
