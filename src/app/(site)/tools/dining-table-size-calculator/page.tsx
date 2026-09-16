import type { Metadata } from "next";

import { DiningSpaceCalculator } from "@/components/shared/dining-space-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getToolProducts } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size Dining Table Fits My Room? Size & Seating Calculator",
  description:
    "What size dining table fits your dining room, and how many it really seats. Works from the space you have and the clearance a chair actually needs.",
  path: "/tools/dining-table-size-calculator",
});

/**
 * The indoor sibling of /tools/dining-set-size-calculator, which only ever
 * matched against garden furniture stock (getToolProducts("garden-
 * furniture", ...)) — checked directly rather than assumed, since building
 * this without checking would have recreated the exact "two pages
 * competing for one query" problem flagged elsewhere on this pass. Same
 * arithmetic, same DiningSpaceCalculator component (the seating maths does
 * not care whether the table is on a patio or in a dining room); only the
 * copy and the matched stock differ.
 */
export default async function DiningTableSizeCalculatorPage() {
  const products = await getToolProducts("kitchen-furniture", {
    limit: 8,
  });

  return (
    <ToolPage
      path="/tools/dining-table-size-calculator"
      heading="Will the dining table fit, and how many will it seat?"
      intro="Measure the room rather than the table. Enter the space you have and we will give you the largest table that fits with room to pull a chair out, and what a table you are considering will really seat."
      method={{
        heading: "The two numbers that decide it",
        paragraphs: [
          "Circulation is the first. A chair pulled out, with someone standing behind it, needs about 90cm from the table edge to the nearest wall or piece of furniture. Seventy-five centimetres works where nobody has to walk past a seated diner — one long side against a wall, say. Below that, someone is climbing over a chair every time they get up.",
          "Place settings are the second. A comfortable setting is 60cm of table edge per person. Fifty-five is tight but workable, and below 50cm it stops being dinner and starts being a queue.",
          "Rectangular tables lose their corners, which is where published seat counts get optimistic. The last 20cm at each end of a long side collides with whoever sits at the head, so a 180cm table has 140cm of usable edge per side, not 180cm. This calculator takes that off before counting.",
          "A round table of the same capacity almost always takes less space than a rectangular one, because there are no corners to walk around and every seat has the same reach to the middle. If a rectangle will not fit a small dining room, that is the first thing to try rather than dropping a seat.",
        ],
      }}
      sections={[
        {
          heading: "How to measure a dining room",
          paragraphs: [
            "Measure the room at floor level, wall to wall, in both directions. Then subtract anything that is not floor you can put a chair on: a radiator, a chimney breast, the swing of the door, a skirting board with a deep profile.",
            "The door swing is the one people forget. A door opening into the dining room takes a quarter-circle of floor roughly 80cm in radius out of the usable space, and a chair parked in that arc means the door does not open. If the door can be rehung to open outward or against a different wall, that is often worth more floor than dropping a table size.",
            "Take the clearance off next: 90cm from the table edge to the nearest wall or sideboard on every side where someone walks behind a seated diner, 75cm where nobody does. What is left is the table.",
            "Then mark it out. Masking tape on the floor, or newspaper cut to size, and leave it for a day before ordering. Walk round it, pull a real chair up to the tape, sit down. Ten minutes of this catches what a calculator cannot — that the table fits and the route to the kitchen no longer does.",
            "Measure the route in as well, exactly as you would for a sofa: the front door, the hall turn, the doorway. A fixed-top table over about 180cm is a genuine problem in a terraced house, which is one reason extending tables sell as well as they do.",
          ],
        },
        {
          heading: "What each table size really seats",
          paragraphs: [
            "Published seat counts are optimistic almost across the board, because they assume 50cm a head and ignore the corners. These are the honest figures at 60cm a setting, which is what a comfortable dinner actually takes.",
            "Rectangular: 120cm seats four. 150cm seats four comfortably or six at a squeeze. 180cm seats six. 200 to 220cm seats eight. 240cm and up seats ten. Add two more at the ends on anything from 150cm up, if the ends are not against a wall and you accept that the corner seats lose elbow room.",
            "Round: 90cm seats two to three. 110cm seats four. 120 to 130cm seats four to five. 150cm seats six. 180cm seats eight. Above about 150cm a round table gets hard to reach across, which is when a lazy Susan stops being a novelty.",
            "Square: 90cm seats four, 120cm seats four generously or eight at a stretch if you use all four sides. A square table over about 140cm has a dead middle nobody can reach.",
            "The rule behind all of it: 60cm of table edge per person, and on a rectangle take 20cm off each end of the long sides because that space collides with whoever sits at the head.",
          ],
        },
        {
          heading: "Round, rectangular, oval or extending",
          paragraphs: [
            "Shape decides how a dining room works more than size does, and in a small room it is the whole decision.",
            "Round is the best answer in a small or square room. No corners to walk round means less clearance in practice than the 90cm figure implies, everybody can reach the middle, and everyone can see everyone — which is a real difference at a dinner rather than an aesthetic one. Its limit is that it stops scaling around 150cm.",
            "Rectangular wins when one long side can go against a wall, where its shape stops being a disadvantage, and in any long narrow room, which is most British dining rooms. It is also the only shape that scales past eight without becoming unreachable.",
            "Oval is the compromise and, in a narrow room, often the right one: it keeps the length and loses the corners, which are exactly the parts of a rectangle that catch hips in a tight space.",
            "Extending tables are the answer when the room is used as a room six days a week and as a dining room on the seventh. The things to check before buying: how the leaf is stored (a self-storing butterfly leaf lives in the table, a separate leaf lives in a cupboard you have to have), whether one person can open it alone, and whether the extended length still leaves 75cm of clearance — plenty of tables extend into a size the room cannot take.",
          ],
        },
        {
          heading: "Chairs, benches, and the clearances nobody lists",
          paragraphs: [
            "The table is half the furniture. The chairs decide whether the room works.",
            "Seat height to tabletop wants 28 to 30cm of clearance. UK dining tables are usually 75cm high, so a 45 to 47cm seat is right. Below 25cm you cannot cross your legs; above 32cm you are eating with your shoulders up.",
            "Check the apron — the rail under the tabletop — against the chair arms if the chairs have them. A chair with arms that will not slide under the apron takes up its full depth permanently, which can cost you 15cm of clearance per side and is entirely invisible until both pieces are in the room.",
            "A bench on one side is the genuine space-saver in a tight room: it pushes fully under the table when not in use, it seats three where two chairs would go, and it removes the pull-out clearance on that side entirely. Its cost is that the people on it have to shuffle, and nobody has a back.",
            "Allow for a sideboard if you want one before you size the table, not after. A 45cm-deep sideboard plus the 90cm of clearance in front of it takes 135cm off the room's width, and that is usually the measurement that turns a six-seater room into a four-seater one.",
          ],
        },
      ]}
      faqs={[
        {
          question: "How much space do you need around a dining table indoors?",
          answer:
            "About 90cm from the table edge to the nearest wall or sideboard — enough to pull a chair out, stand up, and let someone walk behind. Where nobody needs to pass behind a seated diner, such as one long side against a wall, 75cm is workable.",
        },
        {
          question: "What size dining table seats 6 in a small room?",
          answer:
            "A round table of 150cm diameter, or a rectangular table around 150–160cm long, both seat 6 with less floor space than the seat count suggests — round in particular, because there are no corners to walk around.",
        },
        {
          question: "How much table width does each person need?",
          answer:
            "Sixty centimetres for a comfortable place setting. Fifty-five works for a family meal, and 50cm is the practical floor before elbows touch. Published seat counts often assume the tighter figure, which is why a table sold as seating eight can feel like it seats six.",
        },
        {
          question:
            "Is a round or rectangular table better for a small dining room?",
          answer:
            "Round, in most cases. It needs less clearance because there are no corners to walk around, everyone can reach the middle, and it seats the same number in a smaller footprint. A rectangular table wins when one long side can sit against a wall, where its shape stops being a disadvantage.",
        },
        {
          question: "What size dining table seats 8?",
          answer:
            "A rectangular table of 200 to 220cm, or a round table of 180cm, at a comfortable 60cm per setting. Tables sold as seating eight are often 180cm, which is genuinely six with two more squeezed at the ends — the difference is whether everyone has elbow room or takes turns leaning back.",
        },
        {
          question:
            "How much clearance do you need between a table and a wall?",
          answer:
            "90cm from the table edge to the wall or sideboard wherever someone walks behind a seated diner — that covers pulling the chair out, standing, and passing. 75cm works where nobody passes, such as one long side against a wall. Below that, people climb over chairs to get up.",
        },
        {
          question: "How high should dining chairs be for the table?",
          answer:
            "28 to 30cm between the seat and the tabletop. UK dining tables are usually 75cm high, so a seat at 45 to 47cm is right. Also check the chair arms clear the apron under the tabletop — arms that will not slide under cost you 15cm of clearance per side, permanently.",
        },
        {
          question: "Is an extending dining table worth it?",
          answer:
            "In a room used as a room most of the week, yes. Three things to check first: whether the leaf stores inside the table or in a cupboard you then need, whether one person can open it alone, and whether the extended length still leaves 75cm of clearance — plenty of tables extend to a size the room cannot actually take.",
        },
        {
          question: "Does a bench save space at a dining table?",
          answer:
            "It is the real space-saver in a tight room. A bench pushes fully under the table when not in use, seats three where two chairs would go, and removes the pull-out clearance on that side entirely. The trade is that people have to shuffle in and out, and nobody sitting on it has a back.",
        },
      ]}
      products={products}
      productsHeading="Dining tables in stock"
      guides={[
        {
          slug: "dining-table-size-and-shape",
          title: "What size dining table for how many seats?",
        },
      ]}
    >
      <DiningSpaceCalculator />
    </ToolPage>
  );
}
