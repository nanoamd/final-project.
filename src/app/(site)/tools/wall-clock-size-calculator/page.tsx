import type { Metadata } from "next";

import { WallClockSizeCalculator } from "@/components/shared/wall-clock-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getArticleSidebar, getToolProducts } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Wall Clock Size Guide: How to Measure & What Size | Kaiku",
  description:
    "Clock size is the whole clock, frame included — not the dial. How to measure one, what size suits your wall or sideboard, and the height to hang it.",
  path: "/tools/wall-clock-size-calculator",
});

export default async function WallClockSizeCalculatorPage() {
  const products = await getToolProducts("wall-clocks", { limit: 8 });
  const sidebar = await getArticleSidebar({
    slug: "wall-clock-size-calculator",
    categorySlug: "wall-clocks",
    productSlugs: products.map((p) => p.slug),
  });

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
      sections={[
        {
          heading: "How to measure a wall clock",
          paragraphs: [
            "Clock size means the diameter of the whole clock, edge to edge, including the frame or case — not the dial inside it. Lay the clock face up, run a tape straight across the widest point through the centre, and that figure is what every retailer means by a 60cm clock. A clock with a wide surround can have a dial barely half its stated size, which is why two 60cm clocks can look completely different on a wall.",
            "For a square or rectangular clock there is no diameter, so the measurement quoted is the width, and the height is given separately. If only one figure is listed for a square clock, it is the width. Depth is measured from the wall to the frontmost point of the case, and it matters more than people expect on a narrow hallway wall or above a worktop, where a 10cm case is something you walk into.",
            "To measure a clock you already own and want to match, measure the same way — across the widest point, frame included — and then measure the mark it leaves on the wall. If the existing clock looked too small, the honest number to work from is the wall, not the clock, and the calculator above takes that instead.",
            "Two measurements are worth taking before you order anything. The usable run of wall, stopping at whatever interrupts it — a door frame, the end of a shelf, the corner. And the height of the fixing point, because the number that matters is where the centre of the face lands, not where the hook goes: a clock with a hanging loop at the very top of the case sits lower than you expect.",
          ],
        },
        {
          heading: "Common sizes, and what each one suits",
          paragraphs: [
            "Under 30cm is a desk or shelf clock in all but name. On a wall it reads as an accessory rather than a feature, and it is only legible across a small room. It is the right size in a gap above kitchen cabinets, in a downstairs loo, or on a narrow run of wall between two doors.",
            "30 to 50cm is the ordinary domestic size and the one most kitchens want. It is legible across a normal room, it suits a run of wall around a metre wide, and it sits comfortably above a 60 to 75cm piece of furniture. If you are unsure and the wall is ordinary, this is the band to be in.",
            "50 to 70cm is where a clock stops being functional and starts being a decision. It needs a metre and a half of clear wall or a sideboard of 90cm or more beneath it. This is the size that works over a mantelpiece or in a hallway with real width, and it is where most of the character in a clock range lives.",
            "Above 70cm the clock is the feature of the wall and everything else on it has to give way. It wants two metres of usable run and looks wrong sharing a wall with pictures. Bought for the right wall it is the cheapest way to make a large blank space look considered; bought for the wrong one it dominates a room that did not want dominating.",
          ],
        },
        {
          heading: "Getting it wrong, and the three ways it happens",
          paragraphs: [
            "Too small is the commonest, by a distance. A clock that looked substantial in a photograph is photographed alone; on a wall with a sofa and a bookcase it is competing, and the two-thirds rule exists because the eye judges it against what is beneath it rather than against nothing. If you are between two sizes on a piece of furniture, the larger one is almost always right.",
            "Too high is the second. A clock hung at picture height above a mantelpiece is often at 165cm and reads fine; the same clock hung by eye on a bare wall ends up at 180cm or more, where the face is angled away from you and stops being legible from a seat. If you will read it, the centre of the face wants to be between 150 and 170cm.",
            "Too deep is the one nobody anticipates. A clock case 8 to 10cm deep on a hallway wall or above a worktop is an object you brush against, and a heavy one hung where it can be knocked will eventually come down. Check the depth against how close people actually pass, not against how the wall looks empty.",
          ],
        },
      ]}
      faqs={[
        {
          question: "How do you measure clock size?",
          answer:
            "Across the widest point of the whole clock, through the centre, including the frame or case — not the dial inside it. That figure is what a retailer means by a 60cm clock. A square clock has no diameter, so the single figure quoted is its width, and depth is measured from the wall to the frontmost part of the case.",
        },
        {
          question: "Is clock size the dial or the whole clock?",
          answer:
            "The whole clock, frame included. This catches people out because a clock with a wide surround can have a dial barely half its stated size, so two 60cm clocks can look entirely different on the same wall. If the dial size matters to you for legibility, check it separately — it is rarely the number quoted.",
        },
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
      sidebar={sidebar}
      sidebarCategorySlug="wall-clocks"
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
