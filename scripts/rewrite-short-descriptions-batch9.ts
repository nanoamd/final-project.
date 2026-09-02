/**
 * Batch 9 — the last 13 short published descriptions, clearing the 65 to 0.
 *
 * The wall clocks in this group have the thinnest source data in the whole
 * catalogue: several FAQs answer "what is it made from" with "high-quality
 * materials". Rather than invent a material, the copy is built from what is
 * actually known and verifiable — diameter, depth, weight — and those numbers
 * carry real buying implications on a wall clock, because diameter is what
 * decides whether it reads across a room.
 *
 * Four of them also carry FAQ answers that claim the dimensions or materials
 * are unavailable while the document itself stores them. That is a separate
 * defect and is fixed in scripts/fix-faqs-claiming-no-data.ts, not here.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch9.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch9.ts --apply
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

const SHAGREEN = [
  "Shagreen is stingray leather, with a surface of fine raised pebbles or beads — a signature material of Art Deco furniture in the 1920s and 30s, valued for that texture and for how well it took a pale dye.",
  "This is faux shagreen: the pebbled grain reproduced without the animal product, and considerably more durable and easier to maintain. The texture is the point of the piece, catching light across the raised grain and shifting as you move past it.",
];

const SHAGREEN_CARE = [
  "Dust with a dry, soft brush rather than a cloth. A brush reaches between the raised beads; a cloth passes over the top of them.",
  "Keep liquid off the finish and wipe spills immediately. A pebbled texture holds moisture and cleaning residue in the grain, where it dries as visible marks — which shows far more on ivory than on a dark finish.",
];

/** Shared across the five wall clocks. Hanging height and readability are the
 * two questions a clock actually raises, and neither was addressed anywhere. */
const CLOCK_HANGING = [
  "Hang a wall clock higher than you would hang art. Around 2m from the floor, or roughly 30cm above a mantelpiece or console, is the convention — a clock is read at a glance from across the room, not studied at eye level.",
  "Use a fixing suited to your wall. Into masonry a plugged screw is straightforward; in plasterboard, use a proper cavity fixing rather than a bare nail, which will pull through under a hanging load over time.",
  "Avoid hanging a clock in direct sunlight or above a radiator. Heat and UV are what fade a dial and, over years, affect the movement.",
];

export const REWRITES: Written[] = [
  {
    id: "product-import-hampton-ivory-chest-of-drawers",
    title: "Hampton Ivory Shagreen Chest of Drawers | Kaiku",
    summary:
      "A three-drawer chest in ivory faux shagreen with metal runners and walnut-style drawer interiors. 90 x 45 x 85cm, 50kg (56kg boxed). Handles attach after delivery.",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: SHAGREEN,
      },
      {
        heading: "Three Drawers, Properly Made",
        paragraphs: [
          "All three drawers run on quality metal runners, with walnut-style interiors.",
          "Metal runners are the part of a chest that decides whether it is still pleasant to use in ten years. A drawer loaded with folded clothing is heavy, and one running on bare timber gets stiff and starts to rack; a metal runner carries that weight and keeps moving smoothly.",
          "The walnut-style lining is more than a flourish — a finished interior protects clothing from a raw board surface, and it means the drawer looks considered when open rather than only when shut.",
        ],
      },
      {
        heading: "Dimensions and Delivery Weight",
        paragraphs: [
          "90cm wide, 45cm deep and 85cm tall, weighing 50kg — 56kg boxed, in a carton of 99 x 57 x 98cm.",
          "50kg makes this a two-person delivery and a two-person move, and not something to reposition once it is filled with clothing.",
          "Measure the route in before it arrives. A 99cm carton through a hallway turn or a stair landing is the usual constraint rather than the weight, and it is worth checking the diagonal at the tightest point — a large box will often turn through an opening it cannot pass square.",
          "85cm tall puts the top at a usable height for a lamp, a tray or framed pictures.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "The main unit arrives assembled. Only the handles need attaching after delivery, which keeps them protected in transit.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: SHAGREEN_CARE,
      },
    ],
  },
  {
    id: "product-import-hampton-ivory-round-bedside-table",
    title: "Hampton Ivory Round Bedside Table | Kaiku",
    summary:
      "A round bedside table in ivory faux shagreen with one drawer on metal runners and a walnut-style interior. 45 x 45 x 60cm, 18kg.",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: SHAGREEN,
      },
      {
        heading: "Why Round Beside a Bed",
        paragraphs: [
          "A round bedside table has a practical advantage that is easy to overlook: no corners at hip height.",
          "A bedside table is one of the few pieces of furniture people walk past in the dark, half asleep, and a square corner at 60cm is exactly where a hip or a shin catches. A round top removes that entirely.",
          "It also reads as softer against a rectangular bed and headboard, which is what stops a bedroom of straight lines feeling boxy.",
        ],
      },
      {
        heading: "The Drawer",
        paragraphs: [
          "One drawer on high-quality metal runners, with a walnut-style interior — smooth and quiet in use, which matters more on a bedside table than anywhere else in the house.",
          "Concealed storage is the point: a bedside table with chargers, glasses and medication on display is what makes an otherwise tidy bedroom look cluttered.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "45cm across and 60cm tall, weighing 18kg. Boxed it measures 56 x 53 x 58cm.",
          "60cm is close to standard mattress height, so the top sits roughly level with the bed — the height that makes it comfortable to reach across rather than down into.",
          "18kg is substantial for a bedside table and reflects a solid carcass rather than a light frame. Worth positioning before loading.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: SHAGREEN_CARE,
      },
    ],
  },
  {
    id: "hill-decor-21647",
    title: "Williston Grey Square Wall Clock | Kaiku",
    summary:
      "A large square wall clock in grey with a high-contrast dial. 60 x 60cm, 5cm deep, weighing 3.64kg.",
    sections: [
      {
        heading: "Design and Readability",
        paragraphs: [
          "A square face in a grey finish with a high-contrast dial.",
          "Contrast is what actually makes a clock readable, more than size does. Dark hands and numerals on a pale ground separate cleanly at a distance, where a low-contrast dial — grey on grey, brass on cream — becomes guesswork from across a room however large it is.",
          "The square format is the less usual choice and it has a specific advantage: it lines up with the edges of the furniture, doorways and pictures around it, where a circle sits as an independent shape on the wall.",
        ],
      },
      {
        heading: "Size and Where It Reads From",
        paragraphs: [
          "60 x 60cm and only 5cm deep, weighing 3.64kg.",
          "60cm is a genuinely large clock — a statement piece rather than a functional one. At that size the dial is legible from right across an open-plan room or the length of a hallway, which is the reason to choose it over something smaller.",
          "It needs a proportionate expanse of wall. A 60cm square on a narrow strip between two doors will look crowded; above a mantelpiece, a sideboard or on a large clear wall it reads as intended.",
          "5cm of depth keeps it close to the wall so it does not project into a walkway.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: CLOCK_HANGING,
      },
      {
        heading: "Where It Works and Care",
        paragraphs: [
          "Living rooms, kitchens and hallways.",
          "Dust regularly with a soft cloth and avoid harsh cleaning agents. Spray nothing onto the clock — liquid runs down behind the glazing and into the movement, which is the usual way a wall clock stops working.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21615",
    title: "Roco Wall Clock | Kaiku",
    summary: "A round wall clock, 45cm across and 5cm deep, weighing 0.92kg.",
    sections: [
      {
        heading: "Size and Proportion",
        paragraphs: [
          "45cm across, 5cm deep, weighing 0.92kg.",
          "45cm is the most useful size a wall clock comes in — large enough to read easily from across a normal room, small enough to sit on a wall without needing a large clear expanse to itself. It is the size that works in the most places.",
          "5cm of depth keeps it close to the wall and out of the way in a hallway.",
        ],
      },
      {
        heading: "Very Light, Which Widens Where It Can Go",
        paragraphs: [
          "At 0.92kg this is a light clock, and that has a practical consequence worth knowing: it does not need a heavy-duty wall fixing.",
          "A single well-chosen fixing carries it comfortably — including a proper plasterboard anchor, which means it can go on a stud wall anywhere rather than only where a stud happens to fall. A heavier clock restricts your choice of position considerably.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: CLOCK_HANGING,
      },
      {
        heading: "Where It Works and Care",
        paragraphs: [
          "Living rooms, bedrooms and hallways — the 45cm diameter suits all three without dominating any of them.",
          "Wipe clean with a soft, dry cloth and avoid harsh chemicals. Do not spray cleaner onto the clock: liquid runs down behind the glazing and into the movement.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21625",
    title: "Rothay Large Wall Clock | Kaiku",
    summary:
      "A large round wall clock, 80cm across and 5cm deep, weighing 3.08kg.",
    sections: [
      {
        heading: "80cm — A Statement Rather Than a Timepiece",
        paragraphs: [
          "80cm across, 5cm deep, weighing 3.08kg.",
          "80cm is very large for a wall clock — closer in scale to a piece of artwork than to a functional dial. That changes how it should be used: it is the feature on a wall rather than a practical addition to one, and it should be given the clear space a large picture would get.",
          "The practical benefit is that it is legible from a genuine distance — the length of an open-plan kitchen-diner, or a double-height hallway — where a 45cm clock becomes a squint.",
          "It also means proportion matters. On a narrow chimney breast or between two windows an 80cm circle will feel crowded; it wants a wall of its own.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: [
          "At 3.08kg and 80cm across, use a fixing rated well above the weight and check it is properly seated — a large clock exerts more leverage on a single fixing than its weight alone suggests.",
          ...CLOCK_HANGING,
        ],
      },
      {
        heading: "Where It Works and Care",
        paragraphs: [
          "Living rooms, kitchens, dining rooms and hallways with the wall space to carry it.",
          "It can go in a kitchen, but think about where. Persistent humidity and cooking grease are not kind to any wall clock, so away from directly above a hob or a kettle is the sensible position.",
          "Dust regularly with a soft cloth and avoid harsh cleaning products. Never spray liquid onto it — it runs behind the glazing and into the movement.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511739",
    title:
      "Hanah Black Snake Leather Effect Table Lamp with Chrome Base | Kaiku",
    summary:
      "A table lamp with a black snake-leather-effect body on a chrome base, under a linen shade. 38 x 38 x 78cm, 4.2kg. Takes an E27 bulb up to 60W, not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Leather with a black snake-skin effect over an iron structure, on a chrome base, with a linen shade.",
          "The snake effect is an embossed pattern in the leather rather than a print, so it has genuine relief — the scales catch light along their edges and hold shadow between them, which is what makes the texture read from across a room rather than only up close.",
          "Chrome under black is a deliberately high-contrast pairing: a bright reflective base beneath a dark textured body, so the lamp does not read as one solid dark mass.",
        ],
      },
      {
        heading: "Bulb and Wattage",
        paragraphs: [
          "Takes an E27 bulb — the standard large screw cap — rated to a maximum of 60W. Not included, so order one with the lamp.",
          "60W is a generous ceiling in LED terms: an 8-10W LED already matches a traditional 60W bulb, so there is plenty of headroom while running cool under a fabric shade.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "38 x 38cm and 78cm tall, weighing 4.2kg.",
          "78cm is a tall table lamp, and the 38cm shade is wide, so this belongs where both are an asset — a console table, a sideboard, or an entrance hall, where the height gives it presence against a wall.",
          "On a standard bedside table the shade would take up most of the surface and sit above eye level when you are lying down. Measure before choosing it for a bedroom.",
          "4.2kg on a chrome base gives it real stability, which a lamp of this height needs.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Modern, exotic and contemporary schemes — the textured leather and chrome combination is deliberately bold rather than neutral, so it works as a focal point rather than a background piece.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft cloth and avoid abrasive cleaners.",
          "The embossed leather is the part to be careful with: keep it dry, since water can mark and stiffen leather, and use a soft brush rather than a cloth to lift dust out of the embossing.",
          "Chrome shows fingermarks and water spots readily, so a dry cloth suits the base better than a damp one.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21627",
    title: "Rothay Wall Clock | Kaiku",
    summary:
      "A round battery-operated wall clock, 49cm across and 4cm deep, weighing 1.21kg. Indoor use.",
    sections: [
      {
        heading: "Size and Proportion",
        paragraphs: [
          "49cm across, 4cm deep, weighing 1.21kg — the standard-size Rothay, alongside the 80cm large version.",
          "Just under 50cm is the most widely usable size for a wall clock: clearly readable across a normal room, without needing a large clear wall to itself the way an 80cm dial does.",
          "At only 4cm deep it sits close to the wall, so it works in a hallway or a landing without projecting into the space.",
        ],
      },
      {
        heading: "Battery Operated",
        paragraphs: [
          "The clock runs on battery power, so there is no wiring and no positioning constrained by a socket — it goes wherever the wall suits it.",
          "A quartz movement of this kind typically runs a year or more on a single cell. Worth using a good alkaline battery rather than the cheapest available: a leaking cell in a wall clock damages the movement, which is not economic to repair.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: [
          "At 1.21kg it is light enough that a single well-chosen fixing carries it, including a proper plasterboard anchor — so it is not restricted to positions where a stud falls.",
          ...CLOCK_HANGING,
        ],
      },
      {
        heading: "Indoor Use and Care",
        paragraphs: [
          "Designed for indoor use. A wall clock is not weather-sealed, and outdoors both damp and temperature swing get into the movement.",
          "Dust regularly, and use a slightly damp cloth on stubborn marks. Avoid harsh chemicals, and never spray liquid onto the clock — it runs down behind the glazing.",
        ],
      },
    ],
  },
  {
    id: "product-aw-ssm-06",
    title: "Soft Squiggly Mirror – Flower – Stone | Kaiku",
    summary:
      "A small handcrafted flower-shaped mirror in a stone tone, made from reclaimed materials. 25.4 x 25.4 x 2.3cm, 0.49kg. Each piece is unique.",
    sections: [
      {
        heading: "Handcrafted from Reclaimed Materials",
        paragraphs: [
          "Handcrafted from reclaimed materials, which means no two are identical — the tone, the finish and the exact set of the petals vary from piece to piece.",
          "That is worth understanding as the character of the object rather than a tolerance. What arrives will not match the photograph precisely, and if you order two they will not match each other. A moulded factory mirror gives uniformity; this does not, and is not trying to.",
        ],
      },
      {
        heading: "The Flower Shape",
        paragraphs: [
          "A soft, squiggly flower outline in a stone tone rather than a conventional circle or rectangle.",
          "At this size the shape is the whole product. A 25cm mirror is not for checking your appearance — it is a wall object that happens to reflect, and the irregular petal outline is what makes it read as a piece of decoration.",
          "The stone tone keeps it quiet: a neutral finish means the shape carries the interest rather than the colour, so it sits in most schemes without competing.",
        ],
      },
      {
        heading: "Size, Weight and Hanging",
        paragraphs: [
          "25.4 x 25.4cm and 2.3cm deep, weighing 0.49kg.",
          "Under half a kilo is very light, so hanging is straightforward — a single small fixing is enough, including in plasterboard, which means it can go anywhere on a wall.",
          "Small mirrors work hardest in groups. One 25cm mirror on a large bare wall reads as lost; three or five arranged together, or mixed into a gallery wall with artwork and photographs, becomes a feature. The irregular outline is what makes them work as a cluster — repeated organic shapes read as deliberate.",
        ],
      },
      {
        heading: "Where It Works and Care",
        paragraphs: [
          "Living rooms, bedrooms and hallways.",
          "Clean with a soft cloth and a gentle, non-abrasive cleaner. Spray the cloth rather than the mirror, and keep liquid away from the edges — on a handcrafted piece made from reclaimed materials, the join between glass and frame is where moisture does damage.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21629",
    title: "Ashmount Large Wall Clock | Kaiku",
    summary:
      "A large round wall clock in metal, 80cm across and 5cm deep, weighing 3.08kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Metal construction, in a large round format with a correspondingly large face.",
          "Metal is the right material at this diameter, and not only for looks. An 80cm dial in a lighter material needs bracing to stay flat and true, where metal holds its shape across the span on its own — which is what keeps the hands running true to the dial over years.",
        ],
      },
      {
        heading: "80cm — Readability and Proportion",
        paragraphs: [
          "80cm across, 5cm deep, weighing 3.08kg.",
          "The large face is the reason to buy it: legible from right across an open-plan room or the length of a hallway, where a 45cm clock becomes a squint.",
          "At that scale it functions as the feature on a wall rather than an addition to one, and it needs the clear space a large picture would get. On a narrow chimney breast or between two windows it will feel crowded.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: [
          "At 3.08kg and 80cm across, use a fixing rated well above the bare weight — a large clock exerts more leverage on a single point than its weight alone suggests.",
          ...CLOCK_HANGING,
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the face gently with a soft, damp cloth and avoid abrasive cleaners, which will scratch both the glazing and a metal finish.",
          "Never spray cleaner onto the clock. Liquid runs down behind the glazing and into the movement, which is the usual way a wall clock stops working.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21617",
    title: "Louie Wall Clock | Kaiku",
    summary: "A round wall clock, 59cm across and 6cm deep, weighing 2.16kg.",
    sections: [
      {
        heading: "Size and Proportion",
        paragraphs: [
          "59cm across, 6cm deep, weighing 2.16kg.",
          "59cm sits between the everyday 45cm clock and the 80cm statement pieces, and it is arguably the most useful of the three. It is large enough to read at a glance from across an open-plan room, but not so large that it demands a wall of its own.",
          "The 6cm depth is slightly deeper than most in this group, which gives the dial a little more presence — the face sits proud of the wall and casts a shadow line around itself rather than lying flat against it.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: [
          "At 2.16kg use a proper fixing rather than a bare nail — in masonry a plugged screw, in plasterboard a cavity anchor rated above the weight.",
          ...CLOCK_HANGING,
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe regularly with a soft, dry cloth to keep dust off the face and out of the mechanism.",
          "Avoid harsh chemicals, and never spray liquid onto the clock — it runs behind the glazing and into the movement.",
        ],
      },
    ],
  },
  {
    id: "product-aw-csalt-03",
    title: "Himalayan Salt Cooking Plate - Round - 20x20x5cm | Kaiku",
    summary:
      "A round cooking and serving plate cut from genuine Himalayan salt, in natural pink and rose tones. 20 x 20 x 5cm, 3.7kg.",
    sections: [
      {
        heading: "What It Is",
        paragraphs: [
          "A solid round plate cut from genuine Himalayan salt, 20cm across and 5cm thick, weighing 3.7kg. The pink and rose colouring is the mineral content of the salt itself, not a finish, and it varies naturally from piece to piece.",
          "Because it is cut from a single block rather than moulded, every plate carries its own pattern of veining and translucency.",
        ],
      },
      {
        heading: "How a Salt Plate Is Used",
        paragraphs: [
          "A salt block does two things at once: it cooks or chills food, and it seasons it while doing so. Food in contact with the surface takes up a light, even salinity — far subtler than salt added afterwards, because it comes from the whole contact surface rather than from crystals sitting on top.",
          "The salt gives up less as the block ages and the surface seasons, so the effect is strongest when it is new.",
          "It can also be used cold as a serving plate, which is where a 20cm round is at its most practical — for charcuterie, cheese, sushi or chocolates, chilled beforehand so it keeps them cool at the table.",
          "The 5cm thickness is what makes it usable for heat at all: mass is what lets a salt block hold temperature evenly instead of cracking under a thermal gradient.",
        ],
      },
      {
        heading: "Bringing It Up to Temperature",
        paragraphs: [
          "The one rule that determines whether a salt block lasts is gradual heating. Salt is a crystalline mineral and it does not tolerate thermal shock — putting a cold block onto a high heat is what splits them.",
          "Bring it up in stages over a reasonable time rather than all at once, and let it cool naturally and completely afterwards. Never plunge a hot block into water.",
        ],
      },
      {
        heading: "Care — Keep It Away From Water",
        paragraphs: [
          "This is the important instruction, and it is the opposite of how you would treat a normal plate: do not wash it. Salt dissolves in water, so a salt plate put under a running tap or into a dishwasher is being destroyed.",
          "Clean it with a barely damp cloth, scraping off residue first, and use no soap. Dry it thoroughly afterwards.",
          "Store it in a cool, dry place. Salt is hygroscopic — it draws moisture out of the air — so a humid cupboard or a spot beside a kettle will make the surface weep and soften over time.",
          "Treated properly a plate lasts for years, and it will slowly reduce in size as it is used. That is the material being consumed as intended, not a fault.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21637",
    title: "Butchers Cuts Pork Wall Plaque | Kaiku",
    summary:
      "A wall plaque diagramming the butcher's cuts of pork. 58 x 45cm, 3cm deep, weighing 1.41kg. Indoor use.",
    sections: [
      {
        heading: "What It Is",
        paragraphs: [
          "A wall plaque set out as a butcher's diagram, mapping the cuts of pork across the outline of the animal.",
          "It belongs to a genuine tradition of functional signage — the charts that hung in butchers' shops so customers and apprentices could see where a cut came from. That is why it works as kitchen decoration in a way a purely decorative print does not: it is a piece of reference material, and it carries information.",
          "It is also a conversation piece with an answer in it. Most people know the names of cuts without knowing where on the animal they sit.",
        ],
      },
      {
        heading: "Size and Proportion",
        paragraphs: [
          "58cm wide, 45cm high and 3cm deep, weighing 1.41kg.",
          "Landscape rather than portrait, following the shape of the diagram, so it wants a wide run of wall — above a worktop, a run of units, a dresser or a kitchen table.",
          "At 58cm it is large enough for the cut names to be legible from a step or two back, which is the point of a reference chart. Smaller and it becomes purely decorative.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: [
          "At 1.41kg a single proper fixing carries it — in plasterboard use a cavity anchor rather than a bare nail, which pulls through over time.",
          "In a kitchen, position matters more than usual: away from directly above a hob or kettle, since grease and steam mark any wall piece and are difficult to clean off a printed surface.",
          "Around eye level suits a plaque you are meant to read, unlike a clock, which goes higher.",
        ],
      },
      {
        heading: "Indoor Use and Care",
        paragraphs: [
          "Designed for indoor use.",
          "Wipe gently with a soft cloth and avoid harsh chemicals. Spray nothing onto it — liquid runs into the edges of a plaque and lifts the surface, which cannot be reversed.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5527329",
    title: "Tamzin Blue Velvet Curved Back Dining Chair | Kaiku",
    summary:
      "A dining chair with a curved back in blue velvet, on an iron frame with a plywood and foam seat. 50 x 55 x 80cm, rated to 150kg. Arrives fully assembled.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Blue polyester velvet over foam on a plywood seat base, with an iron frame, and a curved back.",
          "The curve is the functional part of the design. A flat dining-chair back meets your spine at one point; a curved back follows it and spreads the contact across the width, which is the difference between a chair you can sit at for a twenty-minute meal and one that works for a long dinner.",
          "Velvet on a dining chair is a considered choice rather than an obvious one — it is a short dense pile, so it feels soft and shows light beautifully, and the trade is that it needs more care around food than a flat woven fabric.",
        ],
      },
      {
        heading: "Dimensions and Weight Capacity",
        paragraphs: [
          "50cm wide, 55cm deep and 80cm tall, rated to a maximum capacity of 150kg.",
          "150kg is a generous, genuinely reassuring rating for a dining chair, and it is worth stating because most listings do not.",
          "The 50cm width is what determines how many fit round your table: allow around 60cm of table edge per person so chairs are not touching. On a 150cm rectangular table that is two along each long side.",
          "80cm total height with a curved back gives real back support, unlike a low-backed dining chair.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "Arrives fully assembled in one carton measuring 63 x 81 x 51cm — no building, no instructions needed.",
          "Because it comes built, the carton is close to the finished size, so check it will pass through your doorways rather than assuming a flat pack.",
        ],
      },
      {
        heading: "Velvet Care",
        paragraphs: [
          "Wipe with a soft cloth and avoid abrasive cleaners.",
          "Vacuum the velvet regularly with a soft brush attachment. Dust and crumbs settle down into the pile of a dining chair more than any other seat in the house, and grit in the pile is what wears it flat.",
          "Blot spills immediately and never rub. Rubbing velvet crushes the pile, and a flattened patch catches light differently from the rest — so it stays visible even after the mark itself has gone. Brushing the pile back in one direction lifts it again.",
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
    "docs/change-log/2026-09-02-rewrite-short-descriptions-batch9.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
