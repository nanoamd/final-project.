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
          Most of what&rsquo;s sold for the home is built to be replaced. We
          started Kaiku because we didn&rsquo;t want to buy that way, and
          suspected we weren&rsquo;t alone.
        </h2>
        <p className="text-muted mt-6 text-[15px] leading-relaxed sm:text-base">
          Every product carries a decision behind it — a supplier we trust, a
          material that ages well, a design we&rsquo;d still choose in ten
          years. That&rsquo;s the only test that matters to us.
        </p>
      </div>
    </section>
  );
}
