/**
 * Writes buying guides for the categories that have none.
 *
 * `audit-internal-links.ts` reports that 262 of 335 products have no post or
 * buying guide pointing at them, and editorial links are the kind Google
 * weighs most heavily. Nine guides already exist and they cover furniture
 * sizing well; the biggest categories in the shop have nothing.
 *
 *   Garden Furniture  23 products   no guide
 *   Mirrors           20            no guide
 *   Wall Clocks       20            no guide
 *   Planters          18            no guide
 *   Vases             16            no guide
 *   Lighting          49            one guide, about table lamps
 *
 * Each guide answers a question people type, in the house voice, and links to
 * real live products in its category — so it passes equity into stock rather
 * than sitting as an orphan itself. `relatedProducts` is filled from the
 * catalogue at write time rather than hardcoded, so a guide never links to
 * something unpriced or unpublished.
 *
 * Bodies are written here rather than generated. Nothing about them is
 * templated: a guide about drainage holes has nothing structurally in common
 * with one about hanging heights, and that was the whole lesson of the
 * description work.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-buying-guides.ts
 *   pnpm tsx --env-file=.env.local scripts/write-buying-guides.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Section {
  heading?: string;
  paragraphs: string[];
}

interface GuideSpec {
  slug: string;
  title: string;
  excerpt: string;
  /** Category slug the guide belongs to and takes its products from. */
  categorySlug: string;
  /** How many live products to link. */
  productCount: number;
  sections: Section[];
}

const GUIDES: GuideSpec[] = [
  {
    slug: "garden-furniture-british-winter",
    title: "What garden furniture can actually stay out all winter?",
    excerpt:
      "Which outdoor materials survive a British winter uncovered, which need bringing in, and why a cover can do more harm than leaving furniture where it is.",
    categorySlug: "garden-furniture",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "Almost all garden furniture sold in the UK is described as weatherproof, and almost all of it is — for rain. A British winter is not really a rain problem. It is a freeze-thaw problem, a standing-damp problem and a wind problem, and materials that handle a wet July can still come apart by March.",
          "The useful question is not whether furniture is weatherproof but whether you are prepared to do anything to it. That answer decides the material, and it decides it more cleanly than price does.",
        ],
      },
      {
        heading: "The materials that need nothing",
        paragraphs: [
          "Dense tropical hardwoods — teak most commonly — contain enough natural oil to sit outside untreated for decades. Left alone, teak turns from honey to a soft silver-grey over about a year. That colour change is entirely a surface effect: the timber underneath is unchanged, and the strength is unaffected.",
          "Powder-coated aluminium is the other genuinely maintenance-free option. It cannot rust, because there is no iron in it to oxidise, and a chip in the coating exposes metal that simply does not care. It needs washing when it looks dirty and nothing else.",
          "Synthetic rattan is a wrapping rather than a material, so what matters is the frame underneath. Over aluminium it is a year-round proposition. Over steel it depends entirely on the coating, and a scratch that reaches the steel will rust outwards from that point under the weave, where you cannot see it until it is bad.",
        ],
      },
      {
        heading: "Where covers make things worse",
        paragraphs: [
          "A cover that is not breathable traps moisture against the furniture and holds it there. Under a fitted plastic cover, a teak set can develop mould on surfaces that would have stayed clean if left in the open air, because the timber never gets a chance to dry between wet spells.",
          "If you cover furniture, the cover needs to breathe and it needs to be lifted occasionally on a dry day. If that sounds like more attention than you will actually give it, leaving weatherproof furniture uncovered is the better decision — it is what the material is for.",
        ],
      },
      {
        heading: "What genuinely has to come in",
        paragraphs: [
          "Cushions, seat pads and parasols, without exception. It is the foam and the fabric that suffer, not the frame: foam holds water, and water in foam through a freeze does not recover. A storage box or a hallway is enough; they do not need to be indoors so much as out of the weather.",
          "Sling seats — the tensioned fabric on some aluminium chairs — are the exception people forget. The frame is fine outside and the sling is not, so those chairs are effectively a soft furnishing with legs.",
        ],
      },
      {
        heading: "Wind, which nobody plans for",
        paragraphs: [
          "Lightweight aluminium furniture is easy to move for mowing, which is the same property that makes it move on its own in a gale. On an exposed site — a roof terrace, a coastal garden, anywhere with a clear run at it — either choose heavier pieces or accept that some things need putting away when the forecast turns.",
          "A stacking set solves this better than a heavy set does, because the answer to wind is having somewhere for the furniture to be that is not the middle of the lawn.",
        ],
      },
      {
        heading: "The short version",
        paragraphs: [
          "Teak, powder-coated aluminium, and synthetic rattan on an aluminium frame all stay out all year with no work. Steel stays out but wants its chips touched up. Everything soft comes in. And if the spot is exposed, buy something that stacks.",
        ],
      },
    ],
  },
  {
    slug: "where-to-hang-a-wall-clock",
    title: "Where should a wall clock go, and what size?",
    excerpt:
      "The height a clock wants, the wall it belongs on, and how to size one so it reads as a design decision rather than a functional object.",
    categorySlug: "wall-clocks",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "A wall clock is one of the few decorative objects with a job, and that job pulls against the decorating. Hung where it looks best, it is often unreadable from where you actually want to read it. Hung where it reads best, it is often too low to look considered.",
          "The way out is to decide first which of the two the clock is for, because the answer changes everything else.",
        ],
      },
      {
        heading: "Height",
        paragraphs: [
          "A clock you want to read from across a room goes higher than a picture — centre somewhere between 150cm and 170cm from the floor. Above head height it stays out of the way of furniture and sightlines, and a clock face is legible at an angle in a way that artwork is not.",
          "A clock that is primarily decorative follows the gallery convention instead: centre at about 145cm, which is roughly eye level for an adult standing in front of it. That is the height that makes it read as part of a wall arrangement rather than as a fixture.",
          "In a kitchen, work from the units rather than the floor. A clock above a run of wall cabinets wants to sit in the space between the cabinet top and the ceiling, centred in that gap, or it looks like it landed there by accident.",
        ],
      },
      {
        heading: "Size, relative to what is beneath it",
        paragraphs: [
          "Over furniture, the same proportion that governs mirrors and pictures applies: aim for around two-thirds of the width of the furniture below. A 40cm clock over a 60cm console reads as deliberate; the same clock over a 180cm sideboard reads as lost.",
          "On a bare wall the constraint is the wall, not the furniture. A clock needs clear space around it of roughly half its own diameter on each side to read as placed rather than crammed, so measure the usable run of wall — between a door architrave and the end of a shelf, not corner to corner.",
        ],
      },
      {
        heading: "Which wall",
        paragraphs: [
          "A clock wants to be seen from where people sit or stand still, not from where they pass through. In a kitchen that is usually the wall facing the sink or the hob. In a living room it is the wall you look at from the sofa, which is often the same wall as the television and therefore already busy.",
          "It also wants to be off the main entry sightline. A clock directly opposite a door is the first thing anyone sees on entering a room, which is a lot of attention for an object whose purpose is to be glanced at.",
        ],
      },
      {
        heading: "Fixings, briefly",
        paragraphs: [
          "Most wall clocks weigh under 3kg and hang from a single point, so the fixing is not usually the challenge. The challenge is what is behind the plaster. Pipework and cabling run vertically above and below sockets and switches and horizontally near ceilings, which is precisely where a clock tends to go.",
          "On plasterboard, use a proper hollow-wall anchor rather than the plug that came in the box. On masonry, a plug and screw is fine. And check what is behind before you drill, rather than after.",
        ],
      },
    ],
  },
  {
    slug: "choosing-a-planter",
    title: "Choosing a planter: size, material and the drainage question",
    excerpt:
      "How big a pot a plant actually wants, why over-potting kills more plants than under-potting, and what frost does to ceramic.",
    categorySlug: "planters",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "Planters are bought on looks and lost on drainage. The two decisions that determine whether a plant lives — how much bigger the pot is than the root ball, and whether water can get out of it — are both invisible in a photograph.",
        ],
      },
      {
        heading: "Why a bigger pot is not a kinder pot",
        paragraphs: [
          "The instinct when repotting is to give a plant room to grow into. It is the wrong instinct. Compost holds water, and roots are what remove it. Surround a small root system with a large volume of compost and most of that compost has no roots in it, so it stays saturated for days after watering.",
          "Roots sitting in permanently wet compost rot, and root rot is the most common way a healthy plant dies after being repotted. The fix is to step up gradually: two to four centimetres of extra diameter for a small houseplant, five to ten for something larger, and do it again next year rather than trying to skip a stage.",
        ],
      },
      {
        heading: "Drainage is not optional outdoors",
        paragraphs: [
          "A planter without drainage holes, left outside through a British winter, fills with rainwater. There is no version of this that ends well. The plant drowns slowly over weeks, and because the top of the compost looks normal the cause is rarely obvious.",
          "Standing the planter on feet, or on a couple of tiles, is the other half of the same problem — holes pressed flat against paving seal themselves, and a pot with blocked drainage is a pot with no drainage.",
          "If you have a planter you love that has no holes, use it as a cover pot. Keep the plant in its nursery pot inside it, lift it out to water, and let it drain before it goes back. It is not a compromise; it is how most large indoor planting is actually done.",
        ],
      },
      {
        heading: "What frost does to ceramic",
        paragraphs: [
          "Frost-resistant and frost-proof are different claims and the distinction matters. Water soaks into porous ceramic, freezes, expands, and splits the pot from the inside out. A pot that has survived three winters can fail in the fourth, because the damage accumulates invisibly before it shows.",
          "Glazed stoneware fired at high temperature generally copes. Low-fired terracotta generally does not, though it is the most forgiving material to plant into because it breathes. If a product page does not say frost-proof, treat the pot as one that comes in for winter.",
        ],
      },
      {
        heading: "How much compost you will actually need",
        paragraphs: [
          "Far more than the pot looks like it holds. Volume rises with the square of the radius, so a planter twice as wide holds four times as much. A 30cm pot takes around 15 litres; a 60cm pot takes over a hundred.",
          "For anything large, fill the bottom third with something inert and light — broken polystyrene, upturned plastic pots — unless you are planting something genuinely deep-rooted. It saves a bag or two of compost and keeps the planter light enough to move, which you will want to do at least once.",
        ],
      },
    ],
  },
  {
    slug: "choosing-a-vase-for-what-you-put-in-it",
    title: "How to choose a vase for what you actually put in it",
    excerpt:
      "Neck width, height relative to the stems, and why the vase you own decides which flowers work rather than the other way round.",
    categorySlug: "vases",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "Most advice about vases is about the vase. In practice the vase decides what you can put in it, and the mismatch between the two is why a bunch of flowers that looked good in the shop collapses outwards on the table at home.",
          "Two measurements do almost all the work: the height, and the width of the neck.",
        ],
      },
      {
        heading: "Height, against the stems",
        paragraphs: [
          "The working rule florists use is that the vase should be roughly half to two-thirds the height of the arrangement. A 30cm vase suits stems standing 45 to 60cm — which, allowing for what sits below the waterline, means flowers bought at about 50 to 70cm.",
          "Go shorter than half and the arrangement looks top-heavy and tends to tip. Go taller than two-thirds and the flowers disappear into the vessel, which can be a deliberate effect with a few sculptural stems but rarely works with a mixed bunch.",
        ],
      },
      {
        heading: "The neck is the part that matters",
        paragraphs: [
          "A wide-mouthed vase lets stems fall outwards, so it needs enough of them to support each other — filling one properly takes more flowers than people expect, and half-filled it looks sparse rather than minimal.",
          "A narrow neck holds stems upright for you, which makes it far more forgiving. Three or five stems in a narrow-necked vase reads as considered; the same three in a wide bowl reads as leftovers. If you buy supermarket flowers rather than florist bunches, narrow necks will serve you better.",
          "For a single sculptural stem — an allium, a branch of blossom, a dried palm — the neck should be barely wider than the stem. Anything more and it leans.",
        ],
      },
      {
        heading: "Watertight, and what to do when it is not",
        paragraphs: [
          "Not every decorative vessel holds water. Unglazed ceramic seeps slowly, some metals corrode from the inside, and anything assembled from parts may leak at the join. It is worth filling a new vase in a sink and leaving it half an hour before it goes on a wooden surface.",
          "Where a vessel is not watertight, a glass jar or a florist's liner inside it solves the problem completely and is invisible once the flowers are in. That is also the answer for anything valuable enough that you would rather not risk it.",
        ],
      },
      {
        heading: "Grouping, which is the actual skill",
        paragraphs: [
          "A single vase on a large surface almost always looks stranded. Three vessels of different heights, grouped close enough to read as one object, will hold a table or a mantelpiece far better than one big arrangement — and cost less in flowers, because two of the three can hold a single stem or nothing at all.",
          "Odd numbers and varied heights are the whole trick. Matched pairs at the same height read as a shop display; three of different heights read as someone having made a decision.",
        ],
      },
    ],
  },
  {
    slug: "how-many-lights-does-a-room-need",
    title: "How many lights does a room need?",
    excerpt:
      "Why one ceiling light is never enough, the three-source rule, and how to plan lighting layers in a room you already own.",
    categorySlug: "lighting",
    productCount: 8,
    sections: [
      {
        paragraphs: [
          "A room lit by a single ceiling fixture looks flat at every hour of the day, and no amount of spending on that one fixture fixes it. The problem is not the light, it is that there is only one of it.",
          "Light from a single overhead source falls on everything from the same angle, which removes the shadows that give a room depth. It is the lighting equivalent of a photograph taken with a flash.",
        ],
      },
      {
        heading: "The three-source rule",
        paragraphs: [
          "The working guideline is at least three light sources per room, at three different heights. Overhead, mid-level, and low. A pendant or ceiling light, a table lamp or wall light at around eye level when seated, and something low — a floor lamp's pool of light, a candle, a lamp on a low table.",
          "That is a minimum rather than a target. A large living room comfortably takes five or six sources. What matters is not the count but that they are at different heights, because that is what creates the shadows.",
        ],
      },
      {
        heading: "What each layer is for",
        paragraphs: [
          "Ambient light is the background level — usually the ceiling fixture, and the one people over-rely on. Its job is to stop the room being dark, not to light anything in particular, and it benefits more from a dimmer than from a bigger bulb.",
          "Task light is for reading, working, cooking. It needs to be close to the task and bright, which almost always means at the height of the task rather than on the ceiling. A reading lamp beside a chair does what no overhead light can.",
          "Accent light is what makes a room look designed — a lamp washing a wall, light behind a plant, a picture light. It contributes almost nothing to how much you can see and almost everything to how the room feels.",
        ],
      },
      {
        heading: "Planning it in a room you already have",
        paragraphs: [
          "Start from where people sit rather than from the middle of the ceiling. Every seat wants light within reach of it — a side table with a lamp, or a floor lamp behind the shoulder. Sitting in a room and noting which seats are in shadow after dark is more useful than any diagram.",
          "Then check the corners. A dark corner shrinks a room, and a single lamp in one is the cheapest way to make a space feel larger. It is a common reason a room feels smaller in the evening than it does in daylight.",
          "Finally, get everything on dimmers if you can. One fixture at three different levels is functionally three fixtures, and dimming is the single cheapest upgrade available to a room that already has lights in it.",
        ],
      },
      {
        heading: "Bulb colour, briefly",
        paragraphs: [
          "Keep the colour temperature consistent within a room. Mixing warm and cool white in the same space is visible and unpleasant in a way that is hard to place until you know what you are looking at — the room reads as slightly wrong rather than obviously mismatched.",
          "For living rooms and bedrooms, 2700K is the warm domestic standard. Kitchens and workspaces can take 3000K to 4000K, which is crisper without being clinical. Above that belongs in a garage.",
        ],
      },
    ],
  },
];

function toBlocks(sections: Section[], slug: string) {
  const blocks: unknown[] = [];
  let index = 0;
  const block = (text: string, style: string) => {
    const key = `${slug}-${index++}`;
    return {
      _type: "block",
      _key: key,
      style,
      markDefs: [],
      children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
    };
  };
  for (const section of sections) {
    if (section.heading) blocks.push(block(section.heading, "h2"));
    for (const paragraph of section.paragraphs)
      blocks.push(block(paragraph, "normal"));
  }
  return blocks;
}

async function main() {
  const results: {
    slug: string;
    title: string;
    words: number;
    products: string[];
    exists: boolean;
  }[] = [];

  for (const guide of GUIDES) {
    const category = await client.fetch<{ _id: string; name: string } | null>(
      `*[_type == "category" && slug.current == $slug][0]{_id, "name": title}`,
      { slug: guide.categorySlug },
    );
    if (!category) {
      console.log(`  SKIP ${guide.slug}: no category "${guide.categorySlug}"`);
      continue;
    }

    // Live, priced products only — a guide must never link to something that
    // cannot be bought.
    const products = await client.fetch<{ _id: string; title: string }[]>(
      `*[_type == "product" && !(_id in path("drafts.**"))
         && defined(price) && references($catId)]
         | order(price desc)[0...$n]{_id, title}`,
      { catId: category._id, n: guide.productCount },
    );

    const existing = await client.fetch<string | null>(
      `*[_type == "buyingGuide" && slug.current == $slug][0]._id`,
      { slug: guide.slug },
    );

    const body = toBlocks(guide.sections, guide.slug);
    const words = guide.sections
      .flatMap((s) => [s.heading ?? "", ...s.paragraphs])
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;

    results.push({
      slug: guide.slug,
      title: guide.title,
      words,
      products: products.map((p) => p.title),
      exists: Boolean(existing),
    });

    if (!apply) continue;

    const _id = existing ?? `buying-guide-${guide.slug}`;
    await client.createOrReplace({
      _id,
      _type: "buyingGuide",
      title: guide.title,
      slug: { _type: "slug", current: guide.slug },
      excerpt: guide.excerpt,
      body,
      author: { _type: "reference", _ref: "author-kaiku-editorial" },
      relatedCategory: { _type: "reference", _ref: category._id },
      relatedProducts: products.map((product) => ({
        _type: "reference",
        _ref: product._id,
        _key: `rel-${product._id}`.slice(0, 40),
      })),
      publishedAt: new Date().toISOString(),
    });
  }

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — buying guides\n`);
  for (const result of results)
    console.log(
      `  ${result.exists ? "update" : "create"}  ${String(result.words).padStart(4)} words  ${result.products.length} products  ${result.title}`,
    );
  const total = results.reduce((n, r) => n + r.products.length, 0);
  console.log(`\n${results.length} guides, ${total} product links.`);

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-buying-guides.json`,
    JSON.stringify({ applied: apply, guides: results }, null, 2),
  );

  if (!apply) console.log("\nNothing written. Re-run with --apply.");
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
