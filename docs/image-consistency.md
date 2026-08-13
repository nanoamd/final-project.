# One white, and a shadow on the floor

13 August 2026. Damien, pointing at the reclaimed teak dining table: _"is it
possible to make all images look like this? i like the shadow on the floor"_.

Reproduce every figure here with
`pnpm tsx --env-file=.env.local scripts/ground-product-images.ts`.

---

## What the inconsistency actually is

Twelve first-gallery images side by side, one supplier each, is enough to see it.
The catalogue has four looks in it:

| Look                               | Example                                                |
| ---------------------------------- | ------------------------------------------------------ |
| Pure white, soft floor shadow      | Reclaimed teak dining table, the beer barrel           |
| Pure white, **nothing underneath** | Neatham end table, storage crates, Alton chest         |
| A **grey sweep** instead of white  | Large Ribbed Gesso Table Lamp, on `rgb(247, 247, 247)` |
| Photographed in a room             | Zephra armchair, Serene rattan table                   |

The second and third are the problem. A product floating with no shadow next to
one that is grounded reads as a cheaper image, and a grey backdrop next to a white
one reads as a dirty image rather than a decision — most visibly in a category
grid, which is where every shopper meets the catalogue first.

## The numbers, across all 99 published lead images

| Verdict            | Count | What happens                                              |
| ------------------ | ----- | --------------------------------------------------------- |
| `grounded`         | 60    | A contact shadow is synthesised; some also regraded       |
| `already-grounded` | 31    | Shadow already there — left alone                         |
| `room`             | 4     | Photographed in a setting — never touched                 |
| `regraded`         | 2     | Backdrop taken to white, shadow already present           |
| `wall-mounted`     | 2     | Both Hampton mirrors. Hangs on a wall, so no floor shadow |

So **62 of 99 lead images can be made to match**, and 37 are already right or must
be left alone.

## How the shadow is made

Full reasoning in `scripts/lib/product-shadow.ts`. In short: the object's own
silhouette drives it, and two terms decide how dark the shadow is under any given
column of the image.

- **Contact** — how close that column's lowest pixel is to the floor line. A table
  leg reaches the floor and grounds hard; the span of a tabletop between two legs
  has its lowest pixel a long way up, so it only hazes.
- **Occupancy** — how much of the column is object at all, so a solid chest grounds
  more heavily than a wire leg.

That combination is what stops it looking like a grey smear under a rectangle. A
four-legged table gets four dark feet with a light haze between them, which is what
the reference photograph actually looks like.

The white point is separate and simpler: the sweep's own colour is measured and the
image is scaled per channel so the sweep becomes white. The gain is capped at 1.14.
Anything needing more than that is not a paper tint — it is an underexposed
photograph or a measurement of something that was never a sweep — and the image is
left alone.

## What it refuses to do

- **Room photography.** A pack shot and a lifestyle shot are different jobs. The
  room photo is the hover image and earns its place by showing scale and styling.
- **Anything already grounded.** A second shadow means two light sources, and the
  eye catches that instantly.
- **Anything that hangs on a wall.** A floor shadow under a mirror is a lie about
  the object.
- **Touch the product's pixels.** The shadow layer is multiplied by the inverse of
  the subject mask before it is applied, so it stops at the silhouette. A
  segmentation error can lighten or darken backdrop; it cannot smear grey across a
  £1,190 chest of drawers. That is the reason this is safe to run at all.

## Not uploaded

The script writes PNGs and before/after contact sheets to `.image-work/` and writes
nothing to Sanity. Replacing supplier photography across a live catalogue on my own
assessment of my own output is not a call to make alone — and when it is made, the
originals stay in the dataset, because the new file is uploaded as a new asset
rather than overwriting anything.

## What this does not fix

Two image problems sit underneath this one and neither is a processing job:

1. **Two Hampton images are 146×146 pixels** re-uploaded from a Sanity thumbnail.
   No amount of processing recovers detail that is gone; they need re-downloading
   from D.I. Designs. See `docs/image-audit.md`.
2. **A dimensions diagram is the lead image** on the Abberley Coffee Table. A
   spec drawing is a useful third image and a poor first one.
