# Kaiku master brief — progress ledger

The complete brief of 12 August 2026, broken into individually checkable
requirements. This file is the record of what was asked for and what state each
item is in. **It is updated as work lands, not at the end.**

Status key:

| Mark  | Meaning                                                        |
| ----- | -------------------------------------------------------------- |
| `[x]` | Done, and verifiable in the repo or in Sanity                  |
| `[~]` | Partly done — the note says what is left                       |
| `[ ]` | Not started                                                    |
| `[!]` | **Blocked on Damien** — cannot be finished by code alone       |
| `[-]` | Deliberately not done — the note says why, for you to overrule |

---

## Ten more guides from the roadmap — Sofas, Lighting, TV Units, Desks, Mirrors, Wall Art (3 September)

Continuing straight through the roadmap's remaining 26 line items per Damien's
instruction to stop reporting between batches. Ten guides, covering 14 of
those line items after the same merge-don't-duplicate pattern already
established.

- [x] **`/learn/sofa-size-for-your-room`** and **`/learn/choosing-a-sofa`** —
      sizing (embeds the new `sofa-size` tool) and the fabric/shape decision,
      kept as two guides rather than one since they answer different
      searches. **Checked the catalogue before writing the second one and
      found Kaiku sells zero leather sofas** — velvet, linen, textured weave
      and chenille only. The guide says so plainly and recommends the
      closest fabric equivalent, rather than describing a leather option
      that isn't purchasable here.
- [x] **`/learn/coffee-table-top-material`** — stone, wood, veneer, glass/
      ceramic and rattan, what each actually costs day to day rather than
      just how it looks new.
- [x] **Three Lighting guides** — `/learn/floor-lamp-placement`,
      `/learn/warm-vs-cool-white-light-by-room`,
      `/learn/chandelier-vs-pendant-light` (embeds the existing
      `pendant-light` tool). All three needed the general Lighting category
      (138 products), not the room subcategories — a title search for "floor
      lamp" / "chandelier" / "pendant" found 42/20/29 real matches, 2-4x what
      Bedroom/Living Room Lighting alone would have shown, because most
      aren't cross-tagged into a room subcategory.
- [x] **`/learn/tv-unit-size-and-height`** — embeds the new `tv-unit-size`
      tool; the width-vs-diagonal distinction (a 65in TV is ~144cm wide, not
      165cm) is the one this guide leads with, since it's the actual source
      of most TV-unit sizing mistakes.
- [x] **`/learn/desk-depth-and-sit-stand-height`** — **checked the catalogue
      and found zero height-adjustable or sit-stand desks**, confirmed by
      title search before writing a word. The guide states that plainly up
      front rather than describing a feature not on sale, then gives the
      fixed-height standard (72-75cm, BS EN 527) and is honest that none of
      our own desks reach BS EN 527's 80cm recommended depth for a monitor
      setup — all are better suited to a laptop, which the guide says
      directly rather than implying they're interchangeable.
- [x] **`/learn/what-shape-mirror`** — embeds the existing `mirror-size`
      tool; shape (round/square/rectangular/arched/hexagonal/octagonal/oval)
      as a separate decision from size, which the two-thirds rule doesn't
      touch either way.
- [x] **`/learn/wall-art-size-and-arrangement`** — embeds the new
      `wall-art-size` tool; gallery-wall-or-single-piece reframed correctly
      as not a sizing question at all (both fill an identical footprint at
      an identical proportion) — the real decision is upkeep and commitment,
      which is what the guide actually covers.
- [x] Every relatedProduct and relatedCategory reference (59 across the ten
      guides) checked to exist in Sanity **before** writing, not after —
      caught nothing this batch, but it's the same check that would have
      caught the Furniture To Go duplicate-slug problem earlier if run
      first instead of after.
- [x] Lint clean on all new scripts; full test suite unaffected (content-only
      changes, no code touched this batch).

---

## Three more tools, ahead of the next guide batch (3 September)

Damien: _"continue?? idk why youve stopped to talk when like 5% of that list
you just sent me is complete"_ — working straight through the remaining 26
roadmap line items now, without pausing between guides to report back. Built
the tools first, since several of the next guides need one that didn't exist.

Checked all three against the (then-)14-tool list before building, the same
discipline that already caught five false gaps once — these three are
genuine: nothing on `/tools` sizes a sofa, a TV or TV unit, or wall art.

- [x] **`/tools/sofa-size-calculator`** — `src/lib/tools/sofa-size.ts` (9
      tests). No official sofa-size standard exists the way it does for a UK
      bed, so the nominal widths (2-seater 160cm, 3-seater 213cm, 4-seater
      250cm) are the midpoints of real published ranges, not an invented
      spec. Deliberately does not attempt corner or chaise sofas — an L-shape
      needs its two legs measured separately, and the guide it powers covers
      that in prose instead of forcing a single width-and-depth check to
      answer a question it can't.
- [x] **`/tools/tv-unit-size-calculator`** — `src/lib/tools/tv-unit-size.ts`
      (7 tests). Answers two different questions people conflate: THX's
      cinema-immersion figure (distance(ft) = diagonal(in)/10) versus the
      1.5-2x-diagonal everyday range most rooms actually use, and a screen's
      real width versus its diagonal (a 65in TV is ~144cm wide, not 165cm) —
      which is the number that actually decides the unit under it.
- [x] **`/tools/wall-art-size-calculator`** — `src/lib/tools/wall-art-size.ts`
      (7 tests). Reuses this site's existing mirror-calculator constants
      (`GALLERY_CENTRE_CM` 145, `GAP_ABOVE_FURNITURE_CM` 20) rather than
      re-deriving them, since a picture and a mirror follow the identical
      hanging convention. Adds the one genuinely new rule: a gallery wall is
      sized by its outer edges as one shape, at the same two-thirds
      proportion as a single piece — not each print judged on its own.
- [x] All three registered in `guide-tool-embed.tsx`'s `TOOLS` map and the
      `guideTool` schema enum, `/tools` index copy and count corrected to 17,
      and both new-tool doc comments updated from ten/fourteen.
- [-] **Sauna and cold-plunge capacity calculators still not embeddable in a
  guide.** Both need server-fetched product data (`CapacityMatchCalculator`
  takes a `products` array), which this embed mechanism can't carry without
  making every article route async-aware for a block type most articles
  don't use. The two wellness guides in this same batch link to them in
  prose instead — documented as a deliberate limitation in
  `guide-tool-embed.tsx`, not a gap to quietly work around.
- [x] Typecheck, lint (scoped to every file this pass touched) and the new
      tests all pass clean.

---

## First two guides from the roadmap, built with new tools (3 September)

Damien: "start building" — then, mid-build, "remember to include relevant
tools embedded into the buying guide page and if theres any relevant tool
you can make, make it." Both live now.

- [x] **`/learn/dining-table-size-and-shape`** — "What size dining table for
      how many seats?" Merged two roadmap line items (size, and round-vs-
      rectangular) into one guide rather than two, the same anti-
      cannibalization logic from the roadmap applied to my own execution.
      Opens with the direct numbers, a reference table, an embedded
      calculator, four rules as sections, and eight real dining tables from
      the catalogue measured against them — following the exact structure
      of the working `where-to-hang-a-wall-clock` guide, checked rather than
      invented.
- [x] **`/learn/bed-size-and-storage`** — "King or super king, and is
      ottoman storage worth it?" Same merge logic (size and storage are one
      buying decision, not two searches), same structure, eight real beds
      measured — regular frames and ottoman storage side by side.
- [x] **Two new tools built, not just linked to.** Checking the roadmap's
      tool-overlap flags earlier had already found `dining-set-size-
calculator` only ever matched Garden Furniture stock
      (`getProductsByCategory("garden-furniture", ...)`, confirmed in code)
      — no indoor equivalent existed. Built `/tools/dining-table-size-
calculator`, reusing the same `DiningSpaceCalculator` component
      (the seating arithmetic doesn't care whether the table is on a patio
      or in a dining room) against the indoor Kitchen Furniture category
      instead. No bed-sizing tool existed at all — built
      `/tools/bed-size-calculator` from scratch: a pure `bedSize()` function
      (`src/lib/tools/bed-size.ts`, 9 tests) plus a thin component, matching
      the codebase's existing pattern for every other calculator.
- [x] Both tools are genuinely embedded in their guide, not just linked —
      registered in `guide-tool-embed.tsx`'s `TOOLS` map and the `guideTool`
      schema enum, the same mechanism the working guides already use.
- [x] Found and fixed in passing: the `/tools` index page's own copy said
      "Ten calculators" in two places while a code comment already said
      "twelve" — neither was live-accurate before or after this pass.
      Fixed to the real count (14) and added both new tools to it.
- [x] Typecheck, lint, the full suite (1,030 tests, +9 for the new
      calculator) and a full production build all pass clean; both new
      `/tools/` routes confirmed prerendering with no errors in the build
      log.
- [x] Roadmap artifact updated to mark both as built rather than
      recommended — 26 topics remain on it.

---

## Guest checkout — the likely reason clicks weren't becoming sales (3 September)

Damien: _"we are unbelievably slowly getting more clicks and its all positive
signs but such small numbers"_ — traffic climbing, conversions still zero.
Read the actual checkout code rather than guess, and found the probable cause:
`createCheckoutSession` refused to even create a Stripe session for a
signed-out visitor, redirecting straight to `/account/login` instead — a bare
email+password form, with signup behind that requiring an email confirmation
link before the customer could even get back to paying. That is friction
inserted at the exact moment of highest purchase intent, for a brand nobody
has a reason to trust yet with an account. It is exactly the shape of bug
that produces "clicks up, conversions flat at zero."

**This reverses an explicit instruction, and Damien confirmed the reversal
before anything was touched.** The wall was not an oversight — the code
comment quoted him directly: _"checking out as a guest shouldnt be
possible."_ It existed to guarantee every order lands in someone's order
history, after his first live order was a guest checkout that showed up
nowhere in `/account/orders`. Asked explicitly whether to remove it anyway,
given a way to keep that same guarantee without the friction: **"Yes, remove
the wall."**

- [x] `createCheckoutSession` no longer requires sign-in. A signed-in visitor
      checks out exactly as before; a signed-out one pays with no
      `client_reference_id` and no pre-filled email — Stripe's own hosted
      Checkout page collects it instead, same as it always has for anyone
      Kaiku didn't already know.
- [x] **The original guarantee still holds.** `persistOrder`
      (`src/server/webhooks/stripe.ts`) now resolves an account for every
      guest order after payment: `resolveGuestOrderUserId` calls Supabase's
      `generateLink({ type: "magiclink" })` on the email Stripe collected,
      which creates the account if it's new or resolves to the existing one
      if they've ordered before — either way handing back a real user id,
      silently, with no email sent to the customer (`generateLink` only
      generates the link; nothing here sends it). The order is attached to
      that id exactly as if they had signed in. `orders.user_id` already
      references `auth.users(id) on delete set null` and the
      `orders_select_own` RLS policy is already `auth.uid() = user_id` — no
      schema change needed, this was compatible with the table from day one.
- [x] Never allowed to fail or retry a paid order over this: a failed
      account lookup logs and leaves `user_id: null`, exactly the pre-existing
      guest-checkout behaviour, rather than losing or re-triggering a charge
      that already succeeded.
- [x] Checked the UI separately: the Checkout button already just says
      "Checkout" with no sign-in-specific copy anywhere — the wall was purely
      server-side, so no interface text needed to change.
- [x] Typecheck, lint, the full test suite (1,021 tests) and a full
      production build all pass clean.
- [!] **Not verified against a live Stripe/Supabase environment.** I don't
  have test-mode credentials or a safe way to trigger a real webhook
  delivery from here. The logic is straightforward and the schema is
  already compatible, but a real test-mode checkout — place an order
  signed out, confirm it appears in Stripe, confirm the account and the
  order both exist in Supabase afterward — is worth doing once before
  trusting this fully in production.
- [-] Not built: a magic-link "view your order" line in the confirmation
  email. The account exists and is fully usable via ordinary "forgot
  password" on the email they checked out with; wiring the link itself
  into the email template touches `OrderEmailData` and the Studio-authored
  template resolver, more surface than this specific fix needed. Worth
  doing as a follow-up, not urgent.

---

## The "+VAT" Studio button had the same gap the Hill fix just found (3 September)

Checked proactively after the Hill VAT bookkeeping fix, rather than wait for
Damien to hit it on a different supplier. He didn't hand-correct
product-hill-24513's `costPrice` in a script or in raw JSON — he clicked the
**"+20% VAT" button that sits next to the Cost Price box in Studio**
(`src/sanity/components/cost-price-input.tsx`). That button is wired to every
supplier's `costPrice` field, not just Premier Housewares', but it had only
ever known how to touch `costPrice`. Click it on a product with a real
carriage cost of its own — any Hill product, or any future supplier priced
the same way — and it leaves `shippingCost` exactly where the Hill sweep found
it: raw, stale, silently wrong, with `costPriceVatCorrected: true` on the
document actively vouching that it's fine.

- [x] The button now corrects `shippingCost` by the same VAT rate in the same
      click, whenever one is set. For Premier Housewares (`shippingCost`
      always 0 — checked directly, 0 of their products carry a nonzero
      figure) this is a harmless no-op; for Hill, or any future supplier
      billed the same way, it closes the exact gap Damien just found by hand.
- [x] The button now reads **`supplierVatRate`** per product instead of
      assuming Premier's flat 20% — it was already wrong to hardcode that
      for a button live on every supplier's field.
- [x] Field description and button tooltip corrected to stop naming Premier
      Housewares specifically; both are supplier-agnostic in practice and
      were only ever documented as if they weren't.
- [x] Typecheck, lint and the full suite (1,021 tests) all still pass.

---

## Furniture To Go approved — nine bathroom sets imported (3 September)

Damien: _"furniture to go has accepted us too so we have plenty of bathroom
products now"_, with a screenshot of their trade site's Bathroom category
page. Bathroom was the thinnest department on the site — Mirrors (6 live) and
Storage (11 live) either side of two fully empty categories (Towel Rails,
Lighting) fixed out of the nav on 3 September. Nine substantial multi-piece
furniture sets is a real change to that.

`scripts/import-furniture-to-go-bathroom-sets.ts`, data in
`scripts/data/furniture-to-go-bathroom.ts`:

- [x] **9 five-piece bathroom sets** imported into Bathroom Storage — one each
      from Ipsarion, Ice Cave, Lokko and Alice Springs, five finishes from
      Veris (their flagship line). SKU, EAN (→ `gtin`, for Google Shopping),
      packed carton dimensions, weight, box count, the five pieces per set,
      and one image each, all from Furniture To Go's own public product pages.
- [x] **Carriage confirmed in writing, not inferred — a first for this
      account.** Furniture To Go publish "free next-day delivery" and "no
      MOQ" as their own trade terms, dropshipping direct to the customer.
      Recorded on the supplier record as `shippingRule.kind: "included"` with
      the source quoted in `notes`, so `audit-supplier-readiness.ts` stops
      flagging this supplier BLOCKED the moment a price exists.
- [-] **No price, no description.** Trade prices are hidden behind the account
  login, same wall as every other supplier on this account — costPrice is
  null on all nine until you paste the trade list. Descriptions are yours
  to write or ask for, same as Mercia.
- [-] **Individual cabinets, mirrors and under-sink units not imported** —
  Furniture To Go sell roughly 30 more SKUs across those three category
  pages, sold separately from the five-piece sets. Left for a follow-up
  pass; the nine sets are the hero, category-defining products.
- [-] **One SKU deliberately skipped**: their Ipsarion set has two URLs
  (`80FIPQZ111120p1` and `80FIPQZ121120p1`) with identical dimensions,
  weight and finish — almost certainly the same physical product under
  two catalogue SKUs from a site migration, not two colourways. Only the
  unambiguous one is imported, rather than risk a duplicate listing.
- [x] Caught and fixed before it reached Sanity: the first version of the
      title-shortening logic collapsed "Artisan Oak with Light Grey doors"
      and "Artisan Oak with Sage Green doors" to the identical title and slug
      — two different products would have fought over one URL. Fixed by
      writing each finish's short form by hand instead of deriving it, plus a
      hard duplicate-slug check that exits before writing anything if it ever
      recurs.

---

## The Hill reprice computed VAT correctly and then didn't write it down (3 September)

Damien, from his own Hill Interiors checkout for the Provence 4 Seater Lounge Set
(subtotal £1160, delivery £59.99, VAT £244, total £1463.99): _"another
mistake!! you knew the shipping and vat rules for hill interiors. the cost
specific to each supplier needs to be added up in the cost price!"_

Right, and not a new mistake — a repeat of one. `reprice-hill-interiors-with-
carriage.ts` (2 September) worked out the VAT arithmetic correctly and used it
to set the right `price` on every product it touched. It never wrote the
VAT-corrected cost and shipping back onto the product's own `costPrice` /
`shippingCost` fields — only `price` was patched; the corrected figures went
into the `priceAdjustment` audit trail and nowhere else. Every margin tool in
this codebase (`audit-thin-margins`, `audit-and-fix-margins`, `margin-report`,
`audit-full-catalogue`, `apply-supplier-shipping-rules`,
`audit-published-catalogue-readonly`) reads `costPrice` + `shippingCost`
straight off the product, so all of them have been overstating margin on every
repriced Hill product by exactly the VAT withheld.

`scripts/fix-hill-interiors-vat-bookkeeping.ts`, checked against the immutable
`priceAdjustment` trail rather than guessed:

- [x] **116 of 192** recorded adjustments had never reached the product they
      described. `costPrice` and `shippingCost` corrected in place on all of
      them, flagged `costPriceVatCorrected: true` per the convention
      `fix-premier-housewares-margins.ts` already established, so nothing
      downstream can double-apply the VAT.
- [x] **56 products were priced under an earlier no-VAT pass and never
      revisited** — a real pricing gap, not just bookkeeping. Once VAT is
      counted properly they no longer clear the floor. Repriced the same way
      the original script would have: **£1,624 further uplift**, on top of the
      £3,086.01 already applied on 2 September. Every one confirmed at or
      above its floor after — 0 exceptions.
- [x] Also caught the split-state case the flag alone would have missed:
      **product-hill-24513 already had `costPrice` corrected** (Damien fixed
      it himself, or via the "Add supplier VAT" Studio action, after spotting
      the discrepancy) but `shippingCost` was still raw. A flag-only check
      would have skipped it as "done". Two more products had the identical
      split. Fixed by checking shipping independently against Hill's own
      published carriage bands rather than trusting the cost flag for it.
- [-] **product-hill-24513 itself excluded from this run.** Damien: _"if your
  talking about provence 4 seater its correct ffs"_ — left exactly as he
  has it. `shippingCost` on that one still reads the raw £59.99, not
  £71.99; flagged to him once, not acted on, since he said it's correct.
- [x] 218 products checked, 0 left below floor, 0 skipped except 12 with
      genuinely unknown carriage (unchanged from before).

### The standing lesson

A script that computes the right number in a local variable and never writes
it to the field every other tool reads is a bug that looks finished. Before
calling a pricing or margin fix done, check what it wrote to the _product_,
not just what it logged or what it used to compute `price` — the same
`costPrice`/`shippingCost` shape recurs across every supplier on this account,
so this exact failure mode is worth checking for on any future repricing pass
before it ships, not after Damien's own invoice catches it.

---

## Profit first, priced as close to the market as the floor allows (2 September)

Damien, after seeing that profitability and being cheapest cannot both hold:
_"okay no worries we will just be profitable and not compete but try and stay
close to competitors prices."_

That resolves the tension. Profit is non-negotiable, so `VAT_ON_COST` is now
`true` in the reprice and every product goes to the **exact minimum** that clears
its tier floor and not a penny above — which is what "as close as possible"
means once profit wins.

- [x] 116 of 139 Hill products raised, £3,086 of uplift, VAT counted on both
      cost and carriage, each with its own `priceAdjustment` audit document

### Where that lands against the market

| Product                | Was    | Now    | Cheapest rival | vs market               |
| ---------------------- | ------ | ------ | -------------- | ----------------------- |
| Antique Gold Hare Lamp | £76    | £91    | £99.95         | **−9%, still cheapest** |
| Capri Foot Stool       | £276   | £331   | £320           | +3.4%                   |
| Provence 4 Seater Set  | £1,259 | £1,511 | £1,295         | +17%                    |
| Garda Juniper Vase     | £124   | £149   | £128.99        | +15.5%                  |
| Vellis Wingback        | £374   | £449   | £355.81        | +26%                    |
| Luxe LED Candles       | £23    | £27    | £19.99         | **+35%**                |

`scripts/hill-market-gap.ts` reports this on demand, flagging anything more than
10% above the cheapest rival found.

### Two of them are no longer pricing decisions

At £27 against £19.99 the candles will not sell, and the damage is wider than one
product: a shopper who spots a 35% gap concludes the whole shop is expensive.
Same on the Vellis at +26%.

For those the choice is buy differently or delist. Hill's volume tier is 77.6% of
dropship and removes carriage on a £500+ order — the candles land at £9.18 that
way and make 51.6% at the market's own £19.99. Unsellable to best-margin line, on
purchase terms alone.

### The honest limit

**Only 6 of the 116 repriced products have a market reference.** The other 110
went up with no idea where the market sits. The highest-value ones are worth
checking before relying on them — the £556 Delphine dresser, the £750 Large Black
Multi Shelf Unit, the £829 Light Up Bookcase.

---

## I rewrote damaged descriptions instead of recovering them — 236 restored (2 September)

Damien: _"YOUVE RUINED ALL OF MY BEST DESCRIPTIONS!!! THESE DESCRIPTIONS HAD SO
MUCH EFFORT INTO THEM THEY WERE WHAT MAKES KAIKU KAIKU."_

He is right, and the history proves it. The Himalayan Salt BBQ Cooking Plate:

| When        | Blocks | Chars            |
| ----------- | ------ | ---------------- |
| 1 Aug       | 38     | 3,576            |
| 14 Aug      | 37     | 3,571            |
| 25 Aug      | 19     | 2,488            |
| 1 Sep 09:00 | 3      | **379**          |
| 1 Sep 19:47 | 6      | 648 (my rewrite) |

The gutting happened between 25 August and 1 September, before this session. **My
part is what came next and it is the worse half:** I scanned for "thin"
descriptions, found hundreds of 300–500 character stubs, and wrote new short
factual ones from spec data. The originals were in Sanity's history the entire
time. I treated damaged content as missing content and never once checked whether
there was something to restore.

### And I did fresh damage today, which the exhaustive sweep identified

`scripts/fix-deflections-and-swapped-faqs.ts` dropped **114 blocks** in its first
run: a paragraph consisting only of a "consult the manual" deflection was
removed, and a heading left with nothing beneath it went with it. Both are
defensible in isolation. Together they cut real paragraphs out of roughly thirty
descriptions — the sweep found them timestamped `2026-09-02T10:38`, which is that
script's own run. The Morano 8 Bulb Champagne Glass Chandelier went from 2,889
characters to 1,112.

- [x] Block deletion and the orphaned-heading prune are both **disabled**, with
      the reasoning written into the file. A script that edits these descriptions
      may rewrite text in place but must never delete structure: a rewrite shows
      in a diff, a deletion does not, and the costs are asymmetric — a leftover
      empty heading is untidy, a deleted paragraph is gone until someone digs it
      out of history. Which is what happened.

### Recovered

`scripts/recover-descriptions-from-history.ts` samples every product across eight
historical snapshots, takes the revision with the most editorial text, and
restores it where it is materially richer than what is live. It never shortens
anything, so descriptions written to fill a genuine blank survive.

- [x] **487 products restored in total, across three passes.** Damien: "youve
      done it to loads of prodc ... products not just these" — he was right at
      each step: - 236 on the first pass (986,787 chars), which required history to be 1.5x
      longer AND +400 chars, so it skipped everything shortened moderately - 156 more once those thresholds dropped to 1.01x / +50 chars - 95 more from `scripts/recover-descriptions-exact.ts`, which walks every
      product's actual revision list instead of sampling eleven dates, because
      a description that was rich only _between_ two snapshots was invisible to
      the sampling pass
- [x] Verified after: min 645 chars, p10 1,254, median 1,813, p90 5,662, max
      11,808. Total description text 2,452,766 chars. Only 5 products under 800.
- [x] **Re-ran the exhaustive sweep after restoring: 0 products with a richer
      version anywhere in their history.** The recovery is provably complete, not
      complete-as-far-as-I-checked, which is the distinction that failed twice.
- [x] Total description text across the catalogue now 2,380,581 chars; median per
      product 1,751, p90 5,662
- [x] Salt plate back to "Designed for Authentic Outdoor Cooking" at 2,526 chars;
      Tamarind & Resin table back to "Designed to Make a Statement" at 2,590

### One judgement made, and it is reversible

Every historical description ends with a Delivery & Returns section quoting
carriage that is no longer true — the salt plate's said "0–99g: £2.79 / 2kg+:
£5.99 / Northern Ireland 2kg+: £14.50" while the site promises free UK delivery
and the buy box above renders the real terms. Restoring that verbatim would have
put wrong prices back on 200+ pages. So the editorial content came back exactly
as written and the delivery tail was held back; every dropped heading is listed
in `docs/change-log/2026-09-02-recover-descriptions.json`.

- [!] Some restored descriptions carry keyword-stuffed runs — the White Ceramic
  Pot Table Lamp is 265 blocks, of which most are single phrases ("Living
  rooms / Bedrooms / Master bedrooms / … Boutique hotels / Show homes /
  Premium rental properties"). That is Damien's content and it is restored
  verbatim rather than edited on my judgement, but it reads as spam to a
  search engine and one description also uses an `h1`. Worth trimming — his
  call, not mine.

---

## 406 products were invisible on the site (2 September)

Damien: _"i keep finding products which arent listed on the site but there
published on sanity. fix this ... we shouldnt have any invisible products."_

Three listing queries defaulted to limits **below the catalogue size**:

| Query                                                | Old cap | Actual               | Invisible          |
| ---------------------------------------------------- | ------- | -------------------- | ------------------ |
| `getAllProducts` — /shop/all and every category page | 500     | 906                  | **406**            |
| `getProductsByDepartment` — room pages               | 200     | 230 (Outdoor Living) | **30**             |
| `getProductsByCategory` — category pages             | 200     | 138 (largest)        | 0, not yet         |
| `getProductParams` — generateStaticParams            | 200     | 906                  | 0 (ISR covered it) |

The cap itself was defensible — the comment says a 10,000-product store should
not turn `next build` into a full-catalogue crawl. Defaulting _below the actual
catalogue_ was not, and nothing anywhere reported that a list had been cut short,
which is why this was found one product at a time.

- [x] All four lifted to a shared `LISTING_QUERY_CEILING` of 5,000
- [x] `warnIfTruncated` logs an error whenever a listing query returns exactly its
      limit — the only observable signal that a cap has bitten. Silent truncation
      is what made this invisible for weeks.

---

## Merchant Center prices are stale because the feed cannot be fetched (3 September)

Damien: _"our prices havent updated on merchant centre!! lots of products passed
review."_

### The data is right; delivery to Google is not

| Product                           | Merchant Center shows | Sanity holds |
| --------------------------------- | --------------------- | ------------ |
| Luxe Natural Glow S/2 LED Candles | £19.00                | **£27**      |
| Glass Candle Holder               | £32.00                | **£40**      |
| Silver Punch Faced Candle Holder  | £35.00                | **£43**      |
| Large Frosted Eucalyptus Wreath   | £19.00                | **£23**      |

SKUs match exactly (`KK-CAND-LUXE-WHT-001` etc.), so these are the same items.
The feed route reads `product.price` live from Sanity with a one-hour ISR, so it
would serve the new figures the moment it is read.

### What is in the way

**Every request to the site returns HTTP 429 with a "Vercel Security Checkpoint"
page** — the homepage included, so this is site-wide and not specific to the
feed. That is Vercel Firewall Bot Protection, which was published on **1
September** as the fix for the four-figure bot-traffic bill. The same window in
which the prices stopped moving.

Ruled out on the way:

- [x] `src/proxy.ts`'s route allowlist is not the cause — `api` is allowlisted
      _and_ `/api/` is excluded from the matcher entirely.
- [x] The feed's own ISR is one hour, so it cannot hold a price from two days ago.
- [x] The revalidation webhook now clears the feed path too (fixed yesterday), so
      a publish no longer leaves it stale.

### What I cannot prove from here, and the check that settles it

Vercel verifies good bots by IP and reverse DNS, not by user agent, so my request
with a Googlebot user agent would be challenged whether or not the real crawler
is. **I cannot tell from outside whether Google's feed fetcher is being
challenged or simply has not re-fetched yet.**

- [!] **Damien: Merchant Center → Products → Feeds → the feed's fetch history.**
  It shows the last successful fetch time and any fetch error. A fetch error
  or a last-fetch date before 2 September confirms the checkpoint is the
  cause.

### The surgical fix if it is confirmed

Do **not** turn Bot Protection off — it is there for a reason that cost real
money. Add a Vercel Firewall **bypass rule scoped to the feed path only**:

    Path starts with  /api/feeds/     ->  Action: Bypass / Allow

That leaves the protection on every page a bot could actually abuse, and stops
the one machine-readable endpoint that is _supposed_ to be read by a machine from
being challenged. Merchant Center's fetcher does not execute JavaScript, so it
can never solve a challenge.

Worth doing regardless of the diagnosis: a feed behind a JS challenge is a
permanent liability, and the same applies to `/sitemap.xml` and `/robots.txt`.

---

## Mercia outdoor kitchens imported (3 September)

Damien: _"import the mercia garden products i sent you ... its not many products
i want from them apart from there outdoor kitchen sets."_

Three drafts created in the existing **Outdoor Kitchens** category, every fact
taken from Mercia's own product pages, trade prices from Damien's logged-in
screenshots:

| Product                        | SKU            | Trade (inc VAT) | Mercia RRP | Images |
| ------------------------------ | -------------- | --------------- | ---------- | ------ |
| Trent Outdoor Kitchen          | ESDXL21PT056K  | £804.00         | £999.99    | 3      |
| Ultimate Trent Outdoor Kitchen | ESDXL21PT056K2 | £1,098.00       | £1,499.99  | 3      |
| Pressure Treated BBQ Table     | ESDXL21PT048BR | £264.00         | £349.99    | 1      |

- [x] Images downloaded from Mercia and uploaded to Sanity with alt text
- [x] Dimensions, materials, storage layout, guarantee terms and assembly reality
      captured as specs — including that the BBQ table's 15-year anti-rot
      guarantee is conditional on a waterproof topcoat within 14 days and
      annually after, and that it needs two people to build
- [x] Supplier record created for Mercia, stating plainly that **carriage terms
      are not yet recorded**, so per the readiness gate they are BLOCKED until
      the rate card is in
- [-] **No price and no description written.** Both are Damien's, and after today
  that is not a line to go near. The import sets up what a description needs
  to be written _from_.

### The pricing tension, for Damien to settle

| Product        | Trade  | 20% floor needs | Mercia RRP                  |
| -------------- | ------ | --------------- | --------------------------- |
| Trent          | £804   | £1,025          | £999.99 → **£25 above RRP** |
| Ultimate Trent | £1,098 | £1,399          | £1,499.99 → £101 under      |
| BBQ Table      | £264   | £337            | £349.99 → £13 under         |

Two of the three clear the floor comfortably below Mercia's own retail price. The
standard Trent does not: at 20% it lands £25 above RRP, and at the 17% small-tier
floor it would be £987, just under. Which floor applies to a £1,000 product is
his call.

---

## The four imports Damien ordered, 1 and 2 done (3 September)

Damien: _"i want these products imported too"_, then the order:
_"1. hill interiors 2. mercia 3 and 4. aosom"_.

### 1. Hill Interiors garden furniture sets — done, priced, live-ready

Five sets into Garden Furniture, with descriptions and FAQs written, images
uploaded, real specs, and carriage resolved from Hill's published band table.

| Set                               | Code  | Trade  | Carriage | Kaiku  | Market found                                       | Position              |
| --------------------------------- | ----- | ------ | -------- | ------ | -------------------------------------------------- | --------------------- |
| Capri Large Corner + Coffee Table | 23913 | £1,682 | £69.99   | £2,679 | £2,409 Felker · £2,805 Green&Gable                 | mid                   |
| Provence 4 Seater Lounge          | 24513 | £1,160 | £59.99   | £1,866 | £2,399.95 Haddon                                   | **cheapest, -£534**   |
| Amalfi Large Corner               | 23912 | £1,856 | £84.99   | £2,968 | £2,799 eFurn · £2,992 StyleOurHome · RRP £3,999.95 | mid, £1,032 under RRP |
| Amalfi Corner + Riser + 2 Stools  | 23914 | £2,668 | £84.99   | £4,209 | £4,131 Luxe · £4,433 · £5,650                      | near cheapest         |
| Capri Corner + Riser + 2 Stools   | 23099 | £2,726 | £84.99   | £4,298 | £3,387 JDC · £7,308 Haffertys                      | mid                   |

- [x] Imported as drafts with 4–6 `h3` sections each (1,277–2,165 chars) and 7–9
      FAQs, in the recovered Kaiku voice — `scripts/import-hill-garden-furniture-sets.ts`
- [x] 17 images uploaded across the five, alt text written
- [x] Carriage resolved per set from Hill's published bands: £384.95 total, all
      two-man. The customer pays £0 shipping, so this is cost of goods every time.
- [x] **Priced** at Damien's 20% net floor — the same arithmetic the other 139
      Hill products sit on, so the range stays internally consistent —
      `scripts/price-hill-garden-furniture-sets.ts`
- [x] SEO meta title and description written for all five
- [x] Competitor prices checked live **before** pricing, not after. All five land
      inside the market range; three are at or below the cheapest retailer found.
- [!] The floor charges **20% VAT on trade with no reclaim**. If Kaiku is VAT
  registered and reclaims input VAT, the true floor drops to £1,554–£3,581 —
  about 17% lower — and Kaiku undercuts every retailer on all five. Worth
  settling before any sale campaign.
- [!] Buying at Hill's **volume** tier instead of dropship saves **£2,262 across
  these five sets alone**. At these order values that is the highest-leverage
  supplier conversation on the account.
- [-] Left as drafts. Publishing is Damien's.

### 2. Mercia metal sheds — done, and they do not clear the floor

Three sheds into **Outdoor Storage, which had no published product in it at all**.
`scripts/import-mercia-metal-sheds.ts`.

| Product              | Brand  | Trade (inc VAT) | Market  | Net at market | 20% floor needs      |
| -------------------- | ------ | --------------- | ------- | ------------- | -------------------- |
| Globel 6x3 Apex      | Globel | £246.00         | £279.99 | 10.6%         | £314 → **£34 above** |
| Globel 6x4 Pent      | Globel | £254.40         | £318.99 | 18.7%         | £325 → **£6 above**  |
| Absco 7x3 Bike Store | Absco  | £350.40         | £399.00 | 10.6%         | £447 → **£48 above** |

- [x] Imported as drafts with 5 `h3` sections each (2,506–2,743 chars), 7–9 FAQs,
      12–14 spec rows, full published dimensions, 16 images uploaded
- [x] Brand records created for **Globel** and **Absco** with written descriptions
      — Absco is Australia's largest steel shed maker, 20-year warranty. This is
      the "companies which sell famous brands" route working through Mercia.
- [x] Market prices checked live: the market price for these sheds **is** Mercia's
      own RRP. There is no headroom above it.
- [!] **No price written on any of the three.** Two cannot clear the 20% floor at
  the price the entire market sells them for, and Mercia's carriage is still
  unrecorded — a palletised kerbside metal shed is £30–£60, not a £7 parcel,
  and any of it turns the Apex and the bike store negative.
- [!] The honest read on the Mercia account: the **outdoor kitchens (20–27% trade
  discount) are the profitable half; the metal sheds are not**. They become
  viable only if Mercia's carriage is genuinely free to Kaiku and Damien
  accepts ~10% on them as a category-filling loss leader. That is his call and
  it needs the rate card first.

### 3 and 4. Aosom — blocked, and this is what unblocks it

The ten Outsunny storage boxes and the smokeless fire pit cannot be imported yet.
Three inputs are missing and none of them is something I can work out:

1. **The per-item trade prices.** I recorded only the range from the grid Damien
   screenshotted (£19.20–£87.47), not the price against each box. Aosom's own
   site is behind Akamai and returns 403 to any fetch — I have not tried to get
   round that and will not.
2. **Which ten boxes.** Same reason. Outsunny's range runs 93L to 627L across
   plastic, galvanised steel, PE rattan and bench-seat variants, at £29.99–£189.99
   retail. Importing ten guessed ones would be worse than importing none.
3. **Product images.** Aosom's image CDN filenames only appear on the product
   pages, which are the pages that 403. Ryman, Studio and Littlewoods all block
   fetches too. A product without an image is not sellable.

And a fourth that blocks pricing even once the above land: **Aosom's carriage
terms are still unrecorded on 81 of their 103 products.** The fire pit's trade
price I do have (£14.33), and it still cannot be priced honestly without them.

- [!] **To unblock: paste the storage-box grid** — product name and trade price
  per row is enough. `scripts/import-mercia-metal-sheds.ts` is the working
  template; the same script shape takes a table and does the rest.
- [!] Aosom carriage terms remain the single highest-value supplier input
  outstanding. They gate these 11 products **and** the 81 existing ones.

---

## Empty categories were linked from every page (3 September)

Found while checking where the Aosom boxes would land, and fixed. Three
categories hold nothing at all — **Rugs**, **Towel Rails** and **Lighting
[Bathroom]** — and the catalogue has no product anywhere that belongs in any of
them, so this is a real hole rather than a filing mistake.

The bug was what the site did with them. The category route already sets
`noindex` when the count is zero, and the sitemap already excludes them. The
navigation did not:

- The **shop mega menu**, which renders on every page, listed categories filtered
  only by room. Rugs, Towel Rails and Bathroom Lighting were site-wide links into
  a page holding nothing but its empty state.
- The **room accordion** (`/shop`, `/shop/room/<room>`) did the same, and labels
  each tile with its own product count — so Bathroom showed two tiles reading
  literally "0 Products" and Living Room a third.

- [x] `shoppableCategories()` added next to `categoryInRoom` in
      `src/lib/sanity/category-rooms.ts`, with the reasoning in-file
- [x] Wired into `shop-mega-menu.tsx` and `collection-index.tsx`
- [x] The **active** category is always kept, whatever its count — a bookmark to
      an empty category still renders that page with its hero, breadcrumb and
      empty state, rather than a nav that disagrees with the page in front of you
- [x] 7 tests in `src/lib/sanity/category-rooms.test.ts`; full suite 1,021 passing
- [-] Rugs stays empty deliberately — Damien on Viva: _"there rugs are shit and
  out of stock"_. Towel Rails and Bathroom Lighting are genuine catalogue
  gaps, and Premier Housewares carry neither.

### Correction to an earlier note in this ledger

An earlier entry read that Outdoor Storage "holds 4 products at £40, £49, £87.40
and £148.80". That is right, and a check I ran today saying the category was
empty was wrong: those four are Reclaimed Collection pieces cross-listed through
`additionalCategories`, and my query filtered on `category._ref` only.
`getProductsByCategory` honours `additionalCategories` (product.ts:287), so they
do render. Outdoor Storage is thin with no anchor above £250, not empty.

### One dead record, flagged not deleted

`supplier-aoson` (name "AOSON", created 31 July) is a typo duplicate of
`supplier-aosom` ("Aosom"). It has no other fields and **nothing references it**.
Left in place rather than deleted — it harms nothing, and removing supplier
records off my own initiative is not where trust should be spent today. Worth one
click in Studio, because a duplicate in the supplier list is how a product ends
up filed against the wrong carriage terms.

---

## The four ideas from the usage gap, researched (2 September)

Full write-up appended to `docs/research/supplier-and-brand-shortlist.md`.

### Famous BBQ brands: the brands are closed, the distributor idea is not

Weber and Big Green Egg both run hand-picked authorised-dealer networks, not open
trade programmes — neither will take a new online-only retailer. Reachable and
still famous: **Ooni** direct (£199–£799, far more open to online retail) and
Char-Broil through distributors such as Ambar.

Damien's own framing — _"partnerships with companys which sell famous brands"_ —
is the better idea, and **UP.Direct** is exactly that: a UK B2B platform carrying
Salter, Beldray, Russell Hobbs, Progress, Intempo, Giles & Posner and Kleeneze,
1,000+ products, minimum order **2 cartons**. Far softer than Premier's £350.

- [!] **The trade-off to decide before signing.** Those are value brands at Argos
  and Tesco price points. They give real brand names and instant breadth, and
  they pull directly against the premium positioning problem. A Russell Hobbs
  kettle beside a £6,500 sauna reads as a marketplace, not a curated shop.
  Works if confined to its own Heating & Cooling or Home Appliances
  department, or if only the top of the range is taken.
- Beldray, Progress, Kleeneze and Intempo are all Ultimate Products plc — one
  relationship, not seven.

### AC units: a real gap

**0 products** match air conditioning; one fan at £53 and three heaters at
£129–£219. It is the seasonal mirror of Fire Pits & Heating, which has 21. High
demand and high search volume, available via UP.Direct's Heating & Cooling or
Aosom. Caveat: portable AC is bought on spec comparison, not curation — treat it
as traffic, not as brand.

### Electric recliners: the best of the four

Nothing matches "recliner" at all, while the three armchairs in the catalogue sit
at £424, £449 and £668 — the price point is already proven in that department.
Electric recliners run £400–£1,500, carry real margin, and are a considered
purchase where a rich description and a buying guide change the decision, which
is exactly where this site is now strong.

### The Aosom storage boxes: depth, but the wrong direction

The grid Damien sent runs £19.20–£87.47. Outdoor Storage today is 4 products at
£40–£148.80 and was already flagged as having no anchor above £250. Eight boxes at
£19–£87 would add depth and make the positioning worse — median down, ceiling
unmoved.

- [-] Recommend **top of their range, not the volume**. The category needs
  something at £300–£600, not more sub-£90 boxes.
- [!] Aosom carriage is still unrecorded on 81 of 103 products, so nothing from
  them can be priced honestly yet.

### Order recommended

1. Electric recliners — new category, proven price point, plays to the site's
   strengths
2. Ooni — famous, reachable, right band
3. AC units — real gap, treat as traffic
4. UP.Direct — only in its own department, and only after deciding whether value
   brands belong here

---

## Mercia is the approved brand, and a supplier onboarding list (2 September)

Damien: _"im approved by mercia but not harvia or auroom that was just
placeholder."_ My Harvia recommendation was wrong — those two brand records are
aspiration. Mercia is the real relationship.

Both briefs in `docs/research/supplier-onboarding.md`.

### Mercia is a good fit for the gap

UK manufacturer of timber garden buildings, self-described market-leading
dropship supplier. Range covers exactly the high-ticket end the catalogue lacks:

| Range                               | Typical retail |
| ----------------------------------- | -------------- |
| Overlap and standard sheds          | £200–£300      |
| Summerhouses                        | £825–£990      |
| Log cabins                          | £825–£2,587    |
| Insulated garden rooms, 100mm walls | above cabins   |

It also sits beside what already sells best. The eight dearest products in the
shop are seven saunas and a bookcase, £3,263–£6,500. A £2,587 log cabin is the
same customer, the same considered purchase, the same delivery and installation
profile — and Sauna is the department with the deepest copy and tools already
built.

- [ ] **No garden buildings coverage exists at all** — no department, no
      category. Proposed new **Garden Buildings** department after Outdoor
      Kitchen: Sheds, Summerhouses, Log Cabins, Garden Rooms & Offices,
      Greenhouses, Playhouses. Deliberately **not created yet**: Damien's own
      complaint was empty categories, so these get created with their SEO
      introduction, buying guidance and FAQs at the same time as the products,
      the way all 49 existing ones now are.
- [!] Mercia's terms are not published — handled in conversation. The question
  list is the conversation.
- [~] Their "ready painted buildings and home installation" services are upsells
  with real margin and need modelling as options, not buried in a
  description.

### The onboarding list, so this stops happening

Hill, Premier and Aosom were all onboarded without their carriage terms being
captured. With more suppliers coming, that is the failure mode to close. The
brief has 19 questions to ask before looking at a range, grouped as carriage,
VAT, pricing tiers, and data/operations — every one of them derived from
something that has already gone wrong here:

- carriage per order or per item (the whole margin on a £20 product)
- the exact rate table, not a summary (my two-band inference from a screenshot
  was wrong; Hill publish ten bands)
- minimum despatch value (Hill will not ship below £200 at all)
- surcharge areas and service exclusions (we currently take money for orders
  two-man delivery cannot reach)
- which pricing tier we are being quoted (Hill's dropship is their dearest —
  wholesale is 86.2% of it, volume 77.6%)
- whether the feed carries weights (a weight-banded rule is unresolvable without
  one, which is why Hill still has one product with unknown carriage)

And the rule underneath all of it: **a missing carriage figure is not zero, it is
unknown, and a margin calculated over it is fiction.** That is precisely how
Hill's carriage came to be recorded as free.

---

## The famous brand partnership is already half set up in Sanity (2 September)

Damien: _"aosom can fill in some more products but i want the higher margin stuff
too. we need a famous brand partnership or more suppliers."_

Full shortlist in `docs/research/supplier-and-brand-shortlist.md`.

### 897 of 906 products are branded Kaiku

There is no third-party brand in the catalogue except SaunaPlunge, at 8 products.
But three brand records exist with **zero products attached**:

| Brand                      | Products | What it is                                                           |
| -------------------------- | -------- | -------------------------------------------------------------------- |
| **Harvia**                 | 0        | Largest sauna and steam manufacturer in the world. Finnish, listed.  |
| **Auroom**                 | 0        | Premium Latvian sauna cabins, the design end.                        |
| **Mercia Garden Products** | 0        | UK timber garden buildings, runs an active trade dropship programme. |

Harvia sits in the highest-value department in the shop — Sauna is £2,813–£6,500
— and is the one name a serious sauna buyer already searches for.

**Correction, from Damien:** _"im approved by mercia but not harvia or auroom
that was just placeholder."_ So Harvia and Auroom are aspiration, not
relationships, and the recommendation to lead with Harvia was wrong. **Mercia is
the approved one**, and it is the lead. The point about branded search volume
still stands — 897 of 906 products branded Kaiku means no branded search demand
at all — but Mercia is the brand actually available to act on.

Two reasons this beats approaching a lifestyle brand cold:

- **The category is already built.** Sauna and Cold Plunge have the deepest copy,
  the buying guides and the size calculators. A Harvia range lands into a section
  made for it.
- **Branded search volume.** Nobody types "Kaiku sauna"; people type "Harvia
  sauna UK". An own-brand-only catalogue has no branded search demand at all,
  which is a ceiling on traffic that no amount of product count lifts.

### On famous brands generally

Cox & Cox, Neptune and Garden Trading appear in no UK dropship or trade
directory, and that is deliberate — they are vertically integrated DTC
businesses whose brand _is_ the margin. Where partnerships are available it is
**manufacturer** brands, and they come with MAP/RRP enforcement (the name and
credibility, not price freedom), site approval, and often stocking rather than
dropship. Site approval is a much easier conversation than it was a week ago:
906 real descriptions plus category buying guides reads as a real retailer.

### Rugs can be filled this week from an existing account

**Premier Housewares already sells 86 rugs.** Existing account, VAT position
known, no onboarding. It will not supply premium anchors — Premier is a value
supplier — but an empty category is a worse problem than a mid-priced one. For
the anchor end: The Real Rug Company (direct dispatch), Think Rugs (live stock,
automated ordering).

### Planters need Adezz

The recognised premium planter brand, corten and fibreglass, built for UK
weather — exactly the £250–£800 anchor missing from a category with 86 products.
Via trade distributors: Riverhill Garden Supplies, Yard Garden Style, or Taylor
Made Planters, whose trade terms include **free UK mainland delivery**. That term
matters more than the price list; its absence is what cost £1,250 on Hill.

### Aosom: not more products, more of their top of range

Five of Aosom's six biggest categories here are ones flagged as having no anchor
above £250, and Aosom's stock in them tops out at £249 — so more Aosom lines in
those categories worsens the positioning. The exception is the one that counts:
**Aosom Garden Furniture is £387–£938, median £590**, genuinely the premium end.

- [!] Aosom carriage terms still unrecorded — 81 of their 103 products have no
  carriage figure, so none of this can be priced honestly until that lands.

### Order recommended

1. Harvia — famous brand, highest-value department, record already exists
2. Premier Housewares rugs — existing account, fills an empty category
3. Adezz via Riverhill or Taylor Made — gives Planters its ceiling, carriage included
4. Mercia — record exists, active trade programme, high ticket
5. Aosom top-of-range only, once carriage terms are recorded
6. A bathroom supplier — still to find, and the worst-positioned department

---

## Breadth as the edge, and where the catalogue does not look premium (2 September)

Damien has set the strategy: _"product count is going to be our edge for a fresh
dropshipping brand ... so im going to find more suppliers"_ — then, immediately,
the problem with it: _"we have empty categories or categories with the low budget
products which isnt what you expect we need more premium products and brands."_

Full sourcing brief in `docs/research/premium-positioning-gaps.md`.

### The finding

**Breadth is currently concentrated in the cheap end.** The four largest
non-furniture categories are the four with the lowest medians:

| Category             | Products | Median | Top  |
| -------------------- | -------- | ------ | ---- |
| Planters             | 86       | £60    | £246 |
| Wall Clocks          | 36       | £53    | £199 |
| Bathroom Accessories | 35       | £27    | £49  |
| Water Features       | 27       | £45    | £120 |

That is 184 products — a fifth of the catalogue — so a shopper browsing the
widest parts of the shop sees the cheapest things in it. The furniture
categories are genuinely well positioned by contrast: Sofas £272–£2,078, TV
Units £139–£1,591, Kitchen Furniture £129–£2,459.

So count as the edge is sound, but count and cheapness are the same axis right
now. The fix is not fewer cheap products, it is more expensive ones in the
categories that already have depth.

- [~] 3 empty categories: Bathroom Lighting, Towel Rails, Living Room Rugs — all
  three already carry SEO copy, buying guidance and FAQs, so they rank the
  moment stock lands
- [~] 13 categories with nothing above £250 to anchor the range
- [~] 3 categories more than 30% under £25 — Bathroom Accessories is the clearest
  case in the shop: 35 products, median £27, nothing over £49
- [~] 11 categories too thin to read as a range, of which Sauna and Cold Plunge
  are thin by nature and the rest are unsourced

### Sourcing priorities, by what would change the shop most

1. **Rugs** — empty, copy already written, high value, high margin, cross-sells
   against every furniture range we are strong in. Nothing else is as ready.
2. **Premium planters, £250–£800** — 86 products of depth with no ceiling.
3. **Bathroom entire** — lighting, towel rails, accessories above £50. Three of
   the worst-positioned entries are one room, so one supplier fixes a department.
4. **Statement lighting for kitchen and office** — thin at 5 and 4.
5. **Water features and garden lighting above £250** — both cap at £110–£120.
6. **Outdoor storage** — 4 products, top £149.

- [-] **Not** more sub-£25 decor. There is enough, it is already the loudest part
  of the shop by volume, and each new cheap line worsens the positioning
  rather than improving the breadth advantage.

### One thing to check before signing any supplier

On Hill's terms a £20 item carries £6.99 of carriage and cannot be sold at market
price at all when dropshipped singly. Cheap products only work where carriage is
included in the trade price, or where they are bought to stock. **Ask about
carriage terms before range** — that is the question that would have saved the
£1,250 on Hill.

---

## With VAT counted, the Hill range is not a pricing problem (2 September)

Damien: _"you need to account for cost prices, vat and shipping."_ Doing that
changes the answer completely.

Landed cost is `costPrice × 1.20 + shippingCost × 1.20 + card fees`. Kaiku is not
VAT-registered, so the 20% Hill add is a real cost. On that basis **116 of 139
Hill products sit below their margin floor**, and real net margin at today's
prices is 4–5%, not 20%.

On four of the six products we price-checked, **the price needed to clear the
floor is above what rivals charge**. Capri footstool: landed £258.95, floor needs
£330.12, cheapest rival £320. Provence dining set: landed £1,185.59, floor needs
£1,510.56, cheapest rival £1,295. We cannot be both profitable and cheapest —
while dropshipping.

### Why rivals can and we cannot

They are VAT-registered and reclaim input VAT. Their real cost on the Provence
set is £928; ours is £1,113.60. Same supplier, same product, 20% handicap.
Registering does not obviously fix it — registered, we would charge output VAT on
B2C sales too, which usually costs more than the reclaim returns. That trade is
not the lever.

### The lever: our costs are Hill's most expensive tier

Our recorded costs are Hill's **dropship** price. From their own pages, both
products give identical ratios — **wholesale is 86.2% of dropship, volume is
77.6%** — and a stocked order over £500 ships carriage-free.

The candles at the market price of £19.99:

| How we buy                          | Landed    | Net        | Margin    |
| ----------------------------------- | --------- | ---------- | --------- |
| Dropship, single-item order         | £20.22    | **−£0.73** | loss      |
| Dropship, three items in one parcel | £14.63    | £4.86      | 24.3%     |
| Wholesale, order over £500          | £10.20    | £9.29      | 46.5%     |
| **Volume (qty 12), over £500**      | **£9.18** | **£10.31** | **51.6%** |

Same product, same shelf price. The margin runs from a loss to 51.6% purely on
how it is bought.

### This reframes the £350 minimum

Damien was treating Premier's £350 first-order minimum as an obstacle and floated
posting unordered goods to a customer to clear it. It is the opposite. On Hill the
equivalent thresholds — £200 to despatch, £500 for free carriage — are the doorway
to the only pricing at which this range is competitive and profitable together.

- [!] **Decision for Damien:** stock the fast-moving small items instead of
  dropshipping them, and keep dropshipping the large, expensive, infrequent
  pieces where carriage is a small share of price and stock would tie up cash.
- [!] My reprice raised 76 products against dropship-cost-plus-full-carriage. If
  the buying model changes, those prices should be recomputed from the tier
  actually being bought — the script takes the cost as given, so it is one
  rerun.
- [x] `scripts/hill-viability-with-vat.ts` — read-only, sets no prices, shows
      every product at carriage carried solo, split two ways and split three ways.

---

## Competitor prices on the Hill range, and a mistake in my own reprice (2 September)

Damien: _"audit all of our competitiors ... and see if theres still enough space
to beat them all on price for each product because we were originally and i think
some should still be eligible."_

Full findings in `docs/research/hill-interiors-competitor-prices.md`.

Hill are a wholesaler, so the same products sit on dozens of UK sites under
identical names — our price is directly comparable rather than approximate.

| Product                              | Ours now | Cheapest found          | Verdict                   |
| ------------------------------------ | -------- | ----------------------- | ------------------------- |
| Provence Outdoor 4 Seater Dining Set | £1,259   | £1,295 (also £1,899.95) | cheapest by £36           |
| Capri Outdoor Foot Stool             | £276     | £320, Olivia's £410     | cheapest by £44, headroom |
| Antique Gold Hare Table Lamp         | £76      | £99.95                  | cheapest by £24, headroom |
| Garda Grey Glazed Juniper Vase       | £124     | £128.99                 | cheapest by £4.99         |
| Vellis Blue Wingback Armchair        | £374     | £355.81 on offer        | **£18 above**             |
| Luxe Natural Glow S/2 LED Candles    | £23      | £19.99                  | **£3 above market**       |

**So: yes, there is still room — but only above about £70.** From there up we are
the cheapest listing on every product checked, with £24 to £134 of headroom on
some. Below it, the reprice has pushed us above the market.

### The mistake

The reprice charged every product its **full** carriage. Hill's rates are per
**consignment** — their table bands the whole parcel by weight, so £6.99 covers
everything up to 10kg in one shipment. The same candle carries £6.99 as a solo
order, £2.33 shipped with two other small items, and nothing at all if it rides
in a parcel already under 10kg.

`shipping-rules.ts` already distinguishes `flatPerOrder` from `flatPerItem` and
documents exactly this. I used the per-item reading. It is right for a
single-item basket and pessimistic for every other, and on a £20 item the
difference is the entire margin.

- [!] **Recommend, needs Damien:** take everything raised under ~£30 back to
  market price — £23 for those candles loses the sale to a dozen retailers at
  £19.99, and being thin beats being invisible.
- [!] **Recommend, needs Damien:** fix solo orders structurally instead of with
  price. A minimum order value, a small-order handling charge, or free
  delivery over a threshold all turn the per-consignment rate into an
  advantage. This costs no sales on price, which a rise does.
- [!] **Recommend, needs Damien:** raise where there is headroom. Capri footstool
  £276 against Olivia's £410 — £310 would still be the cheapest listing by
  £10. Hare lamp £76 against £99.95, same again.

Points one and three are the same script run in both directions, so they are
quick once he picks the numbers.

### Not checked

Products whose names are generic — Light Up Bookcase, Multi Shelf Industrial
Shelf Unit — are not findable by name search and need Hill's SKU or a reverse
image search. Nine of the 76 repriced items are in that position.

---

## Where the margin is actually thin, and a postcode we cannot deliver to (2 September)

### Only 267 of 906 products can have their margin measured at all

Damien asked how many products leave minimal profit. The honest answer is that
for 639 of them nobody can say, because carriage is not recorded:

| Supplier           | Products | Carriage recorded | Shipping rule  |
| ------------------ | -------- | ----------------- | -------------- |
| Premier Housewares | 546      | **1**             | none           |
| Aosom              | 103      | 22                | none           |
| Hill Interiors     | 139      | 139               | weight bands ✓ |
| AW Dropship        | 56       | 47                | none           |
| D.I. Designs       | 54       | 50                | none           |
| SaunaPlunge        | 8        | 8                 | included ✓     |

Damien believes Premier and Aosom pricing is correct, and their _cost prices_
may well be — Premier's were VAT-corrected in August. But **Premier is 60% of
the catalogue and its carriage terms are not recorded anywhere**, so its margin
cannot be verified, only assumed. That is the same position Hill was in this
morning, and Hill turned out to be absorbing £1,250.

- [!] **Blocked on Damien:** Premier Housewares and Aosom carriage terms. One
  rate card each closes 649 products.

### Of the 267 that can be measured

- [x] 0 losing money
- [x] 0 under 10% net margin
- [x] 0 under 15% net margin
- [~] 52 under 20% net
- [~] 6 returning under £5 net on an order — two AW Dropship essential oils at
  £2.75 and £3.25 (39% and 41% margin, so the percentage is fine and the
  pounds are not), and four Hill pieces at £3.41 to £4.19

The £5 figure is mine, not Damien's — roughly what an order costs to handle
end to end. The point of separating it from the percentage is that a 40% margin
on a £6.95 bottle of oil passes every percentage floor and still returns £2.75.

`scripts/audit-thin-margins.ts`, read-only, re-runnable.

### A postcode we take money for and cannot deliver to

Hill's rate card: _"2 Man delivery service is not available in these postcodes;
BT (all), HS (all), IM (all), IV26-99, KA27, KA28, KW (all), PA15-78, PH19-50,
ZE (all)."_ Checkout accepts any GB address with no postcode logic, so a
customer in Belfast could buy the 63kg Light Up Bookcase and we would have to
unwind the sale after taking the money.

- [x] `src/lib/suppliers/delivery-zones.ts` — classifies a UK postcode into
      two-man availability and remote surcharge, with 11 tests. The district
      ranges matter: Hill exclude IV26-99, so Inverness is served and Ullapool
      is not, and only KA27/KA28 of all KA. An unparseable postcode is treated
      as unrestricted, because a wrong guess must never block a fulfillable sale.
- [x] The exclusion stated on the product page for the 52 pieces at or above
      40kg, before the order rather than after it.
- [ ] Not done: blocking at checkout. Stripe collects the address after the
      session is created, so a real block needs a postcode step before checkout
      or a validation in order handling. The page notice is the honest interim.
- [ ] Not done: the £10 remote surcharge is still unmodelled on every supplier.

### Aosom weights that cannot be right

Surfaced by the 40kg two-man threshold. These would wrongly warn on flat-pack
items, and would wreck any weight-banded carriage calculation:

- 4ft6 Double Ottoman Bed, £399 — **500kg**
- King Gas-Lift Ottoman Bed, £203.69 — **500kg**
- 4ft6 Double Bed Frame, £109 — **272kg**
- 3ft Single Bed Frame, £89 — **136kg**
- Modern Writing Desk, £69 — **80kg**
- LED Computer Desk, £59 — **60kg**

Almost certainly pallet or carton-quantity weights rather than unit weights.
Not corrected here because the real figures have to come from Aosom.

### Merchant Center: yes, the new prices flow automatically

The feed at `/api/feeds/google-merchant` is generated from Sanity on request,
so it carries whatever price is current — the repriced items will be reviewed
against their new prices, not the old ones.

- [x] One gap found and fixed: the revalidation webhook cleared the product page
      and every listing page on a price change but **not the feed**, which had
      only its own hourly ISR. So for up to an hour the landing page showed the
      new price and the feed served the old one, and a feed-versus-page price
      mismatch is one of the reasons Merchant Center disapproves an item. Worst
      possible timing is a bulk reprice, which is exactly what just happened.
      The feed path is now revalidated with the rest.

---

## Hill Interiors: real carriage bands, and 76 prices corrected (2 September)

Damien sent Hill's published rate card after my second attempt: _"so our prices
for hill interiors are very wrong."_ They were, and so was my fix.

### Three wrong figures in a row, for the record

1. The supplier record said carriage was **free**, "evidenced" by 70 of 136
   products recorded at £0. Those £0s were the unfilled default on the field —
   the data was cited as evidence for itself.
2. I replaced that with two bands, £6.99 under 30kg and £69.99 over, inferred
   from a checkout screenshot and one product page. I flagged the 30kg split as
   a guess.
3. The guess was wrong. Hill publish **ten** bands across two services, and
   £6.99 covers only the first 10kg, not 30.

### The actual rate card

| Standard courier |        | Two-man (room of choice, packaging removed) |         |
| ---------------- | ------ | ------------------------------------------- | ------- |
| up to 10kg       | £6.99  | up to 35kg                                  | £49.99  |
| 10–20kg          | £9.99  | 35–60kg                                     | £59.99  |
| 20–40kg          | £14.99 | 61–100kg                                    | £69.99  |
| over 40kg        | £24.99 | 101–150kg                                   | £84.99  |
|                  |        | 151–200kg                                   | £109.99 |
|                  |        | over 200kg                                  | POA     |

Plus £10 for the Isle of Man, Isle of Wight, Northern Ireland and the Scottish
Highlands & Islands. Kaiku's own trade orders are separate again: carriage free
over £500 by Palletways, £20 between £200 and £499.99, and **£200 is the minimum
Hill will despatch at all**.

- [x] Supplier rule rebuilt with all ten bands and the source named
- [x] `shippingCost` set on 138 of 139 products from the bands
- [x] Where they land: 108 at £6.99, 20 at £9.99, 7 at £14.99, 2 at £59.99,
      1 at £69.99
- [!] The standard/two-man split at 40kg is the one judgement left. Hill publish
  both tables and not which applies; their Capri corner set quotes the
  £69.99 two-man band, so furniture goes two-man. It is the expensive
  direction — if Hill will send a 52kg dining set standard at £24.99 instead
  of two-man at £59.99, that is £35 back on each.
- [!] Romanby Stone Round Coffee Table has no weight, so its carriage stays
  unknown. The repricing skips it rather than assuming £0, which is the
  mistake this whole pass exists to undo.

### Repricing

Damien's own tiered floor, unchanged from the one he set for Premier Housewares
— under £50: the higher of +£4 or the minimum clearing 17%; £50 and over: the
minimum clearing 20%. The difference here is what cost means. The Premier script
computed margin as (price − costPrice) / price and wrote `shippingCost: 0` into
its audit trail. True for Premier, false for Hill, so the floor is measured
against **landed** cost:

    landed = costPrice + shippingCost + (price × 1.5% + 20p)

Because the card fee moves with price, the minimum price clearing a floor has to
be solved rather than divided: `p = (c + s + 0.20) / (0.985 − f)`.

- [x] 76 of 139 products raised, £717 of uplift, every raise with its own
      `priceAdjustment` audit document recording the real carriage
- [x] 0 products now below their tier floor, verified live
- [x] Net profit across one of each: £5,195

A tier-boundary bug caught on the verification pass, not the dry run: four vases
at £49 were raised to £53 to clear the 17% small-tier floor, which put them over
£50 and made them large-tier products needing 20% — landing at 19.3%, below
their floor immediately after being "fixed". The script now settles the tier with
a short fixed point before writing.

### VAT still open

Premier Housewares invoice 20% on top and Kaiku cannot reclaim it; 542 of 546
Premier costs were corrected for that in August. **Hill has 1 of 139 corrected**,
and Hill's site says trade prices are "subject to additional VAT". Damien has not
confirmed it, so `VAT_ON_COST` in the reprice script stays `false` — inflating
139 costs by 20% on my inference would move his whole Hill range off a guess. If
he confirms, it is one flag and a rerun. Modelled: it would raise 111 of 139
products instead of 76, for £3,497 rather than £717.

### Not handled yet: postcodes we cannot actually deliver to

Checkout accepts any GB address (`allowed_countries: ["GB"]`) with no postcode
logic. Hill's two-man service **is not available at all** in BT, HS, IM, IV26-99,
KA27, KA28, KW, PA15-78, PH19-50 and ZE. So a customer in Belfast can today buy
the 63kg Light Up Bookcase and we would take the money with no way to fulfil it.
The £10 remote-area surcharge is unhandled too, on every supplier. Worth building
a postcode guard; not started.

---

## Hill Interiors carriage was recorded as free, and it is not (2 September)

Damien: _"we are currently losing money on alot of hill interiors products and
the pricing doesnt account for this."_ He is right, and the cause was in the
supplier record.

`supplier-hill-interiors` held `shippingRule: { kind: "included" }` and
`carriageIncludedInCost: true`, with this note:

> "Free delivery to Kaiku. Evidenced: 70 of 136 products already recorded at
> exactly £0 carriage and none above zero..."

**Those £0s were the unfilled default on the product field.** The data was cited
as evidence for itself. Nobody had checked Hill's actual terms.

Hill's own pages, from Damien's screenshots:

- "Hill Interiors Parcel Delivery Service — **£6.99**", next working day, small
  parcels.
- "This item can be delivered via a 2 man delivery service to GB mainland
  address only for **£69.99**" (Capri Outdoor Large Corner Set).
- Over 200kg, Hill quote per consignment and bill after the order.
- "All prices ... will be subject to **additional VAT and surcharge costs**."

Because the customer pays £0 shipping by Damien's own rule, all of that comes
out of margin.

### What it costs

Across the 138 Hill products with a cost and a weight, **£1,405 of carriage was
being absorbed invisibly** on single-item orders. Worked through with card fees
(1.5% + 20p) and carriage at +VAT:

| Product                       | Sell | Cost   | Carriage | Net        |
| ----------------------------- | ---- | ------ | -------- | ---------- |
| Small Blue Flora Planter Pot  | £15  | £7.54  | £8.39    | **−£1.35** |
| Seville Lebes Planter         | £20  | £12.26 | £8.39    | **−£1.15** |
| Luxe Ivory LED Dinner Candles | £19  | £9.86  | £8.39    | £0.27      |
| Large Conical Lattice Lantern | £29  | £19.72 | £8.39    | £0.26      |

The candles are the item in Damien's own Hill basket screenshot at £9.86.

- [x] Supplier rule replaced with the real one: weight bands, £6.99 to 30kg,
      £69.99 above, with the circular note removed and the source named
- [x] `shippingCost` backfilled on 138 products from that rule
- [!] The 30kg split is **my inference** — Hill publish both rates but not the
  threshold. Seven products sit above it (Light Up Bookcase 63kg, Multi Shelf
  Industrial 52.6kg, Provence 4 Seater 52kg, Sorelle Sofa 39.9kg, Bloom Sofa
  34kg, Saltaire 3-Shelf 32kg, Large Black Multi Shelf 30.3kg). Worth checking
  against Hill's Dropship tab, because £63 of carriage rides on each.
- [!] Romanby Stone Round Coffee Table has no weight, so its carriage stays
  unknown rather than being guessed.

### Blocked on Damien: does Hill invoice +20% VAT?

Premier Housewares does, and Kaiku is not VAT-registered so it cannot be
reclaimed — that was found and fixed in August, 542 of 546 Premier costs
corrected. **Hill has had 1 of 139 corrected.** Hill's site says prices are
"subject to additional VAT", which points the same way, but the invoices settle
it and only Damien has those.

Modelled both ways against his existing tiered floor (under £50: 17% or +£4,
whichever is higher; £50+: 20%):

|                                          | Products needing a rise | Total uplift |
| ---------------------------------------- | ----------------------- | ------------ |
| Hill prices already include VAT          | 58 of 139               | £644         |
| Hill invoices +20% on goods and carriage | 111 of 139              | £3,497       |

No repricing applied until he confirms which.

### Also: the £350 Premier Housewares first-order minimum

Damien floated sending unordered extra products to a customer to reach it. Not
worth doing — it costs the goods, the carriage and the review, and an unsolicited
parcel is a poor first impression. It is a **first-order** minimum only: one £350
stocking order of small fast-movers, held or sold normally, clears it once and
every order after has no minimum at all.

---

## Damien's Capri/Contour catch, and the 66 products it led to (2 September)

He noticed the Contour Collection 3 Drawer Console was carrying the Capri
Outdoor Foot Stool's meta title and asked whether the descriptions were wrong
too. They were worse than that.

**The Contour console had all fifteen of the footstool's FAQs.** "Is the wicker
real rattan?", "Can the footstool stay outside?", "How do I clean the HDPE
wicker?" — on a black wood hallway console. Its own title, summary and
description were correct, so nothing that looks for missing or thin content
would ever have flagged it.

Building a detector for that pattern found the mirror image: **the Capri
Collection Outdoor Dining Chair was carrying the Contour Collection Sideboard's
FAQs.** A two-way swap. Both sets rewritten from each product's own data.

`scripts/audit-cross-contamination.ts` is the detector, and it stays. Two
signals: products sharing an identical FAQ question list, and copy naming a
range that is not its own. The first version took any capitalised word in a
title and returned 818 findings — "Design" and "Hanging" appear in the section
headings of every description here — so it now requires a name to lead its title,
which is what makes "Capri" in the Contour console's FAQs diagnostic.

### And a claim of mine that was wrong

I reported hedging at zero across the catalogue. It was not zero. My patterns
covered "the specification does not list" and missed the entire consult-the-
manual family, plus "is not explicitly stated", "not specifically listed", "not
indicated" and "unless specified otherwise".

**84 spans across 66 products** told the customer to go and read a manual they do
not have yet, instead of answering: _"Please consult the instruction manual or
customer support for guidance."_ Several admitted the gap outright: _"The weight
capacity for this chair is not explicitly stated."_

- [x] 128 spans rewritten across 93 products
- [x] 114 blocks dropped where the paragraph was nothing but deflection, taking
      the orphaned heading with it
- [x] 37 FAQ answers rewritten
- [x] Where the answer is known it replaces the deflection — the pump stays
      submerged, the basin is drained before the first frost, mains-wired
      fittings need an electrician, the bulb is not included
- [x] Verified live: 0 remaining

### Also fixed in the same pass

- [x] Five products with two or three stub FAQs, two of which shared the
      identical pair "What are the exact dimensions?" / "How heavy is it" — which
      is why they surfaced next to the genuine Capri/Contour swap
- [x] Ten products quoting their own **old** title inside an FAQ answer, still
      carrying the doubled dash I repaired in the titles earlier today. Renaming
      a product means finding every place the old name was written down; I had
      only fixed the field it was stored in.

### On Side Tables

Checked directly after he sent the screenshot. There is one Sanity dataset on
this project (`production`) and one Side Tables document, `category-side-tables`.
It holds 2 intro blocks, 4 buying-guidance blocks, 4 FAQs and the meta title
"Side Tables | Living Room | Kaiku", last written 14 August — it was one of the
twelve categories that already had content, so today's script correctly left it
alone. There are no draft categories. Whatever that Studio tab was showing, it
was not this document's stored content.

---

## 806 meta descriptions were supplier marketing, and 209 meta titles were truncated mid-word (2 September)

This came out of correcting my own audit. The first run of
`scripts/audit-everything.ts` reported all 906 products as missing an SEO title
and description. I recognised an all-906 row as an auditor bug — it was, the
field is a nested `seo` object and I had read `seoTitle` — but the important part
is what was behind it: **nothing had ever audited the SEO fields, so nobody had
looked at what was in them.**

What was in them:

- **209 meta titles truncated with a literal "…"**, mid-phrase, with " | Kaiku"
  appended after the ellipsis. On the four Freska storage jars that cut off
  "1100ml", "800ml", "550ml" and "250ml" — the only thing distinguishing them —
  so all four went to Google under one identical title. Ten such groups.
- **806 of 906 meta descriptions were supplier or generated filler**: _"Shop the
  Set Of Three Wooden Lanterns at Kaiku, a perfect addition for charming home
  ambience. Premium UK homewares for modern interiors."_ This is the voice you
  told me to get out of the copy, and it was worse here than anywhere else,
  because the meta description is the line a searcher reads before deciding
  whether to click.
- **19 descriptions over 160 characters**, so they truncated in the result.
- **Four meta titles that were simply the wrong product.** The Contour Collection
  3 Drawer Console carried "Capri Outdoor Foot Stool | Wicker Garden Footrest |
  Kaiku". Two different LED wall lights both carried "Led Wall Lamp 2 Pack". No
  length check would ever have found these.

### Fixed, and verified live with a fresh uncached client

- [x] 296 meta titles rebuilt from the product's own title — 0 now contain an
      ellipsis, 0 duplicated
- [x] 811 meta descriptions rebuilt from the product's own summary — 0 filler
      phrases remain, 0 over 160 characters
- [x] 9 summaries the earlier de-marketing passes missed, rewritten from data
- [x] 12 product titles with a doubled separator ("Tabletop Water Feature - -
      Cascading Pots") repaired
- [x] 124 gallery images across 31 products given alt text — 0 missing
- [x] 2 FAQ questions with an eaten "I" ("s it suitable for boutique hotels?")
- [x] 2 products with no FAQs at all, written from their own specs
- [x] 1 product with two spec rows labelled "Material" — merged, not dropped,
      because Aluminium and Polyester are both true of it

`scripts/fix-product-meta.ts`, `scripts/fix-meta-remainder-and-faqs.ts`,
`scripts/fix-titles-alt-and-last-summaries.ts`,
`scripts/fix-last-meta-mismatches.ts`.

### A buy-box defect found on the way

127 published products carry no `stockStatus` — they came in through the
importers rather than through Studio, where the schema's initial value would have
set it. `product-summary.tsx` printed the raw field, so those 127 showed **a
lorry icon with nothing beside it** in the buy box, at the moment someone is
deciding whether to order. `availabilityLine()` in `delivery.ts` already had the
wording for every case including the missing one; it was not being used here.
Now it is.

### Deliberately not "fixed"

- [-] 118 meta titles still exceed 60 characters. They are long product names,
  and Google renders a truncated title while still indexing the whole thing.
  Cutting them would mean dropping the size or capacity that distinguishes
  one variant from another, which is the defect I just spent this pass
  removing. Cosmetic truncation is the better of the two.
- [-] 80 meta descriptions are under 70 characters, because the product's summary
  is short and factual. A short honest line beats a long empty one.

### Supplier data gaps, not defects — for you

- [!] 552 products have no `weight`, 159 no `specs`, 12 no `dimensions`. These
  are gaps in what the suppliers supplied. Every one of them still has a
  full description, summary and FAQ set, because those were written from
  whatever data does exist. Where you can get the numbers, they are worth
  having — weight in particular, because it is what a customer asks before
  buying a mirror or a wall unit.
- [!] 26 products have no `deliveryLeadTime`. The delivery window shown on the
  page is derived from price (your rule), so nothing is broken — this is the
  free-text override being empty, which is correct unless a piece has a
  genuinely different lead time.

---

## Every category page now has SEO copy, buying guidance and FAQs — 49/49 (2 September)

Damien sent a screenshot of a category in Studio with "SEO introduction" and
"Buying guidance" both reading **Empty**, and said to do this before anything
else. He was right that it was the priority: this is a requirement the brief has
carried from the start — _"Every category page needs: SEO introduction, buying
guidance, FAQs, internal links, related categories"_ — and only 12 of 49
categories had it. The other 37 were a heading and a product grid, which ranks
for nothing, because there is no text on the page for a query to match.

### The code defect underneath it

`buyingGuide` has been in the category schema, in the GROQ projection and in the
Studio editor since the field was added. **It was rendered nowhere.** Every word
already written into that field — on Coffee Tables, Sofas, Garden Furniture and
nine others — was invisible on the live site. Filling the field on 37 more
categories without finding this would have produced 37 more invisible pages.

Fixed in `shop-all.tsx`: the `CategoryContent` block now renders the guidance
under a "How to choose" heading, above the FAQs, in the same 68-character
measure as the intro.

- [x] `buyingGuide` rendered on the category page (`shop-all.tsx`)
- [x] `intro` — 2 paragraphs on every one of 49 categories
- [x] `buyingGuide` — 4 paragraphs on every one of 49 categories
- [x] `faqs` — 4 questions on every one of 49 categories, with `FAQPage` schema
- [x] `seo.metaTitle` on all 49 (15 were inheriting the site default)
- [x] `seo.metaDescription` on all 49, every one inside 70–160 characters
- [x] Room-level `seo.metaTitle`, `seo.metaDescription` and `description` on all
      11 departments — every room page was previously using the site default

### How the copy was written

`scripts/fill-category-content.ts`, applied and verified live with a fresh
uncached client. Nothing was generated from the category name. For each category
I pulled its own stock first — price range, dimension range, material tags and
the actual product names — and wrote from that. So the Planters intro says 86
pieces from £15 to £246 in heights from 11cm to 189cm because that is what is in
it; the TV Units guidance gives the unit height for a 55-inch screen because the
range runs 44cm to 66cm and the arithmetic is the useful part.

The guidance is deliberately the sort of thing that gets a page ranked for a
question rather than a product name: how much clearance behind a dining chair
(90cm), how tall a mirror has to be to show a whole outfit (120cm), why a solar
light in a hedge disappoints, why you plant a large pot where it will stand.

Existing content was never overwritten. The script writes only into empty fields,
so the twelve categories Damien already had keep every word of theirs.

### Three categories with no products still got full copy

Towel Rails, Bathroom Lighting and Rugs hold nothing yet. They are `noindex,
follow` while empty, so the copy is not chasing a ranking today — but the pages
are URL-reachable, the intro renders above the coming-soon state, and the
guidance is honest about the range being curated rather than pretending stock
exists.

### Still open on this

- [ ] Departments have no `intro` or `buyingGuide` fields at all — only
      `description` and `seo`. Room pages therefore carry no body copy of their
      own. Adding those two fields to the department schema is a small change and
      would give 11 more rankable pages; say the word and I will.
- [!] Cold Plunge and Outdoor Kitchen still have one category each, and Lighting
  has one. Those room grids are thin because the catalogue is, not because
  the copy is missing.

---

## The "laggy" site: found, measured and fixed (2 September)

Damien reported "the websites laggy too". Investigated properly rather than
guessed at, and it was not what it sounded like.

**Nothing was actually slow.** Ruled out in order:

- Caching is fine — every storefront route is static or ISR, none dynamic.
- The 4MB JS chunk is **Sanity Studio**, loaded only on `/studio`.
- **Three.js and @react-three/fiber** are real dependencies but isolated to
  `/experience`. No shopper loads either.

**The cause was the smooth-scroll configuration.** `src/components/providers/
smooth-scroll.tsx` set Lenis to `lerp: 0.09` — slower than Lenis's own default.
At 0.09 the page closes 9% of the remaining distance per frame, so it keeps
drifting for about half a second after the wheel stops. Input and response come
apart, and that is what reads as lag.

- [x] **Raised to `lerp: 0.18`.** Measured in a real browser with Playwright,
      one 1200px wheel tick, sampling `scrollY` every 25ms:

      | lerp | time to 90% settled |
                                                                                                                  | ---- | ------------------- |
                                                                                                                  | 0.09 (before) | **454ms** |
                                                                                                                  | 0.18 (now)    | **232ms** |

                                                                                                                  Roughly halved. Still visibly smooth, but it tracks the wheel.

- [x] **Reduced-motion is now actually honoured.** The file's own docstring
      claimed it "respects reduced-motion by leaving Lenis effectively
      pass-through" — and there was no check of any kind. Smoothing was applied
      to everyone regardless of their OS accessibility setting. The
      `useReducedMotion` hook already existed and was used elsewhere; it simply
      was never wired in here. With reduced motion requested, `lerp` is 1 and
      `smoothWheel` is off, handing scrolling back to the browser.

Both values are a one-line change at the top of that file if Damien wants it
snappier again — `1` is effectively native scrolling, and `smoothWheel: false`
turns smoothing off altogether.

- [x] **Fixed a build-breaking type error I introduced myself** in
      `scripts/fix-summary-marketing-voice.ts` — indexing into a string under
      `noUncheckedIndexedAccess`. Same class of error that took the deploy down
      earlier today from an agent's script. `next build` type checks everything,
      including scripts.

---

## Summaries: supplier marketing voice removed from 641 of 906 (2 September)

The pergola complaint generalised. Damien objected to "This elegant Metal
Pergola … offers comfort and style for your garden or patio", and 522 summaries
were written in that register.

- [x] **336 stripped mechanically.** The defect has a consistent shape — a
      factual sentence carrying a marketing adjective, plus a trailing sentence
      of pure padding. Adjectives removed in place; only fact-free sentences
      dropped. Every material, dimension and capacity survives.
- [x] **139 composed from each document's own fields** — product type,
      materials, dimensions, weight, bulb, battery, assembly, capacity. Nothing
      inferred; absent fields omitted.
- [x] **14 written by hand** where the fields were too sparse or contradictory.
- [x] **115 had a trailing marketing clause trimmed** from an otherwise factual
      sentence ("…with an acacia wood lid, perfect for kitchen storage").
- [-] **31 deliberately left alone.** Trimming would have produced a sentence
  fragment. A summary that still reads faintly of marketing beats one that
  reads as broken English.

Two facts the old copy had dropped are now on the page: the Vitus wall clock
**"Takes 1 x AA, not supplied"**, and the Vertex basket **is not watertight** so
it cannot hold liquid.

### The hedge distinction, which took three attempts to get right

23 description paragraphs and 16 FAQ answers still deferred to "the
specifications". Finding them required a rule, because both obvious patterns
were wrong:

| Text                                                                                  | Verdict         |
| ------------------------------------------------------------------------------------- | --------------- |
| "does not include any fixings, as it is designed to stand independently on the floor" | **Fact.** Keep. |
| "requires 1 x AA battery, which is not supplied"                                      | **Fact.** Keep. |
| "the specifications do not clarify if it is frost-resistant"                          | **Hedge.** Fix. |

**A product that lacks something is a fact; a specification that lacks something
is our problem, not the customer's.** Now 0 in descriptions, summaries and FAQs.

Three were outright false rather than unhelpful: two water features claimed the
specifications gave no dimensions or weight while their own documents store
16 x 21.5 x 12.5cm / 0.91kg and 35 x 16 x 18cm / 2.3kg.

### Bugs the dry runs caught before they reached live copy

- `FACT_TOKEN` joined its alternatives with `""` instead of `"|"`, concatenating
  the sub-patterns. The regex then required a digit followed by a unit followed
  by a material and essentially never matched — so sentences full of facts
  ("Made primarily from polystyrene and glass") were classed as pure marketing
  and deleted.
- A naive vowel-letter article rule turned "a unique frame" into "an unique".
- `"premium"` in the strip list broke "where space is at a premium" → "at a."
- The composer opened "The <name> is a <noun>", producing "The Vertex
  Rectangular Basket is a basket in iron".
- Falling back to the description's first paragraph imported uncontrolled prose,
  including a hedge; removed entirely.
- `bulbClause` hardcoded "an", giving "an G4".
- The clause trimmer judged the whole summary, so a pre-existing fragment
  elsewhere blocked a good trim. It now judges only sentences it rewrote.

**Counts in this area were wrong twice — 244, then 402, actually 522 —** because
`.test()` on a regex carrying `/g` advances `lastIndex` between calls. Every
regex here is now built fresh per use.

---

## Every published description rewritten to the sauna standard — 906/906 (2 September)

Damien: "i dont need you to only fact check everything i just need nice long
kaiku style descriptions." This closes that out.

Live catalogue, verified with a fresh uncached client across all 906 published
products:

| Check                                    | Start | Now |
| ---------------------------------------- | ----: | --: |
| Thin (<=1 heading)                       |    78 |   0 |
| Under 400 characters                     |    65 |   0 |
| Raw decimals in `description`            |    76 |   0 |
| Raw decimals in `specs`                  |    63 |   0 |
| Hedge / "we don't know" (desc + summary) |    28 |   0 |
| Hedge / "we don't know" (FAQs)           |    75 |   0 |
| Keyword-stuffed titles                   |    50 |   0 |
| Stuffed titles leaked into FAQ prose     |    45 |   0 |
| Supplier names in customer copy          |    71 |   0 |

Shortest description in the catalogue is now 413 characters; the median is
1,506. **116 products were written by hand across nine batches** — roughly
37,000 words — plus 113 more applied from agent batches that were finished but
never run.

### The two things that went wrong, both worth keeping

- [x] **A trailing `\b` after a word stem is the bug that keeps recurring.**
      It hid 76 raw decimals (`/\b\d+\.\d{4,}\b/` can never match `w65.000000`,
      because there is no boundary between `w` and `6`), and then it did it
      again in the FAQ repair script (`\bdimension\b` can never match
      "dimensions"), reporting 0 repairable answers when 6 were. Both were
      caught by checking a reported zero against known-bad live data rather
      than trusting it.
- [x] **A pattern that edits prose can overrun.** The first FAQ title-repair
      used `\|\s*(Luxury|…)\b[^|.]*` and destroyed content: `[^|.]*` runs to
      the first period, so "weighs 23.6kg" became ".6kg" and a whole
      dimensions sentence was swallowed. Fixed by replacing literal known
      strings taken from the earlier fix's own change-log. **Prefer a literal
      replacement over a pattern whenever the target string is already known.**
      The dry-run default is what caught it.

### Rules this work establishes

1. **A section count is not a quality measure.** "Wood construction in grey,
   round." is two headings and eleven words, and it passed every check while
   telling a shopper nothing. 65 descriptions were in that state — all of them
   my own earlier work.
2. **Mine the FAQs, not just the specs.** They held the anti-tip strap supplied
   with a 200cm shelving unit, the 43.3kg ceiling load on a pendant, the 185cm
   carton on an 81kg sofa, and that the Tarn pot is watertight. None of it was
   in any description.
3. **A known unwelcome fact stays.** "1 x AA (not supplied)", "bulbs not
   included", "plants not included" — trimming those to make copy read cleanly
   removes the one thing the customer needed.
4. **Never publish an admission of ignorance under a heading that promised an
   answer.** Either state the fact, give the practical guidance that answers
   the underlying question, or omit the section.
5. **Never claim not to know something the document stores.** The Grand Water
   Feature's description read "the page does not disclose the overall
   dimensions, weight, or materials" while the same document held 24 x 22 x
   48cm and 5.1kg — above a specifications tab rendering those numbers.

### Still open

- [!] **Two data errors** the copy deliberately works around rather than
  printing: the Abira floor lamp's `Maximum Wattage` reads "1 W per bulb"
  for a 190cm five-bulb lamp, and the Mano Gold Table Lamp's dimensions
  read "H71 x D18 x W70" — a 70cm-wide table lamp on an 18cm depth. Both
  need correcting at source.
- [!] **The Light Up Bookcase has no material data.** Its FAQ answers "what is
  it made from" with "high-quality materials". Its copy is built from the
  figures that are real (220 x 90 x 38cm, 63kg, integrated lighting).
- [!] **Four titles keep a three-part form** because the middle segment is real
  information, not marketing — "Ancient Wisdom" is a genuine brand on the
  essential oils, and "30 x 20 x 5cm" is a size on the salt plate. Your
  call whether they stay.
- [ ] **244 summaries still contain superlatives** ("elegant", "stunning").
      Every summary rewritten in these nine batches is clean, but the ones on
      products that were never short were not touched.
- [!] **Site is laggy** — reported and still not investigated.

---

## Every room now has the dark category grid, and the hero has two real CTAs (2 September)

Damien: "we need all of the other rooms to have a category grid like this
because when your on this page and click to a different room it brings you to
the white page when you should be expecting to go to the same black category
page with all these images for a different room."

The grid existed for exactly one room. `/shop` rendered `CollectionIndex`
hardcoded to `outdoor-living`, while `/shop/room/[room]` rendered the white
`ShopAll` — so the room bar drawn _over_ the dark grid led out of it. Tap Sauna
from the Outdoor Living grid and you landed on a white product listing.

`CollectionIndex` was already room-generic: it takes `roomSlug`, filters tiles
by department, and its own docstring claimed `/shop/room/[room]` rendered it.
Only the wiring was wrong, so this is a small change with a large effect.

- [x] **`/shop/room/<room>` renders the dark category grid** for every room.
      Verified in the browser: `/shop/room/sauna` shows Outdoor Saunas (5),
      Wellness Accessories (6), Indoor Saunas (2) and a "Shop All Sauna" tile,
      with the dark header and SAUNA active in the room bar.
- [x] **The white listing moved to its `/all` child**, which already existed.
      `/shop/room/sauna/all` still renders the dense filterable grid with the
      light header — verified in the browser.
- [x] **`allHref` in `CollectionIndex`** pointed at `/shop/room/<room>`, which
      after this change is the page itself, so "Shop All …" would have linked to
      where the shopper already stood. Now `/shop/room/<room>/all`.
- [x] **Header theme** keyed off segment count, counting any shop route deeper
      than `/shop` as white. The room grid would have rendered a light header on
      a near-black page and stacked a second room sub-bar on the grid's own.
      Added an `isRoomCollection` exception (three segments, `segments[1] ===
"room"`).
- [x] **`ShopDrillNav` on the white listing** gets `roomHrefSuffix="/all"` back,
      so room tabs move sideways between listings instead of throwing a shopper
      mid-shop out to the editorial grid.
- [x] **Two orange hero buttons.** "Shop by Room" → `/shop/room/outdoor-living/all`
      (the white full Outdoor Living catalogue), "Shop by Category" → `/shop`
      (the dark grid). The second was a quiet text link to About; both are now
      equal `bg-brass` buttons.

Two live bugs found while wiring this up, both fixed:

- [x] **The "Shop by Room" button went to the pergolas category.** The Sanity
      `homepage.heroCtaPrimary` was labelled "Shop by Room" but carried an
      `internalRef` to `category-pergolas`. Both hero CTA fields are now unset
      (`scripts/fix-hero-ctas.ts`) so the component defaults own them — these two
      buttons are structural navigation, not editorial copy, and a
      reference-based link cannot express `/shop/room/<room>/all` at all. Either
      field can still be set in Studio to override.
- [x] **Every `department` link resolved to a bare `/shop`.** `LINK_PROJECTION`
      in `src/lib/sanity/queries/fragments.ts` mapped department refs to the
      literal string `"/shop"`, so a link to any room went to the Outdoor Living
      index. Now `/shop/room/<slug>`.

Worth knowing, not fixed (data, not code):

- [!] **`cold-plunge` and `outdoor-kitchen` have 0 categories**, so their grids
  render empty. Both are `showInMainNav: false`, so nothing links to them —
  but the URLs are prerendered and reachable directly. Either give them
  categories or drop the departments.
- [!] **`lighting` has 1 category**, so its grid is a single tile beside "Shop
  All". Correct for the data, thin as a page.
- [!] **Every room hero reuses the Outdoor Living image and subcopy** ("Timeless
  design. The finest materials. Built for life outdoors."), so the Sauna and
  Bedroom grids are headed by a pergola-and-pool photo. Needs a per-department
  image and description in Studio.

---

## A scan regex bug that hid 76 defects, and 113 batches that were written but never applied (2 September)

Damien sent screenshots of live pages showing three things I had reported as
fixed: a raw `w120.000000 x d40.000000 x h47.000000` in a Specifications tab, a
"What's in the Set" heading whose body said the spec does not list the contents,
and a Sanity description containing a single short section. His words: "im so
convinced you just dont listen to me". He was right on all three counts.

What was actually wrong, in order of how badly I had misreported it:

- [x] **The scan regex could not match the defect it was looking for.**
      Detection used `/\b\d+\.\d{4,}\b/`. In the string `w65.000000` there is no
      word boundary between `w` and `6`, so the leading `\b` fails and the match
      never happens. It reported **1** affected product where there were **76**.
      Every "0 remaining, verified" claim about raw decimals rested on this.
      Fixed in `scripts/fix-description-raw-decimals.ts` (detection drops the
      leading boundary); 76 products cleaned, re-verified 0.
- [x] **A whole field was never in scope.** Raw supplier decimals also sat in
      `specs[].value`, a separate field from `description` that no earlier
      decimal pass had touched — which is why they survived every previous
      "clean" report. `scripts/fix-specs-raw-decimals.ts`, 63 products, verified 0.
      Both fixes are exact, not rounding: `parseFloat(x).toString()` strips zero
      padding losslessly, and the `dimensions` object already held the clean
      integers, proving the padding was formatting and not precision.
- [x] **The hedge pattern had wording the regex didn't cover.** The earlier
      broadening caught "does not mention/specify/indicate", but not "does not
      **list**", "does not **state**", "does not **confirm**", "does not
      **detail**", or "the page does not…". 28 products still carried a heading
      that promised an answer above a sentence refusing to give one. Down to 1.
- [x] **113 products of finished work had been written but never applied.** Five
      `rewrite-descriptions-*-batch2.ts` scripts plus `fix-hedging-summaries.ts`
      were sitting untracked in `scripts/`, written by background agents that
      died on rate limits before running them. The content was good — real facts,
      confident voice, no hedging. Applied all of them: +110 descriptions,
      +3 summaries.
- [x] **12 thin descriptions rewritten by hand** in
      `scripts/rewrite-thin-descriptions-batch1.ts` — 5-6 sections each,
      averaging 351 words, mined from specs _and_ FAQs (the FAQs held weight
      capacities, hob/dishwasher safety, country of manufacture and real care
      instructions that no description was using).

Live catalogue state after this work, re-verified with a fresh uncached client:

| Defect                          | Before | Now |
| ------------------------------- | -----: | --: |
| Raw decimals in `description`   |     76 |   0 |
| Raw decimals in `specs`         |     63 |   0 |
| Hedge/gap-admission phrases     |     28 |   1 |
| Thin descriptions (<=1 section) |     78 |  38 |
| Superlatives in `summary`       |    244 | 244 |

### Standing rules this episode adds

1. **A regex that reports zero is a suspect, not a result.** Before trusting any
   "0 remaining", test the pattern against a known-bad string copied from live
   data. `\b` next to a digit adjacent to a letter is the specific trap.
2. **Enumerate the fields before scanning them.** `summary + description + faqs`
   was already known to be the scoring surface; `specs[].value` was not in it and
   held 63 defects. Scan every field that renders on the page.
3. **Never write a section that admits a gap.** If the fact isn't known, omit the
   section. If the fact IS known and unwelcome — "bulbs not included", "1 x AA
   (not supplied)" — it stays, stated plainly. Deleting "(not supplied)" to make
   copy read cleanly removes the one thing the customer needed and is worse than
   the hedge it replaced.
4. **The deliverable is a good description, not a passing scan.** Damien: "i dont
   need you to only fact check everything i just need nice long kaiku style
   descriptions."

### Still open

- [~] **38 thin descriptions** remain at <=1 section. Batch 1 of the hand-written
  rewrite covered 12; the rest need the same treatment.
- [ ] **244 summaries contain superlatives** ("elegant", "stunning", "impressive").
      This is the pergola complaint generalised — the description gets rewritten
      while the summary above it keeps the old supplier marketing voice.
- [ ] **1 hedge phrase** left, on `product-aw-waterf-22`.
- [!] **Site is laggy** — Damien reported this and I have not investigated it yet.

---

## Two defects Damien found live that my own scans had missed (1 September)

Both were found by him opening real pages, not by any scan of mine. That is
the finding worth recording.

- [x] **Raw supplier decimals in the Specifications tab** — 63 published
      Premier Housewares products showed `w120.000000 x d40.000000 x
h47.000000`. These live in `specs[].value` **strings**, a field every
      earlier decimal-dump pass ignored (those covered `dimensions`,
      `weight` and `description`). Fixed exactly, not by rounding:
      `dimensions` on the same documents already stored the clean integers,
      proving the zeros were feed padding. `scripts/fix-specs-raw-decimals.ts`.
      Verified live, fresh non-CDN query: 0 remaining.
- [x] **"The specification does not list…" still on 28 published products** —
      the gap-admission pattern I reported closed earlier the same day. The
      earlier regex matched `does not mention|specify|indicate|include
information` and **missed `does not list|state|detail|confirm`**, which
      is the wording most of the catalogue actually used.
      `scripts/fix-hedge-phrases-batch1.ts`: sections that were 100% hedge
      dropped, hedge clauses sitting next to a real fact trimmed with the fact
      kept.
- [~] **A wider re-scan then found 177 products hedging** across
  `description` + `summary` + `faqs` combined — mostly in FAQ answers
  ("The specifications do not state whether fixings are included").
  28 fixed, the rest outstanding. **Lesson, again: the pattern was never
  the problem, my regex was.** Any future claim of "0 remaining" has to
  name the exact regex and the exact fields it ran over.

### Catalogue description quality, measured properly

Counting all heading styles (`h1` **and** `h2` — 227 blocks across 42
descriptions are styled `h1`, so an h2-only count under-reports badly):

| Tier                          | Count |
| ----------------------------- | ----- |
| OK (4+ headings, 140+ words)  | 594   |
| THIN (≤3 headings or <140 wd) | 198   |
| BARE (≤2 headings)            | 109   |
| No headings at all            | 5     |

Worst concentrations: Hill Interiors (121 of 139 thin or bare), D.I. Designs
(all 54), AW Dropship (39 of 56).

### The reference standard, written down

Damien: _"use the product published ages ago the first products as reference.
these are real kaiku products. the rest is generic"_ — the 8 SaunaPlunge
products. What they actually do, measured rather than assumed:

- **4–6 sections, 130–240 words.** Not long. The bar is density, not length.
- **Every fact gets its consequence.** Not "thermo-treated spruce" but
  "thermo-treated spruce — timber that's heat-treated rather than chemically
  treated to resist moisture and movement outdoors".
- **Headings are specific**: "Assembly, Power and Site Requirements", never
  "Features" or "Specifications".
- **Answers the buying question** — siting, base, power, who fits it, care.
- **Plain and human**, contractions and all: "we'd recommend having your
  outdoor electrical supply checked", "if you'd rather have it fitted for
  you". Damien: _"not too smart it looks ai. humanize it keep that same raw
  feel from the originals"_ — so no polished parallel prose, no marketing
  symmetry.
- **No superlatives, no hedging, no supplier voice.**

## A wider audit: pricing, lead times, images, and a bigger voice problem (1 September)

Damien: _"we need to properly audit the products and relay it back to me in a
non confusing way"_ — prompted by finding two live bugs himself (a "we don't
know" section, his address in search snippets) that no existing audit had
caught. Report published/updated at
https://claude.ai/code/artifact/2a1be6e9-5517-4f8f-a77e-e238fcac34a5.

- [x] **Direct answer to a direct question**: no, no product has been
      checked one-by-one against its supplier's own live listing for price,
      weight, dimensions and claims. Everything below is either internal
      consistency (does Sanity's own data agree with itself, does the copy
      use it honestly) or a live re-audit against Sanity — neither is a
      substitute for that external check, which has not been done and would
      be its own project.
- [x] **75 published products corrected to the 20% minimum margin**,
      applied via `audit-and-fix-margins.ts --apply` after explicit
      confirmation (price only, cost price untouched, mandatory
      `priceAdjustment` audit-log document per Damien's own standing
      instruction). Some were as low as 6.8%.
- [x] **The supplier-voice problem is now fully closed: 71 of 71 published
      products fixed, 0 remaining.** Damien pasted two real descriptions
      side by side — a gazebo in genuine Kaiku format, and the Peak Plunge
      cold plunge in raw SaunaPlunge manufacturer marketing copy, pasted in
      verbatim. Both confirmed live via direct Sanity query. Scanning every
      published description for trademark symbols, marketing buzzwords and
      self-referential sales phrasing (a different signal than "zero
      facts") found 71 published products with this problem, none flagged
      by the existing scorer. Fixed across seven batches (the 8 SaunaPlunge
      products, then 63 more furniture/lamp products in batches 2–7, each
      rewritten from that product's own specs/dimensions only) — three of
      the seven batches (`fix-supplier-voice-batch{2,3,4,5}.ts`) were
      completed by a background agent while the model was rate-limited;
      the last two (`batch6`, `batch7`) picked up afterward once verified
      against a fresh scan. **Re-ran `scan-supplier-voice.ts` after the
      final batch: 0 published products flagged.**
- [x] **The "admits a gap" and raw-decimal-dump problems are now fully
      closed on published products — 0 remaining, verified twice.**
      Broadened the detector after a live product ("do not mention whether
      it has drainage holes... please consider this") said exactly what
      the existing patterns catch, worded differently. First rescan found
      46 gap-admission and 77 decimal-dump matches in descriptions;
      `fix-gap-decimal-published-batch1.ts` fixed 55 gap-admission
      instances (46 products) and 10 of 12 hand-verified decimal instances
      (2 had already been resolved by an overlapping fix). **Its own dry
      run reported success on 2 whole-heading-drop cases that the actual
      apply silently failed to write** — caught only because this session's
      standing rule (never trust a script's own console output, always
      re-verify live) turned up the Sanai Planter's description completely
      unchanged after a reported "applied: 2". `batch2` fixed that
      (rebuilding the block array directly rather than patching individual
      spans) plus three more genuine instances the original scan had missed
      entirely (Lentigo, Relic Onyx, Manado Relax).
  - **A second, larger instance of the same pattern was hiding outside the
    field the original scan checked**: the artefact detector scores
    `summary + description + faqs` together, but the original scan only
    checked `description`. Re-checking the full scope found **75 more
    instances, all in FAQ answers** ("Is a saucer or liner included?" → "The
    specifications do not mention..."). `fix-faq-gap-admissions-batch1.ts`
    deleted the ~68 FAQ entries whose entire content was the admission (an
    FAQ that only says "we don't know" gives a shopper nothing) and kept a
    trimmed, hedge-free version of the ~20 that had a real fact or genuinely
    useful generic advice alongside it (e.g. "source fixings separately,"
    "store cushions dry").
  - **Verified with a non-CDN client, twice, after being misled by the
    cached one.** The public-facing Sanity client (`useCdn: true`) returned
    stale content immediately after a real, successful write — a
    `count()`/fetch a few seconds apart showed the fix both present and
    absent depending on which CDN edge answered. Every verification in this
    entry used `useCdn: false` directly against the dataset, not the
    storefront's own client.
  - Final state, confirmed live: **0 published products** match either
    pattern in any of `summary`, `description` or `faqs`. 161
    gap-admission and 8 decimal-dump instances remain — all on drafts,
    never in scope for this pass.
- [x] **48 missing delivery lead times: 25 fixed on a defensible category
      basis, 23 blocked.** `fix-aosom-missing-lead-times.ts` groups each
      category's OTHER already-set Aosom products by parsed day-span (same
      technique `audit-delivery-lead-times.ts` uses to spot "same promise,
      different wording") and only writes a default where those other
      products are unanimous (n≥2) or agree ≥75% of the time (n≥3) — the
      exact wording written is Aosom's own most common phrasing for that
      promise, never a new variant. Fixed: Fire Pits & Heating (18, "3-4
      weeks", 3/3 unanimous), Garden Furniture (3, "3-4 weeks", 9/9
      unanimous), Garden Lighting (2, "7–14 days", 8/9), Lighting (2, "7–14
      days", 10/13). **Still blocked, genuinely — Damien needs to supply or
      confirm these directly with Aosom:** Beds (5, existing products split
      1/1 between two promises), Outdoor Kitchens (2, zero other Aosom
      products in the category have a lead time at all), Pergolas (6) and
      Planters (1, one single comparable product each — not a pattern),
      Privacy Screens (8, split 1/1), Water Features (1, only 67% agreement,
      below the bar). Verified live via a fresh query after applying.
      docs/change-log/2026-09-01-aosom-lead-time-defaults.json.
- [x] **Image audit across all 4,048 images, alt text now 100% covered.**
      2,388 images (catalogue grew by one since the count above) described
      via `derive-image-alt.ts --apply`, across 490 products — reusing the
      existing real-facts-only generator (product name, department, and the
      `isStudioShot`/`optionValue` gallery metadata; never "image of",
      never invented styling or colour). Primary image gets the plain
      product name; secondary images get ", second/third product view" for
      other studio shots or "photographed in a {department setting}" for
      lifestyle shots, numbered from the second one on. Never overwrote an
      editor's own alt text. Verified live via a fresh query on a sample.
      Added the mandatory per-image change-log this script was missing:
      docs/change-log/2026-09-01-image-alt-fill.json.
      Resolution (72 unusable, 224 soft), 87 undescriptive filenames, 16
      off-square and 86 single-photo products are unchanged — still not
      fixed, and none of them are fixable by a data patch (they need new
      photography from the supplier).
- [x] **Two small reported bugs fixed**: the Compare/Share/Save-for-later
      row was centered while the row above it was left-aligned; a periodic
      metallic shine sweep added to the header wordmark, requested
      directly (aria-hidden overlay, disabled under reduced-motion).
      Also separated the Delivery/Returns/Warranty tab's three columns
      with a divider (shared component — applies to every product).
- [!] **A placeholder-illustration bug Damien flagged is traced but not
  confirmed live.** The exact pattern (a decorative line-art motif
  instead of a real photo, on a category tile) matches a component
  chain (`ProductCard`/`CategoryCard` using a "swap-ready stand-in for
  real photography") that is dead code on this branch — not wired into
  any live route. Needs the exact page URL to fix the real occurrence
  rather than guess.
- [ ] **Requested, not started**: a step-by-step guide for pulling live
      price and stock feeds per supplier.

---

## Two real bugs from Damien's own screenshots: home address exposed, and the category bar actually broken (1 September)

- [x] **Home address was in the meta description on dozens of unrelated
      pages.** Damien: _"i also dont want my name and address visible like
      this"_ — with Google search results for Journal, Tools, Bedroom
      Mirrors, Lighting, kitchen-lighting and the homepage all showing "Kaiku
      is a trading name of Damien McCormack. Trading address: 16 Isis Way,
      Bourne End..." as the snippet. Root cause: `site-footer.tsx` printed
      that statutory disclosure as literal text in the global footer, so it
      was in every page's raw HTML for Google to scrape into a snippet
      site-wide — not just where a shopper would look for it.
  - Removed it from the global footer. UK law requires a sole trader's name,
    geographic address and contact details to be "easily, directly and
    permanently accessible" — a persistent footer link satisfies that, the
    text does not need to be reprinted on every page. Moved the same
    disclosure (sourced from `companyDetails`/`tradingAddressLine()`, not
    retyped) onto `/terms` and `/contact`, both already linked from the
    footer. Verified live: `Isis Way` no longer appears on `/` or
    `/shop/pergolas`, still appears on `/terms` and `/contact`.
  - Deliberately left the address in `OrganizationJsonLd` (`json-ld.tsx`)
    alone — that's a different, legitimate use (Merchant Centre and
    Google's trust signals reading structured data, not a visible search
    snippet) and removing it would hurt the Merchant Centre push.
  - **Outstanding, not something code can fix**: Google's cache of the
    already-indexed pages will take time to drop the old snippet on its own.
    If Damien wants specific results scrubbed sooner, that's Google Search
    Console's "Remove outdated content" tool — his account, not something
    this session has access to.
  - Also fixed the footer's copyright line, which had "Premium home
    improvement, curated." hardcoded separately from `siteConfig.tagline` —
    missed by the positioning change below until this pass. Now reads the
    same tagline as everywhere else.
- [x] **The category bar Damien reported ("the scroll bar up down always
      bugs out here") was a real, reproduced bug — the webkit-scrollbar fix
      from the previous entry was real but not the actual complaint.**
      Reproduced live with a headless browser: a horizontal wheel/trackpad
      gesture over the bar moved `window.scrollY`, not the bar's own
      `scrollLeft` — the page lurching up and down instead of the bar
      scrolling, exactly as reported. Root cause: Lenis (the app-wide
      smooth-scroll library) intercepts wheel input everywhere except on
      elements marked `data-lenis-prevent`, and `shop-drill-nav.tsx` (the
      component actually rendering on `/shop` and category pages — not
      `site-header.tsx`'s copy, which only renders on bare `/shop` and
      product pages) never had it.
  - Added `data-lenis-prevent` to `shop-drill-nav.tsx`, `site-header.tsx`'s
    sub-bar, and four more rails with the same gap that hadn't been reported
    yet: `product-gallery.tsx`'s mobile thumbnail strip, `product-tabs.tsx`,
    `recently-viewed.tsx`, `related-products.tsx`, and
    `collection-index.tsx`'s mobile category pills. Added the matching
    `[&::-webkit-scrollbar]:hidden` to the ones missing that too. Verified
    live afterward: a horizontal wheel gesture now moves the row's
    `scrollLeft`, not the page's `scrollY`.
  - Documented the attribute requirement in `lib/ui/rail.ts` so a new
    hand-rolled horizontal row doesn't quietly reintroduce this.

---

## Draft artefact cleanup, a header bug fix, and a positioning change (1 September)

- [x] **Draft artefact cleanup: last 34 draft products, 49 fixes, applied and
      verified.** `scripts/fix-draft-artefacts-batch1.ts` — the remaining
      "admits a gap", "quotes the supplier", markdown, HTML-entity and one
      internal-threshold-leak instance, all on drafts. Dry run matched 49/49
      before anything was written. Confirmed live afterward via
      `audit-full-catalogue.ts`: **ARTEFACTS remaining: none**, across the
      whole 1,629-document catalogue (published and draft). This closes the
      "65 remaining artefact instances, mostly on drafts" item.
  - What's left in the draft catalogue is now only the **129 zero-fact REVIEW
    products** (all 129 confirmed fixable — real dims/weight/specs exist,
    the written description just doesn't use them yet). Same real-facts
    standard as the 117 published rewrites applies whenever this continues.
    Not started this pass — Damien redirected to positioning instead (below).
- [x] **Fixed a real header bug**: the category sub-bar on shop pages
      (`site-header.tsx`) was missing `[&::-webkit-scrollbar]:hidden` on its
      horizontal-scroll row — Chrome/Edge/Safari rendered a visible grey
      scrollbar track that appeared and disappeared as you scrolled the bar,
      reading as the bar jumping. The same bug had already been found and
      fixed in `shop-drill-nav.tsx`, `rail.ts` and two other spots; this was
      the one row that never got the fix. Reported by Damien as "the scroll
      bar up down always bugs out here."
- [x] **Positioning: broadened from "home improvement" to "the UK's most
      helpful home store."** Damien: _"we need to kind of position ourself as
      a premium home store, home improvement store, indoors and outdoors
      furniture store and garden wellness and sauna store all at once... the
      most helpful uk home store appearing [in] googles results could catch a
      lot of traffic, it sounds unique"_ — confirmed no incumbent (John Lewis,
      Dunelm, M&S) claims that exact phrase, so it is genuinely ownable
      ground for long-tail/content SEO, not a claim to out-rank them on head
      terms.
  - Updated `siteConfig.tagline`/`description` (the single source every page
    title, meta description, OG tag and JSON-LD reads from), the homepage
    hero eyebrow, the About/Journal/Learn page copy, the `/shop/room/[room]`
    fallback description, and the AI product-description prompt
    (`write-description.ts`) to the broader "home store" framing —
    furniture, decor, garden structures/outdoor living, and wellness
    (saunas, cold plunges).
  - **Deliberately did not put the literal phrase "home improvement" back
    into any customer-facing copy.** `shop-all.tsx` already carries this
    exact decision, in Damien's own words from an earlier session — _"we can
    say the uks most helpful/informative home improvement store because we
    are"_ — with the reasoning that in the UK "home improvement" means
    B&Q/Wickes (timber, paint, power tools), not furniture/decor/garden/
    sauna, and using it risks the wrong expectation at the door. Put the
    question back to Damien this session and he confirmed: keep it out.
    The AI description-writer prompt now says so explicitly, so future
    generated copy doesn't drift back into it either.

---

## Post-emergency artefact cleanup: published catalogue effectively clean (1 September)

Resumed the description-audit work once the Sanity/Vercel bot-traffic incident
was contained, per _"lets forget about this for a bit and ensure vercel and
sanity are optimized for this to never happen again then move onto the next
incomplete tasks."_

- [x] **Re-audited the whole catalogue post-fix** — 61 artefact instances
      remained (27 published, 34 draft), more than the pre-emergency count
      because the emergency interrupted the cleanup mid-pass.
- [x] **8 published markdown/template-syntax fixes.** `scripts/fix-markdown-
artefacts-batch2.ts` — six mechanical strips (literal `*`/`- **bold**`
      markdown in FAQ dimension answers and a bed-frame's feature list, a
      stray `*` standing in for a multiplication sign). One real rewrite:
      "Soft Squiggly Mirror" had raw generator scaffolding
      (`bullets':['...']},{`) mixed with actual garbled, nonsensical
      fragments — past what a surgical strip could honestly fix. Rewritten
      from its own real `dimensions`/`weight` (30.5 × 22.5 × 2.3cm, 0.58kg)
      instead.
- [x] **19 published products, 46 "quotes the supplier" instances fixed.**
      `scripts/fix-supplier-hedge-published.ts` — every sentence read before
      rewriting; the fact stays, only the "the supplier says so" framing is
      removed. Zero misses on a fresh live query afterward.
  - Built with the multi-span lesson from the supplier-name-leak repair
    applied from the start this time: every block replacement collapses to
    a single span from the block's full text, never touches `children[0]`
    alone and leaves the rest — so this one didn't need a second repair
    pass.
- [x] **Published REVIEW tier: 4 → 3.** Confirmed live, not from a script's
      own printout: **GOLD 115, SILVER 691, REVIEW 3** (published only).
      Remaining published artefacts: **zero** — every one of the 27 found
      this pass, and the earlier "quotes the supplier" backlog, is now
      either fixed or was never on a published document.
- [ ] **What's left is entirely on drafts now**: 129 zero-fact rewrites, and
      ~36 remaining artefact instances (11 "quotes the supplier", 22 "admits
      a gap", 1 HTML entity, 1 markdown, 1 internal-threshold leak). Same
      real-facts standard applies whenever this continues.

---

## A four-figure Sanity/Vercel bill from bot traffic, and the fix (1 September)

Damien: _"EMERGENCY: SANITY IS TRYING TO CHARGE ME £1500"_ — a real bank charge
attempt, not a warning.

- [x] **Root cause found and confirmed against two independent sources.**
      Sanity's own usage dashboard showed 2593% of the API CDN request quota
      (25.9M vs 1M included) and 3739% of bandwidth (3.7TB vs 100GB) in one
      day. Cloudflare's firewall traffic dashboard, checked separately,
      showed 1.1M of 1.1M allowed requests in 24h from a single automated
      client (one JA4 TLS fingerprint, AS "Facebook, Inc."), repeatedly
      hitting random invented paths like `/7ba622c6bf704055/view` — not a
      route that exists anywhere in this codebase. A scraping bot generating
      a fresh random path per request specifically to defeat caching.
- [x] **Sanity's billing team reduced the charge by 75%** after being shown
      the Cloudflare evidence — from £1500 to roughly £264–272, split across
      two months, following a support ticket citing the traffic data as
      proof this was automated abuse, not legitimate usage, already fixed at
      the source.
- [x] **Fixed at the root, not just reported.** Two layers:
  1. **Vercel Firewall → Bot Protection**, published (was showing
     "Inactive" with an unpublished pending change sitting in "Review
     Changes" — Damien published it).
  2. **`src/proxy.ts`** — every request now runs through an allowlist check
     before the Supabase session refresh or any page render/Sanity query:
     anything whose top-level path segment isn't a route this site
     actually has gets a 404 immediately, no rendering, no data fetch. This
     matters specifically because a bot generating a _different_ random
     path on every request defeats any per-path cache — the only defence
     that works regardless of how many distinct junk paths get invented is
     rejecting the shape of the request before it's ever looked up.
     - [-] **First attempt broke the dev server** — this Next.js version
       (16.2.9) renamed `middleware.ts` to `proxy.ts`, and a `proxy.ts`
       already existed (Supabase session refresh). Writing a separate
       `middleware.ts` created a same-purpose file conflict Next.js refuses
       to start with. Caught immediately via a hanging local curl test
       (never trust "should work," verify), fixed by merging the allowlist
       logic into the existing `proxy.ts` instead, then re-verified live:
       real routes 200, `/7ba622c6bf704055/view` and `/wp-admin` 404,
       `/api/revalidate` still reachable (503 for its own unrelated reason
       — no secret configured in this dev sandbox).
- [x] **This was a real, structural gap, not an isolated bug** — worth
      remembering going forward: any dynamic route with `generateStaticParams`
      and `dynamicParams: true` (the correct setting for new content to
      appear without a redeploy) is open to this exact cost pattern unless
      something rejects obviously-invalid paths before the route tries to
      resolve them. The proxy-layer allowlist is now that backstop for every
      current and future dynamic route on this site, not just the one that
      got hit.

---

## The comprehensive audit, and the first real rewrite batch (1 September)

Damien: _"continue the description audit then make a report of everything
youve fixed and what needs fixing and what needs to be better, after this i
want minimal things needing reviewing in the products tab of kaiku hq."_

- [x] **A true comprehensive audit, drafts included** — the earlier one
      (31 August) had no write token and could only see 732 published
      products. `scripts/audit-full-catalogue.ts` sees the whole thing.
      Live counts as of the third rewrite batch: **1629 products (780
      published, 849 drafts, both moving independently of this work — looks
      like something else is actively publishing drafts in parallel); GOLD
      112, SILVER 693, REVIEW 824** overall; **published-only: GOLD 87,
      SILVER 644, REVIEW 49.**
- [x] **SKU and yesterday's artefact fixes, confirmed durable catalogue-wide**
      — 0 missing SKUs, 0 non-canonical, out of all 1630. The html-entity and
      doubled-spacing fix is clean across the whole catalogue bar one new
      instance (see below).
- [x] **Classified every zero-fact REVIEW product by whether it's actually
      fixable** — 223 products carry the "900+ words, not one measurement"
      fault. All 223 have real dimensions, weight or specs recorded that the
      description just never used — **zero are genuinely blocked on missing
      data.** This is real writing work, not a data problem.
- [x] **First batch written and verified: the 14 highest-value published
      products.** `scripts/write-review-tier-descriptions.ts` — real numbers
      only, pulled from each product's own `dimensions`/`weight`/`specs`,
      cross-checked against packed/carton dimensions where the raw label
      didn't say which number was width vs depth. Applied and verified live
      (not the script's own printout): published REVIEW dropped **101 → 87**.
  - [-] **Dropped one candidate from this batch rather than guess:**
    "Delphine Collection Sliding Glass Dresser Top" — its specs read as
    generic placeholders ("Standard size", "Lightweight") rather than
    real values, and a recorded height of 120cm on a dresser-top glass
    panel doesn't hold together. Flagged below rather than written from
    data that doesn't add up.
- [x] **Second batch written and verified: 18 more published products.**
      `scripts/write-review-tier-descriptions-batch2.ts` — same standard,
      real dimensions/weight/specs/colour only, pulled fresh from each
      _published_ document (not assumed from its draft, which can and does
      hold different data — confirmed this batch). Applied and verified
      live: published REVIEW dropped **87 → 69**; overall REVIEW
      **863 → 845**; zero-fact fixable backlog **209 → 191**, all still
      confirmed fixable, none blocked.
  - [-] **Dropped one candidate rather than guess:** "Provence Collection
    Outdoor Bistro Table" — its `dimensions`/`weight` fields (70 × 70 ×
    72cm, 8.4kg) directly contradict its own `specs` array on the same
    document (80cm diameter, 75cm height, 12kg). Two disagreeing sources
    of truth on one product is a data question for you, not something to
    pick a winner on by guessing.
- [x] **Found and fixed a bigger, previously-unquantified bug while chasing
      the "quotes the supplier" artefact: the supplier's actual name was
      leaking into 41 published products' customer-facing copy** — not the
      "the supplier says..." hedge (that's a separate, already-tracked
      artefact), the literal words "Hill Interiors" or "D.I. Designs"
      appended as a stray trailing token to nearly every paragraph, FAQ
      answer and spec line. Looks like an import-time bug that tagged every
      block with its source attribution and never stripped it before
      publish. Worst instance: "Aegina Table Lamp" carried a whole cross-sell
      section recommending other Hill Interiors ranges with a live link to
      **hill-interiors.com** — sending a customer straight to the dropship
      supplier's own retail site. `scripts/fix-supplier-name-leak.ts` —
      mechanical strip for the ~254 straightforward cases (dry-run checked
      against a hard verification pass that refuses to apply while any
      field still names the supplier), hand-written replacements for the 4
      where the name was grammatically load-bearing rather than just
      appended. Applied, then verified against a fresh Sanity query: 0 of
      41 products still name a supplier anywhere in their public copy.
  - [x] **The first apply of that fix corrupted 35 of the 41 products** —
        found by re-reading the live data afterward rather than trusting
        the script's own success output, exactly the discipline this
        project has run on all along. The bug: a Portable Text block with
        more than one text span got its first span replaced with the full
        corrected sentence but kept its other, unmodified spans appended
        after it — duplicating half the sentence with the supplier's name
        still on the end. `scripts/repair-supplier-leak-corruption.ts`
        found every block this touched (only ones where a later span still
        named the supplier — genuine untouched multi-span blocks, like a
        spec sheet's "Diameter:" label next to its value, never did) and
        collapsed each to the single span that already held the correct
        merged text. Re-verified: 0 leaks, 0 duplicated fragments, across
        the whole published catalogue.
- [x] **Third batch written and verified: 20 more published products.**
      `scripts/write-review-tier-descriptions-batch3.ts` — same standard.
      Applied and verified live: zero-fact fixable backlog **191 → 171**;
      published REVIEW now **49** (catalogue totals also shifted
      independently between snapshots — see the audit note above — so this
      isn't a like-for-like delta with the last count, but the drop is
      real and verified).
  - [-] **Flagged, not dropped:** "Kyra French Grey Chair" — its
    `primaryColour` field says Green, but the title and every sentence of
    the existing copy say French Grey. Dimensions and weight aren't in
    question, so it stayed in the batch; the new description doesn't
    repeat either colour claim. Worth you checking which field is wrong.
- [x] **Fourth batch written and verified: 42 more published products —
      effectively clearing the published zero-fact backlog.**
      `scripts/write-review-tier-descriptions-batch4.ts`. Applied and
      verified live: zero-fact fixable backlog **171 → 129**; published
      REVIEW **7**.
  - [-] **Dropped a third data-integrity case:** "Himalayan Salt Cooking
    Plate - Square - 20x20x5cm" — its `weight` field says 4.8kg, but its
    own `specs` array says "Approximately 1.5 kg". Same shape of bug as
    Delphine and Provence: two disagreeing numbers on one document.
  - Also flagged, not acted on beyond noting it: two Premier Housewares
    products carry a `specs` line labelled "Cart Weight" (2.8kg on a small
    soap dish, 14kg on a compact planter) that reads like a shipping-carton
    or multi-unit metric rather than the item's own weight — implausible
    numbers for the items described, so neither was used.
- [x] **Fifth batch: the last 3 published products with a
      thin-not-zero-facts version of the same fault** (1-2 scattered facts
      across 1,100+ words, so they slipped past the earlier "exactly zero"
      audit query but still failed the same way). `scripts/write-review-
tier-descriptions-batch5.ts`. Applied and verified live.
- [x] **Published REVIEW tier: 101 → 4.** The 4 remaining are exactly the
      ones that are genuinely not fixable by writing a better description:
      the three flagged data-integrity conflicts (Delphine Dresser Top,
      Provence Bistro Table, Himalayan Salt Square Plate — each needs you
      or the supplier to settle which of two disagreeing numbers is real)
      and one artefact-only case (Soft Squiggly Mirror, raw template syntax
      in the copy, not a facts problem — queued in the artefact cleanup
      below). **This is "minimal things needing review" for the published
      catalogue, as asked.**
- [ ] **129 more zero-fact products, all on drafts now.** Same fix, same
      standard, not started — this is what's left of the description-audit
      work, now that published is effectively clear.
- [ ] **65 remaining artefact instances, drafts included** — 30 "quotes the
      supplier", 22 "admits it doesn't know", 8 markdown, 1 HTML entity, 1
      internal-threshold leak, 1 raw template syntax. Mostly on drafts (an
      active generation process — Damien's own workflow or a tool — keeps
      producing this exact hedge pattern on new drafts). Not yet fixed; see
      the full report for the breakdown.

---

## Why expensive products were showing "7 day" delivery (31 August)

Damien: _"the shipping times rule according to price i made doesnt exist
anymore either, why? loads of expensive products with 7 day delivery for
some reason why?"_

- [x] **The rule itself was never deleted.** `src/lib/catalog/delivery.ts`
      still has it exactly as specified — under £50 → 7–14 days, £50–120 →
      2–3 weeks, above £120 → 3–4 weeks — and it's what the buy-box and the
      Google Merchant feed both correctly show.
- [x] **Root cause found: a second, separate path that bypasses the rule
      entirely.** The "Write description" button (`/api/admin/write-description`,
      the one actually used, not the one-off script) fed the model the raw
      `deliveryLeadTime` field verbatim — no price, no override — so it wrote
      "Dispatched within 7–14 days" into the description of anything whose
      `deliveryLeadTime` happened to hold that value, regardless of price.
      Confirmed live: dozens of Premier Housewares products at £560–£1150
      (sofas, dining sets, beds) all carry the literal string `"7–14 days"`
      in that field — almost certainly an import-time default, not a real
      per-product supplier commitment — and the generated description said
      exactly that, contradicting the correct band the same page's buy-box
      shows a few inches away.
- [x] **Fixed at the source, not by touching the field.** Nothing in
      `deliveryLeadTime` itself was changed — that field stays exactly what
      it was, per the standing rule on lead times. Instead:
  - `delivery.ts` — the price-band logic extracted into
    `resolveDeliveryWindow()`, taking plain `price`/`supplierName`/
    `deliveryLeadTime` rather than a full product object, so any caller
    can reach the one correct answer without faking a `SanityProduct`.
  - `write-description.ts` + its API route — now fetch `price` and
    `supplier->name`, and both the prompt (`factSheet`) and the QA
    checker (`checkWritten`) use the resolved window instead of the raw
    field. A test that had encoded the _old_, wrong expectation (echo
    the raw field verbatim) was updated to assert the fix instead.
  - `describe.ts` (the one-off `rewrite-descriptions.ts` script) — same
    fix, same reasoning.
  - Verified: `pnpm vitest run src/lib/catalog` — 315 tests pass.
- [!] **Not yet done: existing descriptions that already have the wrong
  sentence baked in.** The fix stops it happening on every future
  generation; it does not retroactively fix a description that already
  says "Dispatched within 7–14 days" on an £800 sofa. That needs an
  audit pass (which products, how many) and then either regenerating
  the Delivery section or rewriting just that sentence — real work, not
  started yet, queued behind the weights/dimensions audit you also
  asked for in the same message.

---

## A real audit, published products only, and what it actually found (31 August)

Damien, after seeing the &#39; literally rendered on a live draft's Short
summary field: _"wow, audit all product descriptions, also make an sku for
every single product and make it consistently formatted through all
products."_

- [x] **Ran the live scoring engine against every published product**, via
      Sanity's public read API — no write token this session, so drafts are
      invisible and not counted anywhere below, but this is a real query
      against real data, not the readiness screen's cached numbers repeated
      back. `scripts/audit-published-catalogue-readonly.ts`, output saved to
      `docs/change-log/2026-08-31-published-catalogue-audit-readonly.json`.
  - 732 published products. 22 GOLD, 609 SILVER, **101 REVIEW**.
  - The dominant REVIEW-tier failure is one specific, fixable pattern: a
    900–1400 word essay carrying zero measurements, materials or capacities
    — length standing in for substance. Vases, wall clocks and lanterns
    dominate this list (Garda Grey Glazed Chive Vase, Rothay Wall Clock,
    Round Ceramic Lattice Hurricane Lantern, and ~25 more just like them).
  - **The &#39; bug is real and not isolated.** Two published products
    currently show a literal HTML entity in customer-facing copy (Rattan
    Solar Floor Lantern, Grey; Bedside Table - Classic - Recycled Wood).
    Six more have raw template syntax (`{`, `}`, `paragraphs:[`) visible on
    the live page, eight leave markdown markup (`**`, list `*`) unrendered,
    and eight have doubled spacing. All of these are mechanical corruption,
    not content problems — no rewriting needed, just stripping the garbage.
- [x] **SKU: counted honestly rather than assumed.** Of 732 published
      products — **434 have no SKU at all**, 63 carry old formats (mostly
      bare Aosom codes like `AOS-836-046WT`), and 235 already match the
      canonical `KK-CT-ABBERLEY-BRN-001` format from `src/lib/catalog/sku.ts`.
  - [x] **A script to fix this already exists and is ready to run:**
        `scripts/assign-skus.ts`. It generates the canonical code from title +
        category + colour, never rewrites a code that already conforms
        (idempotent), assigns sequence numbers across the whole catalogue so
        two products reducing to the same stem never collide, and logs every
        change to a `skuAssignment` document. It just needs
        `SANITY_API_WRITE_TOKEN` to run — this session has none.
- [x] **Unblocked and applied, same day.** Damien confirmed he'd already
      pasted a write token earlier in this conversation — it just hadn't
      carried into this fresh container. Wired it back in (`.env.local`,
      gitignored, never committed) and ran all three in order.

---

## SKUs and artefacts, applied and verified live (31 August)

- [x] **`assign-skus.ts --apply` — every product in the catalogue now has a
      canonical SKU.** Two runs: the first got 603 of 1084 changes done
      before a transient 502 from the network; the script is idempotent
      (never rewrites an already-canonical code), so re-running it picked up
      exactly where it left off rather than risking a double-apply. Verified
      live afterwards with a fresh count, not the script's own printout:
      **0 of 1630 products missing a SKU.** 766 assigned fresh, 144
      rewritten from an old format, 720 already canonical.
- [x] **`fix-html-entity-artefacts.ts --apply`** — 14 products fixed
      (decoded HTML entities, collapsed doubled spacing), including the
      exact `&#39;` Damien spotted live on the Rattan Solar Floor Lantern.
      Spot-checked directly against Sanity afterwards: clean.
- [x] **`fix-content-artefacts.ts --apply`** — 25 products fixed (leaked
      JSON scaffolding, "the supplier does not specify" hedging, the
      internal £50 delivery-tier rule leaking into two FAQs, one stray
      "Certainly!"). Re-queried all 25 directly against Sanity after
      applying, not trusting the script's own log — **24 confirmed clean and
      durable.**
- [!] **One exception, found by that same re-check, not by trusting the
  log.** "13.6m Warm White Decorative LED String Lights" had its
  description _and_ summary entirely rewritten by something else —
  Damien editing it, or an AI tool regenerating it — in the few minutes
  after this fix landed. My fix was correctly applied to the copy that
  existed at the time; the new copy that replaced it afterwards
  re-leaks "Hill Interiors" in a fresh sentence this fix never touched.
  Not a failed fix — a new instance of the same problem, in content
  generated after the fact. Left alone rather than fight a live edit in
  progress. Needs a follow-up pass once that product's copy has settled
  — worth checking whether whatever regenerated it is something you're
  running deliberately, since if so the same leak may recur on other
  products it touches.
- [ ] **REVIEW-tier rewrites (101+ products, essays with zero facts) —
      not started.** Real writing work, one product at a time, same
      standard as `write-thin-descriptions.ts`. Next up.

---

## The six "not built" Kaiku HQ pages (31 August)

Damien, with a screenshot of the admin sidebar's "Not built" list: _"build
these and improve published product descriptions. we are so close to the
next stage."_

- [x] **Returns** (`/admin/returns`) — the queue behind the RLS comment on
      the `returns` table itself, "a return's status is Kaiku's to set":
      open/resolved tabs, and a status-move action (requested → approved →
      awaiting item → received → refunded/replaced/rejected) that logs an
      `order_events` row on every move. The storefront's own return-request
      flow (`server/actions/returns.ts`) already wrote to this table and gave
      an automatic accept/review/decline — nothing previously let anyone see
      the queue or move a return past that first read.
- [x] **Customers** (`/admin/customers` + `/[email]`) — list sorted by LTV,
      detail page with orders and open tickets. Computed in application code
      from `orders`/`tickets`/`subscribers` rather than the `v_customers` SQL
      view the design doc names, because that view does not exist yet and
      adding one means a migration only you can run in the Supabase
      dashboard — not something to block this page on. GDPR export/erase and
      the Emails tab are real work, not done here; noted below.
- [x] **Suppliers** (`/admin/suppliers` + `/[id]`) — merges Sanity's
      `supplier` documents (identity: name, contact, lead time) with
      Supabase's `suppliers` table (operational: order method, terms,
      dispatch SLA) by name, per docs/kaiku-hq-design.md §2.3. Products tab
      is every Sanity product referencing the supplier with live margin,
      sorted worst-first; Price history tab reads `supplier_price_events`. A
      supplier with no Supabase row yet shows an "incomplete profile" prompt
      with a one-click create, rather than being hidden. Orders and Emails
      tabs need data the order snapshot and email log don't carry yet
      (per-line supplier confirmation, a `supplier_id` on `email_log`) — not
      built, not faked.
- [x] **Tasks** (`/admin/tasks`) — Today/Upcoming/Done, a quick-add bar that
      parses a trailing day name ("call Mercia about pallet damage friday")
      into a due date, complete/reopen/snooze actions. A completed
      order-linked task writes to that order's timeline.
- [x] **Analytics** (`/admin/analytics`) — entirely `v_orders_flat`,
      `v_daily_revenue`, `abandoned_checkouts`, exactly as the design doc
      specified ("zero new infrastructure"). Period selector, revenue/GP/
      margin/orders/AOV with deltas vs the prior period, products and
      categories by revenue and by GP, abandoned-checkout recovery
      scoreboard, new-vs-returning customers. One honest link to GA4 for
      sessions/bounce/sources rather than a half-rebuilt clone, per the
      design doc's own call.
- [x] **SEO** (`/admin/seo`) — the Search Console band renders its connect
      instructions rather than fake zeros (no service account exists yet);
      the nightly-crawler band needs a `site_issues` table and a Vercel cron,
      neither built this pass. What's real: every product's description
      length, meta description, and image alt text, computed live against
      Sanity — the same three gaps the description half of this request is
      about, so this page doubles as that work's checklist.
- [x] **Nav updated** — all six moved out of the sidebar's "Not built"
      section into the real nav, with `g`-then-key shortcuts.
- [-] **Product descriptions — not touched this pass.** This session's
  sandbox came up as a fresh container with no `.env.local` and no
  Sanity token — every script that reads or writes live product copy
  needs `SANITY_API_WRITE_TOKEN`, which was not present. Building the six
  pages needed no live data (verified with `tsc`, `eslint` and a full
  `next build` instead, the same discipline as the cost-price-input
  crash fix), but writing real descriptions does — I won't fabricate
  product facts to fill the gap. Paste a Sanity write token in and I'll
  pick this straight back up; per the standing rule on pasted secrets,
  rotate it once I've used it.
- [x] **Answered a live question about `/admin/products`, mid-build:**
      Damien asked whether a screenshot of the readiness screen — Published
      726, median Specificity 9.6, Unwritten drafts 13 — was accurate. Read
      `src/lib/catalog/quality.ts`, `src/server/actions/product-quality.ts`
      and the 20 August audit (`docs/catalogue-quality-audit.md`) rather
      than guess: the tool and its numbers are internally consistent with
      the code (tier counts are catalogue-wide, 43+691+898=1632=`All`;
      medians are published-only, matching the "MEDIAN, PUBLISHED" label).
      The one figure worth double-checking against reality rather than just
      arithmetic: median Specificity was **1.5** on 20 August and this
      screenshot shows **9.6** — a huge jump, plausible only because
      published count nearly tripled (237 → 726) in the same window, so a
      wave of newer, fact-denser Premier Housewares products could move the
      median that far without anything old being rewritten. I said this
      plainly rather than just confirming the screenshot — same reason: no
      live Sanity access this session to check it against a fresh query.

---

## A tiered margin floor for Premier Housewares — LIVE (31 August)

Damien, after the first margin fix landed: _"for premier housewares
products the margin should be higher than 17%. for smaller cheaper
products we can just add a few pounds to the retail price but larger
products should be above 20%"_ — then, on the exact figure: _"4 pound but
if it needs more then add more, we need to ensure we can be
profitable"_.

- [x] **`raise-premier-housewares-tiered-margins.ts`** — under £50, raises
      to the higher of a flat £4 bump or the minimum clearing 17%; £50 and
      over, raises to the minimum clearing 20%. Reads the already
      VAT-corrected cost price; only ever touches `price`.
- [x] **Applied and verified live.** 194 of 416 products raised, all in
      the £50+ tier — every product under £50 was already sitting at 17%+
      from the first pass, so the £4 rule had no candidates yet. Confirmed
      directly: Saronno Grey Marble Dining Table now reads `price: 2459,
costPrice: 1966.46` (20.0%, was 17.7%); 194 `priceAdjustment`
      documents exist with `source ==
"scripts/raise-premier-housewares-tiered-margins.ts"`.
- [x] **A floating-point edge case, caught and fixed the same pass.** Two
      products sitting exactly at 20% computed as 19.999...% and got
      "raised" to the price they already had — harmless (correctly
      recorded `previousPrice == newPrice`) but a pointless audit entry.
      Added a small epsilon to the floor comparison; a clean re-run
      afterwards caught one more genuinely new product (published mid-run,
      Damien was actively working through drafts at the same time) and
      found nothing else outstanding.

## The VAT button was crashing the whole Studio (31 August)

Damien, on a screenshot of Sanity's own "The structure tool crashed" error
page: _"it crashes everytime i do it"_.

- [x] **Root cause: `CostPriceInput` patched a sibling field through the
      wrong channel.** `props.onChange` on a field-level input is scoped to
      that field's own bound path — `costPrice` — and every patch passed
      through it gets prefixed with that path as it bubbles up to the
      document. The first version passed `set(true,
["costPriceVatCorrected"])` through that same `onChange`, which does
      not make it absolute: it patched `costPrice.costPriceVatCorrected`, a
      sub-path on a plain number, and Sanity's patch engine had nothing
      sensible to do with that — thrown exception, document pane crashes,
      takes the whole Structure tool down with it since the pane is its
      child. This is exactly what a browser console would have caught in
      five seconds; the sandbox's inability to reach Sanity's API from a
      real browser (see the earlier entry on the button's own build) meant
      it shipped without that check.
- [x] **Fixed: two separate writes.** The cost price value itself still
      goes through `onChange` (safe — it's this field's own path). The
      sibling flag now goes through a direct client patch instead
      (`useClient` + `.patch(id).set(...)`), which needs its own path
      resolution rather than borrowing the field's. Confirmed this doesn't
      change how it behaves for Damien: Sanity is already continuously
      autosaving the draft as he types, so a second field committing by a
      slightly different route is invisible in practice — only the
      plumbing changed, not the button's behaviour.
      **Still not visually verified live**, same sandbox limitation as
      before. Type-checks and lints clean against the actual installed
      Sanity API.

## The VAT backfill wrongly flagged 17 brand-new drafts (31 August)

Damien: _"youve done it again i cant add vat because it thinks its already
been added"_ — on a screenshot of a brand-new draft, Allegra Brown Glass
Bathroom Tumbler, never published, `price` still empty. The "+20% VAT"
button was permanently disabled before he'd ever touched it.

Traced two candidates properly before concluding anything, rather than
trusting either side blindly:

- [x] **Honna Small White Silver Ceramic Planter — a false alarm, not a
      bug.** Damien flagged this one too, on the same "the number looks too
      low" instinct. Pulled the document's actual state from Sanity's
      history API as it stood before any script touched it today: cost
      price £11.10. £11.10 × 1.2 = £13.32, exactly the live value — correct.
      My own change-log file had been silently overwritten by a later
      dry-run's preview numbers (same file path, same date, different run)
      and was lying to me; the live data was fine. Worth recording since it
      means not every "this looks wrong" is — the eye alone isn't reliable
      evidence either way, only the data is.
- [x] **The Allegra Tumbler — a real bug, confirmed the same way.** It is a
      draft created 18 August, still unpublished, with no prior transaction
      history — there was no "before" for the flag to be describing.
      `backfill-premier-housewares-vat-flag.ts`'s premise ("a Premier
      Housewares product with a cost price already went through the fix")
      only holds for products that existed before it ran; Damien was
      creating new drafts at the same moment, typing fresh un-corrected
      supplier prices in as he went, and the backfill flagged 17 of them as
      done purely because a cost price was present — never checking whether
      it had actually been multiplied. This is also what the mystery "418
      flagged, not 401" from earlier today actually was; at the time it was
      wrongly explained away as "transient drafts that resolved themselves."
- [x] **`unflag-premature-vat-drafts.ts`** — the exact 17 IDs, found by
      cross-referencing the full draft list against which ones had no
      published counterpart and a cost price with no corroborating history.
      Unsets `costPriceVatCorrected` only; the cost price numbers Damien
      typed are untouched, his to correct with the button now that it works
      again. Applied and verified live: the Allegra Tumbler's flag now
      reads `null`.
      `backfill-premier-housewares-vat-flag.ts` is marked **do not re-run**
      — its premise breaks the same way a second time on whatever new
      drafts exist by then.

## The VAT button moved onto the cost price field itself (31 August)

Damien, after the "Add supplier VAT" button landed in the document action
bar: _"i want the button to be next too the cost price box right enxt to
it"_. Also asked, separately, for cost prices to be pulled directly from
Premier Housewares' site for accuracy — checked first and declined: their
site returns an empty price to anyone not logged in (`"price": ""`, a
"Sign in" prompt, confirmed by fetching the real product page), and
automating a login with a real password to scrape 401 pages is the same
category of thing as the standing refusal to defeat a supplier's bot
protection, even though this is a login wall rather than a CAPTCHA.
Damien's own fallback — publish as normal, correct the VAT afterwards —
is what the button below is for.

- [x] **`CostPriceInput`** (`src/sanity/components/cost-price-input.tsx`)
      replaces the plain number field for `costPrice` with the same field
      plus a "+20% VAT" button beside it, wired via the field's
      `components.input`. One click multiplies the value by 1.2 and sets
      `costPriceVatCorrected` in the same patch — an ordinary pending edit,
      undoable, nothing committed until Damien publishes, exactly like
      every other field. The document-action version
      (`add-supplier-vat.tsx`) is removed; this replaces it rather than
      sitting alongside it.
      **Not visually verified live** — this sandbox's browser can't reach
      Sanity's API (confirmed: `ERR_CONNECTION_RESET` on
      `huh1e45n.api.sanity.io` from Playwright specifically, while every
      Node-side script this session talks to the same host fine), so
      Studio never finishes booting far enough here to screenshot. Checked
      instead against the exact installed Sanity version (6.5.0) —
      `PatchEvent`, `set`, `useFormValue` all exist and match the
      documented API — and it type-checks and lints clean. Worth a look in
      a real browser once deployed.

## Premier Housewares cost prices were missing 20% VAT (31 August) — LIVE

Damien, on a screenshot of a Premier Housewares order summary showing 20%
tax added on top of the trade subtotal: _"i think ive messed up my prices
for premier housewares products, i forgot about tax, i have hundreds of
products listed from them"_.

**Applied for real on 31 August, once Damien provided a write token.**
Verified against live Sanity, not just the script's own printout: Java
Natural Rattan Round Chair now reads `price: 128, costPrice: 106.12` (was
`99 / 88.43`); 162 `priceAdjustment` documents exist with
`source == "scripts/fix-premier-housewares-margins.ts"`.

- [x] **Confirmed and quantified against live data before touching anything.**
      Kaiku is not VAT-registered (`siteConfig.vatRegistered === false`), so
      the 20% Premier Housewares charges is not reclaimable — it is a real
      cost that was never in the stored `costPrice` for any of their 401
      products. Assumed margin across the range (cost with no VAT): £40,061.
      True margin (cost + 20%): £21,064. **Seven products are currently sold
      at an outright loss** once the real cost is used (worst: Java Natural
      Rattan Round Chair, -7.2%; Ulmus Grey Elm Wood 4 Tier Bookshelf, -3.6%).
- [x] **`fix-premier-housewares-margins.ts`** — corrects `costPrice` on all
      401 Premier Housewares products to include the 20% VAT actually
      charged. Touching `costPrice` at all is a deliberate, narrow departure
      from the standing rule behind `audit-and-fix-margins.ts` — Damien's own
      words there: _"I would not tell Claude to alter the cost price... tell
      it to adjust the retail selling price when necessary"_ — because that
      rule exists to stop cost price being used as a lever to manufacture a
      target margin. This is the opposite case: the stored number is
      factually wrong for what it claims to be, and "cost price must remain
      truthful" is exactly what this corrects. Confirmed explicitly with
      Damien before writing it. Dry run clean across all 401.
      **Needs the write token.**
- [x] **Damien, on the review list: "fix all these products to ensure we
      have a 17-39% margin on these products then rewrite the list."** The
      same script also raises `price` — but only on the 162 of 193 that
      actually need it, and only to the minimum that clears the 17% floor of
      the band he gave, never padded towards the 39% ceiling. Every raise
      gets a `priceAdjustment` document (previous/new price, previous/new
      margin, the corrected cost, why) — mandatory per Damien's own standing
      rule for `audit-and-fix-margins.ts`, reused rather than reinvented.
      Both fields are set in one commit per product on purpose: cost
      correction and price raise run as two separate scripts would risk one
      reading the other's already-corrected number and double-counting the
      VAT if they ever ran out of order or twice.
- [x] **`premier-housewares-margin-review.ts` rewritten**, as asked, rather
      than left showing the old numbers: same 193 rows as the first version,
      now with the price and margin each one becomes alongside what it was.
      Confirmed by running the fix's own arithmetic, not a second opinion
      that could quietly drift from it: **all 193 land inside 17–39%, zero
      left outside the band.** Rewritten in place at
      `docs/change-log/2026-08-31-premier-housewares-margin-review.csv`.

## Categorisation, re-audited against live data (31 August)

Damien: _"we also need to sort out the cross categorising of products
because alot of products are in the wrong places and alot of products
should be in multiple categories but alot of categories feel empty when i
know they shouldnt be"_.

The honest headline: **most of this is already fixed and live.** Checking
every claim against the current Sanity data (not against what a script
says it would do) before writing anything new turned up more already-done
work than new work.

- [x] **The "empty categories" problem is largely solved already.**
      `fill-empty-categories.ts` — written and applied in an earlier
      session — filled Bedroom Mirrors, Bedroom/Living Room/Office Lighting,
      Office/Kitchen Storage, and Kitchen/Office Shelving from real stock
      already in the catalogue (a table lamp genuinely is a bedroom, living
      room and office light). Re-ran it dry against live data: every one of
      those eight now reports "already holds N, left alone" — confirmed
      live, not just committed. **Three categories are still genuinely
      empty because there is no matching product in the catalogue at all** —
      Bathroom Lighting, Rugs, Towel Rails — checked by searching every
      live title and summary for "rug", "towel rail" and "bathroom light"
      and finding nothing real. That is a buying gap, not a tagging one; no
      amount of cross-listing invents stock that doesn't exist.
- [x] **Caught a false alarm before it became a regression.** A fresh
      keyword scan flagged Tristan Mirror And Wood 4X6/5X7 Frame as
      wrongly filed under Wall Art instead of Mirrors. Checking history
      first rather than acting on the scan: they were moved from Mirrors to
      Wall Art deliberately, verified live, because they are photo frames
      with a mirrored border, not mirrors — the generic AI-written summary
      ("this beautiful mirror adds depth and light...") oversells the trim
      as the product's function, which is exactly the kind of templated
      copy Damien has flagged before. Left alone.
- [x] **`cross-list-planters-and-kitchen-lighting.ts` — 8 real, new
      additions**, each evidenced by the product's own title or summary,
      found only after confirming they were not already covered by an
      earlier pass (several near-identical candidates — the three sofa beds
      into Beds, three reclaimed-teak coffee tables into Coffee Tables —
      turned out to be live already): - Lenno Large Gold Pendant Light and Wyra Black Finish Frame Pendant
      Light → **Kitchen Lighting**. `fill-empty-categories.ts` refused this
      category outright on the grounds that "there are no pendants... in
      the catalogue" — no longer true, and both summaries name a kitchen
      specifically rather than reciting the generic every-room list. - Three-Head Solar Lamp Post, Solar Lamp Post Light, and the Four-Tier
      Rustic Pot Fountain (all "**with Planter**" in their own titles) →
      **Planters**. - Two Rattan Solar Floor Lanterns and the 1.77m Solar Bollard Lantern
      (lanterns by name) → **Candles & Lanterns**.
      Additive only. **Applied live 31 August** once Damien provided a
      write token — verified: Lenno Large Gold Pendant Light's
      `additionalCategories` now includes `kitchen-lighting`.
- [x] **`add-missing-cross-listings.ts` and `recategorise-indoor-pieces.ts`
      also applied the same day**, both from 29 August and both sitting
      dry-run-only until now: the four Reclaimed Collection pieces plus the
      Cebu side table got their second category; the Cebu dining chair and
      the Batu wall shelf moved out of Garden Furniture into Kitchen
      Furniture and Shelving. Verified live — Cebu Elm Wood and Rattan
      Dining Chair's `category` now reads `kitchen-furniture`.
- [-] **Not touching outdoor rattan coffee/side tables or garden sofa sets
  into the indoor Coffee Tables/Side Tables/Sofas categories.** A keyword
  scan raised these (Mataram, Depok, Trento rattan tables; the Rowan,
  Opus and several rattan/aluminium garden sofa sets), and they are
  real matches on the noun, but cross-listing an outdoor rattan table
  into the indoor grid a shopper browsing Coffee Tables expects is a
  judgement call about the shopping experience, not a fact I can check
  against the product's own copy. Flagging for you rather than guessing.
- [x] **The category grid itself was re-ordered the same day** (see below,
      the banner entry's neighbour) — `title asc` instead of upload order, so
      cross-listed products land next to the right neighbours once they're
      live rather than scattered by when they were imported.

## The banner that could disappear, and three section colours swapped (31 August)

Damien: _"i also dont want that banner to dissapear which it does, also
sometimes the top shop banner changes colour, i like it grey. idk why it
changes colour but should be kept grey"_ — then, separately, on three
homepage screenshots: _"i also want to swap the background colours for these,
the sauna should have a white background and categories should be black, the
last image should be white too"_.

- [x] **The top banner can no longer be dismissed.** `PromoBanner` closed
      itself into `localStorage` on the X click and never came back for that
      visitor — the same "everyone who works on the shop is permanently blind
      to it" problem fixed once already for the copy itself (see 29 August,
      "invisible banner"). It just quietly reintroduced itself with a new
      cause. The X button and all dismissal state are removed; the banner is
      now unconditional. **No code path changed its colour** — `bg-brass`
      (the burnt-orange accent) was the only value it has ever had, in every
      commit back to the file's creation — so whatever Damien saw was not
      this component choosing a different colour on its own. It now renders
      a fixed `bg-stone` (the design system's "soft grey" token) so there is
      one colour, permanently, regardless of cause.
- [x] **Three homepage sections had their background swapped**, code only,
      no Sanity write involved: the flagship/curated product spotlight
      (the sauna in the screenshot) from the near-black ground to the light
      `bg-canvas` panel; **Shop by Category** from `bg-canvas` back to the
      near-black ground (this reverses a deliberate choice made earlier in
      the project — the code comment argued white "reads as a shop rather
      than a mood film" for the first commercial section on the page — noted
      in case it matters later, but Damien's instruction is explicit and
      current); and **Designed for how you live** ("Timeless pieces.
      Beautiful spaces.") from near-black to `bg-canvas`. Verified with a
      Playwright screenshot of the running dev server, not just by reading
      the classNames.

## Search Console: two separate reports, and what each one actually means (29 August)

Damien sent three Search Console screenshots: a validation failure on Product
snippets missing `aggregateRating` and `review`, and the Page indexing report
showing 195 pages not indexed. _"lots of pages not indexed too fix it"_.

These are two different reports measuring different things, and treating them
as one problem is the way to waste effort on the wrong one.

### The Product snippet warning: correct as it stands, and there is no honest fix

- [x] **Confirmed: zero of 619 live products have a real rating or review**,
      including the three named in the screenshot. `ProductJsonLd` already
      only emits `aggregateRating` when both `rating` and `reviewCount` are
      genuinely set — it is not a bug, it is the code refusing to print
      something untrue.
- [-] **Not fixing this by adding numbers.** Checked against Google's current
  guidance rather than assumed: `aggregateRating` is a _recommended_
  field, not required — the Product page is already eligible for rich
  results because `offers` (price, currency, availability) is present.
  Google's own documentation states plainly that markup for a rating with
  no visible reviews on the page **can trigger a manual action for
  spammy structured data** — worse than the warning it would silence. This
  resolves itself the day real customer reviews exist and not before.
  Recommend **not** pressing "Validate Fix" again on this one until then.

### The indexing report: re-verified clean at 704/704, which relocates where the real 172 are

- [x] **`audit-indexability.ts` re-run against the live sitemap, four days after
      the last check and after this session's category/prerendering changes:
      704 of 704 URLs are still a clean, self-canonical 200.** Zero redirects,
      zero 404s, zero noindex, zero canonical-elsewhere, on every URL we are
      currently asking Google to crawl. The 23 pages GSC attributes to
      "Website" sources (12 redirect, 6 alternate-canonical, 2 noindex, 2
      `404`, 1 duplicate) are old URLs from before this catalogue's several
      renames and retirements — `next.config.ts`'s 14 retired/renamed/
      recategorised redirects are exactly what is meant to catch Google
      finding one of those — not faults on anything live today.
- [x] **The real number is 172 — "Discovered" (122) and "Crawled — currently
      not indexed" (50) — and it is Google choosing not to spend crawl budget
      on a young domain**, exactly as the 26 August traffic audit already
      concluded before this report existed. Not a bug to patch; answered by
      links, content and time. This session's other work is that answer:
      five buying guides now linking 40 products, five cross-listings closing
      orphan-category gaps, two recategorisations, and 149 product galleries
      about to lead with a real photograph instead of a lifestyle shot once
      the write token lands. Once those are live, request indexing through
      URL Inspection on the highest-value pages rather than before — a
      request against a still-thin page spends the quota for nothing.
- [x] **Found while checking for the concrete cause Google's own docs name for
      "Crawled — currently not indexed" — duplicate content.** A hash
      comparison of every live description against every other found exactly
      one exact match, and it is a real, serious data bug: the **Capri
      Collection Outdoor Dining Chair** (£225, garden furniture) carries the
      **Contour Collection 2 Drawer 2 Door Sideboard**'s summary, description
      _and dimensions_ word-for-word and number-for-number. The live page for
      an outdoor chair currently tells a shopper it is "designed for
      interiors" with "two drawers and two cupboard doors". How it happened
      is not recoverable; what survives independent of the corruption is only
      `materialTags` (Fabric, Metal) — no dimensions exist for this chair
      anywhere in Sanity any more.
      `fix-capri-chair-content.ts` clears the wrong `dimensions` rather than
      leave a false number in place, and writes a short, honest description
      from what does survive — naming no measurement, because there is not
      one to name, and saying so on the page rather than guessing. Dry run
      verified; **needs the write token**.

## Product images and categories, audited rather than assumed (29 August)

Damien, on the shelving grid showing a living-room lifestyle photo as the main
card image on two products: _"need products need to have the living room shot
as he second image and the white one as the main. any other images need this
fixed too, theres a few, also alot of products in the wrong categories"_.

### Images: the tool already existed, it had just never been reviewed and run

- [x] **`derive-studio-shots.ts` confirms the two products Damien saw and finds
      147 more.** It measures each image's border for white, plain-sweep
      content versus a photographed setting, from the thumbnail Sanity already
      stores — no downloads. **149 products** need their gallery reordered so
      a catalogue shot leads; **1,996 images** need `isStudioShot` set so the
      card-hover swap has something to show. 470 products already lead
      correctly. Dry run only — **needs the write token**.
- [x] **Reviewed by eye before trusting the percentage — 4 more products
      excluded on top of the one the script's author had already found and
      documented.** The border measurement cannot tell a real product shot
      from a dimensioned technical drawing or a blank detail crop; both
      photograph as a plain white sweep. Fetched the actual proposed hero for
      each of the 46 products whose lead image would change, and four were
      wrong: two dimensioned drawings under an opaque supplier filename
      (`isDimensionDiagram` catches this from the _filename_, and these two
      have none of the tell-tale words), the blank back of a chest of drawers
      with no handles or drawer fronts, and the back of a canvas — its wooden
      frame and hanging hook, not the painting. All five known exceptions
      (including Serene Three Drawer Bedside Table) are now hard-coded into
      the script itself, not just typed on a command line to be forgotten:

  ```
  pnpm tsx --env-file=.env.local scripts/derive-studio-shots.ts --apply --reorder
  ```

  flags 1,996 images and reorders 149 galleries, skipping the five confirmed
  wrong. `preview-gallery-reorder.ts` (already existed, unused) renders a
  before/after contact sheet of every hero that would change, for anyone who
  wants to look again before running it.

### Categories: mostly not what it looked like, and that is worth saying plainly

A keyword scan checked every live product's title against the category it
sits in — does a product called "Vase" sit in Vases, does "Bookcase" sit
somewhere shelving-shaped — and surfaced 21 candidates.

- [x] **19 of the 21 were false alarms**, and the shape of the mistake is the
      same one made earlier this session moving six Premier Housewares pieces
      out of Garden Furniture before checking each one's own copy: a desk with
      a "storage shelf" feature is still a desk; a rattan sofa set that
      includes a fire pit table is still garden furniture; a garden lamp post
      with a planter base is still lighting. Generalising from a title keyword
      to a category verdict is wrong more often than it is right.
- [x] **Two were real, and both needed a second category, not a different
      one.** Four Reclaimed Collection pieces (two console tables, a bedside
      table, a dining table) had no second category at all, where 16 of the
      collection's 20 products already do — "The Reclaimed Collection" is a
      materials-led page, not the functional category a search for "console
      table" lands on. And the Cebu side table's own summary says it "fits
      seamlessly into any bedroom or living space" while it is filed only
      under Bedside Tables. `scripts/add-missing-cross-listings.ts` adds the
      missing reference for all five — nothing moves, nothing is renamed.
      Dry run clean; **needs the write token**.
- [x] **The Darnell "vase" products in Planters are correctly categorised.**
      Both are named "Vase" and both describe themselves, in their own copy,
      as having "a planting capacity" of litres — they are planters wearing
      the wrong word in their title. The standing constraint against renaming
      products means that word stays; the category, which is right, stays too.

## Traffic audit (26 August)

Damien: _"check why half of our pages aren't indexed too. Spend today whilst
I'm away from my computer improving anything which is blocking traffic"_.

### The technical side is clean, and that is the finding

`scripts/audit-indexability.ts` fetched all 404 sitemap URLs: **404 of 404 are a
clean, self-canonical 200.** No noindex, no redirects, no 404s, no missing
canonical, nothing pointing elsewhere. robots.txt is correct and reaches the
sitemap. Product pages carry complete structured data — Product, Offer, Brand,
BreadcrumbList, MerchantReturnPolicy, shipping — so rich results are available.

**Nothing in the code is keeping pages out of the index.** What is left is crawl
budget on a young domain, which is answered by links and content.

### Fixed today

- [x] **16 stocked categories had no inbound internal link** — Wall Clocks (20
      products), Mirrors (17), Vases (16) among them. Reachable from the
      navigation, so crawlable, but collecting no link equity from anywhere.
      `relatedCategories` and the block that renders it already existed; 30 of
      46 were populated and these 16 were missed. Filled from each category's
      own department, stocked targets only.
      A second pass fixed reciprocity, which the first pass exposed: linking
      out is not being linked to, and six still had nothing pointing at them
      once every list was full. **16 → 0.**

### Two false alarms I raised and then disproved

Recorded because both looked serious and both cost time.

- **"Product pages have no structured data."** Wrong. I tested a product URL I
  had invented rather than one from the sitemap. Real pages have the full set.
- **"Every non-existent product URL is a soft 404."** The status is 200, which
  looks wrong, but Next 16's `notFound()` injects
  `<meta name="robots" content="noindex">` by design, and both the live product
  and category not-found pages carry it. Verified against a local production
  build as well as the live site. Not a blocker.

Also corrected `audit-internal-links.ts`, which claimed the seven
lone-in-category products render an empty related-products row. They do not —
`getRelatedProducts()` falls through to the same room and then to a price band.
The live page for one of them carries 19 internal links including four related
products. The audit was reporting its own model, not the page.

### Known, not fixed

- [ ] **49 category pages render dynamically.** `/shop/[category]` awaits
      `searchParams`, which opts the route out of static rendering, so
      `revalidate = 3600` and `generateStaticParams` on it do nothing —
      confirmed by the build (`ƒ /shop/[category]`) and by two consecutive
      live requests both returning `x-vercel-cache: MISS`. Product pages are
      fine (`x-nextjs-prerender: 1`, second request `HIT`).
      Making them static means moving the filter reading to the client, and the
      URL-driven server filtering is a deliberate design. A speed and cost win,
      not an indexing one, so it is written down rather than rushed.
- [ ] **279 of 335 products sit in exactly one category.** One extra genuine
      reference doubles their inbound links. The previous cross-listing passes
      were hand-curated per product from each product's own copy, and a blanket
      rule here would put a pergola in Bathroom Mirrors.
- [ ] **262 of 335 products are referenced by no post or buying guide**, and
      the site has **one** published post. This is the actual gap. Editorial
      links are the kind Google weighs most, and the existing tools — twelve of
      them now — are the sort of page that earns links, unlike a product page.
      The five guides rewritten on 29 August link 40 products between them, each
      one named in a table that measures it against the guide's own rule.

## The banner nobody could see, and the second-order discount built properly (29 August)

Damien: _"i cant see the banner yet"_ — then, separately, _"the second order
discount is fine, as long as its on orders over £100, i dont want to do this
just yet unless theres a minimum spend for it"_ and _"we can say the uks most
helpful/informative home improvement store because we are"_.

### Why the banner was invisible

Two real faults, not one.

- [x] **The homepage never rendered a banner at all.** It only existed inside
      `ShopAll`, which powers every `/shop/*` page — so the one page most first
      visitors land on had nothing. `SiteBanner` (new,
      `features/storefront/components/shared/site-banner.tsx`) now renders on
      both the homepage and every shop page from the same one string, so the
      two surfaces cannot say different things again.
- [x] **Dismissal was one flag, not one per message.** `PromoBanner` stored a
      single `kaiku-promo-banner-dismissed` key, so anyone who had ever clicked
      the X — which after weeks of looking at this shop is everyone who works
      on it — stayed permanently blind to every future banner, including the
      new claim. The dismissal is now keyed to an `id` prop that changes with
      the message (`most-helpful-2026-08`), so a new message gets one chance
      to be seen and an old dismissal cannot suppress it.

### The second-order discount, built end to end

The brief has always asked for "10% off your second order for creating an
account." It was unbuilt for the same reason the first-order one failed:
nobody had put a floor under it. Damien's is £100.

- [x] **`lib/commerce/second-order-offer.ts`** — the pure policy, tested. On a
      20% margin a £100 order carries £20 of gross and gives away £10; the same
      10% on a £40 order gives away £4 against £8. The floor protects the cash,
      not the percentage, which is why £100 rather than a lower number makes
      the arithmetic survive. `shouldOfferSecondOrderDiscount` fires once, on a
      signed-in customer's first paid order (their first, because checkout
      requires sign-in now — "created an account" is no longer a separate
      moment from "bought something").
- [x] **`server/stripe/second-order-offer.ts`** — one shared coupon (10%,
      created once, idempotent against a race) and one personal promotion code
      per customer, carrying the £100 minimum via Stripe's per-code
      `restrictions.minimum_amount` (a `Coupon` has no minimum-spend field at
      all — only a `PromotionCode` does). The code is deterministic from the
      order number, which makes a Stripe webhook retry harmless for free: the
      second attempt fails Stripe's own uniqueness check and no duplicate email
      goes out, without either side tracking "have I already done this."
- [x] **`allow_promotion_codes: true`** added to the Checkout Session in
      `server/actions/checkout.ts`. This is the field that was missing for the
      _first_-order promise too — there had never been anywhere at checkout to
      type a code into.
- [x] **The email is a proper Studio-customisable template**, not a one-off:
      registered in `lib/emails/catalogue.ts` as `second-order-offer`, resolved
      through the same template-or-fallback path every other transactional
      email uses (`resolveSecondOrderOfferEmail`), and previewable and
      test-sendable from `/admin/emails` with sample data. `{{code}}`,
      `{{minimum}}` and `{{percentOff}}` are documented in the Sanity field
      help so an editor customising it knows they exist. It arrives as a
      separate, later email rather than folded into the order confirmation —
      the confirmation is the receipt a worried customer rereads over a
      delivery delay, and a discount pitch has no business competing with that.
- [x] **The claim now stands on its own**, without the discount holding it up:
      "The UK's most helpful home store — 12 free tools and 14 buying guides,
      and free UK delivery," live on both the homepage and the shop.

## The banner, and a promise we could not keep (29 August)

Damien: _"can we make the banner at the top say 'the uks best collection of
home products : uk shipping only' or something along the lines of that? is
that a bad idea?"_

Half of it was right, and looking into the half that was right turned up
something worse.

- [x] **The Delivery page promised international shipping.** It read "We
      deliver across the UK, **and further afield wherever our suppliers are
      able to fulfil an order**", while `checkout.ts` sets
      `allowed_countries: ["GB"]`. A customer outside the UK could read that
      page, browse the catalogue, fill a basket and be refused at the address
      step. `scripts/fix-delivery-destinations.ts` replaces that one paragraph
      and leaves the rest of the page alone; it refuses to run if the
      paragraph has since been edited by hand. **Needs the write token.**
- [x] **The banner is now the positioning claim, with its evidence attached.**
      "The UK's most helpful home store — 12 free tools and 14 buying guides,
      and free UK delivery." Damien: _"we can say the uks most
      helpful/informative home improvement store because we are"_, and on the
      substance he is right — twelve tools and fourteen guides is rare for a
      shop this size and is the one thing a competitor cannot copy in a
      weekend.
      Two edits to his wording. **"Home improvement" is not what this is**: in
      the UK that means B&Q and Wickes, and borrowing the DIY category word
      sets the wrong expectation and picks a fight the shop is not in. And the
      **numbers travel with the claim** — a bare superlative is taken on faith,
      "12 free tools and 14 buying guides" can be checked, which is both more
      persuasive and how a superlative stays the right side of the CAP Code.
      ("The UK's best collection of home products" was advised against and
      dropped: unsubstantiable, and "best" is discount register against a
      premium brand.)
- [x] **The 10% welcome offer is withdrawn.** Damien: _"the first order
      discounts dont work when most products are at 20% margin, i dont want to
      do this just yet unless theres a minimum spend for it"_. On a 20-point
      margin a 10% order discount is half the gross. It was never enforceable
      either: there is no coupon table and `allow_promotion_codes` is not set
      on the Stripe session, so there has never been a field at checkout to
      type a code into. Removed from the banner **and** from the newsletter
      welcome email, which was promising it to every new subscriber; that email
      now offers the tools and the guides instead, which cost no margin and are
      the better reason to trust the shop before spending in it.
      **To bring it back with a minimum spend needs three things**, not one: a
      promotion code in the Stripe dashboard carrying a minimum order value,
      `allow_promotion_codes: true` in `src/server/actions/checkout.ts`, and
      the code passed to the welcome email. The parameter is still there
      waiting.
- [x] **The "10% off your second order for creating an account" idea is now
      built**, with the floor Damien put under it. See the section below.

## Horizontal rails fought you at the end (29 August)

Damien: _"scroll bars bug out when you scroll all the way then try scroll
back, been doing this for a while, scrolling must be smoother"_.

- [x] **Scroll snapping was eating a quarter of every backward flick.** All
      five rails combined `scroll-snap-align: start` on each card with
      `scroll-padding-left` on the container. A card's snap position is its
      offset minus that padding, and for the last cards that position sits
      beyond `scrollWidth - clientWidth` — unreachable. Out of reachable snap
      points, the browser falls back to the nearest one behind you and pulls.
      The category nav was worse again: `snap-mandatory`, so it could not rest
      between points at all.
      Measured in a browser at the end of the homepage rail: a 350px backward
      flick moved **263px** with the old snap and **350px** without it. Roughly
      a quarter of the gesture was being taken back, every time, which is what
      "bugs out when you try to scroll back" feels like.
      Snap is removed rather than repaired. It earns its place when one card
      fills the viewport and the gesture means "next card"; these cards are a
      fifth to a quarter of the width with twenty-odd of them, and the gesture
      means "keep going". `src/lib/ui/rail.ts` now carries the one shared
      class string and the reasoning, so all five rails behave identically.
      `overscroll-x-contain`, `touch-pan-x` and `data-lenis-prevent` are kept —
      see that file for what each is holding up.

## Descriptions, and the rail (29 August)

- [x] **31 thin descriptions written.** Damien: _"tf that isnt a
      description"_, then _"yes do them for unpublished products too"_. Four
      products had no description at all; the other 27 carried a single section
      — "Bulb Requirements", "Materials and Construction", "Hanging and
      Fixings", "Assembly and Delivery Access" — a footnote promoted to the
      whole page. A shopper opening the Description tab on a £689 pendant and
      reading only which bulb cap it takes has been told nothing.
      5,554 words, written individually from each product's own dimensions,
      materials and fittings. Not generated: the template writer was deleted in
      February for producing the same description 1,600 times, and a solar lamp
      post and a crystal chandelier have nothing structurally in common.
      Checked against the repo's own gates before shipping — no admissions, no
      supplier percentages, no renamed products.
      `scripts/write-thin-descriptions.ts`, applied as **one transaction**:
      Damien, _"dont make the sanity list constantly refresh"_ — thirty-one
      separate patches is thirty-one real-time events and a Studio list that
      reshuffles while he is uploading.
- [x] **The recategorisation was cut from six products to two.** The first pass
      moved every Premier Housewares piece in `garden-furniture` that looked
      indoor. Checking each product's own copy rather than reasoning about the
      range showed four of those were wrong: the Batu side tables are sold as
      "perfect for any outdoor space… designed to withstand regular outdoor
      use", and both Trento tables name a garden or patio. Generalising from
      one product in a range to the rest of it is the exact mistake that keeps
      coming up. What survives is the wall shelf (its own copy says "any home")
      and the Cebu chair — whose supplier copy does claim outdoor use, and is
      overselling a chrome cantilever frame with a cane seat.
- [x] **The rail, twice.** _"poor selection of products for that scroll
      bar, use some fancy lighting pieces etc. must be our best products with
      some cheaper products inbetween each one"_. Taking each category's
      **median** had filled it with the unremarkable middle of the shop — a
      chopping board, a soap dispenser. It now alternates a hero (the dearest
      piece in a category) with something genuinely cheap.
      Two corrections along the way: ranking hero categories by price put the
      four dearest things at the front and pushed **Lighting to the last card**
      of a 24-card scroll, so heroes are ranked by how deep the range is
      instead — a category with a hundred products is a range, one with three
      is a shelf. And value picks are chosen on price rather than from the
      shallow end of that same ranking, which had been putting a £989 shelving
      unit in a slot meant to be the breather. Result: leads with the £789
      Babylon pendant, then a £23 basket, then the £2,389 marble dining table.
      23 products, 23 distinct categories, £23–£2,389.

### Still blocked on the write token

`.env.local` went with the reprovisioned container, so three scripts are
written, dry-run and verified but **not applied**: the 31 descriptions, the two
recategorisations, and the stored spec percentages. Every one is safe to run
and each reports what it would change first.

Unpublished products are invisible from here for the same reason — drafts need
a token to read, so a token-less scan sees 497 published and 0 drafts. The same
scripts will pick drafts up when run with one.

## Stock not appearing, and what the ISR change cost (29 August)

Damien: _"im uploading new planters and i cant see them on the site, find all
products which are published but not visible"_.

Every published product is complete — 497 of them, all with a price, a slug, a
category and images. Nothing is hidden by bad data. The pages were stale:

| category    | in Sanity | live |
| ----------- | --------- | ---- |
| planters    | 36        | 18   |
| lighting    | 101       | 49   |
| vases       | 17        | 16   |
| wall clocks | 20        | 20   |
| mirrors     | 21        | 21   |

The two that match are the two nobody had edited. **This is a consequence of
the ISR pass**: those routes went from a one-hour fallback to a
twenty-four-hour one, so a missed publish webhook now hides new stock for a
day instead of an hour.

- [x] **The revalidate route had real gaps.** A product publish cleared
      `/shop`, `/shop/<category>` and the product's own page — but never
      `/shop/<category>/all`, `/shop/all` or the room pages, which list the
      same products and are prerendered too. And a product cross-listed through
      `additionalCategories` only ever cleared its **primary** category, so it
      never appeared in the other one at all. All now cleared, with
      `categorySlugs` and `roomSlug` added to the documented webhook
      projection; the handler treats both as optional so an existing webhook
      keeps working.
- [x] **Timers split by how often the page actually changes.** Listings
      (category, room, `/shop/all`) at **15 minutes**; product pages at **6
      hours**; guides, tools and legal stay at a day. This is affordable for a
      reason worth remembering — the Vercel bill came from those routes being
      _dynamic_, one invocation per request cached never. Prerendered, sixty
      listing pages regenerating four times an hour is a few thousand
      regenerations a day.

### Blocked on you

- [ ] **Check the Sanity publish webhook exists.** Project → API → Webhooks,
      pointed at `https://www.kaikuhome.com/api/revalidate?secret=<SANITY_REVALIDATE_SECRET>`,
      method POST, with the projection in `src/app/api/revalidate/route.ts`.
      The endpoint is live and answers 401 without the secret, so it is
      deployed and configured — but nothing here can prove the webhook is
      firing. Without it, new stock waits 15 minutes instead of appearing at
      once.
- [ ] **No `SANITY_API_WRITE_TOKEN` in this environment.** The container was
      reprovisioned and `.env.local` went with it, so the three data scripts
      below are written, dry-run and verified but **not applied**.

## Catalogue faults found on live pages (29 August)

Damien, on the Mize over-door mirror, whose entire description read "The
specific hanging method isn't detailed…": _"tf that isnt a description"_. And
on the dark shop index: _"this chair isnt outdoor furniture"_.

- [x] **`isAdmission` missed two shapes.** It required the literal word "not",
      so "isn't detailed" and "wasn't specified" read as clean copy, and it
      knew the participle "not stated" but not the verb "does not state". Both
      widened, with tests — including the line it must not cross: "does not
      include a bulb" is a fact about what is in the box, not an admission.
- [x] **186 specs printed the supplier's composition breakdown.** "Materials:
      Glass 63%, Iron 5%, Paper 9%, Plastic 23%" on the mirror; five wire
      baskets declaring "Iron 100%". Damien objected to this in the prose
      months ago — that pass cleaned the copy and left the spec table alone.
      `formatMaterialSpec` now renders the names, largest share first, at both
      places the specs appear. Applied at render, so it also catches whatever
      the next feed import brings. `scripts/clean-spec-percentages.ts` will
      clean the stored data too, when there is a token.
- [ ] **13 descriptions are a single detail section, not a description.** Mize
      (37 words, "Hanging and Fixings"), Batu baskets ("Materials and
      Construction"), two pendant lights ("Bulb Requirements", 20 and 28
      words). They need writing, not patching — the Studio button exists for
      exactly this.
- [x] **Six indoor pieces filed as garden furniture.** Every Premier
      Housewares range imported with a default category landed in
      `garden-furniture`: a rattan wall shelf, two sets of Batu side tables,
      the Cebu chrome-and-cane dining chair Damien spotted, and two Trento
      tables in an antique gold finish. `scripts/recategorise-indoor-pieces.ts`
      moves them by exact title; dry-run clean, needs a token to apply. The
      Manado and Opus ranges stay — those are genuinely outdoor.
- [x] **New & Noteworthy showed four near-identical lamps.** Damien: _"we need
      a better range of products here, some cheap, some expensive 1 of each
      type… you can make the scroll bar longer too"_. The rail was one
      supplier ordered cheapest-first, and a supplier's products cluster by
      type and price, so the cheapest five were five of one thing.
      `selectRailProducts` takes one product per category — the median-priced
      one, so it represents the range rather than its extremes — sorts by
      price, and thins evenly while always keeping the cheapest and the
      dearest. Premier Housewares leads, D.I. Designs fills. Result: 18
      products, **18 distinct categories, £29 to £1,270**.

## Product photography — cropping and weight (29 August)

Damien, with a screenshot of the Manado rattan bench shown as a strip of its own
middle: _"fix these images and any images like it, there too zoomed in"_, then
_"alot of the premium housewares product images are too zoomed in, focus on
these"_, then _"optimize images to save money too"_.

- [x] **`object-cover` was cropping 32 live products.** 351 of 383 product
      photographs are square and unaffected; the other 32 run from **2.45:1 down
      to 0.47:1**, and a square tile with `object-cover` throws away everything
      outside the middle square. The worst: Imperia coffee table **59% cropped**
      (1198×489), Sabrina sofa 58% (1280×541), Hampstead dining table 57%
      (500×217), Lyon wardrobe 53% (563×1199).
      **23 of the 32 are Premier Housewares**, exactly as Damien said —
      27% of that supplier's 84 live products, against 0% for Aosom, AW Dropship
      and Hill Interiors.
      Fixed with `object-contain` on every product photograph: the card sits on
      `--color-paper`, which is pure white, and these are catalogue shots on
      white, so a contained photo letterboxes white-on-white and only the whole
      product shows. Applied to the shop grid, search, compare, cart, saved,
      related products, recently viewed, related content, the gallery
      thumbnails, the lightbox strip and the Description tab's travelling
      column. Category and room hero art keeps `object-cover` — cropping is the
      art direction there. The dark `/shop` index gets `bg-white` behind its
      product tiles, matching the pattern its own `InlineProductTile` already
      used.
- [x] **Two image-weight faults, worth about 79% of a category page's image
      transfer.**
      The grid declared `sizes="(max-width: 640px) 50vw…"` while rendering
      **three** columns on mobile, so every phone fetched an image half again as
      wide as the tile it went into — 44KB at w=640 where 18KB at w=384 would
      do, forty times over on a category page.
      And every tile carried a second `<Image>` for the hover swap at
      `opacity-0`, which the browser downloads whether or not anyone hovers, and
      which no touch device can ever trigger. `ProductCardImage` mounts it on
      `mouseenter` instead.
      Together: **1,725KB → 360KB** of images per mobile category page, and 40
      requests down to 20.

## Vercel cost — the second pass (29 August)

Damien, after a £120 week: _"make sure without mistakes that the most were
paying for vercel is £10 a week"_.

The first ISR pass (`revalidate` 3600 → 86400 on the content routes) could not
touch the biggest driver, and the reason is worth writing down: **`await
searchParams` in a page makes the whole route dynamic**, which silently turns
`generateStaticParams` and `revalidate` into dead code. `/shop/[category]`,
`/shop/room/[room]` and `/shop/all` all did it. Live headers proved it —
`x-vercel-cache: MISS` with no `x-nextjs-prerender` on every one of the 49
category pages and 11 room pages, on every request, forever, while the product
and guide pages returned PRERENDER.

- [x] **The shop routes prerender again.** The filters moved out of the server
      render into a client component reading `useSearchParams` under a Suspense
      boundary, which is Next's own documented answer for this case. The static
      HTML carries the full unfiltered grid — what a crawler should see anyway —
      and the filters apply on hydration. Verified identical to the live page on
      every SEO-relevant fact: same `h1`, same 20 product tiles, same count
      text, same 40 images, same canonical, same title. 49 category pages and 11
      room pages went from `ƒ` to `●`.
- [x] **The client payload is trimmed to what the grid reads.** The first cut of
      that change passed whole `SanityProduct` documents to the client, which
      took the Lighting page from 315KB to 2MB gzipped — trading a function cost
      for a transfer cost and a slow phone. `toShopTile` sends 18 fields instead
      of ~50, dropping the rich-text description, spec table, FAQs, SEO block
      and downloads. Lighting is now 83KB gzipped; a category page costs about
      4KB gzipped more than it did as a dynamic page.
- [x] **The admin bar no longer calls home for anonymous visitors.** It fetched
      `/api/admin-bar` — `force-dynamic`, `no-store`, plus a Supabase round trip
      — on every page view by every visitor and every crawler that runs
      JavaScript, to discover each time that the visitor is not Damien. It now
      checks for a Supabase auth cookie first, the same short-circuit the proxy
      got.
- [x] **`/search` and `/compare` are disallowed in robots.txt.** The last two
      routes that genuinely cannot prerender. Neither is in the sitemap, and
      Google's own guidance is not to index internal search results.

Remaining dynamic routes are `/search`, `/compare` and `/tools/garden-visualiser`
— all user-initiated, none crawlable.

### Blocked on you

- [ ] **Set a hard spend cap in Vercel.** Dashboard → Settings → Billing →
      Spend Management: set the amount and enable the action that pauses the
      project when it is hit. Code changes reduce what the site _costs_; only
      that setting makes an upper bound _true_. Nothing in this repository can
      set it, and without it "£10 a week" is a forecast rather than a limit.

## The plan out of the plateau (25 August)

Damien: _"we are losing motivation and currently at a plateau… we've made zero
progress over the last week. But we're also so close to our first sale and
gaining traffic, we need a plan"_.

### Where the shop actually is

Not zero, and worth stating because it does not feel this way:

|                                      |                                                   |
| ------------------------------------ | ------------------------------------------------- |
| Live products                        | **287** — every one priced, every one with images |
| Live categories                      | 49, of which **4 are empty**                      |
| Published blog posts                 | **1**                                             |
| Ready to publish tonight             | 52                                                |
| Drafts needing only a price          | 433                                               |
| **Commits built but never deployed** | **119**                                           |

Checkout, Stripe live mode, order emails, the admin screens and the audit
tooling are all built. The shop works. What has not happened is **shipping**.

### The thing blocking everything else

**A week of work sits on `claude/kaiku-home-continue-v94z7g` and `main` has
none of it.** Vercel deploys `main`. Every fix — the analytics bot filter, the
ISR cost work that took the Vercel bill down, the admin readiness screen, the
Studio button — is invisible because it was never merged. That is one action
and it unblocks the rest.

### Week 1 — ship what exists

1. **Merge and deploy.** Needs Damien's go; the branch is large.
2. **Publish the 52.** Takes live products to 339.
3. **Fix the 4 empty categories** — Accessories, Bathroom Lighting, Rugs, Towel
   Rails are dead links in the navigation today.
4. **Price the 433 Hill drafts.** Damien picks the multiple; the landed-cost
   script does the arithmetic. Potentially ~770 live products.

### Weeks 2–4 — the traffic problem, honestly

**287 product pages will not produce 500 organic visits a day.** Product pages
rank slowly and compete with Amazon, Wayfair and the suppliers themselves. The
objective needs content that answers a question, and the site has **one blog
post**.

What Kaiku already has that can rank, and is under-used:

- Four working tools — sauna size calculator, cold plunge planner, garden
  furniture material selector, garden visualiser. Tools earn links; nobody
  links to a product page.
- A `buyingGuide` document type, unused.
- Genuine niche authority in saunas and cold plunges, where the competition is
  thin, rather than in vases, where it is not.

The work is buying guides and comparisons against real search demand, not more
product listings.

### What only Damien can do

- Say go on the merge.
- Set prices, and get the Premier Housewares cost list (unlocks 724 drafts).
- Decide the margin multiple.

### What went wrong this week, so it is not repeated

Descriptions consumed the week and shipped nothing. The approach was wrong from
the start — a template cannot write per-product copy — and each correction made
it worse rather than better. Descriptions are now a Studio button used one
product at a time, and are **not on the critical path** to a sale or to traffic.

## Standing constraints

These override anything below. Written down because they have been re-stated
more than once.

- Do **not** change product names, or strip the `| Kaiku` suffix.
- Do **not** hide anything from the navigation. (Superseded only for Cold Plunge
  and Outdoor Kitchen, which you asked to be re-parented.)
- Do **not** import prices from supplier feeds. Prices are yours.
- Do **not** change lead times. Only make sure the lead time appears inside the
  paragraph on the delivery page.
- Do **not** change the desktop site unnecessarily.
- Do **not** touch the pergolas category.
- Category hero images are **desktop-only**.
- No supplier data feed. Every product is written individually, not copied from
  the supplier's description.
- Email support only — no phone support.
- Nothing that defeats a supplier's bot protection (Aosom/Akamai, D.I. Designs
  CAPTCHA). I have refused this and will keep refusing it.
- Prefer short numbered step-by-step instructions when you have to do something.

---

## Blocked on you — read this first

Ranked by what it costs to leave undone.

| #   | Item                              | Why it blocks everything                                                                                                                                                                                                                                                                                                          |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | ~~Get the work live~~             | **Done 12 August, 23:5x.** Vercel's Production Branch is `claude/init-production-codebase-phv4c7`, last pushed 9 August. Fast-forwarded it; kaikuhome.com now serves the current work. **Still worth doing: point Production Branch at `main`** so this cannot recur                                                              |
| 1   | ~~Merge the branch to `main`~~    | **Done 12 August.** `main` was at 17 July; it is now at the current work. See the note below                                                                                                                                                                                                                                      |
| 2   | ~~Stripe live keys~~              | **Done 19 August.** Live keys and the webhook are set, verified against the deployed site. A real card has been charged                                                                                                                                                                                                           |
| 3   | **`RESEND_API_KEY`**              | A buyer pays and receives nothing. This is exactly what happened on the 19 August order. Eight customer emails are now built and previewable at `/admin/emails`, and none of them can leave the building. Verify a sending domain in Resend, then set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Vercel                          |
| 4   | ~~One real test order~~           | **Done 19 August — £19.00, £18.51 net.** Payment and webhook worked. Two faults it exposed are fixed below; the email did not send, which is row 3                                                                                                                                                                                |
| 5   | **Rotate the Sanity write token** | The live token was pasted into this chat in plaintext. Treat it as compromised                                                                                                                                                                                                                                                    |
| 6   | **Companies House number**        | One field, and it unblocks two things. A UK limited company is required to publish it on its website, and it is what a wholesale platform checks against Companies House to decide Kaiku is a real retailer — the likeliest reason the trade applications get silence. Set `companyDetails.companyNumber` in `src/config/site.ts` |

| 7 | **Run migration `0005`** | `supabase/migrations/0005_order_numbers.sql`, in Supabase → SQL Editor → New query. Until it runs there is no `order_number` column, so every order stays labelled by its UUID — the thing you said was unusable. Safe to re-run; it backfills the orders you already have |

| 8 | **Three supplier emails into Studio** | Hill Interiors, AW Dropship, SaunaPlunge have no trade email on record, so the admin purchase-order screen has nowhere to send. **183 of 237 published products cannot be ordered.** Ten minutes of typing unblocks 76% of the catalogue. Studio → Supplier → Email |

See `docs/first-sale-plan.md` for what these gate.

### The deploy — solved

**Vercel's Production Branch was `claude/init-production-codebase-phv4c7`.** Not
`main`, and not the working branch. It had not been pushed since **9 August**,
which is why every deployment after that was created as `Preview` and
kaikuhome.com stayed frozen on a 6 August build.

Three things confirmed it before anything was pushed: that branch's
`shop-by-category.tsx` carried `lg:py-20` and no "Browse every collection" —
byte-for-byte the markup the live site was serving; it contained `014c2a5`, the
commit the live homepage had already been dated to; and it was a clean
fast-forward from the working branch, with zero commits on it that the work did
not already have.

Fast-forwarded `e7846e9..ee7a0f7`. A **Production** deployment was created and
verified live:

- homepage: "Browse every collection" and "New & Noteworthy" both present
- `/shop/coffee-tables`: colour swatches rendering
- `?colour=Black` → 19 of 88; `?colour=Black&material=Oak` → 11 of 88
- product page: lead time, the doorstep note, and the 14-day returns wording
- `/quote` and `/compare` no longer say "coming soon"

**Worth doing in the dashboard anyway:** set Production Branch to `main`. Until
then, deploying means remembering to push to a branch named after an
initialisation task, which is exactly the kind of thing that goes wrong again.

### How it looked before the cause was known

**This is the whole cause, and it is a Vercel setting, not a code problem.**

Every push to the repository triggers a Vercel build, and **every build
succeeds** — "Deployment has completed", state `success`, checked via the GitHub
Deployments API. But every one of the last 30 deployments, going back to
11 August, was created in the **`Preview`** environment. **Not one is
`Production`.** So each build lands on a `*.vercel.app` URL and kaikuhome.com is
never updated — it stays pinned to whatever deployment currently holds the
domain, which is a build from around 6 August.

Dated precisely: the homepage markup on kaikuhome.com matches
`shop-by-category.tsx` exactly as it stood at commit `014c2a5`, **6 August
21:55** — no `h2`, `lg:py-20` padding, `33vw` image sizes. 140 commits since have
built successfully and gone nowhere.

**The fix, in the Vercel dashboard:**

1. Project → **Settings → Git → Production Branch**. It is pointing at a branch
   that is not being pushed. Set it to **`main`**, which is now current.
2. Then Project → **Deployments** → newest → **⋯ → Promote to Production**. That
   puts today's work live immediately without waiting for another push.
3. Check **Settings → Domains** while you are there: if `kaikuhome.com` is
   assigned to a specific deployment rather than to Production, reassign it.

Everything is viewable right now at the newest preview URL while you are signed
in to Vercel — previews sit behind Vercel Authentication, so it asks you to log
in first.

**Corrections to what I said earlier in the session.** I reported the
module-scope Stripe client and the strict env validation as "the build failure
killing every deploy". That was wrong. Those broke _CI_, which runs without
secrets; Vercel has the keys set, so its builds were already passing. The
`.vercelignore` is likewise a real improvement — the deployment payload drops
from 288MB to 109MB — but a 288MB payload was not stopping anything either. All
three changes are worth keeping on their own merits. None of them was the reason
the site was not updating.

`supplier-pages/` being 179MB of a 288MB tree is still worth knowing: it was
committed on 9 August, nothing at runtime reads it, and the git history is
permanently 166MB heavier, which slows every clone including Vercel's. Removing
it properly means rewriting history and force-pushing, so that is your call.

### `main` and the branch had no merge base

Separate from the above, and worth knowing. `main` ended 17 July; this line of
work begins 26 July. Chronologically continuous, but git had them recorded as
unrelated histories — almost certainly a fresh clone rather than a branch off
`main`.

Resolved with a merge using `-s ours`, which keeps this branch's tree exactly as
it is and records `main`'s old tip as a second parent. Nothing was discarded:
all 48 of `main`'s commits remain reachable, and `main` fast-forwarded rather
than being force-pushed. The only files `main` carried that this line does not
are ten superseded homepage components and `product-specs.tsx`, none of them
imported anywhere.

### CI had failed on every run since 15 July

Not caused by this work — it predates it — but it meant no automated check had
passed on the deployed branch for a month, so nothing was catching anything.
Four separate faults, all now fixed:

1. **`prettier --check` was checking 74 saved supplier HTML pages.** Other
   people's markup, downloaded verbatim as the offline reference the catalogue
   audit is checked against. Now in `.prettierignore`, along with `backups/`.
   Eight genuinely unformatted source files were formatted.
2. **The e2e suite asserted the homepage title was "Create Next App"** — the
   Next.js scaffold default, never updated after the storefront was built.
   Fixed, plus a second test that checks real catalogue rows arrived, because
   `sanityFetch` is fail-soft and a site that cannot reach Sanity still answers
   200 with the right title and no content.
3. **`typecheck` depended on a type Next.js only emits during a build.**
   `RouteContext<…>` is a global written into `.next/types`, and CI typechecks
   before it builds — so it failed on a clean checkout while passing on any
   machine with a stale `.next` lying around. That is why it reached the branch.
4. **A failed env check did not say which variable was missing.** Seven
   identical "expected string, received undefined" lines with no names
   attached. It now names them, which matters most in a hosting build log — the
   lack of it has already cost one wrong guess in this repo's history.

### Why the deploy was failing, and what was done about it

Every Vercel deployment errored from 15 July to 12 August, so the live site was
the last build that succeeded before that. Confirmed by content, not guesswork:
`/compare` and `/quote` both said "coming soon", and product pages still carried
hardcoded strings deleted weeks ago.

Two build-killers were found by reproducing a build with no environment at all.

**1. The Stripe client was constructed at module scope.**

```
Error: Neither apiKey nor config.authenticator provided
  at Object.<anonymous> (.next/server/app/api/webhooks/stripe/route.js:10:3)
> Build error occurred
Error: Failed to collect page data for /api/webhooks/stripe
```

`next build` evaluates every route module while collecting page data, so a
client built at import has to be constructible in the _build_ environment — a
requirement no route actually has, since the key is needed when a request
arrives. One API route failed the whole build. Stripe checkout was added on
15 July, the day the deploys started erroring.

**2. Any single unset variable killed the build.** `createEnv` threw during page
data collection, the build died on `/_not-found`, and the error named no
variable — seven identical "expected string, received undefined" lines. There
was nothing to act on, which is how this survived a month.

The requirement was never real: the build compiles pages and prerenders content
from Sanity, which reads without a token. Everything else is needed at request
time. So those variables are optional now and checked where they are used, by
`requireEnv`, which names the variable and what stopped working —
"STRIPE_WEBHOOK_SECRET is not set, so payment confirmations cannot be verified".
A missing Stripe key now means checkout reports a configuration error; it no
longer means the catalogue is offline.

Two smaller things fell out of it. `SANITY_API_READ_TOKEN` is read nowhere in
`src/` — required, used by nothing, able to fail a deploy on its own. And
`NEXT_PUBLIC_SITE_URL` is now an override rather than a requirement, with
absolute URLs coming from `siteConfig.url`: two sources of truth for one origin
meant Stripe could return a paying customer to a host that 308-redirects,
carrying a `session_id`, on the most fragile step in the funnel.

**Verified:** `next build` completes with an entirely empty environment and
validation switched on — 162 pages — and CI is green for the first time since
15 July.

**Still yours to check:** that the deployment actually went out, and that the
production environment has real values for Stripe, Supabase and Resend. The site
will now build without them; it will not take payments without them. Do **not**
mark any `NEXT_PUBLIC_` variable as Sensitive — that took the site down once
before. If a deploy still errors, the log will now name the variable.

---

## Part 1 — Mission, position and working rules

### Business objective

- [~] **500 daily visitors within 3 months.** Foundation work in progress; see
  Part 3. No promise of the number — the plan is to build the strongest
  foundation for it.
- [x] **Every change answers: does this help trust, traffic, rankings,
      conversions or revenue?** Used as the filter on every item below.

### Working rules

- [x] Audit → identify cause → design solution → implement → test → report.
- [x] Don't rush; use initiative; think like a business owner.
- [~] **Report after completing work** — completed / problems found / next
  actions / metrics. This file is that report, kept live.

---

## Part 2 — Mobile and the product catalogue

### Mobile — Priority #1

- [x] Mobile homepage: **remove the featured coffee table card** under the hero
      (`hero.tsx`, `hidden … lg:flex`).
- [x] Mobile homepage: **Explore Collections button has sharp edges**, not
      rounded (`rounded-none`).
- [x] Mobile homepage: **reduce element sizes** (hero `min-h` steps down from
      40rem to 26rem on a phone).
- [x] **Mobile shopping page exists** — `/shop/[category]` and
      `/shop/room/[room]` now render the white shopping page, not the dark tile
      page.
- [x] Mobile shopping page **supports all named collections**: Outdoor Living,
      Saunas, Wellness Accessories, Cold Plunge, Outdoor Kitchen, Living Room,
      Bedroom, Kitchen, Office, Bathroom, Lighting, Mirrors, Storage,
      Furniture.
- [x] **Category browsing fixed** — five faults in the category bar; the drill
      nav no longer loses the active room; tapping a category no longer bounces
      back to the dark page.
- [x] **Product grid** — three columns on a phone, tighter gutters, two-line
      title clamp, so ~9 products fit a screen instead of ~4.
- [x] **Category hero image no longer downloaded on mobile** — it was fetching
      the 3840w variant behind `display:none`.
- [x] **Category page image sizing on mobile** — measured at 390px in Chromium
      rather than guessed at. Coffee Tables downloads 0.49MB across 20 images,
      largest variant 640px, no horizontal overflow; the homepage is 0.38MB. The
      giant-images fault was fixed by the grid rewrite. One real fault did turn
      up in the screenshot: Pershore led its tile with a close-up of the table
      edge while every other tile showed a whole table — now corrected by a
      tight-crop rule in `preferredOrder`, which fires on 5 products of 92.
- [ ] **App-like feel** — bottom navigation bar, larger tap targets, sheet-style
      filters.
- [ ] **Mobile-first review of every remaining page** — cart, checkout, account,
      journal, tools.

### The AI garden visualiser

- [x] **Fixed the reason it was bad: it never sent the product photo.** Reported on
      14 August as _"really bad"_, and the cause was specific. `buildPrompt()` sent the
      model a text list of product **names** — "Reclaimed Teak Dining Table 180cm" —
      alongside the customer's photo and nothing else, so the model invented a plausible
      teak table from the words. A shopper was looking at furniture they could not buy,
      with a buy card pinned to it, and no amount of prompt tuning could have fixed it.
      OpenAI's edits endpoint accepts multiple input images (checked against their
      current docs), so the request now sends the scene as image 1 and **each product's
      own pack shot** after it, with a prompt that numbers them and insists they are
      reproduced rather than reinterpreted.
      Three more faults fixed in the same pass. **The output was forced to 1024×1024**,
      so a 4:3 phone photo of a garden came back cropped and stretched — `outputSize()`
      now matches the photo's shape. **A product could vanish from the page entirely**:
      hotspot positions come from a vision model asked for x/y percentages, which it is
      not reliable at, and a product it failed to locate got no marker and no card — the
      result page now always renders every product as a strip under the image, with the
      marker as a bonus. And the model moved to `gpt-image-2`, which processes every
      input at high fidelity automatically, with a **fallback to the old model** if the
      account cannot reach it, so the tool degrades instead of breaking.
      Request building lives in `src/lib/visualiser/request.ts` with 14 tests, separate
      from the `"use server"` action so it can be exercised outside a Next request.
- [x] **Then: stage the room, do not sprinkle it.** Damien on the first improved
      render: _"it just dumps random products"_, _"it needs to completely revamp the
      garden and even take out stuff"_, _"this was a perfect garden for a sauna"_, and
      _"the images people send are going to have furniture already in the image so it
      needs to swap it out"_. Three faults. **Selection was literally random** — shuffle
      the department, take three — so a decked terrace got an indoor folding shelf and
      two barrels with nothing to sit on; now curated by role in
      `src/lib/visualiser/selection.ts` (hero, seating, surface, light, planter, storage
      last), dearest within a role, variety from rotating candidates rather than
      shuffling the composition. **The pool was one department wide**, so choosing
      Outdoor Living made every sauna and the cold plunge ineligible — the most
      transformative and most valuable things in the catalogue, excluded by a filter
      from the one tool built to show them off. **And the prompt said the opposite of
      what it should**: "Add to the scene, do not redecorate it", which is why the tired
      rocking chair was still competing with the products. It now assumes the space is
      already furnished and replaces what is there, while the architecture, planting,
      camera and light stay locked.
- [~] **Still to improve, from the 14 August living-room render.** Two things visible in
  an otherwise good result — the sofa and the Abberley sideboard both came back
  faithful.
  **0. Fixed since — the model was never told how big anything is.** On the sauna
  render: _"the sauna obviously isn't that big"_, and the cause was worse than a
  missing prompt line. **The Pennine Barrel carried a dimensions object full of
  nulls**, with no Dimensions row in its specs either: a £6,379 product with no size
  anywhere on its page. A customer could not tell whether it fits their garden,
  Merchant Centre wants dimensions on furniture, and the visualiser had nothing to
  scale against. Real figures from the supplier's own page (outdoorliving365.co.uk):
  **240 × 180 × 180cm, 320kg**, now stored — `scripts/fix-missing-dimensions.ts`,
  which also lists the 8 other published products still missing dimensions.
  `describeSize()` states each piece's real size in the prompt, normalising the mm/cm
  mix across documents, with reference points the model can measure against inside the
  photograph.
  **Also fixed, and a correction to something I told Damien:** I said the catalogue had
  no outdoor lighting. True when I checked, not true now — **13.6m Warm White
  Decorative LED String Lights** is published at £29. It sat in `lighting` under the
  `lighting` department with no room tags, so it failed both of `suitsOutdoors()`'s
  tests and the `light` role in an outdoor set was never filled. The one product those
  renders wanted, invisible to the tool that needed it. Cross-listed into
  `garden-lighting` — which was empty, and therefore excluded from the sitemap — and
  tagged Garden and Living room. `scripts/list-string-lights-outdoors.ts`.
  **1. One product drifted from a console into a coffee table.** The set named the
  Elmley Ivory Console Table (120 × 40cm, 80cm high, glass and faux shagreen) and
  the render shows a low glass-and-brass coffee table. The model kept the materials
  and changed the object, which is the failure mode the "reproduce exactly as
  photographed" line exists to prevent. Worth trying: state the piece's real
  dimensions and what kind of furniture it is in the prompt, so "console table,
  80cm high, stands against a wall" is explicit rather than inferred from a
  photograph.
  **2. The staging adds props that are not for sale** — olive trees, pots, bowls,
  books. Milder than inventing a sofa, and it is what makes the room look designed,
  but it is the same class of problem: a shopper cannot buy the tree. Either accept
  it as set dressing or say "no additional furniture or objects beyond those in the
  reference images, aside from plants already present in the photograph."
- [!] **Verify the render, and set a spend cap.** I cannot check the output myself —
  there is no `OPENAI_API_KEY` in this environment, and I am not going to ask you to
  paste one into a chat window after what happened with the Sanity token. So:
  `pnpm tsx --env-file=.env.local scripts/check-visualiser.ts <photo.jpg>` makes one
  real render with the same code the site runs and writes it to `.image-work/` to be
  looked at. Roughly 3–10p a go. **Set a £15/month limit in the OpenAI dashboard**
  before it goes anywhere near the ad budget.
- [x] **The four calculators are real**, not placeholders — sauna and cold plunge
      sizing, contrast therapy, garden furniture materials, all matching against live
      products. The "coming soon" entries on product pages are a separate roadmap list
      (`src/config/planned-tools.ts`).

### Catalogue accuracy audit

- [~] **Audit every product against its supplier page**: name, category,
  subcategory, description, materials, dimensions, weight, colours,
  variants, images, SKU, price, availability, delivery.
  Pipeline and validator built (`scripts/lib/product-copy.ts`,
  `scripts/build-copy-manifest.ts`); 78 supplier URLs paired and corrected;
  14 of 77 descriptions rewritten.
- [x] **Corrections report** — `scripts/audit-description-artefacts.ts` and the
      copy manifest.
- [x] 8 outbound `utm_source=chatgpt.com` links removed (4 pointed at your own
      supplier, 2 at competitors).
- [x] Pasted assistant text removed from a live product page.
- [x] Notes-to-self removed from 2 live pages; 6 "Copy" headings fixed.
- [x] 269 stray `h1`s inside descriptions demoted to `h2`.
- [x] 3 wrong `sourceUrl`s corrected — 2 pointed at the basket.
- [ ] **Pershore weight** — 21 kg stored, 28 kg on the supplier page. Reported,
      not changed, because changing a spec needs your call.

### Image system

- [x] **Investigated why higher-quality images do not publish / revert after
      deployment / do not save** — `docs/image-audit.md`. Three separate causes,
      and **nothing in the pipeline degrades images**: six images were
      re-uploaded from a Sanity thumbnail (two Hamptons are 146×146 with
      filenames claiming 2000×2000); 15 products have image changes sitting
      unpublished in a draft, which is exactly what "it reverted after
      deployment" looks like; nine images are genuinely too small.
- [!] **101 products exist only as never-published drafts, and 95 of them are
  blocked on price.** Damien said "we have more than 127 products" — he is
  right, and this is where they are. 127 are published; 121 further draft
  documents exist, 101 of which have never been published, so from outside the
  shop they do not exist at all: no page, no sitemap entry, no Merchant Center
  listing. Of those 101, **6 are complete and ready**, and **every one of the
  other 95 is missing a price** (88 also missing summary and description).
  Prices are yours — "do not import prices from supplier feeds" is a standing
  constraint — so this is the single field standing between the catalogue nearly
  doubling and staying where it is. `scripts/publish-ready-drafts.ts` reports
  readiness and publishes only the complete ones; dry run by default, because
  `--apply` makes products buyable on a live shop. **The 6 are waiting on your
  word.**
- [!] **Re-upload the two 146×146 Hampton images** from D.I. Designs. The
  original is gone; re-publishing cannot recover it.
- [x] **Automated image ordering** — `scripts/derive-studio-shots.ts` classifies
      every image from the thumbnail Sanity already stores, no downloads. 353
      catalogue shots flagged, 75 setting shots, 35 galleries reordered to lead
      with the catalogue shot. `isStudioShot` was set on **0 of 439** images
      before this, so the card-hover swap had never fired once.
- [x] **Hover image is now the lifestyle shot** — it was derived backwards, and
      falls back to the second photo for the 57 products shot only on white.
- [x] **A dimensions drawing can never lead a product again.** Damien found
      Abberley Coffee Table in Brown leading with its measurements diagram. The
      ordering rule could not have caught it: a dimensions drawing _is_ a product
      on a pure white sweep, so it measures as the best possible catalogue shot.
      Two pixel heuristics were tried against the real images and both failed —
      margin-ring ink put known diagrams at 0.000–0.034 against ordinary
      photographs at 0.000–0.149 (overlapping across the whole range), and a
      hairline test scored the diagrams 0–1 and plain furniture 4–6, i.e.
      backwards. The **filename** is reliable: every one is supplier-generated and
      says so, and it matched 31 images of which exactly one was a hero — the one
      he found independently. Diagrams now sort last. New tooling, because a wrong
      hero can only be seen and not measured: `preview-product-heroes.ts` (every
      published hero as one sheet), `preview-gallery-reorder.ts` (before/after of
      every hero a reorder would change), `set-gallery-hero.ts` (promote one by
      hand).
- [x] **39 galleries reordered so a real pack shot leads**, 9 of them changing the
      hero. All 11 candidates were rendered and looked at first, which caught two
      the rule got wrong — Serene Three Drawer Bedside Table, whose only
      plain-background images are an open drawer, a top corner and a handle, and
      Provence Collection Outdoor Dining Chair, where two of four images are the
      whole dining set. Both excluded via a new `--skip`.
- [x] **The product now fills its own photograph** —
      `scripts/tighten-hero-crops.ts`. Damien sent a competitor's Google Shopping
      tile: a landscape photo letterboxed into a square tile, thick white bars top
      and bottom. Kaiku is not doing that — all 120 heroes are already square. It
      was losing more quietly: measured across every one, **the product filled 82%
      of its frame on average and as little as 49%** (Elmley Grey End Table, a
      139×195 object in a 400×400 frame), so half of some Shopping tiles was empty
      white. 59 heroes tightened to a square crop with a 6% margin — **1.05× to
      1.81× larger in the same tile**, for the same click and the same photograph.
      A margin rather than flush, because Merchant Center wants the whole product
      visible and a product jammed against the frame looks like an accident. All 59
      before/afters were reviewed as a sheet. Nothing was re-uploaded: the crop
      lives on the gallery entry, so the original is untouched and the product
      page's main gallery still shows the whole frame.
- [x] **The Merchant Center feed now spends that crop.** It was sending
      `asset->url`, the raw original, so the tightened crop would have had no
      effect on the one surface it was computed for. `getMerchantFeedProducts`
      builds a 1200×1200 crop-aware URL, falling back to the raw asset where a hero
      has no crop. Also added the missing `!(_id in path("drafts.**"))` guard —
      `sanityClient` carries no token so drafts are not returned today, but an
      untokened client is too little to stand between an unpublished half-priced
      product and Google Shopping.
- [x] **Image quality audited** — median 2000px, but a bad tail: 9 unusable
      (under 700px), 25 soft (under 1200px), listed in the audit.
- [x] **Alt text on every image** — 178 of 439 to 439 of 439
      (`scripts/derive-image-alt.ts`), built only from facts the document can
      prove. Editor-written text is never overwritten.
- [~] **One white, and a shadow on the floor** — asked for on 13 August: _"is it
  possible to make all images look like this? i like the shadow on the floor"_.
  Yes, for pack shots. `docs/image-consistency.md` has the reasoning;
  `scripts/ground-product-images.ts` does it. Across all 99 lead images: **60 need a
  contact shadow synthesised, 2 need only the backdrop regraded to white** (the
  gesso lamp sits on `rgb(247, 247, 247)` next to products on pure white), 31 are
  already grounded, 4 are room photography and 2 are wall mirrors — the last two
  groups are never touched, because a pack shot and a lifestyle shot are different
  jobs and a floor shadow under a mirror is a lie about the object. The shadow is
  built from the object's own silhouette, weighted by how close each column comes to
  the floor line, so a table gets four dark feet and a haze between them rather than
  a grey smear. It is held off the product's own pixels by the inverse of the subject
  mask, so a segmentation error can only ever change backdrop. **Nothing has been
  uploaded** — it writes before/after contact sheets to `.image-work/` for you to
  judge, and when it does run, the new file is a new asset and the supplier original
  stays in the dataset.
- [ ] **Four assets shared between two products** — replacing one changes the
      other. The two SaunaPlunge Bronte cabins (2-person and 6-person) share
      photographs, which is a customer-expectation problem as well as a data one.

### Product SEO

- [~] Per product: title, meta title, meta description, slug, H1, description,
  FAQs, internal links, alt text, structured data. Structured data and H1
  done; the rest runs with the description rewrite.
- [~] **Every description unique.** 14 of 77 rewritten against a validator that
  refuses banned phrases and duplicate FAQ answers.
- [~] **Full-length descriptions for the Sanity drafts, in your handwritten
  format, so all you add is the price.** Batch one done — 9 of ~90.
  `scripts/copy/batch-01.ts`, written to drafts only by
  `scripts/write-product-copy.ts`.
  - Format taken from your own Reclaimed Teak Sideboard page: two-sentence
    summary, five themed h2 sections, "Why You'll Love It" with nine bullets,
    bold-labelled "Product Specifications", then Delivery & Returns. **965–1,053
    words each**, against 649 on the sideboard. The first attempt at 181–244
    words was rejected and rewritten.
  - Delivery **and** returns in the delivery field, returns field empty,
    warranty in the same shape. `sourceUrl` filled, `deliveryLeadTime`
    deliberately not — no lead time is recorded for these, so the delivery
    bullet says we confirm it by email rather than inventing "2–4 weeks".
  - `specs` is now derived from the description's own specification list, so a
    page cannot say 60cm in the body and 51cm in the table.
  - **0% padding on all nine**, against a 26% catalogue baseline. The gate in
    `scripts/lib/product-copy-blocks.ts` throws rather than returns over 10%, and
    `scripts/preview-product-copy.ts` checks the batch for repeated headings and
    paragraphs, which per-product measurement cannot see.
  - Four facts were wrong in the first pass and were caught by looking at the
    photographs again: the Alto shelf unit has **six** shelves and a vertical rod
    screen, the Avaris armchair **includes a lumbar bolster**, the Amalfi bistro
    tables are woven all over rather than metal-framed, and the tractor seat has
    a twisted footrest.

### Required product page information

- [~] Introduction, design story, materials/craftsmanship, key features, room
  suitability, styling advice, specifications, delivery, returns, warranty,
  FAQs, comparison, related products. Section scaffolding and formatting
  done (`product-description-components.tsx`, green ticks, rules above every
  h2); content lands per product with the rewrite.
- [x] **Comparison** — built, `/compare?products=a,b`.
- [x] **RETURNS heading present, bold and consistent on every product page.**
      Its own section now, sharing one heading constant with Delivery and
      Warranty. Was half of a "Warranty & Returns" heading. Adds a `returnsNotes`
      field for pieces that genuinely differ, with the standard 14-day wording as
      the fallback.
- [x] **Large furniture delivery disclaimer** — on the 58 pieces that are £400+
      or large-format. Framed as asked: the streamlined model is why a £1,095
      console is not £1,600. Also pre-empts the most common furniture complaint.

### FAQ system

- [~] **Unique FAQs per product, no duplicated answers.** Validator enforces it;
  applied to the products rewritten so far.

### Tag system

- [x] **Tag system — material, colour, style, room, product type.** Applied to
      all 88 products by `scripts/derive-product-tags.ts`. Coverage: materials
      and product type 88 of 88, colours 81, rooms 83, primary colour 54.
      Evidence-based — each tag carries the string it was read out of, and the
      121 notes are the veto system refusing imitations: the "Bamboo Gesso" lamp
      is gesso _inspired by_ bamboo, so Bamboo is not tagged as a material.
- [x] **Colour tags checked against the photographs**, per Damien's rule — only
      products with colour options whose gallery shows a single variant are
      touched, and for those the pictures decide, not the option list.
      `scripts/derive-image-colours.ts` (dry run by default) segments the white
      sweep out of each catalogue shot and matches what is left, in OKLab, against
      the colours the product is offered or tagged in. **3 of 88 changed**: Oak
      dropped from the Grafton Black Console (black steel in all four shots) and
      the Bentley Grey Aged Oak Console, and Black and Natural from the Broadway
      Oak Chest. Oak stays on all three as a _material_ — the timber is oak, the
      colour is not. 20 products photograph every variant and 58 offer no colour
      choice, so both groups keep the colours they have.
- [x] **A multi-value Colour option means two different things, and the product
      page treated both the same way.** Damien's correction: _"bronze brass etc
      aren't actual variants it's just the different colours of one product"_. The
      Neatham table lists Black, Brass and Gold because it is a black top on
      brass-gold legs — one table, not three. The Abberley chest lists White, Black
      and Brown because it genuinely is sold in three finishes, each photographed.
      Both rendered as a row of buttons, and **the selection was written onto the
      basket line and into the order record** — so a customer could order a "Gold"
      Neatham that has never existed, with nothing in the system to contradict
      them. Worse than a mis-tagged filter, because it reaches fulfilment.
      `src/lib/catalog/product-options.ts` splits them on the only signal in the
      data: whether the gallery photographs more than one of the values. **21
      products are real choices and keep their selector; 10 are descriptions and
      show no colour block at all.** Damien, on being shown the first attempt
      (which restated them as a line of text): _"There are no colours for the
      neatham table, it comes in one colour only"_ — so the heading is gone
      entirely, not reworded. A COLOUR heading on a product with one colour reads as
      a choice however it is phrased, and the photographs already say what the piece
      looks like. The colours still reach the filters through `colourTags`, which is
      where a colour belongs when it is a fact rather than a decision. Verified on a
      production build: Neatham runs description → price → Add to Basket with no
      colour block, and Abberley keeps three working buttons.
- [~] **The specifications table still lists "Colour: Black, Brass, Gold" on the
  Neatham.** That is a spec row stating what the piece is made of rather than a
  chooser, so it was left. Say the word and it becomes "Black with brass-gold
  legs", which is a copy decision rather than a data one.
- [!] **Two of those 10 may be real variants nobody has photographed.** The Beer
  Barrel Storage Stool offers `[Natural | Whitewash]` with only the whitewash
  shot tagged, and the Tamarind coffee table offers `[Aqua | Sky Blue]` — a
  barrel is not both natural and whitewashed at once, so those look like
  choices with missing photography rather than descriptions. They are currently
  treated as descriptions, which under-sells a variant rather than taking an
  order that cannot ship. **The fix is to tag the second photograph with its
  `optionValue` in Studio** — that tag is also what swaps the picture when a
  shopper picks a colour, so it is needed for the variant to work at all.
  Confirm which of the two it is.
- [!] **23 products carry a colour tag they are not offered in** — Abberley White
  Chest is tagged Oak and Natural, Broadway Oak Bedside tagged Natural, and so
  on. These sit outside the rule above (each photographs its variants properly),
  so nothing was changed. Each one is a filter that answers with the wrong
  photograph. Run the script to see the full list; **needs Damien's say-so**
  before the extra tags come off.

### Price, stock and delivery

- [ ] **Price audit.** Report only — no automatic price reductions.
- [ ] **Stock audit**, especially furniture colour variants.
- [ ] **Live stock tracking plan** (Supabase).
- [x] **Delivery lead-time distribution report** — `scripts/audit-delivery-lead-times.ts`.
      Parses each value into a span of days and groups on that, because grouping
      on the raw string hides the inconsistency. Found 65 of 88 on 3–4 weeks
      written two ways, and 47 values with a trailing space. Punctuation
      normalised, **no duration changed** — the script refuses if a parsed span
      would differ.
- [x] **Lead time appears inside the paragraph** on the delivery page.

### Product database

- [ ] **Complete product database / spreadsheet** with every required field:
      product name, supplier, supplier URL, Kaiku URL, SKU, supplier SKU, cost
      price, selling price, profit margin, category, subcategory, room, product
      type, variants, colours, materials, dimensions, weight, stock status,
      supplier stock status, delivery lead time, images, lifestyle images, SEO
      title, meta description, slug, alt text, description status, FAQ status,
      internal linking status, last checked date.
- [ ] Structured from the start for thousands of products, multiple suppliers,
      automated stock and price checking, SEO monitoring, content management,
      supplier management.

### Supplier product mapping

- [ ] Per supplier: supplier product name, supplier URL, Kaiku product name,
      Kaiku URL, supplier category, Kaiku category, supplier stock, Kaiku
      availability, supplier price, Kaiku price.

---

## Part 3 — SEO authority building

### Objective

- [ ] Become an authority for outdoor living, garden wellness, luxury
      furniture, home improvement, garden design, saunas, cold plunge, outdoor
      kitchens.
- [x] **No AI filler.** Enforced by the banned-phrase validator.

### Search intent and content clusters

- [ ] **Intent-led content** — "best outdoor sofas for UK gardens", "how to
      choose an outdoor sofa", "what material is best for outdoor furniture",
      "outdoor sofa maintenance".
- [ ] **Topic clusters**, e.g. the outdoor sauna cluster: buying guide, indoor
      vs outdoor comparison, benefits, installation, materials, maintenance,
      small garden ideas — all interlinked.

### Category page SEO

- [~] **Every category page needs: SEO introduction, buying guidance, FAQs,
  internal links, related categories.** The schema, the rendering and the copy for
  the **8 biggest categories** are done; the remaining stocked categories need copy
  written, which is the same script with more entries.
  `category` now carries `intro`, `buyingGuide`, `faqs` and `relatedCategories`
  (`scripts/write-category-content.ts`). A category page was a heading and a grid,
  which ranks for nothing — there is no text on it for a query to match, so the only
  search it could win was its own name, and "coffee tables" is not a term a
  four-month-old domain takes from John Lewis. What it can win is the question behind
  the purchase, so the guidance answers real ones with real measurements: 40cm
  between coffee table and sofa, 35–40cm console depth in a 120cm hallway, bedside
  height within 5cm of the mattress, 140cm sideboard for a 55-inch television.
  **Coffee Tables went from ~120 words to 826.**
  **The "How to choose" section was reverted on Damien's instruction** — he judged it
  poor and asked for the product-page "We're still writing a guide for this category"
  placeholder back, so both were undone. The `buyingGuide` field and its written copy
  stay in Sanity, unrendered, so nothing has to be rewritten if it is wanted later in
  a different form. Category pages still carry the introduction, the FAQs with
  `FAQPage` structured data, and the related-category links. Written so far: The Reclaimed
  Collection, Coffee Tables, Console Tables, Garden Furniture, Bedside Tables,
  Living Room Storage, Side Tables, Lighting, Office Storage, Shelving, Sofas and
  Outdoor Saunas. FAQs emit `FAQPage` structured data
  as well as visible text, so a question and its answer can appear directly in a
  result. Related links only ever point at stocked categories.
- [x] **Worked examples done**: Garden Furniture (materials, weather resistance,
      maintenance, space needed) and Coffee Tables (size guide, height, clearance,
      material trade-offs), plus The Reclaimed Collection, Console Tables, Bedside
      Tables, Storage, Side Tables and Lighting.

### Product page SEO

- [~] Unique title, description, FAQs, alt text, metadata per product; no
  duplicated supplier wording.
- [x] **Meta title strategy** — brand + product + intent, e.g. "Hampton Ivory
      Console Table | Luxury Shagreen Hall Furniture | Kaiku". Already the
      pattern; names are not to be changed.
- [x] **Meta description strategy** — audited and repaired, `scripts/rewrite-meta.ts`.
      Four faults, and the fourth explains the other three.
      **1.** 90 of 98 product descriptions ran past 160 characters, where Google stops
      rendering, so the clause naming the material was cut on nearly every page.
      **2.** A **leaked prompt** was sitting in the Abberley White End Table's
      description: 352 characters ending _"Once you send the product page screenshot,
      I'll generate the full SEO page…"_. `scripts/strip-copy-artefacts.ts` cleaned the
      product bodies and never looked at the SEO fields.
      **3.** Trade language throughout — "boutique hotels", "designer interiors" — the
      exact phrases `BANNED_PHRASES` exists to catch. The validator was applied to
      product copy and never to the SEO object.
      **4. Nothing rendered any of it.** No query in the codebase read the `seo` object
      on any document. It was on five schemas, editable in the Studio, and every page
      derived its own title and description from the product name and summary instead.
      So every meta description ever written was decorative — which is also why the
      leaked prompt never reached Google.
      Now: `SEO_PROJECTION` is in the product, category, guide and post queries,
      `buildMetadata` takes the overrides with the derived values as fallbacks (with
      tests, because this is the sort of bug that survives for months looking fine),
      54 product descriptions were cleaned and fitted, **39 were written by hand** from
      the measurements, and **30 stocked categories got a title and description** where
      40 of 43 had none. Verified on a build: `/shop/kitchen-storage` was
      "Storage — Kaiku" and is now "Kitchen Storage | Kaiku".
      Left alone deliberately: 62 product meta titles run over 60 characters. The
      pattern is signed off, the names must not change, and Google truncates on pixel
      width rather than character count. Reported by the script if you want them cut.

### URLs, images, linking

- [x] **Slug audit** — `scripts/audit-slugs.ts` checks every document type whose slug
      becomes a URL: missing, not URL-safe, over 72 characters (where Google truncates),
      or duplicated. 168 published documents. **Two live products had a slug that was not
      a slug**: `product-aw-acshop-07` carried the whole title including the pipe
      (`/shop/…/Reclaimed%20Teak%20Dining%20Table%20180cm%20%7C%20Kaiku`) and the small
      gesso lamp carried its marketing excerpt, full stop and all. Both were in the
      sitemap in that state, so both were handed to Google as a wall of `%20`. Repaired to
      the catalogue's own convention — slugify the title up to the first `|` — giving
      `reclaimed-teak-dining-table-180cm` and `small-rectangular-gesso-table-lamp`. Old
      addresses 308 permanently to the new ones via `RENAMED_PRODUCT_URLS`; the drafts
      were patched too, so publishing one does not restore the bad URL. Also filled the
      SaunaPlunge brand's missing slug, a required field that was failing validation in
      the Studio. Everything else was already clean.
- [~] **Image SEO** — alt text now on all 439 images. Filenames: only 4 of 439
  are undescriptive (`image-6.png`, `6.jpg.webp`, `7.jpg.webp`,
  `19.jpg.webp`), so this is much smaller than it looked.
- [~] **Internal linking system.** `scripts/audit-internal-links.ts` finds the pages
  nothing points at, which is the actionable half — you cannot fix orphans you have
  not found. It counts inbound links per product and per category from the sources
  that exist in the markup: primary and additional categories, editorial references,
  `relatedCategories`, and the same-category related-products carousel, which renders
  nothing and so links nowhere in a category of one.
  **Found and fixed: 10 stocked categories had no inbound link from any other
  category** — office-storage with 15 products, bedside-tables with 11, lighting,
  outdoor-saunas. `scripts/link-related-categories.ts` set reciprocal links across 19
  categories, dropping any target that holds no products. **Orphan stocked
  categories: 10 → 0.** Most likely cause of the 44 URLs at "Discovered – currently
  not indexed" in Search Console: a URL nothing links to is one Google has been told
  about and given no reason to crawl.
  **Then the bigger number: 96 of 99 products were referenced by no post or buying
  guide** — the link type Google weighs most. Eight guides later
  (`scripts/write-buying-guides.ts`) that is **96 → 26**, with 70 product references
  across them. Two things had to change for those references to count as links at
  all: the GROQ projection returned only a slug, and `ArticleDetail` rendered nothing
  from it — so a guide could discuss eleven bedside tables and link to none of them.
  Both fixed; the guide pages now carry a "The pieces in this guide" section, and the
  product pages show the guide instead of "We're still writing a guide for this
  category". Remaining 26 are mostly the reclaimed range beyond the nine the teak
  guide names, plus the wellness accessories.

### Content plan

- [x] **The traffic plan itself** — `docs/traffic-plan.md`, asked for on 14 August.
      Four phases, gated in that order because the first one is what makes the rest
      measurable. **Two things measured on the live site set the order:** there is
      **no analytics tag on kaikuhome.com at all**, so we cannot see a single visitor,
      and the Google Merchant feed serves an **empty channel** — 311 bytes, no
      products, because `MERCHANT_FEED_ENABLED` is unset. Both are Vercel environment
      variables, not code. Also recorded there, plainly: **~500 daily organic visits by
      mid-November is not happening from organic search alone.** 500 sessions a day
      needs 15,000–20,000 daily impressions at 3% CTR, which on a four-month domain
      with 152 indexed URLs normally takes 9–18 months. The plan gives per-channel
      ranges per month and says where paid would have to come in.
- [ ] **SEO content calendar** across Outdoor Living, Wellness and Furniture. The
      cadence is set in the traffic plan — two pieces a week, alternating a buying
      guide with a comparison page. What remains is the dated calendar itself.
- [ ] **Blog strategy** — every article carries a target keyword, search intent,
      products to link, related categories, an FAQ section.
- [~] **Buying guides** — eight written, `scripts/write-buying-guides.ts`, on top of
  the sauna guide that already existed. Each answers the question behind the purchase
  rather than describing the range, because that is the search there is least
  competition for: bedside table height (614 words), coffee table sizing against a
  sofa (581), console table depth in a narrow hallway (530), side table height beside
  an armchair (426), sideboard versus chest of drawers (591), whether a sofa will fit
  up the stairs (566), table lamp height on a bedside or console (486), and living
  with reclaimed teak (680). **Every measurement is read from the catalogue**, so the
  advice stays true as long as the range does, and each guide links to the pieces it
  names. Held to the same banned-phrase list as the product copy — the script refuses
  to write if a guide trips it.
  Still to write: outdoor kitchen, cold plunge, home wellness. Pergolas
  deliberately untouched.
- [x] **Five guides rewritten to the format Damien asked for (29 August).** He
      linked a competitor's table lamp guide — _"the buying guides i dont like… here
      is example of one i do"_. What that guide does and ours did not: it answers in
      numbers in the first sentence, repeats them as a reference table in the first
      screen, gives the advice as numbered rules rather than headed essays, goes room
      by room, then checks its own products against its own rules by name, and closes
      with a short version and an FAQ. Ours were five good essays in the wrong shape,
      and none of the numbers were reachable without reading.
      Rewritten on that pattern: wall clock size (1,308 words), how many lights a room
      needs (1,406), planter size (1,381), vase size (1,218), garden furniture in
      winter (1,491) — against the competitor's 1,002. Each carries two tables, an
      embedded calculator, five FAQs emitted as FAQPage schema, and eight products
      measured against its own rules.
      **The audit tables are computed from live catalogue dimensions at write time**,
      and every product named in one is linked below it. Where the data cannot support
      a judgement the row is dropped rather than hedged: the tall trellis planters
      record their whole height, not their planting depth, so a first pass had one
      holding 119 litres of compost and a plant stand holding 55. The rule now refuses
      any vessel taller than 1.6× its opening and says in the guide why they are
      absent.
- [x] **Calculators embedded in the guides (29 August).** Damien: _"the tools
      should also be in the buying guides so you can calculate it on the same page"_.
      A `guideTool` block in the rich-text schema, rendered by
      `article-portable-text.tsx`, places a live calculator directly under the
      reference table it computes. Lazily loaded, so the eight calculators cost
      nothing on the product pages that share the renderer.
      Two new tools were needed to cover all five guides — **wall clock size and
      height** and **vase size and stems** — both pure modules with tests
      (`src/lib/tools/`), both with full `/tools` pages, both in the sitemap.
      Twelve tools now.
- [ ] **Comparison pages** — indoor vs outdoor sauna, wood vs aluminium garden
      furniture, cold plunge vs traditional recovery, coffee table materials.

### Sanity as the central system

- [~] Sanity controls product information, SEO, categories, content, images,
  internal linking, product relationships.
- [~] **Product schema** — basic, commercial, product and SEO field groups.
  Mostly present; facet fields being added now.
- [ ] **Category schema as an SEO landing page** — SEO title, meta description,
      introduction, buying guide, FAQ, featured products, related categories,
      internal links.
- [ ] **Bulk editing** — bulk SEO, category, image and metadata updates without
      touching products one at a time.

### Technical SEO

- [x] **Product schema markup**, price, availability, brand.
- [x] **Breadcrumb schema** on category pages.
- [x] **Article schema** with author and dates.
- [x] **Tabbed content was invisible to Google.** Only the active tab was in the
      DOM, and the default tab is Description — so delivery, returns, warranty,
      the FAQs and the reviews never reached a crawler at all. That broke three
      requirements at once: those sections are required parts of the page, the FAQ
      structured data described markup that did not exist, and half a page built
      to educate a customer could not be crawled. All panels now render with the
      inactive ones hidden, plus proper tablist/tab/tabpanel roles.
- [ ] **A failed Sanity fetch during a build bakes a 404 into a product page.**
      Found while testing: `/shop/sofas/candover-neutral-sofa` served a
      not-found page at HTTP 200 while the product resolves perfectly from
      Sanity. `sanityFetch` is deliberately fail-soft, so a transient fetch
      failure during `next build` prerenders the not-found page and it stays
      until ISR revalidates. Same root cause as the soft-404s on the deleted
      Aosom URLs. Note: the same page renders correctly on the live production
      build, so the local failure was a transient fetch rather than a systematic
      fault. Still real — a fail-soft fetch during a build can bake a 404 into a
      product URL — but rarer than it first looked.
- [~] **Technical SEO audit** — page speed, mobile performance, Core Web Vitals,
  duplicate pages, broken links still outstanding. Done and verified on the live
  site: **robots.txt** (allows everything worth crawling, blocks
  studio/admin/api/cart/account/checkout, points at the sitemap); **canonicals**
  on the homepage, categories and products, and `/shop/all?colour=Black`
  correctly canonicalises to `/shop/all`, which is the right answer for faceted
  navigation; **sitemap** 125 URLs, 88 products and 22 stocked categories, with no
  retired URLs in it; **redirects** now in place for the retired products.
- [x] **Soft-404s on the deleted Aosom product URLs — diagnosed, and my earlier
      claim was wrong.** All 7 still answer HTTP 200 after the deploy, so it was
      never a stale-cache artefact. But it is not the indexation problem I
      recorded: **the response carries `<meta name="robots" content="noindex">`**,
      verified on the live site, so Google will not keep these indexed. Nor is it
      specific to the deleted products — a product URL that never existed behaves
      identically, while `/totally-made-up-page` correctly answers 404.
      **Cause, documented in `node_modules/next/dist/docs`:** a `notFound()`
      reached after the response has begun streaming cannot change the status
      code, because the headers are already sent. The docs say so explicitly, and
      add that "in the streaming case, this does not lead to indexation because the
      page is explicitly marked `noindex`". So I was wrong to call it an
      index-pollution emergency. **What was still worth doing:** the 7 retired
      products now `308` permanently to their category
      (`src/lib/seo/retired-urls.ts`, wired into `next.config.ts`). They were
      indexed and linked, so a redirect keeps the link equity and puts the visitor
      in the range they were looking for instead of a dead end.
- [-] **Forcing a real 404 status on missing product URLs.** The documented way is
  a `proxy` check before the body streams — which means a Sanity round-trip on
  every product URL on the site to change a status code Google is already
  handling correctly via the noindex, and the same docs warn to keep proxy
  checks fast and not fetch content there. Not worth the latency on every page
  view. Overrule me if Search Console starts reporting these as soft-404s in
  volume.
- [x] **`lastmod` on the sitemap.** It was absent from all 125 URLs, so the whole
      file looked equally stale on every crawl and a genuine free crawl signal was
      being thrown away. Now taken from Sanity's own `_updatedAt`: 116 of 125 URLs
      carry a real date, and the homepage, `/shop`, `/learn` and `/journal` take
      theirs from the newest thing they list. The 9 without are the pages written
      in code, which get no date rather than an invented one — a date that moves on
      every crawl teaches Google to distrust the dates across the whole sitemap.
      One GROQ query rather than widening the four page-serving helpers with a
      field only the sitemap reads.
- [x] **The sitemap was frozen at build time, and is now hourly.** Found by publishing
      eight buying guides and seeing the sitemap still list one: 125 URLs where there
      were 152 pages to submit. Next's docs are explicit that `sitemap.js` "is a
      special Route Handler that is cached by default unless it uses a Request-time
      API or dynamic config option" — and it had neither, so it was generated once per
      deploy and never again. **That is the wrong way round for this site**, where the
      catalogue lives in Sanity and not in the repository: a product added on a Tuesday
      would have waited for the next code deploy to be advertised to Google.
      `export const revalidate = 3600` in `src/app/sitemap.ts`. Now 152 URLs — 129
      shop pages, 9 guides, 1 journal entry and the static pages.
- [x] **Wrong-category product URLs no longer resolve.** The live 6 August build
      serves the same product under every category slug —
      `/shop/water-features/portable-charcoal-bbq-grill` and
      `/shop/lighting/portable-charcoal-bbq-grill` both answered 200 — which is
      textbook duplicate content, one URL per category. The current code guards
      it (`found.category !== category` → `notFound()`), so this clears with the
      deploy. Recorded because it explains any duplicate-content warnings already
      in Search Console.
- [ ] **Google Shopping preparation** — audit titles, descriptions, images,
      prices, availability, product categories. Merchant feed built but gated
      off.
- [ ] **Search Console plan** — impressions, clicks, average position, CTR,
      indexed pages, coverage errors, queries; monthly reporting.

---

## Part 4 — Homepage and shopping experience

### Hero

- [x] Keep the "Spaces that slow life down" direction.
- [~] Improve typography, image selection, text positioning, contrast, CTA,
  mobile layout. Mobile layout and CTA done; image selection outstanding
  (avoid generic stock photography).
- [x] Brand positioning, headline, supporting statement, primary CTA. No
      aggressive sales language.

### Discovery

- [x] **Category scroll section** — white panel, horizontal scroll, premium
      cards, works on desktop and mobile, expands as categories are added (24
      categories, up from a curated handful).
- [x] **Scroll rail returns** — it scrolled right and would not come back;
      Lenis was capturing the gesture. Fixed with `data-lenis-prevent`.
- [x] **Heading corrected** — said "Start by room" over a row of categories.
- [x] **New & Noteworthy** — white background, horizontal scroll, mobile swipe,
      premium cards, D.I. Designs furniture cheapest-first.
- [ ] Editorial sections and buying inspiration on the homepage.

### Shopping experience

- [x] **The dark tile page no longer interrupts shopping.** Category and room
      URLs render the white page; the dark page is the `/shop` index only.
- [x] **Category navigation fixed** — no backwards redirects, no incorrectly
      reopening categories.
- [x] **Outdoor Living** audited — 1 product showing, then 9, now 12.
- [x] **Saunas** shows saunas only — 11 items down to 7; oils and accessories
      removed.
- [x] **Wellness Accessories** appears in Sauna, Outdoor Living and its own
      category (`additionalDepartments` + `excludeFromRoomGrid`).
- [x] **Cold Plunge and Outdoor Kitchen** re-parented.
- [x] **Filtering and sorting** on the white shopping pages. URL-driven and
      server-rendered, so `?colour=Black` is a real page that can rank. Within a
      facet values are OR-ed, across facets AND-ed; counts come from the pool
      before each facet is applied so no swatch reads as dead.
- [x] **Colour filters as visual circles** — all 17 colours, each with a count,
      only shown where the products exist. Name and count are the accessible
      label, since a coloured circle alone tells a screen reader nothing.
- [x] **Filters live in a side tab that opens a sidebar**, not in a band above the
      grid. Damien: _"it should be a tab on the side which says filters and when
      you press it it opens up a sidebar rather than having it as the first thing
      you see"_. Still a native `<details>`, so there is no client bundle and every
      filter link stays in the DOM for a crawler whether the drawer is open or
      shut; the tab is pinned to the drawer's outer edge so it travels out with it
      and the control that opened it closes it. The tab is sized to the page gutter
      — the first version was 31.5px wide against a 24px margin and clipped the
      corner off "Witley Coffee Table", so it is now exactly 24px and 111px tall,
      taking its tap target from the height. What is _applied_ stays in the page
      above the grid with a Clear all, and the tab itself carries the count
      ("Filters · 1"): hiding the controls is fine, hiding the state is not.
- [x] **Variant filtering** — selecting Black shows the black version's
      photograph. Verified on the Abberley White Chest of Drawers: three colour
      filters, three different images. Matching goes through an alias table
      because the catalogue's option values are the supplier's words
      (`Whitewash`, `Natural Wood`) and several carry a trailing space — exact
      matching would have failed silently.
- [x] **Eight empty categories filled from stock Kaiku already sells.** No new
      supplier needed, which matters because none are replying. 19 empty → **11**;
      22 stocked → **30**. `scripts/fill-empty-categories.ts` (dry run by default)
      cross-lists on the product-type facet, additively via `additionalCategories`,
      so no product's home category or URL moves and every link is reversible.
      Bedroom Mirrors 2, Living Room / Bedroom / Office Lighting 4 each (the gesso
      table lamps sat in `lighting` and nowhere else, with no room tags at all),
      Office Storage 15, Kitchen Storage 6, Kitchen Shelving 5, Office Shelving 5.
      The eight also enter the sitemap automatically, since that filters on
      `productCount` — eight more indexable pages.
      **What it refused, because a wrong category costs more than an empty one:**
      Bathroom Lighting takes nothing (bathroom fittings need an IP rating for the
      zone — a table lamp there is a safety problem, not a tagging one); Kitchen
      Lighting takes nothing (no pendants or strips exist in the catalogue); and the
      first pass was tightened twice after it swept TV stands and console tables
      into Office Storage on their `Storage` tag — 22 matches was padding, 15 is a
      category.
- [!] **Ankorstore was the wrong recommendation — my error.** I put it first on the
  instant-signup list on 12 August, ranked by how fast you can see trade prices,
  without checking its model. **Ankorstore is wholesale: stock is bought, held
  and posted by you, with a minimum first order per brand.** Kaiku is a
  dropshipper. Damien applied, was accepted, and the account is useless to him —
  an evening wasted, and he had already told me "some dont offer dropshipping
  though". `docs/supplier-instant-signup.md` is corrected and now organises
  suppliers by whether they actually dropship, marking the ones I am not certain
  about instead of asserting twice. `docs/ankorstore-buying-brief.md` was deleted
  rather than left to mislead.
- [x] **Ancient Wisdom is an already-live dropship account, and it holds up the
      entire bottom of the price ladder.** The "AW Dropship" supplier in Sanity, 26
      products. **Every product Kaiku sells under £50 is theirs** — the essential
      oils at £6.95–£17.50, the storage tub at £40, the salt BBQ plate at £47.75, the
      crates at £49 — against a catalogue median of £545 and 78 of 88 products over
      £150. Their range is much wider than the 26 taken from it and covers
      `bathroom-accessories` directly, which is empty. **No application needed; this
      is listable tonight.** It should have been the first suggestion, not
      Ankorstore.
- [!] **9 categories genuinely need stock** and cannot be filled from the
  catalogue, because nothing in it is one of these things: bathroom-accessories,
  bathroom-lighting, fire-pits, garden-lighting, kitchen-furniture,
  kitchen-lighting, privacy-screens, towel-rails, water-features — plus
  pergolas, untouched by instruction. **Rugs came off this list** — see below.
- [~] **Five new Decor categories filled from Hill Interiors (395 drafts).
  Rugs filled from Viva Rugs, then all 564 of those drafts were deleted
  two days later — unresolved, see below.** — "import as many products as
  you like from hill interiors, di designs and viva rugs, can be 200 plus
  too fill up the categories, ill work through them this week." Two of the
  three suppliers were legitimately open to reading; the third was checked
  and is not.
  - **D.I. Designs: still fully bot-protected, not attempted.** A direct,
    non-destructive check (`curl` to its own `robots.txt`) returns HTTP 202
    with `sg-captcha: challenge` and `x-robots-tag: noindex` — the CAPTCHA
    gate you have refused to defeat covers even that file. Nothing was
    fetched from them.
  - **Viva Rugs** publishes a public Shopify `/products.json` feed and its own
    `robots.txt` says plainly that the catalogue is crawlable, naming an
    agent-discovery sitemap for exactly this kind of reading.
    `scripts/import-viva-rugs.ts` created 564 drafts into `rugs` on 15–16
    August, one per _design_ rather than per size (Viva sell three sizes as
    three variants; Kaiku's schema holds one set of dimensions per product, so
    each draft used the smallest currently-in-stock size — a real, buyable
    figure rather than an invented "one size"). Titles were rewritten from the
    product's own colour and pattern facts, never kept from the supplier —
    their own titles are SEO keyword-stuffing ("Deep Purple Rug Geometric
    Large XL Small Soft Modern Room Carpet Abstract Rug").
    **All 564 are gone as of this check — deleted, not published.** Sanity's
    own transaction history (`/data/history/production/transactions/<id>`,
    checked directly, not inferred) shows every `drafts.viva-rug-*` document
    created 15–16 August and then hit with a `delete` mutation in a tight
    window on **17 August, 17:30–18:19**. A sampled one
    (`drafts.viva-rug-6066883952793`) had been opened, patched and
    `createOrReplace`d several times in Studio between creation and deletion —
    somebody was actively working in it before it was removed. Nothing
    published under a `viva-rug-*` id exists either, so this was not "edited
    then went live"; the content is simply gone. The five Hill Interiors Decor
    categories, imported the same way in the same window, were **not**
    touched — only the rugs batch was removed, which reads as a deliberate,
    rugs-specific decision rather than a blanket rejection of the import
    method. **Not re-run.** Recreating 564 drafts someone appears to have
    deliberately deleted — after working inside at least one of them — needs
    your word first, not a second guess: was this you clearing out a batch you
    didn't want, a mistake, or something else? Say the word and it goes back
    in five minutes; `scripts/import-viva-rugs.ts` is unchanged and the
    supplier feed is still there to re-read.
  - **Hill Interiors** is a trade account already open, with 1,545 of 1,662
    items in the account unused (`scripts/supplier-coverage.ts`). Five Decor
    categories did not previously exist — `wall-clocks`, `candles-and-lanterns`,
    `vases`, `wall-art`, `mirrors` — created by `scripts/create-decor-categories.ts`
    and filled by `scripts/import-hill-decor.ts`: **395 drafts**, confirmed by
    a direct Sanity count, not the log (candles-and-lanterns 201, vases 114,
    wall-clocks 31, mirrors 25, wall-art 24). The first apply run was
    interrupted by a genuine network drop (`ECONNRESET` mid-fetch, not a logic
    bug) after 390 of 405 candidates; re-running `--apply` is safe and
    idempotent (it checks each item's supplier code against what already
    exists before creating anything), and it picked up the remaining 5 on the
    second pass. 9 items could not be parsed (no readable title/code on the
    page) and were skipped, not guessed at. **Confirmed still present today**,
    unlike the Viva Rugs batch above.
  - **Every draft from both suppliers has photographs, dimensions where the
    supplier states them, material and colour tags mapped to Kaiku's own
    closed vocabulary, and a category. None has a price, a summary or a
    description — those stay yours to write, same as every other import this
    project has done.** A priceless product cannot be published (the schema
    requires one), so nothing here is visible on the site until you set a
    price.
  - Real supplier data widened Kaiku's own material vocabulary rather than
    dropping facts that did not fit an existing tag: `src/lib/catalog/facets.ts`
    gained `Polypropylene`, `Cotton`, `Wool` and `Polyester` under Fabric —
    Viva Rugs' catalogue is almost entirely these four fibres.
  - **AliExpress**, the fallback you raised for filling categories like
    outdoor kitchens: not used. Between UK Furniture and Furnishings Fire
    Safety Regulations, GPSR, plug/WEEE compliance as importer of record, and
    Merchant Center suspension risk for duplicate-content listings, it is a
    materially different risk profile from a UK trade account — flagged for
    you to weigh, not acted on unilaterally.
- [~] **Third supplier: Premier Housewares, trade account accepted 18 August.**
  `scripts/import-premier-housewares.ts` (same read-facts-not-prose pattern,
  see the file's own header) is running now, outdoor categories first per your
  instruction. One real miscategorisation caught before anything was written:
  Premier Housewares sells "rattan" as an indoor bohemian-interiors material
  as often as a garden one, so a title-keyword match alone put an indoor
  rattan chest of drawers in `garden-furniture`. Fixed by reading each
  product's own breadcrumb trail (their structured category data, not prose)
  and only accepting `garden-furniture` candidates the supplier itself filed
  under "Conservatory and Outdoor". The same check on `wall-art` and
  `mirrors` found a bare "canvas"/"mirror" keyword catching storage trunks,
  laundry hampers and mirror-_topped_ furniture — tightened to the phrases and
  exclusions in the script before the run below started. **Numbers below are
  provisional — the run was still in progress when this was last updated; see
  the next commit for final counts.**
  - `garden-furniture`, `planters`, `outdoor-storage` run first (2,052 total
    candidates across every bucket combined, before this run had processed
    any of them).
  - Then the same five Decor categories Hill Interiors already contributes
    to — `mirrors`, `vases`, `wall-clocks`, `wall-art`, `candles-and-lanterns`
    — since you asked for "the most suitable products in the most suitable
    categories" rather than a capped top-up, so this pulls everything Premier
    Housewares has that classifies cleanly, not an arbitrary sample.
  - Same disciplines as every other importer: no price, no summary, no
    description (yours to write), and no weight — the only weight figure on
    these pages is packed shipping weight, not the item's own, so it is left
    unset rather than mislabelled.
- [ ] **Category page value** — listings plus SEO content, filters, buying
      guides, FAQs, related categories.

---

## Part 4.5 — Full commercial audit (18 August)

Damien's brief: stop treating Kaiku as a website project, audit it as an
actual ecommerce operation — every product, published and unpublished,
against real supplier facts, real margins, real conversion blockers. **This
is a multi-week program, not one pass.** What follows is grounded in real
queries against the live dataset, not estimates, and is honest about what is
fixed versus found-and-flagged versus still to do.

### Catalogue, as it actually stands

901 total products: **235 published, 666 drafts** (390 Hill Interiors decor +
some in progress from Premier Housewares, plus the pre-existing 91 Hill
enrichment drafts and a handful from other suppliers — see the by-supplier
count below). Published-product field completeness, queried directly:
0 missing price, cost price, description, summary, delivery lead time, SEO
or stock status; 93 missing an internal SKU, 36 missing a `supplierSku`, 83
missing a recorded shipping cost, 81 missing colour tags, 55 missing
material tags, 7 missing dimensions, 6 missing weight. No fabricated/generic
SKUs found (checked for slug-matching or "product-import"-prefixed SKUs —
zero).

### P0 — fixed this session, with evidence

- [x] **50 products were profitable but underpriced against their own real
      cost.** Queried every published product's actual `price`/`costPrice`/
      `shippingCost` — genuinely nobody was losing money, but 50 sat below the
      20% margin `src/sanity/components/margin-display.tsx` already treats as
      the "caution" line in Studio, down to 6.8% on a couple of the
      Hampton/Bentley/Leckford pieces. Corrected each to the minimum price
      clearing 20%, rounded up to the next whole pound — **cost price and
      shipping cost were never touched**, only the retail price, per your own
      correction to the brief. `scripts/audit-and-fix-margins.ts`.
      Caught and fixed a real bug in the script itself before applying
      anything: the first dry run treated GROQ's `null` as distinct from JS
      `undefined` on a projected field, which would have logged ~105
      meaningless "clearing stale compare-at" entries on products that never
      had one. Fixed to a `typeof === "number"` check; the corrected dry run's
      totals matched a hand cross-check exactly before `--apply` ran.
- [x] **Mandatory price-adjustment audit log**, per your instruction verbatim
      ("I need to know why Kaiku is charging £63 rather than £57 — not
      discover six months later"). New `priceAdjustment` document type
      (`src/sanity/schemaTypes/documents/price-adjustment.ts`): one record per
      change, with before/after price, the cost figures used, and why. 55
      entries created (50 margin corrections + 5 compare-at-only clears).
- [x] **5 products had a broken `compareAtPrice`** — stored as literal `0`,
      or already at/below the real selling price (a "was £45, now £47" that
      isn't a discount). Cleared rather than shown as a false discount. 6 more
      would have become broken _by_ the margin correction above (the new
      price meeting or exceeding an until-then-valid compare-at figure) —
      cleared for the same reason, in the same run. No compare-at price was
      ever invented or raised, only removed once it stopped being true.
- [x] **"Free UK Delivery" vs "Shipping calculated at checkout" — the exact
      contradiction you asked to be audited for, found on every single product
      page and the cart page.** `src/server/actions/checkout.ts` hard-codes a
      £0 Stripe shipping option — the real policy is free UK delivery, full
      stop — but the price line under every product's Add to Basket button,
      and the cart subtotal, both said the opposite. Both now say "Free UK
      delivery."
- [x] **One "In Stock" vs "Made to order" contradiction, found and fixed on
      real evidence, not inference.** Checked every published product's
      `stockStatus` against its own `deliveryNotes` text. The SaunaPlunge™
      Pennine Barrel 6-Person sauna's own delivery copy says outright "This
      sauna is made to order... 4–6 weeks", while `stockStatus` said "In
      Stock" — the schema's default value, evidently never changed.
      `scripts/fix-pennine-barrel-stock-status.ts` (idempotent, checks the
      same evidence before writing). **Three other SaunaPlunge products share
      the same 4–6 week lead time but have no explicit "made to order" text of
      their own — flagged below, not changed, because that would be inferring
      a stock fact rather than reading one.**
- [x] **The short summary was rendering twice on every product page** —
      verified live on kaikuhome.com before fixing, not assumed: the buy-box
      next to the price, and again verbatim atop the Description tab.
      `DescriptionPanel` now goes straight to the real description, which
      genuinely differs from the summary once you stop repeating the summary
      first. `src/features/storefront/components/product/product-tabs.tsx`.

### Second round, after your review (same day)

Your follow-up: revert the D.I. Designs price changes, don't bother about ~18%
margins, build a site-wide shipping logic system with price-banded delivery
windows, replace the delivery wording in the sauna descriptions, give
everything a SKU in one format, and "maximize trust on this site with maximum
consistency".

- [x] **49 of the 50 price corrections reverted.** D.I. Designs unconditionally,
      per your instruction. For everyone else the rule was "only if it's
      genuinely thin" — and it turned out every non-D.I.-Designs correction sat
      between 15.6% and 19.9%, comfortably inside your "don't worry" example, so
      those reverted too. **The one exception kept: SaunaPlunge Yorkshire Cabin
      4-Person at 12.23%**, genuinely thin rather than borderline.
      `scripts/revert-margin-adjustments.ts`. compareAtPrice restored on the four
      products where the reverted price makes the original "was" figure true
      again; Charlton's stays cleared because it was literally `0` before any of
      this. Every reversal has its own log entry.
- [x] **Site-wide delivery logic, one rule, one statement.** Your bands — under
      £50 → 7–14 days, £50–£120 → 2–3 weeks, above £120 → 3–4 weeks — now live in
      `deliveryWindow()` in `src/lib/catalog/delivery.ts`, and **every surface
      that mentions delivery reads that one function**: the buy-box, the delivery
      panel, the four-up trust band, the homepage flagship, the comparison table,
      and the Google Merchant feed. Each of those previously read the raw field
      independently (or nothing at all), which is precisely how a page and a feed
      end up promising different things about the same product. Banded on price
      because it is the one figure every product actually has — weight is unset
      across most of the catalogue — so all 235 published products state a window
      with no gaps and no guesses. **This supersedes the older "do not change
      lead times" standing constraint**, which you have now replaced with these
      bands.
  - **Saunas keep 4–6 weeks**, your call when the conflict was put to you: they
    are all over £120, so the band alone would print "3–4 weeks" on a £6,500
    made-to-order cabin that genuinely takes six. A supplier-confirmed lead time
    now beats the band; the bands cover everything else.
  - A boundary bug the tests caught before anything shipped: "above 120"
    excludes £120 itself, but the first implementation put exactly-£120 in the
    3–4 week band. £50 and £120 now sit where your wording actually places them.
- [x] **Delivery copy that contradicted the checkout — the real trust problem,
      and worse than expected.** Auditing every published product's delivery
      copy against what the site actually does found three separate
      contradictions, all fixed by
      `scripts/fix-delivery-copy-contradictions.ts`:
  - **12 products claimed "Additional delivery charges may apply"** in prose,
    directly beneath a page promising free UK delivery, against a checkout that
    hard-codes a £0 shipping rate and _cannot_ take a surcharge. A
    stated-but-never-charged fee is a consumer-law exposure as much as a trust
    one.
  - **21 hardcoded lead times** ("Estimated delivery within 2-4 weeks") that now
    contradict the computed window. Not a judgement call about which is right:
    the `deliveryNotes` field's own schema description already says the lead
    time is shown automatically above it and must not be repeated — the prose
    was violating its own field's contract.
  - **A £3,189 sauna's delivery copy named a different product entirely** —
    "Your SaunaPlunge™ Dales Glow 4-Person Indoor Infrared Sauna is typically
    delivered..." on the **Yorkshire Cabin 2-Person** page. Corrected to its own
    name rather than deleted; the sentence was otherwise fine. This is the sauna
    delivery wording you asked to have replaced.
  - Half these claims live in `deliveryNotes` and half in the rich-text
    `description`. The first pass only handled the former and silently missed a
    product whose contradiction was description-only — caught by cross-checking
    the two audits against each other, then fixed to cover both.
- [x] **One SKU format across the catalogue**, per "everything needs an sku made
      in a certain format making products easy to identify". The catalogue held
      **six** formats plus 93 products with no code at all: `KK-CT-ABB-BRN-001`
      (yours, deliberate), `DI-CT-ABB-BLK-001`, `AW-ACShop-01` _alongside_
      `AW-ACSHOP-08` (same scheme, inconsistent case), `KK-DL-23677`,
      `HIL-23674`, `KA-HILL-20696`, and bare supplier codes like `24456`.
      The format extends your own best one rather than replacing it:

```text
KK-CT-ABBERLEY-BRN-001
 │  │     │        │   └── sequence, breaks ties
 │  │     │        └────── colour, omitted when there isn't one
 │  │     └─────────────── the range name
 │  └───────────────────── category
 └──────────────────────── the Kaiku prefix
```

`src/lib/catalog/sku.ts` + `scripts/assign-skus.ts`. **All 235 published
products now conform**; a code already matching is never rewritten, so
re-running is a clean no-op. Every change logged to a new `skuAssignment`
document. Drafts are being assigned in the background as this is written.

- Verifying the applied codes against the format — rather than trusting the
  script's own success output — caught three that failed it (`KK-LT-M-001`):
  titles like "13.6m Warm White…" reduce to a bare "m" once digits are
  stripped, which identifies nothing _and_ would have made the script rewrite
  those same three products on every future run. Fixed, and a test now asserts
  every code the module builds passes its own validity check.
- Confirmed **zero genuine duplicate codes** — the 11 apparent collisions are
  draft/published pairs of the same document, which is how Sanity represents
  an edited product.

### P1 — found, evidenced, deliberately NOT auto-fixed

- [!] **93 of 235 published products (40%) carry trade-catalogue marketing
  language in their description** — not a stray phrase, whole templated
  sections: a heading like "Designed for Homes, Hotels & Interior Designers"
  followed by a bulleted "Ideal for: Interior designers, Architects, Property
  developers, Boutique hotels, Restaurants, Serviced apartments, Show homes,
  Hospitality projects..." on products as ordinary as a bedside table or a
  console table. This is the exact problem section 26/27 of your brief
  describes, and it is not a job for search-and-replace — your own brief says
  so, and rewriting 93 real product descriptions honestly, per-product,
  without inventing facts, is a genuine content project, not a script. Sampled
  two (Abberley One Drawer Black Console Table, Solara Orb Pendant Ceiling
  Light) to confirm this is real templated content, not a false-positive
  regex match. **Needs your call on priority and pace** — this is likely
  several days of careful, individually-written rewrites at the standard the
  batch-01 rewrite set earlier this project, not something to rush.
- [!] **SaunaPlunge stock-status consistency** — of 8 SaunaPlunge products, all
  sharing the same 4–6 week lead time (itself unusual for genuine shelf
  stock): 4 say "In Stock", 2 say "Made to Order", 2 say "Out of Stock". Only
  the Pennine Barrel's own copy said which it actually was, so only that one
  was changed. **Worth confirming the real status of the other 7 with the
  supplier** rather than Kaiku guessing from a lead time alone.
- [!] **93 missing internal SKUs, 36 missing `supplierSku`** on published
  products — not fabricated, just genuinely absent. Filling `supplierSku`
  needs the real supplier code per product; filling the internal `sku` is
  Kaiku's own numbering scheme and could be scripted once you confirm the
  format you want (the existing ones look like `AW-ACShop-18` — supplier
  prefix plus their code, not a Kaiku-invented sequence).

### Still to do, scoped honestly rather than attempted at once

Per section 40 of your own brief ("batch safety" — audit, small batch,
validate, then scale), and because several of these need real time, not a
clever script:

- [ ] **Full per-product supplier-fact re-verification** (materials,
      dimensions, weight, included/excluded accessories) against each
      product's own `sourceUrl` where one exists. Feasible for the ~470
      products with a recorded source, but re-fetching each one respectfully
      (Hill: 500ms between requests; Premier Housewares: 10s, per their
      robots.txt) is realistically hours of background crawling, not a single
      pass — proposed as its own phased run once you confirm you want it
      before the 93-product content rewrite above.
- [ ] **Description/summary humanisation** at catalogue scale — the 93 flagged
      above are the worst of it, but the wider "avoid _elevate your space_,
      _timeless elegance_, _seamlessly blends_" instruction applies to a good
      deal more of the catalogue than that; not yet measured precisely.
- [ ] **Image audit** (correct product, order, duplicates, permission status)
      — not started.
- [ ] **Returns workflow design**, **Stripe production instruction guide**,
      **order-operations chain (automated vs manual vs needs building)**,
      **quality scoring system** — all requested, none started this session;
      each is its own real piece of work.
- [~] **Premier Housewares import, running in the background as this is
  written** — outdoor categories first (garden-furniture, planters),
  then the same five Decor categories Hill Interiors contributes to.
  Numbers will follow once it completes; see the entry above this one for
  the miscategorisation fixes already made before it started.

---

## Part 4.6 — Orders, emails and the first real sale (19 August)

Prompted by "a functioning shop needs all its categories filled in, test
payments, emails for every situation automated and created and live stock,
prices and fulfilment in place, and an understanding of how we let the customer
track their order", and then sharpened by the first live order actually going
through.

### The first live order, and the two faults it exposed

£19.00 taken, £18.51 net. Payment and webhook both worked. Two things did not:

1. **"why is the order hidden and labelled by random numbers"** — the order was
   a guest checkout, so nothing tied it to your account and it appeared nowhere
   in `/account/orders`. It existed; it was just unreachable.
2. **"i also didnt recieve any email"** — correct, and not a bug. `RESEND_API_KEY`
   has never been set, so no email has ever sent. Row 3 of _Blocked on you_.

### Emails — [x] built, editable, previewable

- [x] **Editable in Studio.** An `emailTemplate` document type with heading,
      text, image, button, order-summary, divider and spacer blocks, and an
      `enabled` toggle. Renders through the same Outlook-safe table layout as the
      built-in emails — inline styles, `width` attributes, real `alt` text, images
      capped at 600px. Answering "How can I fully customise my emails and add
      images etc on newsletters and confirmations and make them exactly how I want
      them?"
- [x] **A template you write wins; otherwise the built-in one sends.** Unknown
      `{{placeholders}}` are left visible rather than silently blanked, so a typo
      shows up in the preview instead of in a customer's inbox.
- [x] **Eight customer-facing emails**, one per stage an order actually moves
      through: confirmation, in production, dispatched with tracking, delivered,
      review request, delayed, cancelled, refunded. The six internal stages send
      nothing, deliberately.
- [x] **Sending is idempotent** — a prior `email_sent` order event blocks a
      duplicate, so advancing a stage twice does not email twice — and never
      throws, so a failed send cannot roll back the stage change it was reporting.
- [x] **`/admin/emails`** previews all eight, HTML and plain text, desktop and
      mobile, and test-sends any of them to a real address with `[TEST]` on the
      subject and the sample order's details, never a customer's. Answering "how do
      we test the emails?". The previewer and the live sender share one resolver, so
      a preview cannot drift from what actually gets sent.
- [x] **Fixed a dead template** — `buildNewsletterWelcomeEmail` existed and was
      never called. Subscribers were getting a crude inline `<div>`.

### Orders — [x] readable numbers, [x] no guest checkout

- [x] **`KH-1000` and upwards.** A Postgres sequence with a column default
      rather than application code, so an order cannot exist without a number no
      matter which path created it — webhook retry, manual insert, or code nobody
      has written yet. Backfilled oldest-first so the numbering matches the order
      things were actually bought in. Threaded through the admin orders list (where
      it now leads each row, ahead of the price), your own order history, the
      customer tracking page, and every email.
- [x] **Guest checkout removed** — "checking out as a guest shouldnt be
      possible". Enforced in the server action that creates the Stripe session,
      which is the only path to payment, rather than by hiding a button. Every
      order now attaches to an account, which is what fault 1 above was really
      about.
- [x] **Signing in returns you to your basket.** The redirect carries `?next=`,
      the login and signup pages honour it, and the login page says why it happened
      instead of dumping you on a form with no explanation. `?next=` is sanitised to
      same-site paths only (`src/lib/safe-next-path.ts`, 12 tests) — an unchecked
      one is an open redirect on our own domain, which is the exact shape a phishing
      link wants.
- [x] **The tracking page is still keyed by UUID, not by `KH-1042`.** The
      readable number is for people to quote; the UUID is what unlocks somebody's
      address and delivery date, and `KH-1042` is guessable.

### Emails, second pass — the customisation was not actually complete

Prompted by "i want to fully customise my emails". Auditing the system built
earlier the same day against itself found it was not true:

- **Three of the eleven emails could not be selected in Studio at all.** The
  dropdown and the sending code each kept their own list of template keys, and
  they had drifted. `order-in-production`, `order-delivered` and
  `order-review-request` were looked up by the sender and absent from the
  dropdown, so no template could ever be written for them.
- **Three dropdown entries pointed at nothing.** `order-confirmation`,
  `quote-received` and `contact-received` could be selected, saved and enabled —
  and were never read by any sender. Including the order confirmation: the one
  email every customer definitely receives was the one that could not be
  customised.
- **A template keyed wrongly fails silently.** It saves, it enables, it simply
  never sends. Nothing anywhere reports it. That is what made this worth fixing
  properly rather than patching the list.

Fixed by making `src/lib/emails/catalogue.ts` the single list both sides read —
the Studio dropdown is generated from it, and the senders resolve their key from
it. 11 tests cover it, including one that checks every stage named in the
catalogue is a real workflow stage, since `ready_for_dispatch` (the real name is
`ready_dispatch`) would otherwise be another silent failure.

- [x] **The order confirmation now respects a Studio template**, via the same
      resolver everything else uses, falling back to the built-in one.
- [x] **Quote and contact acknowledgements rebuilt.** Both were bare Georgia
      `<div>`s written inline in the form actions — no Kaiku header, no footer, no
      plain-text alternative. The same fault the newsletter welcome had. Both now go
      through the shared Outlook-safe layout and accept a Studio template.
- [x] **An HTML-injection bug in the contact form's admin notification.** The
      visitor's name, email and message were interpolated into HTML unescaped. A
      message containing markup could inject links or images into the notification,
      and a stray `<` was enough to swallow the rest of the enquiry before it was
      read. The quote form escaped correctly; the contact form did not.
- [x] **`{{customerNote}}`** — "a placeholder for where i insert info about the
      order". A box on the order in `/admin/orders/[id]`: type something, change the
      stage, and it appears in that email wherever the template puts
      `{{customerNote}}`. Saved to the order's timeline too, so there is a record of
      what the customer was told, and cleared after use so the next stage change
      cannot repeat it.
- [x] **Order numbers in Stripe.** "order numbers should show here too" — the
      Transactions list showed `pi_3U6FWWB6fKxUzUPh05AeN0ur`, unmatchable against
      anything in admin. The webhook now writes `Kaiku KH-1000 — <first item>` onto
      the PaymentIntent as its description, plus the order number, order id and a
      direct admin link as metadata, so Stripe's search box finds a payment by order
      number. Done after payment rather than by reserving a number at checkout, so
      an abandoned basket does not burn one.

### Operations: Sanity is not the answer, and the answer already existed

"could we make sanity the operating system for the entire business" — no, and
`docs/kaiku-hq-design.md` §1.1–1.2 already decided this, for reasons that still
hold:

> **Sanity holds what customers see. Supabase holds what the business does.**
> HQ is the existing `/admin` area of kaikuhome.com, expanded.

Orders in Sanity would mean customer addresses, phone numbers and order values
sitting in the dataset the public storefront reads with a read token; no
row-level security, so a customer could not be restricted to their own orders;
no unique constraints, so `KH-1042` could be issued twice; and a Stripe webhook
writing to a content lake instead of a database.

**The real reason operations underperform: the design is finished and the build
stopped.** Migration 0003 created `suppliers`, `supplier_files`,
`supplier_price_events`, `tickets`, `ticket_messages`, `email_log`, `tasks`,
`subscribers`, `abandoned_checkouts` and `notifications` — **ten tables, and a
grep finds zero references to any of them in `src/`.** Of the fifteen admin pages
specified in §4, seven exist. That gap is the underperformance.

### Ordering from the supplier — [x] one press, after reading it

The last step in the chain still done by hand, per order, from memory. Specified
in §4.4 ("Notify supplier"), now built.

- [x] **A purchase order per supplier on the order**, since an order can span two
      and each supplier must only see their own lines.
- [x] **Read it before it sends.** The exact email renders in an iframe on the
      order page, with a separate Send. One press with no preview is how the wrong
      SKU gets ordered.
- [x] **Problems surfaced, not hidden** — missing supplier SKU (named per
      product), missing delivery address, missing phone. A missing address blocks the
      send; the rest are warnings, because a supplier query costs a day.
- [x] **No prices in the purchase order, ever.** 16 tests, one of which asserts
      no `£` appears anywhere in the output. The supplier invoices at their own trade
      price: quoting Kaiku's retail price hands them the margin, and quoting a trade
      cost that has drifted since import invites a dispute over the invoice.
- [x] **Their SKU leads, ours follows** as a cross-reference. A supplier warehouse
      cannot pick by a Kaiku code.
- [x] **The customer's phone, never the customer's email.** Delivery booking needs
      a phone call; the email relationship is Kaiku's, and the PO says so explicitly.
- [x] **Recorded on the timeline** with the address it went to, and a confirm
      prompt before sending the same order twice.

### [x] A supplier-contact leak on every public product page

Found while wiring the above. The storefront's product query projected
`supplier->{ name, contactName, email, phone, defaultLeadTimeDays }`, and the
product page passes the product into client components — so those fields were
serialised into the HTML of every public product page. Verified on the live site:
`"supplier":{"contactName":"Kelly Marsden", ... "name":"SaunaPlunge (Outdoor
Living 365 Ltd)"}` was readable in the page source.

`email` and `phone` happened to be `null` only because no supplier had them
filled in yet — and the purchase-order feature above requires filling them in.
So this would have published every supplier's trade email the moment it became
useful, handing a competitor Kaiku's supplier list and the person to ring.

Nothing on the storefront read any of it. The projection is now `name` only, and
`SanitySupplier` is narrowed to a single field so the rest cannot return by
accident; contacts are read server-side by `src/server/suppliers/contacts.ts`.

### The operations brain — [x] eight watchdogs, worst first

"it needs to have enough functions to make the customer say wow this is amazing
service." Amazing service is mostly the absence of silence, so the dashboard now
computes what is going wrong _before the customer finds out_.

`src/server/hq/attention.ts` — a pure, tested rules engine (26 tests). Each rule
exists because of a specific way a customer learns something failed before Kaiku
did, and each row on screen carries the **customer consequence**, not the internal
state:

| Rule                                            | Severity     | Why                                                                   |
| ----------------------------------------------- | ------------ | --------------------------------------------------------------------- |
| Paid, no purchase order sent (12h+)             | Now          | Their money is taken and nothing is on order anywhere                 |
| Supplier has not confirmed (2 working days)     | Today        | Nobody has confirmed it is being made; the promised date is slipping  |
| Promised dispatch date passed, no tracking      | Now          | They were given that date                                             |
| Promised delivery date passed, nothing recorded | Now          | Either it arrived and nobody logged it, or it did not and nobody said |
| Paid 48h+, no promised dates at all             | Today        | The most common reason people email to ask                            |
| Delivered 7 days ago, no review requested       | When you can | They are happiest now                                                 |
| Flagged by hand                                 | Today        | A human decided it mattered                                           |

Details worth keeping:

- **Working days, not calendar days**, for the supplier chase. A supplier who has
  not replied since Friday afternoon is not late on Sunday, and alerting then is
  how an operator learns to ignore alerts.
- **Lateness counted the way a customer counts it** — "you said Monday and it is
  Wednesday" is two days. The first implementation rounded that to one; a test
  caught it, and understating lateness on the one screen meant to surface it is
  the wrong direction to be wrong in.
- **Silent on cancelled and refunded orders**, except when flagged by hand.
- **Purchase-order and supplier-confirmation state is read from the timeline**, not
  from a column somebody has to remember to update. The point of an append-only
  event log is that "has this happened" is a question you ask of history.
- **The old two-rule `needsAction` in `hq-dashboard.ts` was deleted**, not left
  beside it. Two implementations of "what needs doing" drift, and then neither is
  trusted — the same failure as the email key lists.
- A count in the sidebar on every admin page, red only when something is
  genuinely costing a customer something today.

### [x] A private admin bar on the storefront

"accessible only for me on the website and not visible to other customers, it
makes it quicker to access." A strip at the bottom of every storefront page with
Dashboard, Orders, Emails and Studio.

Resolved server-side and rendering **nothing at all** for anyone else — a bar
hidden with CSS, or removed on the client, still ships its markup to every
visitor, so a signed-out reader of the page source would learn the admin URLs and
their names. Collapses to a single small tab, with the preference kept in a cookie
so the server renders the right state first time and no bar ever flashes over the
storefront.

Not a security boundary: /admin gates every page and action itself. This is a
shortcut for the one person already allowed in.

### [x] Kaiku HQ as a terminal

"admin needs to be way more advanced then not just a few sidebars, it needs to be
functional too" and "make my admin page feel like a bloomberg terminal."

What actually makes a terminal a terminal is not the dark colour — it is that the
whole screen is information, figures line up because they are tabular monospace,
colour only ever means something, and you navigate by typing rather than
pointing. So:

- [x] **A dark, dense skin** scoped entirely to `[data-hq]` (`hq.css`), so none of
      it can reach the storefront, which stays a warm off-white shop. Hairline panels
      instead of cards, 11–13px type, no rounded corners, no display serif.
- [x] **Every number is tabular monospace**, so a column of prices lines up and a
      figure does not change width as it changes value.
- [x] **⌘K command palette** as the primary navigation, with `g`-then-key jumps
      (`gd` dashboard, `go` orders, `gi` inbox, `ge` emails, `gn` newsletter, `gs`
      Studio). Order search by number, name or email runs through a **server action**,
      not a client-side filter — HQ rows carry customer names, addresses and totals,
      and none of that belongs in a browser bundle waiting to be searched.
- [x] **Live top bar** — London clock, and the alert counts (now / today / queue)
      visible from every page, not just the dashboard.
- [x] **A status bar** with the signed-in operator, role, and open/urgent counts.
- [x] **The dashboard is one screen**: money strip, ALERTS, PIPELINE with
      proportional bars, and TAPE (the event log, newest first). A dashboard you have
      to scroll is a report.
- [x] **The orders list is a blotter, not cards.** It was six lines of detail per
      order, three orders visible at once, and no way to compare them — a card is
      right for one thing and wrong for a book of them. Now one row per order with
      aligned columns (ref, placed, customer, total, stage, items, supplier), thirty
      visible at a time. Line items and addresses moved to the order page, which is
      where you go once you have found the order.

Two implementation notes worth keeping:

- **The clock uses `useSyncExternalStore`**, not `useState` + `useEffect`. Time is
  an external source being subscribed to, which is what that hook is for, and it
  gives a real server snapshot so the placeholder renders server-side with no
  hydration mismatch. A clock rendered on the server is already wrong by the time
  it arrives.
- **`hq.css` ends with a documented bridge layer.** Five pages predate the skin
  and are written in light-mode utilities (`bg-white`, `text-neutral-500`); on a
  near-black ground those are white boxes and black-on-black text. The utilities
  are remapped under `[data-hq]`, which outranks the originals on specificity.
  It is explicitly a bridge: a page is properly converted when deleting its
  entries from that list changes nothing.

**Not yet verified in a browser.** Typecheck, lint, 604 tests and a production
build all pass, but /admin is behind a login this session cannot reach, so the
rendered result is unconfirmed.

### [x] The zoom button now zooms — and a regression it uncovered

"this button needs to start working on images." It had no `onClick` at all: it
rendered, invited a click, and did nothing. Worse than absent, because it
promised something.

- [x] **A real image viewer.** Full screen, opaque black, opens from the button
      _or_ from clicking the photo itself (clicking a product photo to see it bigger
      is the expectation; making a small corner button the only way in is a puzzle).
- [x] **Zoom anchored on the point clicked**, not the centre — the thing you want
      a closer look at is the thing you clicked. Drag to pan, wheel to zoom to 4x,
      click again to fit.
- [x] **Keyboard**: Esc closes, arrows change photo, `+`/`-` zoom, `0` fits.
      Thumbnails for a long gallery, and a counter so you know how many there are.
- [x] **Lenis is stopped while it is open.** Smooth scroll runs in `root` mode
      across the storefront, so it would otherwise keep scrolling the page underneath
      and swallow the wheel gestures meant for zooming. Body `overflow: hidden` alone
      is not enough — Lenis translates the page itself.
- [x] **The zoom arithmetic is a separate, tested module** (`zoom-math.ts`, 11
      tests). A sign error there zooms _away_ from the point clicked and a wrong clamp
      lets the photograph be dragged off screen with no way back; neither throws,
      neither fails a typecheck, and both are obvious in a test.
- [x] **Verified in a real browser**, not just built: the dialog opens, the
      transform goes from `matrix(1,0,0,1,0,0)` to `matrix(2.5,0,0,2.5,-660,192)` —
      scaled _and_ anchored, offsets in the right directions for a click above and
      right of centre — the right arrow steps 1/8 to 2/8, Escape closes, and the page
      behind has not scrolled.

**The regression that verification caught.** The admin bar added earlier was a
Server Component in the storefront layout, reading cookies to identify the admin.
Product pages are statically prerendered (`● /shop/[category]/[product]`), and
reading cookies in a layout above them makes that impossible — **every product
page on the site returned 500 with `DYNAMIC_SERVER_USAGE`.** It had passed
typecheck, lint, 604 tests and a production build, and would have taken the shop
down on deploy.

Fixed by moving the check to `/api/admin-bar`, which the storefront fetches after
loading: pages stay static, the bar appears a moment later for one person, and the
route answers `204` with no body for everyone else. The links come back in that
response rather than living in the client bundle. It also now fails soft — a
missing Supabase variable makes the bar absent, not the shop broken.

Two lessons recorded rather than just fixed: a green build is not a working site,
and a convenience for the operator must never sit in the render path of a page a
customer needs.

### [x] Catalogue placement audit — mirrors, lighting, cross-categories

"all mirrors should be in this category… make sure we are using cross
categories… all lighting products should be in lighting… audit the entire site."

**The blocker was structural, not a matter of dragging products about.** Two new
scripts, and the first one found why the request could not be satisfied as asked:

| Category name | Exists | Products across them |
| ------------- | ------ | -------------------- |
| Lighting      | ×6     | 38                   |
| Storage       | ×5     | 42                   |
| Mirrors       | ×3     | 18                   |
| Shelving      | ×3     | 22                   |

"Mirrors" existed three times — Decor, Bedroom, Bathroom — so a customer browsing
mirrors saw whichever third belonged to the room they entered through. No amount
of moving products could make "all mirrors in Mirrors" true of any of the three.

- [x] **`scripts/audit-catalogue-placement.ts`** — reports duplicate category
      names, products whose title contradicts their category, empty categories and
      cross-listing coverage. Report-only: the fixes it implies are different in kind
      and each wants deciding.
- [x] **`scripts/canonicalise-categories.ts`** — one canonical category per type,
      every sibling's products cross-listed into it. **Additive**: the room
      categories keep their products and stay in the navigation, which is a standing
      constraint. Dry run by default.
- [x] **Applied.** 14 products cross-listed, 4 re-parented. **Mirrors went from 8
      to 15 and Lighting from 24 to 25** — verified in a browser, not just in the
      data.

Four products were simply in the wrong place, and are named individually in the
script rather than moved by rule, because a rule that re-parents automatically
eventually moves one it should not:

- **Tristan Mirror And Wood 4X6 / 5X7 Frame** → Wall Art. Photo frames with
  mirrored borders. These two were on the Mirrors page Damien was looking at.
- **Antique Etched foxed Wall Art Mirror** → Mirrors. A mirror filed under Wall Art.
- **Large Grey Stone Effect Hurricane Lantern** → Candles & Lanterns. Filed under
  Christmas Decorations, which made it invisible for eleven months of the year.

**Redirects, because a product's URL is built from its primary category.**
Re-parenting one moves its address, and the two frames had been indexed under
Mirrors. `RECATEGORISED_PRODUCT_URLS` is a new list rather than an addition to
`RENAMED_PRODUCT_URLS` — that list carries a tested invariant that the category
segment never changes, which is exactly what these entries change. All four
verified returning 308 to a live 200.

**Tuning the audit mattered as much as writing it.** The first run flagged 20
products; 16 were false positives — wall plaques in Wall Art, plants in pots in
Planters, and a "Soft Squiggly Mirror – Chunky Frame" caught by a rule meant for
photo frames. A list that cries wolf gets ignored, so the rules now only report a
title that reads as a _specific different_ type. It is down to zero.

Still open, reported and not acted on:

- [ ] **Storage ×5 and Shelving ×3 were cross-listed but not merged.** Whether
      those should be one category or stay room-scoped is a judgement about how people
      shop, not a data fix.
- [ ] **7 empty categories** — bathroom-accessories, bathroom-lighting, fire-pits,
      pergolas (untouchable by standing constraint), privacy-screens, rugs,
      towel-rails. A supplier problem, not a placement one.
- [ ] **Related products still match on the primary category only**
      (`RELATED_BY_CATEGORY_QUERY`), so a mirror in Bedroom → Mirrors is never offered
      beside one in Decor → Mirrors. Cross-listing does not reach the related rail yet.
- [ ] **Cross-listing is at 18%** of the catalogue, up from 15%.

### [~] Carriage and margins — 75 unknowns down to 9

"Most suppliers are good for free delivery." Right for two of the four, and the
data proved which rather than it being taken on trust.

**Hill Interiors — free, evidenced.** 70 of its 136 products were already
recorded at exactly £0 carriage and **none above zero**. Rule set to `included`
and the remaining 66 backfilled by the existing
`scripts/apply-supplier-shipping-rules.ts`. No price touched, nothing reaching a
customer. **Carriage unknowns: 75 → 9.**

**Two suppliers are demonstrably not free, whatever the general picture:**

- **AW Dropship** charges £2.79–£5.99 on 26 of its 37 products. Setting it to
  `included` would have written a fake zero onto small-parcel items and made them
  look more profitable than they are. 5 products still need a rule.
- **D.I. Designs** charges £80 on heavy items — three marble/oak coffee tables
  carry it. "Included in the sales price" reads as Damien having absorbed it into
  his retail price, which the recorded figures support, so those stay. 4 products
  still need a value.

**Margins, now on real carriage for 96% of the catalogue:**

| Band        | Products                                                 |
| ----------- | -------------------------------------------------------- |
| Loss-making | **0**                                                    |
| Under 10%   | 3 (all D.I. Designs, untouchable by standing constraint) |
| 10–15%      | 13                                                       |
| 15–20%      | 33                                                       |
| 20–35%      | 91                                                       |
| 35%+        | 95                                                       |

Nothing is being sold at a loss. That was the open question behind "prices
reviewed to make sure we make profit", and the answer is better than feared.

- [!] **Berkeley White Console Table is a data-entry transposition.** `costPrice
£0`, `shippingCost £510`, price £680. £510 carriage on a console table is not
  credible; £510 as the cost price with £0 or £80 carriage is, and would put it on
  the same ~25% margin as its siblings. Flagged repeatedly and still never guessed
  at — it needs Damien's confirmation, because inventing either number is how a
  margin report starts lying.
- [ ] **AW Dropship's carriage rule** — the recorded range suggests per-item by
      size. 5 products awaiting it.
- [ ] **D.I. Designs' 4 missing carriage values.**
- [x] **Junk supplier records identified**: `AOSON` is a typo duplicate of `Aosom`,
      both with zero published products.

### [x] Kaiku HQ tile on the account page, and a stale line removed

"add admin here" — a fourth tile on `/account`, dark against the three light ones,
because that is the back of the shop and should never look like something a
customer is meant to click.

Rendered only when `getAuthorizedAdmin()` returns an admin, so a customer's HTML
contains no trace of it. Verified against a running server: a signed-out request
to `/account` returns **zero** occurrences of "Kaiku HQ" and **zero** of `/admin`.

Safe to resolve the admin here, unlike the storefront bar: this page already reads
cookies to find the user, so it is dynamic (`ƒ /account` in the build) and cannot
be caught by the prerender trap that made every product page 500. Checked in the
build output that product pages are still `●` prerendered. The admin lookup also
fails soft — a missing tile is invisible, a broken account page is not.

**While in there:** the signed-out state told visitors _"Checkout still works as a
guest either way."_ That stopped being true when guest checkout was removed. Now
it says an account is needed, and why. Exactly the class of contradiction the
site-wide audit is meant to catch, found by reading the file rather than by a
rule.

### [x] The test-send button was lying

"emailing my self a template didnt work."

It very likely did not send, and the page said it had. `sendTestEmail` called
`sendBuiltEmail`, ignored the boolean it returns, and reported
`ok: true, "Sent to you@example.com"` unconditionally. The reason went to a server
log nobody was reading. **A button whose only purpose is to answer "does email
work" answered yes regardless** — worse than not having one.

Fixed so the page tells the truth:

- [x] **`sendEmailWithOutcome`** returns why, not just whether: `sent`,
      `no-api-key`, `no-from-address`, `rejected`, `network-error`, with Resend's own
      error text passed back. `sendEmail` keeps its boolean signature, so the
      deliberately fail-soft live senders — order confirmation, stage emails — are
      untouched. An order must never fail because an email did.
- [x] **`no-from-address` is reported as a failure even though Resend accepts
      it.** Without `RESEND_FROM_EMAIL` the mail goes out as Resend's onboarding
      sender, which only ever delivers to the account holder's own address. A boolean
      says "true"; a customer gets nothing. That is the single most likely reason a
      test send silently vanishes.
- [x] **A banner before anyone presses anything.** `/admin/emails` now states up
      front whether the deployment can send at all, and which address it sends as.
      The old flow made "email is switched off" discoverable only by sending a test
      and waiting for something that was never coming.
- [x] **Result text is coloured** by outcome. It was neutral grey either way.
- [x] **10 tests** (`transport.test.ts`), including one asserting the API key
      never appears in text shown to an operator, and one pinning `sendEmail`'s
      boolean contract so the fail-soft callers cannot be broken by a later change.
      Runs under `// @vitest-environment node` — the `env` proxy refuses server
      variables when `window` exists, so under the project's default jsdom every
      assertion failed for reasons unrelated to email.

### [~] Returns — the last legal gap

Kaiku published a returns policy and had no way to act on one. A customer who
read it was told to "contact us with your order number", which meant an email
into an inbox with no reference, no record and nothing tying it to the order.
Under the Consumer Contracts Regulations 2013 a customer has a **right** to
cancel, and a shop that cannot reliably receive a cancellation will eventually
fail to honour one.

**The distinction the whole build turns on:** what the customer is legally owed
is not the same question as whether the supplier will still accept a claim. The
policy asks customers to report damage within 48 hours _because suppliers set
their own windows, some as short as three working days_. That is an operational
fact about Kaiku's suppliers — it cannot shorten a statutory right. Code that
refused a fault on day 20 would be unlawful.

- [x] **`server/returns/eligibility.ts`** — pure and tested, 21 tests. Encodes the
      published policy plus the statutory minimums: 14 days to cancel (Consumer
      Contracts Regulations 2013), 30-day short-term right to reject and
      repair/replace after (Consumer Rights Act 2015).
- [x] **A fault can never be auto-declined.** Asserted exhaustively across every
      fault reason × 8 ages × used/unused × packaging × photos — 256 combinations,
      none of which may return `decline`. The worst outcome for a fault is "a human
      should look at this", and Kaiku always pays the return shipping.
- [x] **Change of mind is the only route that can decline**, and only past the
      statutory window — where the customer is pointed at the fault route, which has
      no deadline. Used or unpackaged goods go to review, never refusal: the law
      allows a _reduced_ refund for handling, not a rejection.
- [x] **Made-to-order in production goes to review, not decline.** The policy says
      it cannot be cancelled "unless required by law", and that caveat is doing real
      work — only genuinely bespoke or personalised goods lose the statutory right
      (reg. 28), and a standard product built to order usually keeps it.
- [x] **Migration `0006_returns.sql`** — `KR-` references from a sequence (the
      policy promises "the reference the warehouse needs"), RLS letting a customer
      read only their own, and **deliberately no customer UPDATE policy**: letting
      someone mark their own return "refunded" is not a hypothetical risk.
- [x] **`requestReturn`** verifies the order belongs to the signed-in user
      server-side rather than trusting the form, refuses a second open return on the
      same order, and writes a `return_requested` event onto the order timeline so it
      appears in admin beside everything else rather than in a silo.
- [x] **The form lives on the order's own page**, not behind an email address.
      Condition questions are asked only for a change of mind — asking whether a
      broken table is "unused and in its original packaging" reads as hunting for a
      reason to say no, and the answer changes nothing.

Still to finish:

- [ ] **Photograph upload.** The assessment already asks for pictures on a
      transit-damage claim and routes it to review without them; the upload itself is
      not built, so `photoCount` is always 0 today.
- [x] **Returns now appear in the alerts feed**, merged with the order watchdogs
      into one list. A customer waiting on a return decision is not a lesser problem
      than an order waiting on a purchase order — it is the same failure, to someone
      already unhappy. Three rules, 8 tests:
  - **Waiting on a decision** — warning immediately, **critical** once the
    promised working day has passed, and critical from the start when the
    supplier's claim window has already closed, because then the delay costs
    Kaiku money rather than goodwill.
  - **Approved but never came back** after 10 working days.
  - **Received but not refunded** — critical. They have handed the goods over and
    are out of pocket; the law allows 14 days, and making them wait for it is how
    a return becomes a chargeback.
  - Reading the `returns` table **fails soft to an empty list**, so the order
    watchdogs keep working before migration 0006 has been run.
- [ ] **A dedicated admin returns screen** and the supplier return request.
      Actionable from the order page and visible in alerts meanwhile.
- [ ] **Emails** — `return-requested` is not in the email catalogue yet.
- [ ] **Migration 0006 needs running** in Supabase before any of it works.
- [ ] **Have the policy itself reviewed by someone qualified.** The code
      implements it conservatively in the customer's favour, which is the safer legal
      position, but that is not the same as legal advice.

### [x] Every piece of external data we need, listed — `docs/external-data-requirements.md`

"we should make a list of all external info we need to retrieve, shipping rules,
live prices, live stock, auto fulfilment too". Written against the live dataset
rather than from memory, which changed several of the numbers this ledger was
carrying.

Four areas, plus a fifth that turned out to be the precondition for all of them:
**the identifiers**. A stock feed that cannot be matched to our products is not a
stock feed. 36 published products have no `supplierSku` and 68 have no GTIN, so
those rows would land nowhere.

The single highest-value finding, and it is not a technical one: **only one
supplier of five has a trade email on record.** D.I. Designs does; Hill
Interiors (136 products), AW Dropship (38), SaunaPlunge (8) and Aosom (1) do
not. **183 of 237 published products cannot be ordered from the admin at all**,
because the purchase-order screen has no address to send to. Three email
addresses typed into Studio unblocks 76% of the catalogue, and takes ten
minutes. It is the first thing in "Blocked on you" now.

The document is written as **asks, not scrapes** throughout — a supplier's bot
protection stays untouched, so every line is something a trade account can
legitimately be given. It includes the email to send, and the order to send it
in, because the answer to most of this is a file we have never requested.

**Two corrections to things this ledger previously recorded wrongly:**

- **The images are fine.** An earlier count claimed all 236 published products
  had no `images` field. The field is called `gallery`. All 237 have one, and
  all 237 have a `sourceUrl` too. The earlier finding was a query against a
  field name that has never existed.
- **The carriage unknowns are 10, not 9**, and they are D.I. Designs 4 plus AW
  Dropship 6. AW Dropship's are unresolvable until they send their weight-band
  table, because the rule shape needs a per-item weight and none of their 38
  products carry one.

Also found, flagged rather than fixed: Hill Interiors spells the same lead time
four ways — `7–14 days` on 57 products, `7-14 days` on 13, `3-4 weeks ` with a
trailing space on 43. Standing constraint says lead times are not to be changed,
so I have not. `scripts/normalise-lead-time-punctuation.ts` already exists and
touches only the punctuation, if you want it run.

- [ ] **Put the three missing supplier emails into Studio** — Hill Interiors, AW
      Dropship, SaunaPlunge. Unblocks 183 products for ordering.
- [ ] **Send the five supplier emails** in `docs/external-data-requirements.md`.
- [ ] **Feed ingestion, `lastVerifiedAt` timestamps, a stale-data watchdog and
      automatic price-change audit entries** — all scoped in section G, none of
      it worth building before a supplier has said what they can give us.

### [x] Catalogue quality audit — drift found, dated and measured

`docs/catalogue-quality-audit.md`. The full audit pass, **with nothing
rewritten**, because the brief said to show findings first.

**Drift is real and it has a date.** Products written before 13 August: 88
published, 2 failing (2.3%), median score 9.0, 0.70 facts per hundred words.
Products written 13–16 August: 148 published, **35 failing (23.6%)**, median 7.8,
**0.20 facts**. The failure rate went up tenfold while the descriptions got 60%
_longer_. Length was substituted for knowing anything about the product.

The measure that separates good from bad is **fact density**, not word count —
word count ranks the worst products highest. The archetype is a 1,105-word Glass
Candle Holder that never states its height, its diameter, the candle size it
takes or whether it can go outside, and whose FAQ reads "Dimensions are not
specified for this product."

**I threw away my own first hypothesis.** I assumed bespoke-sounding headings
marked the good products; "Effortless Placement in Any Room" proved that wrong.
Rebuilt on fact density, which survives inspection.

Nine of the ten scored dimensions are healthy at a median of 10.0. Only
specificity is on the floor at 1.5. The catalogue does not have general rot; it
has one specific, fixable disease.

**Two corrections to what was expected:** the 40 supplier-name leaks are all
**Hill Interiors**, not D.I. Designs — D.I. Designs has zero and is the
best-scoring supplier at 9.0. And 34 of the 37 failures are Hill Interiors.

- [x] **The scoring engine** — `src/lib/catalog/quality.ts`, 26 tests, pure and
      Sanity-free so the script and the admin screen score identically.
- [x] **`/admin/products`** — the live readiness screen, worst first, filterable
      by tier, supplier, published/draft and the unwritten backlog. Click a row
      for all ten scores and every finding. Re-runs itself; new products are
      scored the moment they exist.
- [ ] **Tier 1 fixes** (~1 hour, mechanical): 40 supplier leaks, 17 titles
      missing `| Kaiku` including a "Kaiku Tagline" template bug, 4 FAQs that
      answer nothing, 16 over-long meta descriptions.
- [~] **Tier 2 rewrite**: the 37 REVIEW products, then the 93 padded ones.
  **Target corrected.** The earlier 350–650 word target was wrong. Damien:
  _"the descriptions fully desribing the product and telling you how to
  style it is what aligns with kaiku, as long as all facts are correct we
  can make long descriptive descriptions"_, then _"try make the pergola
  description excactly like the sorelle sofa, same length"_. The Sorelle Two
  Seater Sofa runs to **1,628 words** and is the benchmark. Shortening the
  catalogue would have been the opposite of what was asked for.

### [~] Long-form descriptions in the house style

the template writer (removed) (+16 tests). Reproduces the Sorelle's actual
structure, which is one move repeated: a short prose section that says something
specific, then a themed list. "Perfect for:" eighteen settings. "Pair it with:"
eleven materials. "Position it alongside:" seven pieces. The lists carry the
long-tail phrases people search and cannot state anything false; the prose
between them is where the measurements go.

Current output: **pergola 1,586 words, sofa 1,409** against the benchmark's
1,628, from nineteen sections. Nothing is invented — a test asserts that every
number appearing in the copy is one we hold on the product.

Faults found and fixed while building it, each now covered by a test:

- It told a pergola buyer how the piece would read _"in the room"_.
- It paired a garden pergola with linen, leather, marble and woven rugs, because
  the pairing table only knew indoor schemes. Outdoor products now get outdoor
  pairings, and both directions are tested.
- It repeated the full 60-character product name in every section. The Sorelle
  says "the Sorelle" after introducing itself, which is why it reads as prose.
- Section closing lines printed _above_ their own lists.
- It stated measurements only when they were large, so the Sorelle itself — the
  benchmark — came out at 798 words while the pergola got 1,472. The real page
  repeats its 197 cm throughout, because that is the number being decided on.

**Length is now earned rather than assumed.** `trimToSubstance` builds the whole
page, measures its own fact density with the scorer's own pattern, and drops
styling sections from the back until the remainder clears the bar. A product we
hold real measurements for keeps the full page; one we hold almost nothing on
gets a shorter honest page and shows up in the audit as needing its facts
harvested. An earlier version gated on how many fields were filled in and got it
exactly backwards — it kept 1,400 words on a vase with no recorded height while
stripping the pergola's styling sections because no colour was set.

- [x] The `words > 1200` penalty in `quality.ts` raised to 2,000. It was written
      before Damien set the house style and would have marked down the Sorelle
      itself. The padding rule that actually catches filler — long copy carrying
      no facts — is untouched.

#### [!] First catalogue-wide run was stopped mid-flight — 24 August

Damien approved scaling to the catalogue ("make every single product
description like the pergola, improve all descriptions published and
unpublished"). The dry run reported 604 rewrites, average score 7.74 → 8.67,
and I applied it after reading two sample pages. He caught a fault on a live
draft within minutes and I killed the run.

**Damage: 396 products written, all drafts, zero published.** 383 restored
exactly from Sanity's document history; 13 had no prior description to restore
to. Nothing live was touched.

What was wrong, on "Sweet Birch Essential Oil 50ml":

- **"The Sweet has been chosen to suit…"** — `shortName()` took the first word
  of any name that was capitalised and four letters or more, on the theory it
  was a range name like "Sorelle". It hit every product whose name starts with
  an adjective. Names now shorten only at a joining word, or not at all.
- **"Built Around Its Measurements"** over a paragraph with no measurements in
  it. Headings now follow what the section actually says.
- **1,200 words of styling advice about a 50ml bottle of oil.** It records no
  dimensions, so every specific sentence was skipped and only the generic frame
  survived. Products with no dimensions are now skipped outright — weight alone
  buys one sentence about being light, and nothing else the long form does.

Two process faults of mine, worth recording because they caused this:

1. I applied to 604 products having read two pages.
2. I chose those two samples myself, from the categories I had already reasoned
   about, so the sampling confirmed what I already believed instead of testing
   it.

- [x] `scripts/restore-descriptions-from-history.ts` — puts descriptions back
      to a given timestamp from Sanity's history API. Written because the
      change log stored the previous copy as _plain text_, which reads fine and
      cannot restore: it loses the blocks, headings and keys. The log now
      records the previous copy for reference and history is the restore path.
- [x] **Sampled every category before applying again.** Instead of picking two
      products by hand, the fixed writer was run over one product from each of
      the 33 categories and its output fed through `context-check` and
      `wording-check`. Only 4 of 33 came back clean; after the fixes, 32 of 33
      were. It found three faults in the writer — "The The Rutland Collection"
      doubling an article the name already had, an outdoor sauna told about
      "sightlines across the room" because place came from family rather than
      siting, and an indoor sauna offered "Poolside areas" from an unfiltered
      settings list — and three false positives in the detectors, the worst
      being a black barbecue reported as claiming to be brass, copper and
      terracotta because bulleted pairing items reach the checker stripped of
      the "Pair it with:" heading above them.
- [ ] **Show Damien the sampled pages before applying again.** The dry run is
      ready; nothing is written until he has read some.

### [~] Copy that admits it does not know — 1,163 products

Damien, on the live Lennox Black 2 Door Side Cupboard, whose first paragraph
read "The details regarding assembly requirements … are not listed. For further
information, please refer to the supplied instruction manual or contact
customer support": _"thats language we shouldnt be using"_.

He is right, and the fix is deletion, not rewriting. A page has two honest
options about a fact it does not hold: state it, or say nothing. Announcing the
gap tells a shopper we did not check, and sends them away for the thing they
came to find out.

`src/lib/catalog/admissions.ts` (+14 tests) works a **sentence** at a time, not
a paragraph at a time, because the same paragraph often carries a real
instruction beside the apology — "The specifics on the number of cartons are
also not provided. It is advisable to check your access points regarding width
and height." The first sentence goes, the second stays. A heading left with
nothing beneath it goes too.

The existing quality scorer knew "not specified", "not stated" and "not
provided" but **not "not listed"**, which is why this page scored as publishable
while opening with an apology.

|                            |                                   |
| -------------------------- | --------------------------------- |
| Products affected          | **1,163** (97 live, 1,066 drafts) |
| Sentences removed          | **2,797**                         |
| Headings left empty        | **770**                           |
| Words removed              | **47,483**                        |
| Pages left under 120 words | 58 (2 live)                       |
| Pages left under 60 words  | 0                                 |

25 removed sentences sampled at random: every one correct, no false positives.
This is deletion only — nothing generated, nothing reworded, no fact invented —
which is what makes it safe to run catalogue-wide in a way the rewrite was not.

- [x] Superseded by the template pipeline (removed), which does the cleaning
      and the rewriting in one pass.

### [x] "Write description" button in the Studio — the right approach

Damien, after a week of template output that read the same on every page:

> "can we make a button in sanity that fills what we can specific to the
> product?, its not sanity thats writing it its you so yes you can make it
> specific to what the product is, the only way you wouldnt be able too is if
> your not understanding the business"

**He is right, and this is the correction to everything above it.** A template
can be consistent or it can be particular, never both — it recombines fixed
sentences, so a pergola and a candle holder come out the same shape with the
nouns swapped. Every fix in the sections above was me patching the template to
cover another case, which made the sameness worse, not better. Asking a model
to write each page produces something genuinely different each time, because it
is writing rather than filling slots.

**How it works.** A document action on products calls
`/api/admin/write-description`, which reads that product's facts, has the page
written from them, and checks the result before returning it. The result is
patched into the open document as an ordinary unsaved edit — visible,
reviewable, undoable, never published behind Damien's back.

- `src/lib/catalog/write-description.ts` (+21 tests) — the fact sheet, the
  brief, and the gate. All pure, so it is testable without spending anything.
- The brief describes a **voice and a set of prohibitions**, never a section
  list. Naming the sections is what produced identical pages, so it says
  "a candle holder, a pergola and a dining table have almost nothing in common,
  so their pages should not share a shape" and lets it choose.
- The **gate** runs every checker in the project over the finished text —
  context, wording, artefacts, and filler. One finding and it is sent back once
  with the specific objections. Fails twice and the objections are returned
  instead of the copy.
- Products with **no dimensions are refused** with a message saying to add them
  first, rather than producing a page with nothing true in it.
- Uses the OpenAI key already configured for the visualiser and importer, so
  there is no new credential to set up.

**The template pipeline has been deleted, not parked.** Damien: "whichever
change you said we shouldnt do which is included in this push then dont include
it". It was never applied to a single published product and it is not coming
back — a template cannot write per-product copy, so leaving it in the repo only
invites someone to run it.

### [~] Finalise: one standard, enforced by the code

Damien: _"literally just make every product description great and consistent
with 0 mistakes. this isnt too difficult"_.

Consistency and zero mistakes are things code can guarantee. "Great" is not,
because a page can only be as good as the facts behind it. So
the template pipeline (removed) separates the two honestly.

**Every page is checked before it is written**, against every detector in the
project — the context checker, the wording checker, and the quality scorer's
artefact patterns. **One finding and the page is not written at all.** It goes
on a list with the reason instead. That is the difference between "I sampled
some and they looked fine", which is how the two failed runs happened, and a
standard the code actually enforces.

|                              |                                    |
| ---------------------------- | ---------------------------------- |
| Rewritten to the house style | **607** (183 live)                 |
| Cleaned of admissions only   | **764** (51 live)                  |
| Existing page already better | 1,001                              |
| No dimensions — needs facts  | 31                                 |
| **Held back by the gate**    | **3**                              |
| Average rewritten page       | 1,306 words, score 7.79 → **8.72** |

Getting the gate from ~90 rejections to 3 meant fixing five more faults, all of
them raw supplier data reaching the copy:

- **"The grey, white finish gives the Marble Effect Olpe Vase…"** — harvested
  colours are compound strings. Now read as "grey and white".
- **"brings together mdf 10%, mirror 40%, oak wood 50% construction"** — the
  material field is a percentage composition. `dominantMaterial()` takes the
  largest _usable_ component, so a grey sofa stops describing itself as gold.
- **`&amp;` reproduced from the product title** into the description body.
- **"A Antique Finish"** — the article never agreed with what followed it.
- Spec values with unclosed brackets or HTML going straight into prose.

The 3 the gate still refuses have supplier data that contradicts itself — a
title saying 6-person against copy saying 2, a stated 90cm against a recorded
98cm. They need the fact resolved, not the prose reworded.

- [ ] **Supplier name in published titles** — `Sweet Birch Essential Oil 50ml |
Ancient Wisdom | Kaiku`. Its draft has no `| Kaiku` suffix at all. Found
      incidentally; not yet swept for across the catalogue.

- [ ] **Confirm the pergola output with Damien before scaling to the catalogue.**
      He has said twice that the result was "nothing like our old ones"; this is
      the third attempt and it should be looked at before 368 products move.
- [ ] **674 unwritten drafts** (691 Premier Housewares). Recommendation: do not
      bulk-generate. That process is what produced the 13–16 August cohort.

### [~] Remediation plan — all 8,118 findings itemised

`docs/remediation-plan.md`, with every finding as a row in
`docs/change-log/remediation-items.csv`. Damien: "All 10,508 findings must be
rectified and I want it listed."

**The number is now 8,118, not 10,508, and the reason matters.** 10,508 was true
at 23:10 on 20 August. **1,379 products were edited between 23:00 and 01:13**,
all gaining a description and a meta title, closing roughly 2,200. A further 152
were my own false positives: the repeated-word and doubled-space checks matched
across block boundaries, so a heading "Care and Cleaning" above the paragraph
"Cleaning the vase is simple" counted as a repeated word. Fixed with tests.

Every finding now carries a route to closing it:

| Route        | Findings |     |                                    |
| ------------ | -------: | --: | ---------------------------------- |
| AUTOMATIC    |    2,943 | 36% | a script closes it                 |
| NEEDS DATA   |    2,826 | 35% | only the supplier holds the fact   |
| NEEDS DAMIEN |    1,187 | 15% | almost entirely price              |
| WRITING      |    1,162 | 14% | nothing blocks it, it is just work |

**The honest ceiling on what can be closed without Damien or a supplier is about
5,100 of 8,118 — 63%.** The rest needs an email answered or a price set. Closing
them any other way would mean inventing data, which is the failure this audit
exists to stop.

The largest recoverable block is the 976 "copy admits it does not know"
findings: every product has a `sourceUrl`, so those facts can be read from the
supplier's own page for that product without waiting on anybody.

- [ ] **Run the three automatic scripts** — tier1, assign-skus, rewrite-meta.
      2,943 findings, minutes of runtime, every change logged and reversible.
- [ ] **The 15 loss-making products** — smallest count, most direct cost.
- [ ] **Harvest facts from `sourceUrl`** — recovers ~1,000 with no supplier
      contact needed.

### Still open on orders

- [ ] **"one place to track all orders easily then quickly order it by pressing
      a link"** — the admin list is that place now, but the second half, a
      one-press supplier order from the order row, is not built.
- [ ] **Failed-payment handling** and **abandoned-basket recovery**.
- [ ] **The 10% off second order** for creating an account.

---

## Part 5 — Product pages and conversion

- [x] **Department tabs open the dark category hub again; category tiles open the
      white grid.** One release sent both `/shop/[category]` and
      `/shop/room/[room]` to the white product grid, which was an overcorrection:
      the complaint it answered was about _categories_ landing on the black page,
      and a department is a different kind of thing. "Outdoor Living" is a hub of
      eleven categories, and flattening it into one grid of every product in the
      department discards the only structure a shopper has. Now
      `/shop/room/<room>` is the dark hub, `/shop/room/<room>/all` is every product
      in it, and `/shop/<category>` is the white grid — so the room title opens the
      hub and a category tile opens the products. Dropping `searchParams` from the
      room route also restored static generation for the eleven department pages.
- [x] **The "All Collections" count is now the number a shopper can reach.** It was
      `count(*[_type == "product"])` with no filter at all — it counted products
      with no category, which have no URL and appear in no listing, and would have
      counted all 101 unpublished drafts the moment the client running it carried a
      token. Now the same predicate every listing uses.

- [~] **Consistent premium structure**, all 14 sections in order.
- [~] **Every description unique**; explains what makes it different, design
  characteristics, materials, practical benefits, suitable rooms, styling,
  customer considerations.
- [x] **Empty side panel fix** — decorative line artwork, architectural
      patterns, organic shapes, botanical line drawings, minimal luxury
      illustration. Not product images. Varied by department: wood-grain lines
      for furniture, water patterns for wellness, garden linework for outdoor.
      **Seven motifs** in `src/lib/product/artwork.ts` — wood-grain,
      architectural, water, steam, garden, botanical, radiance — chosen from the
      department, with a short category override list so a water feature does not
      get garden linework and a planter does not get paving. Each motif is a
      generator seeded from the product's own slug, which is how _consistent_ and
      _varied_ are both satisfied: one visual language per department, no two
      products drawing the same picture, and the same product drawing the same
      panel every time — art that changed on refresh would read as a glitch, and a
      non-deterministic panel is a hydration mismatch on 99 pages.
      Fills the four panels capped at `max-w-3xl`, which left roughly 400px of bare
      off-white beside them (Specifications, Delivery, FAQs, Reviews — worst on
      Reviews, where a new product has three lines of copy in a screen-height
      band), plus the description column on products with no photograph. `lg:`
      only: there is no empty space to fill on a phone, so on mobile it would be
      pure scroll length. Rendered and inspected with
      `scripts/preview-product-artwork.ts` rather than assumed — garden and
      radiance were rebuilt after the first pass drew a radar dish and a spider's
      web, and botanical after it came out emptier than the space it replaced.
      **Second pass, because Damien could not find it.** All four tab panels are
      `hidden` on page load — Description is the default tab — so on a first visit
      every panel was invisible, on the one tab whose name the brief actually used.
      The artwork now also sits in the Description column, beneath the product
      photograph, cropped square so photo and artwork together still fit inside a
      laptop viewport (a sticky column taller than the screen can never be scrolled
      to its own bottom). **The travelling photo is untouched** — Damien singled it
      out; `sticky`/`self-start` only moved from the photo to the wrapper around it,
      so photo and artwork travel together, and a Playwright check measures the
      travel (photo pins at y=97 after 700px of scroll) so a later change cannot
      break it silently. Three motifs then had to be nudged inward: a square crop
      shows only y 80–480, and it was slicing off architectural's dimension line,
      radiance's shade and botanical's seed head — the accent is the only colour in
      each panel, so losing it turns the panel grey. A test now asserts the accent
      survives the square crop across 40 seeds per motif, and it was confirmed to
      fail on the old values before being kept.
- [!] **The `| Kaiku` suffix is on the page, not just in the tab — your call.**
  Found while photographing the artwork in place, and it is one line to fix
  either way. The `<h1>` on every product page reads _"13.6m Warm White
  Decorative LED String Lights | Kaiku"_; the Reviews panel builds a sentence
  round the same string — _"The 13.6m Warm White Decorative LED String Lights
  | Kaiku is newly listed"_; and the `Product` structured data hands that
  string to Google as the product's name, which is what can surface in a
  Shopping listing.
  I have **not** changed it, because "do not change product names, or strip
  the `| Kaiku` suffix" is a standing constraint at the top of this file. It is
  worth knowing that the constraint costs nothing where it was aimed:
  `src/lib/seo/metadata.ts` keeps the suffix in the `<title>` tag and in the
  OpenGraph title, so search results and shared links still read
  "… | Kaiku" whatever you decide here. The question is only whether the
  shopper sees it inside a sentence on the page.
  `productDisplayName()` (`src/lib/catalog/product-name.ts`, 7 tests) is built
  and does the careful version — a _trailing_ brand segment only, so "Provence
  Dining Set | 4 Seater" keeps the pipe that distinguishes it from the
  6-seater. **Say the word and it goes on one line in `normalizeProduct`,
  which is commented with exactly where.** Nothing about product names in
  Sanity changes either way.
- [x] **Section formatting** — rules between sections, proper spacing, premium
      typography, no large blocks of text, scannable.
- [x] **RETURNS** heading — bold, consistent, clearly visible, on every page.
      Its own section, not half of "Warranty & Returns", sharing one
      `panelHeading` constant with Delivery and Warranty so "consistent" stays
      true as the page changes. Verified rendering on a live product page.
- [~] **Delivery information** — lead time, availability, delivery method,
  matching the supplier.
- [ ] **Delivery lead time report.**
- [x] **Large furniture disclaimer** — `DOORSTEP_DELIVERY_NOTE` in its own
      bordered panel on the Delivery tab of every product `isLargeFurniture()`
      matches, rather than a line of small print. Doorstep versus room-of-choice
      is one of the most common causes of a furniture complaint, so a buyer who
      reads it before ordering does not raise one after. Verified on the Provence
      4-seater dining set.
- [~] **Unique, SEO-focused, product-specific FAQs.**
- [x] **Comparison feature** — price, dimensions, material, colour, features,
      delivery time, availability, specifications, side by side.
- [ ] **Meaningful related products** — by room, style, material, intent and
      buying journey. Currently a manual `relatedProducts` field with no
      derivation.

---

## Part 6 — Business systems and conversion

- [~] **Checkout audit** — add to basket, basket, checkout, payment,
  confirmation, customer emails. Done as far as the 19 August order exposed:
  guest checkout removed, order numbers added, the free-delivery contradiction
  fixed. Abandoned-basket recovery and failed-payment handling are still open.
- [x] **Stripe** — live payments, payment methods, checkout flow, order
      confirmation, receipts. Live and proven with a real charge on 19 August.
      Failed-payment handling is the one part not yet built.
- [x] **Full test order before launch** — 19 August, £19.00.
- [~] **Customer accounts** — create, view orders, save details, track
  purchases. Audited 19 August: checkout now requires an account, so an order
  can no longer exist without one to appear in. Order history and the tracking
  page both show the readable order number. Saved details are still not built.
- [~] **Email system** — welcome, order confirmation, payment confirmation,
  shipping update, delivery notification, abandoned basket, account
  creation, follow-up. Eight are built, editable in Studio, and previewable
  and test-sendable from `/admin/emails`. Abandoned basket and the 10%-off
  follow-up are not built. Every one of them is still blocked on
  `RESEND_API_KEY` — nothing has ever actually sent.
- [ ] **10% off second order for creating an account** — framed as joining the
      Kaiku community, not as a hard sell.
- [~] **Product badges** — new arrival, low stock, limited availability, popular
  choice, coming soon. Premium wording only; no "SALE!". Field exists,
  nothing populates it.
- [ ] **Live stock infrastructure** — supplier stock checks, variant
      availability, lead times, automatic updates.
- [x] **20 suppliers not yet emailed** — `docs/supplier-targets-20.md`, with
      company, website, products, fit, contact method, approach.
- [x] **Instant-signup suppliers** — `docs/supplier-instant-signup.md`. Written
      because the 20-supplier list is getting no replies, which is what happens
      to every new retailer approaching premium brands with no trading history.
      Nine UK/EU platforms with automated or near-automated approval, mapped
      onto the 19 empty categories, plus the five to open first. A VAT number is
      not generally required, which matters as you are below the threshold.
- [x] **Aosom range deleted** — all 32 documents (7 published, 25 drafts), backed
      up to `backups/aosom-products-2026-08-12T20-33-09-707Z.json` first. They
      had not accepted the application. This emptied 8 more categories, which is
      what makes the instant-signup list urgent rather than optional.
- [ ] **Supplier outreach emails** positioning Kaiku as a premium,
      content-driven partner rather than another reseller.
- [ ] **High-ticket product pages** — buying guides, FAQs, comparisons,
      installation information.
- [x] **Quote page** — name, email, phone, product, quantity, project type,
      budget, timeline, message, with a `quoteRequest` document type in Studio.
- [~] **Trust improvements** — delivery, returns, contact, brand story, supplier
  credibility, quality messaging.
- [ ] **Competitor positioning** — premium products, competitive pricing, expert
      guidance, better experience. Not price-only.

---

## Part 7 — Technical foundation and scaling

- [ ] **Technical audit** — frontend, backend, CMS, images, database, APIs,
      performance, mobile, error handling. Identify technical debt, poor
      architecture, scalability problems.
- [~] **Sanity optimisation** — review every content model; products,
  categories, SEO fields, image manageability, relationships.
- [ ] **Bulk editing tools.**
- [ ] **Supabase architecture** — products, suppliers, inventory, SEO tracking
      tables as specified.
- [ ] **Image management fixes** — high-resolution display, updates saving,
      persistence after deployment, automatic optimisation. Audit CDN, image
      optimisation, cache, CMS references, frontend rendering.
- [~] **Performance** — mobile, LCP, image loading, JS size, unused code,
  animations, fonts, caching. One real win so far: the mobile hero image is
  no longer downloaded behind `display:none`.
- [~] **Analytics** — visitors, sources, product views, category views, search
  usage, add to basket, checkout starts, purchases, quote requests, email
  signups. **Both tags fired a page view and nothing else.** No `view_item`, no
  `add_to_cart`, no `purchase` — on GA4 or on Meta. Three consequences, each of
  which would have wasted ad money: GA4 could never record a conversion, so a
  session had no known value; Meta could not optimise for sales, because a sale was
  never reported to it; and **catalogue retargeting was impossible**, since showing
  somebody the exact table they looked at needs `ViewContent` carrying the product
  ID. `src/lib/analytics/events.ts` now reports view, add to basket, checkout start
  and purchase to both platforms, with the **product slug as the content ID** —
  the same identifier the Merchant feed uses, so all three systems name a product
  the same way. Purchase de-duplicates on the Stripe session ID, so a refresh does
  not book a second sale. Still to wire: search usage, quote requests and email
  signups.
- [~] **Conversion tracking** — which products get attention, which categories
  perform, where users leave, which pages convert, which SEO pages bring
  customers. The four ecommerce events above are the foundation and are in. The
  funnel report they feed needs GA4 to be receiving them first, which needs the
  measurement ID in Vercel.
- [ ] **Search** — products, categories, materials, colours, styles, rooms.
      "black coffee table", "oak furniture", "garden sauna", "green sofa".
- [~] **Filter architecture** — category, colour, material, price, brand,
  availability, style, room, product type. In progress.
- [ ] **Supplier integration preparation** — feeds, CSV imports, APIs, stock
      feeds, addable without a rebuild.
- [ ] **Security audit** — payments, customer data, forms, authentication, APIs.
- [ ] **Error monitoring** — broken pages, failed images, checkout errors, API
      failures, CMS problems.

---

## Part 8 — Execution order

The phase order is the order of work.

1. **Phase 1 — fix broken experiences.** Mobile, category navigation, image
   publishing, incorrect products, broken pages, missing information.
2. **Phase 2 — product quality.** Every product correct: information, images,
   categories, pricing, stock, SEO, unique descriptions.
3. **Phase 3 — SEO foundation.** Product, category and technical SEO, internal
   linking, content structure.
4. **Phase 4 — conversion.** Product pages, checkout, trust signals, quote
   system, customer journey.
5. **Phase 5 — scale.** More suppliers, products, categories, automation.

### Metrics to monitor

Traffic · rankings · product views · conversion rate · enquiries · sales.

None of these can be read yet: analytics is not implemented and the current
build is not deployed.

---

## Where Phase 1 actually stands

Mobile and category navigation are largely fixed **in the repo**. Three Phase 1
items remain genuinely open:

1. **Image publishing** — not investigated at all. This is the largest untouched
   Phase 1 item and it is a data-integrity problem, so it comes next.
2. **Category page image sizing on mobile** — needs checking against a real
   deploy.
3. **App-like navigation** — bottom bar, sheet filters.

And the whole of Phase 1 is invisible to customers until item 1 in _Blocked on
you_ is cleared.
