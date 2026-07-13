import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";

const COLLECTIONS = [
  {
    label: "Garden Lighting",
    price: "From £120",
    href: "/shop",
    image: "/images/cedar.jpg",
    badge: "Best Seller",
  },
  {
    label: "Fire & Warmth",
    price: "From £340",
    href: "/shop",
    image: "/images/hero-fire.jpg",
  },
  {
    label: "Cold Plunge",
    price: "From £2,400",
    href: "/shop/cold-plunge",
    image: "/images/dark-water.jpg",
  },
  {
    label: "Outdoor Wellness",
    price: "From £6,900",
    href: "/shop/outdoor-saunas",
    image: "/images/steam-lake.jpg",
  },
];

export function FeaturedCollections() {
  return (
    <section className="bg-basalt">
      <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-8 lg:px-12">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-brass mb-3 text-[13px] font-medium tracking-[0.24em] uppercase">
              Featured collections
            </p>
            <h2 className="font-display text-canvas text-4xl tracking-tight text-balance sm:text-5xl">
              Designed for life.
            </h2>
          </div>
          <AppLink
            href="/shop"
            className="text-brass hidden shrink-0 items-center gap-2 text-sm tracking-wide sm:flex"
          >
            View all collections <span aria-hidden>→</span>
          </AppLink>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {COLLECTIONS.map((c) => (
            <AppLink key={c.label} href={c.href} className="group block">
              <div className="relative aspect-4/5 overflow-hidden rounded-xl ring-1 ring-white/10">
                <Image
                  src={c.image}
                  alt={c.label}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="from-basalt/80 absolute inset-0 bg-gradient-to-t to-transparent" />
                {c.badge ? (
                  <span className="bg-brass text-basalt-deep absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.08em] uppercase">
                    {c.badge}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <p className="text-canvas text-sm font-medium">{c.label}</p>
                <p className="text-canvas/55 text-sm">{c.price}</p>
              </div>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}
