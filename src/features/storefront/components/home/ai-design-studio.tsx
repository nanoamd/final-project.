import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";

const STEPS = [
  {
    n: "1",
    kicker: "Upload",
    title: "A photo of your own space",
    image:
      "/images/92f31eb81be4d873ea3b15253c95eb02c58b533bb7bdd276e3a8f4905ab13a0b.jpeg",
  },
  {
    n: "2",
    kicker: "Choose",
    title: "A direction — sauna, hot tub, decking",
    image:
      "/images/7588bce6a676f339fa54e4f9b3a5c081331c8e32ebdd7f428682ff0e5dd4a465.jpeg",
  },
  {
    n: "3",
    kicker: "See It",
    title: "Your space, redesigned in seconds",
    image:
      "/images/49031908f80dbbb69df00cb698ea23d483fe0a254fc4b8ca539dda682aed2d09.jpeg",
  },
];

/**
 * AI Design Studio — promotes the real /tools/garden-visualiser feature as
 * considered technology in service of a decision, not a novelty toy.
 */
export function AiDesignStudio() {
  return (
    <section className="bg-basalt border-b border-white/10">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-brass mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
              The Design Studio
            </p>
            <h2 className="text-canvas font-display text-2xl leading-[1.05] tracking-tight text-balance sm:text-4xl">
              See it in your space before you commit
            </h2>
            <p className="text-canvas/70 mt-5 max-w-sm text-[15px] leading-relaxed">
              A considered purchase deserves more than a product photo. Upload a
              photo of your own space and see it redesigned — genuinely, not
              gimmick.
            </p>
            <AppLink
              href="/tools/garden-visualiser"
              className={buttonVariants({
                variant: "accent",
                size: "md",
                className: "mt-7",
              })}
            >
              Try the Design Studio
              <span aria-hidden className="ml-1">
                →
              </span>
            </AppLink>
          </div>

          <ol className="flex flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:gap-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="bg-basalt-raise flex items-center gap-3 rounded-lg border border-white/8 p-3 sm:flex-col sm:items-stretch sm:p-4"
              >
                <div className="relative aspect-square size-14 shrink-0 overflow-hidden rounded-md sm:order-2 sm:mt-auto sm:aspect-[4/3] sm:size-auto sm:w-full">
                  <Image
                    src={step.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 56px, 22vw"
                    className="object-cover"
                  />
                </div>
                <div className="sm:order-1">
                  <p className="mb-1 flex items-center gap-2 sm:mb-3">
                    <span className="bg-brass text-basalt-deep flex size-5 items-center justify-center rounded-full text-[11px] font-semibold">
                      {step.n}
                    </span>
                    <span className="text-canvas/60 text-[11px] font-medium tracking-[0.14em] uppercase">
                      {step.kicker}
                    </span>
                  </p>
                  <p className="text-canvas text-[13px] font-medium sm:mb-4 sm:text-[14px]">
                    {step.title}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
