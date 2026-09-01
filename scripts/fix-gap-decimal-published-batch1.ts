/**
 * Fixes the two artefacts broadened after Damien found them live on the Sanai
 * White Cotton Mache Large Planter (premier-housewares-5506889):
 *
 *   1. "The specifications ... do not mention whether it has drainage holes
 *      or if a saucer or liner is included. Therefore, please consider this
 *      in your planting decisions." — the copy admitting it does not know
 *      something instead of finding it out. ARTEFACTS "admits it does not
 *      know" pattern in src/lib/catalog/quality.ts.
 *   2. "Dimensions: w45.000000 x d45.000000 x h45.000000" / "Cart weight:
 *      8.000000 kg" — raw, unrounded spreadsheet-import numbers pasted into
 *      the description body, duplicating the product's own clean `specs`
 *      field. ARTEFACTS "raw, unrounded number" pattern, same file.
 *
 * Every published product matching either pattern was read by hand against
 * its own specs/dimensions/weight/materials before writing a fix:
 *
 *   - Where the "gap" is genuinely unrecorded anywhere on the document
 *     (almost always: does this planter have drainage holes, is this piece
 *     weather-resistant, is a cover included), the sentence is DELETED —
 *     never replaced with a fabricated answer. Nothing here invents a fact.
 *   - Where the sentence mixed a real fact with the admission in the same
 *     sentence (e.g. "The box includes the chandelier itself ... but it is
 *     unclear whether any fixings are supplied"), only the admission clause
 *     is removed — the real fact stays.
 *   - Two cases (the Aosom gazebo's "so it is not suitable for fixed
 *     installations", the Aosom pergola's "but it can be placed
 *     independently") drop the *conclusion* entirely rather than keep it:
 *     both manufacture a claim from an absence of information, which is a
 *     second fault (see GUESSES_FROM_ABSENCE in admissions.ts), not a fact.
 *   - One case (the Hanah floor lamp) already states the real answer one
 *     sentence earlier ("plugs into a standard socket") — the admission
 *     sentence directly beside it is simply redundant and wrong, deleted
 *     outright.
 *   - Every raw-decimal match is a standalone "Label: number.000000 unit"
 *     bullet duplicating the specs field (Cart Weight, or a CBM shipping-
 *     cube figure that is not a customer fact at all) — deleted outright,
 *     never reformatted, because the clean specs table already carries the
 *     same fact elsewhere on the page.
 *
 * Blocks are located by their exact current text and replaced wholesale with
 * a single collapsed span (never touching children[0] alone and leaving
 * other spans stale — the bug that corrupted 35 products in an earlier fix
 * today). A heading is only ever removed where hand-checked against the live
 * block sequence to have nothing left beneath it once its one paragraph is
 * deleted.
 *
 * Matched by exact text, not by title, so a MISSED entry means the live copy
 * has already changed (fixed by someone else, or drifted) rather than a
 * silent no-op.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-gap-decimal-published-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-gap-decimal-published-batch1.ts --apply
 *   pnpm tsx --env-file=.env.local scripts/fix-gap-decimal-published-batch1.ts --apply --only=premier-housewares-5506889
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.slice("--only=".length).split(",") : null;

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

interface Op {
  /** Exact current concatenated text of the block being changed. */
  from: string;
  /** New text, or null to delete the block outright. */
  to: string | null;
}

interface ProductFix {
  id: string;
  title: string;
  ops: Op[];
  /** Exact h2 heading text to remove — hand-verified to have nothing left
   * beneath it once its op(s) above have run. */
  dropHeadings?: string[];
}

/** The "admits it does not know" fixes — 46 published products. */
const GAP_FIXES: ProductFix[] = [
  {
    id: "premier-housewares-0507070",
    title: "Emery Matt Black Wire Basket | Kaiku",
    ops: [
      {
        from: "The Emery Wire Basket is designed for general storage around your home. It is suitable for holding various items, such as blankets, magazines, or toys. However, the product page does not specify if the basket can hold water, so it is advised to use it for decorative or general storage purposes only.",
        to: "The Emery Wire Basket is designed for general storage around your home. It is suitable for holding various items, such as blankets, magazines, or toys.",
      },
    ],
  },
  {
    id: "premier-housewares-1411436",
    title: "Zircon Large Planter | Kaiku",
    ops: [
      {
        from: "The specifications do not indicate whether the planter is suitable for outdoor use or has frost-resistant properties.",
        to: null,
      },
    ],
    dropHeadings: ["Indoor and Outdoor Use"],
  },
  {
    id: "premier-housewares-2200970",
    title: "Vitus Black and Gold Metal Wall Clock | Kaiku",
    ops: [
      {
        from: "This wall clock does not specify the hanging method, and it is advised to source fixings suited to your wall type separately. For optimal results, consider using appropriate anchors and screws for your specific wall material.",
        to: "Source wall fixings suited to your wall type separately. For optimal results, consider using appropriate anchors and screws for your specific wall material.",
      },
    ],
  },
  {
    id: "premier-housewares-2405802",
    title:
      "Rowan Two Seater Natural And Silver Woven Bamboo Small Sofa | Kaiku",
    ops: [
      {
        from: "The product does not specify if it's weather resistant. Therefore, it's advisable to store cushions dry unless otherwise noted. For prolonged use outdoors, it is recommended to take appropriate measures to protect the sofa from inclement weather.",
        to: "It's advisable to store cushions dry unless otherwise noted. For prolonged use outdoors, it is recommended to take appropriate measures to protect the sofa from inclement weather.",
      },
    ],
  },
  {
    id: "premier-housewares-2405942",
    title: "Weston Marble Effect Dining Table with 6 Chairs Set | Kaiku",
    ops: [
      {
        from: "While the page does not specify the exact load capacity, this dining table is designed to hold up to daily use and comfortably accommodate meals with family or friends.",
        to: "This dining table is designed to hold up to daily use and comfortably accommodate meals with family or friends.",
      },
    ],
  },
  {
    id: "premier-housewares-2406046",
    title: "Goa Brown Rattan Hanging Chair | Kaiku",
    ops: [
      {
        from: "While the product specifications do not mention if a cover is included, it is essential to keep the cushion clean. The cushion covers are removable for cleaning, but they should not be machine washed. Use a damp cloth for cleaning the weave and avoid abrasive cleaners.",
        to: "It's essential to keep the cushion clean. The cushion covers are removable for cleaning, but they should not be machine washed. Use a damp cloth for cleaning the weave and avoid abrasive cleaners.",
      },
    ],
  },
  {
    id: "premier-housewares-2406213",
    title: "Rowan Natural And Black Woven Bamboo Chair And Stool Set | Kaiku",
    ops: [
      {
        from: "The specifications do not indicate the quantity or specific contents of this set.",
        to: null,
      },
      {
        from: "The specifications do not indicate if the set is weather resistant or suitable for all-year outdoor use. It is advisable to store cushions dry when not in use, if they are included.",
        to: "It is advisable to store cushions dry when not in use, if they are included.",
      },
    ],
    dropHeadings: ["What's in the Set"],
  },
  {
    id: "premier-housewares-2406729",
    title: "Mataram Natural Rattan Table | Kaiku",
    ops: [
      {
        from: "The specifications do not indicate whether the table can withstand exposure to all weather conditions or if it should be stored indoors during adverse weather. Therefore, it is advisable to store the table dry when not in use. Please consult the supplied instruction manual or customer support for more information.",
        to: "It is advisable to store the table dry when not in use.",
      },
    ],
  },
  {
    id: "premier-housewares-2406740",
    title: "Depok Rattan Side Table With Metal Legs | Kaiku",
    ops: [
      {
        from: "The product specifications do not include information on whether a cover is provided with the table. For maintenance, it is recommended to dust the surface with a dry and soft cloth to keep it looking its best.",
        to: "For maintenance, it is recommended to dust the surface with a dry and soft cloth to keep it looking its best.",
      },
    ],
  },
  {
    id: "premier-housewares-2406745",
    title: "Depok Rattan and Metal Square Side Table | Kaiku",
    ops: [
      {
        from: "The specification does not mention a cover included with the table, so if protection from the elements is required, you will need to purchase a suitable cover separately. To maintain the appearance of the table:",
        to: "If protection from the elements is required, you will need to purchase a suitable cover separately. To maintain the appearance of the table:",
      },
    ],
  },
  {
    id: "premier-housewares-2406765",
    title: "Avento Set Of Two Round Black Plant Stands | Kaiku",
    ops: [
      {
        from: "The specifications available do not mention whether drainage holes are pre-drilled, nor is a saucer or liner included with the plant stands.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting"],
  },
  {
    id: "premier-housewares-2450045",
    title: "Goa Black Rattan Effect Double Hanging Chair | Kaiku",
    ops: [
      {
        from: "Assembly is required for the Goa Black Rattan Effect Double Hanging Chair. Unfortunately, the page does not specify the tools provided or the exact assembly time needed.",
        to: "Assembly is required for the Goa Black Rattan Effect Double Hanging Chair.",
      },
    ],
  },
  {
    id: "premier-housewares-2450048",
    title: "Goa White Rattan Effect Hanging Chair with Grey Cushions | Kaiku",
    ops: [
      {
        from: "The specifications do not mention whether a cover is included with the chair. To clean, simply wipe the surfaces with a damp cloth, avoiding abrasive cleaners to ensure the longevity of the materials.",
        to: "To clean, simply wipe the surfaces with a damp cloth, avoiding abrasive cleaners to ensure the longevity of the materials.",
      },
    ],
  },
  {
    id: "premier-housewares-2450049",
    title:
      "Goa Black Rattan Effect Double Hanging Chair With Grey Cushions | Kaiku",
    ops: [
      {
        from: "The specification does not mention whether a cover is included with the chair. For cleaning, use a damp cloth and avoid abrasive cleaners to maintain its finish. When winter approaches, storing the chair in a dry place is recommended.",
        to: "For cleaning, use a damp cloth and avoid abrasive cleaners to maintain its finish. When winter approaches, storing the chair in a dry place is recommended.",
      },
    ],
  },
  {
    id: "premier-housewares-5502316",
    title: "Opus Woven Rope Armchair | Kaiku",
    ops: [
      {
        from: "The specifications do not indicate whether the armchair is suitable for prolonged outdoor exposure. It is advisable to store cushions dry to maintain their condition. For specific guidance on outdoor exposure, please consult the supplied instruction manual or customer support.",
        to: "It is advisable to store cushions dry to maintain their condition.",
      },
      {
        from: "Measuring 62 × 63 × 76 cm, this armchair provides ample seating space for relaxation. However, the specifications do not mention any weight capacity.",
        to: "Measuring 62 × 63 × 76 cm, this armchair provides ample seating space for relaxation.",
      },
    ],
  },
  {
    id: "premier-housewares-5502329",
    title:
      "Hoffmann Black Mirrored Glass and Nickel Finish Plant Stand | Kaiku",
    ops: [
      {
        from: "The specifications do not indicate whether this plant stand is suitable for outdoor use or if it is frost-resistant.",
        to: null,
      },
    ],
    dropHeadings: ["Indoor and Outdoor Use"],
  },
  {
    id: "premier-housewares-5505784",
    title: "Darnell Small Greyt Faceted Planter | Kaiku",
    ops: [
      {
        from: "Consequently, it is unclear whether drainage holes are included or if a saucer or liner is provided.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting"],
  },
  {
    id: "premier-housewares-5505788",
    title: "Darnell Small White Finish Rounded Planter | Kaiku",
    ops: [
      {
        from: "The specifications do not mention whether drainage holes are included or if a saucer or liner is provided.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting"],
  },
  {
    id: "premier-housewares-5505789",
    title: "Darnell Medium Grey Speckled Planter | Kaiku",
    ops: [
      {
        from: "The planter's specifications do not indicate whether drainage holes are included, nor is there mention of a saucer or liner that accompanies the product. This might affect the choice of planting directly in the pot.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting"],
  },
  {
    id: "premier-housewares-5505790",
    title: "Darnell Large Grey Speckled Planter | Kaiku",
    ops: [
      {
        from: "The specifications do not indicate whether the Darnell Large Grey Speckled Planter features drainage holes or if a saucer or liner is included.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting"],
  },
  {
    id: "premier-housewares-5505796",
    title: "Darnell Large Black Finish Planter | Kaiku",
    ops: [
      {
        from: "The product specifications do not mention if drainage holes are included or if a saucer is provided.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting"],
  },
  {
    id: "premier-housewares-5505800",
    title: "Darnell Large Chevron Planter | Kaiku",
    ops: [
      {
        from: "The product page does not specify whether the Darnell Large Chevron Planter includes drainage holes or a saucer.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting"],
  },
  {
    id: "premier-housewares-5506429",
    title: "Darnell Large Rustic Face Planter | Kaiku",
    ops: [
      {
        from: "The specifications do not indicate whether the planter is suitable for outdoor use or if it is frost-resistant.",
        to: null,
      },
    ],
    dropHeadings: ["Indoor and Outdoor Use"],
  },
  {
    id: "premier-housewares-5506562",
    title: "Arlo Small Natural Wooden Planter | Kaiku",
    ops: [
      {
        from: "The specifications do not mention whether drainage holes are included in the design, nor do they provide details about the inclusion of a saucer or liner.",
        to: null,
      },
      {
        from: "The specifications do not specify indoor or outdoor suitability or claim frost resistance.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting", "Indoor and Outdoor Use"],
  },
  {
    id: "premier-housewares-5506565",
    title: "Arlo Large Wooden Black Ombre Planter | Kaiku",
    ops: [
      {
        from: "The specification does not indicate whether there are drainage holes or if a liner or saucer is included. For any planting needs, please check with customer support for guidance.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting"],
  },
  {
    id: "premier-housewares-5506673",
    title: "Tundra Black And White Earthenware Planter | Kaiku",
    ops: [
      {
        from: "The specifications for this planter do not include information about drainage holes or whether a saucer or liner is provided.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting"],
  },
  {
    id: "premier-housewares-5506889",
    title: "Sanai White Cotton Mache Large Planter | Kaiku",
    ops: [
      {
        from: "The specifications for the Sanai White Cotton Mache Large Planter do not mention whether it has drainage holes or if a saucer or liner is included. Therefore, please consider this in your planting decisions.",
        to: null,
      },
      {
        from: "The specifications are silent on indoor or outdoor suitability, and it is unclear whether it is frost-resistant.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting", "Indoor and Outdoor Use"],
  },
  {
    id: "premier-housewares-5509127",
    title: "Sabia Green And Gold Three Tiered Plant Stand | Kaiku",
    ops: [
      {
        from: "As such, it is unclear whether drainage holes are included and whether a saucer or liner is part of the product.",
        to: null,
      },
      {
        from: "The information available does not specify whether this plant stand is suitable for indoor or outdoor use, nor does it mention frost resistance.",
        to: null,
      },
    ],
    dropHeadings: ["Drainage and Planting", "Indoor and Outdoor Use"],
  },
  {
    id: "premier-housewares-5511427",
    title: "Salasco Black Finish 3 Tiered Glass Chandelier | Kaiku",
    ops: [
      {
        from: "The chandelier requires assembly upon delivery. The box includes the chandelier itself, along with a ceiling rose and flex, but it is unclear whether any additional fixings or tools are supplied.",
        to: "The chandelier requires assembly upon delivery. The box includes the chandelier itself, along with a ceiling rose and flex.",
      },
    ],
  },
  {
    id: "premier-housewares-5511721",
    title: "Abira Black Marble and Brass 5 Bulb Floor Lamp | Kaiku",
    ops: [
      {
        from: "The Abira Black Marble and Brass 5 Bulb Floor Lamp requires five G4 bulbs, each with a maximum wattage of 1W. Please consult the supplied instruction manual for additional information regarding the bulbs, as the specification does not mention if bulbs are included.",
        to: "The Abira Black Marble and Brass 5 Bulb Floor Lamp requires five G4 bulbs, each with a maximum wattage of 1W.",
      },
    ],
  },
  {
    id: "premier-housewares-5511726",
    title: "Yara Matt Black 12 Bulb Statement Pendant Light | Kaiku",
    ops: [
      {
        from: "The Yara Pendant Light requires assembly upon arrival. The box includes the pendant light components but does not specify if mounting fixings are included, so additional fixtures may need to be sourced separately.",
        to: "The Yara Pendant Light requires assembly upon arrival. The box includes the pendant light components.",
      },
    ],
  },
  {
    id: "premier-housewares-5511740",
    title:
      "Hanah Black Snake Leather Effect Floor Lamp with Chrome Base and Black Shade | Kaiku",
    ops: [
      {
        from: "This lamp plugs into a standard socket, making it easy to position wherever you need it. The specification does not indicate whether it requires hard-wiring or if it can be installed by a qualified electrician.",
        to: "This lamp plugs into a standard socket, making it easy to position wherever you need it.",
      },
    ],
  },
  {
    id: "premier-housewares-5511824",
    title:
      "Carta Black And White Papier Mache Table Lamp with Geometric Lines | Kaiku",
    ops: [
      {
        from: "This table lamp uses a Type A bulb with a maximum wattage of 40W. It is important to note that the specifications do not indicate whether a bulb is included, so you may need to purchase one separately.",
        to: "This table lamp uses a Type A bulb with a maximum wattage of 40W.",
      },
    ],
  },
  {
    id: "premier-housewares-5511870",
    title:
      "Carta Black and White Stripe Papier Mache Domed Pendant Light | Kaiku",
    ops: [
      {
        from: "The product details do not specify whether the light fixture is hard-wired to a ceiling rose or if it plugs into a socket. It is recommended that mains-wired fittings be connected by a qualified electrician.",
        to: "It is recommended that mains-wired fittings be connected by a qualified electrician.",
      },
    ],
  },
  {
    id: "premier-housewares-5511874",
    title: "Carta Black Etched Linear Design Papier Mache Table Lamp | Kaiku",
    ops: [
      {
        from: "The specifications for this lamp do not include information about the bulb, such as the cap type or maximum wattage.",
        to: null,
      },
    ],
    dropHeadings: ["Bulb Requirements"],
  },
  {
    id: "premier-housewares-5528011",
    title: "Trento Round Rattan and Antique Gold Finish Side Table | Kaiku",
    ops: [
      {
        from: "The product specifics do not mention a cover for the table. To clean the table, it is recommended to use a dry soft cloth and avoid abrasive cleaners to maintain its finish. During winter, storing the table in a protected location would be prudent.",
        to: "To clean the table, it is recommended to use a dry soft cloth and avoid abrasive cleaners to maintain its finish. During winter, storing the table in a protected location would be prudent.",
      },
    ],
  },
  {
    id: "premier-housewares-5528012",
    title: "Trento Round Rattan and Antique Gold Finish Coffee Table | Kaiku",
    ops: [
      {
        from: "The specification does not indicate whether a protective cover is included with the coffee table. To maintain its appearance, clean the surface using a dry soft cloth and avoid abrasive cleaners that may damage the finish. Ensure that it is stored properly during winter months to prolong its lifespan.",
        to: "To maintain its appearance, clean the surface using a dry soft cloth and avoid abrasive cleaners that may damage the finish. Ensure that it is stored properly during winter months to prolong its lifespan.",
      },
    ],
  },
  {
    id: "premier-housewares-5528547",
    title: "Opus Grey Woven Rope Three Seater Sofa with Cushions | Kaiku",
    ops: [
      {
        from: "The Opus Grey Woven Rope Three Seater Sofa requires assembly. It ships in one carton, though the specifications do not mention whether tools or instructions are included.",
        to: "The Opus Grey Woven Rope Three Seater Sofa requires assembly. It ships in one carton.",
      },
      {
        from: "The specifications do not indicate whether a cover is included with the sofa. To maintain its appearance, clean the weave with a suitable cloth and avoid using abrasive cleaners. For winter storage, consult the instruction manual or customer support for guidance.",
        to: "To maintain its appearance, clean the weave with a suitable cloth and avoid using abrasive cleaners. For winter storage, consult the instruction manual or customer support for guidance.",
      },
    ],
  },
  {
    id: "premier-housewares-5528548",
    title: "Opus Woven Rope Chaise Longue with Cushions | Kaiku",
    ops: [
      {
        from: "The product page does not specify whether the chaise longue is designed to withstand exposure to rain or prolonged outdoor conditions. It is advisable to store the cushions dry when not in use to maintain their quality.",
        to: "It is advisable to store the cushions dry when not in use to maintain their quality.",
      },
    ],
  },
  {
    id: "premier-housewares-5528605",
    title: "Cebu Elm Wood and Rattan Dining Chair | Kaiku",
    ops: [
      {
        from: "The product page does not specify whether the chair is designed to withstand weather exposure. It is advisable to store any cushions dry unless indicated otherwise.",
        to: "It is advisable to store any cushions dry unless indicated otherwise.",
      },
    ],
  },
  {
    id: "premier-housewares-5528627",
    title: "Manado Natural Rattan Long Bench with Cushion | Kaiku",
    ops: [
      {
        from: "This product requires assembly, and it ships in one box. The packaging does not specify whether tools or instructions are included, so please check the manual for any assembly guidelines.",
        to: "This product requires assembly, and it ships in one box.",
      },
      {
        from: "The product details do not specify if it is weather-resistant or suitable for outside exposure. Therefore, it is recommended to store the cushions dry when not in use.",
        to: "It is recommended to store the cushions dry when not in use.",
      },
    ],
  },
  {
    id: "premier-housewares-5529698",
    title: "Cebu White Wash Elm Wood Dining Chair | Kaiku",
    ops: [
      {
        from: "The product specifications do not mention whether the chair is resistant to weather exposure, nor do they provide guidance on leaving it outside all year round.",
        to: null,
      },
      {
        from: "The product specifications do not mention whether a cover is included, nor do they provide information about the washability of cushion covers. For general cleaning, it's best to follow gentle cleaning methods suitable for wooden furniture and fabrics.",
        to: "For general cleaning, it's best to follow gentle cleaning methods suitable for wooden furniture and fabrics.",
      },
    ],
    dropHeadings: ["Weather Resistance and Leaving It Outside"],
  },
  {
    id: "product-aosom-84b-815v70",
    title:
      "L-Shaped 8-Seater Aluminium Garden Dining Set with Bench, Grey | Kaiku",
    ops: [
      {
        from: "The page does not specify the weather resistance capabilities of the set; therefore, it is advisable to store the cushions dry when not in use.",
        to: "It is advisable to store the cushions dry when not in use.",
      },
    ],
  },
  {
    id: "product-aosom-84c-166v01lg",
    title: "Pop-Up Double-Roof Gazebo with Netting and Carry Bag | Kaiku",
    ops: [
      {
        from: "The gazebo comes with 8 ground stakes and 4 guy ropes to secure it in place, helping it withstand light wind conditions. However, the specifications do not mention a wind resistance rating, so it is advisable to avoid using the gazebo in strong wind.",
        to: "The gazebo comes with 8 ground stakes and 4 guy ropes to secure it in place, helping it withstand light wind conditions. It's advisable to avoid using the gazebo in strong wind.",
      },
      {
        from: "It is essential to set up the gazebo on a firm and level surface to ensure safety and stability. The specifications do not mention any wall-mounting requirements, so it is not suitable for fixed installations.",
        to: "It is essential to set up the gazebo on a firm and level surface to ensure safety and stability.",
      },
    ],
  },
  {
    id: "product-aosom-84c-441v00lg",
    title: "Metal Pergola with Sliding Canopy and Curtains, Grey | Kaiku",
    ops: [
      {
        from: "For optimal use, the pergola should be placed on a firm, level surface to ensure stability. The product does not specify wall-mounting requirements, but it can be placed independently in your garden or outdoor space.",
        to: "For optimal use, the pergola should be placed on a firm, level surface to ensure stability.",
      },
    ],
  },
  {
    id: "product-aosom-860-335v70gy",
    title: "5-Piece Rattan Garden Set with Gas Fire Pit Table, Grey | Kaiku",
    ops: [
      {
        from: "To maintain your rattan furniture set, regular cleaning is recommended. Use a damp cloth to wipe surfaces and ensure the cushions are removed and washed as necessary. It’s advisable to keep the fire pit and seats protected when not in use, but the supplied instruction manual does not specify whether a protective cover is included.",
        to: "To maintain your rattan furniture set, regular cleaning is recommended. Use a damp cloth to wipe surfaces and ensure the cushions are removed and washed as necessary. It’s advisable to keep the fire pit and seats protected when not in use.",
      },
    ],
  },
];

/** The "raw, unrounded number" fixes — 12 published products. Every one is a
 * standalone spec-dump bullet duplicating the specs field, or (the CBM
 * lines) a shipping-cube figure that was never a customer fact. Deleted
 * outright, not reformatted. */
const DECIMAL_FIXES: ProductFix[] = [
  {
    id: "premier-housewares-5506889",
    title: "Sanai White Cotton Mache Large Planter | Kaiku",
    ops: [{ from: "Cart weight: 8.000000 kg", to: null }],
  },
  {
    id: "premier-housewares-5529745",
    title: "Avignon 3 Seat Textured Fabric Cream Sofa | Kaiku",
    ops: [{ from: "Cart Weight: 57.000000 kg", to: null }],
  },
  {
    id: "product-import-aegina-table-lamp",
    title: "Aegina Table Lamp | Kaiku",
    ops: [{ from: "CBM: 0.0500", to: null }],
  },
  {
    id: "product-import-antique-gold-marching-hares-lamp-with-green-velvet-shade",
    title: "Antique Gold Marching Hares Lamp With Green Velvet Shade | Kaiku",
    ops: [{ from: "CBM: 0.0300", to: null }],
  },
  {
    id: "product-import-augusta-column-table-lamp-with-linen-shade",
    title: "Augusta Column Table Lamp With Linen Shade | Kaiku",
    ops: [{ from: "CBM: 0.0400", to: null }],
  },
  {
    id: "product-import-bloom-collection-outdoor-footstool",
    title: "Bloom Collection Outdoor Footstool | Kaiku",
    ops: [{ from: "CBM: 0.1300", to: null }],
  },
  {
    id: "product-import-contour-collection-2-drawer-2-door-sideboard",
    title: "Contour Collection 2 Drawer 2 Door Sideboard | Kaiku",
    ops: [{ from: "CBM: 0.3200", to: null }],
  },
  {
    id: "product-import-contour-collection-3-drawer-console",
    title: "Contour Collection 3 Drawer Console | Kaiku",
    ops: [{ from: "CBM: 0.1700", to: null }],
  },
  {
    id: "product-import-large-black-multi-shelf-unit",
    title: "Large Black Multi Shelf Unit | Kaiku",
    ops: [{ from: "CBM: 1.0600", to: null }],
  },
  {
    id: "product-import-the-camden-collection-round-side-table",
    title: "Camden Round Side Table | Kaiku",
    ops: [{ from: "CBM: 0.0300", to: null }],
  },
  {
    id: "product-import-the-serene-rattan-collection-coffee-table",
    title: "The Serene Rattan Collection Coffee Table | Kaiku",
    ops: [{ from: "CBM: 0.2100", to: null }],
  },
  {
    id: "product-import-vellis-wingback-armchair",
    title: "Vellis Wingback Armchair | Kaiku",
    ops: [{ from: "CBM: 0.6500", to: null }],
  },
];

/** A hand-authored bonus fix on the Sanai FAQ carrying the same fault in
 * different words ("The specifications do not clarify if a saucer or liner
 * is included") — "clarify" isn't in the ARTEFACTS verb list so it wasn't
 * in the query match, but it's the identical fault on the exact product
 * Damien flagged twice, so it's fixed alongside rather than left standing. */
const SANAI_FAQ_REMOVE_QUESTION =
  "Is a saucer or liner included with the planter?";

interface Span {
  _type: string;
  _key?: string;
  text?: string;
  [key: string]: unknown;
}
interface Block {
  _type: string;
  _key?: string;
  style?: string;
  children?: Span[];
  [key: string]: unknown;
}
interface Faq {
  _key?: string;
  question?: string;
  answer?: string;
  [key: string]: unknown;
}

const textOf = (block: Block): string =>
  (block.children ?? []).map((c) => c.text ?? "").join("");

function collapseBlock(block: Block, newText: string): Block {
  const children = block.children ?? [];
  return { ...block, children: [{ ...children[0]!, text: newText }] };
}

async function runBatch(fixes: ProductFix[], label: string) {
  const transaction = client.transaction();
  let queued = 0;
  const report: {
    id: string;
    title: string;
    applied: string[];
    missed: string[];
    headingsDropped: string[];
    headingsMissing: string[];
  }[] = [];

  for (const fix of fixes) {
    if (only && !only.includes(fix.id)) continue;

    const doc = await client.fetch<{
      title: string;
      description: Block[] | null;
    } | null>(`*[_id == $id][0]{title, description}`, { id: fix.id });

    if (!doc) {
      report.push({
        id: fix.id,
        title: fix.title,
        applied: [],
        missed: fix.ops.map((o) => o.from),
        headingsDropped: [],
        headingsMissing: fix.dropHeadings ?? [],
      });
      continue;
    }

    const blocks = doc.description ?? [];
    const applied: string[] = [];
    const missed: string[] = [];
    const toDelete = new Set<string>(); // block _key
    const toReplace = new Map<string, string>(); // block _key -> new text

    for (const op of fix.ops) {
      const match = blocks.find(
        (b) => b._type === "block" && textOf(b) === op.from,
      );
      if (!match || !match._key) {
        missed.push(op.from);
        continue;
      }
      if (op.to === null) toDelete.add(match._key);
      else toReplace.set(match._key, op.to);
      applied.push(op.from);
    }

    const headingsDropped: string[] = [];
    const headingsMissing: string[] = [];
    for (const heading of fix.dropHeadings ?? []) {
      const match = blocks.find(
        (b) =>
          b._type === "block" &&
          b.style === "h2" &&
          textOf(b) === heading &&
          b._key,
      );
      if (match?._key) {
        toDelete.add(match._key);
        headingsDropped.push(heading);
      } else {
        headingsMissing.push(heading);
      }
    }

    const nextBlocks = blocks
      .filter((b) => !b._key || !toDelete.has(b._key))
      .map((b) =>
        b._key && toReplace.has(b._key)
          ? collapseBlock(b, toReplace.get(b._key)!)
          : b,
      );

    report.push({
      id: fix.id,
      title: fix.title,
      applied,
      missed,
      headingsDropped,
      headingsMissing,
    });

    if (apply && (applied.length > 0 || headingsDropped.length > 0)) {
      transaction.patch(fix.id, (p) => p.set({ description: nextBlocks }));
      queued += 1;
    }
  }

  console.log(`\n==== ${label} ====`);
  for (const entry of report) {
    console.log(`\n---- ${entry.id} | ${entry.title}`);
    console.log(
      `  applied: ${entry.applied.length}, missed: ${entry.missed.length}, headings dropped: ${entry.headingsDropped.length}`,
    );
    for (const m of entry.missed) console.log("  MISSED:", JSON.stringify(m));
    for (const h of entry.headingsMissing)
      console.log("  HEADING MISSING (not dropped):", JSON.stringify(h));
  }

  const totalApplied = report.reduce((n, r) => n + r.applied.length, 0);
  const totalMissed = report.reduce((n, r) => n + r.missed.length, 0);
  console.log(
    `\n${label}: ${totalApplied} matched, ${totalMissed} missed, ${queued} products queued.`,
  );

  return { transaction, queued, report };
}

async function main() {
  const gap = await runBatch(GAP_FIXES, "GAP-ADMISSION FIXES");
  const decimal = await runBatch(DECIMAL_FIXES, "RAW-DECIMAL FIXES");

  // Sanai FAQ bonus fix — same product, same fault in different words.
  const faqResult: { removed: boolean; found: boolean } = {
    removed: false,
    found: false,
  };
  if (!only || only.includes("premier-housewares-5506889")) {
    const sanai = await client.fetch<{ faqs: Faq[] | null } | null>(
      `*[_id == "premier-housewares-5506889"][0]{faqs}`,
    );
    const faqs = sanai?.faqs ?? [];
    const target = faqs.find((f) => f.question === SANAI_FAQ_REMOVE_QUESTION);
    faqResult.found = !!target;
    if (target) {
      const nextFaqs = faqs.filter((f) => f !== target);
      console.log(
        `\n==== SANAI FAQ BONUS FIX ====\nRemoving FAQ: "${SANAI_FAQ_REMOVE_QUESTION}" -> "${target.answer}"`,
      );
      if (apply) {
        gap.transaction.patch("premier-housewares-5506889", (p) =>
          p.set({ faqs: nextFaqs }),
        );
        faqResult.removed = true;
      }
    } else {
      console.log(
        `\n==== SANAI FAQ BONUS FIX ====\nFAQ not found (already fixed or changed) — skipped.`,
      );
    }
  }

  if (apply) {
    if (gap.queued > 0 || faqResult.removed) await gap.transaction.commit();
    if (decimal.queued > 0) await decimal.transaction.commit();
    console.log(
      `\nApplied: ${gap.queued} gap-fix products + Sanai FAQ (${faqResult.removed}), ${decimal.queued} decimal-fix products.`,
    );
  } else {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-gap-decimal-fix-batch1.json`,
    JSON.stringify(
      {
        apply,
        only,
        gap: { queued: gap.queued, report: gap.report },
        decimal: { queued: decimal.queued, report: decimal.report },
        sanaiFaq: faqResult,
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
