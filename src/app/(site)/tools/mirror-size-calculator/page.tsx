import type { Metadata } from "next";

import { MirrorSizeCalculator } from "@/components/shared/mirror-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size Mirror Above a Console Table? Size Calculator",
  description:
    "Work out what size mirror to hang above a console table, sideboard or fireplace, and how high to hang it. Enter the width of the furniture and get the size that will look right.",
  path: "/tools/mirror-size-calculator",
});

export default async function MirrorSizeCalculatorPage() {
  const products = await getProductsByCategory("mirrors", { limit: 8 });

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
      ]}
      products={products}
      productsHeading="Mirrors in stock"
    >
      <MirrorSizeCalculator />
    </ToolPage>
  );
}
