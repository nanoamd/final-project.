/**
 * The three Mercia metal sheds Damien screenshotted, priority 2 of four.
 *
 * These fill Outdoor Storage, which is currently EMPTY — no published product in
 * it at all — so they are the first three products in a live category and the
 * category's price anchor.
 *
 * A COMMERCIAL FINDING THAT COMES BEFORE THE IMPORT. Mercia's trade discount on
 * metal sheds is far thinner than on their outdoor kitchens, and the market
 * price for these sheds *is* Mercia's own RRP — checked against live listings,
 * not assumed:
 *
 *   Globel Apex 6x3   trade £246.00   Mercia RRP £279.99   market £279.99 (Buy Sheds Direct, GardenSite)
 *   Globel Pent 6x3   trade £254.40   Mercia RRP £318.99   market — same range
 *   Absco Bike Store  trade £350.40   Mercia RRP £399.99   market £399.00 (Garden Building Store)
 *
 * Trade prices are inc VAT, from Damien's logged-in account. Selling at market:
 *
 *   Apex        £279.99 - £246.00 - £4.40 card =  £29.59 = 10.6% net
 *   Pent        £318.99 - £254.40 - £4.98 card =  £59.61 = 18.7% net
 *   Bike store  £399.00 - £350.40 - £6.19 card =  £42.41 = 10.6% net
 *
 * Two of the three miss Damien's 20% floor at the market price, and the price
 * that WOULD clear the floor sits above the entire market:
 *
 *   Apex needs £314 — £34 above every retailer selling it
 *   Pent needs £325 — £6 above Mercia's own RRP
 *   Bike store needs £447 — £47 above every retailer selling it
 *
 * And carriage is still unrecorded for Mercia. A palletised kerbside metal shed
 * is not a £7 parcel; £30–£60 is the realistic range, and any of it turns the
 * Apex and the bike store negative. So NO PRICE IS WRITTEN. This is the exact
 * "we are losing money on a lot of products and the pricing doesn't account for
 * it" pattern, caught before it reaches the site instead of after.
 *
 * The honest read on the Mercia account: the outdoor kitchens (20–27% trade
 * discount) are the profitable half, the metal sheds are not, and the metal
 * sheds only become viable if Mercia's carriage is genuinely free to Kaiku and
 * Damien accepts a ~10% floor on them as a category-filling loss leader.
 *
 * Everything factual is written: dimensions, materials, warranty, construction,
 * assembly reality, specs, images, SKU. Descriptions and FAQs are written too,
 * in the recovered Kaiku voice, because Damien asked for them.
 *
 *   pnpm tsx --env-file=.env.local scripts/import-mercia-metal-sheds.ts
 *   pnpm tsx --env-file=.env.local scripts/import-mercia-metal-sheds.ts --apply
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
  perspective: "raw",
});

const SUPPLIER_ID = "supplier-mercia-garden-products";
const CATEGORY_ID = "category-outdoor-storage";
const CARD_PCT = 0.015;
const CARD_FIXED = 0.2;

/** A description section: a benefit-led heading and the paragraphs under it. */
type Section = [heading: string, ...paragraphs: string[]];

interface Item {
  id: string;
  title: string;
  slug: string;
  sku: string;
  /** Trade price inc VAT, from Damien's logged-in Mercia account. */
  costPrice: number;
  /** Mercia's own retail price, and the market price for these. */
  merciaRrp: number;
  /** Lowest live third-party price found, where one was found. */
  marketLow?: number;
  brand: { id: string; name: string; description: string; website: string };
  dimensions?: { length: number; width: number; height: number };
  summary: string;
  specs: [label: string, value: string][];
  images: string[];
  sections: Section[];
  faqs: [question: string, answer: string][];
  seo: { title: string; description: string };
}

const GLOBEL = {
  id: "brand-globel",
  name: "Globel",
  description:
    "Metal garden buildings in high-tensile hot-dipped galvanised steel, sold in the UK for over three decades and backed by a 15-year anti-rust warranty. Globel sheds are windowless by design for security, vented at the gables against condensation, and hang their double doors on a sliding track so nothing has to swing out into the garden.",
  website: "https://www.globel.com",
};

const ABSCO = {
  id: "brand-absco",
  name: "Absco",
  description:
    "Australia's largest manufacturer of steel garden sheds, building in Bluescope Steel with a Colorbond zinc finish and shipping worldwide. Absco's Snap-Tite system arrives as preassembled panels that clip together, which is why a building this substantial goes up without a workshop full of tools — and why it carries a 20-year warranty rather than the 10 or 15 the category usually offers.",
  website: "https://www.abscosheds.com.au",
};

const ITEMS: Item[] = [
  {
    id: "mercia-globel-apex-metal-shed",
    title: "Globel 6 x 3 Apex Metal Shed | Kaiku",
    slug: "globel-6x3-apex-metal-shed",
    sku: "ESDXL20MET201",
    costPrice: 246,
    merciaRrp: 279.99,
    marketLow: 279.99,
    brand: GLOBEL,
    // Published as W1720 x D820 x ridge 1935mm. Stored in the schema's order, cm.
    dimensions: { length: 82, width: 172, height: 193.5 },
    summary:
      "A 6 x 3 apex metal shed in high-tensile galvanised steel, 172cm wide and 82cm deep with a 193.5cm ridge. Windowless for security, vented at the gables against condensation, with padlockable sliding double doors on a smooth track. 15-year anti-rust warranty. Supplied without a floor, kerbside delivery, self-assembly.",
    specs: [
      ["Nominal size", "6 x 3 (1.83m x 0.92m)"],
      ["External dimensions", "W172 x D82 cm, eave 179.5cm, ridge 193.5cm"],
      ["Internal dimensions", "W161.5 x D68.5 cm"],
      ["Door aperture", "W63.5 x H170 cm"],
      ["Material", "High-tensile hot-dipped galvanised steel"],
      ["Roof", "Apex"],
      ["Doors", "Padlockable sliding double doors on a smooth track"],
      ["Windows", "None — windowless for security"],
      ["Ventilation", "Built-in gable vents"],
      ["Floor", "Not included — a base is required"],
      ["Warranty", "15-year anti-rust"],
      ["Colours", "Anthracite grey, heritage green"],
      ["Assembly", "Self-assembly DIY kit"],
      ["Delivery", "Kerbside only"],
    ],
    images: [
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET201_1.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET201.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET201_2.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET201_3.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET201_4.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET201_-_SPEC.jpg",
    ],
    sections: [
      [
        "Storage That Does Not Need Looking After",
        "A timber shed is a commitment. It wants treating every year, it swells and shrinks with the weather, and sooner or later a panel goes soft at the bottom where the rain sits. This one does not. It is high-tensile hot-dipped galvanised steel, and the only maintenance it asks for across its fifteen-year anti-rust warranty is that you shut the doors.",
        "That makes it the right answer for the job most sheds actually do: holding the mower, the strimmer, the bag of compost and the things you would rather not have in the house, in a footprint of 172 x 82cm that fits down the side of a house or along a boundary fence.",
      ],
      [
        "An Apex Roof, for the Headroom",
        "The apex roof is not decoration. It puts the ridge at 193.5cm against an eave height of 179.5cm, and that extra 14cm down the centre line is what lets you stand a long-handled tool upright, or fit a shelf above the mower rather than beside it.",
        "It also sheds water the way a pitched roof is supposed to, off both sides and away, instead of pooling on a flat panel until it finds a seam. On a metal building that is the difference between a fifteen-year warranty and a leak.",
      ],
      [
        "Windowless, and That Is the Point",
        "There is no window anywhere on this shed, and it is a deliberate choice rather than a saving. Nobody walking past can see whether there is a £600 mower inside or a bag of bark chippings, and there is no glazed panel to break. The double doors take a padlock of your own choosing.",
        "Ventilation is handled where it should be, at the gables, with built-in vents that let warm air out at the top. That keeps condensation off the underside of the roof, which is what actually rusts tools in a sealed metal box.",
      ],
      [
        "Doors That Slide Instead of Swinging",
        "The double doors run on a smooth track and slide rather than opening outwards. If you have ever tried to get a wheelbarrow out of a shed built two feet from a fence, you already know why that matters — there is no arc of ground you have to keep clear, and the wind cannot catch a door and bend a hinge.",
        "The aperture is 63.5cm wide and 170cm high with both doors open, which takes a standard rotary mower, a folded workbench or a bicycle without turning it sideways.",
      ],
      [
        "What You Will Need Alongside It",
        "The shed is supplied without a floor, which is normal for the category and worth planning for. It needs a level base — paving slabs, a concrete pad or a timber frame kit — both to sit flat and to keep the bottom edge out of standing water. Getting the base square is the single thing that makes assembly straightforward rather than a fight.",
        "It arrives as a flat-packed DIY kit with instructions, delivered kerbside. Two people and an afternoon is the realistic expectation; one person and a screwdriver is not.",
      ],
    ],
    faqs: [
      [
        "Does the shed come with a floor?",
        "No. Like most metal sheds it is supplied without a floor, and it needs a level base of its own — paving slabs, a concrete pad, or a timber base kit. Building it straight onto soil or grass is the one thing that will shorten its life, because the bottom edge ends up sitting in water.",
      ],
      [
        "How big is it inside?",
        "The internal dimensions are 161.5cm wide by 68.5cm deep, against external dimensions of 172 x 82cm. Internal height runs from 179.5cm at the eaves to just under the 193.5cm ridge.",
      ],
      [
        "Will it rust?",
        "It carries a 15-year anti-rust warranty. The steel is high-tensile and hot-dipped galvanised, so the zinc coating protects the panel rather than sitting on top of it as paint would. The gable vents matter here too — most rust in metal sheds starts from condensation on the inside, not rain on the outside.",
      ],
      [
        "Is it lockable?",
        "Yes. The sliding double doors are padlockable, though the padlock itself is not supplied so you can match it to what you are storing. There are no windows anywhere on the building, so there is nothing to see through and nothing to break.",
      ],
      [
        "How wide is the door opening?",
        "63.5cm wide by 170cm high. That takes a standard rotary lawnmower, a bicycle upright, or a folded workbench. The doors slide on a track rather than swinging out, so you do not need clear ground in front of them.",
      ],
      [
        "Do I need planning permission?",
        "For a shed this size, almost certainly not. Sheds under 2.5m in height within the boundary of a house normally fall under permitted development in England and Wales, and this one has a 1.935m ridge. Listed buildings, conservation areas and some new-build covenants are the exceptions worth checking.",
      ],
      [
        "How hard is it to put together?",
        "It is a flat-packed DIY kit with instructions, and it is designed for self-assembly. Plan on two people and an afternoon. The base being level and square is what determines whether the panels line up easily or not, so do that part properly first.",
      ],
      [
        "What colours does it come in?",
        "Anthracite grey and heritage green. The grey reads as more contemporary against modern paving and rendered walls; the green disappears more readily into a planted boundary.",
      ],
      [
        "How is it delivered?",
        "Kerbside. The driver will bring it to the nearest accessible point at the property, not around the back and not through the house, so think about how you will move a flat-packed steel building from the front of the property to where it is going before it arrives.",
      ],
    ],
    seo: {
      title: "Globel 6 x 3 Apex Metal Shed | Kaiku",
      description:
        "A 6 x 3 apex shed in hot-dipped galvanised steel with padlockable sliding doors, gable vents and a 15-year anti-rust warranty. Windowless for security, no annual treating.",
    },
  },
  {
    id: "mercia-globel-pent-metal-shed",
    title: "Globel 6 x 4 Pent Metal Shed | Kaiku",
    slug: "globel-6x4-pent-metal-shed",
    sku: "ESDXL20MET223",
    costPrice: 254.4,
    merciaRrp: 318.99,
    brand: GLOBEL,
    // Published as W1800 x D1130 x ridge 1990mm.
    dimensions: { length: 113, width: 180, height: 199 },
    summary:
      "A pent-roofed metal shed in high-tensile galvanised steel, 180cm wide and 113cm deep with a 199cm high point. Padlockable sliding double doors on a smooth track, built-in vents, no windows. 15-year anti-rust warranty. Supplied without a floor, kerbside delivery, self-assembly.",
    specs: [
      ["Nominal size", "6 x 4"],
      ["External dimensions", "W180 x D113 cm, eave 179.5cm, high point 199cm"],
      ["Internal dimensions", "W161.5 x D99.5 cm, internal high point 196cm"],
      ["Door aperture", "W63.5 x H170 cm"],
      ["Material", "High-tensile galvanised steel"],
      ["Roof", "Pent — single slope"],
      ["Doors", "Padlockable sliding double doors on a smooth track"],
      ["Windows", "None"],
      ["Ventilation", "Built-in vents"],
      ["Floor", "Not included — a base is required"],
      ["Warranty", "15-year anti-rust"],
      ["Colours", "Grey, green"],
      ["Assembly", "Self-assembly DIY kit"],
      ["Delivery", "Kerbside only"],
    ],
    images: [
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET223_1_2413af65-a685-40fb-8c9a-c1423265717d.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET223.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET223_2.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET223_3.jpg",
    ],
    sections: [
      [
        "The Shed for a Shed-Shaped Gap",
        "A pent roof slopes one way instead of two, and that single decision is what makes this shed fit where an apex will not. It sits flush against a house wall, a garage or a boundary fence with the high side to the wall and the low side out, so rainwater runs away from the building it is leaning on rather than into the gap between them.",
        "At 180 x 113cm it is a genuinely useful footprint — deep enough to walk into rather than reach into, which is the line between a store and a shed.",
      ],
      [
        "Galvanised Steel, and No Annual Ritual",
        "This is high-tensile galvanised steel with a 15-year anti-rust warranty, and it asks for nothing across those fifteen years. No treating in spring, no repainting, no soft corner to cut out and replace. If the reason you have been putting off a shed is the maintenance a timber one implies, this is the version that removes the objection.",
        "It is also fire-retardant and dimensionally stable, so nothing swells shut in a wet October or shrinks a gap open in a dry July.",
      ],
      [
        "Sliding Doors, Vented Where It Counts",
        "The double doors are padlockable and run on a smooth track, sliding rather than swinging. Against a wall or a fence — which is exactly where a pent shed goes — that is not a nicety, it is the only way the doors work at all.",
        "There are no windows, so there is nothing to see in through and nothing to break. Ventilation is built in instead, letting warm air escape at the top so condensation does not form on the underside of the roof and drip onto whatever you have stored. In a sealed metal box that is what rusts tools, and it is designed out here.",
      ],
      [
        "Standing Room, Under a Single Slope",
        "The eaves sit at 179.5cm and the high point at 199cm, with 196cm of clear internal height at the tallest edge. That is enough to stand up under, which sounds obvious until you have crouched in a shed to find a socket set.",
        "The internal depth of 99.5cm means shelving down one side still leaves floor for a mower, and the 170cm door height takes long-handled tools upright rather than at an angle.",
      ],
      [
        "Getting the Base Right",
        "No floor is supplied, which is standard for metal sheds and the one thing to sort before delivery day. It needs a level, square base — slabs, concrete, or a timber base kit — sized to the 180 x 113cm footprint. Level and square is what makes the panels meet cleanly; out by a centimetre and every subsequent panel argues with you.",
        "It arrives flat-packed with instructions, delivered kerbside, and goes together with two people and an afternoon.",
      ],
    ],
    faqs: [
      [
        "What is the difference between a pent and an apex shed?",
        "A pent roof slopes in one direction; an apex slopes both ways from a central ridge. Pent is the one you want against a wall, a garage or a fence, because you can put the high side to the wall and let water run away from it. Apex gives you more headroom down the middle and looks more like a traditional shed.",
      ],
      [
        "How much headroom is there?",
        "The eaves are at 179.5cm and the high point at 199cm, with 196cm of clear internal height at the tall edge. You can stand up in it comfortably.",
      ],
      [
        "Does it include a floor?",
        "No. It needs a level base of its own — paving slabs, a concrete pad or a timber base kit — sized to the 180 x 113cm footprint. Standing it directly on grass or soil will put the bottom edge in water and shorten its life.",
      ],
      [
        "Can I put it right against my house or fence?",
        "That is what a pent roof is for. Put the high side against the wall so water runs away from the building, and leave enough room to slide the doors and to have got the panels into place during assembly. A few centimetres of clearance for airflow behind it is sensible.",
      ],
      [
        "Is it secure?",
        "There are no windows anywhere on it, and the sliding double doors are padlockable — the padlock is not supplied, so you can match it to what you are storing. Anchoring the base down is the other half of shed security and worth doing.",
      ],
      [
        "Will condensation be a problem?",
        "It has built-in vents specifically for this. Warm air escapes at the top rather than condensing on the underside of the roof. Keeping the vents clear and not storing anything damp inside is the rest of the answer.",
      ],
      [
        "How long does assembly take?",
        "Two people and an afternoon is realistic. It comes flat-packed with instructions and is designed for DIY assembly. Time spent making the base level and square is time saved on every panel afterwards.",
      ],
    ],
    seo: {
      title: "Globel 6 x 4 Pent Metal Shed | Kaiku",
      description:
        "A pent-roofed galvanised steel shed, 180 x 113cm with 196cm of internal headroom, sliding padlockable doors and a 15-year anti-rust warranty. Built to sit against a wall or fence.",
    },
  },
  {
    id: "mercia-absco-metal-bike-store",
    title: "Absco 7 x 3 Metal Bike Store | Kaiku",
    slug: "absco-7x3-metal-bike-store",
    sku: "ESDXL20MET132",
    costPrice: 350.4,
    merciaRrp: 399.99,
    marketLow: 399,
    brand: ABSCO,
    // Published as 2.26m x 0.78m.
    dimensions: { length: 78, width: 226, height: 130 },
    summary:
      "A 7 x 3 bike store in ultra-tough Bluescope Steel with a Colorbond zinc finish, 2.26m wide and 0.78m deep. Double hinged doors and a skillion roof for full-width access, built from preassembled Snap-Tite panels. Made in Australia and carrying a 20-year warranty. Anchor kit included, kerbside delivery.",
    specs: [
      ["Nominal size", "7 x 3 (2.26m x 0.78m)"],
      ["Material", "Bluescope Steel with Colorbond zinc finish"],
      ["Construction", "Snap-Tite preassembled metal panels"],
      ["Roof", "Skillion — single slope"],
      ["Doors", "Double hinged, full-width access"],
      ["Warranty", "20 years"],
      ["Made in", "Australia"],
      ["Anchor kit", "Included"],
      ["Colours", "Monument, pale eucalyptus, zinc, woodland grey"],
      ["Maintenance", "None — rust and water resistant"],
      ["Assembly", "Self-assembly, preassembled panels"],
      ["Delivery", "Kerbside only, pick-a-day service"],
    ],
    images: [
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET132_1_089f91e2-75c6-4bb2-8043-8d141773fe9f.png",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET132_2.jpg",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET132_3.png",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET132_4.png",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET132_5.png",
      "https://merciagardenproducts.co.uk/cdn/shop/files/ESDXL20MET132_7.jpg",
    ],
    sections: [
      [
        "Somewhere to Put Three Bikes That Is Not the Hall",
        "A bike store is a narrow problem. You need something 2.26m wide to take bikes side by side, but only 0.78m deep so it does not eat the garden — and it has to open across the whole front, because a bike will not go into a cupboard sideways. That is precisely the shape of this one.",
        "Double hinged doors open the full width, so you wheel a bike straight in and straight out rather than lifting it over another one. For a family with three bikes and a scooter, that is the difference between using the store and giving up on it after a fortnight.",
      ],
      [
        "Bluescope Steel and a Twenty-Year Warranty",
        "Absco build in ultra-tough Bluescope Steel with a Colorbond zinc finish — a coating bonded to the steel rather than sprayed onto it, which is why the warranty runs to twenty years rather than the ten or fifteen this category normally offers.",
        "It is rust resistant, water resistant and genuinely maintenance-free. Nothing to treat, nothing to repaint, nothing to check in spring. A £2,000 bike is safer in this than in most garages.",
      ],
      [
        "Snap-Tite: Why This Goes Up in an Afternoon",
        "The panels arrive already assembled and clip together on the Snap-Tite system. That is Absco's own construction method and it is the reason a steel building of this size does not need a workshop of tools or a second weekend.",
        "It also means the finished structure is properly rigid rather than a collection of thin sheets bolted at the corners. The anchor kit is included, so it can be fixed down to slabs or concrete from the start — worth doing on a store this shape, which presents a large flat side to the wind.",
      ],
      [
        "A Skillion Roof, Because Water Has to Go Somewhere",
        "The roof is a skillion — a single slope, the same idea as a pent. On a store only 78cm deep that is the right choice: water runs off the back in one direction, away from the doors and away from whatever the store is standing against.",
        "It also keeps the front edge tall enough to get handlebars under while the back stays low, so the whole thing sits discreetly against a wall or fence rather than looming.",
      ],
      [
        "Australian-Made, Built for Weather",
        "Absco are Australia's largest manufacturer of steel garden sheds, which is a useful thing to know about a building you are going to leave outside. The range is engineered against sun, driving rain and wind rather than for a mild average.",
        "Four colours are offered — monument, pale eucalyptus, zinc and woodland grey. Monument is the near-black that reads as deliberate against modern brick; woodland grey and pale eucalyptus recede into planting.",
      ],
    ],
    faqs: [
      [
        "How many bikes will it hold?",
        "Three adult bikes side by side is the realistic figure for a 2.26m width, and you can usually add a child's bike or a scooter at the end. The full-width double doors are what make that work in practice — you are not lifting one bike past another.",
      ],
      [
        "What are the exact dimensions?",
        "2.26m wide by 0.78m deep. The narrow depth is deliberate: it takes bikes across the front rather than end-on, so it sits against a wall or fence without taking a chunk out of the garden.",
      ],
      [
        "Is the anchor kit included?",
        "Yes, it comes as standard. Use it. A store with a large flat side and a light steel structure needs fixing down to slabs or concrete, both against wind and against somebody deciding to lift the whole thing.",
      ],
      [
        "What is Snap-Tite?",
        "Absco's own construction system. The metal panels arrive preassembled and clip together rather than needing to be built up from individual sheets and brackets. It is why a building this size goes together in an afternoon and why the finished structure is rigid rather than flexing.",
      ],
      [
        "How long is the warranty?",
        "Twenty years, which is unusually long for a metal garden building — most of this category offers ten or fifteen. It reflects the Colorbond zinc finish, which is bonded to the Bluescope Steel rather than painted on.",
      ],
      [
        "Does it need a base?",
        "Yes. It needs a level, solid base — paving slabs or a concrete pad — both so the panels meet properly and so the included anchor kit has something to bolt into. Grass or soil is not suitable.",
      ],
      [
        "Which colour should I choose?",
        "Monument is a deep near-black that reads as an architectural choice against modern brick or render. Woodland grey and pale eucalyptus both recede into planting, which is what you want if the store is going somewhere visible. Zinc is the lightest and the most industrial.",
      ],
      [
        "Is it secure enough for expensive bikes?",
        "The structure is Bluescope Steel with hinged doors that take a padlock, and the anchor kit fixes it to the ground. For genuinely valuable bikes, add a ground anchor and a good chain inside — no garden store is a substitute for locking the bike itself, and most insurers will ask.",
      ],
    ],
    seo: {
      title: "Absco 7 x 3 Metal Bike Store | Kaiku",
      description:
        "A 2.26m x 0.78m bike store in Bluescope Steel with a Colorbond zinc finish, full-width hinged doors and a 20-year warranty. Anchor kit included, no maintenance.",
    },
  },
];

function block(prefix: string, index: number, text: string, style = "normal") {
  return {
    _key: `${prefix}${index}`,
    _type: "block",
    style,
    markDefs: [],
    children: [{ _key: `${prefix}${index}s`, _type: "span", marks: [], text }],
  };
}

/** Sections -> Portable Text: an h3 heading, then normal paragraphs. */
function toPortableText(sections: Section[]) {
  const blocks: unknown[] = [];
  let n = 0;
  for (const [heading, ...paragraphs] of sections) {
    blocks.push(block("b", n, heading, "h3"));
    n += 1;
    for (const paragraph of paragraphs) {
      blocks.push(block("b", n, paragraph));
      n += 1;
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
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  // Mercia serve a placeholder rather than a 404 for a missing image.
  if (buffer.byteLength < 5000)
    throw new Error(`${url} returned ${buffer.byteLength} bytes — placeholder`);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function main() {
  const existing = await client.fetch<string[]>(
    `*[_type=="product" && sku in $skus].sku`,
    { skus: ITEMS.map((i) => i.sku) },
  );
  if (existing.length)
    console.log(`Already present, skipping: ${existing.join(", ")}`);

  const results: Record<string, unknown>[] = [];

  for (const item of ITEMS) {
    if (existing.includes(item.sku)) continue;

    const floor = 0.2;
    const priceForFloor = Math.ceil(
      (item.costPrice + CARD_FIXED) / (1 - CARD_PCT - floor),
    );
    const market = item.marketLow ?? item.merciaRrp;
    const cardAtMarket = market * CARD_PCT + CARD_FIXED;
    const netAtMarket = (market - item.costPrice - cardAtMarket) / market;
    const description = toPortableText(item.sections);
    const chars = item.sections
      .flatMap(([h, ...p]) => [h, ...p])
      .join(" ").length;

    console.log(`\n${item.title.replace(" | Kaiku", "")}`);
    console.log(
      `   ${item.brand.name}   sku ${item.sku}   trade £${item.costPrice.toFixed(2)} inc VAT`,
    );
    console.log(
      `   market £${market.toFixed(2)} -> ${(netAtMarket * 100).toFixed(1)}% net` +
        `   |   20% floor needs £${priceForFloor} (£${(priceForFloor - market).toFixed(2)} ${priceForFloor > market ? "ABOVE" : "under"} market)`,
    );
    console.log(
      `   ${item.sections.length} sections, ${chars} chars, ${item.faqs.length} FAQs, ${item.specs.length} specs, ${item.images.length} images`,
    );

    results.push({
      id: item.id,
      title: item.title,
      brand: item.brand.name,
      sku: item.sku,
      costPrice: item.costPrice,
      merciaRrp: item.merciaRrp,
      marketLow: item.marketLow ?? null,
      netAtMarketPct: Number((netAtMarket * 100).toFixed(1)),
      priceForFloor,
      floorAboveMarket: priceForFloor > market,
      chars,
      faqs: item.faqs.length,
      images: item.images.length,
    });

    if (!apply) continue;

    await client.createOrReplace({
      _id: item.brand.id,
      _type: "brand",
      name: item.brand.name,
      slug: {
        _type: "slug",
        current: item.brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
      description: item.brand.description,
      website: item.brand.website,
    });

    const gallery = [];
    for (const [index, url] of item.images.entries()) {
      try {
        const assetId = await uploadImage(
          url,
          `${item.slug}-${index + 1}${url.endsWith(".png") ? ".png" : ".jpg"}`,
        );
        gallery.push({
          _key: `img${index}`,
          _type: "image",
          asset: { _type: "reference", _ref: assetId },
          alt:
            index === 0
              ? item.title.replace(" | Kaiku", "")
              : `${item.title.replace(" | Kaiku", "")}, view ${index + 1}`,
        });
      } catch (error) {
        console.log(
          `   image ${index + 1} skipped: ${(error as Error).message}`,
        );
      }
    }
    console.log(`   ${gallery.length} images uploaded`);

    await client.createOrReplace({
      // A draft, with no price: see the header. Publishing is Damien's call.
      _id: `drafts.${item.id}`,
      _type: "product",
      title: item.title,
      slug: { _type: "slug", current: item.slug },
      category: { _type: "reference", _ref: CATEGORY_ID },
      brand: { _type: "reference", _ref: item.brand.id },
      supplier: { _type: "reference", _ref: SUPPLIER_ID },
      sku: item.sku,
      supplierSku: item.sku,
      costPrice: item.costPrice,
      costPriceVatCorrected: true,
      currency: "GBP",
      summary: item.summary,
      description,
      stockStatus: "In Stock",
      deliveryLeadTime: "1–2 weeks",
      ...(item.dimensions
        ? {
            dimensions: {
              _type: "dimensions",
              ...item.dimensions,
              unit: "cm",
            },
          }
        : {}),
      specs: item.specs.map(([label, value], i) => ({
        _key: `spec-${i}`,
        _type: "productSpec",
        label,
        value,
      })),
      faqs: item.faqs.map(([question, answer], i) => ({
        _key: `faq-${i}`,
        _type: "productFaq",
        question,
        answer,
      })),
      seo: {
        _type: "seo",
        metaTitle: item.seo.title,
        metaDescription: item.seo.description,
      },
      gallery,
    });
    console.log(`   created drafts.${item.id}`);
  }

  console.log(
    `\n${apply ? "Created" : "Would create"} ${results.length} drafts in Outdoor Storage — currently an empty category.`,
  );
  console.log(
    "No price written on any of the three. Two of them cannot clear the 20% floor\n" +
      "at the price the whole market sells them for, and Mercia's carriage is still\n" +
      "unrecorded. That decision is Damien's, and it needs the rate card first.",
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-03-import-mercia-metal-sheds.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
