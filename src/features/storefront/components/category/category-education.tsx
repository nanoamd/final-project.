import { SectionHeading } from "@/components/shared/section-heading";
import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

export function CategoryEducation() {
  return (
    <Section className="border-line border-t">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <SectionHeading
            eyebrow="Choosing well"
            title="A sauna is a ten-year decision"
            intro="Size, heat source, timber, base and planning all shape how often a sauna actually gets used. The cheapest cabin is rarely the best value."
          />
          <div className="text-muted flex flex-col gap-5 text-base leading-relaxed">
            <p>
              Capacity should match how you intend to use it — a quiet
              two-person retreat and a six-person social sauna are different
              products, not the same product in different sizes.
            </p>
            <p>
              Heater output must be matched to cabin volume, adjusted for glass
              area and insulation. Get this wrong and a beautiful cabin never
              quite performs.
            </p>
            <p>
              <AppLink
                href="/learn"
                className="text-ink decoration-line hover:decoration-ink underline underline-offset-4"
              >
                Read the full sauna buying guide
              </AppLink>{" "}
              before you commit.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <div className="border-line flex flex-col items-start gap-4 border p-8">
            <h3 className="font-display text-ink text-2xl tracking-tight">
              Compare saunas side by side
            </h3>
            <p className="text-muted max-w-sm text-sm leading-relaxed">
              See specifications, capacity and heat source on a single screen —
              an honest, like-for-like comparison.
            </p>
            <AppLink
              href="/compare"
              className={cn(buttonVariants({ variant: "secondary" }), "mt-2")}
            >
              Open comparison
            </AppLink>
          </div>
          <div className="bg-charcoal text-canvas flex flex-col items-start gap-4 p-8">
            <h3 className="font-display text-2xl tracking-tight">
              Let us recommend a setup
            </h3>
            <p className="text-canvas/70 max-w-sm text-sm leading-relaxed">
              Answer a few questions and we&rsquo;ll propose a complete,
              correctly-specified setup — and explain why.
            </p>
            <AppLink
              href="/guided-buying"
              className={cn(
                buttonVariants({}),
                "bg-canvas text-ink hover:bg-sand mt-2",
              )}
            >
              Begin guided buying
            </AppLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
