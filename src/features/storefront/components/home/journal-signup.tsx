import { Newsletter } from "@/components/shared/newsletter";
import { SectionHeading } from "@/components/shared/section-heading";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function JournalSignup() {
  return (
    <Section className="border-line border-t">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="The journal"
            title="Considered writing on garden wellness"
            intro="Occasional notes on saunas, cold therapy and building a wellness garden that lasts. Useful, never noise."
          />
          <div className="lg:justify-self-end">
            <Newsletter tone="light" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
