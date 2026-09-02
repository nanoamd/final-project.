/**
 * Batch 8 — 13 more short published descriptions.
 *
 * The Hampton and Grafton ranges dominate this group, and both have a
 * material story the source data names without explaining. Written once as
 * shared constants below and used across the range, because the explanation
 * is identical and it is the most useful thing to tell someone about either
 * finish.
 *
 * The packed weights in this batch are the standout unused facts. The Hampton
 * TV unit is 85kg, 90kg boxed, in a 168cm carton; the Grafton chest is 67kg,
 * 72kg boxed. Those were sitting in `specs` while the descriptions said
 * nothing, and they are the difference between a delivery that works and one
 * that gets refused at the door.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch8.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch8.ts --apply
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

const SHAGREEN = [
  "Shagreen is stingray leather, with a surface of fine raised pebbles or beads. It was a signature material of Art Deco furniture in the 1920s and 30s, valued for that texture and for how well it took a pale dye.",
  "This is faux shagreen: the pebbled grain reproduced without the animal product, and considerably more durable and easier to maintain than the original. The texture is the whole point of the piece — it catches light across the raised grain and shifts as you move past it, which is what gives an otherwise plain form its character.",
];

const SHAGREEN_CARE = [
  "Dust with a dry, soft brush rather than a cloth. A brush reaches between the raised beads; a cloth passes over the top of them.",
  "Keep liquid off the finish and wipe spills immediately. A pebbled texture holds moisture and cleaning residue down in the grain, where it dries as visible marks — which shows far more on a pale finish than a dark one.",
];

const GRAFTON_MATERIALS = [
  "Solid oak drawer fronts with a faux concrete-effect top, on a slate grey metal frame with industrial handles.",
  "The combination is the design rather than a compromise. Concrete-effect gives the cool industrial surface, real oak brings visible natural grain and warmth to break it up, and the metal frame ties them together.",
  "The drawer fronts are genuine solid oak, so the grain is real timber rather than a printed effect — which matters, because that is the part you look at closely and touch every day.",
];

const GRAFTON_CARE = [
  "Clean with a soft dry or slightly damp cloth and wipe spills immediately. Avoid harsh chemicals and abrasive cleaners.",
  "The two surfaces want different treatment. Standing water on the solid oak raises the grain and leaves a ring that will not wipe off, so dry it at once. The concrete-effect top handles water better but scratches, being a surface finish rather than solid stone — keep grit off it and use mats under anything heavy.",
];

export const REWRITES: Written[] = [
  {
    id: "product-import-leckford-oak-ribbed-occasion-table",
    title: "Leckford Ribbed Black Oak Occasional Table | Kaiku",
    summary:
      "A tall round occasional table with a ribbed base, in oak, oak veneer and MDF. 75cm across and 76cm high, 23kg. Assembly required, ships in two packages.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Oak, oak veneer and MDF, with a round top over a ribbed base.",
          "That mix of solid oak and veneer over a stable core is the standard construction for a wide round top, and there is a structural reason for it: solid timber moves with humidity, and a broad thin disc in solid oak is prone to cupping. A veneered core stays flat.",
          "The ribbing on the base is where the piece gets its character — vertical fluting that catches light down one side and holds shadow on the other, so the base reads as a column rather than a plain pedestal.",
        ],
      },
      {
        heading: "Unusually Tall for a Side Table",
        paragraphs: [
          "75cm across and 76cm high — as tall as it is wide, which is worth understanding before ordering.",
          "76cm is dining-table height, not the 45-60cm of a typical side table. So this does not sit beside a sofa the way a low side table does; it stands at arm height, level with a console.",
          "That makes it genuinely useful in specific places: beside a high-backed armchair, as a drinks table in a corner, in a larger bedroom as a bedside table where the bed is tall, or freestanding in a hallway. Beside a low modern sofa it would tower over the arm.",
          "The 75cm round top is generous — a real surface rather than a perch, with room for a lamp, books and drinks together.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Assembly is required, with instructions included, and it ships in two packages. The first box measures 39 x 39 x 82cm.",
          "At 23kg assembled, and with the weight concentrated in the base, this is easier to build in the room where it will stand than to build and then carry.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth, and use a barely damp cloth on marks, drying immediately.",
          "Use mats under drinks and plants. The vulnerable part of any veneered top is the edge — water sitting along a seam can penetrate and lift the veneer, and that does not reverse. A veneer layer is also too thin to sand a ring out of, unlike solid timber.",
          "The ribbing in the base collects dust in the grooves, where a soft brush works better than a cloth.",
        ],
      },
    ],
  },
  {
    id: "product-import-mickleton-cream-chenille-armchair",
    title: "Mickleton Cream Chenille Armchair | Kaiku",
    summary:
      "An armchair in cream chenille on a metal frame, with supportive cushioning. 66 x 76 x 79cm, 17.7kg (24.5kg boxed).",
    sections: [
      {
        heading: "Why Chenille",
        paragraphs: [
          "Chenille yarn is made with short fibres standing out from a core, like a caterpillar — which is what the word means in French. That gives a dense, soft pile that catches light differently depending on the angle.",
          "The practical result is that a single colour looks varied rather than flat: the fabric reads deeper in shadow and lighter where light falls across the pile. On a cream chair that matters more than it would on a dark one, because it is what stops a pale upholstery looking like a blank surface.",
          "Chenille is also hard-wearing for a soft fabric, which is why it turns up on furniture intended for daily use rather than occasional seating.",
        ],
      },
      {
        heading: "Design and Construction",
        paragraphs: [
          "Cream chenille upholstery over a metal frame, with generously cushioned seating designed for regular residential use.",
          "A metal frame is what holds a chair of this volume at 17.7kg, and allows a slimmer arm and base profile than timber of equivalent strength.",
        ],
      },
      {
        heading: "Dimensions and Room Fit",
        paragraphs: [
          "66cm wide, 76cm deep and 79cm high, weighing 17.7kg — 24.5kg boxed, in a carton of 73 x 85 x 86cm.",
          "66cm is narrow for an armchair, which is the useful part: it fits a bedroom corner, a landing, or a gap beside a fireplace where a wider chair will not, and a pair either side of a small table works in a room that could not take two large armchairs.",
          "The 76cm depth is generous relative to that width, so it is a chair to sit back into rather than perch on.",
        ],
      },
      {
        heading: "Cream Chenille — Worth Thinking About",
        paragraphs: [
          "The fabric is the consideration rather than the construction. In a bedroom, a reading corner or an adult household, cream chenille stays looking as it arrived for years. As the main chair in a family room with young children or pets, it will not.",
        ],
      },
      {
        heading: "Chenille Care",
        paragraphs: [
          "Vacuum regularly with a soft upholstery attachment. Chenille's pile traps dust and grit down between the fibres, and that grit is what abrades the pile over time — well before staining becomes the issue.",
          "Blot spills immediately and never rub. Rubbing chenille crushes and flattens the pile, and a flattened patch catches light differently from the rest, so it stays visible even after the mark itself has gone.",
          "If a well-used seat does flatten, brushing the pile back in one direction lifts it.",
        ],
      },
    ],
  },
  {
    id: "product-import-symi-slim-table-lamp",
    title: "Symi Slim Table Lamp | Kaiku",
    summary:
      "A handcrafted table lamp with a slim white wooden base with distressed edges, under a linen shade. 22 x 22 x 45cm, 0.72kg. Takes an E14 bulb, not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A handcrafted white wooden base with subtle distressed detailing around the edges, under a complementary linen shade.",
          "The distressing is deliberate wear along the edges and corners, where a real piece would rub back over years of use. On a white finish that has a practical benefit as well as a visual one: new knocks blend into the existing character instead of standing out as fresh damage.",
          "Being handcrafted, the way the distressing falls varies between individual lamps.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "Takes an E14 screw bulb — the small screw cap, not the larger E27. Not included, so order one with the lamp.",
          "A low-wattage warm LED suits a shade this size. It keeps heat out of the fabric and stops the light being uncomfortably bright at close range on a bedside table.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "22 x 22cm and 45cm tall, weighing 0.72kg.",
          "45cm is classic bedside height and the 22cm footprint is genuinely compact, so it works on a small nightstand with room left for a book and a glass — which many lamps in this height range do not.",
          "At 0.72kg it is very light. Worth knowing, because a lamp this light can be pulled over by its own cable if the flex is under tension — let the cable fall slack rather than running it tight to a socket.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust the wooden base with a dry cloth. Keep water off it: a distressed white finish is a thin surface treatment, and a damp cloth can lift or streak it.",
          "Brush the linen shade or use a vacuum brush attachment rather than wiping — water marks natural linen and dries as a visible line.",
        ],
      },
    ],
  },
  {
    id: "product-import-hampton-bedside-table",
    title: "Hampton Grey Bedside Table | Kaiku",
    summary:
      "A bedside table in grey faux shagreen with one drawer on metal runners, and antique brass-style legs and handle. 56 x 46 x 66cm, 28kg. Minimal assembly.",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: SHAGREEN,
      },
      {
        heading: "The Drawer and Its Runners",
        paragraphs: [
          "One spacious drawer, fitted with quality metal runners.",
          "Metal runners are worth calling out because they are the part of a drawer that decides whether it is still pleasant to use in five years. A drawer running on bare timber or plastic gets stiff and starts to rack; a metal runner keeps it moving smoothly and takes the weight of a full drawer without sagging.",
          "Antique brass-style metal legs and handle complete it — a warm metal against the cool grey shagreen.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "56cm wide, 46cm deep and 66cm tall, weighing 28kg. Boxed, it measures 65 x 57 x 65cm.",
          "66cm is taller than most bedside tables, which suits a taller bed — the surface sits at or above mattress level rather than below it.",
          "28kg is heavy for a bedside table and reflects a solid wooden carcass rather than a light frame. It is a two-person lift, and worth positioning before loading.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Minimal assembly is required — typically the legs and handle after delivery, which keeps them protected in transit.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: SHAGREEN_CARE,
      },
    ],
  },
  {
    id: "product-import-hampton-ivory-octagonal-mirror",
    title: "Hampton Ivory Octagonal Wall Mirror | Kaiku",
    summary:
      "An octagonal wall mirror framed in ivory faux shagreen. 80 x 80cm, 2.5cm deep, weighing 10kg (20kg boxed).",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: [
          ...SHAGREEN,
          "In ivory the texture does even more work, because a pale low-contrast surface relies entirely on relief for its interest.",
        ],
      },
      {
        heading: "The Octagonal Shape",
        paragraphs: [
          "An octagon sits between a square and a circle, and that is exactly why it is useful. It has the geometric discipline to line up with rectangular furniture beneath it, while the cut corners soften the outline so it does not read as another box on the wall.",
          "It is also symmetrical in every direction, so there is no right way up and no wrong wall for it — considerably easier to place than a rectangular mirror.",
        ],
      },
      {
        heading: "Dimensions and Hanging",
        paragraphs: [
          "80 x 80cm and 2.5cm deep, weighing 10kg. Boxed it is 88 x 88 x 10cm and 20kg — the packaging doubles the weight, which is worth knowing for the delivery rather than the wall.",
          "10kg needs a proper fixing. Into masonry, screws into correctly sized wall plugs are fine. In plasterboard, fix into a stud or use heavy-duty cavity anchors rated well above the weight — ordinary plastic plugs are not adequate at 10kg.",
          "Two fixing points spread apart rather than a single central hook keeps it level over time and halves the load on each.",
          "Above a console or sideboard, hang it so the bottom of the frame sits 15-25cm above the surface, which reads as a pair rather than two unrelated objects.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Hallways, living rooms, bedrooms, dining rooms and dressing rooms. It suits contemporary, Art Deco, modern classic and transitional schemes, which follows directly from the material's own history.",
          "Hung on a wall opposite or adjacent to a window it bounces daylight back into the room, which makes a real difference in a north-facing space or a dark hallway.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Use a quality glass cleaner sprayed onto the cloth, never onto the mirror. This matters more than on a plain frame: liquid running down reaches the shagreen texture, which holds it in the grain and dries as visible marks on ivory.",
          ...SHAGREEN_CARE,
        ],
      },
    ],
  },
  {
    id: "product-import-grafton-1-drawer-black-bedside-table",
    title: "Grafton Black Bedside Table | Kaiku",
    summary:
      "A bedside table with a solid oak drawer front and a faux concrete-effect top on a metal frame. 45 x 40 x 60cm, 16kg.",
    sections: [
      {
        heading: "Three Materials, Deliberately",
        paragraphs: GRAFTON_MATERIALS,
      },
      {
        heading: "Dimensions and Bedroom Fit",
        paragraphs: [
          "45cm wide, 40cm deep and 60cm tall, weighing 16kg. Boxed it measures 49 x 45 x 65cm.",
          "45 x 40cm is compact — sized for a smaller bedroom or a guest room, or the narrow gap between a bed and a wall where a wider unit will not go.",
          "60cm is close to standard mattress height, so the top sits roughly level with the bed. That is the height that makes a bedside table comfortable to reach across rather than down into.",
          "One drawer takes the things that otherwise sit on top and make a bedroom look untidy — chargers, glasses, a book.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "The oak, metal and concrete-effect combination places it in industrial, contemporary, Scandinavian, urban loft and modern rooms.",
          "A pair either side of a bed reads as deliberate; the collection also runs to a chest of drawers, console and end table if you want the room to match.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: GRAFTON_CARE,
      },
    ],
  },
  {
    id: "product-import-grafton-black-chest-of-drawers",
    title: "Grafton Black Chest of Drawers | Kaiku",
    summary:
      "A three-drawer chest with solid oak drawer fronts, a faux concrete top and a slate grey metal frame. 90 x 50 x 85cm, 67kg (72kg boxed).",
    sections: [
      {
        heading: "Materials",
        paragraphs: [
          ...GRAFTON_MATERIALS,
          "Distressed slate grey oak detailing runs through the carcass, which is what keeps the piece coherent rather than reading as three unrelated materials bolted together.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: [
          "Three large drawers, sized for clothing, bedding, towels, accessories and paperwork.",
          "Three deep drawers rather than four or five shallow ones is the more useful configuration for bulky items — folded jumpers, spare bedding and towels need depth, and a shallow drawer forces them to be squashed flat.",
        ],
      },
      {
        heading: "Dimensions and Delivery Weight",
        paragraphs: [
          "90cm wide, 50cm deep and 85cm tall, weighing 67kg — 72kg boxed, in a carton of 96 x 56 x 91cm.",
          "67kg is the figure to plan around, and it is the heaviest thing in this batch after the TV unit. This is firmly a two-person delivery and a two-person move, and it is not something to reposition once it is loaded with clothing.",
          "Measure the route in before it arrives — a 96cm carton through a hallway turn or a stair landing is the usual constraint, more than the weight is. Check the diagonal at the tightest point, since a large box can often be turned through an opening it will not pass square.",
          "85cm tall puts the top at a usable height for a lamp, a tray or framed pictures.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Clean regularly with a soft, dry or slightly damp cloth and wipe spills immediately.",
          ...GRAFTON_CARE.slice(1),
        ],
      },
    ],
  },
  {
    id: "product-import-hampton-ivory-square-bedside",
    title: "Hampton Ivory Square Bedside Table | Kaiku",
    summary:
      "A square bedside table in ivory faux shagreen with one drawer on metal runners and a walnut-effect interior. 45 x 45 x 60cm, 10kg.",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: SHAGREEN,
      },
      {
        heading: "The Drawer",
        paragraphs: [
          "One drawer on premium metal runners, with a walnut-effect interior.",
          "Metal runners are the part that decides whether a drawer is still pleasant to use years later — a drawer running on bare timber gets stiff and starts to rack, where a runner keeps it smooth under a full load.",
          "The walnut-effect lining is a genuine detail rather than decoration: a finished interior protects what is stored in it from a raw board surface, and it means the drawer looks finished when it is open, not just closed.",
        ],
      },
      {
        heading: "Dimensions and Bedroom Fit",
        paragraphs: [
          "45 x 45cm square and 60cm tall, weighing 10kg. Boxed it measures 56 x 53 x 72cm.",
          "60cm is close to standard mattress height, so the top sits level with the bed rather than below it.",
          "A 45cm square footprint is compact enough for a smaller bedroom while still taking a lamp and a book together. At 10kg it is a one-person move, unlike the heavier grey Hampton bedside.",
          "A pair either side of a bed is what makes a bedroom look composed rather than assembled.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: SHAGREEN_CARE,
      },
    ],
  },
  {
    id: "product-import-hampton-brown-console-table",
    title: "Hampton Brown Shagreen Console Table | Kaiku",
    summary:
      "A console table in brown faux shagreen with two drawers on metal runners and walnut-effect interiors. 122 x 38 x 81cm, 24kg. Minimal assembly.",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: SHAGREEN,
      },
      {
        heading: "Two Drawers, Properly Made",
        paragraphs: [
          "Two spacious drawers on smooth metal runners, with walnut-effect interiors.",
          "On a hallway console the drawers are what stop the top becoming a dumping ground — keys, post and chargers go in rather than accumulating in view.",
          "Metal runners matter on a piece used many times a day: they keep the drawers moving smoothly under load rather than sticking and racking the way timber-on-timber eventually does.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "122cm wide, 38cm deep and 81cm tall, weighing 24kg. Boxed it is 130.5 x 49.5 x 28.5cm and 30kg.",
          "38cm is genuinely slim, which is what makes it a hallway piece: 122cm of surface and two drawers while projecting well under half a metre, so a corridor stays passable.",
          "81cm is slightly taller than a standard table, putting the top at a comfortable height to drop things onto as you come through the door.",
          "It also works behind a sofa, closing the back of a seating group in an open-plan room, or against a dining room wall as a serving surface.",
          "The flat 28.5cm boxed depth is helpful — it goes through doorways and up stairs far more easily than a fully assembled console of this weight would.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Minimal assembly: the legs and handles attach after delivery, which keeps them protected in transit and makes the carton easier to get into the room.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: SHAGREEN_CARE,
      },
    ],
  },
  {
    id: "premier-housewares-5506459",
    title: "Jada Small Striped Planter | Kaiku",
    summary:
      "A small glazed ceramic planter with a striped design, 15 x 15 x 13cm. Not dishwasher safe.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Glazed ceramic — around 90% ceramic to 10% glaze — with a striped design.",
          "The glaze is what makes it usable as a planter rather than only a decorative object. It seals the ceramic, so the pot does not weep moisture through its walls onto a windowsill or shelf the way unglazed terracotta will, and it does not develop the pale salt bloom terracotta gets over a season.",
          "Stripes on a small pot work harder than a plain finish: a vertical pattern draws the eye up into the planting rather than stopping at the rim.",
        ],
      },
      {
        heading: "Size and What Fits",
        paragraphs: [
          "15 x 15cm and 13cm tall.",
          "This is a small planter, sized for a plant currently in an 11-12cm nursery pot — succulents, small foliage plants or trailing greenery. Anything larger will be root-bound quickly.",
          "The 15cm footprint fits a windowsill, shelf, desk or bedside table, which is where a larger planter cannot go.",
        ],
      },
      {
        heading: "Planting and Watering",
        paragraphs: [
          "Because glazed ceramic does not breathe, water leaves the compost through the surface rather than through the pot walls, so it dries out more slowly than terracotta. Check the top of the compost with a finger before watering rather than watering to a schedule — overwatering is the usual way plants die in glazed pots.",
          "The simplest method is to keep the plant in its plastic nursery pot and sit that inside: lift it out, water over a sink, let it drain fully, then return it. The roots never stand in water and the glaze stays clean.",
          "Empty it weighs very little, but filled with damp compost it is meaningfully heavier — handle it with care when moving it planted.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft cloth and do not use abrasive cleaners, which scratch a glazed surface and dull the pattern permanently.",
          "Not dishwasher safe — hand wipe only.",
        ],
      },
    ],
  },
  {
    id: "product-import-hampton-ivory-tv-unit",
    title: "Hampton Ivory Shagreen TV Unit | Kaiku",
    summary:
      "A TV unit in ivory faux shagreen with fixed internal shelving behind two doors. 160 x 50 x 55cm, 85kg (90kg boxed). Handles attach after delivery.",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: SHAGREEN,
      },
      {
        heading: "Size and What Television It Takes",
        paragraphs: [
          "160cm wide, 50cm deep and 55cm tall.",
          "At 160cm this suits medium and large televisions. The rule worth applying is that the unit should be wider than the screen — a 55-inch television is around 123cm wide and a 65-inch around 145cm, so both sit comfortably within 160cm with the stand feet supported rather than overhanging.",
          "55cm of height is the other figure to check. Seated, the middle of the screen wants to be roughly at eye level, so a tall unit plus a tall television can put the picture uncomfortably high — worth measuring against your sofa.",
          "The 50cm depth takes the feet of most large televisions and gives real capacity behind the doors.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: [
          "Fixed internal shelving behind two doors, for media equipment and everyday accessories.",
          "Doors rather than open shelving is the practical choice in front of a television: a set-top box, console and cables read as clutter directly beneath a screen, and closing them away leaves the television as the only thing in view.",
          "Because the shelving is fixed rather than adjustable, it is worth measuring the height of any equipment you intend to house before ordering.",
        ],
      },
      {
        heading: "Weight and Delivery — Plan This First",
        paragraphs: [
          "85kg, and 90kg boxed in a carton of 168 x 64 x 74cm. This is the heaviest piece in the range and the number to resolve before ordering rather than on the day.",
          "90kg in a 168cm box is a two-person delivery at absolute minimum, and the carton has to physically pass through every door and hallway turn between the street and the room. Measure the narrowest point on that route — usually a hallway turn or a stair landing rather than the front door — and check the diagonal.",
          "Have the route clear and the final position decided before it arrives. An 85kg unit is not something to be shuffling across a room afterwards.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "The handles are supplied detached to protect them in transit, and attach simply after delivery. Otherwise the unit arrives built.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: SHAGREEN_CARE,
      },
    ],
  },
  {
    id: "premier-housewares-5528624",
    title: "Manado Black Natural Rattan And Teak Chair | Kaiku",
    summary:
      "A chair in teak and natural rattan with a black finish, 63 x 68 x 97cm and 6kg. Assembly required, ships in one carton. Made in Indonesia.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Teak with natural rattan, in a black finish. Made in Indonesia, which is where both materials traditionally come from and where the weaving is done.",
          "Teak is the reason this pairing works. It is exceptionally high in natural oils and silica, which is what makes it the benchmark timber for furniture that has to cope with moisture — it resists rot and insect attack without treatment, where most hardwoods do not.",
          "The rattan supplies the woven texture and some give in the seat and back, while the teak frame carries the load.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "63cm wide, 68cm deep and 97cm tall, weighing just 6kg.",
          "97cm is a tall back — well above dining-chair height — so the chair supports the shoulders and head rather than only the lower back, and it reads as a substantial piece despite its light weight.",
          "6kg is remarkably light for a chair this size, which is the practical advantage of a rattan-and-teak build: it can be carried with one hand and repositioned around a garden or terrace as the sun moves.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Assembly is required and it ships in one carton measuring 92 x 72 x 61cm.",
          "Locate every fixing before tightening any of them fully, then work around the frame. On a four-legged chair that is what stops a rock developing.",
        ],
      },
      {
        heading: "Cushions",
        paragraphs: [
          "Cushions are not part of this listing — what you receive is the chair. The woven rattan seat is designed to be sat on directly, though a seat pad makes it more comfortable for long periods.",
        ],
      },
      {
        heading: "Outdoor Use and Care",
        paragraphs: [
          "Teak handles the weather; natural rattan is the element that does not. Rattan absorbs moisture, and repeated wetting and drying slackens the weave and eventually splits the fibres.",
          "In practice that makes this a covered-terrace, conservatory or indoor chair rather than one to leave standing out through a British winter. Under cover it will last for years.",
          "Clean with a dry, soft cloth, and use a soft brush or vacuum attachment on the weave, which holds dust where a cloth cannot reach.",
        ],
      },
    ],
  },
  {
    id: "product-import-hampton-ivory-2-nest-tables",
    title: "Hampton Ivory Shagreen Nest of Tables | Kaiku",
    summary:
      "A nest of two tables in ivory faux shagreen on metal frames. 39 x 39 x 54cm, 7kg for the set.",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: SHAGREEN,
      },
      {
        heading: "How a Nest of Tables Works",
        paragraphs: [
          "Nesting tables are a set designed to store one underneath the other, so they occupy the footprint of a single table until you need more surface.",
          "That is the entire argument for them, and it is a good one in a room short of space. Nested, they are one side table; pulled apart, they are two — for a second drink, a laptop, a tray of food in front of the sofa — and then they go back.",
          "They also work permanently separated, positioned independently around a room as side tables, lamp tables or occasional tables. Nothing about them requires being kept as a pair.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "39 x 39cm and 54cm tall at the larger table, weighing 7kg for the set. Boxed the set is 47 x 47 x 66cm and 10kg.",
          "54cm sits at or just above the arm of most sofas, which is the right height for setting a drink down without leaning.",
          "The 39cm square footprint is compact, and at 7kg for both, either table can be moved around one-handed — which is what makes the flexible arrangement actually get used rather than left nested permanently.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          ...SHAGREEN_CARE,
          "Use mats under drinks. A textured finish is harder to clean a spill from than a flat lacquered top, because liquid settles into the grain.",
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
    "docs/change-log/2026-09-02-rewrite-short-descriptions-batch8.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
