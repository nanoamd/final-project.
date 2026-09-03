import type { Metadata } from "next";

import { SofaSizeCalculator } from "@/components/shared/sofa-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size Sofa Fits My Room? Sofa Size Calculator",
  description:
    "Work out the largest straight sofa your wall and room actually take, with enough left in front of it to reach the coffee table or walk past.",
  path: "/tools/sofa-size-calculator",
});

export default async function SofaSizeCalculatorPage() {
  const products = await getProductsByCategory("sofas", { limit: 8 });

  return (
    <ToolPage
      path="/tools/sofa-size-calculator"
      heading="What size sofa fits my room?"
      intro="Measure the wall the sofa will back onto and the floor space in front of it. We will give you the largest straight sofa that fits with enough room left to reach the coffee table or let someone past."
      method={{
        heading: "Why there's no fixed sofa size",
        paragraphs: [
          "Unlike a UK bed, no regulation sets sofa dimensions — every maker cuts its own frame. In practice a 2-seater runs 140-180cm wide, a 3-seater 198-229cm, both roughly 85-100cm deep including the back cushion. This calculator works from the middle of each range, which is why the result is a size category to shop for rather than one exact model.",
          "In front of a sofa, 45cm is the minimum to reach a coffee table without standing up — comfortable is closer to 60cm. Where that same space is also how people reach the rest of the room, it wants 90cm instead, the same figure this site uses everywhere for 'a person can pass.'",
          "This calculator covers straight sofas only. A corner or chaise sofa is not a rectangle — the two legs of the L are usually different lengths — so checking its fit means measuring both legs against the two walls it will actually sit along, not one width-and-depth pair.",
        ],
      }}
      faqs={[
        {
          question: "What is the standard size of a 3-seater sofa?",
          answer:
            "There is no fixed standard, but most 3-seaters fall between 198cm and 229cm wide and 85-100cm deep including the back cushion. Always check the exact model — a chaise or wide-arm design can run wider than the category suggests.",
        },
        {
          question: "How much space do you need in front of a sofa?",
          answer:
            "45cm is the minimum to reach a coffee table without standing. If that space is also how people reach the rest of the room, allow 90cm so someone can pass without climbing over the table.",
        },
        {
          question: "Will a 3-seater sofa fit a small living room?",
          answer:
            "Most 3-seaters need about 210cm of wall and 95cm of depth before clearance. In a small room, a 2-seater plus an armchair often seats the same number in less wall space than one long 3-seater does.",
        },
        {
          question: "How do I measure a corner sofa for fit?",
          answer:
            "Measure each leg of the L separately against the wall it will sit along, including the depth each leg projects into the room. A corner sofa's total footprint is rarely symmetrical, so a single width figure will not tell you whether it fits.",
        },
      ]}
      products={products}
      productsHeading="Sofas currently in stock"
      guides={[
        {
          slug: "sofa-size-for-your-room",
          title: "What size sofa for your room, seat by seat",
        },
      ]}
    >
      <SofaSizeCalculator />
    </ToolPage>
  );
}
