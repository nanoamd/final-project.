/**
 * Batch 6: Garden furniture & outdoor — fire pit fuel type, solar vs mains,
 * and garden structures (pergola/gazebo + privacy screen height merged).
 *
 * Solar vs mains was scoped in the roadmap as covering both lighting and
 * water features. Checked before writing: every one of the 27 Water
 * Features products is mains-powered tabletop decor — a title search for
 * "solar" within that category returned zero matches. There is no real
 * solar-vs-mains choice for water features in this catalogue, so the guide
 * says that honestly and centres on garden lighting, where the choice is
 * real (garden lighting here is entirely solar).
 *
 * Standing constraint respected: this reads and references the Pergolas
 * category for guide content only — no product, price, or category data in
 * Pergolas is modified by this script.
 *
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch6.ts
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch6.ts --apply
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
  perspective: "raw",
});

const AUTHOR_ID = "author-kaiku-editorial";

function block(prefix: string, index: number, text: string, style = "normal") {
  return {
    _key: `${prefix}${index}`,
    _type: "block",
    style,
    markDefs: [],
    children: [{ _key: `${prefix}${index}s`, _type: "span", marks: [], text }],
  };
}

function table(
  prefix: string,
  index: number,
  caption: string,
  headers: string[],
  rows: string[][],
) {
  return {
    _key: `${prefix}${index}`,
    _type: "guideTable",
    caption,
    headers,
    rows: rows.map((cells, i) => ({
      _key: `${prefix}${index}r${i}`,
      _type: "guideTableRow",
      cells,
    })),
  };
}

function tool(
  prefix: string,
  index: number,
  toolName: string,
  caption: string,
) {
  return {
    _key: `${prefix}${index}`,
    _type: "guideTool",
    tool: toolName,
    caption,
  };
}

interface GuideSpec {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryId: string;
  relatedProductIds: string[];
  seo: { title: string; description: string };
  body: unknown[];
  faqs: [question: string, answer: string][];
}

const FIRE_PIT_PRODUCT_IDS = [
  "product-aosom-842-252v01gy", // 50,000 BTU Gas Fire Pit Table 81cm, Grey
  "product-aosom-842-253", // 40,000 BTU Gas Fire Pit Table 71cm, Grey
  "product-aosom-842-337v00sr", // Portable Smokeless Wood-Burning Fire Pit
  "product-aosom-842-345v70gy", // 50,000 BTU Gas Fire Pit Table with Glass Screen
  "product-aosom-867-123v00gy", // 14.5kW Rattan Gas Fire Pit Dining Table
  "product-aosom-842-063", // Hanging Electric Patio Heater
  "product-aosom-842-070", // Ceiling-Mounted Infrared Halogen Patio Heater
  "product-aosom-842-389v70sr", // 11kW Adjustable Gas Patio Heater
];

const SOLAR_MAINS_PRODUCT_IDS = [
  "product-aosom-842-108", // 1.6m Dimmable Solar Bollard Light
  "product-aosom-842-109", // 1.8m Victorian Three-Head Solar Lamp Post
  "product-aosom-867-154v00bn", // Rattan Solar Floor Lantern, Brown
  "product-aosom-b30-006", // 1.77m Solar Bollard Lantern
  "product-aosom-b30-068v00bk", // Solar Lamp Post Light with Planter
  "product-aosom-844-830v00mx", // Garden Water Feature with LED Lights (mains)
  "product-aosom-84j-250v70mx", // Five-Tier Cascading Fountain with LED Lights (mains)
  "product-import-13-6m-44ft-6in-plug-in-led-warm-white-christmas-string-light", // Plug-in LED string lights (mains)
];

const GARDEN_STRUCTURE_PRODUCT_IDS = [
  "product-aosom-84c-128", // 3x3m Double-Roof Garden Gazebo with Netting
  "product-aosom-84c-175", // Metal Pergola with Retractable Roof and Drainage
  "product-aosom-84c-441v00lg", // Metal Pergola with Sliding Canopy and Curtains
  "product-aosom-84c-470v02cg", // Lean-To Steel Pergola with Sliding Canopy
  "product-aosom-844-610v00bk", // Willow Branch Metal Privacy Screen
  "product-aosom-844-743v00bk", // Leaf Metal Privacy Screen
  "product-aosom-84j-037v00bk", // Metal Privacy Screen and Climbing Trellis
  "product-aosom-84h-084v00cg", // Garden Planter Box with Back Trellis
];

const GUIDES: GuideSpec[] = [
  {
    id: "guide-fire-pit-fuel-type",
    title: "Gas, wood or electric — which fire pit fuel actually suits you?",
    slug: "fire-pit-fuel-type",
    excerpt:
      "Gas lights instantly and produces no smoke or ash — most of our own range is gas for exactly that reason. Wood gives real flame and crackle but needs ventilation and cleaning out. Electric is the only safe choice under a covered or built-in structure. Eight of our own heaters and fire pits, sorted by fuel.",
    categoryId: "category-fire-pits",
    relatedProductIds: FIRE_PIT_PRODUCT_IDS,
    seo: {
      title: "Gas vs Wood vs Electric Fire Pit: Which Fuel? | Kaiku",
      description:
        "Gas lights instantly with no smoke or ash. Wood gives real flame but needs ventilation. Electric is the only safe option under cover. 8 real heaters and fire pits, sorted by fuel.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "Gas is instant — light it, adjust it, turn it off, with no smoke, no ash, and no smell left on your clothes afterward. It's why most of our own fire pit range is gas or propane. Wood gives you the thing gas can't fake: real flame, crackle and woodsmoke, at the cost of needing ventilation, a chimney effect that pushes smoke wherever the wind takes it, and ash to clean out afterward. Electric is the odd one out — no open flame at all, which makes it the only genuinely safe choice under a gazebo roof, a covered pergola, or anywhere with limited airflow.",
      );
      p(
        "The choice usually comes down to where the fire pit will actually sit, more than which fuel appeals most in the abstract.",
      );
      b.push(
        table(
          "b",
          n,
          "Fire pit fuel compared",
          ["Fuel", "Flame / ambiance", "Cleanup", "Where it's safe"],
          [
            [
              "Gas / propane",
              "Controllable flame, no crackle",
              "None — no ash or soot",
              "Open or covered patio, with ventilation",
            ],
            [
              "Wood",
              "Real flame, crackle, woodsmoke",
              "Ash to clear after every use",
              "Fully open air only",
            ],
            [
              "Electric / infrared",
              "No flame — radiant heat only",
              "None",
              "Anywhere, including under cover",
            ],
          ],
        ),
      );
      n += 1;
      b.push(
        tool(
          "b",
          n,
          "patio-heat",
          "Once you've picked a fuel, size the output",
        ),
      );
      n += 1;
      p("Rule one. Gas is the practical default for most gardens", "h2");
      p(
        "No ash, no smoke drifting into a neighbour's garden, and heat you can dial up or down rather than waiting for a flame to build or die down — which is why gas dominates fire pit tables in general, and why most of ours are built that way. The trade-off is that it needs a gas bottle managed and swapped, and it doesn't give you real wood smoke or crackle, which some people are specifically after.",
      );
      p(
        "It's also the fuel that suits a fire pit doubling as a dining table — several of ours are built exactly that way, where a wood fire's smoke and spitting embers would be a genuine problem at the table.",
      );
      p("Rule two. Wood is for the experience, not the convenience", "h2");
      p(
        "A wood-burning fire pit gives you the actual thing people picture when they think 'fire pit' — real flame, the smell of woodsmoke, the sound of it. It needs the fully open air a gas or electric option doesn't strictly require, since smoke has to go somewhere, and it needs cleaning out after use in a way neither alternative does.",
      );
      p(
        "A smokeless design reduces but doesn't eliminate this — it burns more completely and produces less visible smoke than an open wood fire, but it's still a real flame that wants open air around it, not a covered structure.",
      );
      p("Rule three. Electric is the only option that works under cover", "h2");
      p(
        "Anywhere with a roof, canopy or limited airflow — a covered pergola, a gazebo, close to a house wall — an open flame is a genuine hazard, whether that flame is gas or wood. Electric and infrared heaters produce heat with no combustion at all, which is the actual reason they exist as a category rather than a lesser version of a 'real' fire pit.",
      );
      p(
        "What you lose is the visual and social centrepiece a flame provides — an infrared heater warms you but doesn't give a group something to sit around the way a fire does, which is worth knowing before assuming it's a straight substitute.",
      );
      p("Eight of ours, by fuel", "h2");
      p(
        "Sorted by fuel type first, since that's the decision this guide is actually about — output sizing is the calculator above, once the fuel's chosen.",
      );
      b.push(
        table(
          "b",
          n,
          "Our fire pits and patio heaters, by fuel",
          ["Product", "Fuel", "Output"],
          [
            ["50,000 BTU Gas Fire Pit Table, 81cm", "Gas", "50,000 BTU"],
            ["40,000 BTU Gas Fire Pit Table, 71cm", "Gas", "40,000 BTU"],
            [
              "Portable Smokeless Wood-Burning Fire Pit",
              "Wood",
              "N/A — real flame",
            ],
            [
              "50,000 BTU Gas Fire Pit Table with Glass Screen",
              "Gas",
              "50,000 BTU",
            ],
            ["14.5kW Rattan Gas Fire Pit Dining Table", "Gas", "14.5kW"],
            [
              "Hanging Electric Patio Heater",
              "Electric",
              "Radiant heat, no flame",
            ],
            [
              "Ceiling-Mounted Infrared Halogen Patio Heater",
              "Electric / infrared",
              "Radiant heat, no flame — safe under cover",
            ],
            ["11kW Adjustable Gas Patio Heater", "Gas", "11kW"],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "Gas is instant, clean and the practical default for most gardens. Wood gives real flame and smoke at the cost of ventilation and cleanup. Electric is the only fuel that's genuinely safe under a covered structure. Pick the fuel by where it's going first, then size the output.",
      );
      return b;
    })(),
    faqs: [
      [
        "Is gas or wood better for a fire pit?",
        "Gas is cleaner and more convenient — instant on and off, no ash, no smoke drifting into a neighbour's garden. Wood gives real flame and crackle but needs fully open air and cleaning out after every use. Neither is objectively better; they suit different priorities.",
      ],
      [
        "Can you put a fire pit under a covered patio?",
        "Not a gas or wood one safely — both need open airflow. Electric or infrared heaters are the only fuel type genuinely safe under a roof, canopy or covered pergola, since they involve no combustion at all.",
      ],
      [
        "Do smokeless fire pits produce no smoke at all?",
        "They produce noticeably less visible smoke than an open wood fire by burning more completely, but they're still a real flame and still need open air around them — 'smokeless' describes a reduction, not an elimination.",
      ],
      [
        "Are gas fire pits safe on a wooden deck?",
        "Generally yes with the manufacturer's stated clearance followed, since gas produces no embers or sparks the way wood does. Always check the specific product's own decking guidance rather than assuming — clearance requirements vary by model.",
      ],
      [
        "What fire pit fuel is best for a fire pit dining table?",
        "Gas, almost always — a wood fire's smoke and occasional spitting embers are a real problem at a table people are sitting close around to eat. This is why fire pit dining tables in general, including ours, are built as gas rather than wood-burning.",
      ],
    ],
  },
  {
    id: "guide-solar-vs-mains-garden-lighting",
    title:
      "Solar or mains garden lighting — and why water features are different",
    slug: "solar-vs-mains-garden-lighting-and-water-features",
    excerpt:
      "Solar suits path and border lighting well, provided it gets 4-5 hours of direct sun a day — no cabling, no running cost. Mains suits anywhere shaded, or anywhere needing reliable output through a grey British winter. Water features are a different story: every one we sell is mains-powered tabletop decor, not a solar option at all.",
    categoryId: "category-garden-lighting",
    relatedProductIds: SOLAR_MAINS_PRODUCT_IDS,
    seo: {
      title: "Solar vs Mains Garden Lighting: Which to Choose? | Kaiku",
      description:
        "Solar suits path and border lighting with 4-5 hours of direct sun and no cabling or running cost. Mains suits shaded spots or reliable winter output. Water features are mains, not solar.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "Solar garden lighting needs 4-5 hours of direct sun a day to charge properly — given that, it lights a path or border with zero cabling and zero running cost, which is genuinely most of the appeal. Mains lighting doesn't care about sun exposure at all, which makes it the answer for a shaded corner, or for anywhere that needs reliable output through a grey British winter when solar panels simply aren't getting the hours.",
      );
      p(
        "Water features are worth separating out here rather than folding into the same solar-vs-mains question: every water feature we sell is mains-powered tabletop decor, not something with a solar option in the first place. What follows covers the real choice — lighting — and is honest about why water features aren't part of it.",
      );
      b.push(
        table(
          "b",
          n,
          "Solar vs mains garden lighting",
          ["", "Solar", "Mains"],
          [
            ["Running cost", "None", "Electricity cost, however small"],
            [
              "Installation",
              "No cabling — just position it in sun",
              "Requires outdoor-rated cabling",
            ],
            [
              "Reliable in winter / shade",
              "No — needs 4-5hrs direct sun",
              "Yes — unaffected by sun exposure",
            ],
            [
              "Best for",
              "Paths, borders, anywhere sunny",
              "Shaded areas, or year-round reliability",
            ],
          ],
        ),
      );
      n += 1;
      p(
        "Rule one. Four to five hours of direct sun is the real requirement",
        "h2",
      );
      p(
        "A solar light's output depends entirely on how much genuine direct sun its panel gets, not daylight in general — a spot that's bright but shaded by a tree or a fence gets nowhere near enough charge, however light it looks to the eye. Check the actual sun exposure of the specific spot, at the time of year you want the light working, before assuming any sunny-looking corner of the garden will do.",
      );
      p(
        "This is also why solar lighting under-performs in a UK winter specifically — shorter days and lower sun angles cut the usable charging window well below that 4-5 hour target, even in a spot that charges fine all summer.",
      );
      p(
        "Rule two. Mains is the only reliable option for a shaded or year-round spot",
        "h2",
      );
      p(
        "Anywhere that doesn't get consistent direct sun — under a tree, against a north-facing wall, most gardens through a British winter — mains lighting is the only fuel type that keeps working regardless. The cost is the cabling itself, which needs to be outdoor-rated and, for anything permanent, is worth having installed properly rather than run loose across a lawn.",
      );
      p(
        "It's also the practical choice for anywhere brightness actually matters for safety — steps, a driveway, anywhere getting it wrong has a real consequence beyond the light just not looking as good.",
      );
      p(
        "Rule three. Water features here are mains, and that's worth knowing upfront",
        "h2",
      );
      p(
        "Every water feature in our range — from small tabletop fountains to the larger cascading designs — plugs in rather than running on solar. If you searched expecting a solar water feature, that's not a gap in this guide, it's the honest state of what's on sale: none of our own stock offers it, so there's no genuine solar-vs-mains choice to make here the way there is with lighting.",
      );
      p(
        "What mains buys you with a water feature specifically is consistent flow — a solar-powered pump's output would vary with available sunlight through the day, which matters more for a feature you're watching and listening to than it does for a light you're glancing at after dark.",
      );
      p(
        "Eight of ours, solar lighting and mains water features side by side",
        "h2",
      );
      p(
        "Solar lighting first, then two of our mains water features and a mains string-light example, so the contrast is direct rather than implied.",
      );
      b.push(
        table(
          "b",
          n,
          "Our garden lighting and water features",
          ["Product", "Power", "Best for"],
          [
            [
              "1.6m Dimmable Solar Bollard Light",
              "Solar",
              "Path or border, sunny spot",
            ],
            [
              "1.8m Victorian Three-Head Solar Lamp Post",
              "Solar",
              "Driveway or entrance, sunny spot",
            ],
            [
              "Rattan Solar Floor Lantern, Brown",
              "Solar",
              "Patio or decking, sunny spot",
            ],
            [
              "1.77m Solar Bollard Lantern",
              "Solar",
              "Path lighting, sunny spot",
            ],
            [
              "Solar Lamp Post Light with Planter",
              "Solar",
              "Border, sunny spot",
            ],
            [
              "Garden Water Feature with LED Lights",
              "Mains",
              "Patio or courtyard, any light level",
            ],
            [
              "Five-Tier Cascading Fountain with LED Lights",
              "Mains",
              "Garden feature, any light level",
            ],
            [
              "13.6m Warm White LED String Lights",
              "Mains, plug-in",
              "Patio or pergola, shaded or not",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "Solar needs 4-5 hours of direct sun and gives you zero cabling and zero running cost for paths and borders. Mains works regardless of sun exposure and suits shaded spots and winter reliability. Water features in our range are mains-only — not a gap in this guide, just the honest state of the stock.",
      );
      return b;
    })(),
    faqs: [
      [
        "How much sun does solar garden lighting need?",
        "4-5 hours of direct sun a day, on the panel itself, to charge properly. A spot that looks bright but is shaded by a tree or fence for most of the day won't charge it fully, even if it seems sunny to the eye.",
      ],
      [
        "Does solar garden lighting work in winter?",
        "Less reliably — shorter days and lower sun angles cut the usable charging window well below the 4-5 hour target, even in a spot that performs well through summer. A shaded or winter-critical spot suits mains lighting better.",
      ],
      [
        "Does Kaiku sell solar water features?",
        "No — every water feature in our range is mains-powered. If a solar option matters to you specifically, that's worth knowing before browsing this category, since it isn't something we currently stock in any of our fountains or water features.",
      ],
      [
        "Is mains garden lighting worth the cost of installation over solar?",
        "For a shaded spot or anywhere needing reliable year-round output, generally yes — solar simply can't deliver that regardless of how it's installed. For a sunny path or border, solar usually isn't worth the extra installation cost or cabling.",
      ],
      [
        "Why do water features use mains power instead of solar?",
        "Mains gives a water feature consistent flow regardless of the time of day or available sunlight, which matters more for something you're watching and listening to continuously than it does for a light glanced at after dark.",
      ],
    ],
  },
  {
    id: "guide-garden-structures",
    title: "Pergola or gazebo, and how tall can a privacy screen legally be?",
    slug: "pergola-vs-gazebo-and-privacy-screen-height",
    excerpt:
      "A gazebo is built for weather protection first — netting, a solid roof, sometimes curtains. A pergola is more architectural, often with a retractable or sliding canopy rather than full coverage. UK permitted development allows a garden boundary up to 2m without planning permission (1m facing a highway) — and a trellis topper counts toward that total.",
    categoryId: "category-pergolas",
    relatedProductIds: GARDEN_STRUCTURE_PRODUCT_IDS,
    seo: {
      title: "Pergola vs Gazebo, and Privacy Screen Height Rules | Kaiku",
      description:
        "A gazebo protects from weather with netting and a solid roof; a pergola is more architectural with a retractable canopy. UK permitted development allows 2m boundary height without planning permission.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "A gazebo is built for weather protection first — a full or double roof, insect netting, sometimes curtains, designed to be sat under whatever the weather's doing. A pergola is more architectural: a structural frame, often with a retractable or sliding canopy rather than full coverage, built to define a space and give partial shade rather than complete shelter.",
      );
      p(
        "Privacy screens are a separate structure with their own real constraint: UK permitted development allows a garden boundary up to 2m without planning permission, dropping to 1m where it faces a highway — and a trellis added to the top of a fence counts toward that total height, which is easy to miss until it's already built too tall.",
      );
      b.push(
        table(
          "b",
          n,
          "Pergola, gazebo and privacy screen height",
          ["Structure", "Job", "Height rule"],
          [
            [
              "Gazebo",
              "Full weather protection — roof and netting",
              "No fixed rule; check against boundary height near a fence line",
            ],
            [
              "Pergola",
              "Partial shade, architectural structure",
              "No fixed rule; check against boundary height near a fence line",
            ],
            [
              "Privacy screen / fence",
              "Boundary and sightline privacy",
              "2m without planning permission (1m facing a highway)",
            ],
          ],
        ),
      );
      n += 1;
      p(
        "Rule one. Choose by how much weather you actually need to sit through",
        "h2",
      );
      p(
        "A gazebo's solid or double roof and netting are built to keep rain and insects out entirely, which is the right call for a space meant to be used regardless of weather. A pergola's retractable or sliding canopy gives you the choice — open for full sun, drawn across for shade — but it isn't built to shed serious rain the way a gazebo's dedicated roof is.",
      );
      p(
        "This is really a question about what the space is for: a gazebo suits somewhere you want usable rain or shine; a pergola suits somewhere you're mostly managing sun rather than weather in general.",
      );
      p(
        "Rule two. Two metres is the boundary figure to know before building anything tall",
        "h2",
      );
      p(
        "UK permitted development rights allow a fence, wall or gate up to 2m high without planning permission, measured from ground level — this covers most garden privacy screens outright. Where a boundary faces a highway used by vehicles, that limit drops to 1m, which in practice usually means a front boundary facing a road rather than a back or side garden fence.",
      );
      p(
        "This right can be removed or tightened on specific properties — an Article 4 direction, a listed building, or a conservation area can all override the standard 2m allowance, so it's worth checking your own property's status before assuming the general rule applies.",
      );
      p(
        "Rule three. A trellis topper adds to the total, it doesn't sit outside it",
        "h2",
      );
      p(
        "Add a trellis to the top of an existing 1.8m fence and the combined height is 2.1m — over the permitted-development limit, even though the fence panel itself was compliant on its own. This is the single most common way a garden boundary ends up taller than intended: the fence and the trellis get measured and approved separately in someone's head, when the rule measures the whole structure as one.",
      );
      p(
        "Our own privacy screens run about 198cm — just under the 2m limit on their own, which leaves no real headroom to add a trellis or climbing frame on top without checking the combined height first.",
      );
      p("Four structures from our range", "h2");
      p(
        "Two gazebos, two pergolas, and privacy screens including one with a built-in trellis — the exact case rule three is about.",
      );
      b.push(
        table(
          "b",
          n,
          "Our garden structures",
          ["Product", "Type", "Height"],
          [
            [
              "3 x 3m Double-Roof Garden Gazebo with Netting",
              "Gazebo — full weather protection",
              "278cm",
            ],
            [
              "Metal Pergola with Retractable Roof and Drainage",
              "Pergola — retractable canopy",
              "65cm frame height (check full spec)",
            ],
            [
              "Metal Pergola with Sliding Canopy and Curtains",
              "Pergola — sliding canopy",
              "227cm",
            ],
            [
              "Lean-To Steel Pergola with Sliding Canopy",
              "Pergola — lean-to, sliding canopy",
              "220cm",
            ],
            [
              "Willow Branch Metal Privacy Screen with Stand",
              "Privacy screen",
              "198cm",
            ],
            ["Leaf Metal Privacy Screen", "Privacy screen", "198cm"],
            [
              "Metal Privacy Screen and Climbing Trellis",
              "Privacy screen with trellis",
              "198cm — add any further trellis to this total",
            ],
            [
              "Garden Planter Box with Back Trellis",
              "Planter with trellis",
              "150cm",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "A gazebo protects from real weather with a solid roof and netting; a pergola is more architectural, usually with partial, retractable shade instead. UK permitted development allows a 2m garden boundary without planning permission, 1m facing a highway — and a trellis on top of a fence counts toward that total, not on top of it.",
      );
      return b;
    })(),
    faqs: [
      [
        "What's the difference between a pergola and a gazebo?",
        "A gazebo is built for full weather protection — a solid or double roof and insect netting, usable regardless of rain. A pergola is more architectural, typically with a retractable or sliding canopy that gives partial shade rather than complete shelter.",
      ],
      [
        "How tall can a garden fence or privacy screen be without planning permission?",
        "2m from ground level under UK permitted development rights, dropping to 1m where the boundary faces a highway used by vehicles — usually a front boundary rather than a back or side garden fence.",
      ],
      [
        "Does adding a trellis to a fence require planning permission?",
        "It might — the trellis adds to the fence's total height, and if the combined height goes over 2m (or 1m facing a highway), the whole structure needs planning permission even if the fence alone was compliant.",
      ],
      [
        "Can a pergola be used as full rain shelter?",
        "Not reliably — most pergolas use a retractable or sliding canopy built primarily for shade, not the solid, sealed roof a gazebo is designed with. For genuine all-weather use, a gazebo is the better-suited structure.",
      ],
      [
        "Are there exceptions to the 2m fence height rule?",
        "Yes — an Article 4 direction, listed building status, or a conservation area can remove or tighten the standard permitted development allowance on specific properties. Check your property's own status before assuming the general 2m rule applies.",
      ],
    ],
  },
];

async function main() {
  const existing = await client.fetch<string[]>(
    `*[_type=="buyingGuide" && slug.current in $slugs].slug.current`,
    { slugs: GUIDES.map((g) => g.slug) },
  );
  if (existing.length)
    console.log(`Already present, skipping: ${existing.join(", ")}`);

  const results: Record<string, unknown>[] = [];

  for (const guide of GUIDES) {
    if (existing.includes(guide.slug)) continue;

    const chars = JSON.stringify(guide.body).length;
    console.log(`\n${guide.title}`);
    console.log(
      `   /learn/${guide.slug}   ${guide.body.length} body blocks, ~${chars} chars   ${guide.faqs.length} FAQs   ${guide.relatedProductIds.length} related products`,
    );

    results.push({
      slug: guide.slug,
      title: guide.title,
      bodyBlocks: guide.body.length,
      faqs: guide.faqs.length,
      relatedProducts: guide.relatedProductIds.length,
    });

    if (!apply) continue;

    await client.createOrReplace({
      _id: guide.id,
      _type: "buyingGuide",
      title: guide.title,
      slug: { _type: "slug", current: guide.slug },
      excerpt: guide.excerpt,
      body: guide.body,
      faqs: guide.faqs.map(([question, answer], i) => ({
        _key: `faq-${i}`,
        _type: "faqEntry",
        question,
        answer,
      })),
      author: { _type: "reference", _ref: AUTHOR_ID },
      relatedCategory: { _type: "reference", _ref: guide.categoryId },
      relatedProducts: guide.relatedProductIds.map((id, i) => ({
        _key: `rp-${i}`,
        _type: "reference",
        _ref: id,
      })),
      publishedAt: new Date().toISOString(),
      seo: {
        _type: "seo",
        metaTitle: guide.seo.title,
        metaDescription: guide.seo.description,
      },
    });
    console.log(`   created ${guide.id}`);
  }

  console.log(
    `\n${apply ? "Created" : "Would create"} ${results.length} buying guides.`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-03-create-buying-guides-batch6.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
