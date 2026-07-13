import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";

const COLLECTIONS = [
  {
    label: "Saunas",
    href: "/shop/outdoor-saunas",
    image: "/images/cedar.jpg",
    badge: "Best Seller",
  },
  { label: "Pergolas", href: "/shop", image: "/images/steam-lake.jpg" },
  { label: "Fire Pits", href: "/shop", image: "/images/hero-fire.jpg" },
  { label: "Furniture", href: "/shop", image: "/images/dark-water.jpg" },
];

export function FeaturedCollections() {
  return (
    <section className="bg-basalt border-b border-white/10">
      <div className="mx-auto max-w-[1280px] px-6 py-14 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-brass mb-2 text-[12px] font-medium tracking-[0.24em] uppercase">
              Featured collections
            </p>
            <h2 className="font-display text-canvas text-3xl tracking-tight text-balance sm:text-4xl">
              Designed for life.
            </h2>
            <p className="text-canvas/60 mt-3 max-w-md text-[15px] leading-relaxed">
              Timeless design, premium quality — pieces that elevate every space
              in your home.
            </p>
          </div>
          <AppLink
            href="/shop"
            className="text-brass hidden shrink-0 items-center gap-2 text-[13px] tracking-wide sm:flex"
          >
            View all <span aria-hidden>→</span>
          </AppLink>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {COLLECTIONS.map((c) => (
            <AppLink key={c.label} href={c.href} className="group block">
              <div className="relative aspect-4/5 overflow-hidden rounded-lg ring-1 ring-white/10">
                <Image
                  src={c.image}
                  alt={c.label}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="from-basalt/90 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
                {c.badge ? (
                  <span className="bg-brass text-basalt-deep absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
                    {c.badge}
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-canvas font-display text-lg">{c.label}</p>
                  <p className="text-brass mt-0.5 flex items-center gap-1.5 text-[12px] tracking-[0.06em] uppercase">
                    Shop now <span aria-hidden>→</span>
                  </p>
                </div>
              </div>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}
