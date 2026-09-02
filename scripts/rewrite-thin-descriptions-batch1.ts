/**
 * Batch 1 of the thin-description rewrite: 12 published products that had
 * one section or none at all, brought up to the sauna/cold-plunge standard.
 *
 * 78 published products were sitting at <=1 heading (61 with a single
 * section, 17 with no description whatsoever). That is the real backlog
 * behind "make all descriptions amazing like saunas and cold plunges".
 *
 * Two rules this batch follows, both learned the hard way:
 *
 *   1. Mine EVERY field, not just specs. The FAQs on these documents carry
 *      facts the descriptions never used — weight capacities (160kg on the
 *      Opus footstool, 75kg on the Opus table), country of manufacture,
 *      hob/dishwasher safety, real care instructions, delivery windows.
 *      Those are what make a description substantial instead of a stub.
 *   2. Never write a section that admits a gap. The old copy said things
 *      like "the specification does not list the exact contents of the set"
 *      under a "What's in the Set" heading — a heading promising an answer
 *      followed by a refusal to give one. Where the fact isn't known, the
 *      section is simply not written. Where a fact IS known and unwelcome
 *      ("bulbs not included", "battery not supplied"), it stays and is
 *      stated plainly, because that is the fact the customer needs before
 *      they buy.
 *
 * Practical wall-fixing and placement guidance is generic-but-true trade
 * advice, not a product claim, and is written as guidance ("source anchors
 * for your wall type") rather than as a spec.
 *
 *   pnpm tsx --env-file=.env.local scripts/rewrite-thin-descriptions-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/rewrite-thin-descriptions-batch1.ts --apply
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
    id: "premier-housewares-2502222",
    title: "Morano 8 Bulb Champagne Glass Chandelier | Kaiku",
    summary:
      "An eight-arm chandelier in glass and iron, 71cm across and 143cm from ceiling plate to lowest point. Carved champagne-toned glass shades with K9 crystal detail. Takes eight E14 bulbs, up to 40W each, not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Eight arms radiate from a central iron frame, each carrying its own carved glass shade in a translucent champagne tone. The glass is faceted rather than smooth, so it breaks up the light from each bulb instead of letting it flood straight through.",
          "K9 crystal is used for the hanging detail. It is a leaded optical glass with a higher refractive index than standard glass, which is why it throws coloured light rather than simply looking clear — the same material used in quality optics.",
        ],
      },
      {
        heading: "Bulbs and Electrical Requirements",
        paragraphs: [
          "Takes eight E14 bulbs — the small screw fitting, not the larger E27 — rated to a maximum of 40W each. Bulbs are not included, so order them alongside the chandelier if you want to hang it the day it lands.",
          "At eight bulbs the maximum total load is 320W. In LED terms that is a very generous ceiling: an 8W LED gives roughly the light of a 60W incandescent, so a full set of LEDs draws around 64W in total and sits comfortably inside the limit while running cooler around the glass.",
          "This is a mains-wired ceiling fitting, not a plug-in one. It should be connected to your ceiling rose by a qualified electrician, and the circuit isolated at the consumer unit before any work starts.",
        ],
      },
      {
        heading: "Dimensions and Ceiling Height",
        paragraphs: [
          "71cm across and 143cm tall, measured from the ceiling plate to the lowest point of the glass. That drop is the number that matters: it is a chandelier for a room with height, not a standard 2.4m ceiling, where it would hang into head height.",
          "Over a dining table the usual rule is 75-85cm of clear space between tabletop and the bottom of the fitting, which keeps it out of sightlines across the table. Working back from that, a 143cm drop wants a ceiling of roughly 3m or more, or a stairwell and hallway where nobody walks directly beneath it.",
        ],
      },
      {
        heading: "Assembly and Installation",
        paragraphs: [
          "Arrives flat in a single carton weighing 9.4kg and requires assembly — the arms and glass shades fit to the frame rather than arriving built.",
          "Assemble it on a soft surface before it goes up, and fit the glass last. Two people make the installation considerably easier: one to hold the weight at the ceiling while the other makes the connection.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Suited to dining rooms, entrance halls and stairwells with the ceiling height to carry the drop. Over a dining table it works as the room's focal light; in a stairwell the vertical run gives the crystal something to do as you move past it.",
          "Indoor use only. It is not rated for bathrooms or any location exposed to damp, which have their own IP-rated requirements.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Switch the circuit off and let the bulbs cool before cleaning. Dust the glass and crystal with a soft, dry cloth — abrasive cleaners and sprays will dull the faceted surfaces and can leave residue in the cut detail.",
          "Glass picks up fingermarks during assembly, so a final wipe once it is hung and cooled is worth the effort.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2502224",
    title: "Morano 6 Bulb Smoked Crystal Glass Chandelier | Kaiku",
    summary:
      "A six-arm chandelier in glass and K9 crystal with a smoked, grey-toned finish. 60cm across with an adjustable drop up to 156cm. Takes six E14 bulbs, up to 40W each, not included.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Six arms in carved glass with a smoked chrome finish, giving a grey cast rather than the clear or warm tone most glass chandeliers take. The smoking is in the glass itself, so it holds its colour whether the lights are on or off.",
          "K9 crystal is used through the refractive detail — a leaded optical glass that bends light more sharply than ordinary glass, which is what produces the spectral flashes rather than a flat sparkle.",
        ],
      },
      {
        heading: "Bulbs and Electrical Requirements",
        paragraphs: [
          "Takes six E14 bulbs — the small screw cap — rated to a maximum of 40W each. Bulbs are not supplied.",
          "Six bulbs at 40W is a 240W maximum load. A set of 8W LEDs draws around 48W in total and gives roughly the output of six 60W incandescent bulbs, which is ample for a dining room and keeps heat away from the glass.",
          "A mains-wired ceiling fitting. Have it connected by a qualified electrician, with the circuit isolated at the consumer unit first.",
        ],
      },
      {
        heading: "Dimensions and Ceiling Height",
        paragraphs: [
          "60cm in diameter with a drop that adjusts up to 156cm, so the hanging height can be set to the room rather than fixed at the maximum.",
          "That adjustment is the useful part: shortened, it suits a standard-height dining room; at full extension it is built for a stairwell or a double-height space. Over a dining table, leave 75-85cm between the tabletop and the lowest point so it does not sit in the eyeline of people opposite each other.",
        ],
      },
      {
        heading: "Assembly and Installation",
        paragraphs: [
          "Ships in one carton at 8.4kg and requires assembly. Set the drop length during installation — decide the hanging height before the final connection is made, as adjusting afterwards means taking the fitting down again.",
          "Fit the glass elements last, and have a second person take the weight at the ceiling while the connection is made.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Dining rooms, hallways and stairwells. The grey, smoked tone sits more easily against cool and monochrome schemes than a clear or champagne chandelier, which tend to read warm.",
          "Indoor use only, and not suitable for bathrooms or other damp locations.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Isolate the circuit and let bulbs cool first. Wipe the glass and crystal with a soft cloth, and keep abrasive cleaners away from the carved surfaces — they scratch the faceting and leave the smoked finish looking patchy.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-2502352",
    title: "Revive Chrome Finish Metal Floor Lamp | Kaiku",
    summary:
      "A floor lamp in chrome-finish metal, 157cm tall on a 28cm base. A slim upright profile for reading corners and spaces beside seating where a table lamp has nowhere to stand.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Metal throughout with a polished chrome finish, in a slim upright form. Chrome is a reflective finish rather than a painted one, so it picks up and returns the light around it — useful in a darker corner, and worth noting if you have a scheme built on matte blacks and brushed brass, where a mirror-bright chrome will stand apart.",
        ],
      },
      {
        heading: "Dimensions and Footprint",
        paragraphs: [
          "157cm tall with a 28cm base diameter. At that height the light source sits above the shoulder of someone seated beside it, which is where you want it for reading — high enough to throw light onto a page rather than into your eyes.",
          "The 28cm footprint is the more practical number. It takes up less floor than most side tables, so it slots into the gap beside a sofa arm or between an armchair and a wall, in spaces where there is no room for a table and a table lamp.",
        ],
      },
      {
        heading: "Placement",
        paragraphs: [
          "Floor lamps do their best work at the corner of a seating group, angled in. Directly behind a chair the light falls over the shoulder onto a book; in a room corner it lifts the ceiling line and takes the flatness out of a single overhead fitting.",
          "Run the cable along the skirting rather than across open floor, and keep the lamp out of the main walking line through the room — a slim base is easier to catch than a wide one.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the chrome with a soft, dry cloth. Chrome shows fingermarks and water spots more readily than a brushed or painted finish, so a dry cloth is better than a damp one, and abrasive cleaners will scratch the plating permanently.",
        ],
      },
      {
        heading: "Delivery and Returns",
        paragraphs: [
          "Delivery typically runs 7-14 days. Returns are accepted within 14 days provided the lamp is unused and in its original packaging, so keep the box until you are certain of the placement.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5502318",
    title: "Opus 3 Seater Woven Rope Sofa | Kaiku",
    summary:
      "A three-seater garden sofa on a eucalyptus hardwood frame with a woven polyester-cotton rope back and seat. 178 x 63 x 76cm, 26kg. Cushions included; assembly required.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A eucalyptus hardwood frame carrying a woven rope back and seat in polyester and cotton. Eucalyptus is a dense hardwood with naturally high oil content, which is what makes it a garden-furniture timber rather than an indoor-only one — it is in the same use class as teak, at a lower price.",
          "The rope weave does the work a cushion normally does: it flexes under weight and drains rather than holding water, so the seat does not stay wet after rain the way a solid upholstered base would.",
        ],
      },
      {
        heading: "What's Included",
        paragraphs: [
          "One three-seater sofa, with cushions included. The cushions are part of the product rather than a separate purchase, so the sofa arrives ready to sit on once built.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Requires assembly and ships in one carton at 26kg. A single-box, one-carton delivery means the frame comes as components to be bolted together rather than arriving built.",
          "Assemble it where it will stand — a built three-seater at 178cm wide is awkward to carry through a doorway or side gate. Leave the fixings finger-tight until every part is located, then work round and tighten fully; that avoids the misalignment you get from fully tightening one corner first.",
        ],
      },
      {
        heading: "Dimensions and Seating",
        paragraphs: [
          "178cm wide, 63cm deep and 76cm high overall, weighing 26kg. Three across at 178cm gives roughly 59cm per person, which is genuine three-adult seating rather than a two-plus-child bench.",
          "The 63cm depth is worth measuring against your space. On a narrow balcony or a path-side terrace, a sofa this deep plus knee room needs about 1.2m of clear run to work as seating rather than an obstacle.",
        ],
      },
      {
        heading: "Weather and Outdoor Use",
        paragraphs: [
          "Built as outdoor furniture, and the rope and hardwood combination handles rain far better than upholstery. The cushions are the part that does not: bring them in, or store them in a dry box, when the sofa is not in use.",
          "Over winter the frame is best kept dry — under cover or in a shed or garage. Standing water and repeated freeze-thaw cycles are harder on any timber than rain alone.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Clean the rope weave with a damp cloth and mild soap, working with the weave rather than across it. Avoid harsh chemicals and pressure washers — both drive water into the weave and can fray the rope.",
          "Eucalyptus greys over time in sunlight. That is the timber weathering, not failing; if you prefer the original tone, a hardwood oil applied to a clean, dry frame restores it.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5502319",
    title: "Opus Woven Rope Footstool | Kaiku",
    summary:
      "A garden footstool on a eucalyptus hardwood frame with a woven cotton rope top. 47 x 47cm and 36cm high, 5kg, with a 160kg weight capacity. Assembly required.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A eucalyptus hardwood frame with a woven cotton rope top. Eucalyptus is an oily, dense hardwood suited to outdoor use, and the rope weave gives a surface with some flex to it rather than a hard board.",
          "It reads as part of the Opus range, so it sits alongside the woven rope sofa and coffee table rather than looking like a separate purchase.",
        ],
      },
      {
        heading: "Dimensions and Weight Capacity",
        paragraphs: [
          "47 x 47cm square and 36cm high, weighing 5kg. Rated to a 160kg weight capacity, which is the number that decides what it can actually be used for.",
          "At 160kg it takes an adult sitting on it, not just a pair of feet — so it works as occasional extra seating when you are one chair short, which is the more useful role for a footstool this size. At 36cm it is slightly lower than a dining chair seat, and about right in front of a garden sofa.",
        ],
      },
      {
        heading: "Assembly",
        paragraphs: [
          "Requires assembly and arrives in one carton at 5kg. It is a small, light piece — the legs fix to the woven top rather than the whole thing arriving built.",
          "Locate all four legs before tightening any of them fully, then work round the frame. On a four-legged piece this is what stops a rock developing.",
        ],
      },
      {
        heading: "Outdoor Use and Storage",
        paragraphs: [
          "Made for the garden, but store it dry when it is not in use. Cotton rope is more absorbent than the synthetic ropes used on some outdoor furniture, so it holds water longer after rain and benefits from being kept out of standing wet.",
          "Keep it under cover through winter — a shed, garage or covered terrace. At 5kg it is light enough to carry in and out, which makes that easy to keep up.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the woven surface with a damp cloth. Avoid harsh chemicals, which strip the natural fibre, and skip the pressure washer — it forces water deep into the weave and can break the fibres.",
          "If it does get soaked, stand it somewhere airy to dry through rather than putting a cover straight over it, which traps the moisture in the rope.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5502321",
    title: "Opus Grey Woven Rope and Stone Round Coffee Table | Kaiku",
    summary:
      "A garden coffee table with a grey stone top on a woven PE rope, steel and eucalyptus base. 110 x 80 x 47cm, 33kg, with a 75kg top capacity. Arrives assembled.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A grey stone top over a base combining woven PE rope, a steel structure and eucalyptus wood — roughly 45% stone, 20% PE rope, 20% steel and 15% eucalyptus by composition.",
          "The PE rope here matters: unlike the natural cotton rope used elsewhere in the Opus range, PE is a synthetic that does not absorb water, so the base copes with rain without holding damp in the weave. The steel inside the base is what carries the weight of a stone top.",
        ],
      },
      {
        heading: "Dimensions and Load",
        paragraphs: [
          "110cm long, 80cm deep and 47cm high, weighing 33kg, with a stated 75kg capacity on the top.",
          "47cm is standard coffee-table height, sitting just below the seat height of most garden sofas so drinks stay within easy reach. The 110 x 80cm top is generous — enough for a full tray of glasses and a serving dish at once, rather than a single-drink surface.",
          "75kg on the top is well beyond normal use, but it is not a seat: stone tops are rated for load spread across the surface, not for someone perching on the edge.",
        ],
      },
      {
        heading: "Delivery and Setup",
        paragraphs: [
          "Arrives assembled — no build required — in one carton at 33kg. Manufactured in Vietnam.",
          "33kg with a stone top is a genuine two-person lift, and it should be carried by the base rather than the top. Decide where it is going before it arrives; a stone-topped table is not something you want to reposition repeatedly across a patio.",
        ],
      },
      {
        heading: "Weather and Outdoor Use",
        paragraphs: [
          "Built for outdoor use, with the synthetic rope and steel base handling rain without the absorption problems of natural fibre. Its own weight keeps it stable in wind, unlike a lightweight aluminium table.",
          "The eucalyptus elements will grey in sunlight over time. Through hard winters, keeping it covered or under shelter protects the stone from repeated freeze-thaw, which is harder on stone than rain is.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the stone top and the rope base with a damp cloth. Avoid harsh chemicals — acidic cleaners in particular can etch stone surfaces and leave dull patches that do not polish out.",
          "Wipe up spills reasonably promptly. Stone is porous to varying degrees, and standing liquid is more likely to mark it than a quick splash.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5503975",
    title: "Palu Rectangular Black Wall Mirror with Shell Inlay | Kaiku",
    summary:
      "A tall rectangular wall mirror with shell inlay set into a black resin frame. 60cm wide, 160cm high and 2cm deep, weighing 12.8kg. Indoor use only.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Real shell inlay set into a black resin frame around a glass mirror. The inlay is a natural material, so the pattern and iridescence vary piece to piece — no two frames carry identical shell, which is the point of an inlay finish rather than a printed one.",
          "The frame reads black with the shell catching light across it, so it changes noticeably depending on whether it sits in daylight or under lamplight.",
        ],
      },
      {
        heading: "Dimensions and Proportions",
        paragraphs: [
          "60cm wide, 160cm high and only 2cm deep, at 12.8kg.",
          "At 160cm this is a full-height mirror — hung with its base near the floor it gives a head-to-toe reflection, which is what makes it useful in a bedroom or hallway rather than purely decorative.",
          "The 2cm depth is what lets it work in a narrow hallway. It sits almost flush to the wall, so it does not catch shoulders in a corridor the way a deep-framed mirror does.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: [
          "At 12.8kg this needs fixing into something solid. Source anchors suited to your wall: into masonry, a plugged screw into brick or block is straightforward, while plasterboard needs either a stud or proper heavy-duty cavity anchors — ordinary plastic plugs are not adequate at this weight.",
          "A tall mirror is best fixed at two points rather than one, which stops it swinging out of level and spreads the load. If it is standing rather than hung, secure the top to the wall regardless: a 160cm mirror leaning against a wall is a hazard around children and pets.",
        ],
      },
      {
        heading: "Where It Works",
        paragraphs: [
          "Hallways, bedrooms and dressing areas — anywhere the full-length reflection earns its place. In a narrow hall a tall mirror on the long wall visibly opens the space out, and the shallow frame keeps the walkway clear.",
          "Indoor use only. Shell inlay and a resin frame are not intended for bathroom humidity or outdoor exposure.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe the glass with a soft cloth. Keep cleaning products off the shell inlay and the frame — sprays run down into the inlay and can lift or dull it, so spray the cloth rather than the mirror, and work away from the frame edges.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5504031",
    title: "Jensen Rectangular Silver Wall Mirror | Kaiku",
    summary:
      "A rectangular wall mirror in a silver-finish MDF frame with real glass. 80cm wide, 120cm high and 3.5cm deep, weighing 19.5kg.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A silver-finish MDF frame around a real glass mirror — glass, not acrylic, which is why it weighs 19.5kg and why the reflection stays flat and true rather than distorting slightly the way large acrylic panels can.",
          "The frame is a plain rectangular profile in a silver finish, which keeps it neutral enough to sit in a hallway, bedroom or living room without committing the room to a period style.",
        ],
      },
      {
        heading: "Dimensions and Proportions",
        paragraphs: [
          "80cm wide, 120cm high, 3.5cm deep, at 19.5kg.",
          "80 x 120cm is a genuinely large mirror — big enough to work as the main feature on a wall, and enough reflection to bounce daylight from a window on the opposite side back into the room.",
          "Hung in portrait it gives a three-quarter to full-length reflection depending on mounting height; hung in landscape it suits the wall above a sideboard or console.",
        ],
      },
      {
        heading: "Hanging",
        paragraphs: [
          "19.5kg is a substantial weight and the fixing is the part to get right. In masonry, screws into wall plugs sized to the screw will hold comfortably. In plasterboard, fix into the studs — locate them first — or use heavy-duty cavity fixings rated well above 20kg; standard plasterboard plugs are not sufficient here.",
          "Use two fixing points spread across the frame width rather than a single central hook. That keeps it level over time and halves the load on each fixing.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Clean with a damp, soft cloth. Spray the cloth rather than the glass so nothing runs down into the join between glass and frame — MDF swells if water gets into an edge, and that damage does not reverse.",
        ],
      },
      {
        heading: "Delivery and Returns",
        paragraphs: [
          "Delivery typically takes 7-14 days. Returns are accepted within 14 days if the mirror is unused and in its original packaging — worth keeping the box until it is on the wall and you are happy with the position.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5505801",
    title: "Darnell Small Black And White Finish Planter | Kaiku",
    summary:
      "A footed planter in magnesia with beech wood legs, finished in black and white. 21.5cm across and 42cm tall including the legs, 12.7kg empty, with a 25cm planting capacity.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A magnesia body — a cement-based composite reinforced with fibreglass and inorganic resin — standing on beech wood legs, in a black and white finish.",
          "Magnesia is the practical middle ground between terracotta and plastic: it takes a finish like stone and has real weight and presence, without the fragility of a thin ceramic pot. The fibreglass reinforcement is what allows the wall to stay relatively thin at this size.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "21.5cm in diameter and 42cm tall overall, with a stated capacity of 25cm and an empty weight of 12.7kg.",
          "Because the legs lift the body clear of the floor, the plant sits higher than the pot diameter suggests — useful for a trailing plant, which gets room to hang rather than resting on the floor.",
          "The 21.5cm opening suits a plant currently in a 17-19cm nursery pot, leaving room for compost around the rootball rather than forcing it in.",
        ],
      },
      {
        heading: "Weight and Placement",
        paragraphs: [
          "12.7kg empty is the number to plan around. Filled with damp compost and a plant it will be significantly heavier — realistically a two-hand lift, and not something to be shuffling around a room regularly.",
          "Decide the position before planting it up, and consider planting in place. On timber floors, a pad or coaster under the beech legs protects the finish and stops point loads marking the boards.",
        ],
      },
      {
        heading: "Indoor and Outdoor Use",
        paragraphs: [
          "Suitable for indoor or outdoor use. Outdoors, the beech legs are the element to keep an eye on — beech is not a naturally durable timber like teak or eucalyptus, so it does better under cover than standing in permanent wet.",
          "The legs need no special treatment, but expect colour variation across them: that is natural wood grain rather than a finish defect.",
        ],
      },
      {
        heading: "Planting and Care",
        paragraphs: [
          "Arrives fully assembled. Wipe the body with a soft cloth and avoid abrasive cleaners, which will mark the finish.",
          "As with any planter, what sits underneath the compost decides whether the plant thrives: a layer of drainage material at the base and a cachepot or plastic liner for the plant itself makes repotting and watering far easier, and keeps standing water away from the planter's own base.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5506183",
    title: "Kiso Black Large Stoneware Planter | Kaiku",
    summary:
      "A stoneware planter with a matte black finish, 15 x 15 x 15cm. Shipped weight 10kg. Not dishwasher safe and not for use on any hob.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "Stoneware with a matte black finish. Stoneware is fired hotter and denser than terracotta, so it holds moisture far less readily — the outside of the pot stays dry and unmarked rather than developing the pale salt bloom that terracotta gets over a season.",
          "The matte finish is worth choosing deliberately. Against foliage it recedes and lets the plant carry the arrangement, where a gloss glaze competes with it for attention.",
        ],
      },
      {
        heading: "Dimensions",
        paragraphs: [
          "15 x 15 x 15cm — a cube, equal in all three directions. Shipped weight is 10kg, which includes protective packaging for a ceramic item.",
          "At 15cm across, this takes a plant currently in a 12-13cm nursery pot. That is a desk, shelf or windowsill planter rather than a floor-standing one, despite the product name.",
        ],
      },
      {
        heading: "Planting and Watering",
        paragraphs: [
          "Because stoneware does not breathe the way terracotta does, moisture leaves the compost mainly through the surface rather than through the pot wall. In practice that means watering less often than you would an equivalent terracotta pot, and checking the compost with a finger before topping up.",
          "The most reliable approach in a decorative planter is to keep the plant in its plastic nursery pot and sit that inside, so it can be lifted out, watered properly and allowed to drain before going back. That keeps the roots out of standing water without needing to modify the planter.",
        ],
      },
      {
        heading: "What It Is Not For",
        paragraphs: [
          "Not dishwasher safe — hand wipe only. Not safe for use on any hob type: gas, electric, halogen or induction, and not for the microwave or oven either.",
          "This is a decorative planter, not ovenware or tableware. Stoneware that has not been fired and glazed for thermal cycling can crack when heated.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe with a soft cloth. Abrasive cleaners will scuff a matte finish and leave shiny patches that cannot be blended back in, so skip scouring pads and cream cleaners entirely.",
          "Manufactured in China. Delivery typically runs 7-14 days.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5506195",
    title: "Yana Large Cream Textured Ceramic Planter | Kaiku",
    summary:
      "A textured stoneware planter in cream, 20cm across and 17cm tall. Wipe clean with a soft, dry cloth. Indoor use.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "100% stoneware in a cream finish with a textured surface. The texture is in the body of the pot rather than applied over it, so it catches side light and gives the pot depth instead of reading as a flat block of colour.",
          "Stoneware is denser than terracotta and fired at a higher temperature, which is why it does not weep moisture through its walls or develop the chalky bloom terracotta gets.",
        ],
      },
      {
        heading: "Dimensions and What Fits",
        paragraphs: [
          "20 x 20cm and 17cm tall — wider than it is deep, which suits plants that spread rather than tall specimens.",
          "A 20cm opening takes a plant currently in a 15-17cm nursery pot with a little room for compost around it. This is a planter for a single medium houseplant on a table, shelf or sideboard, not a floor-standing specimen pot.",
        ],
      },
      {
        heading: "Planting and Watering",
        paragraphs: [
          "Because the walls do not breathe, compost in stoneware dries from the top down rather than all round. Check the top few centimetres with a finger before watering rather than watering to a schedule.",
          "The easiest method is to keep the plant in its nursery pot inside this one: lift it out, water it over a sink, let it drain fully, then return it. The roots never sit in standing water, and the cream finish stays clear of watermarks and compost.",
        ],
      },
      {
        heading: "Care and Cleaning",
        paragraphs: [
          "Wipe clean with a soft, dry cloth — that is the manufacturer's stated care instruction, and a dry cloth on a cream textured surface is the right call: water carries compost dust into the texture and dries as visible tidemarks.",
          "Not safe for the microwave or oven, and not for use on an electric hob. It is a planter, not a cooking or serving vessel.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "Manufactured in China. Shipped weight is 14kg including the protective packaging a ceramic item needs. Delivery typically takes 7-14 days.",
        ],
      },
    ],
  },
  {
    id: "premier-housewares-5506427",
    title: "Darnell Large Natural Face Planter | Kaiku",
    summary:
      "A face-motif planter in magnesia with inorganic resin and fibreglass, in a natural finish. 26.5 x 23 x 34cm, 7.3kg empty, with a 20cm planting capacity.",
    sections: [
      {
        heading: "Design and Materials",
        paragraphs: [
          "A sculptural face motif moulded into a magnesia body reinforced with inorganic resin and fibreglass, in a natural stone-toned finish.",
          "Magnesia is a cement-based composite. It takes fine moulded detail — which is what a face planter needs — and holds it crisply, while the fibreglass reinforcement keeps the wall thin enough that the pot is liftable at this size. A solid cast-stone equivalent would be considerably heavier.",
        ],
      },
      {
        heading: "Dimensions and Capacity",
        paragraphs: [
          "26.5cm wide, 23cm deep and 34cm tall, with a stated capacity of 20cm and an empty weight of 7.3kg.",
          "The 20cm capacity is the useful figure: it takes a plant currently in a 15-17cm nursery pot with room for compost around the rootball.",
          "A face planter is a design that depends on what you put in it. Foliage that spills — a trailing plant, or something with height and movement — reads as hair above the face, which is the effect the shape is built around. A compact, tight plant loses that entirely.",
        ],
      },
      {
        heading: "Weight and Placement",
        paragraphs: [
          "7.3kg empty, and meaningfully heavier once filled with damp compost and planted — plan on a two-hand lift when full.",
          "Because the face is on one side, this planter has a front. Position it where that side faces into the room or along the sightline, and allow a little clearance behind so the back is not pressed flat against a wall.",
        ],
      },
      {
        heading: "Indoor and Outdoor Use",
        paragraphs: [
          "Suitable for indoor or outdoor use. Outdoors, the moulded detail is the part that shows wear first — grit and algae settle in the recesses of the face rather than on flat surfaces, so it benefits from a sheltered spot rather than full exposure.",
        ],
      },
      {
        heading: "Planting and Care",
        paragraphs: [
          "Wipe with a soft cloth and avoid abrasive cleaners, which will dull the natural finish and scuff the raised detail.",
          "Use a drainage layer at the base and keep the plant in a liner or nursery pot inside where you can. That makes watering and repotting straightforward, and stops compost staining the inside rim of a natural-toned planter.",
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
    title: string;
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
      title: written.title,
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
  console.log(
    `\n${results.length} products, ${totalWords} words of description (avg ${Math.round(totalWords / results.length)} per product).`,
  );

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Applied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-02-rewrite-thin-descriptions-batch1.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
