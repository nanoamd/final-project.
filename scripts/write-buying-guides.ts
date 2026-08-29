/**
 * Writes the buying guides for the categories that have none, in the shape
 * Damien asked for.
 *
 * He linked a competitor's table lamp guide and said "here is example of one I
 * do [like]". What that guide does, and what ours were not doing:
 *
 *   1. It answers the question in numbers in the first sentence. Not "it
 *      depends on the room" — "58 to 81cm, and the shade at eye level".
 *   2. The numbers then arrive again as a reference table, in the first
 *      screen, where someone can act on them without reading the prose.
 *   3. The advice is numbered rules, not headed essays. "Rule one." is a
 *      thing you can hold in your head at a shop; "Height, relative to what
 *      is beneath it" is not.
 *   4. It goes room by room, because the reader is standing in one room.
 *   5. It then checks its own products against its own rules, by name, with
 *      the actual measurements. That is the part that makes it a shop's
 *      guide rather than a blog post, and the part ours had no version of.
 *   6. It closes with a short version, then a FAQ.
 *
 * Ours were five headed essays. Good prose, wrong format — none of the numbers
 * were reachable without reading, and none of them touched the stock.
 *
 * The audit tables are computed from live catalogue dimensions at write time,
 * not typed in. A guide that says a 112cm clock suits a 160–185cm sideboard is
 * saying it because 112 divided by 0.7 and 0.6 is 160 and 187, on a clock that
 * is actually 112cm in Sanity today. Products with no dimensions are dropped
 * from the audit rather than described vaguely.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-buying-guides.ts
 *   pnpm tsx --env-file=.env.local scripts/write-buying-guides.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface TableSpec {
  caption?: string;
  headers: string[];
  rows: string[][];
}

interface Section {
  heading?: string;
  paragraphs?: string[];
  table?: TableSpec;
  /**
   * A calculator embedded at this point in the guide.
   *
   * Damien: "the tools should also be in the buying guides so you can
   * calculate it on the same page." Every one of these sits directly under the
   * reference table it computes, so the reader meets the generic numbers and
   * then puts their own in without leaving the page.
   */
  tool?: { tool: string; caption?: string };
}

interface ProductFacts {
  _id: string;
  title: string;
  price: number;
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

/**
 * The section that measures the shop's own stock against the guide's own rules.
 *
 * `row` returns null for a product the rule cannot honestly judge — usually one
 * with no dimensions on it. Those are dropped from the table rather than given
 * a hedged cell, which is the same rule the product descriptions work under.
 */
interface AuditSpec {
  heading: (count: number) => string;
  intro: string;
  caption?: string;
  headers: string[];
  row: (product: ProductFacts) => string[] | null;
  limit: number;
  outro?: string;
}

interface GuideSpec {
  slug: string;
  title: string;
  excerpt: string;
  /** Category slug the guide belongs to and takes its products from. */
  categorySlug: string;
  /** How many live products to link. */
  productCount: number;
  /** Everything before the audit table. */
  sections: Section[];
  audit?: AuditSpec;
  /** Everything after it — in practice, "The short version". */
  closing: Section[];
  faqs: { question: string; answer: string }[];
}

// ---------------------------------------------------------------------------
// Helpers used by the audit tables. All arithmetic, no adjectives.
// ---------------------------------------------------------------------------

const NUMBER_WORDS = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** The product name as a reader knows it, without the brand suffix. */
function displayName(title: string): string {
  let name = title.trim();
  while (/\s*[|\-–—]\s*Kaiku(\s+Home)?\s*$/i.test(name)) {
    const stripped = name
      .replace(/\s*[|\-–—]\s*Kaiku(\s+Home)?\s*$/i, "")
      .trim();
    if (!stripped) break;
    name = stripped;
  }
  return name;
}

/** Trims a trailing ".0" so 112.0 prints as 112 and 62.5 stays 62.5. */
function cm(value: number): string {
  return `${Math.round(value * 10) / 10}cm`;
}

function round5(value: number): number {
  return Math.round(value / 5) * 5;
}

/**
 * Nursery pots come in a fixed ladder of sizes, so "a 27cm pot" is not a thing
 * anyone can buy. Snap to the size below the opening.
 */
const NURSERY_POTS = [9, 12, 15, 19, 24, 30, 35];

function nurseryPot(opening: number): number | null {
  const target = opening - 4;
  const fits = NURSERY_POTS.filter((size) => size <= target);
  return fits.at(-1) ?? null;
}

/** A wall clock and a round planter are both stated as width × height. */
function diameterOf(product: ProductFacts): number | null {
  const across = Math.max(product.width ?? 0, product.height ?? 0);
  return across > 0 ? across : null;
}

// ---------------------------------------------------------------------------

const GUIDES: GuideSpec[] = [
  // -------------------------------------------------------------------------
  {
    slug: "where-to-hang-a-wall-clock",
    title: "What size wall clock do you need, and where does it hang?",
    excerpt:
      "Two-thirds the width of the furniture beneath it, centred 150–170cm from the floor. The sizes by room, the five rules, and our own clocks measured against them.",
    categorySlug: "wall-clocks",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "A wall clock wants to be about two-thirds as wide as the furniture beneath it, and its centre wants to sit between 150cm and 170cm from the floor. Over a 120cm sideboard that is a clock of roughly 80cm. On a bare wall with nothing under it, measure the usable run — architrave to shelf, not corner to corner — and take about half.",
          "Those two numbers settle most of it. The rest of this guide is the five rules they come from, what changes room by room, and eight of our own clocks measured against the same arithmetic.",
        ],
      },
      {
        table: {
          caption: "Clock size by what sits underneath it",
          headers: [
            "What is below",
            "Its width",
            "Clock diameter",
            "Clear wall needed",
          ],
          rows: [
            ["Small console", "80–100cm", "50–65cm", "100–130cm"],
            ["Sideboard", "110–130cm", "70–85cm", "140–170cm"],
            ["Large sideboard", "140–170cm", "90–110cm", "180–220cm"],
            ["Fireplace", "Mantel 120–140cm", "75–95cm", "Mantel width"],
            [
              "Nothing",
              "Usable wall run",
              "About half of it",
              "The run itself",
            ],
          ],
        },
        tool: {
          tool: "wall-clock-size",
          caption: "Your sideboard, your wall, your kitchen gap",
        },
      },
      {
        heading: "Rule one. Two-thirds of what is below it",
        paragraphs: [
          "The proportion that governs mirrors and pictures governs clocks too. Aim for around two-thirds the width of the furniture underneath — a little under is safe, a little over starts to look top-heavy.",
          "A 40cm clock over a 60cm console reads as deliberate. The same clock over a 180cm sideboard reads as lost, and no amount of styling either side of it fixes that, because the problem is the ratio rather than the arrangement.",
        ],
      },
      {
        heading:
          "Rule two. Centre at 150–170cm if you read it, 145cm if you do not",
        paragraphs: [
          "A clock you genuinely use — a kitchen clock, a hallway clock — goes higher than a picture. Centre it somewhere between 150cm and 170cm from the floor. Above head height it stays clear of furniture and sightlines, and a clock face stays legible at an angle in a way that artwork does not.",
          "A clock that is there to look like something follows the gallery convention instead: centre at about 145cm, roughly eye level for an adult standing in front of it. That is the height that makes it read as part of a wall rather than as a fixture on it.",
        ],
      },
      {
        heading: "Rule three. Leave half a diameter of clear wall each side",
        paragraphs: [
          "A clock needs breathing space of roughly half its own diameter on each side, which means an 80cm clock wants about 160cm of wall to itself. Below that it reads as crammed in rather than placed.",
          "This is why the wall run matters more than the room size. A large room with a 90cm gap between a door frame and a bookcase is a small-clock room.",
        ],
      },
      {
        heading:
          "Rule four. In a kitchen, work from the cabinets, not the floor",
        paragraphs: [
          "Wall cabinets usually top out at around 210cm, and the gap between them and the ceiling is where a kitchen clock ends up. Centre it in that gap rather than at the height you would use anywhere else, or it looks like it landed there by accident.",
          "If the gap is 40cm, the clock is a 25–30cm clock, whatever the rest of the room would take. The gap is the constraint and there is no arguing with it.",
        ],
      },
      {
        heading: "Rule five. Face where people sit still",
        paragraphs: [
          "A clock wants to be seen from where people stop, not from where they pass through. In a kitchen that is usually the wall facing the sink or the hob. In a living room it is the wall you look at from the sofa — which is often the wall the television is already on, and therefore already busy.",
          "It also wants to be off the main entry sightline. A clock directly opposite a door is the first thing anyone sees on walking in, which is a great deal of attention for an object whose job is to be glanced at.",
        ],
      },
      {
        heading: "Room by room",
        paragraphs: [
          "Kitchen. 25–40cm if it is going in the gap above the cabinets, 50–60cm if it has a clear wall. Legibility beats everything else here — this is the one room where a clock is actually read, usually from across the room and usually in a hurry.",
          "Living room. 60–90cm over a sideboard or a fireplace, centred at 145–155cm. This is the room where a clock is mostly decorative, so it can take a face that is more shape than numerals.",
          "Hallway. Go larger than the space suggests. A hallway is seen in passing and at an angle, and a 70–80cm clock on a hall wall reads as a decision, where a 30cm one reads as an oversight. Centre at 160cm, because everyone in a hallway is standing.",
          "Bedroom. 40–60cm, and put it on the wall you do not face from the bed. A clock in a bedroom is for the morning, not for three in the morning.",
          "Home office. 30–40cm, at eye level from the desk chair — around 120–130cm if you sit at a standard desk. This is the one place a lower centre is correct, because you are seated the whole time you need it.",
        ],
      },
    ],
    audit: {
      heading: (n) => `${numberWord(n)} of our clocks against the rules`,
      intro:
        "The same arithmetic, run over our own stock. Furniture width is the clock diameter divided by two-thirds; clear wall is the diameter plus half of it on each side.",
      caption: "Our clocks, measured",
      headers: ["Clock", "Across", "Suits furniture", "Wall it needs"],
      limit: 8,
      row: (product) => {
        const d = diameterOf(product);
        if (!d) return null;
        return [
          displayName(product.title),
          cm(d),
          `${round5(d / 0.7)}–${round5(d / 0.6)}cm wide`,
          `${round5(d * 2)}cm clear`,
        ];
      },
      outro:
        "Read it the other way round if it helps: measure the sideboard, find the row whose middle column contains that number, and the clock in the first column is the one that fits.",
    },
    closing: [
      {
        heading: "The short version",
        paragraphs: [
          "Two-thirds the width of the furniture below. Centre at 150–170cm if you read it, 145cm if you do not. Half a diameter of clear wall each side. In a kitchen, measure the gap above the cabinets instead. And hang it facing the sofa, not the door.",
        ],
      },
    ],
    faqs: [
      {
        question: "How high should a wall clock be hung?",
        answer:
          "Centre the face between 150cm and 170cm from the floor if you intend to read the clock, and at about 145cm if it is mainly decorative. The lower figure is standard gallery height, which is why a clock hung there sits comfortably alongside pictures.",
      },
      {
        question: "What size clock goes above a fireplace?",
        answer:
          "Take about two-thirds of the mantel width. A 130cm mantel suits a clock of roughly 85cm. Leave at least 15cm between the top of the mantel and the bottom of the clock, and centre the clock on the chimney breast rather than on the room.",
      },
      {
        question: "Can a clock hang on the same wall as the television?",
        answer:
          "It can, but not beside it at the same height — two round or rectangular objects competing on one wall makes the wall look unresolved. Put the clock on the adjacent wall, or high enough above the television that the two read as separate.",
      },
      {
        question: "Is a large clock too much in a small room?",
        answer:
          "Usually the opposite. A single large clock on a small wall reads as one confident decision, where several small objects read as clutter. The limit is the wall run rather than the room: you need the clock's diameter plus about half of it again in clear wall.",
      },
      {
        question: "What fixing does a wall clock need?",
        answer:
          "Most hang from a single point and weigh under 3kg, so on masonry a plug and screw is enough. On plasterboard use a proper hollow-wall anchor rather than the plug supplied in the box. Check for pipes and cables first — they run vertically above sockets and switches and horizontally near the ceiling, which is exactly where a clock tends to go.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "how-many-lights-does-a-room-need",
    title: "How many lights does a room need?",
    excerpt:
      "Three sources at three heights, and 100–150 lumens per square metre in a living room. The figures by room, the six rules, and our own lights sorted by the layer each one fills.",
    categorySlug: "lighting",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "At least three light sources per room, at three different heights, and about 100–150 lumens per square metre for general living. A 4m by 4m sitting room therefore wants somewhere between 1,600 and 2,400 lumens in total, spread across four or five fittings — not concentrated in one 2,000-lumen ceiling light.",
          "The distinction is the whole point. A room lit by a single overhead fixture looks flat at every hour of the day, and no amount of money spent on that one fixture fixes it, because the problem is that there is only one of it. Light arriving from one angle removes the shadows that give a room depth.",
        ],
      },
      {
        table: {
          caption: "Light levels by room, and what that means in a 16m² space",
          headers: ["Room", "Lumens per m²", "Sources", "Total in a 16m² room"],
          rows: [
            ["Living room", "100–150", "4–6", "1,600–2,400 lm"],
            ["Bedroom", "75–100", "3–4", "1,200–1,600 lm"],
            ["Kitchen, general", "200–250", "3–5", "3,200–4,000 lm"],
            [
              "Kitchen worktop",
              "400–500 at the surface",
              "Under-cabinet",
              "Task, not ambient",
            ],
            ["Hallway", "100", "2–3", "Two sources minimum"],
            [
              "Desk",
              "400–500 at the desk",
              "One task lamp",
              "Task, not ambient",
            ],
          ],
        },
      },
      {
        heading: "Rule one. Three sources, three heights",
        paragraphs: [
          "Overhead, mid-level, and low. A pendant or ceiling light; a table lamp or wall light at around eye level when seated; and something low — a floor lamp's pool of light, a lamp on a low table, a candle.",
          "Three is a minimum rather than a target. A large living room comfortably takes five or six. What matters is not the count but that they sit at different heights, because the height difference is what creates the shadows.",
        ],
      },
      {
        heading: "Rule two. Count lumens, not watts and not fittings",
        paragraphs: [
          "Watts measure what a bulb costs to run, which stopped being a proxy for brightness when LEDs arrived. Lumens measure the light. A traditional 60W bulb is about 800 lumens, and that is the number to plan with.",
          "Fittings are an even worse proxy. A five-bulb pendant is five bulbs' worth of light from one point on the ceiling, which counts as one source under rule one no matter how many lamps are in it.",
        ],
      },
      {
        heading: "Rule three. Every seat gets its own light",
        paragraphs: [
          "Start from where people sit rather than from the middle of the ceiling. Every seat wants light within reach of it — a side table with a lamp on it, or a floor lamp behind the shoulder. An armchair with no light of its own is a chair nobody chooses in the evening.",
          "Sitting in the room after dark and noting which seats are in shadow is more useful than any lighting plan drawn on paper.",
        ],
      },
      {
        heading: "Rule four. One colour temperature per room",
        paragraphs: [
          "Mixing warm and cool white in one space is visible and unpleasant in a way that is hard to place until you know what you are looking at. The room reads as slightly wrong rather than obviously mismatched, and people redecorate over problems that were only ever the bulbs.",
          "2700K is the warm domestic standard for living rooms and bedrooms. Kitchens and bathrooms can take 3000K, which is crisper without being clinical. Anything above 4000K belongs in a garage.",
        ],
      },
      {
        heading: "Rule five. Dimmers on everything you can",
        paragraphs: [
          "One fitting at three different levels is functionally three fittings. Dimming is the cheapest upgrade available to a room that already has lights in it, and it is the difference between a ceiling light being the enemy and being useful.",
          "Check the bulb is dimmable and the dimmer is rated for LED. A non-dimmable LED on a dimmer buzzes, flickers, and eventually fails.",
        ],
      },
      {
        heading: "Rule six. Light the corners",
        paragraphs: [
          "A dark corner shrinks a room. A single lamp in one is the cheapest way to make a space feel larger, and it is the usual reason a room feels smaller in the evening than it does in daylight.",
          "It does not need to be bright. A low-output lamp in a corner is doing a job of geometry, not of illumination.",
        ],
      },
      {
        heading: "Room by room",
        paragraphs: [
          "Living room. Four to six sources. A pendant on a dimmer, a table lamp at each end of the seating, a floor lamp behind a reading chair, and something in the darkest corner. This is the room where the three-source minimum is genuinely a minimum.",
          "Bedroom. Three or four. Both sides of the bed want their own light that can be turned off from the bed, which is the one non-negotiable. Keep the overhead dim and warm.",
          "Kitchen. Ambient overhead, then task light at the worktop, and that task light needs to come from in front of you rather than behind — a downlight behind your shoulder puts your own shadow on the chopping board. Under-cabinet lighting solves this completely.",
          "Dining room. A pendant over the table, hung 70–90cm above the tabletop so it lights the table without sitting in the eyeline of the people around it. Then at least one other source in the room, or the table becomes a stage.",
          "Hallway. Two sources minimum, because a hallway lit by one overhead fitting is a corridor. A console lamp does more for a hall than a brighter ceiling light does.",
        ],
        tool: {
          tool: "pendant-light",
          caption: "The overhead layer: what diameter, and how far down",
        },
      },
    ],
    audit: {
      heading: (n) =>
        `${numberWord(n)} of our lights, and the layer each one fills`,
      intro:
        "Rule one is about heights, so the useful thing to know about a fitting is which of the three it occupies. These are our own, with the measurements they are listed at.",
      caption: "Our lighting by layer",
      headers: ["Light", "Size", "Layer", "Where it goes"],
      limit: 8,
      row: (product) => {
        const h = product.height;
        const w = Math.max(product.width ?? 0, product.length ?? 0);
        if (!h) return null;
        const name = displayName(product.title);
        const isPendant = /pendant|ceiling/i.test(name);
        const isFloor = /floor lamp/i.test(name);
        const size = w ? `${cm(w)} × ${cm(h)}` : cm(h);
        if (isPendant) {
          return [
            name,
            `${size} drop`,
            "Overhead",
            `Needs ${round5(h + 210)}cm ceiling to clear a head, or hang it over a table`,
          ];
        }
        if (isFloor) {
          return [
            name,
            size,
            "Low and mid",
            "Beside a chair or in a dark corner",
          ];
        }
        // A table lamp is sized by where its shade ends up, not by the lamp.
        // In a living room the shade wants to land at 150–160cm so it sits at
        // eye level for someone sitting down; beside a bed the target is
        // 105–120cm, for reading. So the surface height is the target minus
        // the lamp, and which target applies depends on the lamp's height.
        const bedside = h < 70;
        return [
          name,
          size,
          "Mid-level",
          bedside
            ? `Bedside table of ${round5(105 - h)}–${round5(120 - h)}cm`
            : `Console or sideboard of ${round5(150 - h)}–${round5(165 - h)}cm`,
        ];
      },
      outro:
        "A room with one from each of the three rows is a room that follows rule one. A room with three from the same row is still a flat room, however much light is in it.",
    },
    closing: [
      {
        heading: "The short version",
        paragraphs: [
          "Three sources minimum, at three different heights. Plan in lumens — roughly 100–150 per square metre in a living room, double that in a kitchen. Give every seat its own light, keep one colour temperature per room at 2700K, put everything you can on a dimmer, and put a lamp in the darkest corner.",
        ],
      },
    ],
    faqs: [
      {
        question: "How many lumens does a living room need?",
        answer:
          "Around 100–150 lumens per square metre, so a 16m² room wants 1,600–2,400 lumens in total. Spread that across four to six fittings rather than putting it all in the ceiling — the total matters far less than the number of directions it arrives from.",
      },
      {
        question: "Is one ceiling light ever enough?",
        answer:
          "Only in a room you pass through rather than sit in, such as a utility room or a small landing. Anywhere people spend time, a single overhead source flattens the room because every surface is lit from the same angle and nothing casts a shadow.",
      },
      {
        question: "What colour temperature should I use at home?",
        answer:
          "2700K for living rooms and bedrooms, 3000K for kitchens and bathrooms. The important part is consistency within a single room — mixing temperatures is noticeable even when people cannot say what they are noticing.",
      },
      {
        question: "How high should a pendant hang over a dining table?",
        answer:
          "70–90cm above the tabletop. That lights the table properly while staying above the eyeline of people sitting across from each other. Over an island or a walkway, measure from the floor instead and leave at least 210cm of clearance.",
      },
      {
        question: "Do table lamps at each end of a sofa need to match?",
        answer:
          "They need to match in height and in colour temperature, not in design. Two lamps of noticeably different heights either side of a seating group unbalance it; two different designs at the same height read as considered.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "choosing-a-planter",
    title: "What size planter do you need?",
    excerpt:
      "Step up 2–4cm for a small plant and 5–10cm for a large one, never more. Pot sizes, compost volumes, the six rules, and our own planters with the nursery pot each one takes.",
    categorySlug: "planters",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "When you repot, go up by two to four centimetres of diameter for a small plant and five to ten for a large one. Not more. A 30cm planter holds roughly 15 litres of compost and a 60cm one holds over a hundred, which is the second thing worth knowing before buying. And if it is going outside, it needs a drainage hole — that one is not a preference.",
          "Planters are bought on looks and lost on those three numbers, because none of them is visible in a photograph.",
        ],
      },
      {
        table: {
          caption: "What to step up to, and what it will take to fill",
          headers: ["Plant is in", "Move it to", "Compost needed"],
          rows: [
            ["9cm nursery pot", "12cm", "About 0.5 litres"],
            ["12cm", "15cm", "About 1 litre"],
            ["15cm", "19cm", "About 2 litres"],
            ["19cm", "24cm", "About 4 litres"],
            ["24cm", "30cm", "About 8 litres"],
            ["30cm", "35–40cm", "15–25 litres"],
          ],
        },
        tool: {
          tool: "planter-size",
          caption: "Your planter, in litres — and whether you are over-potting",
        },
      },
      {
        heading: "Rule one. Two to four centimetres, not twenty",
        paragraphs: [
          "The instinct when repotting is to give a plant room to grow into. It is the wrong instinct, and it is the most common way a healthy plant dies after being moved.",
          "Compost holds water and roots are what remove it. Surround a small root system with a large volume of compost and most of that compost has no roots in it, so it stays saturated for days after every watering. Roots sitting in permanently wet compost rot. Step up gradually and do it again next year instead of trying to skip a stage.",
        ],
      },
      {
        heading: "Rule two. Outdoors, drainage is not optional",
        paragraphs: [
          "A planter with no holes, left outside through a British winter, fills with rainwater. There is no version of this that ends well. The plant drowns slowly over weeks, and because the surface of the compost looks normal throughout, the cause is rarely obvious until the plant is gone.",
          "If a planter you love has no holes, use it as a cover pot instead. Keep the plant in its nursery pot inside it, lift it out to water, and let it drain before it goes back. That is not a compromise — it is how most large indoor planting is actually done.",
        ],
      },
      {
        heading: "Rule three. Lift it off the ground",
        paragraphs: [
          "Holes pressed flat against paving seal themselves, and a pot with blocked drainage is a pot with no drainage. Pot feet, a couple of tiles or a pair of battens are all it takes.",
          "It also keeps the base out of standing water, which is what rots timber planters from the bottom up and what cracks ceramic ones in a freeze.",
        ],
      },
      {
        heading:
          "Rule four. Frost-resistant and frost-proof are different words",
        paragraphs: [
          "Water soaks into porous ceramic, freezes, expands, and splits the pot from the inside out. A pot that has survived three winters can fail in the fourth, because the damage accumulates invisibly before it shows.",
          "Glazed stoneware fired at high temperature generally copes. Low-fired terracotta generally does not, though it is the most forgiving material to plant into because it breathes. If a listing does not say frost-proof, treat it as a pot that comes in for winter.",
        ],
      },
      {
        heading: "Rule five. Fill the bottom third of anything over 40cm",
        paragraphs: [
          "Volume rises with the square of the radius, so a planter twice as wide holds four times as much. This surprises people at the checkout of a garden centre more than anywhere else in gardening.",
          "Unless you are planting something genuinely deep-rooted, fill the bottom third with something inert and light — broken polystyrene, upturned plastic pots, crushed cans. It saves a bag or two of compost and keeps the planter light enough to move, which you will want to do at least once.",
        ],
      },
      {
        heading: "Rule six. Match the depth to the root, not to the plant",
        paragraphs: [
          "Herbs, succulents and most bedding are shallow-rooted and are happier in a wide low bowl than in a tall column, where the compost at the bottom never dries.",
          "Shrubs, small trees and anything that will be there for years want depth — at least 40cm — because that is where the root ball goes and because a tall planter is far harder to blow over.",
        ],
      },
      {
        heading: "Where it is going",
        paragraphs: [
          "Windowsill. 12–15cm, and something with a saucer or a sealed base, because a windowsill is a wooden surface with a radiator under it. Small pots dry out fast in that position — expect to water twice as often as anywhere else in the house.",
          "Living room floor. 30–40cm for anything that reads as a floor plant. Below 30cm a floor-standing planter looks like it is waiting to go somewhere else.",
          "Doorstep and porch. Go tall rather than wide, and go in pairs. A pair of 50cm planters either side of a door does more for a house front than six pots scattered along it.",
          "Patio. Group in odd numbers at different heights and leave the smallest ones out of the group — a 15cm pot on a patio disappears. This is where the wide low bowls earn their place, planted densely enough to hide the compost.",
          "Balcony. Weight is the constraint, not size. Fill the bottom third as in rule five, use a soil-less compost, and keep the tall ones against the wall rather than at the rail.",
        ],
      },
    ],
    audit: {
      heading: (n) => `${numberWord(n)} of our planters, and what goes in them`,
      intro:
        "Working the rules backwards: the nursery pot each planter takes is its opening less about 4cm, rounded down to a size nursery pots are actually sold in, and the compost figure is the internal volume with the root ball allowed for.",
      caption: "Our planters, measured",
      headers: ["Planter", "Opening × depth", "Takes a plant in", "Compost"],
      limit: 8,
      row: (product) => {
        const across = diameterOf(product) ?? 0;
        const height = product.height ?? 0;
        const opening = Math.min(
          product.width ?? across,
          product.length ?? across,
        );
        if (!opening || !height) return null;

        // The height field is the whole product, and on a raised planter with
        // a trellis that is mostly trellis — one of these is 38cm across and
        // 150cm tall, and treating the 150 as planting depth claimed it held
        // 119 litres of compost. A plant stand in the same category claimed 55.
        //
        // Nothing in the data distinguishes a deep pot from a tall frame, so
        // the honest move is to judge only the pots whose proportions can be
        // read: a vessel taller than about one and a half times its opening is
        // left out of the table rather than described from a guess.
        if (height > opening * 1.6) return null;

        const nursery = nurseryPot(opening);
        if (!nursery) return null;

        const litres = (Math.PI * (opening / 2) ** 2 * height * 0.7) / 1000;
        return [
          displayName(product.title),
          `${cm(opening)} × ${cm(height)}`,
          `${nursery}cm pot`,
          litres < 10
            ? `${Math.round(litres * 2) / 2} litres`
            : `${Math.round(litres)} litres`,
        ];
      },
      outro:
        "Our tall planters and trellis boxes are missing from this table on purpose. Their listed height is the whole piece rather than the planting depth, so a compost figure worked from it would be wrong by a factor of three — for those, measure the inside of the box and use the calculator above.",
    },
    closing: [
      {
        heading: "The short version",
        paragraphs: [
          "Step up 2–4cm for a small plant, 5–10cm for a large one. Outdoors, it must have holes, and it must sit off the ground. Assume ceramic is not frost-proof unless the listing says so. Fill the bottom third of anything over 40cm. And match the depth to the roots — bowls for herbs, columns for shrubs.",
        ],
      },
    ],
    faqs: [
      {
        question: "What size pot should I repot a plant into?",
        answer:
          "Two to four centimetres wider in diameter for a small houseplant, five to ten for a large one. Going much bigger surrounds the roots with compost they cannot dry out, and waterlogged compost is what causes root rot after repotting.",
      },
      {
        question: "Do planters need drainage holes?",
        answer:
          "Outdoors, always — a planter with no holes fills with rainwater and drowns the plant over a few weeks. Indoors you can use a planter with no holes as a cover pot, keeping the plant in its nursery pot inside it and lifting it out to water.",
      },
      {
        question: "Can ceramic planters stay outside in winter?",
        answer:
          "Only if they are described as frost-proof. Water soaks into porous ceramic, freezes and splits the pot from within, and the damage builds up over several winters before it shows. High-fired glazed stoneware generally survives; low-fired terracotta generally does not.",
      },
      {
        question: "How much compost does a large planter take?",
        answer:
          "Far more than it looks. A 30cm planter takes roughly 15 litres, a 40cm one around 30, and a 60cm one over a hundred, because volume rises with the square of the radius. Filling the bottom third of anything over 40cm with something inert saves a bag and keeps the planter movable.",
      },
      {
        question: "Should a planter be tall or wide?",
        answer:
          "Match it to the roots. Herbs, succulents and bedding are shallow-rooted and do better in a wide low bowl. Shrubs and small trees want at least 40cm of depth, which also makes the planter much harder to blow over.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "choosing-a-vase-for-what-you-put-in-it",
    title: "What size vase do you need for your flowers?",
    excerpt:
      "The vase should be half to two-thirds the height of the arrangement — 30cm of vase to stems bought at 50–70cm. Stem counts by neck width, five rules, and our own vases measured.",
    categorySlug: "vases",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "A vase should stand about half to two-thirds the height of the finished arrangement. A 30cm vase therefore suits flowers standing 45–60cm above the table, which means stems bought at roughly 50–70cm once you allow for what sits below the waterline.",
          "The second number matters more and nobody quotes it: the neck. A narrow neck holds the stems upright for you and looks full with five. A wide mouth lets them fall outwards and needs fifteen to twenty before it stops looking sparse. That is the difference between a bunch that works at home and one that collapses on the table.",
        ],
      },
      {
        table: {
          caption: "Vase height, arrangement height, and how much to buy",
          headers: [
            "Vase height",
            "Finished height",
            "Stems to buy",
            "Stems needed",
          ],
          rows: [
            ["15cm", "25–30cm", "30–40cm", "3–5 narrow, 10–12 wide"],
            ["20cm", "30–40cm", "40–50cm", "5–7 narrow, 12–15 wide"],
            ["30cm", "45–60cm", "50–70cm", "7–10 narrow, 15–20 wide"],
            ["40cm", "60–80cm", "70–90cm", "Branches, or 20–25 stems"],
            [
              "55cm+",
              "80–110cm",
              "Branches and dried stems",
              "3–7 sculptural stems",
            ],
          ],
        },
        tool: {
          tool: "vase-size",
          caption: "Your vase, and what to buy for it",
        },
      },
      {
        heading: "Rule one. Half to two-thirds",
        paragraphs: [
          "This is the ratio florists work to and it holds at every size. Shorter than half and the arrangement is top-heavy, both to look at and in practice — a wide bunch in a short vase tips.",
          "Taller than two-thirds and the flowers vanish into the vessel. That can be a deliberate effect with three sculptural stems in a tall column, but it rarely works with a mixed bunch, where the point is the flowers rather than the silhouette.",
        ],
      },
      {
        heading: "Rule two. The neck decides how much you have to buy",
        paragraphs: [
          "A wide-mouthed vase needs enough stems that they support each other, and half-filled it reads as sparse rather than minimal. Filling one properly costs two or three supermarket bunches.",
          "A narrow neck is far more forgiving. Three or five stems in a narrow-necked vase reads as considered; the same three in a wide bowl read as leftovers. If you buy flowers at a supermarket rather than a florist, narrow necks will serve you better and cost you less.",
        ],
      },
      {
        heading:
          "Rule three. A single stem wants a neck barely wider than it is",
        paragraphs: [
          "For one allium, a branch of blossom, a dried palm — the neck should be close to the diameter of the stem itself. Anything more and it leans, and a single leaning stem looks like an accident rather than a choice.",
          "Bottle-necked vases exist for exactly this and are the easiest arrangement in the house: one stem, one vase, done.",
        ],
      },
      {
        heading: "Rule four. Fill-test a new vase in the sink",
        paragraphs: [
          "Not every decorative vessel holds water. Unglazed ceramic seeps slowly, some metals corrode from the inside, and anything assembled from parts can weep at the join. Fill a new vase and leave it half an hour before it goes anywhere near a wooden surface.",
          "Where a vessel is not watertight, a glass jar or a florist's liner inside it solves the problem completely and is invisible once the flowers are in.",
        ],
      },
      {
        heading: "Rule five. Three vessels beat one",
        paragraphs: [
          "A single vase on a large surface almost always looks stranded. Three of different heights, grouped close enough to read as one object, hold a table or a mantelpiece far better — and cost less in flowers, because two of the three can take a single stem or nothing at all.",
          "Odd numbers and varied heights are the whole trick. A matched pair at the same height reads as a shop display; three at different heights read as somebody having made a decision.",
        ],
      },
      {
        heading: "Where it stands",
        paragraphs: [
          "Dining table. Under 30cm, without exception, because people have to see over it. A pair of low bowls down the length of a long table works better than one tall arrangement in the middle, which nobody at the table can see past.",
          "Console and hallway. This is where height belongs. 40–55cm, with branches or tall stems, seen from a distance and from one side only.",
          "Mantelpiece. Two or three vessels of different heights, grouped towards one end rather than centred. Keep the tallest under the height of whatever hangs above it, or the two objects fight.",
          "Kitchen worktop. 15–20cm and watertight, because it will be knocked. This is the position for a single supermarket bunch cut short.",
          "Floor. 50cm and up, and heavy enough not to go over. Branches rather than flowers — pussy willow, eucalyptus, anything that lasts months rather than days.",
        ],
      },
    ],
    audit: {
      heading: (n) => `${numberWord(n)} of our vases, and what to buy for them`,
      intro:
        "Rule one applied to our own stock. Shape is taken from the widest measurement against the height — a vessel as wide as it is tall behaves like a bowl however it is described.",
      caption: "Our vases, measured",
      headers: ["Vase", "Height", "Proportion", "Stems to buy"],
      limit: 8,
      row: (product) => {
        const h = product.height ?? 0;
        const w = Math.max(product.width ?? 0, product.length ?? 0);
        if (!h || !w) return null;
        // Width here is the widest point of the vessel, which on a bulbous
        // vase is its belly rather than its mouth. It is honest about
        // proportion and says nothing about the neck, so the column does not
        // claim to.
        const ratio = w / h;
        const proportion =
          ratio >= 0.85
            ? "As wide as it is tall"
            : ratio <= 0.45
              ? "Tall and slim"
              : "Classic proportion";
        return [
          displayName(product.title),
          cm(h),
          proportion,
          `${round5(h * 1.7)}–${round5(h * 2.2)}cm stems`,
        ];
      },
      outro:
        "Proportion is measured at the widest point, which on a rounded vase is its belly rather than its mouth — so read that column as shape rather than as neck width. The stem count still follows rule two, and the calculator above will give it for whichever neck the vase you are looking at actually has.",
    },
    closing: [
      {
        heading: "The short version",
        paragraphs: [
          "Vase height, half to two-thirds of the finished arrangement. Narrow necks need five stems, wide mouths need twenty. A single stem wants a neck barely wider than itself. Test a new vase in the sink before it touches wood. And buy three of different heights rather than one big one.",
        ],
      },
    ],
    faqs: [
      {
        question: "How tall should a vase be for the flowers?",
        answer:
          "About half to two-thirds the height of the finished arrangement. A 30cm vase suits flowers standing 45–60cm above the table, which is stems bought at roughly 50–70cm once you allow for the length below the waterline.",
      },
      {
        question: "How many stems do I need to fill a vase?",
        answer:
          "It depends on the neck rather than the size. A narrow-necked 30cm vase looks full with seven to ten stems; a wide-mouthed one of the same height needs fifteen to twenty, because nothing is holding the stems upright but each other.",
      },
      {
        question: "What size vase is right for a dining table?",
        answer:
          "Under 30cm, so people can see across it. On a long table, two or three low vessels spaced down the length work better than a single tall arrangement in the centre.",
      },
      {
        question: "Why do my flowers flop outwards?",
        answer:
          "Almost always because the mouth of the vase is too wide for the number of stems in it. Either add stems until they support each other, or move the bunch to something with a narrower neck — a jam jar inside the vase will do it invisibly.",
      },
      {
        question: "Can I use a vase that is not watertight?",
        answer:
          "Yes, with a glass jar or a florist's liner inside it. Fill any new vessel in the sink and leave it half an hour before trusting it on a wooden surface — unglazed ceramic seeps slowly and anything made from parts can weep at the join.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  {
    slug: "garden-furniture-british-winter",
    title: "What garden furniture can stay out all winter?",
    excerpt:
      "Teak, powder-coated aluminium and rattan on an aluminium frame need nothing. Everything soft comes in by the end of October. The materials table, six rules, and our own sets with the job each one needs.",
    categorySlug: "garden-furniture",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "Teak, powder-coated aluminium, and synthetic rattan over an aluminium frame all stay out through a British winter with no work at all. Steel frames stay out too but want their chips touched up once a year. Everything soft — cushions, seat pads, parasols — comes in, without exception, by the end of October.",
          "Almost all garden furniture sold in the UK is described as weatherproof, and almost all of it is, for rain. A British winter is not really a rain problem. It is a freeze-thaw problem, a standing-damp problem and a wind problem, and materials that shrug off a wet July can still come apart by March.",
        ],
      },
      {
        table: {
          caption: "What survives a winter outside, and what it costs you",
          headers: [
            "Material",
            "Stays out",
            "Annual work",
            "What actually kills it",
          ],
          rows: [
            [
              "Teak",
              "Yes",
              "None",
              "Nothing. It turns silver-grey and stays strong",
            ],
            [
              "Powder-coated aluminium",
              "Yes",
              "Wash it",
              "Wind, if the piece is light",
            ],
            [
              "Rattan over aluminium",
              "Yes",
              "Wash the weave",
              "UV, over many years",
            ],
            [
              "Rattan over steel",
              "Yes, with care",
              "Touch up chips",
              "Rust spreading under the weave",
            ],
            [
              "Untreated softwood",
              "No",
              "Annual treatment",
              "Rot where it meets the ground",
            ],
            [
              "Cushions and parasols",
              "No",
              "Store them dry",
              "Water in the foam, then a frost",
            ],
          ],
        },
        tool: {
          tool: "furniture-material",
          caption: "Which material for your garden, and your patience",
        },
      },
      {
        heading: "Rule one. Look at the frame, not the weave",
        paragraphs: [
          "Synthetic rattan is a wrapping rather than a material, so what decides its winter is the frame underneath it. Over aluminium it is a year-round proposition. Over steel it depends entirely on the coating.",
          "The reason that matters is where the failure happens. A scratch that reaches steel rusts outwards from that point beneath the weave, where you cannot see it, and by the time it shows on the surface the frame has been going for a year.",
        ],
      },
      {
        heading: "Rule two. Everything soft comes in",
        paragraphs: [
          "Cushions, seat pads, parasols and sling seats. No exceptions and no arguments. It is the foam and the fabric that suffer rather than the frame — foam holds water, and water in foam through a freeze does not recover.",
          "They do not need to be indoors so much as out of the weather. A storage box, a shed or a hallway is enough. Sling seats are the ones people forget: the aluminium frame is fine outside and the tensioned fabric is not, which makes those chairs a soft furnishing with legs.",
        ],
      },
      {
        heading: "Rule three. A non-breathable cover is worse than no cover",
        paragraphs: [
          "A cover that does not breathe traps moisture against the furniture and holds it there. Under a fitted plastic cover, a teak set can grow mould on surfaces that would have stayed clean in the open air, because the timber never gets a dry spell.",
          "If you cover furniture, use a breathable cover and lift it occasionally on a dry day. If that is more attention than you will realistically give it, leaving weatherproof furniture uncovered is the better decision. It is what the material is for.",
        ],
      },
      {
        heading: "Rule four. Get it off the ground",
        paragraphs: [
          "Standing water is what does the damage, and it collects at the feet. Timber wicks it up, steel rusts from the base, and anything hollow fills and then freezes.",
          "Feet, a couple of slabs, or moving the set onto paving rather than grass for the winter all achieve the same thing. It is the cheapest single thing you can do for a garden set and almost nobody does it.",
        ],
      },
      {
        heading: "Rule five. On an exposed site, buy something that stacks",
        paragraphs: [
          "Lightweight aluminium is easy to move for mowing, which is the same property that makes it move on its own in a gale. On a roof terrace, a coastal garden, or anywhere with a clear run at it, either choose heavier pieces or accept that some things need putting away when the forecast turns.",
          "A stacking set solves this better than a heavy set does, because the answer to wind is having somewhere for the furniture to be that is not the middle of the lawn.",
        ],
      },
      {
        heading: "Rule six. Do the touching-up in October, not March",
        paragraphs: [
          "A chip in a powder coat is a small job in autumn and a rust patch in spring. The same is true of a split in a timber joint, which takes on water all winter and opens further with every freeze.",
          "Twenty minutes at the end of the season is the whole of the maintenance most garden furniture ever needs, and it is the difference between a set lasting five years and fifteen.",
        ],
      },
      {
        heading: "By where you are putting it",
        paragraphs: [
          "Lawn. Move it onto something hard for the winter if you can. Furniture left on grass sits in standing water for months, and the grass beneath it dies anyway.",
          "Patio and paving. The easiest case. Feet or slabs under the legs, cushions in, and leave the frames where they are.",
          "Balcony and roof terrace. Wind is the whole problem. Choose stacking or heavy, and never leave a parasol up, even folded — a folded parasol in a gale is a sail on a pole.",
          "Coastal. Salt air attacks coatings faster than inland weather does. Rinse with fresh water at the end of the season, check every chip, and prefer aluminium, which cannot rust, over coated steel.",
          "Under a tree. Sap and leaf fall stain, and wet leaves left on a surface all winter mark timber permanently. Sweep it clear in November rather than in spring.",
        ],
      },
    ],
    audit: {
      heading: (n) =>
        `${numberWord(n)} of our sets, and the October job for each`,
      intro:
        "Frame is what the piece is listed as being made from. The job column is rules two, four and six applied to that material — the whole of what these sets need before winter.",
      caption: "Our garden furniture, and its winter",
      headers: ["Set", "Largest piece (W × D × H)", "Frame", "The October job"],
      limit: 8,
      row: (product) => {
        const name = displayName(product.title);
        const { length, width, height } = product;
        if (!length || !width || !height) return null;
        // Length and width are recorded either way round, so a 202cm sofa was
        // printing as "108 × 202". Widest first, then depth, then height.
        const size = `${cm(Math.max(length, width))} × ${cm(Math.min(length, width))} × ${cm(height)}`;
        const isAluminium = /aluminium/i.test(name);
        const isRattan = /rattan/i.test(name);
        if (isAluminium) {
          return [
            name,
            size,
            "Aluminium",
            "Cushions in. Wash the frame. Nothing to rust",
          ];
        }
        if (isRattan) {
          return [
            name,
            size,
            "Rattan weave",
            "Cushions in. Wash the weave, check the feet for rust",
          ];
        }
        return [
          name,
          size,
          "Outdoor frame",
          "Cushions in. Wash it, lift it off the ground",
        ];
      },
      outro:
        "Every row says cushions in, because rule two has no exceptions. Beyond that the difference between the aluminium sets and the rest is about ten minutes a year.",
    },
    closing: [
      {
        heading: "The short version",
        paragraphs: [
          "Teak, powder-coated aluminium and rattan on an aluminium frame stay out all year and need washing, nothing more. Steel wants its chips touched up. Everything soft comes in by the end of October. Skip the plastic cover, get the legs off the ground, and if the site is exposed, buy something that stacks.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can rattan garden furniture stay outside all winter?",
        answer:
          "Synthetic rattan can, but what decides it is the frame underneath the weave rather than the weave itself. Over aluminium it is genuinely year-round. Over steel it depends on the coating, because a scratch that reaches the steel rusts outwards under the weave where you cannot see it.",
      },
      {
        question: "Do I need to cover garden furniture in winter?",
        answer:
          "Only with a breathable cover, and only if you will lift it occasionally on a dry day. A non-breathable cover traps moisture against the furniture and can cause mould on a set that would have been fine left in the open air.",
      },
      {
        question: "Does teak need oiling?",
        answer:
          "No. Teak contains enough natural oil to sit outside untreated for decades. Left alone it turns from honey to silver-grey over about a year, which is a surface effect only — the timber beneath is unchanged and the strength is unaffected. Oil it only if you want to keep the original colour.",
      },
      {
        question: "What has to come indoors?",
        answer:
          "Cushions, seat pads, parasols and sling seats, by the end of October. Foam holds water and water in foam through a freeze does not recover. They need to be out of the weather rather than genuinely indoors, so a shed or a storage box is enough.",
      },
      {
        question: "Will garden furniture blow over?",
        answer:
          "Lightweight aluminium will, on any exposed site. The property that makes it easy to move for mowing is the property that makes it move in a gale. On a roof terrace or a coastal garden, either buy heavier pieces or buy something that stacks so there is somewhere for it to go.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------

let keySeed = 0;

function textBlock(text: string, style: string, slug: string) {
  const key = `${slug}-${keySeed++}`;
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
  };
}

function tableBlock(table: TableSpec, slug: string) {
  const key = `${slug}-t${keySeed++}`;
  return {
    _type: "guideTable",
    _key: key,
    ...(table.caption ? { caption: table.caption } : {}),
    headers: table.headers,
    rows: table.rows.map((cells, index) => ({
      _type: "guideTableRow",
      _key: `${key}r${index}`,
      cells,
    })),
  };
}

function toolBlock(tool: { tool: string; caption?: string }, slug: string) {
  return {
    _type: "guideTool",
    _key: `${slug}-w${keySeed++}`,
    tool: tool.tool,
    ...(tool.caption ? { caption: tool.caption } : {}),
  };
}

function sectionBlocks(sections: Section[], slug: string): unknown[] {
  const blocks: unknown[] = [];
  for (const section of sections) {
    if (section.heading) blocks.push(textBlock(section.heading, "h2", slug));
    for (const paragraph of section.paragraphs ?? [])
      blocks.push(textBlock(paragraph, "normal", slug));
    if (section.table) blocks.push(tableBlock(section.table, slug));
    if (section.tool) blocks.push(toolBlock(section.tool, slug));
  }
  return blocks;
}

/** Words in the finished page, table cells and FAQs included. */
function wordCount(guide: GuideSpec, auditRows: string[][]): number {
  const parts: string[] = [];
  for (const section of [...guide.sections, ...guide.closing]) {
    if (section.heading) parts.push(section.heading);
    parts.push(...(section.paragraphs ?? []));
    if (section.table) {
      if (section.table.caption) parts.push(section.table.caption);
      parts.push(...section.table.headers, ...section.table.rows.flat());
    }
    if (section.tool?.caption) parts.push(section.tool.caption);
  }
  if (guide.audit) {
    parts.push(guide.audit.intro, ...guide.audit.headers, ...auditRows.flat());
    if (guide.audit.outro) parts.push(guide.audit.outro);
  }
  for (const faq of guide.faqs) parts.push(faq.question, faq.answer);
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

async function main() {
  const results: {
    slug: string;
    title: string;
    words: number;
    tables: number;
    tools: string[];
    faqs: number;
    audited: number;
    /** Kept in the change log so the published numbers are checkable later. */
    auditRows: string[][];
    products: string[];
    exists: boolean;
  }[] = [];

  for (const guide of GUIDES) {
    keySeed = 0;

    const category = await client.fetch<{ _id: string; name: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{_id, "name": title}`,
      { slug: guide.categorySlug },
    );
    if (!category) {
      console.log(`  SKIP ${guide.slug}: no category "${guide.categorySlug}"`);
      continue;
    }

    // Live, priced products only — a guide must never link to something that
    // cannot be bought.
    //
    // Fetched wider than the guide links, because the audit table draws from
    // this pool and some rows get dropped. In Planters the eight most expensive
    // products are the tall trellis boxes and plant stands, every one of which
    // the sizing rule has to refuse; the pots the guide is actually about are
    // further down the list.
    const candidates = await client.fetch<ProductFacts[]>(
      `*[_type == "product" && !(_id in path("drafts.**"))
         && defined(price) && references($catId)]
         | order(price desc)[0...$n]{
           _id, title, price,
           "length": dimensions.length,
           "width": dimensions.width,
           "height": dimensions.height,
           "unit": dimensions.unit
         }`,
      { catId: category._id, n: Math.max(guide.productCount, 24) },
    );

    // Anything measured in mm or m is converted before the arithmetic runs, so
    // a 1200mm planter is not reported as taking a 1196cm nursery pot.
    const measured: ProductFacts[] = candidates.map((product) => {
      const factor =
        product.unit === "mm" ? 0.1 : product.unit === "m" ? 100 : 1;
      const scale = (value?: number) =>
        typeof value === "number" ? value * factor : undefined;
      return {
        ...product,
        length: scale(product.length),
        width: scale(product.width),
        height: scale(product.height),
      };
    });

    const audited = guide.audit
      ? measured
          .map((product) => ({ product, row: guide.audit!.row(product) }))
          .filter(
            (entry): entry is { product: ProductFacts; row: string[] } =>
              entry.row !== null,
          )
          .slice(0, guide.audit.limit)
      : [];
    const auditRows = audited.map((entry) => entry.row);

    // The audit names products by name, so those are the ones to link. Without
    // this the Planters guide tabulated eight small pots and then linked the
    // eight most expensive trellis boxes, and none of the pots it had just
    // measured were reachable from the page.
    const linkedIds = new Set(audited.map((entry) => entry.product._id));
    const products = [
      ...audited.map((entry) => entry.product),
      ...candidates.filter((product) => !linkedIds.has(product._id)),
    ].slice(0, Math.max(guide.productCount, audited.length));

    const body = sectionBlocks(guide.sections, guide.slug);

    if (guide.audit && auditRows.length) {
      body.push(
        textBlock(guide.audit.heading(auditRows.length), "h2", guide.slug),
        textBlock(guide.audit.intro, "normal", guide.slug),
        tableBlock(
          {
            caption: guide.audit.caption,
            headers: guide.audit.headers,
            rows: auditRows,
          },
          guide.slug,
        ),
      );
      if (guide.audit.outro)
        body.push(textBlock(guide.audit.outro, "normal", guide.slug));
    }

    body.push(...sectionBlocks(guide.closing, guide.slug));

    const existing = await client.fetch<string | null>(
      `*[_type == "buyingGuide" && slug.current == $slug][0]._id`,
      { slug: guide.slug },
    );

    const tables =
      guide.sections.filter((section) => section.table).length +
      (auditRows.length ? 1 : 0);
    const tools = guide.sections
      .map((section) => section.tool?.tool)
      .filter((tool): tool is string => Boolean(tool));

    results.push({
      slug: guide.slug,
      title: guide.title,
      words: wordCount(guide, auditRows),
      tables,
      tools,
      faqs: guide.faqs.length,
      audited: auditRows.length,
      auditRows,
      products: products.map((product) => product.title),
      exists: Boolean(existing),
    });

    if (!apply) continue;

    const _id = existing ?? `buying-guide-${guide.slug}`;
    await client.createOrReplace({
      _id,
      _type: "buyingGuide",
      title: guide.title,
      slug: { _type: "slug", current: guide.slug },
      excerpt: guide.excerpt,
      body,
      author: { _type: "reference", _ref: "author-kaiku-editorial" },
      relatedCategory: { _type: "reference", _ref: category._id },
      relatedProducts: products.map((product) => ({
        _type: "reference",
        _ref: product._id,
        _key: `rel-${product._id}`.slice(0, 40),
      })),
      faqs: guide.faqs.map((faq, index) => ({
        _type: "faqEntry",
        _key: `${guide.slug}-faq-${index}`,
        question: faq.question,
        answer: faq.answer,
      })),
      publishedAt: new Date().toISOString(),
    });
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — buying guides\n`);
  for (const result of results)
    console.log(
      `  ${result.exists ? "update" : "create"}  ${String(result.words).padStart(4)} words  ` +
        `${result.tables} tables  ${result.tools.length} tools  ${result.faqs} FAQs  ` +
        `${result.audited} audited  ${result.title}`,
    );
  const total = results.reduce((n, r) => n + r.products.length, 0);
  console.log(`\n${results.length} guides, ${total} product links.`);

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-buying-guides.json`,
    JSON.stringify({ applied: apply, guides: results }, null, 2),
  );

  if (process.argv.includes("--show-tables"))
    for (const result of results) {
      console.log(`\n${result.title}`);
      for (const row of result.auditRows) console.log(`  ${row.join("  |  ")}`);
    }

  if (!apply) console.log("\nNothing written. Re-run with --apply.");
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
