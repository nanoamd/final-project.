/**
 * D.I. Designs description rewrite — batch 2 of 4. Standard, sources and
 * exclusions: see scripts/rewrite-descriptions-di-batch1.ts.
 *
 * Batch 2: the Bamboo Gesso lamp, the Bentley console, the two Berkeley
 * high-gloss pieces, the two Broadway oak pieces, the Candover sofa, the three
 * Charlton ribbed walnut pieces, the Chilworth bedside, the Easton chest, the
 * two Elmley glass-and-shagreen pieces and the Five console.
 *
 * Two judgement calls worth recording:
 *  - The Elmley grey end table's own FAQ calls its top "a durable clear glass
 *    top designed for everyday residential and commercial use" and never says
 *    tempered, so this copy says "clear glass" and no more. The Elmley IVORY
 *    console's FAQ does say tempered explicitly, so that one gets it, with the
 *    consequence spelled out. Same collection, different evidence.
 *  - The Easton chest has no assembled `weight` on its document at all, only a
 *    55kg packed weight. So the copy gives the packed figure and says what it
 *    means for carrying it in, rather than guessing at an assembled weight or
 *    noting the absence.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-di-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-di-batch2.ts --apply
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
    id: "product-import-bamboo-gesso-lamp",
    title: "Bamboo Gesso Table Lamp | Luxury White Gesso Designer Lamp | Kaiku",
    summary:
      "A table lamp with a white gesso base sculpted into a bamboo form, paired with a fabric shade. 33 x 33 x 63cm and 10kg.",
    sections: [
      {
        heading: "A Gesso Base in a Bamboo Form",
        paragraphs: [
          "The base is gesso, sculpted into a bamboo shape and finished in white. At 10kg it's heavy for a table lamp, which is the useful part — it sits where you put it rather than being dragged about by its own flex.",
        ],
      },
      {
        heading: "The Shade",
        paragraphs: [
          "A fabric shade sits on top, so the light comes out diffused rather than pointed at anything in particular.",
        ],
      },
      {
        heading: "33cm Square, 63cm Tall",
        paragraphs: [
          "33 x 33 x 63cm. The footprint is small enough to leave a bedside table usable — book, glass of water, phone — and the light it gives is warm and ambient rather than task lighting, so it's the lamp you put on in the evening rather than the one you read small print by.",
        ],
      },
      {
        heading: "Buying Two",
        paragraphs: [
          "Plenty of people take two of these and run one either side of a bed, or one at each end of a sideboard or console table.",
        ],
      },
    ],
  },
  {
    id: "product-import-bentley-oak-console-table",
    title:
      "Bentley Grey Aged Oak Console Table | Luxury Oak Console Table | Kaiku",
    summary:
      "A grey aged oak console table with a crossed-leg base and a removable tray on top. 150 x 40 x 80cm and 22kg.",
    sections: [
      {
        heading: "Grey Aged Oak with the Grain Showing",
        paragraphs: [
          "Oak and oak veneer in a grey aged finish, with the natural wood grain left visible rather than filled and painted over.",
        ],
      },
      {
        heading: "The Removable Tray",
        paragraphs: [
          "A tray sits on the top and lifts straight out, so clearing the surface is one movement rather than six, and the tray itself can go to the kitchen to be wiped.",
        ],
      },
      {
        heading: "150cm Long, 40cm Deep",
        paragraphs: [
          "150 x 40 x 80cm. It's long and shallow — 40cm front to back takes a lamp, a bowl and the day's post without pushing out into a hallway you have to walk down.",
        ],
      },
      {
        heading: "Weight and Packed Size",
        paragraphs: [
          "22kg assembled. The carton is around 154 x 44 x 84cm at 25.8kg, which is a long box rather than a heavy one, so it's the corners and the stairwell to think about rather than the lift.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth and wipe spills as they happen. Abrasive cleaning products will take the finish off the oak.",
        ],
      },
    ],
  },
  {
    id: "product-import-berkeley-1-drawer-black-bedside-table",
    title:
      "Berkeley Black 1 Drawer Bedside Table | Luxury High Gloss Bedside Cabinet | Kaiku",
    summary:
      "A high-gloss black bedside table with one drawer, on tapered gold metal legs. MDF construction, 45 x 45 x 60cm and 26kg.",
    sections: [
      {
        heading: "High-Gloss Black Over MDF",
        paragraphs: [
          "MDF with a high-gloss black finish. Gloss gives you depth of colour that a matt finish can't, and in return it shows dust and fingerprints more, so it's a finish that rewards a cloth kept nearby.",
        ],
      },
      {
        heading: "Tapered Gold Metal Legs",
        paragraphs: [
          "The legs are tapered metal in a gold finish, supplied with it as part of the design rather than as an option.",
        ],
      },
      {
        heading: "One Drawer",
        paragraphs: [
          "One drawer, sized for the things that live beside a bed.",
        ],
      },
      {
        heading: "45cm Square, and Heavy at 26kg",
        paragraphs: [
          "45 x 45 x 60cm and 26kg — genuinely heavy for a bedside table, so treat it as a two-person lift up a staircase. The carton is bigger again at roughly 57 x 54 x 73cm.",
        ],
      },
      {
        heading: "Keeping the Gloss Clean",
        paragraphs: [
          "Wipe it regularly with a soft, clean cloth and deal with spills straight away. Nothing abrasive: scratches show on a gloss surface in a way they don't on matt.",
        ],
      },
    ],
  },
  {
    id: "product-import-berkeley-white-console-table",
    title:
      "Berkeley White Console Table | Luxury High Gloss Console Table | Kaiku",
    summary:
      "A white console table in a 50% gloss lacquer, with one drawer, a gold bar handle and tapered gold metal legs. 120 x 35 x 80cm and 38kg.",
    sections: [
      {
        heading: "A 50% Gloss Lacquer",
        paragraphs: [
          "The white finish is a lacquer at 50% gloss — a half-sheen rather than a mirror, so it picks up light without showing every mark the way a full gloss does.",
        ],
      },
      {
        heading: "Gold Legs and a Bar Handle",
        paragraphs: [
          "Tapered gold metal legs, with a matching gold bar handle on the drawer.",
        ],
      },
      {
        heading: "One Drawer on Metal Runners",
        paragraphs: [
          "One drawer, running on metal runners so it keeps sliding properly once there's weight in it.",
        ],
      },
      {
        heading: "35cm Deep for a Narrow Hall",
        paragraphs: [
          "120 x 35 x 80cm. At 35cm front to back it takes up very little of a corridor, which is the whole point of a console table in an entrance hall.",
        ],
      },
      {
        heading: "Legs to Fit, and 38kg to Carry",
        paragraphs: [
          "Minimal assembly: the tapered metal legs go on before use. At 38kg assembled — in a carton around 128 x 46 x 93cm at 45kg — it's a two-person job getting it in.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "A soft microfibre cloth, spills cleaned promptly, and no abrasive cleaners on the lacquer.",
        ],
      },
    ],
  },
  {
    id: "product-import-broadway-chest-of-drawers",
    title: "Broadway Oak Chest of Drawers | Luxury 3 Drawer Oak Chest | Kaiku",
    summary:
      "An oak chest of three drawers in a smoky grey finish, with ribbon-front drawers and a black rear panel. 120 x 50 x 85cm and 53kg, delivered fully assembled.",
    sections: [
      {
        heading: "Oak in a Smoky Grey Finish",
        paragraphs: [
          "Oak, finished in a smoky grey that colours the timber without hiding it — the grain still reads across the fronts.",
        ],
      },
      {
        heading: "Ribbon-Front Drawers",
        paragraphs: [
          "The drawer fronts are shaped in a ribbon detail. It's the thing the Broadway pieces are recognised for, and it's cut into the fronts rather than applied over them.",
        ],
      },
      {
        heading: "The Black Rear Panel",
        paragraphs: [
          "The rear panel is black, against the smoky grey of everything else.",
        ],
      },
      {
        heading: "Three Drawers",
        paragraphs: [
          "Three drawers, each one full-width, for clothing and bedding.",
        ],
      },
      {
        heading: "Delivered Assembled — 53kg on the Day",
        paragraphs: [
          "It arrives fully assembled, so there's nothing to build. It also means 53kg comes through the door in one piece, in a carton around 125 x 55 x 90cm at 60kg. Two people, and measure the doorway first.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth and wipe spills immediately. Harsh chemicals and abrasive cleaners will mark the finish.",
        ],
      },
    ],
  },
  {
    id: "product-import-broadway-one-drawer-bedside-table",
    title:
      "Broadway Oak Bedside Table | Luxury Solid Oak 1 Drawer Bedside Table | Kaiku",
    summary:
      "A solid oak bedside table with one drawer and a geometric panelled drawer front, in a natural oak finish. 55 x 45 x 55cm and 16kg.",
    sections: [
      {
        heading: "Solid Oak, Natural Finish",
        paragraphs: [
          "Solid oak in a natural finish rather than a colour laid over the top, so what you see is the timber itself.",
        ],
      },
      {
        heading: "The Panelled Drawer Front",
        paragraphs: [
          "The drawer front carries a geometric panelled detail, cut in the same oak as the rest of it.",
        ],
      },
      {
        heading: "One Drawer",
        paragraphs: [
          "One drawer, which takes a book, a charger and the rest of the bedside clutter.",
        ],
      },
      {
        heading: "55cm Wide, 55cm Tall",
        paragraphs: [
          "55 x 45 x 55cm — as tall as it is wide, so it reads as a block beside a bed rather than a tall narrow cabinet. 16kg, so one person can carry it, though two is easier on stairs. The carton is around 60 x 50 x 60cm.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth, wipe spills straight away, and keep harsh chemicals and abrasive cleaners off the natural finish.",
        ],
      },
    ],
  },
  {
    id: "product-import-candover-neutral-sofa",
    title:
      "Candover Neutral Upholstered Sofa | Luxury 3 Seater Fabric Sofa | Kaiku",
    summary:
      "A three-seater sofa in neutral fabric with button-tufted back cushions, cylindrical bolster cushions and solid wooden legs. 210.5 x 98 x 84.5cm and 57.5kg, with a 46cm seat height.",
    sections: [
      {
        heading: "Neutral Fabric on Solid Wooden Legs",
        paragraphs: [
          "Upholstered in a neutral fabric and standing on solid wooden legs rather than plastic feet.",
        ],
      },
      {
        heading: "Button-Tufted Backs and Bolster Cushions",
        paragraphs: [
          "The back cushions are button-tufted, and the two cylindrical bolsters come with it — they're part of the sofa rather than a styling extra you have to go and buy.",
        ],
      },
      {
        heading: "Seat Height and Leg Height",
        paragraphs: [
          "The seat sits at 46cm and the legs are 18cm, so there's a real gap underneath — a vacuum head goes under it instead of stopping at a solid base.",
        ],
      },
      {
        heading: "210.5cm Long — Measure the Route In",
        paragraphs: [
          "210.5 x 98 x 84.5cm and 57.5kg, seating three adults. It's packed at roughly 213 x 94 x 55cm, and it's that 94cm width rather than the weight that decides whether it makes the turn at the top of a staircase, so measure before delivery day.",
        ],
      },
      {
        heading: "Looking After the Fabric",
        paragraphs: [
          "Vacuum it regularly with the soft brush attachment. Clean spills promptly with a clean damp cloth, and use an upholstery-specific product where you need something stronger.",
        ],
      },
    ],
  },
  {
    id: "product-import-charlton-2-drawer-walnut-ribbed-bedside-table",
    title:
      "Charlton Ribbed Walnut 2 Drawer Bedside Table | Luxury Walnut Bedside Cabinet | Kaiku",
    summary:
      "A walnut-finished bedside table with two soft-close drawers and horizontal ribbed fronts, in oak, oak veneer and MDF. 45 x 40 x 60cm and 29kg.",
    sections: [
      {
        heading: "Oak, Veneer and MDF in a Walnut Finish",
        paragraphs: [
          "Built from oak, oak veneer and MDF, finished in walnut with the timber grain still showing through the colour.",
        ],
      },
      {
        heading: "Where the Ribbing Comes From",
        paragraphs: [
          "The horizontal ribs are worked into the cabinet's own construction rather than being a decorative panel stuck on the front, which is why the lines carry round rather than stopping at an edge.",
        ],
      },
      {
        heading: "Soft-Close Drawers",
        paragraphs: [
          "Both drawers sit on metal runners with a soft-close push mechanism, so a shove shuts them quietly rather than with a bang. Next to a bed, that's not a small thing.",
        ],
      },
      {
        heading: "45 x 40 x 60cm, and 29kg",
        paragraphs: [
          "45cm wide, 40cm deep, 60cm high — and 29kg, which is heavy for a piece this size, so treat it as a two-person lift. The carton is about 50 x 45 x 65cm.",
        ],
      },
      {
        heading: "Matching Pieces",
        paragraphs: [
          "There's a Charlton chest of drawers and a desk in the same walnut finish if you want the room to match up.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth and wipe spills immediately. Abrasive cleaning products will dull the walnut finish.",
        ],
      },
    ],
  },
  {
    id: "product-import-charlton-ribbed-walnut-desk",
    title:
      "Charlton Ribbed Walnut Desk | Luxury Walnut Home Office Desk | Kaiku",
    summary:
      "A ribbed walnut desk with two soft-close drawers and two cupboards with internal shelving, in oak, oak veneer and MDF. 120 x 50 x 76cm and 71kg, delivered fully assembled.",
    sections: [
      {
        heading: "Aged Walnut Over Oak and MDF",
        paragraphs: [
          "Oak, oak veneer and MDF in an aged walnut finish, with the grain of the timber still reading through it.",
        ],
      },
      {
        heading: "Two Drawers and Two Cupboards",
        paragraphs: [
          "Storage is two soft-close drawers plus two cupboard compartments with shelving inside them — enough that a desk's worth of cables, chargers and paper can go away rather than stay on the surface.",
        ],
      },
      {
        heading: "Push-to-Open Drawers",
        paragraphs: [
          "The drawers run on metal runners with a soft-close push-to-open action, so they close under their own control instead of slamming.",
        ],
      },
      {
        heading: "The Ribbed Front",
        paragraphs: [
          "Ribbing runs across the front, which is what ties this to the rest of the Charlton pieces.",
        ],
      },
      {
        heading: "A 120 x 50cm Desktop",
        paragraphs: [
          "120cm across and 50cm deep at a working height of 76cm — room for a monitor and a laptop side by side without the keyboard hanging off the front.",
        ],
      },
      {
        heading: "71kg, and It Arrives Built",
        paragraphs: [
          "It comes fully assembled, so nothing to put together. That does mean 71kg coming through the door in one piece, in a carton around 125 x 60 x 81cm at 72kg. Two people, and check the doorway and the turn on the stairs first.",
        ],
      },
    ],
  },
  {
    id: "product-import-charlton-walnut-ribbed-chest-of-drawers",
    title:
      "Charlton Ribbed Walnut Chest of Drawers | Luxury 6 Drawer Chest | Kaiku",
    summary:
      "A walnut chest of six handle-free drawers with horizontal ribbed fronts and a soft-close push-to-open action, in oak, oak veneer and MDF. 110 x 45 x 85cm and 88kg.",
    sections: [
      {
        heading: "Walnut Over Oak, Veneer and MDF",
        paragraphs: [
          "Oak, oak veneer and MDF under a walnut finish, with the natural grain visible across the fronts.",
        ],
      },
      {
        heading: "Handle-Free, Push-to-Open",
        paragraphs: [
          "There are no handles at all. You push the front and the drawer releases, then the soft-close runners take it back in. It keeps the ribbed front unbroken, and there's nothing sticking out to catch a hip on when you walk past in the dark.",
        ],
      },
      {
        heading: "Six Drawers",
        paragraphs: [
          "Six drawers, all on smooth metal runners, so they keep working properly with a full load of clothes or bedding in them.",
        ],
      },
      {
        heading: "88kg — Plan the Route In",
        paragraphs: [
          "110 x 45 x 85cm and 88kg, in a carton around 115 x 50 x 90cm at 89kg. That's a two-person lift and then some: get the route measured and cleared before it turns up, because it isn't something you can shuffle round a tight landing.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth and wipe spills immediately. Abrasive cleaners and harsh chemicals will dull the walnut.",
        ],
      },
    ],
  },
  {
    id: "product-import-chilworth-1-drawer-grey-bedside-table",
    title:
      "Chilworth Grey Bedside Table | Luxury 1 Drawer Bedside Table | Kaiku",
    summary:
      "A grey bedside table with one drawer and an open lower shelf, made from birch, MDF and painted wood on tapered legs. 35 x 35 x 60cm and 13kg.",
    sections: [
      {
        heading: "Birch, MDF and Painted Wood in Grey",
        paragraphs: [
          "Birch, MDF and painted wood in a grey finish, on tapered legs, with a bar handle on the drawer.",
        ],
      },
      {
        heading: "A Drawer and an Open Shelf",
        paragraphs: [
          "One drawer on metal runners for the things you'd rather not look at, and an open shelf below it for a book or a small basket.",
        ],
      },
      {
        heading: "35cm Square — a Small Footprint",
        paragraphs: [
          "35 x 35 x 60cm, so it fits the gap between a bed and a wall where a wider cabinet won't go, and still gives you a surface at mattress height. 13kg, so one person can carry it up. The carton is around 40 x 40 x 70cm.",
        ],
      },
      {
        heading: "The Handle Goes On",
        paragraphs: [
          "The main unit arrives built. The handle may need attaching before you use it, which is a screwdriver job rather than an afternoon.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "A soft dry or slightly damp cloth, spills wiped immediately, and nothing abrasive on the paint.",
        ],
      },
    ],
  },
  {
    id: "product-import-easton-2-drawer-chest-of-drawers",
    title: "Easton 2 Drawer Chest of Drawers | Luxury Oak Chest | Kaiku",
    summary:
      "An oak chest of two drawers with a sandblasted sunburst finish, gold-style semi-circular handles and a matching metal base. 90 x 45 x 85cm.",
    sections: [
      {
        heading: "Sandblasted Sunburst Oak",
        paragraphs: [
          "Oak and oak veneer, sandblasted into a sunburst pattern. Sandblasting works the surface rather than colouring it, so the grain and texture of the timber are what you notice first.",
        ],
      },
      {
        heading: "Gold-Style Handles and Base",
        paragraphs: [
          "Semi-circular handles in a gold-style finish, on a matching gold-style metal base — the chest sits up on metal rather than down on a plinth.",
        ],
      },
      {
        heading: "Two Drawers",
        paragraphs: [
          "Two drawers rather than three or four, so each one is deep: better for jumpers and bedding than for sorting small things into layers.",
        ],
      },
      {
        heading: "90 x 45 x 85cm, and 55kg Boxed",
        paragraphs: [
          "90cm wide, 45cm deep and 85cm high. It ships in a carton around 97 x 55 x 92cm at 55kg, so it's a two-person lift getting it through the house.",
        ],
      },
      {
        heading: "Matching Easton Pieces",
        paragraphs: [
          "There's matching Easton bedroom furniture in the same finish if you want the room to line up.",
        ],
      },
    ],
  },
  {
    id: "product-import-elmley-grey-glass-top-end-table",
    title: "Elmley Grey End Table | Luxury Glass Side Table | Kaiku",
    summary:
      "A grey faux shagreen end table with a clear glass top and an antique-style brass surround. 45 x 45 x 60cm and 12kg.",
    sections: [
      {
        heading: "Faux Shagreen in Grey",
        paragraphs: [
          "The body is wrapped in faux shagreen — a textured finish that borrows its pebbled pattern from shagreen leather, in grey. It's man-made rather than a hide, so it wipes clean without any special treatment.",
        ],
      },
      {
        heading: "Glass Top in a Brass Surround",
        paragraphs: [
          "A clear glass top sits inside an antique-style brass surround, so the edge is framed in metal rather than left as bare glass.",
        ],
      },
      {
        heading: "45cm Square, 60cm Tall",
        paragraphs: [
          "45 x 45 x 60cm and 12kg. That's a small footprint at a fair height, which is why it works as a bedside table or a lamp table as readily as beside a sofa.",
        ],
      },
      {
        heading: "It Packs Heavier Than It Looks",
        paragraphs: [
          "The carton is around 52 x 52 x 77cm at 22kg — nearly twice the weight of the table itself, so don't judge the lift by the product weight when it turns up.",
        ],
      },
      {
        heading: "Cleaning Glass, Shagreen and Brass",
        paragraphs: [
          "Glass cleaner on the top. A soft dry or slightly damp cloth on the shagreen and the brass frame, wiping spills promptly.",
        ],
      },
    ],
  },
  {
    id: "product-import-elmley-ivory-console-table",
    title:
      "Elmley Ivory Console Table | Luxury Glass & Faux Shagreen Console Table | Kaiku",
    summary:
      "A console table with a clear tempered glass top, an ivory faux shagreen base and an antique brass-style surround. 120 x 40 x 80cm and 24kg, delivered fully assembled.",
    sections: [
      {
        heading: "Tempered Glass in a Brass-Style Surround",
        paragraphs: [
          "The top is clear tempered glass, framed by an antique brass-style surround. Tempered glass is treated to be considerably stronger than standard glass, which is what you want on a hallway surface that gets keys dropped on it.",
        ],
      },
      {
        heading: "Ivory Faux Shagreen Base",
        paragraphs: [
          "The base is wrapped in faux shagreen in ivory — a textured finish taken from stingray leather, made as a man-made material, so it takes a wipe rather than needing feeding or conditioning.",
        ],
      },
      {
        heading: "120 x 40cm, and No Assembly",
        paragraphs: [
          "120 x 40 x 80cm, and it arrives fully assembled — nothing to build, nothing to attach. At 40cm deep it holds a lamp and a tray without narrowing a hallway much.",
        ],
      },
      {
        heading: "24kg, in a Tall Box",
        paragraphs: [
          "24kg assembled, and the carton is around 127 x 47 x 100cm at 34kg. It's the 100cm height of the box that catches people out on a staircase, not the weight.",
        ],
      },
      {
        heading: "Cleaning the Glass and the Shagreen",
        paragraphs: [
          "A quality glass cleaner and a lint-free cloth on the top. A soft, slightly damp cloth on the shagreen and the brass-effect surfaces, and nothing abrasive on either.",
        ],
      },
    ],
  },
  {
    id: "product-import-five-black-console-table",
    title: "Five Black Console Table | Luxury Oak Console Table | Kaiku",
    summary:
      "A black console table in oak and oak veneer with the grain visible through the paint, and no drawers. 140 x 30 x 80cm and 20kg, delivered fully assembled.",
    sections: [
      {
        heading: "Oak Under Black Paint",
        paragraphs: [
          "Oak and oak veneer with a black painted finish, and the grain still reading through it rather than being filled flat.",
        ],
      },
      {
        heading: "No Drawers — an Open Design",
        paragraphs: [
          "There's no storage in this one. It's an open table, a surface and a gap underneath, which is worth knowing before you order: if you want keys and post out of sight, this isn't the console for it.",
        ],
      },
      {
        heading: "140cm Long, 30cm Deep",
        paragraphs: [
          "140 x 30 x 80cm. At 30cm front to back it's one of the shallower console tables going, so a hallway stays walkable with it against the wall.",
        ],
      },
      {
        heading: "Fully Assembled, 20kg",
        paragraphs: [
          "It arrives built. 20kg assembled, in a carton around 150 x 35 x 85cm at 25kg — long rather than heavy, so it's the turn at the top of the stairs to watch.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a dry or slightly damp cloth and wipe spills promptly. Abrasive cleaning products will damage the painted finish.",
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
    const words = written.sections
      .flatMap((s) => [s.heading, ...s.paragraphs])
      .join(" ")
      .trim()
      .split(/\s+/).length;
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

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-rewrite-descriptions-di-batch2.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
