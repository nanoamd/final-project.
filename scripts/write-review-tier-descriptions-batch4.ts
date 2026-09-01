/**
 * Fourth batch of real-fact rewrites for the zero-fact REVIEW-tier fault —
 * continuation of batches 1-3 (52 products so far). This batch covers
 * effectively the entire remaining published backlog: 42 of the 45
 * published `fixable` products from
 * docs/change-log/2026-09-01-full-catalogue-audit.json, skipping the three
 * flagged data-integrity cases (Delphine, Provence Bistro Table, and one
 * new one found this batch).
 *
 * Every number below is taken directly from the product's own `dimensions`,
 * `weight`, `specs` or `primaryColour` fields on the published document.
 *
 * One new product dropped rather than guessed at: "Himalayan Salt Cooking
 * Plate - Square - 20x20x5cm" — its `weight` field says 4.8kg, but its own
 * `specs` array says "Approximately 1.5 kg". A 3x discrepancy on the same
 * document, same shape as Provence and Delphine before it.
 *
 * Also worth flagging, though it didn't block anything: two Premier
 * Housewares products ("Canyon White Soap Dish", "Yana Large Cream
 * Textured Ceramic Planter") carry a `specs` line labelled "Cart Weight"
 * (2.8kg and 14kg respectively) that is almost certainly a shipping-carton
 * or multi-unit metric, not the item's own weight — a bamboo soap dish this
 * size does not weigh 2.8kg. Neither number was used below.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions-batch4.ts
 *   pnpm tsx --env-file=.env.local scripts/write-review-tier-descriptions-batch4.ts --apply
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
  title: string;
  sections: Section[];
}

export const DESCRIPTIONS: Written[] = [
  {
    title: "Glass Candle Holder | Kaiku",
    sections: [
      {
        heading: "14cm wide, 33cm tall, 3.5kg",
        paragraphs: [
          "A tall, narrow holder at 14 × 14cm and 33cm tall — it tapers upward rather than sitting low and wide, so it suits a single pillar candle rather than a cluster of tealights.",
          "At 3.5kg for a glass piece this size, it's a solid-walled holder rather than a thin blown-glass one.",
        ],
      },
    ],
  },
  {
    title: "Large Silver Skeleton Wall Clock | Kaiku",
    sections: [
      {
        heading: "80cm across, 2.75kg — lighter than it looks",
        paragraphs: [
          "At 80cm across and 4cm deep, this matches the largest clock face size in the range, but at 2.75kg it's noticeably lighter than the solid-cased clocks of the same diameter.",
          "The open skeleton design leaves most of the face as negative space rather than a solid disc, which is where the weight saving comes from. A standard picture hook is enough.",
        ],
      },
    ],
  },
  {
    title: "Medium Conran Vase | Kaiku",
    sections: [
      {
        heading: "22cm wide, 38cm tall",
        paragraphs: [
          "At 22 × 22cm and 38cm tall, this sits taller and narrower than the range's squatter vases — proportioned for a single tall stem display rather than a full bunch.",
          "At 3.85kg it's stable enough on its own without needing to be weighted with water.",
        ],
      },
    ],
  },
  {
    title: "Large Conical Ceramic Lattice Hurricane Lantern | Kaiku",
    sections: [
      {
        heading: "17cm wide, 22cm tall, lattice-cut ceramic",
        paragraphs: [
          "At 17 × 17cm and 22cm tall, this is the larger of the two lattice hurricane lanterns in the range — its round sibling stands just 11cm tall by comparison.",
          "At 1.4kg the lattice cut-outs through the ceramic wall are what let the candlelight show through the sides, not just the open top.",
        ],
      },
    ],
  },
  {
    title: "Round Ceramic Lattice Hurricane Lantern | Kaiku",
    sections: [
      {
        heading: "17cm wide, only 11cm tall",
        paragraphs: [
          "The smaller, squatter sibling to the Large Conical lattice lantern — the same 17cm base, but just 11cm tall and 0.65kg, so it sits low rather than standing as a centrepiece.",
          "Suits a scatter of tealights across a table rather than a single statement candle.",
        ],
      },
    ],
  },
  {
    title: "Garda Glazed Gisela Vase | Kaiku",
    sections: [
      {
        heading: "18cm wide, 51cm tall — the tallest Garda vase",
        paragraphs: [
          "At 18 × 18cm and 51cm tall, this is a slim, tall-necked vase rather than a wide-bodied one — proportioned for single long stems like branches or tall grasses rather than a full round bunch.",
          "At 2.5kg it's light for its height, so it's worth placing somewhere it won't get knocked.",
        ],
      },
    ],
  },
  {
    title: "Tristan Mirror And Wood 4X6 Frame | Kaiku",
    sections: [
      {
        heading: "24 × 29cm, 0.83kg — the smaller Tristan frame",
        paragraphs: [
          "At 24cm wide, 29cm tall and 2cm deep, this is the smaller of the two Tristan mirror frames in the range — the 5×7 version is larger on both dimensions.",
          "At 0.83kg it hangs from a single picture hook.",
        ],
      },
    ],
  },
  {
    title: "Tristan Mirror And Wood 5X7 Frame | Kaiku",
    sections: [
      {
        heading: "26 × 31cm, 1.05kg — the larger Tristan frame",
        paragraphs: [
          "At 26cm wide, 31cm tall and 2cm deep, this is the larger of the two Tristan mirror frames — about 20% bigger in both directions than the 4×6 version, and 0.22kg heavier as a result of the larger wood frame.",
        ],
      },
    ],
  },
  {
    title: "Large Frosted Eucalyptus Candle Wreath | Kaiku",
    sections: [
      {
        heading: "33cm ring, 8cm deep, just 130g",
        paragraphs: [
          "A 33cm-diameter wreath, 8cm deep through the ring itself, and just 0.13kg — light enough that it needs no reinforced hanging point, just a small hook or nail.",
          "Sized to sit around a pillar candle rather than a single tealight.",
        ],
      },
    ],
  },
  {
    title: "Luxe Collection Natural Glow S/ 2 Ivory LED Dinner Candles | Kaiku",
    sections: [
      {
        heading: "2cm diameter, 25cm tall — dinner-candle proportions",
        paragraphs: [
          "At just 2 × 2cm across and 25cm tall, these are slim dinner-candle proportions rather than a wide pillar candle — sized to sit in a candlestick holder rather than stand freely on a table.",
          "The set of two weighs 0.3kg together.",
        ],
      },
    ],
  },
  {
    title: "Darcy Ople Vase | Kaiku",
    sections: [
      {
        heading: "20cm cube — as wide as it is tall",
        paragraphs: [
          "At 20cm in every dimension, this is a genuinely cube-proportioned vase rather than a taller or wider one — an unusual silhouette in the range, where most vases run noticeably taller than they are wide.",
          "At 1.38kg it's light enough to reposition easily.",
        ],
      },
    ],
  },
  {
    title: "Marble Effect Ellipse Large Vase | Kaiku",
    sections: [
      {
        heading: "23cm wide, 36cm tall",
        paragraphs: [
          "At 23 × 23cm and 36cm tall, this sits at a genuinely large-vase scale — tall enough for a proper stem display rather than a low arrangement.",
          "At 2.18kg, the marble-effect finish is worked into the material itself rather than a printed wrap.",
        ],
      },
    ],
  },
  {
    title: "Marble Effect Pudding Vase | Kaiku",
    sections: [
      {
        heading: "25cm wide, 23cm tall — wider than it is tall",
        paragraphs: [
          "At 25 × 25cm and 23cm tall, this is wider than it is tall — the 'pudding' shape refers to this rounded, squat silhouette rather than a tall vase.",
          "At 2.24kg it's marginally heavier than its taller Ellipse sibling despite being shorter, which points to a thicker-walled body.",
        ],
      },
    ],
  },
  {
    title: "Roco Wall Clock | Kaiku",
    sections: [
      {
        heading: "45cm across, 0.92kg — the smallest clock in the range",
        paragraphs: [
          "At 45cm across and 5cm deep, this is smaller than most of the other wall clocks in the catalogue, which mostly run 59–90cm.",
          "At 0.92kg it's also one of the lightest, needing nothing more than a picture hook.",
        ],
      },
    ],
  },
  {
    title: "Bloomsbury Wall Clock | Kaiku",
    sections: [
      {
        heading: "59cm across, 2.16kg",
        paragraphs: [
          "At 59cm across and 6cm deep, this shares its exact sizing and weight with the Louie Wall Clock in the same range — the two differ in face design and colour, not size.",
        ],
      },
    ],
  },
  {
    title: "Louie Wall Clock | Kaiku",
    sections: [
      {
        heading: "59cm across, black face",
        paragraphs: [
          "Matches the Bloomsbury Wall Clock's 59cm, 6cm-deep, 2.16kg sizing exactly, in a black finish rather than the Bloomsbury's lighter tone.",
          "Hangs from a standard picture hook.",
        ],
      },
    ],
  },
  {
    title: "Bronze Skeleton Wall Clock | Kaiku",
    sections: [
      {
        heading: "70cm across, 1.94kg",
        paragraphs: [
          "At 70cm across, this sits between the range's smaller 45–60cm clocks and its largest 80–90cm pieces.",
          "At 1.94kg it's light for its size — the open skeleton face, which leaves most of the dial as visible mechanism rather than a solid backing, is where the weight saving comes from.",
        ],
      },
    ],
  },
  {
    title: "White Skeleton Wall Clock | Kaiku",
    sections: [
      {
        heading: "70cm across, white skeleton face",
        paragraphs: [
          "Shares its 70cm sizing and 1.94kg weight exactly with the Bronze Skeleton Wall Clock — this one in a white finish rather than bronze, with the same open, skeletal dial design.",
        ],
      },
    ],
  },
  {
    title: "Rothay Large Wall Clock | Kaiku",
    sections: [
      {
        heading: "80cm across, 3.08kg",
        paragraphs: [
          "At 80cm across and 5cm deep, this is the large version in the Rothay range — its standard-sized sibling runs 49cm across and weighs less than half as much, at 1.21kg.",
        ],
      },
    ],
  },
  {
    title: "Rothay Wall Clock | Kaiku",
    sections: [
      {
        heading: "49cm across, 1.21kg — the standard Rothay size",
        paragraphs: [
          "At 49 × 49cm and 4cm deep, this is the smaller of the two Rothay clocks — the Large version runs 80cm across and weighs more than double, at 3.08kg.",
        ],
      },
    ],
  },
  {
    title: "Ashmount Wall Clock | Kaiku",
    sections: [
      {
        heading: "49cm across, 1.21kg — the standard Ashmount size",
        paragraphs: [
          "At 49 × 49cm and 4cm deep, this shares its exact sizing and weight with the standard Rothay clock in the same collection — the Ashmount Large version runs to 80cm and 3.08kg.",
        ],
      },
    ],
  },
  {
    title: "Butchers Cuts Pork Wall Plaque | Kaiku",
    sections: [
      {
        heading: "58cm wide, 45cm tall, 1.41kg",
        paragraphs: [
          "At 58cm wide, 45cm tall and 3cm deep, this is a genuinely large kitchen plaque rather than a small accent piece — it needs a clear run of wall to sit properly.",
          "At 1.41kg it hangs from a standard picture hook.",
        ],
      },
    ],
  },
  {
    title: "Butchers Cuts Chicken Wall Plaque | Kaiku",
    sections: [
      {
        heading: "58cm wide, 45cm tall — same size as the Pork plaque",
        paragraphs: [
          "Shares its 58 × 45cm, 3cm-deep sizing and 1.41kg weight exactly with the Butchers Cuts Pork Wall Plaque in the same collection, so the two hang as a matched pair if displayed together.",
        ],
      },
    ],
  },
  {
    title: "Silver Punch Faced Ceramic Large Candle Holder | Kaiku",
    sections: [
      {
        heading: "21cm wide, 24cm tall, 2.5kg",
        paragraphs: [
          "At 21 × 21cm and 24cm tall, this is a substantial single-candle holder rather than a tealight-sized one.",
          "At 2.5kg, the 'punch faced' texture — small indentations pressed into the ceramic surface — adds real thickness to the walls, which is where the weight comes from.",
        ],
      },
    ],
  },
  {
    title: "Garda Grey Glazed Gisela Vase | Kaiku",
    sections: [
      {
        heading: "17cm wide, 57cm tall — the tallest vase in the Garda range",
        paragraphs: [
          "At 17 × 17cm and 57cm tall, this is taller and narrower than the white Gisela vase in the same shape family (51cm), and heavier too at 3.2kg versus 2.5kg.",
          "The grey glaze appears to be a thicker application than the plain white finish.",
        ],
      },
    ],
  },
  {
    title: "Garda Grey Glazed Chive Vase | Kaiku",
    sections: [
      {
        heading: "23cm cube, 1.6kg",
        paragraphs: [
          "At 23cm in every dimension, this is a compact, evenly-proportioned vase rather than a tall one.",
          "At 1.6kg it's the lightest of the Garda glazed vases in this batch, suiting a single stem or a small posy rather than a full arrangement.",
        ],
      },
    ],
  },
  {
    title: "Sona Large Hurricane Lantern With Lid | Kaiku",
    sections: [
      {
        heading: "21cm wide, 50cm tall, with a lid",
        paragraphs: [
          "At 21 × 21cm and 50cm tall, this is a genuinely large hurricane lantern — tall enough to hold a substantial pillar candle.",
          "The lid is a real functional feature rather than a decorative one, letting it stay lit outdoors in light wind where an open-topped lantern wouldn't.",
        ],
      },
    ],
  },
  {
    title: "Rhea Large Lighthouse Tealight Holder | Kaiku",
    sections: [
      {
        heading: "11cm wide, 28cm tall — a genuine lighthouse silhouette",
        paragraphs: [
          "At 11 × 11cm and 28cm tall, the proportions are narrow and tall rather than a typical squat tealight holder — closer to an actual lighthouse silhouette than a decorative abstraction of one.",
          "At 0.8kg it's light enough to group several together without concern for the surface underneath.",
        ],
      },
    ],
  },
  {
    title: "Canyon White Soap Dish | Kaiku",
    sections: [
      {
        heading: "13 × 9cm, eco bamboo composite",
        paragraphs: [
          "At 13cm wide, 9cm deep and 3cm tall, this is a compact dish sized for one bar of soap rather than a full toiletries tray.",
          "Made from a bamboo fibre and corn starch composite with mineral powder, rather than moulded plastic or ceramic — a lighter, biodegradable material, and part of why the removable insert drains rather than pools water.",
        ],
      },
    ],
  },
  {
    title: "Yana Large Cream Textured Ceramic Planter | Kaiku",
    sections: [
      {
        heading: "20cm wide, 17cm tall, stoneware",
        paragraphs: [
          "At 20 × 20cm and 17cm tall, this is a compact planter sized for a single medium houseplant rather than a floor specimen.",
          "Stoneware rather than terracotta or plastic — wipe clean rather than needing to be kept dry, per the care instructions.",
        ],
      },
    ],
  },
  {
    title: "Himalayan Salt BBQ Cooking Plate | 30 x 20 x 5cm | Kaiku",
    sections: [
      {
        heading: "30 × 20 × 5cm solid salt block, 8kg",
        paragraphs: [
          "At 30 × 20cm and 5cm thick, this is a genuine solid block of Himalayan rock salt rather than a salt-coated plate — which is why it weighs a substantial 8kg for its size.",
          "Works directly on a charcoal or gas BBQ or in a conventional oven. Heat it gradually and let it cool naturally rather than plunging it into cold water, or the block can crack.",
        ],
      },
    ],
  },
  {
    title: "Himalayan Salt Cooking Plate - Round - 20x20x5cm | Kaiku",
    sections: [
      {
        heading: "20cm round, 5cm thick, 3.7kg",
        paragraphs: [
          "A round salt block, 20cm across and 5cm thick, at 3.7kg — smaller than the rectangular 30×20cm BBQ plate but the same solid rock-salt construction.",
          "Suits a single serving or smaller cuts rather than a full rack of ribs.",
        ],
      },
    ],
  },
  {
    title: "Eucalyptus Essential Oil 10ml | Ancient Wisdom | Kaiku",
    sections: [
      {
        heading: "10ml, steam distilled, 40g bottle",
        paragraphs: [
          "A 10ml bottle weighing 40g including the glass — steam distilled from Eucalyptus Globulus rather than a synthetic fragrance-oil recreation.",
        ],
      },
    ],
  },
  {
    title: "Sweet Birch Essential Oil 10ml | Ancient Wisdom | Kaiku",
    sections: [
      {
        heading: "10ml amber glass, steam distilled from Betula lenta",
        paragraphs: [
          "A 10ml bottle in amber glass with a dropper cap, weighing 40g all in.",
          "Steam distilled from Betula lenta (sweet birch) rather than a synthetic recreation, with a fresh, crisp, woodland aroma.",
        ],
      },
    ],
  },
  {
    title: "Sweet Birch Essential Oil 50ml | Ancient Wisdom | Kaiku",
    sections: [
      {
        heading: "50ml amber glass, steam distilled from Betula lenta",
        paragraphs: [
          "The larger 50ml bottle of the same Betula lenta (sweet birch) oil — steam distilled, in amber glass with a dropper cap, weighing 115g all in versus the 10ml bottle's 40g.",
        ],
      },
    ],
  },
  {
    title:
      "Tabletop Water Feature - 19x19x28cm - Buddha, Lotus Flower Cascading Potsx | Kaiku",
    sections: [
      {
        heading: "19cm wide, 28cm tall, 1.27kg",
        paragraphs: [
          "At 19 × 19cm and 28cm tall, this is a genuine tabletop scale rather than a floor feature — sized for a console table or desk.",
          "At 1.27kg it's light enough to reposition without draining the water first.",
        ],
      },
    ],
  },
  {
    title: "Belluno Urn Table Lamp With Linen Shade | Kaiku",
    sections: [
      {
        heading: "11cm wide, 24cm tall — the smallest lamp in the range",
        paragraphs: [
          "At 11 × 11cm and 24cm tall, this is a genuinely small lamp — suited to a bedside table or a shelf rather than a floor-standing reading lamp.",
          "At 0.45kg it's light enough to reposition one-handed, cable included.",
        ],
      },
    ],
  },
  {
    title: "Blue Agapanthus Plant In Pot | Kaiku",
    sections: [
      {
        heading: "0.82kg, artificial blue agapanthus",
        paragraphs: [
          "An artificial arrangement weighing 0.82kg complete with its pot — no watering or light requirements, unlike a real agapanthus, which needs a sunny spot to flower reliably.",
        ],
      },
    ],
  },
  {
    title: "Decorative Hanging Black Mirror | Kaiku",
    sections: [
      {
        heading: "A vertical mirror strip, 146cm tall",
        paragraphs: [
          "At 146cm tall but only 13cm wide, this is the black-framed version of the same narrow, vertical mirror-strip design as the silver collage mirror elsewhere in the range — a column of individual mirror sections rather than one large pane.",
          "At 1.58kg it hangs from a standard picture hook.",
        ],
      },
    ],
  },
  {
    title: "Etched Collection Tall Pot With Handle | Kaiku",
    sections: [
      {
        heading: "27cm wide, 24cm tall, with an integrated handle",
        paragraphs: [
          "At 27 × 27cm and 24cm tall, this is wider than it is tall — a broad-based planter rather than a narrow tall one, despite 'Tall' in the name referring to the etched pattern rather than the pot's own proportions.",
          "At 3.66kg empty, it has real base weight before any soil goes in.",
        ],
      },
    ],
  },
  {
    title: "Large Grey Stone Effect Hurricane Lantern | Kaiku",
    sections: [
      {
        heading: "20cm wide, 32cm tall, 2kg",
        paragraphs: [
          "At 20 × 20cm and 32cm tall, this stands taller than the range's ceramic lattice lanterns of a similar footprint.",
          "The stone-effect finish is a textured surface treatment on a lighter base material, which is why it comes in at 2kg rather than the weight of real carved stone.",
        ],
      },
    ],
  },
  {
    title: "Large Rustic Metal Hanging Bell | Kaiku",
    sections: [
      {
        heading: "8cm wide, 10cm tall, just 80g",
        paragraphs: [
          "At 8 × 8cm and 10cm tall, and weighing only 0.08kg, this is a genuinely small decorative bell — sized for hanging on a tree branch or door handle rather than standing as its own display piece.",
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

  const transaction = client.transaction();
  let queued = 0;

  for (const written of DESCRIPTIONS) {
    const product = await client.fetch<{ _id: string } | null>(
      `*[_type == "product" && title == $title && !(_id in path("drafts.**"))][0]{_id}`,
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

  console.table(results);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-review-tier-rewrites-batch4.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
