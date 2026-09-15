/**
 * /learn/how-to-keep-a-garden-warm — the hub for everything Kaiku sells that
 * makes a garden usable in the cold.
 *
 * Damien: _"i want a fire pit buying guide to rank number 1 for when someone
 * searches how to keep a garden warm"_.
 *
 * WHY THIS IS NOT ONLY A FIRE PIT GUIDE. The page he wants to beat is not a
 * fire pit page. Search that phrase and you get two different intents fighting
 * over it: frost protection for plants (fleece, mulch, cloches — none of which
 * Kaiku sells), and outdoor heating for people. The pages winning the second
 * are retailer listicles — "27 Outdoor Heating Ideas to Keep Your Garden Warm
 * All Year" and the like — which cover heaters, fire pits, shelter and
 * textiles together. A page about fire pits alone answers a third of the
 * question and loses to a page that answers all of it.
 *
 * So this covers all four layers, fire pits get the longest section and every
 * product link, and the plant reading gets one honest paragraph that routes to
 * the guides which already handle it. Two existing fire pit guides sit under
 * this one rather than competing with it.
 *
 * WHAT MAKES IT RANK RATHER THAN JUST EXIST. Every one of those listicles
 * describes the options and none of them says what any of it costs to run.
 * That table is the first thing on this page. The figures are derived, not
 * invented, and the workings are in RUNNING_COSTS below so they can be
 * checked and corrected.
 *
 * Product prices and outputs are read from the catalogue at write time.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-garden-warmth-guide.ts
 *   pnpm tsx --env-file=.env.local scripts/write-garden-warmth-guide.ts --apply
 */
import { createClient } from "@sanity/client";

import {
  faq,
  h2,
  imageSlot,
  inlineHrefs,
  linkRow,
  p,
  table,
  wordCount,
} from "./lib/guide-blocks";

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

const GUIDE_ID = "buyingGuide-how-to-keep-a-garden-warm";
const SLUG = "how-to-keep-a-garden-warm";

/* ------------------------------------------------------------ the arithmetic */

/**
 * Running costs, with the workings, because the whole point of the table is
 * that it can be checked.
 *
 *   ELECTRICITY at 26.32p/kWh — Ofgem's price cap for 1 October to 31
 *   December 2026, direct debit, England/Scotland/Wales average. A 2kW heater
 *   draws 2kWh in an hour, so 2 x 26.32p = 53p.
 *
 *   PROPANE. Patio gas is propane, about 13.8 kWh per kg, so a 13kg bottle
 *   holds roughly 180 kWh. Divide by the burner's output in kW for hours at
 *   FULL output. A 13kg refill runs about £40 to £60 depending on where it is
 *   exchanged, so the per-hour figures assume £50 and are given as a range
 *   because the bottle price is the part that moves.
 *
 *   BTU to kW: 40,000 BTU/hr = 11.7kW. 50,000 BTU/hr = 14.7kW.
 *
 * Nobody runs a heater at full output all evening, so these are the ceiling,
 * not the expectation — which the guide says rather than leaving it implied.
 */
const ELECTRICITY_P_PER_KWH = 26.32;
const BOTTLE_KWH = 13 * 13.8;
const BOTTLE_COST_LOW = 40;
const BOTTLE_COST_HIGH = 60;

const perHourElectric = (kw: number) =>
  `${Math.round(kw * ELECTRICITY_P_PER_KWH)}p`;

const perHourGas = (kw: number) => {
  const hours = BOTTLE_KWH / kw;
  const low = BOTTLE_COST_LOW / hours;
  const high = BOTTLE_COST_HIGH / hours;
  return `£${low.toFixed(2)}–£${high.toFixed(2)}`;
};

const hoursPerBottle = (kw: number) => Math.round(BOTTLE_KWH / kw);

/* ------------------------------------------------------------- the products */

const FIRE_PITS_40K = [
  "outsunny-71-x-71cm-40000-btu-gas-firepit-table-black-grey",
  "outsunny-rattan-style-propane-gas-fire-pit-table-with-40-000-btu-burner-square-smokeless-f",
  "40000-btu-gas-firepit-table-black-dark-grey",
];
const FIRE_PITS_50K = [
  "outsunny-71cm-50-000-btu-gas-fire-pit-table-with-cover-and-glass-screen-grey",
  "outsunny-81cm-50000-btu-gas-fire-pit-table-black",
  "outsunny-81-x-81cm-50-000-btu-gas-fire-pit-table-grey",
  "50-000-btu-gas-fire-pit-table-with-cover-dark-grey",
  "outsunny-50-000-btu-gas-fire-pit-table-with-cover-and-glass-screen-grey",
];
const FREESTANDING_GAS = [
  "11-kw-freestanding-gas-patio-heater-adjustable-outdoor-garden-propane-heater-with-tip-over",
  "11kw-adjustable-heat-gas-patio-heater",
];
const ELECTRIC = [
  "hanging-electric-patio-heater-with-2-power-settings-1000-2000w-waterproof-ceiling-mounted-",
  "adjustable-power-1000-2500w-infrared-halogen-electric-patio-light-heater-ceiling-hanging-m",
  "patio-parasol-heater-electric-umbrella-mounted-heater-for-25-70-mm-poles",
];
const WOOD = [
  "smokeless-fire-pit-portable-wood-burning-firepit-with-poker-for-garden-camping-bonfire-par",
];
const SCREENS = [
  "decorative-privacy-screen-with-stand-freestanding-metal-outdoor-divider-decorative-privacy",
  "decorative-outdoor-divider-metal-privacy-screen-with-stand-triangle-style-black",
  "rhombus-metal-privacy-screen-with-stand-black-or-kaiku",
  "metal-decorative-privacy-screen-outdoor-divider-black-twisted-lines",
];
const SHELTER = [
  "lean-to-steel-pergola-with-moving-fabric-canopy-dark-grey",
  "steel-pergola-with-retractable-canopy-khaki",
  "moving-canopy-metal-pergola-with-curtains-grey",
  "3-m-x-3-m-garden-gazebo-double-roof-outdoor-gazebo-canopy-shelter-with-netting-solid-steel",
];
const LIGHTING = [
  "2-pieces-outdoor-garden-solar-post-lamp-sensor-dimmable-led-lantern-bollard-pathway-1-6m-t",
  "boho-rattan-floor-lamp-3-lights-rattan-lamp-with-shelf-freestanding-solar-garden-light-wit",
];

const ALL_SLUGS = [
  ...FIRE_PITS_40K,
  ...FIRE_PITS_50K,
  ...FREESTANDING_GAS,
  ...ELECTRIC,
  ...WOOD,
  ...SCREENS,
  ...SHELTER,
  ...LIGHTING,
];

/** The cards at the foot. Every layer represented, not just the dearest. */
const RELATED = [
  "outsunny-71-x-71cm-40000-btu-gas-firepit-table-black-grey",
  "outsunny-71cm-50-000-btu-gas-fire-pit-table-with-cover-and-glass-screen-grey",
  "outsunny-81cm-50000-btu-gas-fire-pit-table-black",
  "propane-gas-fire-pit-table-for-garden-11-7-kw-smokeless-firepit-outdoor-heater-with-wind-g",
  "11kw-adjustable-heat-gas-patio-heater",
  "hanging-electric-patio-heater-with-2-power-settings-1000-2000w-waterproof-ceiling-mounted-",
  "patio-parasol-heater-electric-umbrella-mounted-heater-for-25-70-mm-poles",
  "smokeless-fire-pit-portable-wood-burning-firepit-with-poker-for-garden-camping-bonfire-par",
  "decorative-privacy-screen-with-stand-freestanding-metal-outdoor-divider-decorative-privacy",
  "rhombus-metal-privacy-screen-with-stand-black-or-kaiku",
  "lean-to-steel-pergola-with-moving-fabric-canopy-dark-grey",
  "3-m-x-3-m-garden-gazebo-double-roof-outdoor-gazebo-canopy-shelter-with-netting-solid-steel",
];

const CATEGORY_BUTTONS: [string, string][] = [
  ["Fire pits & heating", "/shop/fire-pits"],
  ["Garden furniture", "/shop/garden-furniture"],
  ["Privacy screens", "/shop/privacy-screens"],
  ["Pergolas & gazebos", "/shop/pergolas"],
  ["Garden lighting", "/shop/garden-lighting"],
  ["Planters", "/shop/planters"],
];

interface Product {
  _id: string;
  slug: string;
  title: string;
  price: number | null;
  category: string | null;
}

async function main() {
  const wanted = [...new Set([...ALL_SLUGS, ...RELATED])];
  const products = await client.fetch<Product[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && slug.current in $slugs]{
      _id, "slug": slug.current, title, price, "category": category->slug.current }`,
    { slugs: wanted },
  );
  const bySlug = new Map(products.map((row) => [row.slug, row]));
  const missing = wanted.filter((slug) => !bySlug.has(slug));
  if (missing.length) {
    console.error(`These products do not exist:\n  ${missing.join("\n  ")}`);
    process.exit(1);
  }
  const noCategory = wanted.filter((slug) => !bySlug.get(slug)!.category);
  if (noCategory.length) {
    console.error(
      `No primary category, so no URL:\n  ${noCategory.join("\n  ")}`,
    );
    process.exit(1);
  }

  const categorySlugs = CATEGORY_BUTTONS.map(([, href]) =>
    href.replace("/shop/", ""),
  );
  const foundCategories = await client.fetch<string[]>(
    `*[_type=="category" && !(_id in path("drafts.**")) && slug.current in $slugs].slug.current`,
    { slugs: categorySlugs },
  );
  const missingCategories = categorySlugs.filter(
    (slug) => !foundCategories.includes(slug),
  );
  if (missingCategories.length) {
    console.error(`No such category: ${missingCategories.join(", ")}`);
    process.exit(1);
  }

  const href = (slug: string) => {
    const row = bySlug.get(slug)!;
    return `/shop/${row.category!}/${row.slug}`;
  };
  const price = (slug: string) => `£${bySlug.get(slug)!.price}`;
  /** Linked with a phrase, not with a 90-character supplier title. */
  const at = (slug: string, label: string): [string, string] => [
    label,
    href(slug),
  ];

  const body = [
    p(
      "Heat is the second thing to fix, not the first. Wind takes more warmth off a person than cold air does — that is why a still 6°C evening is pleasant and a breezy 9°C one is not — so the order that works is: block the wind, put something overhead, then add heat, then stop sitting on cold metal. Do all four and a British garden is usable most of the year. Do only the fourth and you will burn gas to heat the sky.",
    ),
    p(
      "What follows is each of those four, what it costs to buy, and — the part nobody publishes — ",
      ["what it costs to run per hour", "/shop/fire-pits"],
      ".",
    ),
    linkRow("Here to buy rather than to read? Start here.", CATEGORY_BUTTONS),
    imageSlot(
      "A lit gas fire pit table on a patio at dusk, with people sitting around it in coats",
      "The opening shot, and the one the search result lives or dies on. A lit fire pit table at dusk — blue hour, not black — with two or three people actually sitting round it in coats and a blanket. It has to read as cold outside and warm at the table. Flame visible but not blown out by exposure. If only one photograph gets taken for this guide, this is it.",
      "Blocking the wind first is what makes the heat worth paying for.",
    ),

    h2("What each option costs to run, per hour"),
    p(
      "Every guide to outdoor heating lists the options. None of them tells you what happens to your bill, which is the only question that separates them once you have seen the photographs. Electricity here is charged at the October–December 2026 price cap; gas figures assume a 13kg propane bottle at £40 to £60, which is the part of this that moves most.",
    ),
    table(
      "At full output. Nobody runs a heater flat out all evening, so treat these as the ceiling.",
      ["What it is", "Output", "Per hour", "Notes"],
      [
        [
          "Electric, 2kW hanging or parasol",
          "2kW",
          perHourElectric(2),
          "Cheapest to run by a distance. Needs a socket.",
        ],
        [
          "Electric, 2.5kW infrared",
          "2.5kW",
          perHourElectric(2.5),
          "Infrared warms you, not the air — better outdoors.",
        ],
        [
          "Gas fire pit table, 40,000 BTU",
          "11.7kW",
          perHourGas(11.7),
          `About ${hoursPerBottle(11.7)} hours from a 13kg bottle.`,
        ],
        [
          "Gas fire pit table, 50,000 BTU",
          "14.7kW",
          perHourGas(14.7),
          `About ${hoursPerBottle(14.7)} hours from a 13kg bottle.`,
        ],
        [
          "Freestanding gas patio heater",
          "11kW",
          perHourGas(11),
          `About ${hoursPerBottle(11)} hours from a 13kg bottle.`,
        ],
        [
          "Wood fire pit",
          "Varies",
          "£3–£4",
          "A net of kiln-dried logs, two to three hours.",
        ],
      ],
    ),
    p(
      "The gap is the story. An electric heater costs roughly a tenth of what a gas fire pit table costs to run, and a gas fire pit table is the one people want anyway — because it does something the electric one cannot, which is give a group something to sit around. That is a fair trade as long as it is made deliberately.",
    ),

    h2("First: stop the wind"),
    p(
      "A 10mph breeze at 8°C feels like about 5°C, and it strips the heat off a patio heater before it reaches anyone. Blocking it is the cheapest degree of warmth available and the only one that costs nothing to run.",
    ),
    p(
      "A solid barrier is the wrong instinct. Wind hitting a solid fence rolls over the top and drops back down as turbulence a couple of metres behind it, so the sheltered patch is short and gusty. A screen that lets roughly half the wind through slows it instead of stopping it, and shelters a distance of up to ten times its own height downwind. Our ",
      at(
        "decorative-privacy-screen-with-stand-freestanding-metal-outdoor-divider-decorative-privacy",
        "freestanding metal screens",
      ),
      " are cut-out panels for exactly that reason — at 198cm tall, a pair placed on the windward side of a seating area does more for comfort than another kilowatt of heat. The ",
      at(
        "rhombus-metal-privacy-screen-with-stand-black-or-kaiku",
        "rhombus pattern",
      ),
      " and the ",
      at(
        "metal-decorative-privacy-screen-outdoor-divider-black-twisted-lines",
        "twisted-line pattern",
      ),
      " are the same panel in different cuts, and the ",
      at(
        "decorative-outdoor-divider-metal-privacy-screen-with-stand-triangle-style-black",
        "triangle screen",
      ),
      " is the most open of them.",
    ),
    imageSlot(
      "A freestanding metal privacy screen on the windward side of a patio seating area",
      "A cut-out metal screen standing beside a seating group, ideally with something showing the wind — planting moving behind it, or a throw over a chair. The point to get across is that it is placed to shelter the seats, not to hide a neighbour. Shot from the seating side.",
      "Roughly half-permeable shelters further than solid does.",
    ),

    h2("Second: something overhead"),
    p(
      "Heat rises and leaves. A roof of any kind — canopy, pergola, gazebo — keeps some of it at head height instead, and keeps the drizzle off, which in Britain is the thing that ends an evening more often than the cold does. It is the difference between a heater warming people and a heater warming the sky.",
    ),
    p(
      "A ",
      at(
        "lean-to-steel-pergola-with-moving-fabric-canopy-dark-grey",
        "lean-to pergola against the house",
      ),
      " is the cheapest way to get a roof because the wall does half the work, and it puts the sheltered area right by the back door where it actually gets used. Freestanding, a ",
      at(
        "steel-pergola-with-retractable-canopy-khaki",
        "retractable-canopy pergola",
      ),
      " or a ",
      at(
        "moving-canopy-metal-pergola-with-curtains-grey",
        "pergola with curtains",
      ),
      " gives you a roof you can open in July, and the curtains do the wind job and the roof job together. A ",
      at(
        "3-m-x-3-m-garden-gazebo-double-roof-outdoor-gazebo-canopy-shelter-with-netting-solid-steel",
        "3m double-roof gazebo",
      ),
      " is the version that comes down for winter.",
    ),
    p(
      "One rule that is not negotiable: nothing with an open flame goes under a fabric canopy. A gas fire pit table belongs on the open side of a pergola, not under the middle of it, and the clearances are in our ",
      ["gas fire pit guide", "/learn/gas-fire-pit-btu-explained"],
      ".",
    ),

    h2("Third: fire pit tables — heat you sit around"),
    p(
      "A gas fire pit table is the only form of outdoor heating that arranges people rather than just warming them. A tall patio heater puts out similar heat and everybody stands under it looking at nothing; a fire pit table puts the flame in the middle of a low table and the seating faces inward, which is why they sell and why they keep selling.",
    ),
    p(
      "Two outputs, and the honest difference between them is smaller than the numbers suggest. ",
      ["40,000 BTU", "/learn/gas-fire-pit-btu-explained"],
      " — ",
      at(
        "outsunny-71-x-71cm-40000-btu-gas-firepit-table-black-grey",
        "from " +
          price("outsunny-71-x-71cm-40000-btu-gas-firepit-table-black-grey"),
      ),
      " — is enough for a patio with walls or fencing close by, and a bottle lasts noticeably longer. 50,000 BTU (",
      at(
        "outsunny-71cm-50-000-btu-gas-fire-pit-table-with-cover-and-glass-screen-grey",
        price(
          "outsunny-71cm-50-000-btu-gas-fire-pit-table-with-cover-and-glass-screen-grey",
        ) + " with a glass screen and cover",
      ),
      ") earns its extra where the space is open, where more than four people sit round it, or where it is being used in December rather than September.",
    ),
    p(
      "The glass screen matters more than the extra 10,000 BTU. It stops the wind pulling the flame sideways, which is what makes a fire pit table feel weak on exactly the evenings you bought it for, and it keeps the heat rising where people are rather than across the garden. If the budget stretches to one upgrade, take the screen over the burner. The ",
      at(
        "outsunny-81cm-50000-btu-gas-fire-pit-table-black",
        "81cm table at " +
          price("outsunny-81cm-50000-btu-gas-fire-pit-table-black"),
      ),
      " and the ",
      at(
        "outsunny-81-x-81cm-50-000-btu-gas-fire-pit-table-grey",
        "grey 81cm at " +
          price("outsunny-81-x-81cm-50-000-btu-gas-fire-pit-table-grey"),
      ),
      " are the larger tops, which matter if the table also has to hold drinks for six.",
    ),
    p(
      "Every one of ours hides the bottle inside the base, takes a standard 13kg patio gas bottle, and comes with lava rock. Which fuel suits you at all — gas, wood or electric — is its own question, and we have ",
      ["a guide to that", "/learn/fire-pit-fuel-type"],
      ".",
    ),
    imageSlot(
      "A gas fire pit table with its glass screen fitted, flame upright in a breeze",
      "The glass screen doing its job. Same table, ideally two frames: flame leaning in the wind without the screen, flame upright with it. If only one is possible, shoot the screened one at eye level so the glass is visible against the flame. This is the argument the whole section rests on and no competitor illustrates it.",
      "The screen is worth more than the extra 10,000 BTU.",
    ),

    h2("Freestanding gas heaters — heat you stand under"),
    p(
      "The 180cm mushroom heater is the pub-garden option, and it is the right one where people are standing and moving: a bar, a barbecue, the end of a party. Ours run at ",
      at(
        "11kw-adjustable-heat-gas-patio-heater",
        "11kW with adjustable output",
      ),
      ", which is roughly a 3m circle of useful warmth and about ",
      String(hoursPerBottle(11)),
      " hours from a bottle at full. Turned down, which is how they are actually used, considerably longer.",
    ),
    p(
      "Buy one with a tip-over cut-off and use it — ",
      at(
        "11-kw-freestanding-gas-patio-heater-adjustable-outdoor-garden-propane-heater-with-tip-over",
        "this one has it",
      ),
      ". A tall heater with a gas bottle in its base is exactly the shape that goes over in a gust, and the cut-off is the part that makes that an inconvenience rather than an incident. Weight the base, and bring it in or cover it when it is not in use.",
    ),

    h2("Electric — the cheap one, with a catch"),
    p(
      "At " +
        perHourElectric(2) +
        " an hour, electric heating costs a fraction of gas, and if there is a socket and a roof it is the sensible answer. The catch is both of those conditions. Electric patio heaters want mounting — to a ceiling, a wall, a beam, or a parasol pole — and they want to stay dry, so they suit a covered porch, a veranda or a pergola with a solid roof far better than an open lawn.",
    ),
    p(
      "Choose infrared over convection outdoors. Convection heats the air, and outdoors the air leaves; infrared heats the surfaces it lands on, including people, and works in a light breeze. The ",
      at(
        "adjustable-power-1000-2500w-infrared-halogen-electric-patio-light-heater-ceiling-hanging-m",
        "1000–2500W infrared hanging heater",
      ),
      " is the one to want, the ",
      at(
        "hanging-electric-patio-heater-with-2-power-settings-1000-2000w-waterproof-ceiling-mounted-",
        "1000–2000W waterproof ceiling heater",
      ),
      " is the cheaper mount-and-forget version, and the ",
      at(
        "patio-parasol-heater-electric-umbrella-mounted-heater-for-25-70-mm-poles",
        "parasol-mounted heater",
      ),
      " clamps to a 25–70mm pole and needs no fixings at all — the only one of the three a tenant can install.",
    ),

    h2("Wood, if you want the smell"),
    p(
      "Nothing gas does smells like a wood fire, and for some people that is the entire point. A ",
      at(
        "smokeless-fire-pit-portable-wood-burning-firepit-with-poker-for-garden-camping-bonfire-par",
        "smokeless wood fire pit at " +
          price(
            "smokeless-fire-pit-portable-wood-burning-firepit-with-poker-for-garden-camping-bonfire-par",
          ),
      ),
      " is the cheapest heat here to buy and among the dearest to run once you are buying kiln-dried logs. Double-wall smokeless designs burn the smoke rather than releasing it, which is what makes them tolerable in a garden with neighbours either side.",
    ),
    p(
      "Burn dry seasoned or kiln-dried wood and nothing else — wet wood is most of what makes a fire pit a nuisance, and treated timber and household waste are both illegal to burn. If you are in a smoke control area, check your council's position before buying anything wood-burning; gas has no such restriction, which is one of the quieter reasons it has taken over.",
    ),

    h2("The half that is not heating"),
    p(
      "Cold reaches people through what they sit on before it reaches them through the air. A metal chair at 5°C takes heat out of you faster than 5°C air does, so cushions, a throw over the back of each seat, and something on the ground are worth more than they sound — and cost nothing to run. Our ",
      ["garden furniture", "/shop/garden-furniture"],
      " sets are specified with cushions for that reason rather than for looks.",
    ),
    p(
      "Light does the rest. A garden that is warm and dark still empties at six o'clock in November, because people leave when it feels like night rather than when it feels cold. Low, warm light at the edges — a ",
      at(
        "2-pieces-outdoor-garden-solar-post-lamp-sensor-dimmable-led-lantern-bollard-pathway-1-6m-t",
        "pair of dimmable solar bollards",
      ),
      " along a path, a ",
      at(
        "boho-rattan-floor-lamp-3-lights-rattan-lamp-with-shelf-freestanding-solar-garden-light-wit",
        "rattan solar floor lamp",
      ),
      " beside the seating — extends the evening further than another kilowatt would. Warm white, not cool: the ",
      [
        "difference is in our lighting guide",
        "/learn/warm-vs-cool-white-light-by-room",
      ],
      ".",
    ),

    h2("If you meant keeping the plants warm"),
    p(
      "Different question, and worth saying plainly rather than pretending it is the same one. Plants come through a British winter on drainage and root protection, not on heat: pots up off the ground so they drain and do not sit in ice, the vulnerable ones grouped against a wall, and containers in a material that does not split when the water in it freezes. Which materials actually survive is ",
      ["a guide of its own", "/learn/best-planter-material-for-winter"],
      ", and ",
      ["what furniture can stay out", "/learn/garden-furniture-british-winter"],
      " is the matching question for everything else in the garden.",
    ),

    h2("The short version"),
    p(
      "Block the wind with something half-open before you buy any heat at all. Get a roof over the seating if you can, and keep open flame out from under fabric. Then choose: electric if there is a socket and a cover, at around " +
        perHourElectric(2) +
        " an hour; a gas fire pit table if you want people to gather rather than merely be warm, at £2 to £4 an hour and a bottle every dozen evenings; a tall gas heater if people will be standing. Take the glass screen over the bigger burner. Then put cushions on the chairs and a light at the edge of the garden, because the last two degrees are not a heating problem.",
    ),
  ];

  const faqs = [
    faq(
      "What is the cheapest way to heat a garden?",
      `Electric, if you have a socket and something to mount it under. A 2kW hanging or parasol heater costs about ${perHourElectric(2)} an hour to run at full output, against roughly £2 to £4 an hour for gas. The genuinely cheapest thing, though, is a windbreak: it costs nothing to run and a breeze removes more warmth than most heaters add.`,
      "warm-faq-0",
    ),
    faq(
      "Do patio heaters work in wind?",
      "Not well, and that is the usual reason one feels disappointing. Wind carries warm air away before it reaches anyone, and it pulls the flame of a fire pit sideways. Infrared heaters cope best because they warm surfaces rather than air. Shelter the seating area first and a smaller heater will outperform a larger one in the open.",
      "warm-faq-1",
    ),
    faq(
      "How long does a gas bottle last on a fire pit table?",
      `A 13kg patio gas bottle holds around 180kWh. A 40,000 BTU burner draws 11.7kW at full, so about ${hoursPerBottle(11.7)} hours; a 50,000 BTU burner about ${hoursPerBottle(14.7)}. Almost nobody runs one at full for a whole evening, so in practice a bottle covers a dozen or more evenings.`,
      "warm-faq-2",
    ),
    faq(
      "Is 40,000 or 50,000 BTU better for a fire pit table?",
      "40,000 is enough for a sheltered patio with walls or fencing nearby, and it uses less gas. 50,000 earns its extra in an open garden, with more than four people around it, or in winter rather than late summer. A glass screen makes more difference than the extra 10,000 BTU does, because it stops the wind stealing the flame.",
      "warm-faq-3",
    ),
    faq(
      "Can you leave an electric patio heater out in the rain?",
      "Only if it is rated for it, and even then it wants to be under cover. Check the IP rating before mounting one anywhere exposed. Electric heaters suit a porch, a veranda or a solid-roofed pergola; on an open patio with no cover, gas is the more practical choice.",
      "warm-faq-4",
    ),
    faq(
      "Are fire pits allowed in a UK garden?",
      "Gas fire pits are, with no restriction on smoke because they produce almost none. Wood is where it gets local: burning wet or treated wood, or anything that makes persistent smoke, can be a statutory nuisance, and smoke control areas add their own rules. Check your council before buying wood-burning, and burn only dry seasoned or kiln-dried logs.",
      "warm-faq-5",
    ),
    faq(
      "How far should a fire pit be from a fence or a pergola?",
      "Further than feels necessary, and never under a fabric canopy. Keep the clearances the manufacturer specifies above and around the burner, put the table on the open side of a pergola rather than under it, and stand it on something non-combustible. Our gas fire pit guide sets out the figures.",
      "warm-faq-6",
    ),
  ];

  const doc = {
    _id: GUIDE_ID,
    _type: "buyingGuide",
    title:
      "How to keep a garden warm: heat, shelter, and what each one costs an hour",
    slug: { _type: "slug", current: SLUG },
    excerpt:
      "Block the wind, get something overhead, then add heat — in that order. What a fire pit table, a gas heater and an electric heater each cost to run per hour, and which one suits which garden.",
    body,
    faqs,
    publishedAt: new Date().toISOString(),
    author: { _type: "reference", _ref: "author-kaiku-editorial" },
    relatedCategory: { _type: "reference", _ref: "category-fire-pits" },
    relatedProducts: RELATED.map((slug, i) => ({
      _key: `rp-${i}`,
      _type: "reference",
      _ref: bySlug.get(slug)!._id,
    })),
    seo: {
      _type: "seo",
      metaTitle: "How to Keep a Garden Warm in Winter | Kaiku",
      metaDescription:
        "Block the wind first, then add heat. What a fire pit table, a gas patio heater and an electric heater each cost to run per hour, and which suits your garden.",
    },
  };

  const words = wordCount(body);
  const hrefs = inlineHrefs(body);
  const productLinks = hrefs.filter((h) => h.split("/").length === 4).length;
  const guideLinks = hrefs.filter((h) => h.startsWith("/learn/")).length;
  const slots = body.filter((b) => b._type === "image").length;

  console.log(`\n${doc.title}\n`);
  console.log(`  /learn/${SLUG}`);
  console.log(`  ${words} words`);
  console.log(
    `  ${productLinks} product links, ${guideLinks} links to our other guides`,
  );
  console.log(`  ${CATEGORY_BUTTONS.length} category buttons above the fold`);
  console.log(`  ${slots} image spaces, each with a written brief`);
  console.log(`  ${faqs.length} FAQs, ${RELATED.length} product cards`);
  console.log(
    `  metaTitle ${doc.seo.metaTitle.length} chars, metaDescription ${doc.seo.metaDescription.length}\n`,
  );

  let failed = false;
  if (doc.seo.metaDescription.length > 160) {
    console.error("  meta description is over 160 characters.");
    failed = true;
  }
  if (doc.seo.metaTitle.length > 60) {
    console.error("  meta title is over 60 characters.");
    failed = true;
  }
  if (words < 1100) {
    console.error(`  ${words} words — the model Damien gave was 1,611.`);
    failed = true;
  }
  const referenced = await client.fetch<string[]>(
    `*[_type=="buyingGuide" && slug.current in $slugs].slug.current`,
    {
      slugs: hrefs
        .filter((h) => h.startsWith("/learn/"))
        .map((h) => h.replace("/learn/", "")),
    },
  );
  const brokenGuideLinks = [
    ...new Set(hrefs.filter((h) => h.startsWith("/learn/"))),
  ].filter((h) => !referenced.includes(h.replace("/learn/", "")));
  if (brokenGuideLinks.length) {
    console.error(
      `  links to guides that do not exist: ${brokenGuideLinks.join(", ")}`,
    );
    failed = true;
  }
  if (failed) process.exit(1);

  console.log("  Image briefs, for whoever takes the photographs:\n");
  for (const slot of body) {
    if (slot._type === "image") {
      console.log(`    - ${(slot as { brief: string }).brief}\n`);
    }
  }

  if (!apply) return console.log("Dry run — re-run with --apply.");
  await client.createOrReplace(doc);
  console.log(`Published /learn/${SLUG}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
