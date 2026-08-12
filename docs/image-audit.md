# Image system audit

12 August 2026. Phase 1 item 3 — "image publishing issues". 439 images across 92
published products, 862 assets in the dataset, 120.6MB of originals.

Reproduce any figure here with `pnpm tsx --env-file=.env.local scripts/audit-images.ts`.

---

## The headline: "higher-quality images don't publish" has three separate causes

They needed telling apart, because the fix for each is different and two of them
are not code problems at all.

### Cause 1 — some images were re-uploaded from a Sanity thumbnail, not the source

Six images carry filenames in Sanity's own naming convention — a 40-character
hash followed by the dimensions:

| Product                              | Filename says     | Actually is | Size  |
| ------------------------------------ | ----------------- | ----------- | ----- |
| Hampton Ivory Square Bedside Table   | `…-2000x2000.jpg` | **146×146** | 2kB   |
| Hampton Ivory Square Bedside Table   | `…-2000x2000.jpg` | **146×146** | 2kB   |
| SaunaPlunge Pennine Barrel 6-Person  | `…-1000x1000.png` | 1000×1000   | 635kB |
| SaunaPlunge Yorkshire Cabin 4-Person | `…-1000x1000.png` | 1000×1000   | 689kB |

A file named `<hash>-2000x2000.jpg` came **out of** Sanity. It has been
downloaded from the CDN and re-uploaded — and in the Hampton case, downloaded at
a thumbnail size, so a 146-pixel image is now the source of truth for a £400
bedside table. No amount of re-publishing improves it: the original is gone.

**Fix: Damien, not code.** Those two Hampton images need re-downloading from
D.I. Designs and re-uploading. And the general rule: never save an image off
kaikuhome.com to re-upload it — always go back to the supplier's page.

### Cause 2 — fifteen products have image changes sitting unpublished in a draft

The site reads published documents only. A draft can be saved any number of
times and will never appear.

This is exactly what "I changed it and it reverted after deployment" looks like
from the outside: the draft shows the new image in Studio, the live site shows
the old one, and a deploy makes no difference because the deploy was never the
problem.

Affected, with the counts as they stand:

| Product                                    | Draft | Published |
| ------------------------------------------ | ----- | --------- |
| Hampton Ivory Round Bedside Table          | 6     | 4         |
| Reclaimed Teak Sideboard Console Table     | 2     | 2         |
| Reclaimed Teak Dining Table 180cm          | 2     | 2         |
| Small Reclaimed Teak Coffee Table          | 2     | 2         |
| Tall Reclaimed Teak Chest of 5 Drawers     | 2     | 2         |
| Large Reclaimed Wood TV Stand              | 3     | 3         |
| Bedside Table – Classic – Recycled Wood    | 2     | 2         |
| Large Reclaimed Wood Coffee Table          | 2     | 2         |
| Beer Barrel Table – Natural Wood           | 5     | 5         |
| Himalayan Salt BBQ Cooking Plate           | 4     | 4         |
| Eucalyptus Essential Oil 10ml              | 3     | 3         |
| Large Brown Wooden Storage Tub             | 3     | 3         |
| Natural Teak Corner Shelf Unit 90cm        | 3     | 3         |
| Abberley Coffee Table in Brown             | 5     | 5         |
| Pershore Rectangular Aged Oak Coffee Table | 5     | 5         |

Equal counts with different assets means the images were **swapped**, not added.
The Hampton Round has two extra photographs stranded in a draft.

**Fix: Damien, not code.** Open each in Studio and press Publish. I have
deliberately not published them for you: a draft can carry half-finished text
changes alongside the image change, and publishing it would push those live too.

### Cause 3 — nine images are genuinely too small, and 25 more are soft

Resolution of the originals: smallest 146px, median 2000px, 90th percentile
2176px, largest 4000px. So the catalogue is mostly fine, with a bad tail.

Unusable (under 700px on the long edge):

| Size    | Product                                 |
| ------- | --------------------------------------- |
| 146×146 | Hampton Ivory Square Bedside Table (×2) |
| 330×330 | Bedside Table – Classic – Recycled Wood |
| 330×330 | Large Reclaimed Wood Coffee Table       |
| 330×330 | Tall Reclaimed Teak Chest of 5 Drawers  |
| 600×600 | Tamarind & Resin Coffee Table – Aqua    |
| 616×616 | Beer Barrel Table (×2, shared asset)    |
| 617×617 | Crofton White Marble Coffee Table       |

Soft (700–1200px) is dominated by the Aosom-sourced solar lighting and BBQ
products, all at 800×800, and the two SaunaPlunge PNGs at 1000×1000.

**What this does not show.** Nothing in the pipeline degrades images. Images are
served from the original asset URL and optimised by Next.js at render time;
there is no width cap in the projection and no quality setting throwing detail
away. Where an image looks soft on the site, the file in Sanity is soft.

---

## Fixed in this pass

### Image ordering, automated — 353 images flagged, 35 galleries reordered

`isStudioShot` was set on **0 of 439 images**. That flag is what the card-hover
swap reads, so no product card on the site had ever swapped anything on hover:
the code looked for a flagged image, found none, rendered nothing.

`scripts/derive-studio-shots.ts` now decides it from the thumbnail Sanity stores
on every asset — no downloads, no CDN transforms. It measures the share of each
image's border that is both near-white and near-neutral: a product on a seamless
sweep has most of its frame edge in white, a photograph taken in a room has
almost none. Result: 353 catalogue shots, 75 setting photographs, 11 it declined
to call.

35 galleries were led by a room photograph and now lead with the catalogue shot —
most of the reclaimed teak range among them.

The hover image is now derived the other way round: the first image that is _not_
a catalogue shot, falling back to the second image so the 57 products
photographed only on white still reveal another angle.

### Alt text — 178 of 439, now 439 of 439

`scripts/derive-image-alt.ts`. Built from four facts the document can prove: the
product's name with the keyword tail stripped, the variant from `optionValue`,
whether the photo is on a sweep, and what kind of setting the department implies.

Nothing about colour, styling or mood, because the document does not know those
about a specific photograph — and wrong alt text is worse than none, since a
blind visitor has no way to tell they have been misled. Lighting products get
"in a styled setting" rather than a guessed room for exactly that reason.

Editor-written alt text is never overwritten.

---

## Still open

### Four assets are shared between two products each

Replacing the image on one silently changes the other.

- Beer Barrel Table ↔ Natural Wooden Beer Barrel Storage Stool
- SaunaPlunge Bronte 2-Person ↔ Bronte 6-Person (two assets)
- SaunaPlunge Dales Glow 4-Person ↔ Yorkshire Cabin 2-Person

The sauna pairs are the concerning ones: a 2-person and a 6-person cabin
photographed identically is a customer expectation problem as much as a data one.

### One image is the wrong shape for the grid

SaunaPlunge Peak Plunge Ice Bath at 3000×1382 — the square crop on the shop grid
cuts most of it away.

### Four filenames are undescriptive

`image-6.png`, `6.jpg.webp`, `7.jpg.webp`, `19.jpg.webp`. Sanity serves the
original filename in the CDN path, so these are a small image-SEO loss. Worth
fixing when those products are next touched, not worth a pass of its own.

### One product has a single photograph

No hover shot is possible for it.
