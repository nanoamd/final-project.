import { AppLink } from "@/components/ui/app-link";
import { getBuyingGuides } from "@/lib/sanity/queries";

/**
 * The guides shown when Sanity has none to show.
 *
 * These six used to be the whole component: invented titles, every one
 * pointing at `/learn` rather than at a guide. So the home page — the
 * strongest internal link source on the site — passed no link to any
 * individual guide, and advertised six that do not exist.
 *
 * Kept only as the no-content fallback, with the index href they always had,
 * because an empty band on the home page is worse than a signpost.
 */
const FALLBACK_GUIDES = [
  { title: "The Pergola Guide", topic: "Structures", href: "/learn" },
  {
    title: "Choosing the Right Fire Pit",
    topic: "Fire & Heating",
    href: "/learn",
  },
  { title: "An Outdoor Furniture Primer", topic: "Furniture", href: "/learn" },
  {
    title: "Outdoor Kitchens, Planned Properly",
    topic: "Kitchens",
    href: "/learn",
  },
  { title: "Principles of Garden Lighting", topic: "Lighting", href: "/learn" },
  { title: "A Short Guide to Materials", topic: "Materials", href: "/learn" },
];

/**
 * Buying Guides — a dense, text-led index of the considered writing behind
 * the catalog. Deliberately no photography here, for rhythm against the
 * image-heavy sections either side of it.
 */
export async function BuyingGuides() {
  const published = await getBuyingGuides({ limit: 6 });
  const guides = published.length
    ? published.map((guide) => ({
        title: guide.title,
        // The owning category reads better as an eyebrow than a date, and it
        // is the one piece of taxonomy a guide reliably carries.
        topic: guide.relatedCategory?.name ?? "Buying Guide",
        href: `/learn/${guide.slug}`,
      }))
    : FALLBACK_GUIDES;

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-6 sm:mb-14">
          <div>
            <p className="text-muted mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
              Buying Guides
            </p>
            <h2 className="text-ink font-display text-2xl leading-[1.05] tracking-tight sm:text-4xl">
              Learn before you buy
            </h2>
          </div>
          <AppLink
            href="/learn"
            className="text-ink hidden shrink-0 items-center gap-2 text-[12px] font-medium tracking-[0.16em] uppercase sm:flex"
          >
            All Guides <span aria-hidden>→</span>
          </AppLink>
        </div>

        <div className="border-line divide-line grid divide-y border-t sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:border-l">
          {guides.map((guide) => (
            <AppLink
              key={guide.title}
              href={guide.href}
              className="group flex items-center justify-between gap-4 px-1 py-5 sm:px-6"
            >
              <div>
                <p className="text-muted text-[11px] font-medium tracking-[0.12em] uppercase">
                  {guide.topic}
                </p>
                <p className="text-ink font-display mt-1 text-lg tracking-tight sm:text-xl">
                  {guide.title}
                </p>
              </div>
              <span
                aria-hidden
                className="text-ink shrink-0 transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}
