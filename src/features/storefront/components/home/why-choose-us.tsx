import { SectionHeading } from "@/components/shared/section-heading";
import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

const reasons = [
  {
    title: "Independent by design",
    body: "Our comparisons and recommendations are never for sale. The best product for you wins.",
  },
  {
    title: "Specialist support",
    body: "Speak to people who genuinely understand saunas, heaters and cold therapy.",
  },
  {
    title: "Correct specification",
    body: "We size heaters and chillers properly, so your setup performs as it should — for years.",
  },
  {
    title: "A platform that improves",
    body: "Our guidance grows sharper as our understanding of the category deepens.",
  },
];

export function WhyChooseUs() {
  return (
    <Section className="border-line border-b">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <SectionHeading
          eyebrow="Our approach"
          title="Buy the commodity. Build the expertise."
          intro="We&rsquo;re building a knowledge-first retailer for garden wellness — one where the advice is as considered as the products, and both get better every year."
          action={
            <AppLink
              href="/about"
              className={buttonVariants({ variant: "quiet" })}
            >
              More about our approach
            </AppLink>
          }
        />
        <ul className="flex flex-col">
          {reasons.map((reason) => (
            <li
              key={reason.title}
              className="border-line flex flex-col gap-2 border-t py-6 first:border-t-0 first:pt-0 lg:py-7"
            >
              <h3 className="text-ink text-lg font-medium">{reason.title}</h3>
              <p className="text-muted max-w-md text-sm leading-relaxed">
                {reason.body}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
