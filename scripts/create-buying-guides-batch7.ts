/**
 * Batch 7 — the last of the roadmap's planned guides: Wellness (infrared vs
 * traditional sauna, and cold plunge chiller/temperature) and Planters
 * (winter material).
 *
 * The infrared-vs-traditional guide is named carefully. The roadmap's
 * original framing was infrared vs wood-fired — checked the actual product
 * descriptions before writing (not just titles) and found the non-infrared
 * saunas (Bronte, Pennine Barrel) are heated by a Harvia electric stove, not
 * wood. Kaiku sells zero wood-fired saunas. The guide compares infrared
 * against what we actually sell instead: traditional electric-heated
 * Finnish-style cabins.
 *
 * Cold plunge has exactly one SKU in the whole catalogue. The guide is
 * honest about that rather than presenting a false choice, and pairs it
 * with two infrared saunas for the contrast-therapy angle, which is a real
 * reason those three products are bought together — not padding.
 *
 * Both wellness guides link to (rather than embed) the sauna-size and
 * cold-plunge-size capacity calculators, which need server-fetched product
 * data the guideTool embed mechanism can't carry — documented in
 * guide-tool-embed.tsx. Both do embed the new `contrast-therapy` entry
 * (ContrastTherapyBuilder is prop-less, unlike the capacity calculators).
 *
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch7.ts
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch7.ts --apply
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

const SAUNA_PRODUCT_IDS = [
  "product-import-4-person-indoor-infrared-sauna-saunaplunge-25f636e4", // Dales Glow 4-Person Indoor Infrared
  "product-import-the-dales-glow-indoor-infrared-sauna-by-saunaplunge-2-person-9bf29917", // Dales Glow 2-Person Indoor Infrared
  "product-import-2-person-outdoor-infrared-sauna-saunaplunge-9b8264b5", // Yorkshire Cabin 2-Person Outdoor Infrared
  "product-import-4-person-outdoor-infrared-sauna-saunaplunge-90561a20", // Yorkshire Cabin 4-Person Outdoor Infrared
  "product-import-bronte-2-person-cabin-sauna-saunaplunge-0875b2a6", // Bronte 2-Person Cabin, traditional Harvia electric
  "product-import-bronte-6-person-cabin-sauna-saunaplunge-cae97287", // Bronte 6-Person Cabin, traditional Harvia electric
  "product-import-pennine-barrel-6-person-sauna-saunaplunge-0c76326a", // Pennine Barrel 6-Person, traditional
];

const COLD_PLUNGE_PRODUCT_IDS = [
  "product-import-ice-bath-with-chiller-saunaplunge-7c314725", // Peak Plunge Ice Bath with Chiller — the only SKU
  "product-import-2-person-outdoor-infrared-sauna-saunaplunge-9b8264b5", // Yorkshire Cabin 2-Person, for the contrast-therapy pairing
  "product-import-the-dales-glow-indoor-infrared-sauna-by-saunaplunge-2-person-9bf29917", // Dales Glow 2-Person, for the contrast-therapy pairing
];

const PLANTER_PRODUCT_IDS = [
  "premier-housewares-5506190", // Yuri Small Terracotta Gold Spotted
  "premier-housewares-5506191", // Yuri Large Terracotta Gold Spotted
  "premier-housewares-5506183", // Kiso Black Large Stoneware
  "product-import-eucalyptus-plant-in-stone-effect-pot", // Eucalyptus Plant in Stone Effect Pot
  "premier-housewares-2406737", // Depok Small Rattan Planter with Metal Stand
  "premier-housewares-2406738", // Depok Large Rattan Planter with Metal Stand
  "premier-housewares-5506560", // Arlo Large Engraved Wooden Planter
  "premier-housewares-5506072", // Honna Small White Silver Ceramic Planter
];

const GUIDES: GuideSpec[] = [
  {
    id: "guide-infrared-vs-traditional-sauna",
    title:
      "Infrared or traditional sauna — and what the running cost actually looks like",
    slug: "infrared-vs-traditional-sauna",
    excerpt:
      "Straight correction first: we don't sell a wood-fired sauna — our non-infrared cabins run on a Harvia electric stove. Infrared heats your body directly at 45-60°C; a traditional cabin heats the whole room to 70-90°C+, which is most of why infrared costs noticeably less to run. Seven of our own saunas, sorted by which type they actually are.",
    categoryId: "category-outdoor-saunas",
    relatedProductIds: SAUNA_PRODUCT_IDS,
    seo: {
      title: "Infrared vs Traditional Sauna: Heat & Running Cost | Kaiku",
      description:
        "Infrared heats your body directly at 45-60°C; traditional heats the room to 70-90°C+. We sell traditional electric-heated cabins, not wood-fired. 7 real saunas compared.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "If you're comparing infrared against wood-fired, a correction first: we don't sell a wood-fired sauna. Our non-infrared cabins — the Bronte and Pennine Barrel ranges — are heated by a Harvia electric stove, the same brand serious Finnish sauna builders use, not a wood burner. The real comparison in our own range is infrared against traditional electric-heated.",
      );
      p(
        "The actual difference is how the heat reaches you. Infrared panels warm your body directly through infrared light at a lower ambient temperature, typically 45-60°C. A traditional cabin heats the entire volume of air in the room, which needs a much higher temperature — commonly 70-90°C or more — before it feels like a sauna. Heating a whole room's air to that temperature is why traditional saunas cost noticeably more to run than infrared for a comparable session.",
      );
      b.push(
        table(
          "b",
          n,
          "Infrared vs traditional sauna",
          ["", "Infrared", "Traditional (electric)"],
          [
            ["Typical temperature", "45-60°C", "70-90°C+"],
            [
              "How it heats you",
              "Direct — infrared panels",
              "Indirect — heats the room's air",
            ],
            [
              "Running cost",
              "Lower — less air to heat",
              "Higher — heats a much larger volume",
            ],
            [
              "Heat-up time",
              "Faster — no need to heat the whole cabin",
              "Slower — the room has to reach temperature first",
            ],
            [
              "Traditional löyly (steam)",
              "No",
              "Yes, with water on the stones",
            ],
          ],
        ),
      );
      n += 1;
      p("Rule one. Infrared costs less to run because it heats less", "h2");
      p(
        "An infrared panel warms your body directly rather than the air around you, so a session only needs the panels themselves powered, not an entire cabin's worth of air raised by 60-70°C. A traditional electric stove heats that whole volume before anyone gets the benefit, which is the direct reason it draws more power for a comparable session length.",
      );
      p(
        "This gap holds even though both are electric — the difference is what's being heated, not the fuel. Comparing our two ranges, this is the actual trade-off behind the price and experience difference, not just marketing language.",
      );
      p(
        "Rule two. Traditional gives you löyly — steam off hot stones — which infrared can't",
        "h2",
      );
      p(
        "A traditional sauna's stove holds volcanic stones you pour water over for löyly — the burst of steam and humidity that's central to the Finnish sauna experience, and something no infrared panel produces since there's no stove or stones involved. If steam and humidity are what you're picturing when you think 'sauna,' that's the traditional cabin, not infrared.",
      );
      p(
        "Infrared trades that experience for a gentler, drier heat that many people find easier to sit in for longer, and a faster start since there's no room to bring up to temperature first.",
      );
      p(
        "Rule three. Both need real installation — check power and space before choosing on running cost alone",
        "h2",
      );
      p(
        "A traditional cabin's electric stove typically draws more power than an infrared panel setup of a comparable size, which can mean a dedicated circuit where an infrared unit might not. Check the specific product's electrical requirements against your own supply before assuming either type is a straightforward plug-in.",
      );
      p(
        "Indoor infrared units need less structural change than an outdoor cabin of either type, which is worth weighing alongside running cost if space and installation are the bigger constraint for your home.",
      );
      b.push(
        tool("b", n, "contrast-therapy", "Plan a session once you've chosen"),
      );
      n += 1;
      p("Seven of our saunas, sorted by type", "h2");
      p(
        "Infrared first, then the traditional electric-heated cabins — so the type is clear before the capacity or price is.",
      );
      b.push(
        table(
          "b",
          n,
          "Our saunas, by type",
          ["Sauna", "Type", "Capacity", "Price"],
          [
            ["Dales Glow 4-Person Indoor", "Infrared", "4 people", "£3,938"],
            ["Dales Glow 2-Person Indoor", "Infrared", "2 people", "£2,813"],
            [
              "Yorkshire Cabin 2-Person Outdoor",
              "Infrared",
              "2 people",
              "£3,263",
            ],
            [
              "Yorkshire Cabin 4-Person Outdoor",
              "Infrared",
              "4 people",
              "£4,388",
            ],
            [
              "Bronte 2-Person Cabin",
              "Traditional — Harvia electric stove",
              "2 people",
              "£3,263",
            ],
            [
              "Bronte 6-Person Cabin",
              "Traditional — Harvia electric stove",
              "6 people",
              "£5,400",
            ],
            [
              "Pennine Barrel 6-Person",
              "Traditional — electric stove",
              "6 people",
              "£6,500",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "We sell infrared and traditional electric-heated saunas — no wood-fired option. Infrared runs cooler (45-60°C) and cheaper, heating your body directly. Traditional runs hotter (70-90°C+), heats the whole cabin, and gives you real löyly steam infrared can't produce. Choose by the experience you actually want, then check the specific unit's power needs against your supply.",
      );
      return b;
    })(),
    faqs: [
      [
        "Does Kaiku sell wood-fired saunas?",
        "No — our non-infrared saunas (Bronte and Pennine Barrel) run on a Harvia electric stove, not a wood burner. If wood-fired specifically is what you're after, that's not something in our current range.",
      ],
      [
        "Is infrared or traditional sauna cheaper to run?",
        "Infrared, generally — it heats your body directly at a lower temperature (45-60°C) rather than heating an entire cabin's air to 70-90°C or more, which is what drives a traditional sauna's higher running cost.",
      ],
      [
        "Can you get steam (löyly) in an infrared sauna?",
        "No — löyly comes from pouring water over hot stones on a traditional stove, and infrared panels don't have stones or a stove to produce it. If steam and humidity are central to what you want from a sauna, a traditional cabin is the one that delivers it.",
      ],
      [
        "What temperature does an infrared sauna run at?",
        "Typically 45-60°C, well below a traditional sauna's 70-90°C or more. The lower temperature is possible because infrared heats your body directly rather than needing to heat the surrounding air to the same degree.",
      ],
      [
        "Do traditional electric saunas need a dedicated power circuit?",
        "Often, yes — a traditional stove typically draws more power than an infrared setup of similar size, and may need a dedicated circuit some homes don't already have. Check the specific product's electrical requirements before assuming it's a straightforward plug-in.",
      ],
    ],
  },
  {
    id: "guide-cold-plunge-chiller-and-temperature",
    title:
      "Cold plunge with a chiller — is it worth it over ice, and what temperature?",
    slug: "cold-plunge-chiller-vs-ice-and-temperature",
    excerpt:
      "We sell one cold plunge, and it comes with a chiller built in rather than as an ice-bath-plus-bags-of-ice setup — worth knowing plainly rather than presenting a false choice. Here's why a chiller earns its cost over ice for regular use, the temperature range that actually matters, and how it pairs with our infrared saunas for contrast therapy.",
    categoryId: "category-cold-plunges",
    relatedProductIds: COLD_PLUNGE_PRODUCT_IDS,
    seo: {
      title: "Cold Plunge Chiller vs Ice, and Temperature Range | Kaiku",
      description:
        "We sell one cold plunge, chiller-equipped rather than ice-based — here's why that earns its cost for regular use, the real temperature range for cold plunging, and pairing it with a sauna.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "Straight answer first: we sell one cold plunge, the Peak Plunge Ice Bath with Chiller, and it's built with a chiller rather than sold as a bath you fill and top up with bags of ice. That's not us hiding a cheaper ice-only option — it's the only cold plunge in the range, and the chiller is why.",
      );
      p(
        "A chiller holds the water at a set temperature continuously rather than starting cold and gradually warming as ice melts, which matters for anyone using it regularly rather than as an occasional novelty. What follows is why that consistency earns its cost, and the temperature range cold plunging actually uses.",
      );
      b.push(
        table(
          "b",
          n,
          "Chiller vs ice, for regular use",
          ["", "Chiller", "Ice bags"],
          [
            [
              "Temperature consistency",
              "Set and held automatically",
              "Cold at first, warms as ice melts",
            ],
            [
              "Ongoing cost",
              "Electricity only",
              "Buying or making ice every session",
            ],
            [
              "Effort per session",
              "None — already at temperature",
              "Filling and emptying ice each time",
            ],
            ["Upfront cost", "Higher", "Lower, if you already own a tub"],
          ],
        ),
      );
      n += 1;
      p(
        "Rule one. Ice cools a tub once; a chiller keeps it cold every time",
        "h2",
      );
      p(
        "Ice-cooled water starts at its coldest and warms steadily from the moment it's added — fine for one session, but it means every use starts with buying or making more ice, and the water's actual temperature drifts throughout the session rather than holding steady. A chiller removes that variability entirely: the water sits at a set point and stays there, session after session, with no prep beyond switching it on.",
      );
      p(
        "For occasional or one-off use, ice is the cheaper way to try cold plunging without committing to the equipment. For anyone doing it regularly — several times a week, which is what most cold-plunge protocols actually call for — the chiller's consistency and the ice's the recurring cost and effort both point the same direction.",
      );
      p(
        "Rule two. Ten to fifteen degrees is the range most cold-plunge protocols use",
        "h2",
      );
      p(
        "Most cold plunge protocols work in the 10-15°C range — cold enough to trigger the physiological response people are after, without the extra risk of genuinely ice-cold water, which is closer to 0-4°C and generally reserved for shorter, more experienced use. A chiller's real advantage here is holding a specific number in that range consistently, rather than guessing at how cold an ice-and-water mix currently is.",
      );
      p(
        "Contrast therapy — alternating hot and cold — typically uses a similar cold-side range, paired with a hot side well above it; the tool below builds a full protocol around both once you've picked a temperature.",
      );
      b.push(
        tool("b", n, "contrast-therapy", "Build a full hot-cold protocol"),
      );
      n += 1;
      p(
        "Rule three. It's usually bought alongside a sauna, not on its own",
        "h2",
      );
      p(
        "Cold plunging on its own is a real, complete use case, but the more common reason people buy one is contrast therapy — alternating a hot sauna session with a cold plunge, which is why this product tends to sell alongside our infrared saunas rather than in isolation. If that's the plan, sizing the sauna and the plunge together, and checking both fit the same space, is worth doing before buying either separately.",
      );
      p(
        "This site's cold plunge size calculator handles the plunge's own fit and water volume; the protocol builder above handles how long and how cold once both pieces are in place.",
      );
      p("Our range", "h2");
      p(
        "One cold plunge, shown with two of our infrared saunas it's commonly paired with for contrast therapy.",
      );
      b.push(
        table(
          "b",
          n,
          "Our cold plunge, and a sauna pairing",
          ["Product", "Role", "Price"],
          [
            [
              "Peak Plunge Ice Bath with Chiller",
              "Cold plunge — our only SKU",
              "£4,725",
            ],
            [
              "Yorkshire Cabin 2-Person Outdoor Infrared",
              "Sauna — contrast-therapy pairing",
              "£3,263",
            ],
            [
              "Dales Glow 2-Person Indoor Infrared",
              "Sauna — contrast-therapy pairing",
              "£2,813",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "We sell one cold plunge, and it's chiller-equipped rather than ice-based — worth a plain statement rather than a false comparison. A chiller holds temperature consistently for regular use; ice is cheaper for a one-off. Most cold-plunge protocols run 10-15°C. It's most often bought alongside a sauna for contrast therapy, not on its own.",
      );
      return b;
    })(),
    faqs: [
      [
        "Does Kaiku sell a cold plunge without a chiller?",
        "No — we sell one cold plunge, and it comes with a chiller built in. There isn't an ice-only alternative in our current range.",
      ],
      [
        "Is a cold plunge chiller worth the extra cost over ice?",
        "For regular use, generally yes — a chiller holds a set temperature automatically with no per-session effort, where ice needs buying or making fresh each time and the water's temperature drifts as it melts. For occasional use, ice is the cheaper way to try cold plunging first.",
      ],
      [
        "What temperature should a cold plunge be?",
        "Most protocols use 10-15°C. Genuinely ice-cold water, closer to 0-4°C, is generally reserved for shorter sessions and more experienced use rather than a standard starting point.",
      ],
      [
        "Do you need a sauna to use a cold plunge?",
        "No, cold plunging works as a standalone practice. It's commonly bought alongside a sauna for contrast therapy — alternating hot and cold — which is why the two are often sized and purchased together, but a cold plunge doesn't require one.",
      ],
      [
        "How cold should contrast therapy be on the cold side?",
        "Similar to standalone cold plunging, typically 10-15°C, paired with a hot sauna session well above it. The exact split depends on experience level and session length — the protocol builder above works out a full routine around both.",
      ],
    ],
  },
  {
    id: "guide-planter-winter-material",
    title: "Which planter material actually survives a British winter outside?",
    slug: "best-planter-material-for-winter",
    excerpt:
      "Terracotta and unglazed ceramic absorb water and crack when it freezes inside them — the classic winter casualty. Stoneware and stone-effect resist it better; metal and synthetic rattan don't crack at all, though metal gets cold enough to chill roots. What to leave out all winter, and what to bring in.",
    categoryId: "category-planters",
    relatedProductIds: PLANTER_PRODUCT_IDS,
    seo: {
      title: "Best Planter Material for Winter (UK) | Kaiku",
      description:
        "Terracotta absorbs water and cracks when it freezes — the classic winter casualty. Stoneware, stone-effect, metal and synthetic rattan cope better. What to leave out, what to bring in.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "Terracotta and other unglazed ceramic are the classic winter casualty: the material is porous, it absorbs water from wet soil and rain, and when that trapped water freezes it expands and cracks the pot from the inside — often in a spot you don't notice until spring. Stoneware and glazed ceramic resist this better since less water gets in to begin with, but neither is completely immune if water pools at the base and freezes there. Metal and synthetic rattan don't crack from ice at all, which is the real reason they dominate planters marketed for year-round outdoor use.",
      );
      p(
        "What follows is which of our own materials need bringing in or wrapping for winter, and which can stay out without a second thought.",
      );
      b.push(
        table(
          "b",
          n,
          "Planter material and winter risk",
          ["Material", "Winter risk", "What to do"],
          [
            [
              "Terracotta / unglazed ceramic",
              "High — cracks as trapped water freezes",
              "Bring in, or wrap and raise off the ground",
            ],
            [
              "Stoneware / glazed ceramic",
              "Moderate — less porous, still at risk if water pools",
              "Raise on pot feet so water drains rather than pooling",
            ],
            [
              "Stone / stone-effect (resin)",
              "Low — dense and largely non-porous",
              "Fine outside; check the base still drains",
            ],
            [
              "Metal",
              "Low for cracking; conducts cold to roots",
              "Fine outside; insulate the root ball in hard frost",
            ],
            [
              "Synthetic rattan / wicker",
              "Low — doesn't absorb water",
              "Fine outside year-round",
            ],
            [
              "Untreated wood",
              "Moderate — rots rather than cracks",
              "Ensure drainage; a liner helps",
            ],
          ],
        ),
      );
      n += 1;
      b.push(
        tool(
          "b",
          n,
          "planter-size",
          "Check the volume before you buy or repot",
        ),
      );
      n += 1;
      p(
        "Rule one. It's the trapped water that breaks a pot, not the cold itself",
        "h2",
      );
      p(
        "Frost alone doesn't crack a planter — water absorbed into a porous material, then freezing and expanding inside it, does. This is why raising any porous pot on pot feet, so water drains away from the base rather than sitting and freezing there, meaningfully reduces the risk even for a material that can't be brought inside.",
      );
      p(
        "It's also why the same terracotta pot can survive several mild winters and then crack in one hard one — the risk scales with how wet the pot gets and how hard the frost is, not with age or a manufacturing flaw.",
      );
      p("Rule two. Metal survives the frost but chills the roots", "h2");
      p(
        "A metal planter won't crack from freezing water, but metal conducts cold efficiently, which can chill a plant's roots more than a material that insulates a little, like wood or thick stoneware. This matters more for a plant that's already borderline hardy for your area than for something reliably frost-tolerant regardless of pot material.",
      );
      p(
        "Wrapping the sides in hessian or bubble wrap through the coldest weeks addresses this without needing to move the planter at all — a practical middle ground between leaving it fully exposed and bringing it inside.",
      );
      p("Rule three. Synthetic rattan is the least fussy of the lot", "h2");
      p(
        "Woven synthetic rattan — as opposed to natural, untreated wicker — doesn't absorb water the way terracotta does and doesn't conduct cold the way metal does, which is why it copes with a UK winter with essentially no extra care. It's a reasonable default where winter hardiness matters more than the specific material's look.",
      );
      p("Our planters, by material", "h2");
      p("Sorted from the material needing the most winter care to the least.");
      b.push(
        table(
          "b",
          n,
          "Our planters, by material and winter care",
          ["Planter", "Material", "Winter care needed"],
          [
            [
              "Yuri Small Terracotta Gold Spotted",
              "Terracotta",
              "Bring in or wrap and raise off the ground",
            ],
            [
              "Yuri Large Terracotta Gold Spotted",
              "Terracotta",
              "Bring in or wrap and raise off the ground",
            ],
            [
              "Honna Small White Silver Ceramic",
              "Glazed ceramic",
              "Raise on pot feet",
            ],
            ["Kiso Black Large Stoneware", "Stoneware", "Raise on pot feet"],
            [
              "Arlo Large Engraved Wooden Planter",
              "Wood",
              "Ensure drainage; a liner helps",
            ],
            [
              "Eucalyptus Plant in Stone Effect Pot",
              "Stone-effect (resin)",
              "Fine outside year-round",
            ],
            [
              "Depok Small Rattan Planter with Metal Stand",
              "Synthetic rattan, metal stand",
              "Fine outside; check the stand for rust",
            ],
            [
              "Depok Large Rattan Planter with Metal Stand",
              "Synthetic rattan, metal stand",
              "Fine outside; check the stand for rust",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "It's trapped water freezing and expanding that cracks a pot, not cold on its own — terracotta and unglazed ceramic are most at risk, stoneware and glazed ceramic less so, and stone-effect, metal and synthetic rattan largely aren't. Raise porous pots on feet so water drains, wrap metal against root chill in hard frost, and terracotta is the one material genuinely worth bringing inside.",
      );
      return b;
    })(),
    faqs: [
      [
        "Can terracotta pots be left outside in winter?",
        "Not safely in a hard UK frost — terracotta absorbs water, and that water freezing and expanding inside the material is what cracks it. Bringing it in, or wrapping it and raising it on pot feet so water drains rather than pools, both reduce the risk significantly.",
      ],
      [
        "What planter material is best for a British winter?",
        "Synthetic rattan, metal and stone-effect resin all cope well — none absorb water the way terracotta does, so none crack from freezing. Metal conducts cold to the roots, which is worth insulating against in hard frost even though the pot itself is safe.",
      ],
      [
        "Do glazed ceramic pots crack in frost?",
        "Less often than unglazed terracotta, since the glaze reduces how much water the material absorbs, but it isn't fully immune — water pooling and freezing at an unglazed base or a chip in the glaze can still cause damage. Pot feet that let water drain away help either way.",
      ],
      [
        "Does a wooden planter need protecting in winter?",
        "The risk with wood is rot rather than cracking, since it doesn't freeze and expand the way ceramic does. Good drainage — and a liner, so the wood itself isn't sitting directly in wet soil — matters more than frost protection specifically.",
      ],
      [
        "Why do metal planters get so cold?",
        "Metal conducts heat and cold efficiently, so a metal planter's contents can get colder than the same plant would in an insulating material like wood or thick stoneware, even though the pot itself won't crack. Wrapping the sides in hard frost protects the roots without needing to move the planter.",
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
    "docs/change-log/2026-09-03-create-buying-guides-batch7.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
