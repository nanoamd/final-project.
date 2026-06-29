import type { Category, Product } from "@/types/catalog";

/**
 * Placeholder catalog.
 *
 * Product names, copy and specifications are neutral placeholders standing in
 * for real supplier data. They contain NO invented reviews, awards, press or
 * certifications. When supplier data lands, this module is replaced by a
 * projection from the Intelligence Layer — the UI is unaffected.
 */

export const categories: Category[] = [
  {
    slug: "outdoor-saunas",
    name: "Outdoor Saunas",
    shortName: "Saunas",
    tagline: "The heart of the garden ritual",
    description:
      "Cabin, barrel and panoramic saunas built from slow-grown Nordic timber. Sized to your garden, your household and the way you intend to use them.",
    illustration: "barrel",
    tone: "sand",
    available: true,
  },
  {
    slug: "sauna-heaters",
    name: "Sauna Heaters",
    shortName: "Heaters",
    tagline: "Correctly sized, properly specified",
    description:
      "Electric and wood-burning heaters matched to cabin volume, glass area and the heat you want. The single most important decision after the cabin itself.",
    illustration: "heater",
    tone: "charcoal",
    available: true,
  },
  {
    slug: "cold-plunge",
    name: "Cold Plunge",
    shortName: "Cold Plunge",
    tagline: "Recovery, resilience, ritual",
    description:
      "Cold therapy tubs engineered to hold temperature reliably — the contrast that completes the sauna experience.",
    illustration: "plunge",
    tone: "stone",
    available: true,
  },
  {
    slug: "chillers",
    name: "Chillers",
    shortName: "Chillers",
    tagline: "Precise, consistent cold",
    description:
      "Water chillers that hold an exact temperature year-round, matched to plunge volume and ambient conditions.",
    illustration: "chiller",
    tone: "mist",
    available: true,
  },
];

export const products: Product[] = [
  {
    slug: "aalto-cabin-sauna",
    name: "Aalto Cabin Sauna",
    category: "outdoor-saunas",
    categoryName: "Outdoor Saunas",
    tagline: "A quiet two-to-three person retreat",
    summary:
      "A compact cabin sauna in slow-grown Nordic spruce, designed for smaller gardens without compromising on the bench depth or ceiling height that make a session feel generous.",
    priceFrom: 8900,
    badges: ["2–3 person", "Electric"],
    illustration: "sauna",
    tone: "sand",
    highlights: [
      "Slow-grown Nordic spruce, kiln-dried for stability",
      "Full-height glass door for a sense of openness",
      "Ergonomic two-tier benching in knot-free aspen",
    ],
    specs: [
      { label: "Capacity", value: "2–3 people" },
      { label: "External footprint", value: "1.9m × 1.7m" },
      { label: "Internal height", value: "2.1m" },
      { label: "Timber", value: "Nordic spruce / aspen interior" },
      { label: "Heater", value: "Electric, 6–8kW (sized to order)" },
      { label: "Power supply", value: "Single phase, 32A recommended" },
    ],
    delivery:
      "Kerbside delivery across UK mainland, typically 4–8 weeks. White-glove installation available on request.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Do I need planning permission?",
        answer:
          "In most cases an outdoor sauna falls under permitted development, but boundary distances, height and listed-building status all matter. Our guided buying flow flags planning considerations before you commit.",
      },
      {
        question: "What base does it need?",
        answer:
          "A level, load-bearing base — paving, a concrete pad or a properly built deck. We confirm the exact base requirement against your chosen model during quotation.",
      },
      {
        question: "Can you install it?",
        answer:
          "Yes. Installation is available across most of the UK mainland and is quoted per site once access and base are confirmed.",
      },
    ],
  },
  {
    slug: "nordr-barrel-sauna",
    name: "Nordr Barrel Sauna",
    category: "outdoor-saunas",
    categoryName: "Outdoor Saunas",
    tagline: "The classic form, faithfully made",
    summary:
      "A barrel sauna whose curved profile heats quickly and evenly. A natural choice for gardens where a cabin would feel too architectural.",
    priceFrom: 6900,
    badges: ["4 person", "Electric or wood"],
    illustration: "barrel",
    tone: "clay",
    highlights: [
      "Curved form heats quickly and circulates evenly",
      "Available with electric or wood-burning heater",
      "Tongue-and-groove thermowood staves",
    ],
    specs: [
      { label: "Capacity", value: "4 people" },
      { label: "Length", value: "2.4m" },
      { label: "Diameter", value: "2.0m" },
      { label: "Timber", value: "Thermowood / spruce" },
      { label: "Heater", value: "Electric 8kW or wood-burning" },
      { label: "Power supply", value: "Single phase (electric option)" },
    ],
    delivery:
      "Kerbside delivery across UK mainland, typically 4–8 weeks. Assembly available on request.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Electric or wood-burning?",
        answer:
          "Electric is lower-maintenance and easier to schedule; wood-burning offers a more traditional ritual but needs a flue and clearances. Guided buying weighs this against your setup.",
      },
      {
        question: "How long does it take to heat?",
        answer:
          "A barrel's curved form heats relatively quickly — typically 30–45 minutes depending on heater and ambient temperature.",
      },
    ],
  },
  {
    slug: "vista-panoramic-sauna",
    name: "Vista Panoramic Sauna",
    category: "outdoor-saunas",
    categoryName: "Outdoor Saunas",
    tagline: "A glass wall onto the garden",
    summary:
      "A panoramic cabin with a full glass gable, turning the view into part of the ritual. Built for those who want their sauna to be the architectural centrepiece of the garden.",
    priceFrom: 14900,
    badges: ["4–6 person", "Panoramic glass"],
    illustration: "sauna",
    tone: "charcoal",
    highlights: [
      "Full-height panoramic glass gable",
      "Triple-glazed for heat retention",
      "Generous twin-bench layout in clear aspen",
    ],
    specs: [
      { label: "Capacity", value: "4–6 people" },
      { label: "External footprint", value: "2.4m × 2.2m" },
      { label: "Glazing", value: "Triple-glazed panoramic gable" },
      { label: "Timber", value: "Nordic spruce / aspen interior" },
      { label: "Heater", value: "Electric, 9kW (sized to order)" },
      { label: "Power supply", value: "Single phase, 32A" },
    ],
    delivery:
      "Delivered and installed by specialist team, typically 6–10 weeks. Crane access may be required on some sites.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Does the large glass area affect heating?",
        answer:
          "A larger glass area increases heat loss, which is why this model is triple-glazed and specified with a correctly sized heater. Our sizing accounts for glass area automatically.",
      },
      {
        question: "Will it need crane access?",
        answer:
          "Larger panoramic cabins sometimes require crane or specialist access depending on your garden. We assess this before installation is quoted.",
      },
    ],
  },
  {
    slug: "lumi-compact-sauna",
    name: "Lumi Compact Sauna",
    category: "outdoor-saunas",
    categoryName: "Outdoor Saunas",
    tagline: "Small footprint, full ritual",
    summary:
      "The smallest cabin in the range, designed for courtyard gardens and tight side-returns where every centimetre counts.",
    priceFrom: 7400,
    badges: ["2 person", "Electric"],
    illustration: "sauna",
    tone: "mist",
    highlights: [
      "Designed for compact and courtyard gardens",
      "Single-tier bench with full recline length",
      "Quick to heat on a domestic supply",
    ],
    specs: [
      { label: "Capacity", value: "2 people" },
      { label: "External footprint", value: "1.5m × 1.5m" },
      { label: "Internal height", value: "2.0m" },
      { label: "Timber", value: "Nordic spruce" },
      { label: "Heater", value: "Electric, 4.5–6kW" },
      { label: "Power supply", value: "Single phase, 16–32A" },
    ],
    delivery: "Kerbside delivery across UK mainland, typically 4–6 weeks.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Can it run on a standard supply?",
        answer:
          "Smaller heaters can sometimes run on a 13A or 16A supply, but most installations are best on a dedicated 32A circuit. We confirm electrical requirements before purchase.",
      },
    ],
  },
  {
    slug: "fjord-cabin-sauna",
    name: "Fjord Cabin Sauna",
    category: "outdoor-saunas",
    categoryName: "Outdoor Saunas",
    tagline: "Built to host",
    summary:
      "A six-person cabin with a changing porch — the social sauna, made for households that gather and entertain.",
    priceFrom: 16900,
    badges: ["6 person", "Porch"],
    illustration: "barrel",
    tone: "sand",
    highlights: [
      "Six-person twin-tier benching",
      "Covered changing porch with bench",
      "Specified for frequent, sustained use",
    ],
    specs: [
      { label: "Capacity", value: "6 people" },
      { label: "External footprint", value: "3.0m × 2.2m" },
      { label: "Layout", value: "Hot room plus covered porch" },
      { label: "Timber", value: "Nordic spruce / aspen interior" },
      { label: "Heater", value: "Electric, 9kW (sized to order)" },
      { label: "Power supply", value: "Single phase, 32A" },
    ],
    delivery:
      "Delivered and installed by specialist team, typically 6–10 weeks.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Is it suitable for frequent use?",
        answer:
          "Yes — larger cabins used several times a week benefit from a robust heater and good ventilation, both of which are specified for sustained use in this model.",
      },
    ],
  },
  {
    slug: "stenn-electric-heater",
    name: "Stenn Electric Heater 9kW",
    category: "sauna-heaters",
    categoryName: "Sauna Heaters",
    tagline: "Even heat, precisely controlled",
    summary:
      "A 9kW electric heater with a generous stone capacity for a soft, enveloping heat. Sized for medium to larger cabins.",
    priceFrom: 1290,
    badges: ["9kW", "Electric"],
    illustration: "heater",
    tone: "charcoal",
    highlights: [
      "Large stone capacity for a softer löyly",
      "Digital control with weekly scheduling",
      "Suited to cabins of roughly 9–15m³",
    ],
    specs: [
      { label: "Output", value: "9kW" },
      { label: "Suited to", value: "Approx. 9–15m³ cabin volume" },
      { label: "Stone capacity", value: "Up to 20kg" },
      { label: "Control", value: "Digital, schedulable" },
      { label: "Power supply", value: "Single phase, 32A" },
    ],
    delivery: "Delivered across UK mainland, typically 1–2 weeks.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "How do I know what output I need?",
        answer:
          "Heater output is matched to cabin volume, adjusted for glass area and insulation. Guided buying calculates the correct output rather than leaving you to guess.",
      },
    ],
  },
  {
    slug: "still-cold-plunge",
    name: "Still Cold Plunge",
    category: "cold-plunge",
    categoryName: "Cold Plunge",
    tagline: "The contrast that completes the ritual",
    summary:
      "An insulated cold plunge with a clean, architectural profile. Pairs with a chiller to hold a precise temperature year-round.",
    priceFrom: 4200,
    badges: ["1 person", "Insulated"],
    illustration: "plunge",
    tone: "stone",
    highlights: [
      "Heavily insulated to reduce running cost",
      "Filtration-ready, chiller-compatible",
      "Clean architectural form in natural tones",
    ],
    specs: [
      { label: "Capacity", value: "1 person" },
      { label: "Water volume", value: "Approx. 400 litres" },
      { label: "Insulation", value: "Closed-cell, full-body" },
      { label: "Compatibility", value: "Pairs with Frost Water Chiller" },
    ],
    delivery: "Delivered across UK mainland, typically 3–5 weeks.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Do I need a chiller?",
        answer:
          "Not always — but a chiller lets you hold a precise temperature year-round without ice. We size the chiller to the plunge volume and your target temperature.",
      },
    ],
  },
  {
    slug: "frost-water-chiller",
    name: "Frost Water Chiller",
    category: "chillers",
    categoryName: "Chillers",
    tagline: "Hold the cold, exactly",
    summary:
      "A water chiller that maintains a set temperature reliably, matched to plunge volume and ambient conditions.",
    priceFrom: 2400,
    badges: ["Up to 600L", "Filtration"],
    illustration: "chiller",
    tone: "mist",
    highlights: [
      "Holds a precise set temperature year-round",
      "Integrated filtration and sanitisation",
      "Quiet operation for garden settings",
    ],
    specs: [
      { label: "Suited to", value: "Plunge volumes up to 600 litres" },
      { label: "Temperature range", value: "3–15°C set point" },
      { label: "Filtration", value: "Integrated" },
      { label: "Power supply", value: "Single phase, 13A" },
    ],
    delivery: "Delivered across UK mainland, typically 2–4 weeks.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "How is the chiller sized?",
        answer:
          "Chiller capacity is matched to water volume, your target temperature and ambient conditions. Guided buying handles this calculation for you.",
      },
    ],
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

export function getFeaturedCategories(): Category[] {
  return categories;
}

export function getFeaturedProducts(limit = 4): Product[] {
  return products
    .filter((p) => p.category === "outdoor-saunas")
    .slice(0, limit);
}

export function getRelatedProducts(product: Product, limit = 3): Product[] {
  const sameCategory = products.filter(
    (p) => p.category === product.category && p.slug !== product.slug,
  );
  const others = products.filter((p) => p.category !== product.category);
  return [...sameCategory, ...others].slice(0, limit);
}
