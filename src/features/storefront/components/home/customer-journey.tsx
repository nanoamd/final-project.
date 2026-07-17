const STEPS = [
  { n: "01", label: "Discover" },
  { n: "02", label: "Plan" },
  { n: "03", label: "Choose" },
  { n: "04", label: "Purchase" },
  { n: "05", label: "Deliver" },
  { n: "06", label: "Enjoy" },
];

/**
 * Customer Journey — a minimal timeline. Horizontal on desktop, a compact
 * vertical rail on mobile so it never eats a full screen of scroll.
 */
export function CustomerJourney() {
  return (
    <section className="bg-basalt">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <p className="text-brass mb-8 text-center text-[11px] font-medium tracking-[0.24em] uppercase sm:mb-12">
          How It Works
        </p>

        <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:hidden">
          {STEPS.map((step) => (
            <div key={step.n} className="text-center">
              <p className="text-brass font-display text-xl">{step.n}</p>
              <p className="text-canvas mt-1 text-[12px] font-medium tracking-[0.08em] uppercase">
                {step.label}
              </p>
            </div>
          ))}
        </div>

        <div className="hidden items-start justify-between sm:flex">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="relative flex flex-1 flex-col items-center"
            >
              {i > 0 ? (
                <span
                  aria-hidden
                  className="absolute top-3 right-1/2 h-px w-full bg-white/15"
                />
              ) : null}
              <span className="border-brass text-brass bg-basalt relative z-10 flex size-7 items-center justify-center rounded-full border text-[11px] font-medium">
                {i + 1}
              </span>
              <p className="text-canvas mt-3 text-[12px] font-medium tracking-[0.1em] uppercase">
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
