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
  Still to write: garden furniture, outdoor kitchen, cold plunge, home wellness.
  Pergolas deliberately untouched.
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

          KK-CT-ABBERLEY-BRN-001
                                                                                                                                                                                         │  │        │   └── sequence, breaks ties
                                                                                                                                                                                         │  │        └────── colour, omitted when there isn't one
                                                                                                                                                                                         │  └─────────────── the range name
                                                                                                                                                                                         └────────────────── category

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

`src/lib/catalog/describe-long.ts` (+16 tests). Reproduces the Sorelle's actual
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
- [x] **Sampled every category before applying again** — instead of picking
      two products by hand, the fixed writer was run over one product from each
      of the 33 categories and its output fed through `context-check` and
      `wording-check`. **Only 4 of 33 came back clean.** That found six more
      faults, three in the writer and three in the detectors:

      - **"The The Rutland Collection Rectangular Dining table"** — the copy
                                prefixes "The" to a name that already begins with it. Ten Furniture
                                drafts read that way.
                              - **An outdoor sauna was told about "sightlines across the room"** —
                                `familyFor` sends it to the wellness writing family, and place was
                                being taken from family instead of siting. Siting now decides.
                              - **An indoor sauna was offered "Poolside areas"** — the wellness
                                settings list holds both indoor and outdoor entries. It is now filtered
                                by siting.
                              - "Allow clearance rather than fitting it wall to wall" on a garden
                                product — a room idiom. Now "boundary to boundary" outdoors.
                              - Detector: "cushions and throws" is not indoor language when they are
                                weatherproof.
                              - Detector: a black barbecue was reported as claiming to be brass, copper
                                and terracotta, because bulleted pairing items and glossary lines
                                ("Walnut — Darker and richer…") arrive at the checker stripped of the
                                "Pair it with:" heading above them.

                              After the fixes, **32 of 33 categories are clean**. The remaining one is a
                              pairing colour on a single bedside table.

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

- [x] Superseded by `scripts/finalise-descriptions.ts`, which does the cleaning
      and the rewriting in one pass.

### [~] Finalise: one standard, enforced by the code

Damien: _"literally just make every product description great and consistent
with 0 mistakes. this isnt too difficult"_.

Consistency and zero mistakes are things code can guarantee. "Great" is not,
because a page can only be as good as the facts behind it. So
`scripts/finalise-descriptions.ts` separates the two honestly.

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
