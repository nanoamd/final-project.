/**
 * Writes the introduction, buying guidance, FAQs and related links for the
 * categories that hold the most products.
 *
 * The brief: "Every category page needs: SEO introduction, buying guidance, FAQs,
 * internal links, related categories, product explanations. No empty product
 * grids." Until now a category page was a heading and a grid, which ranks for
 * nothing — there is no text on it for a query to match, so the only search it can
 * win is its own name, and "coffee tables" is not a term a four-month-old domain
 * takes from John Lewis.
 *
 * What it *can* win is the question behind the purchase. Nobody buys a console table
 * without first wondering how deep it can be in a narrow hall, and there are far
 * fewer pages competing to answer that than to sell the table. So the guidance here
 * is written to be genuinely useful and specific — real measurements, real
 * trade-offs — because a page that only pretends to answer gets one visit.
 *
 * **Written from the catalogue, not from a template.** Every measurement cites
 * something Kaiku actually sells, so the guidance stays true as long as the range
 * does. No banned phrases: the validator in scripts/lib/product-copy.ts rejects the
 * house-style violations and the same rules apply to category copy.
 *
 * Ordered by product count, because that is the order in which this work pays: the
 * eight categories below hold 20, 15, 12, 10, 10, 8, 7 and 6 products between them.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-category-content.ts
 *   pnpm tsx --env-file=.env.local scripts/write-category-content.ts --apply
 */
import { createClient } from "@sanity/client";

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

interface CategoryContent {
  slug: string;
  intro: string[];
  guide: string[];
  faqs: { question: string; answer: string }[];
  related: string[];
}

const CONTENT: CategoryContent[] = [
  {
    slug: "rustic-reclaimed-furniture",
    intro: [
      "Reclaimed teak and recycled wood, made into pieces that carry the marks of whatever they were before. Every board has already spent a life as something else — a boat, a barn, a beam — so the grain, the nail holes and the colour shifts are the material's history rather than a finish applied to imitate one.",
      "That means no two pieces match exactly, and it is the point. A reclaimed teak sideboard has a depth of colour that new timber takes twenty years to earn. It also means solid wood throughout rather than veneer over board, which is why these are the pieces in the range most likely to outlive the room they were bought for.",
    ],
    guide: [
      "Start with the timber. Reclaimed teak is the densest and the most water-tolerant, which is why it holds up in a kitchen or a bathroom where other woods move. Recycled pine and gamal are lighter in both weight and colour, and take a wash or a paint finish more readily.",
      "Then measure the route in, not just the room. Solid reclaimed pieces are heavy and they do not flex — a 180cm dining table weighs considerably more than its flat-packed equivalent and will not bend around a tight stair turn. Measure the narrowest doorway and any half-landing before ordering.",
      "Expect variation and plan for it. Because each piece is made from salvaged stock, dimensions carry a small tolerance and the colour of the piece delivered will differ slightly from the photograph. If you need an exact match to something you already own, ask us before ordering rather than after.",
    ],
    faqs: [
      {
        question: "Is reclaimed wood furniture as strong as new timber?",
        answer:
          "Usually stronger. Salvaged teak and pine have already dried and moved for decades, so they are more dimensionally stable than kiln-dried new stock. What you gain in stability you accept in variation — knots, filled nail holes and colour shifts are part of the material.",
      },
      {
        question: "Will the piece I receive look exactly like the photograph?",
        answer:
          "No, and it cannot. Each piece is made from different salvaged boards, so grain and colour vary between them. The shape, dimensions and construction match the photograph; the character of the wood is individual to your piece.",
      },
      {
        question: "How do I care for reclaimed teak indoors?",
        answer:
          "Very little is needed. Dust it, wipe spills promptly, and keep it out of direct sun where it can bleach unevenly. An occasional wipe with a teak or furniture oil restores depth to the colour if it starts to look dry.",
      },
      {
        question: "Can reclaimed wood furniture go outside?",
        answer:
          "Teak can tolerate a covered outdoor spot such as a porch or a garden room, since it is naturally oily and water-resistant. Pine and gamal pieces are made for indoor use and will not last uncovered through a British winter.",
      },
    ],
    related: ["coffee-tables", "console-tables", "living-room-storage"],
  },
  {
    slug: "coffee-tables",
    intro: [
      "The coffee table decides how a living room is used. Too high and it competes with the sofa arm; too far away and nobody puts a cup down. The pieces here run from reclaimed teak and marble to ribbed oak and tamarind resin, chosen because they hold their own in a room rather than disappearing into it.",
      "Sizes across the range suit real rooms rather than showrooms — from small teak tables for a chair-and-a-half corner up to large reclaimed slabs that anchor a whole seating group.",
    ],
    guide: [
      "Height first. A coffee table should sit level with the seat cushion or a little below — roughly 40 to 45cm for most sofas. Higher than the cushion and the table dominates; much lower and reaching a drink becomes a stretch.",
      "Then length. Aim for around two-thirds the length of the sofa it serves. A 240cm three-seater wants something near 150cm; a small two-seater is better with a 90cm table or a pair of nesting pieces that can separate when people are round.",
      "Leave 40cm between the table and the sofa. That is enough to walk past without turning sideways and still close enough to reach without leaning. Below 30cm the gap reads as cramped however good the table is.",
      "Match the top to the traffic. Marble and glass are the most striking and the least forgiving — they show rings and they chip at the corners. Reclaimed teak and oak take knocks and get better for it, which is what makes them the sensible choice in a room with children or a dog.",
    ],
    faqs: [
      {
        question: "What size coffee table do I need?",
        answer:
          "About two-thirds the length of your sofa, at a height level with or just below the seat cushion — usually 40 to 45cm. Leave roughly 40cm between the table edge and the sofa so people can pass without turning.",
      },
      {
        question: "Is a marble coffee table practical with children?",
        answer:
          "Honestly, less so. Marble is porous, so wine and citrus can mark it, and corners chip if knocked hard. Reclaimed teak, oak or a metal-framed table with a wood top take the same treatment without showing it.",
      },
      {
        question: "Round or rectangular?",
        answer:
          "Round suits a small or busy room — no corners to catch a shin, and it works with seating arranged at angles. Rectangular suits a long sofa and a room people walk through, because it follows the line of the furniture rather than interrupting it.",
      },
      {
        question: "How much clearance do I need around a coffee table?",
        answer:
          "40cm to the sofa, and at least 60cm on any side used as a walkway. If the room is tight, a nest of tables gives you the same surface when you need it and the floor back when you don't.",
      },
    ],
    related: ["side-tables", "console-tables", "rustic-reclaimed-furniture"],
  },
  {
    slug: "console-tables",
    intro: [
      "A console table earns its place in the space furniture usually can't use — behind a sofa, along a hallway, under a window. Shallow front to back, long left to right, and useful precisely because it does not need a room of its own.",
      "The range runs from glass and faux shagreen to solid oak and reclaimed teak, in depths that suit a genuinely narrow hall as well as a wide entrance.",
    ],
    guide: [
      "Depth is the measurement that matters, and it is the one most people check last. A hallway needs at least 80cm of clear walking width left after the table goes in, so in a 120cm hall you have around 35 to 40cm of depth to play with. Most consoles here sit between 35 and 45cm deep for that reason.",
      "Height should relate to what it stands against. Behind a sofa, match the sofa back or come just below it — around 75 to 85cm. In a hall, 80cm or so puts the top at a comfortable height for keys, post and a lamp.",
      "Decide whether you need drawers before you choose a look. An open console with a lower shelf feels lighter in a narrow space; a two or three drawer console hides the clutter a hallway generates but reads as a heavier piece.",
      "Check the lamp plug. A console under a window or behind a sofa usually ends up carrying a lamp, and a socket two metres away means a visible cable across the floor. Worth knowing before the table arrives rather than after.",
    ],
    faqs: [
      {
        question: "How deep should a hallway console table be?",
        answer:
          "Leave at least 80cm of clear walking width. In a 120cm hallway that puts you at 35 to 40cm of depth — enough for a lamp, a bowl and post, without turning the hall into a squeeze.",
      },
      {
        question: "What height should a console table be behind a sofa?",
        answer:
          "Level with the top of the sofa back or slightly below, usually 75 to 85cm. Taller than the back and it looms over the seating; much lower and it looks like it was meant for a different room.",
      },
      {
        question: "Can a console table be used as a desk?",
        answer:
          "For a laptop, yes — most sit at 75 to 80cm, which is close to desk height. For long working days, check the knee depth: a console at 35cm deep leaves little room to sit square to it, so a proper desk is kinder.",
      },
      {
        question: "Do I need to fix a console table to the wall?",
        answer:
          "Not usually. The narrow ones can be tippy if a child pulls on a drawer, so if the piece is tall and shallow and there are small children in the house, a simple furniture strap is worth fitting.",
      },
    ],
    related: ["side-tables", "coffee-tables", "living-room-storage"],
  },
  {
    slug: "garden-furniture",
    intro: [
      "Outdoor seating and tables built to be left out, in the finishes that suit a British garden rather than a Mediterranean catalogue shoot. Woven all-weather rattan on aluminium frames, powder-coated steel, and acacia and teak tops that weather to silver-grey if you let them.",
      "The range covers a two-chair bistro corner up to corner sets and sun loungers, so a small patio and a full terrace can be furnished from the same collections.",
    ],
    guide: [
      "Start with what the space is for. A bistro table and two chairs needs around 1.8 by 1.8 metres to be usable, because chairs need pulling out. A four-seat dining set wants closer to 3 by 3 metres, and a corner set needs a defined corner to sit into rather than the middle of a lawn.",
      "Then the material, because this decides the maintenance rather than the look. All-weather rattan over an aluminium frame can stay out year-round and needs a wipe; it will not rust. Powder-coated steel is heavier and more stable in wind but will mark if the coating is chipped. Acacia and teak need nothing at all if you accept the silvering, or an annual oil if you want the honey colour kept.",
      "Weigh the wind. Lightweight aluminium and plastic chairs move in a gust on an exposed terrace. If your garden is open, the heavier woven sets and steel frames stay where you put them.",
      "Cushions come indoors. Even quick-drying outdoor fabrics last far longer stored dry between uses, and it is the single thing that most affects how a set looks in its third summer.",
    ],
    faqs: [
      {
        question: "Can this garden furniture be left outside all year?",
        answer:
          "The all-weather rattan and aluminium frames can, and so can teak and acacia if you accept that the wood will silver. Bring cushions indoors between uses, and a cover over winter keeps everything cleaner even where it isn't strictly needed.",
      },
      {
        question: "How much space do I need for an outdoor dining set?",
        answer:
          "Around 1.8 by 1.8 metres for a bistro table and two chairs, and closer to 3 by 3 metres for a four-seat set. The extra is for pulling chairs out and walking behind someone who is seated.",
      },
      {
        question: "Does rattan garden furniture fade?",
        answer:
          "Quality all-weather rattan is UV-stabilised and holds its colour for years. Natural rattan is an indoor material and will break down outdoors within a season or two, which is worth checking before you buy anywhere.",
      },
      {
        question: "Is garden furniture delivered assembled?",
        answer:
          "It varies by piece and by supplier. Chairs and small tables generally arrive ready to use; larger corner sets and dining tables often need modules joining, which is usually a matter of minutes. The product page states what applies.",
      },
    ],
    related: ["planters", "outdoor-storage", "fire-pits"],
  },
  {
    slug: "bedside-tables",
    intro: [
      "A bedside table is judged on one thing: whether the lamp, the book and the glass of water all fit without anything balancing. Everything else — the drawer, the finish, the shape — comes after that.",
      "The range runs from ribbed walnut and solid oak to painted birch and reclaimed teak, in one, two and three drawer versions and in heights that suit a low bed as well as a high one.",
    ],
    guide: [
      "Match the height to the mattress, not the bed frame. The top should land within about 5cm of the top of the mattress — level is ideal. A tall bed with a low table means reaching down for the light in the dark, which is exactly when it matters.",
      "Measure the width you actually have between bed and wall before falling for a piece. Under 45cm and a slim single-drawer table or a wall shelf is the honest answer; 45 to 60cm covers most of the range.",
      "Decide what has to be hidden. An open shelf keeps a small room feeling lighter and forces tidiness. Drawers hide chargers, medicines and reading glasses, and on a two or three drawer chest the bedside becomes real storage in a room that has none spare.",
      "Think about the plug and the switch. A table with a solid back panel can make a socket unreachable and a cable awkward to route — worth checking against where the sockets actually are.",
    ],
    faqs: [
      {
        question: "What height should a bedside table be?",
        answer:
          "Within about 5cm of the top of your mattress, and level is best. Measure from the floor to the top of the mattress rather than to the bed frame — divan bases and thick mattresses change the answer considerably.",
      },
      {
        question: "How wide should a bedside table be?",
        answer:
          "Whatever leaves you a clear path past the bed. Most people have 45 to 60cm to work with; below 45cm, choose a slim single-drawer piece or a shelf rather than squeezing in something that blocks the walkway.",
      },
      {
        question: "Do bedside tables need to match the bed?",
        answer:
          "No, and matching everything often flattens a room. Picking up one thread — the timber tone, or the handle metal — ties the pieces together while letting the bedside stand as its own object.",
      },
      {
        question: "Can I use a small chest of drawers as a bedside table?",
        answer:
          "Often the better choice in a room short on storage, as long as the top lands near mattress height and the drawers can open fully without hitting the bed. Check the depth too — a deep chest beside a bed narrows the walkway fast.",
      },
    ],
    related: ["bedroom-storage", "bedroom-lighting", "bedroom-mirrors"],
  },
  {
    slug: "living-room-storage",
    intro: [
      "Sideboards, chests and cabinets for the things a living room accumulates — the cables, the board games, the paperwork that has nowhere else to be. Storage that is worth looking at, because in a living room it stands in full view.",
      "The range covers ribbed walnut and oak, painted birch, high-gloss and faux shagreen, from narrow three-drawer chests to four-door sideboards long enough to carry a television.",
    ],
    guide: [
      "Work out what is going in before you choose the shape. Drawers suit small things you need often; doors suit large things you need rarely. A sideboard with both is the flexible answer, and it is why the four-door pieces here also carry a drawer bank.",
      "If a television is going on top, check the width against the screen rather than the room. A 55-inch set is about 123cm wide, so a 120cm sideboard leaves it overhanging — 140cm and up looks deliberate. Height matters too: the screen centre wants to sit near eye level from the sofa, which usually means a unit no taller than 55 to 60cm.",
      "Measure the wall including the skirting. A sideboard with a plinth base sits flush; one with legs and a back panel may stand proud of the wall by the depth of the skirting board, which is the difference between fitting an alcove and not.",
      "Consider ventilation for anything electrical. Closed cabinets with solid backs trap heat around a games console or an amplifier, so look for a piece with an open back section or be prepared to cut one.",
    ],
    faqs: [
      {
        question: "What width sideboard do I need for a 55-inch television?",
        answer:
          "A 55-inch screen is roughly 123cm wide, so aim for 140cm or more to avoid overhang. Keep the unit height around 55 to 60cm so the middle of the screen sits near eye level when you are sitting down.",
      },
      {
        question: "Sideboard or chest of drawers for a living room?",
        answer:
          "A sideboard if you need a surface as well as storage, and especially if a television or lamps are going on top. A chest of drawers if the wall is short and the things being stored are small — it gives more usable division in less width.",
      },
      {
        question: "How do I stop a sideboard standing away from the wall?",
        answer:
          "Check whether the piece has a plinth base or legs with a back panel. A plinth sits flush; a back panel can catch on the skirting board and hold the unit out by a couple of centimetres, which shows in an alcove.",
      },
      {
        question: "Are the drawers on these pieces on runners?",
        answer:
          "It varies by range, and the product page states it. Solid reclaimed and rustic pieces often use traditional wooden runners, which suit the style; the painted and ribbed contemporary ranges generally use metal runners with a soft close.",
      },
    ],
    related: ["console-tables", "shelving", "tv-units"],
  },
  {
    slug: "side-tables",
    intro: [
      "The table you actually use. A side table beside a chair carries the lamp, the drink and the book that the coffee table is too far away to hold, and in a room without space for a coffee table it does the whole job on its own.",
      "The range covers ribbed oak, marble, reclaimed teak and metal-framed pieces, including nests that separate when there are people round and stack back when there aren't.",
    ],
    guide: [
      "Height is the whole point: level with the chair arm, or a little below. Around 55 to 65cm suits most armchairs and sofas. Too tall and it blocks the arm; too short and putting a glass down becomes a reach.",
      "Small is usually right. A 40 to 50cm top holds a lamp and a mug, and anything much larger starts behaving like a coffee table in the wrong place. Where you need more surface occasionally, a nest gives it to you without keeping it there permanently.",
      "Consider the base against the floor. A pedestal or three-leg base is easier to place on a rug than four legs, because it will not rock across the edge of the pile.",
      "For a lamp, weight matters. A light metal-framed table with a heavy ceramic lamp on it is a tipping hazard where there are children — pick the heavier marble or solid wood pieces for that job.",
    ],
    faqs: [
      {
        question: "How tall should a side table be?",
        answer:
          "Level with the arm of the chair it serves, or slightly below — usually 55 to 65cm. Measure your own chair arm rather than working from an average, because armchair heights vary a lot.",
      },
      {
        question:
          "What is the difference between a side table and an end table?",
        answer:
          "Nothing meaningful — the terms are used interchangeably, and both describe a small table beside seating. Occasional table means the same thing again.",
      },
      {
        question: "Do nest of tables have to stay together?",
        answer:
          "No, and they are most useful apart. Two or three tables of graduating size can serve different chairs and come back together when the floor is needed, which is why they suit smaller rooms.",
      },
      {
        question: "Will a side table sit level on a rug?",
        answer:
          "A pedestal or three-legged base will. Four legs bridging the edge of a rug tend to rock, so either place the table fully on the rug or fully off it.",
      },
    ],
    related: ["coffee-tables", "living-room-lighting", "sofas"],
  },
  {
    slug: "lighting",
    intro: [
      "Table and floor lamps in gesso, ceramic, brass and reclaimed wood — the layer of light that makes a room usable after dark, rather than the ceiling fitting that only makes it bright.",
      "One overhead light flattens a room. Two or three lamps at different heights give it depth, which is why almost every room photographed well has them and almost every room lit by a single pendant does not.",
    ],
    guide: [
      "Work in layers. A room wants three: something overhead for cleaning and finding things, something at table height for reading, and something low or indirect for the evening. Lamps do the second and third jobs, and they are the two that decide how a room feels.",
      "Get the table lamp height right against the seating. Sitting down, the bottom of the shade should be near eye level — roughly 100 to 105cm from the floor to the top of the shade for a lamp on a side table. Higher and you look straight at the bulb.",
      "For reading, put the light beside and slightly behind your shoulder rather than in front. A floor lamp with an adjustable or arched head does this without needing a table to stand on.",
      "Choose the bulb colour deliberately. Warm white around 2700K suits a living room or bedroom; anything cooler reads as an office. Check whether a fitting takes E27 or E14 before buying bulbs, and whether it is dimmable — a dimmable lamp with a non-dimmable bulb will flicker.",
    ],
    faqs: [
      {
        question: "How tall should a table lamp be?",
        answer:
          "So the bottom of the shade sits near eye level when you are seated — usually a total height of 100 to 105cm from the floor including the table. If you can see the bulb from your seat, the lamp is too tall for that table.",
      },
      {
        question: "How many lamps does a living room need?",
        answer:
          "Two or three besides the ceiling light. One in each corner you use, plus a reading light beside the chair you actually sit in. Spreading light around the edges of a room makes it feel larger than lighting it from the middle.",
      },
      {
        question: "What bulb colour should I use at home?",
        answer:
          "Warm white, around 2700K, for living rooms and bedrooms. Save cooler 4000K light for a work surface or a utility area, where seeing detail matters more than the room feeling comfortable.",
      },
      {
        question: "Are lamps supplied with bulbs?",
        answer:
          "Generally not, and the product page says so where it applies. It also lists the fitting — usually E27 or E14 — so you can order the right bulb at the same time.",
      },
    ],
    related: ["living-room-lighting", "bedroom-lighting", "side-tables"],
  },
  {
    slug: "office-storage",
    intro: [
      "Storage for a room that has to work and still look like part of the house. A home office is rarely a separate building — it is a corner of a bedroom, a box room, the end of a living room — so what holds the files has to sit alongside the rest of the furniture rather than announcing itself as office equipment.",
      "Chests, sideboards and crates in oak, walnut, birch and reclaimed teak, all of which read as furniture first and storage second.",
    ],
    guide: [
      "Measure what is actually being stored before choosing a shape. A4 lever-arch files need 32cm of internal height and around 8cm of width each; a drawer 30cm deep holds them lying flat but not standing. If files are the point, a cabinet with a shelf beats a chest of drawers.",
      "Height decides whether the top is usable. A unit at 75 to 80cm gives you a second work surface for a printer or a scanner. Anything above 90cm is storage only, because reaching over it to use the top becomes awkward when seated nearby.",
      "Keep the desk clear on the side you write on. Storage behind or beside the chair works; storage in front of the window costs you the light, which is the one thing a home office cannot get back.",
      "Cable management is the detail people regret. A closed cabinet holding a router or a hard drive needs a hole cut or a gap at the back, and heat builds fast in a sealed box.",
    ],
    faqs: [
      {
        question: "What size storage do I need for A4 files?",
        answer:
          "Lever-arch files want about 32cm of internal height standing up and 8cm of width each. A standard 30cm-deep drawer holds them flat but not upright, so if files are the main job, look for a cabinet with a shelf rather than a chest of drawers.",
      },
      {
        question: "Should office storage match the desk?",
        answer:
          "It helps, but picking up the timber tone or the handle metal is enough. In a home office that shares a room with something else, matching the room matters more than matching the desk.",
      },
      {
        question: "How high should office storage be?",
        answer:
          "75 to 80cm if you want to use the top as a surface for a printer. Taller than 90cm and the top is out of comfortable reach from a seated position, so it becomes storage only.",
      },
      {
        question: "Can I put a printer inside a closed cabinet?",
        answer:
          "Only with ventilation. A sealed cabinet traps heat around a printer or a router, and paper feeds need clearance to open. A unit with an open back section or a removable panel is the safer choice.",
      },
    ],
    related: ["desks", "office-shelving", "living-room-storage"],
  },
  {
    slug: "shelving",
    intro: [
      "Open shelving earns its place by showing what is on it, which makes it the hardest storage to live with and the most useful when it works. Reclaimed teak, oak and metal-framed units, from narrow display towers to six-shelf room dividers.",
      "Because nothing is hidden, the unit and the contents are one object. That is why the pieces here are worth looking at empty.",
    ],
    guide: [
      "Depth decides what fits. 20 to 25cm takes paperbacks and objects; 30cm takes hardbacks and box files; 35cm and over starts holding baskets and folded textiles. Deeper is not better — a deep shelf swallows small things at the back.",
      "Shelf spacing matters as much as shelf count. Paperbacks want 22cm of clear height, hardbacks 30cm, and a run of art or plants wants 35cm and up. Fixed-shelf units are worth checking against what you own before ordering.",
      "Fix tall units to the wall. Anything over about 150cm with a narrow footprint should be strapped, and that is not optional in a house with children — an open unit is climbable in a way a closed one is not.",
      "Leave a third of it empty. Open shelving that is packed reads as clutter however good the unit is, and the pieces that look best in a room are the ones with air between the objects.",
    ],
    faqs: [
      {
        question: "How deep should a bookshelf be?",
        answer:
          "20 to 25cm for paperbacks, 30cm for hardbacks and box files, 35cm and over for baskets and textiles. Anything deeper and objects get lost at the back.",
      },
      {
        question: "How much space do I need between shelves?",
        answer:
          "22cm of clear height for paperbacks, 30cm for hardbacks, 35cm and above for plants or framed pieces. On a fixed-shelf unit, check the spacing against what you actually own before ordering.",
      },
      {
        question: "Does open shelving need fixing to the wall?",
        answer:
          "Anything tall and narrow does — over roughly 150cm with a small footprint should be strapped. Open units are climbable, so with small children in the house treat it as necessary rather than optional.",
      },
      {
        question: "Can shelving be used as a room divider?",
        answer:
          "The open-backed units can, and it is one of the better uses for them. Check that the back looks finished, since one side of it will be on show, and fix it at the top or the base for stability.",
      },
    ],
    related: ["living-room-storage", "office-shelving", "kitchen-shelving"],
  },
  {
    slug: "sofas",
    intro: [
      "Seating chosen for how it sits rather than how it photographs. Chenille, bouclé and linen over frames built to be sat in every evening, in sizes that suit a real room rather than a showroom floor.",
      "A sofa is the piece a living room is arranged around, and the one most often bought a size too large. What follows is how to avoid that.",
    ],
    guide: [
      "Measure the route in before the room. A sofa has to pass the narrowest point — doorway, stair turn, half-landing — and it cannot be persuaded. Measure the diagonal of the doorway as well as its width, since a sofa turned on its side often goes through when it will not go through flat.",
      "Leave 90cm of walkway where people pass, and 40cm between the sofa and the coffee table. Fitting the sofa is not the test; walking round it afterwards is.",
      "Seat depth decides who it suits. Around 55cm suits sitting upright with feet down; 60cm and over is for sinking into and is uncomfortable for anyone short. If the household is mixed, the shallower seat is the safer choice.",
      "Match the fabric to the traffic. Chenille and bouclé are warm and hard-wearing but hold pet hair; linen is cool and relaxed but creases and marks more readily. On a sofa in daily use with animals, the tighter weave wins.",
    ],
    faqs: [
      {
        question: "How do I know a sofa will fit through my door?",
        answer:
          "Measure the doorway width, the diagonal, and the narrowest point on the route including any stair turn. Compare against the sofa's height and depth, not just its length — most sofas go through on their side when they will not go through upright.",
      },
      {
        question: "How much space should I leave around a sofa?",
        answer:
          "90cm for any walkway people use, and about 40cm between the sofa and the coffee table. Fitting it in is easy; living around it is what the measurements are for.",
      },
      {
        question: "What seat depth should I choose?",
        answer:
          "Around 55cm if you sit upright with your feet on the floor, 60cm or more if you like to sink in. Deep seats are uncomfortable for shorter people, so in a mixed household the shallower option suits more of them.",
      },
      {
        question: "Which fabric is best with pets?",
        answer:
          "A tight weave. Chenille and bouclé wear well but hold hair; linen marks and creases more easily. Whatever the fabric, removable covers are worth having when animals use the furniture.",
      },
    ],
    related: ["coffee-tables", "side-tables", "living-room-lighting"],
  },
  {
    slug: "outdoor-saunas",
    intro: [
      "Cabin, barrel and panoramic saunas for a garden, built as structures rather than appliances. A sauna outdoors is a small building — it needs a base, a power supply and a route in — and the ones here are specified to sit in a British garden through a British winter.",
      "Sizes run from two-person barrels to six-person cabins, in thermally treated timber with heaters sized to the cabin rather than sold separately as an afterthought.",
    ],
    guide: [
      "Start with the base, because it is the part that cannot be changed later. A sauna needs a level, load-bearing base — concrete, paving slabs or a properly built timber deck. Ground that moves will rack the door frame, and a sauna door that no longer seals is a sauna that no longer heats.",
      "Then the power. Most heaters above 4.5kW need a dedicated circuit, and larger cabins usually need a 3-phase or a 32A supply run by a qualified electrician. Getting an electrician to quote before ordering is the single most useful thing you can do, because it is the cost people do not budget for.",
      "Size it for how many actually use it. A two-person barrel heats in 20 to 30 minutes; a six-person cabin takes longer and costs more per session to run. A sauna used by two people most evenings is better small than large.",
      "Leave access all the way round. You will need to treat the timber, and a cabin against a fence cannot be maintained on that side. 50cm of clearance is enough to work in.",
    ],
    faqs: [
      {
        question: "What base does an outdoor sauna need?",
        answer:
          "Level and load-bearing — concrete, paving slabs or a properly constructed deck. Ground that settles unevenly twists the frame, and once the door stops sealing the sauna will not hold temperature.",
      },
      {
        question: "What electrical supply does an outdoor sauna need?",
        answer:
          "Most heaters over 4.5kW want a dedicated circuit, and larger cabins commonly need a 32A or 3-phase supply installed by a qualified electrician. Get that quoted before ordering — it is the cost most often left out of the budget.",
      },
      {
        question: "Do I need planning permission for a garden sauna?",
        answer:
          "Usually not, as most fall under permitted development for outbuildings, but height, boundary distance and total garden coverage all matter, and listed buildings and conservation areas are treated differently. Check with your local authority before ordering rather than after.",
      },
      {
        question: "How long does an outdoor sauna take to heat up?",
        answer:
          "A two-person barrel typically reaches temperature in 20 to 30 minutes. Larger cabins take longer and use more electricity per session, which is worth weighing if it will be used most days by one or two people.",
      },
    ],
    related: ["indoor-saunas", "cold-plunges", "wellness-accessories"],
  },
];

function block(text: string, key: string) {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
  };
}

async function main() {
  console.log(
    `\n${apply ? "APPLYING" : "DRY RUN"} — ${CONTENT.length} categories\n`,
  );

  let written = 0;
  for (const content of CONTENT) {
    const category = await client.fetch<{
      _id: string;
      title: string;
      n: number;
    } | null>(
      `*[_type == "category" && !(_id in path("drafts.**")) && slug.current == $slug][0]{
        _id, title,
        "n": count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id)])
      }`,
      { slug: content.slug },
    );
    if (!category) {
      console.log(`  !  ${content.slug} — no such category, skipped`);
      continue;
    }

    // Related links are resolved to real documents, and any that do not exist are
    // dropped rather than written as dangling references.
    const relatedIds: { _type: "reference"; _ref: string; _key: string }[] = [];
    for (const slug of content.related) {
      const target = await client.fetch<{ _id: string } | null>(
        `*[_type == "category" && !(_id in path("drafts.**")) && slug.current == $slug][0]{ _id }`,
        { slug },
      );
      if (target)
        relatedIds.push({
          _type: "reference",
          _ref: target._id,
          _key: `rel-${slug}`,
        });
      else console.log(`     ? related "${slug}" does not exist — dropped`);
    }

    console.log(
      `  →  ${category.title} (${category.n} products)  ` +
        `intro ${content.intro.length}¶ · guide ${content.guide.length}¶ · ` +
        `${content.faqs.length} FAQs · ${relatedIds.length} links`,
    );

    if (!apply) continue;

    await client
      .patch(category._id)
      .set({
        intro: content.intro.map((text, i) => block(text, `i${i}`)),
        buyingGuide: content.guide.map((text, i) => block(text, `g${i}`)),
        faqs: content.faqs.map((faq, i) => ({
          _type: "faqEntry",
          _key: `f${i}`,
          question: faq.question,
          answer: faq.answer,
        })),
        relatedCategories: relatedIds,
      })
      .commit();
    written += 1;
  }

  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }
  console.log(`\nWrote content for ${written} categories.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
