import type { Metadata } from "next";

import { CapacityMatchCalculator } from "@/components/shared/capacity-match-calculator";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getProductsByDepartment } from "@/lib/sanity/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cold Plunge Size & Capacity Calculator",
  description:
    "Find the right cold plunge for how many people will actually use it, matched against real in-stock tubs.",
};

export default async function ColdPlungeSizeCalculatorPage() {
  const products = await getProductsByDepartment("cold-plunge");

  return (
    <Container width="narrow" className="py-20 md:py-28">
      <Eyebrow>Tools</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Cold plunge size &amp; capacity calculator
      </h1>
      <p className="text-muted mt-6 max-w-md text-[15px] leading-relaxed">
        Tell us how many people will typically use it, and we&rsquo;ll match you
        against our real in-stock cold plunges — including real water volume,
        not just capacity.
      </p>

      <div className="mt-12">
        <CapacityMatchCalculator
          products={products}
          noun="cold plunge"
          extraSpecLabel="Water volume"
          minPeople={1}
        />
      </div>
    </Container>
  );
}
