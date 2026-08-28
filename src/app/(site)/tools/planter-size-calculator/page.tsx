import type { Metadata } from "next";

import { PlanterSizeCalculator } from "@/components/shared/planter-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Planter Size & Compost Calculator — How Much Compost Do I Need?",
  description:
    "How much compost fills your planter, and what size pot a plant actually wants. Enter the planter's dimensions and get litres, plus drainage advice for indoors or out.",
  path: "/tools/planter-size-calculator",
});

export default async function PlanterSizeCalculatorPage() {
  const products = await getProductsByCategory("planters", { limit: 8 });

  return (
    <ToolPage
      path="/tools/planter-size-calculator"
      heading="How much compost does my planter need?"
      intro="Enter the planter's internal width and depth for the volume in litres, and the pot your plant came in to check you are not over-potting it."
      method={{
        heading: "The arithmetic, and the mistake it prevents",
        paragraphs: [
          "Volume is calculated as a cylinder — pi times the radius squared, times the depth — then reduced for two things. Three centimetres are taken off the depth so compost sits below the rim and watering does not wash it over the edge, and the result is multiplied by 0.8 because a planter tapers towards its base rather than being a true cylinder.",
          "The number surprises people. Planters are sold by their width, and volume goes up with the square of the radius, so a pot that looks twice as big holds four times as much. A 30cm planter takes about 15 litres; a 60cm one takes over a hundred. Buying one bag and finding it fills a third of the pot is the usual outcome.",
          "Pot size for the plant is a separate question with a real failure mode behind it. Move a plant into something far larger than its root ball and the compost around the roots stays wet, because there are no roots there to draw water out of it. Roots then rot. Step up by two to four centimetres for a small houseplant, five to ten for something larger, and do it again next year.",
          "Outdoors, drainage holes are not a detail. A sealed pot left out over a British winter fills with rain and the plant drowns. Standing the planter on feet or a couple of tiles keeps the holes from sealing themselves against the paving, which is the other half of the same problem.",
        ],
      }}
      faqs={[
        {
          question: "How much compost do I need for a 30cm pot?",
          answer:
            "About 15 litres for a planter 30cm across and 30cm deep. Most standard bags of multipurpose compost are 50 litres, so one bag fills roughly three pots that size.",
        },
        {
          question: "What size pot should I repot a plant into?",
          answer:
            "Two to four centimetres wider than its current pot for a small houseplant, and five to ten for anything larger. Going much bigger than that is the most common way to kill a healthy plant: the surplus compost holds water the roots cannot reach, and it stays wet long enough to rot them.",
        },
        {
          question: "Do outdoor planters need drainage holes?",
          answer:
            "Yes, without exception. A sealed planter left outside fills with rainwater over winter and the roots drown. If you have a planter you love that has no holes, treat it as a cover pot and keep the plant in a nursery pot inside it, so it can be lifted out and drained.",
        },
        {
          question: "How do I make a large planter lighter?",
          answer:
            "Fill the bottom third with something inert and light — broken polystyrene, upturned plastic pots, or crushed cans — before adding compost. It saves a surprising amount of compost, keeps the planter movable, and only matters for deep-rooted plants that genuinely need the full depth.",
        },
        {
          question: "Can I leave ceramic planters outside in winter?",
          answer:
            "Only if they are frost-proof, which is not the same as frost-resistant. Water gets into the clay, freezes, expands and cracks the pot from the inside. Check the individual product page for what it states, and if it does not say, treat it as an indoor pot or bring it in.",
        },
      ]}
      products={products}
      productsHeading="Planters in stock"
    >
      <PlanterSizeCalculator />
    </ToolPage>
  );
}
