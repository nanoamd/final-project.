/**
 * Hill Interiors description rewrite — "hill-a" pass, batch 1 of 4 (the first
 * 60 products of the description work queue, per
 * scripts/list-description-work-queue.ts --supplier "Hill Interiors").
 *
 * These 15 all already carried a factual three-section description from the
 * earlier hill-aw pass, which is exactly why they are still in the queue: the
 * SaunaPlunge reference standard is 4–6 sections and 150–250 words, and three
 * sections at ~90 words scores THIN. This pass keeps every fact those
 * descriptions had and adds the ones that were left on the table — almost all
 * of it mined out of each product's own FAQ answers, which is where the real
 * detail lives (candle types, LED options, airflow through the lattice,
 * "use florist cellophane for real flowers", "do not hang above a heat
 * source", hands adjustable on install, standard wall fixtures, keep out of
 * direct sunlight) — plus the document's own `dimensions`, `weight`,
 * `primaryColour`/`colourTags`, `materialTags` and `rooms` fields.
 *
 * Rules held to, per docs/master-brief.md and the SaunaPlunge reference:
 *   - every fact gets its consequence for the buyer, not just the fact
 *   - headings name the actual subject ("Hanging and Fixings", "Candles and
 *     Airflow"), never "Features" or "Specifications"
 *   - no superlatives, no supplier voice, no supplier name, no trademarks
 *   - nothing hedged: where a fact is missing the section is simply dropped
 *     rather than admitting the gap. Two FAQ answers in this batch hedge
 *     ("the specific weight has not been detailed", "dimensions are currently
 *     unavailable") while the document's own dimensions/weight fields hold the
 *     real numbers — those numbers are used and the hedge discarded.
 *   - clean integers/decimals, never the feed's w120.000000 form
 *
 * Deliberately NOT restating deliveryNotes/returnsNotes/warrantyNotes: that
 * boilerplate is identical across every Hill Interiors product and already
 * renders in its own tab (components/product/product-tabs.tsx), so repeating
 * it here would be padding rather than a per-product fact.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-a-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-a-batch1.ts --apply
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
    id: "hill-decor-16210",
    title: "Glass Candle Holder | Kaiku",
    summary:
      "A glass candle holder in white, 14 x 14cm at the base and 33cm tall, weighing 3.5kg. Takes standard votive or pillar candles.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Glass in a white finish, tall and narrow rather than low and wide, so it takes one pillar candle rather than a cluster of tealights. The height also means the flame sits well down inside the glass rather than up near the rim.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "14 x 14cm at the base and 33cm tall, weighing 3.5kg. That's heavy for the size, which is the giveaway that the walls are solid glass rather than thin blown glass — you can pick it up and move it one-handed, but it has enough weight to stay put on a table.",
        ],
      },
      {
        heading: "Candle Use",
        paragraphs: [
          "Standard votive and pillar candles both fit. Don't leave a lit candle unattended in it, and let the glass cool before you move it.",
        ],
      },
      {
        heading: "Where It Can Go",
        paragraphs: [
          "Made for indoors — a living room, bedroom or dining table. It'll cope outside if it's under cover and out of the rain, but it isn't built to be left out in weather.",
        ],
      },
      {
        heading: "Cleaning and Handling",
        paragraphs: [
          "Warm soapy water and a soft cloth is all it needs. The walls are solid, but it's still glass, so it won't survive a drop onto a hard floor.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-17459",
    title:
      "Set Of Three Wooden Lanterns With Traditional Cross Section | Kaiku",
    summary:
      "A set of three wooden lanterns in grey with a cross-section cut design, in graduated heights up to 84cm. The set weighs 9kg and takes pillar, tealight or LED candles.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Three wooden-framed lanterns in a grey finish, each cut with a traditional cross-section pattern and sized to hold a candle inside. They come in graduated heights, so they're meant to be grouped as a set rather than spread around a room. No assembly — they arrive ready to use.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "A 31 x 31cm footprint with the tallest standing 84cm high, and 9kg for all three. That's floor-standing height rather than tabletop — a hearth, a doorway or either side of a fireplace. One person can carry them.",
        ],
      },
      {
        heading: "Candles and Light",
        paragraphs: [
          "Pillar candles, tealights or LED candles all work. The cut sides let the light out through the frame rather than only through the top opening, and LED candles are the sensible choice if you want to leave them lit while you're not in the room.",
        ],
      },
      {
        heading: "Indoor and Outdoor Use",
        paragraphs: [
          "They're fine indoors or out on a patio or in the garden, but bring them in during severe weather — the wood finish isn't sealed for permanent exposure.",
        ],
      },
      {
        heading: "Care and How the Wood Ages",
        paragraphs: [
          "Dust with a soft cloth. Keep them out of prolonged direct sunlight, which fades the grey finish, and expect the natural wood to shift in tone as it ages.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-17461",
    title: "Set Of Three Wooden Lanterns With Archway Design | Kaiku",
    summary:
      "A set of three wooden lanterns in grey with arched cut openings, in graduated heights up to 104cm. The set weighs 11.5kg and takes pillar or tealight candles.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Three wooden lanterns in a grey finish, each frame cut with an arched opening rather than a cross-section, and each sized to hold a candle inside. Sold only as the set of three.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "A 31 x 31cm footprint with the tallest reaching 104cm, and 11.5kg across the three. That's 20cm taller than the cross-section design in the same range, so these want a floor position by a fireplace or an entrance hall rather than a shelf. Most people can shift them alone, though it's easier with help.",
        ],
      },
      {
        heading: "Candles",
        paragraphs: [
          "Built around pillar or tealight candles, with the frame holding the candle away from the sides.",
        ],
      },
      {
        heading: "Indoor and Outdoor Use",
        paragraphs: [
          "Suitable indoors or outdoors, but bring them inside in bad weather rather than leaving them standing in rain.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "A soft, dry cloth is enough. Avoid harsh chemicals and abrasives — they'll strip the grey finish off the wood.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-17857",
    title: "Silver Heart Skeleton Wall Clock | Kaiku",
    summary:
      "A metal skeleton wall clock in a silver finish with a heart motif, 89cm across and 4cm deep, weighing 3.5kg. Battery operated.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Metal in a silver finish, built as a skeleton clock with a heart motif — the face is open, so the wall colour behind it shows through the gaps instead of being covered by a solid disc.",
        ],
      },
      {
        heading: "Size and Weight",
        paragraphs: [
          "89cm across and only 4cm deep, weighing 3.5kg. At that diameter it's readable from the far side of a room, and it needs a decent stretch of clear wall — 89cm is wider than most radiators it might sit above.",
        ],
      },
      {
        heading: "Hanging and Fixings",
        paragraphs: [
          "It comes with instructions and hangs on a single fixing, but at 3.5kg use a fixing rated for the weight and the wall you've got rather than a picture hook in plasterboard. The hands can be adjusted while you're setting it up if they've shifted in transit.",
        ],
      },
      {
        heading: "Movement and Batteries",
        paragraphs: [
          "Battery operated, on standard batteries you can pick up anywhere.",
        ],
      },
      {
        heading: "Where It Can Go and Care",
        paragraphs: [
          "Indoors only, and keep it out of high-humidity rooms like bathrooms — damp gets at both the metal finish and the movement. Dust it regularly with a soft cloth.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-17858",
    title: "Large Silver Skeleton Wall Clock | Kaiku",
    summary:
      "A metal skeleton wall clock with a polished silver finish, 80cm across and 4cm deep, weighing 2.75kg. Battery operated.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A metal frame in a polished silver finish, built as a skeleton clock — most of the dial is left open, so the wall behind it shows through rather than being blanked out by a solid face.",
        ],
      },
      {
        heading: "Size and Legibility",
        paragraphs: [
          "80cm across and 4cm deep. The numerals are sized to match, so it reads from across a living room or down a hallway, which is the point of a clock this big. It's the smaller of the two skeleton clocks in the range — the heart-motif version is 89cm.",
        ],
      },
      {
        heading: "Weight and Hanging",
        paragraphs: [
          "2.75kg, which is light for an 80cm clock and comes down to how much of the face is open air rather than metal. No special installation — it goes up on standard wall fixtures.",
        ],
      },
      {
        heading: "Movement and Batteries",
        paragraphs: ["Runs on a battery movement rather than needing winding."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Dust regularly with a soft cloth and keep harsh chemicals off the polished finish.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-18282",
    title: "Medium Conran Vase | Kaiku",
    summary:
      "A ceramic vase in blue, 22 x 22cm at the base and 38cm tall, weighing 3.85kg. For indoor use with fresh or dried flowers.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Ceramic in a blue finish, standing taller and narrower than the wider vases in the range, which suits a few long stems more than a full round bunch.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "22 x 22cm at the base, 38cm tall, weighing 3.85kg empty. That's enough base weight to hold tall stems steady without having to fill it with water first, and it's still light enough to move on your own. Worth checking you've got 38cm of clear headroom if it's going under a shelf or a wall cabinet.",
        ],
      },
      {
        heading: "Flowers, Fresh or Dried",
        paragraphs: [
          "It takes fresh flowers with water as well as dried arrangements, and the narrow neck means a handful of stems will hold their shape rather than splaying out.",
        ],
      },
      {
        heading: "Where It Can Go",
        paragraphs: [
          "Indoors only — a living room, dining room, bedroom or a desk in an office, where the 3.85kg keeps it steady enough not to be nudged over by a laptop lead. The ceramic isn't made to sit outside through weather.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A soft, damp cloth on the outside, and rinse the inside out once the flowers have gone rather than leaving stale water in it. Keep abrasive cleaners away from it, since they'll dull the glaze.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19417",
    title: "Aged Stone Ceramic Vase | Kaiku",
    summary:
      "A ceramic vase with an aged stone-effect finish in a neutral tone, 29 x 29cm at the base and 30cm tall, weighing 7kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Ceramic with an aged stone-effect finish in a neutral tone — the texture is worked into the surface rather than painted on, so scuffs won't take a layer of colour off with them.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "29 x 29cm at the base and 30cm tall, so it's as wide as it is high, and 7kg empty. That squat, heavy base is what lets it hold a wide spread of dried stems without the arrangement pulling it over. Still a one-person lift.",
        ],
      },
      {
        heading: "Flowers and Planting",
        paragraphs: [
          "Fresh or dried flowers both work — line it with florist cellophane before you put real stems in it. It also doubles as an indoor planter if you'd rather use it for a plant than for cut flowers.",
        ],
      },
      {
        heading: "Where It Can Go",
        paragraphs: [
          "Indoors: living room, bedroom, dining room, hallway or a desk. Keeping it inside is what preserves the stone-effect finish.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "Wipe it with a soft, damp cloth, and use a mild detergent on anything that won't shift.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19418",
    title: "Aged Stone Tall Ceramic Vase | Kaiku",
    summary:
      "A tall ceramic vase with an aged stone-effect finish, 28 x 28cm at the base and 45cm tall, weighing 7.5kg. For indoor use with fresh or dried flowers.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "The taller version of the Aged Stone vase, with the same stone-effect finish worked into the ceramic across a slimmer body.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "28 x 28cm at the base, 45cm tall, weighing 7.5kg. It's only half a kilo heavier than the shorter 30cm version despite standing 15cm taller, so the extra height comes from a slimmer body rather than more material. At 45cm it suits the floor or a low console table more than a shelf.",
        ],
      },
      {
        heading: "Flowers, Fresh or Dried",
        paragraphs: [
          "It holds fresh flowers with water and works just as well for dried arrangements. Line it with florist cellophane before you add real stems.",
        ],
      },
      {
        heading: "Where It Can Go",
        paragraphs: [
          "Indoors. Given the height and the weight, keep it somewhere a dog or a cat can't catch it — 7.5kg of ceramic going over does damage on the way down.",
        ],
      },
      {
        heading: "Care and Handling",
        paragraphs: [
          "Dust it with a soft cloth. Handle it by the body rather than the rim, since rough handling is what chips ceramic of this weight.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19428",
    title: "Large Conical Ceramic Lattice Hurricane Lantern | Kaiku",
    summary:
      "A ceramic hurricane lantern in bright white with a cut lattice pattern, 17 x 17cm at the base and 22cm tall, weighing 1.4kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Ceramic in a bright white finish, cut through with a lattice pattern in a conical shape that narrows towards the top. It's the larger of the two lattice lanterns in the range — the round version stands just 11cm tall next to it.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "17 x 17cm at the base and 22cm tall, weighing 1.4kg. Set it on a flat surface: the base is stable, but a lantern this tall on a wobbly garden table is asking for trouble.",
        ],
      },
      {
        heading: "Candles and Light",
        paragraphs: [
          "It takes standard-size candles, and LED candles if you'd rather not have a flame. The lattice is what does the work — light comes out through the cut sides as well as the open top, throwing a pattern onto the surface and wall around it.",
        ],
      },
      {
        heading: "Indoor and Outdoor Use",
        paragraphs: [
          "Fine indoors or out on a patio or in the garden, but bring it in when the weather turns rather than leaving it standing out through rain and frost.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "A soft, damp cloth, and check it over for chips now and then.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19429",
    title: "Round Ceramic Lattice Hurricane Lantern | Kaiku",
    summary:
      "A ceramic hurricane lantern with a cut lattice pattern, 17 x 17cm at the base and 11cm tall, weighing 0.65kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "The squat version of the lattice lantern — the same 17cm ceramic base and the same cut lattice, but 11cm tall against the conical version's 22cm.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "17 x 17cm and 11cm tall, weighing 0.65kg. Low enough to sit on a laid dining table without blocking the view across it, and light enough to buy two or three and scatter them rather than treating one as a centrepiece.",
        ],
      },
      {
        heading: "Candles and Airflow",
        paragraphs: [
          "Pillar and tealight candles both fit. The lattice isn't only decorative — the cut-outs let air through to the flame, and they diffuse the light out sideways instead of straight up.",
        ],
      },
      {
        heading: "Indoor and Outdoor Use",
        paragraphs: [
          "Indoors or outdoors, though at 0.65kg it's light enough to be knocked about by wind, so it wants a sheltered spot on a patio.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe the ceramic with a damp cloth and keep harsh chemicals off it. If you've burned real candles in it, the wax comes out easier while it's still soft.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19501",
    title: "Downton Large Antique White Vase | Kaiku",
    summary:
      "A large ceramic vase in an antique white finish, 39 x 39cm at the base and 41cm tall, weighing 7.95kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Ceramic in an antique white finish, with a rounded body that's very nearly as wide as it is tall rather than the slim upright shape most vases take.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "39 x 39cm across the base, 41cm tall, and just under 8kg empty. That's the reason it can carry a big, heavy arrangement — the base weight holds it down when the stems put weight out to one side. It's also large enough to stand on its own with nothing in it.",
        ],
      },
      {
        heading: "Flowers and Water",
        paragraphs: [
          "Sized for a substantial arrangement of fresh or dried flowers. Line it with florist cellophane before adding real stems, and change the water regularly to keep cut flowers going.",
        ],
      },
      {
        heading: "Where It Can Go",
        paragraphs: [
          "Living room, dining room or entrance hall. It'll survive a covered porch, but we'd keep it indoors — the antique white finish is the part that suffers outside.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A soft, damp cloth. Abrasive cleaners take the finish off, so leave those alone.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-20782",
    title: "Garda Glazed Gisela Vase | Kaiku",
    summary:
      "A ceramic vase in white with a glossy glaze, 18 x 18cm at the base and 51cm tall, weighing 2.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Ceramic in white under a glossy glaze, in a slim, tall-necked shape. The glaze is fired on, so it won't wear off the way a painted finish does.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "18 x 18cm at the base but 51cm tall, and only 2.5kg. That's light for the height — it's a narrow footprint carrying a lot of it, so put it somewhere it won't get caught by a passing sleeve, and it steadies up considerably once there's water in it.",
        ],
      },
      {
        heading: "Flowers and Stems",
        paragraphs: [
          "The proportions suit long single stems — branches, tall grasses, a few lilies — more than a round bunch. Line it with florist cellophane before adding real flowers. It also stands up on its own empty, which the height helps with.",
        ],
      },
      {
        heading: "Where It Can Go",
        paragraphs: [
          "Indoors, on a side table, console or shelf with the headroom for 51cm.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A soft, damp cloth for dust, and a mild soap solution for anything the water has left behind inside.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-20806",
    title: "Square Decorative Hanging Collage Mirror In Silver | Kaiku",
    summary:
      "A vertical column of square mirror sections in a silver metal frame, 14cm wide, 145cm tall and 2cm deep, weighing 1.86kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A run of individual square mirror panels in a silver-finished metal frame, stacked vertically so it reads as a narrow column rather than one large sheet of glass.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "145cm tall but only 14cm wide and 2cm deep, weighing 1.86kg. That shape is the useful part — it fits the narrow strip of wall beside a door, at the end of a hallway or between two windows, where a conventional mirror won't go.",
        ],
      },
      {
        heading: "Hanging and Fixings",
        paragraphs: [
          "It arrives ready to mount and goes up with standard hardware — at under 2kg you don't need anything heavy-duty. Worth checking every so often that it's still level and the fixing is tight, since a tall narrow piece shows a lean more obviously than a square one.",
        ],
      },
      {
        heading: "Where Not To Hang It",
        paragraphs: [
          "Don't hang it above a heat source, and keep it out of consistently damp rooms — a bathroom will get behind the silvering at the edges over time.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A soft, lint-free cloth. Abrasive cleaners scratch mirror glass and the marks don't come out.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-20836",
    title: "Tristan Mirror And Wood 4X6 Frame | Kaiku",
    summary:
      "A mirror in a brown wood frame, 24cm wide, 29cm tall and 2cm deep, weighing 0.83kg. The smaller of the two Tristan sizes.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A mirror set in a wood frame with a natural brown finish. It's the smaller of the two Tristan sizes — the 5x7 version is 26 x 31cm against this one's 24 x 29cm.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "24cm wide, 29cm tall, 2cm deep and 0.83kg. Small enough to sit in a group of several rather than working as a single mirror on a bare wall.",
        ],
      },
      {
        heading: "Hanging It",
        paragraphs: [
          "It comes ready to hang. At under a kilo a single fixing will do, though which fixing depends on your wall — plasterboard needs a plug where masonry doesn't.",
        ],
      },
      {
        heading: "Where It Can Go",
        paragraphs: [
          "Indoors: living room, bedroom or hallway. Keep it out of direct sunlight, which is what fades the brown finish on the frame, and if it goes in a bathroom keep it clear of direct water.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A soft cloth with a glass cleaner on the mirror, kept off the wood frame.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-20837",
    title: "Tristan Mirror And Wood 5X7 Frame | Kaiku",
    summary:
      "A mirror in a brown wood frame, 26cm wide, 31cm tall and 2cm deep, weighing 1.05kg. The larger of the two Tristan sizes.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A mirror in a wood frame with a natural brown finish — the larger of the two Tristan sizes, about 2cm bigger in each direction than the 4x6.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "26cm wide, 31cm tall, 2cm deep and 1.05kg. That's 0.22kg more than the 4x6, all of it in the extra frame. It's made to hang rather than stand, so there's no strut or easel on the back.",
        ],
      },
      {
        heading: "Hanging It",
        paragraphs: [
          "Wall-mounted, and light enough for a single fixing sized to your wall type.",
        ],
      },
      {
        heading: "Glass and Safety",
        paragraphs: [
          "The mirror glass is shatter-resistant, which is worth knowing if it's going up in a bathroom, a child's room or anywhere it might take a knock.",
        ],
      },
      {
        heading: "Where It Can Go",
        paragraphs: [
          "Living room, bedroom or hallway, and a bathroom is fine given the shatter-resistant glass, as long as it isn't taking direct water. Keep it out of long spells of direct sunlight, which is what takes the colour out of a wood frame.",
        ],
      },
      {
        heading: "Cleaning",
        paragraphs: [
          "A soft, non-abrasive cloth and a mild glass cleaner. Nothing gritty — it'll leave scratch marks across the reflection.",
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

function wordCount(written: Written): number {
  return written.sections
    .flatMap((s) => [s.heading, ...s.paragraphs])
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
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
    results.push({
      id: written.id,
      title: written.title,
      found: !!doc,
      sections: written.sections.length,
      words: wordCount(written),
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
    "docs/change-log/2026-09-01-rewrite-descriptions-hill-a-batch1.json",
    JSON.stringify(
      {
        apply,
        queued,
        results,
        rewrites: REWRITES.map((w) => ({
          id: w.id,
          summary: w.summary,
          sections: w.sections,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
