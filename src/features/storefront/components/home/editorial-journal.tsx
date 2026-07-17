import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";

const ARTICLES = [
  {
    title: "Designing Spaces You'll Love for Years",
    excerpt:
      "The difference between a garden that photographs well once and one that earns its place in daily life.",
    image: "/images/steam-lake.jpg",
    href: "/journal",
  },
  {
    title: "The Outdoor Kitchen Planning Guide",
    excerpt:
      "Layout, materials and the details that separate a real outdoor kitchen from a barbecue with ambitions.",
    image: "/images/dark-water.jpg",
    href: "/journal",
  },
  {
    title: "The Materials That Last Decades",
    excerpt:
      "Why what a piece is made from matters more than what it looks like on day one.",
    image: "/images/hero-fire.jpg",
    href: "/journal",
  },
];

/**
 * Editorial Journal — a taste of the writing, not a blog index. Three
 * articles, generously spaced, photography-led.
 */
export function EditorialJournal() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-14">
          <div>
            <p className="text-muted mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
              The Journal
            </p>
            <h2 className="text-ink font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl">
              Considered writing on living well outdoors
            </h2>
          </div>
          <AppLink
            href="/journal"
            className="text-ink hidden shrink-0 items-center gap-2 text-[12px] font-medium tracking-[0.16em] uppercase sm:flex"
          >
            Visit the Journal <span aria-hidden>→</span>
          </AppLink>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          {ARTICLES.map((article) => (
            <AppLink
              key={article.title}
              href={article.href}
              className="group block"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src={article.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="text-ink font-display mt-4 text-lg leading-snug tracking-tight sm:mt-5 sm:text-xl">
                {article.title}
              </h3>
              <p className="text-muted mt-2 text-[14px] leading-relaxed">
                {article.excerpt}
              </p>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}
