import { AppLink } from "@/components/ui/app-link";

const GUIDES = [
  { title: "The Pergola Guide", topic: "Structures" },
  { title: "Choosing the Right Fire Pit", topic: "Fire & Heating" },
  { title: "An Outdoor Furniture Primer", topic: "Furniture" },
  { title: "Outdoor Kitchens, Planned Properly", topic: "Kitchens" },
  { title: "Principles of Garden Lighting", topic: "Lighting" },
  { title: "A Short Guide to Materials", topic: "Materials" },
];

/**
 * Buying Guides — a dense, text-led index of the considered writing behind
 * the catalog. Deliberately no photography here, for rhythm against the
 * image-heavy sections either side of it.
 */
export function BuyingGuides() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-14">
          <div>
            <p className="text-muted mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
              Buying Guides
            </p>
            <h2 className="text-ink font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl">
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
          {GUIDES.map((guide) => (
            <AppLink
              key={guide.title}
              href="/learn"
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
