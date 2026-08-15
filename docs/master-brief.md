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
| 2   | **Stripe live keys**              | The site is on `pk_test_`. No card can be charged. Conversion rate is exactly zero until this changes                                                                                                                                                                                                                             |
| 3   | **`RESEND_API_KEY`**              | A buyer pays and receives nothing. The confirmation email exists in code and cannot send                                                                                                                                                                                                                                          |
| 4   | **One real test order**           | Payment → webhook → order record → email has never run against a real card                                                                                                                                                                                                                                                        |
| 5   | **Rotate the Sanity write token** | The live token was pasted into this chat in plaintext. Treat it as compromised                                                                                                                                                                                                                                                    |
| 6   | **Companies House number**        | One field, and it unblocks two things. A UK limited company is required to publish it on its website, and it is what a wholesale platform checks against Companies House to decide Kaiku is a real retailer — the likeliest reason the trade applications get silence. Set `companyDetails.companyNumber` in `src/config/site.ts` |

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
- [!] **Publish the 15 drafts** — listed in the audit. Left for you on purpose: a
  draft can carry half-finished text changes alongside the image change.
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
- [!] **11 categories genuinely need stock** and cannot be filled from the
  catalogue, because nothing in it is one of these things: bathroom-accessories,
  bathroom-lighting, fire-pits, garden-lighting, kitchen-furniture,
  kitchen-lighting, privacy-screens, rugs, towel-rails, water-features — plus
  pergolas, untouched by instruction.
- [ ] **Category page value** — listings plus SEO content, filters, buying
      guides, FAQs, related categories.

---

## Part 5 — Product pages and conversion

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

- [ ] **Checkout audit** — add to basket, basket, checkout, payment,
      confirmation, customer emails.
- [!] **Stripe** — live payments, payment methods, checkout flow, order
  confirmation, failed payment handling, receipts. Blocked on live keys.
- [!] **Full test order before launch.**
- [~] **Customer accounts** — create, view orders, save details, track
  purchases. Pages exist; needs an audit.
- [~] **Email system** — welcome, order confirmation, payment confirmation,
  shipping update, delivery notification, abandoned basket, account
  creation, follow-up. Order confirmation and owner alert are wired into the
  Stripe webhook; the rest are not built. All blocked on `RESEND_API_KEY`.
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
