/**
 * Batch one — nine products, written by hand to the format of the existing pages.
 *
 * The shape is taken from Damien's own copy (Reclaimed Teak Sideboard Console Table
 * with 6 Drawers, 649 words): a two-sentence summary, five themed H2 sections each
 * opening on a lead paragraph and closing on a short one, "Why You'll Love It" with
 * nine bullets, a bold-labelled "Product Specifications" list, then Delivery & Returns.
 * The product name is bolded once, in the first paragraph, and nowhere else.
 *
 * Every factual claim traces to something on the document or visible in the
 * photograph: material, colour, weight and barcode from
 * `scripts/enrich-from-supplier.ts`; dimensions from the document; form, detail and
 * construction from the studio shots. **The supplier's own description is not used** —
 * it is trade-facing copy about merchandising opportunities, and it is on every
 * competitor's site.
 *
 * Looking at the photographs again for this rewrite corrected four things the first
 * pass had wrong, which is the argument for doing it this way:
 *
 *   - the Alto shelf unit has **six** glass shelves, not five, and its sides are a
 *     screen of closely spaced vertical rods rather than a plain frame
 *   - the Avaris armchair **includes a lumbar bolster cushion**, so the earlier claim
 *     that the colour "is the seat rather than a cushion you could swap" was wrong
 *   - the Amalfi bistro tables are woven all over — a drum-shaped woven pedestal on
 *     four spiral-wrapped legs — not a metal frame with a woven panel
 *   - the tractor seat has a twisted footrest bar, which is half the reason to want it
 *
 * Held out of this batch on purpose: **Avia Mist Armchair**. Its colour is tagged Grey
 * from the supplier's field and its photograph is a warm oatmeal bouclé. One of the
 * two is wrong and writing round it would bury the question, so it waits for Damien.
 *
 * Headings are deliberately different on every product. The padding audit found 67
 * headings shared across 3+ products — "Perfect for Interior Designers & Hospitality
 * Projects" on 25 of them — and repeating a skeleton is what makes 130 pages read as
 * one template. The Axis trio is the test of that: a carver, a side chair and the same
 * carver in another colourway are three near-identical products, and each one leads on
 * its own real difference — 60cm against 51cm, 4.7kg against 4.2kg, sage against putty.
 *
 * No lead time is stated anywhere below. None is recorded for these products, and
 * inventing "2-4 weeks" would be a promise nobody has made; the delivery bullet says
 * we confirm it instead, which is what src/server/emails/order-confirmation.ts already
 * does when a lead time is missing.
 */
import type { CopySection, ProductCopy } from "../lib/product-copy-blocks";

/**
 * Delivery and returns, as three sections at the end of the description.
 *
 * Shared wording is correct here: it is a policy, not a sales pitch, and both
 * scripts/audit-padding.ts and `CopySection.policy` exclude policy blocks from the
 * padding measurement for that reason. The one line that changes per product is the
 * closing caveat, because what "natural variation" means is different for a moulded
 * plastic chair, a hand-woven table and a cast iron stool.
 */
function policySections(variationCaveat: string): CopySection[] {
  return [
    { heading: "Delivery & Returns", policy: true },
    {
      heading: "Delivery",
      policy: true,
      paragraphs: [
        "Your order is checked and prepared before dispatch so that it arrives in the condition it left us in.",
      ],
      bullets: [
        "Free UK mainland delivery",
        "Fully tracked courier service",
        "Delivery timescale confirmed by email once your order is placed",
        "Additional delivery charges may apply to selected postcodes, the Scottish Highlands and non-mainland UK addresses",
      ],
    },
    {
      heading: "Returns",
      policy: true,
      paragraphs: [
        "If you are not completely satisfied, a return can be requested within 14 days of delivery and we will arrange collection.",
        "To qualify for a return, items must be:",
      ],
      bullets: [
        "Unused",
        "In their original packaging",
        "In resaleable condition",
      ],
      after: [variationCaveat],
    },
  ];
}

/**
 * Warranty, in the same shape as the delivery note.
 *
 * It says what is true and no more. No term length is invented: the supplier records
 * none for these products, and a stated "12 month warranty" that nobody has agreed to
 * is a promise Kaiku would have to honour. Statutory rights are the real protection and
 * they are worth stating plainly — this follows the wording already live on the site
 * rather than introducing a second version of it.
 */
const WARRANTY = [
  "This product does not carry a separate manufacturer warranty specified by the supplier.",
  "Your statutory consumer rights are unaffected. If it arrives faulty, damaged or not as described, contact us with your order number and photographs and we will put it right.",
  "* Faults on arrival: reported within 14 days",
  "* Manufacturing faults: covered under the Consumer Rights Act 2015",
].join("\n");

/** Delivery and returns again, for the delivery field — Damien asked for both there. */
const DELIVERY_AND_RETURNS = [
  "Your order is checked and prepared before dispatch so that it arrives in the condition it left us in.",
  "",
  "* Free UK mainland delivery",
  "* Fully tracked courier service",
  "* Delivery timescale confirmed by email once your order is placed",
  "* Additional delivery charges may apply to selected postcodes, the Scottish Highlands and non-mainland UK addresses",
  "",
  "Returns",
  "",
  "If you are not completely satisfied, a return can be requested within 14 days of delivery and we will arrange collection.",
  "",
  "To qualify for a return, items must be:",
  "",
  "* Unused",
  "* In their original packaging",
  "* In resaleable condition",
].join("\n");

export const BATCH_01: ProductCopy[] = [
  /* ------------------------------------------------------------------ 19925 -- */
  {
    slug: "adjustable-tractor-seat",
    summary:
      "A pressed tractor seat pan on a single black column, height-adjustable, with a twisted footrest bar and a scrolled four-spoke cast base. It stands 86cm tall on a 37cm square footprint, so a pair sit side by side at a kitchen island without crowding the counter.",
    sections: [
      {
        heading: "A Real Tractor Seat, at Island Height",
        paragraphs: [
          "The **Adjustable Tractor Seat** takes the pierced pan of an agricultural machine seat, mounts it on one black column and sets it at 86cm — kitchen island height rather than dining height.",
          "That 86cm is the number to check before anything else. This is a bar stool: it suits a raised breakfast bar or an island counter of roughly 100cm to 110cm, and it will sit far too high at an ordinary 75cm table.",
          "Everything on it is metal in a gloss black finish, and every part is visibly doing a job — the pan, the column, the clamp, the footrest and the base. None of the black metal is boxed in or covered over.",
          "It is a stool with a strong opinion, and it works best in a kitchen that can take one.",
        ],
      },
      {
        heading: "The Pierced Seat Pan, and Why It Is That Shape",
        paragraphs: [
          "The seat pan is pierced with a fan of teardrop slots radiating out from a central hub. That pattern is what makes a tractor seat recognisable from across a room, and it is stamped into the metal rather than printed on it.",
          "The pan is dished rather than flat, with a raised lip at the back and a shaped front edge. The dish is what holds you in place on a stool that has no backrest at all — you sit in it rather than on it.",
          "The slots earn their keep as well: nothing collects in the seat, so crumbs and spills go straight through and a cloth clears the rest.",
          "Because the dish does the work a back would do, a 37cm square footprint is enough. A stool with a backrest at this height needs considerably more room.",
        ],
      },
      {
        heading: "A Twisted Footrest You Will Actually Use",
        paragraphs: [
          "A twisted bar runs through a clamp on the column and out to two turned ball ends, giving you somewhere to put your feet 86cm off the floor.",
          "On a stool 86cm tall that matters more than it sounds. Without a footrest you perch; with one you sit. The bar is a cast detail with a rope twist along its length, not a cut length of tube welded on late in the design.",
          "The same clamp is what makes the height adjustable — it releases, the column slides, and it tightens again, so one stool suits a 100cm counter and a taller island.",
          "The footrest turns with the seat, so it stays in front of you rather than behind your ankles.",
        ],
      },
      {
        heading: "Cast Metal, and 15.6kg of It",
        paragraphs: [
          "15.6kg is heavy for a single stool and the weight is the useful part: it does not skate across a tiled or timber floor when you push down on one edge to get off it.",
          "The base is cast as four scrolled spokes with curled feet, which spreads that weight over a wide contact area rather than concentrating it. On a hard floor, felt pads under the four feet are worth ten minutes of your time.",
          "There is nothing upholstered anywhere on it. No fabric to mark, no seat pad to replace and nothing to reupholster in five years — the gloss black finish is the entire surface, and it wipes.",
          "For a stool that lives beside a kitchen hob, that is the right trade to have made.",
        ],
      },
      {
        heading: "Planning a Pair at a Counter",
        paragraphs: [
          "The 37cm by 37cm footprint is genuinely compact for a seat at this height. Two sit comfortably along a 1.2m run of counter and three along 1.8m, which is more than most stools with backs will manage.",
          "Against painted units and a pale worktop the black metal reads as deliberate contrast rather than an accident, and the cast base gives a flat-fronted island something to look at.",
          "Two is the natural quantity. A single tractor seat at a long island looks like one is missing.",
          "It belongs in an industrial or farmhouse kitchen, and it is the wrong stool entirely for a room where you want the seating to disappear.",
        ],
      },
      {
        heading: "Why You'll Love It",
        bullets: [
          "Pressed metal seat pan, teardrop slots radiating from a central hub",
          "Dished pan with a raised rear lip — no backrest needed",
          "Twisted footrest bar with turned ball ends",
          "Height-adjustable on a clamped central column",
          "Cast base of four scrolled spokes with curled feet",
          "37cm square footprint — two fit along a 1.2m counter",
          "86cm seat height for an island or breakfast bar",
          "15.6kg, so it stays exactly where you put it",
          "Gloss black metal throughout, with nothing upholstered to wear out",
        ],
      },
      {
        heading: "Product Specifications",
        labelled: [
          { label: "Material", value: "Metal" },
          { label: "Finish", value: "Gloss black" },
          { label: "Seat", value: "Pressed and pierced tractor pan, dished" },
          { label: "Footrest", value: "Twisted bar with turned ball ends" },
          {
            label: "Base",
            value: "Four scrolled cast spokes with curled feet",
          },
          { label: "Width", value: "37 cm" },
          { label: "Depth", value: "37 cm" },
          { label: "Height", value: "86 cm, adjustable" },
          { label: "Weight", value: "15.6 kg" },
          { label: "Barcode", value: "5050140992593" },
        ],
      },
      ...policySections(
        "The pan and base are cast and hand-finished, so small variations in the surface of the black finish are part of the process rather than faults.",
      ),
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Bar height", "Height adjustable"],
    highlights: [
      "Pressed tractor seat pan with radiating slots",
      "Twisted footrest bar with ball ends",
      "Adjustable height on a clamped column",
      "37cm square footprint",
      "15.6kg of cast and pressed metal",
    ],
    styleTags: ["Industrial"],
    roomTags: ["Kitchen"],
    useTags: ["Seating"],
    facts: {
      title: "Adjustable Tractor Seat | Kaiku",
      observed: [
        "pan",
        "pierced",
        "slots",
        "teardrop",
        "hub",
        "dished",
        "lip",
        "backrest",
        "twisted",
        "clamp",
        "clamped",
        "ball",
        "footrest",
        "column",
        "spokes",
        "scrolled",
        "curled",
        "feet",
        "cast",
        "base",
        "footprint",
        "gloss",
        "upholstered",
      ],
      materialTags: ["Metal"],
      colourTags: ["Black"],
      primaryColour: "Black",
    },
  },

  /* ------------------------------------------------------------------ 24312 -- */
  {
    slug: "alto-french-grey-table",
    summary:
      "A sage green garden table with an 80cm square top on a single moulded pedestal, standing 73cm high and weighing 10.8kg. The pedestal splays into four legs from a central hub, so all four corners of the top are clear and nobody sits astride a table leg.",
    sections: [
      {
        heading: "One Pedestal, Four Clear Corners",
        paragraphs: [
          "The **Alto French Grey Table** puts an 80cm square top on a single central pedestal instead of four corner legs, and that is the whole design argument for it.",
          "On a square table for four, the corner is exactly where a diner's knees go. Corner legs are the reason one person at every garden table ends up sitting at an angle. Here the legs gather into a central hub and splay outwards from it, so the corners are empty.",
          "Two arched supports rise from the same hub to meet the underside of the top, which is what stops an 80cm surface flexing on a narrow centre. A moulded boss caps the hub where they meet.",
          "It is a small piece of structural cleverness in a moulded plastic table, and you only notice it when you sit down and find nothing in the way.",
        ],
      },
      {
        heading: "73cm, 80cm, and Seating Four Properly",
        paragraphs: [
          "73cm is standard dining height, so ordinary garden chairs pull up to the Alto without anyone perching or reaching. Paired with the Axis chairs at 79cm overall, the proportions work as a set.",
          "80cm square is the honest limit for four. It gives each place roughly 40cm of table edge, which takes a plate, a glass and cutlery comfortably — enough for lunch, tight for a laid dinner with serving dishes in the middle.",
          "For two people 80cm is generous, and the empty half becomes somewhere to put a tray, a book or a pot of herbs.",
          "The corners are rounded rather than square-cut, which is a detail your hip will thank the designer for in a narrow spot.",
        ],
      },
      {
        heading: "French Grey Is a Paint Name — This Is Sage Green",
        paragraphs: [
          "The colour of this table needs saying plainly, because the name does not say it. French Grey is a paint name; the Alto is a soft sage green, closer to eucalyptus or olive leaf than to any grey.",
          "In daylight it reads as green, and it reads that way in the photographs too. Against stone paving, planting and terracotta the sage settles in beautifully. Against a grey rendered wall or grey porcelain paving it will not — it will look like a green table in front of a grey wall.",
          "The finish is a soft matt rather than a gloss, which is why it looks more like painted timber than plastic from a couple of paces away.",
          "If you are ordering to match, order the sage Axis chairs and the sage Alto together; they agree with each other exactly.",
        ],
      },
      {
        heading: "10.8kg, and What That Buys You",
        paragraphs: [
          "The whole table is moulded plastic and weighs 10.8kg, which one adult carries in one trip. That decides more about how you use a garden table than any other number on this page.",
          "The table goes into a shed or a garage for the winter without a second pair of hands, and it comes out again in March the same way. It also moves across a terrace during the day to follow the shade, which a stone or timber table simply does not.",
          "The trade is what you would expect: at 10.8kg it is light enough to want bringing in or weighting down in a gale, where a cast table would stay put.",
          "In return, the top wipes clean and never needs oiling, sanding or treating — the maintenance on this table is a cloth.",
        ],
      },
      {
        heading: "Living With It Outdoors",
        paragraphs: [
          "Moulded plastic garden furniture has earned a poor reputation from thin, flexing, brilliant-white examples. The Alto is not that: it is a heavy-gauge moulding at 10.8kg with a matt sage finish and a proper structural pedestal.",
          "Small feet under each of the four legs keep the plastic off wet paving. On a lawn the same feet will sink slightly, as any table on four points will.",
          "Rain runs off an 80cm top rather than through it, so it wants a wipe after a downpour before you lay it — no different from glass.",
          "Standing 73cm high and covering 80cm square, it is a table for a terrace, a balcony corner or a courtyard rather than for a long lawn party.",
        ],
      },
      {
        heading: "Why You'll Love It",
        bullets: [
          "80cm square top on one central pedestal — no corner legs",
          "Legs splay from a central hub, capped with a moulded boss",
          "Two arched supports brace the top from beneath",
          "73cm standard dining height, so ordinary chairs fit",
          "Soft matt sage green, not grey, whatever the name says",
          "Rounded corners rather than square-cut",
          "10.8kg — a genuine one-person carry",
          "Moulded plastic that wipes clean and never needs oiling",
          "Matches the sage Axis chairs exactly",
        ],
      },
      {
        heading: "Product Specifications",
        labelled: [
          { label: "Material", value: "Moulded plastic" },
          { label: "Colour", value: "Sage green, listed as French Grey" },
          { label: "Finish", value: "Soft matt" },
          { label: "Top", value: "80 cm square, rounded corners" },
          {
            label: "Base",
            value: "Central pedestal, four splayed legs from a hub",
          },
          { label: "Width", value: "80 cm" },
          { label: "Depth", value: "80 cm" },
          { label: "Height", value: "73 cm" },
          { label: "Feet", value: "Small moulded feet under each leg" },
          { label: "Weight", value: "10.8 kg" },
          { label: "Seats", value: "Four" },
          { label: "Barcode", value: "5050140431283" },
        ],
      },
      ...policySections(
        "Colour is moulded through the plastic rather than applied on top, so slight differences in shade between production batches are possible and are not considered defects.",
      ),
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Seats 4", "Pedestal base"],
    highlights: [
      "80cm square top on a single pedestal",
      "73cm standard dining height",
      "Soft matt sage green moulded plastic",
      "Rounded corners, no corner legs",
      "10.8kg — a one-person carry",
    ],
    styleTags: ["Modern"],
    roomTags: ["Garden"],
    useTags: ["Dining"],
    facts: {
      title: "Alto French Grey Table | Kaiku",
      observed: [
        "pedestal",
        "hub",
        "boss",
        "arched",
        "supports",
        "splay",
        "splayed",
        "legs",
        "corners",
        "rounded",
        "matt",
        "sage",
        "moulded",
        "feet",
        "top",
      ],
      materialTags: ["Plastic"],
      colourTags: ["Green"],
      primaryColour: "Green",
    },
  },

  /* ------------------------------------------------------------------ 24398 -- */
  {
    slug: "alto-shelf-unit-with-glass-shelves",
    summary:
      "A tall open shelf unit with six glass shelves in a black metal frame, 179cm high, 80cm wide and only 27cm deep. Closely spaced vertical rods form the back and both ends instead of solid panels, so the unit holds a wall without blocking the light across it.",
    sections: [
      {
        heading: "179cm of Height in 27cm of Depth",
        paragraphs: [
          "The **Alto Shelf Unit With Glass Shelves** is 179cm tall and 80cm wide, and the number that decides whether it works for you is the third one: 27cm deep.",
          "Depth is what usually stops a shelf unit fitting. A standard bookcase is 30cm to 35cm deep, and in a hallway, a landing or the alcove beside a chimney breast those few centimetres are the difference between a walkable route and a permanent squeeze.",
          "27cm still takes hardbacks, paperbacks, glassware, framed photographs and a stack of magazines. 27cm will not take a deep storage box or a record collection front-on.",
          "So it is a shelf unit for a narrow wall, and it is the right one for that wall.",
        ],
      },
      {
        heading: "A Screen of Vertical Rods, Not a Solid Back",
        paragraphs: [
          "The construction of the frame is the reason to want this piece. The back and both ends are made of closely spaced vertical rods running the full 179cm height, so the frame reads as a fine black screen rather than a box.",
          "Light passes straight through it. Put it against a pale wall and you see the wall between the rods; stand it near a window and it casts a striped shadow rather than a block of shade. A solid-backed unit 179cm tall on the same wall would close the room down.",
          "The front is completely open, so nothing gets between you and the shelves. The corners of the frame are radiused rather than sharply mitred, which softens what could easily have read as industrial cage.",
          "It is a lot of visual presence for 10kg of metal and glass.",
        ],
      },
      {
        heading: "Six Glass Shelves, and What to Put on Them",
        paragraphs: [
          "There are six glass shelves, evenly spaced up the 179cm frame, and the top one is a usable surface rather than a lid — plants, a lamp or a pair of vases all work up there.",
          "Glass rather than timber is what keeps the unit feeling open. Each shelf shows the one below it and the light gets down to the bottom, where a stack of six solid shelves would leave the lowest one in shadow.",
          "It also means the shelves show what is on them from underneath, so this is a unit for things worth seeing on all sides — ceramics, glassware, books stood face out, a clock, framed photographs.",
          "The lowest shelf sits close to the floor and takes two woven baskets side by side across the 80cm width, which is where the untidy things go.",
        ],
      },
      {
        heading: "10kg Across 179cm — Read That as a Guide",
        paragraphs: [
          "10kg for a unit this size is light, and it tells you honestly what to load it with. Glassware, books, photographs and ceramics are exactly right on glass shelves; a cast iron collection or a stack of stone tiles is not.",
          "It also means one person can position it, which matters when you are judging a 27cm gap by eye.",
          "Standing against a wall, the 27cm depth is stable under normal loading. Used freestanding as a room divider, a 179cm unit on a 27cm base wants fixing to the wall or the floor, and that is worth saying plainly rather than leaving you to find out — particularly in a house with a climbing toddler.",
          "Load the heaviest things on the bottom two shelves and the tall light things at the top, and it behaves.",
        ],
      },
      {
        heading: "Where the Black Frame Works",
        paragraphs: [
          "Black metal and glass is a hard combination to get wrong. Against plaster, limewash, pale paint or exposed brick, the rods read as a graphic line rather than as a colour.",
          "In a living room it will sit happily beside timber and upholstery without competing — the frame is thin enough that it does not read as another large object in the room.",
          "In a hallway it is genuinely useful: 27cm of depth, 80cm of width and somewhere to put keys, post, a lamp and two baskets, at a height that uses the wall nobody else uses.",
          "It suits a modern or industrial room, and it flatters a period one where the alcove either side of a chimney breast is asking for something exactly 27cm deep.",
        ],
      },
      {
        heading: "Why You'll Love It",
        bullets: [
          "Only 27cm deep — fits a hallway, landing or chimney alcove",
          "179cm tall and 80cm wide, using height instead of floor",
          "Six glass shelves, the top one usable as a surface",
          "Closely spaced vertical rods form the back and both ends",
          "Light passes through the frame rather than being blocked",
          "Fully open front, with radiused frame corners",
          "Bottom shelf takes two baskets side by side",
          "Black metal and glass — graphic without being heavy",
          "10kg, so one person can position it",
        ],
      },
      {
        heading: "Product Specifications",
        labelled: [
          { label: "Materials", value: "Glass and metal" },
          { label: "Colour", value: "Black" },
          { label: "Shelves", value: "Six, glass" },
          { label: "Frame", value: "Vertical rods to the back and both ends" },
          { label: "Width", value: "80 cm" },
          { label: "Depth", value: "27 cm" },
          { label: "Height", value: "179 cm" },
          { label: "Weight", value: "10 kg" },
          { label: "Barcode", value: "5050140439883" },
        ],
      },
      ...policySections(
        "Glass shelves are packed separately and seated into the frame on delivery; check each one against the frame before loading it.",
      ),
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["27cm deep", "Six shelves"],
    highlights: [
      "179cm tall, 27cm deep",
      "Six glass shelves in a black metal frame",
      "Vertical rod screen to the back and ends",
      "Fits a hallway or chimney alcove",
      "10kg — one person can position it",
    ],
    styleTags: ["Industrial", "Modern"],
    roomTags: ["Living room"],
    useTags: ["Shelving"],
    facts: {
      title: "Alto Shelf Unit With Glass Shelves | Kaiku",
      observed: [
        "shelves",
        "frame",
        "rods",
        "screen",
        "vertical",
        "radiused",
        "corners",
        "baskets",
        "open",
        "front",
        "depth",
      ],
      materialTags: ["Glass", "Metal"],
      colourTags: ["Black"],
      primaryColour: "Black",
    },
  },

  /* ------------------------------------------------------------------ 23906 -- */
  {
    slug: "amalfi-collection-outdoor-bistro-table-with-glass-top",
    summary:
      "A 70cm round bistro table woven all over in a grey-washed rattan effect, with a circular glass top set into a braided rim. It stands 72cm high on a drum-shaped pedestal and four spiral-wrapped legs, and at 11kg it is the steadier of the two Amalfi bistro tables.",
    sections: [
      {
        heading: "Glass Over Weave, So You See Both",
        paragraphs: [
          "The **Amalfi Collection Outdoor Bistro Table With Glass Top** is woven from top to foot, and the glass is there so that the weave underneath it is not wasted.",
          "A circular pane sits down inside a raised braided rim that runs right round the edge of the table. Look down and you see the woven surface through the glass, framed by the rope-like braid; put a cup on it and you are still looking at the weave.",
          "That is a different proposition from the wood-topped version of the same table, which covers the woven surface with timber. Here the material is the decoration and the glass is the protection.",
          "The pane also keeps a 70cm table from reading as heavy on a small terrace, which a solid top of the same diameter would.",
        ],
      },
      {
        heading: "A Drum-Shaped Pedestal on Four Wrapped Legs",
        paragraphs: [
          "The base is the part that makes this table look older and better made than its price suggests. A woven drum flares out beneath the top, waisted where it meets the table and widening as it drops, finished with an arched scalloped edge all round the bottom.",
          "Four legs continue below it, each wrapped in a tight spiral of the same weave and finished with a small foot. There is an open gap between the top and the drum, so the table does not read as one solid mass.",
          "It is a shape borrowed from Lloyd Loom and conservatory furniture, and it is the reason this reads as a proper bistro table rather than a stand with a top on it.",
          "The weave is a rattan effect rather than natural cane, which is the right choice for something that lives outdoors.",
        ],
      },
      {
        heading: "Sized Honestly for Two",
        paragraphs: [
          "70cm across is a genuine two-person table. It takes two plates, two glasses and a small jug in the middle, and not a great deal more — which is exactly what a bistro table is for.",
          "At 72cm high it is standard dining height, so ordinary outdoor chairs pull up to it and the matching Amalfi armchairs sit at the right level. You do not need to buy seating specifically for a 70cm table.",
          "Round rather than square matters at this size: there are no corners to catch a hip in a narrow passage, and two people sit at a comfortable angle to each other rather than squarely opposite.",
          "For a balcony, a courtyard or the corner of a terrace where breakfast happens, 70cm is the right number.",
        ],
      },
      {
        heading: "11kg, and Why It Is the Steadier One",
        paragraphs: [
          "At 11kg this is three kilos heavier than the wood-topped Amalfi at 8kg, and the difference is all in the glass.",
          "That extra weight sits at the top of the table, where it does the most good on a windy day — a light bistro table in an exposed spot is a nuisance. In a sheltered courtyard the extra 3kg makes little difference either way.",
          "11kg is still an easy carry for one person, so the table follows the shade round a terrace during the day and goes into a shed for the winter without a fuss.",
          "The glass wipes down after a meal rather than absorbing anything, which counts for more outdoors than it does inside.",
        ],
      },
      {
        heading: "Keeping It Looking Like This",
        paragraphs: [
          "The grey-washed finish is a driftwood tone rather than a flat grey, with lighter and darker strands through the weave. The driftwood tone sits well against stone paving, brick and planting, and against pale render it reads warmer than a plain grey would.",
          "Rain runs off the glass and through the open weave of the drum, so nothing sits in the base. A soft brush gets dust out of the braided rim, which is the one place it collects.",
          "Over a British winter, a cover or a shed is kinder to a woven table than leaving it out — not because it will fail, but because the finish stays even for longer.",
          "Wipe the glass, brush the rim, and a 70cm woven table looks new for years.",
        ],
      },
      {
        heading: "Why You'll Love It",
        bullets: [
          "Circular glass top set into a braided woven rim",
          "The woven surface stays visible through the glass",
          "Woven drum pedestal with a scalloped arched lower edge",
          "Four legs wrapped in a tight spiral of the same weave",
          "70cm diameter — a true two-person bistro table",
          "72cm standard dining height, fits ordinary outdoor chairs",
          "Grey-washed driftwood tone with varied strands",
          "Rattan effect rather than natural cane, for outdoor use",
          "11kg — steadier in a breeze than the wood-topped version",
        ],
      },
      {
        heading: "Product Specifications",
        labelled: [
          { label: "Materials", value: "Glass and metal, woven rattan effect" },
          { label: "Colour", value: "Grey-washed driftwood" },
          {
            label: "Top",
            value: "Circular glass pane, set into a braided rim",
          },
          {
            label: "Base",
            value: "Woven drum pedestal, four spiral-wrapped legs",
          },
          { label: "Diameter", value: "70 cm" },
          { label: "Height", value: "72 cm" },
          { label: "Weight", value: "11 kg" },
          { label: "Seats", value: "Two" },
          { label: "Barcode", value: "5050140390689" },
        ],
      },
      ...policySections(
        "The weave is worked by hand over the frame, so the run of the strands and the exact tone of the grey wash vary a little from table to table.",
      ),
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Seats 2", "Glass top"],
    highlights: [
      "70cm round glass top in a braided woven rim",
      "Woven drum pedestal on four spiral-wrapped legs",
      "72cm standard dining height",
      "Grey-washed driftwood tone",
      "11kg — the steadier Amalfi bistro table",
    ],
    styleTags: ["Coastal", "Modern"],
    roomTags: ["Garden"],
    useTags: ["Dining"],
    facts: {
      title: "Amalfi Collection Outdoor Bistro Table With Glass Top | Kaiku",
      observed: [
        "woven",
        "weave",
        "braided",
        "rim",
        "drum",
        "pedestal",
        "spiral",
        "wrapped",
        "scalloped",
        "arched",
        "legs",
        "rattan",
        "driftwood",
        "strands",
        "pane",
        "diameter",
        "round",
      ],
      materialTags: ["Glass", "Metal"],
      colourTags: ["Neutral"],
      primaryColour: "Neutral",
    },
  },

  /* ------------------------------------------------------------------ 23905 -- */
  {
    slug: "amalfi-collection-outdoor-bistro-table-with-wood-top",
    summary:
      "A 70cm round bistro table woven in a grey-washed rattan effect, with a planked timber top set into a braided rim. It stands 72cm high on a drum-shaped pedestal and four spiral-wrapped legs, and at 8kg it is the lighter of the two Amalfi bistro tables by three kilos.",
    sections: [
      {
        heading: "A Timber Top in a Woven Rim",
        paragraphs: [
          "The **Amalfi Collection Outdoor Bistro Table With Wood Top** sets a planked timber surface inside the same braided woven rim the rest of the range uses, and the contrast between the two materials is the point of it.",
          "The boards run across the circle in visible planks, warm mid-brown against the cool grey wash of the weave. Where the glass-topped Amalfi shows you the weave underneath, this one covers it and gives you timber to eat off instead.",
          "It is the version to choose if the table will be laid for meals more often than it is looked at. A timber surface takes a hot mug, a dropped fork and a cooling pan far better than glass does.",
          "The braided rim still frames it, so the table reads as woven even with a wooden top.",
        ],
      },
      {
        heading: "The Same Drum Pedestal Underneath",
        paragraphs: [
          "Below the top, this is the same piece of construction as its glass-topped sibling: a woven drum that waists in under the table and flares as it drops, with an arched scalloped edge running right round the bottom.",
          "Four legs carry on below, each bound in a tight spiral of the same weave and finished with a small foot. An open gap between the top and the drum keeps the whole thing from reading as one solid block.",
          "That silhouette comes out of conservatory and Lloyd Loom furniture, and it is what makes a 70cm table look considered rather than cheap.",
          "The weave is a rattan effect rather than natural cane, so it is built to sit outside rather than in a sunroom.",
        ],
      },
      {
        heading: "8kg, and What You Do With That",
        paragraphs: [
          "At 8kg this is the lighter of the two Amalfi bistro tables by three kilos, and that changes how you use it.",
          "The table moves around a terrace with one hand, so it follows the shade through the afternoon and comes indoors when the forecast turns. Carrying 8kg up to a first-floor balcony is a one-person job rather than a two-person one.",
          "The trade is stability. In an exposed spot the 11kg glass-topped version stays put better; with a timber top there is less weight up high holding the table down. On a sheltered terrace the difference between 8kg and 11kg is academic.",
          "For a balcony, a courtyard or a small back garden, 8kg is the more useful number of the two.",
        ],
      },
      {
        heading: "Two Places, at the Right Height",
        paragraphs: [
          "70cm of diameter seats two people without either of them negotiating for elbow room — two plates, two glasses and something small in the middle.",
          "72cm is standard dining height, so ordinary outdoor chairs work and the matching Amalfi armchairs sit at exactly the right level with their cushions in place.",
          "A round top is the right shape at this size. Nothing catches a hip on the way past a round top, and two people sit at an angle to each other rather than squared up across a rectangle.",
          "It is a breakfast table, a coffee table for two and somewhere to put a bottle down in the evening.",
        ],
      },
      {
        heading: "Looking After Timber Outdoors",
        paragraphs: [
          "A timber top outdoors is honest about what it is: it will silver slightly in the sun and darken slightly in the wet, and the planks will move a little between a wet week and a dry one.",
          "Wipe the timber after meals, keep it out of standing water, and give it a light oil once a year if you want the warm mid-brown to stay as it arrived. Left alone it will weather to a softer grey that sits even closer to the woven base.",
          "A soft brush lifts dust out of the braided rim, which is the one place on a woven table where it collects. Rain runs straight through the open weave of the drum, so nothing pools in the base.",
          "Over a British winter, a cover or a shed is kinder to a woven and timber table than leaving it out.",
        ],
      },
      {
        heading: "Why You'll Love It",
        bullets: [
          "Planked timber top set into a braided woven rim",
          "Warm mid-brown boards against a grey-washed weave",
          "A surface that takes a hot mug better than glass",
          "Woven drum pedestal with a scalloped arched lower edge",
          "Four legs wrapped in a tight spiral of the same weave",
          "70cm diameter — a true two-person bistro table",
          "72cm standard dining height, fits ordinary outdoor chairs",
          "Rattan effect rather than natural cane, for outdoor use",
          "8kg — the lighter Amalfi bistro table by three kilos",
        ],
      },
      {
        heading: "Product Specifications",
        labelled: [
          { label: "Materials", value: "Wood and metal, woven rattan effect" },
          {
            label: "Colour",
            value: "Grey-washed driftwood strands with a timber top",
          },
          {
            label: "Top",
            value:
              "Timber planks in a braided rim; grain varies board to board",
          },
          {
            label: "Base",
            value: "Woven drum pedestal, four spiral-wrapped legs",
          },
          { label: "Diameter", value: "70 cm" },
          { label: "Height", value: "72 cm" },
          { label: "Weight", value: "8 kg" },
          { label: "Seats", value: "Two" },
          { label: "Barcode", value: "5050140390580" },
        ],
      },
      ...policySections(
        "The top is timber and the base is woven by hand, so grain, plank colour and the run of the strands vary from table to table and are not considered defects.",
      ),
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Seats 2", "Timber top"],
    highlights: [
      "70cm round planked timber top in a braided woven rim",
      "Woven drum pedestal on four spiral-wrapped legs",
      "72cm standard dining height",
      "Grey-washed driftwood weave",
      "8kg — the lighter Amalfi bistro table",
    ],
    styleTags: ["Coastal", "Rustic"],
    roomTags: ["Garden"],
    useTags: ["Dining"],
    facts: {
      title: "Amalfi Collection Outdoor Bistro Table With Wood Top | Kaiku",
      observed: [
        "woven",
        "weave",
        "braided",
        "rim",
        "drum",
        "pedestal",
        "spiral",
        "wrapped",
        "scalloped",
        "arched",
        "legs",
        "rattan",
        "driftwood",
        "strands",
        "planked",
        "planks",
        "boards",
        "timber",
        "grain",
        "diameter",
        "round",
      ],
      materialTags: ["Metal", "Wood"],
      colourTags: ["Neutral"],
      primaryColour: "Neutral",
    },
  },

  /* ------------------------------------------------------------------ 24374 -- */
  {
    slug: "avaris-wingback-armchair",
    summary:
      "A blue chenille armchair with a high curved back, low sweeping arms and four tapered black metal legs, measuring 81cm wide, 72cm deep and 87cm high. A matching lumbar bolster comes with it, and at 14.9kg one person can move it between rooms.",
    sections: [
      {
        heading: "A High Back That Curves Instead of Wings",
        paragraphs: [
          "The **Avaris Wingback Armchair** takes the height and the shelter of a traditional wingback and loses the bulk that usually comes with them.",
          "The back is a single continuous shell, 87cm high, whose sides curve forward around your shoulders and then sweep down into low arms. There are no separate wings bolted onto a square frame — the shelter comes from the curve itself, so it frames your shoulders rather than boxing in your head.",
          "A line of piping follows the top edge of the back and round the outside, which is what gives the shape its definition from across a room. Without the piping the chair would read as a soft lump.",
          "At 81cm wide and 72cm deep it takes up about as much floor as a generous dining carver, not as much as an armchair usually does.",
        ],
      },
      {
        heading: "The Bolster Is Part of the Chair",
        paragraphs: [
          "A matching lumbar bolster is supplied with the Avaris, in the same blue chenille, and it is not a styling prop for the photograph.",
          "An 87cm back gives real support behind your head, and the bolster is what fills the small of it. With the bolster in, you sit upright and supported and the chair reads as a reading chair. Take it out and you sit further back into the shell, and it becomes a lounging chair. Two chairs for the price of one cushion.",
          "The seat itself is a generous loose cushion with a rolled front edge, sitting on an upholstered plinth rather than a hard frame rail — so nothing digs into the back of your knees.",
          "Both cushions are removable, which makes plumping them, turning them and getting a dropped earring back out from under them straightforward.",
        ],
      },
      {
        heading: "Blue, and Committed to It",
        paragraphs: [
          "This is a blue chair, not a chair with a hint of blue. It is a deep teal-leaning blue, closer to denim than to navy, and in a room of neutrals it is the thing your eye goes to. Place the Avaris where you want that to happen.",
          "The fabric is a chenille with a visible slub running through it, so the colour is not flat: it lifts and darkens as the pile catches the light, and the curved back shows that off far more than a flat-panelled chair would.",
          "A chenille weave also hides everyday life better than a smooth fabric does. Against a plain blue cotton, a chenille slub disappears creases, cat hair and the mark where somebody sat down with a wet coat.",
          "Beside pale walls, oak, linen or a cream sofa the blue does exactly what an accent chair should, and beside another strong colour it will argue.",
        ],
      },
      {
        heading: "Four Tapered Black Metal Legs",
        paragraphs: [
          "The legs are black metal, round in section, tapering to a point and set at a slight splay — front legs raked forward, back legs raked back.",
          "They lift the chair clear of the floor so you can see underneath it, and that is what stops an armchair from anchoring a corner of a room permanently. A skirted base at 81cm wide would look twice the size.",
          "The splay also does something for the silhouette: it stops a high-backed chair looking top-heavy, because the footprint on the floor is wider than the seat above it.",
          "They carry 14.9kg of chair on four small points of contact, so felt pads are worth fitting on a hard floor. On carpet the taper will sink in and hold.",
        ],
      },
      {
        heading: "Where an 87cm Back Sits in a Room",
        paragraphs: [
          "87cm is taller than most sofas. Put the Avaris beside a low-backed three-seater and it will stand a head above it, which is deliberate contrast rather than a mismatch — but worth picturing before it arrives.",
          "In a bay window, beside a fireplace or in the corner of a bedroom, 87cm is exactly what you want: the armchair defines a spot to sit rather than disappearing into the wall behind it.",
          "72cm of depth means it can go against a wall in a room where a 90cm-deep armchair could not, and 14.9kg means one person can move it to another room to see whether it works better there.",
          "The Avaris is a reading chair, a bedroom chair and a chair for the end of a hallway, and it is a little too upright to fall asleep in — which for most people is the point.",
        ],
      },
      {
        heading: "Why You'll Love It",
        bullets: [
          "87cm high curved back that shelters without boxing you in",
          "Matching lumbar bolster cushion included",
          "Low arms sweeping down from the back in one continuous curve",
          "Piping following the top edge and outside of the back",
          "Generous loose seat cushion with a rolled front edge",
          "Blue chenille with a visible slub that hides everyday marks",
          "Four tapered black metal legs, splayed front and back",
          "81cm wide and only 72cm deep — it will go against a wall",
          "14.9kg, so one person can move it between rooms",
        ],
      },
      {
        heading: "Product Specifications",
        labelled: [
          { label: "Materials", value: "Fabric and metal" },
          {
            label: "Upholstery",
            value:
              "Blue chenille with a slub texture, over an upholstered seat plinth",
          },
          { label: "Colour", value: "Blue" },
          { label: "Back", value: "One continuous curved shell, 87 cm high" },
          {
            label: "Cushions",
            value: "Loose seat cushion and lumbar bolster, both removable",
          },
          { label: "Legs", value: "Four tapered black metal, splayed" },
          { label: "Width", value: "81 cm" },
          { label: "Depth", value: "72 cm" },
          { label: "Height", value: "87 cm" },
          { label: "Weight", value: "14.9 kg" },
          { label: "Barcode", value: "5050140437483" },
        ],
      },
      ...policySections(
        "Chenille is a woven pile, so the direction of the pile and the play of light across the slub will differ slightly between the chair and its bolster and between one chair and the next.",
      ),
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Bolster included", "Metal legs"],
    highlights: [
      "81cm wide, 72cm deep, 87cm tall",
      "High curved back with low sweeping arms",
      "Matching lumbar bolster cushion included",
      "Blue chenille with a visible slub",
      "Four tapered black metal legs",
    ],
    styleTags: ["Modern"],
    roomTags: ["Living room"],
    useTags: ["Seating"],
    facts: {
      title: "Avaris Wingback Armchair | Kaiku",
      observed: [
        "curved",
        "curve",
        "shell",
        "arms",
        "piping",
        "bolster",
        "lumbar",
        "cushion",
        "cushions",
        "rolled",
        "chenille",
        "slub",
        "upholstery",
        "upholstered",
        "plinth",
        "legs",
        "tapered",
        "taper",
        "splay",
        "splayed",
        "high",
        "back",
      ],
      materialTags: ["Fabric", "Metal"],
      colourTags: ["Blue"],
      primaryColour: "Blue",
    },
  },

  /* ------------------------------------------------------------------ 24293 -- */
  {
    slug: "axis-french-grey-carver-chair",
    summary:
      "A sage green garden carver with closed loop arms, seven vertical slats in the back and open ribs across the seat, measuring 60cm wide, 54cm deep and 79cm high. It weighs 4.7kg, so two can be carried at once, one in each hand.",
    sections: [
      {
        heading: "The Arms Cost You Nine Centimetres",
        paragraphs: [
          "The **Axis French Grey Carver Chair** is the armed version of the Axis, and the difference between it and the side chair is exactly nine centimetres: 60cm wide against 51cm.",
          "Around a table that 9cm adds up quickly. Four carvers need 36cm more room than four side chairs — most of a fifth place setting. The conventional answer is carvers at the two ends of a table and side chairs down the sides, which is precisely why the Axis is made in both.",
          "The arms themselves are closed loops, curving out from the top of the back and returning to the seat frame in one continuous moulded piece. There is no join to work loose on a moulded arm because there is no join.",
          "They are the right height to rest a forearm on at 79cm of chair, and low enough that the chair still slides under a 73cm table.",
        ],
      },
      {
        heading: "Seven Slats, and a Seat That Drains",
        paragraphs: [
          "The back is formed as seven vertical slats fanning slightly outwards, and the seat as a run of curved horizontal ribs with open gaps between them. The two flow into each other as one continuous shell rather than meeting at a joint.",
          "That construction is the reason this is a good garden chair rather than a good-looking one. Rain runs straight through the gaps instead of pooling in a dip in the seat, so the chair dries in minutes after a shower rather than in hours.",
          "There is no cushion to soak through, nothing to unclip and bring in, and nothing to remember when the sky changes at six o'clock. For an unpadded garden chair, a shower stops being an event.",
          "The slats also flex a little under you, which is why an unpadded moulded seat is more comfortable than it looks.",
        ],
      },
      {
        heading: "4.7kg, and What You Do With That",
        paragraphs: [
          "4.7kg is light enough to carry two at a time, one in each hand, and that is the difference between rearranging a garden and deciding not to bother.",
          "Six chairs come off a terrace and into a shed in three trips. Moving six chairs into the shade after lunch takes one person a couple of minutes.",
          "The legs are round tapered tubes set at a slight splay, with small feet where they meet the ground. On paving they sit flat; on soft lawn, four points at 4.7kg will mark the grass rather than sink into it.",
          "Light does have a cost — an empty 4.7kg chair will move in a strong gust, so it is worth putting them under a table or against a wall before a gale.",
        ],
      },
      {
        heading: "On the Colour",
        paragraphs: [
          "French Grey is the paint name, not a description. The Axis carver is sage green — a soft, olive-leaning green with a matt finish, closer to eucalyptus than to any grey.",
          "This matters if you are ordering a mixed set of Axis chairs. Alongside the Axis Putty Grey carver, which genuinely is a warm stone grey, the two are visibly different chairs rather than two shades of the same one.",
          "It matters again if you are matching to the garden. Against planting, terracotta pots and stone paving the sage settles in; against grey porcelain paving or a grey rendered wall it will read as a colour rather than a neutral.",
          "It agrees exactly with the sage Alto table, which is the pairing the range is designed around.",
        ],
      },
      {
        heading: "As a Set, and On Its Own",
        paragraphs: [
          "At 60cm wide and 54cm deep, two carvers at the ends of the 80cm square Alto table and two side chairs on the sides is the arrangement that fits four people without anyone straddling a leg.",
          "The 79cm back and 54cm depth are shared across the whole Axis range, so carvers and side chairs line up at the same height when you mix them — the backs form one line rather than a staircase.",
          "One carver on its own works too. A single carver beside a door, at the end of a path or next to a pot is a place to sit for five minutes, and at 4.7kg it goes wherever you happen to want that.",
          "It is a modern garden chair with an unfussy shape, and it will not look dated in three summers.",
        ],
      },
      {
        heading: "Why You'll Love It",
        bullets: [
          "Closed loop arms moulded in one piece with the frame",
          "60cm wide with arms — the carver in the Axis range",
          "Seven vertical slats forming the back",
          "Open ribs with gaps between them, so rain drains straight through",
          "Back and seat flow together as one continuous shell",
          "No cushion to soak through or bring indoors",
          "Round tapered legs with a slight splay and small feet",
          "Soft matt sage green, not grey, whatever the name says",
          "4.7kg — carry two at once, one in each hand",
        ],
      },
      {
        heading: "Product Specifications",
        labelled: [
          { label: "Material", value: "Moulded plastic" },
          { label: "Colour", value: "Sage green, listed as French Grey" },
          { label: "Finish", value: "Soft matt" },
          { label: "Arms", value: "Closed loops, moulded in one piece" },
          { label: "Back", value: "Seven vertical slats" },
          { label: "Seat", value: "Open horizontal ribs" },
          { label: "Width", value: "60 cm" },
          { label: "Depth", value: "54 cm" },
          { label: "Height", value: "79 cm" },
          { label: "Weight", value: "4.7 kg" },
          { label: "Barcode", value: "5050140429389" },
        ],
      },
      ...policySections(
        "Colour is moulded through the plastic rather than applied on top, so slight differences in shade between production batches are possible and are not considered defects.",
      ),
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["With arms", "4.7kg"],
    highlights: [
      "60cm wide with closed loop arms",
      "Seven vertical slats in the back",
      "Open ribs across the seat for drainage",
      "Soft matt sage green moulded plastic",
      "4.7kg — carry two at once",
    ],
    styleTags: ["Modern"],
    roomTags: ["Garden"],
    useTags: ["Seating", "Dining"],
    facts: {
      title: "Axis French Grey Carver Chair | Kaiku",
      observed: [
        "slats",
        "ribs",
        "arms",
        "loops",
        "shell",
        "moulded",
        "matt",
        "sage",
        "legs",
        "tapered",
        "splay",
        "feet",
        "cushion",
        "gaps",
      ],
      materialTags: ["Plastic"],
      colourTags: ["Green"],
      primaryColour: "Green",
    },
  },

  /* ------------------------------------------------------------------ 24295 -- */
  {
    slug: "axis-french-grey-chair",
    summary:
      "A sage green garden side chair with no arms, seven vertical slats in the back and open ribs across the seat, measuring 51cm wide, 54cm deep and 79cm high. At 4.2kg it is the lightest seat in the Axis range and the only one that tucks fully under a table.",
    sections: [
      {
        heading: "51cm Is the Whole Point",
        paragraphs: [
          "The **Axis French Grey Chair** is the armless Axis, and 51cm of width is the reason to choose it over the 60cm carver.",
          "On a small terrace, nine centimetres a chair is what decides whether six people fit around a table or four do. Six side chairs need 54cm less space than six carvers — a whole extra place setting recovered from nothing but the absence of arms.",
          "Without arms it also slides fully under a table, which a 60cm carver will not always do. On a balcony or a narrow side passage, being able to push the chairs right in is what keeps the space walkable when nobody is sitting down.",
          "It is the chair to buy four or six of, and to buy the carvers for the ends.",
        ],
      },
      {
        heading: "The Back and Seat Are One Piece",
        paragraphs: [
          "The back is seven vertical slats fanning gently outwards, and the seat is a run of curved horizontal ribs with open gaps between them. There is no joint where they meet: the two curve into each other as a single moulded shell.",
          "The waist of that shell is narrow — the slats taper in behind you before opening out again — which is what stops an armless chair looking like a plain slab. From the side the chair reads as a considered shape rather than a flat panel.",
          "The shell also flexes slightly under you, which is why a seat with no padding at all is more comfortable than the photograph suggests.",
          "The gaps do the practical work: rain goes straight through and the chair dries in minutes.",
        ],
      },
      {
        heading: "4.2kg, and What You Do With That",
        paragraphs: [
          "At 4.2kg this is the lightest seat in the Axis range — half a kilo under the carver, and light enough that carrying four across a lawn is two trips rather than four.",
          "There is no cushion to soak through, nothing to unclip and nothing to bring in when the sky changes. A summer shower is not an event, and the chair is usable again as soon as it stops.",
          "The legs are round tapered tubes with a slight splay and small feet at the ground. On paving they sit flat; on a lawn, 4.2kg on four points marks the grass rather than sinking into it.",
          "The cost of light is the obvious one: an empty 4.2kg chair will move in a strong gust, so tuck them under the table before a gale rather than after it.",
        ],
      },
      {
        heading: "Sage Green, Not Grey",
        paragraphs: [
          "The name says French Grey and the chair is sage green — a soft olive-leaning green in a matt finish. French Grey is a paint name doing duty as a colour description, and it is worth knowing before you order six.",
          "If you are matching to the Alto table in the same finish, the two agree with each other exactly; they are the same moulded colour from the same range.",
          "If you are matching to grey paving, grey render or the Axis Putty Grey carver, they will not agree. The putty is a genuine warm stone grey and the difference is obvious with the two side by side.",
          "Against planting, terracotta and stone the sage disappears pleasantly, which is usually what you want from six chairs rather than one.",
        ],
      },
      {
        heading: "Buying Them in Numbers",
        paragraphs: [
          "This is a chair that makes most sense in fours and sixes. Six around a table at 51cm each is 3.06m of chair width, which a 1.6m rectangular table takes comfortably with two at the ends.",
          "The 79cm back and 54cm depth are shared with the carver, so mixed sets line up at the same height and the backs form one level line around the table.",
          "Stacked in a shed over winter they take very little room, and at 4.2kg each getting them back out in spring is not a job you put off.",
          "Minimal, matt and unfussy, they do not compete with a garden — which for six chairs in a small space is exactly right.",
        ],
      },
      {
        heading: "Why You'll Love It",
        bullets: [
          "51cm wide — tucks fully under a table",
          "Six side chairs need 54cm less room than six carvers",
          "Seven vertical slats forming the back",
          "Open ribs with gaps between them, so rain drains straight through",
          "Back and seat moulded as one continuous shell",
          "Narrow waist behind the sitter, not a plain slab",
          "No cushion to soak through or bring indoors",
          "Soft matt sage green, not grey, whatever the name says",
          "4.2kg — the lightest seat in the Axis range",
        ],
      },
      {
        heading: "Product Specifications",
        labelled: [
          { label: "Material", value: "Moulded plastic" },
          { label: "Colour", value: "Sage green, listed as French Grey" },
          { label: "Finish", value: "Soft matt" },
          { label: "Arms", value: "None — side chair" },
          { label: "Back", value: "Seven vertical slats" },
          { label: "Seat", value: "Open horizontal ribs" },
          {
            label: "Legs",
            value: "Round tapered tubes, splayed, with small feet",
          },
          { label: "Width", value: "51 cm" },
          { label: "Depth", value: "54 cm" },
          { label: "Height", value: "79 cm" },
          { label: "Weight", value: "4.2 kg" },
          { label: "Barcode", value: "5050140429587" },
        ],
      },
      ...policySections(
        "Colour is moulded through the plastic rather than applied on top, so slight differences in shade between production batches are possible and are not considered defects.",
      ),
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["No arms", "4.2kg"],
    highlights: [
      "51cm wide — tucks fully under a table",
      "Seven vertical slats in the back",
      "Open ribs across the seat for drainage",
      "Soft matt sage green moulded plastic",
      "4.2kg, the lightest Axis seat",
    ],
    styleTags: ["Modern", "Minimal"],
    roomTags: ["Garden"],
    useTags: ["Seating", "Dining"],
    facts: {
      title: "Axis French Grey Chair | Kaiku",
      observed: [
        "slats",
        "ribs",
        "shell",
        "waist",
        "moulded",
        "matt",
        "sage",
        "legs",
        "tapered",
        "splay",
        "feet",
        "cushion",
        "gaps",
        "arms",
      ],
      materialTags: ["Plastic"],
      colourTags: ["Green"],
      primaryColour: "Green",
    },
  },

  /* ------------------------------------------------------------------ 24292 -- */
  {
    slug: "axis-putty-grey-carver-chair",
    summary:
      "A putty grey garden carver with closed loop arms, seven vertical slats in the back and open ribs across the seat, measuring 60cm wide, 54cm deep and 79cm high. This is the Axis colourway that genuinely is grey — a warm, stone-toned putty rather than a sage.",
    sections: [
      {
        heading: "The Axis That Is Actually Grey",
        paragraphs: [
          "The **Axis Putty Grey Carver Chair** is the colourway worth knowing about, because the other one in this range is not grey at all.",
          "Putty grey is a warm stone tone with a hint of mushroom in it — a pale, soft neutral in a matt finish. Set beside the French Grey version of exactly the same carver, which is sage green, the two are obviously different chairs.",
          "That makes this the Axis to choose if you are matching garden seating to pale limestone, sandstone paving, light render or grey porcelain. The putty sits quietly against all of them, where the sage would read as a colour in its own right.",
          "If you want the chairs to disappear into the terrace rather than stand out from it, this is the one.",
        ],
      },
      {
        heading: "A Carver, So It Has Arms",
        paragraphs: [
          "This is the armed Axis: 60cm wide against 51cm for the armless side chair, so four of these need 36cm more room around a table than four side chairs would.",
          "The arms are closed loops, sweeping out from the top of the back and returning to the seat frame as one continuous moulded piece. Nothing on the arms is bolted on, so there is no fixing to work loose over a few seasons outdoors.",
          "Arms make this the Axis to linger in. Over a long lunch, somewhere to rest a forearm on the loop arms is the difference between sitting for twenty minutes and sitting for two hours.",
          "The 79cm back and 54cm depth are shared across the range, so putty carvers and sage side chairs line up at exactly the same height if you deliberately mix them.",
        ],
      },
      {
        heading: "Slatted, Ribbed and Quick to Dry",
        paragraphs: [
          "The back is seven vertical slats fanning slightly outwards; the seat is a run of curved horizontal ribs with open gaps between them. Both are part of one continuous moulded shell rather than separate panels joined together.",
          "Water runs straight through the seat instead of sitting in a dip, so the chair is usable again minutes after a shower rather than hours. That is the single most useful thing about an unpadded garden chair.",
          "Nothing needs unclipping, drying or bringing indoors, and on a pale putty finish there is no cushion cover to mark where a wet coat sat.",
          "The slats flex a little under you, which is why a moulded seat with no padding is more comfortable than it looks.",
        ],
      },
      {
        heading: "4.7kg, and the Practical Consequences",
        paragraphs: [
          "4.7kg means one hand per chair when you are clearing the garden — two at a time, six off a terrace in three trips.",
          "The legs are round tapered tubes with a slight splay and small feet at the ground. On paving they stand flat; on soft lawn, four points at 4.7kg mark the grass rather than sinking into it.",
          "Light furniture moves in wind, and an empty 4.7kg carver is no exception, so push them under the table before a gale rather than going out to collect them afterwards.",
          "In every other respect the weight is a gift: nothing about using these chairs is a two-person job.",
        ],
      },
      {
        heading: "Keeping a Pale Finish Looking Pale",
        paragraphs: [
          "A putty grey chair shows dirt more readily than a sage one, and that is the honest trade for a pale neutral outdoors.",
          "The matt moulded surface washes with warm water and a cloth, and the open ribs mean you can get at both sides of the seat rather than working around a fixed cushion. Under a tree, expect to wash them more often than you would a dark chair.",
          "Colour is moulded through the plastic rather than sprayed on top, so a scuff on an arm or a leg does not show a different colour underneath — which matters more on a pale finish than on a dark one.",
          "Washed once at the start of the season and wiped through the summer, a putty Axis looks the same in September as it did in May.",
        ],
      },
      {
        heading: "Why You'll Love It",
        bullets: [
          "Warm putty grey — the Axis colourway that really is grey",
          "Pale stone tone with a hint of mushroom, in a matt finish",
          "Closed loop arms moulded in one piece with the frame",
          "60cm wide with arms — the carver in the Axis range",
          "Seven vertical slats forming the back",
          "Open ribs with gaps between them, so rain drains straight through",
          "Back and seat moulded as one continuous shell",
          "No cushion cover to mark on a pale finish",
          "Colour moulded through, so a scuff shows the same tone",
          "Round tapered legs with a slight splay and small feet",
          "4.7kg — one hand per chair when you clear the garden",
        ],
      },
      {
        heading: "Product Specifications",
        labelled: [
          { label: "Material", value: "Moulded plastic" },
          { label: "Colour", value: "Putty grey, a warm stone tone" },
          { label: "Finish", value: "Soft matt" },
          { label: "Arms", value: "Closed loops, moulded in one piece" },
          { label: "Back", value: "Seven vertical slats" },
          { label: "Seat", value: "Open horizontal ribs" },
          { label: "Width", value: "60 cm" },
          { label: "Depth", value: "54 cm" },
          { label: "Height", value: "79 cm" },
          { label: "Weight", value: "4.7 kg" },
          { label: "Barcode", value: "5050140429280" },
        ],
      },
      ...policySections(
        "Colour is moulded through the plastic rather than applied on top, so slight differences in shade between production batches are possible and are not considered defects.",
      ),
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["With arms", "Warm grey"],
    highlights: [
      "60cm wide with closed loop arms",
      "Warm putty grey, a pale stone tone — not sage",
      "Seven vertical slats in the back",
      "Open ribs across the seat for drainage",
      "4.7kg — one hand per chair",
    ],
    styleTags: ["Modern"],
    roomTags: ["Garden"],
    useTags: ["Seating", "Dining"],
    facts: {
      title: "Axis Putty Grey Carver Chair | Kaiku",
      observed: [
        "slats",
        "ribs",
        "arms",
        "loops",
        "shell",
        "moulded",
        "matt",
        "putty",
        "mushroom",
        "stone",
        "legs",
        "tapered",
        "splay",
        "feet",
        "cushion",
        "gaps",
        "scuff",
      ],
      materialTags: ["Plastic"],
      colourTags: ["Grey"],
      primaryColour: "Grey",
    },
  },
];
