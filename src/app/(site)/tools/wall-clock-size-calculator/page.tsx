import type { Metadata } from "next";

import { WallClockSizeCalculator } from "@/components/shared/wall-clock-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Wall Clock Size Calculator — What Size Clock, and How High?",
  description:
    "The clock diameter that suits your sideboard, wall or kitchen, and the height to hang the centre of the face. Enter one measurement and get both.",
  path: "/tools/wall-clock-size-calculator",
});

export default async function WallClockSizeCalculatorPage() {
  const products = await getProductsByCategory("wall-clocks", { limit: 8 });

  return (
    <ToolPage
      path="/tools/wall-clock-size-calculator"
      heading="What size wall clock do you need?"
      intro="Enter the width of the furniture below it, the run of bare wall, or the gap above your kitchen cabinets. The answer is a diameter and a hanging height."
      method={{
        heading: "The arithmetic, and why the placement changes it",
        paragraphs: [
          "Over furniture, a clock is sized against the furniture. The proportion is the same two-thirds that governs mirrors and pictures — a little under is safe, a little over starts to look top-heavy. On a 120cm sideboard that lands at about 75cm.",
          "On a bare wall the constraint changes completely. A clock needs clear space of roughly half its own diameter on each side to read as placed rather than crammed, so the largest clock a run of wall takes is about half that run. This is why a large room with a 90cm gap between a door frame and a bookcase is still a small-clock room, and why the measurement to take is the usable run rather than the wall corner to corner.",
          "In a kitchen neither applies. Wall cabinets top out at around 210cm and the clock goes in the gap between them and the ceiling, centred in it with roughly 10cm clear above and below the face. If the gap is 40cm the clock is a 25–30cm clock, whatever the rest of the room would take.",
          "Height is a separate question with two answers. A clock you genuinely read hangs above furniture and sightlines, centred 150–170cm from the floor, where the face stays legible at an angle. A clock that is mainly decorative follows the gallery convention at 145cm, which puts it in the same line as pictures on the same wall.",
        ],
      }}
      faqs={[
        {
          question: "How high should a wall clock be hung?",
          answer:
            "Centre the face between 150cm and 170cm from the floor if you intend to read the clock, and at about 145cm if it is mainly decorative. The lower figure is standard gallery height, which is why a clock hung there sits comfortably alongside pictures.",
        },
        {
          question: "What size clock goes above a sideboard?",
          answer:
            "About two-thirds of the sideboard's width. A 120cm sideboard suits a clock of roughly 75–80cm, and a 150cm one suits 95–100cm. Below half the width the clock looks stranded, however good it is.",
        },
        {
          question: "How much clear wall does a clock need?",
          answer:
            "Roughly half its own diameter on each side, so an 80cm clock wants about 160cm of wall to itself. Measure the usable run rather than the whole wall — a doorframe or the end of a shelf is where the run stops.",
        },
        {
          question: "What size clock for a kitchen?",
          answer:
            "If it is going above the wall cabinets, measure the gap between the cabinet tops and the ceiling and take about 20cm off it — a 60cm gap suits a 35–50cm clock. If it has a clear wall, 50–60cm reads better, and legibility matters more here than anywhere else in the house.",
        },
        {
          question: "Is a large wall clock too much for a small room?",
          answer:
            "Usually the opposite. One large clock reads as a single confident decision where several small objects read as clutter. The limit is the wall run rather than the floor area, which is what this calculator works from.",
        },
      ]}
      products={products}
      productsHeading="Wall clocks, with their diameters"
      guides={[
        {
          slug: "where-to-hang-a-wall-clock",
          title: "What size wall clock do you need, and where does it hang?",
        },
        {
          slug: "table-lamp-size-guide",
          title: "What size table lamp for a bedside or console?",
        },
      ]}
    >
      <WallClockSizeCalculator />
    </ToolPage>
  );
}
