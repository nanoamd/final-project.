/**
 * Batch 2 of the roadmap's remaining guides: Sofas (2) and Coffee Tables (1).
 *
 * Sofa sizing pairs with the new `sofa-size` tool. Fabric-vs-leather was the
 * roadmap's original framing for the second sofa guide, but the catalogue
 * was checked before writing it (the same discipline the VAT and Furniture
 * To Go mistakes this session were caught by) — Kaiku sells zero leather
 * sofas, only velvet, linen, fabric weave and chenille. The guide is honest
 * about that rather than pretending a leather option exists to sell.
 *
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch2.ts --apply
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

const SOFA_SIZE_PRODUCT_IDS = [
  "premier-housewares-2405924", // Hansa 3 Seat Black Velvet, 210x79
  "premier-housewares-2406679", // Hasna 3 Seat Grey Velvet, 189x100
  "premier-housewares-5528140", // Ralph 3 Seat Mink Velvet, 220x96
  "premier-housewares-5529909", // Anglet Cream Large 3 Seater, 264x100
  "premier-housewares-5528142", // Ralph 3 Seat Right Chaise Mink Velvet, 273x165
  "premier-housewares-5529743", // Ordona Cream Linen Curved 3 Seater, 272x99.5
  "product-import-candover-neutral-sofa", // Candover Neutral Upholstered, 210.5x98
  "product-import-vellis-wingback-armchair", // Vellis Blue Wingback Armchair, 84x76
];

const CHOOSING_SOFA_PRODUCT_IDS = [
  "premier-housewares-2405938", // Helia 3 Seat Olive Velvet
  "premier-housewares-5528781", // Siena 3 Seat Midnight Velvet
  "premier-housewares-5527896", // Surina 3 Seat Stone Fabric
  "premier-housewares-5529745", // Avignon 3 Seat Textured Fabric Cream
  "product-import-himbleton-green-sofa", // Himbleton Green 3 Seater
  "product-import-mickleton-cream-chenille-armchair", // Mickleton Cream Chenille Armchair
  "premier-housewares-5528142", // Ralph 3 Seat Right Chaise Mink Velvet
  "product-import-wadborough-neutral-sofa", // Wadborough 3 Seater Neutral
];

const COFFEE_TABLE_PRODUCT_IDS = [
  "premier-housewares-5529835", // Palermo Round Travertine
  "product-di-di-crofton-ct-wh", // Crofton White Marble
  "premier-housewares-5528863", // Imperia Round Grey Glass and Ceramic
  "premier-housewares-5528860", // Imperia 2 Tier Asymmetrical Ceramic
  "premier-housewares-5527876", // Ulmus Black Elm Wood
  "product-di-di-bentley-ct-oak", // Bentley Coffee Table in Oak
  "product-import-the-serene-rattan-collection-coffee-table", // Serene Rattan
  "product-aw-rwa-01", // Tamarind & Resin – Aqua
];

const GUIDES: GuideSpec[] = [
  {
    id: "guide-sofa-size-for-your-room",
    title: "What size sofa for your room, seat by seat?",
    slug: "sofa-size-for-your-room",
    excerpt:
      "There's no official sofa-size standard the way there is for a UK bed — a 2-seater runs 140-180cm, a 3-seater 198-229cm, both around 85-100cm deep. What that means for a small room, why corner sofas need measuring differently, and eight of our own sofas checked against the rules.",
    categoryId: "category-sofas",
    relatedProductIds: SOFA_SIZE_PRODUCT_IDS,
    seo: {
      title: "What Size Sofa for Your Room? Sofa Size Guide | Kaiku",
      description:
        "2-seater 140-180cm, 3-seater 198-229cm, both ~85-100cm deep — there's no fixed standard. The room each needs, corner sofas measured differently, 8 real sofas checked.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "Unlike a UK bed, no standard sets sofa dimensions — every maker cuts its own frame. In practice a 2-seater runs 140-180cm wide, a 3-seater 198-229cm, both roughly 85-100cm deep once the back cushion is included. What follows is the room each size actually needs, why a corner or chaise sofa can't be checked the same way, and eight of our own sofas measured against the rules.",
      );
      p(
        "The short version: measure the wall the sofa will back onto, and the floor space in front of it to the coffee table or the nearest walkway. Both numbers matter — a sofa that fits the wall can still make a room feel cramped if there's nowhere to put your feet or get past it.",
      );
      b.push(
        table(
          "b",
          n,
          "Sofa size by seat count",
          ["Size", "Typical width", "Typical depth"],
          [
            ["2-seater", "140-180cm", "85-100cm"],
            ["3-seater", "198-229cm", "85-100cm"],
            ["4-seater / large", "230-270cm", "90-110cm"],
            ["Corner / chaise", "measure each leg of the L separately", "—"],
          ],
        ),
      );
      n += 1;
      b.push(tool("b", n, "sofa-size", "Your wall, your room, your size"));
      n += 1;
      p("Rule one. There's a range, not a spec", "h2");
      p(
        "A bed's dimensions are fixed by convention; a sofa's aren't. Two 3-seaters can differ by 30cm and both be sold under the same name, which is why this guide gives a range to shop within rather than one number to expect from every listing.",
      );
      p(
        "Always check the exact model's own dimensions before assuming it matches the category average — especially at the wide end, where a deep-seat or wide-arm design can run 20-30cm over a standard frame of the same seat count.",
      );
      p(
        "Rule two. Forty-five centimetres in front, ninety if it's a walkway",
        "h2",
      );
      p(
        "In front of a sofa, 45cm is the minimum to reach a coffee table without standing up — comfortable is closer to 60cm. Where that same space is also how people reach the rest of the room, it wants 90cm instead, the same figure this site uses everywhere for 'a person can pass.'",
      );
      p(
        "This is the clearance people forget to check. A sofa that fits the wall on paper can still leave a room feeling blocked if the floor in front of it was never measured against anything.",
      );
      p("Rule three. A corner sofa is not a rectangle", "h2");
      p(
        "A corner or chaise sofa's footprint is an L, and the two legs are almost never the same length — our own Ralph chaise runs 273cm on its long side and 165cm on the return. Checking whether it fits means measuring both legs against the two walls they'll actually sit along, not one width-and-depth pair the way a straight sofa works.",
      );
      p(
        "This is exactly why the calculator above only covers straight sofas: a single fit check on a shape that isn't a rectangle would either wrongly pass a corner sofa that won't fit, or wrongly fail one that will.",
      );
      p("Rule four. A small room is often two smaller pieces, not one", "h2");
      p(
        "Where a single 3-seater doesn't leave enough clearance, a 2-seater plus an armchair frequently seats the same number in less combined wall space, and splits the seating across two walls instead of one long run. It also means one piece can be swapped or reupholstered without replacing the whole suite.",
      );
      p(
        "It costs something too: two separate pieces rarely match as precisely as a single sofa's own cushions do, and buying them separately is usually more expensive than one sofa of the equivalent size.",
      );
      p("Eight of our sofas, measured against the rules", "h2");
      p(
        "The same measurements, run over our own stock — straight sofas, a curved 3-seater, a chaise, and an armchair for the small-room alternative.",
      );
      b.push(
        table(
          "b",
          n,
          "Our sofas, measured",
          ["Sofa", "Width", "Depth", "Shape"],
          [
            ["Hansa 3 Seat Black Velvet", "210cm", "79cm", "Straight"],
            ["Hasna 3 Seat Grey Velvet", "189cm", "100cm", "Straight"],
            ["Ralph 3 Seat Mink Velvet", "220cm", "96cm", "Straight"],
            [
              "Anglet Cream Large 3 Seater",
              "264cm",
              "100cm",
              "Straight, large",
            ],
            [
              "Ralph 3 Seat Right Chaise Mink Velvet",
              "273cm long side",
              "165cm return",
              "Chaise — measure both legs",
            ],
            ["Ordona Cream Linen Curved 3 Seater", "272cm", "99.5cm", "Curved"],
            [
              "Candover Neutral Upholstered Sofa",
              "210.5cm",
              "98cm",
              "Straight",
            ],
            ["Vellis Blue Wingback Armchair", "84cm", "76cm", "Armchair"],
          ],
        ),
      );
      n += 1;
      p(
        "The wingback armchair at the bottom is there on purpose — it's the small-room alternative from rule four, not an afterthought. Pair it with a 2-seater from elsewhere in the range and the combined width is often less than one of the large 3-seaters above.",
      );
      p("The short version", "h2");
      p(
        "There's no fixed sofa standard — 2-seater 140-180cm, 3-seater 198-229cm, both roughly 85-100cm deep, and always check the exact model. Leave 45cm in front for a coffee table, 90cm where that space is also a walkway. Measure a corner or chaise sofa's two legs separately rather than trying to fit it into one width-and-depth check.",
      );
      return b;
    })(),
    faqs: [
      [
        "What is the standard size of a 3-seater sofa?",
        "There is no fixed standard, but most fall between 198cm and 229cm wide and 85-100cm deep including the back cushion. Always check the exact model — a deep-seat or wide-arm design can run wider than the category suggests.",
      ],
      [
        "How much space do you need in front of a sofa?",
        "45cm is the minimum to reach a coffee table without standing. If that space is also how people reach the rest of the room, allow 90cm so someone can pass without climbing over the table.",
      ],
      [
        "Will a 3-seater sofa fit a small living room?",
        "Most 3-seaters need about 210cm of wall and 95cm of depth before clearance. In a small room, a 2-seater plus an armchair often seats the same number in less combined wall space than one long 3-seater.",
      ],
      [
        "How do I measure a corner sofa for fit?",
        "Measure each leg of the L separately against the wall it will sit along, including the depth each leg projects into the room. A corner sofa's total footprint is rarely symmetrical, so a single width figure won't tell you whether it fits.",
      ],
      [
        "Does a curved sofa need more space than a straight one?",
        "Roughly the same footprint as a straight sofa of the same seat count — measure its widest point and its deepest point the same way, since the curve itself doesn't usually add much beyond the bounding rectangle those two measurements describe.",
      ],
    ],
  },
  {
    id: "guide-choosing-a-sofa",
    title: "Corner, 3-seater or two smaller pieces — and which fabric?",
    slug: "choosing-a-sofa",
    excerpt:
      "A straight answer on fabric versus leather first: we don't currently sell a leather sofa, only velvet, linen, textured weave and chenille — so the real choice is which fabric suits your household, and whether one sofa or two pieces seats your room better.",
    categoryId: "category-sofas",
    relatedProductIds: CHOOSING_SOFA_PRODUCT_IDS,
    seo: {
      title: "Corner, 3-Seater, or Two Pieces — and Which Fabric? | Kaiku",
      description:
        "We sell velvet, linen, textured weave and chenille sofas, not leather — here's which fabric suits your household, and whether corner, 3-seater or two pieces fits your room.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "If you searched for fabric versus leather, the honest answer is that we don't currently stock a leather sofa — the range is velvet, linen, textured weave and chenille. If leather's wipe-clean durability is the priority, a tight, low-pile weave such as linen or boucle is the closest practical alternative in fabric, and the section below covers why.",
      );
      p(
        "The other decision — corner sofa, a single 3-seater, or a 3-seater plus an armchair — is about the room and the household as much as the fabric, and it's covered second.",
      );
      p("Rule one. Velvet looks the most expensive and shows the most", "h2");
      p(
        "Velvet's pile catches light in a way flat fabric doesn't, which is most of why it reads as the premium option. That same pile is what shows every mark: a cat's claws snag it permanently in a way a tighter weave shrugs off, and pressure marks from sitting in the same spot can flatten the nap enough to leave a visible patch.",
      );
      p(
        "It suits a room that gets careful use — an adult living room, a formal sitting room — better than a household with claws or muddy paws in daily rotation.",
      );
      p("Rule two. Linen and textured weave are the practical middle", "h2");
      p(
        "A linen or textured-weave fabric — flatter, tighter, less reflective than velvet — hides everyday marks better and generally cleans up easier. It's the fabric equivalent of what people are usually asking for when they ask about leather: wipeable, forgiving, not precious.",
      );
      p(
        "It doesn't have velvet's depth of colour or its light-catching finish, so a room built around a strong, saturated colour statement usually reaches for velvet instead — this is the trade-off, not a flaw in either fabric.",
      );
      p(
        "Rule three. Chenille is the softest and the most forgiving to sit on",
        "h2",
      );
      p(
        "Chenille's texture comes from a looped weave rather than a cut pile, which makes it soft to the touch and resistant to flattening the way velvet can. It reads more casual than velvet or a smooth linen weave, which suits a family room better than a formal one.",
      );
      p(
        "Where Kaiku sells it in armchairs rather than full sofas at the moment, pair a chenille armchair with a plain linen or textured sofa rather than another velvet piece — mixing a looped texture against a cut pile usually looks more deliberate than two different naps side by side.",
      );
      p("Rule four. Corner sofa, one 3-seater, or 3-seater plus a chair", "h2");
      p(
        "A corner sofa seats the most people for the wall space it uses, because the return leg turns a corner of the room into seating instead of dead space. It commits that corner permanently, though — it can't be turned to face a different way if the room gets rearranged later.",
      );
      p(
        "A single 3-seater is the most flexible of the three: it can be moved, turned, or paired with different chairs later without the corner-shape constraint. A 3-seater plus an armchair adds a seat without the corner sofa's depth, and lets the two pieces be reupholstered or replaced independently — useful if one takes more wear than the other.",
      );
      p("Our range, by fabric", "h2");
      p(
        "The same four fabrics, shown against real pieces so the difference in finish is something to look at rather than just read about.",
      );
      b.push(
        table(
          "b",
          n,
          "Our sofas and armchairs, by fabric",
          ["Piece", "Fabric", "Shape"],
          [
            ["Helia 3 Seat Olive Velvet", "Velvet", "Straight 3-seater"],
            ["Siena 3 Seat Midnight Velvet", "Velvet", "Straight 3-seater"],
            [
              "Surina 3 Seat Stone Fabric",
              "Textured weave",
              "Straight 3-seater",
            ],
            [
              "Avignon 3 Seat Textured Fabric Cream",
              "Textured weave",
              "Straight 3-seater",
            ],
            ["Himbleton Green 3 Seater", "Fabric", "Straight 3-seater"],
            ["Mickleton Cream Chenille Armchair", "Chenille", "Armchair"],
            [
              "Ralph 3 Seat Right Chaise Mink Velvet",
              "Velvet",
              "Chaise / corner-style",
            ],
            ["Wadborough 3 Seater Neutral", "Fabric", "Straight 3-seater"],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "No leather in the range — velvet, linen/textured weave, fabric and chenille instead. Velvet looks the richest and shows the most wear; linen and textured weave are the practical middle; chenille is the softest and most forgiving. A corner sofa seats the most for the space; a single 3-seater stays the most flexible; a 3-seater plus a chair splits the risk across two pieces.",
      );
      return b;
    })(),
    faqs: [
      [
        "Does Kaiku sell leather sofas?",
        "Not currently — the range is velvet, linen, textured weave and chenille. If leather's wipe-clean durability is what you're after, a tight, low-pile weave such as linen or boucle is the closest practical equivalent we stock.",
      ],
      [
        "Is velvet a good choice for a sofa with pets?",
        "Not the best one. Velvet's pile snags permanently on claws and can flatten under repeated pressure. A tighter weave — linen or a textured fabric — holds up better to daily pet use.",
      ],
      [
        "What's the difference between chenille and velvet?",
        "Chenille is looped rather than cut, which makes it softer and more resistant to flattening; velvet's cut pile is what gives it depth of colour and a light-catching finish, at the cost of showing marks and wear more readily.",
      ],
      [
        "Is a corner sofa or a 3-seater better for a family room?",
        "A corner sofa seats the most people for the wall space it uses and suits a room built around one main seating area. A 3-seater plus an armchair costs a little more floor space for two pieces that can be replaced or reupholstered independently.",
      ],
      [
        "Can I mix fabrics between a sofa and an armchair in the same room?",
        "Yes, and it often looks more deliberate than matching everything exactly — a chenille armchair against a plain linen or textured-weave sofa reads as a considered pairing rather than a mismatch. Avoid pairing two different cut-pile fabrics like velvet against velvet in different colours, which is more likely to look like an accident.",
      ],
    ],
  },
  {
    id: "guide-coffee-table-top-material",
    title: "What coffee table top material actually holds up?",
    slug: "coffee-table-top-material",
    excerpt:
      "Marble and travertine mark if you set a hot mug straight down; solid wood and veneer scratch but sand out; glass and ceramic wipe clean but show every fingerprint; rattan is the lightest and least fussy of the lot. Six materials, what each one actually costs you day to day.",
    categoryId: "category-coffee-tables",
    relatedProductIds: COFFEE_TABLE_PRODUCT_IDS,
    seo: {
      title: "What Coffee Table Top Material Holds Up Best? | Kaiku",
      description:
        "Marble marks from heat, wood scratches but sands out, glass wipes clean but shows fingerprints, rattan is the least fussy. What each coffee table material actually costs you day to day.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "There's no single best coffee table material — each one trades a different weakness for a different strength, and the right choice depends more on how the table actually gets used than on how it looks in a photo. Marble and travertine are cool, heavy and genuinely marked by heat and acid; solid wood and veneer scratch but can be sanded and refinished; glass and ceramic wipe clean in seconds but show every fingerprint and water ring; rattan is the lightest of the lot and shrugs off most of the above at the cost of looking less substantial.",
      );
      p(
        "What follows is what each material actually costs you day to day, not just how it looks new, and six of our own tables measured against the rules.",
      );
      b.push(
        table(
          "b",
          n,
          "Coffee table materials at a glance",
          ["Material", "Heat / marks", "Scratches", "Day-to-day care"],
          [
            [
              "Marble / travertine",
              "Marks from heat and acid — use coasters",
              "Chips rather than scratches",
              "Occasional resealing",
            ],
            [
              "Solid wood",
              "Tolerates heat better with a mat",
              "Scratches, but sands out",
              "Occasional oiling or waxing",
            ],
            [
              "Wood veneer",
              "Tolerates heat with a mat",
              "Scratches don't sand out",
              "Wipe clean, avoid standing water",
            ],
            [
              "Glass / ceramic",
              "Tolerates heat well",
              "Doesn't scratch easily",
              "Shows fingerprints and water rings",
            ],
            [
              "Rattan",
              "Avoid direct heat",
              "Resists scuffs",
              "Dust and occasional wipe",
            ],
          ],
        ),
      );
      n += 1;
      p(
        "Rule one. Stone is heavy, cool, and permanently marked by the wrong drink",
        "h2",
      );
      p(
        "Marble and travertine are porous enough that a splash of wine, coffee or lemon juice left to sit can etch a dull mark into the polish that won't wipe away — this is a real property of the stone, not a manufacturing fault. A coaster habit is the actual maintenance requirement, more than any cleaning product.",
      );
      p(
        "What you get in return is genuine weight and a cool touch that engineered materials don't quite replicate, plus a surface that shrugs off scratches other materials can't — stone chips under real force rather than scoring under everyday use.",
      );
      p("Rule two. Solid wood ages; veneer doesn't get a second chance", "h2");
      p(
        "A solid wood top can be sanded back and refinished when it scratches or a ring appears, which is the real advantage over veneer — the same damage on a veneer top cuts through the thin real-wood layer to the substrate beneath, and can't be sanded out the same way. Both need a mat under anything genuinely hot.",
      );
      p(
        "Veneer costs less for the same look precisely because it's a thin skin over engineered board rather than a solid block — a reasonable trade for most living rooms, as long as the scratch-and-refinish difference above is the one you're accepting rather than discovering later.",
      );
      p(
        "Rule three. Glass and ceramic are the easiest to keep clean, and the easiest to see needs cleaning",
        "h2",
      );
      p(
        "Both wipe completely clean in seconds and don't scratch under normal use, which is why they suit a household that wants zero maintenance beyond a cloth. The trade-off shows up between cleanings: every fingerprint, dust mote and water ring is visible on a reflective surface in a way it simply isn't on stone or wood.",
      );
      p(
        "This is the material to pick if the table gets wiped down often anyway — next to a sofa in daily use — and the one to avoid if the table is more decorative than functional and won't get that same attention.",
      );
      p(
        "Rule four. Rattan is the lightest and least fussy, and the least substantial",
        "h2",
      );
      p(
        "A rattan-topped table resists scuffs and everyday knocks better than most of the materials above, and it's light enough to move for cleaning or rearranging without help. It doesn't tolerate standing water or direct heat well, and it reads as more casual than stone, wood or glass — right for a relaxed living room, less so for a formal one.",
      );
      p("Six of our tables, by material", "h2");
      p("The same six materials, against real pieces currently in stock.");
      b.push(
        table(
          "b",
          n,
          "Our coffee tables, by material",
          ["Table", "Top material", "Price"],
          [
            ["Palermo Round Travertine", "Travertine (stone)", "£521"],
            ["Crofton White Marble", "Marble (stone)", "£449"],
            [
              "Imperia Round Grey Glass and Ceramic",
              "Glass and ceramic",
              "£664",
            ],
            ["Imperia 2 Tier Asymmetrical Ceramic", "Ceramic", "£858"],
            ["Ulmus Black Elm Wood", "Solid wood", "£861"],
            ["Bentley Coffee Table in Oak", "Solid wood", "£998"],
            ["Serene Rattan Coffee Table", "Rattan", "£344"],
            [
              "Tamarind & Resin – Aqua",
              "Resin (wipes clean like glass)",
              "£874",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "Stone marks from heat and acid but resists scratches; solid wood scratches but sands out; veneer scratches without that second chance; glass and ceramic wipe clean but show every mark between cleanings; rattan is the lightest and least fussy, at the cost of looking less substantial. Match the material to how the table actually gets used, not just how it photographs new.",
      );
      return b;
    })(),
    faqs: [
      [
        "What is the most durable coffee table material?",
        "It depends what 'durable' needs to resist. Stone resists scratches best but marks from heat and acid; glass and ceramic resist scratches and heat but show fingerprints; solid wood scratches but can be sanded and refinished, which no other material here can do.",
      ],
      [
        "Does marble stain easily?",
        "It can — marble and travertine are porous enough that acidic or coloured liquids left to sit can etch a permanent dull mark into the polish. A coaster habit prevents most of it; occasional resealing helps the rest.",
      ],
      [
        "Is wood veneer coffee table furniture worth buying?",
        "For most living rooms, yes — it gets the solid-wood look for less. The trade-off is that a deep scratch cuts through the thin veneer layer and can't be sanded out the way solid wood can, so it suits lighter everyday use better than a household that's hard on furniture.",
      ],
      [
        "What coffee table material is easiest to clean?",
        "Glass and ceramic — both wipe completely clean in seconds and resist scratching. The trade-off is that both show fingerprints, dust and water rings clearly between cleans, which stone and wood mostly hide.",
      ],
      [
        "Is rattan coffee table furniture durable?",
        "Reasonably, for everyday knocks and scuffs — better than most materials here, in fact. It doesn't tolerate standing water or direct heat well, and reads as more casual than stone, wood or glass, so it suits a relaxed living room better than a formal one.",
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
    "docs/change-log/2026-09-03-create-buying-guides-batch2.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
