# Work plan — catalogue + mobile

Written 2026-08-06. Branch `claude/kaiku-home-continue-v94z7g`.
Every number here was measured, not estimated — the queries and browser probes
behind them are named so you can re-run any of it.

---

## 1. State of play

### The deployment is fixed in code

The broken Vercel deployment had one cause. A Sanity **API token had been pasted
into `NEXT_PUBLIC_SANITY_PROJECT_ID`**, so the client built its host as
`https://sk...180-chars.apicdn.sanity.io` — a name that does not exist in DNS.
Every query failed with `getaddrinfo ENOTFOUND`. `sanityFetch` is deliberately
fail-soft, so nothing threw: the build went green and baked the _empty_ state of
the site into all 55 pages. That is why it looked like a blank template while
`kaikuhome.com` (an older build, made when the variable was correct) looked fine.

`src/lib/sanity/config.ts` now shape-checks the project ID, dataset and API
version and substitutes a known-good default when a value cannot possibly be
right. Verified by running a full `next build` with the exact corrupted value
from the build log: **116 pages generated against the real dataset**, assets
resolving to `huh1e45n`, real CMS copy rendering instead of code fallbacks.

The real project ID is **`huh1e45n`** — 8 characters, note the `1`. The
7-character near-miss `huhe45n` returns `"Dataset not found for project ID"`,
which reads like a permissions problem and sends you looking in the wrong place.

### Two things only you can do

| #   | Action                                                                                   | Why it matters                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Revoke the leaked token** — Sanity → Manage → API → Tokens                             | It sat in a `NEXT_PUBLIC_` variable, so Next.js inlined it into the browser bundle and served it publicly. I confirmed no code change can hide it — that is what `NEXT_PUBLIC_` means. Revocation is the only fix. |
| 2   | Set `NEXT_PUBLIC_SANITY_PROJECT_ID` to `huh1e45n` in Vercel (Preview **and** Production) | The site works either way now, but this stops the fallback being load-bearing.                                                                                                                                     |

### Mistakes, and where each one stands

| Mistake                                                 | Status                                                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Told you to set the project ID to `huhe45n`             | **Corrected** — it is `huh1e45n`, verified against your live asset URLs and a tokenless query returning the real catalogue |
| Claimed the dataset was private                         | **Withdrawn** — it is public; a tokenless query returns 38 products                                                        |
| Claimed the write token belonged to a different project | **Withdrawn** — it works; the 401 was me hitting the typo'd host                                                           |
| Claimed the homepage `<h1>` had missing spaces          | **Withdrawn** — I had read `textContent`, which ignores `<br>`                                                             |
| Claimed mobile section padding bloated the page         | **Withdrawn** — base padding was already `py-10`; it is content volume                                                     |
| Claimed "Delivered in 4-6" was a CSS clipping bug       | **Withdrawn** — measured `scrollWidth == clientWidth`. It is a CMS data error (see §2)                                     |
| Claimed the three homepage proof tiles overflowed       | **Withdrawn** — I misread a 2× device-scale screenshot as CSS pixels                                                       |
| Broke desktop with homepage link padding                | **Reverted**, and every change since is behind `max-sm:`/`lg:hidden` with desktop measured before and after                |
| Broke three deploys by type-checking only `src/`        | **Fixed** — every commit now runs a full `next build`                                                                      |

### Shipped so far on this branch

`1e892ab` Sanity config guard · `43f1c73` mobile menu (painted 390×72 in an
844px viewport; now full-screen, scroll-locked, Escape-dismissible, with a
"Shop by room" section) · `a8559cb` scroller fades + touch targets (32×32 → 40×48,
28×28 → 44×44) · `f2ee578` product gallery arrows · `860bb8d` iOS input zoom on
all 11 routes + a build-time deprecation · `6037262` 9px tile labels ·
`dbcdfa4` `/shop/all` + 3-across mobile grid.

Desktop measured unchanged throughout: home 12958px, `/shop` 2496px,
`/shop/room/sauna` 2338px, `/shop/room/sauna/all` 1571px, product 5369px, and
`scrollWidth == clientWidth == 1440` on every one.

---

## 2. The catalogue problem, measured

```
38 products     price ✓ 38/38   gallery ✓ 38/38   specs ✓ 38/38   sku ✓ 38/38
                dimensions missing on 7      weight missing on 6
21 of 36 categories are EMPTY  (58%)
2 products have a malformed deliveryLeadTime
```

**The empty categories are the reason the site feels thin, not the product
count.** 21 of 36 categories have zero products, and they include headline
destinations that the nav and homepage point at — `Outdoor Living › Pergolas`,
`Outdoor Living › Fire Pits & Heating`, `Outdoor Living › Water Features`.

They split into two different problems, which need different fixes:

- **Structural duplication.** `Lighting` exists as a separate empty category
  under Bathroom, Bedroom, Kitchen, Living Room, Office _and_ as its own room.
  Six empty categories for one concept. Same shape for `Shelving`, `Storage`,
  `Mirrors`. These should be consolidated or cross-listed, not filled — no
  amount of importing fixes a taxonomy that subdivides faster than the
  catalogue can fill it.
- **Genuinely unstocked.** Pergolas, Fire Pits, Water Features, Privacy
  Screens, Towel Rails, Desks, Rugs. These need real products.

**The two malformed lead times** (both `"4-6"`, missing the unit, where all 36
others read `"X-Y weeks"`) are on `SaunaPlunge™ Pennine Barrel 6-Person Outdoor
Sauna` and `SaunaPlunge™ Yorkshire Cabin 2-Person Outdoor Infrared Sauna`. The
Pennine Barrel is the homepage hero, so "Delivered in 4-6" is currently the
most-read line of copy on the site. Two-field fix in the Studio.

---

## 3. The 4-hour plan

### Half A — products (2h)

**Blocker to clear first (5 min, needs you):** I have verified Sanity write
access, so I can create products. What I do not have is product data — there is
no supplier feed anywhere in the repo or container, and the Aosom importer was
removed by the branch reset. **Export your Aosom/AW product CSV from their trade
portal and drop it in the repo root.** Any column layout is fine; I resolve
headers rather than assuming positions.

|     | Task                                                                                                                                                                                                                      | Time | Depends on    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------- |
| A1  | Rebuild `scripts/import-aosom-products.ts` — curation-first, dry-run by default, refuses rows whose cell count ≠ header count (an unquoted `£1,299.99` silently shifted every column last time and imported an RRP of £1) | 30m  | —             |
| A2  | Curate against the 7 genuinely unstocked categories, prioritising Pergolas / Fire Pits / Water Features since the nav and homepage already point there                                                                    | 30m  | CSV           |
| A3  | Import as **drafts**, deterministic IDs (`product-aw-<code>`), no prices per your instruction — descriptions, specs, dimensions, weight, gallery                                                                          | 40m  | CSV           |
| A4  | Fill the 7 missing `dimensions` and 6 missing `weight` on existing products — these feed shipping cost, so they are wrong quotes, not cosmetic gaps                                                                       | 20m  | supplier data |

If the CSV does not arrive, A1 still lands and A2–A4 become a written curation
brief instead of an import. **I will not invent product data** — fabricated
dimensions become real mis-quoted carriage on a real order.

### Half B — everything else (2h)

Ordered by user-visible impact, all measured.

|     | Task                                                                                                                                                                                                                                                   | Time | Evidence         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ---------------- |
| B1  | Consolidate the duplicated empty categories (`Lighting` ×6, `Shelving`, `Storage`, `Mirrors`) — cross-list existing products via `additionalCategories` where a real product fits, and put a written recommendation to you for the rest                | 35m  | 21/36 empty      |
| B2  | Kill the duplicated room nav on mobile: `/shop/*` renders the site-header sub-bar **and** `ShopDrillNav`, two near-identical room rows stacked. Together with the promo banner they push the product grid ~630px down — most of a 390×844 first screen | 30m  | `all-mobile.png` |
| B3  | Fix the two `"4-6"` lead times, and add a Studio validation rule so a unitless value cannot be saved again                                                                                                                                             | 15m  | §2               |
| B4  | `/shop` soft-404: `collection-index.tsx:63` runs `if (roomSlug && !room) notFound()`, and `/shop` renders `<CollectionIndex roomSlug="outdoor-living" />` — so if that one department is ever renamed, a primary nav destination hard-404s             | 15m  | code read        |
| B5  | Duplicate nav entry: `src/config/site.ts` has both `{ Shop → /shop }` and `{ Collections → /shop }`, so two items match and both draw an active underline at once                                                                                      | 10m  | code read        |
| B6  | Bold the "Warranty & Returns" heading (asked three times, still not done)                                                                                                                                                                              | 5m   | —                |
| B7  | `AW-BTS-02` variant selector — should read "2 colours" and open on the original image                                                                                                                                                                  | 10m  | —                |

### Not in the plan, deliberately

**The mobile homepage is 14,017px — 17 screens, 20 sections.** Shortening it
means deciding what a mobile visitor does _not_ see, which is a merchandising
call, not a defect. Say the word and it becomes a 40-minute job; otherwise I
stay on defects.

---

## 4. How each item gets verified

Non-negotiable per commit, because a weaker check is what broke three deploys:

1. Full `next build` — never `tsc --noEmit` alone. `RouteContext` and the typed
   `<Link>` validator are **generated into `.next/types` by the build**, so
   `tsc` on its own both misses real errors and invents fake ones.
2. `vitest run` (19 passing).
3. `eslint` + `prettier --check`.
4. Browser measurement at **390×844 and 1440×900**, desktop body heights
   compared against the baselines in §1. Any mobile change is `max-sm:`,
   `sm:`-restored, or inside `lg:hidden`.
