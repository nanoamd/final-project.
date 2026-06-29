import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

const pillars = [
  {
    n: "01",
    title: "Honest comparison",
    body: "We compare products on their merits — never by who pays the most.",
  },
  {
    n: "02",
    title: "Guided by expertise",
    body: "Buying tools that behave like a knowledgeable consultant, not a filter.",
  },
  {
    n: "03",
    title: "Transparent reasoning",
    body: "Every recommendation explains why it was chosen for you.",
  },
  {
    n: "04",
    title: "Built for the long term",
    body: "Considered products, chosen for a decade of use and supported beyond it.",
  },
];

export function ValueProposition() {
  return (
    <Section spacing="compact" className="border-line border-b">
      <Container>
        <div className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
          {pillars.map((pillar) => (
            <div
              key={pillar.n}
              className="lg:border-line flex flex-col gap-3 lg:px-8 lg:[&:first-child]:pl-0 lg:[&:not(:first-child)]:border-l"
            >
              <span className="font-display text-muted text-sm">
                {pillar.n}
              </span>
              <h3 className="text-ink text-lg font-medium">{pillar.title}</h3>
              <p className="text-muted text-sm leading-relaxed">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
