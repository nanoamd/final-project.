const CATEGORIES = [
  "Outdoor Living",
  "Furniture",
  "Lighting",
  "Dining",
  "Office",
  "Storage",
  "Decor",
  "Wellness",
  "Architecture",
];

/**
 * Home Improvement Categories — states the wider vision without ever saying
 * "coming soon." A clean typographic grid, deliberately photo-free so it
 * doesn't imply rooms we don't yet sell into.
 */
export function HomeCategories() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto mb-10 max-w-xl text-center sm:mb-14">
          <p className="text-muted mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            Where We&rsquo;re Going
          </p>
          <h2 className="text-ink font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl">
            A home improved, one room at a time
          </h2>
          <p className="text-muted mt-4 text-[15px] leading-relaxed sm:text-base">
            We started outdoors because it&rsquo;s where we know the most. It
            won&rsquo;t be where we stop.
          </p>
        </div>

        <div className="border-line grid grid-cols-3 border-t border-l lg:grid-cols-5">
          {CATEGORIES.map((category) => (
            <div
              key={category}
              className="border-line flex min-h-[64px] items-center justify-center border-r border-b px-2 py-4 text-center sm:min-h-[112px] sm:px-4 sm:py-6"
            >
              <span className="text-ink font-display text-[13px] tracking-tight sm:text-lg">
                {category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
