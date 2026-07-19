/**
 * Why Kaiku Exists — a single centred editorial statement. Pure typography,
 * a deliberate pause in the page's visual rhythm.
 */
export function WhyKaiku() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-3xl px-6 py-10 text-center sm:px-8 sm:py-20 lg:py-28">
        <p className="text-muted mb-5 text-[11px] font-medium tracking-[0.24em] uppercase sm:mb-6">
          Why We Exist
        </p>
        <h2 className="text-ink font-display text-[1.7rem] leading-[1.25] tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Most home goods are sold on a lifestyle photo. We&rsquo;d rather show
          you the actual specification.
        </h2>
        <p className="text-muted mt-6 text-[15px] leading-relaxed sm:text-base">
          Every product on Kaiku comes with the real materials, dimensions and
          trade-offs behind it, not just the marketing — and our buying guides
          are researched and fact-checked, not generated and hoped for.
        </p>
      </div>
    </section>
  );
}
