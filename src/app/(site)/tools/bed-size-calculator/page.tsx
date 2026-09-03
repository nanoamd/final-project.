import type { Metadata } from "next";

import { BedSizeCalculator } from "@/components/shared/bed-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size Bed Fits My Room? Size Calculator",
  description:
    "Work out the largest UK bed size your room actually takes, with room left to walk round it and make the bed — matched against real in-stock frames.",
  path: "/tools/bed-size-calculator",
});

export default async function BedSizeCalculatorPage() {
  const products = await getProductsByCategory("beds", { limit: 8 });

  return (
    <ToolPage
      path="/tools/bed-size-calculator"
      heading="What size bed fits my room?"
      intro="Measure the wall the headboard will sit against and the depth of the room from there. We will give you the largest UK bed size that leaves room to walk round it and make the bed properly."
      method={{
        heading: "The two clearances that decide it",
        paragraphs: [
          "A side you walk down or make the bed from wants at least 60cm clear — below that you are making the bed side-on rather than standing square to it. A side that also doubles as the room's main walkway, the path from the door to a wardrobe, wants 90cm instead, the same figure every other clearance calculator on this site uses for 'a person can pass.'",
          "UK sizes step in fixed increments: Single is 90cm wide, Double 135cm, King 150cm and Super King 180cm, all roughly 190–200cm long. The jump from King to Super King is 30cm — about one more shoulder's width across the mattress for two people sharing.",
          "The headboard wall itself needs nothing extra; the bed sits flush against it. The clearance budget goes on the other three sides, which is why the same bed can work in one room and feel wedged into another of the same floor area but a different shape.",
        ],
      }}
      faqs={[
        {
          question: "What size room do you need for a super king bed?",
          answer:
            "A wall of at least 240cm to leave 60cm of walking clearance beside the 180cm mattress, and a room depth of at least 260cm from that wall — more if the foot of the bed is also a walkway, which pushes the depth requirement to 290cm.",
        },
        {
          question: "Is the extra 30cm from king to super king worth it?",
          answer:
            "For two people sharing, usually yes — it is roughly one more shoulder's width across the bed, which matters most for anyone disturbed by a partner's movement. For a single sleeper it rarely is; the width goes unused and the room gives up floor space for nothing.",
        },
        {
          question: "How much clearance does a bed actually need?",
          answer:
            "At least 60cm on any side you walk down or make the bed from. If that same side is also how you reach a door or wardrobe, make it 90cm so someone can pass without brushing the mattress. The headboard wall needs none at all.",
        },
        {
          question:
            "Does an ottoman storage bed need more room than a regular frame?",
          answer:
            "Not in width or length — the footprint is the same. What it needs is clearance in front to lift the lid fully, typically the same 60–90cm this calculator already accounts for on that side, so a room that fits a regular frame of the same size usually fits the ottoman version too.",
        },
      ]}
      products={products}
      productsHeading="Beds currently in stock"
      guides={[
        {
          slug: "bed-size-and-storage",
          title: "King or super king, and is ottoman storage worth it?",
        },
      ]}
    >
      <BedSizeCalculator />
    </ToolPage>
  );
}
