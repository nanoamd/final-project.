/**
 * Rewrite pass for Hill Interiors / AW Dropship product descriptions, to the
 * same standard as the SaunaPlunge sauna/cold-plunge descriptions: several
 * short, bold h2-headed sections, each carrying real facts pulled from that
 * exact product's own document — dimensions, weight, materialTags/colour
 * tags, and genuinely factual nuggets mined out of its FAQ answers (bulb
 * type, assembly, indoor/outdoor use, "use florist cellophane for real
 * flowers", "do not hang above a heat source") and its own previous
 * (single-heading, already-factual) description. No sales voice, no
 * superlatives, nothing invented.
 *
 * Deliberately NOT restating deliveryNotes/returnsNotes/warrantyNotes here —
 * that boilerplate is identical across every Hill Interiors/AW Dropship
 * product and is already rendered in its own tab on the product page
 * (see product-tabs.tsx); repeating it in the description would be padding,
 * not a real per-product fact.
 *
 * Batch 1 of the Hill Interiors + AW Dropship pass (scope: 193 products from
 * those two suppliers). This batch covers 20 of the 149 products that did not
 * already meet the standard (raw supplier marketing copy, hedge language, or
 * fewer than 2 real-fact headings).
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-aw-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-aw-batch1.ts --apply
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
      "A tall, narrow glass candle holder in white, 14 x 14 x 33cm and 3.5kg, sized for a single pillar candle.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A glass candle holder in white, with a tall, narrow silhouette that tapers upward rather than sitting low and wide — suiting a single pillar candle rather than a cluster of tealights.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "14 x 14cm at the base, 33cm tall, weighing 3.5kg — a solid-walled holder rather than a thin blown-glass piece.",
        ],
      },
      {
        heading: "Candle Use and Care",
        paragraphs: [
          "Sized for votive and pillar candles. Clean with warm, soapy water and a soft cloth, and never leave a lit candle unattended.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-17459",
    title:
      "Set Of Three Wooden Lanterns With Traditional Cross Section | Kaiku",
    summary:
      "A set of three wooden lanterns in grey with a cross-section cut design, 31 x 31 x 84cm and 9kg for the set.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A set of three wooden-framed lanterns in a grey finish, each cut with a traditional cross-section pattern and sized to hold a candle inside. Supplied ready to use, with no assembly required.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "Recorded at a 31 x 31cm base, rising up to 84cm tall, and 9kg for the set of three — sized for a hearth, doorway or grouped floor display rather than a tabletop.",
        ],
      },
      {
        heading: "Candle Use and Care",
        paragraphs: [
          "Designed for pillar candles, tealights or LED candles. Suitable for indoor and outdoor use, but best brought inside during severe weather. As an untreated wood finish, keep out of prolonged direct sunlight to avoid fading, and dust with a soft cloth.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-17461",
    title: "Set Of Three Wooden Lanterns With Archway Design | Kaiku",
    summary:
      "A set of three wooden lanterns in grey with an arched cut design, 31 x 31 x 104cm and 11.5kg for the set.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A set of three wooden lanterns in a grey finish, each frame cut with an arched opening rather than a cross-section, and sized to hold a candle inside.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "Recorded at a 31 x 31cm base and up to 104cm tall, weighing 11.5kg for the set — taller than the cross-section design in the same range, suited to a floor position by a fireplace or entranceway rather than a shelf.",
        ],
      },
      {
        heading: "Candle Use and Care",
        paragraphs: [
          "Designed for pillar or tealight candles, and suitable for indoor and outdoor use — bring inside during poor weather. Clean with a soft, dry cloth, avoiding harsh chemicals or abrasives.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-17857",
    title: "Silver Heart Skeleton Wall Clock | Kaiku",
    summary:
      "A silver metal skeleton-style wall clock with a heart motif, 89 x 89 x 4cm and 3.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A large-format skeleton-style wall clock in a silver metal finish, styled with a heart motif. The open, gapped face leaves the wall behind it visible rather than backing it with a solid disc.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "89cm across and 4cm deep, weighing 3.5kg — built to read from across a room, and heavy enough to need a wall fixing rated for that weight rather than a picture hook.",
        ],
      },
      {
        heading: "Power and Care",
        paragraphs: [
          "Runs on standard batteries. For indoor use only, and best kept away from high-humidity areas such as bathrooms. Dust regularly with a soft cloth.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-17858",
    title: "Large Silver Skeleton Wall Clock | Kaiku",
    summary:
      "A large silver metal skeleton-style wall clock, 80 x 80 x 4cm and 2.75kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A large skeleton-style wall clock in a polished silver metal finish; the open face leaves most of the dial as negative space rather than a solid disc.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "80cm across and 4cm deep, weighing 2.75kg — noticeably lighter than solid-cased clocks of the same diameter, thanks to the open skeleton face. A standard picture hook is enough to hang it.",
        ],
      },
      {
        heading: "Power and Care",
        paragraphs: [
          "Runs on standard batteries. Dust regularly with a soft cloth and avoid harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-18282",
    title: "Medium Conran Vase | Kaiku",
    summary: "A ceramic vase in blue, 22 x 22 x 38cm and 3.85kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in blue, with a contemporary silhouette that stands taller and narrower than the wider vases in the same range — proportioned for a single tall stem display rather than a full bunch.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "22 x 22cm at the base, 38cm tall, weighing 3.85kg — stable enough on its own without needing to be weighted with water.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Suitable for fresh or dried flowers, for indoor use. Line the vase with florist cellophane before adding real flowers, and clean with a soft, damp cloth rather than abrasive cleaners.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19417",
    title: "Aged Stone Ceramic Vase | Kaiku",
    summary:
      "A ceramic vase with an aged stone-effect finish, 29 x 29 x 30cm and 7kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase with an aged stone-effect finish fired into the glaze rather than painted on afterwards, giving it texture and a neutral, weathered tone.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "A squat, wide-based vase at 29 x 29cm and 30cm tall, weighing 7kg — stable enough for larger dried stems without a wide flower spread tipping it over.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Suitable for fresh or dried flowers, for indoor use; line with florist cellophane before adding real flowers. Clean with a soft, damp cloth, using a mild detergent for tougher marks.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19418",
    title: "Aged Stone Tall Ceramic Vase | Kaiku",
    summary:
      "A tall ceramic vase with an aged stone-effect finish, 28 x 28 x 45cm and 7.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "The taller sibling to the Aged Stone vase, sharing the same fired-in aged stone finish across a slimmer body.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "28 x 28cm at the base, 45cm tall, weighing 7.5kg — only half a kilo heavier than the shorter version despite standing 15cm taller, so the extra height comes from a slimmer body rather than more material. Suits a floor position or low console table rather than a shelf.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Suitable for fresh or dried flowers, for indoor use; line with florist cellophane before adding real flowers. Clean with a soft cloth, taking care to avoid chips.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19428",
    title: "Large Conical Ceramic Lattice Hurricane Lantern | Kaiku",
    summary:
      "A white ceramic hurricane lantern with a lattice cut pattern, 17 x 17 x 22cm and 1.4kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic hurricane lantern in white, cut with a lattice pattern that lets candlelight show through the sides rather than only the open top. The larger of two lattice lanterns in the range — the round version stands just 11cm tall by comparison.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["17 x 17cm at the base, 22cm tall, weighing 1.4kg."],
      },
      {
        heading: "Candle Use and Care",
        paragraphs: [
          "Takes standard-size candles, including LED candles for a flame-free option. Suitable for indoor and outdoor use — best brought inside in poor weather. Clean with a soft, damp cloth.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19429",
    title: "Round Ceramic Lattice Hurricane Lantern | Kaiku",
    summary:
      "A white ceramic hurricane lantern with a lattice cut pattern, 17 x 17 x 11cm and 0.65kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "The smaller, squatter sibling to the Large Conical lattice lantern — the same 17cm base, cut with the same lattice pattern, but standing just 11cm tall.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "17 x 17cm at the base, 11cm tall, weighing 0.65kg — light enough to sit as one of a scattered group rather than a single centrepiece.",
        ],
      },
      {
        heading: "Candle Use and Care",
        paragraphs: [
          "Suitable for pillar and tealight candles, indoors or outdoors — bring inside in poor weather. Clean the ceramic surface with a damp cloth, avoiding harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-19501",
    title: "Downton Large Antique White Vase | Kaiku",
    summary:
      "A large ceramic vase in antique white, 39 x 39 x 41cm and 7.95kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in an antique white finish, with a rounded silhouette that sits close to as wide as it is tall rather than a slender one.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "39 x 39cm at the base, 41cm tall, weighing just under 8kg empty — enough base weight to hold a large, heavy floral arrangement without the stems pulling it off balance.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Best kept indoors to preserve its finish. Suitable for fresh or dried flowers; line with florist cellophane before adding real flowers, and clean with a soft, damp cloth.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-20782",
    title: "Garda Glazed Gisela Vase | Kaiku",
    summary: "A tall, glazed ceramic vase in white, 18 x 18 x 51cm and 2.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in white with a glossy glaze finish, in a slim, tall-necked silhouette proportioned for single long stems — branches or tall grasses — rather than a full round bunch.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "18 x 18cm at the base, 51cm tall, weighing 2.5kg — light for its height, so it's worth placing somewhere it won't get knocked.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Suitable for fresh flowers; line with florist cellophane before adding real stems. Clean with a soft, damp cloth, using a mild soap solution for tougher marks.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-20806",
    title: "Square Decorative Hanging Collage Mirror In Silver | Kaiku",
    summary:
      "A vertical hanging mirror made of a column of square mirror sections in a silver frame, 14 x 145 x 2cm and 1.86kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A vertical run of individual square mirror sections in a silver metal frame, reading as a narrow column rather than one large mirror.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "145cm tall but only 14cm wide and 2cm deep, weighing 1.86kg — light enough to hang from a standard picture hook.",
        ],
      },
      {
        heading: "Installation and Care",
        paragraphs: [
          "Supplied ready for wall mounting with standard hardware. Do not hang or place above a heat source. Clean with a soft, lint-free cloth, avoiding abrasive cleaners that could scratch the glass.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-20836",
    title: "Tristan Mirror And Wood 4X6 Frame | Kaiku",
    summary:
      "A mirror in a brown wood frame, the smaller 4x6 size, 24 x 29 x 2cm and 0.83kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A mirror in a wood frame with a natural brown finish — the smaller of two Tristan frame sizes in the range (a 5x7 version is also available, larger on both dimensions).",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "24cm wide, 29cm tall and 2cm deep, weighing 0.83kg — light enough to hang from a single picture hook.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use only. Keep out of direct sunlight to preserve the wood frame's colour, and clean the glass with a soft cloth and a suitable glass cleaner.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-20837",
    title: "Tristan Mirror And Wood 5X7 Frame | Kaiku",
    summary:
      "A mirror in a brown wood frame, the larger 5x7 size, 26 x 31 x 2cm and 1.05kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A mirror in a wood frame with a natural brown finish — the larger of two Tristan frame sizes, about 20% bigger in both directions than the 4x6 version.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "26cm wide, 31cm tall and 2cm deep, weighing 1.05kg — 0.22kg heavier than the 4x6 version, from the larger wood frame. Designed to be wall-hung rather than free-standing.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean with a soft, non-abrasive cloth and a mild glass cleaner.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-20854",
    title: "Antique Etched foxed Wall Art Mirror | Kaiku",
    summary:
      "A wall mirror with a bronze-toned frame and an etched 'foxed' antique-mirror finish, 62 x 92 x 3cm and 5.8kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A mirror with a bronze-toned frame and a 'foxed' finish — the etched, mottled clouding worked into the glass itself, the classic antique-mirror effect, rather than only the frame around it.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "62cm wide, 92cm tall and 3cm deep, weighing 5.8kg — a genuine statement-mirror size, big enough to anchor a hallway or living room wall on its own. Comes ready to hang, with no assembly required.",
        ],
      },
      {
        heading: "Installation and Care",
        paragraphs: [
          "For indoor use only, and should not be hung or placed above a heat source. Dust regularly with a soft cloth, and use a lightly damp cloth with a gentle cleaner for a deeper clean.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21186",
    title: "Large Frosted Eucalyptus Candle Wreath | Kaiku",
    summary:
      "A frosted eucalyptus candle wreath in plastic, 33cm diameter and 0.13kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wreath of artificial frosted eucalyptus foliage in plastic, designed to mimic natural greenery, sized to sit around a pillar candle rather than a single tealight.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "A 33cm-diameter ring, 8cm deep, weighing just 0.13kg — light enough to need no reinforced hanging point, just a small hook or nail.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use only. Dust with a dry cloth — avoid water or cleaning solutions — and store in a cool, dry place out of direct sunlight when not in use.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21248",
    title: "Luxe Collection Natural Glow S/ 2 Ivory LED Dinner Candles | Kaiku",
    summary:
      "A set of two flameless LED dinner candles in ivory, 2 x 2 x 25cm and 0.3kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A set of two flameless LED dinner candles in ivory, designed to resemble traditional wax candles with a flickering-light effect, and battery operated rather than lit with a flame. Arrives fully assembled.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "2 x 2cm and 25cm tall — slim dinner-candle proportions, sized to sit in a candlestick holder rather than stand freely. The set of two weighs 0.3kg together.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Fits standard candle holders, and can be used indoors or outdoors. Being flameless, it's a safer option in homes with children or pets. Wipe with a soft, damp cloth — there's no wax residue to clean.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21358",
    title: "Darcy Ople Vase | Kaiku",
    summary: "A cube-shaped ceramic vase, 20 x 20 x 20cm and 1.38kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in a genuinely cube-proportioned silhouette — 20cm in every dimension — an unusual shape in the range, where most vases run noticeably taller than they are wide.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "20 x 20 x 20cm, weighing 1.38kg — light enough to reposition easily.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use, kept in a dry area away from moisture. Suitable for fresh flowers; line with florist cellophane before adding real stems. Clean with a soft, damp cloth, avoiding harsh chemicals.",
        ],
      },
    ],
  },
  {
    id: "hill-decor-21499",
    title: "Marble Effect Ellipse Large Vase | Kaiku",
    summary:
      "A large ceramic vase with a marble-effect finish in grey, 23 x 23 x 36cm and 2.18kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic vase in grey with a marble-effect finish and an elliptical silhouette — tall enough for a proper stem display rather than a low arrangement.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "23 x 23cm at the base, 36cm tall, weighing 2.18kg — a stable design that resists tipping even when filled with flowers.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "Recommended for indoor use. Suitable for fresh or dried flowers; line with florist cellophane before adding real stems. Clean with a soft, damp cloth, using a gentle cleaner for tougher marks.",
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
      {
        id: written.id,
      },
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
    "docs/change-log/2026-09-01-rewrite-descriptions-hill-aw-batch1.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
