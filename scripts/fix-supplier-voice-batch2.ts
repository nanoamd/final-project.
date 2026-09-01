/**
 * Second batch of the "supplier voice" fix — 78 published products currently
 * flagged by a re-run of the detection scan (scripts/scan-supplier-voice.ts;
 * see docs/change-log/2026-09-01-supplier-voice-scan.json), down from the
 * original 71 count Damien saw (8 already fixed in batch1, some products
 * changed hands since, a few new ones joined the list — the brief says not
 * to assume the old list is still accurate, and it wasn't).
 *
 * This batch: 13 products — Premier Housewares sofas/chairs/lamps, three
 * Aosom garden/lighting sets, the Wellness salt plate, and the first two
 * D.I. Designs coffee tables. Every fact below comes from the product's own
 * `dimensions`/`weight`/`specs` fields (checked fresh, not assumed from the
 * scan snapshot) — never a number that only appeared in the old marketing
 * prose being replaced. Two specific data-integrity notes:
 *   - Several of these list a "Cart Weight"/"Shipping Carton Weight" in
 *     their specs, which is the packed/shipping weight, not the item's own
 *     weight — deliberately not presented as the product's weight.
 *   - Himalayan Salt Cooking Plate has two disagreeing weight values on its
 *     own document (weight field 4.8kg vs specs "Approximately 1.5kg" —
 *     same conflict already flagged in the master brief for this exact
 *     product). Weight is omitted rather than guessed between them.
 * Matched by `_id`, not title.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch2.ts --apply
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
    id: "premier-housewares-2405831",
    title: "Hayton Black Velvet Sofa Bed | Kaiku",
    summary:
      "A black velvet sofa bed with a eucalyptus wood frame and gold-finish legs, measuring 209 × 83 × 83cm. Converts to a bed and carries a stated 360kg weight capacity when in use.",
    sections: [
      {
        heading: "Upholstery and Construction",
        paragraphs: [
          "Upholstered in black velvet (polyester) with button-tufted detailing and gold-finish legs, on a frame that includes eucalyptus wood.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Arrives flat-packed and requires assembly. Ships in a single carton, 215 × 106 × 25cm.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "209 × 83 × 83cm (W×D×H) as a sofa, converting to a bed. Stated weight capacity of 360kg.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe the velvet with a damp cloth. As the frame includes natural wood, minor colour variation between pieces is normal.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2405836",
    title: "Hatton Grey Velvet Sofa Bed | Kaiku",
    summary:
      "A grey velvet sofa bed on a solid eucalyptus frame with rose-gold tapered legs and flared armrests, measuring 211 × 83 × 85cm.",
    sections: [
      {
        heading: "Upholstery and Construction",
        paragraphs: [
          "Upholstered in grey velvet over a solid eucalyptus frame with foam padding, finished with rose-gold electroplated tapered legs and flared armrests.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Arrives flat-packed and requires assembly. Ships in a single carton, 183 × 25 × 109cm.",
        ],
      },
      {
        heading: "Dimensions",
        paragraphs: ["211 × 83 × 85cm (W×D×H) as a sofa, converting to a bed."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe clean with a damp cloth. As the frame is solid wood, minor colour variation between pieces is normal.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2407023",
    title: "Miami Black Rattan 3 Piece Patio Set (Seat) | Kaiku",
    summary:
      "A black 3-piece patio set — table and two chairs — with a steel frame, polyethylene rattan weave and a tempered glass tabletop, measuring 80 × 80 × 85cm.",
    sections: [
      {
        heading: "What's Included",
        paragraphs: ["One patio table and two patio chairs."],
      },
      {
        heading: "Materials and Weather Resistance",
        paragraphs: [
          "A steel frame wrapped in black polyethylene rattan, with a tempered glass tabletop. Rated weather-resistant for outdoor use.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: ["Assembly is required. Ships in 3 separate cartons."],
      },
      {
        heading: "Dimensions",
        paragraphs: ["80 × 80 × 85cm (W×D×H)."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe the rattan and steel with a damp cloth. Avoid abrasive materials or chemicals.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5506459",
    title: "Jada Small Striped Planter | Kaiku",
    summary:
      "A small ceramic planter in a natural striped glaze, 15cm across and 13cm tall.",
    sections: [
      {
        heading: "Materials and Finish",
        paragraphs: [
          "Handcrafted from ceramic with a two-toned striped glaze, in a natural colourway.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "15cm in diameter and 13cm tall — sized for a small plant, not a full houseplant repot.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe with a soft cloth. Avoid abrasive cleaners, which can damage the glaze.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511596",
    title: "Karter Chrome Finish And White Glass Shade Floor Lamp | Kaiku",
    summary:
      "A chrome floor lamp with white glass shades, 34 × 34 × 162cm. Takes a G9 bulb (max 5W, not included) and plugs into a standard socket.",
    sections: [
      {
        heading: "Bulb and Wiring",
        paragraphs: [
          "Takes a G9 bulb, maximum 5W, not included. Plugs into a standard socket and has a switch on the flex — no hard-wiring needed.",
        ],
      },
      {
        heading: "Materials and Finish",
        paragraphs: [
          "Constructed from glass and iron, with a chrome finish and white glass shades.",
        ],
      },
      {
        heading: "Dimensions and Assembly",
        paragraphs: [
          "34 × 34 × 162cm (W×D×H). Some assembly of the lamp components is required.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Indoor use only. Wipe with a soft cloth; avoid abrasive cleaners.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5511739",
    title:
      "Hanah Black Snake Leather Effect Table Lamp with Chrome Base | Kaiku",
    summary:
      "A table lamp with a faux snakeskin (leather effect) base, chrome detailing and a black linen shade, 78cm tall and 4.2kg. Takes an E27 bulb up to 60W, not included.",
    sections: [
      {
        heading: "Bulb Requirements",
        paragraphs: ["Takes an E27 bulb, maximum 60W, not included."],
      },
      {
        heading: "Materials and Finish",
        paragraphs: [
          "A faux snakeskin (leather effect) base with a chrome-finished stand and a black linen shade.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "78 × 38 × 38cm (H×W×D), 4.2kg. Arrives fully assembled and free-standing.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Indoor use only. Wipe with a soft cloth; avoid abrasive cleaners.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5527329",
    title: "Tamzin Blue Velvet Curved Back Dining Chair | Kaiku",
    summary:
      "A blue velvet dining chair on an iron and plywood frame with foam padding, measuring 50 × 55 × 80cm. Stated weight capacity of 150kg.",
    sections: [
      {
        heading: "Upholstery and Construction",
        paragraphs: [
          "Upholstered in blue velvet (polyester) over an iron and plywood frame with foam padding, with a curved, tapered back.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Arrives fully assembled. Ships in a single carton, 63 × 81 × 51cm.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "50 × 55 × 80cm (W×D×H). Stated weight capacity of 150kg.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe with a soft cloth. Avoid abrasive cleaners on the velvet or frame.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5529743",
    title: "Ordona Cream Linen 3 Seater Curved Sofa | Kaiku",
    summary:
      "A cream linen-look 3-seater curved sofa with two matching cushions, measuring 272 × 99.5 × 70cm. The frame is a mix of foam, plywood, pine and rubberwood.",
    sections: [
      {
        heading: "Upholstery and Construction",
        paragraphs: [
          "Upholstered in cream polyester with a linen look, over a frame combining plywood (45%), foam (25%), pine (10%) and rubberwood (5%). Includes two matching cushions and a curved profile.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Arrives fully assembled. Ships in a single carton, 276 × 109 × 78cm.",
        ],
      },
      {
        heading: "Dimensions",
        paragraphs: ["272 × 99.5 × 70cm (W×D×H)."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe with a soft cloth. Avoid abrasive cleaners on the upholstery.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-860-025",
    title: "8-Seater Rattan Corner Dining Set with Footstool, Black | Kaiku",
    summary:
      "An 8-seater black rattan garden dining set: two corner sofas with arm, one armless corner sofa, a coffee table and two footstools, on a powder-coated steel frame with PE rattan weave and a tempered glass tabletop. 55kg overall.",
    sections: [
      {
        heading: "What's Included",
        paragraphs: [
          "Two corner sofas with arm, one armless corner sofa, one coffee table and two footstools.",
        ],
      },
      {
        heading: "Frame and Weave Materials",
        paragraphs: [
          "A powder-coated steel frame wrapped in weather-resistant PE rattan, with cushions in polyester cloth and a tempered glass coffee table top. Cushion covers are removable via zip for washing.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Assembly is required. Ships in 3 boxes with an instruction manual.",
        ],
      },
      {
        heading: "Dimensions, Capacity and Weight",
        paragraphs: [
          "Each corner sofa piece measures 110.5 × 62 × 82cm (W×D×H); coffee table 120.5 × 70.5 × 65cm; footstool 40 × 40 × 35cm. Weight capacity of 110kg per sofa seat. Overall set weight 55kg.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe the rattan weave with a dry cloth. Remove cushion covers via the zip for washing; store cushions indoors during poor weather where practical.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-b31-300",
    title: "Eight-Light Crystal Pendant Chandelier, Silver | Kaiku",
    summary:
      "A silver-tone eight-light crystal chandelier in steel and crystal, 50cm across and 16cm deep, 6kg. Hard-wired, with G9 bulbs (max 40W each) not included.",
    sections: [
      {
        heading: "Bulb and Wiring",
        paragraphs: [
          "Takes eight G9 bulbs, maximum 40W each, not included. Hard-wired with a push-button switch — professional installation is required, and a ceiling height over 2.3 metres is recommended.",
        ],
      },
      {
        heading: "Materials and Finish",
        paragraphs: [
          "Constructed from steel and crystal, with a polished silver-tone finish.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["50cm diameter, 16cm deep, 6kg."],
      },
      {
        heading: "Assembly and Care",
        paragraphs: [
          "Ships with a cross hanging board, screws, wall plugs, gloves and a fitting manual. Indoor use only; dust regularly and avoid abrasive cleaners.",
        ],
      },
    ],
  },
  {
    id: "product-aosom-b31-573v00bk",
    title: "Three-Light Crystal Semi-Flush Ceiling Light | Kaiku",
    summary:
      "A black metal and crystal semi-flush ceiling light, 39cm across and 32cm tall, 2kg. Hard-wired, with three E14 bulbs (max 40W each) not included.",
    sections: [
      {
        heading: "Bulb and Wiring",
        paragraphs: [
          "Takes three E14 bulbs, maximum 40W each, not included. Hard-wired for semi-flush ceiling mounting — connection by a qualified electrician is required.",
        ],
      },
      {
        heading: "Materials and Finish",
        paragraphs: ["A black metal frame with crystal detailing."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["39cm diameter, 32cm tall, 2kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Indoor use only; no stated IP rating for damp locations. Dust the crystal and frame with a soft, dry cloth.",
        ],
      },
    ],
  },
  {
    id: "product-aw-csalt-04",
    title: "Himalayan Salt Cooking Plate - Square - 20x20x5cm | Kaiku",
    summary:
      "A square Himalayan salt cooking and serving plate, 20 × 20 × 5cm. Usable on the hob, in the oven or on the grill, and can also be chilled for serving cold food.",
    sections: [
      {
        heading: "Material and Use",
        paragraphs: [
          "A solid block of Himalayan salt, natural in colour and pattern so no two plates are identical. Can be heated directly on the hob, in the oven or on the grill, or chilled and used as a serving surface for cold food.",
        ],
      },
      {
        heading: "Dimensions",
        paragraphs: ["20 × 20 × 5cm, square."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Do not immerse in water or use soap — the porous surface absorbs liquid. Wipe with a damp cloth only, and let the plate cool completely before cleaning. Store somewhere cool and dry.",
        ],
      },
    ],
  },
  {
    id: "product-di-di-abberley-ct-br",
    title: "Abberley Coffee Table in Brown | Kaiku",
    summary:
      "A brown coffee table combining solid oak and oak veneer with a tempered glass top and a lower storage shelf, measuring 110 × 50 × 40cm and weighing 25kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Solid oak and oak veneer with a tempered glass top, in a brown stained finish. A lower storage shelf sits beneath the glass.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: ["Assembly is required."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["110 × 50 × 40cm (W×D×H), 25kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Clean the glass with a soft microfibre cloth and a suitable glass cleaner; dust and wipe the oak frame with a lightly damp cloth. Avoid harsh chemicals or abrasive cleaners, and use coasters for hot drinks.",
        ],
      },
    ],
  },
];

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

function keyFor(id: string): string {
  return id.replace(/[^a-z0-9]+/g, "-").slice(0, 40);
}

async function main() {
  const results: {
    id: string;
    title: string;
    found: boolean;
    titleMatches: boolean;
    currentTitle: string | null;
  }[] = [];

  const transaction = client.transaction();
  let queued = 0;

  for (const written of REWRITES) {
    const doc = await client.fetch<{ _id: string; title: string } | null>(
      `*[_id == $id][0]{_id, title}`,
      { id: written.id },
    );

    results.push({
      id: written.id,
      title: written.title,
      found: !!doc,
      titleMatches: doc?.title === written.title,
      currentTitle: doc?.title ?? null,
    });

    if (!doc) continue;

    if (apply) {
      transaction.patch(written.id, (patch) =>
        patch.set({
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
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-voice-rewrites-batch2.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
