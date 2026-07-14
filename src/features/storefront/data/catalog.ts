import type { Category, Product } from "@/types/catalog";

/**
 * Placeholder catalog.
 *
 * Product names, copy and specifications are neutral placeholders standing in
 * for real supplier data. Ratings, review counts and category sizes are
 * illustrative catalog metadata — not verified trust signals. When supplier
 * data lands, this module is replaced by a projection from the Intelligence
 * Layer and the UI is unaffected.
 *
 * Photography is limited to a small set of licensed images in /public/images;
 * categories and products without a real photograph fall back to a designed
 * tonal placeholder rather than pretending to show a product shot.
 */

/** Headline figure shown against "All Collections" in the sidebar. */
export const TOTAL_PRODUCTS = 248;

export const categories: Category[] = [
  {
    slug: "outdoor-saunas",
    name: "Outdoor Saunas",
    shortName: "Saunas",
    tagline: "The heart of the garden ritual",
    description:
      "Cabin, barrel and panoramic saunas built from slow-grown Nordic timber — sized to your garden and the way you intend to use them.",
    illustration: "sauna",
    tone: "charcoal",
    available: true,
    productCount: 24,
    image: "/images/cedar.jpg",
  },
  {
    slug: "cold-plunges",
    name: "Cold Plunges",
    shortName: "Cold Plunges",
    tagline: "Recovery, resilience, ritual",
    description:
      "Cold therapy tubs engineered to hold temperature reliably — the contrast that completes the sauna experience.",
    illustration: "plunge",
    tone: "stone",
    available: true,
    productCount: 18,
    image: "/images/dark-water.jpg",
  },
  {
    slug: "pergolas",
    name: "Pergolas",
    shortName: "Pergolas",
    tagline: "Architecture for the garden",
    description:
      "Louvred and fixed-roof pergolas that give a terrace shelter, shade and a sense of a room without walls.",
    illustration: "leaf",
    tone: "charcoal",
    available: false,
    productCount: 32,
    image: "/images/garden-after.jpg",
  },
  {
    slug: "garden-furniture",
    name: "Garden Furniture",
    shortName: "Furniture",
    tagline: "Made to live outdoors",
    description:
      "Weatherproof sofas, dining sets and loungers in materials chosen to age gracefully through every season.",
    illustration: "leaf",
    tone: "charcoal",
    available: false,
    productCount: 68,
    image: "/images/steam-lake.jpg",
  },
  {
    slug: "fire-pits",
    name: "Fire Pits & Heating",
    shortName: "Fire & Heating",
    tagline: "Warmth that draws people in",
    description:
      "Fire pits, patio heaters and flame tables that extend the evening and become the centre of gravity outdoors.",
    illustration: "leaf",
    tone: "charcoal",
    available: false,
    productCount: 41,
    image: "/images/hero-fire.jpg",
  },
  {
    slug: "outdoor-kitchens",
    name: "Outdoor Kitchens",
    shortName: "Kitchens",
    tagline: "Cook, host, gather",
    description:
      "Modular outdoor kitchens with grills, storage and prep surfaces built to withstand the weather they cook in.",
    illustration: "leaf",
    tone: "charcoal",
    available: false,
    productCount: 28,
  },
  {
    slug: "lighting",
    name: "Lighting",
    shortName: "Lighting",
    tagline: "The garden after dark",
    description:
      "Low-glare path, wall and feature lighting that shapes the garden once the sun has gone down.",
    illustration: "leaf",
    tone: "charcoal",
    available: false,
    productCount: 36,
  },
  {
    slug: "planters",
    name: "Planters",
    shortName: "Planters",
    tagline: "Structure and greenery",
    description:
      "Architectural planters in stone, steel and timber, sized for statement planting and clean lines.",
    illustration: "leaf",
    tone: "sand",
    available: false,
    productCount: 29,
  },
  {
    slug: "water-features",
    name: "Water Features",
    shortName: "Water",
    tagline: "Movement and sound",
    description:
      "Sculptural water features that bring movement, sound and calm to a courtyard or terrace.",
    illustration: "leaf",
    tone: "mist",
    available: false,
    productCount: 17,
    image: "/images/cold-ripple.jpg",
  },
  {
    slug: "outdoor-storage",
    name: "Outdoor Storage",
    shortName: "Storage",
    tagline: "Considered, out of sight",
    description:
      "Weatherproof storage that keeps cushions, tools and equipment protected without breaking the garden's lines.",
    illustration: "leaf",
    tone: "charcoal",
    available: false,
    productCount: 21,
  },
  {
    slug: "privacy-screens",
    name: "Privacy Screens",
    shortName: "Screens",
    tagline: "Seclusion, by design",
    description:
      "Slatted screens and dividers that carve private zones from open gardens and soften boundaries.",
    illustration: "leaf",
    tone: "charcoal",
    available: true,
    productCount: 14,
  },
  {
    slug: "garden-rooms",
    name: "Garden Rooms",
    shortName: "Rooms",
    tagline: "A room at the end of the garden",
    description:
      "Insulated garden rooms and studios — a workspace, gym or retreat, finished to the same standard as the house.",
    illustration: "leaf",
    tone: "charcoal",
    available: false,
    productCount: 24,
  },
  {
    slug: "wellness-accessories",
    name: "Wellness Accessories",
    shortName: "Wellness",
    tagline: "The finishing details",
    description:
      "Ladles, buckets, thermometers, oils and towels — the considered details that complete the ritual.",
    illustration: "leaf",
    tone: "sand",
    available: true,
    productCount: 12,
  },
];

export const products: Product[] = [
  {
    slug: "auroom-vista-sauna",
    name: "Auroom Vista Sauna",
    category: "outdoor-saunas",
    categoryName: "Outdoor Saunas",
    tagline: "Panoramic views, Nordic craftsmanship",
    summary:
      "The Auroom Vista Sauna combines panoramic views with Nordic craftsmanship. Designed for ultimate relaxation and built to last in all outdoor conditions.",
    priceFrom: 7995,
    sku: "AUR-VISTA",
    rating: 4.9,
    reviewCount: 28,
    badges: ["Thermowood", "Panoramic glass"],
    illustration: "sauna",
    tone: "charcoal",
    image: "/images/cedar.jpg",
    highlights: [
      "Premium Thermowood construction",
      "Panoramic tempered glass front",
      "Ergonomic seating for maximum comfort",
      "Electric heater options available",
      "Suitable for year-round outdoor use",
    ],
    options: [
      {
        label: "Size",
        values: ["Small (2–4 People)", "Medium (4–6 People)", "Large (6–8 People)"],
      },
      {
        label: "Heater option",
        values: ["Electric Heater", "Wood Burning Heater"],
      },
    ],
    specs: [
      { label: "Capacity", value: "2–8 people (by size)" },
      { label: "External footprint", value: "2.4m × 2.2m (medium)" },
      { label: "Glazing", value: "Panoramic tempered glass front" },
      { label: "Timber", value: "Thermowood / aspen interior" },
      { label: "Heater", value: "Electric or wood-burning (to order)" },
      { label: "Power supply", value: "Single phase, 32A (electric)" },
    ],
    delivery:
      "Free UK delivery, typically 3–6 weeks. White-glove installation available on request.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    relatedSlugs: [
      "chill-tubs-original",
      "harvia-cilindro-heater",
      "sauna-essentials-bundle",
      "auroom-terass-privacy-screen",
    ],
    faqs: [
      {
        question: "Electric or wood-burning?",
        answer:
          "Electric is lower-maintenance and easy to schedule; wood-burning offers a more traditional ritual but needs a flue and clearances. We match the heater to your cabin size and setup at quotation.",
      },
      {
        question: "Do I need planning permission?",
        answer:
          "In most cases an outdoor sauna falls under permitted development, but boundary distances, height and listed-building status all matter. We flag planning considerations before you commit.",
      },
      {
        question: "What base does it need?",
        answer:
          "A level, load-bearing base — paving, a concrete pad or a properly built deck. We confirm the exact base requirement against your chosen size during quotation.",
      },
    ],
  },
  {
    slug: "auroom-horizon-sauna",
    name: "Auroom Horizon Sauna",
    category: "outdoor-saunas",
    categoryName: "Outdoor Saunas",
    tagline: "A wide glass gable onto the garden",
    summary:
      "A cabin sauna with a full-width glazed gable that turns the garden into part of the ritual — the architectural centrepiece of an outdoor wellness space.",
    priceFrom: 6995,
    sku: "AUR-HRZN",
    rating: 4.8,
    reviewCount: 19,
    badges: ["4–6 person", "Panoramic glass"],
    illustration: "sauna",
    tone: "charcoal",
    image: "/images/steam-lake.jpg",
    highlights: [
      "Full-width panoramic glazed gable",
      "Triple-glazed for heat retention",
      "Generous twin-bench layout in clear aspen",
      "Specified for frequent, sustained use",
    ],
    options: [
      {
        label: "Size",
        values: ["Medium (4–6 People)", "Large (6–8 People)"],
      },
      { label: "Heater option", values: ["Electric Heater", "Wood Burning Heater"] },
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
      "Free UK delivery, typically 4–8 weeks. Delivered and installed by specialist team.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Does the large glass area affect heating?",
        answer:
          "A larger glass area increases heat loss, which is why this model is triple-glazed and specified with a correctly sized heater. Our sizing accounts for glass area automatically.",
      },
    ],
  },
  {
    slug: "aalto-cabin-sauna",
    name: "Aalto Cabin Sauna",
    category: "outdoor-saunas",
    categoryName: "Outdoor Saunas",
    tagline: "A quiet two-to-three person retreat",
    summary:
      "A compact cabin sauna in slow-grown Nordic spruce, designed for smaller gardens without compromising on the bench depth and ceiling height that make a session feel generous.",
    priceFrom: 8900,
    sku: "KAI-AALTO",
    rating: 4.9,
    reviewCount: 34,
    badges: ["2–3 person", "Electric"],
    illustration: "sauna",
    tone: "charcoal",
    image: "/images/cedar.jpg",
    highlights: [
      "Slow-grown Nordic spruce, kiln-dried for stability",
      "Full-height glass door for a sense of openness",
      "Ergonomic two-tier benching in knot-free aspen",
    ],
    options: [
      { label: "Heater option", values: ["Electric Heater", "Wood Burning Heater"] },
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
      "A barrel sauna whose curved profile heats quickly and evenly — a natural choice for gardens where a cabin would feel too architectural.",
    priceFrom: 6900,
    sku: "KAI-NORDR",
    rating: 4.7,
    reviewCount: 22,
    badges: ["4 person", "Electric or wood"],
    illustration: "barrel",
    tone: "charcoal",
    image: "/images/steam-lake.jpg",
    highlights: [
      "Curved form heats quickly and circulates evenly",
      "Available with electric or wood-burning heater",
      "Tongue-and-groove thermowood staves",
    ],
    options: [
      { label: "Heater option", values: ["Electric Heater", "Wood Burning Heater"] },
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
        question: "How long does it take to heat?",
        answer:
          "A barrel's curved form heats relatively quickly — typically 30–45 minutes depending on heater and ambient temperature.",
      },
    ],
  },
  {
    slug: "harvia-cilindro-heater",
    name: "Harvia Cilindro Heater",
    category: "outdoor-saunas",
    categoryName: "Outdoor Saunas",
    tagline: "Even heat, precisely controlled",
    summary:
      "A cylindrical electric heater with a generous stone capacity for a soft, enveloping heat. Sized to your cabin volume, glass area and the löyly you want.",
    priceFrom: 1095,
    sku: "HAR-CIL",
    rating: 4.8,
    reviewCount: 41,
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
    delivery: "Free UK delivery, typically 1–2 weeks.",
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
    slug: "chill-tubs-original",
    name: "Chill Tubs Original",
    category: "cold-plunges",
    categoryName: "Cold Plunges",
    tagline: "The contrast that completes the ritual",
    summary:
      "An insulated cold plunge with an integrated chiller and filtration, holding a precise temperature year-round without ice — the recovery half of the sauna ritual.",
    priceFrom: 4750,
    sku: "CHL-ORIG",
    rating: 4.9,
    reviewCount: 52,
    badges: ["1–2 person", "Integrated chiller"],
    illustration: "plunge",
    tone: "stone",
    image: "/images/dark-water.jpg",
    highlights: [
      "Integrated chiller holds a precise set temperature",
      "Built-in filtration and sanitisation",
      "Heavily insulated to reduce running cost",
      "Clean, architectural stainless form",
    ],
    specs: [
      { label: "Capacity", value: "1–2 people" },
      { label: "Water volume", value: "Approx. 500 litres" },
      { label: "Temperature range", value: "3–15°C set point" },
      { label: "Filtration", value: "Integrated" },
      { label: "Power supply", value: "Single phase, 13A" },
    ],
    delivery: "Free UK delivery, typically 2–4 weeks.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Does it need a separate chiller?",
        answer:
          "No — the chiller and filtration are integrated, so it holds a precise temperature year-round out of the box.",
      },
    ],
  },
  {
    slug: "still-cold-plunge",
    name: "Still Cold Plunge",
    category: "cold-plunges",
    categoryName: "Cold Plunges",
    tagline: "A quiet, architectural plunge",
    summary:
      "An insulated cold plunge with a clean, architectural profile. Filtration-ready and chiller-compatible for a precise temperature all year.",
    priceFrom: 4200,
    sku: "KAI-STILL",
    rating: 4.7,
    reviewCount: 16,
    badges: ["1 person", "Insulated"],
    illustration: "plunge",
    tone: "mist",
    image: "/images/cold-ripple.jpg",
    highlights: [
      "Heavily insulated to reduce running cost",
      "Filtration-ready, chiller-compatible",
      "Clean architectural form in natural tones",
    ],
    specs: [
      { label: "Capacity", value: "1 person" },
      { label: "Water volume", value: "Approx. 400 litres" },
      { label: "Insulation", value: "Closed-cell, full-body" },
      { label: "Compatibility", value: "Pairs with an in-line chiller" },
    ],
    delivery: "Free UK delivery, typically 3–5 weeks.",
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
    slug: "sauna-essentials-bundle",
    name: "Sauna Essentials Bundle",
    category: "wellness-accessories",
    categoryName: "Wellness Accessories",
    tagline: "The finishing details, together",
    summary:
      "A curated set of the essentials — ladle, bucket, sand timer, thermometer/hygrometer and a pair of pure essential oils — chosen to complete a new sauna.",
    priceFrom: 195,
    sku: "KAI-ESSNT",
    rating: 4.8,
    reviewCount: 63,
    badges: ["Bundle", "Aspen & steel"],
    illustration: "leaf",
    tone: "sand",
    highlights: [
      "Aspen ladle and bucket with steel liner",
      "Combined thermometer and hygrometer",
      "Sand timer and two pure essential oils",
    ],
    specs: [
      { label: "Includes", value: "Ladle, bucket, timer, gauge, oils" },
      { label: "Materials", value: "Aspen, stainless steel, glass" },
      { label: "Bucket capacity", value: "4 litres" },
    ],
    delivery: "Free UK delivery, typically 3–5 working days.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Will it suit any sauna?",
        answer:
          "Yes — the set is brand-agnostic and suits any traditional or infrared cabin. The oils are formulated for use with a water-ladle heater.",
      },
    ],
  },
  {
    slug: "auroom-terass-privacy-screen",
    name: "Auroom Terass Privacy Screen",
    category: "privacy-screens",
    categoryName: "Privacy Screens",
    tagline: "Slatted seclusion for a terrace",
    summary:
      "A slatted Thermowood privacy screen that carves a private zone around a sauna or seating area while keeping sightlines soft and the palette warm.",
    priceFrom: 1250,
    sku: "AUR-TERASS",
    rating: 4.7,
    reviewCount: 11,
    badges: ["Thermowood", "Modular"],
    illustration: "leaf",
    tone: "charcoal",
    highlights: [
      "Thermowood slats, matched to the sauna range",
      "Modular panels for runs of any length",
      "Concealed fixings for a clean face",
    ],
    specs: [
      { label: "Panel size", value: "1.8m × 1.8m" },
      { label: "Timber", value: "Thermowood" },
      { label: "Fixing", value: "Post or wall-mounted" },
    ],
    delivery: "Free UK delivery, typically 2–4 weeks.",
    warranty:
      "Comprehensive manufacturer warranty — exact terms confirmed at quotation.",
    faqs: [
      {
        question: "Can it follow a run of any length?",
        answer:
          "Yes — the panels are modular and post-mounted, so a screen can follow a boundary or wrap a seating area to whatever length you need.",
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

export function getProductsBySlugs(slugs: string[]): Product[] {
  return slugs
    .map((slug) => getProduct(slug))
    .filter((p): p is Product => Boolean(p));
}

export function getFeaturedCategories(limit?: number): Category[] {
  return typeof limit === "number" ? categories.slice(0, limit) : categories;
}

export function getFeaturedProducts(limit = 4): Product[] {
  return products
    .filter((p) => p.category === "outdoor-saunas")
    .slice(0, limit);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  if (product.relatedSlugs?.length) {
    const curated = getProductsBySlugs(product.relatedSlugs).filter(
      (p) => p.slug !== product.slug,
    );
    if (curated.length) return curated.slice(0, limit);
  }
  const sameCategory = products.filter(
    (p) => p.category === product.category && p.slug !== product.slug,
  );
  const others = products.filter(
    (p) => p.category !== product.category && p.slug !== product.slug,
  );
  return [...sameCategory, ...others].slice(0, limit);
}
