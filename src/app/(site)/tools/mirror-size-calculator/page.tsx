import type { Metadata } from "next";

import { MirrorSizeCalculator } from "@/components/shared/mirror-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getToolProducts } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size Mirror Above a Console Table? Size Calculator",
  description:
    "Work out what size mirror to hang above a console table, sideboard or fireplace, and how high to hang it. Enter the width of the furniture and get the size that will look right.",
  path: "/tools/mirror-size-calculator",
});

export default async function MirrorSizeCalculatorPage() {
  const products = await getToolProducts("mirrors", { limit: 8 });

  return (
    <ToolPage
      path="/tools/mirror-size-calculator"
      heading="What size mirror above a console table?"
      intro="Enter the width of the console, sideboard or mantel it will hang over, and we will give you the mirror width that looks deliberate — plus how high to hang it."
      method={{
        heading: "The proportions this uses",
        paragraphs: [
          "A mirror hung over furniture reads as belonging to it at roughly two-thirds of the furniture's width — the range that looks right is about 60 to 75 per cent. Narrower than that and the mirror looks stranded on the wall; wider and it overhangs the furniture, which reads as a mistake rather than a choice.",
          "Height is a separate question with a settled answer. The gallery convention puts the centre of a hung piece at 145cm from the floor, which is roughly eye level for an average adult standing in front of it. Hanging to match the furniture instead is the most common error, and it usually ends up too low.",
          "Over furniture, the gap between the top of the furniture and the bottom of the mirror wants to be 15 to 25cm. Below 15cm the two merge into one object; above 25cm the mirror floats away from the thing it is meant to sit with. This calculator uses 20cm, the middle of that range.",
          "Two exceptions are worth knowing. On furniture under 60cm wide a round mirror usually works better than a rectangular one, because it does not draw the eye along the width. Over 180cm, a pair of matching mirrors, or one mirror flanked by wall lights, often reads better than a single very wide piece.",
        ],
      }}
      sections={[
        {
          heading: "How to measure before you buy",
          paragraphs: [
            "Two measurements decide the mirror and a third decides whether you will like it. The first two take a minute; the third is the one people skip and then regret.",
            "Measure the furniture arm to arm, or the mantel end to end including any overhang — not the fire opening, and not the chimney breast. The overhang is part of what the eye reads as the shelf, so a mantel that is 130cm of stone over a 90cm opening is a 130cm mantel for sizing purposes.",
            "Measure the clear wall above it, from the top of the furniture to the ceiling or to the cornice. This is what caps the mirror's height rather than its width, and it is why a mirror that is the right width can still be the wrong piece — 90cm of wall above a console will not take a 100cm-tall mirror however good the proportions look in the photograph.",
            "Then stand where you will usually be and look at what is opposite. A mirror shows the wall it faces, not the wall it hangs on. Over a hallway console that is often the front door, which is fine; over a dining sideboard it can be the back of a television, which is not. Moving the mirror 40cm along the wall, or choosing a round one that catches the window instead, fixes this for nothing — and it cannot be fixed at all once the fixings are in.",
          ],
        },
        {
          heading: "Above a fireplace, in a hallway, and above a bed",
          paragraphs: [
            "The two-thirds rule holds in every position. What changes is the height, because the thing underneath is at a different height in each case.",
            "Over a fireplace, the mantel is usually 110 to 130cm from the floor, which is already close to the 145cm centre line. Work from the mantel rather than from the floor: 15 to 25cm of clear stone or timber between the mantel and the bottom of the mirror. If that pushes the top of the mirror into a cornice, the mirror is too tall rather than hung too high — go shorter, not closer.",
            "In a hallway the console is often narrow and the wall opposite is close, so a mirror does more work here than anywhere else in the house: it is the piece that stops a corridor reading as a corridor. Size it to the console as usual, and hang it a touch lower than 145cm if the hall is where people check themselves on the way out, because 145cm is eye level for someone standing back rather than standing close.",
            "Above a bed, size to the bed rather than to the headboard, and stop at two-thirds of the bed width — a mirror as wide as a double bed reads as a wall panel. The bottom edge wants 20 to 30cm of clear wall above the headboard. Fix it properly here if nowhere else; the Health and Safety Executive advises securing any mirror over half a square metre to the wall, and the place you least want one to come down is over a pillow.",
            "Above a bathroom vanity, the rule inverts slightly: match the basin unit's width or come in a few centimetres, rather than dropping to two-thirds. A vanity mirror is functional before it is decorative, and a narrow one over a wide unit means leaning to see yourself.",
          ],
        },
        {
          heading: "Round, rectangular or arched",
          paragraphs: [
            "Shape is not only taste. Each one does something different to the wall it is on, and in a small or awkward room the difference is the whole decision.",
            "Rectangular is the safe answer over a long console or a wide mantel, because it answers the shape of the furniture underneath. Hung portrait rather than landscape, the same mirror makes a low ceiling read taller — worth knowing in a room where the ceiling is the problem rather than the floor.",
            "Round softens a wall of straight lines and is usually the better choice over narrow furniture, where a rectangle draws the eye along a width there is not much of. It is also the shape that best survives being slightly off-centre, which matters in a hallway where the console cannot sit centred because of a door.",
            "Arched sits between the two and has become the default in a lot of new interiors, which is a reason to be deliberate about it rather than a reason to avoid it. It works best with height to spare above it; under a low ceiling the arch is what gets lost.",
            "Leaning a full-length mirror against the wall instead of hanging it is a real option rather than a compromise, and in a bedroom it is often the better one. It wants to be at least 45cm wide to be useful, it must be secured to the wall at the top whatever it is resting on, and it takes about 15cm of floor — which is 15cm of floor you cannot put anything else on.",
          ],
        },
        {
          heading: "Hanging a heavy mirror without it coming down",
          paragraphs: [
            "A mirror is the heaviest thing most people hang on a wall, and glass failing at head height is the reason this section is here rather than in a footnote.",
            "Find out what the wall is before you choose a fixing. Solid masonry takes a plugged screw anywhere. Plasterboard does not: a standard plug in plasterboard holds a few kilos at best, and a framed mirror of any size is well past that. On plasterboard you want the screws in the studs, which are usually 400 or 600mm apart, or a proper hollow-wall anchor rated for the weight — and the rating on the packet is for a straight downward pull, so halve it in your head.",
            "Use two fixings rather than one wherever the mirror has two hanging points. A single central hook lets the mirror swing level-ish and puts the whole load on one point; two spread the load and the mirror stays where you put it.",
            "Work out the fixing position rather than guessing. Decide where the top edge lands, measure from the mirror's hanging point — the D-ring, the wire at tension, or the slot in the back — down to that top edge, and subtract. With a taut wire, pull it up to where it will sit before measuring; a slack wire measured flat will hang the mirror several centimetres low.",
            "Check what is behind the plaster before drilling. Cables run vertically and horizontally from sockets and switches, and pipework takes the route nobody expects. A £15 detector is cheaper than either.",
          ],
        },
      ]}
      faqs={[
        {
          question: "What size mirror should go above a console table?",
          answer:
            "About two-thirds of the console's width. For a 120cm console that means a mirror around 84cm wide, and anything between 72cm and 90cm will look right. The mirror should never be wider than the furniture beneath it.",
        },
        {
          question: "How high should a mirror be hung?",
          answer:
            "With the centre of the mirror at about 145cm from the floor, which is the gallery convention and puts the middle at adult eye level. Over furniture, work from the furniture instead: leave 15 to 25cm between the top of the furniture and the bottom of the mirror.",
        },
        {
          question:
            "Should a mirror be wider or narrower than the console table?",
          answer:
            "Narrower, always. A mirror wider than the furniture beneath it overhangs at both ends and reads as the wrong size rather than a deliberate contrast. Two-thirds of the furniture width is the proportion that looks considered.",
        },
        {
          question: "What size mirror above a fireplace?",
          answer:
            "The same rule applies — around two-thirds of the mantel's width. The difference is height: a mirror over a fireplace usually cannot sit at the 145cm centre line because the mantel is higher than a console, so work from the mantel and leave 15 to 25cm above it.",
        },
        {
          question: "How do I find where to put the fixing?",
          answer:
            "Work out where the top edge should land, then measure from the mirror's hanging point — the D-ring, wire or slot on the back — down to its top edge, and subtract that. The fixing goes at the difference. Check what is behind the plaster before you drill, because pipework and cabling run where you would least like to find them.",
        },
        {
          question: "What size mirror for a hallway?",
          answer:
            "Size it to the console or shelf beneath it at about two-thirds of the width, as anywhere else. Where a hallway differs is height: if it is where people check themselves on the way out, hang the centre at 140 to 145cm rather than higher, because 145cm is eye level for someone standing back rather than standing close to the wall.",
        },
        {
          question: "Does a mirror actually make a room look bigger?",
          answer:
            "It makes a room look brighter, reliably, and larger only in the right position. A mirror facing a window doubles the daylight and genuinely opens the room up. A mirror facing a blank wall doubles the blank wall. Before you fix anything, stand where you normally stand and look at what is opposite — that is what the mirror will be showing.",
        },
        {
          question: "How heavy a mirror can plasterboard hold?",
          answer:
            "Very little on a standard plug — a few kilos at most, which any framed mirror will exceed. Get the screws into the studs, usually 400 or 600mm apart, or use hollow-wall anchors rated for the weight, and treat the packet rating as optimistic because it assumes a straight downward pull. Use two fixings rather than one wherever the mirror allows it.",
        },
        {
          question: "What size mirror above a bed?",
          answer:
            "Up to two-thirds of the bed's width, measured from the bed rather than the headboard — a mirror as wide as a double bed reads as a wall panel. Leave 20 to 30cm of clear wall above the headboard, and secure it to the wall properly. The HSE advises fixing any mirror over half a square metre, and above a pillow is where that matters most.",
        },
        {
          question: "What size mirror above a bathroom vanity?",
          answer:
            "Match the basin unit's width, or come in by a few centimetres — do not drop to two-thirds here. A vanity mirror is functional before it is decorative, and a narrow mirror over a wide unit means leaning sideways to see yourself. Height is set by the basin and the tap rather than by the 145cm rule.",
        },
      ]}
      products={products}
      productsHeading="Mirrors in stock"
    >
      <MirrorSizeCalculator />
    </ToolPage>
  );
}
