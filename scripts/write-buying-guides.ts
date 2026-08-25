/**
 * Writes the buying guides — and gives 68 products their first editorial link.
 *
 * Two brief items meet here.
 *
 * The first is content: "buying guides, comparison pages, intent-led content". The
 * site had **one** guide, about saunas, so every product page outside the wellness
 * range showed "We're still writing a guide for this category" and `/learn` had a
 * single entry on it.
 *
 * The second is the reason it is urgent. `scripts/audit-internal-links.ts` found that
 * **96 of 99 published products are referenced by no post and no guide**, and an
 * editorial link is the link type Google weighs most. Search Console has 44 URLs at
 * "Discovered – currently not indexed", which is what happens to a page nothing
 * points at: Google has been told the URL exists and given no reason to spend a crawl
 * on it. Category links were fixed first (`scripts/link-related-categories.ts`);
 * editorial links are the bigger half.
 *
 * **Every measurement below is read from the catalogue, not invented.** The guides
 * quote real heights, depths and lengths of things Kaiku actually sells, because the
 * question a buying guide has to answer is "will this one work in my room", and a
 * page that answers it with generalities gets one visit. Where a guide names a piece,
 * that piece is in `relatedProducts`, so the article links to it and the product page
 * links back — `ArticleDetail` renders the references as followable links, which is
 * what makes this an internal-linking job rather than only a content job.
 *
 * The house style rules in scripts/lib/product-copy.ts apply. Nothing here is copied
 * from a supplier description.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-buying-guides.ts
 *   pnpm tsx --env-file=.env.local scripts/write-buying-guides.ts --apply
 */
import { createClient } from "@sanity/client";

import { BANNED_NAMES, BANNED_PHRASES } from "./lib/product-copy";

const apply = process.argv.includes("--apply");

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

interface Section {
  /** Omitted for the opening paragraphs, which sit under the article's own h1. */
  heading?: string;
  paragraphs: string[];
}

interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  /** Products the guide actually discusses, in the order it discusses them. */
  products: string[];
  sections: Section[];
}

const GUIDES: Guide[] = [
  {
    slug: "bedside-table-height-guide",
    title: "What height should a bedside table be?",
    excerpt:
      "Match the top of the table to the top of the mattress, then check the walkway. The measurements that decide it, and the eleven heights in the Kaiku range.",
    metaTitle: "What Height Should a Bedside Table Be? | Sizing Guide | Kaiku",
    metaDescription:
      "Measure your mattress top, not the bed frame. A guide to bedside table height, width and drawer clearance, with the real dimensions of eleven tables.",
    category: "bedside-tables",
    products: [
      "chilworth-grey-bedside-table",
      "broadway-oak-bedside-table",
      "serene-three-drawer-bedside-table",
      "hampton-grey-bedside-table",
      "grafton-black-bedside-table",
      "abberley-white-two-drawer-bedside-table",
      "charlton-ribbed-walnut-2-drawer-bedside-table",
      "berkeley-black-1-drawer-bedside-table",
      "hampton-ivory-square-bedside-table",
      "hampton-ivory-round-bedside-table",
      "classic-recycled-wood-bedside-table",
    ],
    sections: [
      {
        paragraphs: [
          "The measurement that matters is the top of your mattress, not the height of the bed frame. A bedside table wants its surface within about 5cm of the mattress top, either way. Level is ideal, a little below is comfortable, and much above means reaching up and over for a glass of water in the dark.",
          "So measure from the floor to the top of the mattress with the bedding on it. Most divans and upholstered beds land between 55cm and 65cm. Low platform beds can be 40cm; a deep mattress on a tall frame can be 70cm or more. Everything else in this guide follows from that one number.",
        ],
      },
      {
        heading: "The heights in the range, and the beds they suit",
        paragraphs: [
          "Kaiku's bedside tables run from 55cm to 66cm tall, which covers most of the beds sold in the UK but not all of them.",
          "At the low end, the Broadway Oak Bedside Table is 55cm high, which sits well against a platform bed or a lower divan. The bulk of the range is 59cm to 60cm — the Serene Three Drawer, the Chilworth Grey, the Grafton Black, the Abberley White, the Charlton Ribbed Walnut, the Berkeley Black and both Hampton Ivory tables — and that is the height to choose if your mattress top is 60cm to 65cm.",
          "The tallest is the Hampton Grey Bedside Table at 66cm, which is the one to pick against a tall frame with a deep mattress. The Bedside Table in Classic Recycled Wood is 65cm and does the same job in reclaimed timber.",
        ],
      },
      {
        heading: "Then check the walkway, not the wall",
        paragraphs: [
          "The second measurement people skip is the gap between the bed and whatever is beside it. Measure the space you actually have between the bed frame and the wall, wardrobe or radiator, then subtract the table's width.",
          "You want a clear path past the bed. Below about 45cm of remaining walkway, getting in and out of bed becomes a shuffle. If the gap is tight, the Chilworth Grey Bedside Table is 35cm square — the narrowest in the range and the one that fits where nothing else will. The Abberley White, Grafton Black and Charlton Ribbed Walnut are 40cm deep. At the other end, the Hampton Grey is 56cm across and the Bedside Table in Classic Recycled Wood is 51cm, both of which want a proper gap either side of the bed.",
        ],
      },
      {
        heading: "Drawers need room in front of them, too",
        paragraphs: [
          "A drawer that cannot open fully is a shelf with a handle on it. Allow the drawer's own depth again in front of the table: a 40cm-deep table with a full-extension drawer wants 40cm of clear floor in front of it, and a bed frame that projects past the mattress eats into that.",
          "Two drawers or one is a question about what you keep beside the bed rather than about size. One deep drawer takes a book, a charger and a pair of glasses without organising them. Two shallower drawers separate the things you reach for nightly from the things you do not, which is why the Abberley White, Charlton Ribbed Walnut and Serene Three Drawer tables exist alongside the single-drawer Berkeley and Broadway.",
        ],
      },
      {
        heading: "A pair, or two different tables",
        paragraphs: [
          "Matching pairs are the usual choice and the safe one. They also cost twice as much, and in a room where one side of the bed is against a wall and the other is open, a pair can be the wrong answer: the open side has room for a wider table with drawers, the wall side often only has room for something narrow.",
          "If you are buying one table rather than two, buy for the side you use. If you are buying two, order them together — these are made in batches, and a piece bought six months later can differ slightly in finish even under the same name.",
        ],
      },
    ],
  },
  {
    slug: "coffee-table-size-guide",
    title: "What size coffee table for your sofa?",
    excerpt:
      "Two-thirds of the sofa's length, within 5cm of the seat height, and 40cm of legroom. How the rules work, and which of the eight Kaiku tables each one points to.",
    metaTitle: "What Size Coffee Table for Your Sofa? | Kaiku",
    metaDescription:
      "The three measurements that decide a coffee table: length against the sofa, height against the seat, and the gap between. With real dimensions for eight tables.",
    category: "coffee-tables",
    products: [
      "elmley-coffee-table-ivory",
      "bentley-coffee-table-oak",
      "witley-coffee-table",
      "pershore-rectangular-aged-oak-coffee-table",
      "abberley-coffee-table-brown",
      "crofton-white-marble-coffee-table",
      "overbury-coffee-table-chocolate-brown",
      "serene-rattan-coffee-table",
    ],
    sections: [
      {
        paragraphs: [
          "Three numbers decide whether a coffee table works: how long it is against the sofa, how tall it is against the seat, and how much floor is left between the two. Get those right and the style is a free choice. Get the length wrong and a well-made table looks like a mistake for as long as you own it.",
        ],
      },
      {
        heading: "Length: about two-thirds of the sofa",
        paragraphs: [
          "The working rule is that the table should be roughly two-thirds the length of the sofa it faces. Much shorter and it reads as an afterthought in the middle of the room; much longer and it closes the seating area in.",
          "Take a three-seater at 210cm to 230cm — the Candover at 210.5cm, the Himbleton at 218cm, the Wadborough at 228cm. Two-thirds of that is 140cm to 152cm, and nothing in the range is that long, so the practical answer for a large sofa is the longest tables: the Elmley Coffee Table in Ivory and the Bentley Coffee Table in Oak, both 120cm. Against a two-seater of 160cm to 180cm, two-thirds is 105cm to 120cm, which is where most of the range sits — the Overbury and Pershore at 110cm, the Witley at 115cm, the Crofton White Marble at 100cm square.",
          "For a corner sofa or an L-shape, measure the shorter run rather than the total, and consider a square table instead of a rectangle. The Bentley is 120cm square and the Crofton 100cm square, both of which read correctly from two directions where a long rectangle only reads correctly from one.",
        ],
      },
      {
        heading: "Height: within 5cm of the seat",
        paragraphs: [
          "Measure the height of your sofa's seat cushion, compressed, from the floor. A coffee table within 5cm of that height either way is comfortable to reach; more than 10cm below it and you are bending down to put a cup on it.",
          "The range runs from 35.5cm to 48cm, which is why the height is worth checking rather than assuming. The Elmley is 35.5cm and the Crofton 37cm, both low, and both suited to a deep sofa with a low seat. The Overbury, Abberley, Witley and Pershore are 38cm to 40cm, which suits the majority of upholstered sofas. The Bentley is 45cm and the Serene Rattan 48cm, which are the ones to choose against a firmer, higher seat or an armchair.",
        ],
      },
      {
        heading: "The gap: 40cm, and why it is not negotiable",
        paragraphs: [
          "Leave 40cm to 45cm between the front of the sofa and the edge of the table. That is enough to walk past without turning sideways and enough to stretch your legs out. Below 35cm it becomes a shin hazard, and people stop using the table.",
          "This is the measurement that rules out the biggest table in a small room. A 120cm table plus two 45cm gaps needs 210cm of clear floor across the seating area, and once you add the sofa's own depth of around 90cm to 100cm you are asking for a room over 3m deep. In a smaller room the honest answer is the 100cm Crofton or the 110cm Overbury, not the 120cm.",
        ],
      },
      {
        heading: "Shelf or no shelf",
        paragraphs: [
          "A lower shelf doubles the surface without taking more floor, which is worth having in a room with no other storage — books, remotes and a tray live there instead of on the top. It also makes the table read as heavier, which in a small room works against you.",
          "The Serene Rattan Coffee Table takes the opposite approach: an open woven frame at 120cm across and 48cm tall, which occupies its footprint without filling it visually. In a room where the sofa is already substantial, that matters more than the extra shelf.",
        ],
      },
    ],
  },
  {
    slug: "console-table-depth-hallway",
    title: "How deep can a console table be in a narrow hallway?",
    excerpt:
      "Measure the hall, subtract 90cm for the walkway, and what is left is your maximum depth. Four of the eight Kaiku consoles are 30cm to 35cm deep for exactly this.",
    metaTitle: "Console Table Depth for a Narrow Hallway | Kaiku",
    metaDescription:
      "How to work out the deepest console table a hallway can take, why 90cm of walkway is the number to protect, and the depths and heights of eight console tables.",
    category: "console-tables",
    products: [
      "five-black-console-table",
      "abberley-one-drawer-black-console-table",
      "grafton-black-console-table",
      "berkeley-white-console-table",
      "hampton-brown-shagreen-console-table",
      "bentley-grey-aged-oak-console-table",
      "elmley-ivory-console-table",
      "alton-white-console-table",
    ],
    sections: [
      {
        paragraphs: [
          "A console table in a hallway is a piece of arithmetic before it is a piece of furniture. Measure the width of the hall, protect the walkway, and whatever is left is the deepest table you can put against the wall.",
          "Protect 90cm. That is enough for one person to pass carrying something, and enough to get a sofa or a wardrobe past on delivery day. Below 75cm, a hallway starts to feel like a corridor you edge along, and the table you were pleased with becomes the thing you bump into with the shopping.",
        ],
      },
      {
        heading: "Working out your maximum depth",
        paragraphs: [
          "Take the hall width, subtract 90cm, and subtract another 3cm or so for skirting boards, which the table's back will sit against rather than the wall itself.",
          "A 120cm hall leaves 27cm, which is under everything in the range — that hall wants a wall shelf, not a console. A 130cm hall leaves about 37cm, which takes any of the four slim tables. A 150cm hall leaves 57cm and takes anything.",
        ],
      },
      {
        heading: "The slim ones, measured",
        paragraphs: [
          "Four consoles in the range are built for exactly this problem. The Five Black Console Table and the Abberley One Drawer Black Console Table are both 30cm deep. The Grafton Black and Berkeley White are 35cm. All four are 120cm to 140cm long, so they read as generous along the wall while taking almost nothing out of the walkway.",
          "The rest are deeper and belong in wider spaces or against a different wall: the Hampton Brown Shagreen at 38cm, the Bentley Grey Aged Oak and Elmley Ivory at 40cm, and the Alton White at 45cm — closer to a sideboard in footprint, and the one to choose if the table is doing storage work rather than hallway work.",
        ],
      },
      {
        heading: "Height, and what goes above it",
        paragraphs: [
          "The range runs 76cm to 85cm. The Alton White is 76cm, most sit at 80cm to 81cm, and the Abberley One Drawer is the tallest at 85cm. Anything in that band is comfortable to drop keys onto without looking — a little below a UK kitchen worktop, which is 90cm, and a little above a dining table at 75cm.",
          "If a mirror is going above it, allow 20cm to 30cm between the table top and the bottom of the mirror. If a lamp is going on it, add the lamp's height to the table's: an 80cm console with the 88cm Large Round Gesso Table Lamp on it reaches 168cm, which is above eye level for most people standing — fine for a hallway, where you pass rather than sit, and worth thinking about in a room where you would be looking into the bulb.",
        ],
      },
      {
        heading: "Length: leave the doors alone",
        paragraphs: [
          "The one measurement that catches people out is the swing of a door. A 150cm console on the wall opposite the front door is not the problem; a 150cm console on the same wall as an internal door that opens outwards is. Mark the door's arc on the floor with tape before ordering.",
          "The range runs from 100cm (Alton White) to 150cm (Bentley Grey Aged Oak), with most at 120cm to 140cm. In a short hall, a shorter table centred under a mirror looks deliberate; a long table wedged between two door frames looks like it was bought for a different house.",
        ],
      },
    ],
  },
  {
    slug: "side-table-height-armchair",
    title: "Side table height: getting it level with the chair arm",
    excerpt:
      "A side table should meet the arm of the chair it serves. The heights in the Kaiku range run 48cm to 76cm, and the difference decides whether you use it.",
    metaTitle: "Side Table Height Next to an Armchair | Kaiku",
    metaDescription:
      "How tall a side table should be beside an armchair or sofa, why the arm height is the measurement that matters, and the real heights of eleven side tables.",
    category: "side-tables",
    products: [
      "norton-black-square-end-table",
      "hampton-ivory-shagreen-nest-of-tables",
      "abberley-white-end-table",
      "neatham-end-table",
      "grafton-black-end-table",
      "elmley-grey-end-table",
      "camden-round-side-table",
      "serene-rattan-side-table",
      "serene-one-drawer-side-table",
      "rutland-side-table",
      "leckford-ribbed-black-oak-occasional-table",
    ],
    sections: [
      {
        paragraphs: [
          "Measure the arm of the chair, not the seat. A side table wants its top level with the arm or a little below it, so a glass can be put down and picked up without looking. Above the arm and you lift over an obstacle every time; well below it and you reach down into a gap.",
          "Most armchair arms are 55cm to 65cm from the floor. Sofas with low, wide arms can be 45cm. A wingback with a high arm can be 70cm. One measurement with a tape decides which of the eleven tables below is right, and it takes less time than reading the rest of this guide.",
        ],
      },
      {
        heading: "The heights in the range",
        paragraphs: [
          "Six of the range are 60cm tall: the Camden Round, the Serene Rattan, the Abberley White, the Grafton Black, the Neatham and the Elmley Grey. That is the height that suits the majority of armchairs, and if you are buying without measuring, it is the safest guess.",
          "Two sit lower. The Norton Black Square End Table is 48cm and the Hampton Ivory Shagreen Nest of Tables is 54cm, both of which suit a low-armed sofa or a deep lounge chair — and the Norton at 48cm doubles as a small coffee table in front of a two-seater.",
          "Two sit higher. The Rutland Side Table is 60cm on a 60cm round top, and the Leckford Ribbed Black Oak Occasional Table is 76cm — tall enough to work beside a high-armed wing chair, and tall enough to stand alone against a wall as a small console.",
        ],
      },
      {
        heading: "Footprint: how much floor you are giving up",
        paragraphs: [
          "Width matters less than height but it decides where the table can go. The slim ones are the Grafton Black at 50 × 32cm and the Abberley White and Neatham at 40 × 40cm, all of which slot into the gap between a chair and a wall.",
          "The larger ones want to be seen: the Rutland and Serene Rattan at 60cm across, the Leckford at 75cm, the Norton at 56cm square. A 75cm table between two armchairs is a shared surface rather than a personal one, which is a different piece of furniture doing a different job.",
        ],
      },
      {
        heading: "One table, or a nest",
        paragraphs: [
          "A nest of tables is the answer to a room that changes through the day. The Hampton Ivory Shagreen Nest of Tables is two tables at 54cm, which stack into one footprint and separate when there are people in the room. In a small sitting room that is more useful than a single larger table, and it is the one piece here that solves the problem of not knowing where the table needs to be.",
        ],
      },
    ],
  },
  {
    slug: "sideboard-or-chest-of-drawers",
    title: "Sideboard or chest of drawers, for a living room?",
    excerpt:
      "The same wall, two different pieces. Doors hide the things you do not want on show; drawers sort them. The measurements and the trade-off, across nine pieces.",
    metaTitle: "Sideboard or Chest of Drawers for a Living Room? | Kaiku",
    metaDescription:
      "Which suits a living room wall: a sideboard or a chest of drawers. Depth, height and length compared across nine pieces, including what fits a television.",
    category: "living-room-storage",
    products: [
      "abberley-black-oak-sideboard",
      "huddington-black-sideboard",
      "broadway-oak-chest-of-drawers",
      "charlton-ribbed-walnut-chest-of-drawers",
      "alton-white-chest-of-drawers",
      "abberley-white-chest-of-drawers",
      "grafton-black-chest-of-drawers",
      "easton-2-drawer-chest-of-drawers",
      "hampton-ivory-shagreen-chest-of-drawers",
      // Named in the television section as the answer a sideboard is not.
      "hampton-ivory-shagreen-tv-unit",
    ],
    sections: [
      {
        paragraphs: [
          "Both go against the long wall. Both are around 45cm deep and 80cm to 87cm high. The difference is what happens when you open them, and that decides which one you should be buying.",
          "A sideboard has doors and shelves behind them, so it swallows things of awkward shapes — a printer, board games, a case of wine, the box the router came in. A chest of drawers sorts things into layers, which is better for anything you retrieve often and worse for anything tall.",
        ],
      },
      {
        heading: "Length is the real difference",
        paragraphs: [
          "Sideboards in the range are the long pieces: the Abberley Black Oak Sideboard at 160cm and the Huddington Black Sideboard at 150cm. Chests run shorter — 90cm for the Alton White, Abberley White, Easton and Hampton Ivory Shagreen, 110cm for the Charlton Ribbed Walnut and 120cm for the Broadway Oak.",
          "So on a 3m wall, a 160cm sideboard leaves room either side for a lamp or a chair and reads as intentional. A 90cm chest on the same wall looks lost unless something else is on the wall with it. On a 2m wall the reverse is true.",
        ],
      },
      {
        heading: "If a television is going on top",
        paragraphs: [
          "Sit on the sofa and measure the height of your eyeline. You want the middle of the screen at or just below it, which for most people sitting is 100cm to 110cm from the floor. Then do the arithmetic, because this is where a sideboard usually loses.",
          "A 55-inch television is about 122cm wide and 69cm tall, and a stand lifts it a few centimetres, so the middle of the screen sits roughly 38cm above whatever it stands on. On the 87cm Huddington Black Sideboard that puts the screen centre at about 125cm — well above a seated eyeline. On the 80cm Abberley Black Oak Sideboard, about 118cm. Both are too high for a screen that size, and looking up at a television for an evening is why.",
          "Two honest conclusions follow. If the television is large, it wants something lower than a sideboard — around 60cm to 70cm, which is what a dedicated media console like the 55cm Hampton Ivory Shagreen TV Unit is for. If the television is small, a 32-inch screen is 40cm tall and its centre lands around 105cm on an 80cm sideboard, which is right. And in either case check the length: 122cm of television overhangs a 90cm chest, and sits properly on the 120cm Broadway Oak or on either sideboard.",
        ],
      },
      {
        heading: "Depth, and the door you have to open",
        paragraphs: [
          "Almost everything here is 45cm deep, which is the depth that takes a dinner plate flat and a stack of magazines without them tipping. The Grafton Black and Broadway Oak are 50cm, worth knowing if the piece is going in a narrow room.",
          "The catch with a sideboard is the swing of the doors: allow the door's width again in front of it. A 160cm sideboard with three doors has narrower doors and less swing than a two-door piece of the same length, which is why door count matters more than it looks in the photograph.",
        ],
      },
      {
        heading: "How many drawers, and how deep",
        paragraphs: [
          "Two deep drawers or three shallower ones is a question about what you are storing. The Easton is a two-drawer chest at 85cm high, so each drawer is deep — good for bedding, blankets and anything bulky. The Alton White, Abberley White, Grafton Black, Broadway Oak and Hampton Ivory Shagreen are three-drawer pieces, which suit sorted, frequently used things.",
          "The Charlton Ribbed Walnut Chest of Drawers takes it furthest with six drawers across 110cm, which is the piece to choose when the problem is small things in too many places rather than a few large ones.",
        ],
      },
    ],
  },
  {
    slug: "will-the-sofa-fit",
    title: "Will the sofa fit? Measure the route, not the room",
    excerpt:
      "Sofas do not get stuck in living rooms. They get stuck on the stairs, at the turn on the landing, and in the doorway. The five measurements to take before ordering.",
    metaTitle: "Will the Sofa Fit? Measuring Guide | Kaiku",
    metaDescription:
      "How to check a sofa will get into the room: doorway diagonal, stair turns, hallway width and the measurements to take, with real sofa dimensions.",
    category: "sofas",
    products: [
      "wadborough-3-seater-sofa-neutral",
      "himbleton-green-3-seater-sofa",
      "candover-neutral-sofa",
      "mickleton-cream-chenille-armchair",
      "kington-grey-club-chair",
      "vellis-blue-wingback-armchair",
      "zephra-white-armchair",
      "rutland-rectangular-bench",
    ],
    sections: [
      {
        paragraphs: [
          "A sofa that does not fit the room is a disappointment. A sofa that does not fit the route to the room is a return, a collection and a wait. The second happens far more often, and every part of it is avoidable with a tape measure and ten minutes.",
          "It matters more here than at a shop with its own delivery fleet. Large pieces are delivered to your doorstep at a time agreed in advance, and room-of-choice placement is an extra service rather than the default — which is part of why the prices are what they are. So the route from the front door to the room is yours to plan, and these five measurements are how you plan it.",
        ],
      },
      {
        heading: "The five measurements",
        paragraphs: [
          "One: the narrowest doorway on the route, measured between the frames with the door open — and if the door can come off its hinges, measure again without it, which often gains 4cm.",
          "Two: the doorway's diagonal. A sofa goes through a door on its side more often than upright, and the diagonal of the opening is bigger than its width. Measure corner to corner.",
          "Three: the hallway width at its tightest point, including the radiator, and the height of the ceiling where the stairs turn.",
          "Four: the stairwell turn. Stand at the bottom and measure from the inside corner of the turn to the wall opposite. This is where sofas stop.",
          "Five: the sofa itself, in three dimensions plus its own diagonal — the depth measured corner to corner across the frame, which is the number that has to clear the door.",
        ],
      },
      {
        heading: "The sofas, measured",
        paragraphs: [
          "The three-seaters are the ones to check carefully. The Wadborough 3 Seater Sofa in Neutral is 228cm long, 102cm deep and 68cm high. The Himbleton Green 3 Seater Sofa is 218 × 88 × 82cm. The Candover Neutral Upholstered Sofa is 210.5 × 98 × 84.5cm.",
          "Note which number is the problem. Length rarely stops a sofa: it goes down a hallway lengthways. Depth does. A 102cm-deep sofa turned on its side needs an opening that clears 102cm on the diagonal, and a standard UK internal door is 76cm wide by 198cm tall — a diagonal of about 212cm, which clears it, and a 90-degree turn in a 90cm hallway which may not.",
        ],
      },
      {
        heading: "If the route will not take a three-seater",
        paragraphs: [
          "Two armchairs seat as many people as a small sofa, go through anything, and can be placed apart. The Mickleton Cream Chenille Armchair is 76 × 66 × 79cm, the Kington Grey Club Chair 70 × 62 × 81cm, the Zephra White Armchair 79 × 67 × 78cm and the Vellis Blue Wingback Armchair 76 × 84 × 101cm. All four clear a standard doorway without turning.",
          "It is also worth measuring for what the room needs rather than what the room can hold. Leave 40cm to 45cm between the sofa and the coffee table, and 75cm for a walkway behind it. A 228cm sofa in a 3.5m room is generous; in a 3m room it is the room's only feature.",
        ],
      },
      {
        heading: "Seating without the bulk",
        paragraphs: [
          "The Rutland Rectangular Bench is 160cm long, 40cm deep and 45cm high, which seats two or three at a pinch and slides against a wall or under a window when it is not needed. In a small sitting room, or at the end of a bed, it is the piece that adds seating without adding a sofa — and it goes up any staircase in the country.",
        ],
      },
    ],
  },
  {
    slug: "table-lamp-size-guide",
    title: "What size table lamp for a bedside or console?",
    excerpt:
      "Add the lamp's height to the furniture it stands on, and keep the bottom of the shade below eye level. Five lamps from 53cm to 88cm, and where each belongs.",
    metaTitle: "What Size Table Lamp for a Bedside or Console? | Kaiku",
    metaDescription:
      "How to choose table lamp height: add it to the table, keep the shade below eye level, and match the shade width to the surface. Five lamps measured.",
    category: "lighting",
    products: [
      "uthina-table-lamp",
      "small-rectangular-gesso-table-lamp",
      "bamboo-gesso-table-lamp",
      "large-ribbed-gesso-table-lamp",
      "large-round-gesso-table-lamp",
    ],
    sections: [
      {
        paragraphs: [
          "A table lamp is never chosen on its own height. It is chosen on its height plus the height of the thing it stands on, measured against where your eyes are when you are using the room.",
          "The rule that does the most work: the bottom of the shade should sit below your eye level when you are seated. Above it, you look into the bulb, and no amount of shade fabric fixes that. Below it, the light falls on the book, the table and the wall instead of into your face.",
        ],
      },
      {
        heading: "Beside a bed",
        paragraphs: [
          "Sitting up in bed, most people's eyes are 110cm to 125cm from the floor. Bedside tables in the Kaiku range are 55cm to 66cm. So a lamp of 45cm to 60cm puts the shade bottom in the right place, and anything much taller shines into your eyes when you are reading.",
          "That points to the Uthina Table Lamp at 53cm and the Small Rectangular Gesso Table Lamp at 55cm. On a 55cm Broadway Oak Bedside Table, the Uthina reaches 108cm; on a 60cm table it reaches 113cm. Both work. The Bamboo Gesso Table Lamp at 63cm is the tallest that still makes sense next to a bed, and only on a lower table.",
        ],
      },
      {
        heading: "On a console or a sideboard",
        paragraphs: [
          "A hallway console is used standing up, so the constraint reverses: a tall lamp is right, because you are passing it rather than sitting under it. Consoles in the range are 76cm to 85cm, so the Large Ribbed Gesso Table Lamp at 81cm reaches 157cm to 166cm, and the Large Round Gesso Table Lamp at 88cm reaches 164cm to 173cm.",
          "Both read as proper hall lighting rather than a lamp that happens to be there. In a room where you sit — a sideboard behind a sofa, for instance — come down to the 63cm Bamboo Gesso or 55cm Small Rectangular instead, for the eye-level reason above.",
        ],
      },
      {
        heading: "Shade width against the surface",
        paragraphs: [
          "The shade should not overhang the table it stands on. Compare the lamp's widest point to the table's depth, not its length: a 46cm-wide shade on a 40cm-deep bedside table overhangs the front edge and gets knocked.",
          "In the range, the Uthina and the Small Rectangular Gesso are 30cm and 31cm wide, which sit safely on any bedside table here. The Bamboo Gesso is 33cm. The Large Ribbed is 41cm and the Large Round 46cm, which want a 45cm-deep console or a sideboard, not a 40cm bedside table.",
        ],
      },
      {
        heading: "A pair, and the light in between",
        paragraphs: [
          "Two matching lamps either side of a bed or at both ends of a console give even light and look composed. One lamp is asymmetric on purpose and needs something on the other side to balance it — a plant, a stack of books, a mirror hung off-centre.",
          "Whichever you choose, put the lamps on a dimmer or use dimmable bulbs. A bedside lamp does two different jobs — reading, and finding the door at 2am — and the difference between them is brightness, not fittings.",
        ],
      },
    ],
  },
  {
    slug: "caring-for-reclaimed-teak",
    title:
      "Living with reclaimed teak: what to expect, and how to look after it",
    excerpt:
      "Salvaged timber comes with nail holes, colour shifts and a tolerance on its dimensions. What is character, what is a fault, and what the wood needs from you.",
    metaTitle: "Reclaimed Teak Furniture: Care and What to Expect | Kaiku",
    metaDescription:
      "What reclaimed teak and recycled wood furniture looks like in the flesh, why no two pieces match, and how to care for salvaged timber indoors.",
    category: "rustic-reclaimed-furniture",
    products: [
      "reclaimed-teak-dining-table-180cm",
      "large-reclaimed-wood-coffee-table",
      "reclaimed-teak-sideboard-console-table-6-drawers",
      "tall-reclaimed-teak-chest-5-drawers",
      "large-reclaimed-wood-tv-stand-2-drawers",
      "round-reclaimed-teak-bedside-table-drawer",
      "natural-teak-corner-shelf-unit-4-tier-135cm",
      "beer-barrel-table-natural-wood",
      "4-drawer-recycled-wood-storage-chest",
    ],
    sections: [
      {
        paragraphs: [
          "Reclaimed teak has already had a life. The boards come out of boats, barns and old buildings, are cleaned and re-cut, and are made into something else. That history is why the wood looks the way it does, and it is also why buying it needs a different set of expectations than buying new timber.",
          "Everything below applies to the reclaimed and recycled pieces in the range — the 180cm dining table, the coffee tables, the six-drawer sideboard console, the five-drawer chest, the TV stands, the teak shelving and the barrel pieces.",
        ],
      },
      {
        heading: "What is character, and what is a fault",
        paragraphs: [
          "Character: filled nail holes, old bolt holes, saw marks, colour that shifts from honey to near-grey across one surface, boards of different widths in the same top, and small splits along the grain at the ends of a board. All of that is the material telling you where it came from, and none of it affects how long the piece lasts.",
          "A fault: a joint that moves, a drawer that binds against its runner, a top that rocks on a flat floor, a split that runs across the grain rather than along it, or a finish that lifts. If any of that arrives, tell us within 48 hours of delivery with photographs and we deal with it — see the returns page for how that works.",
          "The line between them is whether the piece does its job. A table with a 5mm-wide filled crack in the top is a reclaimed table. A table that wobbles is a faulty table.",
        ],
      },
      {
        heading: "No two pieces match, including yours",
        paragraphs: [
          "The photograph shows one example of the piece, not the piece you will receive. Shape, dimensions and construction match; the grain, the tone and the pattern of marks are individual. On a large surface like the 180cm dining table the difference between what is photographed and what arrives can be considerable, and it is not a defect.",
          "Dimensions carry a small tolerance for the same reason — usually within a centimetre or two. If a piece has to fit an exact alcove, tell us the measurement before you order and we will check the specific piece rather than the specification.",
        ],
      },
      {
        heading: "Why it is stable, and where it still moves",
        paragraphs: [
          "Salvaged teak has been drying and moving for decades before it was re-cut, so it is more dimensionally stable than kiln-dried new stock. That is the practical argument for reclaimed timber rather than a romantic one.",
          "It still responds to its environment. Put a solid teak piece directly against a radiator or in the path of underfloor heating and one side dries faster than the other, which is what makes a top cup or a joint open. Keep it 15cm clear of a heat source, and avoid a spot in full afternoon sun through glass, which bleaches the colour unevenly over a summer.",
        ],
      },
      {
        heading: "The care, which is less than you would think",
        paragraphs: [
          "Dust with a dry cloth. Wipe spills straight away with a damp cloth and dry it after — teak is oily and water-tolerant, which is why it was used on boats, but a ring left overnight on a waxed surface can still mark.",
          "Twice a year, a thin coat of clear furniture wax or teak oil on the exposed surfaces feeds the timber and evens out the colour. Apply it sparingly with a lint-free cloth and buff it off; more oil does not mean more protection, it means a sticky top that attracts dust.",
          "Do not use silicone sprays, all-purpose kitchen cleaner or anything containing bleach. They strip the finish, and on reclaimed timber the finish is doing more work than it does on new wood.",
        ],
      },
      {
        heading: "Weight, and getting it in",
        paragraphs: [
          "Solid reclaimed pieces are heavy and they do not flex. The 180cm dining table will not bend around a tight stair turn, and neither will the six-drawer sideboard console. Measure the narrowest doorway and any half-landing before ordering, and remove drawers before lifting anything with them — it takes a third off the weight.",
          "Once it is in place, lift rather than drag. Salvaged timber is strong across the grain and the legs are usually jointed rather than bolted, which is the right way to build furniture and the wrong way to build something you can shove across a room.",
        ],
      },
    ],
  },
];

/** A portable-text paragraph or heading block. */
function block(text: string, key: string, style = "normal") {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
  };
}

function body(guide: Guide) {
  const blocks: ReturnType<typeof block>[] = [];
  guide.sections.forEach((section, s) => {
    if (section.heading) blocks.push(block(section.heading, `h${s}`, "h2"));
    section.paragraphs.forEach((paragraph, p) =>
      blocks.push(block(paragraph, `p${s}-${p}`)),
    );
  });
  return blocks;
}

/** Every word of prose in a guide, for the house-style check. */
function prose(guide: Guide): string {
  return [
    guide.title,
    guide.excerpt,
    guide.metaTitle,
    guide.metaDescription,
    ...guide.sections.flatMap((section) => [
      section.heading ?? "",
      ...section.paragraphs,
    ]),
  ].join("\n");
}

async function main() {
  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  // The same house rules the product copy is held to. A guide is customer-facing
  // prose and there is no reason it should be allowed the phrases a description
  // is not.
  let violations = 0;
  for (const guide of GUIDES) {
    const text = prose(guide);
    for (const [pattern, why] of BANNED_PHRASES) {
      const hit = pattern.exec(text);
      if (hit) {
        console.log(`  !  ${guide.slug}: banned phrase "${hit[0]}" — ${why}`);
        violations += 1;
      }
    }
    for (const [pattern, name] of BANNED_NAMES)
      if (pattern.test(text)) {
        console.log(`  !  ${guide.slug}: names ${name}`);
        violations += 1;
      }
  }
  if (violations) {
    console.error(
      `\n${violations} house-style violation(s) — nothing written.\n`,
    );
    process.exit(1);
  }

  const categories = await client.fetch<{ id: string; slug: string }[]>(
    `*[_type == "category" && !(_id in path("drafts.**"))]{"id": _id, "slug": slug.current}`,
  );
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const products = await client.fetch<{ id: string; slug: string }[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{"id": _id, "slug": slug.current}`,
  );
  const productBySlug = new Map(products.map((p) => [p.slug, p.id]));

  const existing = await client.fetch<string[]>(
    `*[_type == "buyingGuide"].slug.current`,
  );

  let written = 0;
  let linked = 0;
  const covered = new Set<string>();

  for (const guide of GUIDES) {
    const categoryId = categoryBySlug.get(guide.category);
    if (!categoryId) {
      console.log(`  !  ${guide.slug}: no category "${guide.category}"`);
      continue;
    }

    // A reference to a product that does not exist would publish a guide with a
    // broken link in it, so a missing slug is reported and dropped rather than
    // written.
    const missing = guide.products.filter((slug) => !productBySlug.has(slug));
    const resolved = guide.products.filter((slug) => productBySlug.has(slug));
    for (const slug of missing)
      console.log(`  !  ${guide.slug}: no product "${slug}" — dropped`);

    const words = guide.sections
      .flatMap((section) => section.paragraphs)
      .join(" ")
      .split(/\s+/).length;

    console.log(
      `  ${existing.includes(guide.slug) ? "update" : "create"}  ${guide.slug.padEnd(34)} ${String(words).padStart(4)} words · ${resolved.length} products · /shop/${guide.category}`,
    );
    for (const slug of resolved) covered.add(slug);
    linked += resolved.length;

    if (!apply) continue;

    await client.createOrReplace({
      _id: `buying-guide-${guide.slug}`,
      _type: "buyingGuide",
      title: guide.title,
      slug: { _type: "slug", current: guide.slug },
      excerpt: guide.excerpt,
      body: body(guide),
      author: { _type: "reference", _ref: "author-kaiku-editorial" },
      relatedCategory: { _type: "reference", _ref: categoryId },
      relatedProducts: resolved.map((slug) => ({
        _type: "reference",
        _ref: productBySlug.get(slug)!,
        _key: `p-${slug}`.slice(0, 60),
      })),
      publishedAt: new Date().toISOString(),
      seo: {
        _type: "seo",
        metaTitle: guide.metaTitle,
        metaDescription: guide.metaDescription,
      },
    });
    written += 1;
  }

  const totalProducts = products.length;
  console.log(
    `\n  ${GUIDES.length} guides · ${linked} product references · ` +
      `${covered.size} of ${totalProducts} published products now have an editorial link\n` +
      (apply ? `  Wrote ${written}.\n` : "  Dry run — nothing written.\n"),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
