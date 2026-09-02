/**
 * Batch 5 — the first 13 of 65 published descriptions that had 2-3 headed
 * sections but under 400 characters of actual text.
 *
 * These are my own earlier work and worth being straight about. The
 * supplier-voice cleanup replaced raw marketing copy with real facts, which
 * was the right fix for that defect, but it was written to a minimal
 * standard: "Wood construction in grey, round." was considered a finished
 * "Materials and Construction" section. It passed a section-count check and
 * a supplier-voice check while being useless to a shopper.
 *
 * The facts to write from were already on the documents, in the FAQs, and
 * went unused: the Tarn pot is watertight (so it takes fresh flowers, not
 * just dried), the Romanby's stone varies naturally piece to piece, the
 * Uthina needs an E27 bulb that isn't included, the Camden half-moon is
 * shaped to sit behind a sofa. None of that was in any description.
 *
 * Lesson recorded in docs/master-brief.md: a section-count threshold is not
 * a quality measure. Two headings over eleven words satisfies it.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch5.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch5.ts --apply
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

export const REWRITES: Written[] = [
  {
    id: "product-import-the-camden-collection-round-side-table",
    title: "Camden Round Side Table | Kaiku",
    summary:
      "A round wooden side table in grey, 45 x 45 x 60cm and 5kg. Part of the Camden collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Wood in a grey finish, with a circular top and a rounded overall form, from the Camden collection.",
          "A round top is a practical choice as much as a visual one. With no corners it takes a knock from a passing leg without the bruise a square edge gives, and it reads as less bulky than a square table of the same area — which matters in a small room where a side table sits in a walkway.",
        ],
      },
      {
        heading: "Dimensions and Where It Fits",
        paragraphs: [
          "45 x 45cm and 60cm tall, weighing 5kg.",
          "60cm is the height that makes this flexible. It sits at or just above the arm of most sofas, so a drink or a book is reachable without leaning down — and it is also a workable bedside height, taller than a low side table and closer to mattress level.",
          "The 45cm footprint is the useful figure in a small room: it takes up noticeably less floor than a standard 50-60cm side table while still holding a lamp and a book.",
        ],
      },
      {
        heading: "What It Holds",
        paragraphs: [
          "A table lamp, books, drinks, candles, a vase or a plant — a 45cm round top comfortably takes a lamp plus one or two other things, but not a lamp and a full tray.",
          "At 5kg it is light enough to move with one hand, so it can be pulled out when people are round and put back afterwards.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth, and use a barely damp cloth for marks, drying straight afterwards.",
          "Use mats under drinks and plants. A finished timber top will mark from standing water, and a ring on a grey finish shows more than it would on dark wood.",
        ],
      },
    ],
  },
  {
    id: "product-import-the-rutland-collection-rectangular-bench",
    title: "Rutland Rectangular Bench | Kaiku",
    summary:
      "A rectangular wooden bench in a warm brown finish, 160 x 40 x 45cm and 21.5kg. Part of the Rutland collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Solid wood in a warm brown finish, in a plain rectangular form with no back or arms, from the Rutland collection.",
          "The simplicity is what makes a bench useful rather than limiting. With no back it can be pushed fully under a table, approached from either side, and used facing in any direction — none of which a chair can do.",
        ],
      },
      {
        heading: "Dimensions and Seating",
        paragraphs: [
          "160cm wide, 40cm deep and 45cm high, weighing 21.5kg.",
          "45cm is standard dining-seat height, so it pairs correctly with a table of the usual 73-76cm. 160cm of width seats three adults comfortably, or two adults and two children — a bench does not divide into fixed places, which is exactly why it takes more people than three chairs in the same span.",
          "The 40cm depth is the number to check against a dining table: it needs to slide under the tabletop overhang to be tucked fully away.",
        ],
      },
      {
        heading: "Ways to Use It",
        paragraphs: [
          "Along one side of a dining table it is the space-saving option, since it stores under the table rather than around it.",
          "At the foot of a bed, 160cm suits a king or super-king — it should match or slightly exceed the bed width to look deliberate rather than undersized.",
          "In a hallway it works as the place to sit and put shoes on, and the open space beneath takes baskets or footwear.",
          "It pairs naturally with rectangular wooden dining tables, and particularly with other pieces from the Rutland collection.",
        ],
      },
      {
        heading: "Weight and Handling",
        paragraphs: [
          "21.5kg is substantial for a bench and gives it the solidity you want when someone sits down heavily on one end. It is a two-person carry over any distance, and worth positioning before it is loaded up.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry cloth and wipe marks with a barely damp one, drying immediately.",
          "A bench used at a dining table takes more spills than most furniture. Wipe them promptly rather than leaving them — a finished timber seat marks from standing liquid, and the seat is the part you look at.",
        ],
      },
    ],
  },
  {
    id: "product-import-the-camden-collection-one-drawer-side-table",
    title: "Camden One Drawer Side Table | Kaiku",
    summary:
      "A wooden side table in grey with one drawer, 50 x 38 x 75cm and 8.5kg. Part of the Camden collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Wood in a grey finish with a single integrated drawer, from the Camden collection.",
        ],
      },
      {
        heading: "The Drawer",
        paragraphs: [
          "One drawer, which is the difference between a surface and a piece of storage. It takes the things that otherwise live on top of a side table and make it look cluttered — remote controls, chargers, reading glasses, a notebook, keys.",
          "In a bedroom that is the more useful arrangement: a lamp and a glass of water on top, everything else out of sight.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "50cm wide, 38cm deep and 75cm tall, weighing 8.5kg.",
          "75cm is tall for a side table — the height of a dining or console table rather than a low occasional one. Beside a bed that puts the surface above mattress height, which suits a taller bed and means you are not reaching down for a glass.",
          "Beside a sofa it stands above the arm rather than level with it, so it reads more as a small console than a low side table. Worth picturing against your seating before choosing it over the 60cm round Camden.",
          "The 38cm depth keeps it tight to a wall in a hallway or a narrow bedroom.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth; wipe marks with a barely damp cloth and dry immediately.",
          "Use mats under drinks. Standing water marks a finished timber top, and it shows clearly on a grey finish.",
        ],
      },
    ],
  },
  {
    id: "product-import-romanby-stone-round-coffee-table",
    title: "Romanby Stone Round Coffee Table | Kaiku",
    summary:
      "A round coffee table with a black and white stone top on a black metal base, 60 x 60 x 45cm.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A natural stone top in black and white tones on a black metal base, with a round profile.",
          "The colour comes from the contrast between the two materials rather than from any applied finish — the pale figuring of the stone against the black metal structure beneath it.",
        ],
      },
      {
        heading: "Natural Stone Varies",
        paragraphs: [
          "Every top is different. Natural stone carries its own variation in colour, veining and texture, so the piece you receive will not match the photograph exactly and will not match another Romanby.",
          "That is the material behaving as it should rather than an inconsistency. It is worth knowing before ordering if you were expecting a uniform pattern — a printed or laminate surface gives that, natural stone does not.",
        ],
      },
      {
        heading: "Dimensions and Shape",
        paragraphs: [
          "60 x 60cm and 45cm tall.",
          "45cm is standard coffee-table height, sitting just below the seat height of most sofas so drinks stay within easy reach.",
          "The round top is the practical part. With no corners it works in a tight seating arrangement where a square table would present a hard edge at shin height, and it lets people pass on any side — useful in a room where the sofa faces a doorway.",
          "At 60cm across it is a compact coffee table, sized for a two-seater or a small living room rather than to fill the middle of a large seating group.",
        ],
      },
      {
        heading: "Caring for the Stone",
        paragraphs: [
          "Wipe with a soft, damp cloth and use coasters and mats.",
          "Keep acidic liquids off it — wine, citrus, coffee, and cleaners containing vinegar or lemon. Acid etches natural stone, leaving a dull mark where the surface itself has been altered, which cannot be wiped or polished away.",
          "Deal with spills promptly rather than letting them dry. Stone is porous to varying degrees and marks from within.",
        ],
      },
    ],
  },
  {
    id: "product-import-uthina-table-lamp",
    title: "Uthina Table Lamp | Kaiku",
    summary:
      "A table lamp with a wooden base in neutral beige and stone tones under a linen shade. 30 x 30 x 53cm, 2kg. Takes an E27 bulb, not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A wooden base in a neutral beige and stone palette, under a linen shade.",
          "Wood and linen together is a quiet combination — both are textured rather than glossy, so the lamp reads as a natural object rather than a manufactured one, and neither material commits the room to a colour.",
          "Linen diffuses light rather than directing it, giving a soft spread across a room instead of a hard pool, and it warms noticeably when lit.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "Takes an E27 screw bulb — the standard large screw cap. It is not included, so order one alongside the lamp if you want it working on arrival.",
          "A warm-toned LED suits the beige and stone palette; a cool white bulb pulls the neutral tones grey and works against the whole point of the finish.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "30 x 30cm and 53cm tall, weighing 2kg.",
          "53cm is comfortable bedside-lamp height — the light sits above the surface without towering over a nightstand. The 30cm shade diameter is the measurement to check against a narrow bedside table, where it will overhang.",
          "It also works on a hallway console, a sideboard or a living-room side table as part of a layered scheme rather than as the room's main light.",
          "2kg gives it enough weight to stay put when the switch is used, without being difficult to move between rooms.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust the wooden base with a dry cloth.",
          "Keep the linen shade dry — brush it or use a vacuum brush attachment rather than wiping. Water marks natural linen and dries as a visible tideline that does not come out.",
        ],
      },
    ],
  },
  {
    id: "product-import-reed-collection-3-drawer-bedside-table",
    title: "Reed Collection 3 Drawer Bedside Table | Kaiku",
    summary:
      "A compact wooden bedside table in a brown finish with three drawers and textured detailing. 45 x 40 x 58cm, 10kg. Part of the Reed collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Wood in a warm brown finish with textured detailing on the drawer fronts, from the Reed collection.",
          "The texture is what distinguishes it from a plain painted carcass — it catches light across the front of the unit, so the piece has some depth to it rather than reading as a flat block.",
        ],
      },
      {
        heading: "Three Drawers",
        paragraphs: [
          "Three drawers rather than one or two, which changes what a bedside table can do: things can be separated instead of piled together. Books and a charger in one, glasses and medication in another, personal items in the third.",
          "All of it is concealed storage, which is the argument for drawers over an open shelf — a bedside table with everything on display is the thing that makes a bedroom look untidy.",
        ],
      },
      {
        heading: "Dimensions and Bedroom Fit",
        paragraphs: [
          "45cm wide, 40cm deep and 58cm tall, weighing 10kg.",
          "45 x 40cm is genuinely compact — it suits a bedroom where floor space is tight, or the narrow gap between a bed and a wall where a wider unit will not go.",
          "58cm is close to standard mattress height, so the top surface sits roughly level with the bed. That is the height that makes a bedside table comfortable to reach across without stretching down.",
          "Two of them either side of a bed reads as a deliberate, symmetrical arrangement, which is how a bedroom with matching bedsides looks considered rather than assembled.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth, working into the textured detailing where dust settles — a soft brush reaches it better than a cloth.",
          "Wipe marks with a barely damp cloth and dry immediately. Use a mat under a glass of water: it is the single most common cause of a ring on a bedside table.",
        ],
      },
    ],
  },
  {
    id: "product-import-white-ceramic-pot-lamp-with-linen-shade",
    title: "White Ceramic Pot Table Lamp with Linen Shade | Kaiku",
    summary:
      "A table lamp with a ribbed white ceramic base under a linen shade. 38 x 38 x 62cm, 3kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A ceramic base in a white finish with horizontal ribbing, supplied with a linen shade.",
          "The ribbing is the feature, and it is a functional one visually: horizontal grooves catch light along their top edges and hold shadow beneath them, so the base has texture and depth where a smooth white pot would read as a plain shape.",
          "The pot form — wide and rounded rather than narrow — gives the lamp a substantial base that anchors it on a larger surface.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "A linen shade is included. Bulbs are not, so order one with the lamp.",
          "An LED is the sensible choice under a fabric shade: it runs cool, and heat is what ages a shade and yellows it from the inside over time.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "38 x 38cm and 62cm tall, weighing 3kg.",
          "62cm is a tall table lamp, and the 38cm footprint is wide. Together those make it a console, sideboard or side-table lamp rather than a bedside one — on a standard nightstand it would take most of the surface.",
          "On a console or sideboard, that height is exactly what you want: it lifts the light well above the surface and gives the piece presence against a wall.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the ceramic base with a damp cloth. Ribbing collects dust in the grooves, so a soft brush or a vacuum brush attachment does a better job than a cloth alone.",
          "Keep the linen shade dry — brush rather than wipe. Water marks natural linen permanently.",
        ],
      },
    ],
  },
  {
    id: "product-import-twill-weave-ceramic-table-lamp-with-linen-shade",
    title: "Twill Weave Ceramic Table Lamp with Linen Shade | Kaiku",
    summary:
      "A table lamp with a white ceramic base moulded in a twill weave pattern, under a tailored linen shade. 25 x 25 x 58cm, 3kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A white ceramic base carrying an intricate twill weave pattern, with a tailored linen shade.",
          "Twill is a diagonal weave, and reproducing it in ceramic means the base is covered in fine diagonal ridges rather than a flat or evenly ribbed surface. The effect changes as you move past it: the diagonals catch light on one face and hold shadow on the other, so the texture reads differently from each side.",
          "Pairing a woven texture in ceramic with an actual woven fabric shade is the deliberate idea here — the pattern is echoed in a different material.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "The linen shade is supplied and is cut to suit the base. Bulbs are not included.",
          "An LED keeps heat out of a fabric shade, which is what yellows a pale shade from the inside over years of use.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "25 x 25cm and 58cm tall, weighing 3kg.",
          "The 25cm footprint is the smallest of the ceramic lamps in this range, which makes it the one that genuinely works on a bedside table — it leaves room for a book and a glass beside it.",
          "58cm of height puts the light source above the surface without dominating a nightstand, and 3kg is enough weight that the lamp does not shift when the switch is used.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the ceramic with a damp cloth, then use a soft brush for the weave pattern — a fine diagonal texture traps dust that a cloth simply pushes around.",
          "Brush the linen shade rather than wiping it, and keep it dry.",
        ],
      },
    ],
  },
  {
    id: "product-import-large-small-rectangular-gesso-lamp",
    title: "Small Rectangular Gesso Table Lamp | Kaiku",
    summary:
      "A table lamp with a rectangular base in a textured matte gesso finish. 31 x 31 x 55cm.",
    sections: [
      {
        heading: "What a Gesso Finish Is",
        paragraphs: [
          "Gesso is a traditional preparation of chalk or gypsum bound in glue, used for centuries to prime panels and frames before painting or gilding. Used as a finish in its own right, it produces a matte, faintly chalky surface with visible texture.",
          "It is the opposite of a glazed or lacquered finish. Nothing reflects off it, so the lamp reads as a solid form rather than a shiny object, and the surface has the slightly irregular, hand-applied quality that gives it an artisan character while staying plain.",
          "Because it is matte and neutral, it sits alongside almost any palette without competing — which is why gesso pieces turn up across contemporary, Scandinavian, Japandi, minimalist and modern farmhouse schemes as well as classic interiors.",
        ],
      },
      {
        heading: "Design and Proportions",
        paragraphs: [
          "A clean rectangular base with no ornament, 31 x 31cm and 55cm tall.",
          "The rectangular silhouette is what makes it read as architectural rather than decorative. Against a round or turned lamp base it looks deliberately restrained, which is the effect the plain gesso surface is working towards.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "At 55cm it is a genuine bedside height, giving soft ambient light at the right level for reading in bed without the bulb sitting in your eyeline.",
          "It also works on side tables, console tables, shelving, sideboards and media units — anywhere a layered lighting scheme needs a point of warm light rather than another overhead fitting.",
          "The 31cm footprint is worth measuring against a narrow nightstand, where it will take up most of the surface.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth and nothing more. This is the important instruction on a gesso piece: the finish is chalk-based and porous, so water will mark it and a damp cloth can lift or streak the surface.",
          "For the same reason keep it out of bathrooms and other humid rooms, and wipe nothing onto it — no sprays, no cleaners, no polish.",
        ],
      },
    ],
  },
  {
    id: "product-import-white-beaded-ceramic-lamp-with-linen-shade",
    title: "White Beaded Ceramic Table Lamp with Linen Shade | Kaiku",
    summary:
      "A table lamp with a white ceramic base in an intricate beaded design, under a linen shade. 40 x 40 x 71cm, 3.3kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A white ceramic base moulded with an intricate beaded design, supplied with a linen shade.",
          "Beading is raised, rounded detail rather than a groove or a ridge, so it catches light as a run of small highlights across the surface. On a white glaze that produces a fine pattern of light and shadow up the base, which is what stops a pale lamp of this size reading as a plain white mass.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "The linen shade is included. Bulbs are not, so order one with the lamp.",
          "An LED runs cool under a fabric shade, which keeps a pale linen from yellowing from the inside over time.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "40 x 40cm and 71cm tall, weighing 3.3kg.",
          "At 71cm this is the tallest of the ceramic lamps in this group and a substantial piece of furniture in its own right. It belongs on a larger console table or sideboard, where the height reads as intentional.",
          "The 40cm shade diameter rules out most bedside tables — it would occupy the whole surface. On a wide console it is the right scale.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the ceramic base with a damp cloth, then use a soft brush around the beading, where dust settles between the raised detail and a cloth cannot reach.",
          "Brush the linen shade rather than wiping it, and keep it dry.",
        ],
      },
    ],
  },
  {
    id: "product-import-reed-collection-2-drawer-2-door-console",
    title: "Reed Collection 2 Drawer 2 Door Console | Kaiku",
    summary:
      "A wooden console in a warm brown finish with two drawers and two cupboard doors. 106 x 30 x 80cm, 16kg. Part of the Reed collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Wood in a warm brown finish, with two drawers above two cupboard doors, from the Reed collection.",
        ],
      },
      {
        heading: "Storage: Drawers and Cupboards Together",
        paragraphs: [
          "The combination is what makes this more useful than a plain console. Two drawers take the small things you want to hand — keys, post, chargers, documents. Two cupboards behind doors take the bulky things you do not want to see: bags, shoes, table linen, boxes.",
          "That split is the difference between a hallway table that collects clutter on top and one that absorbs it. In a dining room the cupboards hold tableware and linens while the drawers take cutlery and napkins.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "106cm wide, 30cm deep and 80cm tall, weighing 16kg.",
          "30cm is very shallow for a unit with cupboards, and that is the point — it gives real enclosed storage while projecting less than a third of a metre from the wall. In a hallway that is the difference between usable and obstructive.",
          "80cm is slightly taller than a standard table, which puts the top at a comfortable height to drop things on as you come through a door.",
          "106cm of width pairs well with a mirror above it and a lamp on top, which is the conventional entrance arrangement and works because each element does a job: light, reflection, surface and storage.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth; wipe marks with a barely damp cloth and dry immediately.",
          "A hallway console takes more wet than most furniture — umbrellas, bottles, damp coats. Wipe standing water off promptly rather than leaving it to dry on a finished timber top.",
        ],
      },
    ],
  },
  {
    id: "product-import-tarn-collection-large-pot-with-handles",
    title: "Tarn Large Pot with Handles | Kaiku",
    summary:
      "A large white ceramic pot with two integrated handles, 32 x 27 x 26cm and 4.9kg. Watertight, so it takes fresh flowers as well as dried. Indoor use only. Flowers not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Ceramic in a white, muted neutral finish, with a rounded body and two integrated handles set on either side.",
          "The handles are what give it presence. They break the outline of a plain round vessel and read as a reference to a traditional urn or water pot, which is why it holds its own on a surface without anything in it.",
        ],
      },
      {
        heading: "Watertight — Fresh Flowers as Well as Dried",
        paragraphs: [
          "The interior is watertight, which is the most useful thing to know about it. Many decorative ceramic pots are not sealed, which limits them to dried arrangements or to holding a plant still in its own plastic pot.",
          "Because this one holds water, it works as a genuine vase for fresh cut flowers — no liner, no inner container, no risk of water seeping through onto a wooden surface.",
          "It suits dried material just as well: its generous proportions take tall grasses, branches and architectural stems that would topple a narrower vase.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "32 x 27cm and 26cm tall, weighing 4.9kg empty.",
          "Wider than it is tall, so it suits an arrangement that spreads rather than one that stands upright — and it is stable enough that a top-heavy display of branches will not tip it.",
          "4.9kg before water and flowers is worth noting: filled, this is a two-handed lift, so fill it where it is going to stand rather than carrying it full.",
        ],
      },
      {
        heading: "Indoor Use, and Flowers Not Included",
        paragraphs: [
          "Indoor use only.",
          "The flowers and plants shown in the product photography are not supplied — what you receive is the pot.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the glaze with a damp cloth, avoiding abrasive cleaners and scouring pads, which scratch a glazed white surface and leave marks that show.",
          "Used with fresh flowers, wash it out properly between arrangements. Standing flower water leaves a stubborn ring inside a white pot and is what makes the next arrangement fade faster.",
        ],
      },
    ],
  },
  {
    id: "product-import-the-camden-collection-half-moon-3-tier-table",
    title: "Camden Half Moon 3 Tier Table | Kaiku",
    summary:
      "A half-moon console table in grey wood with three tiers of display space. 71 x 33 x 76cm, 8.5kg. Part of the Camden collection.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Wood in a grey finish, in a half-moon profile with three tiers, from the Camden collection.",
          "The half-moon shape is a practical form rather than only a decorative one. A flat back sits square against a wall while the curved front has no corners to catch a hip or a shin — which is precisely what you want from a table in a hallway or behind seating, where people pass close to it.",
        ],
      },
      {
        heading: "Three Tiers",
        paragraphs: [
          "Three levels rather than one surface, which multiplies what a table of this footprint can hold and lets a display be arranged in depth instead of in a row.",
          "In practice the top tier takes a lamp or a vase, and the lower two hold books, ceramics, plants, candles, framed photographs or sculptural objects. The lower tiers are also where things can be kept accessible without cluttering the surface you actually look at.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Behind a sofa, the half-moon profile is at its most useful: the flat edge meets the sofa back while the curve faces into the room, so the piece closes the back of a seating group without presenting a sharp corner to anyone walking past.",
          "In a hallway or entrance it works as the drop-point table, and the curved silhouette reads as more considered than a plain rectangle in a space people move through.",
          "Beneath a mirror or a piece of artwork it makes a natural pairing — a wall feature above, a tiered surface below.",
        ],
      },
      {
        heading: "Dimensions",
        paragraphs: [
          "71cm wide, 33cm deep and 76cm tall, weighing 8.5kg.",
          "33cm of depth at the deepest point of the curve is shallow, which is what allows it in a hallway. 76cm is standard console height, so it sits at a comfortable level to reach across and above the back of most sofas.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth — three tiers means three times the dusting, and the lower tiers collect more than the top.",
          "Wipe marks with a barely damp cloth and dry immediately, and use mats under plants and drinks. Standing water marks a finished timber surface, and it shows on a grey finish.",
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
    "docs/change-log/2026-09-02-rewrite-short-descriptions-batch5.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
