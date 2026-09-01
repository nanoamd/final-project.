/**
 * First batch of the "supplier voice" quality problem: published products
 * whose description is raw manufacturer/supplier marketing copy pasted in
 * verbatim, never rewritten into Kaiku's own voice. Different failure mode
 * from the zero-fact REVIEW backlog — these are stuffed with facts, which is
 * exactly why the existing audit (scoreProduct/ARTEFACTS) never flagged them.
 * Found by scanning every published description for trademark symbols,
 * marketing buzzwords ("premium", "luxury", "why choose", ...) and
 * self-referential third-person sales phrasing ("the <Product> offers/
 * delivers/features..."). 71 published products flagged total; this batch
 * is the worst cluster — the 8 SaunaPlunge saunas/plunge, all trademark-
 * symbol-flagged, all score 8-10.
 *
 * Every fact below is pulled from each product's own `specs`/`dimensions`
 * fields or a concrete, specific technical claim in the original body copy
 * (a stated wattage, temperature range, warranty term) — never the
 * manufacturer's own superlatives or unhedged health claims. Matched by
 * `_id`, not title, since one title has a stray double space.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-supplier-voice-batch1.ts --apply
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
    id: "product-import-2-person-outdoor-infrared-sauna-saunaplunge-9b8264b5",
    title:
      "SaunaPlunge™ Yorkshire Cabin 2-Person Outdoor Infrared Sauna | Kaiku",
    summary:
      "An infrared sauna for two, built from thermo-treated spruce with low EMF carbon heaters, a Smart WiFi controller and colour-therapy lighting. Runs from a standard 13A plug and is covered by a 1-year manufacturer's warranty.",
    sections: [
      {
        heading: "Heating Technology and Session Comfort",
        paragraphs: [
          "This is an infrared sauna, not a traditional steam sauna — low EMF carbon infrared heaters warm the body directly rather than heating the surrounding air, so it runs at lower temperatures than a traditional sauna while still delivering even warmth throughout the two-person cabin. A Smart WiFi LCD controller handles temperature and session settings, including pre-heating remotely, and colour-therapy lighting is built into the cabin.",
        ],
      },
      {
        heading: "Cabin Materials and Design",
        paragraphs: [
          "Built from thermo-treated spruce — timber that's heat-treated rather than chemically treated to resist moisture and movement outdoors — with a full-height glazed front.",
        ],
      },
      {
        heading: "Assembly, Power and Site Requirements",
        paragraphs: [
          "Supplied as a modular kit with assembly instructions for DIY installation; professional installation is available if you'd rather have it fitted for you. It needs a solid, level base — concrete, paving or reinforced decking — capable of supporting the assembled weight, and runs from a standard 13A plug rather than needing to be hard-wired, though we'd recommend having your outdoor electrical supply checked by a qualified electrician before first use.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Built for two people, with cabin dimensions of 120 × 105 × 190cm (W×D×H).",
        ],
      },
      {
        heading: "Warranty and Delivery",
        paragraphs: [
          "Covered by a 1-year manufacturer's warranty against manufacturing defects in structural integrity, workmanship, materials and the supplied electrical components under normal residential use — it doesn't cover incorrect installation, misuse, accidental damage or normal wear and tear. Delivered free to UK mainland addresses.",
        ],
      },
    ],
  },
  {
    id: "product-import-4-person-indoor-infrared-sauna-saunaplunge-25f636e4",
    title: "SaunaPlunge™ Dales Glow 4-Person Indoor Infrared Sauna | Kaiku",
    summary:
      "An indoor infrared sauna for up to four, built from Canadian hemlock with low EMF carbon heaters, a Smart WiFi controller and colour-therapy lighting. Plug-and-play from a standard 13A socket.",
    sections: [
      {
        heading: "Heating Technology and Session Comfort",
        paragraphs: [
          "An infrared sauna rather than a traditional steam sauna: low EMF carbon infrared heaters are positioned throughout the cabin to warm the body directly, at lower running temperatures than a traditional sauna, with even heat across all four seats. A Smart WiFi LCD controller handles temperature and session settings, and colour-therapy lighting is built in.",
        ],
      },
      {
        heading: "Cabin Materials and Design",
        paragraphs: [
          "Built from Canadian hemlock, with a full-glass front that lets natural light into the cabin.",
        ],
      },
      {
        heading: "Assembly and Power Requirements",
        paragraphs: [
          "Supplied as a modular kit with assembly instructions; most installations can be completed by two people, though professional installation can be arranged. It needs a flat, solid indoor surface and a standard 13A household socket — no hard-wiring required.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Seats up to four people, with cabin dimensions of 180 × 120 × 190cm (W×D×H).",
        ],
      },
      {
        heading: "Warranty",
        paragraphs: [
          "Covered by a 1-year manufacturer's warranty against manufacturing defects.",
        ],
      },
    ],
  },
  {
    id: "product-import-bronte-2-person-cabin-sauna-saunaplunge-0875b2a6",
    title: "SaunaPlunge™ Bronte 2-Person Outdoor Cabin Sauna | Kaiku",
    summary:
      "A traditional Finnish-style sauna for two, heated by a 4.5kW Harvia electric heater and built from thermo-treated spruce. The heater is hard-wired by a qualified electrician, not plug-in.",
    sections: [
      {
        heading: "Heating Technology and Session Comfort",
        paragraphs: [
          "A traditional Finnish-style sauna rather than an infrared one — a Harvia electric heater (4.5kW) heats the air inside the cabin to around 90–100°C, and you can pour water over the sauna stones for steam if you want a more humid session. Harvia is one of the most established names in sauna heating.",
        ],
      },
      {
        heading: "Cabin Materials and Design",
        paragraphs: [
          "Built from thermo-treated spruce, a timber that's heat-treated to resist moisture and movement outdoors without chemical preservatives.",
        ],
      },
      {
        heading: "Assembly, Power and Site Requirements",
        paragraphs: [
          "Supplied as a modular kit with assembly instructions; professional installation is recommended. Before installation you'll need a solid, level base (concrete, paving or reinforced decking), clear access for delivery and assembly, drainage around the site, and a dedicated electrical circuit — the Harvia heater is hard-wired by a qualified electrician in line with UK electrical regulations, it isn't a plug-in unit.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Built for two people, with cabin dimensions of 120 × 110 × 200cm (W×D×H).",
        ],
      },
    ],
  },
  {
    id: "product-import-bronte-6-person-cabin-sauna-saunaplunge-cae97287",
    title: "SaunaPlunge™ Bronte 6-Person Outdoor Cabin Sauna | Kaiku",
    summary:
      "A traditional Finnish-style sauna for up to six, heated by a 6kW Harvia electric heater and built from thermo-treated spruce. The heater is hard-wired by a qualified electrician, not plug-in.",
    sections: [
      {
        heading: "Heating Technology and Session Comfort",
        paragraphs: [
          "A traditional Finnish-style sauna, heated by a 6kW Harvia electric heater that brings the cabin air to around 90–100°C; pour water over the sauna stones for steam if you prefer a more humid session.",
        ],
      },
      {
        heading: "Cabin Materials and Design",
        paragraphs: [
          "Built from thermo-treated spruce, heat-treated for outdoor durability, with weather-resistant detailing.",
        ],
      },
      {
        heading: "Assembly, Power and Site Requirements",
        paragraphs: [
          "Supplied as a modular kit; professional installation is recommended given the sauna's size and electrical requirements. You'll need a solid, level base (concrete, paving or reinforced decking), clear delivery and assembly access, drainage around the site, and a dedicated electrical circuit installed by a qualified electrician — the 6kW Harvia heater is hard-wired, not plug-in.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Seats up to six people, with cabin dimensions of 180 × 160 × 200cm (W×D×H).",
        ],
      },
    ],
  },
  {
    id: "product-import-ice-bath-with-chiller-saunaplunge-7c314725",
    title: "SaunaPlunge™ Peak Plunge Ice Bath with Chiller | Kaiku",
    summary:
      "A 1-2 person cold plunge with an integrated chiller and filtration system, built from 1.5mm rust-proof stainless steel and holding 900 litres. Keeps water at a set temperature of roughly 3-10°C without needing ice.",
    sections: [
      {
        heading: "Cooling System and Water Care",
        paragraphs: [
          "An integrated chiller keeps the water at a set temperature — approximately 3–10°C — around the clock, with digital temperature control, rather than relying on bags of ice. An integrated filtration system helps keep the water clear between full changes, and it's compatible with standard spa water-treatment products.",
          "With regular use, plan to replace the water every 4–6 weeks (every 6–8 weeks with lighter use), keeping pH between 7.2–7.6 and chlorine at 1–3ppm or bromine at 2–4ppm.",
        ],
      },
      {
        heading: "Build and Capacity",
        paragraphs: [
          "A 1–2 person plunge built from 1.5mm rust-proof stainless steel, holding 900 litres.",
        ],
      },
      {
        heading: "Installation and Site Requirements",
        paragraphs: [
          "Suitable for indoor or outdoor installation, on a solid, level surface — concrete, paving or reinforced decking — capable of supporting the unit once filled. You'll need a standard UK 13A power supply (an RCD-protected outdoor socket if it's sited outside), ventilation around the chiller, access to a water supply, and suitable drainage for emptying it. Professional installation is available.",
        ],
      },
      {
        heading: "Warranty and Delivery",
        paragraphs: [
          "Covered by a 1-year manufacturer's warranty, with free UK delivery.",
        ],
      },
    ],
  },
  {
    id: "product-import-pennine-barrel-6-person-sauna-saunaplunge-0c76326a",
    title: "SaunaPlunge™ Pennine Barrel 6-Person Outdoor Sauna | Kaiku",
    summary:
      "A traditional Finnish-style barrel sauna for up to six, heated by a Harvia electric heater and built from spruce, with a half-moon rear window and LED backlighting. Weighs 320kg assembled.",
    sections: [
      {
        heading: "Heating Technology and Design",
        paragraphs: [
          "A traditional Finnish-style barrel sauna, heated by a Harvia electric heater; pour water over the sauna stones for steam if you want a more humid session. The barrel shape is a functional choice as much as a look — the curve promotes even air circulation and heat distribution through the cabin, and helps rainwater run off the roof.",
        ],
      },
      {
        heading: "Cabin Materials",
        paragraphs: [
          "Built from spruce, with a half-moon rear window and integrated LED backlighting.",
        ],
      },
      {
        heading: "Assembly, Power and Site Requirements",
        paragraphs: [
          "Supplied as a modular kit; professional installation is recommended. You'll need a solid, level base — concrete, paving or reinforced decking — capable of supporting the assembled unit, and the Harvia heater must be connected by a qualified electrician in line with current UK electrical regulations; it isn't a plug-in unit.",
        ],
      },
      {
        heading: "Dimensions, Capacity and Weight",
        paragraphs: [
          "Seats up to six people, with cabin dimensions of 180 × 180 × 240cm (W×D×H) and a weight of 320kg assembled.",
        ],
      },
      {
        heading: "Warranty and Delivery",
        paragraphs: [
          "Covered by a 1-year manufacturer's warranty against manufacturing defects in structural integrity, materials, workmanship and the supplied electrical components under normal residential use — it doesn't cover incorrect installation, misuse or normal wear and tear. Delivered free to UK mainland addresses.",
        ],
      },
    ],
  },
  {
    id: "product-import-the-dales-glow-indoor-infrared-sauna-by-saunaplunge-2-person-9bf29917",
    title: "SaunaPlunge™  Dales Glow 2 Person Indoor Infrared Sauna | Kaiku",
    summary:
      "An indoor infrared sauna for two, built from Canadian hemlock with low EMF carbon heating and a tempered-glass door. Plug-and-play, DIY-installable in around 2 hours.",
    sections: [
      {
        heading: "Heating Technology and Session Comfort",
        paragraphs: [
          "An infrared sauna, not a traditional steam sauna — low EMF carbon infrared heating warms the body directly at lower running temperatures than a traditional sauna, with a digital control panel for temperature and session settings.",
        ],
      },
      {
        heading: "Cabin Materials and Design",
        paragraphs: [
          "Built from Canadian hemlock, with a tempered-glass door and windows.",
        ],
      },
      {
        heading: "Assembly and Power Requirements",
        paragraphs: [
          "Supplied in modular panels; DIY installation typically takes around 2 hours using the included instructions, or professional installation can be arranged. You'll need a flat, level indoor floor with clear access through doors, hallways and staircases, a standard UK 13A socket nearby, and adequate ventilation. It's plug-and-play — no hard-wiring required.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Built for two people, with cabin dimensions of 105 × 120 × 190cm (W×D×H).",
        ],
      },
      {
        heading: "Warranty",
        paragraphs: [
          "Covered by a 1-year manufacturer's warranty against manufacturing defects.",
        ],
      },
    ],
  },
  {
    id: "product-import-4-person-outdoor-infrared-sauna-saunaplunge-90561a20",
    title:
      "SaunaPlunge™ Yorkshire Cabin 4-Person Outdoor Infrared Sauna | Kaiku",
    summary:
      "An infrared sauna for up to four, running at 40-65°C from low EMF carbon heaters (2820W), with WiFi control, colour-therapy lighting and an integrated oxygen generator. DIY-installable in around 2 hours.",
    sections: [
      {
        heading: "Heating Technology and Session Comfort",
        paragraphs: [
          "An infrared sauna running at 40–65°C — noticeably lower than a traditional steam sauna — using low EMF carbon infrared heaters (2,820W) to warm the body directly. A Smart LCD controller with WiFi handles temperature, timer and lighting, chromotherapy (colour-therapy) lighting is built in, and there's an integrated oxygen generator.",
          "Regular infrared sauna use is generally associated with relaxation, muscle recovery, improved circulation and stress reduction, alongside the general benefits of taking regular time to rest.",
        ],
      },
      {
        heading: "Cabin Materials and Design",
        paragraphs: [
          "Built from thermo-treated spruce, with a full-height glass front and a contemporary gable roof.",
        ],
      },
      {
        heading: "Assembly, Power and Site Requirements",
        paragraphs: [
          "Supplied as a plug-and-play unit; DIY assembly typically takes around 2 hours, or professional installation is available. It needs a stable, level base — concrete, paving or reinforced decking — a standard UK 13A socket on an RCD-protected outdoor supply, clear access for delivery and assembly, and adequate ventilation around the cabin.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "Seats up to four people, with external dimensions of 180 × 120 × 200cm (W×D×H).",
        ],
      },
      {
        heading: "Warranty and Delivery",
        paragraphs: [
          "Covered by a 1-year manufacturer's warranty, with free UK delivery.",
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
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-supplier-voice-rewrites-batch1.json`,
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
