/**
 * The last two guides that close the editorial-link tail.
 *
 * After the sidebar and the first three gap guides, **26 of 908 live products
 * had no editorial link of any kind** — no guide naming them, no guide pointing
 * at their category. These two cover 14 of the 26 and the two categories worth
 * writing about:
 *
 *   MIRRORS BY ROOM — bathroom and bedroom mirrors are stocked as separate
 *   categories and bought as separate decisions, and no competing article
 *   treats them that way. A bathroom mirror has to survive steam and usually
 *   has to light a face; a bedroom one has to be tall enough to see a whole
 *   outfit. The size answers are different because the jobs are.
 *
 *   PRIVACY SCREENS — all ten are the same 45 x 122 x 198cm panel, so size is
 *   not the question. How many, where, whether they stop wind, and how tall
 *   the law lets you go are.
 *
 * The wind physics here is the same as in the garden-warmth guide, and the two
 * link to each other on purpose: a roughly half-permeable screen shelters up to
 * ten times its height downwind, where a solid fence drops turbulence a couple
 * of metres behind it.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-tail-gap-guides.ts
 *   pnpm tsx --env-file=.env.local scripts/write-tail-gap-guides.ts --apply
 */
import { createClient } from "@sanity/client";

import {
  faq,
  h2,
  imageSlot,
  inlineHrefs,
  linkRow,
  p,
  table,
  wordCount,
} from "./lib/guide-blocks";

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

const AUTHOR = { _type: "reference", _ref: "author-kaiku-editorial" };
const SHOP = (slug: string) => `/shop/${slug}`;
const PROD = (cat: string, slug: string) => `/shop/${cat}/${slug}`;

interface GuideSpec {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  categoryId: string;
  products: string[];
  buttons: [string, string][];
  body: { _type: string }[];
  faqs: ReturnType<typeof faq>[];
}

const GUIDES: GuideSpec[] = [
  {
    slug: "bathroom-or-bedroom-mirror",
    title:
      "Bathroom or bedroom mirror: why they are not the same purchase, and what size each needs",
    metaTitle: "Bathroom vs Bedroom Mirror: What Size? | Kaiku",
    metaDescription:
      "A bedroom mirror needs 140cm of height to show a whole outfit. A bathroom one needs to survive steam and light a face. Sizes and reasons for both rooms.",
    excerpt:
      "The two rooms want opposite things from a mirror — one has to show a whole person, the other has to survive steam and light a face from the front. Sizes, heights and what actually fails.",
    categoryId: "category-bedroom-mirrors",
    products: [
      "decorative-hanging-black-mirror",
      "square-decorative-hanging-collage-mirror-black",
      "gala-black-glass-vanity-mirror-with-drawers",
      "nahla-small-mirror-with-dimpled-frame",
      "nahla-medium-mirror-with-dimpled-frame",
      "nahla-large-mirror-with-dimpled-frame",
      "black-wood-arched-window-mirror",
      "avelino-illuminated-led-silver-round-mirror",
      "avelino-illuminated-led-gold-oval-mirror",
      "hampton-ivory-shagreen-square-wall-mirror",
      "hampton-ivory-octagonal-wall-mirror",
    ],
    buttons: [
      ["Bedroom mirrors", SHOP("bedroom-mirrors")],
      ["Bathroom mirrors", SHOP("bathroom-mirrors")],
      ["All mirrors", SHOP("mirrors")],
      ["Bathroom accessories", SHOP("bathroom-accessories")],
      ["All buying guides", "/learn"],
    ],
    body: [
      p(
        "A bedroom mirror has one job that decides its size: showing a whole outfit, shoes included. That takes about 140cm of glass hung with its top near eye level, and nothing shorter does it however handsome the frame.",
      ),
      p(
        "A bathroom mirror has a different job and a harder environment. It has to light a face from the front rather than from above, and it has to survive being steamed twice a day for years. Those two requirements are why a bathroom mirror costs more than a bedroom one of the same size, and why moving one into the other room usually disappoints.",
      ),
      linkRow("Here to buy rather than to read? Start here.", [
        ["Bedroom mirrors", SHOP("bedroom-mirrors")],
        ["Bathroom mirrors", SHOP("bathroom-mirrors")],
        ["All mirrors", SHOP("mirrors")],
      ]),
      imageSlot(
        "A tall bedroom mirror beside a wardrobe, showing a full reflection",
        "Opening shot. A tall mirror in a real bedroom, positioned so the reflection shows a full-length view including the floor. Natural light from a window to the side rather than behind the camera, so there is no flash bounce. The whole guide is about height, so the frame should run most of the picture.",
        "140cm of glass, top near eye level. Anything shorter shows you from the knees up.",
      ),
      table(
        "What each room needs",
        ["Room", "Height of glass", "Hung at", "The thing that matters"],
        [
          [
            "Bedroom, full length",
            "140cm+",
            "Floor or leaning",
            "Seeing shoes",
          ],
          [
            "Bedroom, over a chest",
            "60–90cm",
            "Top at 165cm",
            "Light, not outfit",
          ],
          ["Dressing table", "40–60cm", "Sitting eye level", "Close work"],
          [
            "Bathroom, over a basin",
            "60–90cm",
            "Centre at 160cm",
            "Steam and front light",
          ],
          ["Hallway", "80–120cm", "Top at 180cm", "Bouncing daylight"],
        ],
      ),
      h2("The bedroom: height first, everything else second"),
      p(
        "Hang a mirror so its top sits at about 175cm and its bottom reaches past your knees, and you have a mirror that works. The ",
        [
          "black wood arched window mirror",
          PROD("bedroom-mirrors", "black-wood-arched-window-mirror"),
        ],
        " at 135 x 90cm is the size this actually means, and it works leaning against a wall as readily as hung — which is worth knowing, because a mirror that heavy on plasterboard needs proper fixings and a mirror leaning needs none.",
      ),
      p(
        "The narrow hanging mirrors are a different proposition. At ",
        [
          "13 x 146cm",
          PROD("bedroom-mirrors", "decorative-hanging-black-mirror"),
        ],
        " and ",
        [
          "14 x 145cm",
          PROD(
            "bedroom-mirrors",
            "square-decorative-hanging-collage-mirror-black",
          ),
        ],
        " they are tall enough to be useful and narrow enough to fit a wall that has nothing else spare — beside a door, between two windows. They will not show a whole outfit at once, and they are not meant to.",
      ),
      h2("Over a chest of drawers, size to the furniture"),
      p(
        "A mirror above a piece of furniture should be roughly two thirds to three quarters of its width, and no wider. Wider reads as a mistake; much narrower reads as an afterthought. The ",
        [
          "Nahla in three sizes",
          PROD("bedroom-mirrors", "nahla-medium-mirror-with-dimpled-frame"),
        ],
        " — ",
        [
          "64cm",
          PROD("bedroom-mirrors", "nahla-small-mirror-with-dimpled-frame"),
        ],
        ", 78cm and ",
        [
          "86cm",
          PROD("bedroom-mirrors", "nahla-large-mirror-with-dimpled-frame"),
        ],
        " — exists for exactly that, because chests come in roughly 90cm, 100cm and 120cm.",
      ),
      p(
        "Leave 15 to 20cm between the top of the furniture and the bottom of the mirror. Less and the two read as one lump; more and the mirror floats. That gap is the single detail that separates a hung mirror from a well-hung one.",
      ),
      h2("The bathroom: steam is what kills mirrors"),
      p(
        "Mirror backing is a silver layer with a protective coat over it, and moisture that reaches the edge lifts that coat. The black speckling that creeps in from the corners of an old bathroom mirror is that failure, and it is not repairable.",
      ),
      p(
        "Two things prevent it. Sealed edges, which is what a bathroom-rated mirror has and a bedroom one usually does not. And extraction — a bathroom that clears its steam in ten minutes will not kill a mirror, and one that stays damp for an hour will kill any mirror you hang in it. Buying a better mirror for a badly ventilated bathroom is solving the wrong problem.",
      ),
      imageSlot(
        "The corner of an old bathroom mirror showing black speckling where the backing has failed",
        "The failure shot. A close crop of the bottom corner of a bathroom mirror with visible black desilvering creeping in from the edge. Unglamorous and unmistakable. Nobody photographs this and it is the whole argument for buying a bathroom-rated mirror rather than any mirror.",
        "Desilvering, from the edge inwards. Not repairable.",
      ),
      h2("Light from the front, not from above"),
      p(
        "A ceiling light above a bathroom mirror puts your eyes, nose and chin in shadow, which is why shaving and make-up both go wrong under one. Light needs to come from the front or from either side at about face height.",
      ),
      p(
        "An illuminated mirror solves it in one object. The ",
        [
          "Avelino round at 70cm",
          PROD(
            "bathroom-mirrors",
            "avelino-illuminated-led-silver-round-mirror",
          ),
        ],
        " and the ",
        [
          "60 x 90cm oval",
          PROD("bathroom-mirrors", "avelino-illuminated-led-gold-oval-mirror"),
        ],
        " both light from the glass itself, which is the correct direction by definition. They need a fused spur rather than a socket, so it is an electrician's job unless one is already there.",
      ),
      p(
        "Where the lighting is already right, an unlit mirror is the better-looking choice. The ",
        [
          "Hampton square at 80 x 80cm",
          PROD("bathroom-mirrors", "hampton-ivory-shagreen-square-wall-mirror"),
        ],
        " and the ",
        [
          "octagonal version",
          PROD("bathroom-mirrors", "hampton-ivory-octagonal-wall-mirror"),
        ],
        " are the pieces for a bathroom that is a room rather than a cubicle.",
      ),
      h2("Height above a basin, and the mistake everybody makes"),
      p(
        "Centre the glass at about 160cm from the floor, not centred on the basin. Basins sit at 80 to 85cm and a mirror centred on one ends up too low for a tall adult and fine for nobody. 160cm puts the centre near adult eye level, which is what a mirror is for.",
      ),
      p(
        "Width should stop short of the basin's edges rather than matching them — roughly the width of the basin or slightly less. A mirror wider than the unit below it draws attention to the gap at the sides, and in a small bathroom that is the difference between the room reading as considered and reading as crowded.",
      ),
      h2("The dressing table is its own case"),
      p(
        "Sitting down changes everything. A dressing-table mirror is used at 110 to 120cm from the floor rather than 160, and it is used at arm's length for close work rather than at two metres for a whole view. The ",
        [
          "Gala vanity mirror with drawers",
          PROD(
            "bedroom-mirrors",
            "gala-black-glass-vanity-mirror-with-drawers",
          ),
        ],
        " at 50cm tall is built for that distance, and a wall mirror pressed into the job is always slightly too far away.",
      ),
      h2("Hanging a heavy mirror without taking the wall with it"),
      p(
        "Mirror glass is dense. A 135 x 90cm framed mirror is well over 15kg, and that is a load plasterboard alone will not hold — the usual failure is not the fixing pulling out of the wall but a plug of plasterboard coming away with it, six months later, on a wall that seemed fine.",
      ),
      p(
        "Into masonry, use proper wall plugs and screws rated well above the weight. Into stud, find the timber and screw into that. Into plasterboard with no stud where you need one, use heavy-duty toggle or spring fixings rated for the load — not the small brown plugs that come in the box. Two fixings spread across the frame beat one in the middle, because a single point lets the mirror swing and work itself loose.",
      ),
      h2("What a mirror does to a room, beyond the reflection"),
      p(
        "A mirror opposite a window doubles the daylight in a room, which is the oldest trick in the book and still the most effective thing you can do to a dark bedroom for under two hundred pounds. A mirror opposite a door shows whoever enters themselves, which some people find welcoming and others find unsettling.",
      ),
      p(
        "Position for what it reflects, not only for where the wall is empty. A mirror facing a blank wall reflects a blank wall and makes the room feel larger by nothing at all. Stand where you will usually be, look at the wall you are considering, and work out what you would be looking at.",
      ),
      h2("The short version"),
      p(
        "Bedroom, full length: 140cm of glass, top around 175cm, or lean it. Over furniture: two thirds of the width, with a 15 to 20cm gap. Bathroom: buy one made for a bathroom, because sealed edges are the difference between five years and fifteen, and fix the extraction if the room stays damp. Light from the front at face height, never from the ceiling. Centre a bathroom mirror at 160cm from the floor, not on the basin.",
      ),
    ],
    faqs: [
      faq(
        "What size mirror do I need to see a full outfit?",
        "About 140cm of glass, hung with the top near 175cm so the bottom reaches past your knees. Anything shorter shows you from roughly the waist up, which is enough to check a collar and not enough to check an outfit. A narrow mirror works if it is tall — the height is what matters, not the width.",
        "mirror-faq-0",
      ),
      faq(
        "How high should a bathroom mirror be above the basin?",
        "Centre the glass at about 160cm from the floor rather than centring it on the basin. Basins sit at 80 to 85cm, so a mirror centred on one lands too low for most adults. 160cm puts the middle of the glass near adult eye level, which is the height a mirror is actually used at.",
        "mirror-faq-1",
      ),
      faq(
        "Can I use an ordinary mirror in a bathroom?",
        "You can, and it will fail sooner. Mirror backing is a silver layer under a protective coat, and moisture reaching the edge lifts that coat — the black speckling that creeps in from the corners of an old bathroom mirror. A bathroom-rated mirror has sealed edges. Extraction matters as much: a bathroom that stays damp for an hour will kill any mirror in it.",
        "mirror-faq-2",
      ),
      faq(
        "What size mirror goes above a chest of drawers?",
        "Roughly two thirds to three quarters of the furniture's width, and never wider. Leave 15 to 20cm between the top of the chest and the bottom of the mirror — less and the two read as a single lump, more and the mirror looks like it is floating away from the piece it belongs to.",
        "mirror-faq-3",
      ),
      faq(
        "Are illuminated bathroom mirrors worth it?",
        "If your bathroom light is on the ceiling, yes. Overhead light puts the eyes, nose and chin in shadow, which is why shaving and make-up both go wrong under one — light needs to come from the front or the sides at face height. An illuminated mirror does that by definition. They need a fused spur rather than a plug socket, so budget for an electrician unless one is already fitted.",
        "mirror-faq-4",
      ),
    ],
  },

  {
    slug: "garden-privacy-screens-how-many",
    title:
      "Garden privacy screens: how many you need, where they go, and whether they stop wind",
    metaTitle: "Garden Privacy Screens: How Many? | Kaiku",
    metaDescription:
      "A half-open screen shelters ten times its height downwind; a solid fence makes turbulence. How many panels a seating area needs, and the 2m height rule.",
    excerpt:
      "Every panel here is the same size, so the question is not which one — it is how many, where they stand, and whether a cut-out screen actually blocks anything. It does, and better than a solid one.",
    categoryId: "category-privacy-screens",
    products: [
      "decorative-privacy-screen-with-stand-freestanding-metal-outdoor-divider-decorative-privacy",
      "decorative-outdoor-divider-metal-privacy-screen-with-stand-triangle-style-black",
      "rhombus-metal-privacy-screen-with-stand-black-or-kaiku",
      "metal-decorative-privacy-screen-outdoor-divider-black-twisted-lines",
      "metal-decorative-privacy-screen-outdoor-divider-black-grid",
      "metal-decorative-privacy-screen-outdoor-divider-green-leaf",
      "metal-decorative-privacy-screen-outdoor-divider-black-leaf",
      "decorative-privacy-fence-screen-metal-outdoor-privacy-screen-climbing-plant-trellis-with-s",
    ],
    buttons: [
      ["Privacy screens", SHOP("privacy-screens")],
      ["Garden furniture", SHOP("garden-furniture")],
      ["Pergolas & gazebos", SHOP("pergolas")],
      ["Planters", SHOP("planters")],
      ["All buying guides", "/learn"],
    ],
    body: [
      p(
        "A screen that lets about half the wind through shelters further than a solid one. That is counter-intuitive and it is the most useful thing to know before buying: wind hitting a solid barrier rolls over the top and drops back down as turbulence a couple of metres behind it, while a permeable screen slows the air instead of stopping it and shelters a distance of up to ten times its own height downwind.",
      ),
      p(
        "Every panel in this range is 198cm tall and 122cm wide, so size is not the decision. How many, where they stand, and how open the pattern is — those are.",
      ),
      linkRow("Here to buy rather than to read? Start here.", [
        ["Privacy screens", SHOP("privacy-screens")],
        ["Garden furniture", SHOP("garden-furniture")],
        ["Pergolas & gazebos", SHOP("pergolas")],
      ]),
      imageSlot(
        "A freestanding cut-out metal screen beside a patio seating group, planting visible through the pattern",
        "Opening shot. A screen standing beside a seating group, shot from the seating side so the reader sees what the screen gives them rather than what it hides. Planting or sky visible through the cut-outs — the permeability is the point. Late afternoon light so the pattern throws a shadow.",
        "Half-open shelters further than solid. The pattern is doing work.",
      ),
      table(
        "How far one panel shelters",
        [
          "Screen height",
          "Useful shelter downwind",
          "Covers a seating group of",
        ],
        [
          ["198cm", "Up to about 12–15m in theory", "Any patio, in practice"],
          ["198cm, realistic", "4–6m of genuinely calmer air", "4–6 seats"],
          [
            "One panel, 122cm wide",
            "Shelters wider than itself",
            "Two to three chairs",
          ],
        ],
      ),
      h2("How many you need"),
      p(
        "One panel screens a two-seat corner. Two at an angle to each other screen a four-seat table and do far more than two in a line, because wind and eyelines rarely arrive from the same direction. Three is the point at which a patio becomes a room.",
      ),
      p(
        "Buy an odd number if they are standing free in a garden and an even number if they are flanking something — a door, a table, a gap in a hedge. That is the same rule that governs planters and lanterns, and it holds for the same reason: symmetry reads as deliberate and a random count reads as whatever was in stock.",
      ),
      h2("Placement: shelter the seats, not the boundary"),
      p(
        "The instinct is to line screens along a fence to hide a neighbour. That usually wastes them. A screen works hardest close to the people it is protecting, because the sheltered pocket behind it is widest near the panel and spreads out thinner the further back you go.",
      ),
      p(
        "So put them at the edge of the seating, angled slightly inward, rather than at the end of the garden. You get more shelter, more privacy from the angles that actually overlook you, and the screen becomes part of the seating area instead of part of the boundary.",
      ),
      h2("How open should the pattern be?"),
      p(
        "For wind, roughly half-open is the target. For privacy, it depends entirely on distance — a pattern that hides nothing at two metres hides a great deal at eight, because the eye cannot resolve through overlapping gaps at an angle.",
      ),
      p(
        "The ",
        [
          "grid",
          PROD(
            "privacy-screens",
            "metal-decorative-privacy-screen-outdoor-divider-black-grid",
          ),
        ],
        " and ",
        [
          "triangle",
          PROD(
            "privacy-screens",
            "decorative-outdoor-divider-metal-privacy-screen-with-stand-triangle-style-black",
          ),
        ],
        " patterns are the most open of the range and the best wind performers. The ",
        [
          "leaf designs",
          PROD(
            "privacy-screens",
            "metal-decorative-privacy-screen-outdoor-divider-black-leaf",
          ),
        ],
        " — also in ",
        [
          "green",
          PROD(
            "privacy-screens",
            "metal-decorative-privacy-screen-outdoor-divider-green-leaf",
          ),
        ],
        " — and the ",
        [
          "rhombus",
          PROD(
            "privacy-screens",
            "rhombus-metal-privacy-screen-with-stand-black-or-kaiku",
          ),
        ],
        " and ",
        [
          "twisted lines",
          PROD(
            "privacy-screens",
            "metal-decorative-privacy-screen-outdoor-divider-black-twisted-lines",
          ),
        ],
        " are denser and screen better at close range.",
      ),
      h2("The height rule, and why 198cm is the number"),
      p(
        "In England and Wales, a fence or screen at a boundary can generally reach 2 metres without planning permission, and 1 metre where it fronts a road. These panels are 198cm — just under, deliberately.",
      ),
      p(
        "Freestanding screens inside a garden, away from the boundary, are a different matter and are usually not caught by the same rule. The full position, including what counts as a boundary, is in our ",
        [
          "pergola and screen height guide",
          "/learn/pergola-vs-gazebo-and-privacy-screen-height",
        ],
        ". Check with your own council before fixing anything to a boundary, because local variation is real.",
      ),
      imageSlot(
        "Two screens set at an angle to each other around a patio table, seen from above",
        "The placement shot, ideally from an upstairs window or a ladder. Two screens angled toward each other around a seating group, rather than in a straight line along a fence. Shows the sheltered pocket the text describes. This is the picture that explains the whole placement section without a diagram.",
        "Angled inward, at the edge of the seating. Not along the boundary.",
      ),
      h2("Climbing plants change what a screen is"),
      p(
        "A screen with a trellis function becomes opaque within two seasons if you plant the right thing against it, and stays interesting in a way bare metal does not. The ",
        [
          "climbing-plant trellis screen",
          PROD(
            "privacy-screens",
            "decorative-privacy-fence-screen-metal-outdoor-privacy-screen-climbing-plant-trellis-with-s",
          ),
        ],
        " is made for it.",
      ),
      p(
        "Clematis, star jasmine and honeysuckle all climb metal happily. Ivy will too, and will keep going — it does not stop at the top of the screen and it is heavy enough to matter on a freestanding panel. Plant into ",
        ["a decent-sized planter", SHOP("planters")],
        " at the base rather than into the ground if the screen ever needs moving.",
      ),
      h2("Wind is also what knocks them over"),
      p(
        "A 198cm panel is a sail. Every screen here comes with a stand, and the stand is the part that decides whether it survives a winter — a freestanding screen on a paved surface needs weighting, and the usual method is a planter either side of the foot doing double duty.",
      ),
      p(
        "If a screen is going somewhere genuinely exposed, fix it rather than stand it. A panel that blows into a glass door costs more than the fixings would have.",
      ),
      h2("Metal, and what a British winter does to it"),
      p(
        "Powder-coated steel is what these are, and powder coat is genuinely durable until it is chipped. Water gets under the coating at a chip, rust spreads beneath the surface, and the first visible sign is the coating lifting rather than a rust spot appearing.",
      ),
      p(
        "So handle them carefully on the way in, and touch up any chip you make. A screen standing on soil rots at the foot faster than one on paving, because the base stays wet. If yours is going into a border rather than onto a patio, sit the feet on a paving slab or a couple of bricks — the same rule as a planter, for the same reason.",
      ),
      h2("Privacy from above is a different problem"),
      p(
        "A 198cm screen stops a neighbour at ground level and does nothing at all about an upstairs window. If what overlooks you is a first floor, a screen is the wrong tool and you want something overhead — a pergola, a canopy, or a tree.",
      ),
      p(
        "That is worth establishing before buying, because it is the commonest disappointment with screens. Stand where you sit, look up at whatever overlooks you, and ask whether a two-metre panel is in that line of sight. If the answer is no, spend the money on ",
        ["something with a roof", SHOP("pergolas")],
        " instead.",
      ),
      h2("What they cost to live with"),
      p(
        "Nothing, which is the quiet argument for them. A screen has no running cost, needs no power, and asks for a wipe once a season and a touch-up if it gets chipped. Compared with the other ways of making a garden usable — heating, lighting, a structure — it is the only one that keeps working for free.",
      ),
      p(
        "That also makes it the sensible first purchase. Blocking wind is cheaper than heating against it, and a sheltered patio with no heater is used more often than an exposed one with a good heater. If the budget only stretches to one thing this year, it should be this rather than a ",
        ["fire pit table", SHOP("fire-pits")],
        ".",
      ),
      h2("The short version"),
      p(
        "Half-open beats solid, because solid makes turbulence. One panel screens a corner, two at an angle screen a table, three make a room. Place them at the edge of the seating and angle them inward rather than lining the boundary. 198cm keeps you under the 2m rule at a boundary in England and Wales. Weight the stands or fix them, and if you want it opaque, plant something that climbs.",
      ),
    ],
    faqs: [
      faq(
        "Do garden privacy screens actually block wind?",
        "A permeable one does, and better than a solid fence. Wind hitting a solid barrier rolls over the top and drops back down as turbulence a couple of metres behind it, so the sheltered patch is short and gusty. A screen that lets roughly half the wind through slows the air instead of stopping it, and shelters a distance of up to ten times its own height downwind.",
        "screen-faq-0",
      ),
      faq(
        "How many privacy screens do I need?",
        "One screens a two-seat corner. Two set at an angle to each other screen a four-seat table, and do considerably more than two in a straight line, because wind and eyelines rarely come from the same direction. Three is where a patio starts to feel like a room rather than a paved area.",
        "screen-faq-1",
      ),
      faq(
        "How tall can a garden privacy screen be without planning permission?",
        "In England and Wales a boundary fence or screen can generally reach 2 metres, or 1 metre where it fronts a road. These panels are 198cm, just under. Freestanding screens inside a garden rather than at the boundary are usually treated differently. Local variation is real, so check with your council before fixing anything to a boundary.",
        "screen-faq-2",
      ),
      faq(
        "Where should I put a privacy screen?",
        "At the edge of the seating, angled slightly inward — not along the fence at the end of the garden. The sheltered pocket behind a screen is widest close to the panel and thins out further back, so a screen works hardest near the people it is protecting. It also blocks the angles that actually overlook you rather than the ones that do not.",
        "screen-faq-3",
      ),
      faq(
        "What can I grow up a metal privacy screen?",
        "Clematis, star jasmine and honeysuckle all climb metal well and will make a screen close to opaque within two seasons. Ivy will too, but it does not stop at the top and gets heavy enough to matter on a freestanding panel. Plant into a large planter at the foot rather than into the ground if the screen might ever need to move.",
        "screen-faq-4",
      ),
    ],
  },
];

async function main() {
  const allProducts = [...new Set(GUIDES.flatMap((g) => g.products))];
  const found = await client.fetch<{ slug: string; _id: string }[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && slug.current in $slugs]{ _id, "slug": slug.current }`,
    { slugs: allProducts },
  );
  const bySlug = new Map(found.map((f) => [f.slug, f._id]));
  const missing = allProducts.filter((s) => !bySlug.has(s));
  if (missing.length) {
    console.error(`Products that do not exist:\n  ${missing.join("\n  ")}`);
    process.exit(1);
  }

  const catIds = [...new Set(GUIDES.map((g) => g.categoryId))];
  const foundCats = await client.fetch<string[]>(
    `*[_type=="category" && _id in $ids]._id`,
    { ids: catIds },
  );
  const missingCats = catIds.filter((id) => !foundCats.includes(id));
  if (missingCats.length) {
    console.error(`Categories that do not exist: ${missingCats.join(", ")}`);
    process.exit(1);
  }

  // Every /learn link must resolve, or a new guide ships a 404.
  const learnLinks = [
    ...new Set(
      GUIDES.flatMap((g) => inlineHrefs(g.body))
        .filter((h) => h.startsWith("/learn/"))
        .map((h) => h.replace("/learn/", "")),
    ),
  ];
  const foundGuides = await client.fetch<string[]>(
    `*[_type=="buyingGuide" && slug.current in $slugs].slug.current`,
    { slugs: learnLinks },
  );
  const brokenLinks = learnLinks.filter((l) => !foundGuides.includes(l));
  if (brokenLinks.length) {
    console.error(
      `Links to guides that do not exist: ${brokenLinks.join(", ")}`,
    );
    process.exit(1);
  }

  let failed = false;
  for (const g of GUIDES) {
    const words = wordCount(g.body);
    const links = inlineHrefs(g.body).length;
    const slots = g.body.filter((b) => b._type === "image").length;
    console.log(`\n${g.title}`);
    console.log(`  /learn/${g.slug}`);
    console.log(
      `  ${words} words · ${links} inline links · ${g.buttons.length} buttons · ${slots} image spaces · ${g.faqs.length} FAQs · ${g.products.length} product cards`,
    );
    console.log(
      `  metaTitle ${g.metaTitle.length} · metaDescription ${g.metaDescription.length}`,
    );
    if (g.metaDescription.length > 160) {
      console.error("    meta description over 160 characters.");
      failed = true;
    }
    if (g.metaTitle.length > 60) {
      console.error("    meta title over 60 characters.");
      failed = true;
    }
    if (words < 1000) {
      console.error(
        `    ${words} words — too short for a guide meant to rank.`,
      );
      failed = true;
    }
  }
  if (failed) process.exit(1);

  if (!apply) return console.log("\nDry run — re-run with --apply.");

  for (const g of GUIDES) {
    await client.createOrReplace({
      _id: `buyingGuide-${g.slug}`,
      _type: "buyingGuide",
      title: g.title,
      slug: { _type: "slug", current: g.slug },
      excerpt: g.excerpt,
      body: [
        ...g.body.slice(0, 2),
        linkRow("Here to buy rather than to read? Start here.", g.buttons),
        ...g.body.slice(2).filter((b) => b._type !== "guideLinkRow"),
      ],
      faqs: g.faqs,
      publishedAt: new Date().toISOString(),
      author: AUTHOR,
      relatedCategory: { _type: "reference", _ref: g.categoryId },
      relatedProducts: g.products.map((slug, i) => ({
        _key: `rp-${i}`,
        _type: "reference",
        _ref: bySlug.get(slug)!,
      })),
      seo: {
        _type: "seo",
        metaTitle: g.metaTitle,
        metaDescription: g.metaDescription,
      },
    });
    console.log(`  published /learn/${g.slug}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
