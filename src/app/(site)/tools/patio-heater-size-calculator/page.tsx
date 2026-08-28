import type { Metadata } from "next";

import { PatioHeatCalculator } from "@/components/shared/patio-heat-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Patio Heater Size Calculator — kW to BTU, and What You Need",
  description:
    "How many kW or BTU your patio heater or gas fire pit needs for your seating area, and what those ratings actually mean. Converts both ways.",
  path: "/tools/patio-heater-size-calculator",
});

export default async function PatioHeaterSizeCalculatorPage() {
  const products = await getProductsByCategory("fire-pits", { limit: 8 });

  return (
    <ToolPage
      path="/tools/patio-heater-size-calculator"
      heading="What size patio heater or fire pit do I need?"
      intro="Patio heaters are rated in kW and gas fire pits in BTU, which makes them hard to compare. Enter your seating area and any rating you are looking at, and we will do both."
      method={{
        heading: "What the ratings mean, and what they do not",
        paragraphs: [
          "One kilowatt is 3,412 BTU per hour, so the two units describe the same thing at very different scales. A fire pit advertised at 50,000 BTU is a 14.6kW appliance; an electric heater at 2.1kW is 7,165 BTU. Neither number is more honest than the other, but seeing them side by side is the only way to compare a gas fire pit against an electric heater.",
          "The starting figure most manufacturers work to is around one kilowatt for every two and a half square metres of seating area, in still and mild conditions. This calculator uses that, then increases it for how exposed the spot is, because wind is the variable that actually decides whether people are comfortable.",
          "The important thing about outdoor heating is that it does not warm the air — the air moves away. It warms what it shines on, the same way sunshine does. That means coverage is a question of line of sight and distance, not of volume, and it means two smaller units either side of a seating area will almost always beat one large one in a corner.",
          "It also means shelter beats output. A screen, a hedge or a wall on the windward side will do more for comfort than doubling the rating, and it costs less to run. If you can only do one thing, block the wind.",
        ],
      }}
      faqs={[
        {
          question: "How many BTU is 1kW?",
          answer:
            "3,412 BTU per hour. So a 50,000 BTU gas fire pit is about 14.7kW, and a 2.1kW electric patio heater is about 7,165 BTU. Gas appliances are usually advertised in BTU and electric ones in kW, which makes them look less comparable than they are.",
        },
        {
          question: "What size patio heater do I need?",
          answer:
            "Roughly 1kW for every 2.5 square metres of seating area in a sheltered spot, and up to twice that somewhere exposed. A typical patio seating area of ten square metres wants around 4kW sheltered, or closer to 7kW if the wind gets at it.",
        },
        {
          question: "Is a gas or electric patio heater better?",
          answer:
            "Gas gives more heat for the money and does not need a socket, which suits an open garden. Electric is silent, has no cylinder to change, is cheaper to buy, and can be used under a covered area or in a gazebo where gas should not be. If the spot has power and a roof, electric is usually the better answer.",
        },
        {
          question: "Do patio heaters actually work in wind?",
          answer:
            "Not well. They heat what they shine on rather than heating the air, and wind carries away both the warmed air and much of the effect. No rating solves an exposed corner. Blocking the wind with a screen or planting does more than a bigger appliance, and does it for free once installed.",
        },
        {
          question: "Can a gas fire pit be used under a gazebo or pergola?",
          answer:
            "Only where the manufacturer explicitly says so, and most say not. Gas appliances need clear air above them and a stated overhead clearance, and a canopy traps combustion products. Check the individual product's own instructions rather than assuming, and if it is not stated, treat that as a no.",
        },
      ]}
      products={products}
      productsHeading="Fire pits and patio heaters in stock"
    >
      <PatioHeatCalculator />
    </ToolPage>
  );
}
