/**
 * Rewrite pass for Hill Interiors / AW Dropship product descriptions — see
 * scripts/rewrite-descriptions-hill-aw-batch1.ts for the full standard and
 * rationale.
 *
 * Batch 4: 20 more AW Dropship products — more reclaimed-teak furniture
 * (same "Care and Warranty" pattern as batch 3: no manufacturer's warranty,
 * a real fact from warrantyNotes, not boilerplate), a beer-barrel table and
 * stool, two Himalayan salt cooking plates, three Ancient Wisdom essential
 * oils, a plant-stand set, three Albasia-wood storage pieces, a
 * tamarind-and-resin coffee table, and three handcrafted "squiggly" mirrors.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-aw-batch4.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-hill-aw-batch4.ts --apply
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
    id: "product-aw-acshop-14",
    title: "Round Reclaimed Teak Bedside Table with Drawer | Kaiku",
    summary:
      "A handcrafted reclaimed teak bedside table with a drawer and open shelf, 45 x 37 x 57cm and 13kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed solid teak sourced from retired Indonesian fishing boats, made in Bali. Natural variations in grain, colour and texture are part of the material's character.",
        ],
      },
      {
        heading: "Storage and Design",
        paragraphs: [
          "One drawer for concealed storage, plus a lower open shelf, in a rounded silhouette.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "45 x 37 x 57cm (L x W x H), weighing 13kg. Most people can manage that alone, though it's easier with help. Delivered fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust regularly with a soft cloth and wipe away spills promptly; avoid harsh cleaning products and prolonged exposure to moisture. Supplied without a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-17",
    title: "Tall Reclaimed Teak Chest of 5 Drawers | Kaiku",
    summary:
      "A tall handcrafted reclaimed teak chest of five drawers, 48 x 40 x 110cm and 50kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed solid teak sourced from retired Indonesian fishing boats. Natural variations in grain, colour and texture are part of the material's character.",
        ],
      },
      {
        heading: "Storage and Design",
        paragraphs: [
          "Five drawers in a tall, slim profile suited to rooms where floor space is limited.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "48 x 40 x 110cm (L x W x H), weighing 50kg — a two-person lift, so have help ready on delivery day. Delivered fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust regularly with a soft, dry cloth and wipe away spills promptly; avoid harsh chemical cleaners and prolonged exposure to moisture. Supplied without a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-18",
    title:
      "Large Reclaimed Wood TV Stand with 2 Drawers & Open Shelving | Kaiku",
    summary:
      "A large handcrafted reclaimed teak TV stand with two drawers and open shelving, 140 x 40 x 75cm and 46.3kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed teak wood sourced from retired fishing boats — each piece has its own distinctive grain, colour and character, so slight variations from the photos are expected.",
        ],
      },
      {
        heading: "Storage and Design",
        paragraphs: [
          "Two drawers plus open shelving, on a tabletop sized for a large television.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "140 x 40 x 75cm (L x W x H), weighing 46.3kg — a two-person lift, so have help ready on delivery day. Delivered fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Dust regularly with a soft, dry cloth; avoid harsh cleaning products and prolonged exposure to moisture or direct sunlight. Not supplied with a manufacturer's warranty, though covered by your statutory consumer rights under UK law.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-19",
    title: "Bedside Table - Classic - Recycled Wood | Kaiku",
    summary:
      "A handcrafted reclaimed wood bedside table with a drawer and shelf, 42 x 51 x 65cm and 13.06kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Handcrafted from reclaimed wood, with each piece carrying its own natural grain, colour and character — no two tables are exactly alike.",
        ],
      },
      {
        heading: "Storage and Design",
        paragraphs: [
          "A drawer for concealed storage, plus an open lower shelf, topped with a surface sized for bedside essentials.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "Measures 42 x 51 x 65cm, weighing 13.06kg. Most people can manage that alone, though it's easier with help.",
        ],
      },
      {
        heading: "Use, Care and Warranty",
        paragraphs: [
          "For indoor use only. Wipe with a soft, dry or slightly damp cloth, avoiding harsh cleaning products. Not supplied with a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-acshop-21",
    title: "Large Reclaimed Wood Coffee Table | Recycled Teak | Kaiku",
    summary:
      "A large handcrafted reclaimed teak coffee table with an open shelf, 122 x 61 x 41cm and 19.5kg.",
    sections: [
      {
        heading: "Materials and Craftsmanship",
        paragraphs: [
          "Made from reclaimed teak wood that has been responsibly repurposed — each table features its own natural grain, colour variations and character, so no two are exactly alike.",
        ],
      },
      {
        heading: "Storage and Design",
        paragraphs: [
          "A spacious open lower shelf beneath the tabletop, suited to books, magazines or decorative accessories.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "122 x 61 x 41cm (L x W x H), weighing 19.5kg. Most people can manage that alone, though it's easier with help. Minimal assembly may be required. Due to its size and weight, specialist furniture or pallet delivery may be needed.",
        ],
      },
      {
        heading: "Use, Care and Warranty",
        paragraphs: [
          "For indoor use only, kept in a dry environment. Wipe with a soft, dry or slightly damp cloth, avoiding harsh chemicals and direct sunlight. Not supplied with a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-bts-01",
    title: "Beer Barrel Table – Natural Wood 60 x 48.5 cm | Kaiku",
    summary:
      "A handcrafted natural wood barrel-shaped table, 60 x 48.5cm and 4.72kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A barrel-shaped table handcrafted from natural wood, available in white or natural wood finishes — each piece has its own grain and colour variations.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "60 x 48.5cm, weighing 4.72kg. Minimal assembly may be required depending on how it's packaged for delivery.",
        ],
      },
      {
        heading: "Use, Care and Warranty",
        paragraphs: [
          "Suitable for indoor use or covered outdoor spaces — keep it protected from prolonged rain and harsh weather. Not supplied with a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-bts-02",
    title: "Natural Wooden Beer Barrel Storage Stool | Kaiku",
    summary:
      "A handcrafted Albasia wood barrel-shaped storage stool, 38cm tall and 32cm diameter, 2kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A barrel-shaped stool handcrafted from solid Albasia wood with decorative metal-style bands, available in natural or whitewash finishes.",
        ],
      },
      {
        heading: "Storage and Dimensions",
        paragraphs: [
          "A removable seat lifts to reveal a concealed storage compartment. Measures 38cm tall with a 32cm diameter, weighing 2kg. Delivered fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Wipe clean with a soft, dry or slightly damp cloth; avoid harsh cleaning products and prolonged exposure to moisture or direct sunlight. Not supplied with a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-csalt-01",
    title: "Himalayan Salt BBQ Cooking Plate | 30 x 20 x 5cm | Kaiku",
    summary:
      "A solid Himalayan rock salt BBQ cooking plate, 30 x 20 x 5cm and 8kg.",
    sections: [
      {
        heading: "Material and Use",
        paragraphs: [
          "A genuine solid block of Himalayan rock salt (not a salt-coated plate), which is why it weighs a substantial 8kg for its size. Works directly on a charcoal or gas BBQ, or in a conventional oven — heat it gradually and it seasons food gently as it cooks. Chilled, it also serves cold foods such as cheeses, sushi, fruit and desserts.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["30 x 20 x 5cm, weighing 8kg."],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Let the plate cool naturally before wiping with a damp cloth — avoid detergents and plunging it into cold water, which can crack the block. Not supplied with a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-csalt-03",
    title: "Himalayan Salt Cooking Plate - Round - 20x20x5cm | Kaiku",
    summary:
      "A round solid Himalayan rock salt cooking plate, 20 x 20 x 5cm and 3.7kg.",
    sections: [
      {
        heading: "Material and Use",
        paragraphs: [
          "A round block of genuine Himalayan rock salt, 20cm across and 5cm thick — the same solid construction as the rectangular BBQ plate, but sized for a single serving or smaller cuts rather than a full rack of ribs.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["20 x 20 x 5cm, weighing 3.7kg."],
      },
      {
        heading: "Care",
        paragraphs: [
          "Avoid water exposure; clean with a damp cloth only, without soap, and store in a cool, dry place.",
        ],
      },
    ],
  },
  {
    id: "product-aw-eo-03",
    title: "Eucalyptus Essential Oil 10ml | Ancient Wisdom | Kaiku",
    summary:
      "A 10ml bottle of steam-distilled Eucalyptus Essential Oil in amber glass, 0.04kg.",
    sections: [
      {
        heading: "Product and Materials",
        paragraphs: [
          "A 10ml bottle of Eucalyptus Essential Oil, steam distilled from Eucalyptus Globulus rather than a synthetic fragrance-oil recreation, in an amber glass bottle that protects the oil from light.",
        ],
      },
      {
        heading: "Weight",
        paragraphs: ["Weighs 0.04kg including the glass bottle."],
      },
      {
        heading: "Use and Storage",
        paragraphs: [
          "For use in diffusers or oil burners, or diluted in a carrier oil for massage — never apply undiluted to skin. Store upright in a cool, dry place away from direct sunlight, with the cap tightly closed after use.",
        ],
      },
    ],
  },
  {
    id: "product-aw-eo-76",
    title: "Sweet Birch Essential Oil 10ml | Ancient Wisdom | Kaiku",
    summary:
      "A 10ml bottle of steam-distilled Sweet Birch Essential Oil in amber glass, 0.04kg.",
    sections: [
      {
        heading: "Product and Materials",
        paragraphs: [
          "A 10ml bottle of Sweet Birch Essential Oil, steam distilled from Betula lenta rather than a synthetic recreation, in an amber glass bottle with a dropper cap.",
        ],
      },
      {
        heading: "Weight",
        paragraphs: ["Weighs 0.04kg including the glass bottle."],
      },
      {
        heading: "Use and Storage",
        paragraphs: [
          "For use in diffusers or oil burners, or diluted in a carrier oil for massage — never apply undiluted to skin. Store upright in a cool, dry place away from direct sunlight, with the cap tightly closed after use.",
        ],
      },
    ],
  },
  {
    id: "product-aw-preo-76",
    title: "Sweet Birch Essential Oil 50ml | Ancient Wisdom | Kaiku",
    summary:
      "A 50ml bottle of steam-distilled Sweet Birch Essential Oil in amber glass, 0.115kg.",
    sections: [
      {
        heading: "Product and Materials",
        paragraphs: [
          "The larger 50ml bottle of the same Sweet Birch Essential Oil (Betula lenta), steam distilled, in an amber glass bottle with a dropper cap.",
        ],
      },
      {
        heading: "Weight",
        paragraphs: [
          "Weighs 0.115kg including the glass bottle — the 10ml version weighs 0.04kg.",
        ],
      },
      {
        heading: "Use and Storage",
        paragraphs: [
          "For use in diffusers or oil burners, or diluted in a carrier oil for massage — never apply undiluted to skin. Store upright in a cool, dry place away from direct sunlight.",
        ],
      },
    ],
  },
  {
    id: "product-aw-pss-03",
    title: "Set of 3 Gamal Wood Plant Stands | Kaiku",
    summary:
      "A set of three Gamal wood plant stands on black metal hairpin legs, 2kg together.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A set of three plant stands with solid Gamal wood tops on black metal hairpin legs — for displaying plants and décor only, not for use as seating.",
        ],
      },
      {
        heading: "Dimensions",
        paragraphs: [
          "Three graduated sizes: tops of 22cm, 20cm and 18cm diameter, each 5cm thick, at heights of 40cm, 30cm and 20cm. The set weighs 2kg together. Simple assembly is required.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "As a natural wood, grain and colour vary slightly between pieces. Not supplied with a manufacturer's warranty, though any manufacturing defect on arrival will be resolved by customer support.",
        ],
      },
    ],
  },
  {
    id: "product-aw-rds-146",
    title: "Large Brown Wooden Storage Tub | Kaiku",
    summary: "A brown Albasia wood storage tub, 45 x 45 x 32cm and 1.55kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "An open-top storage tub in brown, made from lightweight Albasia wood, also available in a whitewash finish.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "45 x 45 x 32cm, weighing 1.55kg — light enough to carry and reposition around the home. Delivered fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "As a natural wood, grain and colour vary slightly between pieces. Not supplied with a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-rds-149",
    title: "Natural Folding Wooden A-Frame Shelf – Brown | Kaiku",
    summary:
      "A folding brown Albasia wood A-frame shelf, 31 x 40 x 105cm and 5.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A tall, narrow A-frame shelf in brown, built from Albasia wood — a lighter, faster-growing timber than standard hardwood, which is part of why it's just 5.5kg. Also available in a whitewash finish.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "31cm deep, 40cm wide and 105cm tall, weighing 5.5kg. The A-frame folds flat for storage or moving rather than needing to be dismantled and rebuilt. Minimal assembly may be required.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "Wipe with a soft, dry or slightly damp cloth; avoid harsh chemicals and prolonged exposure to moisture. Not supplied with a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-rds-151",
    title: "Brown Wooden Storage Crates (Set of 3) | Kaiku",
    summary:
      "A set of three nesting brown Albasia wood storage crates, 3kg together.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A set of three stacking, nesting storage crates in brown, made from Albasia wood — also available in bluewash, greenwash or whitewash finishes.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "Three sizes: large at 45 x 30 x 25cm, medium at 35 x 25 x 24cm, and small at 25 x 20 x 20cm, weighing 3kg together. They nest inside one another for storage when not in use. Delivered fully assembled.",
        ],
      },
      {
        heading: "Care and Warranty",
        paragraphs: [
          "As a natural wood, grain and colour vary slightly between pieces. Not supplied with a manufacturer's warranty, though covered by your statutory consumer rights.",
        ],
      },
    ],
  },
  {
    id: "product-aw-rwa-01",
    title: "Tamarind & Resin Coffee Table – Aqua | Kaiku",
    summary:
      "A tamarind wood coffee table with cast aqua resin, 46 x 47cm and 31kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A table made from tamarind wood with aqua resin cast directly against it rather than painted on top — giving the colour real depth, and also available in a sky blue finish.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "46 x 47cm, weighing 31kg — heavy for its size, since it's solid cast resin rather than a hollow shell. Worth deciding its spot in advance, since it isn't a table you'll reposition often.",
        ],
      },
      {
        heading: "Warranty",
        paragraphs: [
          "Not supplied with a manufacturer's warranty, though covered by the Consumer Rights Act 2015.",
        ],
      },
    ],
  },
  {
    id: "product-aw-ssm-03",
    title: "Soft Squiggly Mirror – Star – Mauve (33x31x2.3cm) | Kaiku",
    summary:
      "A handcrafted star-shaped mirror with a mauve squiggly frame, 33 x 31 x 2.3cm and 0.658kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A star-shaped mirror with a wavy, hand-shaped 'squiggly' frame in mauve, handcrafted from reclaimed materials — each one unique, so no two are exactly alike.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "33 x 31cm with a 2.3cm-deep frame, weighing 0.658kg — light enough to hang from a standard picture hook.",
        ],
      },
      {
        heading: "Use and Care",
        paragraphs: [
          "For indoor use only. Dust with a soft, dry cloth, using a mild soapy solution when needed — avoid abrasive cleaners, and keep away from direct sunlight to preserve the colour.",
        ],
      },
    ],
  },
  {
    id: "product-aw-ssm-05",
    title:
      "Soft Squiggly Mirror – Chunky Frame – Royal Blue (30.5x22.5x2.3cm) | Kaiku",
    summary:
      "A handcrafted mirror with a royal blue chunky squiggly frame, 30.5 x 22.5 x 2.3cm and 0.58kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A mirror with a wavy, hand-shaped 'squiggly' frame in royal blue, with a chunky 2.3cm-deep profile. Each one is handcrafted, so the exact curve of the frame varies slightly from mirror to mirror.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "30.5 x 22.5cm and 2.3cm deep, weighing 0.58kg — light enough to hang from a standard picture hook. No assembly required.",
        ],
      },
      {
        heading: "Care",
        paragraphs: [
          "Wipe with a soft, damp cloth, avoiding abrasive cleaners.",
        ],
      },
    ],
  },
  {
    id: "product-aw-ssm-06",
    title: "Soft Squiggly Mirror – Flower – Stone (25.4x25.4x2.3cm) | Kaiku",
    summary:
      "A handcrafted flower-shaped mirror with a stone-toned squiggly frame, 25.4 x 25.4 x 2.3cm and 0.486kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A flower-shaped mirror with a wavy, hand-shaped 'squiggly' frame in a stone tone, handcrafted from reclaimed materials — each one unique.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["25.4 x 25.4cm and 2.3cm deep, weighing 0.486kg."],
      },
      {
        heading: "Installation and Care",
        paragraphs: [
          "Mount securely on the wall. Dust regularly, using a soft cloth with a gentle, non-abrasive cleaner — avoid harsh chemicals.",
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
    "docs/change-log/2026-09-01-rewrite-descriptions-hill-aw-batch4.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
