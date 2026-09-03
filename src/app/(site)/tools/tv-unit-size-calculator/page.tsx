import type { Metadata } from "next";

import { TvUnitSizeCalculator } from "@/components/shared/tv-unit-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size TV and TV Unit Do I Need? Size Calculator",
  description:
    "What size TV your seating distance actually calls for, and how wide a TV unit needs to be under it — worked from THX's own cinema-immersion figures and the everyday range most rooms use instead.",
  path: "/tools/tv-unit-size-calculator",
});

export default async function TvUnitSizeCalculatorPage() {
  const products = await getProductsByCategory("tv-units", { limit: 8 });

  return (
    <ToolPage
      path="/tools/tv-unit-size-calculator"
      heading="What size TV, and what size unit under it?"
      intro="Enter your seating distance, your TV's size, or both. We will give you the screen size that distance actually suits, and the unit width that screen needs — not the same number as its diagonal."
      method={{
        heading: "Two figures that get confused for one",
        paragraphs: [
          "THX's own cinema-immersion guideline is distance(ft) = diagonal(in) / 10 — close enough to fill your field of view the way a cinema screen does. Most living rooms don't actually sit that close. The everyday range most retailers work to instead is 1.5-2x the screen's diagonal, which for a 55in TV is 210-280cm rather than THX's 170cm.",
          "A TV's diagonal is not its width. A 65in TV is a 65in corner-to-corner measurement on a 16:9 panel that is only about 144cm wide — and it's the width, not the diagonal, that decides what fits under it.",
          "The unit under a TV wants to be at least as wide as the screen, and ideally 5-20cm wider in total so the panel doesn't overhang the ends. Height follows a simpler rule: centre the screen 100-110cm from the floor, whether it's wall-mounted or sat on the unit.",
        ],
      }}
      faqs={[
        {
          question: "What size TV do I need for a 3m living room?",
          answer:
            "Using the everyday range (1.5-2x the diagonal), a 3m viewing distance suits roughly a 60-79in TV. THX's more cinema-like figure would push that to about 98in, which is bigger than most living rooms want on a permanent basis.",
        },
        {
          question: "Is my TV too big for the room?",
          answer:
            "If your seating distance is under 1.5x the screen's diagonal, it's closer than the everyday range and will feel oversized for anything but a film night. Over 2x the diagonal, and a bigger screen would use the room better.",
        },
        {
          question: "How wide should a TV unit be compared to the TV?",
          answer:
            "At least as wide as the screen itself, ideally 5-20cm wider in total. Work from the screen's actual width, not its diagonal — a 65in TV is only about 144cm wide, not 165cm.",
        },
        {
          question: "How high should a TV be mounted or placed?",
          answer:
            "Centre the screen 100-110cm from the floor, measured to the middle of the panel. That puts it at eye level for someone seated on a typical sofa, whether the TV is wall-mounted above a unit or sitting on top of it.",
        },
      ]}
      products={products}
      productsHeading="TV units currently in stock"
      guides={[
        {
          slug: "tv-unit-size-and-height",
          title: "What size TV unit, and how high to mount the screen",
        },
      ]}
    >
      <TvUnitSizeCalculator />
    </ToolPage>
  );
}
