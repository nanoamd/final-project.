/**
 * Batch 2 of the thin-description rewrite: 13 lighting products, all of which
 * had exactly one section ("Bulb Requirements") and nothing else.
 *
 * The lighting category had the most concentrated version of the problem —
 * eleven Premier Housewares fittings whose entire description was two
 * sentences about a bulb cap. Everything else the shopper needs was sitting
 * unused in `specs` and `faqs`: weights, assembly state, adjustable drops,
 * indoor-only ratings, real cleaning instructions.
 *
 * The section that earns its place most here is ceiling fixing. Three of these
 * are genuinely heavy — Babylon at 43.3kg, Alexis at 23.4kg, Salasco at
 * 16.3kg — and a standard plasterboard ceiling rose is not rated for that.
 * Nothing on the page said so. For a store positioning itself as the most
 * helpful, that is the single most useful paragraph on the page.
 *
 * Two data problems found while writing, deliberately NOT papered over in
 * copy — see the note in docs/master-brief.md:
 *
 *   - Abira floor lamp: `Maximum Wattage` reads "1 W per bulb" for a 190cm
 *     five-bulb floor lamp, which is almost certainly a feed error. Rather
 *     than print a figure that would mislead someone buying bulbs, the copy
 *     states the count and cap type it is confident of and omits the wattage.
 *   - Mano Gold Table Lamp: dimensions read "H71 x D18 x W70" — a 70cm-wide
 *     table lamp against an 18cm depth. The copy leads on the height, which
 *     is corroborated by the `dimensions` object, and does not assert a width
 *     the data cannot support.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-thin-descriptions-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-thin-descriptions-batch2.ts --apply
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

/** Reused wording for the bulb-not-supplied fact — stated plainly, never
 * softened away. A shopper who buys a fitting expecting a working lamp and
 * receives an empty socket has been failed by the description. */
const BULB_NOTE =
  "Bulbs are not included, so order them with the fitting if you want it working the day it arrives.";

export const REWRITES: Written[] = [
  {
    id: "premier-housewares-5511327",
    title: "Mano Gold Table Lamp | Kaiku",
    summary:
      "A table lamp in steel, iron and brass with a gold finish and black detailing, 71cm tall. Takes one E27 bulb up to 25W, not included. Arrives assembled.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Steel, iron and brass in a gold finish, with black detailing picking out the joints and base. Brass and gold-finish metal warm the light passing over them, so the lamp reads warmer than the same shape would in chrome or nickel.",
        ],
      },
      {
        heading: "Bulb and Wattage",
        paragraphs: [
          "Takes one E27 bulb — the standard large screw fitting — rated to a maximum of 25W. " +
            BULB_NOTE,
          "25W is a low ceiling by incandescent standards but generous in LED terms: a 25W LED is brighter than most rooms need from a single table lamp, and an 8-10W LED already matches a traditional 60W bulb. Check the cap is E27 and the wattage is at or under 25W and any bulb will do.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "71cm tall. That is a tall table lamp — well above the 40-50cm of a typical bedside lamp — so it suits a console, sideboard or desk more comfortably than a low bedside table, where the shade would sit above eye level when you are lying down.",
          "Beside a reading chair, a lamp of this height puts the light source over the shoulder rather than in the eyeline, which is where you want it.",
        ],
      },
      {
        heading: "Assembly and Setup",
        paragraphs: [
          "Arrives assembled. Unpack it, fit a bulb and plug it in — there is nothing to build.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft cloth and avoid abrasive cleaners. A gold finish is a plated surface rather than solid metal, and scouring will cut through the plating to the base metal underneath, which cannot be polished back.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511328",
    title: "Mano Gold Floor Lamp | Kaiku",
    summary:
      "A floor lamp in iron, steel, wire and brass with a gold and black finish. 78 x 23 x 130cm, 10kg. Takes one bulb up to 25W, not included. Arrives assembled.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Iron and steel structure with brass and wire detailing, finished in gold with black accents. The floor-standing sibling of the Mano table lamp, so the two can be run together in one room without clashing.",
        ],
      },
      {
        heading: "Bulb and Wattage",
        paragraphs: [
          "Takes a single bulb rated to a maximum of 25W, in the TYPE-B E7 cap the manufacturer specifies. " +
            BULB_NOTE,
          "In LED terms 25W is ample for a floor lamp: a 10W LED gives roughly the output of a traditional 60W bulb, so there is headroom well past normal use while running cool.",
        ],
      },
      {
        heading: "Dimensions and Footprint",
        paragraphs: [
          "78cm wide, 23cm deep and 130cm tall, weighing 10kg.",
          "The 23cm depth is what makes it usable in a real room — it sits close to a wall or tight beside a sofa arm without projecting into the walkway. At 130cm it is shorter than a typical uplighter, putting the light at seated head height rather than throwing it at the ceiling, which suits a reading corner more than general room lighting.",
          "10kg is enough weight to be stable against a knock, but run the cable along the skirting rather than across open floor.",
        ],
      },
      {
        heading: "Assembly and Setup",
        paragraphs: [
          "Arrives assembled and ready to plug in once a bulb is fitted.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft cloth. Keep abrasive cleaners away from the gold finish — it is plating, and scouring removes it permanently.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511346",
    title: "Chloe Crystal Glass Table Lamp | Kaiku",
    summary:
      "A table lamp with a fluted crystal glass base and a natural fabric shade. 41 x 27 x 66cm. Takes one E27 bulb up to 60W, not included. Assembly required. Indoor use only.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A fluted crystal glass base under a natural fabric shade. The fluting is the functional part of the design as well as the decorative one: ridged glass refracts the light passing through it, so the base itself glows and throws pattern rather than sitting as a dark silhouette below the shade.",
          "A fabric shade diffuses rather than directs, giving soft light across the whole room instead of a hard pool beneath it.",
        ],
      },
      {
        heading: "Bulb and Wattage",
        paragraphs: [
          "Takes one E27 bulb — the standard large screw cap — up to 60W. " +
            BULB_NOTE,
          "With a glass base and a fabric shade, an LED is the sensible choice: it runs cool, which matters more here than on a metal lamp, since heat is trapped between shade and glass.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "41 x 27cm and 66cm tall overall.",
          "66cm is a substantial table lamp — tall enough to work on a console or sideboard, and a good fit beside a bed on a taller nightstand where a short lamp would leave the light below the headboard.",
        ],
      },
      {
        heading: "Assembly and Use",
        paragraphs: [
          "Assembly is required — the shade fits to the base rather than arriving mounted.",
          "Indoor use only. A fabric shade and an unsealed fitting are not rated for bathroom humidity, which needs an IP-rated fitting.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the glass base with a damp cloth. Keep water off the fabric shade — dust it with a dry brush or a vacuum brush attachment instead, as damp cloths mark natural fabric and leave tidelines that do not come out.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511423",
    title: "Salasco 2 Tier Nickel Finish Glass Chandelier | Kaiku",
    summary:
      "A two-tier chandelier in iron and ribbed glass with a nickel finish. 55 x 55 x 127cm, 16.3kg, with an adjustable drop. Takes nine E14 bulbs up to 40W each, not included. Assembly required.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "An iron frame in a nickel finish carrying ribbed glass shades across two tiers. Nickel is a cooler, softer grey than chrome — less mirror-bright, so it sits more quietly in a room than polished chrome does.",
          "The ribbing on the glass breaks the light from each bulb into vertical bands rather than letting it pass straight through, which is what stops nine exposed bulbs reading as glare.",
        ],
      },
      {
        heading: "Bulbs and Electrical Load",
        paragraphs: [
          "Takes nine E14 bulbs — the small screw cap, not the larger E27 — rated to a maximum of 40W each. " +
            BULB_NOTE,
          "Nine at 40W is a 360W maximum. A set of nine 6W LEDs draws about 54W in total while giving roughly the light of nine 40W incandescents, so LEDs sit far inside the limit and keep heat away from the glass. Buy all nine at once and from the same batch: mixed colour temperatures across a two-tier fitting are very visible.",
          "This is a mains-wired ceiling fitting. Have it connected by a qualified electrician with the circuit isolated at the consumer unit.",
        ],
      },
      {
        heading: "Dimensions, Drop and Ceiling Height",
        paragraphs: [
          "55cm across and 127cm tall at full extension, and the drop is adjustable — so hanging height is set to the room rather than fixed.",
          "That adjustment is what makes it workable at normal ceiling heights. Shortened, it suits a standard dining room; at full drop it is built for a stairwell or double-height space. Over a dining table, leave 75-85cm between the tabletop and the lowest point so it stays out of the sightline across the table.",
        ],
      },
      {
        heading: "Weight and Ceiling Fixing",
        paragraphs: [
          "16.3kg, which is the number that decides the installation. A standard plasterboard ceiling rose is not a structural fixing — this needs to be mounted into a joist, or into a noggin fitted between joists, with fixings rated for the load.",
          "Worth establishing before the electrician arrives: knowing where the joists run relative to where you want it hanging is what determines whether the job takes an hour or turns into a ceiling repair.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Requires assembly — the glass and arms fit to the frame rather than arriving built. Assemble on a soft surface and fit the glass last.",
          "Clean with a soft, dry cloth. Isolate the circuit and let bulbs cool first, and keep damp cloths and sprays off the nickel finish, which water-spots.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511473",
    title: "Murdoch Floor Lamp in Brushed Brass and Marble Base | Kaiku",
    summary:
      "A floor lamp with a dome shade on a brushed brass stem and a marble base. 40 x 40 x 150cm. Takes one E27 bulb up to 60W, not included. Arrives assembled. Indoor use only.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A brushed brass stem rising from a marble base, under a dome shade — roughly 55% marble, 40% iron and 5% plastic by composition.",
          "The marble is doing structural work, not decorative work. A 150cm lamp with an offset dome needs mass at the bottom to stay upright, and stone provides it in a smaller footprint than metal would.",
          "Brushed brass rather than polished: it diffuses reflections instead of mirroring the room, and it does not show fingermarks the way a polished finish does.",
        ],
      },
      {
        heading: "Bulb and Wattage",
        paragraphs: [
          "Takes one E27 bulb up to 60W. " + BULB_NOTE,
          "A dome shade throws light downward in a defined pool rather than spreading it across the room, so this is a reading and task lamp by design. A warmer colour temperature around 2700K suits that job; daylight-white bulbs make a focused pool feel clinical.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "150cm tall on a 40cm base.",
          "At 150cm the shade sits above the head of someone seated, which is exactly right for reading over the shoulder. Position it behind and slightly to the side of a chair rather than in front, so the shade never sits in your eyeline.",
          "The 40cm base is the measurement to check against your floor space — it needs clear floor, and it is not something to tuck behind a chair leg.",
        ],
      },
      {
        heading: "Assembly and Use",
        paragraphs: [
          "Arrives fully assembled — unpack, fit a bulb, plug in.",
          "Rated for indoor use only.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft cloth and avoid abrasive cleaners.",
          "Marble is porous and stains from below the surface, so wipe spills off the base promptly rather than leaving them to dry — and keep acidic cleaners away from it entirely, as they etch stone and leave dull marks that will not polish out.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511482",
    title: "Alexis Nickel Finish 8 Bulb Round Statement Pendant Light | Kaiku",
    summary:
      "A round eight-bulb pendant in iron and glass with a nickel finish. 110 x 110 x 115cm, 23.4kg. Takes eight E27 bulbs up to 40W each, not included. Assembly required.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "An iron frame in a nickel finish, carrying eight glass-shaded bulbs in a round geometric arrangement. Nickel reads as a softer, warmer grey than chrome, which keeps a fitting this size from dominating a room purely by brightness of finish.",
        ],
      },
      {
        heading: "Bulbs and Electrical Load",
        paragraphs: [
          "Takes eight E27 bulbs — the standard large screw cap — up to 40W each. " +
            BULB_NOTE,
          "Eight at 40W is a 320W maximum. Eight 8W LEDs draw about 64W in total and give roughly the output of eight 60W incandescents, so LEDs sit comfortably inside the limit. With eight bulbs exposed in glass, buy the whole set together: a single mismatched colour temperature is obvious across a fitting like this.",
          "A mains-wired ceiling fitting — connect it through a qualified electrician with the circuit isolated first.",
        ],
      },
      {
        heading: "Dimensions and the Space It Needs",
        paragraphs: [
          "110cm across and 115cm tall. That is a genuinely large fitting: over a metre wide.",
          "Over a dining table, a pendant should be narrower than the table so nobody catches it standing up — so 110cm wants a table of at least 140-150cm. Leave 75-85cm between tabletop and the bottom of the fitting.",
          "In an open room rather than over a table, it needs the ceiling height to carry 115cm of drop without hanging into head height.",
        ],
      },
      {
        heading: "Weight and Ceiling Fixing",
        paragraphs: [
          "23.4kg. This is the part to plan before ordering: a standard plasterboard ceiling rose will not hold it.",
          "It must be fixed into a joist, or into timber noggins fitted between joists, using fixings rated well above the load. If the intended position falls between joists, that noggin has to go in before the fitting can be hung — which usually means access from above or a small section of ceiling opened and made good.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Requires assembly on arrival. Build it on a soft surface, fit the glass last, and have a second person take the weight at the ceiling — 23.4kg overhead is not a one-person job.",
          "Dust with a dry cloth. Isolate the circuit and let the bulbs cool first.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511600",
    title: "Trieste Large Rectangular Pendant Light | Kaiku",
    summary:
      "A large rectangular pendant in aluminium and iron with an electroplated chrome finish. 74 x 61 x 97cm and only 3.6kg. Integrated LED, bulb included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Aluminium and iron with an electroplated chrome finish and PVC detailing — roughly 70% aluminium, 15% iron and 15% PVC.",
          "The aluminium content is why this fitting weighs 3.6kg at nearly a metre across. Aluminium is about a third the density of steel, which is what lets a pendant this size stay genuinely light.",
        ],
      },
      {
        heading: "The Bulb Is Included",
        paragraphs: [
          "Unusually for a fitting at this size, the LED is supplied — an integrated LED SMD unit rated to 65W. There is nothing to buy separately and nothing to fit: it works from the moment it is wired in.",
          "SMD LEDs are surface-mounted directly onto the board rather than screwed into a socket, which is what allows the slim rectangular profile. It also means the light source is part of the fitting rather than a replaceable bulb, so the fitting's life is the LED's life — typically tens of thousands of hours.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "74cm wide, 61cm deep and 97cm tall, weighing 3.6kg.",
          "The weight is the standout figure. At 3.6kg this hangs from a standard ceiling rose fixing, where a comparable fitting in solid iron or glass would need joist-mounted fixings and a far more involved installation. A large statement pendant that does not require opening the ceiling is a genuinely different proposition.",
          "Over a dining table, keep 75-85cm between tabletop and the lowest point, and choose a table wider than the fitting's 74cm.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Suited to rooms with height — living rooms, dining rooms and stairwells — where 97cm of drop reads as deliberate rather than intrusive. Rated for indoor use.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Clean with a soft, dry cloth only. The manufacturer is specific here: no polishing agents, no water, no abrasive materials. Electroplated chrome is a thin surface layer, and polishing compounds cut straight through it.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511658",
    title: "Babylon Large Black 12 Light Pendant Light | Kaiku",
    summary:
      "A twelve-light pendant in glass and metal with a black finish, with clear glass cylinders around each bulb. 100 x 100 x 175cm, 43.3kg. Takes twelve E27 bulbs up to 50W each, not included. Arrives assembled.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Glass and metal in a black finish, with clear glass cylinders enclosing each of the twelve bulbs on a geometric frame.",
          "Clear glass rather than frosted is a deliberate choice with consequences: it shows the bulb completely, so the bulb you choose becomes part of the design. Filament-style LEDs suit this fitting; a bare plastic-domed LED will look like exactly that behind clear glass.",
        ],
      },
      {
        heading: "Bulbs and Electrical Load",
        paragraphs: [
          "Takes twelve E27 bulbs up to 50W each. " + BULB_NOTE,
          "Twelve at 50W is a 600W maximum — a substantial circuit load if you were using incandescents, and a strong argument for LEDs here. Twelve 8W filament LEDs draw around 96W in total.",
          "Buy all twelve together and from one batch. With clear glass and every bulb visible, a mismatch in colour temperature or filament pattern will be immediately obvious.",
          "A mains-wired fitting requiring a qualified electrician and the circuit isolated at the consumer unit.",
        ],
      },
      {
        heading: "Weight and Ceiling Fixing",
        paragraphs: [
          "43.3kg. This is the most important number on the page and the one to resolve before ordering.",
          "A fitting of this weight cannot hang from a plasterboard ceiling rose under any circumstances. It requires fixing directly into structural timber — a joist, or substantial noggins installed between joists — with fixings rated well above 43kg, and it is worth having whoever installs it confirm the ceiling structure can carry it before the fitting is bought.",
          "In older properties with lath-and-plaster ceilings, that assessment matters even more. This is a fitting to discuss with a builder or electrician first, not one to order and work out afterwards.",
        ],
      },
      {
        heading: "Dimensions and the Space It Needs",
        paragraphs: [
          "100cm across and 175cm tall.",
          "175cm of drop is close to the height of an adult, so this is unambiguously a fitting for a double-height space, a large stairwell, or a room with substantial ceiling height. In a standard 2.4m room it would hang to well below head height.",
          "Over a dining table, keep 75-85cm of clearance above the tabletop, and pair it with a table comfortably wider than a metre.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Arrives fully assembled, which at 43.3kg makes the delivery itself worth planning for — this is a multi-person lift, and it needs somewhere safe to sit before it goes up.",
          "Wipe clean with a soft, clean cloth. Isolate the circuit and let the bulbs cool before touching the glass.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511724",
    title: "Abira White Marble and Nickel Finish 5 Bulb Floor Lamp | Kaiku",
    summary:
      "A five-bulb floor lamp in iron, marble and glass with a nickel finish, on a white marble base. 39 x 39 x 190cm, around 27kg. Bulbs not included. Assembly required.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "An iron frame in a nickel finish with glass shades, rising from a white marble base. Five bulbs are set along the frame rather than gathered at the top, so light comes from several points at different heights instead of one.",
          "The marble base is structural. At 190cm tall with an arrangement of arms, the lamp needs serious mass low down to stay stable, and stone provides it without a wide footprint.",
        ],
      },
      {
        heading: "Bulbs",
        paragraphs: [
          "Takes five bulbs, and bulbs are not included with the lamp.",
          "Because the five sit visible along the frame, buy all five together from the same batch — a single bulb at a different colour temperature is conspicuous on a fitting where they are all in view at once.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "39 x 39cm at the base and 190cm tall, weighing around 27kg, shipped in a carton of 125 x 26 x 37cm.",
          "190cm is taller than most people — this is a lamp that occupies the room vertically like a piece of furniture, not a side-table accessory. Its five light points at different heights make it work as a room's main light source rather than a supplementary one.",
          "27kg on a 39cm base makes it genuinely stable, but it is a two-person lift and not something to reposition casually.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Assembly is required and the lamp arrives as multiple components in one carton.",
          "Build it where it will stand — assembled, it is 190cm tall and 27kg, which is awkward to move through a doorway. Fit the marble base first so the frame has something to stand against while the arms go on.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft cloth and avoid abrasive cleaners.",
          "Treat the marble base as you would a stone worktop: wipe spills promptly, since marble is porous and stains from within, and keep acidic cleaners off it entirely — they etch the surface and leave dull patches.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511826",
    title:
      "Carta Black and White Stripe Papier Mache Table Lamp with Dome Shade | Kaiku",
    summary:
      "A table lamp with a papier mache body in a black and white stripe, on an iron frame, with a dome shade. Bulb not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A papier mache body in a black and white stripe over an iron frame, finished with a dome shade.",
          "Papier mache is an unusual material for a lamp and it behaves unlike ceramic or metal. It is very light for its size, the surface is matte and slightly textured rather than glazed, and each piece carries small variations from the forming process — the stripe will not be identical between two lamps.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          BULB_NOTE,
          "An LED is the sensible choice here specifically because of the material: LEDs run cool, and a paper-based body with a shade over it is not somewhere to be generating unnecessary heat.",
        ],
      },
      {
        heading: "The Dome Shade",
        paragraphs: [
          "A dome shade directs light downward into a defined pool rather than spreading it through the room. That makes this a task and accent lamp — good on a bedside table, a desk, or a console where you want a pool of light rather than general illumination.",
          "It also means the lamp reads as a dark silhouette with a bright base rather than a glowing object, so it works best where there is other light in the room.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry cloth only. This is the one care instruction that really matters on this lamp: papier mache is paper and paste, and a damp cloth will lift, cockle or stain the surface. Never use a damp or wet cloth, and keep it out of bathrooms and other humid rooms.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511827",
    title: "Carta White Papier Mache Table Lamp | Kaiku",
    summary:
      "A table lamp with a white papier mache body on an iron frame. Takes a Type A bulb up to 25W, not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A papier mache body in a plain white finish over an iron frame — the unpatterned member of the Carta range.",
          "Papier mache gives a matte, faintly textured surface quite unlike glazed ceramic: it absorbs light rather than reflecting it, so the lamp reads as a soft solid form rather than a shiny one. Small variations between pieces are inherent to how it is made.",
        ],
      },
      {
        heading: "Bulb and Wattage",
        paragraphs: [
          "Takes a Type A bulb rated to a maximum of 25W. " + BULB_NOTE,
          "25W is a genuinely low ceiling, so this is an accent and ambient lamp rather than a reading light. An LED of 5-8W will comfortably reach the useful brightness of a traditional 40-60W bulb while staying well within the limit — and running cool, which matters on a paper-bodied lamp.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "A white matte body suits a bedside table, a shelf or a console where you want a soft point of light rather than a bright one. Because the surface is unglazed, it takes on the colour of the light you put in it — a warm bulb will read distinctly cream rather than white.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry cloth only, and never a damp one. Papier mache is paper and paste: water lifts and cockles the surface, and on a white finish any watermark shows permanently.",
          "Keep it out of bathrooms and other humid rooms for the same reason.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5521106",
    title: "Astratto Abstract Wall Art | Kaiku",
    summary:
      "A framed abstract wall art print. Indoor use, wipe clean with a soft dry cloth.",
    sections: [
      {
        heading: "The Piece",
        paragraphs: [
          "An abstract composition, framed and ready to hang — a piece intended to carry a wall on its own rather than work as part of a gallery arrangement.",
          "Abstract work is the most forgiving choice for a room whose scheme may change: with no subject to date it and no fixed palette to match against, it sits with a repainted wall or new furniture in a way a figurative or photographic print often will not.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: [
          "The convention worth following is eye level: centre the piece around 145-150cm from the floor, which is gallery standard and lands naturally for most people standing.",
          "Above furniture the rule changes — hang it so the bottom of the frame sits 15-25cm above a sofa back or console top, which reads as a set rather than two unrelated objects.",
          "Use fixings suited to your wall. Into masonry a plugged screw is straightforward; in plasterboard, fix into a stud where you can or use proper cavity anchors rather than ordinary plastic plugs.",
        ],
      },
      {
        heading: "Placement and Light",
        paragraphs: [
          "Keep framed prints out of prolonged direct sunlight. UV fades pigment over months and years, and the fading is uneven — the exposed edge of a print goes first, which is more noticeable than an overall shift.",
          "A wall opposite a window rather than beside one usually gives good light without direct exposure.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft, dry cloth. Do not spray cleaner onto the piece: liquid runs down behind the frame edge and wicks into the mount and print, which cannot be reversed. If the glazing needs more than dusting, spray the cloth instead, lightly, and keep it away from the frame edges.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5527918",
    title: "Lena Oak Veneer Console Table with Brushed Gold Frame | Kaiku",
    summary:
      "A console table with an oak veneer top on a brushed gold metal frame.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "An oak veneer top on a brushed gold metal frame — real oak surface over an engineered core, on a slim metal base.",
          "Veneer over a stable core is the standard construction for a table top of this shape, and there is a practical reason for it beyond cost: solid timber moves with humidity, and a wide, thin top in solid oak is prone to cupping. A veneered core stays flat.",
          "Brushed rather than polished gold: it scatters reflections instead of mirroring the room, and it hides fingermarks far better than a polished finish would.",
        ],
      },
      {
        heading: "What a Console Is For",
        paragraphs: [
          "A console is a shallow table built to sit against a wall — in a hallway, behind a sofa, or along a landing — where a normal table would be too deep to pass.",
          "In a hallway it works as the drop point for keys and post. Behind a sofa in an open-plan room it does something more useful: it closes the back of the seating area, so the sofa reads as a boundary between spaces rather than a piece of furniture floating in the middle of the floor.",
        ],
      },
      {
        heading: "Placement",
        paragraphs: [
          "Measure the run of wall before ordering, and account for what happens around it — a console in a hallway needs enough clear passage past it, and anything on top of it reduces that further.",
          "Against a wall, a slim metal frame is stable; on an uneven floor it may need levelling, since a four-legged metal frame shows a rock more readily than a heavier timber base.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the oak veneer with a soft, barely damp cloth and dry it straight away. The vulnerable part of any veneered top is the edge: if water sits along a seam it can penetrate and lift the veneer, and that damage does not reverse.",
          "Use mats under drinks and plants. A veneer layer is thin, so a ring mark cannot be sanded out the way it could on solid timber.",
          "Wipe the brushed gold frame with a dry cloth and keep abrasive cleaners off it — the finish is applied to the metal, not part of it.",
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
    title: string;
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
      title: written.title,
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
  console.log(
    `\n${results.length} products, ${totalWords} words (avg ${Math.round(totalWords / results.length)} each).`,
  );

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-rewrite-thin-descriptions-batch2.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
