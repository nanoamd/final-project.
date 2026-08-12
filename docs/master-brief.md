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

| #   | Item                               | Why it blocks everything                                                                                                                                        |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **Send me the Vercel build error** | `main` is now correct and CI is green, but every Vercel deploy has errored since 15 July, so the live site is still an old build. One log removes all guesswork |
| 1   | ~~Merge the branch to `main`~~     | **Done 12 August.** `main` was at 17 July; it is now at the current work. See the note below                                                                    |
| 2   | **Stripe live keys**               | The site is on `pk_test_`. No card can be charged. Conversion rate is exactly zero until this changes                                                           |
| 3   | **`RESEND_API_KEY`**               | A buyer pays and receives nothing. The confirmation email exists in code and cannot send                                                                        |
| 4   | **One real test order**            | Payment → webhook → order record → email has never run against a real card                                                                                      |
| 5   | **Rotate the Sanity write token**  | The live token was pasted into this chat in plaintext. Treat it as compromised                                                                                  |

See `docs/first-sale-plan.md` for what these gate.

### The deploy, and what was actually wrong with it

`main` and the working branch had **no merge base**. `main` ended 17 July 2026;
this line of work begins 26 July. The two are chronologically continuous but git
had them recorded as unrelated histories — almost certainly a fresh clone rather
than a branch off `main`. That is why "the changes haven't taken effect on the
domain": there was no route from the work to the branch Vercel builds.

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

### Vercel: still not deploying, and this needs your eyes

Every Vercel deployment has errored since 15 July, so the live site is the last
build that succeeded before that. `main` is now correct and CI is green, but a
green CI does not prove Vercel will build — **CI runs with
`SKIP_ENV_VALIDATION=true` and Vercel does not.**

The most likely cause is a missing required environment variable in the Vercel
project. These eight are mandatory and a build dies without any one of them:

`SUPABASE_SERVICE_ROLE_KEY` · `SANITY_API_READ_TOKEN` · `STRIPE_SECRET_KEY` ·
`STRIPE_WEBHOOK_SECRET` · `NEXT_PUBLIC_SITE_URL` · `NEXT_PUBLIC_SUPABASE_URL` ·
`NEXT_PUBLIC_SUPABASE_ANON_KEY` · `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Reproduced locally: drop any one and `next build` fails with
`Failed to collect page data for /_not-found`. With fix 4 above, the Vercel log
will now name the variable instead of printing seven anonymous type errors.

**What to do:** open the newest failed deployment in Vercel, and send the build
log — or just the error lines. That removes the guesswork entirely. Do **not**
mark any `NEXT_PUBLIC_` variable as Sensitive; that took the site down once
before.

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
- [x] **Image quality audited** — median 2000px, but a bad tail: 9 unusable
      (under 700px), 25 soft (under 1200px), listed in the audit.
- [x] **Alt text on every image** — 178 of 439 to 439 of 439
      (`scripts/derive-image-alt.ts`), built only from facts the document can
      prove. Editor-written text is never overwritten.
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
- [ ] **RETURNS heading present, bold and consistent on every product page.**
- [ ] **Large furniture delivery disclaimer** — doorstep delivery, white glove
      not included unless arranged, positioned as the transparency that funds
      the pricing.

### FAQ system

- [~] **Unique FAQs per product, no duplicated answers.** Validator enforces it;
  applied to the products rewritten so far.

### Tag system

- [~] **Material, colour, style, room, product type.** Derivation engine written
  (`scripts/lib/product-tags.ts`, 1,159 lines, evidence-carrying and
  veto-based); canonical vocabulary now shared
  (`src/lib/catalog/facets.ts`). Not yet dry-run, applied, or wired to
  filters.

### Price, stock and delivery

- [ ] **Price audit.** Report only — no automatic price reductions.
- [ ] **Stock audit**, especially furniture colour variants.
- [ ] **Live stock tracking plan** (Supabase).
- [ ] **Delivery lead-time distribution report** — how many products sit on each
      timeframe, to find inconsistent promises.
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

- [ ] Every category page needs: SEO introduction, buying guidance, FAQs,
      internal links, related categories, product explanations. **No empty
      product grids.**
- [ ] Worked examples: Outdoor Furniture (materials, weather resistance,
      maintenance, styling); Coffee Tables (size guide, materials, styling, room
      suitability).

### Product page SEO

- [~] Unique title, description, FAQs, alt text, metadata per product; no
  duplicated supplier wording.
- [x] **Meta title strategy** — brand + product + intent, e.g. "Hampton Ivory
      Console Table | Luxury Shagreen Hall Furniture | Kaiku". Already the
      pattern; names are not to be changed.
- [ ] **Meta description strategy** — benefit, material, style, intent. Audit
      outstanding.

### URLs, images, linking

- [ ] **Slug audit** — short, descriptive, keyword-relevant, no filler.
- [~] **Image SEO** — alt text now on all 439 images. Filenames: only 4 of 439
  are undescriptive (`image-6.png`, `6.jpg.webp`, `7.jpg.webp`,
  `19.jpg.webp`), so this is much smaller than it looked.
- [ ] **Internal linking system** — every product links to related products,
      category pages, buying guides, room inspiration.

### Content plan

- [ ] **SEO content calendar** across Outdoor Living, Wellness and Furniture.
- [ ] **Blog strategy** — every article carries a target keyword, search intent,
      products to link, related categories, an FAQ section.
- [ ] **Buying guides** — sofa, coffee table sizing, furniture materials, garden
      furniture, outdoor kitchen, pergola, sauna, cold plunge, home wellness.
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
- [ ] **Technical SEO audit** — page speed, mobile performance, Core Web Vitals,
      sitemap, robots.txt, canonicals, duplicate pages, broken links,
      redirects.
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
- [ ] **Filtering and sorting** on the white shopping pages. In progress.
- [ ] **Colour filters as visual circles** — White, Black, Oak, Walnut, Grey,
      Green, Natural, Brown.
- [ ] **Variant filtering** — selecting "black furniture" shows the black
      version's image, not the default.
- [ ] **Category page value** — listings plus SEO content, filters, buying
      guides, FAQs, related categories.

---

## Part 5 — Product pages and conversion

- [~] **Consistent premium structure**, all 14 sections in order.
- [~] **Every description unique**; explains what makes it different, design
  characteristics, materials, practical benefits, suitable rooms, styling,
  customer considerations.
- [ ] **Empty side panel fix** — decorative line artwork, architectural
      patterns, organic shapes, botanical line drawings, minimal luxury
      illustration. Not product images. Varied by department: wood-grain lines
      for furniture, water patterns for wellness, garden linework for outdoor.
- [x] **Section formatting** — rules between sections, proper spacing, premium
      typography, no large blocks of text, scannable.
- [ ] **RETURNS** heading — bold, consistent, clearly visible, on every page.
- [~] **Delivery information** — lead time, availability, delivery method,
  matching the supplier.
- [ ] **Delivery lead time report.**
- [ ] **Large furniture disclaimer.**
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
- [ ] **Analytics** — visitors, sources, product views, category views, search
      usage, add to basket, checkout starts, purchases, quote requests, email
      signups.
- [ ] **Conversion tracking** — which products get attention, which categories
      perform, where users leave, which pages convert, which SEO pages bring
      customers.
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
