/**
 * Hill Interiors description rewrite — slice B, batch 2 of 4 (products 16-30
 * of the 61 in this slice; see scripts/rewrite-descriptions-hill-b-batch1.ts
 * for the standard and the sourcing rules).
 *
 * Facts come only from each product's own `dimensions`, `weight`,
 * `materialTags`/`colourTags`, `specs` and FAQ answers. Where a product's
 * `specs` array contradicts its structured fields — the Provence bistro table
 * lists "80cm diameter / 75cm / 12kg" in specs against 70 x 70 x 72cm and
 * 8.4kg in `dimensions`/`weight` — the structured fields were used, since
 * those are what the rest of the site renders from.
 *
 * The Oura coffee table's own FAQ answers "materials are not detailed" and
 * "dimensions are currently unspecified"; those hedges were dropped and the
 * copy written from `materialTags` (metal, wood), `colourTags` (black) and
 * the real dimensions instead.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-b-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-b-batch2.ts --apply
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
    id: "product-import-eucalyptus-plant-in-stone-effect-pot",
    title: "Eucalyptus Plant In Stone Effect Pot | Kaiku",
    summary:
      "An artificial eucalyptus with silvery green foliage, supplied in a stone-effect pot. 19 x 19 x 23cm and 0.23kg, with no assembly needed.",
    sections: [
      {
        heading: "Artificial Foliage in a Stone-Effect Pot",
        paragraphs: [
          "Plastic foliage in a silvery green, already arranged in a pot with a stone-effect finish. Nothing to plant and nothing to assemble — it comes out of the box ready to put down.",
        ],
      },
      {
        heading: "No Water, No Light",
        paragraphs: [
          "Being artificial it needs neither watering nor sunlight, so it'll hold up in a windowless bathroom or a dark corner of a landing where a real plant would give up inside a fortnight.",
        ],
      },
      {
        heading: "Size and Where It Fits",
        paragraphs: [
          "19 x 19cm and 23cm tall, weighing 0.23kg — small enough for a shelf, a bedside table or a windowsill rather than a floor position.",
        ],
      },
      {
        heading: "Grouping and the Matching Pots",
        paragraphs: [
          "Grouped in threes it reads as a fuller display than a single pot does. The same stone-effect pot is used for basil, rosemary and buxus versions, so a matching set is possible.",
        ],
      },
      {
        heading: "Outdoors and Care",
        paragraphs: [
          "It'll sit outside in fair weather, but bring it in rather than leaving it through a wet or windy spell. Dust the foliage now and then with a soft, dry cloth, and keep water and cleaning products off it.",
        ],
      },
    ],
  },
  {
    id: "product-import-haldon-collection-large-1-drawer-lamp-table",
    title: "Haldon Collection Large 1 Drawer Lamp Table | Kaiku",
    summary:
      "A wooden lamp table with one drawer in a natural brown finish, 40 x 40 x 90cm and 13kg. For indoor use.",
    sections: [
      {
        heading: "Wood and Natural Finish",
        paragraphs: [
          "Built from wood with a natural brown finish, so the grain reads through rather than being buried under paint.",
        ],
      },
      {
        heading: "90cm Tall — Higher Than a Usual Side Table",
        paragraphs: [
          "40 x 40cm square and 90cm tall. That's high for a lamp table: taller than most bedside tables and well above the arm of a typical sofa, which puts a lamp on top at standing eye level rather than shining across your book. Worth measuring against the bed or sofa it's going beside before ordering.",
        ],
      },
      {
        heading: "The Drawer",
        paragraphs: [
          "One drawer, on a standard runner rather than a soft-close mechanism — so it'll shut with a knock if you let go of it.",
        ],
      },
      {
        heading: "Assembly and Weight",
        paragraphs: [
          "Some assembly may be needed on arrival, with instructions included. It weighs 13kg, which one person can manage, though a second pair of hands helps on stairs.",
        ],
      },
      {
        heading: "Indoor Use and Care",
        paragraphs: [
          "For indoor use only. Wipe it with a soft, damp cloth and keep harsh chemicals off the finish; a suitable wood conditioner every few months stops it drying out.",
        ],
      },
    ],
  },
  {
    id: "product-import-kyra-french-grey-chair",
    title: "Kyra French Grey Chair | Kaiku",
    summary:
      "An outdoor chair moulded from plastic in a French grey finish, 46 x 43 x 80cm and 4.6kg.",
    sections: [
      {
        heading: "French Grey Finish",
        paragraphs: [
          "A moulded plastic chair finished in the French grey the name refers to — a muted shade rather than a bright one, and the same colour through the material rather than a coat on top of it.",
        ],
      },
      {
        heading: "Height and Footprint",
        paragraphs: [
          "43cm wide, 46cm deep and 80cm tall. That 80cm back is taller than most of the outdoor chairs in the range, which sit nearer 75 to 77cm, so you get a more upright seating position and a bit more behind the shoulders.",
        ],
      },
      {
        heading: "Weight and Moving It",
        paragraphs: [
          "4.6kg — light enough to carry out one-handed and follow the sun round a table with. The other side of a light chair is that it's worth tucking somewhere sheltered on a windy day.",
        ],
      },
      {
        heading: "Weather and Storage",
        paragraphs: [
          "It's built for outdoor use, but cover it or bring it in through extreme weather rather than leaving it standing out all winter.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A soft, damp cloth for dust and marks. Nothing harsh or abrasive on the finish.",
        ],
      },
    ],
  },
  {
    id: "product-import-large-grey-stone-effect-hurricane-lantern",
    title: "Large Grey Stone Effect Hurricane Lantern | Kaiku",
    summary:
      "A ceramic hurricane lantern in grey with a stone-effect finish and a glass surround, 20 x 20 x 32cm and 2kg.",
    sections: [
      {
        heading: "Stone-Effect Ceramic",
        paragraphs: [
          "The body is ceramic with a stone-effect surface, which is why it has the texture and colour of grey stone at 2kg rather than the weight a carved stone piece of this size would carry.",
        ],
      },
      {
        heading: "Candles It Takes",
        paragraphs: [
          "Tealights, pillar candles or LED candles all fit, LEDs being the answer if it's going somewhere unattended or where children are about. Unscented candles are the better choice. Never leave a lit candle burning unattended.",
        ],
      },
      {
        heading: "Size and Where It Sits",
        paragraphs: [
          "20 x 20cm at the base and 32cm tall — a table centrepiece, a hearth piece or a porch step rather than something to line up along a shelf.",
        ],
      },
      {
        heading: "Indoors and Outdoors",
        paragraphs: [
          "It works inside or out, and the glass surround is what makes the difference outdoors: it keeps a flame going in moving air that would put an open candle out.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe the glass with a soft, damp cloth. Keep harsh chemicals away from the stone-effect finish, which they'll dull.",
        ],
      },
    ],
  },
  {
    id: "product-import-large-rustic-metal-hanging-bell",
    title: "Large Rustic Metal Hanging Bell | Kaiku",
    summary:
      "A small hanging bell in metal with a rustic brown-toned finish, 8 x 8 x 10cm and 0.08kg. Comes with its own hanging fitting.",
    sections: [
      {
        heading: "Metal and Rustic Finish",
        paragraphs: [
          "Metal with a rustic finish in earthy brown tones rather than a bright polish, so it reads as aged rather than new out of the box.",
        ],
      },
      {
        heading: "Smaller Than the Name Suggests",
        paragraphs: [
          "8 x 8cm and 10cm tall, weighing 80g. Despite the 'large' in the name this is a small decorative bell, sized for a tree branch, a door handle or a wreath rather than standing as a display piece in its own right.",
        ],
      },
      {
        heading: "Hanging and Ringing",
        paragraphs: [
          "It comes with its own hanging fitting, so there's nothing to add to it. Tapped gently it rings rather than clunks, which also makes it a fair bet in a child's room as long as someone's keeping an eye on it.",
        ],
      },
      {
        heading: "Indoors, Outdoors and Storage",
        paragraphs: [
          "Fine indoors or out, and it isn't tied to Christmas — it'll carry other occasions just as well. Store it somewhere dry between seasons, since damp is what starts metal rusting.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A dry cloth for dust and a damp one for stubborn marks. Nothing harsh.",
        ],
      },
    ],
  },
  {
    id: "product-import-lennox-black-2-door-side-cupboard",
    title: "Lennox Black 2 Door Side Cupboard | Kaiku",
    summary:
      "A compact wooden side cupboard in a black finish with two doors and shelving behind, 49 x 43 x 67cm and 10kg.",
    sections: [
      {
        heading: "Black Wood Finish",
        paragraphs: [
          "Wood with a black finish and no grain on show, so it works as a contrast piece rather than something you'd try to colour-match against existing wood furniture. Black is the only finish it comes in.",
        ],
      },
      {
        heading: "Two Doors, Shelving Behind",
        paragraphs: [
          "The two doors open onto shelving, so this is enclosed storage rather than open display — books and media in a living room, or clothes and accessories in a bedroom.",
        ],
      },
      {
        heading: "Dimensions and Where It Fits",
        paragraphs: [
          "49cm wide, 43cm deep and 67cm tall, weighing 10kg. That's compact: sized for a narrow hallway, the gap beside a sofa, or under a window rather than as a full-width sideboard.",
        ],
      },
      {
        heading: "Indoor Use and Moisture",
        paragraphs: [
          "Indoor use only. It'll go in a bathroom, though not somewhere it takes steam or splashes directly, since sustained moisture is what lifts a finish like this.",
        ],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Assembly instructions come in the box. Clean with a soft, damp cloth, and a gentle cleaner if it needs it — no special products required, and nothing harsh.",
        ],
      },
    ],
  },
  {
    id: "product-import-lennox-black-framed-console",
    title: "Lennox Black Framed Console | Kaiku",
    summary:
      "A full-length console table with a black metal frame, glass surfaces and mirrored glass panels. 132 x 36 x 81cm and 20kg.",
    sections: [
      {
        heading: "Black Frame, Glass and Mirrored Panels",
        paragraphs: [
          "A black metal frame carrying glass, with mirrored glass set into it. The frame is what does the structural work, so the piece reads as open and reflective rather than as a solid cabinet.",
        ],
      },
      {
        heading: "132cm Wide, 36cm Deep",
        paragraphs: [
          "132cm wide, 36cm deep and 81cm tall — a full-length console for a hallway wall or the back of a sofa rather than a small accent table. At 36cm deep it stays out of the walking line in a corridor.",
        ],
      },
      {
        heading: "Weight and Positioning",
        paragraphs: [
          "20kg. It's steady enough to take lamps, vases and picture frames without any wobble, but once it's built and in place it isn't something you'll nudge around on a whim, so decide where it goes first.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: ["Assembly is required, with instructions included."],
      },
      {
        heading: "Care",
        paragraphs: [
          "A soft, dry cloth. Keep harsh chemicals and abrasive cloths off both the glass and the frame.",
        ],
      },
    ],
  },
  {
    id: "product-import-multi-shelf-industrial-shelf-unit",
    title: "Multi Shelf Industrial Shelf Unit | Kaiku",
    summary:
      "A floor-standing shelf unit with a black metal frame and wood shelves in an industrial finish, 110 x 40 x 203cm and 52.6kg. Assembly required.",
    sections: [
      {
        heading: "Metal Frame, Wood Shelves",
        paragraphs: [
          "A metal frame with wood shelving in a black industrial finish — closer to scaffold-board shelving than to a painted domestic bookcase.",
        ],
      },
      {
        heading: "203cm Tall, 40cm Deep",
        paragraphs: [
          "110cm wide, 40cm deep and 203cm tall. At just over two metres it needs the ceiling height to take it, and 40cm of depth is enough for books and boxes stood upright without pushing too far into a hallway or landing.",
        ],
      },
      {
        heading: "What It Will Hold",
        paragraphs: [
          "The construction is built for heavy items rather than ornaments alone, so full shelves of books are within its range. Both faces are open, which means it can stand as a room divider instead of having to go against a wall.",
        ],
      },
      {
        heading: "Weight and Assembly",
        paragraphs: [
          "52.6kg — a two-person lift, so have help ready on the day rather than trying to walk it in alone. Assembly is required, with instructions included.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Dust with a soft, dry cloth, and use a lightly damp cloth with mild soap on spills. Nothing harsh.",
        ],
      },
    ],
  },
  {
    id: "product-import-nahla-large-mirror-with-dimpled-frame",
    title: "Nahla Large Mirror With Dimpled Frame | Kaiku",
    summary:
      "A near-square wall mirror in a dimpled gold-finished frame, 86 x 3 x 82cm and 8kg. Mounting fittings included.",
    sections: [
      {
        heading: "Dimpled Gold Frame",
        paragraphs: [
          "The dimpling is worked into the gold-finished frame rather than the glass, so the frame catches light across its contours while the reflection itself stays flat and undistorted.",
        ],
      },
      {
        heading: "The Largest of the Three Sizes",
        paragraphs: [
          "86cm wide and 82cm tall, so close to square. It's the largest of the three Nahla mirrors — the medium runs 78 x 73cm and the small 64 x 60cm — and the one that will hold a wall on its own rather than needing to be hung as part of a group.",
        ],
      },
      {
        heading: "Depth, Weight and Hanging",
        paragraphs: [
          "Only 3cm deep but 8kg, so it sits close to the wall while needing a fixing rated for that weight rather than a picture pin. Mounting fittings are supplied with it.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Hallways, entryways, bedrooms and living rooms. Hung beside or opposite a window it pushes daylight back into the room, which is the practical argument for a mirror in a dark hall.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Dust the frame with a soft cloth and use a mild glass cleaner on the glass. Keep abrasive cleaners away from the gold finish.",
        ],
      },
    ],
  },
  {
    id: "product-import-nahla-medium-mirror-with-dimpled-frame",
    title: "Nahla Medium Mirror With Dimpled Frame | Kaiku",
    summary:
      "A wall mirror in a dimpled gold-finished frame, the middle of three sizes. 78 x 4 x 73cm and 6.5kg.",
    sections: [
      {
        heading: "Dimpled Gold Frame",
        paragraphs: [
          "Mirrored glass in a gold-finished frame with a dimpled, textured surface — the dimples give the frame depth and catch light across the contours instead of reading as one flat band of gold.",
        ],
      },
      {
        heading: "78cm Wide — Sized for a Console",
        paragraphs: [
          "78cm wide, 73cm tall and 4cm deep. That width sits properly above a console table or a sideboard without overhanging either end, which is the usual reason for picking the medium over the large.",
        ],
      },
      {
        heading: "Weight and Hanging",
        paragraphs: [
          "6.5kg, so use a wall fixing rated for the weight rather than a picture hook.",
        ],
      },
      {
        heading: "Colours It Sits With",
        paragraphs: [
          "The gold works with warm neutrals — cream, beige, taupe, brown — and turns into a straight contrast against charcoal, black or a deep green wall.",
        ],
      },
      {
        heading: "The Rest of the Nahla Range",
        paragraphs: [
          "Small (64 x 60cm) and large (86 x 82cm) versions share the same dimpled frame, so two or three sizes can be hung together as a group.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Glass or mirror cleaner and a soft, lint-free cloth on the glass; a soft cloth on the frame. Nothing abrasive on either.",
        ],
      },
    ],
  },
  {
    id: "product-import-nahla-small-mirror-with-dimpled-frame",
    title: "Nahla Small Mirror With Dimpled Frame | Kaiku",
    summary:
      "A wall mirror in a dimpled gold-finished frame, the smallest of three sizes. 64 x 4 x 60cm and 4.5kg.",
    sections: [
      {
        heading: "Dimpled Gold Frame",
        paragraphs: [
          "Mirrored glass held in a gold-finished frame with a dimpled, textured surface, which gives the edge of the mirror depth rather than leaving it as a plain flat band.",
        ],
      },
      {
        heading: "The Smallest of the Three Sizes",
        paragraphs: [
          "64cm wide, 60cm tall and 4cm deep, weighing 4.5kg. It's the smallest of the three Nahla mirrors, which makes it the one that fits above a narrow console or a small run of entrance furniture where the 78cm medium would overhang.",
        ],
      },
      {
        heading: "Gallery Walls and Groupings",
        paragraphs: [
          "At this size it works as one piece within a group rather than having to anchor a wall alone. Hung with the medium and large versions it makes a tiered arrangement in the same frame design.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Entrance halls and smaller hallways, above a dressing table, or over bedroom furniture. The plain proportions and textured frame sit as easily in a modern room as a traditional one.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Mirror cleaner and a soft, lint-free cloth on the glass. Dust the textured frame gently with a soft cloth, avoiding anything rough that would catch in the dimples.",
        ],
      },
    ],
  },
  {
    id: "product-import-oura-round-coffee-table",
    title: "Oura Round Coffee Table | Kaiku",
    summary:
      "A round coffee table in wood and metal with a black finish, 72cm across and 40cm tall, weighing 10kg.",
    sections: [
      {
        heading: "Wood and Metal in Black",
        paragraphs: [
          "Built from wood and metal, finished in black throughout rather than mixing a dark frame with a lighter top.",
        ],
      },
      {
        heading: "72cm Across, 40cm High",
        paragraphs: [
          "A 72cm circle sitting 40cm off the floor. That diameter suits a two- or three-seat sofa; in front of a large corner group it would look undersized. At 40cm it's a little below the seat height of most sofas, so a mug on it is a reach down rather than level with your arm.",
        ],
      },
      {
        heading: "Round Rather Than Square",
        paragraphs: [
          "A round top has no corners to catch a shin or a hip, which counts for something in a room you walk through rather than around.",
        ],
      },
      {
        heading: "Weight and Moving It",
        paragraphs: [
          "10kg, so one person can lift it clear to vacuum underneath or shift the room about.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A soft, damp cloth, with a little mild soap for tougher marks.",
        ],
      },
    ],
  },
  {
    id: "product-import-provence-collection-outdoor-4-seater-dining-set",
    title: "Provence Collection Outdoor 4 Seater Dining Set | Kaiku",
    summary:
      "A four-seater outdoor dining set in beige, with a 5mm tempered glass top on a powder-coated aluminium frame woven in 5mm HDPE wicker, and grade 5 Olefin cushions. Table 90 x 90 x 72cm; 52kg for the set.",
    sections: [
      {
        heading: "Table, Frame and Weave",
        paragraphs: [
          "A 5mm tempered glass tabletop over a powder-coated aluminium frame woven with 5mm HDPE wicker. The weave isn't natural rattan — it's the synthetic version, which looks the part but doesn't mind being rained on — and powder-coated aluminium won't rust the way a steel frame will.",
        ],
      },
      {
        heading: "The Cushions",
        paragraphs: [
          "Grade 5 Olefin in beige: shower resistant, UV resistant, fade resistant, and quicker to dry than the polyester used on cheaper sets. That last part is what matters the morning after a wet night.",
        ],
      },
      {
        heading: "Four Seats in a 90cm Square",
        paragraphs: [
          "The table is 90 x 90cm and 72cm high. A square that size seats four without needing the footprint of a rectangular six-seater, so it works on a patio, a terrace or in a smaller garden.",
        ],
      },
      {
        heading: "Assembly and Weight",
        paragraphs: [
          "52kg for the set, and assembly needs two people minimum — the parts themselves are heavy, never mind the finished pieces.",
        ],
      },
      {
        heading: "Staying Out and Cleaning",
        paragraphs: [
          "It can stay outside all year. A cover over it when it isn't in use will add years to how long it looks new, and the glass top wipes clean without any special treatment.",
        ],
      },
    ],
  },
  {
    id: "product-import-provence-collection-outdoor-bistro-table",
    title: "Provence Collection Outdoor Bistro Table | Kaiku",
    summary:
      "A steel outdoor bistro table in a neutral grey finish, 70 x 70 x 72cm and 8.4kg. Arrives fully assembled.",
    sections: [
      {
        heading: "Steel Construction",
        paragraphs: [
          "Built from steel and finished in a neutral grey, so it stands up to weather without the oiling or treating a timber table needs each year.",
        ],
      },
      {
        heading: "Size and Where It Fits",
        paragraphs: [
          "70 x 70cm and 72cm tall — a two-person table at standard dining height. That footprint fits a balcony or a small patio where a four-seater set wouldn't, and it'll push back to a wall or into a corner without wasting space.",
        ],
      },
      {
        heading: "No Assembly",
        paragraphs: [
          "It arrives fully assembled. Out of the box, stand it up, and that's the job done.",
        ],
      },
      {
        heading: "Weather and Covers",
        paragraphs: [
          "It's made to live outside year-round and doesn't need bringing in, though a cover through extreme weather will keep it looking newer for longer. At 8.4kg it's also light enough to move under shelter if that's easier.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe the surface down with a damp cloth, and keep harsh chemicals off it.",
        ],
      },
      {
        heading: "Part of the Provence Range",
        paragraphs: [
          "It sits in the Provence outdoor collection, so it can be matched with the other Provence pieces rather than standing alone.",
        ],
      },
    ],
  },
  {
    id: "product-import-provence-collection-outdoor-dining-chair",
    title: "Provence Collection Outdoor Dining Chair | Kaiku",
    summary:
      "An outdoor dining chair in beige, woven in 5mm round HDPE wicker over a powder-coated aluminium frame with a grade 5 Olefin cushion. 94 x 62 x 69cm and 8kg.",
    sections: [
      {
        heading: "Weave, Frame and Cushion",
        paragraphs: [
          "5mm round HDPE wicker over a powder-coated aluminium frame, with a grade 5 Olefin seat cushion in beige. The wicker is synthetic rather than real rattan, which is rather the point outdoors, and powder-coated aluminium won't rust.",
        ],
      },
      {
        heading: "The Cushion in Weather",
        paragraphs: [
          "The Olefin cushion is shower resistant, UV resistant and fade resistant, and dries quickly after rain — so an overnight shower doesn't write off the following morning.",
        ],
      },
      {
        heading: "Proportions",
        paragraphs: [
          "94 x 62cm on the ground and 69cm tall. That's broader than a standard dining chair, so allow more room per place setting than you would for a stacking chair. The trade for the space is a chair you can sit in through a long meal rather than a quick coffee.",
        ],
      },
      {
        heading: "Weight and Buying a Set",
        paragraphs: [
          "8kg per chair: heavy enough not to shift about in the wind, light enough to carry out one-handed. Several can go round a Provence dining table, and the range runs to matching tables and complete sets.",
        ],
      },
      {
        heading: "Winter and Cleaning",
        paragraphs: [
          "The chair itself can stay out all year. Store the cushion indoors over winter, or cover it through long spells of not being used. Mild soapy water and a soft brush on the wicker, no abrasive solvents, and sponge clean the cushion only.",
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
    "docs/change-log/2026-09-01-rewrite-descriptions-hill-b-batch2.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
