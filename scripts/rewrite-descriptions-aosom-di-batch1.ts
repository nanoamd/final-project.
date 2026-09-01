/**
 * Damien: "completely rewrite every single description to be just as good as
 * the sauna and cold plunge descriptions with the nice bolder headers."
 *
 * Batch 1 of the Aosom / D.I. Designs description rewrite — all 29 published
 * D.I. Designs products (of 54 total for that supplier) whose description did
 * not meet the standard set by the SaunaPlunge sauna/cold-plunge pages: either
 * raw supplier marketing copy (sales adjectives, "Ideal for" room lists,
 * "pairs beautifully with" styling lists, no `h2` structure) or a single thin
 * heading with almost no facts.
 *
 * Every sentence below is built only from this exact document's own
 * `dimensions`, `weight`, `specs` (including packed size/weight where
 * recorded), `materialTags`/`colourTags`, `deliveryLeadTime` and the plainly
 * factual physical descriptors already present in the old copy (crossed-leg
 * design, ribbed drawer fronts, faux shagreen finish, brass-style handles,
 * etc. — real construction details, not sales adjectives). Stripped:
 * "luxury", "elegant", "sophisticated", "timeless", every "Ideal for" /
 * "pairs beautifully with" list, and the generic site-wide delivery/returns/
 * warranty boilerplate (identical across nearly every D.I. Designs product,
 * so not a per-product fact — that copy already renders elsewhere on the
 * product page).
 *
 * None of these carry a specific manufacturer warranty period on their own
 * document (no per-product warranty spec), so — per the standing rule of
 * never inventing a fact — none of these get a Warranty section.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-aosom-di-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-descriptions-aosom-di-batch1.ts --apply
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
    id: "product-di-di-bentley-ct-oak",
    title: "Bentley Coffee Table in Oak | Kaiku",
    summary:
      "A square coffee table in grey aged oak and oak veneer, with a crossed-leg metal base and three removable serving trays. 120 x 120 x 45cm and 22kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Made from grey aged oak and oak veneer, set on a crossed-leg metal base.",
        ],
      },
      {
        heading: "Tabletop and Storage",
        paragraphs: [
          "The tabletop holds three removable serving trays, which lift out individually for serving or cleaning.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["120 x 120 x 45cm (L x W x H), weighing 22kg."],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-di-di-elmley-ct-iv",
    title: "Elmley Coffee Table in Ivory | Kaiku",
    summary:
      "A rectangular coffee table with a clear glass top, an ivory faux shagreen base and an antique-style brass surround. 120 x 80 x 35.5cm and 19kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A clear glass tabletop sits on an ivory faux shagreen base, edged with an antique-style brass surround.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["120 x 80 x 35.5cm (L x W x H), weighing 19kg."],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-di-di-overbury-ct",
    title: "Overbury Coffee Table in Chocolate Brown | Kaiku",
    summary:
      "A rectangular coffee table with a chocolate brown veneer top and a geometric gold-painted steel base, finished with a brushed gold seam. 110 x 80 x 38cm and 25kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A chocolate brown veneer top with a brushed gold seam, set on a geometric gold-painted steel base.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["110 x 80 x 38cm (L x W x H), weighing 25kg."],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-di-di-pershore-ct-oak",
    title: "Pershore Rectangular Aged Oak Coffee Table | Kaiku",
    summary:
      "A rectangular coffee table in aged oak with a raised edge, set on blackened crossed metal legs. 110 x 80 x 40cm and 21kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "An aged oak tabletop with a raised edge, set on blackened crossed metal legs.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["110 x 80 x 40cm (L x W x H), weighing 21kg."],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-di-di-witley-ct-oak",
    title: "Witley Coffee Table | Kaiku",
    summary:
      "A coffee table in grey aged oak with natural rattan detailing and a tempered glass top, with an open lower shelf. 115 x 58 x 40cm and 17kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Grey aged oak with natural rattan detailing, topped with tempered glass.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["An open lower shelf sits beneath the glass top."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["115 x 58 x 40cm (L x W x H), weighing 17kg."],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-abberley-1-drawer-black-console-table",
    title: "Abberley One Drawer Black Console Table | Kaiku",
    summary:
      "A black console table with one drawer, handcrafted from solid oak and oak veneer. 120 x 30 x 85cm and 15kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Handcrafted from solid oak and oak veneer, finished in black.",
        ],
      },
      { heading: "Storage", paragraphs: ["One drawer."] },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "120 x 30 x 85cm (W x D x H), weighing 15kg. Packed size is 127 x 37 x 93cm.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-abberley-white-chest-of-drawers",
    title: "Abberley White Chest of Drawers | Luxury 3 Drawer Chest | Kaiku",
    summary:
      "A white chest of drawers with three drawers, handcrafted from solid oak and oak veneer with curved detailing and gold-coloured handles. 90 x 45 x 85cm and 44kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Handcrafted from solid oak and oak veneer, finished in white with curved drawer fronts, visible natural wood grain and brushed gold-coloured square handles.",
        ],
      },
      { heading: "Storage", paragraphs: ["Three drawers."] },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "90 x 45 x 85cm (W x D x H), weighing 44kg. Packed size is 96.5 x 52 x 92.5cm, packed weight 48kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-alton-white-chest-of-drawers",
    title: "Alton White Chest of Drawers | Luxury 3 Drawer Birch Chest | Kaiku",
    summary:
      "A white chest of drawers with three drawers, made from birch wood and MDF with a white painted finish, tapered legs and brass-style handles. 90 x 45 x 75cm and 22kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Made from birch wood and MDF, finished in white paint with tapered legs, cut-line detailing and brass-style handles.",
        ],
      },
      { heading: "Storage", paragraphs: ["Three drawers."] },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "90 x 45 x 75cm (W x D x H), weighing 22kg. Packed size is 95 x 50 x 80cm, packed weight 25kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-alton-white-console-table",
    title:
      "Alton White Console Table | Luxury 3 Drawer Birch Console Table | Kaiku",
    summary:
      "A white console table with three drawers, made from birch wood and MDF with a white painted finish, tapered legs and brass-style handles. 100 x 45 x 76cm and 20kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Made from birch wood and MDF, finished in white paint with tapered legs, cut-line detailing and brass-style handles. The three drawers run on wooden runners.",
        ],
      },
      { heading: "Storage", paragraphs: ["Three drawers."] },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "100 x 45 x 76cm (W x D x H), weighing 20kg. Packed size is 105 x 50 x 81cm, packed weight 22kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-bamboo-gesso-lamp",
    title: "Bamboo Gesso Table Lamp | Luxury White Gesso Designer Lamp | Kaiku",
    summary:
      "A table lamp with a white gesso base shaped like bamboo, paired with a fabric shade. 33 x 33 x 63cm and 10kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A white gesso base sculpted in a bamboo form, paired with a fabric shade.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["33 x 33 x 63cm, weighing 10kg."],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-bentley-oak-console-table",
    title:
      "Bentley Grey Aged Oak Console Table | Luxury Oak Console Table | Kaiku",
    summary:
      "A grey aged oak console table with a crossed-leg design and a removable tray. 150 x 40 x 80cm and 22kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Made from grey aged oak and oak veneer, with visible natural wood grain and a crossed-leg base.",
        ],
      },
      {
        heading: "Tabletop",
        paragraphs: [
          "A removable tray sits on top, which lifts out for serving or cleaning.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "150 x 40 x 80cm (W x D x H), weighing 22kg. Packed size is 154 x 44 x 84cm, packed weight 25.8kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-candover-neutral-sofa",
    title:
      "Candover Neutral Upholstered Sofa | Luxury 3 Seater Fabric Sofa | Kaiku",
    summary:
      "A 3-seater sofa upholstered in neutral fabric, with button-tufted back cushions, cylindrical bolster cushions and solid wooden legs. 210.5 x 98 x 84.5cm and 57.5kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Upholstered in neutral fabric, with button-tufted back cushions, cylindrical bolster cushions and solid wooden legs.",
        ],
      },
      {
        heading: "Dimensions and Seating",
        paragraphs: [
          "210.5cm wide x 98cm deep x 84.5cm high, weighing 57.5kg. Seat height is 46cm, leg height 18cm.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "Packed size is 213 x 94 x 55cm. Delivered within 3–4 weeks.",
        ],
      },
    ],
  },
  {
    id: "product-import-charlton-2-drawer-walnut-ribbed-bedside-table",
    title:
      "Charlton Ribbed Walnut 2 Drawer Bedside Table | Luxury Walnut Bedside Cabinet | Kaiku",
    summary:
      "A walnut bedside table with two soft-close drawers, made from oak, oak veneer and MDF with ribbed drawer fronts. 45 x 40 x 60cm and 29kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Made from oak, oak veneer and MDF, finished in walnut with horizontal ribbed drawer fronts and visible natural wood grain.",
        ],
      },
      { heading: "Storage", paragraphs: ["Two soft-close drawers."] },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "45 x 40 x 60cm (W x D x H), weighing 29kg. Packed size is 50 x 45 x 65cm.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-charlton-ribbed-walnut-desk",
    title:
      "Charlton Ribbed Walnut Desk | Luxury Walnut Home Office Desk | Kaiku",
    summary:
      "A walnut desk with a ribbed finish, measuring 120 x 50 x 76cm and weighing 71kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A walnut-finished desk with a ribbed detail across the front.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "120 x 50 x 76cm (W x D x H), weighing 71kg. Packed size is 125 x 60 x 81cm, packed weight 72kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-elmley-ivory-console-table",
    title:
      "Elmley Ivory Console Table | Luxury Glass & Faux Shagreen Console Table | Kaiku",
    summary:
      "A console table with a clear tempered glass top, an ivory faux shagreen base and an antique brass surround. 120 x 40 x 80cm and 24kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A clear tempered glass top sits on an ivory faux shagreen base, edged with an antique brass surround.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "120 x 40 x 80cm (W x D x H), weighing 24kg. Packed size is 127 x 47 x 100cm, packed weight 34kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-five-black-console-table",
    title: "Five Black Console Table | Luxury Oak Console Table | Kaiku",
    summary:
      "A black console table made from oak and oak veneer, with visible natural wood grain. 140 x 30 x 80cm and 20kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Made from oak and oak veneer, finished in black with visible natural wood grain.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "140 x 30 x 80cm (W x D x H), weighing 20kg. Packed size is 150 x 35 x 85cm, packed weight 25kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-grafton-1-drawer-black-bedside-table",
    title:
      "Grafton Black Bedside Table | Industrial Oak 1 Drawer Bedside Table | Kaiku",
    summary:
      "A bedside table with one drawer, featuring a solid oak drawer front, a slate grey metal frame and a faux concrete-effect top. 45 x 40 x 60cm and 16kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A slate grey metal frame with a faux concrete-effect top and a solid oak drawer front.",
        ],
      },
      { heading: "Storage", paragraphs: ["One drawer."] },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "45 x 40 x 60cm (W x D x H), weighing 16kg. Packed size is 49 x 45 x 65cm.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-grafton-black-chest-of-drawers",
    title: "Grafton Black Chest of Drawers | Industrial 3 Drawer Chest | Kaiku",
    summary:
      "A chest of drawers with three drawers, featuring solid oak drawer fronts, a faux concrete top and a slate grey metal frame. 90 x 50 x 85cm and 67kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A slate grey metal frame with a faux concrete top and solid oak drawer fronts.",
        ],
      },
      { heading: "Storage", paragraphs: ["Three drawers."] },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "90 x 50 x 85cm (W x D x H), weighing 67kg. Packed size is 96 x 56 x 91cm, packed weight 72kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-grafton-black-end-table",
    title: "Grafton Black End Table | Industrial Oak Side Table | Kaiku",
    summary:
      "A side table with a solid oak top and a black metal frame. 50 x 32 x 60cm and 7kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["A solid oak top set on a black metal frame."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "50 x 32 x 60cm (W x D x H), weighing 7kg. Packed size is 54 x 36 x 65cm, packed weight 9kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-hampton-ivory-2-nest-tables",
    title:
      "Hampton Ivory Shagreen Nest of Tables | Luxury Nesting Tables Set of 2 | Kaiku",
    summary:
      "A set of two nesting tables in ivory faux shagreen with antique brass-style frames. Larger table 39 x 39 x 54cm, 7kg combined.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A set of two nesting tables finished in textured ivory faux shagreen, set on antique brass-style frames.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "The larger table measures 39 x 39 x 54cm; combined weight is 7kg. Packed size is 47 x 47 x 66cm, packed weight 10kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 2–3 weeks."] },
    ],
  },
  {
    id: "product-import-hampton-ivory-chest-of-drawers",
    title:
      "Hampton Ivory Shagreen Chest of Drawers | Luxury 3 Drawer Chest | Kaiku",
    summary:
      "A chest of drawers with three drawers, finished in ivory faux shagreen with antique brass-style detailing and walnut-effect drawer interiors. 90 x 45 x 85cm and 50kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Finished in textured ivory faux shagreen with antique brass-style detailing; drawer interiors are walnut-effect.",
        ],
      },
      { heading: "Storage", paragraphs: ["Three drawers."] },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "90 x 45 x 85cm (W x D x H), weighing 50kg. Packed size is 99 x 57 x 98cm, packed weight 56kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-hampton-ivory-octagonal-mirror",
    title:
      "Hampton Ivory Octagonal Wall Mirror | Luxury Shagreen Designer Mirror | Kaiku",
    summary:
      "An octagonal wall mirror with an ivory faux shagreen frame and an antique brass surround. 80 x 80 x 2.5cm and 10kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "An octagonal mirror in an ivory faux shagreen frame, edged with an antique brass surround.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "80 x 80 x 2.5cm, weighing 10kg. Packed size is 88 x 88 x 10cm, packed weight 20kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-hampton-ivory-tv-unit",
    title: "Hampton Ivory Shagreen TV Unit | Luxury Media Console | Kaiku",
    summary:
      "A media console finished in ivory faux shagreen with antique brass-style detailing and concealed storage. 160 x 50 x 55cm and 85kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Finished in ivory faux shagreen with antique brass-style detailing.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: ["Concealed storage behind the front."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "160 x 50 x 55cm (W x D x H), weighing 85kg. Packed size is 168 x 64 x 74cm, packed weight 90kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-large-ribbed-gesso-lamp",
    title: "Large Ribbed Gesso Table Lamp | Luxury Designer Table Lamp | Kaiku",
    summary:
      "A table lamp with a ribbed gesso base and a neutral fabric shade. 41 x 41 x 81cm and 10kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["A ribbed gesso base paired with a neutral fabric shade."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["41 x 41 x 81cm, weighing 10kg."],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 2–3 weeks."] },
    ],
  },
  {
    id: "product-import-large-round-gesso-lamp",
    title: "Large Round Gesso Table Lamp | Luxury Designer Lighting | Kaiku",
    summary:
      "A table lamp with a textured gesso base and a neutral fabric shade. 46 x 46 x 88cm and 15kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A textured gesso base paired with a neutral fabric shade.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: ["46 x 46 x 88cm, weighing 15kg."],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 2–3 weeks."] },
    ],
  },
  {
    id: "product-import-large-small-rectangular-gesso-lamp",
    title:
      "Small Rectangular Gesso Table Lamp | Luxury Designer Lighting | Kaiku",
    summary:
      "A table lamp with a textured gesso base and a neutral fabric shade, measuring 31 x 31 x 55cm.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A textured gesso base paired with a neutral fabric shade.",
        ],
      },
      { heading: "Dimensions", paragraphs: ["31 x 31 x 55cm."] },
      { heading: "Delivery", paragraphs: ["Delivered within 2–3 weeks."] },
    ],
  },
  {
    id: "product-import-leckford-oak-ribbed-occasion-table",
    title:
      "Leckford Ribbed Black Oak Occasional Table | Luxury Round Side Table | Kaiku",
    summary:
      "A round side table with a ribbed pedestal base, finished in black oak. 75cm diameter x 76cm high, weighing 23kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "A round tabletop set on a ribbed pedestal base, finished in black oak.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "75cm diameter x 76cm high, weighing 23kg. Packed in one box measuring 39 x 39 x 82cm.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-mickleton-cream-chenille-armchair",
    title: "Mickleton Cream Chenille Armchair | Kaiku",
    summary:
      "An armchair upholstered in cream chenille, with generous cushioning. 66 x 76.2 x 79cm and 17.7kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: [
          "Upholstered in cream chenille, with generous cushioning.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "66cm wide x 76.2cm deep x 79cm high, weighing 17.7kg. Packed size is 73 x 85 x 86cm, packed weight 24.5kg.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
    ],
  },
  {
    id: "product-import-neathan-end-table",
    title: "Neatham End Table | Luxury Modern Side Table | Kaiku",
    summary:
      "A side table with a faux concrete-effect top and a metal frame. 40 x 40 x 60cm and 10kg.",
    sections: [
      {
        heading: "Materials and Construction",
        paragraphs: ["A faux concrete-effect top set on a metal frame."],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "40 x 40 x 60cm (W x D x H), weighing 10kg. Packed size is 45 x 45 x 70cm.",
        ],
      },
      { heading: "Delivery", paragraphs: ["Delivered within 3–4 weeks."] },
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
    "docs/change-log/2026-09-01-rewrite-descriptions-aosom-di-batch1.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
