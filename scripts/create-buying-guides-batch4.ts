/**
 * Batch 4: TV Units, Desks, Mirrors (shape) and Wall Art — one guide each,
 * merging TV unit size+height and desk depth+sit-stand into a single guide
 * per category as the roadmap's anti-cannibalization pattern already
 * established.
 *
 * Two honesty checks done before writing, the same discipline that caught
 * the sofa-leather gap in batch 2:
 *   - Zero sit-stand or height-adjustable desks in the catalogue (checked by
 *     title search) — the desk guide says so plainly rather than describing
 *     a feature Kaiku doesn't sell.
 *   - Most of our own desks are 40-66cm deep against BS EN 527's 80cm
 *     recommended depth for a monitor setup — stated directly, so the guide
 *     tells a shopper which of our desks suit a laptop versus a full
 *     monitor-and-keyboard setup, rather than implying they're interchangeable.
 *
 * TV unit and wall art embed their new calculators; mirrors embeds the
 * existing mirror-size tool (shape is the new content, sizing already has a
 * home). Desks gets no tool — depth and sit-stand height are a decision, not
 * an arithmetic check, the same call already made for shelving and the
 * wellness guides.
 *
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch4.ts
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch4.ts --apply
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

const TV_UNIT_PRODUCT_IDS = [
  "premier-housewares-2404117", // Westbury Oak Wood Veneer, 90cm
  "premier-housewares-2407087", // Addison Warm White Metal Fluted Glass, 150cm
  "premier-housewares-5501113", // Hampstead White, 180cm
  "premier-housewares-5527815", // Deskey Grey Shagreen Effect, 200cm
  "premier-housewares-5528461", // Surati Sheesham and Acacia, 175cm
  "premier-housewares-5528966", // Spezia Grey Marble Top, 200cm
  "premier-housewares-5529156", // Nashik Three Drawer Acacia, 120cm
  "product-import-hampton-ivory-tv-unit", // Hampton Ivory Shagreen, 160cm
];

const DESK_PRODUCT_IDS = [
  "premier-housewares-2406139", // Bradbury Natural Oak Veneer, 60cm deep
  "premier-housewares-2406242", // Laxton Light Oak Effect with Shelves, 60cm deep
  "premier-housewares-5528621", // Grenoble Oak Veneer 2 Drawer, 60cm deep
  "product-aosom-836-068v02bk", // Computer Desk 3 Shelves and Drawers, 49cm deep
  "product-aosom-920-100v70gg", // LED Computer Desk with Power Outlets, 50cm deep
  "product-aosom-836-580v00rb", // Compact Folding Desk, 66cm deep
  "product-import-abberley-white-desk", // Abberley White Desk, 50cm deep
  "product-import-charlton-ribbed-walnut-desk", // Charlton Ribbed Walnut Desk, 50cm deep
];

const MIRROR_SHAPE_PRODUCT_IDS = [
  "premier-housewares-5503046", // Jacen Silver Round
  "premier-housewares-5503172", // Descartes Square Window Pane
  "premier-housewares-5503146", // Relic Rectangular
  "premier-housewares-5503246", // Riza Arched Antique
  "premier-housewares-5503210", // Riza 3D Hexagonal
  "product-import-hampton-ivory-octagonal-mirror", // Hampton Ivory Octagonal
  "premier-housewares-5503358", // Avelino Illuminated LED Silver Oval
  "product-import-black-wood-arched-window-mirror", // Black Wood Arched Window
];

const WALL_ART_PRODUCT_IDS = [
  "hill-decor-21795", // Galaxy Silver and Grey Hand Painted Canvas, 150x150, single statement
  "hill-decor-24505", // Mistora Hand Painted Canvas In Frame, 80x80
  "hill-decor-24506", // Silvra Hand Painted Canvas In Frame, 80x80 — pairs with Mistora
  "premier-housewares-2800643", // Circle Design Natural Frame Wall Art, 160x60
  "premier-housewares-2800676", // Framed Labrador Wall Art, 50x50
  "premier-housewares-2800682", // Abstract Blue 2 Framed Wall Art, 80x35
  "premier-housewares-5521106", // Astratto Abstract Wall Art, 122.6x82.6
  "premier-housewares-5521147", // Astratto Natural Textured Canvas, 123x82.6 — pairs with Astratto Abstract
];

const GUIDES: GuideSpec[] = [
  {
    id: "guide-tv-unit-size-and-height",
    title: "What size TV unit, and how high to mount the screen?",
    slug: "tv-unit-size-and-height",
    excerpt:
      "A TV's diagonal isn't its width — a 65in TV is only about 144cm wide, and that's the number the unit under it actually needs to match, plus 5-20cm either side. Screen centre goes at 100-110cm from the floor whether it's wall-mounted or sat on the unit. Eight of our own units measured against real screen sizes.",
    categoryId: "category-tv-units",
    relatedProductIds: TV_UNIT_PRODUCT_IDS,
    seo: {
      title: "What Size TV Unit Do I Need? Size & Height Guide | Kaiku",
      description:
        "A 65in TV is ~144cm wide, not 165cm — the number the unit under it needs, plus 5-20cm either side. Screen centre at 100-110cm from the floor. 8 real units measured.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "The number that decides a TV unit's width isn't the TV's diagonal — it's the screen's actual width, and the two are easy to confuse. A 65in TV, measured corner to corner on a 16:9 panel, is only about 144cm wide. The unit underneath wants to be at least that wide, ideally 5-20cm wider in total so the screen doesn't overhang the ends.",
      );
      p(
        "Height follows a simpler, size-independent rule: centre the screen 100-110cm from the floor, whether it's wall-mounted above the unit or sitting on top of it. Below is the width by common screen size, and eight of our own units measured against real TVs.",
      );
      b.push(
        table(
          "b",
          n,
          "TV width by diagonal (16:9)",
          ["Diagonal", "Actual screen width", "Unit width needed"],
          [
            ["43in", "~95cm", "100-115cm"],
            ["55in", "~122cm", "127-142cm"],
            ["65in", "~144cm", "149-164cm"],
            ["75in", "~166cm", "171-186cm"],
          ],
        ),
      );
      n += 1;
      b.push(tool("b", n, "tv-unit-size", "Check your own TV and unit"));
      n += 1;
      p(
        "Rule one. Diagonal is a sales number; width is the one that fits furniture",
        "h2",
      );
      p(
        "TVs are sold and marketed by diagonal because it's one number that sounds bigger, but nothing about a room actually cares about the corner-to-corner measurement — the unit, the wall space, and the shelf all care about the screen's actual width and height. Converting first avoids buying a unit that's technically 'the right size on the box' and visibly too narrow in the room.",
      );
      p(
        "The conversion is fixed for any 16:9 screen: width is about 87% of the diagonal. A 55in TV is roughly 122cm wide, not 140cm — worth doing the sum before measuring the space rather than after.",
      );
      p(
        "Rule two. The unit wants to be wider than the screen, not equal to it",
        "h2",
      );
      p(
        "A unit exactly as wide as the screen looks accidentally matched rather than deliberately chosen — the usual guidance is 5-20cm wider in total, split roughly evenly either side, so the TV reads as sitting within the unit's width rather than balanced precisely on the edge of it.",
      );
      p(
        "Much more than 20cm wider and the relationship reverses — the unit starts to look like the main piece of furniture with the TV as an afterthought on top of it, which suits a piece bought for its own storage more than one bought specifically to hold the screen.",
      );
      p(
        "Rule three. A hundred to a hundred and ten centimetres, wall-mounted or not",
        "h2",
      );
      p(
        "The centre of the screen at 100-110cm from the floor puts it at eye level for someone seated on a typical sofa, and this doesn't change based on whether the TV sits on the unit or is mounted on the wall above it. What changes is the unit's own height: a taller unit pushes a TV sitting on top of it higher, so the unit height and the screen's own height need adding together before checking against the 100-110cm target.",
      );
      p(
        "A wall-mounted TV skips that arithmetic — the unit underneath becomes pure storage, mounted at whatever height suits the room, with the screen positioned independently at the correct eye level.",
      );
      p("Eight of our units, measured against real TV sizes", "h2");
      p(
        "Width is what to check against the table above; the unit's own height and storage are the rest of the decision.",
      );
      b.push(
        table(
          "b",
          n,
          "Our TV units, measured",
          ["Unit", "Width", "Height", "Fits up to"],
          [
            [
              "Westbury Oak Wood Veneer",
              "90cm",
              "47cm",
              "43in TV (with a little overhang)",
            ],
            [
              "Addison Warm White Metal Fluted Glass Door",
              "150cm",
              "60cm",
              "55-60in TV",
            ],
            ["Hampstead White Media Unit", "180cm", "60cm", "65-70in TV"],
            ["Deskey Grey Shagreen Effect", "200cm", "60cm", "75in TV"],
            ["Surati Sheesham and Acacia Wood", "175cm", "50cm", "65in TV"],
            ["Spezia Grey Marble Top", "200cm", "51cm", "75in TV"],
            ["Nashik Three Drawer Acacia", "120cm", "60cm", "50in TV"],
            [
              "Hampton Ivory Shagreen TV Unit",
              "160cm",
              "55cm",
              "65in TV, closer fit",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "Convert diagonal to actual width first — about 87% of the diagonal for any 16:9 screen. The unit wants to be that width plus 5-20cm, not equal to it. Centre the screen at 100-110cm from the floor regardless of whether it's wall-mounted or sat on the unit, adding the unit's own height where the TV sits on top of it.",
      );
      return b;
    })(),
    faqs: [
      [
        "What size TV unit do I need for a 65 inch TV?",
        "A 65in TV is about 144cm wide, so the unit wants to be roughly 149-164cm wide — 5-20cm wider than the screen so it doesn't overhang the ends.",
      ],
      [
        "Is TV size measured by width or diagonal?",
        "Diagonal — but width is the number that decides what fits under it. For any 16:9 screen, actual width is about 87% of the diagonal, so a 55in TV is roughly 122cm wide, not 140cm.",
      ],
      [
        "How high should a TV unit be?",
        "The unit's own height matters less than where the screen's centre ends up — aim for 100-110cm from the floor to the middle of the screen, adding the unit's height to the TV's own height if it sits on top rather than being wall-mounted.",
      ],
      [
        "Should a TV unit be wider or narrower than the TV?",
        "Wider — by 5-20cm in total is the usual guidance, so the screen reads as sitting within the unit rather than balanced on its edge. Much more than that and the unit starts to look like the main piece of furniture instead.",
      ],
      [
        "Does a wall-mounted TV still need a TV unit?",
        "Not for support, but most rooms still want one for the AV equipment, cables and storage a wall-mounted screen doesn't hold. Its height can be chosen independently of the screen, since the two aren't mounted together.",
      ],
    ],
  },
  {
    id: "guide-desk-depth-and-sit-stand",
    title: "How deep does a desk need to be, and is sit-stand worth it?",
    slug: "desk-depth-and-sit-stand-height",
    excerpt:
      "60cm depth suits a laptop; a full monitor and keyboard setup wants 70-80cm, and BS EN 527 sets 80cm as the recommended minimum. We don't currently stock a height-adjustable sit-stand desk, so this guide gives the fixed-height standard (72-75cm) and is straight about that gap, alongside eight of our own desks measured by depth.",
    categoryId: "category-desks",
    relatedProductIds: DESK_PRODUCT_IDS,
    seo: {
      title: "How Deep Should a Desk Be? Depth & Height Guide | Kaiku",
      description:
        "60cm suits a laptop; a monitor and keyboard setup wants 70-80cm (BS EN 527: 80cm recommended). Standard desk height is 72-75cm. 8 real desks measured by depth.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "Straight answer on sit-stand first: we don't currently stock a height-adjustable desk — every desk in the range is a fixed height, in the 72-75cm band that BS EN 527 (the European desk standard) sets as the seated norm. If a sit-stand desk is specifically what you're after, this guide's standing-height figures are worth having, but they describe a feature we don't yet sell rather than one of our own products.",
      );
      p(
        "Depth is where our own range genuinely varies, and it's the number most desk listings undersell: 60cm is enough for a laptop, but a monitor and keyboard together want 70-80cm, with BS EN 527 setting 80cm as the recommended minimum for that setup. Below is what each depth actually suits, and eight of our own desks measured against it.",
      );
      b.push(
        table(
          "b",
          n,
          "Desk depth by setup",
          ["Setup", "Minimum depth", "Comfortable depth"],
          [
            ["Laptop only", "60cm", "60-70cm"],
            [
              "External monitor + keyboard",
              "70cm",
              "80cm (BS EN 527 recommended)",
            ],
            ["Two monitors", "80cm", "80-90cm"],
          ],
        ),
      );
      n += 1;
      p(
        "Rule one. Sixty centimetres is a laptop depth, not a monitor depth",
        "h2",
      );
      p(
        "A 60cm-deep desk fits a laptop with room for a notepad in front of it, which is exactly the setup most compact desks are designed and marketed for. Add an external monitor at a healthy 50-75cm eye-to-screen distance and 60cm of depth pushes the monitor right against the edge — usable, but not the setup BS EN 527's 80cm recommendation is based on.",
      );
      p(
        "This is the single most useful check before buying: if a monitor is part of the plan, measure the desk's depth against 70-80cm before checking anything else about it.",
      );
      p(
        "Rule two. Elbow height sets the desk height, which is why 72-75cm is standard",
        "h2",
      );
      p(
        "A desk's height is supposed to put your forearms roughly horizontal with your elbows near 90 degrees when typing — seated elbow height, not an arbitrary furniture-industry number. For most adults that lands at 72-75cm, which is why BS EN 527 fixes the standard there and why a desk far outside that range needs an adjustable chair to compensate.",
      );
      p(
        "Someone notably taller or shorter than average is the case a fixed-height desk serves worst — the chair can raise or lower the seated position, but only within limits before the desk itself becomes the wrong height for a comfortable elbow angle.",
      );
      p("Rule three. What a sit-stand desk actually changes", "h2");
      p(
        "A height-adjustable desk covers a much wider range than any fixed desk — commonly around 65-125cm, enough to suit a genuinely wide range of heights and to alternate between sitting and standing through the day. Neither of those is something a fixed-height desk can do at all, which is the real case for one, more than any specific health claim about standing itself.",
      );
      p(
        "We don't have one in the range to point you to. If sit-stand is the priority, that's worth knowing before shopping our desk category rather than after.",
      );
      p("Eight of our desks, by depth", "h2");
      p(
        "Sorted so it's obvious at a glance which suit a laptop and which stretch to a full monitor setup.",
      );
      b.push(
        table(
          "b",
          n,
          "Our desks, measured by depth",
          ["Desk", "Depth", "Best suited to"],
          [
            [
              "Compact Folding Desk, Storage Shelf",
              "66cm",
              "Laptop, or a compact monitor setup",
            ],
            ["Bradbury Natural Oak Veneer, 1 Drawer", "60cm", "Laptop"],
            ["Laxton Light Oak Effect with Shelves", "60cm", "Laptop"],
            ["Grenoble Oak Veneer 2 Drawer", "60cm", "Laptop"],
            ["LED Computer Desk with Power Outlets", "50cm", "Laptop"],
            ["Abberley White Desk", "50cm", "Laptop"],
            ["Charlton Ribbed Walnut Desk", "50cm", "Laptop"],
            ["Computer Desk, 3 Shelves and Drawers", "49cm", "Laptop"],
          ],
        ),
      );
      n += 1;
      p(
        "None of our current range reaches BS EN 527's 80cm recommendation — worth knowing plainly rather than discovering after a monitor arrives and doesn't comfortably fit. All are workable for a laptop, which is the setup most of them are actually designed around.",
      );
      p("The short version", "h2");
      p(
        "60cm depth suits a laptop; a monitor and keyboard setup wants 70-80cm. Desk height is standardised at 72-75cm because it matches seated elbow height for most adults. We don't stock a sit-stand desk — if that's the requirement, know that before shopping this category, not after.",
      );
      return b;
    })(),
    faqs: [
      [
        "How deep should a desk be for a monitor?",
        "70-80cm is the practical range, with BS EN 527 (the European desk standard) recommending 80cm. A 60cm-deep desk works for a laptop but puts an external monitor closer to the edge than the standard's healthy eye-to-screen distance assumes.",
      ],
      [
        "What is the standard height for a desk?",
        "72-75cm, set by BS EN 527 to match seated elbow height for most adults — the height that lets your forearms sit roughly horizontal with elbows near 90 degrees while typing.",
      ],
      [
        "Does Kaiku sell height-adjustable sit-stand desks?",
        "Not currently — every desk in the range is a fixed height in the standard 72-75cm band. If sit-stand is specifically what you need, that's a gap in our range worth knowing about before browsing it.",
      ],
      [
        "What height range does a sit-stand desk need to cover?",
        "Commonly around 65-125cm, wide enough to suit most adult heights seated and standing. That range is what a fixed-height desk can't offer at all, which is the practical case for one over any specific claim about standing itself.",
      ],
      [
        "Is a 50cm deep desk too small?",
        "Not for a laptop, which is what most desks that shallow are designed around. It's tighter than ideal for an external monitor at a healthy viewing distance — 70-80cm suits that setup better.",
      ],
    ],
  },
  {
    id: "guide-mirror-shape",
    title: "What shape mirror suits your wall?",
    slug: "what-shape-mirror",
    excerpt:
      "Round softens a room of straight lines and hard furniture edges; rectangular and square match a grid of existing frames; arched and octagonal read as more traditional or architectural. The two-thirds sizing rule works identically across every shape — this guide is about which shape to reach for, with eight of our own mirrors as the reference.",
    categoryId: "category-mirrors",
    relatedProductIds: MIRROR_SHAPE_PRODUCT_IDS,
    seo: {
      title: "What Shape Mirror Suits Your Wall? Style Guide | Kaiku",
      description:
        "Round softens hard edges, rectangular matches a grid of frames, arched and octagonal read as traditional. The two-thirds sizing rule holds across every shape — which shape to choose.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "Shape is a different decision from size, and it's worth separating the two: this site's mirror calculator already covers the two-thirds sizing rule, which applies identically whichever shape you pick. What follows is the part sizing doesn't answer — which shape actually suits the room.",
      );
      p(
        "The short version: round and oval soften a room built from straight lines and hard furniture edges; square and rectangular match an existing grid of frames or panelling; arched and octagonal read as more traditional or architectural, and stand out precisely because they're less common.",
      );
      b.push(
        table(
          "b",
          n,
          "Mirror shape at a glance",
          ["Shape", "Effect", "Best suited to"],
          [
            [
              "Round / oval",
              "Softens straight lines",
              "A room with a lot of hard edges — square furniture, panelling",
            ],
            [
              "Rectangular / square",
              "Matches a grid",
              "Alongside existing framed art or windows",
            ],
            [
              "Arched",
              "Traditional, architectural",
              "Period features, or as a deliberate contrast to a modern room",
            ],
            [
              "Hexagonal / octagonal",
              "Graphic, distinctive",
              "A single statement piece rather than a matched pair",
            ],
          ],
        ),
      );
      n += 1;
      b.push(
        tool("b", n, "mirror-size", "Get the sizing right, whatever the shape"),
      );
      n += 1;
      p(
        "Rule one. Round softens a room that's otherwise all straight lines",
        "h2",
      );
      p(
        "A room built from rectangular furniture, square panels and straight window frames reads as softer with one round or oval shape breaking up the grid — the mirror doesn't need to be large to do this, since the contrast comes from the shape itself rather than its size. This is the shape that most often 'fixes' a room that feels harder-edged than intended without anyone being able to say exactly why.",
      );
      p(
        "It's also the safest shape to hang off-centre or asymmetrically, because a circle or oval doesn't have corners drawing the eye toward alignment the way a rectangle does.",
      );
      p(
        "Rule two. Rectangular and square match what's already on the wall",
        "h2",
      );
      p(
        "Where a room already has framed art, windows or wall panelling in straight lines, a rectangular or square mirror sits into that existing grid rather than fighting it — the safer, more cohesive choice when the mirror is joining a wall that already has a visual language rather than starting one.",
      );
      p(
        "It's also the easier shape to hang precisely, since a rectangle's edges give you a straightforward reference for level and alignment that a round or arched mirror doesn't.",
      );
      p(
        "Rule three. Arched and octagonal are for standing out, not blending in",
        "h2",
      );
      p(
        "An arched mirror reads as period or traditional — the shape borrows from church windows and older architecture, which is why it suits a room with genuine period features, or works as a deliberate contrast dropped into an otherwise modern space. A hexagonal or octagonal mirror does the opposite job: it's graphic and modern, and it draws attention by being a shape you don't see as often on a wall.",
      );
      p(
        "Both work best as a single statement piece rather than part of a matched pair or gallery grouping — the more unusual the shape, the more it wants to be the one thing the eye lands on, not one of several.",
      );
      p("Eight of our mirrors, by shape", "h2");
      p(
        "The same effect as the rule above, shown against real pieces rather than described in the abstract.",
      );
      b.push(
        table(
          "b",
          n,
          "Our mirrors, by shape",
          ["Mirror", "Shape", "Price"],
          [
            ["Jacen Silver Metal Frame Round", "Round", "£178"],
            ["Descartes Square Window Pane", "Square", "£109"],
            ["Relic Rectangular", "Rectangular", "£419"],
            ["Riza Arched Antique", "Arched", "£445"],
            ["Black Wood Arched Window Mirror", "Arched", "£108"],
            ["Riza 3D Hexagonal", "Hexagonal", "£377"],
            ["Hampton Ivory Octagonal", "Octagonal", "£623"],
            ["Avelino Illuminated LED Silver Oval", "Oval", "£220"],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "Round and oval soften a room of hard edges; rectangular and square join an existing grid of frames or panelling; arched and octagonal are statement shapes best used singly rather than in a pair. Size follows the same two-thirds rule regardless of shape — sort that with the calculator above once the shape's decided.",
      );
      return b;
    })(),
    faqs: [
      [
        "What shape mirror is best for a small room?",
        "Round or oval, generally — a curved shape reads as less imposing than a large rectangle on the same wall, and it's more forgiving to hang slightly off-centre if the room's proportions aren't perfectly symmetrical.",
      ],
      [
        "Does mirror shape affect how big it should be?",
        "No — the two-thirds proportion of the furniture below applies the same way regardless of shape. Shape and size are separate decisions; this site's mirror calculator handles sizing once the shape is chosen.",
      ],
      [
        "Is an arched mirror too traditional for a modern room?",
        "Not necessarily — an arched shape can work as a deliberate point of contrast in an otherwise modern room, precisely because it reads as unexpected there. It suits a period room more automatically, but it isn't limited to one.",
      ],
      [
        "Should you hang two mirrors of the same unusual shape as a pair?",
        "Generally no — a hexagonal, octagonal or otherwise distinctive shape works best as a single statement piece. Pairing two draws attention to the shape itself twice over, which usually reads as busy rather than deliberate.",
      ],
      [
        "What mirror shape matches a room with a lot of straight-edged furniture?",
        "Round or oval — the curve contrasts with the room's straight lines rather than repeating them, which is usually what makes a mirror feel like a considered addition rather than just another rectangle on the wall.",
      ],
    ],
  },
  {
    id: "guide-wall-art-size-and-arrangement",
    title: "What size wall art, and gallery wall or single piece?",
    slug: "wall-art-size-and-arrangement",
    excerpt:
      "A gallery wall is sized as one shape, at the same two-thirds proportion as a single canvas — a cluster of small prints spanning the right footprint is correctly sized even though any one print in it looks too small alone. When a single statement piece works better than a group, and eight of our own pieces shown both ways.",
    categoryId: "category-wall-art",
    relatedProductIds: WALL_ART_PRODUCT_IDS,
    seo: {
      title: "Wall Art Size & Gallery Wall vs Single Piece Guide | Kaiku",
      description:
        "A gallery wall is sized as one shape at the same two-thirds proportion as a single canvas. When a statement piece beats a group, spacing that reads as one arrangement, and real examples.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "The sizing rule is the one this site already uses for mirrors and wall clocks: art reads as belonging to the furniture below it at roughly two-thirds of that furniture's width. What's different about a gallery wall — several pieces arranged as a group — is that the rule applies to the whole arrangement's outer edges, not to each piece measured on its own.",
      );
      p(
        "That's also the answer to gallery-wall-or-single-piece: it's not really a size question. Both fill the identical footprint at the identical proportion — the choice is about upkeep and commitment, covered in the rules below, with eight of our own pieces shown both ways.",
      );
      b.push(
        table(
          "b",
          n,
          "Sizing, single piece or gallery",
          ["Placement", "Target width", "Applies to"],
          [
            [
              "Over furniture",
              "60-75% of furniture width",
              "One piece, or the whole gallery footprint",
            ],
            [
              "Bare wall",
              "50-75% of usable run",
              "One piece, or the whole gallery footprint",
            ],
          ],
        ),
      );
      n += 1;
      b.push(
        tool(
          "b",
          n,
          "wall-art-size",
          "Size a single piece or a whole arrangement",
        ),
      );
      n += 1;
      p("Rule one. A gallery wall is one shape, judged as a whole", "h2");
      p(
        "Five small prints spanning the right two-thirds of a sideboard are correctly sized, even though any single print in that group looks too small hung alone. The mistake is judging each piece against the furniture individually — the arrangement's total footprint is what the proportion actually governs.",
      );
      p(
        "This also means a gallery wall can mix wildly different piece sizes without breaking the rule, as long as the outer boundary of the whole cluster lands in the right range.",
      );
      p("Rule two. Frames sit 5-8cm apart, not by eye", "h2");
      p(
        "Individual pieces in a group usually sit 5-8cm apart — tight enough to read as one arrangement rather than a scatter of unrelated pictures, loose enough that each piece still stands on its own rather than merging into its neighbour. Much closer and the group looks crowded; much further apart and it stops reading as a group at all.",
      );
      p(
        "Working this out on the wall by eye is where most gallery walls go wrong — laying the pieces out on the floor first, with a tape measure between them, catches spacing mistakes before they're nail holes.",
      );
      p(
        "Rule three. A single statement piece is lower-commitment than it looks",
        "h2",
      );
      p(
        "One large canvas is easier to hang, easier to rehang if the furniture moves, and asks nothing of you beyond finding the centre point — no relative spacing between multiple pieces to get right. It's also easier to swap out entirely later, since there's only one hole pattern to reckon with rather than several.",
      );
      p(
        "A gallery wall's real advantage is the opposite of commitment: it can be built gradually, piece by piece, and individual prints can be swapped without redoing the whole arrangement — better suited to a collection that's still growing than to someone who wants the wall finished this weekend.",
      );
      p("Rule four. Height follows the same rule as a mirror", "h2");
      p(
        "Over furniture, leave 20cm between the top of the piece — or the lowest piece in a gallery group — and the furniture below. On bare wall with nothing beneath it, centre at 145cm, the gallery convention that puts the middle of the arrangement at eye level for an adult standing in front of it.",
      );
      p("Eight of our pieces, single and paired", "h2");
      p(
        "A large single statement canvas, a matched pair sized identically for a symmetrical hang, and a mix of sizes suited to building a gallery wall gradually.",
      );
      b.push(
        table(
          "b",
          n,
          "Our wall art, by use",
          ["Piece", "Size", "Best as"],
          [
            [
              "Galaxy Silver and Grey Hand Painted Canvas",
              "150 x 150cm",
              "Single statement piece",
            ],
            [
              "Mistora Hand Painted Canvas In Frame",
              "80 x 80cm",
              "One half of a matched pair",
            ],
            [
              "Silvra Hand Painted Canvas In Frame",
              "80 x 80cm",
              "The other half — same size, different finish",
            ],
            [
              "Circle Design Natural Frame Wall Art",
              "160 x 60cm",
              "Single piece, wide format",
            ],
            [
              "Framed Labrador Wall Art",
              "50 x 50cm",
              "Gallery wall — smaller anchor piece",
            ],
            [
              "Abstract Blue 2 Framed Wall Art",
              "80 x 35cm",
              "Gallery wall — narrow accent piece",
            ],
            [
              "Astratto Abstract Wall Art",
              "122.6 x 82.6cm",
              "Single piece, or a gallery pairing",
            ],
            [
              "Astratto Natural Textured Canvas",
              "123 x 82.6cm",
              "The gallery pairing for the piece above",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "Size the whole arrangement at 60-75% of the furniture width, or 50-75% of a bare wall's usable run — the same proportion whether it's one canvas or a cluster of six. Space grouped frames 5-8cm apart. A single piece is lower-commitment and easier to rehang; a gallery wall can be built gradually and adjusted piece by piece.",
      );
      return b;
    })(),
    faqs: [
      [
        "How do you size a gallery wall?",
        "As one shape, not piece by piece. Work out the target width for the whole arrangement using the two-thirds-of-furniture (or half-to-three-quarters of bare wall) rule, then lay the individual pieces out to fill that footprint with 5-8cm between them.",
      ],
      [
        "Is a gallery wall or a single large piece better?",
        "Both fill the same footprint at the same proportion, so it's not really a sizing question. A single piece is easier to hang and rehang; a gallery wall can be built gradually and individual pieces swapped without redoing the whole arrangement.",
      ],
      [
        "How far apart should gallery wall frames be?",
        "5-8cm is the usual spacing — close enough to read as one arrangement, loose enough that each piece still stands on its own. Lay the pieces out on the floor with a tape measure first, rather than guessing by eye on the wall.",
      ],
      [
        "What size art should go above a sofa?",
        "Roughly 60-75% of the sofa's width, whether that's one large canvas or a gallery arrangement's combined footprint. The bottom edge — or the lowest piece in a group — wants to sit about 20cm above the top of the sofa back.",
      ],
      [
        "Can a gallery wall mix different sized frames?",
        "Yes — since the proportion applies to the whole arrangement's outer edges rather than each piece individually, a group can mix sizes freely as long as the overall footprint lands in the right range for the furniture or wall it's on.",
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
    "docs/change-log/2026-09-03-create-buying-guides-batch4.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
