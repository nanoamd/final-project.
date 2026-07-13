import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";

const STEPS = [
  {
    n: "1",
    kicker: "Upload",
    title: "Upload a photo of your space",
    image: "/images/steam-lake.jpg",
  },
  {
    n: "2",
    kicker: "Choose",
    title: "Pick products you love",
    image: "/images/cedar.jpg",
  },
  {
    n: "3",
    kicker: "Transform",
    title: "See your space come to life",
    image: "/images/hero-fire.jpg",
  },
];

/**
 * Garden Studio — visualise your space before you buy. Outcome-led: it never
 * markets the technology, only what it lets you do. Warm, dark ground to set
 * it apart from the sections around it.
 */
export function AiDesignStudio() {
  return (
    <section className="border-b border-white/10 bg-[linear-gradient(160deg,#3a2213_0%,#1a120b_58%,#14100c_100%)]">
      <div className="mx-auto max-w-[1280px] px-6 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div>
            <p className="text-brass mb-3 text-[12px] font-medium tracking-[0.24em] uppercase">
              Garden Studio
            </p>
            <h2 className="font-display text-canvas text-3xl leading-[1.05] tracking-tight text-balance sm:text-4xl">
              See it. Design it. <span className="text-brass">Love it.</span>
            </h2>
            <p className="text-canvas/70 mt-4 max-w-sm leading-relaxed">
              Upload a photo of your garden and explore premium designs in it —
              see your future space before you buy.
            </p>
            <AppLink
              href="/guided-buying"
              className={buttonVariants({
                variant: "accent",
                size: "md",
                className: "mt-6",
              })}
            >
              Open Garden Studio
              <span aria-hidden className="ml-1">
                →
              </span>
            </AppLink>
          </div>

          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="bg-basalt/40 flex flex-col rounded-lg border border-white/10 p-4"
              >
                <p className="mb-3 flex items-center gap-2">
                  <span className="bg-brass text-basalt-deep flex size-5 items-center justify-center rounded-full text-[11px] font-semibold">
                    {step.n}
                  </span>
                  <span className="text-canvas/60 text-[11px] font-medium tracking-[0.16em] uppercase">
                    {step.kicker}
                  </span>
                </p>
                <p className="text-canvas mb-4 text-[15px] font-medium">
                  {step.title}
                </p>
                <div className="relative mt-auto aspect-4/3 w-full overflow-hidden rounded-md">
                  <Image
                    src={step.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 90vw, 22vw"
                    className="object-cover"
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="text-canvas/55 mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-white/10 pt-6 text-[12px] tracking-[0.14em] uppercase">
          <span className="text-brass">Visualise your space</span>
          <span aria-hidden className="text-white/20">
            ·
          </span>
          <span>Premium designs</span>
          <span aria-hidden className="text-white/20">
            ·
          </span>
          <span>See it before you buy</span>
        </div>
      </div>
    </section>
  );
}
