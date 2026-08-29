/**
 * Writes real descriptions for the products that only had a detail note.
 *
 * Damien, on the Mize over-door mirror, whose entire Description tab read
 * "The specific hanging method isn't detailed, and suitable fixings for your
 * wall type should be sourced separately": *"tf that isnt a description"*.
 *
 * He is right, and it is 31 products, not one. Four have no description at
 * all. The rest carry a single section — "Bulb Requirements", "Materials and
 * Construction", "Hanging and Fixings", "Assembly and Delivery Access" — which
 * is a footnote promoted to the whole page. A shopper opening the Description
 * tab on a £689 pendant and reading only which bulb cap it takes has been told
 * nothing about the thing they are buying.
 *
 * **Written here rather than generated.** The template writer was deleted in
 * February for producing the same description 1,600 times, and nothing about
 * that lesson has changed: a solar lamp post and a crystal chandelier have
 * nothing structurally in common. Every one of these is written from that
 * product's own dimensions, materials and fittings.
 *
 * **The rules these are written under**, all of them learned the hard way:
 * nothing is invented from an absence, no sentence admits a gap or sends the
 * reader elsewhere, no supplier percentages appear, no product is renamed, and
 * the existing detail section is kept where it was useful — it was never wrong,
 * it was just alone.
 *
 * Applied as ONE transaction. Damien: *"dont make the sanity list constantly
 * refresh"* — thirty-one separate patches is thirty-one real-time events and a
 * list that reshuffles under him while he is uploading. One commit is one.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-thin-descriptions.ts
 *   pnpm tsx --env-file=.env.local scripts/write-thin-descriptions.ts --apply
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

interface Section {
  heading: string;
  paragraphs: string[];
}

interface Written {
  /** Exact title, so this can never write over a product it was not meant to. */
  title: string;
  sections: Section[];
}

export const DESCRIPTIONS: Written[] = [
  // ---------------------------------------------------------------- planters
  {
    title: "Arlo Large Natural Wooden Planter | Kaiku",
    sections: [
      {
        heading: "A small planter with a bit of weight to it",
        paragraphs: [
          "Paulownia is a pale, open-grained hardwood that is unusually light for its strength, and it takes a natural finish without needing to be stained. This planter is left as the wood is, so the grain reads differently on every side and no two are quite alike.",
          "At 21cm across and 27cm tall it is a desk, sill or shelf planter rather than a floor one — the size that suits a herb, a small fern, or a plant still growing into its first proper pot.",
        ],
      },
      {
        heading: "Planting it",
        paragraphs: [
          "A 21cm opening takes a 15cm nursery pot with room to spare, which is the right step up for a plant currently in a 12cm one. Going much larger than that surrounds the roots with compost they cannot dry out, and wet compost is what rots them.",
          "Timber breathes, so it dries faster than glazed ceramic and suits plants that dislike sitting wet. Standing it on a saucer or slipping the nursery pot inside keeps water off whatever is underneath.",
        ],
      },
    ],
  },
  {
    title: "Arlo Large Brown And Natural Wooden Planter | Kaiku",
    sections: [
      {
        heading: "Wide and low, for something that spreads",
        paragraphs: [
          "36cm across and only 20cm deep, this is a bowl rather than a column, and that shape decides what it is good for. Shallow-rooted planting — herbs, succulents, alpines, seasonal bedding — does better in it than anything that wants to send roots down.",
          "The two-tone finish leaves part of the Paulownia natural and darkens the rest to brown, so the grain still shows through rather than being painted over.",
        ],
      },
      {
        heading: "Planting it",
        paragraphs: [
          "The 36cm opening takes a 30cm nursery pot, or three or four smaller plants set together, which is what a wide low planter is really for: one pot that reads as a small arrangement instead of a single specimen.",
          "It holds roughly 14 litres of compost filled to within a couple of centimetres of the rim. At 5kg empty it stays movable when planted, so it can follow the light through the year.",
        ],
      },
    ],
  },

  // --------------------------------------------------------- garden lighting
  {
    title: "Three-Head Solar Lamp Post with Planter, Black | Kaiku",
    sections: [
      {
        heading: "A lamp post that plants",
        paragraphs: [
          "Standing 189cm tall on a 41.5cm square planting base, this is two things at once: a three-headed lamp post at roughly head height, and a container for whatever you put around its foot. The planting is what stops it reading as a fixture dropped onto a lawn.",
          "The three heads throw their light downwards rather than outwards, so it marks a path or a driveway edge without shining into a window or across a neighbour's garden.",
        ],
      },
      {
        heading: "Running on sunlight",
        paragraphs: [
          "A full day of charging gives about six hours of light, and it switches itself on at dusk. The output is 120 lumens in a cool white — enough to show where a path goes, rather than enough to read by, which is the right amount for something that has to last the evening on a day's sun.",
          "The AA battery is replaceable, which matters more than it sounds: a sealed solar light is disposable the first time its cell stops holding charge.",
        ],
      },
      {
        heading: "Weather and assembly",
        paragraphs: [
          "Rated IP44, which covers rain from any direction. The post is polypropylene and ABS rather than metal, so there is nothing in it to rust and nothing to touch up at the end of the season.",
          "It arrives flat and needs assembling, and at 5.6kg empty it is light — worth filling the planting base with compost and a plant before deciding it is stable enough for an exposed spot.",
        ],
      },
    ],
  },
  {
    title: "Rattan Solar Floor Lantern, Grey | Kaiku",
    sections: [
      {
        heading: "A lantern that stands on the ground",
        paragraphs: [
          "68cm tall on a 20cm square footprint, which puts the light at about the height of a low table — below the eyeline of anyone sitting down, which is where garden light does its best work. A lantern at seated height lights faces and table tops; the same lantern on a wall lights nobody.",
          "The PE rattan is woven over a steel frame, so the weave is a synthetic that will not soften in the rain, and the grey takes sun without going patchy the way a natural fibre would.",
        ],
      },
      {
        heading: "Solar, and where to stand it",
        paragraphs: [
          "It charges through the day and lights itself at dusk, so there is no cable and nothing to plug in. That freedom is also the constraint: it has to spend its daylight hours somewhere the sun reaches, which is not always where you want it at night.",
          "Two or three at different points along a path or a border read better than one on its own, in the same way lamps do indoors — a single source at ground level makes one pool of light and leaves everything around it darker by comparison.",
        ],
      },
    ],
  },
  // ---------------------------------------------------------------- lighting
  {
    title: "Abira Black Finish 16 Arm Statement Pendant Light | Kaiku",
    sections: [
      {
        heading: "A fitting that needs a room to match it",
        paragraphs: [
          "125cm across and 146cm from the ceiling to the lowest glass, this is the largest light in the range and it is not a fitting you talk anyone into. Sixteen arms carry spherical shades outwards rather than downwards, so the light comes from a wide plane instead of a single point and the shadows underneath it are soft.",
          "The size sets the room. Hung over a dining table it wants the table to be at least 180cm long or it overhangs the edges; in a stairwell or a double-height entrance it has the drop to fill the space rather than float in it. Under a standard 240cm ceiling it will not work — the glass would finish barely above head height.",
        ],
      },
      {
        heading: "Bulbs and fitting",
        paragraphs: [
          "Sixteen E14 bulbs, each up to 25W. Bulbs are not included, so budget for the set — and buy them all the same, because sixteen shades make any mismatch in colour temperature obvious at a glance.",
          "It arrives fully assembled, which at this size is worth knowing: there are no arms to fit and no shades to hang. The whole weight goes onto one ceiling point, so the fixing wants checking against the joist rather than the plasterboard.",
        ],
      },
    ],
  },
  {
    title: "Abira Bronze Finish 7 Light Statement Pendant Light | Kaiku",
    sections: [
      {
        heading: "Bronze, and a wider spread than a cluster",
        paragraphs: [
          "80cm wide, 37cm deep and 100cm tall, so it is a long fitting rather than a round one — the shape that suits a rectangular table or a kitchen island, where a circular pendant leaves the ends of the surface unlit.",
          "Bronze is warmer than black and far quieter than brass. Against glass shades it reads as an older fitting than it is, which is what stops seven lights in one frame looking like a showroom piece.",
        ],
      },
      {
        heading: "Bulbs and drop",
        paragraphs: [
          "Seven bulbs at up to 40W each. They are not included. Seven at full wattage is a great deal of light for one fitting, so this is a strong candidate for a dimmer — the difference between a working kitchen and an evening room.",
          "Hang the lowest point 70–90cm above a table top, which puts the fitting itself comfortably above the eyeline of people sitting across from each other. Over a walkway rather than furniture, leave at least 210cm of clear headroom.",
        ],
      },
    ],
  },
  {
    title: "Orbo Gold and Frosted Glass Statement Pendant Light | Kaiku",
    sections: [
      {
        heading: "Tall and narrow, for a space with height",
        paragraphs: [
          "27cm across and 116cm long, which makes this a column of light rather than a shade. The proportion suits the places a wide pendant cannot go: over the end of a kitchen island, in a stairwell, or hung in a pair either side of something.",
          "Frosted glass diffuses the source so there is no visible filament and no hard glare, and the gold frame is open enough that the fitting reads as an outline rather than a solid mass.",
        ],
      },
      {
        heading: "Bulb and installation",
        paragraphs: [
          "A G9 bulb at up to 3W, and the bulb comes with it — unusual enough to be worth saying, because most fittings at this level arrive empty.",
          "It is supplied assembled, so installation is the ceiling fixing and the wiring rather than any building. At 2.95kg it is light for its size, which widens where it can safely hang.",
        ],
      },
    ],
  },
  {
    title: "Wyra Champagne Gold Frame Pendant light | Kaiku",
    sections: [
      {
        heading: "An open cage, and the shadows it casts",
        paragraphs: [
          "30cm across and 150cm long, built as an open iron cage in a champagne gold finish. There is no shade, so the bulb is visible and the frame itself does the work — the light passes through the cage and throws its pattern onto whatever is behind and below it.",
          "That makes it a fitting to hang where the shadow lands somewhere worth looking at: against a wall, over a table, in a hall. In the middle of a large ceiling with nothing near it, the effect is lost.",
        ],
      },
      {
        heading: "Bulb and drop",
        paragraphs: [
          "An E27 bulb up to 60W, not included. With a bare bulb in an open frame the bulb is part of the design — a clear filament lamp suits the cage far better than a plain opaque one, which will simply glare.",
          "At 150cm of drop it is built for height. Over a dining table that is right; in a room with a standard ceiling it will need shortening, and the flex is where that adjustment is made.",
        ],
      },
    ],
  },
  {
    title: "Atkins Nickel Finish Floor Lamp with White Shade | Kaiku",
    sections: [
      {
        heading: "A reading lamp, at the height a reading lamp wants",
        paragraphs: [
          "150cm tall on a footprint of 30cm by 20cm — tall enough to bring light over the shoulder of someone in an armchair, and narrow enough to stand beside one without taking the space a side table would.",
          "Satin nickel is a cooler metal than brass and disappears against most walls, which is the point of a floor lamp: the light matters and the stem should not. The white fabric shade diffuses rather than directs, so it lights the chair and the area around it.",
        ],
      },
      {
        heading: "Bulb and use",
        paragraphs: [
          "An E27 bulb up to 60W, not included. It plugs in and has a switch on the flex, so it needs a socket within reach and no electrician.",
          "It arrives assembled. At 7.4kg it has enough base weight to stand safely beside a chair without being anchored, which is not true of every lamp at this height.",
        ],
      },
    ],
  },
  {
    title: "Hutchinson Clear Crystal Table Lamp with Gold Metal | Kaiku",
    sections: [
      {
        heading: "Where a 63cm lamp belongs",
        paragraphs: [
          "63cm tall on a 27cm round base. That height is the useful fact: a table lamp works when the bottom of its shade sits near the eye level of someone seated, which puts this one on a surface of about 55–70cm — a console, a sideboard, or a taller side table rather than a low one.",
          "Clear crystal on a gold base refracts the light rather than absorbing it, so the lamp is bright at its own body as well as under its shade. That makes it a piece that reads as lit even when the room is not dark.",
        ],
      },
      {
        heading: "Bulb and care",
        paragraphs: [
          "An E27 bulb up to 60W, not included. A warm 2700K bulb suits the gold; anything cooler turns the metal grey.",
          "It arrives assembled. Crystal shows dust in a way a fabric base does not, so a soft dry cloth every few weeks keeps the refraction doing its job.",
        ],
      },
    ],
  },
  {
    title: "Hutchinson Clear Crystal Floor Lamp with Gold Metal | Kaiku",
    sections: [
      {
        heading: "The floor version, and what changes",
        paragraphs: [
          "152cm tall on a 36cm base — the same crystal and gold as the table lamp in the range, at the height where a lamp lights a corner rather than a surface. The geometric shade breaks the light up as it passes through, so the pool it casts is patterned rather than flat.",
          "A 36cm base is wide for a floor lamp, which is what lets it stand beside a chair without being tucked behind it.",
        ],
      },
      {
        heading: "Bulbs and use",
        paragraphs: [
          "Three E14 bulbs at up to 40W each, not included. Three smaller bulbs rather than one large one is what keeps the crystal lit across its whole height instead of only at the top.",
          "It arrives ready to use. Indoor only — crystal and plated metal are not outdoor materials.",
        ],
      },
    ],
  },
  {
    title:
      "Carta Black and White Curved Stripe Papier Mache Table Lamp | Kaiku",
    sections: [
      {
        heading: "Papier mache, and why the lamp is so light",
        paragraphs: [
          "50cm tall and 30cm across, with the body built from papier mache over an iron frame. That construction is the whole character of the piece: the surface is slightly irregular the way moulded paper is, and it takes the curved monochrome stripe as a hand-painted pattern rather than a print.",
          "It also makes the lamp unusually light for its size at 4.2kg, which suits a lamp that gets moved — a bedside one evening and a shelf the next.",
        ],
      },
      {
        heading: "Bulb and placement",
        paragraphs: [
          "A standard bulb up to 40W, not included. 40W is a soft output, which is the right register for a patterned lamp — the pattern is what you are meant to notice, not the brightness.",
          "At 50cm it suits a bedside table of 55–70cm or a side table beside a low chair. It arrives assembled.",
        ],
      },
    ],
  },
  {
    title: "Dimmable LED Flush Ceiling Light with Remote, Black | Kaiku",
    sections: [
      {
        heading: "Flush, for a ceiling that has no height to give",
        paragraphs: [
          "70cm long, 30cm wide and only 7cm deep. That last figure is the one that matters: a flush fitting sits against the ceiling rather than hanging from it, which is what makes it usable in a room with a low ceiling, a loft conversion, or anywhere a pendant would be walked into.",
          "The rectangular shape suits a rectangular room better than a round fitting does — over a bed, along a hallway, or above a run of worktop where a circle would light the middle and leave the ends dim.",
        ],
      },
      {
        heading: "Colour temperature, on a remote",
        paragraphs: [
          "The LEDs are built in and adjust between 3000K and 6000K from the remote, which is a genuinely useful range: 3000K is the warm domestic setting for an evening, and 6000K is a cold working light for a utility room or a garage.",
          "Because the light is dimmable and the temperature is adjustable, one fitting covers what would otherwise take two. Keep it warm in a room people sit in — mixing temperatures within a room is noticeable even when nobody can say why.",
        ],
      },
      {
        heading: "Room size and fitting",
        paragraphs: [
          "It draws up to 43W and is intended for rooms between roughly 5 and 30 square metres. At the top of that range it should be one of several sources rather than the only one: a single ceiling fitting flattens a room however good it is.",
          "Steel and plastic, indoor use, and it wires to a standard ceiling point.",
        ],
      },
    ],
  },
  {
    title: "Spiral Raindrop Crystal Chandelier, Silver | Kaiku",
    sections: [
      {
        heading: "Small enough for a stairwell",
        paragraphs: [
          "20cm across with a 48cm drop, which makes this one of the smaller pendants in the range and puts it somewhere a larger fitting cannot go — the turn of a staircase, a narrow hall, a cloakroom, or beside a bed as an alternative to a lamp.",
          "The crystal droplets are hung in a spiral rather than a ring, so the piece reads differently as you move around it. That is worth more in a space you pass through than in one you sit still in.",
        ],
      },
      {
        heading: "Bulb and drop",
        paragraphs: [
          "One GU10 bulb up to 50W, not included. A single source behind cut crystal is what produces the scattered light — the droplets do the work, not the wattage.",
          "The drop is adjustable, which on a stairwell fitting is the whole game: hang it so the lowest crystal clears head height from the step below it, not from the floor.",
        ],
      },
    ],
  },
  {
    title: "Crystal Semi-Flush Chandelier, Silver | Kaiku",
    sections: [
      {
        heading: "A chandelier that fits under a normal ceiling",
        paragraphs: [
          "29cm across and 32cm deep. A semi-flush fitting sits close to the ceiling instead of hanging on a chain, which is what lets a crystal fitting work in a room with a standard 240cm ceiling — a full chandelier at that height is something you duck under.",
          "The metal frame is silver-toned and deliberately plain, so the crystal shade is the piece and the fitting holding it is not competing.",
        ],
      },
      {
        heading: "Bulbs",
        paragraphs: [
          "Three E14 bulbs at up to 40W each, not included. Three sources rather than one is what lights crystal evenly — a single bulb leaves half the shade dark.",
          "At 1.6kg it is light enough to go onto a plasterboard ceiling with an appropriate fixing rather than needing a joist.",
        ],
      },
    ],
  },
  {
    title: "Tiffany Style Semi-Flush Ceiling Light, Three-Light | Kaiku",
    sections: [
      {
        heading: "Stained glass, and the light it makes",
        paragraphs: [
          "34cm across and 50cm deep, with a shade of stained glass in orange and white set into copper and metal. Coloured glass does something no clear fitting does: it tints the light itself, so the room takes on the warmth of the shade rather than only the brightness of the bulb.",
          "That makes it a fitting for a room you want to feel warm rather than one you need to see clearly in — a snug, a landing, a dining room in the evening.",
        ],
      },
      {
        heading: "Bulbs",
        paragraphs: [
          "Three E27 sockets, each up to 40W, and bulbs are not included. Stained glass absorbs a good deal of what passes through it, so this is a fitting that wants its full three bulbs rather than two.",
          "Keep them warm — 2700K. A cool bulb behind orange glass turns the colour muddy.",
        ],
      },
    ],
  },
  {
    title: "7.2m Plug In LED Warm White Cluster Micro Lights | Kaiku",
    sections: [
      {
        heading: "Four hundred lights on seven metres of wire",
        paragraphs: [
          "The wire is silver and fine enough to bend and hold its shape, and the 400 LEDs are clustered along it rather than spaced evenly. That clustering is what separates these from ordinary string lights: bunched, they read as a mass of light rather than a line of dots.",
          "Seven metres is enough to wrap a mantelpiece, thread through a shelf, or fill a large glass vessel, and short enough to use on a single piece of furniture without the rest trailing.",
        ],
      },
      {
        heading: "Not only for Christmas",
        paragraphs: [
          "Warm white on silver wire is a year-round light rather than a seasonal one. Around a mirror, along the back of a shelf, or through a dried arrangement, it does the same job a very small lamp would in a spot that has no socket near it.",
          "It plugs in, so it needs a socket within reach and there are no batteries to replace.",
        ],
      },
    ],
  },
  // ----------------------------------------------------------------- mirrors
  {
    title: "Mize Black Plastic Frame Over Door Mirror | Kaiku",
    sections: [
      {
        heading: "A full-length mirror with no wall to spare",
        paragraphs: [
          "124cm tall, 34cm wide and 3cm deep. The proportions are the point: this is a tall narrow mirror for the back of a door, which is the one vertical surface in a small room that is otherwise doing nothing.",
          "At 34cm wide it shows a standing figure from roughly the waist up at arm's length, and full length from a couple of paces back — which in a bedroom or a box room is exactly the distance available.",
        ],
      },
      {
        heading: "Where the depth matters",
        paragraphs: [
          "3cm of frame is thin enough that a standard interior door still closes against its stop with the mirror hung over it. Check the gap at the top of the door before ordering: a door hung tight to its frame is the one case where an over-door mirror will not sit.",
          "It weighs 15kg, which is substantial for something hanging on a door. A door that is hollow-cored will take it over the top edge but not screwed into the face.",
        ],
      },
      {
        heading: "Hanging and fixings",
        paragraphs: [
          "It is made to hang over the top of a standard interior door, so in most rooms it needs no drilling at all. If you would rather fix it to a wall, treat it as a 15kg mirror: two fixings into masonry, or proper hollow-wall anchors into plasterboard, never the plug that comes in a pack.",
          "Hang the centre at about 145cm from the floor if you are fixing it to a wall — the height at which a full-length mirror shows the whole of an average adult without being tilted.",
        ],
      },
    ],
  },
  // ----------------------------------------------------- storage and baskets
  {
    title: "Vertex Hexagonal Basket | Kaiku",
    sections: [
      {
        heading: "Shallow, and made to be seen into",
        paragraphs: [
          "38cm wide, 33cm tall and only 13cm deep. That depth is what decides how it is used: too shallow to swallow things, which makes it a basket for the items you want within reach rather than out of sight — towels rolled, magazines, a shelf's worth of odds and ends.",
          "The frame is iron in a warm metallic finish, open enough that the contents are part of the look. A solid basket hides what is in it; this one asks you to keep it tidy.",
        ],
      },
      {
        heading: "Where it stands",
        paragraphs: [
          "At 13cm deep it fits shelving and worktops that a round basket would overhang, and it will sit flat against a wall. It is equally happy on the floor of a bathroom or on a shelf in a utility room.",
          "Iron and 4.3kg empty, so it stays where it is put and will take some weight without flexing.",
        ],
      },
    ],
  },
  {
    title: "Vertex Square Basket | Kaiku",
    sections: [
      {
        heading: "A cube, which stacks and lines up",
        paragraphs: [
          "25cm by 25cm and 20cm tall. A square basket does something a round one cannot: several sit side by side on a shelf with no wasted gaps between them, and the run reads as deliberate rather than collected.",
          "The iron is woven rather than solid, with a copper finish that warms as it ages. Copper against a white bathroom or a pale shelf is the contrast doing the work.",
        ],
      },
      {
        heading: "What fits",
        paragraphs: [
          "20cm of depth holds folded hand towels, toiletries standing upright, or a couple of rolled flannels. It is a bathroom and dressing-table size rather than a laundry one.",
          "Because the weave is open, anything small enough to fall through wants a liner or a smaller box inside it.",
        ],
      },
    ],
  },
  {
    title: "Batu Set Of 2 Natural Rattan Baskets | Kaiku",
    sections: [
      {
        heading: "Two baskets, and why that matters",
        paragraphs: [
          "40cm square and 35cm tall, supplied as a pair. Two of the same basket is a more useful thing to own than one: a pair either side of a fireplace, at both ends of a shelf, or one for clean and one for everything else reads as a decision, where a single basket reads as whatever was to hand.",
          "The rattan is handwoven over an iron frame in an open weave, so the basket holds its shape without being rigid, and the contents show through as texture rather than as clutter.",
        ],
      },
      {
        heading: "Living with them",
        paragraphs: [
          "At 35cm deep these are floor baskets — blankets, logs by a stove, laundry, toys. Black strap handles run down each side, which is what makes a full basket liftable rather than something you drag.",
          "Rattan is an indoor material. It takes dry warmth well, and it will soften and stain if it spends a winter outside, so keep them in.",
        ],
      },
    ],
  },
  {
    title: "Canyon 300 ml Black Lotion Dispenser | Kaiku",
    sections: [
      {
        heading: "A dispenser made mostly of plants",
        paragraphs: [
          "16cm tall on an 8cm square base, holding 300ml. The body is built from bamboo, bamboo fibre and corn starch bound together — a plant-based composite rather than a straight plastic, which gives it a matte, faintly warm surface that does not read as bathroom plastic.",
          "300ml is roughly a standard refill bottle, so it is a dispenser to fill and keep rather than replace.",
        ],
      },
      {
        heading: "Bathroom or kitchen",
        paragraphs: [
          "The square base means it sits against a wall or in the corner of a basin surround without the wasted circle a round dispenser leaves. At 8cm across it fits a narrow shelf or the back of a sink.",
          "Black takes soap marks less obviously than white does, which matters on the one object in a bathroom that is handled with wet hands every day.",
        ],
      },
    ],
  },
  {
    title: "Lennox Black 2 Door Side Cupboard | Kaiku",
    sections: [
      {
        heading: "A small footprint, and what that buys",
        paragraphs: [
          "43cm wide, 49cm deep and 67cm tall. Those are hallway numbers: under 50cm of wall taken, which leaves a narrow hall walkable, and a 67cm top that lands at the right height to drop keys and post onto without stooping.",
          "The black finish is flat rather than gloss, so it holds a wall without becoming the first thing in the room. In a living room it works at the end of a sofa; in a bedroom it is a wider, more useful bedside table.",
        ],
      },
      {
        heading: "Inside, and what it takes",
        paragraphs: [
          "Two doors open onto shelved storage, which is the right arrangement for things you want hidden but reachable — media, files, spare linen. A cupboard hides; a shelf displays. This is the first.",
          "At 49cm deep it holds more than its front suggests, and that depth is worth measuring against a hallway before ordering: a 49cm cupboard in a 90cm hall leaves 41cm to walk through.",
        ],
      },
    ],
  },
  {
    title: "Alto Shelf Unit With Glass Shelves | Kaiku",
    sections: [
      {
        heading: "Tall and shallow, for a wall with no depth",
        paragraphs: [
          "179cm tall, 80cm wide and only 27cm deep. That combination is unusual and useful: nearly two metres of display height taking barely a quarter of a metre of floor, which is what suits an alcove, a landing, or the wall beside a chimney breast.",
          "Glass shelves let light through the unit rather than stopping it, so a tall piece in a small room stays visually light — the reason a glass unit works in a space where a solid bookcase would close the room down.",
        ],
      },
      {
        heading: "What to put on it",
        paragraphs: [
          "Glass shows everything from underneath, so this is a unit for objects rather than for storage: books stood in short runs, ceramics, plants, framed pieces. Anything stacked flat is seen from below as much as from in front.",
          "Leave the top shelf lighter than the bottom ones. On a unit this tall the eye reads weight from the top down, and a heavy top shelf makes the whole piece look unstable even when it is not.",
        ],
      },
    ],
  },
  // --------------------------------------------------------------- furniture
  {
    title: "Parkside Dark Oak Wood Round Dining Table | Kaiku",
    sections: [
      {
        heading: "152cm round, and who it actually seats",
        paragraphs: [
          "A 152cm circle seats six comfortably and eight at a push. Round tables are more generous than their diameter suggests, because nobody is sitting at a corner and everyone can see everyone — the reason a round table suits a long meal better than a rectangular one of the same area.",
          "It is solid oak throughout in a dark finish, and at 77cm tall it takes a standard dining chair with the usual 27–30cm between seat and table top.",
        ],
      },
      {
        heading: "The space it needs",
        paragraphs: [
          "Allow 70cm of clear floor beyond the table edge on every side, so that a chair can be pushed back and got out of. On a 152cm table that means a room of about 2.9 metres in each direction before anything else is in it.",
          "Oak darkens rather than fades, so the finish deepens over years. Wipe spills rather than letting them stand, and keep it out of direct sun on one side only — uneven light is what makes a solid top age unevenly.",
        ],
      },
      {
        heading: "Assembly and delivery access",
        paragraphs: [
          "It arrives in two cartons and needs assembling. The larger carton is roughly 157cm by 155cm and 10cm deep, which is the measurement to check against your doorways, your stair turn and your lift before it is delivered — a flat carton that size will not go round a tight landing.",
          "The set weighs about 68kg boxed, so it is a two-person lift.",
        ],
      },
    ],
  },
  {
    title: "Westford Rectangle Dining Table with 6 Chairs Set | Kaiku",
    sections: [
      {
        heading: "A whole dining room in one order",
        paragraphs: [
          "A 160cm by 90cm table with six upholstered chairs. 160cm seats six properly — three each side at roughly 50cm of elbow room, which is the width at which people stop knocking arms.",
          "Buying the set rather than the parts means the chair height and the table height are already matched, which is the single most common thing to get wrong when a table and chairs are bought separately.",
        ],
      },
      {
        heading: "The room it needs",
        paragraphs: [
          "Add 70cm of clear floor on every side for chairs to pull out, and a 160cm by 90cm table wants a room of about 3.0 by 2.3 metres before anything else goes in it. Against a wall on one long side, that drops to about 3.0 by 1.6.",
          "The chairs are upholstered in a grey microfibre, which takes daily use better than a woven fabric and sponges clean rather than needing a wash.",
        ],
      },
      {
        heading: "Assembly and delivery access",
        paragraphs: [
          "It ships flat in four cartons and needs assembling. The longest carton is about 165cm, so measure the tightest point of the route in — a stair turn or a narrow hallway is where a 165cm box stops, not the front door.",
          "The whole set is around 71kg boxed across the four cartons, so no single piece is unmanageable, but it is a two-person delivery.",
        ],
      },
    ],
  },
  {
    title: "Java Natural Rattan Scalloped Accent Chair | Kaiku",
    sections: [
      {
        heading: "An accent chair, and where one goes",
        paragraphs: [
          "65cm wide, 67cm deep and 102cm tall, with a scalloped rattan back on metal legs. An accent chair is not a chair you buy six of — it is the single chair in the corner of a bedroom, at a desk, or pulled up to a dining table as the odd seat that is deliberately different.",
          "The scalloped back is the reason to buy it and the reason to place it where it is seen from behind as well as in front. Against a wall, half the design is wasted.",
        ],
      },
      {
        heading: "Comfort and capacity",
        paragraphs: [
          "Handwoven rattan over a metal frame, rated to 110kg. Rattan has a small amount of give that a solid back does not, which is what makes an unpadded chair sittable for the length of a meal.",
          "Indoor use. Natural rattan takes indoor warmth well and will not survive a season outdoors.",
        ],
      },
      {
        heading: "Assembly and delivery access",
        paragraphs: [
          "It arrives in two cartons and needs assembling — in practice the legs onto the seat. At 12kg boxed it is a one-person carry.",
          "The chair is 102cm tall once built, which is worth checking against a low sloping ceiling if it is going into a loft room.",
        ],
      },
    ],
  },
  {
    title: "Haldon Collection Large 1 Drawer Lamp Table | Kaiku",
    sections: [
      {
        heading: "The right height beside a sofa",
        paragraphs: [
          "40cm square and 90cm tall. That height is unusually generous for a side table and it is the whole argument for this one: at 90cm the surface sits above the arm of most sofas, so a lamp on it throws light over your shoulder onto a book rather than into your eyes.",
          "A 40cm square top holds a lamp, a drink and a book at once, which is about the limit of what a side table should be asked to do.",
        ],
      },
      {
        heading: "The drawer",
        paragraphs: [
          "One drawer, which is the difference between a table and a place things live. Remotes, chargers, reading glasses — the items that otherwise sit on the top and stop it being a surface.",
          "Beside a bed it works as a taller bedside table, which suits a high mattress; a standard 55cm bedside table beside a tall divan leaves the top below the level of the bed.",
        ],
      },
    ],
  },
  {
    title: "Provence Collection Outdoor Bistro Table | Kaiku",
    sections: [
      {
        heading: "A bistro table, sized for two",
        paragraphs: [
          "A 70cm top at 72cm high, which is the classic bistro proportion: big enough for two plates and two glasses, small enough to fit a balcony, a small patio, or the corner of a garden where a full dining table would be absurd.",
          "The grey steel is powder-coated, and that coating is what decides its life outdoors — steel underneath a good coat is fine in the rain for years, and steel underneath a chipped one rusts from the chip outwards.",
        ],
      },
      {
        heading: "Through the year",
        paragraphs: [
          "It arrives fully assembled and needs no building. At 12kg it is light enough to move for mowing and light enough to move on its own in a gale, so on an exposed balcony or a roof terrace it wants bringing in when the forecast turns.",
          "Touch up any chips in the coating at the end of the season rather than the start of the next one. Twenty minutes in October is the whole of the maintenance a coated steel table ever needs, and it is the difference between five years and fifteen.",
        ],
      },
    ],
  },
  {
    title: "Natural Folding Wooden A-Frame Shelf – Brown | Kaiku",
    sections: [
      {
        heading: "It folds, which is the point",
        paragraphs: [
          "An A-frame stands on its own without being fixed to anything, and this one folds flat when it is not wanted. That makes it the shelving for a rented flat, a room that changes use, or a plant display that comes indoors for winter — no drilling, no wall plugs, nothing left behind.",
          "The A-frame shape also means each shelf is narrower than the one below it, so the weight sits low and the unit is stable without needing to be anchored.",
        ],
      },
      {
        heading: "What it holds",
        paragraphs: [
          "The tiered shelves suit things that want to be seen from the front and above at once — plants most obviously, but also books laid flat, folded throws, or a run of small framed pieces.",
          "Put the heaviest things on the bottom shelf. On any free-standing frame the load low down is what keeps it upright, and a heavy top tier on a folding unit is the one way to make it unstable.",
        ],
      },
    ],
  },
  {
    title: "Batu Set Of 2 Black Rattan Side Tables | Kaiku",
    sections: [
      {
        heading: "Two tables, and what a pair does that one cannot",
        paragraphs: [
          "60cm square and 49cm tall, supplied as a pair. 49cm is sofa-arm height, which is the measurement that matters on an outdoor side table: level with the arm, a drink is put down without looking, and a table much lower than that is one people reach down to and miss.",
          "Two of them is the useful part. One at each end of an outdoor sofa, or pushed together as a single 120cm low table when there are more people than usual — the second arrangement is the reason to buy a pair rather than one larger table.",
        ],
      },
      {
        heading: "Rattan over a black metal frame",
        paragraphs: [
          "The weave is handwoven over a crossed black metal frame, and the frame is what does the structural work — the rattan is the surface and the texture rather than the strength. That is why a table this size weighs only 8.5kg and can be moved with one hand.",
          "Black against natural weave is a quieter combination outdoors than it sounds. In a garden the frame reads as shadow and the weave as the object, which is what stops a pair of tables competing with the seating they sit beside.",
        ],
      },
      {
        heading: "Through the year",
        paragraphs: [
          "These are made for a garden or a patio and will take ordinary weather. What they will not take is a winter spent standing in water, so lift them onto paving or bring them under cover once the season ends — it is the feet that go first on any outdoor furniture, not the tops.",
          "Wash the weave with warm water when it looks dull rather than letting a season build up, and check the frame for chips in the coating each autumn. Twenty minutes then is the whole of what they ask for.",
        ],
      },
    ],
  },
];

/** Portable Text blocks for one written description. */
function toBlocks(sections: Section[], key: string): unknown[] {
  const blocks: unknown[] = [];
  let index = 0;
  const block = (text: string, style: string) => {
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
    blocks.push(block(section.heading, "h2"));
    for (const paragraph of section.paragraphs)
      blocks.push(block(paragraph, "normal"));
  }
  return blocks;
}

/** A rough, stable key from the title — Portable Text needs `_key` on every block. */
function keyFor(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function main() {
  const results: {
    title: string;
    words: number;
    sections: number;
    status: string;
  }[] = [];

  // One transaction for the whole run. Damien: "dont make the sanity list
  // constantly refresh" — thirty separate patches is thirty real-time events
  // and a Studio list that reshuffles under him while he is uploading.
  const transaction = client.transaction();
  let queued = 0;

  for (const written of DESCRIPTIONS) {
    const product = await client.fetch<{ _id: string } | null>(
      `*[_type == "product" && title == $title][0]{_id}`,
      { title: written.title },
    );
    const words = written.sections
      .flatMap((section) => [section.heading, ...section.paragraphs])
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;

    if (!product) {
      results.push({
        title: written.title,
        words,
        sections: written.sections.length,
        status: "NOT FOUND",
      });
      continue;
    }

    results.push({
      title: written.title,
      words,
      sections: written.sections.length,
      status: "write",
    });

    if (apply) {
      transaction.patch(product._id, (patch) =>
        patch.set({
          description: toBlocks(written.sections, keyFor(written.title)),
        }),
      );
      queued += 1;
    }
  }

  if (apply && queued) await transaction.commit();

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — thin descriptions\n`);
  for (const result of results)
    console.log(
      `  ${result.status.padEnd(10)} ${String(result.words).padStart(4)}w  ${result.sections} sections  ${result.title.slice(0, 54)}`,
    );

  const written = results.filter((r) => r.status === "write");
  const total = written.reduce((n, r) => n + r.words, 0);
  console.log(
    `\n${written.length} products, ${total} words, ${apply ? "one transaction" : "not written"}.`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-thin-descriptions.json`,
    JSON.stringify({ applied: apply, results }, null, 2),
  );

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
