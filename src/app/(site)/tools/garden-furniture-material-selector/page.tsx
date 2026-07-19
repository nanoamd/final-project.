import type { Metadata } from "next";

import { FurnitureMaterialSelector } from "@/components/shared/furniture-material-selector";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = {
  title: "Garden Furniture Material & Weather Resilience Selector",
  description:
    "Answer three questions about where your furniture will live and how much upkeep you want, and we'll match you to the right material.",
};

export default function GardenFurnitureMaterialSelectorPage() {
  return (
    <Container width="narrow" className="py-20 md:py-28">
      <Eyebrow>Tools</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Garden furniture material selector
      </h1>
      <p className="text-muted mt-6 max-w-md text-[15px] leading-relaxed">
        Every outdoor material trades off differently between weather
        resistance, maintenance and cost. Answer three questions and we&rsquo;ll
        match you to the ones worth considering.
      </p>

      <div className="mt-12">
        <FurnitureMaterialSelector />
      </div>
    </Container>
  );
}
