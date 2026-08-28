import type { Metadata } from "next";

import { FurnitureMaterialSelector } from "@/components/shared/furniture-material-selector";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Best Garden Furniture Material for the UK Climate",
  description:
    "Teak, aluminium, rattan or steel — which outdoor furniture material survives a British winter, which needs oiling, and which can stay out uncovered. Answer three questions.",
  path: "/tools/garden-furniture-material-selector",
});

export default async function GardenFurnitureMaterialSelectorPage() {
  const products = await getProductsByCategory("garden-furniture", {
    limit: 8,
  });

  return (
    <ToolPage
      path="/tools/garden-furniture-material-selector"
      heading="Which garden furniture material is right for a British garden?"
      intro="Every outdoor material trades off differently between weather resistance, upkeep and cost. Answer three questions about where it will live and how much maintenance you actually want to do."
      method={{
        heading: "What the materials actually do outdoors",
        paragraphs: [
          "Teak and other dense hardwoods contain enough natural oil to survive year-round outside without treatment. Left alone they silver to a soft grey, which is a surface change rather than decay. Oiling keeps the honey colour but commits you to doing it every year, and stopping halfway leaves a patchy finish that is harder to correct than either extreme.",
          "Powder-coated aluminium is the low-maintenance answer. It does not rust, it is light enough to move for mowing, and it needs washing rather than treating. The trade is that light furniture moves in a gale, so on an exposed site it wants either weight or somewhere to be stored.",
          "Steel is heavier and stays put, but the powder coat is the only thing between the frame and the weather. A chip that reaches bare metal will rust from that point outwards, so it is worth touching up rather than ignoring. Synthetic rattan over an aluminium frame handles rain well; over a steel frame it depends entirely on the coating underneath.",
          "The question that decides most of it is not which material is best but whether the furniture will be covered or stored in winter. If it will be, almost anything works and you can buy on looks. If it will not, the honest shortlist is teak, aluminium, or synthetic rattan on an aluminium frame.",
        ],
      }}
      faqs={[
        {
          question:
            "What garden furniture can be left outside all year in the UK?",
          answer:
            "Teak and other dense hardwoods, powder-coated aluminium, and synthetic rattan on an aluminium frame all cope with a British winter uncovered. Cushions do not — bring those in or store them in a box regardless of what the frame is made of, because it is the fabric and the foam that suffer, not the furniture.",
        },
        {
          question: "Does teak garden furniture need oiling?",
          answer:
            "No. Teak contains enough natural oil to protect itself, and untreated teak weathers to a silver-grey without losing strength. Oiling is a choice about colour, not protection. If you start, you are committing to doing it annually, because a half-maintained oiled finish looks worse than either a fully oiled or a fully weathered one.",
        },
        {
          question: "Is aluminium or steel better for garden furniture?",
          answer:
            "Aluminium does not rust and is light enough to move easily, which makes it the lower-maintenance choice. Steel is heavier, so it stays where you put it on an exposed site, but any chip in the powder coating will rust. Choose aluminium for ease and steel for stability in wind.",
        },
        {
          question: "Do I need to cover garden furniture in winter?",
          answer:
            "Not if the frame is one of the weatherproof materials, and a cover that traps moisture against the furniture can do more harm than leaving it uncovered. What genuinely needs protecting is the soft furnishing — cushions, seat pads and parasols — and anything with a fabric sling seat, which will hold water and degrade in frost.",
        },
      ]}
      products={products}
      productsHeading="Garden furniture in stock"
    >
      <FurnitureMaterialSelector />
    </ToolPage>
  );
}
