/**
 * Batch 4 — the last 11 thin published descriptions, clearing the backlog
 * from 78 to 0.
 *
 * Two facts in here were buried in FAQ answers and belong in the copy:
 *
 *   - The Large Black Multi Shelf Unit ships with an anti-tip safety strap.
 *     A 200cm shelving unit is a genuine tipping hazard around children, and
 *     "a strap is supplied, use it" is the most important sentence on that
 *     page. It appeared nowhere in the description.
 *   - The Small Blue Flora Planter's photography shows plants that are not
 *     included. Stated plainly here rather than left for the customer to
 *     discover on delivery.
 *
 * The Light Up Bookcase is the one product in the batch with genuinely thin
 * source data — its FAQs answer "what is it made from" with "high-quality
 * materials". Rather than invent a material, the copy is built from the
 * figures that ARE known and verifiable (220 x 90 x 38cm, 63kg, integrated
 * lighting, assembly required), and those numbers carry real buying
 * implications on a unit that size. Its material gap is logged in
 * docs/master-brief.md as a data task, not papered over in prose.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-thin-descriptions-batch4.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-thin-descriptions-batch4.ts --apply
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

interface Section {
  heading: string;
  paragraphs: string[];
}
interface Written {
  id: string;
  title: string;
  summary: string;
  sections: Section[];
}

export const REWRITES: Written[] = [
  {
    id: "product-import-avia-mist-armchair",
    title: "Avia Mist Armchair | Kaiku",
    summary:
      "A fabric armchair in a muted mist tone with a clean silhouette. 97 x 86 x 72cm, 17.5kg. Arrives assembled. Indoor use only.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A fabric-upholstered armchair in a soft, muted mist tone, with a clean unfussy silhouette and no visible frame or exposed timber.",
          "A muted mid-tone is the most practical choice in an armchair you intend to keep through a change of scheme. It reads as a neutral against both warm and cool palettes, where a strong colour commits the room, and it shows marks far less readily than either cream or charcoal.",
        ],
      },
      {
        heading: "Dimensions and Room Fit",
        paragraphs: [
          "97cm wide, 86cm deep and 72cm high, weighing 17.5kg.",
          "86cm of depth is generous — this is a chair built for sitting back in rather than perching on, which is what makes it work as a reading chair. Allow for that depth plus room to walk past when placing it; it needs about 1.2m of clear floor to function as seating rather than an obstacle.",
          "The 72cm back height is low. That keeps it from blocking a window or dominating a small room, and it means the chair sits below the sightline in an open-plan space — but it is a chair for the shoulders rather than one you can rest your head against.",
        ],
      },
      {
        heading: "Delivery and Assembly",
        paragraphs: [
          "Arrives fully assembled — nothing to build.",
          "At 17.5kg it is a comfortable two-person carry and manageable for one person over a short distance. Since it comes built, check the route in: a 97 x 86cm chair needs to pass through your doorways and any hallway turn at its finished size.",
        ],
      },
      {
        heading: "Indoor Use and Fabric Care",
        paragraphs: [
          "Indoor use only, and it should be kept away from outdoor and damp environments.",
          "Vacuum it regularly — this is the single most effective thing for upholstery, because grit worked into the weave by sitting is what abrades fibres and wears a seat out, well before any staining does.",
          "Deal with spills promptly using a damp cloth, blotting rather than rubbing and working inward from the outside of the mark so it does not spread into a ring.",
        ],
      },
    ],
  },
  {
    id: "product-import-black-wood-arched-window-mirror",
    title: "Black Wood Arched Window Mirror | Kaiku",
    summary:
      "A large arched window-style mirror in a black wooden frame with glazing-bar detailing. 135cm wide, 90cm high and 2cm deep, weighing 11kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A black wooden frame divided into panes in the manner of an arched window, so the mirror reads as a window opening rather than as a mirror on a wall.",
          "That is the entire idea behind the design and it is worth understanding before buying: because the glass is divided by bars, you do not get one clean full reflection. You get a segmented one. It is an architectural feature that happens to reflect, not a dressing mirror.",
          "The black frame is what lets it work in both directions stylistically — the clean colour suits contemporary and industrial rooms, while the arched window form reads classic and country.",
        ],
      },
      {
        heading: "Dimensions and Proportions",
        paragraphs: [
          "135cm wide, 90cm high and only 2cm deep, weighing 11kg.",
          "The proportions are landscape rather than portrait, which is unusual for an arched mirror and determines where it goes: it wants a wide wall, and it sits naturally above a console, sideboard, dining sideboard or bed rather than in a narrow hallway gap.",
          "2cm of depth means it sits almost flush to the wall. In a room where a deep-framed mirror would feel heavy, this reads as part of the wall.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: [
          "11kg over 135cm of width needs two fixing points rather than one, spread well apart. That keeps it level over time and halves the load at each point.",
          "Source fixings for your wall type. Into masonry, screws into properly sized wall plugs are straightforward. In plasterboard, find the studs and fix into them where you can — at 135cm wide there is a good chance of catching two — or use heavy-duty cavity anchors rated well above the weight. Ordinary plastic plugs are not adequate.",
          "Above furniture, hang it so the bottom of the frame sits 15-25cm above the top of a console or sideboard, which reads as a deliberate pairing rather than two separate objects.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Hallways, living rooms, bedrooms, dining rooms and entrance spaces — anywhere a wide wall needs breaking up.",
          "The genuine functional benefit is light. Hung on the wall opposite or adjacent to a window, a mirror this size bounces daylight back into the room, which makes a noticeable difference in a north-facing space or a dark hallway.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Spray the cloth rather than the mirror, and keep moisture away from the frame edges and the glazing bars — those joints are where water sits and where a painted timber frame will eventually lift or mark.",
          "The bars need a cloth wrapped round a finger to get into the corners. It takes longer than a plain mirror, which is the trade for the detail.",
        ],
      },
    ],
  },
  {
    id: "product-import-bloom-collection-outdoor-footstool",
    title: "Bloom Collection Outdoor Footstool | Kaiku",
    summary:
      "An outdoor footstool in fabric, metal and synthetic fibres with weather-resistant construction. 77 x 55 x 27cm, 8.5kg. Part of the Bloom garden furniture collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Fabric over a metal frame with synthetic fibres, built for outdoor conditions and finished in a neutral palette.",
          "Synthetic fibre rather than natural is the deliberate choice for outdoor use: it does not absorb water the way cotton or natural rattan does, so the stool dries out after rain instead of holding damp in the weave and going musty.",
          "Being part of the Bloom collection means it is designed to sit alongside the range's other pieces rather than looking like a separate purchase — which matters for a footstool, since its job is to pair with a chair.",
        ],
      },
      {
        heading: "Dimensions and How to Use It",
        paragraphs: [
          "77cm wide, 55cm deep and 27cm high, weighing 8.5kg.",
          "27cm is low — lower than a seat height — which confirms what it is designed for: resting your feet while sitting back in a garden chair. Its 77 x 55cm top is generous enough to take both feet comfortably rather than one at a time.",
          "It also works as occasional extra seating when you are a chair short, and as a low surface for a tray of drinks between two chairs. At 8.5kg one person can reposition it easily as the afternoon and the sun move around.",
        ],
      },
      {
        heading: "Weather Resistance and Storage",
        paragraphs: [
          "Weather-resistant construction, so it copes with being left out through normal use — this is not a piece that has to come in every time it rains.",
          "Fabric outdoor furniture still lasts considerably longer if it is stored dry over winter rather than left standing through months of wet and frost. Under cover, in a shed or garage, is ideal; at 8.5kg carrying it in is no trouble.",
          "If it does get soaked, stand it somewhere airy to dry through rather than putting a cover straight over it, which traps moisture against the fabric.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Brush off loose dirt first, then clean the fabric with mild soapy water and a soft cloth or brush.",
          "Avoid pressure washers. They drive water deep into the padding, which then takes days to dry out from the inside, and the force can damage the fabric weave.",
        ],
      },
    ],
  },
  {
    id: "product-import-echo-french-grey-chair",
    title: "Echo French Grey Chair | Kaiku",
    summary:
      "A moulded outdoor dining chair in polypropylene and fibreglass with a French Grey finish, from the Allura collection. 50 x 55 x 77cm, 5.5kg. UV and weather resistant.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A single-piece moulded shell in polypropylene reinforced with fibreglass, finished in French Grey — part of the Allura outdoor collection.",
          "The fibreglass reinforcement is the detail that matters. Plain polypropylene garden chairs flex and can eventually crack at the stress points where the seat meets the legs; adding glass fibre to the polymer stiffens it substantially, which is what lets a 5.5kg chair carry an adult without feeling springy.",
          "The colour is moulded through the material rather than applied as a coating, so there is no paint layer to chip or flake.",
        ],
      },
      {
        heading: "UV and Weather Resistance",
        paragraphs: [
          "Designed for outdoor use with resistance to moisture, UV exposure and everyday wear.",
          "UV resistance is the specification that separates outdoor-grade plastic furniture from the cheap kind. Untreated polypropylene left in sun becomes chalky and brittle within a couple of summers — the surface fades and the material itself loses toughness. UV stabilisers in the polymer are what prevent that, and it is why this can live outside rather than needing storing between uses.",
        ],
      },
      {
        heading: "Dimensions and Dining Fit",
        paragraphs: [
          "50cm long, 55cm wide and 77cm high, weighing 5.5kg.",
          "77cm total height puts the seat at conventional dining height, so it pairs with a standard 73-75cm outdoor table.",
          "The 55cm width is the figure to use when working out how many fit round a table: allow around 60cm of table edge per person so chairs are not touching. On a 80cm square table that is one per side; on a 150cm rectangle, two along each long edge.",
        ],
      },
      {
        heading: "Weight and Handling",
        paragraphs: [
          "5.5kg is genuinely light for a dining chair — a child can carry one, and an adult can move four at once.",
          "That is the practical advantage of moulded outdoor furniture: setting up and clearing away a table of six is a minute's work rather than a chore, and the chairs can be stacked away or brought in ahead of a storm without difficulty.",
          "The trade-off is wind. A light chair on an exposed terrace or balcony will move in a strong gust, so they are best brought in or stacked against a wall through autumn and winter weather.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wash down with warm soapy water and a soft cloth or sponge — moulded polypropylene needs nothing more than that, no oiling and no annual treatment.",
          "Avoid abrasive pads and solvent-based cleaners, which scratch and dull the moulded surface permanently.",
        ],
      },
    ],
  },
  {
    id: "product-import-large-black-multi-shelf-unit",
    title: "Large Black Multi Shelf Unit | Kaiku",
    summary:
      "A 200cm shelving unit with seven asymmetrically arranged shelves in wood on a black metal frame. 100 x 40 x 200cm, 30.3kg. Assembly required; anti-tip safety strap supplied.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Seven wooden display shelves set at varying positions within a black metal framework, in an asymmetrical rather than evenly stacked arrangement.",
          "The asymmetry is functional as well as decorative: shelves at different heights take objects of different sizes, so tall books, a trailing plant and a row of ceramics all get appropriate space. An evenly divided unit forces everything into the same clearance.",
          "The open metal frame has no back panel, which is what makes it usable as a room divider — light and sightlines pass through it.",
        ],
      },
      {
        heading: "Use the Anti-Tip Strap",
        paragraphs: [
          "An anti-tip safety strap is supplied with the unit, and it should be fitted.",
          "This matters because of the proportions. At 200cm tall on a 40cm depth, the unit is five times taller than it is deep, and loading the upper shelves raises its centre of gravity further. Anything in that shape can be pulled over — most seriously by a child climbing it, which is the scenario the strap exists for.",
          "Fit the strap into a wall stud or into masonry rather than plasterboard alone. A strap anchored in a plasterboard plug will pull out under the load it is meant to resist, which defeats the purpose entirely.",
          "Load the heaviest items on the lowest shelves. It is the simplest thing you can do for stability and it costs nothing.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "100cm wide, 40cm deep and 200cm tall, weighing 30.3kg.",
          "200cm is close to ceiling height in many modern rooms, so check your ceiling before ordering — and check it where the unit will actually stand, since a sloping ceiling or a low soffit can catch it.",
          "The 40cm depth takes standard books and most decorative objects while keeping the footprint tight against a wall. As a room divider in an open-plan space, that shallow depth is what stops it eating the floor area.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Assembly is required, and at 30.3kg this is a two-person job — have help ready on the day.",
          "Build it lying flat on the floor and stand it up at the end, with two people. Standing a partly built 200cm frame is where things get bent. Leave the fixings finger-tight until every shelf and upright is located, then work around the frame tightening fully, which is what keeps it square.",
          "Fit the anti-tip strap as the last step, before loading anything onto it.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust the shelves and frame with a dry, soft cloth. Keep damp cloths off the timber shelves and away from the joints between wood and metal.",
          "Indoor use — this is not a garage or outbuilding unit.",
        ],
      },
    ],
  },
  {
    id: "product-import-large-circular-silver-wall-hanging-multi-shelf",
    title: "Large Circular Silver Wall Hanging Multi Shelf | Kaiku",
    summary:
      "A wall-mounted circular display shelf in silver-finish metal with multiple integrated shelves. 92 x 92 x 22cm, 6.22kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A circular metal frame in a silver finish with several shelves built across it, designed to hang on a wall rather than stand on the floor.",
          "The circle is what makes it a display piece rather than storage. Because the shelves are chords across a round frame, they vary in length — short at the top and bottom, longest across the middle — so the arrangement of objects is dictated by the shape. It is built for a considered display of a few things, not for holding a run of books.",
        ],
      },
      {
        heading: "Dimensions and Wall Space",
        paragraphs: [
          "92cm across and 22cm deep, weighing 6.22kg.",
          "92cm of diameter needs a genuine expanse of clear wall to read properly — it is close to a metre in both directions, and crowding it against a door frame or a corner spoils the circular form it depends on.",
          "The 22cm depth is what makes it usable in a hallway or on a landing: it projects less than a standing shelf unit would, so it does not narrow a walkway.",
        ],
      },
      {
        heading: "Mounting",
        paragraphs: [
          "At 6.22kg empty, the mounting has to carry both the unit and everything displayed on it — plants and ceramics add up quickly, so plan for well above the empty weight.",
          "Fix into a wall stud where possible, or into masonry with correctly sized plugs. In plasterboard, use proper heavy-duty cavity anchors rather than the plastic plugs supplied with most flat-pack goods.",
          "A circular unit shows any error in level immediately, far more than a rectangular one does — a rectangle hung slightly off is ambiguous, a circle with off-level shelves is obvious. Mark and check the fixing positions with a spirit level before drilling.",
        ],
      },
      {
        heading: "What to Display",
        paragraphs: [
          "Suited to ornaments, plants, candles, photographs, small books and decorative accessories, in living rooms, bedrooms, hallways, dining rooms and entrance spaces.",
          "Trailing plants work particularly well on a circular frame: growth spilling over the shelf edges softens the geometry of the circle, which otherwise reads as quite a hard shape on a bare wall.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth. A silver-finish metal is a plated or coated surface, so avoid abrasive cleaners, which cut through it to the base metal.",
          "Keep watering cans away from it, or lift plants down to water them — water running along a metal shelf will mark both the finish and the wall below.",
        ],
      },
    ],
  },
  {
    id: "product-import-saltaire-collection-3-shelf-unit",
    title: "Saltaire Collection 3-Shelf Unit | Kaiku",
    summary:
      "A wide three-tier open shelving unit in pine with a grey finish. 153 x 45 x 110cm, 32kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Solid pine in a grey finish, in a three-tier open design with no back or doors.",
          "Pine is a softwood, which has a practical consequence worth knowing: it takes knocks and dents more readily than oak or ash. In a grey-finished unit that is largely forgiving — a dent reads as wear on a painted surface rather than as damage — but it is not a unit for heavy workshop use.",
          "The grey finish keeps the grain visible while removing the orange cast that untreated pine develops as it ages, which is the usual objection to pine furniture.",
        ],
      },
      {
        heading: "Dimensions and Proportions",
        paragraphs: [
          "153cm wide, 45cm deep and 110cm tall, weighing 32kg.",
          "The proportions are the distinctive thing here: wide and low rather than tall and narrow. At 110cm it sits below eye level for most people standing, so the top becomes a usable surface as well as a shelf — for lamps, framed pictures or a run of plants.",
          "That low, wide shape also makes it inherently stable in a way a 200cm tower is not, and it works under a window where a tall unit could not go at all.",
          "45cm depth is deep — deeper than most bookcases — so it takes storage baskets, box files and larger ceramics rather than only books.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Living rooms and home offices, and anywhere the top surface earns its place: under a window, along a hallway wall, or against the back of a sofa in an open-plan room.",
          "Three shelves at 153cm wide is a substantial run of open display. Open shelving of this width looks best with some restraint — a mix of books, baskets and objects with deliberate gaps, rather than filled end to end.",
        ],
      },
      {
        heading: "Delivery and Handling",
        paragraphs: [
          "32kg, which makes this a two-person lift. Its 153cm width is the awkward dimension rather than the weight — measure hallway turns and stair landings before it arrives, checking the diagonal at the tightest point.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth, and use a barely damp cloth for marks, drying immediately afterwards.",
          "Use mats under plants and drinks. A finished softwood surface will mark from standing water faster than a hardwood, and on pine a water ring can raise the grain rather than just discolouring it.",
        ],
      },
    ],
  },
  {
    id: "product-import-sepia-shadows-squat-table-lamp-with-linen-shade",
    title: "Sepia Shadows Squat Table Lamp With Linen Shade | Kaiku",
    summary:
      "A squat table lamp with a brown metal base in a layered sepia and amber finish, under a natural linen shade. 35 x 35 x 56cm, 1.68kg. Takes an E27 bulb, not included. Partial assembly required.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A metal base finished in layered sepia and warm amber tones, with a natural linen shade.",
          "The finish is the point of this lamp. It is applied in layers to look timeworn rather than uniform, so the base has depth and variation across it instead of a single flat colour — closer to aged patina than to paint. Individual lamps will vary slightly as a result.",
          "Linen over a warm-toned base is a deliberate pairing: the shade takes on the amber cast when the lamp is lit, so the light itself reads warm rather than neutral.",
        ],
      },
      {
        heading: "Squat Proportions, and Why They Matter",
        paragraphs: [
          "35 x 35cm and 56cm tall, weighing 1.68kg.",
          "'Squat' describes the ratio: a wide 35cm shade on a low base, rather than the tall narrow form most table lamps take. The practical effect is a broad, low pool of light — good beside a bed, where a tall lamp puts the bulb at eye level when you are lying down.",
          "The 35cm width is the measurement to check. That is a wide footprint for a bedside table, and on a narrow nightstand the shade will overhang. On a console or a wider bedside table it is comfortable.",
        ],
      },
      {
        heading: "Bulb and Assembly",
        paragraphs: [
          "Takes an E27 screw bulb — the standard large screw cap. Not included, so order one with the lamp.",
          "Partial assembly is required: the shade and harp fit to the base rather than arriving mounted. It is a few minutes' work with nothing beyond hand-tightening.",
          "A warm-toned LED suits the sepia and amber finish. A cool white bulb fights it and turns the amber grey.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Bedside tables and console tables, in Mediterranean, bohemian, rustic and relaxed contemporary rooms.",
          "At 1.68kg it is light enough to move between rooms but has enough weight in the base to stay put when the switch is used, which a very light lamp does not.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust the base with a dry, soft cloth and avoid abrasive cleaners — a layered decorative finish will not survive scouring, and the variation cannot be restored once rubbed through.",
          "Brush the linen shade or use a vacuum brush attachment. Keep it dry: water marks natural linen and dries as a visible tideline.",
        ],
      },
    ],
  },
  {
    id: "product-import-shop-display-light-up-bookcase",
    title: "Light Up Bookcase | Kaiku",
    summary:
      "A tall bookcase with integrated shelf lighting. 90 x 38 x 220cm, 63kg. Assembly required.",
    sections: [
      {
        heading: "Integrated Shelf Lighting",
        paragraphs: [
          "Lighting is built into the unit and illuminates the shelves themselves, rather than the room.",
          "That distinction is what the bookcase is for. A lamp in a corner lights a room and leaves shelves in shadow; light coming from within the shelving picks out what is on it. The effect is closer to a gallery case or a shop display than to ordinary furniture, which is why it works for a collection you actually want looked at — ceramics, glass, spines of books, objects.",
          "It also means the bookcase needs to be near a socket, and the cable run planned before you decide where it stands.",
        ],
      },
      {
        heading: "Dimensions and Ceiling Height",
        paragraphs: [
          "90cm wide, 38cm deep and 220cm tall, weighing 63kg.",
          "220cm is the figure to check first, and check it before ordering. Standard modern ceilings are around 240cm, which leaves 20cm of clearance — enough, but not much. In a room with a lower ceiling, a sloping ceiling, or a soffit or coving where the unit will stand, 220cm may not go in at all.",
          "It also needs clearance to be stood up. Tilting a 220cm unit upright requires more than 220cm of diagonal room, so it has to be assembled and raised where there is space to swing it.",
          "38cm depth takes standard books comfortably along with larger display objects.",
        ],
      },
      {
        heading: "Weight, Assembly and Stability",
        paragraphs: [
          "63kg. This is the heaviest thing to plan for: it is firmly a two-person job for delivery, assembly and positioning, and it is not something to be moved once it is in place and loaded.",
          "Assembly is required. Build it flat on the floor and raise it with two people at the end.",
          "At 220cm tall on a 38cm depth, the unit is nearly six times taller than it is deep, so fix it to the wall. Anchor into a stud or into masonry, not into plasterboard alone, and load the heaviest items on the lowest shelves. A tall bookcase that is not secured is a tipping risk, particularly around children.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust regularly with a soft cloth and avoid harsh chemicals.",
          "Take particular care around the lighting elements and any wiring at the back of the shelves — dust them dry rather than with a damp cloth, and switch the unit off at the socket before cleaning around them.",
        ],
      },
    ],
  },
  {
    id: "product-import-slim-snowy-woodland-pre-lit-200-led-christmas-tree",
    title: "Slim Snowy Woodland Pre-Lit 200 Led Christmas Tree | Kaiku",
    summary:
      "A slim pre-lit artificial Christmas tree with a snow-tipped finish and 200 integrated LEDs. 210cm tall on a 91cm spread, weighing 6.2kg.",
    sections: [
      {
        heading: "Slim Profile, and What That Means for Space",
        paragraphs: [
          "210cm tall with a 91cm spread — a full-height tree on roughly two-thirds the floor area of a conventional one.",
          "That is the whole reason to choose a slim tree. A standard 210cm artificial tree spreads to about 130-140cm at the base, which in a normal living room means moving furniture. At 91cm this stands in a bay window, a hallway, a corner or an alcove without rearranging the room around it.",
          "The trade is fewer branch tips per height, so a slim tree looks best decorated with restraint — smaller ornaments and lighter garlands, rather than large baubles that close the gaps.",
        ],
      },
      {
        heading: "Pre-Lit with 200 LEDs",
        paragraphs: [
          "200 LEDs are already fitted through the branches, so there is no stringing to do — the single most tedious part of putting up a tree is already finished.",
          "Pre-lit also means the lights are distributed through the depth of the tree rather than wound round the outside, which is what gives a lit tree depth instead of a bright shell with a dark middle.",
          "The one thing to know about pre-lit trees is that the lights are integral: they are part of the tree rather than something you can swap for a different colour or style later.",
        ],
      },
      {
        heading: "The Snowy Finish",
        paragraphs: [
          "The branch tips carry a snow-tipped, woodland-style finish, so the tree reads frosted rather than plain green.",
          "A flocked or snow-tipped tree pairs naturally with warm white lights and simple decoration — the finish is already doing decorative work, and heavy tinsel or dense colour fights it.",
          "Snow-tipped finishes shed a little on first setup, particularly as the branches are fluffed out. Unpacking it on a sheet, or somewhere that vacuums easily, saves a job.",
        ],
      },
      {
        heading: "Setup and Storage",
        paragraphs: [
          "At 6.2kg it is easy for one person to carry and set up.",
          "Spend the time fluffing the branches out properly when it goes up — separating and spreading each tip is what makes an artificial tree look full rather than sparse, and on a slim tree it makes more difference than on a wide one.",
          "Store it in a cool, dry place. Damp storage is what ruins artificial trees between seasons: it marks the snow finish and is no good for the wiring.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe with a soft cloth. Avoid damp cloths on the snowy tips, which is applied finish rather than part of the branch and can be lifted off by rubbing when wet.",
        ],
      },
    ],
  },
  {
    id: "product-import-small-blue-flora-planter-pot",
    title: "Small Blue Flora Planter Pot | Kaiku",
    summary:
      "A small glazed ceramic planter with a blue and white botanical pattern, 16 x 16 x 14cm and 1kg. Plants are not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Glazed ceramic in a rounded form, decorated with an intricate blue and white botanical pattern.",
          "Blue and white ceramic is one of the most enduring decorative traditions there is, which is the practical argument for it: it does not date the way a fashionable colour does, and it sits with almost any scheme because the pattern reads as a classic rather than as a choice.",
          "The glaze is what makes it usable as a planter. It seals the ceramic, so the pot does not weep moisture through its walls onto a windowsill or shelf the way unglazed terracotta will.",
        ],
      },
      {
        heading: "Size and What Fits",
        paragraphs: [
          "16 x 16cm and 14cm tall, weighing 1kg.",
          "This is a small planter, sized for a plant currently in an 11-12cm nursery pot. Succulents, small foliage plants and trailing greenery suit it; anything larger will be root-bound quickly.",
          "The 16cm footprint is the useful figure — it fits a standard windowsill, a shelf, a desk, a bedside table or a bathroom surface, all places a larger planter will not go.",
        ],
      },
      {
        heading: "Plants Are Not Included",
        paragraphs: [
          "The plants and flowers in the product photography are not supplied — what you receive is the planter itself.",
        ],
      },
      {
        heading: "Planting and Watering",
        paragraphs: [
          "Because glazed ceramic does not breathe, water leaves the compost through the surface rather than through the pot walls, so it dries out more slowly than terracotta. Check the top of the compost with a finger before watering rather than watering to a schedule — overwatering is the usual way plants die in glazed pots.",
          "The simplest approach is to keep the plant in its plastic nursery pot and sit that inside this one: lift it out, water it over a sink, let it drain completely, then put it back. The roots never stand in water and the glaze stays clean of compost.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the glaze with a damp cloth. Avoid abrasive cleaners and scouring pads, which scratch a glazed surface and dull the pattern permanently.",
          "In a bathroom or kitchen the glaze will pick up a film of product or grease residue over time, and an occasional proper wash rather than a dry dust keeps the blue looking clear.",
        ],
      },
    ],
  },
];

function toBlocks(sections: Section[], key: string): unknown[] {
  const blocks: unknown[] = [];
  let index = 0;
  const b = (text: string, style: string) => {
    const id = `${key}-${index++}`;
    return {
      _type: "block",
      _key: id,
      style,
      markDefs: [],
      children: [{ _type: "span", _key: `${id}s`, text, marks: [] }],
    };
  };
  for (const section of sections) {
    blocks.push(b(section.heading, "h2"));
    for (const paragraph of section.paragraphs)
      blocks.push(b(paragraph, "normal"));
  }
  return blocks;
}

function keyFor(id: string): string {
  return id.replace(/[^a-z0-9]+/g, "-").slice(0, 40);
}

async function main() {
  const results: {
    id: string;
    found: boolean;
    sections: number;
    words: number;
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const written of REWRITES) {
    const doc = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{_id}`,
      { id: written.id },
    );
    const words = written.sections.reduce(
      (sum, s) =>
        sum + s.paragraphs.reduce((n, p) => n + p.split(/\s+/).length, 0),
      0,
    );
    results.push({
      id: written.id,
      found: !!doc,
      sections: written.sections.length,
      words,
    });
    if (!doc) continue;
    if (apply) {
      transaction.patch(written.id, (p) =>
        p.set({
          description: toBlocks(written.sections, keyFor(written.id)),
          summary: written.summary,
        }),
      );
      queued += 1;
    }
  }

  console.table(results);
  const totalWords = results.reduce((n, r) => n + r.words, 0);
  const missing = results.filter((r) => !r.found);
  console.log(
    `\n${results.length} products, ${totalWords} words (avg ${Math.round(totalWords / results.length)} each).`,
  );
  if (missing.length)
    console.log(
      "NOT FOUND:",
      missing.map((m) => m.id),
    );

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-rewrite-thin-descriptions-batch4.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
