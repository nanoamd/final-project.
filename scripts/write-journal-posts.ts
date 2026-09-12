/**
 * The journal, which has one post in it and that post is a single paragraph.
 *
 * Damien: "we still havent written any blogs".
 *
 * Correct, and the SEO audit put a number on it: 35 buying guides against 1
 * journal post, and `post-sauna-ritual` has been live since July carrying an
 * excerpt, a title and one sentence of body. A published page with no article
 * on it is worse than no page.
 *
 * Guides and posts do different jobs and these are written not to overlap.
 * The 35 guides own the purchase decision — "what size", "which material",
 * "will it fit". None of them covers how to use the thing safely once it is in
 * the garden, and none is seasonal. Both gaps are filled here, and both point
 * at the categories the margin work identified as where the business actually
 * is: Fire Pits & Heating is 86% promotable, Outdoor Living leads the
 * catalogue on 63 promotable products, and saunas return more cash per sale
 * than anything else Kaiku sells.
 *
 * Every figure below is read from the catalogue, not invented. Safety
 * clearances are stated as what manufacturers specify rather than as
 * regulation, because that is what they are.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-journal-posts.ts
 *   pnpm tsx --env-file=.env.local scripts/write-journal-posts.ts --apply
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

const AUTHOR = "author-kaiku-editorial";

type Block = {
  _key: string;
  _type: "block";
  style: string;
  markDefs: never[];
  children: { _key: string; _type: "span"; text: string; marks: never[] }[];
};

/** Portable Text from a plain list of [style, text] pairs. */
function body(parts: [string, string][], prefix: string): Block[] {
  return parts.map(([style, text], index) => ({
    _key: `${prefix}-${index}`,
    _type: "block",
    style,
    markDefs: [],
    children: [
      {
        _key: `${prefix}-${index}s`,
        _type: "span",
        text,
        marks: [],
      },
    ],
  }));
}

interface PostInput {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  /**
   * Category slugs the post draws its products from. Resolved at write time
   * rather than hard-coded as IDs, so a retired product cannot leave a post
   * pointing at nothing — and so the editorial link that earlier work spent
   * effort creating keeps existing without maintenance.
   */
  relatedCategories: string[];
  metaTitle: string;
  metaDescription: string;
  parts: [string, string][];
  /** Posts that already exist keep their original publish date. */
  publishedAt?: string;
}

/** Up to six real products from the given categories, dearest first. */
async function relatedProductRefs(categorySlugs: string[]) {
  if (!categorySlugs.length) return [];
  const ids = await client.fetch<string[]>(
    `*[_type=="product" && !(_id in path("drafts.**"))
       && category->slug.current in $slugs
       && defined(slug.current)] | order(price desc) [0..5]._id`,
    { slugs: categorySlugs },
  );
  return ids.map((id) => ({
    _type: "reference" as const,
    _ref: id,
    _key: id,
  }));
}

const FIRE_PIT_SAFETY: PostInput = {
  _id: "post-fire-pit-safety",
  title: "Fire pit safety: clearance, surfaces, and what not to burn",
  slug: "fire-pit-safety",
  excerpt:
    "The clearance people forget is the one above their head. A practical guide to siting a fire pit, what to stand it on, and how to put it out properly.",
  tags: ["outdoor living", "fire pits", "safety"],
  relatedCategories: ["fire-pits"],
  metaTitle: "Fire Pit Safety: Clearance, Surfaces & Fuel | Kaiku",
  metaDescription:
    "How far a fire pit needs to be from the house, what to stand it on, what never to burn, and how to put it out. Gas, wood and electric compared.",
  parts: [
    [
      "normal",
      "Most fire pit accidents are not dramatic. They are a scorched decking board, a melted parasol, or a cylinder left connected through a wet November. All three are avoidable, and none of them are covered by the instruction leaflet in any useful detail.",
    ],
    [
      "normal",
      "The clearance people forget is the one above their head. Side clearance is intuitive — you can see the fence. Overhead clearance is not, because a gazebo roof, a parasol, a low branch or a first-floor window sits outside your eyeline while you are looking at the flames.",
    ],
    ["h2", "Clearance: what the manufacturers actually specify"],
    [
      "normal",
      "Treat these as the starting point and then read the manual for the model you own, because the figures vary and the manual is the one that matters for your warranty.",
    ],
    [
      "normal",
      "For a gas fire pit table, manufacturers typically ask for around a metre of clear space on every side and considerably more above — commonly two metres or more of open sky. The 50,000 BTU tables in our range are 81cm square and the 40,000 BTU models 71cm, so a table needs a footprint closer to three metres square once clearance is counted, not the 81cm the box describes.",
    ],
    [
      "normal",
      "For a wood-burning pit, add margin. Embers travel on the wind in a way gas flame does not, and a still evening is not a guarantee of a still hour.",
    ],
    [
      "normal",
      "The one clearance that is not negotiable is overhead cover. A gas fire pit under a gazebo, awning or umbrella is a carbon monoxide risk, not a comfort choice. Combustion needs open air above it. If it is raining hard enough that you want a roof, it is an evening for the electric heater instead.",
    ],
    ["h2", "What to stand it on"],
    [
      "normal",
      "Level, solid and non-combustible, in that order. Level matters more than people expect on a gas table: 32kg of steel and a propane cylinder on soft ground that has taken a week of rain is how a fire pit tips.",
    ],
    [
      "normal",
      "Paving, stone and concrete are fine. Grass is not — it kills the lawn beneath, and turf is rarely as flat as it looks. Decking is the one that catches people out. Composite and timber both scorch, and radiated heat travels downwards from a fire bowl more than you would guess, so a fire pit on decking wants a heat-resistant mat or paving slab underneath it even when the model has legs.",
    ],
    [
      "normal",
      "Our portable smokeless wood burner is 48.5cm across and stands 38.5cm high, which puts the bowl well clear of the ground — useful, and still not a substitute for a non-combustible base.",
    ],
    ["h2", "Gas, wood and electric have different risks"],
    [
      "normal",
      "Gas is the most predictable and the least forgiving of carelessness with the cylinder. Keep the bottle upright, outdoors and ventilated, never inside a sealed cabinet. Turn the gas off at the cylinder first and let the burner consume what is left in the line, rather than shutting the burner and leaving the hose charged. Check the hose each spring for perishing, and replace it on the manufacturer's schedule rather than when it looks bad.",
    ],
    [
      "normal",
      "Wood is the most sociable and the messiest. Burn dry, seasoned hardwood and nothing else. Never treated or painted timber, never pallets, never anything that has been stained or glued — the smoke is genuinely toxic and the residue ruins a stainless bowl. Never use petrol, meths or barbecue lighter fluid to start or revive it.",
    ],
    [
      "normal",
      "Electric is the safest and the least atmospheric. The ceiling-mounted infrared and hanging heaters in the range run at 1,000W to 2,500W, produce no combustion products at all, and can therefore sit under cover where a gas pit cannot. The thing to check is the IP rating against where you are actually mounting it, not whether the listing says outdoor.",
    ],
    ["h2", "Putting it out, and the bit everyone skips"],
    [
      "normal",
      "Gas goes out at the cylinder valve. Wood does not go out because you have stopped adding to it — embers hold enough heat to reignite dry material for hours. Let it burn down where you can, then douse with water or smother with sand, and stir the ash so the heat below the surface is reached too. A pit that feels cool on top can be hot 3cm down.",
    ],
    [
      "normal",
      "Never move a fire pit that is still warm, and never empty ash into a plastic or wheeled bin. Ash goes into a metal container, outdoors, and stays there overnight before it goes anywhere near a bin.",
    ],
    ["h2", "Over winter"],
    [
      "normal",
      "Water sitting in a fire bowl through a British winter does more damage than a season of use. Cover it, or turn the bowl over, or bring it in. Disconnect the cylinder and store it upright outside — not in a shed with a lawnmower and a can of petrol, and never in the house.",
    ],
    [
      "normal",
      "And check the lava rock or fire glass in a gas table before the first light of the season. Rock that has absorbed water can crack and spit when it heats. It is a five-minute check that avoids the one genuinely startling failure mode these tables have.",
    ],
  ],
};

const AUTUMN_GARDEN: PostInput = {
  _id: "post-extending-the-garden-season",
  title: "Getting another two months out of the garden",
  slug: "extending-the-garden-season",
  excerpt:
    "September is when most gardens quietly close for the year, and it is usually the light that ends it rather than the cold. Three things that actually extend the season, and one honest caveat.",
  tags: ["outdoor living", "seasonal", "garden lighting"],
  relatedCategories: ["garden-lighting", "privacy-screens", "fire-pits"],
  metaTitle: "Using Your Garden Into Autumn: Light, Heat & Shelter | Kaiku",
  metaDescription:
    "Gardens close in September because of the light, not the cold. What actually extends the season — light, heat and screening — plus the solar caveat.",
  parts: [
    [
      "normal",
      "Most gardens in Britain close for the year some time in September, and it is rarely the temperature that does it. A still evening in late September is warmer than a breezy one in May. What changes is that it is dark at eight, then seven, then half past six, and an unlit garden stops being somewhere you go.",
    ],
    [
      "normal",
      "So the three things that genuinely extend the season are light first, then heat, then shelter from wind. In that order, which is the opposite of the order most people buy them in.",
    ],
    ["h2", "Light, because it is the thing that actually ended it"],
    [
      "normal",
      "You are not trying to floodlight the garden. You are trying to make a route and a destination legible — the path out, and the place you sit. Two or three pools of light at seating height do more than one bright one overhead, which flattens everything and puts the rest of the garden into blackness by contrast.",
    ],
    [
      "normal",
      "Post and bollard lights do the route. Ours run from 1.2m to 1.8m, which is the useful range: below about a metre a bollard lights the ground and little else, and above 1.8m it becomes a street lamp. A pair of 1.3m posts either side of a path is usually enough. Floor lanterns do the destination — the rattan lanterns are 68cm, which is deliberately about the height of a side table, so the light sits where people are rather than above them.",
    ],
    ["h2", "The solar caveat nobody puts in the listing"],
    [
      "normal",
      "Solar lighting is at its worst in exactly the season you want it. A panel depends on how much light actually lands on it, and in Britain that collapses far faster than the daylight hours suggest: the days shorten by a third between June and October, but the sun sits lower and the cloud is thicker, so the energy reaching a panel falls by considerably more than a third. A light that ran for eight hours in July may give you three in November, and less in a shaded corner.",
    ],
    [
      "normal",
      "That is not a reason to avoid solar — it is a reason to put it where the panel gets genuinely open sky rather than where the light looks best, and to expect less of it in midwinter. If a light has to work reliably at seven o'clock on a wet January evening, mains is the honest answer. We would rather say that than sell you four bollards that disappoint you in week three.",
    ],
    ["h2", "Heat, and how far it actually reaches"],
    [
      "normal",
      "Outdoor heat is short-range. A fire pit table warms the people around the table and essentially nobody else, and that is fine — it is a focal point, not a heating system. The gas tables in the range run 40,000 to 50,000 BTU, which in practice means a comfortable ring of four to six people at 71cm to 81cm of table.",
    ],
    [
      "normal",
      "Electric infrared works differently and is worth understanding, because it heats objects and people directly rather than the air between them. That makes it far better under a covered area or against a wall, where warmed air would otherwise drift away — and, unlike gas, it can legitimately sit under a roof.",
    ],
    [
      "normal",
      "If you have a choice, put the heat at the seating and the light on the route. Reversing them is the most common way an autumn garden ends up both dark and cold in the places you actually stand.",
    ],
    ["h2", "Shelter, which is really about wind"],
    [
      "normal",
      "Wind ends more autumn evenings than cold does. It also carries smoke straight into whoever is sitting downwind, which is the real reason a fire pit evening breaks up early.",
    ],
    [
      "normal",
      "A screen at 198cm — the height of the decorative steel screens we stock — breaks wind at seated and standing height without walling the garden in, and they are 122cm wide, so two or three cover a seating area rather than a boundary. The perforated designs matter here: a solid panel creates turbulence and eddies behind it, while a pierced one slows the air and is noticeably calmer to sit behind.",
    ],
    [
      "normal",
      "They also do the other job an autumn garden needs, which is making a large space feel like a room. A seating area that felt generous in July can feel exposed in October, and an enclosure at shoulder height fixes that more cheaply than anything else in the garden.",
    ],
    ["h2", "What to do this month"],
    [
      "normal",
      "If you do one thing, light the route from the back door to where you sit. It is the cheapest of the three, it is the thing that actually ended your season, and it is the one you will use every evening rather than only on the evenings you plan.",
    ],
  ],
};

const SAUNA_RITUAL: PostInput = {
  _id: "post-sauna-ritual",
  title: "Building a weekly sauna ritual that actually sticks",
  slug: "building-a-sauna-ritual",
  excerpt:
    "The difference between a sauna that gets used and one that becomes storage is usually the ritual around it, not the cabin itself.",
  tags: ["wellness", "saunas"],
  relatedCategories: [
    "outdoor-saunas",
    "indoor-saunas",
    "wellness-accessories",
  ],
  publishedAt: "2026-07-15T21:43:24.479Z",
  metaTitle: "Building a Weekly Sauna Ritual That Actually Sticks | Kaiku",
  metaDescription:
    "Why home saunas fall out of use, and the practical habits that prevent it: fixed times, realistic sessions, heat-up planning and what to do between rounds.",
  parts: [
    // The original opening paragraph, kept verbatim — it was the one good
    // thing in the stub and the article is built out from it.
    [
      "normal",
      "Pick a fixed time, not a spare moment — a sauna that's scheduled gets used; a sauna that's optional becomes storage. Twenty minutes, twice a week, is a realistic starting point.",
    ],
    [
      "normal",
      "That sounds like advice about discipline. It is really advice about heat-up time, which is the thing that quietly kills home sauna habits and which nobody mentions before you buy one.",
    ],
    ["h2", "Heat-up time is the real obstacle"],
    [
      "normal",
      "A traditional sauna takes somewhere between forty minutes and an hour and a half to come up to temperature, depending on the heater, the cabin volume and how cold it started. Infrared is quicker — usually fifteen to twenty minutes — because it warms you rather than the room.",
    ],
    [
      "normal",
      "The consequence is that a traditional sauna is never a spontaneous decision. If you have to decide an hour in advance, and the decision point is a cold Tuesday evening when you are tired, you will not use it. The people who use their sauna are the ones who turned the heater on before dinner because it is Tuesday, not because they felt like it.",
    ],
    [
      "normal",
      "So the ritual is not really the session. It is the fifteen seconds an hour beforehand when you switch it on without thinking about whether you want to.",
    ],
    ["h2", "What a session actually looks like"],
    [
      "normal",
      "Two or three rounds of eight to fifteen minutes, with a proper cool-down between each, is the pattern most people settle on. One long session is not better, and it is markedly less pleasant.",
    ],
    [
      "normal",
      "The cool-down between rounds is not an interval, it is half the point. Cold water, cold air, or simply sitting outside — the contrast is what most people are actually there for, and skipping it is why a first sauna often feels like nothing more than being uncomfortably hot.",
    ],
    [
      "normal",
      "Leave the phone outside. Not for purity — the humidity and the heat are genuinely bad for it, and a sauna is one of the few rooms where that gives you a non-negotiable reason.",
    ],
    ["h2", "Where the habit usually breaks"],
    ["normal", "Three things, in order of how often they are the culprit."],
    [
      "normal",
      "The towel situation. If clean towels are not already by the door, the session does not happen. Keep a dedicated stack there, not in the airing cupboard with everything else.",
    ],
    [
      "normal",
      "The walk. If the cabin is at the end of a dark, unlit garden, it will be used in July and abandoned in October. This is a lighting problem masquerading as a motivation problem, and it is worth solving before the clocks change rather than after.",
    ],
    [
      "normal",
      "The alone-ness. A sauna used by two people gets used roughly twice as reliably as one used by one, because someone else is expecting it. If there is anyone in the house who might join, fix the time around them.",
    ],
    ["h2", "Give it eight weeks"],
    [
      "normal",
      "Two sessions a week for eight weeks is sixteen sessions, which is roughly where most people stop deciding and start defaulting. Before that it is an activity you are trying to keep up. After it, it is Tuesday.",
    ],
    [
      "normal",
      "If you are still choosing each time after two months, the problem is almost always the schedule rather than the sauna — the time you picked is not actually free. Move it once, deliberately, rather than letting it quietly lapse.",
    ],
  ],
};

const POSTS = [FIRE_PIT_SAFETY, AUTUMN_GARDEN, SAUNA_RITUAL];

async function main() {
  for (const post of POSTS) {
    const blocks = body(post.parts, post._id.replace("post-", ""));
    const words = post.parts.reduce(
      (n, [, text]) => n + text.split(/\s+/).length,
      0,
    );
    const related = await relatedProductRefs(post.relatedCategories);
    const existing = await client.getDocument(post._id);

    console.log(
      `${existing ? "UPDATE" : "CREATE"}  ${post._id}  ${blocks.length} blocks, ~${words} words`,
    );
    console.log(`        ${post.title}`);
    console.log(
      `        /journal/${post.slug}   ${related.length} linked products`,
    );

    if (!apply) continue;

    await client.createOrReplace({
      _id: post._id,
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      excerpt: post.excerpt,
      body: blocks,
      author: { _type: "reference", _ref: AUTHOR },
      publishedAt: post.publishedAt ?? new Date().toISOString(),
      tags: post.tags,
      relatedProducts: related,
      seo: {
        _type: "seo",
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
      },
    });
  }

  console.log(
    apply
      ? `\nApplied ${POSTS.length} posts.`
      : `\nDry run — re-run with --apply.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
