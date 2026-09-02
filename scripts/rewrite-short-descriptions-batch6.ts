/**
 * Batch 6 — 13 more of the short published descriptions.
 *
 * Three of the gesso lamps in this group carry keyword-stuffed titles
 * ("Large Round Gesso Table Lamp | Luxury Designer Lighting | Kaiku"), which
 * is a separate defect from the description length and is fixed in
 * scripts/fix-stuffed-titles.ts rather than here.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch6.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch6.ts --apply
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

/** Gesso comes up on three lamps in this batch. Written once, used three
 * times, because the explanation is the same and it is the single most
 * useful thing to tell someone about the finish. */
const GESSO_EXPLAINER =
  "Gesso is a traditional preparation of chalk or gypsum bound in glue, used for centuries to prime panels and frames before painting or gilding. Used as a finish in its own right it gives a matte, faintly chalky surface with visible texture — the opposite of a glaze. Nothing reflects off it, so the lamp reads as a solid form rather than a shiny object.";

const GESSO_CARE = [
  "Dust with a dry, soft cloth and nothing else. This is the instruction that matters on a gesso piece: the finish is chalk-based and porous, so water will mark it and a damp cloth can lift or streak the surface.",
  "For the same reason, keep it out of bathrooms and other humid rooms, and put nothing on it — no sprays, no cleaners, no polish.",
];

export const REWRITES: Written[] = [
  {
    id: "product-import-zephra-chair",
    title: "Zephra White Armchair | Kaiku",
    summary:
      "A fabric armchair in neutral white on a metal frame, with a contoured backrest and cushioned arms. 79 x 67 x 78cm, 12.85kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Fabric upholstery over a metal supporting structure, in a neutral white tone, with a softly contoured backrest and cushioned arms.",
          "A metal frame rather than timber is what keeps the chair at 12.85kg. It also allows a slimmer profile through the arms and base than a wooden frame of the same strength, which is why the chair looks light despite generous seat proportions.",
          "The contouring in the backrest is the part that decides comfort. A flat back at this height pushes the shoulders forward; a shaped one lets you sit into the chair, which is what makes it usable for an hour rather than a minute.",
        ],
      },
      {
        heading: "Dimensions and Room Fit",
        paragraphs: [
          "79cm wide, 67cm deep and 78cm high, weighing 12.85kg.",
          "67cm of depth is moderate — upright enough to sit and read or work in, rather than the deep lounging depth of a large armchair. That makes it viable at a desk, a dressing table, or in a bedroom corner where a deep chair would swallow the space.",
          "At 12.85kg one person can reposition it easily, which is worth having in a chair that gets moved between a reading corner and a room with guests in it.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Living rooms, bedrooms, reading corners, home offices and dressing rooms.",
          "White upholstery is the consideration rather than the shape. In a bedroom or a reading corner it stays clean for years; as the main seat in a family living room it will not. Worth being honest with yourself about which of those it is going into.",
        ],
      },
      {
        heading: "Fabric Care",
        paragraphs: [
          "Vacuum it regularly. That is the single most effective thing for upholstery, and more important than stain treatment: grit worked into the weave by sitting is what abrades the fibres and wears a seat out long before marking does.",
          "On a white fabric, deal with spills immediately. Blot rather than rub, and work inward from the outside edge of the mark so it does not spread into a wider ring.",
        ],
      },
    ],
  },
  {
    id: "product-import-seraphia-table-lamp-with-edged-linen-shade",
    title: "Seraphia Table Lamp with Edged Linen Shade | Kaiku",
    summary:
      "A table lamp with a sculptural brown resin base and an edged linen shade. 35 x 35 x 70cm, 3.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A brown resin base under a neutral linen shade with defined edging.",
          "Cast resin is what allows a sculptural base at this scale without the weight or cost of stone or cast metal. It takes moulded detail crisply and holds a consistent finish, and it keeps the whole lamp at 3.5kg — light enough to lift with one hand.",
          "The edging on the shade is a small detail that does a lot of work. A defined edge gives the shade a crisp outline against a wall instead of the soft, slightly shapeless line a plain unbound shade has, which is what makes the lamp read as tailored.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "35 x 35cm and 70cm tall, weighing 3.5kg.",
          "70cm is a tall table lamp — well above the usual 45-55cm — so it belongs where the height is an asset: a console table, a sideboard, an entrance hall, or a larger bedside table with the surface to take a 35cm shade.",
          "On a standard narrow nightstand it will overhang, and the shade will sit above eye level when you are lying down. Measure the surface before choosing it as a bedside lamp.",
        ],
      },
      {
        heading: "The Light It Gives",
        paragraphs: [
          "Linen diffuses rather than directs, so the light spreads softly through a room rather than falling as a defined pool. That makes this an ambient lamp — good for the general warmth of a living room or hallway, less suited to close reading.",
          "A warm-toned bulb suits the brown base; a cool white one flattens it towards grey.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust the resin base with a dry, soft cloth, working into any moulded detail where dust settles.",
          "Keep the linen shade dry. Brush it or use a vacuum brush attachment rather than wiping — water marks natural linen and dries as a visible line that does not come out.",
        ],
      },
    ],
  },
  {
    id: "product-import-the-serene-collection-three-drawer-bedside-table",
    title: "Serene Three Drawer Bedside Table | Kaiku",
    summary:
      "A wooden bedside table in a distressed grey finish with three drawers. 48 x 43 x 59cm, 10kg. Part of the Serene collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Wood in a distressed grey finish, with three drawers, from the Serene collection.",
          "A distressed finish is deliberately worn back at the edges and corners so the piece looks used rather than new. The practical benefit is real: on a piece of furniture that gets knocked — and a bedside table gets knocked — new marks blend into the existing character instead of standing out as damage.",
        ],
      },
      {
        heading: "Three Drawers",
        paragraphs: [
          "Three drawers instead of one changes how a bedside table works, because things can be separated rather than piled together. Books and a charger in one, glasses and medication in the next, personal items in the third.",
          "All of it concealed, which is the argument for drawers over an open shelf: a bedside table with everything visible is what makes an otherwise tidy bedroom look cluttered.",
        ],
      },
      {
        heading: "Dimensions and Bedroom Fit",
        paragraphs: [
          "48cm wide, 43cm deep and 59cm tall, weighing 10kg.",
          "59cm is close to standard mattress height, so the top sits roughly level with the bed — the height that makes a bedside table comfortable to reach across without stretching down for a glass.",
          "48 x 43cm is a generous footprint for a bedside table, so it takes a lamp and a book and a glass together rather than forcing a choice. In a small bedroom, measure the gap between bed and wall first.",
          "A pair either side of a bed is what makes a bedroom look composed rather than assembled — and with three drawers each, that is a genuine amount of bedroom storage without a chest of drawers.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth. Wipe marks with a barely damp cloth and dry immediately.",
          "Avoid abrasive cleaners: on a distressed finish, scrubbing removes the deliberate wear along with the dirt and leaves a patch that looks newer than the rest of the piece.",
          "Use a mat under a glass of water. It is the most common cause of a ring on any bedside table.",
        ],
      },
    ],
  },
  {
    id: "product-import-seville-collection-lebes-planter",
    title: "Seville Collection Lebes Planter | Kaiku",
    summary:
      "A decorative ceramic planter in the classical Greek lebes form, with a Mediterranean influence. 17 x 17 x 15cm, 1.25kg.",
    sections: [
      {
        heading: "The Lebes Form",
        paragraphs: [
          "The shape is taken from the lebes, a classical Greek vessel — a deep, rounded bowl, wide at the shoulder and drawing in at the rim, originally used for mixing and for ceremonial purposes.",
          "That profile is why it holds a display well. A vessel that narrows at the opening gathers stems together and supports them against the rim, so an arrangement stands up on its own instead of splaying outward the way it does in a straight-sided pot.",
          "Ceramic, with a Mediterranean-influenced finish that suits Mediterranean, classical and rustic schemes.",
        ],
      },
      {
        heading: "Size and What Fits",
        paragraphs: [
          "17 x 17cm and 15cm tall, weighing 1.25kg.",
          "This is a small, decorative vessel rather than a working planter for a large houseplant. Wider than it is tall, so it suits a display that spreads at the shoulder rather than one that stands upright and narrow.",
          "The compact footprint is what makes it useful on the surfaces most planters are too big for — a shelf, a console, a bedside table, a cabinet top or a side table.",
        ],
      },
      {
        heading: "What to Display In It",
        paragraphs: [
          "Best suited to artificial botanicals, decorative stems, foliage and dried floral arrangements.",
          "It works particularly well with good-quality artificial stems, and there is a practical reason for that beyond preference: a decorative vessel used dry never risks water sitting against a shelf or a timber surface, and the arrangement holds its shape indefinitely.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a damp cloth and avoid abrasive cleaners and scouring pads, which scratch a ceramic finish and leave marks that catch the light.",
          "Dust settles inside an open vessel as much as on it — worth turning it out occasionally rather than only wiping the outside.",
        ],
      },
    ],
  },
  {
    id: "product-import-the-serene-rattan-collection-side-table",
    title: "Serene Rattan Side Table | Kaiku",
    summary:
      "A side table in woven rattan and wood with a grey finish. 60 x 40 x 60cm, 6.6kg. Part of the Serene rattan collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Woven rattan over a wooden structure, in a grey finish, from the Serene rattan collection.",
          "The combination is a sensible one: rattan supplies the texture and the woven pattern, while the wood carries the load. Rattan alone would flex under a lamp or a stack of books; over a timber frame it stays rigid.",
          "A grey finish on rattan is a deliberate softening. Natural rattan reads distinctly warm and yellow, which fixes it to a particular look; grey keeps the woven texture while letting it sit in a neutral or cool scheme.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "60cm wide, 40cm deep and 60cm tall, weighing 6.6kg.",
          "60cm is the height that makes it flexible — level with or just above the arm of most sofas, so a drink is reachable without leaning, and workable beside a bed where a low table would sit below mattress level.",
          "The 40cm depth keeps it tight against a sofa or a wall without projecting into a walkway.",
          "6.6kg is light enough to move with one hand.",
        ],
      },
      {
        heading: "Indoor Use",
        paragraphs: [
          "This is an indoor table. Natural rattan is not an outdoor material in a British climate — it absorbs moisture, and repeated wetting and drying slackens the weave and eventually splits the fibres. A damp conservatory or porch counts as outdoors for this purpose.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth, and use a soft brush or a vacuum brush attachment on the woven sections — rattan holds dust down in the weave where a cloth only moves it around.",
          "Keep water off the rattan. Use mats under drinks and plants: standing water on a woven surface is far harder to deal with than on a solid top, because it soaks in rather than sitting on the finish.",
        ],
      },
    ],
  },
  {
    id: "product-import-solenne-table-lamp-with-edged-linen-shade",
    title: "Solenne Table Lamp with Edged Linen Shade | Kaiku",
    summary:
      "A large statement table lamp with a sculptural brown resin base and an edged linen shade. 41 x 41 x 79cm, 4kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A sculptural brown resin base under a linen shade with distinctive edged detailing.",
          "Cast resin is what makes a base of this scale practical. A 79cm sculptural form in stone or cast metal would be considerably heavier and more expensive; in resin the whole lamp comes in at 4kg while holding moulded detail crisply.",
          "The edged shade gives a crisp, tailored outline rather than the soft line of a plain unbound shade — a small detail that reads clearly at this size.",
        ],
      },
      {
        heading: "A Statement Lamp, Not a Standard One",
        paragraphs: [
          "41 x 41cm and 79cm tall, weighing 4kg. Those proportions are the point of the lamp and the thing to plan around.",
          "79cm is very tall for a table lamp — around half a metre taller than a typical bedside lamp — and 41cm across is wider than many bedside tables are deep. It is designed to be the object in the room rather than a supporting light.",
          "That makes it a console-table and sideboard lamp above all: somewhere with the surface area to carry a 41cm shade and the wall behind it to give the height somewhere to go. On a larger bedside cabinet it works; on a narrow nightstand it will not.",
        ],
      },
      {
        heading: "The Light It Gives",
        paragraphs: [
          "A large linen shade diffuses a lot of light softly across a wide area, so this lights a hallway or the corner of a living room as ambient light rather than giving a focused pool to read by.",
          "A warm bulb suits the brown resin; cool white pulls it grey.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust the resin base with a dry, soft cloth, working into the moulded detail.",
          "Brush the linen shade rather than wiping it, and keep it dry — water marks linen permanently, and on a shade this size the mark is conspicuous.",
        ],
      },
    ],
  },
  {
    id: "product-import-the-serene-collection-one-drawer-side-table",
    title: "Serene One Drawer Side Table | Kaiku",
    summary:
      "A wooden side table in a warm brown finish with one drawer. 48 x 43 x 59cm, 7.7kg. Part of the Serene collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Wood in a warm brown finish with a single integrated drawer, from the Serene collection.",
          "A warm brown finish keeps the grain of the timber visible, which is what distinguishes it from a painted carcass — the piece reads as wood rather than as a shape in a colour.",
        ],
      },
      {
        heading: "The Drawer",
        paragraphs: [
          "One drawer, which is the difference between a surface and a piece of storage. It takes the things that otherwise accumulate on top of a side table — remote controls, reading glasses, chargers, a notebook.",
          "Beside a bed that is the more useful arrangement: a lamp and a glass on top, everything else out of sight.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "48cm wide, 43cm deep and 59cm tall, weighing 7.7kg.",
          "59cm sits close to standard mattress height, which is what makes this work as a bedside table as readily as a side table — the surface is level with the bed rather than below it.",
          "Beside a sofa, 59cm puts it at or just above the arm, so a drink is within reach without leaning down. The 48 x 43cm top is generous enough for a lamp and a book together.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth; wipe marks with a barely damp cloth and dry immediately.",
          "Use mats under drinks and plants — standing water marks a finished timber top, and on a warm brown finish a pale ring shows clearly.",
        ],
      },
    ],
  },
  {
    id: "product-import-veyla-ceramic-table-lamp-with-linen-shade",
    title: "Veyla Ceramic Table Lamp with Linen Shade | Kaiku",
    summary:
      "A table lamp with a ceramic base in a black and grey palette under a crisp linen shade. 33 x 33 x 51cm, 3.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic base in a black and grey palette, with a crisp neutral linen shade.",
          "The pairing is the useful part: a dark ceramic base with a pale shade. Unlit, the base anchors the lamp visually and reads as a solid object; lit, the pale shade does all the glowing while the base stays dark. That contrast is what stops a lamp looking washed out when the light is on.",
          "A black and grey base is also the most forgiving choice on a busy surface — it does not show dust and fingermarks the way a white or pale ceramic does.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "33 x 33cm and 51cm tall, weighing 3.5kg.",
          "51cm is genuine bedside-lamp height, and the most balanced proportion in this group of lamps: tall enough to put light where you need it on a nightstand, short enough not to loom.",
          "The 33cm shade diameter still needs a reasonable surface, but it fits a standard bedside table far more comfortably than the 40cm shades in the range.",
          "It works equally on a hallway console, a sideboard or a living-room side table as part of a layered scheme rather than as a room's only light.",
        ],
      },
      {
        heading: "The Light It Gives",
        paragraphs: [
          "Linen diffuses rather than directs, giving soft light spread across the room instead of a hard pool beneath it.",
          "A warm bulb works with the neutral shade; the dark base is unaffected either way, which makes this lamp less fussy about bulb colour than a warm-toned base would be.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the ceramic base with a damp cloth. Avoid abrasive cleaners, which scratch a glazed surface.",
          "Keep the linen shade dry — brush it or use a vacuum brush attachment rather than wiping. Water marks natural linen and dries as a visible tideline.",
        ],
      },
    ],
  },
  {
    id: "product-import-square-decorative-hanging-collage-mirror-in-black",
    title: "Square Decorative Hanging Collage Mirror in Black | Kaiku",
    summary:
      "A handcrafted hanging mirror in a slim vertical arrangement of square panes, in a black metal frame. 14cm wide, 145cm high and 2cm deep, weighing 1.86kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Glass in a black metal frame, handcrafted, arranged as a vertical run of square panes.",
          "The collage construction is the design: rather than one sheet of glass, the mirror is composed of squares stacked up its length, so the reflection is broken into segments. It is a decorative wall object that reflects, not a mirror to check your appearance in.",
          "Being handcrafted, small variations between pieces are inherent rather than faults.",
        ],
      },
      {
        heading: "Proportions — Very Tall, Very Narrow",
        paragraphs: [
          "14cm wide, 145cm high, 2cm deep, weighing 1.86kg. Those proportions are unusual enough to be the main thing to understand before buying.",
          "At 145cm tall and only 14cm wide it is a vertical stripe on a wall — roughly ten times taller than it is wide. It does not behave like a conventional mirror: its job is to draw the eye upward and add height to a wall.",
          "That makes it genuinely useful in the awkward places a normal mirror cannot go: a narrow strip of wall beside a door, between two windows, in a tight hallway, or in the gap at the end of a run of furniture.",
          "2cm of depth means it sits nearly flush, so it does not catch shoulders in a corridor.",
        ],
      },
      {
        heading: "Hanging, Singly or in Multiples",
        paragraphs: [
          "At 1.86kg this is light, which widens the fixing options considerably — a single well-chosen fixing into masonry, or a proper plasterboard anchor, is sufficient. It does not need joist fixing.",
          "Hung in multiples the effect changes entirely: two or three side by side with even gaps read as a single architectural feature rather than three separate mirrors, which is the stronger treatment on a large bare wall.",
          "It also works within a gallery wall alongside artwork and photographs, where its elongated geometry breaks up a grid of rectangles.",
          "Because it is so narrow, being off-level shows immediately. Mark and check with a spirit level before drilling.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Spray the cloth rather than the mirror, and keep moisture away from the joints between the panes and the frame — that is where liquid collects on a segmented mirror, and where it will eventually mark.",
          "A collage mirror has far more edges than a plain one, so cleaning takes a cloth wrapped round a finger to get into the corners.",
        ],
      },
    ],
  },
  {
    id: "product-import-the-serene-rattan-collection-coffee-table",
    title: "Serene Rattan Coffee Table | Kaiku",
    summary:
      "A large coffee table with rattan detailing on a wooden structure, in a grey finish. 120 x 60 x 48cm, 14.5kg. Part of the Serene rattan collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Rattan detailing over a wooden structure with a sleek tabletop, in a grey finish, from the Serene rattan collection.",
          "The construction matters on a coffee table more than on a side table: the top is solid and smooth, so drinks and books sit flat, while the rattan sits in the structure below as texture. A woven top would look better and work worse.",
          "The grey finish keeps the woven texture while removing the warm yellow cast of natural rattan, which is what lets it sit in a neutral or cool room.",
        ],
      },
      {
        heading: "Dimensions and Seating Fit",
        paragraphs: [
          "120cm wide, 60cm deep and 48cm tall, weighing 14.5kg.",
          "120cm is a large coffee table, and that is the reason to choose it: as a rule a coffee table should be roughly two-thirds the length of the sofa it serves, which puts this with a three-seater of about 180cm or more.",
          "48cm is standard coffee-table height, sitting just below the seat height of most sofas so drinks stay in easy reach.",
          "The 60cm depth is generous enough to take a tray, books and a vase across the width without crowding. Leave around 40-45cm between the table edge and the sofa — enough to pass, close enough to reach.",
        ],
      },
      {
        heading: "What It Holds",
        paragraphs: [
          "A 120 x 60cm top is one of the few coffee tables large enough to be arranged rather than simply used: books stacked at one end, a tray of drinks in the middle, a plant or candles at the other, all without the surface looking full.",
          "At 14.5kg it is stable in use but still movable by one person when the room needs rearranging.",
        ],
      },
      {
        heading: "Indoor Use and Care",
        paragraphs: [
          "Indoor use only. Rattan absorbs moisture, and outdoors the repeated wetting and drying slackens and splits the weave.",
          "Dust the top with a dry cloth and use a soft brush or vacuum brush attachment on the rattan, which holds dust down in the weave.",
          "Use coasters and mats. A coffee table takes more standing liquid than any other surface in a living room, and water reaching the rattan is much harder to deal with than water on the solid top.",
        ],
      },
    ],
  },
  {
    id: "product-import-large-ribbed-gesso-lamp",
    title: "Large Ribbed Gesso Table Lamp | Kaiku",
    summary:
      "A large table lamp with a ribbed base in a textured matte gesso finish. 41 x 41 x 81cm, 10kg.",
    sections: [
      {
        heading: "What a Gesso Finish Is",
        paragraphs: [
          GESSO_EXPLAINER,
          "On a ribbed form the finish and the shape work together: the matte surface holds shadow in the grooves rather than bouncing light along them, so the ribbing reads as depth instead of as highlights. A glazed version of the same shape would look busier and cheaper.",
        ],
      },
      {
        heading: "Scale and Weight",
        paragraphs: [
          "41 x 41cm and 81cm tall, weighing 10kg.",
          "This is a large lamp by any measure — 81cm is taller than most table lamps by 30cm, and 10kg is heavier than many floor lamps. Both figures are the point rather than a drawback: the weight gives it absolute stability, and the height makes it the object in the room.",
          "It also means placement is close to permanent. A 10kg lamp is not something to shift between surfaces, so decide where it goes.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Living rooms, where its proportions make it a decorative centrepiece as well as a source of warm ambient light, and larger bedside cabinets where a substantial lamp is wanted rather than a modest one.",
          "The 41cm footprint is the constraint. It needs a console, sideboard or large cabinet — on a standard bedside table it would occupy the entire surface.",
          "The neutral matte finish suits contemporary, Scandinavian, Japandi, minimalist and modern farmhouse rooms, and it is a common specification in boutique hotels, reception areas and show homes for the same reason: it is a statement piece that does not commit the room to a colour.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: GESSO_CARE,
      },
    ],
  },
  {
    id: "product-import-large-round-gesso-lamp",
    title: "Large Round Gesso Table Lamp | Kaiku",
    summary:
      "A large table lamp with a round base in a textured matte gesso finish. 46 x 46 x 88cm, 15kg.",
    sections: [
      {
        heading: "What a Gesso Finish Is",
        paragraphs: [
          GESSO_EXPLAINER,
          "On a plain round form there is no ornament for the eye to settle on, so the surface itself becomes the detail. That is why gesso suits this shape: a glaze would make the same base read as a plain shiny ball, where the matte texture gives it substance.",
        ],
      },
      {
        heading: "Scale and Weight",
        paragraphs: [
          "46 x 46cm and 88cm tall, weighing 15kg. This is the largest and heaviest lamp in the range.",
          "88cm is approaching floor-lamp height on a table, and 15kg is more than most side tables are designed to carry comfortably — worth checking the piece of furniture as well as the surface area before ordering.",
          "The weight makes it completely stable and effectively fixed in place. This is a lamp that gets positioned once.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Built for larger rooms — living rooms, big bedrooms, entrance halls and open-plan spaces — where an 88cm lamp reads as deliberate rather than oversized. In a small room it would dominate.",
          "It suits console tables, sideboards, large bedside cabinets, hallway furniture and reception desks: surfaces with the 46cm of depth and the structural strength to take it.",
          "Like the rest of the gesso range it sits in contemporary, Scandinavian, Japandi, minimalist and classic schemes, and it is a frequent specification in boutique hotels and show homes where a large neutral statement piece is wanted.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: GESSO_CARE,
      },
    ],
  },
  {
    id: "product-import-the-rutland-collection-side-table",
    title: "Rutland Side Table | Kaiku",
    summary:
      "A square wooden side table in a warm brown finish, 60 x 60 x 60cm and 16kg. Part of the Rutland collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Solid wood in a warm brown finish, square in plan, from the Rutland collection.",
          "The proportions are a perfect cube — 60cm in all three directions. That is an unusually deliberate shape for a side table and it reads as architectural rather than incidental, particularly beside a low sofa where the table is seen as a solid form.",
        ],
      },
      {
        heading: "Dimensions and What It Holds",
        paragraphs: [
          "60 x 60cm and 60cm tall, weighing 16kg.",
          "A 60cm square top is a lot of usable surface for a side table — roughly twice the area of a typical 45cm round one. It takes a lamp, a stack of books and a drink at once rather than forcing a choice between them.",
          "60cm of height puts it level with or just above the arm of most sofas, so it works for a drink without leaning down, and it suits an armchair or reading chair where a lamp needs to sit high enough to throw light over the shoulder.",
        ],
      },
      {
        heading: "Weight and Placement",
        paragraphs: [
          "16kg is heavy for a side table, and that is a genuine advantage in use: it does not shift when leaned on and it will not tip if a lamp on it is knocked.",
          "The trade is that it is not a piece to move casually — a two-hand lift, and best positioned before it is loaded.",
          "It pairs naturally with other Rutland pieces, which is worth knowing if you want the bench or larger pieces from the collection to read as a set.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth, and wipe marks with a barely damp cloth, drying immediately afterwards.",
          "Use mats under drinks, lamps and plants. A large flat timber top beside a sofa is one of the surfaces most likely to collect a ring, and standing water is what causes it.",
        ],
      },
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
  const results: {
    id: string;
    found: boolean;
    sections: number;
    words: number;
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const written of REWRITES) {
    const doc = await client.fetch<{ _id: string } | null>(
      `*[_id == $id][0]{_id}`,
      { id: written.id },
    );
    const words = written.sections.reduce(
      (sum, s) =>
        sum + s.paragraphs.reduce((n, p) => n + p.split(/\s+/).length, 0),
      0,
    );
    results.push({
      id: written.id,
      found: !!doc,
      sections: written.sections.length,
      words,
    });
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
  const totalWords = results.reduce((n, r) => n + r.words, 0);
  const missing = results.filter((r) => !r.found);
  console.log(
    `\n${results.length} products, ${totalWords} words (avg ${Math.round(totalWords / results.length)} each).`,
  );
  if (missing.length)
    console.log(
      "NOT FOUND:",
      missing.map((m) => m.id),
    );

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-rewrite-short-descriptions-batch6.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
