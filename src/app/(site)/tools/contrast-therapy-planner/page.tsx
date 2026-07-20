import type { Metadata } from "next";

import { ContrastTherapyBuilder } from "@/components/shared/contrast-therapy-builder";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = {
  title: "Contrast Therapy Protocol Builder",
  description:
    "Answer three questions about your goal, experience and time available, and get a real, personalised hot/cold contrast therapy session plan.",
};

export default function ContrastTherapyPlannerPage() {
  return (
    <Container width="narrow" className="py-20 md:py-28">
      <Eyebrow>Tools</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Contrast therapy protocol builder
      </h1>
      <p className="text-muted mt-6 max-w-md text-[15px] leading-relaxed">
        Sauna and cold plunge, done right, is a real skill — how long, how hot,
        how cold, in what order, all depend on what you&rsquo;re trying to get
        out of it. Answer three questions and we&rsquo;ll build you a real
        session plan.
      </p>

      <div className="mt-12">
        <ContrastTherapyBuilder />
      </div>
    </Container>
  );
}
