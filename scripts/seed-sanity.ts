/**
 * One-time seed script — pushes the existing static catalog (13 categories,
 * 9 products) plus one of every other document type into Sanity, so the
 * Studio and the rewired frontend have real content to work against instead
 * of an empty dataset.
 *
 * Deliberately outside src/: it needs a write-scoped API token that must
 * never be part of the app's own runtime environment. Reads
 * SANITY_API_WRITE_TOKEN directly from process.env (see .env.example) —
 * NOT validated by the strict src/env.ts schema, since it's only needed to
 * run this script once, not for the app to build or serve requests.
 *
 * Every document uses a deterministic _id (e.g. "product-aalto-cabin-sauna")
 * so re-running this script is safe — createOrReplace() overwrites in place
 * rather than creating duplicates.
 *
 * Run with: pnpm seed
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in your environment.\n" +
      "Set both in .env.local (see .env.example) before running `pnpm seed`.\n" +
      "The write token needs Editor permission — create one at sanity.io/manage under the project's API settings.",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

// --- Image upload, deduped by local path -----------------------------------

const assetCache = new Map<string, string>();

async function uploadImage(relativePath: string): Promise<string> {
  const cached = assetCache.get(relativePath);
  if (cached) return cached;

  const absolutePath = path.join(projectRoot, "public", relativePath);
  const buffer = fs.readFileSync(absolutePath);
  const asset = await client.assets.upload("image", buffer, {
    filename: path.basename(relativePath),
  });
  assetCache.set(relativePath, asset._id);
  console.log(`  uploaded ${relativePath} -> ${asset._id}`);
  return asset._id;
}

function imageField(assetId: string) {
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

function ref(id: string) {
  return { _type: "reference", _ref: id };
}

// --- Departments -------------------------------------------------------------

const DEPARTMENTS = [
  { slug: "outdoor-living", title: "Outdoor Living", order: 0 },
  { slug: "living-room", title: "Living Room", order: 1 },
  { slug: "bedroom", title: "Bedroom", order: 2 },
  { slug: "kitchen", title: "Kitchen", order: 3 },
  { slug: "office", title: "Office", order: 4 },
  { slug: "bathroom", title: "Bathroom", order: 5 },
  { slug: "lighting", title: "Lighting", order: 6 },
  { slug: "decor", title: "Decor", order: 7 },
];

async function seedDepartments() {
  console.log("Departments...");
  for (const dept of DEPARTMENTS) {
    await client.createOrReplace({
      _id: `department-${dept.slug}`,
      _type: "department",
      title: dept.title,
      slug: { _type: "slug", current: dept.slug },
      order: dept.order,
    });
  }
}

// --- Brands --------------------------------------------------------------

const BRANDS = [
  { slug: "auroom", name: "Auroom" },
  { slug: "harvia", name: "Harvia" },
];

async function seedBrands() {
  console.log("Brands...");
  for (const brand of BRANDS) {
    await client.createOrReplace({
      _id: `brand-${brand.slug}`,
      _type: "brand",
      name: brand.name,
      slug: { _type: "slug", current: brand.slug },
    });
  }
}

// --- Categories ------------------------------------------------------------

const CATEGORY_ICONS: Record<string, string> = {
  "outdoor-saunas": "warehouse",
  "cold-plunges": "droplets",
  pergolas: "columns3",
  "garden-furniture": "sofa",
  "fire-pits": "flame",
  "outdoor-kitchens": "cooking-pot",
  lighting: "lightbulb",
  planters: "sprout",
  "water-features": "waves",
  "outdoor-storage": "package",
  "privacy-screens": "rows3",
  "garden-rooms": "home",
  "wellness-accessories": "leaf",
};

const CATEGORIES = [
  {
    slug: "outdoor-saunas",
    title: "Outdoor Saunas",
    tagline: "The heart of the garden ritual",
    description:
      "Cabin, barrel and panoramic saunas built from slow-grown Nordic timber — sized to your garden and the way you intend to use them.",
    image: "images/cedar.jpg",
    order: 0,
  },
  {
    slug: "cold-plunges",
    title: "Cold Plunges",
    tagline: "Recovery, resilience, ritual",
    description:
      "Cold therapy tubs engineered to hold temperature reliably — the contrast that completes the sauna experience.",
    image: "images/dark-water.jpg",
    order: 1,
  },
  {
    slug: "pergolas",
    title: "Pergolas",
    tagline: "Architecture for the garden",
    description:
      "Louvred and fixed-roof pergolas that give a terrace shelter, shade and a sense of a room without walls.",
    image: "images/garden-after.jpg",
    order: 2,
  },
  {
    slug: "garden-furniture",
    title: "Garden Furniture",
    tagline: "Made to live outdoors",
    description:
      "Weatherproof sofas, dining sets and loungers in materials chosen to age gracefully through every season.",
    image: "images/steam-lake.jpg",
    order: 3,
  },
  {
    slug: "fire-pits",
    title: "Fire Pits & Heating",
    tagline: "Warmth that draws people in",
    description:
      "Fire pits, patio heaters and flame tables that extend the evening and become the centre of gravity outdoors.",
    image: "images/hero-fire.jpg",
    order: 4,
  },
  {
    slug: "outdoor-kitchens",
    title: "Outdoor Kitchens",
    tagline: "Cook, host, gather",
    description:
      "Modular outdoor kitchens with grills, storage and prep surfaces built to withstand the weather they cook in.",
    order: 5,
  },
  {
    slug: "lighting",
    title: "Lighting",
    tagline: "The garden after dark",
    description:
      "Low-glare path, wall and feature lighting that shapes the garden once the sun has gone down.",
    order: 6,
  },
  {
    slug: "planters",
    title: "Planters",
    tagline: "Structure and greenery",
    description:
      "Architectural planters in stone, steel and timber, sized for statement planting and clean lines.",
    order: 7,
  },
  {
    slug: "water-features",
    title: "Water Features",
    tagline: "Movement and sound",
    description:
      "Sculptural water features that bring movement, sound and calm to a courtyard or terrace.",
    image: "images/cold-ripple.jpg",
    order: 8,
  },
  {
    slug: "outdoor-storage",
    title: "Outdoor Storage",
    tagline: "Considered, out of sight",
    description:
      "Weatherproof storage that keeps cushions, tools and equipment protected without breaking the garden's lines.",
    order: 9,
  },
  {
    slug: "privacy-screens",
    title: "Privacy Screens",
    tagline: "Seclusion, by design",
    description:
      "Slatted screens and dividers that carve private zones from open gardens and soften boundaries.",
    order: 10,
  },
  {
    slug: "garden-rooms",
    title: "Garden Rooms",
    tagline: "A room at the end of the garden",
    description:
      "Insulated garden rooms and studios — a workspace, gym or retreat, finished to the same standard as the house.",
    order: 11,
  },
  {
    slug: "wellness-accessories",
    title: "Wellness Accessories",
    tagline: "The finishing details",
    description:
      "Ladles, buckets, thermometers, oils and towels — the considered details that complete the ritual.",
    order: 12,
  },
];

async function seedCategories() {
  console.log("Categories...");
  for (const cat of CATEGORIES) {
    const heroImage = cat.image
      ? imageField(await uploadImage(cat.image))
      : undefined;
    await client.createOrReplace({
      _id: `category-${cat.slug}`,
      _type: "category",
      title: cat.title,
      slug: { _type: "slug", current: cat.slug },
      department: ref("department-outdoor-living"),
      tagline: cat.tagline,
      description: cat.description,
      iconName: CATEGORY_ICONS[cat.slug] ?? "leaf",
      comingSoon: false,
      order: cat.order,
      ...(heroImage ? { heroImage } : {}),
    });
  }
}

// --- Products ----------------------------------------------------------------

const PRODUCTS = [
  {
    slug: "auroom-vista-sauna",
    title: "Auroom Vista Sauna",
    category: "outdoor-saunas",
    brand: "auroom",
    tagline: "Panoramic views, Nordic craftsmanship",
    summary:
      "The Auroom Vista Sauna combines panoramic views with Nordic craftsmanship. Designed for ultimate relaxation and built to last in all outdoor conditions.",
    price: 7995,
    sku: "AUR-VISTA",
    rating: 4.9,
    reviewCount: 28,
    badges: ["Thermowood", "Panoramic glass"],
    image: "images/cedar.jpg",
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
        values: [
          "Small (2–4 People)",
          "Medium (4–6 People)",
          "Large (6–8 People)",
        ],
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
    deliveryLeadTime: "3–6 weeks",
    deliveryNotes:
      "Free UK delivery, typically 3–6 weeks. White-glove installation available on request.",
    warrantyNotes:
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
    title: "Auroom Horizon Sauna",
    category: "outdoor-saunas",
    brand: "auroom",
    tagline: "A wide glass gable onto the garden",
    summary:
      "A cabin sauna with a full-width glazed gable that turns the garden into part of the ritual — the architectural centrepiece of an outdoor wellness space.",
    price: 6995,
    sku: "AUR-HRZN",
    rating: 4.8,
    reviewCount: 19,
    badges: ["4–6 person", "Panoramic glass"],
    image: "images/steam-lake.jpg",
    highlights: [
      "Full-width panoramic glazed gable",
      "Triple-glazed for heat retention",
      "Generous twin-bench layout in clear aspen",
      "Specified for frequent, sustained use",
    ],
    options: [
      { label: "Size", values: ["Medium (4–6 People)", "Large (6–8 People)"] },
      {
        label: "Heater option",
        values: ["Electric Heater", "Wood Burning Heater"],
      },
    ],
    specs: [
      { label: "Capacity", value: "4–6 people" },
      { label: "External footprint", value: "2.4m × 2.2m" },
      { label: "Glazing", value: "Triple-glazed panoramic gable" },
      { label: "Timber", value: "Nordic spruce / aspen interior" },
      { label: "Heater", value: "Electric, 9kW (sized to order)" },
      { label: "Power supply", value: "Single phase, 32A" },
    ],
    deliveryLeadTime: "4–8 weeks",
    deliveryNotes:
      "Free UK delivery, typically 4–8 weeks. Delivered and installed by specialist team.",
    warrantyNotes:
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
    title: "Aalto Cabin Sauna",
    category: "outdoor-saunas",
    tagline: "A quiet two-to-three person retreat",
    summary:
      "A compact cabin sauna in slow-grown Nordic spruce, designed for smaller gardens without compromising on the bench depth and ceiling height that make a session feel generous.",
    price: 8900,
    sku: "KAI-AALTO",
    rating: 4.9,
    reviewCount: 34,
    badges: ["2–3 person", "Electric"],
    image: "images/cedar.jpg",
    highlights: [
      "Slow-grown Nordic spruce, kiln-dried for stability",
      "Full-height glass door for a sense of openness",
      "Ergonomic two-tier benching in knot-free aspen",
    ],
    options: [
      {
        label: "Heater option",
        values: ["Electric Heater", "Wood Burning Heater"],
      },
    ],
    specs: [
      { label: "Capacity", value: "2–3 people" },
      { label: "External footprint", value: "1.9m × 1.7m" },
      { label: "Internal height", value: "2.1m" },
      { label: "Timber", value: "Nordic spruce / aspen interior" },
      { label: "Heater", value: "Electric, 6–8kW (sized to order)" },
      { label: "Power supply", value: "Single phase, 32A recommended" },
    ],
    deliveryLeadTime: "4–8 weeks",
    deliveryNotes:
      "Kerbside delivery across UK mainland, typically 4–8 weeks. White-glove installation available on request.",
    warrantyNotes:
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
    title: "Nordr Barrel Sauna",
    category: "outdoor-saunas",
    tagline: "The classic form, faithfully made",
    summary:
      "A barrel sauna whose curved profile heats quickly and evenly — a natural choice for gardens where a cabin would feel too architectural.",
    price: 6900,
    sku: "KAI-NORDR",
    rating: 4.7,
    reviewCount: 22,
    badges: ["4 person", "Electric or wood"],
    image: "images/steam-lake.jpg",
    highlights: [
      "Curved form heats quickly and circulates evenly",
      "Available with electric or wood-burning heater",
      "Tongue-and-groove thermowood staves",
    ],
    options: [
      {
        label: "Heater option",
        values: ["Electric Heater", "Wood Burning Heater"],
      },
    ],
    specs: [
      { label: "Capacity", value: "4 people" },
      { label: "Length", value: "2.4m" },
      { label: "Diameter", value: "2.0m" },
      { label: "Timber", value: "Thermowood / spruce" },
      { label: "Heater", value: "Electric 8kW or wood-burning" },
      { label: "Power supply", value: "Single phase (electric option)" },
    ],
    deliveryLeadTime: "4–8 weeks",
    deliveryNotes:
      "Kerbside delivery across UK mainland, typically 4–8 weeks. Assembly available on request.",
    warrantyNotes:
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
    title: "Harvia Cilindro Heater",
    category: "outdoor-saunas",
    brand: "harvia",
    tagline: "Even heat, precisely controlled",
    summary:
      "A cylindrical electric heater with a generous stone capacity for a soft, enveloping heat. Sized to your cabin volume, glass area and the löyly you want.",
    price: 1095,
    sku: "HAR-CIL",
    rating: 4.8,
    reviewCount: 41,
    badges: ["9kW", "Electric"],
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
    deliveryLeadTime: "1–2 weeks",
    deliveryNotes: "Free UK delivery, typically 1–2 weeks.",
    warrantyNotes:
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
    title: "Chill Tubs Original",
    category: "cold-plunges",
    tagline: "The contrast that completes the ritual",
    summary:
      "An insulated cold plunge with an integrated chiller and filtration, holding a precise temperature year-round without ice — the recovery half of the sauna ritual.",
    price: 4750,
    sku: "CHL-ORIG",
    rating: 4.9,
    reviewCount: 52,
    badges: ["1–2 person", "Integrated chiller"],
    image: "images/dark-water.jpg",
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
    deliveryLeadTime: "2–4 weeks",
    deliveryNotes: "Free UK delivery, typically 2–4 weeks.",
    warrantyNotes:
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
    title: "Still Cold Plunge",
    category: "cold-plunges",
    tagline: "A quiet, architectural plunge",
    summary:
      "An insulated cold plunge with a clean, architectural profile. Filtration-ready and chiller-compatible for a precise temperature all year.",
    price: 4200,
    sku: "KAI-STILL",
    rating: 4.7,
    reviewCount: 16,
    badges: ["1 person", "Insulated"],
    image: "images/cold-ripple.jpg",
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
    deliveryLeadTime: "3–5 weeks",
    deliveryNotes: "Free UK delivery, typically 3–5 weeks.",
    warrantyNotes:
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
    title: "Sauna Essentials Bundle",
    category: "wellness-accessories",
    tagline: "The finishing details, together",
    summary:
      "A curated set of the essentials — ladle, bucket, sand timer, thermometer/hygrometer and a pair of pure essential oils — chosen to complete a new sauna.",
    price: 195,
    sku: "KAI-ESSNT",
    rating: 4.8,
    reviewCount: 63,
    badges: ["Bundle", "Aspen & steel"],
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
    deliveryLeadTime: "3–5 working days",
    deliveryNotes: "Free UK delivery, typically 3–5 working days.",
    warrantyNotes:
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
    title: "Auroom Terass Privacy Screen",
    category: "privacy-screens",
    brand: "auroom",
    tagline: "Slatted seclusion for a terrace",
    summary:
      "A slatted Thermowood privacy screen that carves a private zone around a sauna or seating area while keeping sightlines soft and the palette warm.",
    price: 1250,
    sku: "AUR-TERASS",
    rating: 4.7,
    reviewCount: 11,
    badges: ["Thermowood", "Modular"],
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
    deliveryLeadTime: "2–4 weeks",
    deliveryNotes: "Free UK delivery, typically 2–4 weeks.",
    warrantyNotes:
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

async function seedProducts() {
  console.log("Products...");
  // Two passes: products can reference each other via relatedSlugs, so every
  // product must exist before any relatedProducts reference is written —
  // otherwise Sanity rejects the mutation with a dangling-reference error.
  for (const p of PRODUCTS) {
    const gallery = p.image ? [imageField(await uploadImage(p.image))] : [];
    await client.createOrReplace({
      _id: `product-${p.slug}`,
      _type: "product",
      title: p.title,
      slug: { _type: "slug", current: p.slug },
      category: ref(`category-${p.category}`),
      ...(p.brand ? { brand: ref(`brand-${p.brand}`) } : {}),
      tagline: p.tagline,
      summary: p.summary,
      price: p.price,
      currency: "GBP",
      sku: p.sku,
      rating: p.rating,
      reviewCount: p.reviewCount,
      badges: p.badges,
      highlights: p.highlights,
      specs: p.specs,
      options: p.options ?? [],
      gallery,
      deliveryLeadTime: p.deliveryLeadTime,
      deliveryNotes: p.deliveryNotes,
      warrantyNotes: p.warrantyNotes,
      stockStatus: "In Stock",
      faqs: p.faqs,
    });
  }
  for (const p of PRODUCTS) {
    if (!p.relatedSlugs?.length) continue;
    await client
      .patch(`product-${p.slug}`)
      .set({
        relatedProducts: p.relatedSlugs.map((slug) => ref(`product-${slug}`)),
      })
      .commit();
  }
}

// --- Author, Post, Buying Guide, FAQs ----------------------------------------

async function seedEditorial() {
  console.log("Author, post, buying guide, FAQs...");

  await client.createOrReplace({
    _id: "author-kaiku-editorial",
    _type: "author",
    name: "Kaiku Editorial",
    slug: { _type: "slug", current: "kaiku-editorial" },
    role: "Editorial Team",
    bio: "Considered writing on garden wellness and outdoor living.",
  });

  await client.createOrReplace({
    _id: "buyingGuide-choosing-a-sauna",
    _type: "buyingGuide",
    title: "Barrel or cabin: choosing the right outdoor sauna",
    slug: { _type: "slug", current: "choosing-a-sauna" },
    excerpt:
      "Two classic forms, two different experiences. Here's how to think about which suits your garden.",
    author: ref("author-kaiku-editorial"),
    relatedCategory: ref("category-outdoor-saunas"),
    relatedProducts: [
      ref("product-auroom-vista-sauna"),
      ref("product-nordr-barrel-sauna"),
    ],
    publishedAt: new Date().toISOString(),
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "A barrel sauna's curved profile heats quickly and circulates evenly, and its lower material cost makes it an approachable starting point. A cabin sauna offers a taller ceiling, a more architectural presence in the garden, and — on panoramic models — a full glass gable that turns the view into part of the ritual.",
          },
        ],
      },
      {
        _type: "block",
        _key: "b2",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s2",
            text: "Both heat with electric or wood-burning heaters. Electric is lower-maintenance and easy to schedule; wood-burning is more traditional but needs a flue and clearances. Whichever you choose, the base matters as much as the cabin — a level, load-bearing surface is non-negotiable.",
          },
        ],
      },
    ],
  });

  await client.createOrReplace({
    _id: "post-sauna-ritual",
    _type: "post",
    title: "Building a weekly sauna ritual that actually sticks",
    slug: { _type: "slug", current: "building-a-sauna-ritual" },
    excerpt:
      "The difference between a sauna that gets used and one that becomes storage is usually the ritual around it, not the cabin itself.",
    author: ref("author-kaiku-editorial"),
    tags: ["wellness", "saunas"],
    publishedAt: new Date().toISOString(),
    body: [
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "Pick a fixed time, not a spare moment — a sauna that's scheduled gets used; a sauna that's optional becomes storage. Twenty minutes, twice a week, is a realistic starting point.",
          },
        ],
      },
    ],
  });

  const faqs: {
    question: string;
    answer: string;
    topic: string;
    order: number;
  }[] = [
    {
      question: "Do I need planning permission for an outdoor sauna?",
      answer:
        "In most cases an outdoor sauna falls under permitted development, but boundary distances, height and listed-building status all matter. We flag planning considerations before you commit.",
      topic: "Products",
      order: 0,
    },
    {
      question: "What areas do you deliver to?",
      answer:
        "We deliver across UK mainland. Delivery windows are shown on each product page and confirmed again at checkout.",
      topic: "Delivery",
      order: 0,
    },
    {
      question: "Can I return a product if it doesn't fit my space?",
      answer:
        "Yes — see our Returns page for the full policy and timeframes for made-to-order items.",
      topic: "Returns",
      order: 0,
    },
    {
      question: "Do you offer trade or installer pricing?",
      answer:
        "Yes — get in touch via the Contact page and our team will set up a trade account.",
      topic: "Trade",
      order: 0,
    },
  ];
  for (const [i, faq] of faqs.entries()) {
    await client.createOrReplace({ _id: `faq-${i}`, _type: "faq", ...faq });
  }
}

// --- Pages (Contact/Returns/Delivery/Privacy/Terms/About) -------------------

function textBlock(text: string) {
  return {
    _type: "block",
    _key: `b-${text.slice(0, 12).replace(/\W/g, "")}`,
    style: "normal",
    children: [{ _type: "span", _key: "s", text }],
  };
}

const PAGES = [
  {
    slug: "about",
    title: "About Kaiku",
    intro: "A knowledge-first retailer for garden wellness and outdoor living.",
    body: [
      textBlock(
        "Kaiku exists to make garden wellness — saunas, cold plunge, and the outdoor living around them — approachable, correctly specified, and built to last. We're a small team; replace this page with your real story.",
      ),
    ],
  },
  {
    slug: "contact",
    title: "Contact Us",
    intro: "We're here to help with sizing, planning and anything else.",
    body: [
      textBlock(
        "Editable placeholder — add your real contact details, hours and address in Studio. A contact form component can be added to the /contact route separately from this copy.",
      ),
    ],
  },
  {
    slug: "returns",
    title: "Returns",
    intro: "Our returns policy for standard and made-to-order items.",
    body: [
      textBlock(
        "Draft placeholder — replace with your actual returns policy, including timeframes, condition requirements, and any exceptions for made-to-order or bespoke items, before launch.",
      ),
    ],
  },
  {
    slug: "delivery",
    title: "Delivery",
    intro: "What to expect once you've placed an order.",
    body: [
      textBlock(
        "Draft placeholder — replace with your actual delivery process, lead times by product category, and installation options before launch.",
      ),
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    intro:
      "DRAFT PLACEHOLDER — this page has not been reviewed by a lawyer. Replace with your actual, reviewed privacy policy before accepting real customer data.",
    body: [
      textBlock(
        "This is a placeholder Privacy Policy generated during initial setup. It is not legal advice and must not be published as-is. Replace this content with a policy reviewed against UK GDPR and your actual data practices before the site goes live.",
      ),
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    intro:
      "DRAFT PLACEHOLDER — this page has not been reviewed by a lawyer. Replace with your actual, reviewed terms before accepting real orders.",
    body: [
      textBlock(
        "This is a placeholder Terms & Conditions generated during initial setup. It is not legal advice and must not be published as-is. Replace this content with terms reviewed for UK consumer law before the site goes live.",
      ),
    ],
  },
];

async function seedPages() {
  console.log("Pages...");
  for (const page of PAGES) {
    await client.createOrReplace({
      _id: `page-${page.slug}`,
      _type: "page",
      title: page.title,
      slug: { _type: "slug", current: page.slug },
      intro: page.intro,
      body: page.body,
    });
  }
}

// --- Site settings, SEO defaults, navigation, homepage -----------------------

async function seedSiteSettings() {
  console.log("Site settings, SEO defaults...");
  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    siteName: "Kaiku",
    legalName: "Project Kaiku Ltd",
    tagline: "Garden wellness, considered",
    description:
      "A considered approach to garden wellness. Outdoor saunas, cold plunge and recovery — chosen with expert guidance, built to last a lifetime.",
    email: "hello@example.com",
    phone: "+44 (0)20 0000 0000",
    defaultCurrency: "GBP",
  });

  await client.createOrReplace({
    _id: "seoDefaults",
    _type: "seoDefaults",
    defaultMetaTitleTemplate: "%s — Kaiku",
    defaultMetaDescription:
      "A considered approach to garden wellness. Outdoor saunas, cold plunge and recovery — chosen with expert guidance, built to last a lifetime.",
    robotsIndexByDefault: true,
  });
}

async function seedNavigation() {
  console.log("Navigation...");
  await client.createOrReplace({
    _id: "navigation",
    _type: "navigation",
    headerLinks: [
      {
        _type: "headerLink",
        _key: "shop",
        link: {
          _type: "link",
          label: "Shop",
          linkType: "internal",
          internalRef: ref("category-outdoor-saunas"),
        },
        children: [
          {
            _type: "link",
            _key: "c1",
            label: "Outdoor Saunas",
            linkType: "internal",
            internalRef: ref("category-outdoor-saunas"),
          },
          {
            _type: "link",
            _key: "c2",
            label: "Cold Plunges",
            linkType: "internal",
            internalRef: ref("category-cold-plunges"),
          },
          {
            _type: "link",
            _key: "c3",
            label: "Pergolas",
            linkType: "internal",
            internalRef: ref("category-pergolas"),
          },
        ],
      },
    ],
    collectionsBarLinks: CATEGORIES.slice(0, 6).map((cat, i) => ({
      _type: "link",
      _key: `cb${i}`,
      label: cat.title,
      linkType: "internal",
      internalRef: ref(`category-${cat.slug}`),
    })),
    footerColumns: [
      {
        _type: "footerColumn",
        _key: "shop",
        title: "Shop",
        links: CATEGORIES.slice(0, 5).map((cat, i) => ({
          _type: "link",
          _key: `f${i}`,
          label: cat.title,
          linkType: "internal",
          internalRef: ref(`category-${cat.slug}`),
        })),
      },
      {
        _type: "footerColumn",
        _key: "company",
        title: "Company",
        links: [
          {
            _type: "link",
            _key: "about",
            label: "About",
            linkType: "internal",
            internalRef: ref("page-about"),
          },
          {
            _type: "link",
            _key: "contact",
            label: "Contact",
            linkType: "internal",
            internalRef: ref("page-contact"),
          },
        ],
      },
    ],
  });
}

async function seedHomepage() {
  console.log("Homepage...");
  const heroImage = imageField(await uploadImage("images/garden-after.jpg"));
  const gardenStudioBeforeImage = imageField(
    await uploadImage("images/garden-before.jpg"),
  );
  const gardenStudioAfterImage = imageField(
    await uploadImage("images/garden-after.jpg"),
  );
  const gardenStudioImages = await Promise.all(
    [
      "images/garden-after.jpg",
      "images/cedar.jpg",
      "images/steam-lake.jpg",
      "images/dark-water.jpg",
    ].map(async (p) => imageField(await uploadImage(p))),
  );

  await client.createOrReplace({
    _id: "homepage",
    _type: "homepage",
    heroEyebrow: "Outdoor Living, Reimagined",
    heroHeadline: "Spaces that slow",
    heroHighlight: "life down",
    heroSubcopy:
      "Timeless design. Premium materials. Beautiful spaces, built for life outdoors.",
    heroImage,
    heroCtaPrimary: {
      _type: "link",
      label: "Explore Collections",
      linkType: "internal",
      internalRef: ref("category-outdoor-saunas"),
    },
    heroCtaSecondary: {
      _type: "link",
      label: "Our Story",
      linkType: "internal",
      internalRef: ref("page-about"),
    },
    heroFeaturedProduct: ref("product-auroom-horizon-sauna"),
    trustBarItems: [
      {
        _type: "trustBarItem",
        _key: "t1",
        iconName: "truck",
        title: "Premium Delivery",
        copy: "White glove delivery across the UK",
      },
      {
        _type: "trustBarItem",
        _key: "t2",
        iconName: "shield-check",
        title: "Quality Guaranteed",
        copy: "The finest materials, built to last",
      },
      {
        _type: "trustBarItem",
        _key: "t3",
        iconName: "sparkles",
        title: "Designed to Inspire",
        copy: "Timeless pieces for beautiful spaces",
      },
      {
        _type: "trustBarItem",
        _key: "t4",
        iconName: "headset",
        title: "Expert Support",
        copy: "Our team is here to help you every step",
      },
    ],
    shopByCategoryEyebrow: "Shop by Category",
    shopByCategoryTiles: [
      "pergolas",
      "garden-furniture",
      "outdoor-saunas",
      "outdoor-kitchens",
      "fire-pits",
    ].map((slug, i) => ({
      _type: "categoryTile",
      _key: `tile${i}`,
      category: ref(`category-${slug}`),
    })),
    gardenStudioEyebrow: "Garden Studio",
    gardenStudioHeadline: "See it. Love it. Live in it.",
    gardenStudioBody:
      "Transform your space with Garden Studio. Upload a photo of your garden and explore endless possibilities — see your future space before you commit to it.",
    gardenStudioBeforeImage,
    gardenStudioAfterImage,
    gardenStudioImages,
    gardenStudioCta: {
      _type: "link",
      label: "Visualise Your Garden",
      linkType: "internal",
      internalRef: ref("page-about"),
    },
    designedForLivingHeadline: "Timeless pieces. Beautiful spaces.",
    designedForLivingCards: [
      {
        _type: "livingCard",
        _key: "c1",
        title: "Sustainable Choices",
        copy: "Thoughtfully sourced, responsibly made.",
        image: imageField(await uploadImage("images/cedar.jpg")),
      },
      {
        _type: "livingCard",
        _key: "c2",
        title: "Built to Last",
        copy: "Premium materials that stand the test of time.",
        image: imageField(await uploadImage("images/hero-fire.jpg")),
      },
      {
        _type: "livingCard",
        _key: "c3",
        title: "Trusted by Thousands",
        copy: "Rated excellent by our customers.",
        image: imageField(await uploadImage("images/steam-lake.jpg")),
      },
    ],
  });
}

// --- Run -----------------------------------------------------------------

async function main() {
  console.log(`Seeding Sanity project ${projectId} (dataset: ${dataset})\n`);
  await seedDepartments();
  await seedBrands();
  await seedCategories();
  await seedProducts();
  await seedEditorial();
  await seedPages();
  await seedSiteSettings();
  await seedNavigation();
  await seedHomepage();
  console.log("\nDone. Open /studio to review the seeded content.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
