/**
 * Five Hill Interiors outdoor furniture sets, from Damien's trade portal.
 *
 * These are the premium anchors Garden Furniture has been short of: £1,160 to
 * £2,726 at dropship cost, against a category whose existing 75 products top out
 * at £1,531 retail.
 *
 * Every specification comes from Hill's own public item pages. The trade prices
 * come from Damien's logged-in screenshots, and `costPrice` uses the **dropship**
 * figure, which is what the other 139 Hill products in the catalogue already use
 * — the Luxe candles are recorded at £9.86, Hill's dropship price, not their
 * £8.50 wholesale. Wholesale and volume are recorded in the change log so the
 * saving from buying to stock is visible rather than lost.
 *
 * Carriage is resolved from the bands already mapped for Hill, and these are all
 * two-man deliveries: 52kg through 150kg lands in the £59.99 and £84.99 bands.
 * That is a real cost of £60-£85 a set, which is exactly why it has to be on the
 * product rather than assumed away.
 *
 * Descriptions and FAQs are written here, in the register of the descriptions
 * recovered from history — h3 headings that lead on benefit, second person,
 * short stacked paragraphs. No Delivery & Returns section: the buy box renders
 * the real terms, and a hard-coded one is what put stale carriage on 200+ pages.
 *
 * No retail price is written. That stays Damien's.
 *
 *   pnpm tsx --env-file=.env.local scripts/import-hill-garden-furniture-sets.ts
 *   pnpm tsx --env-file=.env.local scripts/import-hill-garden-furniture-sets.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

const SUPPLIER_ID = "supplier-hill-interiors";
const CATEGORY_ID = "category-garden-furniture";

/** Hill's published two-man bands, as mapped in fix-hill-interiors-carriage.ts. */
function carriageFor(kg: number): number {
  if (kg <= 10) return 6.99;
  if (kg <= 20) return 9.99;
  if (kg <= 40) return 14.99;
  if (kg <= 60) return 59.99;
  if (kg <= 100) return 69.99;
  if (kg <= 150) return 84.99;
  return 109.99;
}

type Section = [heading: string, ...paragraphs: string[]];

interface Item {
  code: string;
  title: string;
  slug: string;
  dropship: number;
  wholesale: number;
  volume: number;
  weightKg: number;
  dimensions: { length: number; width: number; height: number };
  colour: string;
  materials: string[];
  summary: string;
  sections: Section[];
  faqs: [q: string, a: string][];
  extraSpecs?: [string, string][];
  /** Image suffixes that exist on Hill's CDN for this code. */
  imageSuffixes: string[];
}

/** Shared copy for the Capri/Amalfi/Provence construction, which is common. */
const WEAVE_SECTION: Section = [
  "Built to Stay Outside",
  "The frame is powder-coated aluminium — rust-proof rather than rust-resistant, which is the distinction that matters on a set living outdoors permanently. Around it runs a 5mm half-round HDPE wicker weave: a synthetic strand with a flat outer face, so it reads like natural cane without behaving like it once the weather arrives.",
  "The cushions are grade 5 Olefin. Olefin dries faster than polyester and holds its colour against UV, so a shower on a summer afternoon does not end the evening and a season in the sun does not bleach it.",
];

const ITEMS: Item[] = [
  {
    code: "23913",
    title: "Capri Collection Outdoor Large Corner And Coffee Table Set | Kaiku",
    slug: "capri-collection-outdoor-large-corner-and-coffee-table-set",
    dropship: 1682,
    wholesale: 1450,
    volume: 1305,
    weightKg: 97,
    dimensions: { length: 212, width: 80, height: 80 },
    colour: "Beige",
    materials: ["Synthetic fibres", "Metal", "Glass", "Fabric"],
    summary:
      "A large outdoor corner set with a matching coffee table, 212 x 80 x 80cm and 97kg, in beige. Powder-coated aluminium frame with a 5mm half-round HDPE wicker weave and Olefin cushions. Modular, so the pieces can be arranged to suit the space. Two people needed to assemble.",
    sections: [
      [
        "A Corner Set That Anchors the Whole Garden",
        "This is the piece a garden gets arranged around. A large corner seating run with its own coffee table, finished in beige, giving a group of people somewhere to sit facing each other rather than in a line — which is the difference between a garden you pass through and one you spend the evening in.",
        "At 212cm along its longest side it is a substantial piece, and it is meant to be. A corner set works when it is big enough to hold a conversation across.",
      ],
      WEAVE_SECTION,
      [
        "Modular, So It Fits Your Space and Not the Photograph",
        "The layout adapts. The corner arrangement can be broken and re-set to suit the shape of a patio, a decked area or a courtyard, so the set works around what you have rather than demanding a particular rectangle.",
      ],
      [
        "The Coffee Table",
        "The set includes its own coffee table with a glass top — easy to wipe down after drinks and food, and visually lighter than a solid top, which stops the middle of the seating group feeling closed in.",
      ],
      [
        "Weight, Assembly and Getting It Into Place",
        "The set weighs 97kg in total and Hill flag it as a heavy item. Two people are needed to assemble it, on a firm, flat, dry surface with decent light.",
        "It arrives on a two-person delivery. Think about the route from the road to the garden before it comes — side gates and passageways are where these sets get stuck.",
      ],
      [
        "Looking After It",
        "Soap and water is all the weave asks for. Bring the cushions in or store them dry through winter and long wet spells: the frame and weave are made to stay out, and the cushions will simply last much longer if they are not sitting damp for months.",
      ],
    ],
    faqs: [
      [
        "What are the dimensions?",
        "212cm long by 80cm wide and 80cm high, weighing 97kg in total.",
      ],
      [
        "What is included?",
        "A large corner seating arrangement and a matching coffee table with a glass top.",
      ],
      [
        "What is the frame made from?",
        "Powder-coated aluminium, which is rust-proof rather than merely rust-resistant — the right choice for a set that lives outdoors permanently.",
      ],
      [
        "Is the wicker real rattan?",
        "No. It is a 5mm half-round HDPE wicker, a synthetic strand with a flat outer face designed to read like natural cane while standing up to weather that natural cane will not.",
      ],
      [
        "What are the cushions made from?",
        "Grade 5 Olefin, which dries faster than polyester and resists fading in UV.",
      ],
      [
        "Can I change the layout?",
        "Yes, it is modular. The corner arrangement can be re-set to suit the shape of your patio rather than requiring a particular space.",
      ],
      [
        "How many people are needed to assemble it?",
        "Two, minimum. Build it on a firm, flat, dry surface with good light — it is a heavy set.",
      ],
      [
        "Can it stay outside all year?",
        "The aluminium frame and HDPE weave are made for it. Bring the cushions in or store them dry through winter and they will last considerably longer.",
      ],
      [
        "How do I clean it?",
        "Mild soap and water on a soft cloth for the weave and frame. Let cushions dry fully before storing them.",
      ],
    ],
    imageSuffixes: ["", "-a", "-b", "-c", "-d"],
  },
  {
    code: "24513",
    title: "Provence Collection Outdoor 4 Seater Lounge Set | Kaiku",
    slug: "provence-collection-outdoor-4-seater-lounge-set",
    dropship: 1160,
    wholesale: 1000,
    volume: 900,
    weightKg: 52,
    dimensions: { length: 152, width: 85, height: 75 },
    colour: "Beige",
    materials: ["Synthetic fibres", "Metal", "Fabric"],
    summary:
      "A four-seater outdoor lounge set in beige, 152 x 85 x 75cm and 52kg. Weather-resistant construction on a metal frame with a synthetic weave and fabric cushions, in a neutral finish. Two people needed to assemble.",
    sections: [
      [
        "Four Seats, Facing Each Other",
        "A lounge set is not a dining set, and the difference is the point of this one. Lower, deeper seating for four, arranged so people are looking at each other rather than at a table — the configuration you want for a drink after work rather than a meal.",
        "At 152cm across its longest side it suits a patio or a terrace without dominating it, which makes it a more realistic choice than a corner set for most gardens.",
      ],
      [
        "Weather-Resistant, and Neutral on Purpose",
        "The construction is built for permanent outdoor use, and the finish is deliberately neutral. Beige sits against stone, brick, render, gravel and planting without fighting any of them — a set you will not have to design the rest of the garden around.",
      ],
      [
        "Weight and Assembly",
        "The set weighs 52kg. Two people are needed to assemble it, on a firm, flat surface in a dry, well-lit spot.",
        "It comes on a two-person delivery, so check the route from the road through to where it is going — gateways and side passages are the usual pinch point.",
      ],
      [
        "Care Through a British Year",
        "Wipe the frame and weave down with mild soap and water. Store the cushions dry when the set is not in use and through the winter; that single habit is what separates a set that looks good in year three from one that does not.",
      ],
    ],
    faqs: [
      [
        "What are the dimensions?",
        "152cm long, 85cm wide and 75cm high, weighing 52kg.",
      ],
      [
        "How many people does it seat?",
        "Four, in a lounge configuration — lower and deeper than dining seating, arranged so people face each other.",
      ],
      [
        "Is it a dining set?",
        "No. It is a lounge set, built for sitting and talking rather than eating at a table.",
      ],
      [
        "What colour is it?",
        "Beige, chosen to sit against stone, brick, render and planting without clashing.",
      ],
      [
        "Can it stay outside?",
        "It is built for weather-resistant outdoor use. Store the cushions dry when it is not in use and over winter.",
      ],
      [
        "How many people are needed to build it?",
        "Two, on a firm, flat surface in a dry, well-lit area.",
      ],
      [
        "How do I clean it?",
        "Mild soap and water on a soft cloth. Let the cushions dry fully before they are stored.",
      ],
    ],
    imageSuffixes: ["", "-a", "-b", "-c"],
  },
  {
    code: "23912",
    title: "Amalfi Collection Outdoor Large Corner Set | Kaiku",
    slug: "amalfi-collection-outdoor-large-corner-set",
    dropship: 1856,
    wholesale: 1600,
    volume: 1440,
    weightKg: 112,
    dimensions: { length: 80, width: 212, height: 80 },
    colour: "Beige",
    materials: ["Synthetic fibres", "Metal", "Glass", "Fabric"],
    summary:
      "A large outdoor corner set in beige with a Mediterranean-inspired weave and a glass-topped table, 212cm across and 112kg. Deep cushioning, a robust frame built for permanent outdoor use, and a layout that suits a large garden or a compact balcony. Two people needed to assemble.",
    sections: [
      [
        "The Mediterranean Weave, and Why It Reads Differently",
        "The Amalfi's weave is more intricate than a plain basket pattern — a Mediterranean-inspired texture that catches light across the surface rather than presenting one flat tone. On a large piece that matters: it stops 212cm of seating reading as a single block of beige.",
      ],
      [
        "Built for a Big Garden or a Small Balcony",
        "The corner layout is what makes it flexible. Run out fully it fills a generous terrace; broken down it tucks into the corner of a balcony. The same set does both, which is unusual at this size.",
      ],
      [
        "Deep Cushioning You Can Sit In All Evening",
        "The cushioning is generous rather than token — the difference between a set people perch on and one they stay in. Combined with a robust frame built for long-term outdoor use, it is designed to be lived on rather than looked at.",
      ],
      [
        "The Table",
        "A practical table is included for drinks and entertaining, with a glass top that wipes clean and keeps the centre of the seating group feeling open.",
      ],
      [
        "Weight, Delivery and Assembly",
        "This is a 112kg set and Hill flag the weight explicitly. Two people minimum to assemble, on firm, flat, dry ground with good light.",
        "It arrives by two-person delivery. Measure the route in — through gates, down side passages, round corners — before the delivery date rather than on it.",
      ],
      [
        "Care",
        "Soap and water for the weave and frame. Store the cushions dry when the set is not in use and through the winter months.",
      ],
    ],
    faqs: [
      [
        "What are the dimensions?",
        "212cm wide, 80cm deep and 80cm high, weighing 112kg.",
      ],
      [
        "What makes the Amalfi weave different?",
        "It is a more intricate, Mediterranean-inspired pattern rather than a plain weave, which gives the surface texture and stops a large set reading as one flat block of colour.",
      ],
      [
        "Does it come with a table?",
        "Yes, a practical table for drinks and entertaining is included.",
      ],
      [
        "Will it fit a balcony?",
        "The corner layout can be broken down to suit a compact space as well as run out fully across a large terrace.",
      ],
      [
        "How heavy is it?",
        "112kg in total, which is why it arrives on a two-person delivery and needs two people to assemble.",
      ],
      [
        "Can it be left outside?",
        "The frame and weave are built for long-term outdoor use. Store the cushions dry when not in use and over winter.",
      ],
      [
        "How do I clean it?",
        "Mild soap and water. Let the cushions dry completely before storing them.",
      ],
    ],
    imageSuffixes: ["", "-a", "-b", "-c", "-d"],
  },
  {
    code: "23914",
    title:
      "Amalfi Outdoor Large Corner Set With Riser Table & 2 Stools | Kaiku",
    slug: "amalfi-outdoor-large-corner-set-with-riser-table-2-stools",
    dropship: 2668,
    wholesale: 2300,
    volume: 2070,
    weightKg: 150,
    dimensions: { length: 92, width: 277, height: 72 },
    colour: "Beige",
    materials: ["Synthetic fibres", "Metal", "Glass", "Fabric"],
    summary:
      "A large outdoor corner set with a height-adjustable riser table and two stools, 277cm across and 150kg, in beige. The table raises from coffee height to dining height, so one set does both. Modular layout, weather-resistant construction, two people needed to assemble.",
    sections: [
      [
        "One Set That Is Both a Lounge and a Dining Table",
        "The riser table is the reason this set exists. Its height adjusts, so the same arrangement is a low lounge set with drinks in the afternoon and a dining table by the evening — without owning two sets or moving anything heavier than a tabletop.",
        "In a garden where space only allows for one seating group, that mechanism is the whole argument.",
      ],
      [
        "277cm of Seating, Plus Two Stools",
        "At 277cm across this is the largest of the Amalfi arrangements, and two matching stools come with it. The stools tuck under the table when they are not needed, so the extra seating does not cost you floor space the rest of the time.",
      ],
      [
        "Modular, and Weather-Resistant",
        "The layout is flexible: the corner can be arranged to suit the shape of the space rather than requiring a set rectangle. Construction is built for permanent outdoor use, in the Mediterranean-inspired weave the Amalfi range is built around.",
      ],
      [
        "The Weight Is the Thing to Plan For",
        "150kg. This is the heaviest set in the range and Hill flag it accordingly — two people minimum to assemble, on firm, flat, dry ground.",
        "It arrives by two-person delivery. Check every part of the route in advance: gate widths, passage turns, steps. A set this size is not something to improvise on the day.",
      ],
      [
        "Care",
        "Wipe the weave and frame with mild soap and water. Store the cushions dry when the set is not in use and through winter — the frame will stay out happily, the cushions simply last longer inside.",
      ],
    ],
    faqs: [
      [
        "What are the dimensions?",
        "277cm wide, 92cm deep and 72cm high, weighing 150kg.",
      ],
      [
        "What does the riser table do?",
        "Its height adjusts, so the set works as a low lounge arrangement and as a dining set without buying or storing a second table.",
      ],
      [
        "What is included?",
        "The large corner seating arrangement, the height-adjustable riser table, and two matching stools.",
      ],
      [
        "Where do the stools go when not in use?",
        "They tuck under the table, so the extra seating does not take up floor space the rest of the time.",
      ],
      [
        "How heavy is it?",
        "150kg — the heaviest set in the range. It comes on a two-person delivery and needs two people to assemble.",
      ],
      [
        "What should I check before delivery?",
        "The full route from the road to the garden: gate widths, passage turns and steps. A set this size cannot be improvised around on the day.",
      ],
      [
        "Can it be left outdoors?",
        "Yes, it is built for it. Store the cushions dry when not in use and over the winter.",
      ],
      [
        "How do I clean it?",
        "Mild soap and water on the weave and frame; let cushions dry fully before storing.",
      ],
    ],
    imageSuffixes: ["", "-a", "-b", "-c"],
  },
  {
    code: "23099",
    title: "Capri Outdoor Large Corner Set With Riser Table & 2 Stools | Kaiku",
    slug: "capri-outdoor-large-corner-set-with-riser-table-2-stools",
    dropship: 2726,
    wholesale: 2350,
    volume: 2115,
    weightKg: 137,
    dimensions: { length: 92, width: 277, height: 72 },
    colour: "Beige",
    materials: ["Synthetic fibres", "Metal", "Fabric", "Acacia"],
    summary:
      "A large Capri corner set with a height-adjustable riser table and two stools, 277cm across and 137kg. Two 185cm sofas, a 95cm corner piece and two 40cm stools, on a powder-coated aluminium frame with 5mm half-round HDPE wicker, acacia wood feet and grade 5 Olefin cushions. Two people needed to assemble.",
    sections: [
      [
        "The Largest Capri Arrangement, and What Is Actually in It",
        "This is the full Capri corner set: two sofas at 185cm long, a 95cm corner piece to join them, a height-adjustable riser table, and two 40cm stools. 277cm across in total.",
        "Knowing the individual pieces matters more than the overall figure, because the corner can be set up in more than one shape — and those are the measurements you need to work out which one fits your space.",
      ],
      [
        "A Table That Rises From Coffee Height to Dining",
        "The riser mechanism turns one seating group into two settings. Low for drinks and conversation, raised for a meal, with the stools pulled out to seat two more. In a garden with room for a single arrangement, that flexibility is worth more than another piece of furniture.",
      ],
      [
        "The Construction, in Detail",
        "A powder-coated aluminium frame — rust-proof, not merely rust-resistant — wrapped in 5mm half-round HDPE wicker, the flat-faced synthetic strand that reads like natural cane and outlasts it outdoors. It stands on acacia wood feet.",
        "The cushions are grade 5 Olefin with UV and moisture resistance. Olefin dries faster than polyester and holds colour against sunlight, and Hill describe these as shower resistant — a passing summer shower is not the end of the evening.",
      ],
      [
        "Cleaning It Is Genuinely Easy",
        "Soap and water. That is the whole routine for the frame and the weave, which is the practical advantage of HDPE and powder-coated aluminium over natural materials that need feeding, oiling or covering.",
      ],
      [
        "Weight, Delivery and Assembly",
        "137kg in total. Two people minimum for assembly, on firm, flat, dry ground with good light. It arrives by two-person delivery, so measure the route in — gates, side passages, steps and turns — before the day.",
      ],
      [
        "Through the Winter",
        "The frame, weave and acacia feet are made to stay outside. Store the Olefin cushions dry when the set is not in use and through the winter, and they will keep their colour and their shape for far longer.",
      ],
    ],
    faqs: [
      [
        "What exactly is in the set?",
        "Two sofas at 185 x 92 x 72cm, one corner piece at 95 x 95 x 72cm, a height-adjustable riser table, and two stools at 40 x 40 x 40cm.",
      ],
      [
        "What are the overall dimensions?",
        "277cm wide, 92cm deep and 72cm high, weighing 137kg in total.",
      ],
      [
        "What does the riser table do?",
        "It adjusts in height, so the set works as a low lounge arrangement for drinks and as a dining table for a meal.",
      ],
      [
        "What is the frame made from?",
        "Powder-coated aluminium — rust-proof rather than rust-resistant — with acacia wood feet.",
      ],
      [
        "Is the wicker real rattan?",
        "No. It is 5mm half-round HDPE wicker, a synthetic strand with a flat outer face that reads like natural cane and lasts far better outdoors.",
      ],
      [
        "Are the cushions waterproof?",
        "They are grade 5 Olefin, described as shower resistant, with UV and moisture resistance. Olefin dries faster than polyester and holds its colour. Store them dry when the set is not in use.",
      ],
      [
        "How do I clean it?",
        "Soap and water on the frame and weave. That is genuinely the whole routine.",
      ],
      [
        "How many people are needed to assemble it?",
        "Two, minimum, on a firm and level surface.",
      ],
      [
        "What should I check before it is delivered?",
        "The route from the road to the garden — gate widths, passage turns and steps. At 137kg and 277cm this is not a set to improvise around on delivery day.",
      ],
    ],
    imageSuffixes: ["", "-a", "-b", "-c", "-d"],
  },
];

function toBlocks(sections: Section[]) {
  const blocks: unknown[] = [];
  let n = 0;
  for (const [heading, ...paragraphs] of sections) {
    blocks.push({
      _key: `b${n++}`,
      _type: "block",
      style: "h3",
      markDefs: [],
      children: [{ _key: `b${n}s`, _type: "span", marks: [], text: heading }],
    });
    for (const text of paragraphs) {
      blocks.push({
        _key: `b${n++}`,
        _type: "block",
        style: "normal",
        markDefs: [],
        children: [{ _key: `b${n}s`, _type: "span", marks: [], text }],
      });
    }
  }
  return blocks;
}

async function uploadImage(url: string, filename: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; KaikuCatalogueSync/1.0)",
    },
  });
  // Hill's CDN serves a placeholder rather than a 404 for missing suffixes, so a
  // suspiciously small body is treated as "this variant does not exist".
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength < 5000) return null;
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function main() {
  const results: Record<string, unknown>[] = [];

  for (const item of ITEMS) {
    const carriage = carriageFor(item.weightKg);
    const description = toBlocks(item.sections);
    const chars = item.sections.flatMap(([, ...p]) => p).join(" ").length;

    console.log(
      `\n${item.title.replace(" | Kaiku", "")}` +
        `\n   code ${item.code}   ${item.weightKg}kg -> carriage £${carriage.toFixed(2)} (two-man)` +
        `\n   dropship £${item.dropship}   wholesale £${item.wholesale}   volume £${item.volume}` +
        `\n   ${item.sections.length} sections, ${chars} chars, ${item.faqs.length} FAQs`,
    );

    results.push({
      code: item.code,
      title: item.title,
      dropship: item.dropship,
      wholesale: item.wholesale,
      volume: item.volume,
      weightKg: item.weightKg,
      carriage,
      chars,
      faqs: item.faqs.length,
    });

    if (!apply) continue;

    const gallery = [];
    for (const [index, suffix] of item.imageSuffixes.entries()) {
      const url = `https://www.hill-interiors.com/images/giant/${item.code}${suffix}.jpg`;
      const assetId = await uploadImage(url, `${item.slug}-${index + 1}.jpg`);
      if (!assetId) continue;
      gallery.push({
        _key: `img${index}`,
        _type: "image",
        asset: { _type: "reference", _ref: assetId },
        alt:
          index === 0
            ? item.title.replace(" | Kaiku", "")
            : `${item.title.replace(" | Kaiku", "")}, view ${index + 1}`,
      });
    }
    console.log(`   ${gallery.length} images uploaded`);

    await client.createOrReplace({
      _id: `drafts.product-hill-${item.code}`,
      _type: "product",
      title: item.title,
      slug: { _type: "slug", current: item.slug },
      category: { _type: "reference", _ref: CATEGORY_ID },
      supplier: { _type: "reference", _ref: SUPPLIER_ID },
      sku: `HILL-${item.code}`,
      supplierSku: item.code,
      costPrice: item.dropship,
      shippingCost: carriage,
      currency: "GBP",
      summary: item.summary,
      description,
      faqs: item.faqs.map(([question, answer], i) => ({
        _key: `f${i}`,
        _type: "faqEntry",
        question,
        answer,
      })),
      stockStatus: "In Stock",
      deliveryLeadTime: "2–3 weeks",
      dimensions: { _type: "dimensions", ...item.dimensions, unit: "cm" },
      weight: { _type: "weight", value: item.weightKg, unit: "kg" },
      primaryColour: item.colour,
      materialTags: item.materials,
      specs: [
        [
          "Dimensions",
          `W${item.dimensions.width} x D${item.dimensions.length} x H${item.dimensions.height} cm`,
        ],
        ["Weight", `${item.weightKg} kg`],
        ["Colour", item.colour],
        ["Materials", item.materials.join(", ")],
        ["Assembly", "Minimum 2 people, on a firm, flat, dry surface"],
        ["Delivery", "Two-person delivery"],
        ...(item.extraSpecs ?? []),
      ].map(([label, value], i) => ({
        _key: `spec-${i}`,
        _type: "productSpec",
        label,
        value,
      })),
      gallery,
    });
    console.log(`   created drafts.product-hill-${item.code}`);
  }

  const totalCarriage = results.reduce((s, r) => s + (r.carriage as number), 0);
  console.log(
    `\n${apply ? "Created" : "Would create"} ${results.length} drafts in Garden Furniture.`,
  );
  console.log(
    `Carriage across the five: £${totalCarriage.toFixed(2)} — all two-man deliveries, and a real cost per set.`,
  );
  console.log(
    "No retail price written. Buying at volume rather than dropship would save " +
      `£${ITEMS.reduce((s, i) => s + (i.dropship - i.volume), 0).toLocaleString()} across these five.`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-03-import-hill-garden-furniture-sets.json",
    JSON.stringify({ apply, results }, null, 2),
  );
  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
