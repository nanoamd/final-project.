import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SaunaSizeCalculator } from "@/features/sauna-calculator";
import { getProductsByDepartment } from "@/lib/sanity/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Sauna Size & Capacity Calculator",
  description:
    "Find the right sauna size for how many people will actually use it, matched against real in-stock saunas.",
};

export default async function SaunaSizeCalculatorPage() {
  const products = await getProductsByDepartment("sauna");

  return (
    <Container width="narrow" className="py-20 md:py-28">
      <Eyebrow>Tools</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Sauna size &amp; capacity calculator
      </h1>
      <p className="text-muted mt-6 max-w-md text-[15px] leading-relaxed">
        Tell us how many people will typically use it, and we&rsquo;ll match you
        against our real in-stock saunas — no guessing at floor plans.
      </p>

      <div className="mt-12">
        <SaunaSizeCalculator products={products} />
      </div>
    </Container>
  );
}
