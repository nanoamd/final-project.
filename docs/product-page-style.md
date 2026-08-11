# Product page copy — house rules

Every product page is rewritten against this. It exists because the first pass was
generated from a template: the same six phrases on forty products, the same four
FAQs, trade language aimed at hotel buyers, and citations to other retailers left
in the text. Enforced by `scripts/lib/product-copy.ts`, which fails rather than
warns.

## The shape of a page

Copy is authored as one JSON file per product under `product-copy/`, matching the
`ProductCopy` interface. `scripts/apply-product-copy.ts` validates the whole set
and writes it.

```json
{
  "productId": "product-di-abberley-white-chest",
  "title": "Abberley White Chest of Drawers",
  "summary": "One or two sentences. Stands alone — Google reads this one.",
  "tagline": "Optional. One line, under twelve words.",
  "sections": [
    {
      "heading": "Every section is titled",
      "paragraphs": ["Two or three sentences each."],
      "bullets": ["Short", "Concrete", "No full stops"]
    }
  ],
  "faqs": [{ "question": "…?", "answer": "…" }],
  "specs": [{ "label": "Dimensions", "value": "W80 × D40 × H75cm" }],
  "highlights": ["Six at most — these show beside the price"]
}
```

Three sections minimum, five or six is usually right. Four FAQs minimum.

## Voice

Write like one person who knows the piece describing it to one person deciding
whether to buy it. British spelling. Confident, specific, unhurried.

The test for any sentence: **could it appear on a different product?** If yes,
it is not doing any work. "Handcrafted from solid oak with a hand-applied finish"
is true of thirty of ours. "The fluting is turned, not applied, so the grain runs
unbroken around the column" is true of one.

## Banned outright

The validator rejects these. Not stylistic preferences — each one appeared on
dozens of pages at once.

| Banned                                                             | Because                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| luxury homes, boutique hotels, interior designers                  | Trade language. Write for one household                             |
| commercial interiors, property developers, show homes, hospitality | Same                                                                |
| timeless craftsmanship, premium materials, contemporary elegance   | Says nothing. Name the material                                     |
| effortlessly, elevate, focal point, stunning, exquisite            | Adjectives doing a noun's job                                       |
| perfect for, more than just, whether you're, not only … but also   | Constructions that read as generated                                |
| stand the test of time                                             | Say what makes it durable                                           |
| D.I. Designs, and every other retailer's name                      | Trade-only supplier. Naming them tells a shopper where else to look |

"Timeless" appeared 227 times across 69 products; "boutique hotel" 122 times
across 36. That is the scale of the problem being fixed.

## Never invent a fact

Every dimension, material, colour, finish, drawer count, weight and assembly note
comes from the supplier's own page, saved under `supplier-pages/di-designs/`. Read
the HTML for the product being written.

If a fact is not on the supplier page, it does not go on ours. Two live pages
previously carried "Please use the dimensions listed on the official D.I. Designs
product page for this item" — a note to ourselves standing in for a spec nobody
had checked. Leave the field out instead.

**Lead times are never changed.** Whatever is stored on the product is correct.

## FAQs

Four minimum, and every question unique across the whole catalogue — the validator
checks against every other product, so a question that could be asked of anything
will be rejected. That is deliberate: a question worth answering is specific enough
that it could only be asked of this piece.

Write what someone would actually type before spending the money. By category:

- **Sofas** — is the fabric stain resistant, are the cushions removable, is the
  seat firm or soft, will it fit through a standard doorway
- **Mirrors** — can it hang both ways, what fixings are needed, is it safe above a
  fireplace, how heavy is it
- **Tables** — how many does it seat, is the finish heat resistant, does it need
  assembly, will it mark
- **Lighting** — what bulb, is the bulb included, is it dimmable, what is the cable
  length
- **Storage** — are the drawers soft close, does it arrive built, what weight will
  a shelf take, are the runners metal

Answer plainly and admit limits. "Use a mat — the finish is lacquered but not
heatproof" earns more trust than "yes, it is heat resistant".

## Delivery

Free UK mainland delivery, included in the price. **State this product's own lead
time inside the paragraph** rather than leaving it to the field beside it — a
shopper reading the delivery section should not have to look elsewhere for when it
arrives.

Do not restate the courier bands on every product. One paragraph, then the link to
the full policy, which the page already renders.

## Warranty

Two sentences. Where there is no manufacturer's warranty, say so and state the
statutory position once: goods must be as described, of satisfactory quality and
fit for purpose under the Consumer Rights Act 2015. Do not repeat the long
paragraph that is currently on every product.

## Do not duplicate the page's own furniture

The page already renders Specifications, Delivery & Returns and FAQs as their own
tabs, from their own fields. A description that also contains "Specifications",
"Delivery & Returns", "Warranty" or "FAQs" headings shows the same text twice. Put
specs in `specs`, delivery in `deliveryNotes`, questions in `faqs` — and write the
description as description.

## Structure notes

- Headings in sentence case, consistently within a document.
- Bullets are rendered as green ticks: short, concrete, no trailing full stops.
- No `h1` in a description. The page template emits the page's only `h1`.
- No links in description copy. The renderer strips them.
