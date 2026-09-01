/**
 * Hill Interiors description rewrite — slice B (the work-queue remainder from
 * position 61 onwards; another pass is handling the first 60). Same standard
 * as the SaunaPlunge reference descriptions: several short h2-headed sections,
 * each carrying a real fact taken from that product's own document — its
 * `dimensions`, `weight`, `materialTags`/`colourTags`, `specs` and, mostly,
 * the genuinely factual nuggets buried in its own FAQ answers (bulb type,
 * assembly, HDPE wicker vs real rattan, "two people minimum", "protect the
 * cushions over winter", "some assembly required"). Every fact is given its
 * consequence for the buyer. Nothing invented, no hedging, no superlatives.
 *
 * Deliberately NOT restating deliveryNotes/returnsNotes/warrantyNotes — that
 * boilerplate is identical across the supplier's products and already renders
 * in its own tab on the product page (see product-tabs.tsx).
 *
 * Note on sources: several products in this slice carry FAQ blocks copied from
 * a different product entirely (the Capri dining chair holds the Contour
 * sideboard's FAQs; the Contour console holds the Capri footstool's). Where
 * that happened the mismatched answers were ignored and the copy was written
 * from `dimensions`, `weight` and `materialTags` only.
 *
 * Batch 1 of 4: products 1-15 of the 61 in this slice.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-b-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-b-batch1.ts --apply
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
    id: "product-import-axis-putty-grey-chair",
    title: "Axis Putty Grey Carver Dining Chair | Kaiku",
    summary:
      "A carver dining chair in putty grey, moulded from weather-resistant plastic with integrated armrests. 54 x 51 x 79cm and 4.2kg, and it can be used indoors or out.",
    sections: [
      {
        heading: "Moulded Plastic Shell",
        paragraphs: [
          "The seat, back and arms are moulded plastic in putty grey — a muted neutral rather than a bright colour — with the armrests formed as part of the shell rather than bolted on afterwards.",
        ],
      },
      {
        heading: "Carver Style and the Head of the Table",
        paragraphs: [
          "Carver just means a dining chair with arms, and that's what separates this from the armless seats in the Axis range. It's the chair that goes at the head of the table, with the rest of the range filling in down the sides.",
        ],
      },
      {
        heading: "Indoor and Outdoor Use",
        paragraphs: [
          "The construction is weather-resistant, so it can stay out on a patio, terrace or garden dining table rather than being carried in after every meal. It works round an indoor table just as well, and it's robust enough for hospitality and commercial dining rooms.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "54 x 51cm on the floor and 79cm tall, weighing 4.2kg — light enough to carry one-handed, so getting a set of them out to the garden isn't a job.",
        ],
      },
    ],
  },
  {
    id: "product-import-axis-shelf-unit-with-glass-shelves",
    title: "Axis Shelf Unit With Glass Shelves | Kaiku",
    summary:
      "A shelving unit with a slim black metal frame and clear glass shelves, 80 x 12 x 110cm and 7.2kg. Assembly required.",
    sections: [
      {
        heading: "Metal Frame and Glass Shelves",
        paragraphs: [
          "A slim black metal frame carrying clear glass shelves, open at the back and the sides — so what you put on it is what you see, rather than the unit itself.",
        ],
      },
      {
        heading: "Depth, Height and Where It Goes",
        paragraphs: [
          "Only 12cm deep, 80cm wide and 110cm tall, so it sits tight to the wall and takes almost no floor: a hallway, a landing, or the wall beside a desk. Clear shelves also make it a reasonable place for houseplants, since light reaches the lower levels instead of being blocked by solid boards.",
        ],
      },
      {
        heading: "Loading the Shelves",
        paragraphs: [
          "Spread the weight evenly across each shelf and stay within the recommended limits — glass doesn't take kindly to one heavy item concentrated on a single spot. Books, ornaments and office bits are all fine.",
        ],
      },
      {
        heading: "Assembly and Weight",
        paragraphs: [
          "Assembly is required. At 7.2kg you can carry it into place and reposition it on your own once it's built.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Glass cleaner and a soft cloth on the shelves; a dry or slightly damp cloth on the frame. Nothing abrasive on either.",
        ],
      },
    ],
  },
  {
    id: "product-import-belluno-urn-table-lamp-with-linen-shade",
    title: "Belluno Urn Table Lamp With Linen Shade | Kaiku",
    summary:
      "A small table lamp with a wooden urn-shaped base and a linen shade in grey, 11 x 11 x 24cm and 0.45kg. For indoor use.",
    sections: [
      {
        heading: "Urn Base and Linen Shade",
        paragraphs: [
          "A wooden base in an urn shape — narrow at the foot, swelling out and drawing back in again — under a linen shade in grey. Linen diffuses the light rather than throwing it straight down the way a metal or glass shade does.",
        ],
      },
      {
        heading: "Size and Where It Fits",
        paragraphs: [
          "11 x 11cm at the base, 24cm tall, and 0.45kg. That's genuinely small — a bedside table, a shelf or a windowsill rather than a reading lamp to sit beside a chair.",
        ],
      },
      {
        heading: "Bulbs and Dimmers",
        paragraphs: [
          "It runs from a standard household socket and takes either an LED or a standard incandescent bulb. If it's going on a dimmer circuit you'll need a dimmable bulb, and it's worth checking the bulb and the dimmer are compatible before buying either.",
        ],
      },
      {
        heading: "Indoor Use and Care",
        paragraphs: [
          "Indoor use only — outdoors will damage it. Dust the linen shade regularly and lift small marks with a slightly damp cloth, keeping harsh chemicals away from the fabric.",
        ],
      },
    ],
  },
  {
    id: "product-import-bloom-collection-outdoor-sofa",
    title: "Bloom Collection Outdoor Sofa | Kaiku",
    summary:
      "An outdoor sofa in brown, woven from chunky HDPE wicker over a powder-coated aluminium frame, with grade 5 Olefin cushions. 202 x 108 x 72cm and 34kg.",
    sections: [
      {
        heading: "Weave, Frame and Cushions",
        paragraphs: [
          "The weave is HDPE rather than natural rattan — the same woven look, but made to sit outside — and the strands here are chunky rather than fine. Underneath is a powder-coated aluminium frame, which won't rust or corrode the way steel does. The cushions are grade 5 Olefin: colourfast, stain resistant and quick to dry after a shower.",
        ],
      },
      {
        heading: "Living Outside",
        paragraphs: [
          "It's built to stay out. The sensible exception is the cushions — bring them in or cover them over a long spell of bad weather and they'll last a good deal longer.",
        ],
      },
      {
        heading: "Size and the Space to Plan For",
        paragraphs: [
          "202cm wide, 108cm deep and 72cm high. That's a substantial piece of furniture, so measure the space before ordering and leave room to walk past it rather than sizing it to the last centimetre.",
        ],
      },
      {
        heading: "Assembly and Weight",
        paragraphs: [
          "34kg, and assembly needs two people minimum, done on firm, flat, dry ground rather than on soft grass.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Mild soapy water on the wicker; sponge clean on the cushions.",
        ],
      },
      {
        heading: "The Rest of the Bloom Range",
        paragraphs: [
          "It sits in the Bloom outdoor range alongside a large lounge chair, a footstool and a sunbed, so a matching set is possible rather than having to pair it with something else.",
        ],
      },
    ],
  },
  {
    id: "product-import-blue-agapanthus-plant-in-pot",
    title: "Blue Agapanthus Plant In Pot | Kaiku",
    summary:
      "An artificial blue agapanthus supplied in its own pot, weighing 0.82kg. Made for indoor use, or a shaded spot outdoors.",
    sections: [
      {
        heading: "Artificial Blooms, Pot Included",
        paragraphs: [
          "An artificial agapanthus in blue, made from plastic and supplied in its own pot — so there's nothing to buy separately and nothing to water. The colour is fixed rather than fading off the way real blooms do after a couple of weeks.",
        ],
      },
      {
        heading: "Where to Put It",
        paragraphs: [
          "Indoors is where it's meant to live: a window ledge, a table, or grouped with other pots for a fuller display. A well-lit spot shows the blue up best. It'll cope outside in a shaded position if you want it out there, though it isn't built to stand in weather.",
        ],
      },
      {
        heading: "Pets",
        paragraphs: [
          "Being artificial, it doesn't carry the risk to a cat or a dog that a real plant can.",
        ],
      },
      {
        heading: "Weight and Care",
        paragraphs: [
          "0.82kg complete with the pot, light enough to move with one hand. Wipe the dust off the leaves with a clean, damp cloth now and then — that's the whole of the upkeep.",
        ],
      },
    ],
  },
  {
    id: "product-import-boucle-ribbed-ark-chair",
    title: "Boucle Ribbed Ark Chair | Kaiku",
    summary:
      "An armchair upholstered in ribbed bouclé over a metal frame, 96 x 63 x 90cm and 14.7kg. Delivered fully assembled.",
    sections: [
      {
        heading: "Ribbed Bouclé Upholstery",
        paragraphs: [
          "Bouclé is the looped, nubbly yarn that gives the fabric its texture. Here it's run in vertical ribs rather than laid flat as a plain panel, so the surface has relief to it rather than reading as one smooth face. The frame underneath is metal.",
        ],
      },
      {
        heading: "Shape and Proportions",
        paragraphs: [
          "96cm wide, 63cm deep and 90cm tall. The arched back the Ark name refers to curves round instead of squaring off, so it fills its footprint more softly than a boxy armchair of the same size.",
        ],
      },
      {
        heading: "Delivery and Weight",
        paragraphs: [
          "It arrives fully assembled — nothing to build. At 14.7kg one person can shift it across a room, though getting it through a doorway is easier with a second pair of hands.",
        ],
      },
      {
        heading: "Cleaning and Sunlight",
        paragraphs: [
          "Vacuum it regularly so dust doesn't pack down into the loops, and blot spills with a damp cloth rather than rubbing them in. Keep it out of direct sunlight, which will fade the fabric over time.",
        ],
      },
    ],
  },
  {
    id: "product-import-capri-collection-outdoor-dining-chair",
    title: "Capri Collection Outdoor Dining Chair | Kaiku",
    summary:
      "An outdoor dining chair with a metal frame and fabric upholstery in a neutral tone, 60 x 48 x 103cm and 13.2kg.",
    sections: [
      {
        heading: "Metal Frame and Fabric Seat",
        paragraphs: [
          "A metal-framed chair with fabric upholstery across the seat and back, in a neutral tone that's easy to put alongside a table you already own rather than having to match a finish.",
        ],
      },
      {
        heading: "Height and Footprint",
        paragraphs: [
          "60 x 48cm on the ground and 103cm tall. The height is in the back rather than the seat, so it reads as a proper dining chair and not a low garden lounger — worth measuring against your table first, since a 103cm back stands well clear of most tabletops.",
        ],
      },
      {
        heading: "Weight and Staying Put",
        paragraphs: [
          "13.2kg per chair. That's heavy for a garden chair, which is rather the point: it won't skate across the paving or go over in a gust the way a lightweight stacking chair does, and it's still liftable on your own when you want to rearrange.",
        ],
      },
      {
        heading: "Part of the Capri Range",
        paragraphs: [
          "It belongs to the Capri outdoor collection, so it can be matched with the other Capri pieces — the footstool included — rather than standing on its own.",
        ],
      },
    ],
  },
  {
    id: "product-import-capri-collection-outdoor-foot-stool",
    title: "Capri Collection Outdoor Foot Stool | Kaiku",
    summary:
      "An outdoor footstool in beige, woven from 5mm half-round HDPE wicker on an aluminium frame, with an Olefin cushion and acacia wood feet. 81 x 56 x 24cm and 7.7kg.",
    sections: [
      {
        heading: "Weave, Frame and Feet",
        paragraphs: [
          "The weave is 5mm half-round HDPE — a synthetic strand with a flat outer face, so it reads like natural cane without behaving like it once it's left outside. It sits on a lightweight aluminium frame that won't rust, with acacia wood feet where it meets the ground.",
        ],
      },
      {
        heading: "The Cushion",
        paragraphs: [
          "Olefin fabric in beige: shower resistant, quick drying, and made to hold its colour rather than bleaching out over a summer.",
        ],
      },
      {
        heading: "Using It as a Seat",
        paragraphs: [
          "It's a footstool first, and pulled up to an outdoor sofa or armchair that's what it does well. It'll take someone perching on it as occasional seating, but it isn't built to stand in as a dining chair.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "81 x 56cm and just 24cm tall, weighing 7.7kg — low enough to tuck under the front edge of a sofa, light enough to move with one hand.",
        ],
      },
      {
        heading: "Year-Round Outdoor Use and Cleaning",
        paragraphs: [
          "The frame and weave are made to stay out all year. Bring the cushion in or cover it through winter and long wet spells and it'll last a lot longer. Mild soap and water is all the wicker needs.",
        ],
      },
    ],
  },
  {
    id: "product-import-contour-collection-2-drawer-2-door-sideboard",
    title: "Contour Collection 2 Drawer 2 Door Sideboard | Kaiku",
    summary:
      "A wooden sideboard in a black finish with two drawers and two cupboard doors, 80 x 35 x 80cm and 15kg.",
    sections: [
      {
        heading: "Black Wood Finish",
        paragraphs: [
          "Wood throughout, finished in black, with squared-off lines rather than turned legs or mouldings.",
        ],
      },
      {
        heading: "Drawers Over Cupboards",
        paragraphs: [
          "Two drawers above two cupboard doors, so there's somewhere shallow for the small things that need keeping apart and a bigger enclosed space below for what you'd rather not look at.",
        ],
      },
      {
        heading: "Dimensions and Where It Fits",
        paragraphs: [
          "80cm wide, 35cm deep and 80cm tall — a tall, shallow sideboard rather than a long low one, which suits a hallway or the short wall of a dining room where a full-length unit won't go. It can take a television, though at 80cm the screen sits high, so it works better viewed from a dining chair than from a low sofa. 15kg, so one person can move it empty.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a soft, dry cloth and keep abrasive cleaners off the finish. Wipe spills straight away, and don't stand hot dishes or mugs directly on the top.",
        ],
      },
      {
        heading: "Part of the Contour Collection",
        paragraphs: [
          "One of the Contour pieces in the same black wood, alongside a three-drawer console and a pet feeder table.",
        ],
      },
    ],
  },
  {
    id: "product-import-contour-collection-3-drawer-console",
    title: "Contour Collection 3 Drawer Console | Kaiku",
    summary:
      "A wooden console table in a black finish with three drawers, 120 x 33 x 80cm and 14.5kg.",
    sections: [
      {
        heading: "Black Wood Finish",
        paragraphs: [
          "Wood in a black finish, with the same squared lines as the rest of the Contour pieces.",
        ],
      },
      {
        heading: "Three Drawers Across the Width",
        paragraphs: [
          "Three drawers set side by side across the width. Each one is shallow front to back but wide, which suits post, keys, gloves and the flat things that pile up by a front door more than it suits anything bulky.",
        ],
      },
      {
        heading: "Dimensions and Where It Fits",
        paragraphs: [
          "120cm wide but only 33cm deep, standing 80cm tall — narrow enough for a hallway you still have to walk down, and at the usual console height for a mirror or a lamp above it. 14.5kg empty.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a soft, dry cloth, avoid abrasive cleaners and wipe spills as they happen. Use coasters or a mat under anything that stands on the top, lamps and vases in particular.",
        ],
      },
      {
        heading: "Part of the Contour Collection",
        paragraphs: [
          "It matches the other Contour pieces in the same black wood, including the two-drawer, two-door sideboard.",
        ],
      },
    ],
  },
  {
    id: "product-import-contour-collection-pet-feeder-table",
    title: "Contour Collection Pet Feeder Table | Kaiku",
    summary:
      "A raised pet feeder table in wood with a black finish, 60 x 28 x 33cm and 6.5kg. Arrives pre-assembled.",
    sections: [
      {
        heading: "Raised Height and Why It Helps",
        paragraphs: [
          "The top sits 33cm off the floor, so a cat or dog eats with its head up instead of craning down to a bowl on the ground — less strain through the neck and back over the course of a day.",
        ],
      },
      {
        heading: "Bowls and Fit",
        paragraphs: [
          "Sized around standard pet bowls, and you can use your own as long as they sit within the space. At 60cm wide there's room for two side by side: food and water, or a bowl each for two smaller animals.",
        ],
      },
      {
        heading: "Which Pets It Suits",
        paragraphs: [
          "It's built for small to medium pets. A large breed will find both the height and the footprint too small to be comfortable.",
        ],
      },
      {
        heading: "Dimensions, Weight and Assembly",
        paragraphs: [
          "60cm wide, 28cm deep and 33cm tall, in wood with a black finish, weighing 6.5kg. It arrives pre-assembled, and that 6.5kg is enough to keep it still on a hard floor while an enthusiastic eater shoves at a bowl.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "The top is a flat surface, so it wipes down with a cloth — worth doing after meals rather than letting food dry on.",
        ],
      },
    ],
  },
  {
    id: "product-import-decorative-hanging-black-mirror",
    title: "Decorative Hanging Black Mirror | Kaiku",
    summary:
      "A tall, narrow wall mirror in a black frame, 13 x 1 x 146cm and 1.58kg.",
    sections: [
      {
        heading: "A Narrow Vertical Column",
        paragraphs: [
          "13cm wide and 146cm tall in a black frame — a tall strip rather than one wide pane, closer to a piece of wall art than a mirror you'd check a whole outfit in.",
        ],
      },
      {
        heading: "Frame and Glass",
        paragraphs: [
          "Mirrored glass held in a black frame. Black reads as an outline against a pale wall rather than disappearing into it, so the shape of the piece stays visible instead of the glass alone doing the work.",
        ],
      },
      {
        heading: "Depth and Hanging",
        paragraphs: [
          "Just 1cm deep and 1.58kg all in, so it sits almost flush to the wall and a standard picture hook will hold it. Nothing heavy-duty needed.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "The proportions suit the narrow walls that defeat most mirrors — beside a front door, at the end of a hallway, or on the strip between two doorways. Hung where it catches a window it'll push daylight back down a dark corridor.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A soft, lint-free cloth with mild soap and water. Keep anything abrasive off the glass.",
        ],
      },
    ],
  },
  {
    id: "product-import-delphine-collection-1-drawer-1-door-chest-right-hand",
    title: "Delphine Collection 1 Drawer 1 Door Chest Right Hand | Kaiku",
    summary:
      "A compact wooden chest in a brown finish with one drawer and one right-hand hinged door, 50 x 38 x 72cm and 9kg.",
    sections: [
      {
        heading: "Wood and Finish",
        paragraphs: [
          "Built from wood in a brown finish, with a single drawer sitting above a single cupboard door. It's a plain, squared-off shape, so it doesn't fight with whatever else is already in the room.",
        ],
      },
      {
        heading: "What 'Right Hand' Means",
        paragraphs: [
          "The right hand in the name is the hinge side — the door opens from the right. Worth thinking through before ordering, because a door that swings into a wall or a corner is a nuisance every day you own it.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: [
          "One drawer for the small, flat things, and one enclosed cupboard below it for whatever you'd rather have out of sight — blankets, shoes, the box of chargers. Two different kinds of storage in a piece only 50cm wide.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "50cm wide, 38cm deep and 72cm tall, weighing 9kg. It's a compact piece — a bedside chest, a hall unit, or something to fill a short run of wall rather than a full-length sideboard.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust with a soft cloth, and use a slightly damp one for a deeper clean.",
        ],
      },
    ],
  },
  {
    id: "product-import-echo-putty-grey-chair",
    title: "Echo Putty Grey Chair | Kaiku",
    summary:
      "An outdoor chair in putty grey, moulded from weather-resistant plastic, 55 x 50 x 77cm and 5.5kg. Some assembly required.",
    sections: [
      {
        heading: "Weather-Resistant Shell",
        paragraphs: [
          "A moulded chair in putty grey, made from weather-resistant plastic rather than a fabric sling or timber slats, so rain runs off it and there's nothing to bring in the moment the weather turns.",
        ],
      },
      {
        heading: "Size and Where It Goes",
        paragraphs: [
          "55cm wide, 50cm deep and 77cm tall — dining height rather than a low lounger, so it pulls up to a garden table properly. The footprint is small enough for a balcony as well as a patio or a lawn.",
        ],
      },
      {
        heading: "Assembly and Weight",
        paragraphs: [
          "Some assembly is needed on arrival, with instructions included. At 5.5kg it's light enough to carry out one-handed and move round the garden as the sun does.",
        ],
      },
      {
        heading: "Weather and Cleaning",
        paragraphs: [
          "It's made to be left out, though it'll last longer if it goes somewhere dry through a hard winter. Wipe it down with a damp cloth and a little mild detergent.",
        ],
      },
    ],
  },
  {
    id: "product-import-etched-collection-tall-pot-with-handle",
    title: "Etched Collection Tall Pot With Handle | Kaiku",
    summary:
      "A ceramic planter in black with an etched surface pattern and an integrated handle, 27 x 27 x 24cm and 3.66kg.",
    sections: [
      {
        heading: "Etched Ceramic and the Handle",
        paragraphs: [
          "Ceramic in black, with the pattern etched into the surface rather than printed on top of it, and a handle formed as part of the pot — so moving it doesn't mean gripping the rim with both hands and hoping.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "27 x 27cm across and 24cm tall, weighing 3.66kg empty. That's a broad, solid pot: it won't go over when a tall plant catches the wind, and it carries real weight once soil and water are in, which is what the handle is for.",
        ],
      },
      {
        heading: "Planting and Drainage",
        paragraphs: [
          "You can plant straight into it with a standard potting mix, and the height suits taller species and trailing ones that spill over the edge. Give the water somewhere to go — a layer of gravel in the bottom, or keep the plant in its nursery pot inside this one — because standing water is what sees off most plants in decorative pots.",
        ],
      },
      {
        heading: "Indoors, Outdoors and Care",
        paragraphs: [
          "It works either indoors or outside, provided it's looked after. A damp cloth is enough for cleaning; keep harsh chemicals away from the etched finish.",
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
    "docs/change-log/2026-09-01-rewrite-descriptions-hill-b-batch1.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
