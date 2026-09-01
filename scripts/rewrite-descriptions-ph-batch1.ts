/**
 * Premier Housewares description rewrites — batch 1 of 5 (15 products).
 *
 * Scope comes from `scripts/list-description-work-queue.ts --supplier "Premier
 * Housewares" --facts`: 71 published products sitting below the SaunaPlunge
 * reference standard (BARE, THIN or no headings at all). This batch is the
 * first 15 of that queue, in queue order.
 *
 * Written to the reference standard set by the 8 SaunaPlunge products: 4–6
 * product-specific h2 sections, 150–250 words, every fact given its
 * consequence for the buyer, plain British voice with contractions. Facts come
 * only from each product's own `dimensions`, `specs`, existing summary and —
 * mostly — its `faqs`, which is where the real material, care, assembly and
 * carton detail for these products actually lives.
 *
 * Nothing is hedged. Where the source data has no fact (fixings on a wall
 * clock, drainage in a planter), the section is dropped or replaced with
 * ordinary practical advice, never with an admission that the spec is silent —
 * that pattern is why most of these products are in the queue.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-ph-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-ph-batch1.ts --apply
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
    id: "premier-housewares-0507597",
    title: "Vertex Square Basket | Kaiku",
    summary:
      "A woven iron basket with a copper finish, 25 x 25cm and 20cm tall, weighing about 4.2kg. Square rather than round, so several line up on a shelf without gaps, and it arrives ready to use.",
    sections: [
      {
        heading: "A Cube That Lines Up",
        paragraphs: [
          "25 x 25cm and 20cm tall. A square basket does something a round one can't: several sit side by side on a shelf with no wasted gaps between them, and the run reads as deliberate rather than collected.",
        ],
      },
      {
        heading: "Iron and the Copper Finish",
        paragraphs: [
          "The iron is woven rather than solid, in a copper finish, and the whole thing comes to about 4.2kg — heavy enough to stay put on a shelf and stiff enough to take some weight without flexing. Each one is made by hand, so expect small differences in the weave from basket to basket.",
        ],
      },
      {
        heading: "What Fits, and What Doesn't",
        paragraphs: [
          "20cm of depth holds folded hand towels, toiletries standing upright, or a couple of rolled flannels — a bathroom and dressing-table size rather than a laundry one.",
          "Because the weave is open, anything small enough to fall through wants a liner or a smaller box inside it. It's a dry-storage and display basket, not one for food.",
        ],
      },
      {
        heading: "Cleaning and Care",
        paragraphs: [
          "Wash it in warm soapy water and dry it off rather than letting it drip — it's an indoor basket, and bare iron in a wet bathroom corner will find the one spot you missed.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "It arrives fully assembled, so there's nothing to build.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-0507598",
    title: "Vertex Hexagonal Basket | Kaiku",
    summary:
      "A woven iron basket in a hexagonal frame, 38cm wide x 33cm tall and only 13cm deep, weighing 4.3kg. Shallow enough to sit flat against a wall on a shelf or worktop.",
    sections: [
      {
        heading: "Shallow, and Made to Be Seen Into",
        paragraphs: [
          "38cm wide, 33cm tall and only 13cm deep. That depth is what decides how you use it: too shallow to swallow things, which makes it a basket for what you want within reach rather than out of sight — towels rolled, magazines, a shelf's worth of odds and ends.",
        ],
      },
      {
        heading: "Iron Frame and Open Weave",
        paragraphs: [
          "The frame is iron, woven open enough that the contents are part of the look. A solid basket hides what's in it; this one asks you to keep it tidy. It weighs 4.3kg empty, so it stays where you put it.",
        ],
      },
      {
        heading: "Where It Stands",
        paragraphs: [
          "At 13cm deep it fits shelving and worktops a round basket would overhang, and it sits flat against a wall. Equally happy on a bathroom floor or a utility-room shelf.",
        ],
      },
      {
        heading: "Cleaning and Care",
        paragraphs: [
          "Wash it in warm soapy water and dry it properly. It's for indoor use, and being iron we'd keep it out of anywhere it'll sit permanently damp.",
        ],
      },
      {
        heading: "Handmade Variation",
        paragraphs: [
          "These are made by hand, so no two are quite identical — small differences in the weave and the corners are normal rather than a fault.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-1101380",
    title: "Mize Black Plastic Frame Over Door Mirror | Kaiku",
    summary:
      "A full-length over-door mirror in real glass with a black frame, 124cm tall x 34cm wide and 3cm deep, weighing 15kg. Hangs over a standard interior door, so in most rooms it needs no drilling.",
    sections: [
      {
        heading: "A Full-Length Mirror With No Wall to Spare",
        paragraphs: [
          "124cm tall, 34cm wide and 3cm deep. The proportions are the point: this is a tall narrow mirror for the back of a door, which is the one vertical surface in a small room that's otherwise doing nothing.",
          "At 34cm wide it shows you from the waist up at arm's length, and full length from a couple of paces back — about the distance a bedroom or box room gives you anyway.",
        ],
      },
      {
        heading: "Frame and Glass",
        paragraphs: [
          "It's real glass, not acrylic, in a black plastic frame built over an iron core with a paper backing — that's where the 15kg comes from.",
        ],
      },
      {
        heading: "Where the Depth Matters",
        paragraphs: [
          "3cm of frame is thin enough that a standard interior door still closes against its stop with the mirror hung over it. Check the gap at the top of the door before ordering: a door hung tight to its frame is the one case where an over-door mirror won't sit.",
        ],
      },
      {
        heading: "Hanging and Fixings",
        paragraphs: [
          "It's made to hang over the top of a door, so most people won't drill anything. If you'd rather fix it to a wall, treat it as a 15kg mirror and source fixings to suit your wall type — two into masonry, or proper hollow-wall anchors into plasterboard, never the plug that comes in a pack. Hung on a wall, centre it about 145cm off the floor.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe the glass with a soft cloth and keep abrasive cleaners away from the frame.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-1411647",
    title: "Avento Set Of Three Gold Finish Planters | Kaiku",
    summary:
      "A set of three iron planters in a gold finish, the tallest 34cm high on a 22 x 22cm base. Supplied assembled, in graduated heights so they group together.",
    sections: [
      {
        heading: "Three Heights, Iron Rather Than Resin",
        paragraphs: [
          "Iron with a gold-finished surface rather than painted resin or plastic, which is what gives them weight in the hand and keeps them from skating across a floor when they're planted up.",
        ],
      },
      {
        heading: "Sizes and How They Group",
        paragraphs: [
          "The tallest stands 34cm on a 22 x 22cm base, with the other two stepping down from it. Three graduated heights work as a floor-standing group in a corner or either side of a doorway rather than as one planter on a table — put the tallest at the back and let them overlap.",
        ],
      },
      {
        heading: "Planting",
        paragraphs: [
          "We'd pot into plastic nursery pots and drop those inside rather than potting straight into the metal. It keeps water off the finish, and swapping a plant out becomes a lift rather than a repot.",
        ],
      },
      {
        heading: "Cleaning the Finish",
        paragraphs: [
          "Wipe with a soft cloth. Nothing abrasive — the gold is a surface finish, so scouring it is the one thing that will mark it.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "All three arrive assembled. Unpack them and they're done.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-1601833",
    title: "Canyon Grey Tumbler | Kaiku",
    summary:
      "A bathroom tumbler in a plant-based composite of bamboo fibre, corn starch and mineral powder, 8 x 8cm and 10cm tall. Grey, matte, and for indoor use.",
    sections: [
      {
        heading: "Made Mostly of Plants",
        paragraphs: [
          "The body is 50% bamboo fibre, 40% corn starch and 10% mineral powder — a plant-based composite rather than straight plastic, which gives it a matte, faintly warm surface that doesn't read as bathroom plastic.",
        ],
      },
      {
        heading: "Size and What It Holds",
        paragraphs: [
          "8cm square at the base and 10cm tall, so it takes a few toothbrushes upright with the heads clear of the rim, or a razor and a tube of paste. It's a holder rather than a drinking cup — we wouldn't leave it standing full of water.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Not dishwasher safe, so wash it by hand in warm water and wipe it dry. Skip abrasive cleaners; they'll dull the matte surface.",
        ],
      },
      {
        heading: "Colour Variation",
        paragraphs: [
          "There's natural wood content in the mix, so the grey comes out slightly differently from batch to batch. Two bought a year apart won't be an exact match.",
        ],
      },
      {
        heading: "Where It Goes",
        paragraphs: [
          "Indoor use — a bathroom shelf, a kitchen windowsill, or a desk if you want somewhere to stand pens.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-1601837",
    title: "Canyon White Toothbrush Holder | Kaiku",
    summary:
      "A toothbrush holder in a bamboo and corn starch composite, 8 x 8cm and 10cm tall, in white. Wipe-clean, not dishwasher safe, and for indoor use.",
    sections: [
      {
        heading: "What It's Made From",
        paragraphs: [
          "44% bamboo fibre, 35% corn starch, 11% bamboo and 8% mineral powder — a composite with real plant content, which is why the white has a chalky matte finish rather than the shine of moulded plastic.",
        ],
      },
      {
        heading: "Size and How Many Brushes",
        paragraphs: [
          "8cm square and 10cm tall. That's an open pot rather than a divided holder, so brushes stand together and lean — fine for two or three, crowded at four. The 10cm height keeps a standard handle stable without the head sitting low enough to touch the base.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe it out with a damp cloth and leave it to dry. It isn't watertight and it isn't dishwasher safe, so no soaking and nothing abrasive. It's a toothbrush and cosmetics holder — not one to use for food.",
        ],
      },
      {
        heading: "Colour Variation",
        paragraphs: [
          "Natural materials mean each piece varies a little in tone. Buy two at once if you want them matching.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-1601841",
    title: "Canyon 300 ml Black Lotion Dispenser | Kaiku",
    summary:
      "A 300ml lotion dispenser in a bamboo and corn starch composite with a pump top, 8 x 8cm and 16cm tall, in black. Wipe-clean and for indoor use.",
    sections: [
      {
        heading: "A Dispenser Made Mostly of Plants",
        paragraphs: [
          "The body is 38% bamboo fibre, 30% corn starch, 16% bamboo and 7% mineral powder, with the pump mechanism in ABS. A plant-based composite rather than a straight plastic, so the surface is matte and slightly warm to the touch.",
        ],
      },
      {
        heading: "Capacity and Size",
        paragraphs: [
          "16cm tall on an 8cm square base, holding 300ml — roughly a standard refill bottle, so it's one to fill and keep rather than replace.",
        ],
      },
      {
        heading: "Bathroom or Kitchen",
        paragraphs: [
          "The square base sits against a wall or into the corner of a basin surround without the wasted circle a round dispenser leaves, and at 8cm across it fits a narrow shelf or the back of a sink. Black takes soap marks less obviously than white, which matters on the one object in a bathroom handled with wet hands every day.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "The pump fits into the body on arrival — a few seconds, no tools.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe with a damp cloth. Don't submerge it and don't put it in the dishwasher; the body isn't watertight and the natural content in the mix means colour varies slightly piece to piece anyway.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-1601855",
    title: "Canyon White Soap Dish | Kaiku",
    summary:
      "A soap dish in a bamboo and corn starch composite with a removable insert, 13cm wide x 9cm deep and 3cm tall, in white. Sized for a single bar and wipe-clean.",
    sections: [
      {
        heading: "Sized for One Bar",
        paragraphs: [
          "13cm wide, 9cm deep and 3cm tall — a dish for a single bar of soap rather than a tray for the whole basin. The 3cm height keeps it low enough that it doesn't crowd a narrow shelf.",
        ],
      },
      {
        heading: "Bamboo Composite, Not Ceramic",
        paragraphs: [
          "Made from bamboo and bamboo fibre with corn starch and mineral powder, rather than moulded plastic or glazed ceramic. Lighter than either, and the matte surface doesn't gloss up the way plastic does.",
        ],
      },
      {
        heading: "The Removable Insert",
        paragraphs: [
          "The insert lifts out, which is the part that actually matters day to day: soap water drains off the bar rather than pooling under it, and when it does get gummy you take the insert to the tap instead of scrubbing round the inside of the dish.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe with a damp cloth, and rinse the insert as often as you think about it. Not dishwasher safe, and it isn't watertight, so don't leave it standing in water.",
        ],
      },
      {
        heading: "Colour Variation",
        paragraphs: [
          "The natural content means the white varies slightly between pieces.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-1601856",
    title: "Canyon Black Soap Dish | Kaiku",
    summary:
      "A soap dish in a bamboo and corn starch composite with a removable insert, 13cm wide x 9cm deep and 3cm tall, in black. For indoor use and wipe-clean.",
    sections: [
      {
        heading: "The Black Version, Same Footprint",
        paragraphs: [
          "13 x 9cm and 3cm tall, so it takes one bar and sits low on a shelf or the corner of a basin. Black is the easier of the two finishes to live with in a hard-water area — the chalky film that shows white on a pale dish barely registers on this one.",
        ],
      },
      {
        heading: "What It's Made From",
        paragraphs: [
          "42% bamboo fibre, 33% corn starch, 16% bamboo and 8% mineral powder. That's a composite with real plant content, which is why the finish is matte rather than glossy and the dish weighs almost nothing.",
        ],
      },
      {
        heading: "The Removable Insert",
        paragraphs: [
          "The insert lifts out. Soap water drains off the bar rather than sitting under it, and cleaning becomes a rinse under the tap rather than a scrub.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "The insert drops into the dish on arrival. That's the extent of it.",
        ],
      },
      {
        heading: "Cleaning and Care",
        paragraphs: [
          "Wipe with a damp cloth. It isn't dishwasher safe and it isn't built to hold standing water, so tip it out rather than letting it fill. Indoor use only, and the natural content in the mix means small colour differences between pieces are normal.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2200671",
    title: "Romero Hot Pink Cutlery Metal Wall Clock | Kaiku",
    summary:
      "A 33cm metal wall clock with a cutlery motif in hot pink, 4cm deep and 3.5kg. Runs on one AA battery, which isn't included.",
    sections: [
      {
        heading: "A 33cm Kitchen Clock",
        paragraphs: [
          "33cm across and 4cm deep, in metal throughout with a cutlery motif and a hot pink finish. 33cm is the size at which a clock reads from the other end of a kitchen rather than only from in front of it, and the 4cm depth means it stands off the wall enough to throw a shadow instead of sitting flat like a print.",
        ],
      },
      {
        heading: "Hanging and Fixings",
        paragraphs: [
          "It weighs 3.5kg, which is heavy for a wall clock — you'll want to source fixings to suit your wall type. Into masonry that's a plug and screw; into plasterboard use a proper hollow-wall anchor rather than the plug from a pack, or find the stud. Hang it so the centre of the dial is at eye level from where you'll actually be standing, which in a kitchen is usually the far side of the worktop.",
        ],
      },
      {
        heading: "Battery",
        paragraphs: [
          "One AA battery, not supplied. Worth having one in before you hang it, because getting to the back of a 3.5kg clock once it's up is a two-hand job.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe with a soft cloth. It's a painted metal finish, so no abrasive cleaners.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2405640",
    title: "Maka Grey Natural Rattan Stool | Kaiku",
    summary:
      "A natural rattan stool with an hourglass shape, 40 x 40cm and 45cm tall, weighing 2.72kg and rated to 150kg. Supplied fully assembled.",
    sections: [
      {
        heading: "40cm Square, Rated to 150kg",
        paragraphs: [
          "40 x 40cm and 45cm tall — stool height rather than side-table height, so it works pulled up to a table or used as a footstool. It's rated to 150kg seated, which is worth saying because it only weighs 2.72kg: the light weight is about the material, not the load it'll take.",
        ],
      },
      {
        heading: "Woven Rattan and the Hourglass Shape",
        paragraphs: [
          "Natural rattan in a grey wash, woven into an hourglass profile that pinches at the waist. That narrow middle is why it reads as furniture rather than a box, and it gives you somewhere to get a hand under when you move it.",
        ],
      },
      {
        heading: "Doubling as a Side Table",
        paragraphs: [
          "The flat top takes a tray, though the weave has an open texture — a drink straight onto it will find a gap.",
        ],
      },
      {
        heading: "Where to Put It",
        paragraphs: [
          "This is natural rattan, so it belongs somewhere dry: a garden room, a covered terrace, a conservatory or indoors. Left out through a British winter it'll take on water and go grey in a way you won't reverse, so bring it in when the weather turns.",
        ],
      },
      {
        heading: "Cleaning and Assembly",
        paragraphs: [
          "Dust it with a soft dry cloth and keep abrasive cleaners off the weave. It arrives fully assembled.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2405831",
    title: "Hayton Black Velvet Sofa Bed | Kaiku",
    summary:
      "A black velvet sofa bed on a eucalyptus wood frame with gold-finish legs, 209 x 83 x 83cm and rated to 360kg. Arrives flat-packed in one carton and needs assembling.",
    sections: [
      {
        heading: "Upholstery and Frame",
        paragraphs: [
          "Black polyester velvet with button-tufted detailing, over a frame that includes eucalyptus wood, on gold-finish legs. Velvet on a sofa bed earns its keep — it doesn't crease and hold the marks that a flat woven fabric does when the back gets folded down and up again.",
        ],
      },
      {
        heading: "Sofa to Bed",
        paragraphs: [
          "209cm wide, 83cm deep and 83cm high as a sofa, converting to a bed. The stated capacity is 360kg, so it's built for two adults sleeping on it rather than the occasional overnight guest only.",
        ],
      },
      {
        heading: "Assembly and Getting It In",
        paragraphs: [
          "It arrives flat-packed and needs assembling. One carton, 215 x 106 x 25cm and around 45kg — flat, but long, so measure the tightest point of the route in. A stair turn or a narrow hall is where a 215cm box stops, not the front door. Two people for the carry and the build.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe the velvet with a damp cloth. As there's natural wood in the frame, small colour differences between pieces are normal.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2405836",
    title: "Hatton Grey Velvet Sofa Bed | Kaiku",
    summary:
      "A grey velvet sofa bed on a solid eucalyptus frame with rose-gold tapered legs, 211 x 83 x 85cm. Arrives flat-packed in one carton and needs assembling.",
    sections: [
      {
        heading: "Upholstery and Frame",
        paragraphs: [
          "Grey velvet over foam padding on a solid eucalyptus frame, finished with rose-gold electroplated tapered legs and flared armrests. Solid wood rather than a board-and-batten frame is the part that matters on a piece that gets folded flat and sat back up repeatedly.",
        ],
      },
      {
        heading: "Size, and the Room It Suits",
        paragraphs: [
          "211cm wide, 83cm deep and 85cm high as a sofa, converting to a bed. At 83cm deep it's shallower than a lot of three-seaters, which is what makes it workable in a small sitting room or a spare room that has to do two jobs.",
        ],
      },
      {
        heading: "Assembly and Access",
        paragraphs: [
          "Flat-packed in a single carton, 183 x 109 x 25cm and 50kg. That's a two-person lift and a two-person build. Measure the route in before delivery day — the 183cm dimension is the one that catches on a stair turn.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe clean with a damp cloth. The frame is natural wood, so expect minor variation in colour between pieces.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2405846",
    title: "Hannah Grey Velvet Ottoman Bed Double | Kaiku",
    summary:
      "A double ottoman bed in grey velvet over a pine and iron frame, 145cm wide x 206cm long x 111cm tall. The base lifts for storage underneath, and it arrives flat-packed for assembly.",
    sections: [
      {
        heading: "Storage Built Into the Base",
        paragraphs: [
          "The whole base lifts to give you the footprint of the bed as storage under the mattress. That's the practical reason to pick this over a standard frame in a room short on wardrobe space — it swallows spare bedding, cases and out-of-season clothes without adding a single piece of furniture to the room.",
        ],
      },
      {
        heading: "Materials and Upholstery",
        paragraphs: [
          "Grey velvet over a frame that's 40% pine and 20% iron, with foam padding through the headboard and base. The iron is what takes the lifting mechanism; the pine is the carcass.",
        ],
      },
      {
        heading: "Size and Room Fit",
        paragraphs: [
          "145cm wide, 206cm long and 111cm tall to the top of the headboard. Leave clear floor at the foot or the side you'll lift from — the base needs somewhere to swing up into.",
        ],
      },
      {
        heading: "Assembly and Delivery Access",
        paragraphs: [
          "It arrives flat-packed and needs assembling. One carton, roughly 148 x 145.5cm and 9.5cm deep — thin, but wide, and the width is what to check against doorways and stair turns before delivery day.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe the velvet with a soft cloth and keep abrasive cleaners away from it.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2405848",
    title: "Hannah Beige Ottoman Double Bed | Kaiku",
    summary:
      "A double ottoman bed in beige velvet over a pine and iron frame, 145cm wide x 206cm long x 111cm tall. The base lifts for storage underneath, and it ships flat-packed in three cartons.",
    sections: [
      {
        heading: "The Same Ottoman Base, in Beige",
        paragraphs: [
          "145cm wide, 206cm long and 111cm tall, in beige velvet. Like the rest of the Hannah range the whole base lifts to reveal storage under the mattress, which is the reason to choose an ottoman over a standard frame when a room hasn't got the wardrobe space.",
        ],
      },
      {
        heading: "Frame and Padding",
        paragraphs: [
          "40% pine wood and 20% iron with 20% foam and 20% velvet by composition — pine carcass, iron for the lifting mechanism, foam through the headboard and base panels.",
        ],
      },
      {
        heading: "Beige in a Bedroom",
        paragraphs: [
          "Beige velvet is the more forgiving of the two Hannah finishes in a bright room; grey velvet shows every change in the light, this one settles down.",
        ],
      },
      {
        heading: "Assembly and Delivery Access",
        paragraphs: [
          "Flat-packed and requires assembly, shipped in three cartons of around 147 x 147cm and 10cm deep. Three flat boxes are easier to get up a stairwell than one big one, but they're wide — measure your narrowest doorway and any turn on the stairs first.",
        ],
      },
      {
        heading: "Care",
        paragraphs: ["Wipe with a soft cloth. Nothing abrasive on the velvet."],
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
      .split(/\s+/)
      .filter(Boolean).length;
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
    "docs/change-log/2026-09-01-ph-description-rewrites-batch1.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
