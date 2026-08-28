import type { Metadata } from "next";

import { DiningSpaceCalculator } from "@/components/shared/dining-space-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Will the Dining Set Fit? Table Size & Seating Calculator",
  description:
    "What size dining table fits your patio or room, and how many people it really seats. Works from the space you have and the clearance a chair actually needs.",
  path: "/tools/dining-set-size-calculator",
});

export default async function DiningSetSizeCalculatorPage() {
  const products = await getProductsByCategory("garden-furniture", {
    limit: 8,
  });

  return (
    <ToolPage
      path="/tools/dining-set-size-calculator"
      heading="Will the dining set fit, and how many will it seat?"
      intro="Measure the patio, deck or room rather than the table. Enter the space you have and we will give you the largest table that fits with room to get out of a chair, and what a table you are considering will really seat."
      method={{
        heading: "The two numbers that decide it",
        paragraphs: [
          "Circulation is the first. A chair pulled out, with someone standing behind it, needs about 90cm from the table edge to whatever is behind — a wall, a fence, a planter. Seventy-five centimetres works where nobody has to walk past a seated diner. Below that, someone is climbing over a chair every time they get up, and no amount of liking the table fixes it.",
          "Place settings are the second. A comfortable setting is 60cm of table edge per person. Fifty-five is tight but workable for a family who do not mind touching elbows, and below 50cm it stops being dinner and starts being a queue.",
          "Rectangular tables lose their corners, which is where published seat counts get optimistic. The last 20cm at each end of a long side collides with whoever is sitting at the head, so a 180cm table has 140cm of usable edge per side, not 180cm. This calculator takes that off before counting.",
          "A round table of the same capacity almost always takes less space than a rectangular one, because there are no corners to walk around and every seat has the same reach to the middle. If a rectangle will not fit, that is the first thing to try rather than dropping a seat.",
          "One long side against a wall or a fence changes the arithmetic more than anything else, because clearance is only needed on three sides. A bench does the same job: it slides under the table when nobody is sitting on it, so it needs no pull-out room at all.",
        ],
      }}
      faqs={[
        {
          question: "How much space do you need around a dining table?",
          answer:
            "About 90cm from the table edge to the nearest wall, fence or planter. That is enough to pull a chair out, stand up, and let someone walk behind. Where nobody needs to pass behind a seated diner — against a wall, or with a bench — 75cm is workable.",
        },
        {
          question: "How many people fit around a 180cm table?",
          answer:
            "Six comfortably, seven at a squeeze, if it is at least 80cm wide so the ends are usable. The long sides give 140cm of usable edge each once the corners are discounted, which is two settings per side at 60cm, plus one at each end.",
        },
        {
          question: "How much table width does each person need?",
          answer:
            "Sixty centimetres for a comfortable place setting. Fifty-five works for a family meal, and 50cm is the practical floor before elbows touch. Published seat counts often assume the tighter figure, which is why a table sold as seating eight can feel like it seats six.",
        },
        {
          question:
            "Is a round or rectangular garden table better for a small patio?",
          answer:
            "Round, in most cases. It needs less clearance because there are no corners to walk around, everyone can reach the middle, and it seats the same number in a smaller footprint. A rectangular table wins when it can sit against a wall or a fence, where its shape stops being a disadvantage.",
        },
        {
          question: "Do benches save space compared with chairs?",
          answer:
            "Yes, and more than people expect. A bench slides fully under the table when it is not in use, so that side needs no pull-out clearance at all. On a narrow patio, a bench against the wall side and chairs on the open side is usually the arrangement that fits when nothing else does.",
        },
      ]}
      products={products}
      productsHeading="Garden dining furniture in stock"
      guides={[
        {
          slug: "will-the-sofa-fit",
          title: "Will the sofa fit? Measure the route, not the room",
        },
      ]}
    >
      <DiningSpaceCalculator />
    </ToolPage>
  );
}
