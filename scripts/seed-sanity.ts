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

function externalLink(key: string, label: string, url: string) {
  return {
    _type: "link",
    _key: key,
    label,
    linkType: "external",
    externalUrl: url,
  };
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
  { slug: "sauna", title: "Sauna", order: 8 },
  { slug: "cold-plunge", title: "Cold Plunge", order: 9 },
  { slug: "outdoor-kitchen", title: "Outdoor Kitchen", order: 10 },
];

// Categories below default to "outdoor-living" (Garden); these override to
// their actual department so the mega menu doesn't dump every outdoor
// category into one Garden column.
const CATEGORY_DEPARTMENT_OVERRIDES: Record<string, string> = {
  "outdoor-saunas": "sauna",
  "wellness-accessories": "sauna",
  "cold-plunges": "cold-plunge",
  "outdoor-kitchens": "outdoor-kitchen",
  lighting: "lighting",
};

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
      department: ref(
        `department-${CATEGORY_DEPARTMENT_OVERRIDES[cat.slug] ?? "outdoor-living"}`,
      ),
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
        "We deliver across the UK, and further afield wherever our suppliers can fulfil an order. If your order includes items from more than one supplier, expect them to arrive as separate deliveries.",
      topic: "Delivery",
      order: 0,
    },
    {
      question: "Can I return a product if it doesn't fit my space?",
      answer:
        "Yes — eligible items can be returned within 14 days of receipt. Change-of-mind returns are at your own cost; if an item arrives faulty, damaged or incorrect, we cover return shipping. See our Returns page for the full policy.",
      topic: "Returns",
      order: 0,
    },
    {
      question: "What warranty do your products come with?",
      answer:
        "Every product carries whatever warranty its manufacturer provides. We manage the entire claims process on your behalf, so you only ever need to contact us — see our Warranty page for details.",
      topic: "Products",
      order: 1,
    },
    {
      question: "How can I contact Kaiku?",
      answer:
        "The quickest way is by email via our Contact page. We don't yet offer phone support during this initial launch phase.",
      topic: "Support",
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

// --- Pages (Contact/Returns/Delivery/Warranty/Privacy/Cookies/Terms/About) --

let pageBlockCounter = 0;
function textBlock(text: string, style: "normal" | "h2" = "normal") {
  pageBlockCounter += 1;
  return {
    _type: "block",
    _key: `b${pageBlockCounter}`,
    style,
    children: [{ _type: "span", _key: `s${pageBlockCounter}`, text }],
  };
}
function heading(text: string) {
  return textBlock(text, "h2");
}
function bulletList(items: string[]) {
  return items.map((text) => {
    pageBlockCounter += 1;
    return {
      _type: "block",
      _key: `b${pageBlockCounter}`,
      style: "normal",
      listItem: "bullet" as const,
      level: 1,
      children: [{ _type: "span", _key: `s${pageBlockCounter}`, text }],
    };
  });
}

const PAGES = [
  {
    slug: "about",
    title: "About Kaiku",
    intro:
      "A curated home improvement retailer for people who want their home to feel considered, not compromised.",
    body: [
      heading("Why Kaiku exists"),
      textBlock(
        "Kaiku exists to make premium home improvement simpler, more inspiring and more trustworthy — a place to find products chosen for how well they're made, not how well they photograph. Creating a home you love should begin with confidence, not confusion.",
      ),
      heading("What we won't sell"),
      textBlock(
        "We don't select products because they're inexpensive. Every item earns its place through quality, durability and craftsmanship — the kind of home improvement that's built to last rather than to trend.",
      ),
      heading("How we choose our suppliers"),
      textBlock(
        "Every supplier is chosen for their product quality, reputation, craftsmanship, reliability, customer support and warranty standards — and for how well they fit a genuinely premium retailer.",
      ),
      heading("Our values"),
      ...bulletList([
        "Curated over crowded",
        "Premium without pretension",
        "Trust before transactions",
        "Design-led home improvement",
        "Technology that improves buying decisions",
        "Products built to last",
      ]),
      heading("Where we're headed"),
      textBlock(
        "Our aim is to become one of the UK's most trusted premium home improvement retailers — known for the quality of what we sell, the depth of our guidance, and for making significant home purchases feel simple rather than overwhelming.",
      ),
    ],
  },
  {
    slug: "contact",
    title: "Contact Us",
    intro: "We're here to help with sizing, specification and anything else.",
    body: [
      textBlock(
        "Send a message using the form below and our team will get back to you directly — we don't outsource support, so you're always speaking with someone who knows the products.",
      ),
    ],
  },
  {
    slug: "returns",
    title: "Returns & Refunds",
    intro: "Our returns and refunds policy.",
    body: [
      heading("Change of mind"),
      textBlock(
        "If you change your mind, eligible items can be returned within 14 days of receipt, in line with UK consumer law. Items must be unused, in their original packaging and complete with all accessories. Return shipping is paid by the customer for change-of-mind returns.",
      ),
      heading("Faulty, damaged or incorrect items"),
      textBlock(
        "If an item arrives faulty, damaged or incorrect, we arrange and cover the cost of return shipping. Depending on the situation, we'll offer a repair, replacement, replacement parts or a full refund.",
      ),
      heading("Made-to-order products"),
      textBlock(
        "Once a made-to-order item has entered production, it can no longer be cancelled unless required by law. Please make sure your specification is confirmed before production begins.",
      ),
      heading("How refunds work"),
      textBlock(
        "Refunds are issued to your original payment method as quickly as possible once we've received and inspected the returned item. To start a return, contact us with your order number and we'll guide you through the next steps.",
      ),
    ],
  },
  {
    slug: "delivery",
    title: "Delivery",
    intro: "What to expect once you've placed an order.",
    body: [
      heading("Where we deliver"),
      textBlock(
        "We deliver across the UK, and further afield wherever our suppliers are able to fulfil an order. Availability and delivery pricing vary by product, destination and the delivery option you choose at checkout.",
      ),
      heading("How orders are fulfilled"),
      textBlock(
        "Most orders are shipped directly by the supplier who makes or holds the product, rather than from a Kaiku warehouse. If your order includes items from more than one supplier, expect them to arrive as separate deliveries.",
      ),
      heading("Installation"),
      textBlock(
        "Where a supplier offers installation, it's available to select at checkout or on request — see the product page for details.",
      ),
      heading("Staying updated"),
      textBlock(
        "You'll receive updates at each stage of your order: confirmation, supplier acceptance, dispatch, tracking information and a delivery reminder.",
      ),
      heading("If something goes wrong"),
      textBlock(
        "Contact us directly rather than the supplier — we manage the relationship and stay your single point of contact until any delivery issue is resolved.",
      ),
    ],
  },
  {
    slug: "warranty",
    title: "Warranty",
    intro: "How product warranties work at Kaiku.",
    body: [
      heading("How our warranty works"),
      textBlock(
        "Kaiku doesn't offer a separate warranty of its own — every product is covered by whatever warranty its manufacturer or supplier provides, for the length of time they specify. We manage the entire claim on your behalf, so you only ever need to contact us.",
      ),
      heading("Making a claim"),
      textBlock(
        "To start a claim, contact us with your order number, proof of purchase, a description of the fault, photographs, and any relevant serial numbers. We'll take it from there.",
      ),
      heading("What's covered"),
      textBlock(
        "Depending on the manufacturer's policy, a valid claim may result in a repair, replacement parts, a full product replacement, or a refund.",
      ),
      heading("What isn't covered"),
      textBlock(
        "Warranties don't typically cover damage from incorrect installation, misuse, accidental damage, unauthorised commercial use, normal wear and tear, poor maintenance or unauthorised modification.",
      ),
      heading("If there's no manufacturer warranty"),
      textBlock(
        "If a fault develops outside the returns window and no manufacturer warranty applies, get in touch anyway — we assess these situations case by case and a refund or other resolution may still be possible.",
      ),
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    intro: "How we collect, use and protect your information.",
    body: [
      heading("Information we collect"),
      textBlock(
        "To create an account and place an order, we collect your name, email address, phone number, billing and delivery addresses and, where relevant, company details. An account is required to place an order.",
      ),
      heading("Payment information"),
      textBlock(
        "We never store your card details. Payments are processed securely by third-party providers such as Stripe, PayPal and Klarna — even where you choose to pay with Klarna, your payment information is handled by Klarna directly, not stored by us.",
      ),
      heading("Marketing"),
      textBlock(
        "We only send marketing communications if you've actively opted in, and you can unsubscribe at any time.",
      ),
      heading("Analytics"),
      textBlock(
        "We use tools including Google Analytics, Microsoft Clarity, Meta Pixel and Google Search Console to understand how the site is used and to improve it.",
      ),
      heading("The AI Visualiser"),
      textBlock(
        "Photos you upload to the AI Visualiser are processed only to generate your requested visualisation and are automatically deleted after a limited retention period — they're never used for any other purpose.",
      ),
      heading("Who we share information with"),
      textBlock(
        "We share information only where necessary — with suppliers, delivery partners, payment providers and installation partners — or where we're legally required to.",
      ),
      heading("Your rights"),
      textBlock(
        "You can access, correct, delete or export your personal data, and withdraw marketing consent, at any time by contacting us. This policy is governed by the law of England and Wales.",
      ),
      heading("Cookies"),
      textBlock(
        "We use cookies to keep you signed in, remember your basket, understand site usage and personalise your experience — see our Cookie Policy for details.",
      ),
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    intro: "How Kaiku uses cookies on this website.",
    body: [
      heading("What cookies we use"),
      textBlock(
        "We use cookies for four main purposes: keeping you signed in to your account, remembering the contents of your basket, understanding how visitors use our site, and personalising your experience.",
      ),
      heading("Essential cookies"),
      textBlock(
        "These keep your account session and basket working and can't be switched off, as the site won't function correctly without them.",
      ),
      heading("Analytics cookies"),
      textBlock(
        "These help us understand how the site is used so we can improve it, via tools including Google Analytics and Microsoft Clarity.",
      ),
      heading("Managing cookies"),
      textBlock(
        "You can control or delete cookies through your browser settings at any time. Blocking essential cookies may affect how well the site works.",
      ),
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    intro: "The terms that apply when you order from Kaiku.",
    body: [
      heading("Pricing and order acceptance"),
      textBlock(
        "If a pricing error occurs, we may cancel the order and issue a full refund. An order is only accepted once payment has been received, we've reviewed it, and the relevant supplier has accepted it for fulfilment.",
      ),
      heading("Product availability and information"),
      textBlock(
        "If a product becomes unavailable after you've ordered it, we'll explain the situation and let you choose between an alternative, waiting, or a full refund. Product information is provided in good faith from supplier data; occasionally minor errors or specification changes may occur despite our best efforts, and product images are illustrative — colours, finishes and natural materials can vary.",
      ),
      heading("Your responsibilities"),
      textBlock(
        "Before delivery and installation, you're responsible for confirming access routes, any required planning permission, electrical requirements, foundations, ground preparation, building regulations and any other site-specific requirements.",
      ),
      heading("Events beyond our control"),
      textBlock(
        "We aren't liable for delays caused by exceptional circumstances outside our reasonable control, including severe weather, shipping disruption or industrial action.",
      ),
      heading("Fraud and misuse"),
      textBlock(
        "We may refuse, suspend or cancel orders or accounts where we reasonably suspect fraud, abuse or misuse.",
      ),
      heading("Intellectual property"),
      textBlock(
        "Kaiku owns the branding, website design, the AI Visualiser, and all original content, buying guides, graphics and logos on this site, unless otherwise stated.",
      ),
      heading("Governing law"),
      textBlock(
        "These terms are governed by the law of England and Wales. Nothing here affects your statutory rights as a consumer.",
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
    tagline: "Premium home improvement, considered",
    description:
      "Kaiku is a premium home improvement brand — curated architectural products, wellness structures and considered pieces for indoor and outdoor living, chosen with expert guidance and built to last a lifetime.",
    email: "hello@example.com",
    defaultCurrency: "GBP",
  });

  await client.createOrReplace({
    _id: "seoDefaults",
    _type: "seoDefaults",
    defaultMetaTitleTemplate: "%s — Kaiku",
    defaultMetaDescription:
      "Kaiku is a premium home improvement brand — curated architectural products, wellness structures and considered pieces for indoor and outdoor living, chosen with expert guidance and built to last a lifetime.",
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
          linkType: "external",
          externalUrl: "/shop",
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
      {
        _type: "headerLink",
        _key: "tools",
        link: {
          _type: "link",
          label: "Tools",
          linkType: "external",
          externalUrl: "/tools",
        },
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
        _key: "discover",
        title: "Discover",
        links: [
          externalLink("d1", "Buying Guides", "/learn"),
          externalLink("d2", "Journal", "/journal"),
          externalLink("d3", "Compare", "/compare"),
          externalLink("d4", "Guided Buying", "/guided-buying"),
          externalLink("d5", "Inspiration", "/inspiration"),
        ],
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
          externalLink("quote", "Request a Quote", "/quote"),
          {
            _type: "link",
            _key: "contact",
            label: "Contact",
            linkType: "internal",
            internalRef: ref("page-contact"),
          },
          externalLink("trade", "Trade Enquiries", "/contact"),
        ],
      },
      {
        _type: "footerColumn",
        _key: "support",
        title: "Support",
        links: [
          externalLink("faq", "FAQ", "/faq"),
          {
            _type: "link",
            _key: "delivery",
            label: "Delivery",
            linkType: "internal",
            internalRef: ref("page-delivery"),
          },
          {
            _type: "link",
            _key: "returns",
            label: "Returns",
            linkType: "internal",
            internalRef: ref("page-returns"),
          },
          {
            _type: "link",
            _key: "warranty",
            label: "Warranty",
            linkType: "internal",
            internalRef: ref("page-warranty"),
          },
          {
            _type: "link",
            _key: "privacy",
            label: "Privacy Policy",
            linkType: "internal",
            internalRef: ref("page-privacy"),
          },
          {
            _type: "link",
            _key: "cookies",
            label: "Cookie Policy",
            linkType: "internal",
            internalRef: ref("page-cookies"),
          },
          {
            _type: "link",
            _key: "terms",
            label: "Terms & Conditions",
            linkType: "internal",
            internalRef: ref("page-terms"),
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
    heroEyebrow: "Carefully Curated Home Improvement Products",
    heroHeadline: "Spaces that slow",
    heroHighlight: "life down",
    heroSubcopy:
      "Timeless design. Premium materials. Beautiful spaces, indoors and out.",
    heroImage,
    heroCtaPrimary: {
      _type: "link",
      label: "Explore Collections",
      linkType: "external",
      externalUrl: "/shop",
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
    gardenStudioEyebrow: "Design Studio",
    gardenStudioHeadline: "See it. Love it. Live in it.",
    gardenStudioBody:
      "Transform any room with the Design Studio. Upload a photo of your own space and explore endless possibilities — see it before you commit to a single piece.",
    gardenStudioBeforeImage,
    gardenStudioAfterImage,
    gardenStudioImages,
    gardenStudioCta: {
      _type: "link",
      label: "Visualise Your Space",
      linkType: "external",
      externalUrl: "/tools/garden-visualiser",
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
