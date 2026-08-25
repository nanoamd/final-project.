# Remediation plan — every open finding

**8,118 findings across 1,645 products.** Every one is itemised in
`docs/change-log/remediation-items.csv` — one row per finding, with the product,
the fault, and how it gets closed. This document is the summary of that file.

Regenerate at any time:

```
pnpm tsx --env-file=.env.local scripts/remediation-plan.ts
```

## Why the number moved from 10,508

10,508 was correct when measured at 23:10 on 20 August. **1,379 products were
edited between 23:00 and 01:13**, all of them gaining a description and a meta
title, which closed roughly 2,200 findings.

A further 152 were mine: my repeated-word and doubled-space checks matched
_across_ block boundaries, so a heading "Care and Cleaning" followed by the
paragraph "Cleaning the vase is simple" was counted as a repeated word. It is
not — that is two blocks. Fixed, with tests, and removed from the count. I would
rather hand over a smaller true number than a larger flattering one.

## The split that decides the plan

| Route            | Findings |     | What it means                                      |
| ---------------- | -------: | --: | -------------------------------------------------- |
| **AUTOMATIC**    |    2,943 | 36% | A script closes it. No judgement, no missing data. |
| **NEEDS DATA**   |    2,826 | 35% | Blocked on a fact only the supplier holds.         |
| **NEEDS DAMIEN** |    1,187 | 15% | A decision that is yours — almost all of it price. |
| **WRITING**      |    1,162 | 14% | Nothing blocks it; it is simply work.              |

By severity: **1,220 blockers · 5,349 major · 1,549 minor.** Only 9 of the
blockers are automatic — blockers are mostly missing prices and missing data.

By state: **722 published · 7,396 draft.** The published catalogue is in far
better shape than the raw total suggests.

---

## 1. AUTOMATIC — 2,943 findings

Everything here is written, tested and waiting on one command.

| Count | Finding                                       | Closed by                        |
| ----: | --------------------------------------------- | -------------------------------- |
| 1,425 | Title does not end with `\| Kaiku`            | `fix-catalogue-tier1.ts --apply` |
| 1,229 | FAQs that answer nothing                      | `fix-catalogue-tier1.ts --apply` |
|   147 | SKU not in the house format                   | `assign-skus.ts --apply`         |
|    42 | Supplier name or link in customer-facing copy | `fix-catalogue-tier1.ts --apply` |
|    51 | Missing or over-long meta title/description   | `rewrite-meta.ts --apply`        |
|    10 | Doubled spacing inside a sentence             | Tier 1 text-artefact pass        |
|     7 | HTML entity showing as literal text           | Tier 1 text-artefact pass        |
|     6 | **Raw template syntax visible on the page**   | Tier 1, then re-check by hand    |
|     3 | Markdown markup left in the text              | Tier 1 text-artefact pass        |
|     3 | Publishes an internal value threshold         | `fix-catalogue-tier1.ts --apply` |

**To close all 2,943:**

```
pnpm tsx --env-file=.env.local scripts/fix-catalogue-tier1.ts --apply
pnpm tsx --env-file=.env.local scripts/assign-skus.ts --apply
pnpm tsx --env-file=.env.local scripts/rewrite-meta.ts --apply
```

Each is dry-run by default and writes a dated change log first.

---

## 2. NEEDS DATA — 2,826 findings

**These cannot be closed by writing. The facts do not exist in our system and
must not be invented** — inventing one is precisely the failure this audit was
called to fix.

| Count | Finding                               | Source                                  |
| ----: | ------------------------------------- | --------------------------------------- |
|   976 | Copy admits it doesn't know something | The product's own `sourceUrl`           |
|   823 | No cost price                         | Supplier trade price file — §B          |
|   769 | No weight                             | Supplier spec sheet — §E                |
|   131 | Only one image, or none               | Supplier image pack — §E                |
|    51 | No dimensions                         | Supplier spec sheet or `sourceUrl` — §E |
|    48 | No supplier SKU                       | Supplier product file — §E              |
|    25 | No carriage cost                      | Supplier carriage terms — §A            |

Section references are to `docs/external-data-requirements.md`.

**The good news:** every product has a `sourceUrl`, so the 976 "admits it
doesn't know" findings and most of the dimensions are recoverable by reading the
supplier's own page for that product — no supplier email required. That is the
single largest recoverable block in the whole plan.

The rest is genuinely gated on the five supplier emails, of which **three
suppliers still have no address on record**.

---

## 3. NEEDS DAMIEN — 1,187 findings

| Count | Finding                                          |
| ----: | ------------------------------------------------ |
| 1,157 | No retail price                                  |
|    15 | **Loss-making** — sells below cost plus carriage |
|    10 | No supplier assigned                             |
|     5 | Margin under 10%                                 |

Prices are yours. Nothing here will be imported, derived or guessed — that is a
standing constraint and it is not being bent for a deadline.

The 1,157 are almost entirely the Premier Housewares drafts. The **15
loss-making products matter far more than the 1,157**, because those are live
and each sale loses money.

---

## 4. WRITING — 1,162 findings

Nothing blocks these. They are the Tier 2 rewrite you approved.

| Count | Finding                                                          |
| ----: | ---------------------------------------------------------------- |
|   201 | Only one concrete fact in the whole description                  |
|    93 | Length standing in for substance                                 |
|    78 | Quotes "the supplier" instead of stating the fact as Kaiku's own |
|    58 | Over-long, or sentences too uniform to read as human             |
|    16 | Every heading is a generic template heading                      |
|    26 | No description or no summary at all                              |
|  ~690 | Filler phrases, in varying combinations                          |

Target: **350–650 words, facts first.** Most of these get _shorter_.

---

## Order of work

1. **Run the three automatic scripts.** 2,943 findings, minutes of runtime,
   every change logged and reversible. **36% of the total.**
2. **Fix the 15 loss-making products.** Smallest count, most direct cost.
3. **Harvest from `sourceUrl`.** Recovers ~1,000 of the NEEDS DATA findings
   without waiting on any supplier.
4. **Send the five supplier emails.** Unblocks the remaining ~1,800.
5. **Tier 2 rewrite**, worst first, off `/admin/products`.
6. **Prices**, at whatever pace suits you.

## What "all 8,118 rectified" honestly requires

Steps 1, 2, 3 and 5 are mine and I will carry them. **Steps 4 and 6 are not
mine** — I cannot write a supplier's weight into our database without the
supplier, and I will not set your retail prices.

So the honest ceiling on what I can close alone is roughly **5,100 of 8,118
(63%)**. Everything else needs either an email answered or a price decision.
Saying otherwise would mean inventing data, which is the one thing this whole
audit exists to stop.
