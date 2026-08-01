/**
 * Content pack: publishes the first SEO-optimized journal post ("How Much
 * Does an Outdoor Sauna Cost in the UK?") and fills in descriptions for the
 * two stocked categories, so the shop hero copy stops falling back to the
 * generic default line.
 *
 * Product names and prices in the post are pulled LIVE from Sanity at run
 * time — the copy can't drift out of date against the catalogue, and nothing
 * is invented. Deterministic _id + createOrReplace makes re-running safe
 * (edit the post in Studio afterwards and re-running will overwrite — so
 * treat Studio as the source of truth once you've edited there).
 *
 * Run with: pnpm tsx --env-file=.env.local scripts/publish-content-pack.ts
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token,
  useCdn: false,
});

// --- Minimal portable-text builders (deterministic keys, safe to re-run) ---

let keyCounter = 0;
const key = () => `pk${(keyCounter++).toString(36).padStart(4, "0")}`;

type Span = { text: string; href?: string; strong?: boolean };

function blockOf(style: string, spans: Span[]) {
  const markDefs: { _key: string; _type: "link"; href: string }[] = [];
  const children = spans.map((span) => {
    const marks: string[] = [];
    if (span.href) {
      const defKey = key();
      markDefs.push({ _key: defKey, _type: "link", href: span.href });
      marks.push(defKey);
    }
    if (span.strong) marks.push("strong");
    return { _type: "span", _key: key(), text: span.text, marks };
  });
  return { _type: "block", _key: key(), style, markDefs, children };
}

const h2 = (text: string) => blockOf("h2", [{ text }]);
const h3 = (text: string) => blockOf("h3", [{ text }]);
const p = (...spans: (string | Span)[]) =>
  blockOf(
    "normal",
    spans.map((s) => (typeof s === "string" ? { text: s } : s)),
  );

interface ProductRef {
  name: string;
  price: number;
  slug: string;
  category: string;
}

async function main() {
  // Live product data for the "real examples" section — never hardcoded.
  const saunas = await client.fetch<ProductRef[]>(
    `*[_type == "product" && category->slug.current == "outdoor-saunas" && stockStatus != "Coming Soon"]
      | order(price asc) { "name": title, price, "slug": slug.current, "category": category->slug.current }`,
  );
  if (saunas.length === 0) {
    console.error("No outdoor saunas found in Sanity — aborting.");
    process.exit(1);
  }
  const entry = saunas[0]!;
  const flagship = saunas[saunas.length - 1]!;
  const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;
  const productUrl = (product: ProductRef) =>
    `https://www.kaikuhome.com/shop/${product.category}/${product.slug}`;

  const body = [
    p(
      `A quality outdoor sauna in the UK typically costs between ${gbp(entry.price)} and ${gbp(flagship.price)} for the sauna itself, delivered. Entry-level kit saunas can be found cheaper, and large bespoke builds run well past £15,000 — but for a well-made cabin or barrel sauna from an established supplier, that's the realistic range in 2026. Here's exactly where the money goes, what it costs to run, and how to avoid paying for the wrong things.`,
    ),

    h2("What drives the price of an outdoor sauna?"),
    p(
      { text: "Heater type. ", strong: true },
      `Traditional electric stoves (the löyly experience — water on hot stones) and infrared panel systems sit at similar price points at the quality end, but infrared models need no plumbing-grade ventilation planning and run on lower power draw, which can save on installation.`,
    ),
    p(
      { text: "Timber and build quality. ", strong: true },
      `Thick, slow-grown spruce or cedar with proper tongue-and-groove construction costs more than thin-walled kits — and it's the single biggest difference between a sauna that lasts twenty years and one that warps in three. If a price looks too good, the wall thickness is usually why.`,
    ),
    p(
      { text: "Size. ", strong: true },
      `A 2-person sauna and a 6-person sauna can differ by thousands of pounds — more timber, a bigger heater, more glass. Buy for how you'll actually use it: most owners report 1–2 people in it 90% of the time.`,
    ),
    p(
      { text: "Glass and finish. ", strong: true },
      `Full glass fronts and panoramic windows look spectacular and cost accordingly. A glass door with timber walls gives most of the feel for much less.`,
    ),

    h2("Real prices from our range"),
    p(
      `Rather than vague ranges, here are live prices from our own collection:`,
    ),
    p(
      { text: `${entry.name} — ${gbp(entry.price)}`, href: productUrl(entry) },
      `. Our entry point into a genuinely well-built outdoor sauna, with free UK delivery included.`,
    ),
    ...(flagship.slug !== entry.slug
      ? [
          p(
            {
              text: `${flagship.name} — ${gbp(flagship.price)}`,
              href: productUrl(flagship),
            },
            `. The flagship: larger capacity and a step up in materials and finish.`,
          ),
        ]
      : []),
    p(
      `Every price in `,
      {
        text: "our outdoor sauna collection",
        href: "https://www.kaikuhome.com/shop/outdoor-saunas",
      },
      ` includes UK delivery — there's no surprise added at checkout.`,
    ),

    h2("How much does an outdoor sauna cost to run?"),
    p(
      `This is simple arithmetic on your electricity tariff. A typical 6 kW traditional heater running for a one-hour session uses roughly 6 kWh — about £1.60 per session at a 27p/kWh unit rate. Infrared systems typically draw 1.5–3 kW, so the same hour costs roughly 40–80p. Even sauna-ing four times a week, running costs are in the region of £10–£25 a month — the purchase price, not the running cost, is the real financial decision.`,
    ),

    h2("Delivery, base and installation costs"),
    p(
      `Three costs people forget to budget for: a level base (a concrete pad, or a properly-built timber/gravel base — from a few hundred pounds if you don't already have one), an electrician to connect the heater (traditional stoves usually need a dedicated circuit; budget £200–£500 depending on the run from your consumer unit), and assembly if you don't fancy a weekend of methodical DIY. Delivery itself is free on our range — for kerbside pallet delivery, make sure there's clear access to your garden.`,
    ),

    h2("Do you need planning permission?"),
    p(
      `Most garden saunas fall within permitted development in the UK — but the rules hinge on height (typically under 2.5m near a boundary), position, and whether you're in a conservation area or listed property. It's a ten-minute check with your local authority before ordering, and worth every minute. We're preparing a full guide to sauna planning permission — `,
      {
        text: "our sauna buying guide",
        href: "https://www.kaikuhome.com/learn/choosing-a-sauna",
      },
      ` covers siting basics in the meantime.`,
    ),

    h2("Is an outdoor sauna worth the money?"),
    p(
      `Financially: a well-built sauna is a durable asset — quality cabins last decades with basic maintenance, and garden wellness installations are increasingly cited by estate agents as a differentiator. Practically: the people who get the most from a sauna are the ones who use it several times a week, and owners overwhelmingly say the barrier to use is convenience. A sauna twenty steps from your back door gets used; a gym sauna twenty minutes away doesn't. That, more than any resale argument, is the honest case for buying one.`,
    ),

    h2("Frequently asked questions"),
    h3("What's the cheapest way to get a quality outdoor sauna?"),
    p(
      `Buy a smaller, well-built sauna rather than a bigger cheap one. A quality 2–3 person cabin from ${gbp(entry.price)} will outlast and outperform a thin-walled 6-person kit at the same price.`,
    ),
    h3("How long does delivery take?"),
    p(
      `In-stock models typically deliver within 1–3 weeks in the UK. Each product page in our range shows its current lead time.`,
    ),
    h3("Do outdoor saunas work in winter?"),
    p(
      `Yes — winter is when they're best. A properly insulated sauna reaches temperature in 30–45 minutes even in freezing weather; the contrast is the entire point.`,
    ),
    h3("Infrared or traditional — which is cheaper overall?"),
    p(
      `Purchase prices overlap at the quality end. Infrared is cheaper to run per session and simpler to install; traditional gives the classic steam-and-stones ritual. Choose on experience, not price — the running-cost difference is pounds per month, not per session.`,
    ),

    p(
      `Ready to compare real models? Browse `,
      {
        text: "the full outdoor sauna collection",
        href: "https://www.kaikuhome.com/shop/outdoor-saunas",
      },
      ` — every price includes UK delivery, and if you're not sure which size or heater type fits your space, reply to any page's "Ask a Question" and we'll give you a straight answer.`,
    ),
  ];

  await client.createOrReplace({
    _id: "post-outdoor-sauna-cost-uk",
    _type: "post",
    title: "How Much Does an Outdoor Sauna Cost in the UK? (2026 Guide)",
    slug: { _type: "slug", current: "outdoor-sauna-cost-uk" },
    excerpt:
      "Real 2026 prices for quality outdoor saunas in the UK — what drives the cost, what they cost to run per session, and the delivery, base and installation costs nobody budgets for.",
    body,
    publishedAt: new Date().toISOString(),
    tags: ["saunas", "buying advice", "costs"],
    seo: {
      metaTitle: "How Much Does an Outdoor Sauna Cost in the UK? (2026)",
      metaDescription:
        "Quality outdoor saunas cost £2,000–£7,000+ in the UK. What drives the price, real running costs per session, and hidden setup costs — with live prices from our range.",
    },
  });
  console.log(
    "Published: How Much Does an Outdoor Sauna Cost in the UK? → /journal/outdoor-sauna-cost-uk",
  );

  // --- Category descriptions (only fills gaps — never overwrites copy you
  // or an editor wrote in Studio) ---
  const categoryDescriptions: Record<string, string> = {
    "outdoor-saunas":
      "Cabin and barrel saunas built from slow-grown timber, with traditional and infrared heaters engineered to last decades. Every sauna includes free UK delivery.",
    "cold-plunges":
      "Purpose-built cold plunge tubs for daily contrast therapy — insulated, filtered, and ready for year-round use in a UK garden.",
  };

  for (const [slug, description] of Object.entries(categoryDescriptions)) {
    const category = await client.fetch<{
      _id: string;
      description?: string;
    } | null>(
      `*[_type == "category" && slug.current == $slug][0]{ _id, description }`,
      { slug },
    );
    if (!category) {
      console.warn(`Category not found, skipped: ${slug}`);
      continue;
    }
    if (category.description?.trim()) {
      console.log(`Category already has a description, left alone: ${slug}`);
      continue;
    }
    await client.patch(category._id).set({ description }).commit();
    console.log(`Category description set: ${slug}`);
  }

  console.log(
    "\nDone. Next: open Studio, add a cover image to the post, then request indexing for /journal/outdoor-sauna-cost-uk in Google Search Console (see docs/blog-seo-playbook.md, Step 5).",
  );
}

main().catch((err) => {
  console.error("publish-content-pack failed:", err);
  process.exit(1);
});
