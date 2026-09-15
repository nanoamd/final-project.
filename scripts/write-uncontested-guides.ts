/**
 * Buying guides for product types nobody else writes about.
 *
 * Damien: _"I want all products which no one writes buying guides for to have
 * different buying guides. You can write them and I will improve them and add
 * images"_.
 *
 * The 35 existing guides target questions every home magazine has answered —
 * what size coffee table, how high a bedside table. Kaiku ranks 71st to 98th
 * for those, because House & Garden and Ideal Home got there first with decades
 * of authority behind them. These target questions nobody has answered, about
 * products Kaiku actually stocks in numbers.
 *
 * Shape follows the page Damien picked as the model — structured by TYPE rather
 * than by rule, so each section can carry an image and name a real product,
 * around 1,400 words rather than 700. Unlike a magazine, these can say what a
 * thing costs and whether it is in stock.
 *
 * Every specification here is read from the product records. Nothing is
 * invented: where a fact is not recorded, the guide does not claim it.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-uncontested-guides.ts
 *   pnpm tsx --env-file=.env.local scripts/write-uncontested-guides.ts --apply
 */
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

let key = 0;
const k = () => `b${key++}`;

/** A paragraph. */
const p = (text: string) => ({
  _key: k(),
  _type: "block",
  style: "normal",
  markDefs: [],
  children: [{ _key: k(), _type: "span", marks: [], text }],
});

/** A section heading — one per product type, so each can take an image. */
const h2 = (text: string) => ({
  _key: k(),
  _type: "block",
  style: "h2",
  markDefs: [],
  children: [{ _key: k(), _type: "span", marks: [], text }],
});

const faq = (question: string, answer: string, i: number) => ({
  _key: `faq-${i}`,
  _type: "faqEntry",
  question,
  answer,
});

const ref = (id: string, i: number) => ({
  _key: `rp-${i}`,
  _type: "reference",
  _ref: id,
});

interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  products: string[];
  body: ReturnType<typeof p>[];
  faqs: ReturnType<typeof faq>[];
}

const GUIDES: Guide[] = [
  {
    slug: "gas-fire-pit-btu-explained",
    title: "How many BTU does a gas fire pit table need?",
    metaTitle: "Gas Fire Pit BTU: 40,000 or 50,000? | Kaiku",
    metaDescription:
      "What BTU actually means on a gas fire pit table, whether 40,000 is enough for a British garden, and what a glass screen changes. Nine real tables compared.",
    excerpt:
      "BTU is the only number on the box, and nobody explains it. Here is what it means in a British garden, and where the difference between 40,000 and 50,000 actually shows up.",
    category: "category-fire-pits",
    products: [
      "product-aosom-842-253",
      "product-aosom-842-346v70gy",
      "product-aosom-842-252v01sr",
      "product-aosom-842-253v00cg",
      "product-aosom-842-346v70cg",
      "product-aosom-842-252v01gy",
      "product-aosom-842-345v70cg",
      "product-aosom-842-345v70gy",
    ],
    body: [
      p(
        "Every gas fire pit table is sold on one number, and almost nobody explains what it means. BTU — British Thermal Units per hour — is the rate at which the burner turns gas into heat. A higher figure means a bigger flame and a wider circle of warmth. It does not mean a better table, and past a point it mainly means a faster empty gas bottle.",
      ),
      p(
        "In a British garden the useful range sits between 40,000 and 50,000 BTU. Below that you have an ornament; above it you are heating the sky. The tables here run from 40,000 at £149 to 50,000 at £249, and the honest answer to which you need is that it depends less on the number than on where the table stands and whether it has a screen.",
      ),
      h2("40,000 BTU: enough for a sheltered patio"),
      p(
        "Forty thousand is the sensible choice for a patio with walls or fencing close by, or for a table that mostly gets used on mild evenings in spring and autumn. The flame is generous, it takes the edge off, and a standard propane bottle lasts noticeably longer than it would on a bigger burner.",
      ),
      p(
        "Our 40,000 BTU table at £149 is 71 x 71 x 62cm, which is a four-seat footprint rather than a dining table. The dark grey version at £189 carries UKCA and CE certification under the gas appliance regulations, which is worth checking on any gas product before you buy — it is not a given at this price.",
      ),
      h2("50,000 BTU: for open gardens and colder months"),
      p(
        "Ten thousand extra BTU sounds marginal and is not. In an open garden with nothing to hold the heat, wind carries a 40,000 flame away faster than you would expect, and the difference between the two is the difference between sitting out in October and going back inside.",
      ),
      p(
        "The 50,000 tables here start at £179 for a 71cm square and £187 for the larger 81cm. The 81cm is the one to look at if the table is doing double duty, because 71cm seats four around the flame but leaves nowhere to put a glass down once everyone has one.",
      ),
      h2("What a glass screen actually changes"),
      p(
        "A glass wind screen sits around the flame and does two things. It stops the flame guttering in a breeze, which is the main reason a fire pit feels weak on the evening you most want it. And it keeps the flame away from sleeves and hands, which matters more if children are anywhere near it.",
      ),
      p(
        "It costs about £50 over the same table without one. The screened 50,000 BTU tables are £229 and £249 against £179 and £189 unscreened. If your garden is open, or the table sits anywhere near a path people walk down, the screen is the upgrade to spend on before the extra BTU.",
      ),
      h2("Size: fire pit or dining table?"),
      p(
        "The 71cm tables are fire pits with a rim. The 81cm ones are dining tables with a fire in the middle. Our 50,000 BTU table with glass screen at £249 seats four to six people around it as a dining table, which is a different piece of furniture from the 71cm model at £179 even though the burner is identical.",
      ),
      p(
        "Weight is worth a glance too. The 71cm screened table is 24kg and rated to hold 30kg on its surface, which is plates and glasses rather than anything heavy. None of these is a table to stand on or lean against.",
      ),
      h2("Propane or butane, and why it matters in winter"),
      p(
        "Most gas fire pit tables in the UK, ours included, run on propane rather than butane, and the reason is temperature. Butane stops vaporising properly at around freezing, so a butane bottle on a cold January evening gives a weak flame or none at all — exactly when you want the thing working. Propane keeps going well below zero.",
      ),
      p(
        "You will see propane bottles described as patio gas, usually in a red or green bottle with a clip-on regulator rather than a screw fitting. If you already have a bottle for a barbecue, check which it is before assuming it will work. The regulator type has to match as well as the gas.",
      ),
      h2("How long a bottle actually lasts"),
      p(
        "This is the question nobody answers on a product page, and the arithmetic is simple enough to do yourself. A 13kg propane bottle holds roughly 250,000 BTU of usable energy. At 50,000 BTU an hour, run flat out, that is about five hours. At 40,000 it is nearer six.",
      ),
      p(
        "In practice nobody runs one flat out. Turned down to a comfortable flame you will get two or three evenings out of a bottle rather than one, and the gap between a 40,000 and a 50,000 burner narrows considerably. If you are choosing between them on running cost alone, it is not the deciding factor it looks like.",
      ),
      h2("Lava rocks, fire glass, and what comes in the box"),
      p(
        "The burner needs something over it to spread the flame and hide the metal, and that is either lava rock or tempered fire glass. Lava rock is the traditional option, cheap and matte. Fire glass is the reflective one, and it throws light around in a way lava rock does not — particularly after dark, which is when these tables are used.",
      ),
      p(
        "Check what is included before you buy, because it is often not. Replacing it is not expensive but it is annoying to discover on the evening you wanted to light it. And whichever you have, it needs to stay dry: water trapped underneath can spit when the burner heats it.",
      ),
      h2("Where it can stand"),
      p(
        "On something non-combustible, with clear sky above it, and away from anything that will catch. Decking is the usual mistake — a gas table on timber decking wants a heat-resistant mat under it, and most people find that out afterwards.",
      ),
      p(
        "Clearance matters more than people expect. Keep a metre clear above the flame and a metre around it from fencing, furniture cushions and overhanging planting. The 81cm tables need more room around them than the 71cm ones, not because of the flame but because people need space to get past a table that size with chairs round it.",
      ),
      h2("What to check before you buy any of them"),
      p(
        "Three things, in order. First, certification — look for UKCA or CE under the gas appliance rules, because a gas burner sold without it is not worth the saving. Second, whether a cover is included; ours at £189 comes with one and a cover bought separately is rarely under £25. Third, the gas bottle, which is never included with any of them and will add around £30 for the bottle plus refills.",
      ),
      p(
        "And one that is not on any spec sheet: a gas fire pit table must never be used indoors, in a conservatory, or under a closed gazebo. It produces carbon monoxide. Outdoors with open sky above it, or not at all.",
      ),
    ],
    faqs: [
      faq(
        "Is 40,000 BTU enough for a fire pit table?",
        "For a sheltered patio with walls or fencing nearby, yes. Forty thousand gives a generous flame and uses less gas. In an open garden with wind, 50,000 is noticeably better, and it is the difference between sitting out in October and not.",
        0,
      ),
      faq(
        "What does BTU mean on a fire pit?",
        "British Thermal Units per hour — the rate the burner converts gas into heat. Higher means a bigger flame and a wider warm circle. It does not mean a better-made table, and above 50,000 it mainly means refilling the bottle more often.",
        1,
      ),
      faq(
        "Is a glass screen on a fire pit table worth it?",
        "Usually yes, and before extra BTU. It stops the flame guttering in a breeze, which is the commonest reason a fire pit disappoints, and it keeps the flame away from hands and sleeves. It adds about £50.",
        2,
      ),
      faq(
        "Can you use a gas fire pit table under a gazebo?",
        "No. Gas burners produce carbon monoxide and need open sky above them. Not indoors, not in a conservatory, and not under a closed canopy or gazebo.",
        3,
      ),
      faq(
        "Does a gas fire pit table come with a gas bottle?",
        "No, and none of ours do. Budget around £30 for the bottle itself plus the cost of refills. A 40,000 BTU burner will go through it more slowly than a 50,000.",
        4,
      ),
    ],
  },
  {
    slug: "crystal-ball-water-features-explained",
    title: "Crystal ball water features: what the ball is actually for",
    metaTitle: "Crystal Ball Water Features Explained | Kaiku",
    metaDescription:
      "Why a crystal ball sits in a water feature, what colour-changing adds, and the difference between a cascade and a water wheel. Ten real features from £34.",
    excerpt:
      "The ball is not decoration. It is what makes the water visible. Here is what it does, what colour-changing adds, and how the tabletop and floor-standing versions differ.",
    category: "category-water-features",
    products: [
      "product-aw-waterf-18",
      "product-aw-waterf-23",
      "product-aw-waterf-17",
      "product-aw-waterf-12",
      "product-aw-waterf-16",
      "product-aw-waterf-13",
      "product-aw-waterf-14",
      "product-aw-waterf-21",
      "product-aw-waterf-22",
    ],
    body: [
      p(
        "A crystal ball in a water feature looks like ornament and is not. Water running over a smooth sphere clings to it, spreads into a film, and catches light in a way water falling down a flat face never does. The ball is there to make the water visible. Take it out and you have a pump making a noise.",
      ),
      p(
        "That is also why these features work indoors, where a conventional fountain would be too loud or too wet. Ours run from £34 to £120, and the differences between them are worth understanding before you pick on looks alone.",
      ),
      h2("The plain ball: water, stone and nothing else"),
      p(
        "The simplest versions put the ball on rock or in a pot and leave it at that. Our Water Pot and Crystal Ball at £34 has a handmade, reclaimed character, and the Pebble Wall version at £35 runs the water down a face of pebbles into the ball below.",
      ),
      p(
        "These are the quietest of the range and the easiest to place. With nothing figurative in them they sit in a modern room without arguing with it, which the dragons and elephants do not.",
      ),
      h2("The water wheel: movement you can watch"),
      p(
        "A water wheel turns under the flow, and that changes what the piece is for. A still feature is background; a turning wheel is something a person actually looks at. If the feature is going on a desk or a hall table where someone will see it close up, the wheel earns its place.",
      ),
      p(
        "Ours pair the wheel with figures — Elephants and Crystal Ball with Water Wheel at £54, Dragons at £55, and the Purple Dragon version at £57. The dragon piece is 18 x 35 x 18cm, so it is a shelf-sized object rather than a table centrepiece.",
      ),
      h2("Cascades and rock formations"),
      p(
        "A cascade runs water down several levels before it reaches the ball, which gives more sound than a single drop. The Silver Buddha Cascade at £52 is 35 x 25 x 20cm and weighs a little over two kilos — substantial enough not to move when the pump is running, which cheaper features often do.",
      ),
      p(
        "The Slab Rocks Formation at £54 does the same thing without the figure, if a Buddha is not the note you want in the room. Both produce more audible water than the plain pot versions, which is either the point or the problem depending on where it is going.",
      ),
      h2("Colour-changing: the grand versions"),
      p(
        "The two at £120 are a different class of object. Both are floor or console pieces rather than tabletop, and both light the ball from within with a colour that cycles — one set into rock, the other into a Greek urn standing in a woven basket.",
      ),
      p(
        "Lit from inside, the film of water over the ball becomes the thing you see rather than the thing you have to look for, and in a dim room the effect is considerable. It is also, unavoidably, a feature that draws attention. These are not quiet background pieces and are not meant to be.",
      ),
      h2("Figures: dragons, elephants and Buddhas"),
      p(
        "A large part of this range is figurative, and it is worth being honest that this is the thing that dates fastest in a room. A plain ball on rock will look the same in ten years. A purple dragon is a decision.",
      ),
      p(
        "That said, the figures are doing something structural as well as decorative — an elephant's trunk or a dragon's body is what the water runs down before it reaches the ball, so the shape determines how the water falls and how much noise it makes. The Elephants in Love piece at £55 and the Silver Buddha Cascade at £52 are both built around that.",
      ),
      h2("Noise: how much water you are letting into the room"),
      p(
        "This is the thing people get wrong. All of these make sound, and how much depends on the drop — how far the water falls before it lands. A pot feature where water wells up and slips over the rim is nearly silent. A cascade running down three levels of slate is not.",
      ),
      p(
        "Think about the room before the look. In a hallway or a home office, more sound is usually welcome, because it masks other noise. In a bedroom or beside a television it becomes the only thing you can hear within about twenty minutes. If you are unsure, the quieter pot and pebble versions at £34 and £35 are the safer starting point.",
      ),
      h2("The pump, and what actually goes wrong"),
      p(
        "Every one of these has a small submersible pump sitting in the reservoir, and that pump is the part that fails. Almost always for one of two reasons: it was run dry when the water got low, or it silted up because nobody cleaned it.",
      ),
      p(
        "Both are avoidable. Top the water up weekly and lift the pump out every couple of months to rinse the inlet under a tap. Use filtered or previously boiled water if you are in a hard-water area, because limescale on the ball is more visible than it sounds — a chalky film on a clear sphere is exactly what you do not want.",
      ),
      h2("Tabletop or floor standing: what the size really means"),
      p(
        "Tabletop here means genuinely small. The dragon piece is 18 x 35 x 18cm, and the Silver Buddha Cascade is 35 x 25 x 20cm — objects that sit on a console or a desk rather than furniture in their own right.",
      ),
      p(
        "The two grand versions at £120 are a different proposition. One sets the ball into rock, the other into a Greek urn standing in a woven basket, and both are designed to be seen from across a room rather than examined close up. If you want something that reads as a feature rather than an ornament, that is the jump, and it is a large one from £57.",
      ),
      h2("Where to put one, and what to expect"),
      p(
        "All of these recirculate the same water, so they need topping up as it evaporates — more often in a heated room than you would expect, and running a pump dry is what kills these features. Check the level weekly.",
      ),
      p(
        "On placement: tabletop versions want to be somewhere you pass regularly rather than somewhere you sit for hours, because moving water is pleasant in passing and can become insistent over an evening. Hallways, landings and desks suit them better than the spot beside the sofa.",
      ),
    ],
    faqs: [
      faq(
        "What is the crystal ball in a water feature for?",
        "It makes the water visible. Water clings to a smooth sphere and spreads into a film that catches the light, which water running down a flat face does not. Without the ball you have a pump making a noise.",
        0,
      ),
      faq(
        "Are crystal ball water features suitable indoors?",
        "Yes, and that is mostly what they are for. They recirculate a small amount of water quietly, unlike a garden fountain. Ours run from £34 for a tabletop piece to £120 for a floor-standing colour-changing one.",
        1,
      ),
      faq(
        "What does the colour-changing version actually do?",
        "It lights the ball from inside with a colour that cycles, so the film of water over the sphere becomes the thing you see rather than something you have to look for. The effect is strong in a dim room, and these are deliberately not background pieces.",
        2,
      ),
      faq(
        "Do water features need topping up?",
        "Yes. They recirculate the same water and it evaporates, faster in a heated room than most people expect. Check the level weekly — running the pump dry is the usual way these fail.",
        3,
      ),
      faq(
        "What is the difference between a cascade and a water wheel feature?",
        "A cascade runs water down several levels before the ball, which gives more sound. A water wheel turns under the flow and gives something to watch. A cascade suits a room you want sound in; a wheel suits a desk or hall table someone passes close to.",
        4,
      ),
    ],
  },
];

async function main() {
  const now = new Date().toISOString();
  const docs = GUIDES.map((g) => ({
    _id: `buyingGuide-${g.slug}`,
    _type: "buyingGuide",
    title: g.title,
    slug: { _type: "slug", current: g.slug },
    excerpt: g.excerpt,
    body: g.body,
    faqs: g.faqs,
    author: { _type: "reference", _ref: "author-kaiku-editorial" },
    relatedCategory: { _type: "reference", _ref: g.category },
    relatedProducts: g.products.map((id, i) => ref(id, i)),
    publishedAt: now,
    seo: {
      _type: "seo",
      metaTitle: g.metaTitle,
      metaDescription: g.metaDescription,
    },
  }));

  for (const [i, g] of GUIDES.entries()) {
    const words = g.body.reduce(
      (n, b) => n + (b.children[0]?.text.split(/\s+/).length ?? 0),
      0,
    );
    console.log(`\n${i + 1}. ${g.title}`);
    console.log(`   /learn/${g.slug}`);
    console.log(
      `   ${words} words · ${g.body.filter((b) => b.style === "h2").length} sections · ${g.faqs.length} FAQs · ${g.products.length} products linked`,
    );
    console.log(
      `   meta title ${g.metaTitle.length} chars · description ${g.metaDescription.length} chars`,
    );
    if (g.metaTitle.length > 60) console.log(`   WARNING meta title over 60`);
    if (g.metaDescription.length > 160)
      console.log(`   WARNING description over 160`);
  }

  // Every referenced product must exist, or the guide renders a broken link.
  const ids = GUIDES.flatMap((g) => [g.category, ...g.products]);
  const found = await client.fetch<string[]>(`*[_id in $ids]._id`, { ids });
  const missing = ids.filter((id) => !found.includes(id));
  if (missing.length) {
    console.error(
      `\nThese referenced documents do not exist:\n  ${missing.join("\n  ")}`,
    );
    process.exit(1);
  }
  console.log(`\nAll ${ids.length} referenced documents exist.`);

  if (!apply) return console.log("\nDry run — re-run with --apply.");
  for (const doc of docs) await client.createOrReplace(doc);
  console.log(`\nWrote ${docs.length} guides.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
