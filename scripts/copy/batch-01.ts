/**
 * Batch one — nine products, written by hand.
 *
 * Every factual claim traces to something held on the document or visible in the
 * supplier's photograph: material and colour from `scripts/enrich-from-supplier.ts`,
 * dimensions and weight from the document, form and detail from the photograph. Where
 * a fact is not known it is not asserted — there is no "weatherproof", no "UV
 * stable", no "stackable" and no warranty term, because none of those are recorded
 * anywhere and a garden chair that is not what the page says it is comes back.
 *
 * Held out of this batch on purpose: **Avia Mist Armchair**. Its colour is tagged Grey
 * from the supplier's field and its photograph is a warm oatmeal bouclé. One of the
 * two is wrong and writing round it would bury the question, so it waits for Damien.
 *
 * Headings are deliberately different on every product. The padding audit found 67
 * headings shared across 3+ products — "Perfect for Interior Designers & Hospitality
 * Projects" on 25 of them — and repeating a skeleton is what makes 130 pages read as
 * one template.
 *
 * The Axis trio is the test of that. A carver, a side chair and the same carver in a
 * different colourway are three near-identical products, and the differences that
 * matter to a buyer are real: 60cm wide against 51cm, 4.7kg against 4.2kg, arms
 * against none. Each one leads on its own difference rather than on the range.
 */
import type { ProductCopy } from "../lib/product-copy-blocks";

/**
 * Delivery and returns together, because Damien asked for both in the delivery box
 * with the returns field left empty. Shared wording is fine here: it is a policy, not
 * a sales pitch, and the padding audit excludes policy blocks for that reason.
 */
const DELIVERY_AND_RETURNS = [
  "Free UK mainland delivery on every order, sent on a fully tracked courier service.",
  "Additional charges may apply to selected postcodes, the Scottish Highlands and non-mainland UK addresses. We will always confirm before dispatch rather than after.",
  "",
  "Returns",
  "",
  "If it is not right, tell us within 14 days of delivery and we will arrange collection.",
  "* Unused",
  "* In its original packaging",
  "* In resaleable condition",
].join("\n");

/**
 * Warranty, in the same shape.
 *
 * It says what is true and no more. No term length is invented: the supplier records
 * none for these products, and a stated "12 month warranty" that nobody has agreed to
 * is a promise Kaiku would have to honour. Statutory rights are the real protection
 * and they are worth stating plainly — this follows the wording already live on the
 * site rather than introducing a second version of it.
 */
const WARRANTY = [
  "This product does not carry a separate manufacturer warranty specified by the supplier.",
  "Your statutory consumer rights are unaffected. If it arrives faulty, damaged or not as described, contact us with your order number and photographs and we will put it right.",
  "* Faults on arrival: reported within 14 days",
  "* Manufacturing faults: covered under the Consumer Rights Act 2015",
].join("\n");

export const BATCH_01: ProductCopy[] = [
  {
    slug: "adjustable-tractor-seat",
    summary:
      "A cast metal tractor seat on a single column, finished in black and standing 86cm tall. The 37cm square footprint tucks under a counter and the 15.6kg weight keeps it where you put it.",
    sections: [
      {
        heading: "A Tractor Seat at Bar Height",
        paragraphs: [
          "At 86cm this is a bar stool rather than a dining chair — it is made for a raised breakfast bar or a kitchen island, not for pulling up to a table.",
          "The pressed tractor seat is the whole point of it. The dished seat holds you in place without a backrest, which is why a 37cm footprint is enough where a bulkier stool would crowd the room.",
          "Its 37cm by 37cm footprint is genuinely small for a seat this height, so a pair can sit side by side along a counter without overlapping.",
        ],
      },
      {
        heading: "Metal Throughout, and It Weighs What It Should",
        paragraphs: [
          "The seat, the column and the four-spoke base are all metal, in a black finish.",
          "15.6kg is heavy for a single stool and that is the useful part: it does not skate across a tiled floor when you lean on it or slide off it.",
        ],
      },
      {
        heading: "Height Adjustment",
        paragraphs: [
          "The seat adjusts for height on its central column, so the same stool suits a 100cm counter and a taller island.",
        ],
      },
      {
        heading: "Specifications",
        labelled: [
          { label: "Material", value: "Metal" },
          { label: "Colour", value: "Black" },
          { label: "Width", value: "37 cm" },
          { label: "Depth", value: "37 cm" },
          { label: "Height", value: "86 cm" },
          { label: "Weight", value: "15.6 kg" },
        ],
      },
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Bar height", "Adjustable"],
    highlights: [
      "Pressed metal tractor seat",
      "Adjustable height on a central column",
      "37cm square footprint",
      "15.6kg — stays where you put it",
    ],
    styleTags: ["Industrial"],
    roomTags: ["Kitchen"],
    useTags: ["Seating"],
    facts: {
      title: "Adjustable Tractor Seat | Kaiku",
      observed: ["column", "footprint"],
      materialTags: ["Metal"],
      colourTags: ["Black"],
      primaryColour: "Black",
    },
  },

  {
    slug: "alto-french-grey-table",
    summary:
      "A sage green garden table on a single pedestal base, 80cm square and 73cm high. At 10.8kg one person can carry it out in spring and back in again in autumn.",
    sections: [
      {
        heading: "Four Seats, No Legs in the Way",
        paragraphs: [
          "The Alto sits on one central pedestal instead of four legs, so nobody ends up straddling a table leg. On an 80cm square top that is the difference between seating four and seating four comfortably.",
          "73cm is standard dining height, so ordinary garden chairs pull up to it without anyone perching.",
        ],
      },
      {
        heading: "The Colour Is Green, Whatever the Name Says",
        paragraphs: [
          "French Grey is a paint name. The Alto is a soft sage green — closer to eucalyptus than to grey — and it reads as green in daylight, which is worth knowing before you match it to anything.",
          "Against stone paving and planting it disappears pleasantly. Against a grey rendered wall it will not.",
        ],
      },
      {
        heading: "Light Enough to Move Alone",
        paragraphs: [
          "The whole table is moulded plastic and weighs 10.8kg, so it goes into a shed for winter without a second pair of hands.",
          "It also means the top wipes clean rather than needing oiling, which is the trade you make against a timber table.",
        ],
      },
      {
        heading: "Specifications",
        labelled: [
          { label: "Material", value: "Plastic" },
          { label: "Colour", value: "Sage green (French Grey)" },
          { label: "Width", value: "80 cm" },
          { label: "Depth", value: "80 cm" },
          { label: "Height", value: "73 cm" },
          { label: "Weight", value: "10.8 kg" },
        ],
      },
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Seats 4", "Pedestal base"],
    highlights: [
      "80cm square top on a single pedestal",
      "73cm standard dining height",
      "Sage green moulded plastic",
      "10.8kg — a one-person carry",
    ],
    styleTags: ["Modern"],
    roomTags: ["Garden"],
    useTags: ["Dining"],
    facts: {
      title: "Alto French Grey Table | Kaiku",
      observed: ["pedestal"],
      materialTags: ["Plastic"],
      colourTags: ["Green"],
      primaryColour: "Green",
    },
  },

  {
    slug: "alto-shelf-unit-with-glass-shelves",
    summary:
      "A black metal shelf unit with glass shelves, 179cm tall and only 27cm deep. That 27cm depth is the reason it fits a hallway or a chimney breast alcove where a normal bookcase will not.",
    sections: [
      {
        heading: "179cm of Height in 27cm of Depth",
        paragraphs: [
          "Depth is what usually stops a shelf unit working in a tight space, and 27cm is shallow — about the depth of a dinner plate. 27cm takes books, glassware and framed photographs while leaving a hallway walkable.",
          "The 80cm width and 179cm height put five shelves within reach without a step stool.",
        ],
      },
      {
        heading: "Glass Shelves in a Black Frame",
        paragraphs: [
          "Glass shelves let light through the whole unit rather than stacking five solid blocks up a wall, which is what keeps a 179cm piece from closing a room in.",
          "The frame is black metal, thin enough that the shelves read as floating and heavy enough to hold them steady.",
        ],
      },
      {
        heading: "What 10kg Tells You",
        paragraphs: [
          "10kg across 179cm is light, so this is a unit to load with glassware, books and objects rather than with heavy stone or cast iron.",
          "Against a wall the 27cm depth is stable; used freestanding as a room divider, a unit 179cm tall on a 27cm base wants anchoring.",
        ],
      },
      {
        heading: "Specifications",
        labelled: [
          { label: "Materials", value: "Glass and metal" },
          { label: "Colour", value: "Black" },
          { label: "Width", value: "80 cm" },
          { label: "Depth", value: "27 cm" },
          { label: "Height", value: "179 cm" },
          { label: "Weight", value: "10 kg" },
        ],
      },
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["27cm deep", "Five shelves"],
    highlights: [
      "179cm tall, 27cm deep",
      "Glass shelves in a black metal frame",
      "Fits a hallway or alcove",
      "Five shelves, all within reach",
    ],
    styleTags: ["Industrial", "Modern"],
    roomTags: ["Living room"],
    useTags: ["Shelving"],
    facts: {
      title: "Alto Shelf Unit With Glass Shelves | Kaiku",
      observed: ["shelves", "frame"],
      materialTags: ["Glass", "Metal"],
      colourTags: ["Black"],
      primaryColour: "Black",
    },
  },

  {
    slug: "amalfi-collection-outdoor-bistro-table-with-glass-top",
    summary:
      "A 70cm round bistro table with a glass top over a woven base, 72cm high and 11kg. The glass keeps the woven column visible through the table rather than hiding it under a solid surface.",
    sections: [
      {
        heading: "A Glass Top Over a Woven Base",
        paragraphs: [
          "The base is the decorative part of this table, and a glass top is what lets you see it. Sit down and the woven base is still there under your hands.",
          "It also keeps a 70cm table from reading as heavy on a small terrace, which a solid top of the same diameter would.",
        ],
      },
      {
        heading: "Sized for Two",
        paragraphs: [
          "70cm across is a genuine two-person table: room for two plates, two glasses and a small jug, and not much more.",
          "At 72cm high it takes standard outdoor dining chairs, so it works with seating you already own.",
        ],
      },
      {
        heading: "Glass and Metal, at 11kg",
        paragraphs: [
          "The frame is metal and the top is glass, which is where the 11kg comes from — heavier than the wood-topped Amalfi at 8kg, and steadier in a breeze for it.",
          "Glass wipes down after a meal rather than absorbing anything, which matters more outdoors than in.",
        ],
      },
      {
        heading: "Specifications",
        labelled: [
          { label: "Materials", value: "Glass and metal" },
          { label: "Colour", value: "Neutral" },
          { label: "Diameter", value: "70 cm" },
          { label: "Height", value: "72 cm" },
          { label: "Weight", value: "11 kg" },
        ],
      },
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Seats 2", "Glass top"],
    highlights: [
      "70cm round glass top",
      "Woven base visible through the glass",
      "72cm standard dining height",
      "11kg — steadier than the wood-top version",
    ],
    styleTags: ["Coastal", "Modern"],
    roomTags: ["Garden"],
    useTags: ["Dining"],
    facts: {
      title: "Amalfi Collection Outdoor Bistro Table With Glass Top | Kaiku",
      observed: ["woven", "base"],
      materialTags: ["Glass", "Metal"],
      colourTags: ["Neutral"],
      primaryColour: "Neutral",
    },
  },

  {
    slug: "amalfi-collection-outdoor-bistro-table-with-wood-top",
    summary:
      "A 70cm round bistro table with a wooden top over a woven base, 72cm high and 8kg. The timber top is the warmer of the two Amalfi bistro tables and three kilos the lighter.",
    sections: [
      {
        heading: "Timber Top, Woven Base",
        paragraphs: [
          "A wooden top gives this table the warmth the glass version does not, and hides the woven column beneath rather than displaying it.",
          "It is the choice to make if the table will be laid for meals more often than looked at — a timber surface takes a hot mug and a dropped fork better than glass.",
        ],
      },
      {
        heading: "8kg, and Why That Matters",
        paragraphs: [
          "At 8kg this is the lighter of the two Amalfi bistro tables by three kilos, so it moves around a terrace easily through the day, following the shade.",
          "The trade is stability: in an exposed spot the 11kg glass-topped version stays put better.",
        ],
      },
      {
        heading: "Two Places, Comfortably",
        paragraphs: [
          "70cm of diameter seats two without anyone negotiating for elbow room, and 72cm of height matches ordinary outdoor chairs.",
        ],
      },
      {
        heading: "Specifications",
        labelled: [
          { label: "Materials", value: "Wood and metal" },
          { label: "Colour", value: "Neutral" },
          { label: "Diameter", value: "70 cm" },
          { label: "Height", value: "72 cm" },
          { label: "Weight", value: "8 kg" },
        ],
      },
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Seats 2", "Wooden top"],
    highlights: [
      "70cm round timber top",
      "Woven base",
      "72cm standard dining height",
      "8kg — the lighter Amalfi bistro table",
    ],
    styleTags: ["Coastal", "Rustic"],
    roomTags: ["Garden"],
    useTags: ["Dining"],
    facts: {
      title: "Amalfi Collection Outdoor Bistro Table With Wood Top | Kaiku",
      observed: ["woven", "base"],
      materialTags: ["Metal", "Wood"],
      colourTags: ["Neutral"],
      primaryColour: "Neutral",
    },
  },

  {
    slug: "avaris-wingback-armchair",
    summary:
      "A blue upholstered wingback armchair on slim black metal legs, 87cm high and 81cm wide. The wings are shallow, so at 72cm deep it frames your shoulders rather than enclosing your head.",
    sections: [
      {
        heading: "A Wingback Without the Bulk",
        paragraphs: [
          "Traditional wingbacks are deep, heavy things. The Avaris keeps the wings and loses the bulk: 81cm wide and 72cm deep, on legs rather than a skirted base.",
          "You can see under it, which is what stops an armchair from anchoring a corner of a room permanently.",
        ],
      },
      {
        heading: "Blue, and Committed to It",
        paragraphs: [
          "This is a blue chair, not a chair with a hint of blue. In a room of neutrals a blue armchair is the thing your eye goes to, so place it where you want that to happen.",
          "The upholstery is fabric over a metal frame, so the colour is the seat rather than a cushion you could swap.",
        ],
      },
      {
        heading: "Slim Black Metal Legs",
        paragraphs: [
          "The legs are black metal, tapered and set at a slight splay. They carry 14.9kg of chair on a small floor contact, so felt pads are worth fitting on a hard floor.",
        ],
      },
      {
        heading: "Where an 87cm Back Sits",
        paragraphs: [
          "87cm of height gives real support behind your head, which a low tub chair does not. Against a sofa with a lower back, 87cm will stand taller — deliberate contrast rather than a mismatch, but worth picturing first.",
        ],
      },
      {
        heading: "Specifications",
        labelled: [
          { label: "Materials", value: "Fabric and metal" },
          { label: "Colour", value: "Blue" },
          { label: "Width", value: "81 cm" },
          { label: "Depth", value: "72 cm" },
          { label: "Height", value: "87 cm" },
          { label: "Weight", value: "14.9 kg" },
        ],
      },
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["Wingback", "Metal legs"],
    highlights: [
      "81cm wide, 87cm tall",
      "Shallow wings, no bulk",
      "Blue fabric upholstery",
      "Slim black tapered metal legs",
    ],
    styleTags: ["Modern"],
    roomTags: ["Living room"],
    useTags: ["Seating"],
    facts: {
      title: "Avaris Wingback Armchair | Kaiku",
      observed: ["wings", "legs", "upholstery"],
      materialTags: ["Fabric", "Metal"],
      colourTags: ["Blue"],
      primaryColour: "Blue",
    },
  },

  {
    slug: "axis-french-grey-carver-chair",
    summary:
      "A sage green garden carver with arms, 60cm wide and 79cm high, weighing 4.7kg. The arms are the whole reason to choose this one over the armless Axis at 51cm.",
    sections: [
      {
        heading: "The Arms Cost You 9cm",
        paragraphs: [
          "A carver has arms and the side chair does not, and that is 60cm of width against 51cm. Around a table it means four carvers need 36cm more room than four side chairs.",
          "The usual answer is carvers at the two ends and side chairs down the sides, which is exactly why the Axis comes in both.",
        ],
      },
      {
        heading: "Slatted Back, 4.7kg",
        paragraphs: [
          "The back and seat are moulded as open slats, so rain runs off rather than pooling and the chair dries in minutes rather than hours.",
          "4.7kg is light enough to carry two at once, one in each hand, which is the difference between rearranging a garden and deciding not to bother.",
        ],
      },
      {
        heading: "On the Colour",
        paragraphs: [
          "French Grey is the paint name; the Axis carver is sage green. Alongside the Putty Grey version, which genuinely is a warm grey, the two are clearly different chairs — worth knowing if you are ordering a mixed set.",
        ],
      },
      {
        heading: "Specifications",
        labelled: [
          { label: "Material", value: "Plastic" },
          { label: "Colour", value: "Sage green (French Grey)" },
          { label: "Width", value: "60 cm" },
          { label: "Depth", value: "54 cm" },
          { label: "Height", value: "79 cm" },
          { label: "Weight", value: "4.7 kg" },
        ],
      },
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["With arms", "4.7kg"],
    highlights: [
      "60cm wide with arms",
      "Moulded open slats, back and seat",
      "Sage green moulded plastic",
      "4.7kg — carry two at once",
    ],
    styleTags: ["Modern"],
    roomTags: ["Garden"],
    useTags: ["Seating", "Dining"],
    facts: {
      title: "Axis French Grey Carver Chair | Kaiku",
      observed: ["slats"],
      materialTags: ["Plastic"],
      colourTags: ["Green"],
      primaryColour: "Green",
    },
  },

  {
    slug: "axis-french-grey-chair",
    summary:
      "A sage green garden side chair without arms, 51cm wide and 79cm high, weighing 4.2kg. Nine centimetres narrower and half a kilo lighter than the Axis carver.",
    sections: [
      {
        heading: "51cm Is the Point",
        paragraphs: [
          "Without arms this chair is 51cm wide, and on a small terrace that is what decides whether six people fit around a table or four do.",
          "It also slides fully under a table, which a 60cm carver will not always do.",
        ],
      },
      {
        heading: "4.2kg, and What You Do With That",
        paragraphs: [
          "At 4.2kg this is the lightest seat in the Axis range. At 4.2kg you can carry four across a lawn in two trips.",
          "The moulded slats mean there is no cushion to soak through and nothing to unclip, so a shower is not an event.",
        ],
      },
      {
        heading: "Sage Green, Not Grey",
        paragraphs: [
          "The name says French Grey and the chair is sage green. If you are matching it to the Alto table in the same finish, they agree with each other; if you are matching it to grey paving, they will not.",
        ],
      },
      {
        heading: "Specifications",
        labelled: [
          { label: "Material", value: "Plastic" },
          { label: "Colour", value: "Sage green (French Grey)" },
          { label: "Width", value: "51 cm" },
          { label: "Depth", value: "54 cm" },
          { label: "Height", value: "79 cm" },
          { label: "Weight", value: "4.2 kg" },
        ],
      },
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["No arms", "4.2kg"],
    highlights: [
      "51cm wide — tucks fully under a table",
      "Moulded open slats, back and seat",
      "Sage green moulded plastic",
      "4.2kg, the lightest Axis seat",
    ],
    styleTags: ["Modern", "Minimal"],
    roomTags: ["Garden"],
    useTags: ["Seating", "Dining"],
    facts: {
      title: "Axis French Grey Chair | Kaiku",
      observed: ["slats"],
      materialTags: ["Plastic"],
      colourTags: ["Green"],
      primaryColour: "Green",
    },
  },

  {
    slug: "axis-putty-grey-carver-chair",
    summary:
      "A putty grey garden carver with arms, 60cm wide and 79cm high, weighing 4.7kg. This is the Axis colourway that genuinely is grey — a warm, stone-toned putty rather than a sage.",
    sections: [
      {
        heading: "The Axis That Is Actually Grey",
        paragraphs: [
          "Putty Grey is a warm stone grey, and unlike the French Grey version of this same carver it is not green. If you are matching garden seating to pale limestone or concrete paving, the putty grey is the Axis to choose.",
          "Putty grey sits quietly against limestone and light render, where the sage French Grey reads as a colour in its own right.",
        ],
      },
      {
        heading: "A Carver, So It Has Arms",
        paragraphs: [
          "60cm wide with arms, against 51cm for the armless Axis chair. The arms make this the more comfortable Axis to linger in, and at 60cm the wider one to fit around a table.",
          "The 79cm back and 54cm depth are the same across the range, so putty carvers and sage side chairs line up at the same height if you mix them.",
        ],
      },
      {
        heading: "Slatted and Light",
        paragraphs: [
          "The seat and back are moulded as open slats, so water runs straight through instead of sitting in a dip in the seat.",
          "4.7kg means one hand per chair when you are clearing the garden.",
        ],
      },
      {
        heading: "Specifications",
        labelled: [
          { label: "Material", value: "Plastic" },
          { label: "Colour", value: "Putty grey" },
          { label: "Width", value: "60 cm" },
          { label: "Depth", value: "54 cm" },
          { label: "Height", value: "79 cm" },
          { label: "Weight", value: "4.7 kg" },
        ],
      },
    ],
    deliveryNotes: DELIVERY_AND_RETURNS,
    warrantyNotes: WARRANTY,
    badges: ["With arms", "Warm grey"],
    highlights: [
      "60cm wide with arms",
      "Warm putty grey, not sage",
      "Moulded open slats, back and seat",
      "4.7kg",
    ],
    styleTags: ["Modern"],
    roomTags: ["Garden"],
    useTags: ["Seating", "Dining"],
    facts: {
      title: "Axis Putty Grey Carver Chair | Kaiku",
      observed: ["slats", "arms"],
      materialTags: ["Plastic"],
      colourTags: ["Grey"],
      primaryColour: "Grey",
    },
  },
];
