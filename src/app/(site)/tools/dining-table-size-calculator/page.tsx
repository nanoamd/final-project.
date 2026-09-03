import type { Metadata } from "next";

import { DiningSpaceCalculator } from "@/components/shared/dining-space-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
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
 * matched against garden furniture stock (getProductsByCategory("garden-
 * furniture", ...)) — checked directly rather than assumed, since building
 * this without checking would have recreated the exact "two pages
 * competing for one query" problem flagged elsewhere on this pass. Same
 * arithmetic, same DiningSpaceCalculator component (the seating maths does
 * not care whether the table is on a patio or in a dining room); only the
 * copy and the matched stock differ.
 */
export default async function DiningTableSizeCalculatorPage() {
  const products = await getProductsByCategory("kitchen-furniture", {
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
