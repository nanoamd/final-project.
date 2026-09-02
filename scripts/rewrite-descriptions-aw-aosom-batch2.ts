/**
 * Batch 2 of the AW Dropship / Aosom description rewrite: the remaining 10
 * Aosom products in the work queue (solar garden lighting, a rattan corner
 * set and five interior light fittings) plus the first 5 AW Dropship
 * reclaimed-teak pieces.
 *
 * Written to the SaunaPlunge reference standard — 4-6 h2 sections, 150-250
 * words, headings specific to the product, every fact carried through to
 * what it means for the buyer, plain British voice with contractions.
 *
 * Facts come only from each document's own specs/dimensions/weight/FAQs and
 * the factual physical detail already in its old copy. Corrections made on
 * the way, because several of these documents disagree with themselves:
 *   - 842-108 and 867-154v00gy carry a `weight` of 0.02kg / 0.021kg, which
 *     is the battery weight; the real item weights are 1.1kg and 2.5kg per
 *     their own specs, and those are what the copy uses.
 *   - b31-087's old description said the drop was adjustable; its own FAQ
 *     says the installed height is fixed at 48cm. The FAQ wins.
 *   - b31-300's old copy claimed a push-button switch and a 2.3m minimum
 *     ceiling height — neither is in its specs or FAQs, so both are gone.
 *   - b31-573v00bk's old copy said "no stated IP rating for damp locations",
 *     which is an admitted gap; the section is dropped instead.
 *   - acshop-07's specs say 180x77x70cm while its dimensions field and FAQ
 *     both say 80cm high; 80cm is used.
 * Where a fact isn't in the source there is no sentence about it.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-aw-aosom-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-aw-aosom-batch2.ts --apply
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
    id: "product-aosom-842-108",
    title: "1.6m Dimmable Solar Bollard Light, Black | Kaiku",
    summary:
      "A 160cm solar bollard light with a hexagonal head in 201 stainless steel on a plastic base, rated IP44. The dimmable LED unit lifts out, runs up to six hours on a full charge and needs no wiring; 18 x 18cm footprint, 1.1kg.",
    sections: [
      {
        heading: "Solar Charging and Run Time",
        paragraphs: [
          "There's no cable and nothing to plug in — it charges through the day and gives up to six hours of light on a full charge, so there's no electrician and no trench to dig. The trade-off is that where it stands is decided by where the sun falls rather than where the nearest socket is. Six hours covers an evening; it won't run to dawn in the middle of winter.",
        ],
      },
      {
        heading: "Light Height and Where the Beam Goes",
        paragraphs: [
          "At 160cm the head sits around shoulder height, and it's a downlight, so the light lands on the path instead of going into a window or across next door's garden.",
        ],
      },
      {
        heading: "Removable, Dimmable LED",
        paragraphs: [
          "The LED unit lifts out of the head — an E27 fitting, up to 7.2W — and it dims, so it can be turned down when it's only marking the edge of a path rather than lighting it.",
        ],
      },
      {
        heading: "Steel, Plastic and the IP44 Rating",
        paragraphs: [
          "A 201 stainless steel post on a plastic base, rated IP44, which covers rain from any direction.",
        ],
      },
      {
        heading: "Footprint, Weight and Assembly",
        paragraphs: [
          "The hexagonal base takes up 18 x 18cm and the whole thing weighs 1.1kg, so you can move it around the garden over a few evenings until you find where it earns its place. It arrives to be assembled. Delivered within 7–14 days.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-842-135",
    title: "Three-Head Solar Lamp Post with Planter, Black | Kaiku",
    summary:
      "A three-headed solar lamp post, 189cm tall on a 41.5cm square planter base, moulded in polypropylene and ABS. It comes on at dusk and runs about six hours on a day's charge, putting out 120 lumens of cool white light; 5.6kg.",
    sections: [
      {
        heading: "A Lamp Post with a Planter at Its Foot",
        paragraphs: [
          "It stands 189cm tall on a base that's 41.5cm square and 33cm deep, and that base is a planter — so it's two things at once, a lamp post at roughly head height and a container for whatever you put around its foot. The planting is what stops it reading as a fixture dropped onto a lawn.",
        ],
      },
      {
        heading: "Solar Charging, Run Time and Output",
        paragraphs: [
          "Six hours of sun gives roughly six hours of light, and it switches itself on at dusk. Output is 120 lumens in a cool white at 6000K — enough to show where a path goes rather than enough to read by, which is about right for something that has to last the evening on a day's sunshine. All three heads point down, so it marks a drive or a path edge without shining into a window.",
        ],
      },
      {
        heading: "Replaceable AA Battery",
        paragraphs: [
          "It runs on an AA battery you can replace, which matters more than it sounds — a sealed solar light is scrap the first time its cell stops holding charge.",
        ],
      },
      {
        heading: "Weather Rating and Materials",
        paragraphs: [
          "Rated IP44, so rain from any direction is fine. The post is polypropylene and ABS rather than metal, which means there's nothing in it to rust and nothing to touch up at the end of the season.",
        ],
      },
      {
        heading: "Assembly and Standing It Steady",
        paragraphs: [
          "It arrives flat and needs assembling. At 5.6kg empty it's light, so fill the planter with compost and something growing before you decide it's steady enough for an exposed corner.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-860-025",
    title: "8-Seater Rattan Corner Dining Set with Footstool, Black | Kaiku",
    summary:
      "An eight-seater rattan corner set — two corner sofas with arms, one armless corner sofa, a coffee table and two footstools — on powder-coated steel with a PE rattan weave and a tempered glass tabletop. 55kg all in, with each seat rated to 110kg.",
    sections: [
      {
        heading: "What's in the Set",
        paragraphs: [
          "Two corner sofas with arms, one armless corner sofa, a coffee table and two footstools. It arrives in three boxes with an instruction manual and needs assembling.",
        ],
      },
      {
        heading: "Frame, Weave and Cushions",
        paragraphs: [
          "A powder-coated steel frame wrapped in PE rattan. That's a synthetic weave, so it won't soften, split or go brittle in the rain the way natural cane does. The cushions are polyester with zip-off covers that go in the wash.",
        ],
      },
      {
        heading: "Piece Sizes",
        paragraphs: [
          "Each corner section is 110.5 x 62 x 82cm, so you can set the arrangement out as an L or a U depending on the corner you've got. The coffee table is 120.5 x 70.5cm at 65cm high with a tempered glass top, and the footstools are 40 x 40 x 35cm — they tuck under the table or make up two extra seats.",
        ],
      },
      {
        heading: "Leaving It Out, and the Cushions",
        paragraphs: [
          "The frame and weave are waterproof, so the furniture itself can stay out. The cushions are the part to think about: get them somewhere dry when they're not in use and they'll last years longer than they will living outside.",
        ],
      },
      {
        heading: "Weight Limits, Care and Delivery",
        paragraphs: [
          "Each sofa seat takes up to 110kg, and the set weighs 55kg in total. Wipe the weave with a dry cloth and unzip the covers to wash them. Delivered within 7–14 days.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-867-154v00gy",
    title: "Rattan Solar Floor Lantern, Grey | Kaiku",
    summary:
      "A solar floor lantern in grey PE rattan woven over a steel frame, 20 x 20cm and 68cm tall, weighing 2.5kg. It's rated for outdoor use and charges through the day with no cable to run.",
    sections: [
      {
        heading: "A Lantern at Seated Height",
        paragraphs: [
          "68cm tall on a 20cm square footprint, which puts the light at about the height of a low table — below the eyeline of anyone sitting down, which is where garden light does its best work. A lantern at seated height lights faces and table tops; the same lantern up on a wall lights nobody.",
        ],
      },
      {
        heading: "Steel Frame, PE Rattan Weave",
        paragraphs: [
          "The weave is PE rattan over a steel frame — a synthetic, so it won't soften in the rain, and the grey takes sun without going patchy the way a natural fibre would. It's rated for outdoor use, so it can live outside rather than being carried in and out.",
        ],
      },
      {
        heading: "Solar Charging and Where to Stand It",
        paragraphs: [
          "It charges through the day and lights itself at dusk, so there's no cable and nothing to plug in. That freedom is also the constraint: it has to spend its daylight hours somewhere the sun actually reaches, which isn't always where you want it once it's dark.",
        ],
      },
      {
        heading: "Moving It, and Why Two Beat One",
        paragraphs: [
          "At 2.5kg it's a one-handed carry, so shifting it about costs nothing. Two or three at different points along a path or a border read far better than one on its own — a single source at ground level makes one pool of light and leaves everything around it darker by comparison.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-b31-087",
    title: "Spiral Raindrop Crystal Chandelier, Silver | Kaiku",
    summary:
      "A small crystal chandelier, 20cm across with a fixed 48cm drop, in electroplated silver metal with spiralled crystal droplets. It takes one GU10 bulb up to 50W, hard-wires to a ceiling point and weighs 1.4kg.",
    sections: [
      {
        heading: "Small Enough for a Stairwell",
        paragraphs: [
          "20cm across with a 48cm drop, which makes it one of the smaller crystal pendants going and puts it somewhere a larger fitting can't go — the turn of a staircase, a narrow hall, a cloakroom, or beside a bed instead of a lamp. The droplets hang in a spiral rather than a ring, so it reads differently as you move round it, which is worth more in a space you pass through than one you sit still in.",
        ],
      },
      {
        heading: "The Drop Is Fixed",
        paragraphs: [
          "Installed height is fixed at 48cm rather than adjustable, so work out the position before it goes up. On a stairwell that means measuring clearance from the step below it, not from the floor.",
        ],
      },
      {
        heading: "Bulb and Dimming",
        paragraphs: [
          "One GU10 bulb up to 50W, not included, and it'll take a dimmable bulb if the circuit has a dimmer on it. A single source behind cut crystal is what scatters the light — the droplets do the work, not the wattage.",
        ],
      },
      {
        heading: "Wiring and Fixing",
        paragraphs: [
          "It's mains-wired to a ceiling point with a push-button switch, so getting it connected is a job for a qualified electrician. At 1.4kg it's light for a crystal fitting, which keeps the ceiling fixing straightforward.",
        ],
      },
      {
        heading: "Standards and Indoor Use",
        paragraphs: [
          "Marked to CE, UKCA and RoHS, and rated for indoor use — so not one for a bathroom.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-b31-300",
    title: "Eight-Light Crystal Pendant Chandelier, Silver | Kaiku",
    summary:
      "An eight-light crystal chandelier in steel and crystal with a silver-tone finish, 50cm across and 16cm deep. It takes eight G9 bulbs up to 40W each, hard-wires at 230V and weighs 6kg.",
    sections: [
      {
        heading: "Eight Bulbs, and Why That Matters",
        paragraphs: [
          "Eight G9 bulbs at up to 40W each, and none of them are included — so budget for eight when you order. Spreading the output across eight sources is what makes cut crystal catch light right across the fitting instead of lighting one side and leaving the other flat.",
        ],
      },
      {
        heading: "Diameter, Depth and Drop",
        paragraphs: [
          "50cm across but only 16cm deep on the body itself, with the cable shortened when it's installed — so it can hang low over a dining table or be pulled up tight in a hall.",
        ],
      },
      {
        heading: "Wiring and Ceiling Fixing",
        paragraphs: [
          "Hard-wired at 230V with no plug, so a qualified electrician should make the connection. At 6kg it needs a proper fixing rather than a hook: the box includes a cross hanging board, screws and wall plugs, along with gloves and a fitting manual.",
        ],
      },
      {
        heading: "Materials and Finish",
        paragraphs: ["Steel and crystal, polished to a silver tone."],
      },
      {
        heading: "Indoor Use and Cleaning",
        paragraphs: [
          "Rated indoor only, so not a bathroom fitting. Dust the crystal with a soft dry cloth and keep abrasive cleaners away from it — once the surface is scratched the crystal stops catching light properly and there's no undoing it.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-b31-573v00bk",
    title: "Three-Light Crystal Semi-Flush Ceiling Light | Kaiku",
    summary:
      "A black metal and crystal semi-flush ceiling light, 39cm across and 32cm tall. It takes three E14 bulbs up to 40W each, hard-wires to a ceiling point and weighs 2kg.",
    sections: [
      {
        heading: "Semi-Flush, for an Ordinary Ceiling",
        paragraphs: [
          "It mounts close to the ceiling rather than hanging from a chain or a rod, so at 32cm deep it works under a standard ceiling where a pendant would be in the way — a hallway, a landing, a bedroom. 39cm across, so it reads as a light fitting rather than a centrepiece.",
        ],
      },
      {
        heading: "Three Bulbs Behind Crystal",
        paragraphs: [
          "Three E14 bulbs at up to 40W each, not included. Three sources rather than one is what lights crystal evenly; a single bulb leaves half the fitting dark.",
        ],
      },
      {
        heading: "Black Frame, Crystal Detail",
        paragraphs: [
          "A black metal frame with crystal detailing. The dark frame keeps the metalwork quiet so the crystal is the part you notice, which is the opposite of how a chrome fitting behaves.",
        ],
      },
      {
        heading: "Wiring and Weight",
        paragraphs: [
          "Hard-wired with no plug, so it needs connecting by a qualified electrician. At 2kg it's light enough to go onto a plasterboard ceiling with an appropriate fixing rather than needing to land on a joist.",
        ],
      },
      {
        heading: "Cleaning and Delivery",
        paragraphs: [
          "Dust the crystal and the frame with a soft dry cloth and keep abrasives off it. The box holds the light and a manual. Delivered within 7–14 days.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-b31-573v01sr",
    title: "Crystal Semi-Flush Chandelier, Silver | Kaiku",
    summary:
      "A silver-tone crystal semi-flush ceiling light, 29cm across and 32cm deep. It takes three E14 bulbs up to 40W each, hard-wires with no plug and weighs 1.6kg.",
    sections: [
      {
        heading: "A Crystal Fitting That Fits Under a Normal Ceiling",
        paragraphs: [
          "29cm across and 32cm deep. A semi-flush fitting sits close to the ceiling instead of hanging on a chain, which is what lets a crystal light work in a room with a standard 240cm ceiling — a full chandelier at that height is something you duck under.",
        ],
      },
      {
        heading: "Bulbs",
        paragraphs: [
          "Three E14 bulbs at up to 40W each, not included. Three sources rather than one is what lights crystal evenly — a single bulb leaves half the shade dark.",
        ],
      },
      {
        heading: "Frame and Finish",
        paragraphs: [
          "The metal frame is silver-toned and deliberately plain, so the crystal shade is the piece and the fitting holding it isn't competing with it.",
        ],
      },
      {
        heading: "Wiring, Weight and Assembly",
        paragraphs: [
          "There's no plug — it wires to a ceiling point, so an electrician should connect it, and there's some assembly to do before it goes up. At 1.6kg it's light enough for a plasterboard ceiling with the right fixing rather than needing a joist. The box holds the light and a manual.",
        ],
      },
      {
        heading: "Indoor Use",
        paragraphs: [
          "Rated for indoor use, so it isn't one for a bathroom or a porch.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-b31-596v00og",
    title: "Tiffany Style Semi-Flush Ceiling Light, Three-Light | Kaiku",
    summary:
      "A semi-flush ceiling light with a stained glass shade in orange and white, set into copper and metal. 34cm across and 50cm deep, it takes three E27 bulbs up to 40W each and weighs 2.7kg.",
    sections: [
      {
        heading: "Stained Glass, and the Light It Makes",
        paragraphs: [
          "34cm across and 50cm deep, with a shade of stained glass in orange and white set into copper and metal. Coloured glass does something no clear fitting does: it tints the light itself, so the room takes on the warmth of the shade rather than only the brightness of the bulb. That makes it a fitting for a room you want to feel warm in rather than one you need to see clearly in — a snug, a landing, a dining room in the evening.",
        ],
      },
      {
        heading: "Bulbs and Colour Temperature",
        paragraphs: [
          "Three E27 sockets, each up to 40W, and no bulbs supplied. Stained glass absorbs a good deal of what passes through it, so this is a fitting that wants all three rather than two. Keep them warm-toned — a cool bulb behind orange glass turns the colour muddy.",
        ],
      },
      {
        heading: "Mounting and Depth",
        paragraphs: [
          "Semi-flush, so it sits close to the ceiling instead of hanging on a chain. It's still 50cm deep, though, so it wants a bit of height above it — better on a landing or over a table than in a low hallway.",
        ],
      },
      {
        heading: "Wiring",
        paragraphs: [
          "Hard-wired with no plug, so connecting it is a job for a qualified electrician.",
        ],
      },
      {
        heading: "Indoor Use, Weight and Delivery",
        paragraphs: [
          "Rated for indoor use only. It weighs 2.7kg. Delivered within 7–14 days.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-b31-634v00bk",
    title: "Dimmable LED Flush Ceiling Light with Remote, Black | Kaiku",
    summary:
      "A flush-mounted LED ceiling light, 70 x 30cm and only 7cm deep, in steel and plastic with a black finish. It dims from 10 to 100 per cent and shifts from 3000K to 6000K on the remote; 43W and 1.4kg.",
    sections: [
      {
        heading: "Flush, for a Ceiling with No Height to Give",
        paragraphs: [
          "70cm long, 30cm wide and only 7cm deep. That last figure is the one that matters: a flush fitting sits against the ceiling rather than hanging from it, which is what makes it usable in a low room, a loft conversion, or anywhere a pendant would get walked into. The rectangular shape suits a rectangular room better than a round fitting does — over a bed, along a hallway, or above a run of worktop, where a circle lights the middle and leaves the ends dim.",
        ],
      },
      {
        heading: "Colour Temperature and Dimming on the Remote",
        paragraphs: [
          "The LEDs are built in and shift between 3000K and 6000K from the remote, with brightness from 10 to 100 per cent. That's a genuinely useful range: 3000K is the warm domestic setting for an evening, 6000K a cold working light for a utility room or a garage. One fitting covers what would otherwise take two.",
        ],
      },
      {
        heading: "Room Size and Power",
        paragraphs: [
          "It draws up to 43W and is intended for rooms of roughly 5 to 30 square metres. At the top of that range treat it as one of several sources rather than the only one — a single ceiling fitting flattens a big room however good it is.",
        ],
      },
      {
        heading: "Materials, Fixing and What's Supplied",
        paragraphs: [
          "Steel and plastic, 1.4kg, indoor use, and it hard-wires to a standard ceiling point — so an electrician should make the connection. The remote comes with it, along with a manual.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-01",
    title: "Reclaimed Teak Sideboard Console Table with 6 Drawers | Kaiku",
    summary:
      "A reclaimed solid teak sideboard with six drawers and two open shelves, 180 x 60 x 80cm and 60kg. Handcrafted in Bali from timber taken out of retired Indonesian fishing boats, and delivered fully assembled.",
    sections: [
      {
        heading: "Where the Timber Comes From",
        paragraphs: [
          "Reclaimed solid teak out of retired Indonesian fishing boats, worked by hand in Bali. Because every board has had a previous life, no two sideboards come out the same — grain, colour and texture all vary, and that's the material rather than a fault to report.",
        ],
      },
      {
        heading: "Six Drawers and Two Shelves",
        paragraphs: [
          "Six drawers across the front, with two large open shelves below for baskets, books or serving dishes. It's the sort of storage that swallows the things a dining room or hallway collects.",
        ],
      },
      {
        heading: "Size, Weight and Getting It In",
        paragraphs: [
          "180cm long, 60cm deep and 80cm high, which is a wall's worth of furniture. It weighs 60kg and arrives fully assembled — so it can't be taken apart to get it round a tight turn. Measure your doorways, and have a second person there on delivery day, because 60kg is not a solo lift.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust it with a soft cloth and wipe spills off promptly. Keep harsh chemical cleaners away from the timber and don't let it stand in damp for long periods. There's no manufacturer's warranty with it — reclaimed timber moves and varies, and that isn't treated as a fault — though your statutory rights still apply.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-02",
    title: "Reclaimed Teak Console Table with 3 Drawers | Kaiku",
    summary:
      "A reclaimed solid teak console table with three drawers, 150 x 45 x 80cm and 37kg. Handcrafted in Bali from timber taken out of retired Indonesian fishing boats.",
    sections: [
      {
        heading: "Where the Timber Comes From",
        paragraphs: [
          "Reclaimed solid teak out of retired Indonesian fishing boats, worked by hand in Bali. Every board has had a previous life, so grain, colour and markings vary from table to table — that's the material, not a defect.",
        ],
      },
      {
        heading: "Three Drawers, and a Depth That Suits a Hallway",
        paragraphs: [
          "45cm deep is the figure to look at: narrow enough to sit along a hall or behind a sofa without catching everyone who walks past. The three drawers take keys, post, chargers and table linen — the things that otherwise pile up on the top.",
        ],
      },
      {
        heading: "Size and Weight",
        paragraphs: [
          "150cm long, 45cm deep, 80cm high, weighing 37kg. That's a two-person lift, so have help ready when it arrives.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Depending on how it's delivered there may be a small amount of assembly — it's quick when there is.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust with a soft cloth and wipe spills away promptly. Keep harsh cleaning products off it, and don't let it sit in damp. It comes without a manufacturer's warranty, though your statutory rights still apply.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-07",
    title: "Reclaimed Teak Dining Table 180cm | Kaiku",
    summary:
      "A reclaimed solid teak dining table seating six to eight, 180 x 77 x 80cm and 40kg. Handcrafted in Bali from timber taken out of retired Indonesian fishing boats.",
    sections: [
      {
        heading: "Where the Timber Comes From",
        paragraphs: [
          "Reclaimed solid teak out of retired Indonesian fishing boats, worked by hand in Bali. Grain, colour and markings vary from table to table because every board has had a previous life — it's the point of the material rather than a flaw in it.",
        ],
      },
      {
        heading: "Seating Six to Eight",
        paragraphs: [
          "180cm of length puts three chairs down each side, or six down the sides and one at each end when you need to squeeze more in. At 77cm across there's room for plates down both sides and serving dishes up the middle without anyone eating off the edge.",
        ],
      },
      {
        heading: "Size and Weight",
        paragraphs: [
          "180 x 77cm with the top at 80cm, weighing 40kg — a two-person lift, so line up help for the day it arrives.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "There may be a small amount of assembly depending on the delivery method, and it's quick when there is.",
        ],
      },
      {
        heading: "Looking After the Top",
        paragraphs: [
          "Dust with a soft cloth and wipe spills off promptly. Use coasters and placemats — a wet glass or a hot pan left standing on solid timber will mark it. Keep harsh chemical cleaners away and don't leave it in prolonged damp. There's no manufacturer's warranty, though your statutory rights still apply.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-08",
    title: "Reclaimed Teak Six Shelf Display Unit with Castors | Kaiku",
    summary:
      "A reclaimed solid teak display unit with six open shelves on castors, 79cm wide, 37cm deep and 180cm tall, weighing 40kg. Handcrafted in Bali and delivered fully assembled.",
    sections: [
      {
        heading: "Where the Timber Comes From",
        paragraphs: [
          "Reclaimed solid teak out of retired Indonesian fishing boats, worked by hand in Bali. Grain, colour and texture vary shelf to shelf, which is what you're buying rather than something gone wrong.",
        ],
      },
      {
        heading: "Six Shelves in a 37cm Footprint",
        paragraphs: [
          "180cm tall on a depth of only 37cm, so it takes height rather than floor — which is what makes it work in a room that's already full. Six open shelves for books, plants, baskets and the things that need to be to hand.",
        ],
      },
      {
        heading: "Castors",
        paragraphs: [
          "It's fitted with castors, so it rolls out to clean behind and can be repositioned without emptying it first. With 40kg of unit plus whatever's on the shelves, it moves far more easily on a hard floor than on deep carpet.",
        ],
      },
      {
        heading: "Size, Weight and Delivery",
        paragraphs: [
          "79cm wide, 37cm deep, 180cm tall, 40kg, and it arrives fully assembled. That last part is worth planning for: check your doorways and any stair turns, because a built 180cm unit can't be flat-packed to get it in.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust with a soft cloth and wipe spills promptly. Keep harsh cleaning products off it and don't let standing water sit on a shelf. No manufacturer's warranty, though your statutory rights still apply.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-11",
    title: "Small Reclaimed Teak Coffee Table | Kaiku",
    summary:
      "A small reclaimed solid teak coffee table with a lower shelf, 81 x 49 x 41cm and 12.4kg. Handcrafted in Bali from timber taken out of retired Indonesian fishing boats, and delivered fully assembled.",
    sections: [
      {
        heading: "Where the Timber Comes From",
        paragraphs: [
          "Reclaimed solid teak out of retired Indonesian fishing boats, worked by hand in Bali. Grain and colour vary from table to table because every board has had a previous life.",
        ],
      },
      {
        heading: "Two Levels in a Small Footprint",
        paragraphs: [
          "The top is 81 x 49cm with a shelf below it, and that shelf is what makes the small footprint work — magazines, remotes and books live down there instead of covering the top.",
        ],
      },
      {
        heading: "Height Against a Sofa",
        paragraphs: [
          "41cm high, a shade below the seat height of most sofas, which is the right height to put a mug down or pick one up without getting to your feet.",
        ],
      },
      {
        heading: "Weight and Delivery",
        paragraphs: [
          "12.4kg, so most people can shift it on their own, though it's easier with a hand. It arrives fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust with a soft cloth and wipe spills off promptly. Keep harsh chemical cleaners away and don't leave it standing in damp. No manufacturer's warranty, though your statutory rights still apply.",
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
  const results: { id: string; title: string; found: boolean }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const written of REWRITES) {
    const doc = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{_id}`,
      { id: written.id },
    );
    results.push({ id: written.id, title: written.title, found: !!doc });
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

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-rewrite-descriptions-aw-aosom-batch2.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

if (!process.env.KAIKU_COPY_LINT) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
