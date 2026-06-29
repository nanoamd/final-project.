import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { siteConfig } from "@/config/site";

export function Hero() {
  return (
    <section className="border-line relative overflow-hidden border-b">
      <Container className="grid items-center gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <div className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-8 duration-700 lg:col-span-6">
          <Eyebrow>{siteConfig.tagline}</Eyebrow>
          <h1 className="font-display text-[2.75rem] leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
            Saunas and cold therapy, chosen with intent.
          </h1>
          <p className="text-muted max-w-xl text-lg leading-relaxed text-pretty">
            From outdoor saunas to cold plunge and recovery — considered
            products, honest guidance, and the expertise to choose well for a
            space you&rsquo;ll enjoy for years.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <AppLink
              href="/shop/outdoor-saunas"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Explore the collection
            </AppLink>
            <AppLink
              href="/guided-buying"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Try guided buying
            </AppLink>
          </div>
          <div className="text-muted mt-2 flex items-center gap-3 text-[13px] tracking-wide">
            <span>Outdoor Saunas</span>
            <span aria-hidden>·</span>
            <span>Cold Plunge</span>
            <span aria-hidden>·</span>
            <span>Recovery</span>
          </div>
        </div>

        <div className="animate-in fade-in duration-1000 lg:col-span-6">
          <PlaceholderImage
            tone="charcoal"
            illustration="sauna"
            aspect="aspect-[4/5] lg:aspect-[5/6]"
            motifClassName="max-w-[68%]"
          />
        </div>
      </Container>
    </section>
  );
}
