import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

export function GuidedBuyingCta() {
  return (
    <section className="bg-moss text-canvas">
      <Container className="flex flex-col items-center gap-7 py-24 text-center md:py-32">
        <Eyebrow className="text-canvas/55">Guided buying</Eyebrow>
        <h2 className="font-display max-w-3xl text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          Not sure where to start? Let&rsquo;s find the right setup together.
        </h2>
        <p className="text-canvas/75 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
          Answer a few questions about your space, your goals and your budget.
          We&rsquo;ll recommend a complete setup — and explain exactly why it
          fits.
        </p>
        <AppLink
          href="/guided-buying"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-canvas text-ink hover:bg-sand mt-2",
          )}
        >
          Begin guided buying
        </AppLink>
      </Container>
    </section>
  );
}
