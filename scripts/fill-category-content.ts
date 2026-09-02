/**
 * Category landing-page content: SEO introduction, buying guidance, FAQs and
 * meta title/description for every category that was missing them.
 *
 * The brief has asked for this from the start — "Every category page needs: SEO
 * introduction, buying guidance, FAQs, internal links" — and twelve categories
 * had it. The other thirty-seven were a heading and a grid, which ranks for
 * nothing because there is no text on the page for a query to match. Damien sent
 * a screenshot of the two empty editors in Studio and said to do this first.
 *
 * Everything here is written from each category's own stock: the price range,
 * the dimension range, the material tags and the actual product names, pulled
 * with scripts/.tmp-cat-facts.ts before a word was written. No claim about what
 * a range contains that the range does not contain.
 *
 * Existing content is never overwritten — a category that already has an intro
 * keeps it. Meta fields are filled only where empty.
 *
 *   pnpm tsx --env-file=.env.local scripts/fill-category-content.ts
 *   pnpm tsx --env-file=.env.local scripts/fill-category-content.ts --apply
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

interface CategoryCopy {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  /** Two or three paragraphs. The text the page ranks on. */
  intro: string[];
  /** How to choose. Four paragraphs, each one decision. */
  guide: string[];
  faqs: [question: string, answer: string][];
}

/** Portable Text block from a plain paragraph. Matches the shape already in the
 *  dataset — one span, no marks — so the Studio editors open on it cleanly. */
function block(prefix: string, index: number, text: string) {
  return {
    _key: `${prefix}${index}`,
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _key: `${prefix}${index}s`, _type: "span", marks: [], text }],
  };
}

const COPY: CategoryCopy[] = [
  {
    slug: "bathroom-mirrors",
    metaTitle: "Bathroom Mirrors | Bathroom | Kaiku",
    metaDescription:
      "Illuminated LED and framed bathroom mirrors, round, oval and octagonal. How to size a mirror to the basin and light a face properly.",
    intro: [
      "A bathroom mirror is used at close range, in bad light, by someone half awake. That makes it the one mirror in the house where the lighting matters more than the frame. The Avelino pieces here are illuminated — an LED band around the glass that lights the face rather than the wall behind it — in round, oval and silver or gold finishes.",
      "Alongside them sit framed pieces for bathrooms that already have good light: the Hampton octagonal and square mirrors in ivory faux shagreen, and framed designs in walnut and marble. Prices run from around £210 to £623, and the range covers 60 to 90cm across.",
    ],
    guide: [
      "Width first. A mirror should be as wide as the basin or a little narrower — never wider, or it reads as an afterthought hung over the wrong unit. For a standard 60cm basin, a 60 to 70cm mirror is the sweet spot.",
      "Height next. Hang the centre of the glass at roughly 165cm from the floor, which puts it at eye level for most adults, and leave 20 to 25cm between the top of the basin or splashback and the bottom of the frame.",
      "Then decide about light. If the bathroom has a single ceiling fitting, that light falls from above and puts your own face in shadow — exactly the problem an illuminated mirror solves. If there are wall lights either side of the mirror position already, a framed piece will do the same job for less.",
      "Finally, the frame material. Faux shagreen, linen and walnut all belong in a bathroom that is ventilated and dry between uses; in a small room with a shower and no extractor, a mirrored-glass or metal-framed piece is the safer choice.",
    ],
    faqs: [
      [
        "What size mirror should I hang above a basin?",
        "The same width as the basin or slightly narrower — for a 60cm basin, 60 to 70cm. Centre the glass around 165cm from the floor and leave 20 to 25cm above the splashback.",
      ],
      [
        "Do I need an illuminated mirror?",
        "If your only light is a ceiling fitting, yes — overhead light shadows the face, which is the one thing a bathroom mirror is for. If you already have wall lights either side of the mirror, a framed mirror is just as good.",
      ],
      [
        "Will a wooden or fabric-framed mirror survive a bathroom?",
        "In a ventilated bathroom, yes. In a small room with a shower and no extractor fan, repeated steam will eventually lift a veneer or mark a fabric frame — choose mirrored glass or metal there.",
      ],
      [
        "Round or rectangular above a basin?",
        "Round softens a bathroom full of straight lines and suits a single basin. Rectangular gives more usable reflection for the same wall space and suits a wide unit or a double basin.",
      ],
    ],
  },
  {
    slug: "bathroom-storage",
    metaTitle: "Bathroom Storage | Bathroom | Kaiku",
    metaDescription:
      "Wire, rattan and water hyacinth bathroom storage — baskets, wall shelves and tiered caddies from £23. How to choose for a damp room.",
    intro: [
      "Bathroom storage is mostly a problem of small things: bottles, rolls, folded towels, the four items that live on the edge of the bath because there is nowhere else. The pieces here are the practical answers — Emery matt black wire baskets, the Vertex range in copper-plated, square, rectangular and hexagonal, Arles water hyacinth wall shelves and a three-tier caddy, and Batu rattan baskets in pairs.",
      "Nothing here is a fitted unit, which is deliberate: all of it can be lifted out, moved to another room or taken with you. Prices start at £23 and the range tops out around £184, with heights from 15cm to 87cm.",
    ],
    guide: [
      "Measure the gap you are filling, not the thing you are storing. The two dimensions that catch people out are the depth beside a basin pedestal and the height under a wall-hung sink — both are usually less than they look.",
      "Open or lined. Wire baskets let a damp flannel dry out and let you see what is in them, which is why they suit daily items. Woven baskets look softer and hide clutter, but a wet towel left in one stays wet, so use them for dry stock: spare rolls, folded linen, packaging.",
      "Go up before you go out. In most bathrooms the floor is already spoken for and the wall above the cistern or beside the door is empty. A wall shelf or a tiered caddy adds three surfaces in the footprint of one.",
      "One point about the woven pieces: none of the baskets here is watertight, so they will not hold water and are not a substitute for a pot or a liner if you are putting a plant in one.",
    ],
    faqs: [
      [
        "Will woven baskets go mouldy in a bathroom?",
        "Not if what goes in them is dry. Water hyacinth and rattan cope well with normal bathroom humidity but not with sitting wet fabric — keep damp towels on a rail and use the baskets for spare rolls, linen and dry stock.",
      ],
      [
        "Are the baskets watertight?",
        "No. None of them will hold water. If you want to plant one up, use a sealed inner pot or a liner.",
      ],
      [
        "How do I add storage to a bathroom with no floor space?",
        "Use the wall. A water hyacinth wall shelf above the cistern or beside the door adds a surface without taking any floor, and a three-tier caddy gives you three surfaces in the footprint of one.",
      ],
      [
        "How do I clean wire and woven storage?",
        "Wire baskets wipe down with a damp cloth and dry off. Woven pieces should be dusted or vacuumed with a brush attachment rather than washed — soaking the weave is what loosens it.",
      ],
    ],
  },
  {
    slug: "bathroom-accessories",
    metaTitle: "Bathroom Accessories | Bathroom | Kaiku",
    metaDescription:
      "Matching bathroom accessories in grey, white and black — tumblers, toothbrush holders, soap dishes and 300ml or 500ml dispensers from £19.",
    intro: [
      "This is the set that makes a bathroom look finished rather than assembled: a tumbler, a toothbrush holder, a soap dish and a lotion dispenser that match each other instead of being three brands of plastic. The Canyon range runs through all four pieces in grey, white and black, and the dispensers come in 300ml and 500ml.",
      "Everything here sits between £19 and £49, so a full four-piece set in one finish is achievable for under £100. Pieces are small — most are between 8 and 22cm tall — which is worth knowing before ordering, because photographed alone they look larger than they are.",
    ],
    guide: [
      "Pick the finish first and buy the set in it. The reason a bathroom counter looks cluttered is almost never the number of objects — it is that they are four different colours. One finish across all four pieces does more for the room than any single upgrade.",
      "Then the dispenser size. 300ml suits a cloakroom or a second bathroom and is easier to refill often; 500ml is the right choice for a family bathroom where a small one runs dry in a fortnight.",
      "Check the counter depth before you commit to a soap dish and a tumbler side by side. On a narrow basin surround, a wall-mounted dispenser and a single tumbler will serve better than four pieces competing for 20cm.",
      "Finally, think about which pieces you actually use. A toothbrush holder in a bathroom where everyone keeps their brush in a drawer is an ornament — better to spend the same money on a larger dispenser and a decent soap dish.",
    ],
    faqs: [
      [
        "Should I buy accessories as a set?",
        "It is the single easiest way to make a bathroom look considered. Mismatched finishes are what make a counter feel cluttered — the Canyon pieces come in the same grey, white and black across the tumbler, toothbrush holder, soap dish and dispenser.",
      ],
      [
        "300ml or 500ml dispenser?",
        "300ml for a cloakroom or a second bathroom. 500ml for a main family bathroom, where a 300ml bottle needs refilling every couple of weeks.",
      ],
      [
        "How big are these pieces?",
        "Small — most stand between 8 and 22cm tall. Each product page carries its exact dimensions, which is worth checking against your basin surround before ordering four of them.",
      ],
      [
        "How do I clean them?",
        "A damp cloth and a mild detergent. Avoid abrasive cream cleaners and scouring pads, which dull the finish on any matt or coated surface.",
      ],
    ],
  },
  {
    slug: "towel-rails",
    metaTitle: "Towel Rails | Bathroom | Kaiku",
    metaDescription:
      "Towel rails and ladder rails for the bathroom, coming soon to Kaiku. How to size a rail, and why heated is not always the right answer.",
    intro: [
      "A towel rail is judged on one thing: whether a towel is dry the next morning. That depends far more on air movement and spacing than on the rail itself, which is why a heated rail in an unventilated bathroom often disappoints and a plain ladder rail by a window frequently does not.",
      "We are curating this range now. In the meantime the bathroom storage and accessories ranges cover the rest of the room, and the guidance below applies whichever rail you end up buying.",
    ],
    guide: [
      "Count the towels, then double the bar length. A folded bath towel needs about 30cm of bar, and a towel hung two layers deep dries at roughly half the speed — so a rail that looks adequate for four towels usually handles two.",
      "Leave the rail off the wall. A towel pressed flat against plaster dries from one side only. Anything less than 4 to 5cm of clearance behind the bar is what makes towels smell musty rather than fresh.",
      "Heated or not depends on ventilation, not on luxury. A heated rail in a room with an extractor fan and a window is excellent. In a sealed internal bathroom, the moisture has nowhere to go and the rail simply warms damp air.",
      "For a small room, a ladder rail gives the most bar length per centimetre of wall. Where wall space is genuinely gone, a door-mounted or over-radiator rail is a better answer than squeezing a fixed rail somewhere awkward.",
    ],
    faqs: [
      [
        "How long a towel rail do I need?",
        "Allow about 30cm of bar per folded bath towel, and do not stack towels two deep — the inner layer stays wet. For a family of four, that is realistically a ladder rail rather than a single bar.",
      ],
      [
        "Is a heated towel rail worth it?",
        "Only with ventilation. With an extractor or an opening window it dries towels properly. In a sealed internal bathroom it warms damp air without removing the moisture, and towels still take a day.",
      ],
      [
        "How far from the wall should a rail sit?",
        "At least 4 to 5cm. A towel flat against the wall only dries from one side, which is the usual reason towels smell before they are visibly dirty.",
      ],
      [
        "What can I use if there is no wall space?",
        "An over-door rail or a freestanding ladder rail. Both give useful bar length without a fixing, and the freestanding version can move to wherever the room actually has airflow.",
      ],
    ],
  },
  {
    slug: "bathroom-lighting",
    metaTitle: "Bathroom Lighting | Bathroom | Kaiku",
    metaDescription:
      "Bathroom lighting coming soon to Kaiku. How IP ratings, zones and colour temperature decide what you can legally and sensibly fit.",
    intro: [
      "Bathroom lighting is the one category in the house with rules attached. Fittings near a bath or shower must carry an IP rating suited to their zone, and most decorative fittings do not — which is why a beautiful pendant bought for a bedroom is not an option above a bath.",
      "We are curating this range now. The illuminated mirrors in Bathroom Mirrors already solve the hardest lighting problem in the room — light on the face rather than on the wall behind it — and the guidance below covers what to check on any bathroom fitting.",
    ],
    guide: [
      "Start with the zones. Zone 0 is inside the bath or shower and needs IP67. Zone 1 is directly above it to 2.25m and needs at least IP44 (IP65 with a shower). Zone 2 extends 60cm beyond and needs IP44. Beyond that, ordinary fittings are fine.",
      "Light the face, not the ceiling. A single central downlight puts your own head between the bulb and your face. Wall lights either side of the mirror, or an illuminated mirror, are the fix — everything else is a compromise.",
      "Choose colour temperature deliberately. Around 2700K to 3000K is warm and flattering and right for a bathroom used in the evening. 4000K and above reads clinical, and is genuinely useful only where someone needs cold accurate light for shaving or make-up.",
      "If the bathroom has no window, a dimmable circuit is worth more than an extra fitting. The same room needs bright light at 7am and almost none at 11pm, and one fitting on a dimmer covers both.",
    ],
    faqs: [
      [
        "What IP rating does a bathroom light need?",
        "It depends on the zone: IP67 inside the bath or shower, IP65 or IP44 directly above it and within 60cm, and ordinary fittings beyond that. Every fitting states its rating — check it against where it is going.",
      ],
      [
        "Why does my bathroom light make me look terrible?",
        "Because it is above you. Overhead light casts your own face into shadow. Wall lights either side of the mirror, or an illuminated mirror, light the face directly and fix it.",
      ],
      [
        "What colour temperature is best for a bathroom?",
        "2700K to 3000K for a bathroom used mainly in the evening. Go cooler only where someone needs accurate light for shaving or make-up, and expect it to feel clinical.",
      ],
      [
        "Can I fit bathroom lighting myself?",
        "Bathroom circuits are notifiable work in England and Wales under Part P of the building regulations. Use a qualified electrician — the certificate matters when you come to sell.",
      ],
    ],
  },
  {
    slug: "beds",
    metaTitle: "Beds | Bedroom | Kaiku",
    metaDescription:
      "Ottoman, sofa and upholstered beds in double, king and super king from £89. How to size a bed to a room and get it up the stairs.",
    intro: [
      "A bed is bought for the mattress size and lived with for the storage. The range here leads with ottoman beds — the Hannah in grey, mink and beige, in double and king — because a bed with a lifting base gives back a cubic metre of storage in the room where storage is always short.",
      "Alongside them are velvet sofa beds for spare rooms and studios (the Hatton and Hayton), and upholstered frames in double, king and super king including the Loire, Josephine and Parkside. Prices run from £89 to £1,270, and frames span roughly 83cm to 219cm wide with headboards up to 180cm tall.",
    ],
    guide: [
      "Start with the room, not the bed. Leave 60 to 70cm of walking space on at least one long side and at the foot. A king in a small room that meets that clearance is a good decision; one that does not turns the room into a corridor.",
      "Then measure the route, not just the room. Bed frames arrive as long flat sections, and the number that stops a delivery is the diagonal of your stair turn, not the width of the bedroom door. Check the headboard height against a low landing ceiling too — several here are over 150cm.",
      "Choose the base for how the room is used. An ottoman base is the most storage per pound in this catalogue and needs clearance above to lift. A drawer base needs clearance beside it instead, which matters in a room where one side is against a wall.",
      "Upholstery last. Velvet and boucle look best and hold dust, so they suit a bedroom rather than a room a dog sleeps in; woven fabric is easier to keep looking new. Whatever the finish, check the mattress size the frame takes — a UK king is 150 x 200cm and is not interchangeable with a European one.",
    ],
    faqs: [
      [
        "How much space do I need around a bed?",
        "60 to 70cm on at least one long side and at the foot, so you can walk past and make the bed without climbing over it. That clearance decides whether a king fits, more than the floor area does.",
      ],
      [
        "Will the bed get up my stairs?",
        "Check the diagonal of your tightest stair turn, not the bedroom door. Frames arrive in long flat sections, and each product page lists the packaged carton dimensions to measure against.",
      ],
      [
        "Is an ottoman bed worth it over a drawer base?",
        "In a small bedroom, usually yes — it holds far more, and it does not need floor clearance at the side to open. It does need room above to lift the base, so check for a sloping ceiling or a low shelf over the bed.",
      ],
      [
        "What mattress size do these frames take?",
        "The size named on the product: UK double is 135 x 190cm, king 150 x 200cm and super king 180 x 200cm. European sizes are not interchangeable, so buy the mattress to the frame's stated size.",
      ],
    ],
  },
  {
    slug: "bedroom-storage",
    metaTitle: "Bedroom Storage | Bedroom | Kaiku",
    metaDescription:
      "Wardrobes and chests of drawers in mango, elm, oak and reclaimed wood from £87. How to choose hanging versus drawer space and fix a chest safely.",
    intro: [
      "Bedroom storage divides into two decisions: how much of your clothing hangs, and how much folds. The wardrobes here cover the hanging half — the Bradbury open wardrobes in dark and natural oak effect, the Kyra in grey-wash elm, and the Lyon two-door in rattan and oak — with heights up to 200cm.",
      "For the folded half there are chests in solid mango, oak and elm and reclaimed wood: the Salvar chest of five drawers, the Sarter and Salem in mango wood, and the Gaya chest of five. Prices run from £87 to £1,495.",
    ],
    guide: [
      "Count hanging metres before buying a wardrobe. A shirt needs about 3cm on a rail and a coat closer to 6cm, so a 90cm rail holds roughly 25 shirts or half that in outerwear. If most of what you own folds, a wide chest is better value than a second wardrobe.",
      "Check the internal height, not the external. A single-rail wardrobe under about 160cm internal will not take a long dress or a full-length coat without it dragging, however tall the case looks from outside.",
      "For an open wardrobe, remember everything in it is on display and gathers dust. They work beautifully in a tidy room and badly in a busy one — if in doubt, a doored unit hides more than it costs.",
      "Fix tall units to the wall. Any chest or wardrobe over about 120cm tall is a tipping risk when a drawer is open, particularly with children in the house. Several pieces here ship with an anti-tip strap; use it, and use a fixing rated for your wall type rather than the plug in the box.",
    ],
    faqs: [
      [
        "Wardrobe or chest of drawers?",
        "Count what you own. Hanging takes about 3cm of rail per shirt and 6cm per coat; if most of your clothing folds, a wide chest stores far more per pound and per centimetre of floor.",
      ],
      [
        "Will a long coat fit?",
        "Only if the internal hanging height is over about 160cm. Check the internal figure rather than the case height — a wardrobe with a shelf above the rail loses more space than it appears to.",
      ],
      [
        "Do I need to fix a chest of drawers to the wall?",
        "Anything over about 120cm tall, yes — an open drawer moves the centre of gravity forward and that is how they tip. Use a wall fixing suited to your wall type, not necessarily the plug supplied.",
      ],
      [
        "Are open wardrobes practical?",
        "In a tidy bedroom, yes, and they make a small room feel larger than a closed case does. Everything on them is visible and collects dust, so in a busy household a doored unit is the calmer choice.",
      ],
    ],
  },
  {
    slug: "bedroom-lighting",
    metaTitle: "Bedroom Lighting | Bedroom | Kaiku",
    metaDescription:
      "Bedside lamps, LED wall lights and crystal ceiling fittings from £42. How to layer bedroom light so one switch does not do everything.",
    intro: [
      "A bedroom needs two kinds of light and usually has one. The overhead fitting is for finding things; the light you actually live with is at the bedside, at shoulder height, warm enough to read by without waking the person next to you.",
      "This range covers both layers. For the bedside and dressing table there are gesso table lamps in bamboo, ribbed, round and rectangular forms; for the walls, LED sets of two in spiral, starry and geometric mesh designs, which mount without needing a bedside surface at all. Overhead there are crystal semi-flush fittings and a glass droplet chandelier. Prices run £42 to £290.",
    ],
    guide: [
      "Get the height right before the style. A bedside lamp reads well when the bottom of the shade sits at roughly seated shoulder height — around 55 to 65cm of total lamp height on a typical 55cm bedside table. Taller than that and the bulb is in your eyeline in bed.",
      "If the bedside table is small, put the light on the wall. A pair of wall lights frees the whole surface for a book, a glass and a phone, and the sets of two here are designed exactly for that pair-either-side arrangement.",
      "Choose semi-flush over a pendant where the ceiling is under about 2.4m. A hanging fitting in a low room is something you walk into; a semi-flush gives the same decorative effect with your head clear of it.",
      "Warm and dim beats bright and neutral in this room. Aim for 2700K bulbs, and put the overhead fitting on a dimmer if you can — the same room needs full light to find a suitcase and almost none at bedtime.",
    ],
    faqs: [
      [
        "How tall should a bedside lamp be?",
        "Total height around 55 to 65cm on a standard bedside table, so the bottom of the shade sits near shoulder height when you are sitting up. Any taller and you see the bulb from the pillow.",
      ],
      [
        "Wall lights or table lamps beside the bed?",
        "Wall lights if the bedside table is small or already full — they free the entire surface. Table lamps if you want to move the light, or if fitting wall lights would mean chasing cables into plaster.",
      ],
      [
        "Can I hang a chandelier in a bedroom with low ceilings?",
        "Under about 2.4m, choose a semi-flush fitting instead. It gives the same decorative effect at the ceiling without hanging into the space people walk through.",
      ],
      [
        "What bulb colour is best for a bedroom?",
        "2700K warm white. Cooler bulbs suppress the wind-down a bedroom is for, and 4000K in particular reads like an office at eleven at night.",
      ],
    ],
  },
  {
    slug: "bedroom-mirrors",
    metaTitle: "Bedroom Mirrors | Bedroom | Kaiku",
    metaDescription:
      "Full-length, vanity and wall mirrors for the bedroom from £47. How to place a mirror so it lights the room and shows a whole outfit.",
    intro: [
      "A bedroom mirror does two jobs, and most rooms need both. One is dressing — a full reflection, lit from the front, that shows shoes as well as a collar. The other is light: a mirror opposite or adjacent to a window puts daylight back into the darkest half of the room.",
      "The range covers arched window mirrors and hanging collage designs in black, the Nahla dimpled-frame pieces in three sizes, the Hampton octagonal and shagreen squares, and the Gala vanity mirror with drawers for a dressing table. Sizes reach 146cm tall and prices run £47 to £623.",
    ],
    guide: [
      "For dressing, buy height. A mirror needs to be at least 120cm tall, hung with its bottom edge no more than 40cm off the floor, before it shows a whole outfit — anything shorter and you are stepping back to see your own shoes.",
      "For light, buy placement over size. A mirror on the wall adjacent to a window catches daylight and spreads it; a mirror directly opposite a window bounces it straight back out. Two metres of glass in the wrong place does less than 60cm in the right one.",
      "Above a chest or dressing table, keep the mirror narrower than the furniture and leave 15 to 25cm between the two. A mirror wider than the piece it sits over always looks as though it came from a different room.",
      "Check the fixing against the weight. A large framed mirror is heavier than it looks, and the plug supplied in the box is rated for the mirror, not for your wall. Into plasterboard, use proper hollow-wall anchors rated above the stated weight, and hit a stud where you can.",
    ],
    faqs: [
      [
        "What size mirror do I need to see a full outfit?",
        "At least 120cm tall, with the bottom edge within about 40cm of the floor. Below that you end up stepping backwards to check shoes, which defeats the point.",
      ],
      [
        "Where should I put a mirror to make a bedroom brighter?",
        "On the wall adjacent to the window, angled into the room. Directly opposite a window it reflects the daylight back out again — placement matters more here than size.",
      ],
      [
        "How high should a mirror hang above a dressing table?",
        "Leave 15 to 25cm between the furniture top and the frame, and keep the mirror narrower than the piece below it. Centre it on the furniture, not on the wall.",
      ],
      [
        "How do I hang a heavy mirror safely?",
        "Fix into a stud where possible. Into plasterboard use hollow-wall anchors rated above the mirror's stated weight — each product page lists it — rather than the generic plug in the box.",
      ],
    ],
  },
  {
    slug: "candles-and-lanterns",
    metaTitle: "Candles & Lanterns | Decor | Kaiku",
    metaDescription:
      "Ceramic hurricane lanterns, wooden lantern sets and solar floor lanterns from £19. How to choose candlelight that works indoors and out.",
    intro: [
      "Candlelight is the cheapest change you can make to a room, and the one most often done badly — a single tealight on a wide table reads as an apology. The pieces here are sized to carry: large conical and round ceramic lattice hurricane lanterns, sets of three wooden lanterns in cross-section and archway designs, and the Kensington floorstanding candle holder at 177cm.",
      "For outdoors and for households that would rather not have a flame, there are rattan solar floor lanterns and LED dinner candles that behave like the real thing without one. Prices start at £19 and run to £160.",
    ],
    guide: [
      "Group in odd numbers and vary the height. Three lanterns of different heights read as an arrangement; four of the same height read as a shop display. This is why the sets of three here do more work than three separate purchases.",
      "Match the lantern to the wind. An open holder is fine on a dining table and useless on a patio. A hurricane lantern with a glass or ceramic surround, or one with a lid like the Sona, is what keeps a flame alive outdoors.",
      "Choose solar or LED where a flame is a bad idea — a hallway with children, a table under a fabric parasol, a doorstep nobody is watching. The rattan solar lanterns charge in daylight and need no cable, so they can sit anywhere in a garden.",
      "Never leave a real flame unattended, keep it clear of overhanging fabric and foliage, and stand a floor candle holder on a firm level surface. A 177cm holder is stable on stone and not on soft ground.",
    ],
    faqs: [
      [
        "How many lanterns should I group together?",
        "Three, at different heights. Odd numbers and mixed heights read as deliberate; a row of identical pieces reads as stock. The sets of three here are built around exactly that.",
      ],
      [
        "Will a candle stay lit outside?",
        "Not in an open holder. Use a hurricane lantern with a glass or ceramic surround, or one with a lid, and keep it out of a through-draught between a doorway and a gate.",
      ],
      [
        "Are the solar lanterns bright enough to be useful?",
        "They are atmosphere rather than task lighting — enough to mark a path or a table edge, not enough to read by. For light you can actually see by outdoors, look at the solar bollards in Garden Lighting.",
      ],
      [
        "What should I be careful of with a floorstanding candle holder?",
        "Stability and clearance. Stand it on firm level ground, keep at least a metre between the flame and anything overhanging — parasol fabric, branches, a canopy — and never leave it burning unattended.",
      ],
    ],
  },
  {
    slug: "christmas-trees",
    metaTitle: "Christmas Trees | Decor | Kaiku",
    metaDescription:
      "Pre-lit artificial Christmas trees at 210cm with 200 or 400 LEDs. How to choose between a full fir and a slim tree for a tight room.",
    intro: [
      "An artificial tree is bought once and used for a decade, so the two things worth getting right are the width and the lighting. Both trees here stand 210cm tall and arrive pre-lit, which removes the annual job of threading lights through branches that fight back.",
      "The Green Forest Fir is the full shape at 140cm across with 400 LEDs. The Slim Snowy Woodland is 91cm across with 200 LEDs, for a room where a traditional tree would block a doorway or a walkway. Both are £230 to £299.",
    ],
    guide: [
      "Height second, width first. A 210cm tree needs about 30cm of clearance above it for a topper and the ceiling, so it suits a room with a 2.4m ceiling. But the dimension that decides whether it works is the spread — 140cm of floor is a lot in a bay window.",
      "Slim trees are not compromises. At 91cm across, the Snowy Woodland gives the same height and presence in a hallway, a landing or beside a sofa where a full fir would be walked into daily.",
      "Pre-lit is worth paying for. It is a job that takes forty minutes a year and looks worse than a factory job every time, and the lights on a pre-lit tree are spaced through the interior rather than wound round the outside — which is what gives depth rather than a lit outline.",
      "Plan the socket before you plan the corner. A pre-lit tree needs mains power at the base, and a cable run across a doorway is the single most common reason a tree ends up somewhere nobody wanted it.",
    ],
    faqs: [
      [
        "How tall a tree fits a normal room?",
        "210cm suits a standard 2.4m ceiling, leaving room for a topper and a little air above it. Measure to the ceiling rather than guessing — a tree that touches it looks squeezed rather than generous.",
      ],
      [
        "Full or slim tree?",
        "It depends on floor space, not on taste. The full fir spreads 140cm and needs a corner or a wide window; the slim tree is 91cm across and works in a hallway or next to seating without being brushed past.",
      ],
      [
        "Is a pre-lit tree better than adding your own lights?",
        "Yes, for two reasons: it saves the annual job, and the lights sit deep in the branches rather than wound round the outside, which gives depth instead of a lit outline.",
      ],
      [
        "How should I store an artificial tree?",
        "Dry and loosely — compressing branches for eleven months in a damp garage is what makes a tree look tired in year three. A breathable bag in a dry cupboard or loft is ideal.",
      ],
    ],
  },
  {
    slug: "mirrors",
    metaTitle: "Mirrors | Decor | Kaiku",
    metaDescription:
      "Wall, floor, illuminated and over-door mirrors from £19 to £689. How to size a mirror, place it for light, and hang it safely.",
    intro: [
      "Mirrors are the most efficient thing you can put on a wall. They add light, they add apparent depth, and unlike art they can be chosen for effect rather than for taste. This is the widest mirror range on the site — sixty pieces, from a £19 over-door mirror to a £689 statement piece, in widths up to 231cm and heights to 210cm.",
      "It covers the practical (over-door, illuminated LED, the Cassini tri-fold table mirrors for make-up) and the decorative (arched window frames, hanging collage designs, antique etched and foxed glass, gold and silver metal frames). Frames run through glass, MDF, mirrored glass, metal, brass, walnut and marble.",
    ],
    guide: [
      "Decide which job the mirror is doing. Light, dressing or decoration — they want different mirrors in different places, and a single piece rarely does two of them well.",
      "For light, hang adjacent to a window rather than opposite it, so daylight is thrown into the room instead of straight back out. For dressing, buy 120cm or more of height with the bottom edge low. For decoration, treat it as art: centre it on the furniture beneath, not on the wall.",
      "Scale to the furniture. Above a console or a sideboard, keep the mirror to roughly two-thirds to three-quarters of the furniture's width and leave 15 to 25cm of wall between them. Above a fireplace, align it with the chimney breast rather than the room.",
      "Then check the weight and the fixing. A large mirror in a solid frame can run to 20kg or more; each product page lists its weight. Fix into a stud where you can, and into plasterboard use hollow-wall anchors rated above that figure — the plug in the box is not a specification.",
    ],
    faqs: [
      [
        "Where should a mirror go to make a room brighter?",
        "On the wall adjacent to the window, so it throws daylight into the room. Directly opposite a window it bounces the light back out again — position does more here than size.",
      ],
      [
        "What size mirror above a console table?",
        "Two-thirds to three-quarters of the table's width, with 15 to 25cm of wall left between the table top and the frame. Centre it on the furniture rather than on the wall.",
      ],
      [
        "How do I hang a heavy mirror on a plasterboard wall?",
        "Find a stud if you can. Otherwise use hollow-wall anchors rated above the mirror's stated weight, which is listed on every product page, and spread the load across two fixings rather than one.",
      ],
      [
        "Are illuminated mirrors worth the extra?",
        "For anywhere a face is being looked at closely — a bathroom, a dressing table — yes, because they light the face rather than the wall behind it. As a decorative piece in a hallway, an unlit mirror does the same job for less.",
      ],
    ],
  },
  {
    slug: "vases",
    metaTitle: "Vases | Decor | Kaiku",
    metaDescription:
      "Ceramic and glass vases from £29, 20cm to 57cm tall. How to match a vase to the stems you actually buy, and where to place it.",
    intro: [
      "Most vases are bought for their shape and then found to be wrong for flowers — too wide at the neck to hold a small bunch upright, or too short for anything sold in a supermarket. The range here is deliberately spread across heights from 20cm to 57cm so there is a right answer for both a single stem and a full market bunch.",
      "Sixteen of the pieces are ceramic and five are glass, including the Garda glazed range, the Aged Stone pieces, marble-effect ellipse and pudding forms, and the hammered silver Astral vases. Prices run £29 to £163.",
    ],
    guide: [
      "Buy for the stems you actually come home with. Supermarket bunches are cut at 40 to 50cm, which wants a vase of 20 to 25cm — roughly half the stem length — so the flowers sit above the rim rather than drowning in it.",
      "Neck width decides whether an arrangement stands up. A narrow neck holds a handful of stems upright with no effort and suits a few good flowers. A wide mouth needs enough volume to fill it, or the stems fall to the sides and the middle stays empty.",
      "Tall vases are for branches and structure, not bouquets. The 50cm-plus pieces here look best with eucalyptus, pampas or bare branches — material that holds its own shape — and they work empty, which a small vase does not.",
      "Ceramic or glass is a practical choice as much as an aesthetic one. Glass shows the water, so it needs changing before it clouds; glazed ceramic hides the water and hides a cheap stem end, and is the more forgiving choice on a mantel or a shelf.",
    ],
    faqs: [
      [
        "What height vase for supermarket flowers?",
        "20 to 25cm. Shop bunches are cut at 40 to 50cm, and a vase around half the stem length holds them at the right proportion without them slumping over the rim.",
      ],
      [
        "Why do my flowers fall to the sides?",
        "The neck is too wide for the number of stems. Either add more material, use a narrower-necked vase, or cross the stems low in the vase so they support each other.",
      ],
      [
        "What goes in a tall vase?",
        "Branches and structural stems — eucalyptus, pampas, bare twigs — rather than a bouquet. Anything over about 50cm also works well empty, which is worth knowing if you do not buy flowers often.",
      ],
      [
        "Are these vases watertight?",
        "The glass and glazed ceramic pieces hold water. Where a piece is decorative only or has an unsealed base, the product page says so — check it before filling, and use a liner or an inner container if in doubt.",
      ],
    ],
  },
  {
    slug: "wall-art",
    metaTitle: "Wall Art | Decor | Kaiku",
    metaDescription:
      "Hand-painted canvases, framed prints and wooden wall plaques from £19. How to size art to a wall and hang it at the right height.",
    intro: [
      "The two mistakes with wall art are hanging it too high and buying it too small. Both are fixable before you buy, and both matter more than the image — a well-scaled print at the right height beats an expensive canvas floating near the ceiling.",
      "The range runs from £19 wooden plaques to £258 hand-painted canvases, including the Galaxy and Astratto abstracts, framed botanical and animal prints, the Tristan mirror-and-wood photo frames, and pieces up to 150 x 160cm.",
    ],
    guide: [
      "Hang at eye level: the centre of the piece at about 145 to 150cm from the floor. Almost every picture in almost every house is higher than this, which is why so many rooms feel top-heavy.",
      "Above furniture, the rule changes — leave 15 to 25cm between the top of a sofa or sideboard and the bottom of the frame, so the two read as one group rather than two unrelated objects.",
      "Scale to the wall, not to the frame you like. Aim to fill roughly two-thirds to three-quarters of the width of the wall or the furniture below. Where nothing single is big enough, three or five smaller pieces hung as one block will do it — treat the group's outline as the artwork.",
      "Then match the medium to the room. Hand-painted canvas has texture that survives being seen from the side, which suits a hallway you walk past. Glazed frames reflect, so keep them off the wall directly opposite a window, and hang wooden pieces away from a radiator or a steamy kitchen wall.",
    ],
    faqs: [
      [
        "How high should I hang a picture?",
        "Centre it about 145 to 150cm from the floor — eye level for most people. Above a sofa or sideboard, work from the furniture instead and leave 15 to 25cm between the two.",
      ],
      [
        "What size art for a large empty wall?",
        "Roughly two-thirds to three-quarters of the wall's width. If no single piece is big enough, hang three or five smaller pieces as one block and treat the outline of the group as the artwork.",
      ],
      [
        "Where should I not hang a glazed frame?",
        "Directly opposite a window — glass reflects the daylight and you see the room rather than the picture. Canvas and textured pieces are the better choice on that wall.",
      ],
      [
        "How do I hang a heavy canvas safely?",
        "Use two fixings spread across the frame rather than one central hook, and match the fixing to the wall: a stud where possible, and hollow-wall anchors rated above the piece's stated weight into plasterboard.",
      ],
    ],
  },
  {
    slug: "christmas-decorations",
    metaTitle: "Christmas Decorations | Decor | Kaiku",
    metaDescription:
      "Christmas decorations at Kaiku — rustic metal hanging pieces that earn their place year after year rather than lasting one season.",
    intro: [
      "This range is being built slowly and on one principle: a decoration should be good enough to want out of the box again next year. That rules out most of what is sold at Christmas, and it is why there is one piece here rather than forty.",
      "The Large Rustic Metal Hanging Bell is 8 x 8 x 10cm in aged metal, at £19 — a piece that reads as festive on a door or a mantel in December and as ordinary good decor in January.",
    ],
    guide: [
      "Buy fewer, better pieces. Ten cheap ornaments cost more than three good ones and look worse, and the good ones are the ones that come back out. Metal, glass and wood age; printed plastic does not.",
      "Favour pieces that are not exclusively Christmas. Anything in aged metal or natural wood can stay up into the new year, which is the difference between decorating a house and dressing a set.",
      "Think about where it hangs before you buy it. A hanging bell needs a hook, a handle or a branch strong enough for it — a wreath hook on a door, a mantel edge or a substantial tree branch rather than a tip.",
      "Store dry. A metal decoration put away damp will show it by next December; wrap loosely and keep it out of an unheated damp garage.",
    ],
    faqs: [
      [
        "Why so few products in this range?",
        "It is being built deliberately. We would rather list a handful of decorations worth unpacking a second year than fill a page with pieces that last one season.",
      ],
      [
        "Where can I hang a metal bell?",
        "Anywhere with a solid fixing — a wreath hook on a front door, a mantel, or a substantial branch rather than a tip. Check the weight on the product page against whatever it is hanging from.",
      ],
      [
        "Can these stay up after Christmas?",
        "That is the idea. Aged metal and natural materials read as festive in December and as ordinary decor in January, unlike anything printed with a snowflake.",
      ],
      [
        "How should I store Christmas decorations?",
        "Dry and loosely wrapped. Damp is what corrodes metal and warps wood over eleven months, so a heated cupboard beats an unheated garage.",
      ],
    ],
  },
  {
    slug: "kitchen-shelving",
    metaTitle: "Kitchen Shelving | Kitchen | Kaiku",
    metaDescription:
      "Freestanding teak and reclaimed wood kitchen shelving from £121. Corner units, A-frames and display stands that need no wall fixing.",
    intro: [
      "Kitchen storage almost always runs out at the same place: worktop is full, cupboards are full, and the only space left is vertical. Everything in this range is freestanding, so it adds shelves without drilling into tile or losing a deposit.",
      "The pieces are teak and reclaimed wood: a six-shelf display unit on castors, three- and four-tier corner units at 90cm and 135cm, a 100cm log shelf, and a folding A-frame that puts away flat. Heights run 98cm to 180cm, depths 23 to 40cm, and prices £121 to £390.",
    ],
    guide: [
      "Use the corner. It is the least usable square metre in most kitchens and the one place a 3- or 4-tier corner unit turns dead floor into four surfaces without narrowing a walkway.",
      "Check the depth against your gangway before the height. A 40cm-deep unit in a galley kitchen with 90cm between runs leaves 50cm to walk through, which is tight with an oven door. In that case the 23cm pieces are the honest answer.",
      "Put weight low and heat away. Solid teak carries plenty, but load the bottom shelves with the jars and appliances and keep the top for light things — and keep any wood unit clear of the hob's splash zone and out of the direct steam of a kettle.",
      "Choose castors or folding for a kitchen that changes. The wheeled display unit can be pulled out to reach behind, and the A-frame folds flat when you want the floor back — both worth more than a fixed shelf in a room that also has to be cooked in.",
    ],
    faqs: [
      [
        "Do I need to fix this shelving to the wall?",
        "No. Everything in this range is freestanding, which is the point — it adds shelves to a rented or tiled kitchen with no drilling. Load the bottom shelves heaviest so the unit stays stable.",
      ],
      [
        "How much depth can I give up in a narrow kitchen?",
        "Keep at least 90cm of clear walkway with the oven door shut, and more if it opens across. In a galley kitchen a 23cm-deep unit fits where a 40cm one blocks the room.",
      ],
      [
        "Is teak all right near a hob or a sink?",
        "Near, yes; in the splash zone, no. Keep it out of direct steam from a kettle and away from hob spatter, and wipe spills off rather than letting them sit.",
      ],
      [
        "How do I look after solid teak indoors?",
        "Dust it and wipe it with a barely damp cloth. Indoors it needs no oiling to survive — oil only if you want to deepen the colour — and it should be kept off a radiator, which is what opens up joints.",
      ],
    ],
  },
  {
    slug: "kitchen-storage",
    metaTitle: "Kitchen Storage | Kitchen | Kaiku",
    metaDescription:
      "Glass storage jars with acacia lids, bamboo boards, reclaimed wood chests and crates from £19. How to choose jar sizes that actually fit.",
    intro: [
      "Decanting dry goods into glass is the one storage change that pays for itself: you can see what you have, packets stop falling over, and a cupboard stays tidy without a system. The Freska range here runs ribbed round jars with acacia wood lids at 250ml, 550ml, 800ml and 1100ml, and in sets of five in both ribbed and clear glass.",
      "Around them sit the pieces that hold the bulkier things — a tall reclaimed teak chest of five drawers, a four-drawer recycled wood chest, wooden storage crates in threes, a large storage tub, and Aleki bamboo chopping and serving boards in large and extra large. Prices start at £19.",
    ],
    guide: [
      "Match jar sizes to standard pack sizes rather than buying one size. A 500g bag of pasta or rice needs about 800ml to 1100ml; 250ml suits spices, seeds and tea. A set of five in mixed sizes is more useful in practice than five identical jars.",
      "Measure the shelf height, not the jar. Most kitchen cupboard shelves are 20 to 25cm apart, so a tall jar that fits the worktop will not necessarily fit above it — check the total height with the lid on.",
      "Keep the jars out of direct sun. Glass is inert and airtight with a good seal, but sunlight on a worktop bleaches spices and turns nuts and oils rancid faster than a cupboard ever will.",
      "For the bulky things, buy furniture rather than boxes. A drawer chest holds the awkward middle category — tea towels, foil, bags, batteries — that has no home in a kitchen, and unlike stacked crates you can reach the bottom of it without unloading the top.",
    ],
    faqs: [
      [
        "What size storage jar do I need?",
        "800ml to 1100ml takes a standard 500g bag of pasta, rice or flour. 250ml is right for spices, seeds and loose tea. Mixed sizes are more useful than one size repeated.",
      ],
      [
        "Will the jars fit in my cupboard?",
        "Measure the shelf gap first — most are 20 to 25cm — and compare it with the jar height including the lid, which each product page lists. Tall jars often have to live on the worktop.",
      ],
      [
        "Are the acacia wood lids airtight and dishwasher safe?",
        "The lids seal for dry storage. Wash them by hand and dry them straight away: a dishwasher cycle is what cracks and bleaches a wooden lid, and it is not needed for jars holding dry goods.",
      ],
      [
        "How do I look after a bamboo board?",
        "Hand wash in warm water, dry it upright, and oil it occasionally with a food-safe oil. Never soak it or put it in a dishwasher — bamboo is laminated, and soaking is what delaminates it.",
      ],
    ],
  },
  {
    slug: "kitchen-furniture",
    metaTitle: "Kitchen & Dining Furniture | Kitchen | Kaiku",
    metaDescription:
      "Dining tables, chairs and complete sets from £112. How to size a table to a room, allow per-seat width and choose a practical top.",
    intro: [
      "The dining table is the piece of furniture most often bought a size too large. It is the one that has to be walked around every day, and 20cm too much length costs more in usable room than it adds in seats. This is the largest furniture range on the site — sixty-six pieces, from £112 for a single chair to £2,459 for a complete set.",
      "It runs from four- and six-seat sets — the Vermont white-wash round, the Weston and Westford in marble effect, the Wimslow in tempered glass — to individual chairs in rattan and oak: the Lagom range in black, natural and white wash, and the Lyon cross-back. Tables reach 240cm long, and chair and table heights run 69cm to 143cm.",
    ],
    guide: [
      "Allow 60cm of table edge per person and about 90cm of clearance behind each chair. That clearance is the figure that decides the table, not the seat count: a 200cm table in a room without 90cm behind the chairs seats six people who cannot get out.",
      "Round for small and busy rooms, rectangular for long ones. A round table takes less floor for the same number of seats, has no corners to catch a hip, and seats an extra person at a squeeze. A rectangular table follows the line of a galley or a knocked-through room instead of interrupting it.",
      "Choose the top for the traffic. Marble effect and tempered glass are the most striking and show the most — rings, fingerprints, chips at a corner. Oak, mango and rattan-and-wood combinations take daily use and homework and look better for it.",
      "Buy the set where the set exists. A matched table and six chairs here costs less than the pieces separately and removes the seat-height problem — an 18 to 30cm gap between seat and table top is what makes a chair comfortable, and mismatched pieces frequently miss it.",
    ],
    faqs: [
      [
        "What size dining table fits my room?",
        "Allow 60cm of table edge per person, then check you have about 90cm behind each chair to stand up and walk past. That clearance, not the floor area, is what decides the maximum table.",
      ],
      [
        "Round or rectangular dining table?",
        "Round for a small or busy room — less floor for the same seats, no corners, and it takes an extra person at a push. Rectangular for a long room or one people walk through.",
      ],
      [
        "Is a marble-effect or glass top practical with children?",
        "Less so. Both show rings and fingerprints, and both chip at the corners. Oak, mango wood and rattan-and-wood sets take the same treatment without showing it.",
      ],
      [
        "Should I buy a table and chairs as a set?",
        "Usually yes. The set costs less than the pieces bought separately, and it guarantees the seat-to-table gap lands in the comfortable 18 to 30cm range instead of leaving you eating with your chin on the table.",
      ],
    ],
  },
  {
    slug: "kitchen-lighting",
    metaTitle: "Kitchen Lighting | Kitchen | Kaiku",
    metaDescription:
      "Pendant lights for kitchen islands and dining tables from £58, including three-colour-temperature fittings. Heights, spacing and bulb choice.",
    intro: [
      "A kitchen needs bright, honest light where food is prepared and something softer where it is eaten, and one ceiling fitting cannot do both. The pendants here are for the second job — over an island, a peninsula or a table — where a hanging fitting puts the light on the surface instead of on the whole room.",
      "The range covers the Lenno large gold pendant, the Wyra black framed pendant, the Solara orb, and two fittings with three switchable colour temperatures, which lets the same light be warm in the evening and neutral for cooking. Prices run £58 to £299, and drops reach 155cm.",
    ],
    guide: [
      "Hang the bottom of the shade 75 to 90cm above the worktop or table. Higher and the light spreads and stops being useful; lower and it is in the eyeline of anyone sitting across from you.",
      "For an island, use two or three pendants rather than one. Space them evenly along the length with about 60 to 75cm between centres, and keep 30cm clear at each end so the run reads as deliberate.",
      "Pick colour temperature by what happens under the light. Around 3000K is right over a dining table; 4000K is genuinely better over a chopping surface. Where the same pendant does both, a three-temperature fitting is the honest answer rather than a compromise.",
      "Check the drop against your ceiling. Most of these fittings adjust, but the maximum drop matters in a room with a high or a sloped ceiling, and the minimum matters under 2.4m. Kitchen pendants are hard-wired to a ceiling rose, so unless there is already a fitting in the right place this is electrician's work.",
    ],
    faqs: [
      [
        "How high should a kitchen pendant hang?",
        "75 to 90cm from the bottom of the shade to the worktop or table. That keeps the light on the surface and out of the eyeline of anyone sitting opposite.",
      ],
      [
        "How many pendants over an island?",
        "Two or three, spaced 60 to 75cm apart with about 30cm clear at each end. A single pendant over a long island lights the middle and leaves both ends dim.",
      ],
      [
        "What colour temperature for a kitchen?",
        "3000K over a table, 4000K over a work surface. A fitting with switchable colour temperatures covers both, which is why two of the pendants here offer three settings.",
      ],
      [
        "Can I fit a pendant myself?",
        "Only by replacing an existing ceiling fitting on a like-for-like basis. Moving or adding a light point is notifiable work — use a qualified electrician, and have them check the ceiling can carry the weight, which each product page lists.",
      ],
    ],
  },
  {
    slug: "living-room-lighting",
    metaTitle: "Living Room Lighting | Living Room | Kaiku",
    metaDescription:
      "Crystal chandeliers, semi-flush ceiling lights, LED wall lights and table lamps from £39. How to layer light in a living room.",
    intro: [
      "One ceiling light in the middle of a living room is the reason so many of them feel like waiting areas after dark. A room that works has three layers: something overhead for when you need to see, something at head height for atmosphere, and something at elbow height to read by.",
      "This range covers all three. Overhead there are crystal chandeliers — the K9 droplet, spiral raindrop, square five-light and eight-light pendant — plus semi-flush fittings for lower ceilings including a Tiffany-style three-light. At head height, LED wall lights in sets of two; at elbow height, gesso table lamps in ribbed, round and rectangular forms. Prices run £39 to £290.",
    ],
    guide: [
      "Get the ceiling fitting right for the height. Under about 2.4m, a semi-flush fitting gives the decorative effect without hanging into the room. Over a stairwell or in a room with 2.7m or more, a hanging chandelier is what fills the volume — and the bottom of it should stay at least 2.1m above the floor where people walk.",
      "Then add the layer that gets used. Almost nobody wants the big light on at nine in the evening, which means the table lamps and wall lights are doing the real work. Two lamps at opposite corners beat one bright fitting overhead every time.",
      "Aim for 2700K bulbs across all of it, and put whatever you can on a dimmer. Mixed colour temperatures in one room are what make a living room feel unresolved — one warm bulb next to one neutral one reads as a fault, not a choice.",
      "Place a reading lamp by the seat, not by the wall. The bottom of the shade wants to be near seated eye level, roughly 100 to 110cm from the floor for a lamp on a side table, so the light falls on the page rather than in your eyes.",
    ],
    faqs: [
      [
        "Chandelier or semi-flush ceiling light?",
        "Ceiling height decides it. Under about 2.4m choose semi-flush; above 2.7m, or over a stairwell, a hanging fitting fills the space properly. Keep the bottom of any pendant at least 2.1m above a walkway.",
      ],
      [
        "How many lamps does a living room need?",
        "At least two beyond the ceiling light, at opposite ends of the room. The overhead fitting is for finding things; the lamps are the light you actually live under, and one is never enough for a whole room.",
      ],
      [
        "How high should a reading lamp be?",
        "The bottom of the shade at about 100 to 110cm from the floor, near seated eye level. That puts the light on the page rather than in your eyes or on the ceiling.",
      ],
      [
        "What bulbs should I use?",
        "2700K warm white throughout, and dimmable where the fitting allows. Mixing warm and neutral bulbs in one room is the most common reason a living room's lighting feels wrong without anyone being able to say why.",
      ],
    ],
  },
  {
    slug: "rugs",
    metaTitle: "Rugs | Living Room | Kaiku",
    metaDescription:
      "Rugs coming soon to Kaiku. How to size a rug to a seating group, choose a pile for the traffic, and stop it moving on a hard floor.",
    intro: [
      "A rug is the cheapest way to make a living room feel finished and the easiest thing to buy in the wrong size. The usual error is a rug two sizes too small — a mat marooned in the middle of the floor with all the furniture standing off it, which makes the room look smaller rather than larger.",
      "We are curating this range now. The guidance below is what we would tell anyone buying one anywhere, and the seating, tables and lighting ranges cover the rest of the room in the meantime.",
    ],
    guide: [
      "Size to the furniture, not to the floor. The front legs of the sofa and every armchair should stand on the rug — that single rule is what visually ties a seating group together. For most three-piece arrangements that means 200 x 290cm or larger, not 160 x 230cm.",
      "Under a dining table, add 60 to 70cm on every side of the table so a chair stays on the rug when it is pulled out. A chair leg dropping off the edge every time someone stands up is the reason dining rugs get given away.",
      "Match the pile to the traffic. A short dense pile survives a hallway or a room with a dog and vacuums clean. A deep pile belongs beside a bed or in a room that is mostly sat in — it flattens in a walkway and shows every track.",
      "On a hard floor, buy the underlay with the rug. A grip underlay stops the rug creeping, adds a little softness, and is the difference between a rug that stays where it was put and one that has to be straightened weekly.",
    ],
    faqs: [
      [
        "What size rug for a living room?",
        "Large enough that the front legs of the sofa and all the chairs stand on it. For a typical three-piece group that is 200 x 290cm or bigger — a smaller rug floating in the middle makes the room look smaller.",
      ],
      [
        "What size rug under a dining table?",
        "The table's footprint plus 60 to 70cm on every side, so chairs stay on the rug when pulled out. Anything less and a chair leg catches the edge every time someone sits down.",
      ],
      [
        "Which pile height should I choose?",
        "Short and dense for hallways, dining rooms and anywhere with a dog — it takes traffic and vacuums clean. Deep pile for bedsides and rooms that are mostly sat in, where it will not be walked flat.",
      ],
      [
        "How do I stop a rug sliding on a wooden floor?",
        "A grip underlay cut slightly smaller than the rug. It stops the creeping, protects the floor and the rug backing, and adds a bit of underfoot softness at the same time.",
      ],
    ],
  },
  {
    slug: "tv-units",
    metaTitle: "TV Units & Media Furniture | Living Room | Kaiku",
    metaDescription:
      "Media units from 90cm to 220cm wide, £139 to £1,591. How to size a TV unit, get the screen height right and hide the cables.",
    intro: [
      "A media unit has to do three unglamorous things well: be wider than the television, be the right height to watch from a sofa, and swallow the cables. Get those right and the piece disappears into the room; get the height wrong and the whole wall looks off by 20cm.",
      "The range runs 90cm to 220cm wide and 44cm to 66cm tall, in oak veneer (Westbury, Hampstead), mango wood and brass or leather (Marwar, Arti), shagreen effect and walnut (Kempton, Deskey), fluted glass (Addison), marble top (Spezia) and reclaimed chevron (Lombok). Prices are £139 to £1,591.",
    ],
    guide: [
      "Buy the unit wider than the screen — ideally 20cm clear either side. A television overhanging its stand looks precarious even when it is bolted to a wall, and the extra width is where a speaker or a box actually goes.",
      "Then check the height against your sofa. The middle of the screen wants to be at seated eye level, roughly 100 to 110cm from the floor. Subtract half your TV's height from that to get the ideal top surface: for a 55-inch screen (about 68cm tall) that is a unit around 66cm to 76cm high — which is why the taller units here suit large screens and the 44cm ones suit wall-mounted televisions.",
      "Count the boxes before choosing between open shelves and doors. A console, a sound bar and a set-top box need ventilation and remote line-of-sight; doors that are solid rather than fluted or mesh will need leaving open, at which point they are worse than shelves.",
      "Last, plan the cables. Check whether the unit has a rear cut-out — most media units here do — and measure from the socket to the unit before buying, because an extension trailing across a hearth undoes the whole piece.",
    ],
    faqs: [
      [
        "How wide should a TV unit be?",
        "Wider than the television, with about 20cm clear each side. Beyond looking better, that margin is where a sound bar, a console or a speaker actually fits.",
      ],
      [
        "How high should my TV be?",
        "Centre of the screen at seated eye level, around 100 to 110cm from the floor. Take half the screen's height off that figure to find the right unit height — a 55-inch TV on a stand wants a unit roughly 66 to 76cm tall.",
      ],
      [
        "Open shelves or doors?",
        "Doors if you want the boxes hidden and they are fluted, glazed or mesh, so remotes still work and heat escapes. Solid doors mean a games console sitting in a sealed box, which is worse than an open shelf.",
      ],
      [
        "Can I hide the cables?",
        "Most units here have a rear cut-out for exactly that — the product page says. Measure from your socket to the unit's position first: an extension lead across the floor undoes a £900 piece of furniture.",
      ],
    ],
  },
  {
    slug: "desks",
    metaTitle: "Desks | Office | Kaiku",
    metaDescription:
      "Desks from 80cm to 120cm wide, £41 to £980 — oak veneer, folding, wall-mounted and compact desks with keyboard trays.",
    intro: [
      "A desk is judged on two measurements that have nothing to do with how it looks: the height it puts your elbows at, and whether there is room for your knees. Most discomfort at a desk is one of those two, and both are checkable before you buy.",
      "The range covers proper writing desks in oak veneer (Bradbury, Laxton, Grenoble), compact and folding designs for a corner or a spare room, a wall-mounted folding work table, and desks with keyboard trays, printer stands and integrated shelving. Widths run 80cm to 120cm, depths 40cm to 66cm, and prices £41 to £980.",
    ],
    guide: [
      "Height first. A desk at 72 to 75cm suits most adults in a standard chair — elbows at about 90 degrees, forearms level with the surface. If you are notably tall or short, the fix is the chair height and a footrest, not a different desk.",
      "Then depth. 60cm or more if you use a monitor, because a screen wants to be an arm's length from your eyes and a 40cm desk puts it far too close. Under 50cm is fine for a laptop, and that is what makes the compact desks here honest rather than a compromise.",
      "Choose storage by what actually lands on the desk. A single drawer takes the pens, chargers and paper that otherwise live on the surface; shelves above take the books. A keyboard tray buys back the whole depth of the desk on a shallow one.",
      "For a room that is not only an office, buy something that folds or mounts. A folding or wall-mounted desk gives a full work surface at 9am and the room back at 6pm, which is worth more in a bedroom or a dining room than an extra 20cm of width.",
    ],
    faqs: [
      [
        "What height should a desk be?",
        "72 to 75cm suits most adults, putting elbows at roughly 90 degrees with forearms level with the surface. Adjust the chair and add a footrest rather than looking for an unusual desk height.",
      ],
      [
        "How deep does a desk need to be for a monitor?",
        "At least 60cm. A screen should sit about an arm's length from your eyes, and a 40cm desk puts a monitor close enough to cause eye strain. Under 50cm is fine for a laptop.",
      ],
      [
        "What is the best desk for a small room?",
        "A folding or wall-mounted one. Both give a full-size work surface when you need it and hand the floor back afterwards, which matters more in a bedroom than a few extra centimetres of width.",
      ],
      [
        "Is a keyboard tray worth having?",
        "On a shallow desk, yes — it moves the keyboard off the surface and effectively gives you back the full depth for a monitor and paperwork. On a 70cm-deep desk it adds little.",
      ],
    ],
  },
  {
    slug: "office-lighting",
    metaTitle: "Office Lighting | Office | Kaiku",
    metaDescription:
      "Gesso table lamps for a desk or study, £219 to £290. How to light a desk without screen glare, and what colour temperature to use.",
    intro: [
      "Lighting a desk is mostly about where the light is not. A lamp behind the screen throws glare across it; a lamp directly overhead casts your own hands' shadow onto the page. The workable position is off to one side, slightly in front, on the opposite side to your writing hand.",
      "The lamps here are the gesso range — bamboo, large ribbed, large round and small rectangular — in a chalky plaster-like finish that diffuses rather than glares, standing 55cm to 88cm tall. Prices are £219 to £290.",
    ],
    guide: [
      "Position before purchase. Put the lamp on the side opposite your writing hand, slightly forward of the screen. That is the one placement that lights the desk without either glaring off the monitor or being blocked by your own arm.",
      "Get the height right for the task. For desk work the bottom of the shade wants to sit at roughly eye level when seated — around 40 to 55cm above the desk surface, which is what the 55cm to 88cm lamps here are designed around.",
      "Choose 3000K to 4000K for a working lamp. Warmer than 3000K is lovely in a living room and makes a desk feel sleepy; cooler than 4000K reads clinical. Somewhere in between is right for reading and screen work in the same session.",
      "Do not rely on one source. A single desk lamp in a dark room creates a bright pool against a black surround, and the constant pupil adjustment between screen and shadow is what tires eyes. Keep some ambient light in the room as well.",
    ],
    faqs: [
      [
        "Where should a desk lamp go?",
        "On the side opposite your writing hand, slightly in front of the screen. Behind the monitor it glares off the glass; directly overhead it casts your own shadow onto what you are reading.",
      ],
      [
        "What colour temperature is best for working?",
        "3000K to 4000K. Warmer reads cosy and makes a desk feel sleepy, cooler reads clinical, and this range suits both paper and screen in one sitting.",
      ],
      [
        "How tall should a desk lamp be?",
        "Enough that the bottom of the shade is around 40 to 55cm above the desk — near seated eye level. The lamps here stand 55cm to 88cm, which covers a standard 72 to 75cm desk.",
      ],
      [
        "Is one desk lamp enough?",
        "Not on its own in a dark room. A bright pool against a black background makes your eyes work constantly to adjust — keep some general light in the room alongside the task lamp.",
      ],
    ],
  },
  {
    slug: "office-shelving",
    metaTitle: "Office Shelving | Office | Kaiku",
    metaDescription:
      "Freestanding teak and reclaimed wood shelving for a study, £121 to £390. Corner units and A-frames that need no wall fixing.",
    intro: [
      "A home office fills up faster than any other room, and usually in a house where drilling into the wall is either awkward or not allowed. Everything in this range is freestanding, so it adds shelf metres without a single fixing.",
      "The pieces are teak and reclaimed wood: a six-shelf display unit on castors, three- and four-tier corner units at 90cm and 135cm, a 100cm log shelf and a folding A-frame that puts away flat. Heights run 98cm to 180cm, depths 23cm to 40cm, prices £121 to £390.",
    ],
    guide: [
      "Work out the shelf metres you need before the style. A metre of shelf holds roughly 25 to 30 books or eight or nine box files, and box files are 32cm tall — which rules out any unit with shelves closer together than that.",
      "Use the corner. In a room that also has a desk, a window and a door, the corner is the only floor that is not on somebody's route, and a 3- or 4-tier corner unit turns it into four surfaces.",
      "Watch the depth against the desk chair. You need to be able to push back and stand up: leave about 90cm behind the desk, and where that is tight take the 23cm-deep pieces rather than the 40cm ones.",
      "Load heavy low. Paper is dense — a full box file weighs a couple of kilos and a metre of them is a serious load. Keep files and reference books on the bottom shelves and the light things at the top, especially on a wheeled unit.",
    ],
    faqs: [
      [
        "Will box files fit these shelves?",
        "Only where the shelf gap exceeds 32cm, which is a standard box file's height. Check the internal shelf spacing on the product page rather than the unit's overall height.",
      ],
      [
        "Do I need to fix the shelving to the wall?",
        "No — all of it is freestanding, which is the point in a rented or awkwardly-walled study. Load the bottom shelves heaviest so the unit sits stable, particularly the one on castors.",
      ],
      [
        "How much shelf do I need?",
        "A metre holds roughly 25 to 30 books or eight to nine box files. Count what is currently in piles on the floor and add half again — a study fills the shelving you give it.",
      ],
      [
        "Is a wheeled unit stable enough for books?",
        "Yes, with the weight kept low. Put the reference books and files on the bottom shelves and keep the top for light items, and lock or chock the castors if the floor is not level.",
      ],
    ],
  },
  {
    slug: "cold-plunges",
    metaTitle: "Cold Plunge & Ice Baths | Kaiku",
    metaDescription:
      "The SaunaPlunge Peak Plunge ice bath with integrated chiller at £4,725. Temperature, siting, power and what a chiller actually changes.",
    intro: [
      "A cold plunge only works if it is cold on the morning you do not feel like it. That is the entire argument for a chiller: a tub filled with ice is a project each time and a chilled plunge is a decision that takes ten seconds, and the difference shows up in how many times a month it actually gets used.",
      "The SaunaPlunge Peak Plunge is a stainless steel plunge with an integrated chiller at £4,725. It holds temperature continuously, filters the water, and is designed to sit outdoors alongside a sauna — the contrast between the two is the point, and it is why the pairing is the centre of the wellness range.",
    ],
    guide: [
      "Decide on the temperature you will actually use. Most people settle between 8 and 12°C for two to four minutes; below 5°C is for the experienced and buys less benefit than the extra discomfort suggests. A chiller lets you set it and leave it, which matters more than the bottom of its range.",
      "Site it for the exit, not the entry. The thirty seconds after you get out is when you are barefoot, cold and not thinking clearly — so a level, non-slip surface, a handhold, and a short walk to a towel and a door. Straight from a sauna to a plunge and back is the arrangement that gets used.",
      "Plan the power and the water. A chiller needs a permanent outdoor-rated supply, ideally its own RCD-protected circuit installed by a qualified electrician, and the unit needs to be filled and occasionally drained — so proximity to a tap and somewhere for the water to go both matter.",
      "Never plunge alone if you are new to it, get medical advice first if you have a heart condition, high blood pressure or are pregnant, and get out at the point of shivering rather than pushing on. Cold water does the work in the first few minutes; the rest is risk without return.",
    ],
    faqs: [
      [
        "What temperature should a cold plunge be?",
        "8 to 12°C suits most people for two to four minutes. Colder is not better — below about 5°C the discomfort rises much faster than any additional benefit, and the risk rises with it.",
      ],
      [
        "Why pay for a chiller instead of using ice?",
        "Consistency and effort. Ice is a task every session and the temperature is different every time; a chiller holds a set temperature continuously, which is what turns a plunge from an occasional event into a routine.",
      ],
      [
        "What do I need to install one?",
        "A firm level outdoor surface, a permanent outdoor-rated electrical supply on its own RCD-protected circuit fitted by a qualified electrician, and access to a tap and a drain for filling and emptying.",
      ],
      [
        "Is cold water immersion safe?",
        "For most healthy adults, within sensible limits. Do not plunge alone when you are new to it, get out when you start to shiver, and take medical advice first if you are pregnant or have a heart condition or high blood pressure.",
      ],
    ],
  },
  {
    slug: "outdoor-kitchens",
    metaTitle: "Outdoor Kitchens & Barbecues | Kaiku",
    metaDescription:
      "Gas barbecues and Himalayan salt cooking plates from £47. Burner counts, cylinder sizes, siting and the safety rules that actually matter.",
    intro: [
      "Cooking outdoors properly is less about the grill than about the space around it. A burner with nowhere to put a plate down means everything gets carried back to the kitchen, which is how an outdoor kitchen quietly stops being used.",
      "This range covers the cooking itself: a five-burner steel gas barbecue with a lid thermometer, and a 4+1 burner with a side table for exactly the reason above. Alongside them sits a Himalayan salt cooking plate — a slab that seasons as it cooks and works on a barbecue or a hob. Prices run £47 to £252.",
    ],
    guide: [
      "Count burners by how you cook, not by how many people you feed. Two zones — one hot, one off or low — is what lets you sear and then finish something without burning it. Every barbecue here has at least that, and the fifth burner on a side plate is for onions and sauces rather than more capacity.",
      "Buy the side table. It is the difference between a barbecue and an outdoor kitchen: somewhere for the raw plate, the cooked plate, the tongs and a drink, so that nobody is walking indoors mid-cook.",
      "Plan the gas. Neither barbecue here includes a cylinder, both run on LPG propane, and a standard 13kg patio cylinder gives many hours of cooking. Buy the regulator and hose to match the cylinder, keep the cylinder upright and outdoors, and check the hose annually for cracking.",
      "Site it once, properly. Outdoor use only, on a firm level surface, well clear of walls, fences, canopies and anything overhanging — a parasol above a lit barbecue is the most common serious accident in a garden. Let it cool fully before covering or moving it.",
    ],
    faqs: [
      [
        "Is a gas cylinder included?",
        "No. Both barbecues here run on LPG propane and the cylinder is bought separately, along with a regulator and hose matched to it. A standard 13kg patio cylinder lasts many hours of cooking.",
      ],
      [
        "How many burners do I need?",
        "Enough for two zones — one hot for searing, one low or off for finishing. That matters far more than the total number; the extra side burner is for sauces and onions, not for capacity.",
      ],
      [
        "Where can I put a gas barbecue?",
        "Outdoors only, on a firm level surface, clear of walls, fences and anything overhanging. Never under a parasol, canopy or pergola roof, and never in a garage or a shed even after it has cooled.",
      ],
      [
        "How does a Himalayan salt cooking plate work?",
        "Heat it gradually on a barbecue or hob and cook directly on the surface — it seasons the food as it cooks. Never wash it: wipe it down when cool with a damp cloth and let it dry, because water dissolves the slab.",
      ],
    ],
  },
  {
    slug: "indoor-saunas",
    metaTitle: "Indoor Infrared Saunas | Sauna | Kaiku",
    metaDescription:
      "Two and four-person indoor infrared saunas in hemlock, £2,813 to £3,938. Space, power, flooring and infrared versus traditional heat.",
    intro: [
      "An indoor sauna is a different proposition from a garden cabin: no groundwork, no roof, no weather — but a real conversation about floor space, power and where the heat goes. Both cabins here are infrared, which is the format that makes an indoor installation practical, because it runs cooler and draws less than a traditional stove.",
      "The SaunaPlunge Dales Glow comes in two-person and four-person sizes, in hemlock with glass fronts, both 190cm tall and between 105cm and 180cm on plan. Prices are £2,813 and £3,938.",
    ],
    guide: [
      "Measure the plan and the ceiling. At 190cm tall these fit under a standard ceiling with clearance, but you also need to get the flat-packed panels into the room — check the door widths, the stair turn and any awkward landing before anything else.",
      "Then the power. An infrared cabin plugs into a domestic supply, but it should be on a circuit that is not already loaded, and a dedicated socket is the sensible way to install one. Have an electrician confirm the circuit rather than assuming the nearest socket will do.",
      "Choose the floor before the room. Hard, sealed and level: tile, sealed concrete, engineered board. Not carpet, and not an unsealed timber floor that will take up moisture from bodies rather than from steam — infrared is dry heat, but people are not.",
      "Understand what infrared is. It heats you rather than the air, so the cabin sits around 45 to 60°C rather than 80 to 90°C and gets there in ten to fifteen minutes. Sessions run longer and feel gentler. If you specifically want a hot dry room and steam off rocks, that is a traditional sauna, and it is a different installation.",
    ],
    faqs: [
      [
        "What is the difference between infrared and a traditional sauna?",
        "Infrared warms your body directly, so the cabin runs at 45 to 60°C instead of 80 to 90°C, heats up in ten to fifteen minutes and uses less power. Traditional saunas heat the air and give you steam off hot rocks.",
      ],
      [
        "What electrical supply does an indoor sauna need?",
        "These plug into a domestic supply, but not into an already-loaded circuit. Have a qualified electrician confirm the circuit and, ideally, fit a dedicated socket for it.",
      ],
      [
        "What floor can I put it on?",
        "Something hard, level and sealed — tile, sealed concrete or engineered board. Avoid carpet and unsealed timber: the heat is dry but the people in it are not.",
      ],
      [
        "How much space do I need?",
        "The two-person cabin needs around 105 x 120cm of floor and the four-person up to 180cm, both 190cm tall. Just as important, check you can get the flat panels through the doors and up the stairs.",
      ],
    ],
  },
  {
    slug: "wellness-accessories",
    metaTitle: "Sauna & Wellness Accessories | Sauna | Kaiku",
    metaDescription:
      "Sauna essential oils and Himalayan salt cooking plates from £6.95. How to use oils safely on a sauna heater and care for a salt plate.",
    intro: [
      "The accessories are what turn a sauna from an appliance into a habit. Eucalyptus on the rocks is the difference between sitting in a hot room and actually wanting to; the ritual is most of the value.",
      "The range covers sweet birch and eucalyptus essential oils in 10ml and 50ml, and Himalayan salt cooking plates in round and square 20 x 20 x 5cm as well as a barbecue plate. Prices start at £6.95.",
    ],
    guide: [
      "Use essential oil correctly and it lasts months. A few drops go into the water in the ladle, and the water goes onto the rocks — never neat oil onto a heater, which will scorch and can catch. Three or four drops in a full ladle is plenty.",
      "Choose the oil for the effect. Eucalyptus opens the airways and is the classic sauna scent; sweet birch is the traditional Finnish note, closer to the smell of a birch whisk. The 10ml bottles are the sensible way to find out which you prefer before buying 50ml.",
      "Ventilate and test first. In a small cabin, scent concentrates far more than expected — start with less than you think, and do not use oils at all if anyone using the sauna is asthmatic, pregnant or sensitive to fragrance without checking first.",
      "The salt plates need the opposite of normal care: never wash them. Heat them gradually, cook directly on the surface, and when cool wipe them with a barely damp cloth and dry them off. Water dissolves the slab, so soaking or a dishwasher destroys it.",
    ],
    faqs: [
      [
        "How do I use essential oil in a sauna?",
        "Three or four drops into the water in the ladle, then the water onto the rocks. Never pour neat oil onto a heater or rocks — it scorches and is a fire risk.",
      ],
      [
        "Eucalyptus or sweet birch?",
        "Eucalyptus is the sharper, airway-opening scent most people associate with a sauna. Sweet birch is the traditional Finnish note, closer to a birch whisk. The 10ml bottles are the cheap way to decide.",
      ],
      [
        "Can I wash a Himalayan salt cooking plate?",
        "No — water dissolves it. Let it cool, wipe it with a barely damp cloth and dry it off. Never soak it and never put it in a dishwasher.",
      ],
      [
        "Are sauna oils safe for everyone?",
        "Use them sparingly and with ventilation; scent concentrates quickly in a small cabin. Check with a doctor first if anyone using the sauna is asthmatic, pregnant, or sensitive to fragrance.",
      ],
    ],
  },
  {
    slug: "pergolas",
    metaTitle: "Pergolas & Gazebos | Outdoor Living | Kaiku",
    metaDescription:
      "Metal pergolas and gazebos with retractable or sliding canopies, £130 to £261. Anchoring, wind, drainage and what a canopy really does.",
    intro: [
      "A pergola is bought for shade and kept for the way it makes a patio feel like a room. The pieces here are the practical end of that: steel and metal frames with retractable or sliding canopies, so the same structure gives shade in July and lets the light through in September.",
      "The range covers 3 x 3m double-roof garden gazebos with netting, a pop-up version with a carry bag, a lean-to steel pergola for fixing against a house wall, and metal pergolas with sliding canopies, curtains and integrated drainage. Prices are £130 to £261.",
    ],
    guide: [
      "Anchor it, always. A canopy is a sail, and an unweighted pergola in a gust is the most expensive lesson in this catalogue. Bolt into a hard surface where you can, and where you cannot, weight every leg — and retract the canopy whenever you leave it for more than a day.",
      "Retract or slide beats fixed in a British garden. Shade is welcome for perhaps ten weeks a year; the other forty you want the light. A sliding or retractable canopy is what keeps a pergola from being the thing that makes the patio doors dark in November.",
      "Think about the water. A flat fabric canopy pools rain, and pooled water is what tears a canopy and bends a frame. The models here with drainage channels handle this properly; with any other model, retract it before heavy rain rather than after.",
      "Match the footprint to the furniture and the route. A 3 x 3m gazebo covers a four-seat table with room to push chairs back; it does not cover a six-seat table with a walkway around it. The lean-to design is the one to look at where the patio is narrow and one side can be the house.",
    ],
    faqs: [
      [
        "Does a pergola need anchoring?",
        "Yes, without exception. A canopy acts as a sail — bolt into a hard surface where you can, weight every leg where you cannot, and retract the canopy when you are away or high wind is forecast.",
      ],
      [
        "Retractable or fixed canopy?",
        "Retractable, in the UK. You want shade for a few weeks and light for the rest of the year, and a fixed canopy is what makes the room behind the patio doors dark in winter.",
      ],
      [
        "Will rain pool on the canopy?",
        "On a flat fabric canopy, yes, and pooling is what tears fabric and bends frames. Some models here have drainage channels; with any other, retract the canopy before heavy rain.",
      ],
      [
        "What size pergola for a dining table?",
        "A 3 x 3m frame covers a four-seat table with room to push chairs back. For six seats plus a walkway you need more, or a lean-to design fixed to the house so the whole footprint is over the table.",
      ],
    ],
  },
  {
    slug: "fire-pits",
    metaTitle: "Fire Pits & Patio Heaters | Outdoor Living | Kaiku",
    metaDescription:
      "Gas fire pit tables from 40,000 to 50,000 BTU, smokeless wood burners and patio heaters, £120 to £249. Siting, gas and safety.",
    intro: [
      "A fire pit is what extends a garden's season from four months to eight. The range here is built around gas fire pit tables — 40,000 and 50,000 BTU, at 71cm and 81cm across, some with a glass wind screen and some with a cover — because gas lights in seconds, has no smoke to sit downwind of, and turns off when you go inside.",
      "Alongside them are a portable smokeless wood-burning fire pit for anyone who wants the real thing, and electric and infrared patio heaters — hanging and ceiling-mounted — for a covered area where a flame would be wrong. Prices run £120 to £249.",
    ],
    guide: [
      "Choose the fuel by how you will use it. Gas for an hour after dinner on a weekday: instant, controllable, no ash. Wood for the evenings that are about the fire itself. Electric or infrared for a covered porch or a balcony where an open flame is not an option at all.",
      "Then size the output to the space. 40,000 BTU is right for four people around a table; 50,000 BTU suits a larger group or a more exposed garden. A glass wind screen matters more than the extra BTU if your patio catches a draught, because it stops the flame being blown flat.",
      "Site it once and properly. Firm, level, non-combustible ground — stone or concrete, not decking or grass — with clearance from walls, fences, furniture and anything overhead. Never under a parasol, canopy or pergola roof, and never indoors, in a garage or in a shed.",
      "Plan the gas and the covering. No fire pit here includes its cylinder; they run on LPG propane, need a matched regulator and hose, and the cylinder stays upright and outdoors. Let the unit cool completely before covering it, and store the cover on rather than off over winter.",
    ],
    faqs: [
      [
        "Is a gas cylinder included?",
        "No. The gas fire pits run on LPG propane, and the cylinder, regulator and hose are bought separately and must be matched to each other. The cylinder stays upright and outdoors at all times.",
      ],
      [
        "40,000 or 50,000 BTU?",
        "40,000 BTU suits four people around a table. Go to 50,000 for a bigger group or an exposed garden — though on a draughty patio a glass wind screen does more for the flame than the extra output.",
      ],
      [
        "Can I use a fire pit on decking or under a pergola?",
        "No to both. Fire pits need firm, level, non-combustible ground — stone or concrete — with nothing overhead. A canopy, parasol or pergola roof above a live flame is the most common serious garden accident.",
      ],
      [
        "Gas, wood or electric?",
        "Gas for convenience: instant, controllable, no smoke or ash. Wood when the fire itself is the evening. Electric or infrared for a covered porch or balcony where an open flame is not allowed.",
      ],
    ],
  },
  {
    slug: "garden-lighting",
    metaTitle: "Garden Lighting | Outdoor Living | Kaiku",
    metaDescription:
      "Solar bollards, lamp posts, rattan floor lanterns and LED string lights, £29 to £109. How to light a garden without cabling it.",
    intro: [
      "Garden lighting done well is not about brightness. It is about marking edges — a path, a step, the corner where the lawn ends — so a garden reads as a space after dark rather than a black rectangle beyond the glass.",
      "Almost everything here is solar, which means no cable, no electrician and no trench: dimmable bollard lights at 1.2m, 1.6m and 1.77m, Victorian three-head lamp posts at 1.8m, lamp posts with an integrated planter, rattan solar floor lanterns and a Boho floor lamp with a shelf. There is also a 13.6m warm white LED string. Prices are £29 to £109.",
    ],
    guide: [
      "Light the edges, not the middle. A pair of bollards at a step, one at a corner and one at the end of a path does more for a garden than a floodlight, and it does not turn the patio into a car park.",
      "Give solar the sun it needs. A solar light in the shade of a hedge will disappoint whatever the specification says — it wants six hours of direct light on the panel, so place the panel for the sun and the fitting for the effect, which on the taller lamp posts are usefully the same thing.",
      "Aim low and warm. Anything above about waist height that points sideways is glare in someone's eyes and a nuisance to a neighbour. Warm white (around 2700K) reads as an evening garden; cool white reads as a security light.",
      "Stake it properly and expect winter to be quieter. Push the spike into firm soil, not into a pot of loose compost. And a solar light in December with eight hours of grey daylight will run for an hour or two, not all night — that is the technology, not a fault.",
    ],
    faqs: [
      [
        "How much sun do solar garden lights need?",
        "About six hours of direct light on the panel to fill the battery. In the shade of a hedge or a fence they will underperform however good the fitting, so site the panel for the sun first.",
      ],
      [
        "Will solar lights work in winter?",
        "They work, but for less time — a couple of hours rather than all night on a grey December day. That is the daylight available, not a fault with the light.",
      ],
      [
        "Where should I put garden lights?",
        "At the edges and the changes of level: either side of a step, at a path corner, at the end of a lawn. Lighting the boundaries makes a garden read as a space; lighting the middle just makes a bright patch.",
      ],
      [
        "Warm or cool white outdoors?",
        "Warm white, around 2700K. Cool white reads as a security light and flattens planting; warm light makes foliage and stone look as they do by day.",
      ],
    ],
  },
  {
    slug: "planters",
    metaTitle: "Planters & Plant Stands | Outdoor Living | Kaiku",
    metaDescription:
      "86 planters and plant stands from £15 — resin, stoneware and ceramic, 11cm to 189cm. Drainage, weight and sizing to the plant.",
    intro: [
      "This is the largest range on the site, and the one where the details matter most: a pot without drainage kills a plant, and a pot planted in the wrong place is unliftable once it is full. Eighty-six pieces, from £15 to £246, in heights from 11cm to 189cm.",
      "Materials divide sensibly by use. Resin — the biggest group here — is light, frost-tolerant and the right answer for a large outdoor pot. Stoneware and ceramic are heavier and better looking and belong where they will not be moved. Alongside the pots are plant stands, floor-standing planters, tiered stands and matched sets in twos and threes.",
    ],
    guide: [
      "Check drainage before anything else. A plant in a pot with no hole sits in standing water and rots at the root, which is the single most common way a healthy plant dies. Each product page states whether a piece is drilled; where it is not, use it as a decorative outer with a drilled pot inside.",
      "Size the pot to the plant, then go one up. A pot should be 3 to 5cm wider in diameter than the current root ball for a small plant, and 5 to 10cm for a large one. Much bigger than that and the compost stays wet between waterings; much smaller and it dries out daily in July.",
      "Plant it where it is going to live. Compost weighs around 400 to 500kg per cubic metre wet — so a 50cm pot filled and watered is a two-person lift, and the taller pieces here are heavier still. Move it empty, then fill it.",
      "Match the material to the position. Resin takes frost, sun and a knock, and is the sensible choice for an exposed spot or a balcony where weight matters. Stoneware and ceramic look better and can craze or crack in a hard frost — either bring them in or raise them on feet so they are not standing in ice.",
    ],
    faqs: [
      [
        "Do these planters have drainage holes?",
        "It varies, and it is stated on every product page. A pot without drainage is fine as a decorative outer with a drilled pot inside, but planting directly into one is how roots rot.",
      ],
      [
        "What size pot does my plant need?",
        "3 to 5cm wider in diameter than the root ball for a small plant, 5 to 10cm for a larger one. Too big and the compost stays soggy; too small and it dries out every day in summer.",
      ],
      [
        "How heavy is a filled planter?",
        "Much heavier than the empty weight suggests — wet compost runs around 400 to 500kg per cubic metre, so a 50cm pot full and watered is a two-person lift. Position it before you fill it.",
      ],
      [
        "Which planters survive a frost?",
        "Resin handles frost, sun and knocks and is the safe choice outdoors year round. Stoneware and ceramic can craze or crack in a hard frost — raise them on feet so they are not sitting in ice, or bring them under cover.",
      ],
    ],
  },
  {
    slug: "water-features",
    metaTitle: "Water Features & Fountains | Outdoor Living | Kaiku",
    metaDescription:
      "Tabletop and freestanding fountains from £19 — cascading tiers, Buddha designs and LED-lit features. Pumps, topping up and winter care.",
    intro: [
      "Moving water changes a garden more than anything else you can put in it, because it works on hearing rather than sight — it covers traffic, fills a silence and makes a small courtyard feel enclosed. The range here starts at £19, which makes it the cheapest genuine change on the site.",
      "It runs from tabletop pieces at 12.5cm to 35cm — cascading rock formations, pots, Buddha and elephant designs, one with a working water wheel — up to freestanding four- and five-tier fountains with LED lighting at 72cm. Every piece includes its pump.",
    ],
    guide: [
      "Top it up, and keep the pump under water. A small feature loses water to evaporation surprisingly quickly in warm weather, and a pump run dry burns out — that is the one failure that turns a working fountain into an ornament, and it is entirely avoidable.",
      "Match the volume to the space. A tabletop piece is a sound you notice from two metres away; it will not be heard over a road. For a garden that needs to be filled, the multi-tier freestanding fountains are the ones that carry.",
      "Site it level and near a socket unless it is solar. A fountain on a slope runs unevenly and splashes out on one side, which empties it faster. Any mains pump needs an outdoor-rated socket and an RCD.",
      "Plan for winter. Standing water freezes, and ice expands and cracks a basin. Drain the feature, take the pump out, dry it and store it indoors from November — that is the difference between a fountain that lasts one season and one that lasts ten.",
    ],
    faqs: [
      [
        "Is a pump included?",
        "Yes, every water feature here comes with its pump. Keep it submerged at all times — running a pump dry is the most common way one of these fails.",
      ],
      [
        "How often do I need to top up the water?",
        "In warm weather, every few days for a tabletop piece. Evaporation is faster than people expect, and once the level drops below the pump inlet the pump is running dry.",
      ],
      [
        "What do I do with it in winter?",
        "Drain it, remove the pump, dry it and store it indoors. Water left in a basin freezes and the expanding ice cracks it — this is the single biggest cause of a fountain lasting only one season.",
      ],
      [
        "Will I actually hear a tabletop water feature?",
        "From a metre or two, yes — on a table, a desk or a patio beside where you sit. It will not fill a garden or mask traffic; for that you want one of the multi-tier freestanding fountains.",
      ],
    ],
  },
  {
    slug: "outdoor-storage",
    metaTitle: "Outdoor Storage | Outdoor Living | Kaiku",
    metaDescription:
      "Wooden outdoor storage from £40 — barrel tables, tubs and crate sets that double as seating. How to keep wood outdoors properly.",
    intro: [
      "The best outdoor storage does two jobs, because garden space is too short for a box that only holds things. Everything here is a second surface as well: a beer barrel table at 60 x 48.5cm, a matching barrel storage stool you can sit on, a large wooden storage tub and a set of three brown crates that stack or separate.",
      "All of it is wood — albasia and reclaimed timber — and all of it is between £40 and £149. It is the practical, honest end of garden storage rather than a plastic box that has to be hidden.",
    ],
    guide: [
      "Store dry things or use a liner. Wood outdoors breathes, which is exactly what you want for cushions that need to dry out and exactly what you do not want for anything that must stay bone dry. For tools, seed or paper, use a sealed bag or box inside the wooden piece.",
      "Raise it off the ground. Wood standing directly on soil or on a paving slab that puddles wicks water up into the base, which is where rot starts. A couple of feet, a pallet or even two bricks will double the life of the piece.",
      "Get it under cover in winter where you can. None of this is a weatherproof box, and the season that does the damage is not summer rain but months of standing damp. A porch, a shed wall or a covered corner is enough.",
      "Use the double duty. The barrel stool takes a person, the barrel table takes drinks, and the crates work stacked as shelves or separated as three carriers. In a small garden that is the whole argument for wood over plastic.",
    ],
    faqs: [
      [
        "Is this storage waterproof?",
        "No. These are breathable wooden pieces, which is good for cushions that need to dry out and bad for anything that must stay dry. Use a sealed bag or box inside for tools, seed or paper.",
      ],
      [
        "Can I leave it outside all year?",
        "It will last far longer under cover. Standing damp over winter does the damage, not summer rain — a porch, a shed wall or a covered corner makes the difference.",
      ],
      [
        "How do I stop the base rotting?",
        "Raise it off the ground on feet, a pallet or a couple of bricks. Wood standing on soil or on a slab that puddles wicks water up into the base, and that is where rot begins.",
      ],
      [
        "Can I sit on these?",
        "The barrel storage stool is made to be sat on. The tub and crates are storage and surfaces rather than seating — check the stated weight limit on the product page before putting weight on any of them.",
      ],
    ],
  },
  {
    slug: "privacy-screens",
    metaTitle: "Garden Privacy Screens | Outdoor Living | Kaiku",
    metaDescription:
      "Metal garden privacy screens and trellises, £95 to £119, 150cm to 198cm tall. Freestanding designs that need no planning permission.",
    intro: [
      "Overlooking is the most common complaint about a garden and the hardest to fix, because the obvious answer — a taller fence — runs straight into planning limits and a neighbour's opinion. A freestanding screen sidesteps both: it stands where you need it, blocks the sightline rather than the whole boundary, and can be moved.",
      "The range is laser-cut metal in black and green, 150cm to 198cm tall and 38cm to 45cm deep on the stand, in willow branch, banana leaf, grid, leaf, triangle, twisted line, rhombus and bamboo patterns. There is also a planter box with a back trellis and a screen designed as a climbing frame. Prices are £95 to £119.",
    ],
    guide: [
      "Block the sightline, not the boundary. Sit in the chair you actually use and look at what overlooks you. In most gardens that is a single window or one gap, and a 1.8m screen placed three metres from your seat covers it — while a screen against the fence covers almost nothing.",
      "Freestanding is the point. Rear-garden fences and walls are generally limited to 2m without permission, and screens attached to a boundary count towards that height. A freestanding screen inside the garden is a different thing, but if the site is a listed building or in a conservation area, check locally before buying.",
      "Weight or fix the base. A 2m panel with a leaf pattern catches wind, and the ones supplied with a stand still need weight on that stand — a paving slab, a planter or a ground fixing. Screens with a denser pattern catch more wind than open ones.",
      "Use it as a growing frame if you want it to disappear. The trellis and climbing designs here are made for it: a clematis or a star jasmine over two seasons turns a metal panel into a green wall, and does more for privacy than the metal did on its own.",
    ],
    faqs: [
      [
        "Do I need planning permission for a privacy screen?",
        "A freestanding screen inside the garden is not the same as raising a boundary fence, which is generally limited to 2m at the rear without permission. Check with your council if the property is listed or in a conservation area.",
      ],
      [
        "How tall a screen do I need?",
        "Sit where you actually sit and look at what overlooks you. A 1.8m screen placed two or three metres from the seat blocks a first-floor window; the same screen flat against the fence blocks almost nothing.",
      ],
      [
        "Will it blow over?",
        "Not if the base is weighted or fixed. A 2m patterned panel is a sail in a gust — put a slab or a planter on the stand, or fix it to the ground, and check it after high winds.",
      ],
      [
        "Can I grow plants up these screens?",
        "Yes, and it is the best way to use them. The trellis and climbing designs are built for it, and a clematis or star jasmine over a couple of seasons gives far denser cover than the metal alone.",
      ],
    ],
  },
];

/** Meta only, for categories whose intro and guidance are already written. */
const META_ONLY: {
  slug: string;
  metaTitle: string;
  metaDescription: string;
}[] = [
  {
    slug: "garden-furniture",
    metaTitle: "Garden Furniture | Outdoor Living | Kaiku",
    metaDescription:
      "Garden sofa sets, dining sets and loungers built to stay outdoors. How to size a set to a patio and what actually survives a British winter.",
  },
];

/** Room-level meta. Every department was inheriting the site default. */
const DEPARTMENT_META: {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
}[] = [
  {
    slug: "outdoor-living",
    metaTitle: "Outdoor Living | Kaiku",
    metaDescription:
      "Garden furniture, fire pits, pergolas, planters and outdoor lighting — pieces chosen to stay outside and last more than one summer.",
    description:
      "Garden furniture, fire pits, pergolas, planters, lighting and screening. Chosen to live outdoors rather than to photograph well for one season.",
  },
  {
    slug: "sauna",
    metaTitle: "Saunas | Kaiku",
    metaDescription:
      "Outdoor and indoor saunas, traditional and infrared, with the oils and accessories that make them a habit rather than a purchase.",
    description:
      "Outdoor cabins and indoor infrared saunas, with the oils and accessories that turn a sauna into something used weekly.",
  },
  {
    slug: "cold-plunge",
    metaTitle: "Cold Plunge & Ice Baths | Kaiku",
    metaDescription:
      "Chilled cold plunges and ice baths for home use. Set the temperature once and it is cold on the mornings you would rather it were not.",
    description:
      "Chilled plunges and ice baths for home use — the half of contrast therapy that a sauna on its own cannot do.",
  },
  {
    slug: "outdoor-kitchen",
    metaTitle: "Outdoor Kitchens | Kaiku",
    metaDescription:
      "Gas barbecues, side tables and salt cooking plates for cooking properly outdoors rather than carrying every plate back to the kitchen.",
    description:
      "Gas barbecues and the surfaces and plates that turn a grill into somewhere you can actually cook a whole meal outdoors.",
  },
  {
    slug: "living-room",
    metaTitle: "Living Room Furniture | Kaiku",
    metaDescription:
      "Sofas, coffee tables, media units, shelving, lighting and mirrors — the pieces that decide how a living room is actually used.",
    description:
      "Sofas, coffee and side tables, media units, shelving, storage and lighting for the room the house spends most of its evenings in.",
  },
  {
    slug: "bedroom",
    metaTitle: "Bedroom Furniture | Kaiku",
    metaDescription:
      "Beds, wardrobes, chests of drawers, bedside lighting and mirrors, including ottoman beds that give back a cubic metre of storage.",
    description:
      "Beds, wardrobes and chests, with the bedside lighting and mirrors that make a bedroom work at both ends of the day.",
  },
  {
    slug: "kitchen",
    metaTitle: "Kitchen & Dining | Kaiku",
    metaDescription:
      "Dining tables and chairs, freestanding shelving, glass storage jars and pendant lighting for the kitchen and the table beside it.",
    description:
      "Dining furniture, freestanding shelving, storage and pendant lighting — the kitchen and the table it feeds.",
  },
  {
    slug: "office",
    metaTitle: "Home Office Furniture | Kaiku",
    metaDescription:
      "Desks, storage, shelving and task lighting for a home office, including folding and wall-mounted desks for a room that is not only an office.",
    description:
      "Desks, storage, shelving and task lighting — including folding designs for a room that has to be something else by six o'clock.",
  },
  {
    slug: "bathroom",
    metaTitle: "Bathroom | Kaiku",
    metaDescription:
      "Illuminated and framed bathroom mirrors, freestanding storage and matching accessory sets in grey, white and black.",
    description:
      "Mirrors, storage and matching accessories — the pieces that make a bathroom look finished rather than assembled.",
  },
  {
    slug: "lighting",
    metaTitle: "Lighting | Kaiku",
    metaDescription:
      "Pendants, chandeliers, wall lights, table lamps and floor lamps across every room, with the heights and bulb guidance to fit them properly.",
    description:
      "Pendants, chandeliers, wall lights and lamps for every room, with the heights and spacings that decide whether they work.",
  },
  {
    slug: "decor",
    metaTitle: "Home Decor | Kaiku",
    metaDescription:
      "Mirrors, vases, wall art, lanterns and clocks — the layer that finishes a room once the furniture is in place.",
    description:
      "Mirrors, vases, wall art, lanterns and clocks: the layer that finishes a room after the furniture is in.",
  },
];

async function main() {
  const results: Record<string, unknown>[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const item of COPY) {
    const doc = await client.fetch<{
      _id: string;
      title: string;
      intro?: unknown[];
      buyingGuide?: unknown[];
      faqs?: unknown[];
      seo?: { metaTitle?: string; metaDescription?: string };
    } | null>(
      `*[_type=="category" && slug.current==$slug && !(_id in path("drafts.**"))][0]{_id,title,intro,buyingGuide,faqs,seo}`,
      { slug: item.slug },
    );
    if (!doc) {
      console.error(`NOT FOUND: ${item.slug}`);
      results.push({ slug: item.slug, found: false });
      continue;
    }

    // Never overwrite what an editor has already written.
    const patch: Record<string, unknown> = {};
    const wrote: string[] = [];
    if (!doc.intro?.length) {
      patch.intro = item.intro.map((text, i) => block("i", i, text));
      wrote.push("intro");
    }
    if (!doc.buyingGuide?.length) {
      patch.buyingGuide = item.guide.map((text, i) => block("g", i, text));
      wrote.push("buyingGuide");
    }
    if (!doc.faqs?.length) {
      patch.faqs = item.faqs.map(([question, answer], i) => ({
        _key: `f${i}`,
        _type: "faqEntry",
        question,
        answer,
      }));
      wrote.push("faqs");
    }
    if (!doc.seo?.metaTitle?.trim()) {
      patch["seo.metaTitle"] = item.metaTitle;
      wrote.push("seo.metaTitle");
    }
    if (!doc.seo?.metaDescription?.trim()) {
      patch["seo.metaDescription"] = item.metaDescription;
      wrote.push("seo.metaDescription");
    }

    results.push({
      slug: item.slug,
      title: doc.title,
      wrote,
      introChars: item.intro.join(" ").length,
      guideChars: item.guide.join(" ").length,
      metaTitleLen: item.metaTitle.length,
      metaDescLen: item.metaDescription.length,
    });

    if (Object.keys(patch).length === 0) continue;
    if (apply) {
      transaction.patch(doc._id, (p) => p.set(patch));
      queued += 1;
    }
  }

  for (const item of META_ONLY) {
    const doc = await client.fetch<{
      _id: string;
      seo?: { metaTitle?: string; metaDescription?: string };
    } | null>(
      `*[_type=="category" && slug.current==$slug && !(_id in path("drafts.**"))][0]{_id,seo}`,
      { slug: item.slug },
    );
    if (!doc) continue;
    const patch: Record<string, unknown> = {};
    const wrote: string[] = [];
    if (!doc.seo?.metaTitle?.trim()) {
      patch["seo.metaTitle"] = item.metaTitle;
      wrote.push("seo.metaTitle");
    }
    if (!doc.seo?.metaDescription?.trim()) {
      patch["seo.metaDescription"] = item.metaDescription;
      wrote.push("seo.metaDescription");
    }
    results.push({ slug: item.slug, wrote });
    if (Object.keys(patch).length && apply) {
      transaction.patch(doc._id, (p) => p.set(patch));
      queued += 1;
    }
  }

  for (const item of DEPARTMENT_META) {
    const doc = await client.fetch<{
      _id: string;
      description?: string;
      seo?: { metaTitle?: string; metaDescription?: string };
    } | null>(
      `*[_type=="department" && slug.current==$slug && !(_id in path("drafts.**"))][0]{_id,description,seo}`,
      { slug: item.slug },
    );
    if (!doc) {
      console.error(`DEPARTMENT NOT FOUND: ${item.slug}`);
      continue;
    }
    const patch: Record<string, unknown> = {};
    const wrote: string[] = [];
    if (!doc.seo?.metaTitle?.trim()) {
      patch["seo.metaTitle"] = item.metaTitle;
      wrote.push("seo.metaTitle");
    }
    if (!doc.seo?.metaDescription?.trim()) {
      patch["seo.metaDescription"] = item.metaDescription;
      wrote.push("seo.metaDescription");
    }
    if (!doc.description?.trim()) {
      patch.description = item.description;
      wrote.push("description");
    }
    results.push({ department: item.slug, wrote });
    if (Object.keys(patch).length && apply) {
      transaction.patch(doc._id, (p) => p.set(patch));
      queued += 1;
    }
  }

  for (const r of results) console.log(JSON.stringify(r));

  // Meta length sanity: a title over 60 or a description over 160 gets
  // truncated in a search result, which is worse than a shorter one.
  const bad = [
    ...COPY.map((c) => ({
      slug: c.slug,
      t: c.metaTitle.length,
      d: c.metaDescription.length,
    })),
    ...META_ONLY.map((c) => ({
      slug: c.slug,
      t: c.metaTitle.length,
      d: c.metaDescription.length,
    })),
    ...DEPARTMENT_META.map((c) => ({
      slug: c.slug,
      t: c.metaTitle.length,
      d: c.metaDescription.length,
    })),
  ].filter((x) => x.t > 60 || x.d > 160 || x.d < 70);
  if (bad.length) {
    console.log("\nMETA LENGTH PROBLEMS:");
    for (const b of bad) console.log(`  ${b.slug} title=${b.t} desc=${b.d}`);
  } else {
    console.log("\nAll meta titles <= 60 chars and descriptions 70-160 chars.");
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} documents patched.`);
  } else if (!apply) {
    console.log(`\nDry run — ${results.length} documents would be touched.`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-fill-category-content.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
