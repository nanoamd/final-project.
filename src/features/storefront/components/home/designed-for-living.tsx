import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import type { LivingCard } from "@/types/sanity-content";

const DEFAULT_CARDS: LivingCard[] = [
  { title: "Sustainable Choices", copy: "Thoughtfully sourced, responsibly made.", image: "/images/cedar.jpg" },
  { title: "Built to Last", copy: "Premium materials that stand the test of time.", image: "/images/hero-fire.jpg" },
  { title: "Trusted by Thousands", copy: "Rated excellent by our customers.", image: "/images/steam-lake.jpg" },
];

/**
 * Designed for how you live — the closing editorial band. A statement on the
 * left, three atmospheric proof tiles on the right.
 */
export function DesignedForLiving({
  headline,
  cards,
}: {
  headline?: string;
  cards?: LivingCard[];
}) {
  const list = cards?.length ? cards : DEFAULT_CARDS;
  const headlineLines = (headline ?? "Timeless pieces.\nBeautiful spaces.").split("\n");

  return (
    <section className="bg-basalt border-b border-white/10">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-brass mb-4 text-[12px] font-medium tracking-[0.24em] uppercase">
              Designed for how you live
            </p>
            <h2 className="text-canvas font-display text-4xl leading-[1.03] tracking-tight sm:text-[2.85rem]">
              {headlineLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < headlineLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h2>
            <p className="text-canvas/60 mt-5 text-[15px] leading-relaxed">
              Built to last a lifetime.
            </p>
            <AppLink
              href="/about"
              className="text-brass mt-7 flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] uppercase"
            >
              Discover More <span aria-hidden>→</span>
            </AppLink>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {list.map((card) => (
              <div
                key={card.title}
                className="border-white/8 relative aspect-[4/5] overflow-hidden rounded-xl border"
              >
                {card.image ? (
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 28vw"
                    className="object-cover"
                  />
                ) : null}
                <div className="from-basalt/95 via-basalt/30 absolute inset-0 bg-gradient-to-t to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-canvas text-[11px] font-semibold tracking-[0.14em] uppercase">
                    {card.title}
                  </p>
                  <p className="text-canvas/65 mt-1.5 text-[13px] leading-snug">
                    {card.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
