import { SectionHeading } from "@/components/shared/section-heading";
import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { Section } from "@/components/ui/section";
import type { IllustrationKind, SurfaceTone } from "@/types/catalog";

type Guide = {
  topic: string;
  title: string;
  tone: SurfaceTone;
  illustration: IllustrationKind;
};

const guides: Guide[] = [
  {
    topic: "Specification",
    title: "How to size a sauna heater correctly",
    tone: "charcoal",
    illustration: "heater",
  },
  {
    topic: "Planning",
    title: "Planning permission for garden saunas",
    tone: "sand",
    illustration: "sauna",
  },
  {
    topic: "Getting started",
    title: "Sauna or cold plunge: where to begin",
    tone: "stone",
    illustration: "plunge",
  },
];

export function BuyingGuides() {
  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            className="max-w-2xl"
            eyebrow="Learn"
            title="Buy with confidence"
            intro="Practical, jargon-free guides to the decisions that matter most before a considered purchase."
          />
          <AppLink
            href="/learn"
            className={buttonVariants({ variant: "quiet" })}
          >
            All buying guides
          </AppLink>
        </div>
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <AppLink key={guide.title} href="/learn" className="group block">
              <div className="overflow-hidden">
                <PlaceholderImage
                  tone={guide.tone}
                  illustration={guide.illustration}
                  aspect="aspect-[4/3]"
                  className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <p className="text-muted mt-5 text-[12px] tracking-[0.18em] uppercase">
                {guide.topic}
              </p>
              <h3 className="text-ink decoration-line mt-2 text-lg leading-snug font-medium underline-offset-4 group-hover:underline">
                {guide.title}
              </h3>
            </AppLink>
          ))}
        </div>
      </Container>
    </Section>
  );
}
