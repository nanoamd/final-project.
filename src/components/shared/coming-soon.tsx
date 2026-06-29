import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";

/** Honest placeholder for routes that are designed but not yet built out. */
export function ComingSoon({
  eyebrow = "In development",
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
}) {
  return (
    <Container className="py-24 md:py-36">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="flex max-w-xl flex-col gap-6">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted text-lg leading-relaxed text-pretty">
            {intro}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <AppLink
              href="/shop/outdoor-saunas"
              className={buttonVariants({ variant: "primary" })}
            >
              Explore the saunas
            </AppLink>
            <AppLink
              href="/guided-buying"
              className={buttonVariants({ variant: "secondary" })}
            >
              Guided buying
            </AppLink>
          </div>
        </div>
        <PlaceholderImage
          tone="sand"
          illustration="leaf"
          aspect="aspect-[4/3]"
        />
      </div>
    </Container>
  );
}
