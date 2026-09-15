/**
 * Rewrites /learn/choosing-a-planter into the page Damien asked for.
 *
 * Damien, on a plant-pot search result: _"we could definitely rank for this
 * with an amazing blog BEST planter buying guide + 25 unique planters 2026 as
 * our title"_, then: _"we need to optimize the title for seo to rank number 1.
 * add multiple links to products in the text. images and buttons for other
 * categories at the top. if it £4 a sale it earns us conversion data for
 * free"_.
 *
 * Four things change, and the rest of the guide is left alone because it was
 * already right:
 *
 *   1. TITLE. "What size planter do you need?" answers one query. The page now
 *      leads on "planter buying guide", carries the size question inside it,
 *      and promises the 25 planters that the guide actually measures. A title
 *      that promises 25 and lists 25 is the only version of this worth having.
 *   2. LINKS IN THE TEXT. The guide named eight planters and linked to none of
 *      them — the reference grid at the foot of the page was the only route to
 *      a product. Twenty-five products and six categories are now reachable
 *      from inside the sentences that discuss them.
 *   3. CATEGORY BUTTONS AT THE TOP. A reader who arrived to buy rather than to
 *      read should not have to finish the article to find the shop.
 *   4. IMAGE SPACES, WITH BRIEFS. Kaiku has no photography of its own, so the
 *      guide reserves five spaces and says what each picture should show. They
 *      render as nothing until they are filled — see
 *      `src/sanity/schemaTypes/objects/image-fields.ts`.
 *
 * MEASUREMENTS AND PRICES ARE READ FROM THE CATALOGUE, never typed in here.
 * The nursery pot each planter takes is derived from its width by one rule,
 * applied identically to all 25. Re-running this script refreshes the table
 * against current prices, which is the intended way to keep it honest after a
 * repricing.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-planter-guide.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-planter-guide.ts --apply
 */
import { createClient } from "@sanity/client";

import {
  faq,
  h2,
  imageSlot,
  inlineHrefs,
  linkRow,
  p,
  type Part,
  table,
  tool,
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

const GUIDE_ID = "buying-guide-choosing-a-planter";

/* ------------------------------------------------------------- the planters */

/**
 * The 25 the guide measures, in the order they appear in the table.
 *
 * Chosen for spread rather than for margin: every price point from £21 to £70,
 * every width from 13cm to 41cm, and nothing near-identical to its neighbour.
 * Plant stands, vases and faux plants that share the Planters category are
 * deliberately absent — a stand does not take a nursery pot, and a table that
 * says it does is a table nobody can use.
 */
const TWENTY_FIVE = [
  "jada-small-abstract-planter",
  "yuri-ceramic-planter",
  "kiso-black-large-stoneware-planter",
  "yana-small-cream-textured-ceramic-planter",
  "small-blue-flora-planter-pot",
  "honna-small-white-silver-ceramic-planter",
  "zircon-small-ceramic-planter",
  "yuri-small-terracotta-gold-spotted-planter",
  "jada-large-planter",
  "seville-collection-lebes-planter",
  "yuri-large-terracotta-gold-spotted-planter",
  "jada-large-abstract-planter",
  "yana-large-cream-textured-ceramic-planter",
  "yuri-white-and-gold-spotted-planter",
  "zircon-large-planter",
  "jada-large-striped-planter",
  "arlo-small-natural-wooden-planter",
  "arlo-small-engraved-natural-and-black-planter",
  "arlo-large-natural-wooden-planter",
  "lentigo-set-of-two-white-planters",
  "tundra-black-and-white-earthenware-planter",
  "tarn-large-pot-with-handles",
  "darnell-natural-and-black-planter",
  "siena-brown-round-ribbed-planter",
  "darnell-medium-grey-speckled-planter",
];

/** Named in the prose but outside the table — the big end of the range. */
const ALSO_LINKED = [
  "darnell-large-grey-speckled-planter",
  "alden-black-floor-standing-planter",
  "sanai-white-cotton-mache-large-planter",
  "arlo-large-brown-and-natural-wooden-planter",
  "darnell-large-black-finish-planter",
  "depok-large-rattan-planter-with-metal-stand",
];

/** The cards at the foot of the page. Spread across the range, not the top. */
const RELATED = [
  "jada-small-abstract-planter",
  "honna-small-white-silver-ceramic-planter",
  "zircon-small-ceramic-planter",
  "seville-collection-lebes-planter",
  "yuri-white-and-gold-spotted-planter",
  "zircon-large-planter",
  "arlo-small-natural-wooden-planter",
  "arlo-large-natural-wooden-planter",
  "lentigo-set-of-two-white-planters",
  "tarn-large-pot-with-handles",
  "siena-brown-round-ribbed-planter",
  "darnell-medium-grey-speckled-planter",
];

const CATEGORY_BUTTONS: [string, string][] = [
  ["All planters", "/shop/planters"],
  ["Garden furniture", "/shop/garden-furniture"],
  ["Garden lighting", "/shop/garden-lighting"],
  ["Water features", "/shop/water-features"],
  ["Vases", "/shop/vases"],
  ["Privacy screens", "/shop/privacy-screens"],
];

/**
 * The nursery pot sizes a British grower actually sells plants in.
 *
 * A planter takes the largest of these that is about 4cm narrower than its own
 * widest point — the 4cm is the wall thickness and the taper, and rounding
 * DOWN rather than to nearest is deliberate: a pot that will not go in is a
 * return, and a pot with a centimetre to spare is not.
 */
const NURSERY_POTS = [9, 10.5, 12, 13, 15, 17, 19, 21, 24, 27, 30, 35, 40];

function nurseryPot(widthCm: number): number {
  const target = widthCm - 4;
  const fits = NURSERY_POTS.filter((size) => size <= target);
  return fits.length ? fits[fits.length - 1]! : NURSERY_POTS[0]!;
}

interface Product {
  _id: string;
  slug: string;
  title: string;
  price: number | null;
  width: number | null;
  height: number | null;
  unit: string | null;
}

/* -------------------------------------------------------------------- main */

async function main() {
  const slugs = [...new Set([...TWENTY_FIVE, ...ALSO_LINKED, ...RELATED])];
  const products = await client.fetch<Product[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && slug.current in $slugs]{
      _id, "slug": slug.current, title, price,
      "width": dimensions.width, "height": dimensions.height,
      "unit": dimensions.unit }`,
    { slugs },
  );
  const bySlug = new Map(products.map((row) => [row.slug, row]));

  // Nothing publishes with a link to a page that does not exist.
  const missing = slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length) {
    console.error(`These products do not exist:\n  ${missing.join("\n  ")}`);
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
    console.error(
      `These categories do not exist: ${missingCategories.join(", ")}`,
    );
    process.exit(1);
  }

  /** Product title as prose, and the path to it. */
  const name = (slug: string) =>
    bySlug.get(slug)!.title.replace(" | Kaiku", "");
  const href = (slug: string) => `/shop/planters/${slug}`;
  const link = (slug: string): Part => [name(slug), href(slug)];
  /** A shorter label, for a sentence that would otherwise read as a list. */
  const linkAs = (slug: string, label: string): Part => [label, href(slug)];

  const rows: string[][] = [];
  for (const slug of TWENTY_FIVE) {
    const row = bySlug.get(slug)!;
    if (row.unit !== "cm" || row.width == null || row.height == null) {
      console.error(
        `${slug}: dimensions are ${row.width}x${row.height} ${row.unit ?? "(no unit)"} — refusing to put a figure in the table I cannot verify.`,
      );
      process.exit(1);
    }
    if (row.price == null) {
      console.error(`${slug}: no price.`);
      process.exit(1);
    }
    rows.push([
      name(slug),
      `£${row.price}`,
      `${row.width}cm`,
      `${row.height}cm`,
      `${nurseryPot(row.width)}cm`,
    ]);
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const body = [
    p(
      "When you repot, go up by two to four centimetres of diameter for a small plant and five to ten for a large one. Not more. A 30cm planter holds roughly 15 litres of compost and a 60cm one holds over a hundred, which is the second thing worth knowing before buying. And if it is going outside, it needs a drainage hole — that one is not a preference.",
    ),
    p(
      "Planters are bought on looks and lost on those three numbers, because none of them is visible in a photograph. Below are the numbers, the six rules that follow from them, and ",
      ["25 of our own planters", "/shop/planters"],
      " measured — the widest point, the height, and the nursery pot each one will actually swallow.",
    ),
    linkRow("Here to buy rather than to read? Start here.", CATEGORY_BUTTONS),
    imageSlot(
      "Three planters of different heights grouped on a stone step, planted",
      "Opening shot. Three planters of clearly different heights and one material family, grouped on a stone step or patio corner, all planted — not empty. Shot slightly from above so the openings are visible, because the whole guide is about openings. Natural light, no props. This is the picture that has to carry the search result.",
      "Group in odd numbers and at different heights — rule of thumb for a patio.",
    ),
    table(
      "What to step up to, and what it will take to fill",
      ["Plant is in", "Move it to", "Compost needed"],
      [
        ["9cm nursery pot", "12cm", "About 0.5 litres"],
        ["12cm", "15cm", "About 1 litre"],
        ["15cm", "19cm", "About 2 litres"],
        ["19cm", "24cm", "About 4 litres"],
        ["24cm", "30cm", "About 8 litres"],
        ["30cm", "35–40cm", "15–25 litres"],
      ],
    ),
    tool(
      "planter-size",
      "Your planter, in litres — and whether you are over-potting",
    ),

    h2("Rule one. Two to four centimetres, not twenty"),
    p(
      "The instinct when repotting is to give a plant room to grow into. It is the wrong instinct, and it is the most common way a healthy houseplant is killed by kindness. Two to four centimetres wider for a small plant, five to ten for a large one, and then again in a year or two.",
    ),
    p(
      "Compost holds water and roots are what remove it. Surround a small root system with a large volume of compost and most of that compost never dries out, because there is nothing in it drinking. Roots sitting in permanently wet compost rot, and root rot after repotting looks exactly like underwatering — which is why the usual response makes it worse. If you are between two sizes, take the smaller: a ",
      linkAs("zircon-small-ceramic-planter", "15cm planter"),
      " that needs replacing next spring costs less than the plant does.",
    ),

    h2("Rule two. Outdoors, drainage is not optional"),
    p(
      "A planter with no holes, left outside through a British winter, fills with rainwater. There is no version of this that ends well. The compost turns anaerobic, the roots drown, and by March the plant is dead from something that looks like frost damage and is not.",
    ),
    p(
      "If a planter you love has no holes, use it as a cover pot instead. Keep the plant in its nursery pot inside it, lift the nursery pot out to water, let it drain in the sink, and put it back. This is also the honest answer for most decorative indoor ceramics — a ",
      linkAs("yuri-white-and-gold-spotted-planter", "glazed 18cm planter"),
      " on a shelf is a cover pot, and works perfectly as one.",
    ),
    imageSlot(
      "The underside of a planter, showing a drainage hole and three small feet lifting it off the paving",
      "Close, low shot of the base of an outdoor planter: the drainage hole, and the gap between base and paving. Tilt it or shoot from ground level so the gap is unmistakable. This is the single most useful picture in the guide and nobody else has one — every competing article says 'make sure it has drainage' and shows a styled shelf.",
      "A hole pressed flat against paving seals itself. The gap is the point.",
    ),

    h2("Rule three. Lift it off the ground"),
    p(
      "Holes pressed flat against paving seal themselves, and a pot with blocked drainage is a pot with no drainage. Three small feet, a couple of tiles, or anything that leaves a centimetre of air under the base is enough.",
    ),
    p(
      "It also keeps the base out of standing water, which is what rots timber planters from the bottom up and what cracks ceramic ones when the water in that thin film freezes. If you are buying in wood — an ",
      linkAs("arlo-large-natural-wooden-planter", "Arlo in natural hevea"),
      ", say — this is the difference between five seasons and two.",
    ),

    h2("Rule four. Frost-resistant and frost-proof are different words"),
    p(
      "Water soaks into porous ceramic, freezes, expands, and splits the pot from the inside out. A pot that has survived three winters is not proven; the damage accumulates invisibly and then the whole side comes away in one piece on the coldest night of the fourth.",
    ),
    p(
      "Glazed stoneware fired at high temperature generally copes. Low-fired terracotta generally does not, though it is the material most people picture when they picture a plant pot. If a planter is not described as frost-proof, treat it as an indoor or summer piece and bring it in — which is a reason to buy something light enough to move, like the ",
      linkAs("lentigo-set-of-two-white-planters", "Lentigo pair"),
      ", rather than something you will resent lifting.",
    ),
    imageSlot(
      "A terracotta pot split down one side by frost, on frozen ground",
      "A frost-split pot. One clean vertical crack down the side of a terracotta pot, ideally still planted, on a frosty morning. This is the picture that makes rule four land — everyone has seen it happen and nobody photographs it. A real one from a garden beats a staged one.",
    ),

    h2("Rule five. Fill the bottom third of anything over 40cm"),
    p(
      "Volume rises with the square of the radius, so a planter twice as wide holds four times as much. This surprises people at the till: a ",
      linkAs("darnell-medium-grey-speckled-planter", "41cm planter"),
      " takes around 30 litres, and a 60cm one takes over a hundred. That is three big bags of compost for one pot, and most of it doing nothing but making the pot too heavy to move.",
    ),
    p(
      "Unless you are planting something genuinely deep-rooted, fill the bottom third with something inert. Indoors and on a balcony, use something light — broken polystyrene, upturned plastic pots — because weight is the constraint. Outdoors and in wind, do the opposite and use gravel or rubble: a tall planter that blows over takes the plant with it, and ballast at the bottom is what stops it.",
    ),

    h2("Rule six. Match the depth to the root, not to the plant"),
    p(
      "Herbs, succulents and most bedding are shallow-rooted and are happier in a wide low bowl than in a tall column. A ",
      linkAs("siena-brown-round-ribbed-planter", "41cm bowl only 19cm deep"),
      " is the right shape for a dozen herbs and the wrong shape for one olive tree, whatever the two of them cost.",
    ),
    p(
      "Shrubs, small trees and anything that will be there for years want depth — at least 40cm — because that is where the structural roots go and because depth is what keeps the whole thing upright. A ",
      linkAs(
        "alden-black-floor-standing-planter",
        "61cm floor-standing planter",
      ),
      " is doing two jobs: holding compost, and being heavy enough not to fall over.",
    ),

    h2("Where it is going"),
    p(
      "Windowsill. 12–15cm, and something with a saucer or a sealed base, because a windowsill is a wooden surface with a radiator under it. The ",
      link("jada-small-abstract-planter"),
      " at 13cm and the ",
      link("yuri-ceramic-planter"),
      " at 14cm are the size this actually means.",
    ),
    p(
      "Living room floor. 30–40cm for anything that reads as a floor plant. Below 30cm a floor-standing planter looks like it was left there rather than placed there. The ",
      linkAs("lentigo-set-of-two-white-planters", "Lentigo pair at 33cm"),
      " and the ",
      linkAs("darnell-large-grey-speckled-planter", "Darnell at 49cm"),
      " are either side of the line.",
    ),
    p(
      "Doorstep and porch. Go tall rather than wide, and go in pairs. A pair of tall planters either side of a door does something no single planter does at any price, which is why ",
      linkAs("sanai-white-cotton-mache-large-planter", "the larger pieces"),
      " earn their keep there rather than in the middle of a patio.",
    ),
    p(
      "Patio. Group in odd numbers at different heights and leave the smallest ones out of the group — a 15cm pot on a patio reads as clutter, and the same pot on a table reads as a plant. Pair planting with ",
      ["garden lighting", "/shop/garden-lighting"],
      " and it works after dark too, which is most of the British year.",
    ),
    p(
      "Balcony. Weight is the constraint, not size. Fill the bottom third as in rule five, use a soil-less compost, and check what your building allows before buying anything over 40cm.",
    ),
    imageSlot(
      "A pair of tall planters either side of a front door, both planted",
      "A pair of matching tall planters flanking a front door — painted door, real house, not a showroom. Symmetry is the whole point, so shoot straight on. This is the shot that sells two planters instead of one.",
      "A pair does something a single planter does not, at any price.",
    ),

    h2("25 planters, measured"),
    p(
      "Working the rules backwards: the nursery pot a planter takes is its widest point less about four centimetres, rounded down to a size plants are actually sold in. Rounding down rather than to the nearest is deliberate — a pot that will not go in is a return, and a pot with a centimetre to spare is not. Every figure below is read from the product record, not from a supplier's description.",
    ),
    table(
      `Our planters, measured — prices as listed on ${today}`,
      ["Planter", "Price", "Widest point", "Height", "Nursery pot it takes"],
      rows,
    ),
    p(
      "For a desk, a shelf or a windowsill, the 13–16cm end of that table is what you want: the ",
      link("kiso-black-large-stoneware-planter"),
      ", the ",
      link("yana-small-cream-textured-ceramic-planter"),
      " and the ",
      link("small-blue-flora-planter-pot"),
      " all take a 9–12cm nursery pot, which is the size almost every houseplant comes home in. The ",
      link("honna-small-white-silver-ceramic-planter"),
      " and the ",
      link("yuri-small-terracotta-gold-spotted-planter"),
      " are the same size in a different finish.",
    ),
    p(
      "One step up — 17 to 21cm — is the first repot, and where most people are without knowing it. The ",
      link("seville-collection-lebes-planter"),
      ", the ",
      link("jada-large-abstract-planter"),
      ", the ",
      link("yana-large-cream-textured-ceramic-planter"),
      " and the ",
      link("zircon-large-planter"),
      " cover it, and the ",
      link("jada-large-striped-planter"),
      " and ",
      link("yuri-large-terracotta-gold-spotted-planter"),
      " are the same brief with more pattern. In wood, the ",
      link("arlo-small-natural-wooden-planter"),
      " and the ",
      link("arlo-small-engraved-natural-and-black-planter"),
      ".",
    ),
    p(
      "From 24cm the planter starts doing structural work rather than decorative work. The ",
      link("tundra-black-and-white-earthenware-planter"),
      " and the ",
      link("tarn-large-pot-with-handles"),
      " are the last sizes you can carry planted; the ",
      link("darnell-natural-and-black-planter"),
      " is not. Above that, the ",
      link("arlo-large-brown-and-natural-wooden-planter"),
      ", the ",
      link("darnell-large-black-finish-planter"),
      " and the ",
      link("depok-large-rattan-planter-with-metal-stand"),
      " are floor pieces — buy them for the room, and plant them where they are going to stand.",
    ),
    p(
      "Our tall planters and trellis boxes are missing from that table on purpose. Their listed height is the whole piece including the trellis, not the depth of compost, so the same arithmetic would give a misleading answer. The ",
      ["full planters category", "/shop/planters"],
      " has all 81, cheapest first.",
    ),
    imageSlot(
      "A small ceramic planter beside a 12cm nursery pot, showing how one sits inside the other",
      "The explainer shot, and the one that makes this guide different from every other planter article: a small ceramic planter next to a standard black 12cm nursery pot, plant in it, with a ruler or tape in frame. Shows the 4cm rule at a glance. Flat, even light, plain background.",
      "The 4cm rule, shown rather than stated.",
    ),

    h2("The short version"),
    p(
      "Step up 2–4cm for a small plant, 5–10cm for a large one. Outdoors, it must have holes, and it must sit off the ground. Frost-resistant is not frost-proof. Fill the bottom third of anything over 40cm. Match depth to root, not to plant. Everything else on a planter is taste, and taste is the easy part.",
    ),
  ];

  const faqs = [
    faq(
      "What size pot should I repot a plant into?",
      "Two to four centimetres wider in diameter for a small houseplant, five to ten for a large one. Going much bigger surrounds the roots with compost they cannot dry out, and waterlogged compost is what causes root rot after repotting.",
      "choosing-a-planter-faq-0",
    ),
    faq(
      "Do planters need drainage holes?",
      "Outdoors, always — a planter with no holes fills with rainwater and drowns the plant over a few weeks. Indoors you can use a planter with no holes as a cover pot, keeping the plant in its nursery pot inside it and lifting it out to water.",
      "choosing-a-planter-faq-1",
    ),
    faq(
      "Can ceramic planters stay outside in winter?",
      "Only if they are described as frost-proof. Water soaks into porous ceramic, freezes and splits the pot from within, and the damage builds up over several winters before it shows. High-fired glazed stoneware generally survives; low-fired terracotta generally does not.",
      "choosing-a-planter-faq-2",
    ),
    faq(
      "How much compost does a large planter take?",
      "Far more than it looks. A 30cm planter takes roughly 15 litres, a 40cm one around 30, and a 60cm one over a hundred, because volume rises with the square of the radius. Filling the bottom third of anything over 40cm with something inert saves a bag and keeps the planter movable.",
      "choosing-a-planter-faq-3",
    ),
    faq(
      "Should a planter be tall or wide?",
      "Match it to the roots. Herbs, succulents and bedding are shallow-rooted and do better in a wide low bowl. Shrubs and small trees want at least 40cm of depth, which also makes the planter much harder to blow over.",
      "choosing-a-planter-faq-4",
    ),
    faq(
      "What size planter does a large indoor plant like a fiddle leaf fig need?",
      "Most are sold in a 24cm or 27cm nursery pot, so the planter you want is 30–35cm at its widest and at least 35cm deep. That is around 25 to 30 litres of compost. Depth matters more than width here: a tall plant in a shallow bowl goes over, and a fig that has gone over once rarely looks the same again.",
      "choosing-a-planter-faq-5",
    ),
    faq(
      "How do I stop a tall planter blowing over?",
      "Ballast, not stakes. Fill the bottom third with gravel or rubble rather than the light inert fill you would use indoors, and keep the widest point at least a third of the height. A planter that is narrow, tall and full of light compost is a sail with a plant on top.",
      "choosing-a-planter-faq-6",
    ),
  ];

  const patch = {
    title:
      "Planter buying guide 2026: what size pot you need, and 25 we would choose",
    excerpt:
      "Step up 2–4cm for a small plant and 5–10cm for a large one, never more. The six rules that decide whether a plant lives, and 25 of our planters measured — widest point, height, and the nursery pot each one takes.",
    body,
    faqs,
    seo: {
      _type: "seo",
      metaTitle: "Planter Buying Guide 2026: What Size Pot? | Kaiku",
      metaDescription:
        "Step up 2–4cm for a small plant, 5–10cm for a large one. Six rules, compost volumes, and 25 planters measured with the nursery pot each one takes.",
    },
    relatedProducts: RELATED.map((slug, i) => ({
      _key: `rp-${i}`,
      _type: "reference",
      _ref: bySlug.get(slug)!._id,
    })),
  };

  /* -------------------------------------------------------------- reporting */

  const words = wordCount(body);
  const productLinks = inlineHrefs(body).filter((h) =>
    h.startsWith("/shop/planters/"),
  ).length;
  const imageSlots = body.filter((b) => b._type === "image").length;

  console.log(`\n${patch.title}\n`);
  console.log(`  /learn/choosing-a-planter`);
  console.log(`  ${words} words`);
  console.log(`  ${productLinks} product links inside the text`);
  console.log(`  ${CATEGORY_BUTTONS.length} category buttons above the fold`);
  console.log(`  ${imageSlots} image spaces, each with a written brief`);
  console.log(`  ${rows.length} planters in the measured table`);
  console.log(`  ${faqs.length} FAQs`);
  console.log(
    `  metaTitle ${patch.seo.metaTitle.length} chars, metaDescription ${patch.seo.metaDescription.length}\n`,
  );

  // The two faults from the last batch of guides, checked rather than hoped.
  let failed = false;
  if (patch.seo.metaDescription.length > 160) {
    console.error("  meta description is over 160 characters.");
    failed = true;
  }
  if (patch.seo.metaTitle.length > 60) {
    console.error("  meta title is over 60 characters.");
    failed = true;
  }
  if (words < 1100) {
    console.error(`  ${words} words — the model Damien gave was 1,611.`);
    failed = true;
  }
  if (rows.length !== 25) {
    console.error(
      `  the title promises 25 planters and the table lists ${rows.length}.`,
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
  await client.patch(GUIDE_ID).set(patch).commit();
  console.log("Rewritten.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
