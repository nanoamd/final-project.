/**
 * Damien: "completely rewrite every single description to be just as good as
 * the sauna and cold plunge descriptions" — and "not too smart it looks ai.
 * humanize it keep that same raw feel from the originals".
 *
 * Batch 1 of the AW Dropship / Aosom description rewrite: the first 15 Aosom
 * products in the work queue (scripts/list-description-work-queue.ts
 * --supplier Aosom --facts) — one chandelier, seven desks and seven beds.
 * All were tier THIN: they had headings but under 140 words, and read as a
 * clipped spec dump — every fact stated, no fact given a consequence.
 *
 * Every sentence is built from that document's own `dimensions`, `weight`,
 * `specs`, `faqs` and the factual physical detail already carried in its old
 * description (slat counts, gas-lift and hydraulic mechanisms, USB port
 * counts, drawer interiors, knee space, folded thickness). Nothing invented:
 * where a fact isn't in the source the section simply doesn't exist, rather
 * than a sentence admitting the gap. Two corrections made on the way:
 * 836-263gy's old copy read the 20kg *item weight* as a drawer rating (it
 * isn't — no drawer rating is recorded, so that claim is gone), and the
 * chandelier's 4.5kg is now given its consequence (ceiling fixing) instead
 * of sitting in a bare dimensions line.
 *
 * Delivery lead times are only stated where the product's own document
 * already carried one.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-aw-aosom-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-aw-aosom-batch1.ts --apply
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
    id: "product-aosom-02-0302",
    title: "Glass Droplet Pendant Chandelier, Chrome | Kaiku",
    summary:
      "A crystal and stainless steel pendant chandelier with a polished chrome finish, 30cm across with a 120cm drop. It takes one GU10 bulb up to 50W, hard-wires to a ceiling rose and weighs 4.5kg.",
    sections: [
      {
        heading: "Wiring, Switch and Bulb",
        paragraphs: [
          "This one hard-wires to a ceiling rose rather than plugging into a socket, so it's a job for a qualified electrician unless you're competent with mains lighting yourself. It runs off a push-button switch and takes a single GU10 bulb up to 50W — the bulb isn't included, so order one at the same time or it'll sit in the box.",
        ],
      },
      {
        heading: "Drop Height and Ceiling Fixing",
        paragraphs: [
          "It hangs 120cm from the ceiling as supplied and the drop is shortened when it's fitted, so it works over a dining table or down a stairwell as well as in a room with normal ceilings. The shade is 30cm across. At 4.5kg it needs to go into something solid — a joist or a proper fixing, not plasterboard on its own.",
        ],
      },
      {
        heading: "Crystal and Chrome",
        paragraphs: [
          "Crystal droplets on a stainless steel frame with a polished chrome finish.",
        ],
      },
      {
        heading: "Indoor Rating",
        paragraphs: [
          "It's rated for indoor use only, so it isn't one for a bathroom or a covered porch.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "The box holds the light and an installation manual, and it needs putting together before it goes up. Delivered within 7–14 days.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-831-804v70cw",
    title: "4ft6 Double Ottoman Bed with Front Drawer, Cream | Kaiku",
    summary:
      "A 4ft6 double ottoman bed in cream, built on eucalyptus wood with polyester upholstery and a two-level headboard. Gas-lift under-bed storage plus a wheeled front drawer, 140 x 193.5cm overall and rated to 500kg.",
    sections: [
      {
        heading: "Gas Lift and the Front Drawer",
        paragraphs: [
          "The gas-lift mechanism raises the whole mattress platform, so what you get underneath is the full 140 x 193.5cm footprint of the bed rather than a couple of drawers — spare duvets, suitcases and out-of-season bedding all go in flat. The front drawer runs on wheels and gives you 86 x 40 x 15cm you can reach without lifting anything, which is where the everyday things tend to end up.",
        ],
      },
      {
        heading: "Frame, Upholstery and Headboard",
        paragraphs: [
          "Eucalyptus wood with a powder-coated finish, upholstered in polyester. The headboard is 140cm wide with a velvet-feel finish and sets at two heights, taking the bed to either 95cm or 104cm overall.",
        ],
      },
      {
        heading: "Mattress Size and Weight Limit",
        paragraphs: [
          "It takes a standard UK 4ft6 double mattress, 135 x 190cm, which isn't included. Weight capacity is 500kg.",
        ],
      },
      {
        heading: "Assembly and Getting It Upstairs",
        paragraphs: [
          "It arrives flat-packed in two cartons and needs building. Build it in the room it's going to live in — once the gas struts are on, it isn't going round a tight landing.",
        ],
      },
      {
        heading: "Care and Delivery",
        paragraphs: ["Wipe with a dry cloth. Delivered within 3–4 weeks."],
      },
    ],
  },
  {
    id: "product-aosom-836-046wt",
    title: "Modern Writing Desk with Storage Shelf, White Wood Grain | Kaiku",
    summary:
      "A 90 x 50 x 74cm writing desk in white wood grain, made from laminated particle board with a 1.5cm top and an 85 x 33 x 10cm shelf underneath. It holds up to 80kg.",
    sections: [
      {
        heading: "Desk Size and Where It Fits",
        paragraphs: [
          "90cm wide and only 50cm deep, so it'll sit against a wall in a bedroom or spare room without taking over the floor. The top is at 74cm, which is standard desk height and works with most office chairs.",
        ],
      },
      {
        heading: "The Shelf Underneath",
        paragraphs: [
          "An open shelf runs under the desk at 85 x 33cm with 10cm of clearance — fine for a laptop, a keyboard laid flat or a row of files, not deep enough for a printer.",
        ],
      },
      {
        heading: "Top, Finish and Load",
        paragraphs: [
          "Particle board with an engineered wood top in a laminated white wood grain finish, 1.5cm thick. The 80kg capacity means two monitors and a desktop tower won't trouble it.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "It comes flat-packed with an assembly manual and it's a one-person build.",
        ],
      },
      {
        heading: "Cleaning and Delivery",
        paragraphs: [
          "Wipe it with a dry cloth. Water sitting on a laminated top gets into the edges eventually, so keep a wet cloth off it. Delivered within 7–14 days.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-836-068v02bk",
    title: "Computer Desk with Three Shelves and Drawers, Black | Kaiku",
    summary:
      "A 120 x 49 x 72cm computer desk in black, made from melamine-finished particle board with three open shelves and a drawer. It weighs 22kg and takes up to 20kg on top.",
    sections: [
      {
        heading: "Desk Size and Layout",
        paragraphs: [
          "120cm wide by 49cm deep, with the top at 72cm. The shallow depth is what makes it work in a small room, though it does mean a deep monitor stand will hang over the back edge.",
        ],
      },
      {
        heading: "Shelves and Drawer",
        paragraphs: [
          "Three open shelves, each 36.5 x 24 x 21.5cm — paperbacks, a router, box files on their side. The drawer's interior is 28.5cm square and 10cm deep, which is pens, cables and notebooks rather than files standing up.",
        ],
      },
      {
        heading: "Top, Finish and Load Limit",
        paragraphs: [
          "Particle board with a melamine finish and a black laminated top, 1.5cm thick. The 20kg limit is worth reading before you load it up: a monitor and a laptop is well within it, a heavy all-in-one plus a printer isn't.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "It ships flat-packed in one carton with a manual and needs assembling. At 22kg built, unpack it where you want it rather than carrying it through afterwards. Wipe with a dry cloth.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: ["Delivered within 7–14 days."],
      },
    ],
  },
  {
    id: "product-aosom-836-263gy",
    title: "Computer Desk with Sliding Keyboard Tray, Grey | Kaiku",
    summary:
      "A grey computer desk in E1 grade particle board with a melamine finish, with a 67.3 x 25cm sliding keyboard tray and a tall drawer. 100 x 40 x 86.6cm, and it weighs 20kg.",
    sections: [
      {
        heading: "Desk Height and the Keyboard Tray",
        paragraphs: [
          "The top sits at 86.6cm, higher than the usual 75cm, and the sliding tray pulls out below it at 67.3 x 25cm — so your hands work at a normal typing height while the top stays free for a monitor. Push the tray back in and the whole thing is 40cm deep, which is what lets it go in a hallway or an alcove.",
        ],
      },
      {
        heading: "Drawer Space",
        paragraphs: [
          "The drawer interior is 23cm wide, 37.8cm deep and 31.2cm high — unusually tall for a desk drawer, so lever-arch files and paper stand upright in it instead of lying flat.",
        ],
      },
      {
        heading: "Materials and Load",
        paragraphs: [
          "E1 grade particle board with a melamine finish. E1 is a low formaldehyde emission class, which matters if the desk is going in a bedroom. The desk is rated to 50kg all in and weighs 20kg itself.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "One flat-packed carton with an installation manual; one person can do it.",
        ],
      },
      {
        heading: "Care and Delivery",
        paragraphs: [
          "Wipe with a damp cloth, then go over it with a dry one — don't leave melamine wet. Delivered within 2–3 weeks.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-836-296cg",
    title: "Folding Convertible Desk with Blackboard, Grey | Kaiku",
    summary:
      "A folding desk in grey painted MDF that shuts away into a nine-compartment bookcase, with a chalkboard on the front panel. 153cm high x 98cm wide x 51cm deep, 21kg, rated to 60kg.",
    sections: [
      {
        heading: "How It Folds Away",
        paragraphs: [
          "The work surface drops down out of the unit and folds back up when you've finished, so the desk disappears into a 51cm-deep bookcase against the wall at the end of the day. Open, you get 78.5 x 47.5cm to work on; the front panel is a chalkboard, so it doesn't look like a shut desk when it's closed.",
        ],
      },
      {
        heading: "Storage and Knee Space",
        paragraphs: [
          "Nine compartments in the bookcase, with a cabinet interior 48cm across. With the desk down there's 75cm of knee height and 98cm of width, so a normal dining or office chair pulls under it properly.",
        ],
      },
      {
        heading: "Load Limits",
        paragraphs: [
          "60kg across the whole unit and 50kg on the tabletop itself.",
        ],
      },
      {
        heading: "Assembly and Wall Fixing",
        paragraphs: [
          "One box, flat-packed. A screwdriver helps but the tools you need are in the box, along with fixings to anchor it to the wall. At 153cm tall with a folding front, we'd fix it to the wall — particularly with children or pets in the house.",
        ],
      },
      {
        heading: "Materials, Care and Delivery",
        paragraphs: [
          "MDF with a painted finish, on a particleboard carcass with metal hinges taking the folding load. Wipe with a dry cloth. Delivered within 2–3 weeks.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-836-410v00gy",
    title: "Compact Computer Desk with Keyboard Tray, Grey | Kaiku",
    summary:
      "A compact grey computer desk, 80 x 45 x 75cm, in E1 grade particle board with a melamine finish. It has a 46cm sliding keyboard tray and a shallow drawer, and holds up to 50kg.",
    sections: [
      {
        heading: "Footprint",
        paragraphs: [
          "80cm wide and 45cm deep, which is small enough for a box room, a landing or the corner of a bedroom. The top is at 75cm, standard desk height.",
        ],
      },
      {
        heading: "Keyboard Tray and Drawer",
        paragraphs: [
          "The keyboard tray slides out under the top at 46 x 30cm, so the desk surface stays clear for a monitor and the keyboard goes away when you're not using it. The drawer interior is 18.5 x 28cm and only 6.5cm deep, and it's rated to 3kg — pens, a mouse, a notebook, not a stack of hardbacks.",
        ],
      },
      {
        heading: "Materials and Load",
        paragraphs: [
          "E1 grade particle board with a melamine finish. E1 is a low formaldehyde emission class, worth knowing if it's going in a child's room. The desk takes 50kg in total.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "It ships in one box with a manual, and one person is all it needs.",
        ],
      },
      {
        heading: "Care and Delivery",
        paragraphs: [
          "Wipe with a damp cloth and keep harsh chemicals away from the melamine — they'll dull it. Delivered within 7–14 days.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-836-580v00rb",
    title: "Compact Folding Desk with Storage Shelf, Rustic Brown | Kaiku",
    summary:
      "A folding desk in rustic brown, with a maple wood-effect particleboard top on an X-braced steel frame and a shelf above. 86 x 66 x 82cm open, 4.5cm flat, 10kg, and rated to 20kg.",
    sections: [
      {
        heading: "Folding It Flat",
        paragraphs: [
          "It folds down to 4.5cm thick and weighs 10kg, so one person can carry it and slide it behind a wardrobe or down the side of a sofa between uses. Nothing to unscrew — the X-frame collapses.",
        ],
      },
      {
        heading: "Work Surface, Shelf and Knee Space",
        paragraphs: [
          "The work surface is 80 x 51cm with the top at 82cm, a bit higher than a standard desk. Knee space is 69cm high, 73.5cm wide and 66cm deep. The shelf above runs 80cm long but only 15cm deep, so it's for books, a speaker or a monitor on a stand rather than anything bulky.",
        ],
      },
      {
        heading: "Frame and Load Limits",
        paragraphs: [
          "Particleboard with a maple wood-effect laminated top, on an X-shaped steel frame with reinforced bottom bars. Total capacity is 20kg — 15kg on the top and 5kg on the shelf, which rules out a heavy printer.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "One carton, flat-packed, with a manual. Wipe with a dry cloth.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: ["Delivered within 2–3 weeks."],
      },
    ],
  },
  {
    id: "product-aosom-836-668v01nd",
    title: "Folding Wall-Mounted Work Table, Natural | Kaiku",
    summary:
      "A four-tier bookshelf with a fold-down work table, in a natural wood-effect finish on a powder-coated steel frame. 105 x 60 x 127cm with the table down, and rated to 80kg.",
    sections: [
      {
        heading: "Table Down, Table Up",
        paragraphs: [
          "The table folds down off the front of the unit to give an 80 x 56.8cm work surface, and folds back flat when you're done — at which point the whole thing takes up 30 x 60cm of floor and stands 127cm tall. That's the point of it: a desk when you need one, a bookcase the rest of the time.",
        ],
      },
      {
        heading: "Shelving",
        paragraphs: [
          "Four tiers of open shelving above and below the folding table.",
        ],
      },
      {
        heading: "Frame, Feet and Load",
        paragraphs: [
          "Particleboard shelves in a natural and white wood-effect on a powder-coated steel frame, with adjustable feet. Level the feet properly before you use it — the table folds against the frame, so a unit sitting out of true on an uneven floor won't sit flush. Capacity is 80kg; the unit weighs 21kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "It ships flat-packed in one box with an assembly manual. Wipe with a dry cloth.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: ["Delivered within 2–3 weeks."],
      },
    ],
  },
  {
    id: "product-aosom-83a-218v00nd",
    title: "6-Seater Garden Dining Set with Stackable Chairs | Kaiku",
    summary:
      "A six-seater garden dining set — one 160 x 85cm table and six stackable armchairs — in aluminium with wood-plastic composite slats. 53kg all in, with each chair rated to 120kg.",
    sections: [
      {
        heading: "What's in the Set",
        paragraphs: [
          "One rectangular table and six stackable armchairs, delivered in two packages with an instruction manual. Assembly is required.",
        ],
      },
      {
        heading: "Table Size and Seating",
        paragraphs: [
          "The table is 160cm long by 85cm wide with the top at 75cm — six places round it without anyone fighting for elbow room. Each chair seat is 45cm wide, 44cm deep and 40cm off the ground.",
        ],
      },
      {
        heading: "Aluminium and Composite Outdoors",
        paragraphs: [
          "Aluminium frames don't rust, and the wood-plastic composite slats are UV-protected and weather-resistant, so there's none of the annual oiling or re-staining real timber needs to stay looking like itself. A wipe with a damp cloth is the whole maintenance routine.",
        ],
      },
      {
        heading: "Stacking and Winter Storage",
        paragraphs: [
          "The chairs stack, so all six go into the space of one or two in a shed or garage. We'd get them somewhere dry over winter rather than leaving them out through the worst of it, and any cushions want storing dry.",
        ],
      },
      {
        heading: "Weight Limits and Delivery",
        paragraphs: [
          "The table is rated to 50kg and each chair to 120kg. Combined weight is 53kg. Delivered within 3–4 weeks.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-83d-032v00gy",
    title: "3ft Single Pine Storage Bed with Drawers, Grey | Kaiku",
    summary:
      "A 3ft single storage bed in painted pine, with a slatted base and two wheeled drawers underneath. 197 x 98 x 82cm, for a 90 x 190cm mattress, rated to 120kg.",
    sections: [
      {
        heading: "Frame and Slatted Base",
        paragraphs: [
          "Pine wood with a painted grey finish. The slats support the mattress directly, so there's no separate base to buy and the mattress gets air underneath it rather than sitting on a solid panel.",
        ],
      },
      {
        heading: "The Two Drawers",
        paragraphs: [
          "Two drawers on wheels run under the frame, each 86 x 42cm inside and 12.5cm deep. That depth is the thing to note — folded bedding, spare pillowcases and flat clothes go in fine, anything bulky won't.",
        ],
      },
      {
        heading: "Mattress Size and Weight Limit",
        paragraphs: [
          "It takes a 90 x 190cm UK single mattress, which isn't included. The frame is 98cm across, so it stands a few centimetres wider than the mattress each side, and the headboard takes it to 82cm high. Weight capacity is 120kg.",
        ],
      },
      {
        heading: "Assembly and Room Size",
        paragraphs: [
          "Flat-packed in two cartons with an instruction manual. It's 197cm long once built, so measure the wall before you order — and two people make lining the side rails up much less awkward.",
        ],
      },
      {
        heading: "Care",
        paragraphs: ["Wipe the painted pine down with a dry cloth."],
      },
    ],
  },
  {
    id: "product-aosom-83d-149v72cg",
    title: "King Size Gas-Lift Ottoman Bed with Tufted Headboard | Kaiku",
    summary:
      "A king-size ottoman bed on a metal frame, upholstered in frosted velvet polyester with a button-tufted headboard over high-density foam. 205 x 151 x 106cm for a 150 x 200cm mattress, rated to 500kg.",
    sections: [
      {
        heading: "Gas Lift and Under-Bed Storage",
        paragraphs: [
          "The gas struts lift from the end of the bed and carry most of the mattress weight, so the platform comes up without a fight. Two anti-slip stoppers hold the mattress in place as it rises, and the headboard is closed at the back — so pillows, books and phones stop disappearing down the gap behind it.",
        ],
      },
      {
        heading: "Frame, Velvet and Headboard",
        paragraphs: [
          "A metal frame under frosted velvet polyester in a matte finish, with the headboard button-tufted over high-density foam.",
        ],
      },
      {
        heading: "Size, Mattress and Weight Limit",
        paragraphs: [
          "205cm long by 151cm wide by 106cm high, for a 150 x 200cm mattress that isn't included. The frame itself weighs 49kg and the whole thing is rated to 500kg.",
        ],
      },
      {
        heading: "Assembly and Access",
        paragraphs: [
          "Two cartons, flat-packed, with a manual. At 49kg built it's a two-person job, and it wants building in the bedroom rather than carried in afterwards.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "A dry cloth is the recommended clean, so keep a wet sponge off the velvet.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-83d-185v03cg",
    title:
      "5ft King Bed Frame with Hydraulic Storage and LED Lighting, Grey | Kaiku",
    summary:
      "A 5ft king bed frame in grey linen fabric over metal, with hydraulic under-bed storage, remote-controlled LED lighting in the headboard and built-in USB charging. 157 x 214 x 113cm, rated to 300kg.",
    sections: [
      {
        heading: "Hydraulic Storage",
        paragraphs: [
          "The platform lifts on hydraulic struts to open a compartment 150 x 200cm and 20cm deep. That's the full footprint of the bed rather than a couple of drawers, so suitcases and spare duvets go in flat instead of being wedged in sideways.",
        ],
      },
      {
        heading: "Headboard Lighting and Charging",
        paragraphs: [
          "RGB LED lighting is built into the headboard, seven colours worked from a remote. There's also a charging station in the headboard with two USB-A ports and one USB-C, which means phones charge at the bedside without a trailing extension lead — you'll want a socket within reach of the head of the bed.",
        ],
      },
      {
        heading: "Frame and Headboard Build",
        paragraphs: [
          "Linen fabric over a metal frame, with an engineered wood headboard.",
        ],
      },
      {
        heading: "Size, Mattress and Weight Limit",
        paragraphs: [
          "157cm wide by 214cm long by 113cm high, for a 150 x 200cm mattress that isn't included. It's 14cm longer than the mattress, so allow for that at the foot of the bed. Capacity is 300kg.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Two cartons, flat-packed, with a manual. Wipe with a damp cloth and follow with a dry one.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-83d-219v00bk",
    title: "3ft Single Bed Frame with Headboard and Footboard, Black | Kaiku",
    summary:
      "A 3ft single bed frame in black painted metal, with a diamond-pattern headboard and footboard and snap-in steel slats. 196 x 96 x 88.5cm with 32cm of clearance underneath, rated to 136kg.",
    sections: [
      {
        heading: "Frame and Snap-In Slats",
        paragraphs: [
          "Painted metal throughout. The reinforced slats snap into place without tools, and the fit is designed to stop the creaking that metal frames are known for — worth having on a bed that's going in a room above someone.",
        ],
      },
      {
        heading: "Headboard and Footboard",
        paragraphs: [
          "The headboard is 96 x 88.5cm and the footboard 96 x 60.5cm, both in an open diamond pattern. The footboard means bedding stays put rather than sliding off the end.",
        ],
      },
      {
        heading: "Under-Bed Clearance",
        paragraphs: [
          "32cm of clear space underneath — enough for storage boxes or a suitcase on its side, and enough to get a vacuum head under without moving the bed.",
        ],
      },
      {
        heading: "Mattress and Weight Limit",
        paragraphs: [
          "It takes a 90 x 190cm UK single mattress, which isn't included. The frame is 196 x 96cm, so allow a few centimetres past the mattress on every side if it's going into an alcove. Weight capacity is 136kg.",
        ],
      },
      {
        heading: "Assembly, Care and Delivery",
        paragraphs: [
          "One carton, flat-packed, with a manual. Wipe with a dry cloth. Delivered within 7–14 days.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-83d-220v03bk",
    title: "4ft6 Double Bed Frame with Underbed Storage, Black | Kaiku",
    summary:
      "A 4ft6 double bed frame in black painted metal, with a twelve-slat snap-fit base and no headboard. 190.5 x 135.6 x 32.5cm with 28.5cm of clearance underneath, rated to 272kg.",
    sections: [
      {
        heading: "Slat Base and Frame",
        paragraphs: [
          "Painted metal with twelve reinforced slats that snap together without tools, so the build is quick and there's nothing to work loose and rattle later.",
        ],
      },
      {
        heading: "No Headboard, and What That Means",
        paragraphs: [
          "There's no headboard and the frame stands only 32.5cm tall, so it'll go under a sloping ceiling or in front of a low window where a headboard simply wouldn't fit. If you want one later, a wall-mounted headboard behind it works.",
        ],
      },
      {
        heading: "Storage Underneath",
        paragraphs: [
          "28.5cm of clearance under the frame — deep enough for under-bed boxes and flat storage bags.",
        ],
      },
      {
        heading: "Mattress and Weight Limit",
        paragraphs: [
          "Sized for a standard UK double mattress, 190 x 135cm, not included. The frame is barely larger than the mattress at 190.5 x 135.6cm, so it doesn't eat floor space the way a bed with a surround does. Weight capacity is 272kg.",
        ],
      },
      {
        heading: "Assembly, Floors and Care",
        paragraphs: [
          "One carton, flat-packed, with a manual — no tools needed for the slats. Plastic caps on the feet keep it off bare boards and vinyl. Wipe with a dry cloth.",
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
    "docs/change-log/2026-09-01-rewrite-descriptions-aw-aosom-batch1.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

if (!process.env.KAIKU_COPY_LINT) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
