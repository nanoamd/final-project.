const STANDARDS = [
  {
    title: "Craftsmanship",
    body: "Made by hands that understand the material, not just the machine.",
  },
  {
    title: "Longevity",
    body: "Built to outlast the trend cycle it launched into.",
  },
  {
    title: "Reliability",
    body: "Consistent from the first unit to the thousandth.",
  },
  {
    title: "Design",
    body: "Considered by people who design for living, not for photos.",
  },
  { title: "Support", body: "Still answering the phone long after the sale." },
  {
    title: "Quality",
    body: "Judged on what's underneath, not just what's on top.",
  },
];

/**
 * Supplier Standards — the six things every brand we carry has to earn.
 * Stated plainly, no invented claims.
 */
export function SupplierStandards() {
  return (
    <section className="bg-basalt border-y border-white/10">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto mb-6 max-w-xl text-center sm:mb-14">
          <p className="text-brass mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            Who We Work With
          </p>
          <h2 className="text-canvas font-display text-2xl leading-[1.05] tracking-tight sm:text-4xl">
            Every supplier earns their place
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3">
          {STANDARDS.map((standard) => (
            <div key={standard.title}>
              <p className="text-canvas font-display text-lg tracking-tight sm:text-xl">
                {standard.title}
              </p>
              <p className="text-canvas/60 mt-1.5 text-[13px] leading-relaxed sm:text-[14px]">
                {standard.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
