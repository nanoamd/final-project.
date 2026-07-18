import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";

/**
 * Featured Collection — a single immersive collection, told through
 * craftsmanship and material rather than specifications. Full-bleed dark
 * treatment for contrast against the light Featured Transformation above it.
 */
export function FeaturedCollection() {
  return (
    <section className="bg-basalt relative isolate overflow-hidden">
      <div className="relative min-h-[520px] sm:min-h-[560px] lg:min-h-[42rem]">
        <Image
          src="/images/sauna-collection-hero.png"
          alt="Cedar sauna and hot tub at dusk"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="from-basalt via-basalt/70 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(11,11,12,0.92) 0%, rgba(11,11,12,0.75) 30%, rgba(11,11,12,0.25) 55%, transparent 72%)",
          }}
        />

        <div className="absolute inset-0 mx-auto flex max-w-[1440px] items-end px-6 pb-14 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
          <div className="max-w-lg">
            <p className="text-brass mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
              The Sauna Collection
            </p>
            <h2 className="text-canvas font-display text-2xl leading-[1.05] tracking-tight text-balance sm:text-4xl lg:text-[3.25rem]">
              Cedar, steam and the quiet that follows
            </h2>
            <p className="text-canvas/70 mt-5 max-w-md text-[15px] leading-relaxed">
              Solid cedar, hand-finished joinery, and heaters engineered to last
              decades rather than seasons. Nothing here is disposable — every
              piece is chosen to be lived with, not replaced.
            </p>
            <AppLink
              href="/shop/outdoor-saunas"
              className="text-canvas mt-8 inline-flex items-center gap-2 border-b border-white/30 pb-1 text-[12px] font-medium tracking-[0.16em] uppercase"
            >
              Explore the Collection <span aria-hidden>→</span>
            </AppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
