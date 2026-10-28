import { AppLink } from "@/components/ui/app-link";
import { getDepartments } from "@/lib/sanity/queries";

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
export async function HomeCategories() {
  /**
   * Which of these names is a department that actually exists.
   *
   * All nine were plain `<span>`s, so the home page — the strongest internal
   * link source on the site — passed no link to any department from this
   * band at all.
   *
   * But they are not all shoppable: the section exists to state the wider
   * vision "without ever saying coming soon", and Architecture, Office and
   * Storage are ambition rather than stock. Linking those would send a
   * visitor to a 404 or an empty page, which is worse than not linking.
   *
   * So the match is made against Sanity rather than hardcoded: a name that
   * resolves to a real department becomes a link, and the rest stay as text.
   * As Damien adds a department, its tile starts linking on the next build
   * with no edit here.
   */
  const departments = await getDepartments();
  const bySlug = new Map(
    departments.map((department) => [
      department.name.trim().toLowerCase(),
      department.slug,
    ]),
  );

  return (
    <section className="bg-basalt">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto mb-6 max-w-xl text-center sm:mb-14">
          <p className="text-canvas/50 mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            Where We&rsquo;re Going
          </p>
          <h2 className="text-canvas font-display text-2xl leading-[1.05] tracking-tight sm:text-4xl">
            A home improved, one room at a time
          </h2>
          <p className="text-canvas/60 mt-4 text-[15px] leading-relaxed sm:text-base">
            We started outdoors because it&rsquo;s where we know the most. It
            won&rsquo;t be where we stop.
          </p>
        </div>

        <div className="grid grid-cols-3 border-t border-l border-white/10 lg:grid-cols-5">
          {CATEGORIES.map((category) => {
            const slug = bySlug.get(category.trim().toLowerCase());
            const cell =
              "flex min-h-[64px] items-center justify-center border-r border-b border-white/10 px-2 py-4 text-center sm:min-h-[112px] sm:px-4 sm:py-6";
            const label =
              "text-canvas font-display text-[13px] tracking-tight sm:text-lg";
            return slug ? (
              <AppLink
                key={category}
                href={`/shop/room/${slug}`}
                className={`${cell} transition-colors hover:bg-white/5`}
              >
                <span className={label}>{category}</span>
              </AppLink>
            ) : (
              <div key={category} className={cell}>
                <span className={label}>{category}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
