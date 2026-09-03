/**
 * Batch 3: the three Lighting guides from the roadmap — floor lamp
 * placement, warm vs cool white, and chandelier vs pendant.
 *
 * All three sit under the general Lighting category (138 products) rather
 * than a room-specific subcategory — checked directly rather than assumed,
 * because a title search for "floor lamp" / "chandelier" / "pendant" turned
 * up 2-4x more real stock than the room subcategories alone would have
 * suggested (42, 20 and 29 matches respectively). Most of it isn't
 * cross-tagged into Bedroom/Living Room Lighting.
 *
 * Chandelier vs pendant embeds the existing `pendant-light` tool, which
 * already computes drop height and diameter — genuinely relevant here, not
 * forced in. The other two guides don't get a tool: lamp placement is
 * positional rather than arithmetic, and Kelvin choice is a lookup, not a
 * calculation — the same discipline that skipped a tool for bathroom
 * storage and the two wellness guides elsewhere in this batch.
 *
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch3.ts
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch3.ts --apply
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

const FLOOR_LAMP_PRODUCT_IDS = [
  "premier-housewares-2502417", // Stockholm Shiny Brass Adjustable, task
  "premier-housewares-2502418", // Stockholm Chrome Adjustable, task
  "premier-housewares-5511057", // Ulyana Linen Shade, ambient
  "premier-housewares-5511328", // Mano Gold, ambient
  "premier-housewares-5511398", // Skye Nickel Rectangular, statement
  "premier-housewares-5511633", // Abira Brass Three Bulb, tall statement/corner
  "premier-housewares-5550072", // Sika White Marble and Gold, shorter/task-height
  "product-import-black-cannon-floor-lamp-with-hessian-shade", // classic single-shade reading lamp
];

const KELVIN_PRODUCT_IDS = [
  "product-aosom-b31-633v00gd", // Pendant with 3 colour temperatures, gold
  "product-aosom-b31-633v00sr", // Pendant with 3 colour temperatures, silver
  "premier-housewares-5511057", // Ulyana floor lamp, linen shade
  "product-import-bamboo-gesso-lamp", // Bamboo Gesso table lamp
  "premier-housewares-5511328", // Mano Gold floor lamp
  "premier-housewares-2502340", // Revive Chrome floor lamp
  "premier-housewares-5511598", // Trieste Large Angular pendant
  "product-import-large-round-gesso-lamp", // Large Round Gesso table lamp
];

const CHANDELIER_PENDANT_PRODUCT_IDS = [
  "premier-housewares-2502222", // Morano 8 Bulb Champagne Glass Chandelier
  "premier-housewares-5511420", // Salasco 3 Tier Nickel Finish Chandelier
  "premier-housewares-5511658", // Babylon Large Black 12 Light Pendant
  "premier-housewares-5511482", // Alexis 8 Bulb Round Statement Pendant
  "premier-housewares-2502319", // Lenno Large Gold Pendant
  "premier-housewares-2502389", // Wyra Champagne Gold Frame Pendant
  "premier-housewares-5511666", // Babylon 6 Bulb Crystal Chandelier
  "premier-housewares-5511039", // Hampstead Black Finish Large Pendant
];

const GUIDES: GuideSpec[] = [
  {
    id: "guide-floor-lamp-placement",
    title: "Where should a floor lamp actually go?",
    slug: "floor-lamp-placement",
    excerpt:
      "A reading lamp wants its shade roughly at shoulder height when seated — about 100-105cm — so the light falls on the page without shining in your eyes. An ambient corner lamp works the opposite way: taller, and further from the seat, so it bounces light off the ceiling instead. Eight of our own lamps sorted by which job they do.",
    categoryId: "category-lighting",
    relatedProductIds: FLOOR_LAMP_PRODUCT_IDS,
    seo: {
      title: "Where Should a Floor Lamp Go? Placement Guide | Kaiku",
      description:
        "A reading lamp's shade wants to sit at shoulder height when seated, close to the chair. An ambient corner lamp is taller and further away, to bounce light off the ceiling instead.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "A floor lamp does one of two different jobs, and where it goes depends on which one. A reading or task lamp needs its shade at roughly shoulder height when you're sitting down — about 100-105cm from the floor — positioned beside or just behind the seat, so light falls on the page rather than into your eyes. An ambient lamp is doing the opposite job: filling a dark corner or bouncing light off the ceiling, which wants it taller and further from any one seat rather than tucked beside it.",
      );
      p(
        "Confusing the two is the most common placement mistake — a tall, wide-shaded statement lamp makes a poor reading light no matter where you put it, and a low task lamp in a bare corner does little to lift a dark room.",
      );
      b.push(
        table(
          "b",
          n,
          "Floor lamp type and placement",
          ["Job", "Shade height", "Where it goes"],
          [
            [
              "Reading / task",
              "~100-105cm (shoulder height, seated)",
              "Beside or just behind the seat",
            ],
            [
              "Ambient / corner",
              "145-200cm",
              "A dark corner, away from seating",
            ],
            [
              "Statement / decorative",
              "Varies — chosen for looks first",
              "Wherever it reads best in the room",
            ],
          ],
        ),
      );
      n += 1;
      p(
        "Rule one. A reading lamp is measured from the eye, not the floor",
        "h2",
      );
      p(
        "The number that matters is where the light source sits relative to your eyes when seated, not its total height. Too low, and the bulb shines straight into your eyes rather than down onto the page; too high, and the light spreads too wide to focus on what you're reading. A shade bottom around shoulder height, positioned just behind and to the side of the seat, is the practical answer most task lamps are built around.",
      );
      p(
        "Distance from the chair matters as much as height — close enough that the light pool actually reaches your lap, which in practice means within arm's reach of the seat, not across the room from it.",
      );
      p(
        "Rule two. An ambient lamp wants height and distance, not precision",
        "h2",
      );
      p(
        "A corner or ambient lamp isn't lighting a task, it's lifting the whole room — which means it works better tall (145-200cm) and further from any one seat, so the light spreads rather than pools in one spot. Many are designed to bounce light upward off the ceiling, which only works if there's ceiling above them to bounce off — a lamp with an open or upward-facing shade loses most of its effect tucked under a sloped ceiling or shelf.",
      );
      p(
        "This is also the lamp that fills a genuinely dark corner a ceiling light doesn't reach — the corner itself is usually the right spot, more than any rule about distance from furniture.",
      );
      p("Rule three. One room, more than one lamp, doing different jobs", "h2");
      p(
        "A living room with only ambient lighting is dim for reading; a room with only task lamps has hard-edged pools of light and a dark, flat ceiling between them. Most rooms want one of each — a task lamp by the actual seat someone reads in, and a taller ambient piece elsewhere doing the job of lifting the room as a whole.",
      );
      p("Eight of our lamps, by job", "h2");
      p(
        "Sorted by which of the two jobs each one is built for, so the choice is about the room's need first and the finish second.",
      );
      b.push(
        table(
          "b",
          n,
          "Our floor lamps, by job",
          ["Lamp", "Height", "Best for"],
          [
            [
              "Stockholm Shiny Brass Adjustable",
              "155cm (adjustable)",
              "Reading — arm adjusts shade over the seat",
            ],
            [
              "Stockholm Chrome Adjustable",
              "155cm (adjustable)",
              "Reading — arm adjusts shade over the seat",
            ],
            [
              "Black Cannon Floor Lamp, Hessian Shade",
              "151cm",
              "Reading, beside an armchair",
            ],
            [
              "Sika White Marble and Gold",
              "105cm",
              "Reading — lower profile beside a low seat",
            ],
            [
              "Ulyana Linen Shade",
              "160cm",
              "Ambient — soft, diffuse fill light",
            ],
            ["Mano Gold", "130cm", "Ambient corner fill"],
            [
              "Skye Nickel Rectangular",
              "176cm",
              "Ambient / statement — tall, architectural",
            ],
            [
              "Abira Brass Three Bulb",
              "200cm",
              "Ambient — tallest, fills a large dark corner",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "A reading lamp's shade sits at roughly shoulder height, seated, close enough to reach the seat's own light pool — usually 100-105cm and within arm's reach. An ambient lamp works the opposite way: taller (145-200cm) and further from any one seat, filling a corner or bouncing light off the ceiling instead of pooling on a page.",
      );
      return b;
    })(),
    faqs: [
      [
        "How tall should a floor lamp be next to a reading chair?",
        "The shade's bottom wants to sit at roughly shoulder height when you're seated — about 100-105cm from the floor for most chairs — positioned beside or just behind the seat so light falls on the page rather than into your eyes.",
      ],
      [
        "Where should an ambient floor lamp go in a living room?",
        "In the darkest corner the ceiling light doesn't reach, rather than beside a specific seat. Taller lamps (145-200cm) generally work better here, since the goal is filling the room or bouncing light off the ceiling, not lighting one task.",
      ],
      [
        "Can one floor lamp do both reading and ambient lighting?",
        "Not well. A tall, wide-shaded lamp built for ambient fill spreads its light too broadly to focus on a page, and a low task lamp does little to lift a dark corner. Most rooms are better served by one of each.",
      ],
      [
        "How far should a floor lamp be from an armchair?",
        "Close enough to reach — within arm's reach of the seat for a reading lamp, so its light pool actually falls on your lap or book. An ambient lamp doesn't need to be near any seat at all.",
      ],
      [
        "Do adjustable-arm floor lamps work better for reading?",
        "Generally yes — an adjustable arm lets you move the shade directly over the page rather than relying on the lamp's fixed position relative to the chair, which matters more in a room where the seating gets rearranged.",
      ],
    ],
  },
  {
    id: "guide-warm-vs-cool-white-lighting",
    title: "Warm white or cool white — which for which room?",
    slug: "warm-vs-cool-white-light-by-room",
    excerpt:
      "Warm white (2700-3000K) suits living rooms and bedrooms — the same colour temperature as candlelight and a sunset. Cool white (5000K+) suits task-focused spaces like a home office or a workbench. Most kitchens and bathrooms sit in the middle at neutral white. The scale explained, and which of our own lights let you choose.",
    categoryId: "category-lighting",
    relatedProductIds: KELVIN_PRODUCT_IDS,
    seo: {
      title: "Warm White or Cool White? Kelvin Guide by Room | Kaiku",
      description:
        "Warm white (2700-3000K) for living rooms and bedrooms, neutral (3500-4000K) for kitchens and bathrooms, cool white (5000K+) for task spaces. The Kelvin scale explained by room.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "Warm white (2700-3000K) is the colour temperature of candlelight and an early sunset, and it's the right choice for a living room or bedroom — anywhere the job is relaxing rather than working. Cool white (5000K and up) is closer to overcast daylight and suits a home office, garage or workbench, where alertness and colour accuracy matter more than atmosphere. Most kitchens and bathrooms sit between the two, at neutral white (3500-4000K) — bright enough to work by, without the slightly clinical edge of full daylight.",
      );
      p(
        "Kelvin measures colour, not brightness — a warm 2700K bulb and a cool 5000K bulb can put out the same lumens and still feel completely different, because the number describes the tint of the light, not how much of it there is.",
      );
      b.push(
        table(
          "b",
          n,
          "Kelvin by room",
          ["Colour temperature", "Feel", "Best rooms"],
          [
            [
              "2700-3000K — warm white",
              "Candlelight, sunset",
              "Living room, bedroom, dining room",
            ],
            [
              "3500-4000K — neutral white",
              "Bright but not clinical",
              "Kitchen, bathroom, hallway",
            ],
            [
              "5000K+ — cool / daylight white",
              "Overcast daylight",
              "Home office, garage, workbench",
            ],
          ],
        ),
      );
      n += 1;
      p("Rule one. Warmer light for rooms you relax in", "h2");
      p(
        "Warm white's dim, amber-tinted quality is close to firelight, which is exactly why it reads as cosy rather than bright. A living room or bedroom lit at 2700-3000K feels calmer in the evening than the same room under a cooler bulb, because the colour itself signals 'wind down' rather than 'get to work.'",
      );
      p(
        "This is also why a warm bulb in a reading lamp can feel slightly dim even at a reasonable lumen count — the colour reads as low-energy regardless of actual brightness, which is worth knowing before assuming you need a stronger bulb rather than a cooler one.",
      );
      p("Rule two. Cooler light for rooms you concentrate in", "h2");
      p(
        "Cool white mimics daylight, which is genuinely linked to alertness — it's why office and workshop lighting defaults to 4000-5000K rather than the same warm tone as a living room. It's also more colour-accurate, which matters for a task like matching paint or reading fine print, where a warm tint can shift how colours actually look.",
      );
      p(
        "The trade-off is atmosphere: the same cool bulb in a bedroom reads as clinical rather than restful, which is the single most common lighting mistake in a home — buying office-bright bulbs for a room meant for winding down.",
      );
      p("Rule three. Kitchens and bathrooms split the difference", "h2");
      p(
        "Both rooms need enough clarity to work safely — chopping vegetables, reading a prescription label — without the harshness of a full daylight bulb first thing in the morning. Neutral white (3500-4000K) is the practical middle ground most kitchens and bathrooms are lit to, bright and clear without tipping into clinical.",
      );
      p(
        "A kitchen with a warmer dining or breakfast-bar area sometimes mixes both — neutral over the worktop where the task is, warmer over the table where the meal is eaten — rather than lighting the whole room to one temperature.",
      );
      p("Rule four. A tunable fixture skips the decision entirely", "h2");
      p(
        "Some fixtures switch between two or three colour temperatures at the flip of a switch, which is the practical answer when one room genuinely needs to do both jobs — a home office that becomes a reading nook in the evening, say. It costs a little more than a fixed-temperature light, and buys you the ability to change your mind without changing the bulb.",
      );
      p("Our lights, and which let you choose the temperature", "h2");
      p(
        "Most fixtures are sold at a fixed colour temperature suited to the room they're designed for. A few switch between two or three — flagged here rather than left for the small print.",
      );
      b.push(
        table(
          "b",
          n,
          "Our lights, colour temperature",
          ["Light", "Colour temperature", "Best room"],
          [
            [
              "Pendant with Three Colour Temperatures, Gold",
              "Switchable: warm / neutral / cool",
              "Kitchen, home office, or both",
            ],
            [
              "Pendant with Three Colour Temperatures, Silver",
              "Switchable: warm / neutral / cool",
              "Kitchen, home office, or both",
            ],
            [
              "Ulyana Floor Lamp, Linen Shade",
              "Warm white (fixed bulb fitting)",
              "Living room, bedroom",
            ],
            [
              "Bamboo Gesso Table Lamp",
              "Warm white (fixed bulb fitting)",
              "Bedroom, living room",
            ],
            [
              "Mano Gold Floor Lamp",
              "Warm white (fixed bulb fitting)",
              "Living room",
            ],
            [
              "Revive Chrome Floor Lamp",
              "Warm white (fixed bulb fitting)",
              "Living room, bedroom",
            ],
            [
              "Trieste Large Angular Pendant",
              "Warm white (fixed bulb fitting)",
              "Dining room, living room",
            ],
            [
              "Large Round Gesso Table Lamp",
              "Warm white (fixed bulb fitting)",
              "Bedroom, living room",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "Warm white (2700-3000K) for living rooms and bedrooms, neutral (3500-4000K) for kitchens and bathrooms, cool white (5000K+) for offices and workbenches. Kelvin measures colour, not brightness — matching it to the room matters as much as the wattage.",
      );
      return b;
    })(),
    faqs: [
      [
        "What colour temperature is best for a living room?",
        "Warm white, 2700-3000K — the same range as candlelight, which is why it reads as relaxing rather than clinical. This applies to bedrooms and dining rooms for the same reason.",
      ],
      [
        "What Kelvin should kitchen lighting be?",
        "Neutral white, 3500-4000K, is the usual middle ground — bright enough to work by without the harsher edge of full daylight bulbs. Some kitchens mix in warmer light over a dining or breakfast-bar area.",
      ],
      [
        "Does Kelvin affect how bright a bulb looks?",
        "Not directly — Kelvin measures colour, not lumens. A warm bulb can feel visually 'dimmer' than a cool one at the same lumen output, purely because the amber tint reads as lower-energy, which is worth knowing before buying a stronger bulb to fix a feeling rather than an actual brightness shortfall.",
      ],
      [
        "Is cool white bad for a bedroom?",
        "It isn't wrong, but it works against the room's job — cool white reads as alert and clinical, which fights the wind-down purpose most bedrooms are lit for. Warm white (2700-3000K) suits a bedroom better for that reason.",
      ],
      [
        "What's the point of a colour-temperature-switchable light?",
        "It lets one fixture do two jobs — a home office that also works as an evening reading spot, for example — without buying two separate lights or swapping bulbs. It costs a little more than a fixed-temperature fixture for that flexibility.",
      ],
    ],
  },
  {
    id: "guide-chandelier-vs-pendant",
    title: "Chandelier or pendant light — and how much ceiling clearance?",
    slug: "chandelier-vs-pendant-light",
    excerpt:
      "A pendant wants at least 7ft (213cm) of floor clearance anywhere someone walks under it, and 75cm above a dining table specifically. A chandelier's more ornamental scale usually wants 8-9ft (244-274cm) of ceiling height to hang properly. The real difference between the two, and eight of our own lights measured against both rules.",
    categoryId: "category-lighting",
    relatedProductIds: CHANDELIER_PENDANT_PRODUCT_IDS,
    seo: {
      title: "Chandelier vs Pendant Light: Clearance & Choice Guide | Kaiku",
      description:
        "A pendant needs 7ft (213cm) of floor clearance in a walkway, 75cm above a dining table. A chandelier's ornamental scale usually wants 8-9ft of ceiling height. The real difference explained.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "The difference isn't really the number of bulbs — it's scale and where each one belongs. A pendant is a single fitting, often one shade, sized to hang over a specific spot: a dining table, a kitchen island, a hallway. A chandelier is built as a room's ornamental centrepiece, wider and more elaborate, and it wants the ceiling height to match — 8-9ft (244-274cm) as a rule of thumb, against a pendant's minimum walkway clearance of 7ft (213cm).",
      );
      p(
        "Over a dining table specifically, the number that matters most is 75cm (30in) — the gap between the tabletop and the bottom of the fitting, whichever type it is.",
      );
      b.push(
        table(
          "b",
          n,
          "Clearance by fitting",
          ["Fitting", "Minimum floor clearance", "Above a dining table"],
          [
            [
              "Pendant",
              "213cm (7ft) in any walked space",
              "75cm (30in) above the tabletop",
            ],
            [
              "Chandelier",
              "244-274cm (8-9ft) ceiling height",
              "75cm (30in) above the tabletop",
            ],
          ],
        ),
      );
      n += 1;
      b.push(tool("b", n, "pendant-light", "Work out your own drop height"));
      n += 1;
      p(
        "Rule one. A pendant is sized to the spot, a chandelier to the room",
        "h2",
      );
      p(
        "A pendant almost always answers a specific question — light over this table, this island, this stretch of hallway — which is why it's usually sold and hung singly or in a matched row. A chandelier is doing a different job: it's the visual anchor of the whole room, which is why it tends to be wider, more ornamental, and chosen to be looked at as much as to light anything underneath it.",
      );
      p(
        "This is the practical way to decide between them where either would technically fit: ask whether the room needs a centrepiece, or just light in one place.",
      );
      p("Rule two. Seven feet is the floor, not the target", "h2");
      p(
        "213cm (7ft) is the minimum clearance anywhere someone walks underneath a hanging light — a hallway, a kitchen island, the path round a dining table. Below that, a taller visitor clips it; a fitting that only just clears at 7ft will feel low in daily use even though it technically passes.",
      );
      p(
        "This figure doesn't apply directly over a seated dining table, where nobody's standing underneath — that's rule three instead.",
      );
      p(
        "Rule three. Seventy-five centimetres above the table, regardless of fitting",
        "h2",
      );
      p(
        "Whether it's a pendant or a chandelier, the gap from tabletop to the bottom of the fitting wants to be about 75cm (30in) — low enough to anchor the table visually and warm the food and faces below it, high enough that nobody's ducking around it to see across the table. This number doesn't change with ceiling height; a taller ceiling means a longer flex or chain, not a bigger gap.",
      );
      p(
        "A standard UK ceiling (about 240cm) leaves roughly 165cm above the 75cm gap for the fitting and its drop — comfortable for most pendants, tighter for a tall multi-tier chandelier, which is worth measuring before assuming one will hang the way it looks in a taller showroom.",
      );
      p("Rule four. A low ceiling narrows the choice before style does", "h2");
      p(
        "Below about 240cm of ceiling height, a large ornamental chandelier can struggle to hang with enough clearance to read as intentional rather than cramped — this is a genuine constraint, not a style preference, and it's worth checking before falling for a statement piece the room's ceiling can't actually give the room it needs.",
      );
      p(
        "A flatter, closer-to-the-ceiling pendant or a semi-flush fitting is the practical answer in a lower room, regardless of which look you'd otherwise prefer.",
      );
      p("Eight of our lights, measured", "h2");
      p(
        "Height here is the fitting's own drop — how far it hangs down from the ceiling fixing — which is what decides the clearance question, not how wide it is.",
      );
      b.push(
        table(
          "b",
          n,
          "Our chandeliers and pendants, measured",
          ["Light", "Drop / height", "Type"],
          [
            ["Morano 8 Bulb Champagne Glass Chandelier", "143cm", "Chandelier"],
            ["Salasco 3 Tier Nickel Finish Chandelier", "143cm", "Chandelier"],
            [
              "Babylon Large Black 12 Light Pendant",
              "175cm",
              "Statement pendant",
            ],
            [
              "Alexis 8 Bulb Round Statement Pendant",
              "115cm",
              "Statement pendant",
            ],
            ["Lenno Large Gold Pendant", "145cm", "Pendant"],
            ["Wyra Champagne Gold Frame Pendant", "150cm", "Pendant"],
            ["Babylon 6 Bulb Crystal Chandelier", "172cm", "Chandelier"],
            ["Hampstead Black Finish Large Pendant", "84cm", "Pendant"],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "213cm (7ft) minimum floor clearance anywhere walked under; 244-274cm (8-9ft) of ceiling height for a chandelier's larger scale to hang properly; 75cm above a dining table either way. Pick a pendant when the job is lighting one spot, a chandelier when the room wants a centrepiece — and measure the ceiling before falling for a piece it can't clear.",
      );
      return b;
    })(),
    faqs: [
      [
        "What is the minimum ceiling height for a chandelier?",
        "As a rule of thumb, 8-9ft (244-274cm), so the fitting's own scale still leaves enough clearance beneath it. Below that, a large ornamental chandelier can struggle to hang without feeling cramped rather than deliberate.",
      ],
      [
        "How low should a pendant light hang over a dining table?",
        "About 75cm (30in) from the tabletop to the bottom of the fitting — low enough to anchor the table, high enough that nobody has to duck to see across it. This figure holds regardless of the room's ceiling height.",
      ],
      [
        "What's the actual difference between a chandelier and a pendant?",
        "Scale and role more than bulb count. A pendant is sized to light one spot — a table, an island, a hallway. A chandelier is built as the room's ornamental centrepiece, generally wider and more elaborate, chosen to be looked at as much as to light anything underneath.",
      ],
      [
        "Can you hang a chandelier in a room with a low ceiling?",
        "You can, but a smaller or flatter fitting works better below about 240cm of ceiling height — a large multi-tier chandelier needs the extra height above rule three's 75cm table gap to hang with real clearance, not just technically fit.",
      ],
      [
        "How much floor clearance does a hanging light need in a hallway?",
        "At least 213cm (7ft), the same minimum as anywhere else someone walks underneath a fitting. A light that only just clears 7ft will feel low once you're actually walking under it every day, so treat that figure as a floor, not a target.",
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
    "docs/change-log/2026-09-03-create-buying-guides-batch3.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
