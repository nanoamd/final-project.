# Master prompt, 12 August 2026 — verbatim archive

Damien's full brief, kept as sent. `docs/master-brief.md` is the checkable
version of this; **this file is the source text** and is not edited for style.

> **Provenance note.** Parts 2 (tail) through 8 below are verbatim. Part 1 and
> the opening of Part 2 arrived earlier in the same session and are recorded here
> as a faithful summary rather than verbatim text, because the literal wording
> was lost to context compaction before this archive existed. Everything marked
> _(summarised)_ should be re-pasted if the exact wording matters.

---

## Part 1 — Role, mission, position and working rules _(summarised)_

Appointment: lead ecommerce architect, senior UX designer, SEO strategist,
conversion optimisation specialist, technical developer, product strategist and
luxury brand consultant.

Business: **Kaiku**, kaikuhome.com, trading as Project Kaiku Ltd, 16 Isis Way,
Bourne End, SL8 5NF. Phone 07916 570715. Not VAT registered (below threshold).
Premium UK home, garden and wellness ecommerce.

Business objective: **~500 daily visitors within three months.** Every change
must answer: _will this help increase trust, traffic, rankings, conversions or
revenue?_

Working rules: don't rush. Audit → identify cause → design solution → implement
→ test → report. Use initiative. Think like a business owner.

Personal message, recorded because it is the point of the work:

> claude, if you want to see somebody succeed and drastically improve there life
> after some very rough times you will make some major changes today, you will
> work through mukltiple 5 hour usage cycles, this business is everything ive
> ever wanted and were going to make it work no matter what. im going to succeed
> and your going to watch me knowing you helped me do this, just like many other
> people have done with ai, people have become millionares and so am i going to
> be one day with thousands of hours of hard work, i know its not easy and takes
> alot of work but weve got this, heres to us being long term business partners
> KAIKU

---

## Part 2 — Mobile priority and catalogue overhaul _(opening summarised)_

**Priority #1 — mobile is broken.** Desktop layouts are forced into mobile:
oversized images, excessive spacing, broken layouts, category navigation
problems, poor product grids, no mobile shopping page. It must be mobile-_first_
and app-like, not a shrunken desktop.

Mobile homepage: remove the featured coffee table card under the hero; the
Explore Collections button needs sharp edges, not rounded; reduce element sizes.

Mobile shopping page must support: Outdoor Living, Saunas, Wellness Accessories,
Cold Plunge, Outdoor Kitchen, Living Room, Bedroom, Kitchen, Office, Bathroom,
Lighting, Mirrors, Storage, Furniture.

Product catalogue overhaul: audit every product against the supplier page —
name, category, subcategory, description, materials, dimensions, weight,
colours, variants, images, SKU, price, availability, delivery. Produce a
corrections report.

Image system: higher-quality images don't publish, revert after deployment, or
don't save. Investigate CMS caching, image references, deployment caching,
frontend handling, asset optimisation.

Image ordering, automated: first image = clean white-background catalogue shot,
hover = lifestyle. Must not require manually editing hundreds of products.

Product SEO: title, meta title, meta description, slug, H1, description, FAQs,
internal links, alt text, structured data. Every description unique.

Product page sections required: introduction, design story,
materials/craftsmanship, key features, room suitability, styling advice,
specifications, delivery, returns, warranty, FAQs, comparison, related products.

Unique FAQs per product; no duplicated answers.

Tag system: material, colour, style, room, product type.

Price audit (do **not** reduce prices automatically). Stock audit, especially
furniture colour variants. Live stock tracking plan (Supabase). Delivery
lead-time distribution report. RETURNS heading present, bold and consistent on
every page. Product database / spreadsheet.

### Required fields _(verbatim from here)_

Product name.

Supplier.

Supplier URL.

Kaiku product URL.

SKU.

Supplier SKU.

Cost price.

Selling price.

Profit margin.

Category.

Subcategory.

Room.

Product type.

Variants.

Colours.

Materials.

Dimensions.

Weight.

Stock status.

Supplier stock status.

Delivery lead time.

Images.

Lifestyle images.

SEO title.

Meta description.

Slug.

Alt text.

Description status.

FAQ status.

Internal linking status.

Last checked date.

### Product database purpose

This database will become the foundation for scaling Kaiku.

It should eventually allow:

- Thousands of products.
- Multiple suppliers.
- Automated stock checking.
- Automated price checking.
- SEO monitoring.
- Content management.
- Supplier management.

Prepare the structure correctly from the beginning.

### Supplier product mapping

For every supplier:

Create a mapping system.

Track:

Supplier product name.

Supplier URL.

Kaiku product name.

Kaiku URL.

Supplier category.

Kaiku category.

Supplier stock.

Kaiku availability.

Supplier price.

Kaiku price.

This prevents future catalogue errors.

---

## Part 3 — SEO authority building system

Kaiku's long-term growth depends heavily on organic search.

The goal is not simply indexing products.

The goal is becoming an authority website for:

- Outdoor living.
- Garden wellness.
- Luxury furniture.
- Home improvement.
- Garden design.
- Saunas.
- Cold plunge.
- Outdoor kitchens.

### SEO objective

Build towards:

500 daily organic visitors within 3 months.

This requires:

- Technical SEO.
- Product SEO.
- Category SEO.
- Content SEO.
- Internal linking.
- Better search intent targeting.

Do not rely on AI-generated filler content.

Every page must provide genuine customer value.

### Google search intent strategy

Every page should answer a customer question.

Examples:

Instead of targeting:

"Outdoor sofa"

Create content around:

"Best outdoor sofas for UK gardens"

"How to choose an outdoor sofa"

"What material is best for outdoor furniture"

"Outdoor sofa maintenance guide"

### Content cluster strategy

Build authority through topic clusters.

Example:

OUTDOOR SAUNA CLUSTER:

Main category:

Outdoor Saunas.

Supporting content:

- Outdoor sauna buying guide.
- Indoor vs outdoor sauna comparison.
- Sauna benefits.
- Sauna installation guide.
- Best sauna materials.
- Sauna maintenance.
- Small garden sauna ideas.

Link everything together.

### Category page SEO

Every category page must become a useful landing page.

Do not create empty product grids.

Every category requires:

SEO introduction.

Buying guidance.

Frequently asked questions.

Internal links.

Related categories.

Product explanations.

Examples:

Outdoor Furniture page:

Include:

- Materials explained.
- Weather resistance.
- Maintenance.
- Garden styling advice.

Coffee Tables page:

Include:

- Size guide.
- Materials.
- Styling.
- Room suitability.

### Product page SEO

Every product page must be optimised for:

Product searches.

Long-tail searches.

Buying intent.

Each product needs:

Unique title.

Unique description.

Unique FAQs.

Unique alt text.

Unique metadata.

Do not duplicate supplier wording.

### Meta title strategy

Create titles that balance:

Brand.

Product.

Search intent.

Example:

Bad:

"Hampton Console"

Better:

"Hampton Ivory Console Table | Luxury Shagreen Hall Furniture | Kaiku"

### Meta description strategy

Every meta description should encourage clicks.

Include:

- Product benefit.
- Material.
- Style.
- Customer intent.

Avoid:

Generic descriptions.

### URL / slug audit

Review all URLs.

Ensure:

- Short.
- Descriptive.
- Keyword relevant.
- No unnecessary words.

Examples:

Good:

/oak-coffee-tables

Bad:

/product-category-page-123

### Image SEO

Every image requires:

- Correct filename.
- Alt text.
- Product relevance.

Example:

Bad:

IMG_3928.jpg

Better:

hampton-ivory-shagreen-console-table.jpg

### Internal linking system

Create stronger connections between pages.

Every product should link to:

Related products.

Category pages.

Buying guides.

Room inspiration.

Examples:

Sofa page:

Links to:

Coffee tables.

Side tables.

Living room guide.

Interior inspiration.

### SEO content calendar

Create a long-term content plan.

Prioritise high-value topics.

Examples:

Outdoor Living:

- How to design a luxury garden.
- Best outdoor furniture materials.
- Outdoor entertaining ideas.

Wellness:

- Sauna benefits.
- Cold plunge guide.
- Creating a home wellness space.

Furniture:

- Choosing the perfect sofa.
- Coffee table sizing guide.
- Interior design trends.

### Blog strategy

The blog should not be random.

Every article must support:

- Product discovery.
- Category rankings.
- Internal linking.
- Customer education.

Each article should have:

Target keyword.

Search intent.

Products to link.

Related categories.

FAQ section.

### Sanity CMS SEO workflow

The current CMS structure must be reviewed and improved.

Sanity should not just store products.

It should become the central system controlling:

- Product information.
- SEO.
- Categories.
- Content.
- Images.
- Internal linking.
- Product relationships.

### Sanity product schema requirements

Every product entry should contain:

Basic information:

- Product name.
- Brand.
- Supplier.
- SKU.
- Product type.
- Category.
- Subcategory.
- Room.
- Tags.

Commercial information:

- Selling price.
- Cost price.
- Margin.
- Stock status.
- Delivery time.
- Availability.

Product information:

- Short description.
- Full description.
- Materials.
- Dimensions.
- Weight.
- Colours.
- Variants.
- Care instructions.
- Warranty information.

SEO information:

- SEO title.
- Meta description.
- URL slug.
- Primary keyword.
- Secondary keywords.
- Image alt text.
- FAQ schema.
- Related products.
- Related guides.

### Sanity category structure

Categories must also be treated as SEO landing pages.

Each category requires:

- SEO title.
- Meta description.
- Introduction.
- Buying guide content.
- FAQ section.
- Featured products.
- Related categories.
- Internal links.

Example:

Outdoor Saunas category:

Must contain:

- What outdoor saunas are.
- Benefits.
- Installation considerations.
- Materials.
- Buying advice.
- FAQ.
- Product selection.

### Structured data / schema markup

Implement correct structured data.

Products should include:

- Product schema.
- Price.
- Availability.
- Brand.
- Reviews if available.

Categories should include:

- Breadcrumb schema.

Articles should include:

- Article schema.
- Author information.
- Date information.

The objective:

Help Google understand the website structure.

### Google Shopping preparation

Prepare Kaiku for Google Merchant Centre.

Audit:

- Product titles.
- Product descriptions.
- Images.
- Prices.
- Availability.
- Product categories.

Ensure product data is suitable for:

- Shopping results.
- Organic listings.
- Paid campaigns.

### Google Search Console plan

Create a complete SEO monitoring system.

Track:

- Impressions.
- Clicks.
- Average position.
- CTR.
- Indexed pages.
- Coverage errors.
- Search queries.

Create monthly reporting.

Identify:

- Pages gaining traction.
- Pages losing visibility.
- Keyword opportunities.
- Missing content.

### Technical SEO audit

Review:

- Page speed.
- Mobile performance.
- Core Web Vitals.
- Sitemap.
- Robots.txt.
- Canonical URLs.
- Duplicate pages.
- Broken links.
- Redirects.

Fix anything preventing Google from properly crawling the website.

### SEO page value rule

Every page must pass this test:

Does this page provide something useful?

Does it answer a customer question?

Does it help someone make a buying decision?

Does it deserve to rank?

If not:

Improve it.

### Avoid AI content problems

Do not create hundreds of low-quality AI pages.

Avoid:

- Repeated paragraphs.
- Generic introductions.
- Keyword stuffing.
- Fake expertise.
- Empty luxury wording.

Google should see:

A genuine premium ecommerce authority.

### Kaiku content advantage

Kaiku's advantage should be:

Combining products with education.

A customer should be able to:

Discover a product.

Understand it.

Compare it.

Learn about it.

Feel confident purchasing.

### Buying guide system

Create buying guides throughout the website.

Examples:

Furniture:

- Sofa buying guide.
- Coffee table sizing guide.
- Choosing furniture materials.

Outdoor:

- Garden furniture buying guide.
- Outdoor kitchen guide.
- Pergola guide.

Wellness:

- Sauna buying guide.
- Cold plunge guide.
- Home wellness guide.

### Comparison content

Create comparison pages.

Examples:

- Indoor sauna vs outdoor sauna.
- Wood vs aluminium garden furniture.
- Cold plunge vs traditional recovery methods.
- Different coffee table materials.

These pages target high-intent searches.

### SEO internal linking rules

Every important page should have:

Incoming links.

Outgoing links.

Related content.

Examples:

A sauna product page should link to:

- Sauna category.
- Sauna buying guide.
- Wellness accessories.

A sofa page should link to:

- Living room category.
- Coffee tables.
- Side tables.

---

## Part 4 — Homepage redesign and shopping experience overhaul

The homepage is one of the most important pages on Kaiku.

It must immediately communicate:

- Premium quality.
- Trust.
- Design expertise.
- Outdoor lifestyle.
- Wellness.
- Beautiful living.

The current homepage has strong foundations but requires refinement.

The goal:

Create a homepage that feels like a premium design brand, not a standard
ecommerce store.

### Hero section redesign

Review the current hero section.

Current concept:

"Spaces that slow life down"

This direction is strong.

Improve:

- Typography.
- Image selection.
- Text positioning.
- Contrast.
- Call-to-action.
- Mobile layout.

The hero image should immediately communicate:

- Relaxation.
- Luxury.
- Outdoor living.
- Premium spaces.

Avoid generic stock photography.

The hero should create emotional desire before selling products.

### Hero content requirements

The hero should include:

Brand positioning.

Strong headline.

Supporting statement.

Primary CTA.

The CTA should encourage exploration.

Examples:

Explore Collections.

Create Your Space.

Discover Outdoor Living.

Avoid aggressive sales language.

### Remove featured coffee table hero card

Remove the featured coffee table card currently positioned beneath the hero.

Reason:

It distracts from the brand message.

The first screen should focus on:

- Brand.
- Lifestyle.
- Collections.

Not a single product promotion.

### Explore Collection button

Change the button design.

Current issue:

Rounded ecommerce-style button.

Required:

- Sharp edges.
- Premium appearance.
- Strong typography.
- Luxury feel.

### Featured collection structure

Create a stronger discovery system.

The homepage should include:

Featured categories.

Featured products.

Editorial sections.

Buying inspiration.

### Category scroll section

Create a horizontal scroll section.

Requirements:

White background panel.

Scrollable categories.

Premium cards.

Mobile compatible.

The category bar should allow expansion as more categories are added.

Example categories:

- Outdoor Living.
- Saunas.
- Garden Furniture.
- Outdoor Kitchens.
- Fire Pits.
- Wellness.
- Living Room.
- Bedroom.
- Office.
- Lighting.

The section should work naturally on desktop and mobile.

### Featured furniture section

Create a featured furniture section.

Title:

"New & Noteworthy"

Purpose:

Highlight premium furniture discoveries.

Requirements:

- White background section.
- Horizontal product scrolling.
- Mobile swipe support.
- Premium product cards.

Do not create a crowded grid.

The user should feel like browsing a luxury catalogue.

### Shopping experience redesign

The current black tile shopping page is not the desired experience.

Create a better shopping journey.

Customers should enter directly into a premium shopping interface.

The black tile page should not interrupt normal shopping.

### White shopping page system

The main shopping pages should use:

- Clean white backgrounds.
- Premium product cards.
- Filtering.
- Sorting.
- Category navigation.

The experience should resemble:

A luxury retailer.

Not:

A basic marketplace.

### Category navigation fixes

Fix category behaviour.

Current problems:

- Clicking categories sometimes returns users to the black tile page.
- Selected categories reopen incorrectly.
- Navigation feels inconsistent.

Required:

When a customer selects a category:

Take them directly to the correct white shopping page.

If already inside a category:

Keep them there.

Do not redirect backwards.

### Category structure audit

Review all category relationships.

Fix incorrect product placement.

### Outdoor Living category

Outdoor Living should include:

- Garden furniture.
- Pergolas.
- Outdoor kitchens.
- Fire pits.
- Heating.
- Water features.
- Wellness products.
- Garden accessories.

Current issue:

Outdoor Living appears to only show some products.

Audit and correct.

### Sauna category

When users select:

Saunas.

Only display:

- Indoor saunas.
- Outdoor saunas.

Do not show:

- Oils.
- Accessories.
- General wellness products.

### Wellness accessories

Wellness accessories should exist in:

- Sauna.
- Outdoor Living.
- Its own dedicated category.

This improves discovery.

### Product filtering system

Create advanced filtering.

Furniture requires:

Colour filters.

Use visual colour circles/icons.

Examples:

White.

Black.

Oak.

Walnut.

Grey.

Green.

Natural.

Brown.

### Variant filtering

Products with multiple colours must appear correctly.

Example:

A console table available in:

White.

Black.

Brown.

When users select:

Black furniture.

The black version should appear.

Do not only show default images.

### Category page experience

Every category page needs:

- Product listings.
- SEO content.
- Filters.
- Buying guides.
- FAQs.
- Related categories.

A category page should provide value.

Not just display products.

---

## Part 5 — Product page redesign and conversion optimisation

Product pages are the most important revenue pages on Kaiku.

Every product page must become more than a listing.

It must become:

- A buying guide.
- A product education page.
- A trust-building page.
- A conversion tool.

The customer should leave the page feeling:

"I understand this product, I trust this brand, and I know whether this is right
for me."

### Product page structure

Every product page must follow a consistent premium structure.

Required sections:

1. Product title.

2. Premium product imagery.

3. Price.

4. Key product information.

5. Add to basket / purchase actions.

6. Delivery information.

7. Returns information.

8. Product description.

9. Materials and craftsmanship.

10. Dimensions/specifications.

11. Product FAQs.

12. Comparison feature.

13. Related products.

14. Related inspiration content.

### Product description improvement

Every product description must be reviewed.

Current issue:

Some descriptions are generic and repetitive.

Fix:

Every product description must be unique.

Do not use identical AI wording.

Every description should explain:

- What makes this product different.
- Design characteristics.
- Materials.
- Practical benefits.
- Suitable rooms.
- Styling ideas.
- Customer considerations.

### Customer value requirement

Every product page must answer:

Why should someone buy this?

Why is this better than alternatives?

Where would this work in a home?

How should it be styled?

What should customers know before purchasing?

### Artistic side panel / empty space fix

Some product pages contain large unused empty areas beside descriptions.

This space must not remain empty.

Create a consistent premium visual system.

Do not use product images.

Instead use:

- Decorative line artwork.
- Architectural patterns.
- Organic shapes.
- Botanical line drawings.
- Minimal luxury illustrations.
- Abstract design elements.

The artwork should:

- Match the Kaiku brand.
- Improve the premium feel.
- Make pages feel designed.

Each product page can have variations while maintaining consistency.

Examples:

Furniture:

- Fine wood grain inspired lines.
- Architectural sketches.
- Botanical patterns.

Wellness:

- Calm organic shapes.
- Water-inspired patterns.

Outdoor:

- Garden inspired linework.

### Section formatting

All product pages must have consistent formatting.

Sections must be separated by:

- Clear lines.
- Proper spacing.
- Premium typography.

Avoid large blocks of text.

The page should feel easy to scan.

### Returns section

Every product page requires a returns section.

The heading must be:

RETURNS

The heading must be:

- Bold.
- Consistent.
- Clearly visible.

The paragraph must be unique where necessary but maintain consistent formatting.

### Delivery information

Every product must include delivery information.

The delivery section must include:

- Expected lead time.
- Availability.
- Delivery method.

The lead time must match supplier information.

### Delivery lead time report

Create a site-wide report.

Show:

Every delivery timeframe used.

Example:

7-10 days:
Number of products.

10-14 days:
Number of products.

2-3 weeks:
Number of products.

4+ weeks:
Number of products.

Purpose:

Identify inconsistent delivery promises.

### Large furniture delivery disclaimer

For large furniture products, add a clear customer expectation section.

Explain:

Large furniture items are doorstep delivered at a suitable agreed time and date.

White glove delivery is not included unless an additional service is arranged.

The reason:

Kaiku is able to offer premium furniture at significantly more competitive
pricing than many traditional luxury furniture retailers by using a streamlined
delivery model.

The wording must remain professional.

Do not make it sound negative.

Position it as:

A transparent benefit.

### Product FAQ system

Every product requires additional FAQs.

FAQs must be:

- Unique.
- SEO focused.
- Product specific.

Examples:

Furniture:

- What material is this made from?
- How should this be styled?
- What room sizes does this suit?
- Is assembly required?

Outdoor:

- Is this weather resistant?
- How should it be maintained?
- Can it stay outside year-round?

### Product comparison feature

Create a comparison system.

Every product page should allow customers to compare products.

Function:

Customer clicks:

"Compare"

Then selects another product.

Display side-by-side:

- Price.
- Dimensions.
- Material.
- Colour.
- Features.
- Delivery time.
- Availability.
- Specifications.

### Related product system

Related products must be meaningful.

Do not randomly recommend products.

Recommendations should consider:

- Room.
- Style.
- Material.
- Customer intent.
- Buying journey.

Examples:

Sofa:

Recommend:

- Coffee tables.
- Side tables.
- Armchairs.
- Living room accessories.

Bedside table:

Recommend:

- Bedroom furniture.
- Lamps.
- Storage.
- Mirrors.

Sauna:

Recommend:

- Wellness accessories.
- Sauna lighting.
- Outdoor living products.

### Product page SEO value test

Before completing each product page ask:

Does this help Google understand the product?

Does this help customers make decisions?

Does this increase trust?

Does this improve conversion?

If no:

Improve it.

---

## Part 6 — Business systems and conversion optimisation

The website must not only look premium.

It must function as a complete ecommerce business.

The objective:

Turn visitors into customers.

### Checkout experience

Audit the complete checkout journey.

Review:

- Add to basket.
- Basket page.
- Checkout.
- Payment.
- Confirmation.
- Customer emails.

Remove friction.

The process should feel:

- Simple.
- Premium.
- Trustworthy.

### Stripe configuration

Ensure Stripe is fully prepared.

Check:

- Live payments.
- Payment methods.
- Checkout flow.
- Order confirmation.
- Failed payment handling.
- Customer receipts.

Before launch:

Complete a full test order.

### Customer account system

Implement customer account functionality.

Customers should be able to:

- Create an account.
- View orders.
- Save details.
- Track purchases.

### Email system

Create a complete email system.

Required emails:

Welcome email.

Order confirmation.

Payment confirmation.

Shipping update.

Delivery notification.

Abandoned basket.

Account creation.

Customer follow-up.

### 10% discount account strategy

Create an account incentive.

Requirement:

Prompt customers to create an account to receive 10% off their second order.

Do not make this feel aggressive.

Position it as:

Join the Kaiku community.

Receive benefits.

Save on future purchases.

### Product badges

Create subtle product indicators.

Examples:

- New arrival.
- Low stock.
- Limited availability.
- Popular choice.
- Coming soon.

Important:

Do not make the website feel like a discount marketplace.

Badges must feel premium.

Avoid:

"SALE!"

"BUY NOW!"

"LAST CHANCE!"

### Live stock system

Begin building live inventory infrastructure.

The system should eventually support:

- Supplier stock checks.
- Variant availability.
- Lead times.
- Automatic updates.

Prepare architecture using:

- Supplier data.
- APIs where available.
- Database storage.

### Supplier expansion strategy

Create a list of 20 additional suppliers.

Priority:

High-quality brands.

Categories:

- Outdoor furniture.
- Outdoor kitchens.
- Pergolas.
- Fire pits.
- Garden accessories.
- Wellness.
- Lighting.
- Interior furniture.

For each supplier provide:

Company.

Website.

Products.

Why they fit Kaiku.

Contact method.

Partnership approach.

### Supplier outreach system

Create professional supplier emails.

Position Kaiku as:

- Premium ecommerce partner.
- Content-driven retailer.
- Brand builder.

Avoid presenting Kaiku as simply another reseller.

Highlight:

- SEO content.
- Product education.
- Customer experience.
- Premium positioning.

### Large product sales strategy

High-ticket products require more trust.

Examples:

- Saunas.
- Outdoor kitchens.
- Pergolas.
- Premium furniture.

Improve these pages with:

- Buying guides.
- FAQs.
- Comparisons.
- Installation information.
- Customer education.

### Request a quote system

The quote system should support high-value purchases.

Create a professional quote page.

Required fields:

Customer name.

Email.

Phone.

Product.

Quantity.

Project type.

Budget.

Timeline.

Message.

### Quote page purpose

The quote page should capture customers who are not ready for immediate
checkout.

Examples:

A customer interested in:

£5,000 sauna.

£8,000 outdoor kitchen.

£3,000 furniture project.

Instead of losing them:

Capture the enquiry.

### Customer trust improvements

Increase trust throughout the website.

Include:

- Clear delivery information.
- Returns policy.
- Contact information.
- Brand story.
- Supplier credibility.
- Quality messaging.

### Competitor positioning

Kaiku should communicate:

Premium products.

Competitive pricing.

Expert guidance.

Better shopping experience.

Do not compete only on price.

---

## Part 7 — Technical foundation and scaling architecture

Kaiku must be built with long-term scalability in mind.

The website should not only work for 100 products.

It must be capable of supporting:

- 1,000 products.
- 5,000 products.
- Multiple suppliers.
- Multiple categories.
- Automated systems.

### Technical audit

Complete a full technical review of the website.

Audit:

- Frontend architecture.
- Backend structure.
- CMS implementation.
- Image handling.
- Database structure.
- API connections.
- Performance.
- Mobile responsiveness.
- Error handling.

Identify:

- Technical debt.
- Poor architecture decisions.
- Scalability problems.

### Sanity CMS optimisation

Sanity should become the central product management system.

Review every content model.

Ensure:

- Products are structured correctly.
- Categories are structured correctly.
- SEO fields exist.
- Images are manageable.
- Relationships work correctly.

### Product content management

Create systems that make managing hundreds of products easier.

Examples:

Bulk editing.

Bulk SEO updates.

Bulk category changes.

Bulk image updates.

Bulk metadata changes.

Avoid requiring manual editing of every product.

### Supabase database planning

Begin planning the database architecture.

The database should eventually store:

Products.

Suppliers.

Stock.

Prices.

Variants.

SEO data.

Analytics.

Customer enquiries.

Comparison data.

### Supabase structure

Potential tables:

Products.

Fields:

- Product ID.
- Name.
- Supplier.
- Category.
- Price.
- Cost.
- Margin.
- SKU.
- Stock.
- Images.
- SEO fields.

Suppliers.

Fields:

- Supplier ID.
- Company name.
- Website.
- Contact details.
- Terms.
- Product feed information.

Inventory.

Fields:

- Product.
- Supplier stock.
- Current stock.
- Last checked.
- Availability.

SEO Tracking.

Fields:

- Page.
- Keyword.
- Position.
- Clicks.
- Impressions.
- Changes.

### Image management system

Fix all image management problems.

Requirements:

- High-resolution images must display correctly.
- Updates must save.
- Images must persist after deployment.
- Correct optimisation must happen automatically.

Audit:

- CDN.
- Image optimisation.
- Cache.
- CMS references.
- Frontend rendering.

### Performance optimisation

Improve website speed.

Focus on:

Mobile performance.

Largest Contentful Paint.

Image loading.

JavaScript size.

Unused code.

Animations.

Fonts.

Caching.

### Mobile performance priority

Mobile users are the priority.

The website must load quickly on:

- Mobile networks.
- Older devices.
- Different browsers.

Premium design should not come at the cost of speed.

### Analytics implementation

Ensure full analytics tracking.

Track:

Visitors.

Traffic sources.

Product views.

Category views.

Search usage.

Add to basket.

Checkout starts.

Purchases.

Quote requests.

Email signups.

### Conversion tracking

Create a system to understand customer behaviour.

Questions to answer:

Which products receive attention?

Which categories perform?

Where do users leave?

Which pages convert?

Which SEO pages bring customers?

### Search functionality

Improve website search.

Customers should be able to find:

Products.

Categories.

Materials.

Colours.

Styles.

Rooms.

Examples:

"black coffee table"

"oak furniture"

"garden sauna"

"green sofa"

### Filter system architecture

Filters must scale.

Support:

Category.

Colour.

Material.

Price.

Brand.

Availability.

Style.

Room.

Product type.

### Supplier integration preparation

Prepare for future supplier connections.

Possible integrations:

- Product feeds.
- CSV imports.
- APIs.
- Stock feeds.

The architecture should allow adding suppliers without rebuilding the website.

### Security audit

Review:

- Payment security.
- Customer data.
- Forms.
- Authentication.
- APIs.

Ensure the platform follows best practices.

### Error monitoring

Implement monitoring for:

- Broken pages.
- Failed images.
- Checkout errors.
- API failures.
- CMS problems.

---

## Part 8 — Execution rules and final objective

You are now responsible for improving Kaiku as if you were part of the founding
team.

Do not treat this as a simple coding task.

Think commercially.

Every decision should consider:

- SEO growth.
- Customer experience.
- Conversion rate.
- Brand perception.
- Scalability.
- Revenue potential.

### Working priority order

Complete tasks in this order:

#### Phase 1 — fix broken experiences

Before adding new features:

Fix existing problems.

Priority:

1. Mobile experience.

2. Broken category navigation.

3. Image publishing issues.

4. Incorrect products.

5. Broken pages.

6. Missing information.

A perfect new feature is useless if the current experience is broken.

#### Phase 2 — product quality

Audit every product.

Ensure:

- Correct information.
- Correct images.
- Correct categories.
- Correct pricing.
- Correct stock.
- Correct SEO.
- Unique descriptions.

The catalogue must become a competitive advantage.

#### Phase 3 — SEO foundation

Improve:

- Product SEO.
- Category SEO.
- Technical SEO.
- Internal linking.
- Content structure.

Every page should have a purpose.

#### Phase 4 — conversion optimisation

Improve:

- Product pages.
- Checkout.
- Trust signals.
- Quote system.
- Customer journey.

#### Phase 5 — scale systems

Build foundations for:

- More suppliers.
- More products.
- More categories.
- Automation.

### Reporting requirements

After completing work, provide a clear report.

Include:

Completed:

List all finished improvements.

Problems discovered:

List:

- Technical problems.
- Data problems.
- SEO problems.
- Design problems.

Recommended next actions:

Prioritised list.

Metrics to monitor:

Include:

- Traffic.
- Rankings.
- Product views.
- Conversion rate.
- Enquiries.
- Sales.

### Do not stop at visual improvements

A beautiful website with no traffic or conversions is not successful.

Every improvement must contribute to:

- More visitors.
- More trust.
- More sales.

### SEO growth target

The objective is to build towards:

500 daily visitors within 3 months.

This will require:

Consistent SEO improvement.

High-quality content.

Better product pages.

Strong category pages.

Technical excellence.

Do not promise unrealistic results.

Instead:

Build the strongest possible foundation for organic growth.

### Content quality standard

Every page should feel like it was created by:

A luxury retailer.

An interior designer.

A product expert.

Not an automated website generator.

### Final brand direction

Kaiku should become known for:

Premium outdoor living.

Beautiful home spaces.

Wellness products.

Expert advice.

Exceptional shopping experience.

The website should make customers think:

"This feels like a brand I can trust."

### Supplier expansion final task

Continue building supplier relationships.

Find premium suppliers that complement:

Outdoor Living.

Wellness.

Furniture.

Garden Design.

Home Improvement.

For every supplier:

Research:

- Product quality.
- Brand reputation.
- Partnership options.
- Retail terms.
- Contact information.

Create outreach opportunities.

### Final check before completion

Before considering the project complete, review:

Does the website look premium?

Does mobile feel excellent?

Can customers easily find products?

Are products correctly organised?

Does Google understand the website?

Do product pages educate customers?

Does the website encourage purchases?

Can Kaiku scale?

If any answer is no:

Continue improving.

### Final objective

Transform Kaiku from a new ecommerce website into a premium ecommerce authority
brand.

The goal is not just to sell products.

The goal is to create the best possible shopping destination for outdoor living,
wellness and beautiful home spaces.

Use your full capability.

Think deeply.

Improve everything that can create business value.

---

## Earlier instructions from the same session, kept because they are still binding

- "dont change any lead times, just make sure the lead times and delivery page
  has the lead time inside the paragraph"
- "im trying to make each product unique and thought about, not just copy there
  descriptions" — no supplier data feed.
- "no it wasn't ivyline" — the fire pit supplier that supplies Dunelm is still
  unidentified. Two candidates with phone numbers are in the pipeline doc; your
  call log settles it.
- "i meant published products not unpublished" — on the Aosom deletion. All 32
  documents were restored.
- "we need headers for everything and everything should be neatly formatted …
  bullet points would look better as green ticks … lines between types of
  paragraphs" — done in `product-description-components.tsx`.
- "also pair all information to the real product page with the url, if i havent
  added the url find the product on the web from the correct website and add it
  to sanity, if i havent filled in any boxes get it from the site and add it"
- "i need more categories in the scroll bar and the same for mobile too, it also
  says start by room when its categories not rooms. it scrolls to the right but
  wont come back too, i also dont like the product choices it should be
  cheap-expensive di designs furniture" — all four fixed.
- "SAVE ALL PROMPTS IVE SENT SO YOU KNOW OUR PROGRESS NOT A SINGLE THING SHOULD
  BE MISSED" — this file and `docs/master-brief.md` are the answer to that.
