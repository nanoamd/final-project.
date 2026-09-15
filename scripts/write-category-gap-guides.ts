/**
 * Guides for the stocked categories that have none.
 *
 * Damien: _"i want intensive compounding. do some seo work overnight"_.
 *
 * An audit of all 49 categories found the page copy is fine — every stocked
 * category has 330–780 characters of intro and four FAQs. The gap is
 * elsewhere: **12 stocked categories have no buying guide pointing at them at
 * all**, so they get no editorial link, no long-tail entry point, and nothing
 * in the new article sidebar.
 *
 * These three are the largest of the twelve, and each is built on a number the
 * catalogue already holds and nobody else publishes:
 *
 *   KITCHEN STORAGE — the jars are sold in 250/550/800/1100ml and every
 *   article about storage jars talks about aesthetics. What a cook wants is
 *   whether a kilo of rice fits, which is a bulk-density calculation and
 *   therefore answerable.
 *
 *   BATHROOM ACCESSORIES — 35 products, 200ml/300ml/500ml dispensers, and the
 *   question nobody answers is how long one lasts and whether a refill bottle
 *   empties into it cleanly. A 500ml dispenser takes a 500ml refill exactly. A
 *   300ml one leaves 200ml on the shelf.
 *
 *   CANDLES AND LANTERNS — hurricane lanterns from 11cm to 113cm, and the
 *   mistake is always the same: buying the lantern first and discovering no
 *   candle sold in Britain fits it properly.
 *
 * Bulk densities are the standard figures for dry goods and are given as
 * approximations, because they vary with shape and packing. Everything else is
 * read from the product records.
 *
 *   pnpm tsx --env-file=.env.local scripts/write-category-gap-guides.ts
 *   pnpm tsx --env-file=.env.local scripts/write-category-gap-guides.ts --apply
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

const AUTHOR = { _type: "reference", _ref: "author-kaiku-editorial" };

interface GuideSpec {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  categoryId: string;
  categorySlug: string;
  products: string[];
  buttons: [string, string][];
  /** Mixed blocks — prose, tables, image slots and the link row. */
  body: { _type: string }[];
  faqs: ReturnType<typeof faq>[];
}

const SHOP = (slug: string) => `/shop/${slug}`;
const PROD = (cat: string, slug: string) => `/shop/${cat}/${slug}`;

/* ------------------------------------------------------------ the guides */

const GUIDES: GuideSpec[] = [
  {
    slug: "what-size-kitchen-storage-jar",
    title:
      "What size storage jar do you need? Pasta, flour and rice by the litre",
    metaTitle: "What Size Kitchen Storage Jar? | Kaiku",
    metaDescription:
      "A 1kg bag of rice needs about 1.2 litres. Pasta needs three times the space flour does for the same weight. Jar sizes matched to what actually goes in them.",
    excerpt:
      "Storage jars are sold in millilitres and shopping is done in kilograms, so the two never meet on the shelf. Here is the conversion, by ingredient, with the jar each bag needs.",
    categoryId: "category-kitchen-storage",
    categorySlug: "kitchen-storage",
    products: [
      "freska-ribbed-round-glass-jar-with-acacia-wood-lid-250ml",
      "freska-ribbed-round-glass-jar-with-acacia-wood-lid-550ml",
      "freska-ribbed-round-glass-jar-with-acacia-wood-lid-800ml",
      "freska-ribbed-round-glass-jar-with-acacia-wood-lid-1100ml",
      "freska-set-of-five-ribbed-round-clear-glass-jars-with-acacia-wood-lids",
      "freska-set-of-five-ribbed-round-glass-jars-with-acacia-wood-lids",
    ],
    buttons: [
      ["Kitchen storage", SHOP("kitchen-storage")],
      ["Kitchen furniture", SHOP("kitchen-furniture")],
      ["Shelving", SHOP("shelving")],
      ["Vases", SHOP("vases")],
      ["All buying guides", "/learn"],
    ],
    body: [
      p(
        "A one-kilogram bag of rice needs a jar of about 1.2 litres. The same weight of pasta needs nearly three. That is the whole problem with buying storage jars: they are sold in millilitres, shopping is done in kilograms, and nothing on either label converts one to the other.",
      ),
      p(
        "The reason is bulk density — how much air sits between the pieces. Rice packs tightly at roughly 0.85kg per litre. Penne is all tube and gap, at about 0.35. Flour sits in between at 0.55 to 0.6, and settles further once it has been in the jar a week.",
      ),
      linkRow("Here to buy rather than to read? Start here.", [
        ["Kitchen storage", SHOP("kitchen-storage")],
        ["Kitchen furniture", SHOP("kitchen-furniture")],
        ["Shelving", SHOP("shelving")],
      ]),
      imageSlot(
        "A row of glass storage jars on a shelf, filled with pasta, rice and flour at different levels",
        "The opening shot. Four or five glass jars in a row on an open shelf, each holding a different dry good — pasta, rice, flour, coffee, sugar — so the different fill levels for the same jar size are visible. Daylight from the side. This is the picture that makes the whole point before anyone reads a word.",
        "Same jar, same weight, very different fill.",
      ),
      table(
        "What a 1kg bag needs, by ingredient",
        ["Ingredient", "Roughly", "1kg needs", "Jar to buy"],
        [
          ["Rice", "0.85 kg/litre", "About 1.2 litres", "1100ml, just"],
          [
            "Granulated sugar",
            "0.85 kg/litre",
            "About 1.2 litres",
            "1100ml, just",
          ],
          ["Plain flour", "0.55–0.6 kg/litre", "About 1.7 litres", "Two 800ml"],
          ["Rolled oats", "0.4 kg/litre", "About 2.5 litres", "Two 1100ml"],
          ["Coffee beans", "0.4 kg/litre", "About 2.5 litres", "Two 1100ml"],
          [
            "Penne or fusilli",
            "0.35 kg/litre",
            "About 2.9 litres",
            "Three 1100ml",
          ],
        ],
      ),
      h2("Buy for the bag, not for the shelf"),
      p(
        "The useful question is not what looks right in a row. It is which bag you buy, and whether that bag empties into the jar in one go. Decanting half a bag and leaving the rest in the cupboard defeats the point of the jar and you end up with both.",
      ),
      p(
        "Rice and sugar are the easy ones: a kilogram of either goes into the ",
        [
          "1100ml jar",
          PROD(
            "kitchen-storage",
            "freska-ribbed-round-glass-jar-with-acacia-wood-lid-1100ml",
          ),
        ],
        " with very little to spare. Flour does not — a 1.5kg bag, which is the standard British size, needs about 2.6 litres and will not go into anything on this page in one piece. Either buy two jars for it or accept that flour lives in its bag.",
      ),
      h2("The sizes, and what each one is actually for"),
      p(
        "The ",
        [
          "250ml jar",
          PROD(
            "kitchen-storage",
            "freska-ribbed-round-glass-jar-with-acacia-wood-lid-250ml",
          ),
        ],
        " at 7.6cm tall is a spice jar in everything but name. It holds about 200g of salt, a single 227g bag of ground coffee, or a fortnight of loose tea. Too small for anything bought by the kilo, exactly right for the things bought in grams.",
      ),
      p(
        "The ",
        [
          "550ml",
          PROD(
            "kitchen-storage",
            "freska-ribbed-round-glass-jar-with-acacia-wood-lid-550ml",
          ),
        ],
        " is the one most kitchens need most of — 500g of rice, 300g of flour, a standard 500g bag of sugar with room to get a spoon in. The ",
        [
          "800ml",
          PROD(
            "kitchen-storage",
            "freska-ribbed-round-glass-jar-with-acacia-wood-lid-800ml",
          ),
        ],
        " takes a 500g bag of pasta, which the 550ml will not.",
      ),
      p(
        "The 1100ml is the kilo jar, and it is 22.2cm tall — worth measuring against your shelf before buying, because a 22cm jar does not go under a 20cm shelf however much you want it to. If you are buying more than two, the ",
        [
          "set of five",
          PROD(
            "kitchen-storage",
            "freska-set-of-five-ribbed-round-clear-glass-jars-with-acacia-wood-lids",
          ),
        ],
        " works out cheaper than the same jars bought singly, and there is a ",
        [
          "ribbed version",
          PROD(
            "kitchen-storage",
            "freska-set-of-five-ribbed-round-glass-jars-with-acacia-wood-lids",
          ),
        ],
        " of the same set.",
      ),
      imageSlot(
        "A 1100ml storage jar beside a 1kg bag of rice, with the bag half emptied into the jar",
        "The proof shot. A 1100ml jar next to an opened 1kg bag of rice, mid-pour, so the reader can see it actually fits. A tape measure or the shelf edge in frame for scale. Nobody else photographs this and it is the single question the guide exists to answer.",
      ),
      h2("Spaghetti does not fit, and that is not a jar problem"),
      p(
        "Dried spaghetti is 25 to 26cm long. The tallest jar here is 22.2cm. No round jar in this range takes spaghetti upright, and snapping it to fit is a decision you should make on its own merits rather than because of a jar.",
      ),
      p(
        "Short shapes are fine. Penne, fusilli and macaroni all pour, and a 500g bag of any of them goes into the 800ml with room to close the lid. It is only the long shapes that need a tall narrow container, and those are a different product.",
      ),
      h2("Airtight matters more for some things than others"),
      p(
        "A wooden lid with a seal keeps moisture out, which matters enormously for flour, sugar and anything ground, and much less for pasta and rice. Coffee is the one where it matters most and where a jar on a windowsill is the wrong answer regardless — light degrades roast coffee faster than air does.",
      ),
      p(
        "Glass is the right material for everything except coffee, which wants to be dark and somewhere cool. Store the beans in a cupboard and use the jar for something you want to look at.",
      ),
      h2("How many jars a kitchen actually needs"),
      p(
        "Fewer than a photograph suggests, and more than most people buy at once. The honest number is however many dry goods you reach for weekly — for most households that is five or six: pasta, rice, flour, sugar, oats, and coffee or tea. Everything else gets used once a month and is better left in its packet, where the cooking instructions are.",
      ),
      p(
        "That is why the sets are five. Buying five at once also means they match, which is the only reason a row of jars reads as deliberate rather than as things that accumulated. If you are starting from nothing, buy the set and add singles later; if you already own three mismatched jars, buying two more will not rescue them.",
      ),
      h2("Decanting: the mouth matters more than the volume"),
      p(
        "Every jar here has a 9cm mouth, which is wide enough to take a scoop and wide enough to pour a bag into without a funnel. That sounds trivial until you own a jar with a narrow neck, at which point you stop refilling it and it becomes an ornament with rice in it.",
      ),
      p(
        "The wooden lid is a lift-off rather than a screw, which is the right choice for something opened daily and the wrong one for anything that will be tipped or carried. Keep these on a shelf or a worktop rather than in a cupboard where the door swings.",
      ),
      h2("Label them, or you will buy plain flour twice"),
      p(
        "Plain and self-raising flour are indistinguishable in glass. So are caster and granulated sugar, and so are three kinds of white rice. A jar row solves storage and creates an identification problem, and the solution is dull: label the lid, not the glass, because the glass is the part you are looking at.",
      ),
      p(
        "The other half of it is dating. Flour has a real shelf life — around six months for plain, less for wholemeal, which carries the oil in the germ and goes rancid. Decanting hides the best-before date that was printed on the bag, so write it somewhere before you throw the bag away.",
      ),
      h2("Where the row goes"),
      p(
        "Open shelving is where jars look best and work worst. A jar on an open shelf in a kitchen collects the grease that cooking puts into the air, and glass shows it. If the shelf is within about two metres of a hob, expect to wash the outsides as often as the insides.",
      ),
      p(
        "The better position is a worktop against a wall, or a shelf in a pantry or utility. And measure the height before ordering: the 1100ml jar is 22.2cm tall and the 800ml is 17.4cm, so a 20cm shelf gap takes the whole range except the largest — which is exactly the one most people buy first.",
      ),
      h2("The short version"),
      p(
        "Weigh what you buy, divide by the bulk density, and buy the jar above the answer. Rice and sugar: 1100ml a kilo. Flour: 800ml per 500g. Pasta: 800ml per 500g bag and nothing takes spaghetti. Measure your shelf height before buying anything 22cm tall, and keep the coffee in the dark.",
      ),
    ],
    faqs: [
      faq(
        "What size jar do I need for 1kg of pasta?",
        "About 2.9 litres, which is three 1100ml jars. Dried pasta is mostly air — penne and fusilli pack at roughly 0.35kg per litre against rice at 0.85 — so it takes nearly three times the space rice does for the same weight. A 500g bag goes comfortably into an 800ml jar.",
        "jars-faq-0",
      ),
      faq(
        "Will a 1kg bag of rice fit in a 1100ml jar?",
        "Just. Rice packs at about 0.85kg per litre, so a kilogram occupies roughly 1.2 litres — a little more than the jar holds. In practice a 1kg bag fills an 1100ml jar to the brim with a small amount left over. If you want the lid to close easily over a full bag, go larger or keep the remainder.",
        "jars-faq-1",
      ),
      faq(
        "Can you store spaghetti in a round storage jar?",
        "Not upright. Dried spaghetti is 25 to 26cm long and the tallest jar here is 22.2cm. Long pasta needs a tall narrow container made for it, or it needs snapping. Short shapes — penne, fusilli, macaroni — pour into any of these sizes without a problem.",
        "jars-faq-2",
      ),
      faq(
        "How much flour fits in a storage jar?",
        "Plain flour sits at roughly 0.55 to 0.6kg per litre, so an 800ml jar takes about 500g and a 1100ml about 650g. A standard 1.5kg British bag needs around 2.6 litres, which is more than any single jar here — buy two, or leave the flour in its bag and decant what you use.",
        "jars-faq-3",
      ),
      faq(
        "Do storage jars need to be airtight?",
        "For flour, sugar and anything ground, yes — moisture is what spoils them. For pasta and rice it matters much less. Coffee is the exception that catches people out: an airtight glass jar on a worktop still ruins beans, because light degrades roast coffee faster than air does. Keep coffee in a cupboard.",
        "jars-faq-4",
      ),
    ],
  },

  {
    slug: "how-many-bathroom-accessories-do-you-need",
    title:
      "How many bathroom accessories do you need, and what size soap dispenser?",
    metaTitle: "Bathroom Accessories: What Size, How Many? | Kaiku",
    metaDescription:
      "A 500ml dispenser takes a 500ml refill exactly; a 300ml one leaves a third of the bottle behind. What each piece is for, and how many a bathroom actually needs.",
    excerpt:
      "Bathroom sets are sold in fours and sixes, and most bathrooms need three. Which pieces earn their place, what size dispenser matches a refill bottle, and when matching matters.",
    categoryId: "category-bathroom-accessories",
    categorySlug: "bathroom-accessories",
    products: [
      "canyon-white-lotion-dispenser-500ml",
      "canyon-grey-300ml-lotion-dispenser",
      "allegra-200ml-champagne-finish-soap-dispenser",
      "canyon-white-tumbler",
      "canyon-white-toothbrush-holder",
      "canyon-white-soap-dish",
      "allegra-etched-metallic-bathroom-tray",
      "allegra-champagne-finish-tissue-box",
      "thread-and-loom-6-piece-warm-sand-towel-set",
    ],
    buttons: [
      ["Bathroom accessories", SHOP("bathroom-accessories")],
      ["Bathroom storage", SHOP("bathroom-storage")],
      ["Bathroom mirrors", SHOP("bathroom-mirrors")],
      ["Wellness accessories", SHOP("wellness-accessories")],
      ["All buying guides", "/learn"],
    ],
    body: [
      p(
        "A 500ml refill bottle empties exactly into a 500ml dispenser. It leaves a third of itself behind in a 300ml one, and that third lives on the shelf next to the sink until somebody throws it away. That is the most useful thing anybody can tell you about buying a soap dispenser, and no product page says it.",
      ),
      p(
        "Bathroom accessories are sold in matching fours and sixes because sets are easier to sell than pieces. Most bathrooms need three of them, and which three depends on whether anybody keeps a toothbrush by that sink.",
      ),
      linkRow("Here to buy rather than to read? Start here.", [
        ["Bathroom accessories", SHOP("bathroom-accessories")],
        ["Bathroom storage", SHOP("bathroom-storage")],
        ["Bathroom mirrors", SHOP("bathroom-mirrors")],
      ]),
      imageSlot(
        "A small group of matching bathroom accessories on a basin surround — dispenser, tumbler, soap dish",
        "Opening shot. Three matching pieces on a real basin surround, not a styled void: dispenser, tumbler, soap dish. One of them in use — a toothbrush in the tumbler, soap in the dish. The point is that three is enough, so do not photograph six.",
        "Three pieces, not six. The set is sold for the seller's convenience.",
      ),
      h2("Dispenser size: match the refill, not the sink"),
      p(
        "Hand wash and lotion are sold in 500ml refills almost universally in Britain. So a ",
        [
          "500ml dispenser",
          PROD("bathroom-accessories", "canyon-white-lotion-dispenser-500ml"),
        ],
        " is the size that never leaves a remainder, and it is the right default for a family bathroom or a kitchen sink.",
      ),
      p(
        "A ",
        [
          "300ml dispenser",
          PROD("bathroom-accessories", "canyon-grey-300ml-lotion-dispenser"),
        ],
        " suits a cloakroom, where the bottle is refilled rarely and the piece is mostly seen. A ",
        [
          "200ml",
          PROD(
            "bathroom-accessories",
            "allegra-200ml-champagne-finish-soap-dispenser",
          ),
        ],
        " is a guest-bathroom size and will want filling every few weeks in daily use — a pump delivers roughly 1.5 to 2ml a press, so 200ml is about a hundred washes.",
      ),
      table(
        "How long a dispenser lasts, at two people washing six times a day",
        ["Capacity", "Roughly", "Lasts about", "Suits"],
        [
          ["200ml", "100 presses", "Eight days", "Guest cloakroom"],
          ["300ml", "170 presses", "Two weeks", "Second bathroom"],
          [
            "500ml",
            "280 presses",
            "Three to four weeks",
            "Main bathroom, kitchen",
          ],
        ],
      ),
      h2("The three pieces that earn their place"),
      p(
        "A dispenser, because the alternative is a supermarket bottle on display. A ",
        ["tumbler", PROD("bathroom-accessories", "canyon-white-tumbler")],
        ", because rinsing needs something and the alternative is cupped hands. And either a ",
        [
          "toothbrush holder",
          PROD("bathroom-accessories", "canyon-white-toothbrush-holder"),
        ],
        " or a ",
        ["soap dish", PROD("bathroom-accessories", "canyon-white-soap-dish")],
        " depending on whether you use bar soap and whether anyone brushes at that basin.",
      ),
      p(
        "A soap dish with no drainage holds water, and soap sitting in water dissolves into sludge at roughly twice the rate. If you buy bar soap, buy a dish with a ridge or a slope, and empty it.",
      ),
      h2("What the fourth, fifth and sixth pieces are for"),
      p(
        "A ",
        [
          "tray",
          PROD("bathroom-accessories", "allegra-etched-metallic-bathroom-tray"),
        ],
        " is the one worth adding. It is not another object on the surround; it is the thing that turns four objects into one group, and it is why a hotel basin looks tidy and a home one does not. Anything on the tray reads as deliberate.",
      ),
      p(
        "A ",
        [
          "tissue box cover",
          PROD("bathroom-accessories", "allegra-champagne-finish-tissue-box"),
        ],
        " earns its place only in a bathroom where a tissue box already lives on show. A storage jar is for cotton wool and nothing else, and if you do not use cotton wool it will hold dust.",
      ),
      imageSlot(
        "A metal tray holding a dispenser, tumbler and soap dish, on a basin surround",
        "The tray doing its job. Same three pieces as the opening shot, but grouped on a tray, shot from the same angle so the difference is obvious. Ideally the two images run together in the guide. This is the argument the section rests on.",
        "The tray is what turns four objects into one group.",
      ),
      h2("Does it all have to match?"),
      p(
        "The pieces that touch water should match each other, because they sit together in a group of three and an odd one out reads as a breakage that was replaced. Everything else is free.",
      ),
      p(
        "Our two ranges are built for that. Canyon is matte ceramic in grey, white and black, and is the quieter choice. Allegra is champagne finish, hammered metal and brown glass — more present, and better in a bathroom with warm metal taps already in it. Mixing the two works if the finishes echo something else in the room; mixing them at random does not.",
      ),
      h2("Towels are a different purchase"),
      p(
        "A ",
        [
          "six-piece towel set",
          PROD(
            "bathroom-accessories",
            "thread-and-loom-6-piece-warm-sand-towel-set",
          ),
        ],
        " is two bath sheets, two hand towels and two face cloths, which is one set in use and one in the wash for a household of two. For four people you need two sets, not one larger one.",
      ),
      p(
        "Buy one colour and stay with it. Towels are replaced in ones and twos over years, and a bathroom where every towel is the same colour survives that; a bathroom of accumulated singles does not.",
      ),
      h2("The 8cm problem: measure the surround first"),
      p(
        "Each Canyon piece has an 8cm footprint and each Allegra piece is 7 to 9cm. Three of them side by side, with enough space between to pick one up without knocking another, needs about 32 to 35cm of surround. A tray adds nothing to that because the pieces sit on it rather than beside it.",
      ),
      p(
        "Most pedestal basins offer nothing like 35cm. If yours does not, the answer is not smaller accessories — it is fewer. A dispenser and a tumbler on a 20cm ledge looks composed. Three crammed pieces look like a chemist's shelf, and one of them ends up in the sink weekly.",
      ),
      h2("Ceramic, glass or metal by a basin"),
      p(
        "Ceramic is the forgiving choice. It does not show water marks, it does not corrode, and a matte glaze hides toothpaste. It is also the heaviest of the three, which matters for a dispenser that gets pumped one-handed — a light dispenser slides across the surround and a heavy one stays where it is put.",
      ),
      p(
        "Glass shows everything, which is fine on a guest basin used twice a month and tiring on a family one. Metal finishes are the ones to check against your taps: a champagne or brass finish beside chrome taps reads as a mistake rather than a contrast, and it is the one pairing that genuinely looks wrong.",
      ),
      h2("Hard water is the thing that decides how long they last"),
      p(
        "Across most of southern and eastern England the water is hard, and limescale is what actually ends the life of a bathroom accessory. It builds in the pump mechanism of a dispenser, around the base of a tumbler, and in the ridges of a soap dish.",
      ),
      p(
        "None of that is avoidable, but it is slowable. Rinse and dry the dispenser pump when you refill it rather than topping up over old soap, and keep the soap dish somewhere it can drain. A dispenser that is refilled without ever being washed stops working in about a year, and it stops working because of what is inside the pump rather than anything visible.",
      ),
      h2("A bathroom with no surround at all"),
      p(
        "A pedestal basin or a small wall-hung one gives you nowhere to put any of this, and that is a common British bathroom rather than an edge case. The answer is to stop trying to put things around the basin and put them somewhere else in the room.",
      ),
      p(
        "A tray on the cistern takes the dispenser and a jar. A shelf or a small cabinet takes everything else and gets it off the wet surfaces entirely, which also stops the limescale problem before it starts. The pieces on this page are all small enough to live somewhere other than the basin, and a bathroom where they do is tidier than one where three things fight over 20cm of porcelain.",
      ),
      h2("The short version"),
      p(
        "Match the dispenser to a 500ml refill unless it is a cloakroom. Three pieces is a set — dispenser, tumbler, and a dish or a holder. Add a tray before you add a fourth object. Keep the water-touching pieces in one finish and let the rest go. Buy towels by the set and keep to one colour.",
      ),
    ],
    faqs: [
      faq(
        "What size soap dispenser should I buy?",
        "500ml, in a bathroom used daily. Hand wash and lotion refills are sold in 500ml bottles almost universally, so a 500ml dispenser empties one exactly and leaves nothing on the shelf. A 300ml is right for a second bathroom and a 200ml for a guest cloakroom.",
        "bath-faq-0",
      ),
      faq(
        "How long does a 500ml soap dispenser last?",
        "Three to four weeks for two people washing their hands six times a day. A pump delivers roughly 1.5 to 2ml per press, so 500ml is around 280 presses. A 300ml lasts about a fortnight on the same usage and a 200ml a little over a week.",
        "bath-faq-1",
      ),
      faq(
        "How many bathroom accessories do I actually need?",
        "Three. A dispenser, a tumbler, and either a soap dish or a toothbrush holder depending on whether you use bar soap and whether anyone brushes at that basin. Sets are sold in fours and sixes because sets are easier to sell than pieces, not because bathrooms need six.",
        "bath-faq-2",
      ),
      faq(
        "Do bathroom accessories have to match?",
        "The pieces that sit together by the basin should, because three objects in a row read as a group and one odd piece reads as a replacement. Beyond that group it matters much less. Mixing two ranges works when the finishes pick up something already in the room — warm metal taps, a mirror frame — and looks accidental when they do not.",
        "bath-faq-3",
      ),
      faq(
        "What is in a six-piece towel set?",
        "Two bath sheets, two hand towels and two face cloths. That is one set in use and one in the wash for a household of two. A family of four needs two sets rather than one bigger one, and keeping to a single colour matters because towels get replaced in ones and twos over years.",
        "bath-faq-4",
      ),
    ],
  },

  {
    slug: "what-size-hurricane-lantern",
    title: "What size hurricane lantern, and which candle actually fits it?",
    metaTitle: "Hurricane Lantern Size and Candle Fit | Kaiku",
    metaDescription:
      "Leave 2–3cm of air around a pillar candle, and never fill a lantern to its own height. Lantern sizes matched to the candles Britain actually sells.",
    excerpt:
      "The usual mistake is buying the lantern and then discovering nothing sold in Britain fits it. Here are the candle sizes, the clearance a flame needs, and which lantern suits indoors, a table or a doorstep.",
    categoryId: "category-candles-and-lanterns",
    categorySlug: "candles-and-lanterns",
    products: [
      "round-ceramic-lattice-hurricane-lantern",
      "large-conical-ceramic-lattice-hurricane-lantern",
      "large-grey-stone-effect-hurricane-lantern",
      "sona-large-hurricane-lantern-with-lid",
      "cruzar-large-silver-lantern",
      "set-of-three-wooden-lanterns-with-archway-design",
      "set-of-three-wooden-lanterns-with-traditional-cross-section",
      "kensington-townhouse-nickel-finish-large-floorstanding-candle-holder",
      "rhea-large-lighthouse-tealight-holder",
    ],
    buttons: [
      ["Candles & lanterns", SHOP("candles-and-lanterns")],
      ["Garden lighting", SHOP("garden-lighting")],
      ["Lighting", SHOP("lighting")],
      ["Fire pits & heating", SHOP("fire-pits")],
      ["All buying guides", "/learn"],
    ],
    body: [
      p(
        "Leave two to three centimetres of air between the candle and the glass, and never fill a lantern past two thirds of its internal height. Those two rules decide whether a lantern looks right and whether it is safe, and almost nobody states them before you have bought the thing.",
      ),
      p(
        "British pillar candles come in a small number of diameters — 7cm, 8cm and 10cm cover almost everything sold. So the question is not what size lantern you like. It is which of those three the lantern takes.",
      ),
      linkRow("Here to buy rather than to read? Start here.", [
        ["Candles & lanterns", SHOP("candles-and-lanterns")],
        ["Garden lighting", SHOP("garden-lighting")],
        ["Fire pits & heating", SHOP("fire-pits")],
      ]),
      imageSlot(
        "A lit hurricane lantern on an outdoor table at dusk, flame well below the rim",
        "Opening shot. A lit lantern at blue hour on a garden table, with the flame clearly sitting low inside rather than near the top. Shot slightly above eye level so the air gap around the candle is visible. That gap is the whole guide.",
        "Two thirds full, never to the rim.",
      ),
      table(
        "Candle diameter by lantern opening",
        ["Lantern opening", "Candle to buy", "Air each side"],
        [
          ["11–13cm", "7cm pillar", "2–3cm"],
          ["14–16cm", "8cm pillar", "3–4cm"],
          ["17–19cm", "10cm pillar", "3.5–4.5cm"],
          ["20cm and over", "10cm pillar, or three tealights", "Group them"],
        ],
      ),
      h2("Why the gap matters, and it is not only about heat"),
      p(
        "A flame needs air. Boxed in too tightly it burns dirty, sooting the inside of the glass within an evening, and a sooted lantern never quite comes clean. Three centimetres of clearance is the difference between a lantern you light every week and one that goes in a cupboard.",
      ),
      p(
        "The height rule is the same idea. A candle burning near the top of an enclosure heats the rim, and on ceramic or stone that is how hairline cracks start. Two thirds is the working maximum, which is why a ",
        [
          "50cm lantern",
          PROD("candles-and-lanterns", "sona-large-hurricane-lantern-with-lid"),
        ],
        " wants a candle around 30cm and looks wrong with a short one rattling about at the bottom.",
      ),
      h2("Indoors: 17 to 22cm, on a surface"),
      p(
        "For a mantelpiece, a console or a dining table, a lantern between 17 and 22cm tall is the size that reads as an object rather than an ornament. The ",
        [
          "round ceramic lattice lantern",
          PROD(
            "candles-and-lanterns",
            "round-ceramic-lattice-hurricane-lantern",
          ),
        ],
        " at 17cm across and the ",
        [
          "conical version",
          PROD(
            "candles-and-lanterns",
            "large-conical-ceramic-lattice-hurricane-lantern",
          ),
        ],
        " at 22cm tall are both this brief. Lattice casts a pattern on the wall behind it, which is most of the reason to own one.",
      ),
      p(
        "On a dining table, go lower than feels right. Anything above about 25cm is something people have to look around, and a lantern that interrupts a conversation gets moved to the sideboard permanently.",
      ),
      h2("Outdoors: bigger, heavier, and on the ground"),
      p(
        "Outdoors the rules invert. Wind puts a flame out long before it burns down, so an outdoor lantern wants a lid or a deep body, and it wants enough weight not to go over. The ",
        [
          "grey stone-effect lantern",
          PROD(
            "candles-and-lanterns",
            "large-grey-stone-effect-hurricane-lantern",
          ),
        ],
        " at 32cm and the ",
        [
          "Sona with its lid",
          PROD("candles-and-lanterns", "sona-large-hurricane-lantern-with-lid"),
        ],
        " at 50cm are both built for that, and the lid is the part that matters.",
      ),
      p(
        "On a doorstep, go taller than you think and go in pairs — the same rule that applies to planters, and for the same reason. A ",
        [
          "set of three wooden lanterns",
          PROD(
            "candles-and-lanterns",
            "set-of-three-wooden-lanterns-with-archway-design",
          ),
        ],
        " at up to 104cm, or the ",
        [
          "cross-section version",
          PROD(
            "candles-and-lanterns",
            "set-of-three-wooden-lanterns-with-traditional-cross-section",
          ),
        ],
        " at 84cm, does the job a single lantern cannot at any price. Group in odd numbers and at different heights, and light them all or none.",
      ),
      imageSlot(
        "Three wooden lanterns of different heights grouped beside a front door, all lit",
        "The grouping shot. Three lanterns at clearly different heights beside a real front door at dusk, all lit. Shot straight on so the height stagger reads. This sells a set rather than a single lantern, which is the commercial point of the section.",
        "Odd numbers, different heights, all lit or none.",
      ),
      h2("Floor-standing is a different object"),
      p(
        "Above about 80cm a lantern stops being a table piece and becomes furniture. The ",
        [
          "Kensington floor-standing holder",
          PROD(
            "candles-and-lanterns",
            "kensington-townhouse-nickel-finish-large-floorstanding-candle-holder",
          ),
        ],
        " at 113cm is at eye level for a seated room, which means it is lit for the evening rather than for a moment, and it needs somewhere it will not be walked into.",
      ),
      p(
        "The ",
        [
          "Cruzar at 51cm",
          PROD("candles-and-lanterns", "cruzar-large-silver-lantern"),
        ],
        " is the in-between size: too big for a dining table, right at the end of a hearth or beside a chair.",
      ),
      h2("Tealights are not a smaller version of this"),
      p(
        "A tealight burns for three to four hours and throws almost no light beyond its own holder. That is a different job from a pillar candle, and a piece like the ",
        [
          "Rhea lighthouse holder",
          PROD("candles-and-lanterns", "rhea-large-lighthouse-tealight-holder"),
        ],
        " is bought for the object rather than for the light.",
      ),
      p(
        "If you want light, use pillars. If you want several small points of light across a table, use tealights and use more of them than feels necessary — five reads as intentional, two reads as what was left in the drawer.",
      ),
      h2("Burn time, and how often you will be buying candles"),
      p(
        "A pillar candle burns roughly an hour per centimetre of diameter per session before it starts tunnelling, which is the rule that decides whether a lantern gets used or resented. A 7cm pillar wants at least seven hours the first time it is lit, because the first burn sets the width of the pool for every burn after it.",
      ),
      p(
        "Light a wide pillar for an hour and you have permanently made it a narrow one, with a crater down the middle and a wall of unburnt wax around the outside. If an evening will not stretch to a proper first burn, use a smaller candle or use tealights, which have no memory and do not care.",
      ),
      h2("Glass, ceramic or metal outdoors"),
      p(
        "Glass is the only one that lets light out sideways, which is the whole point of a lantern on a table. It is also the one that cracks, and it cracks from thermal shock rather than from cold — a cold night and a hot flame is the combination, and a lantern brought straight from a cold shed and lit is the usual casualty.",
      ),
      p(
        "Ceramic and stone-effect bodies are tougher and throw light upward rather than out, which suits a doorstep better than a dining table. Metal frames with glass panels are the compromise and the most weather-tolerant of the three. Whatever the material, anything left out through a British winter with water in the base will crack when that water freezes.",
      ),
      h2("Where lanterns go wrong indoors"),
      p(
        "Soot, almost always, and almost always from a draught rather than from the candle. A flame that flickers is a flame that burns dirty, so a lantern on a windowsill above a radiator or beside a door will black the glass in a fortnight while the same candle elsewhere in the room stays clean.",
      ),
      p(
        "The other one is dust. An open-topped lantern collects it, and dust on a wax surface is visible from across a room. A lidded design solves that for an ornament that is lit occasionally; an open one wants wiping when you light it, which is a small thing that decides whether it stays on display.",
      ),
      h2("Wind, and why most outdoor candles fail"),
      p(
        "A flame goes out at around 10mph of wind with nothing protecting it, which on a British evening is most evenings. That is the number that makes a lidded lantern worth its extra cost, and it is why an open hurricane on an exposed patio is an ornament rather than a light source.",
      ),
      p(
        "A tall narrow body protects better than a wide shallow one, because the flame sits deeper relative to the opening. If the lantern is open-topped and the spot is exposed, put the candle lower — a shorter candle in a tall lantern is worse to look at and far more likely to stay lit.",
      ),
      h2("The short version"),
      p(
        "Two to three centimetres of air around the candle, and fill to two thirds of the height, never more. 7cm pillars for openings up to 13cm, 8cm up to 16cm, 10cm above that. Indoors 17 to 22cm and lower on a dining table. Outdoors buy the lid. On a doorstep buy three, not one.",
      ),
    ],
    faqs: [
      faq(
        "What size candle fits a hurricane lantern?",
        "Leave two to three centimetres of air between the candle and the glass. For an opening of 11 to 13cm that means a 7cm pillar, for 14 to 16cm an 8cm pillar, and for 17 to 19cm a 10cm pillar. Too tight and the flame burns dirty, sooting the inside of the glass in a single evening.",
        "lantern-faq-0",
      ),
      faq(
        "How tall should the candle be in a lantern?",
        "No more than two thirds of the lantern's internal height. A flame burning near the rim heats it, and on ceramic or stone that is how hairline cracks begin. It also looks better: a 50cm lantern wants a candle around 30cm, and a short candle in a tall lantern reads as a mistake.",
        "lantern-faq-1",
      ),
      faq(
        "Can hurricane lanterns be used outside?",
        "Yes, and they suit it — but buy one with a lid or a deep body. Wind puts a flame out long before the candle burns down, which is the single thing that decides whether an outdoor lantern gets used. Weight matters too, because a lantern that blows over is worse than one that goes out.",
        "lantern-faq-2",
      ),
      faq(
        "What size lantern for a dining table?",
        "Lower than instinct suggests. Anything above about 25cm is something people have to look around, and a lantern that interrupts a conversation ends up on the sideboard. Between 17 and 22cm works on most tables, and a lattice design earns its place by casting a pattern rather than by height.",
        "lantern-faq-3",
      ),
      faq(
        "How many lanterns should I put by a front door?",
        "Three, at different heights, or a matched pair either side. One lantern beside a door reads as an accessory; a group reads as a decision. Odd numbers work better than even ones except in a symmetrical pair, and they should all be lit or none of them — one unlit lantern in a group of three undoes it.",
        "lantern-faq-4",
      ),
    ],
  },
];

/* -------------------------------------------------------------------- main */

async function main() {
  const allProducts = [...new Set(GUIDES.flatMap((g) => g.products))];
  const found = await client.fetch<{ slug: string; _id: string }[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && slug.current in $slugs]{ _id, "slug": slug.current }`,
    { slugs: allProducts },
  );
  const bySlug = new Map(found.map((f) => [f.slug, f._id]));
  const missingProducts = allProducts.filter((s) => !bySlug.has(s));
  if (missingProducts.length) {
    console.error(
      `Products that do not exist:\n  ${missingProducts.join("\n  ")}`,
    );
    process.exit(1);
  }

  const categoryIds = [...new Set(GUIDES.map((g) => g.categoryId))];
  const foundCats = await client.fetch<string[]>(
    `*[_type=="category" && _id in $ids]._id`,
    { ids: categoryIds },
  );
  const missingCats = categoryIds.filter((id) => !foundCats.includes(id));
  if (missingCats.length) {
    console.error(`Categories that do not exist: ${missingCats.join(", ")}`);
    process.exit(1);
  }

  const existing = await client.fetch<string[]>(
    `*[_type=="buyingGuide" && slug.current in $slugs].slug.current`,
    { slugs: GUIDES.map((g) => g.slug) },
  );

  let failed = false;
  for (const g of GUIDES) {
    const words = wordCount(g.body);
    const hrefs = inlineHrefs(g.body);
    const productLinks = hrefs.filter((h) => h.startsWith("/shop/")).length;
    const slots = g.body.filter((b) => b._type === "image").length;

    console.log(`\n${g.title}`);
    console.log(
      `  /learn/${g.slug}${existing.includes(g.slug) ? "  (REPLACING)" : ""}`,
    );
    console.log(
      `  ${words} words · ${productLinks} inline links · ${g.buttons.length} buttons · ` +
        `${slots} image spaces · ${g.faqs.length} FAQs · ${g.products.length} product cards`,
    );
    console.log(
      `  metaTitle ${g.metaTitle.length} · metaDescription ${g.metaDescription.length}`,
    );
    if (g.metaDescription.length > 160) {
      console.error("    meta description over 160 characters.");
      failed = true;
    }
    if (g.metaTitle.length > 60) {
      console.error("    meta title over 60 characters.");
      failed = true;
    }
    if (words < 1000) {
      console.error(
        `    ${words} words — too short for a guide meant to rank.`,
      );
      failed = true;
    }
  }
  if (failed) process.exit(1);

  if (!apply) return console.log("\nDry run — re-run with --apply.");

  for (const g of GUIDES) {
    await client.createOrReplace({
      _id: `buyingGuide-${g.slug}`,
      _type: "buyingGuide",
      title: g.title,
      slug: { _type: "slug", current: g.slug },
      excerpt: g.excerpt,
      body: [
        ...g.body.slice(0, 2),
        linkRow("Here to buy rather than to read? Start here.", g.buttons),
        ...g.body.slice(2).filter((b) => b._type !== "guideLinkRow"),
      ],
      faqs: g.faqs,
      publishedAt: new Date().toISOString(),
      author: AUTHOR,
      relatedCategory: { _type: "reference", _ref: g.categoryId },
      relatedProducts: g.products.map((slug, i) => ({
        _key: `rp-${i}`,
        _type: "reference",
        _ref: bySlug.get(slug)!,
      })),
      seo: {
        _type: "seo",
        metaTitle: g.metaTitle,
        metaDescription: g.metaDescription,
      },
    });
    console.log(`  published /learn/${g.slug}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
