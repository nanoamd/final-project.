/**
 * Batch 3 of the thin-description rewrite: 14 products across console tables,
 * seating, lighting, garden furniture and bathroom accessories.
 *
 * Two supplier leaks fixed in passing. The Aegina and Marching Hares lamps
 * both carried a literal "(hill-interiors.com)" citation in their customer-
 * facing summary — the supplier's own domain, printed on the product page.
 * Both summaries are rewritten here.
 *
 * The recurring useful fact in this batch is delivery access. Several of
 * these are large and heavy — the Troyes sofa at 81kg in a 185cm carton, the
 * Babel console at 54kg — and the carton dimensions were sitting in the FAQs
 * where nobody shopping would find them. A 185 x 95 x 56cm box is a genuine
 * question about your hallway and stairs, and it belongs in the description.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-thin-descriptions-batch3.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-thin-descriptions-batch3.ts --apply
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
    id: "premier-housewares-5528976",
    title: "Obra Cream Mother of Pearl Console Table | Kaiku",
    summary:
      "A console table with a mother of pearl top on a black iron frame with an MDF core. 140 x 35 x 75cm, 15kg. Arrives fully assembled. Indoor use only.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A mother of pearl surface over an MDF core, on a black iron frame, finished with lacquer.",
          "Mother of pearl is the iridescent inner layer of shell, cut and laid as an inlay. It is a natural material, so the play of colour shifts with the angle you view it from and with the light in the room — the same table looks cream and flat under a downlight and iridescent in raking daylight from a window. No two tops carry identical figuring.",
          "The lacquer is the working surface. It is what protects the shell underneath, and it is the layer that determines how the table should be cleaned.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "140cm wide, 35cm deep and 75cm tall, weighing 15kg.",
          "35cm is genuinely shallow, which is the point of a console: it gives a 140cm run of surface while projecting barely a third of a metre into the room. In a hallway that is the difference between a table you can walk past and one you turn sideways for.",
          "75cm is standard table height, so it also works behind a sofa — where it closes the back of a seating group in an open-plan room — or under a wall mirror as a dressing point.",
        ],
      },
      {
        heading: "Delivery and Access",
        paragraphs: [
          "Arrives fully assembled in a single carton measuring 142 x 37 x 77cm and weighing 15kg.",
          "Because it comes built rather than flat-packed, the carton is the finished size. Check that a 142cm box will make it through your front door and around any turn in a hallway or stairwell before it arrives — that is the constraint on an assembled console, not the weight, which is modest.",
        ],
      },
      {
        heading: "Care and Placement Out of Sunlight",
        paragraphs: [
          "Clean with a soft, damp cloth. Avoid abrasive cleaners entirely: the lacquer is a thin protective layer, and once it is scratched through, the shell beneath is exposed.",
          "Keep it out of direct sunlight. This is the manufacturer's specific instruction and it is worth following — prolonged UV yellows lacquer and can dull the iridescence of the shell underneath. A hallway or an interior wall suits it better than a sunny bay window.",
          "Indoor use only.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5529002",
    title: "Java Natural Rattan Round Back Accent Chair | Kaiku",
    summary:
      "An accent chair with a round rattan back on an iron frame, roughly 60% rattan and 40% iron. 76 x 63 x 93cm, 7.5kg. Assembly required, ships in two cartons. Indoor use only.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A rounded rattan back on a slim iron frame — around 60% rattan to 40% iron by composition.",
          "The pairing is doing real work. Rattan woven into a curved back has natural give, so it flexes slightly against your back rather than presenting a hard surface, while the iron frame supplies the rigidity that rattan alone would lack. It is also why the chair weighs only 7.5kg.",
        ],
      },
      {
        heading: "Dimensions and Where It Fits",
        paragraphs: [
          "76cm wide, 63cm deep and 93cm tall, weighing 7.5kg.",
          "This is an accent chair, so its job is a corner, a bedroom, a landing or the spare seat beside a sofa — not the main seat you spend an evening in. At 63cm deep it is upright rather than lounging, which is what makes it usable at a desk or dressing table too.",
          "7.5kg is light enough to move one-handed, which matters more than it sounds for an occasional chair that gets pulled into a room when guests arrive.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Requires assembly and ships in two cartons measuring 76 x 60 x 56cm.",
          "Locate every fixing before tightening any of them fully, then work around the frame. On a four-legged chair this is what prevents a rock developing — tightening one leg fully first pulls the frame out of square.",
        ],
      },
      {
        heading: "Indoor Use and Care",
        paragraphs: [
          "Indoor use only. Natural rattan is not an outdoor material in a British climate: it absorbs moisture, and repeated wetting and drying makes the weave slacken and eventually split. Conservatories and porches count as outdoors in this respect if they get damp.",
          "Clean with a dry, soft cloth. Rattan holds dust in the weave, so a soft brush or a vacuum brush attachment works better than a cloth alone. Keep water off it — a damp cloth is enough to raise the fibres over time.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5529746",
    title: "Troyes Cream Three Seat Right Chaise Sofa | Kaiku",
    summary:
      "A three-seat sofa with a right-hand chaise, in cotton and linen over a plywood and larchwood frame with foam filling. 285 x 171 x 80cm, 81kg. Arrives assembled in two cartons.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Cotton and linen upholstery over a frame of plywood, larchwood and iron, with foam filling.",
          "A timber frame with a plywood component is the conventional construction for a sofa of this size, and the reason is structural: solid timber carries the load at the joints while plywood resists twisting across the wide, unsupported span a chaise creates.",
          "Cotton and linen is a natural-fibre blend. It breathes and it feels cooler to sit on than a synthetic weave, and in exchange it creases more readily and is less forgiving of spills — worth knowing before choosing it in cream.",
        ],
      },
      {
        heading: "Right-Hand Chaise — Which Way It Faces",
        paragraphs: [
          "This is the right-hand chaise version, which is the single most important thing to get right before ordering.",
          "The convention is that the side is named as you look at the sofa from the front, standing in the room: on a right chaise, the long section is on your right. Sitting on it, the chaise is under your right hand.",
          "A chaise sofa cannot be reversed after purchase, so check it against the wall you intend it for. Put the chaise on the open side of the room rather than against a doorway or walkway, since the extended section is what people have to walk around.",
        ],
      },
      {
        heading: "Dimensions and Room Fit",
        paragraphs: [
          "285cm wide, 171cm deep across the chaise and 80cm high, weighing 81kg.",
          "285cm is a large sofa — close to three metres of wall. The 171cm depth is the figure people underestimate: that is the chaise projecting into the room, and you still need walking space beyond it, so realistically the sofa occupies a footprint of about 2.9m by 2.2m once circulation is allowed for.",
          "At 80cm high the back is low enough to sit under a window without blocking it, and low enough to work as a room divider in an open-plan space without walling off the view.",
        ],
      },
      {
        heading: "Delivery and Access",
        paragraphs: [
          "Arrives fully assembled in two cartons measuring 185 x 95 x 56cm, at a combined 81kg.",
          "This is the part to plan before ordering. An assembled sofa in a 185 x 95cm carton has to physically pass through every door, hallway and stair turn between the street and the room. Measure the narrowest point on the route — usually a hallway turn or a stairwell landing, not the front door itself — and check the diagonal, since a large box can often be turned through an opening it will not pass square.",
          "81kg across two cartons is a two-person delivery at minimum, and it is worth having the route clear before it arrives.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft cloth and use no abrasive cleaners.",
          "Cream natural fibre rewards dealing with spills immediately: blot rather than rub, working inward from the edge of the mark so it does not spread outward into a ring. Rubbing drives liquid into the weave and lifts the fibre.",
          "Rotate and plump the cushions regularly. A chaise section takes uneven use — people sit in the same spot — and turning the cushions evens out the compression that would otherwise become permanent on one seat.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5530012",
    title: "Babel Travertine and Mango Wood Curved Console Table | Kaiku",
    summary:
      "A curved console table with a travertine top on a mango wood base. 120 x 40 x 76cm, 54kg. Assembly required, ships in two cartons.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A travertine top on a solid mango wood base, in a curved, sculptural form.",
          "Travertine is a natural limestone formed in mineral springs, and its defining feature is the pitting — small natural voids running through the stone. Those are characteristic of the material rather than flaws, and they mean every top has different figuring. It is a softer, warmer stone than marble, both in colour and literally in hardness.",
          "Mango wood is a dense hardwood with pronounced grain and considerable natural colour variation between boards. Paired with stone it carries the weight comfortably.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "120cm wide, 40cm deep and 76cm tall, weighing 54kg.",
          "40cm depth keeps it usable in a hallway while giving a proper surface. The curved form means it reads as a piece of furniture in its own right rather than a shelf on legs, so it suits a position where it is seen from the side — the turn of a hallway, or an entryway wall — rather than pushed flat into an alcove.",
          "54kg is substantial for a console. Once it is placed it stays placed, and on a timber floor it is worth checking the feet sit flat before loading the top.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Requires assembly and ships in two cartons measuring 127 x 47 x 19cm, at 54kg combined.",
          "The flat 19cm carton depth is helpful — it will pass through doorways and up stairs far more easily than an assembled console of this weight would. Assemble it in the room where it will stand, since a built 120cm stone-topped table at 54kg is a two-person carry and awkward through a doorway.",
          "Fit the base fully and check it sits level before the travertine top goes on. A stone top on a frame that is out of true puts uneven load on the stone.",
        ],
      },
      {
        heading: "Caring for Travertine",
        paragraphs: [
          "Travertine is porous and reactive, and it needs treating differently from a sealed or laminate surface.",
          "Wipe spills promptly, especially anything acidic — wine, citrus, coffee, and household cleaners containing vinegar or lemon. Acid etches limestone, leaving a dull mark in the polish that cannot be wiped away because the surface itself has been altered.",
          "Use a pH-neutral cleaner or plain water on a soft cloth, and use coasters and mats under drinks and plants. A plant pot left standing on untreated travertine will leave a ring.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5535032",
    title: "Allegra Brown Glass Bathroom Jar | Kaiku",
    summary:
      "A lidded bathroom storage jar in brown glass with a stainless steel lid, 9 x 9 x 13cm with a 300ml capacity. Arrives assembled.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Brown glass with a stainless steel lid — around 90% glass to 10% steel.",
          "Tinted glass is the practical choice for a bathroom jar. It shows the level of what is inside without displaying the contents in detail, so a jar of cotton pads or bath salts reads as a deliberate object on the shelf rather than as storage.",
          "Stainless steel is used for the lid for the obvious reason: it is the component handled with wet hands in a humid room, and it will not corrode there the way a plated finish eventually would.",
        ],
      },
      {
        heading: "Size and Capacity",
        paragraphs: [
          "9 x 9cm and 13cm tall, holding 300ml.",
          "300ml is a small, deliberate capacity — right for cotton wool pads, cotton buds, bath salts or soaps, and sized to sit on a basin surround or a narrow shelf without dominating it.",
          "The square 9cm footprint is worth noting against a narrow windowsill or the edge of a basin, where a round jar of the same volume would need more room.",
        ],
      },
      {
        heading: "What It Is For",
        paragraphs: [
          "This is bathroom storage — cotton pads, buds, salts, small soaps. It is not sold as food-safe, so keep it to bathroom use rather than the kitchen or pantry.",
          "Arrives assembled with nothing to fit.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wash in warm soapy water and dry thoroughly, particularly around the lid, where water sitting in the rim of any bathroom container is what eventually leaves marks.",
          "Glass in a bathroom benefits from an occasional proper wash rather than just a wipe — soap and product residue builds up as a film on tinted glass and dulls it.",
        ],
      },
    ],
  },
  {
    id: "product-aw-waterf-19",
    title:
      "Tabletop Water Feature - 19x19x28cm - Buddha, Lotus Flower Cascading Pots | Kaiku",
    summary:
      "A tabletop water feature with a Buddha figure and cascading lotus-flower pots, 19 x 19 x 28cm and 1.27kg. Includes a pump; suitable for indoor or outdoor use.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A seated Buddha figure with lotus-flower pots arranged so water cascades from one to the next, handcrafted from sustainable materials with a reclaimed character in the finish.",
          "Because the pieces are handcrafted rather than moulded to a single mould, the finish and detailing vary between them — the texture and tone are part of the design rather than a uniform factory surface.",
        ],
      },
      {
        heading: "Setting It Up",
        paragraphs: [
          "Setup is genuinely simple: fill it with water, make sure the pump is fully submerged, and plug it in.",
          "The submerged pump is the one thing that matters. Running a water-feature pump dry, even briefly, is what kills them — so check the water level before switching it on, and top it up regularly. A small feature like this loses water to evaporation faster than people expect, particularly in a warm room or outdoors in summer.",
          "The flow rate adjusts at the pump, so the cascade can be set from a trickle to a fuller fall depending on how much sound you want from it.",
        ],
      },
      {
        heading: "Size and Placement",
        paragraphs: [
          "19 x 19cm and 28cm tall, weighing 1.27kg. Small enough for a side table, a desk, a shelf or a garden table.",
          "It needs to be near a socket and it needs to stand level — a cascading feature that is even slightly off-level will run water down one side and out of the basin. On furniture, put something waterproof underneath: splashing is the normal behaviour of a water feature, not a fault.",
        ],
      },
      {
        heading: "Indoor and Outdoor Use",
        paragraphs: [
          "Suitable for both indoor and outdoor use.",
          "Outdoors, bring it in before the first frost and empty it. Water expands as it freezes, and a full basin left out over winter is the most common way a small water feature cracks. The pump should be stored dry indoors over winter too.",
        ],
      },
      {
        heading: "Care and Maintenance",
        paragraphs: [
          "Clean the pump regularly and check it for blockages. A pump this size draws through a small intake, and it clogs with dust indoors and with debris and algae outdoors — a blocked intake is the usual reason a feature stops flowing properly.",
          "Using filtered or distilled water rather than hard tap water slows limescale build-up in the pump and on the surfaces the water runs over, which is the other thing that shortens the life of a small feature.",
        ],
      },
    ],
  },
  {
    id: "product-import-13-6m-44ft-6in-plug-in-led-warm-white-christmas-string-light",
    title: "13.6m Warm White Decorative LED String Lights | Kaiku",
    summary:
      "A 13.6m plug-in LED string with 500 warm white light points on silver-toned wire, weighing 0.43kg. LEDs included.",
    sections: [
      {
        heading: "What You Get",
        paragraphs: [
          "A single 13.6-metre strand carrying 500 individual warm white LEDs on silver-toned wire, weighing 0.43kg. It plugs into a mains socket — no batteries to change.",
          "500 points across 13.6 metres works out at roughly one light every 2.7cm, which is a dense strand rather than a sparse one. That density is what makes it read as a continuous line of light rather than a row of separate dots.",
        ],
      },
      {
        heading: "Warm White, and Why It Matters",
        paragraphs: [
          "Warm white rather than cool or bright white. On a decorative strand this is the difference between light that reads as candlelight and light that reads as a shop display.",
          "It also matters for mixing: warm white sits naturally alongside the light from ordinary lamps in a living room, whereas a cool white strand in the same room looks conspicuously blue by comparison.",
        ],
      },
      {
        heading: "Where to Use It",
        paragraphs: [
          "13.6 metres is a lot of length, and it suits being run along something rather than draped on one object — shelving, a mantelpiece, the frame of a mirror or headboard, a bannister, or through greenery and foliage.",
          "The silver wire is designed to disappear against most surfaces, which is what allows the light points to read as floating rather than as a visible cable.",
          "Nothing about warm white LEDs on a silver wire is specifically seasonal, so this does not need putting away in January — it works as permanent ambient lighting on a bookcase or behind a bed just as well as on a tree.",
        ],
      },
      {
        heading: "Running and Positioning",
        paragraphs: [
          "Plan the run from the socket outward, since the plug end fixes where the strand has to start. Work out the route before fixing anything: 13.6 metres sounds ample and disappears quickly once it is being woven through a shelf unit.",
          "Leave the strand loose rather than pulling it taut around corners. Tension on the wire at a fixing point is what eventually breaks the connection at a light.",
        ],
      },
    ],
  },
  {
    id: "product-import-2-75m-9ft-plug-in-led-8-sequence-warm-white-cluster-string",
    title: "2.75m Plug-In LED 8 Sequence Warm White Cluster String | Kaiku",
    summary:
      "A 2.75m plug-in LED cluster string with 432 warm white LEDs on flexible silver wire and eight lighting sequences, weighing 0.24kg. Indoor use only.",
    sections: [
      {
        heading: "What a Cluster String Is",
        paragraphs: [
          "432 warm white LEDs packed into 2.75 metres of flexible silver wire. That is the defining difference from an ordinary string light, and it is worth understanding before buying.",
          "A standard strand spaces its lights evenly along the wire. A cluster string bunches them densely on a wire that doubles back on itself, so the same length produces a concentrated mass of light rather than a thin line. 432 lights in under three metres is roughly one every 6mm.",
          "The practical result is that this fills a small area with light — a mantelpiece, a vase, a wreath, a shelf display — where a conventional strand would need far more length to achieve the same effect.",
        ],
      },
      {
        heading: "Eight Sequences",
        paragraphs: [
          "Eight lighting sequences, which typically run from steady-on through various fades, waves and twinkles.",
          "In practice most people use the steady setting day to day and the sequences occasionally. Worth knowing that a steady warm white setting exists, since a cluster string with no static option is difficult to live with in a room you sit in.",
        ],
      },
      {
        heading: "Size and Placement",
        paragraphs: [
          "2.75 metres of strand, weighing 0.24kg — light enough to be supported by whatever it is draped over without additional fixings.",
          "The flexible silver wire holds a shape once bent, which is what makes a cluster string useful inside a glass vase or wound through a garland: it can be arranged and it stays arranged.",
        ],
      },
      {
        heading: "Indoor Use Only",
        paragraphs: [
          "This string is rated for indoor use only, unlike some decorative lighting. It is not weather-sealed, so it should not be used on a porch, in a garden, or anywhere exposed to rain or persistent damp.",
          "LEDs are included and built in — there is nothing to buy separately and no bulbs to replace.",
        ],
      },
    ],
  },
  {
    id: "product-import-adjustable-tractor-seat",
    title: "Adjustable Tractor Seat | Kaiku",
    summary:
      "A height-adjustable tractor-style stool in gloss black metal, with a dished pressed-and-pierced pan seat, twisted-bar footrest and four scrolled cast spokes. 37 x 37 x 86cm, 15.6kg.",
    sections: [
      {
        heading: "Design and Construction",
        paragraphs: [
          "Metal throughout in a gloss black finish, built to the traditional tractor-seat pattern.",
          "The seat is a pressed and pierced tractor pan, dished rather than flat. That dish is the whole point of the form: it is shaped to the body and holds you centrally, which is why the design has survived from farm machinery into stools and bar seating. The piercing lightens it and, on the original, let water and debris through.",
          "The footrest is twisted bar with turned ball ends, and the base is four scrolled cast spokes with curled feet — cast detailing rather than bent tube, which is what gives the base its visual weight.",
        ],
      },
      {
        heading: "Dimensions and Adjustment",
        paragraphs: [
          "37 x 37cm footprint, 86cm tall and adjustable, weighing 15.6kg.",
          "The height adjustment is what makes it flexible. At the upper end of its range it works as bar or counter seating; wound down it suits a workbench or a desk. Set it so your forearms rest level on the surface you are working at, and use the footrest — on a stool this height your feet will not reach the floor, and the footrest is what stops that becoming uncomfortable.",
          "A 37cm footprint is compact, and it is the reason a stool like this tucks under a counter where a chair could not.",
        ],
      },
      {
        heading: "Weight and Stability",
        paragraphs: [
          "15.6kg for a stool is heavy, and deliberately so. The mass is concentrated in the cast base, which is what keeps a tall, narrow seat stable — a light stool of this height would tip.",
          "It is portable in the sense that one person can move it, but it is not something to be carrying up and down stairs casually.",
          "Use it on a flat surface. On uneven ground the four curled feet will find three points of contact and rock, so check it sits solid before putting weight on it.",
        ],
      },
      {
        heading: "Indoor and Outdoor Use",
        paragraphs: [
          "Suitable for use outdoors as well as in — workshops, garages, gardens, kitchens and bars.",
          "Left outside permanently, the finish is what needs watching: gloss paint on metal will eventually chip, and any chip left exposed is where rust starts. Touching in a chip when it happens is a two-minute job that saves the finish.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a damp cloth and mild soap for everyday cleaning. Avoid abrasives, which will dull a gloss finish and leave a matte patch that cannot be blended back in.",
          "Dry it after cleaning if it lives outdoors, particularly around the adjustment mechanism, where standing water is what eventually makes a thread stiff.",
        ],
      },
    ],
  },
  {
    id: "product-import-aegina-table-lamp",
    title: "Aegina Table Lamp | Kaiku",
    summary:
      "A table lamp with a carved wooden base in a weathered neutral finish and a linen shade. 13 x 13 x 40cm, 0.9kg. Takes an E14 bulb, not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A carved wooden base in a weathered neutral finish, under a linen shade.",
          "The weathered finish is doing something specific: it keeps the grain and the carved detail visible rather than burying them under paint, so the base reads as timber rather than as a painted shape. Natural variation in the wood means the tone differs between individual lamps.",
          "Linen diffuses light rather than directing it, giving a soft spread across a room instead of a hard pool — and it takes on a warm cast when lit, which suits the neutral base.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "Takes an E14 screw bulb — the small screw cap, not the larger E27. Bulbs are not included, so order one alongside the lamp.",
          "A warm-toned LED suits this lamp: it keeps the linen shade reading warm rather than grey, and it runs cool inside a fabric shade.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "13 x 13cm and 40cm tall, weighing 0.9kg.",
          "40cm is classic bedside-lamp height — tall enough to put light where you need it for reading in bed, short enough not to loom over a nightstand. The 13cm footprint leaves room on a small bedside table for everything else that lives there.",
          "At 0.9kg it is easy to move between rooms, and light enough that it wants a stable surface rather than the edge of a shelf.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Bedside tables, consoles, living rooms and home offices. The neutral finish is the useful part — it sits with contemporary, minimalist and natural schemes without committing the room to a strong colour.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust the wooden base with a dry cloth. Keep water off both the timber and the linen shade — a damp cloth marks natural linen and leaves a tideline as it dries.",
          "For the shade, a soft brush or a vacuum brush attachment lifts dust better than a cloth and without pressing it into the weave.",
        ],
      },
    ],
  },
  {
    id: "product-import-alto-putty-grey-table",
    title: "Alto Putty Grey Outdoor Table | Kaiku",
    summary:
      "A square outdoor dining table in putty grey plastic, with an 80 x 80cm top at 73cm high, weighing 10.8kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Moulded plastic in a putty grey finish, with a clean-lined square top.",
          "Plastic is often treated as the compromise choice in garden furniture, but for a table left outdoors it has real advantages: it does not rot, rust, splinter or need oiling, and the colour runs through the material rather than sitting on it as a coating that can chip.",
          "Putty grey is a more forgiving outdoor colour than white, which shows every splash of rain-borne dirt, or dark grey, which shows dust and pollen.",
        ],
      },
      {
        heading: "Dimensions and Seating",
        paragraphs: [
          "An 80 x 80cm square top at 73cm high, weighing 10.8kg.",
          "73cm is standard dining height, so ordinary dining chairs work with it. 80cm square seats four at a push and two very comfortably — the usual allowance is 60cm of table edge per person, and 80cm gives one place setting per side.",
          "The square footprint is the reason it suits small spaces. A square table tucks into a corner or against a wall in a way a round table of equivalent capacity cannot, which makes it practical on a balcony or a narrow terrace.",
        ],
      },
      {
        heading: "Weight, Wind and Placement",
        paragraphs: [
          "10.8kg is light — easy for one person to carry out for the afternoon and put away after, which is the main benefit.",
          "It is also the thing to be aware of in wind. A light table with a solid 80cm top catches gusts, so on an exposed balcony or terrace it should not be left standing unweighted through autumn and winter storms. Stored on its side against a wall or brought under cover, it is no trouble.",
        ],
      },
      {
        heading: "Outdoor Use and Care",
        paragraphs: [
          "Built to live outdoors — no annual oiling, no rust, no seasonal treatment.",
          "Wash it down with warm soapy water and a soft cloth or sponge. Avoid abrasive pads and solvent-based cleaners, which scratch and dull a moulded plastic surface permanently.",
          "Over a long period, UV gradually chalks and fades any plastic left in full sun. Storing it under cover through winter, or simply keeping it out of the harshest all-day sun, noticeably extends how long the finish stays even.",
        ],
      },
    ],
  },
  {
    id: "product-import-antia-stem-table-lamp-with-linen-shade",
    title: "Antia Stem Table Lamp With Linen Shade | Kaiku",
    summary:
      "A slim table lamp with a wooden stem and a natural linen shade. 9 x 9 x 29cm, 0.35kg. Takes an E14 bulb, not included. Indoor use only.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A slim wooden stem under a natural linen shade, in clean contemporary lines with no ornament.",
          "The proportions are the design: a narrow stem and a modestly sized shade, so the lamp occupies very little visual space. That restraint is what lets it sit in a Scandinavian, minimalist or industrial room without competing with anything.",
          "Linen gives a soft, diffused light rather than a directed pool, and warms noticeably when lit.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "Takes an E14 screw bulb — the small screw cap. Not included, so order one with the lamp.",
          "A low-wattage warm LED is the right match here. The shade is small, so a high-output bulb would be uncomfortably bright at close range on a bedside table, and an LED keeps heat out of a small fabric shade.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "9 x 9cm and 29cm tall, weighing 0.35kg.",
          "This is a genuinely small lamp. At 29cm it is shorter than a standard bedside lamp, which makes it useful in the places a normal lamp does not fit: a narrow bedside shelf, a desk corner, a console in a hallway, or a bookshelf.",
          "At 0.35kg it is very light — which is worth knowing, because a lamp this light can be pulled over by its own cable if the flex is under tension. Let the cable fall slack rather than running it tight to a socket.",
        ],
      },
      {
        heading: "Indoor Use and Care",
        paragraphs: [
          "Indoor use only.",
          "Dust the wooden stem with a dry cloth. Keep the linen shade dry — brush it or use a vacuum brush attachment rather than wiping, since water marks natural linen and dries as a visible line.",
        ],
      },
    ],
  },
  {
    id: "product-import-antique-gold-marching-hares-lamp-with-green-velvet-shade",
    title: "Antique Gold Marching Hares Lamp With Green Velvet Shade | Kaiku",
    summary:
      "A table lamp with a sculpted marching-hares base in resin with an antique gold finish, under a green velvet shade. 28 x 28 x 48cm, 1.1kg. Takes an E27 bulb, not included. Indoor use only.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A sculpted base of marching hares, cast in resin and finished in antique gold, under a green velvet shade.",
          "Resin is the material that makes a base like this possible. Cast resin picks up fine sculptural detail — the set of the ears, the line of a leg mid-stride — that would be prohibitively expensive in cast metal, and it keeps the whole lamp at 1.1kg rather than something you need both hands for.",
          "An antique gold finish rather than bright gold means the recesses are darker than the raised surfaces, which is what makes sculpted detail legible. A uniform bright finish would flatten the figures out.",
        ],
      },
      {
        heading: "The Velvet Shade",
        paragraphs: [
          "Green velvet is doing something different from a linen or cotton shade. Velvet has a dense pile, so it blocks far more light through the sides than a loose-weave fabric does — meaning most of the light is directed up and down rather than glowing through the shade.",
          "The practical effect is a lamp that reads as a pool of light above and below with a deep, saturated colour in between, rather than a lantern. It is an accent lamp by nature rather than a room light.",
          "Deep green against antique gold is a deliberately traditional pairing, and it is what places this lamp in cottagecore, traditional and eclectic schemes rather than minimal ones.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "Takes an E27 screw bulb — the standard large screw cap. Not included.",
          "Because a velvet shade absorbs so much light, a slightly higher output bulb works better here than it would under linen. A warm colour temperature suits the gold finish; a cool white bulb turns antique gold grey.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "28 x 28cm and 48cm tall, weighing 1.1kg.",
          "The 28cm shade diameter is the measurement to check — it is wider than many bedside tables allow for once a book and a glass are on there. It suits a console, a sideboard, a hallway table or a living-room side table better than a narrow nightstand.",
          "The base has a front: the hares read as a procession from one side. Position it so that side faces into the room.",
        ],
      },
      {
        heading: "Indoor Use and Care",
        paragraphs: [
          "Indoor use only.",
          "Dust the resin base with a dry, soft cloth, working into the detail where dust settles — a soft brush reaches the recesses a cloth cannot.",
          "Never use a damp cloth on velvet. Water marks pile permanently and leaves a flattened patch. Brush the shade with a soft brush, always in one direction with the pile.",
        ],
      },
    ],
  },
  {
    id: "product-import-augusta-column-table-lamp-with-linen-shade",
    title: "Augusta Column Table Lamp With Linen Shade | Kaiku",
    summary:
      "A table lamp with a column-turned wooden base and a linen shade, included. 12 x 12 x 31cm, 0.51kg. Takes an E14 bulb, not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wooden base turned to a column profile, under a linen shade.",
          "The column form is borrowed from classical architecture, and the detail that makes it work is the stepped profile — a defined base, a shaft, and a capital where the shade meets it. That articulation is what gives a small lamp architectural presence rather than looking like a plain turned post.",
          "The linen shade is included with the lamp.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "Takes an E14 screw bulb — the small screw cap, not the larger E27. Not included, so order one with the lamp.",
          "A warm LED suits both the timber and the linen, and keeps heat down inside a small shade.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "12 x 12cm and 31cm tall, weighing 0.51kg.",
          "31cm is compact — shorter than a standard bedside lamp, which makes it useful on a hallway console, an entryway shelf, a desk or a bookcase where a full-height lamp would be too much.",
          "The 12cm footprint means it takes up very little of a small surface, and at 0.51kg it moves easily between rooms.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Living rooms, bedrooms, hallways and entryways. The classical detailing gives it a foot in traditional and rustic schemes, while the plain linen shade and neutral timber keep it workable in a contemporary or neutral room.",
          "A pair either side of a hallway console or a bed reads better than one on its own with a lamp of this size and shape — column forms are symmetrical by nature and look deliberate in pairs.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust the turned base with a dry cloth, paying attention to the steps in the profile where dust collects.",
          "Keep the linen shade dry. Brush it or use a vacuum brush attachment rather than a damp cloth, which marks natural linen permanently.",
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
    "docs/change-log/2026-09-02-rewrite-thin-descriptions-batch3.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
