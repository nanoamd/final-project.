/**
 * Batch 7 — 13 more short published descriptions.
 *
 * Two things worth explaining properly in this group, because the source
 * data names them without saying what they are:
 *
 *   - Faux shagreen (the Hampton range). Shagreen is stingray or sharkskin
 *     leather with a distinctive pebbled grain, an Art Deco material. The
 *     faux version reproduces that texture without the animal product, and
 *     the texture is the entire point of the piece.
 *   - Concrete-effect over solid oak (the Grafton console). The drawer front
 *     is real oak and the top is a concrete-effect surface, which is a
 *     deliberate industrial pairing rather than a compromise — and it means
 *     the two halves need different care.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch7.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-short-descriptions-batch7.ts --apply
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
    id: "product-import-siena-brown-round-ribbed-planter",
    title: "Siena Brown Round Ribbed Planter | Kaiku",
    summary:
      "A wide, low ceramic planter in a weathered brown finish with horizontal ribbing. 41 x 41 x 19cm, 8kg. Suitable for indoor or outdoor use.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Ceramic in a weathered brown finish, in a round bowl form with horizontal ribbing across the exterior.",
          "The ribbing catches light along the top of each ridge and holds shadow beneath it, so the surface has depth and the weathered tone reads as varied rather than flat. On a bowl this wide, that texture is what stops it looking like a plain dish.",
        ],
      },
      {
        heading: "Wide and Low — What That Suits",
        paragraphs: [
          "41 x 41cm across but only 19cm tall, weighing 8kg empty. Those proportions are unusual and they change what you plant in it.",
          "A wide, shallow bowl suits planting that spreads sideways rather than grows tall: succulents, alpines, architectural grasses, or a group of several small plants arranged together rather than one specimen.",
          "It has limited soil depth for its width, so deep-rooted plants are the wrong choice. Succulents in particular do well precisely because they want a shallow, well-drained root run.",
        ],
      },
      {
        heading: "Indoor or Outdoor",
        paragraphs: [
          "Suitable for both indoor planting and outdoor styling.",
          "Outdoors, the thing to watch is winter. Ceramic left full of wet compost through repeated freeze-thaw cycles is at risk of cracking, because water expands as it freezes. Raising it on feet so it drains, or moving it under cover in hard frost, avoids that.",
        ],
      },
      {
        heading: "Weight and Placement",
        paragraphs: [
          "8kg empty, and considerably heavier once filled — a 41cm bowl of damp compost adds a great deal. Plant it where it is going to stand rather than filling it and then moving it.",
          "On a balcony or a decked area, that combined weight is worth a thought before choosing the position.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a damp cloth. Avoid abrasive cleaners and scouring pads, which scratch ceramic and will show as bright marks across a weathered finish.",
          "Ribbing collects dirt in the grooves, particularly outdoors, so a soft brush works better than a cloth for keeping the texture clean.",
        ],
      },
    ],
  },
  {
    id: "product-import-vellis-wingback-armchair",
    title: "Vellis Blue Wingback Armchair | Kaiku",
    summary:
      "A wingback armchair in blue fabric on a metal structure, with a tall back and extended side wings. 84 x 76 x 101cm, 20.7kg.",
    sections: [
      {
        heading: "What a Wingback Is For",
        paragraphs: [
          "A wingback has a tall backrest with wings extending forward at head height, wrapping around the sitter.",
          "The shape is not decorative in origin — it was designed to shield the occupant from draughts and to hold the heat of a fire, and the wings blocked cold air from the sides. What survives from that is the practical effect people still choose it for: an enclosed, sheltered seat that feels separate from the room around it.",
          "That is why a wingback works as a reading chair in a way an open-backed armchair does not. It supports the head, and the wings cut peripheral distraction.",
        ],
      },
      {
        heading: "Design and Materials",
        paragraphs: [
          "Tactile fabric upholstery in a blue tone over a metal structure.",
          "A metal frame is what keeps a chair with this much volume down to 20.7kg. It also allows the tall back and wings to be built with a slimmer profile than a timber frame of equivalent strength.",
        ],
      },
      {
        heading: "Dimensions and Room Fit",
        paragraphs: [
          "84cm wide, 76cm deep and 101cm high, weighing 20.7kg.",
          "101cm is the figure that matters. That is a tall chair — well above the back height of a typical sofa — so it reads as a substantial object in a room and will show above a sofa back if placed behind one.",
          "In a small room it will dominate; in a large or open-plan space that presence is the point, and it works as a statement piece anchoring a corner.",
          "Allow for the 76cm depth plus circulation. Angled into a corner rather than square against a wall usually suits a wingback better, since the wings are meant to be seen in three-quarter view.",
        ],
      },
      {
        heading: "Fabric Care",
        paragraphs: [
          "Vacuum regularly with a soft upholstery attachment — grit worked into a weave by use is what wears upholstery out, well before staining does.",
          "Blot spills immediately rather than rubbing, working inward from the edge of the mark. On a tactile textured fabric, rubbing lifts and flattens the pile as well as spreading the spill.",
          "Wings and headrests take the most contact with hair and skin oils. That area benefits from more frequent attention than the seat.",
        ],
      },
    ],
  },
  {
    id: "product-import-huddington-black-sideboard",
    title: "Huddington Black Sideboard | Kaiku",
    summary:
      "A three-door sideboard in black with an architectural panelled design and internal shelving. 150 x 45 x 87cm, 57kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A black finish with an architectural panelled front across three doors.",
          "Panelling on a large flat façade is doing real visual work. A 150cm run of plain black door would read as a slab; breaking it into panels gives the front relief that catches light and shadow, so the piece has depth from across a room.",
        ],
      },
      {
        heading: "Storage Behind Three Doors",
        paragraphs: [
          "Three doors with internal shelving, all of it concealed.",
          "In a dining room that is the useful configuration: dinnerware, glassware, serving dishes and table linens stored out of sight but immediately to hand when the table is being laid. Shelving rather than drawers means tall items — decanters, platters, stacked plates — actually fit.",
          "The top becomes the serving surface, which is the traditional function of a sideboard and still the best argument for one over a cupboard.",
        ],
      },
      {
        heading: "Dimensions and Weight",
        paragraphs: [
          "150cm wide, 45cm deep and 87cm tall, weighing 57kg.",
          "87cm is slightly taller than a standard worktop, which puts the top at a comfortable height to serve from without stooping.",
          "The 45cm depth is what gives the interior genuine capacity — deep enough for dinner plates and serving dishes front to back, where a shallower console would only take one row.",
          "57kg makes this a two-person move at minimum, and worth positioning before loading. Measure the route in: 150cm is the awkward dimension through a hallway turn, more than the weight is.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust regularly with a soft dry or slightly damp cloth, and wipe spills immediately.",
          "Avoid abrasive cleaners. On a black finish this matters more than on a pale one: scratches and scuffs catch the light and show as pale marks against dark, where the same damage would be nearly invisible on oak.",
        ],
      },
    ],
  },
  {
    id: "product-import-wadborough-neutral-sofa",
    title: "Wadborough 3 Seater Sofa in Neutral | Kaiku",
    summary:
      "A three-seater sofa in neutral fabric with a durable frame and cushioned seats. 228 x 102 x 68cm, 57kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Neutral fabric upholstery over a durable frame, with cushioned seats built for daily use rather than occasional seating.",
          "A neutral upholstery is the practical choice in a sofa, which is the longest-lived and most expensive thing in most living rooms. It survives a change of paint, rug and curtains, where a strong colour dates and forces everything else to work around it.",
        ],
      },
      {
        heading: "Dimensions and Room Fit",
        paragraphs: [
          "228cm wide, 102cm deep and 68cm high, weighing 57kg.",
          "228cm is a large three-seater — over two and a quarter metres of wall. Three adults sit across it with genuine room rather than shoulder to shoulder.",
          "The 102cm depth is the figure people underestimate. That is more than a metre projecting into the room, and you need walking space beyond it, so realistically it wants around 1.5m of clear floor in front to work comfortably.",
          "68cm is a low back. That keeps it from blocking a window and lets it sit as a divider in an open-plan room without walling off the view — but it supports the shoulders rather than the head.",
        ],
      },
      {
        heading: "Delivery and Access",
        paragraphs: [
          "57kg, and a 228cm sofa is defined by whether it can get into the room.",
          "Measure the narrowest point on the route — usually a hallway turn or a stair landing rather than the front door — and check the diagonal, since a large item can often be turned through an opening it will not pass square.",
          "This is a two-person delivery at minimum, and worth clearing the route before it arrives.",
        ],
      },
      {
        heading: "Everyday Use and Care",
        paragraphs: [
          "Built for regular family use as well as entertaining, and specified often enough for boutique hotels, reception areas and show homes, which is a reasonable proxy for how it holds up to traffic.",
          "Vacuum the upholstery regularly with a soft attachment. Rotate and plump the seat cushions — people sit in the same spot, and turning the cushions evens out compression that would otherwise set permanently in one seat.",
          "Blot spills immediately, working inward from the edge of the mark rather than rubbing.",
        ],
      },
    ],
  },
  {
    id: "product-import-kington-grey-club-chair",
    title: "Kington Grey Club Chair | Kaiku",
    summary:
      "A club chair in soft grey upholstery on a plywood and rubberwood frame. 70 x 62 x 81cm, 12kg.",
    sections: [
      {
        heading: "What a Club Chair Is",
        paragraphs: [
          "A club chair is a low, deep, fully upholstered armchair with a back roughly level with the arms — the form takes its name from the leather chairs of gentlemen's clubs.",
          "The defining characteristic is that it is built to be sat in low and back rather than upright. That makes it a lounging chair rather than a task chair, and it is why club chairs read as relaxed even in a formal room.",
        ],
      },
      {
        heading: "Design and Materials",
        paragraphs: [
          "Soft grey upholstery over a plywood and rubberwood frame.",
          "The frame combination is a sound one. Rubberwood is a dense hardwood — a by-product of rubber plantations, so it is also among the better-used timbers — and it carries load at the joints, while plywood resists twisting across the wider unsupported spans. Together they are what keep a 12kg chair rigid.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "70cm wide, 62cm deep and 81cm high, weighing 12kg.",
          "This is a compact club chair. At 70cm wide it fits where a larger armchair will not — a bedroom corner, a landing, a narrow alcove beside a fireplace, or as a pair either side of a small table.",
          "12kg means one person can move it easily, which is genuinely useful for occasional seating that gets pulled into the room when people come round.",
        ],
      },
      {
        heading: "Everyday Use",
        paragraphs: [
          "Designed for both residential and commercial use, and specified for boutique hotels, reception areas, executive lounges and serviced apartments — a reasonable indication of how it stands up to being sat in by a lot of different people.",
          "Neutral grey suits Scandinavian, contemporary, modern classic, minimalist and transitional rooms without committing to any of them.",
        ],
      },
      {
        heading: "Fabric Care",
        paragraphs: [
          "Vacuum regularly using a soft upholstery attachment. This is the most effective single thing for any upholstered chair: abrasive grit in the weave wears fibres out long before marks become the problem.",
          "Blot spills immediately rather than rubbing, working inward from the outside of the mark so it does not spread outward into a ring.",
        ],
      },
    ],
  },
  {
    id: "product-import-sorelle-two-seater-sofa-with-cushions",
    title: "Sorelle Two Seater Sofa with Cushions | Kaiku",
    summary:
      "A two-seater sofa in textured white fabric on a metal construction, supplied with cushions. 197 x 97 x 72cm, 39.9kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Textured white fabric upholstery over a metal construction, supplied with cushions.",
          "The texture in the fabric is worth noting as more than a finish. A woven texture breaks up a large expanse of white, so the sofa reads as a surface with depth rather than a flat block of colour — which is what keeps a pale sofa from looking clinical.",
          "A metal frame is what holds 197cm of sofa at 39.9kg, considerably lighter than a comparable timber-framed piece.",
        ],
      },
      {
        heading: "Cushions Included",
        paragraphs: [
          "Cushions are supplied with the sofa rather than sold separately, so it arrives ready to use and styled as photographed.",
        ],
      },
      {
        heading: "Dimensions and Room Fit",
        paragraphs: [
          "197cm wide, 97cm deep and 72cm high, weighing 39.9kg.",
          "At 197cm this is a generous two-seater — two people sit with real space rather than being pressed together, and it will take a third at a push.",
          "That size makes it the sensible choice for an apartment or a smaller living room where a three-seater would fill the wall. The 97cm depth still needs allowing for: nearly a metre into the room, plus circulation in front.",
          "72cm is a low back, so it sits under a window comfortably and works as a divider in an open-plan space.",
        ],
      },
      {
        heading: "White Upholstery — Worth Thinking About",
        paragraphs: [
          "White fabric is the consideration here rather than the construction. In a bedroom, a formal sitting room or an adult household it stays clean for years. As the main sofa in a family room with young children or pets, it will not.",
          "If it is going somewhere with traffic, a set of washable throws or covers over the seat is what keeps it looking as it does on arrival.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Vacuum regularly with a soft upholstery attachment.",
          "Blot spills the moment they happen — on white, speed matters far more than technique. Work inward from the outside edge of the mark and blot rather than rub, since rubbing spreads the spill and flattens the fabric texture.",
        ],
      },
    ],
  },
  {
    id: "product-import-neathan-end-table",
    title: "Neatham End Table | Kaiku",
    summary: "A square end table, 40 x 40 x 60cm and 10kg.",
    sections: [
      {
        heading: "Design and Proportions",
        paragraphs: [
          "A square end table with a plain, unornamented form — 40 x 40cm and 60cm tall.",
          "The restraint is what makes it flexible. With no distinctive styling it works alongside contemporary, Scandinavian, minimalist, industrial and Japandi furniture rather than competing with any of them, which is the useful quality in an occasional table that has to sit next to whatever you already own.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "40 x 40cm and 60cm tall, weighing 10kg.",
          "60cm is the height that gives it more than one job. It sits at or just above the arm of most sofas, so a drink is reachable without leaning down; and it is close enough to mattress height to work as a bedside table.",
          "The 40cm square footprint is compact — it slots into the gap between a sofa and a wall, or beside a bed where a wider unit would not fit.",
          "10kg is heavier than the size suggests, which is a benefit in use: it does not shift when leaned on and will not tip if a lamp on it is knocked.",
        ],
      },
      {
        heading: "What It Holds",
        paragraphs: [
          "A table lamp, books, drinks, candles, a small plant. A 40cm top takes a lamp plus one or two things rather than a full arrangement, so treat it as a functional surface rather than a display one.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft dry or slightly damp cloth. Avoid abrasive cleaning products.",
          "Avoid prolonged exposure to moisture, and use mats under drinks and plants — standing water is what marks a finished surface, and a side table beside a sofa is where it usually happens.",
        ],
      },
    ],
  },
  {
    id: "product-import-grafton-black-console-table",
    title: "Grafton Black Console Table | Kaiku",
    summary:
      "A console table with a concrete-effect top, a solid oak drawer front and a black metal frame, with one drawer. 140 x 35 x 80cm, 15.4kg.",
    sections: [
      {
        heading: "Three Materials, Deliberately",
        paragraphs: [
          "A concrete-effect top, a solid oak drawer front, and a black metal frame.",
          "The combination is the design rather than a compromise. Concrete-effect supplies the cool industrial surface, real oak brings visible natural grain and warmth to break it up, and the black metal frame ties both together. Each does something the others cannot.",
          "The drawer front is genuine solid oak, so the grain and character are real timber rather than a printed effect — which is the part of the piece you look at most closely, at hand height.",
          "It does mean the two surfaces want different care, covered below.",
        ],
      },
      {
        heading: "The Drawer",
        paragraphs: [
          "One spacious drawer, which is what turns a hallway table into something that actually reduces clutter: keys, post, chargers and everyday essentials go in rather than accumulating on top.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "140cm wide, 35cm deep and 80cm tall, weighing 15.4kg.",
          "35cm is genuinely slim, and that is what makes it a hallway piece — 140cm of surface and a drawer while projecting barely a third of a metre, so a corridor stays passable.",
          "80cm is slightly taller than a standard table, putting the top at a comfortable height to drop things onto as you come through a door.",
          "It also works behind a sofa in an open-plan room, closing the back of the seating area.",
        ],
      },
      {
        heading: "Care for Each Surface",
        paragraphs: [
          "Wipe both with a soft dry or slightly damp cloth and avoid abrasive cleaners.",
          "The oak drawer front is the part to protect from water: standing liquid on solid timber raises the grain and leaves a mark that does not wipe off. Dry it immediately if it gets wet.",
          "The concrete-effect top is more forgiving of water but not of scratching — it is a surface finish rather than solid stone, so keep grit and sharp objects off it and use mats under anything heavy.",
        ],
      },
    ],
  },
  {
    id: "product-import-grafton-black-end-table",
    title: "Grafton Black End Table | Kaiku",
    summary:
      "An end table in solid oak on a black metal frame. 50 x 32 x 60cm, 7kg. Minor assembly may be required.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Solid oak on a durable black metal frame — real timber rather than a veneer or printed effect, so the grain and colour variation are the wood's own.",
          "Oak and black metal is the core industrial pairing, and it works because the two materials are opposites: warm, figured, organic timber against cold, plain, engineered steel. Each makes the other more noticeable.",
          "Solid oak also means the top can be maintained over years in a way a veneer cannot — a scratch in solid timber can be sanded and refinished.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "50cm wide, 32cm deep and 60cm tall, weighing 7kg.",
          "The 32cm depth is what distinguishes it: unusually shallow for a side table, so it fits tight against a sofa arm or in the narrow gap beside a bed where a square 40-50cm table will not go.",
          "60cm of height works at sofa-arm level and at bedside height, so it serves as either without looking wrong.",
          "At 7kg it is easy to move with one hand.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Minor assembly may be required — typically fixing the top to the frame. Locate all the fixings before tightening any fully, then work around the frame, which is what stops a rock developing on a four-legged table.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Clean with a soft damp or dry cloth and wipe spills immediately. Avoid harsh chemicals and abrasive cleaners.",
          "The oak top is the part that needs the discipline: standing water on solid timber raises the grain and leaves a ring. Use mats under drinks and plants, and dry any spill straight away rather than letting it sit.",
        ],
      },
    ],
  },
  {
    id: "product-import-hampton-small-square-ivory-mirror",
    title: "Hampton Ivory Shagreen Square Wall Mirror | Kaiku",
    summary:
      "A square wall mirror framed in ivory faux shagreen. 80 x 80cm, 2.5cm deep, weighing 10kg.",
    sections: [
      {
        heading: "What Faux Shagreen Is",
        paragraphs: [
          "Shagreen is stingray or sharkskin leather, with a distinctive surface of fine raised pebbles or beads. It was a signature material of Art Deco furniture in the 1920s and 30s, prized for that texture and for how it takes a pale dye.",
          "Faux shagreen reproduces the pebbled grain without the animal product. The texture is the whole point of the piece: on a plain square frame it is what turns a simple shape into something that reads as considered, catching light across the raised grain and shifting as you move past it.",
          "In ivory, the texture shows more than a colour would — a pale, low-contrast surface relies entirely on relief for its interest.",
        ],
      },
      {
        heading: "Dimensions and Hanging",
        paragraphs: [
          "80 x 80cm and 2.5cm deep, weighing 10kg.",
          "A square 80cm mirror is a substantial wall piece, and its symmetry means it works in any orientation — there is no right way up, which makes it easier to place than a rectangular mirror.",
          "10kg needs a proper fixing. Into masonry, screws into correctly sized wall plugs are straightforward. In plasterboard, fix into a stud or use heavy-duty cavity anchors rated well above the weight — ordinary plastic plugs are not adequate at 10kg. Follow the supplied mounting guidance.",
          "Two fixing points rather than one keeps a square mirror level over time and halves the load on each.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Hallways, bedrooms, living rooms and dining rooms — interior living spaces. It suits contemporary, Art Deco, modern classic and transitional rooms, which follows from the material's own history.",
          "Above a console or sideboard, hang it so the bottom of the frame sits 15-25cm above the surface so the two read as a pair.",
          "It is not designed as a bathroom mirror. If it goes in one, it needs a genuinely dry position away from shower steam — a textured frame in persistent humidity is the wrong application.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Spray the cloth, never the mirror, and keep liquid away from the frame entirely. This matters more than on a plain frame: a pebbled texture holds moisture and cleaning residue in the grain, where it dries as visible marks on an ivory surface.",
          "Dust the frame with a dry soft brush rather than a cloth — a brush reaches between the raised beads, a cloth just passes over them.",
        ],
      },
    ],
  },
  {
    id: "product-import-solara-orb-pendant-ceiling-light",
    title: "Solara Orb Pendant Ceiling Light | Kaiku",
    summary:
      "A spherical pendant ceiling light in wood, built as an open interlaced lattice. 42 x 42 x 52cm, 5.5kg. Available in brown and white.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A sphere built from interlaced wooden strips, forming an open lattice rather than a solid shade. Available in brown and white.",
          "Wood is an unusual material for a pendant and it changes the character of the light. Where a metal or glass shade reflects, timber absorbs and warms, so the fitting itself glows slightly rather than reflecting the bulb.",
        ],
      },
      {
        heading: "How the Lattice Lights a Room",
        paragraphs: [
          "This is the reason to choose it. Because the sphere is open rather than enclosed, light escapes through the gaps in every direction — up, down and sideways — instead of being directed downward by a solid shade.",
          "The practical effect is that the fitting throws pattern as well as light. The interlaced strips cast their own shadows onto the ceiling and surrounding walls, so the pendant becomes a source of texture in the room rather than just illumination.",
          "It also means the bulb is visible through the gaps. A filament-style bulb suits this fitting; a bare plastic-domed LED will be seen for what it is.",
        ],
      },
      {
        heading: "Dimensions and Hanging",
        paragraphs: [
          "42cm across and 52cm tall, weighing 5.5kg.",
          "5.5kg is light for a pendant of this size, which keeps installation straightforward — no joist-mounted fixing or opened ceiling, unlike the heavier metal and glass pendants.",
          "Over a dining table, its spherical proportions work well as a single statement fitting; leave 75-85cm between the tabletop and the lowest point so it stays out of sightlines across the table.",
          "Over a kitchen island, several hung in a row is the stronger treatment — a repeated sphere reads as deliberate, where one lone pendant on a long island looks undersized.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust with a dry, soft cloth or a soft brush. An open lattice collects dust on every strip and on both the inside and the outside, so a brush or a vacuum brush attachment does far more than a cloth can.",
          "Keep water off the timber, and isolate the circuit and let the bulb cool before cleaning.",
        ],
      },
    ],
  },
  {
    id: "product-import-teos-table-lamp",
    title: "Teos Table Lamp | Kaiku",
    summary:
      "A table lamp with a handcrafted wooden base in a light whitewash under a linen shade. 25 x 25 x 53cm, 2.5kg. Takes an E27 bulb, not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A handcrafted wooden base with a light whitewash effect, under a complementary linen shade, in a neutral beige and brown palette.",
          "A whitewash is a thinned finish that sits in the grain rather than covering it, so the timber's figure stays visible through a paler surface. That is the difference between a whitewashed base and a painted one: you can still see it is wood.",
          "Being handcrafted, the grain and the way the wash takes vary between individual lamps.",
        ],
      },
      {
        heading: "Bulb",
        paragraphs: [
          "Takes an E27 screw bulb — the standard large screw cap. Not included, so order one with the lamp if you want it working on arrival.",
          "A warm-toned LED suits the beige and brown palette and keeps heat out of a fabric shade. A cool white bulb pulls the whole neutral scheme grey.",
        ],
      },
      {
        heading: "Dimensions and Placement",
        paragraphs: [
          "25 x 25cm and 53cm tall, weighing 2.5kg.",
          "The 25cm footprint is the useful figure: compact enough to genuinely work on a bedside table with room left for a book and a glass, which many lamps in this height range are not.",
          "53cm is comfortable bedside height, and tall enough to be effective on a console table or sideboard too.",
          "2.5kg gives it enough weight to stay put when the switch is used without being a chore to move.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Dust the wooden base with a dry cloth. Keep water off a whitewashed finish — it is a thin surface treatment, and a damp cloth can lift or streak it.",
          "Brush the linen shade or use a vacuum brush attachment rather than wiping. Water marks natural linen and dries as a visible tideline.",
        ],
      },
    ],
  },
  {
    id: "product-import-himbleton-green-sofa",
    title: "Himbleton Green 3 Seater Sofa | Kaiku",
    summary:
      "A three-seater sofa in green textured chenille on powder-coated steel legs. 218 x 88 x 82cm. Minimal assembly — the legs fit after delivery.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Green textured chenille upholstery on powder-coated steel legs.",
          "Chenille is worth understanding because it is the reason this sofa looks and feels as it does. The yarn is made with short fibres standing out from a core, like a caterpillar — which is what chenille means in French — giving a dense, soft pile that catches light differently depending on the angle. That is what produces the subtle sheen and depth across a chenille sofa, and why a single colour looks varied rather than flat.",
          "In a saturated green, that shifting quality is the whole appeal: the colour reads deeper in shadow and lighter where light falls across the pile.",
          "Powder-coated steel legs rather than timber — powder coating is a baked-on finish, considerably tougher than paint, which matters on legs that get knocked by vacuum cleaners and shoes.",
        ],
      },
      {
        heading: "Dimensions and Room Fit",
        paragraphs: [
          "218cm wide, 88cm deep and 82cm high.",
          "218cm is a full three-seater, seating three adults comfortably.",
          "88cm of depth is moderate for a sofa this wide — deep enough to sit back into, but not the metre-plus depth of a lounging sofa, so it needs less floor in front and suits a normally proportioned living room.",
          "82cm is a taller back than many contemporary sofas, which means it actually supports the head and shoulders rather than only the lower back. Worth knowing if it is going under a window, where a taller back will show.",
        ],
      },
      {
        heading: "Assembly and Delivery",
        paragraphs: [
          "Minimal assembly: the legs are supplied separately and fit quickly after delivery.",
          "That is a genuine practical advantage on a sofa this size. Without legs fitted, the body is lower and easier to get through a doorway and around a hallway turn — which is where large sofas usually get stuck. Carry it in first, fit the legs in the room.",
        ],
      },
      {
        heading: "Chenille Care",
        paragraphs: [
          "Vacuum regularly with a soft upholstery attachment. Chenille's pile traps dust and grit down between the fibres, and that grit is what abrades the pile over time.",
          "Blot spills immediately and never rub. Rubbing chenille crushes and flattens the pile, and a flattened patch catches light differently from the rest — so it stays visible even after the mark itself is gone.",
          "Brush the pile back in one direction if it does become flattened in a well-used seat.",
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
    "docs/change-log/2026-09-02-rewrite-short-descriptions-batch7.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
