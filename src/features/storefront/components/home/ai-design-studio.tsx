import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";

const STEPS = [
  {
    n: "01",
    title: "Upload a photo of your space",
    body: "Start with what you have — a garden, a room, a bare patio.",
  },
  {
    n: "02",
    title: "Choose products you love",
    body: "Browse the collection and drop pieces into your space.",
  },
  {
    n: "03",
    title: "Transform your space",
    body: "See it come together before you spend a pound.",
  },
];

export function AiDesignStudio() {
  return (
    <section className="bg-basalt border-b border-white/10">
      <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:pt-4">
            <p className="text-brass mb-4 text-[13px] font-medium tracking-[0.24em] uppercase">
              AI Design Studio
            </p>
            <h2 className="font-display text-canvas text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
              See it. Design it.{" "}
              <span className="text-brass italic">Love it.</span>
            </h2>
            <p className="text-canvas/70 mt-6 max-w-sm text-lg leading-relaxed">
              Visualise your space with our design tools and bring your vision
              to life.
            </p>
            <AppLink
              href="/guided-buying"
              className={buttonVariants({
                variant: "accent",
                size: "lg",
                className: "mt-8",
              })}
            >
              Try AI Design{" "}
              <span aria-hidden className="ml-1">
                ✦
              </span>
            </AppLink>
          </div>

          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="bg-basalt-raise flex flex-col rounded-xl border border-white/10 p-6"
              >
                <span className="text-brass font-display mb-3 text-lg">
                  {step.n}
                </span>
                <p className="text-canvas font-medium">{step.title}</p>
                <p className="text-canvas/55 mt-2 text-sm leading-relaxed">
                  {step.body}
                </p>
                <div className="from-basalt-deep mt-5 aspect-4/3 w-full rounded-lg bg-gradient-to-br to-black/60 ring-1 ring-white/5" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
