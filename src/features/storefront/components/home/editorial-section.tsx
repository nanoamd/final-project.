import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { cn } from "@/lib/utils";

export function EditorialSection() {
  return (
    <section className="bg-charcoal text-canvas">
      <Container className="grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-20">
        <PlaceholderImage
          tone="sand"
          illustration="plunge"
          aspect="aspect-[4/3] lg:aspect-[5/4]"
        />
        <div className="flex flex-col gap-6">
          <Eyebrow className="text-canvas/50">The ritual</Eyebrow>
          <h2 className="font-display text-3xl leading-[1.08] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
            Heat, then cold. The contrast that resets you.
          </h2>
          <p className="text-canvas/70 max-w-md text-base leading-relaxed sm:text-lg">
            The sauna opens; the plunge closes. Done well, the two together are
            more than the sum of their parts — a deliberate practice of recovery
            and resilience, built into the garden you already have.
          </p>
          <div>
            <AppLink
              href="/learn"
              className={cn(buttonVariants({ variant: "onDark" }), "mt-2")}
            >
              Read the journal
            </AppLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
