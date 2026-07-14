import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { getProduct } from "@/features/storefront/data/catalog";
import { formatPrice } from "@/lib/format";

/**
 * Home hero — an editorial split. A large serif statement and two calls to
 * action sit on the near-black ground to the left; a single cinematic garden
 * photograph fills the right, with a floating product card anchored into its
 * lower corner. Deliberately asymmetric — not a centred banner.
 */
export function Hero() {
  const featured = getProduct("auroom-horizon-sauna");

  return (
    <section className="bg-basalt relative isolate overflow-hidden">
      <div className="mx-auto grid max-w-[1440px] items-stretch lg:grid-cols-[0.92fr_1.08fr]">
        {/* Left — statement */}
        <div className="flex flex-col justify-center px-6 py-16 sm:px-8 lg:py-24 lg:pr-14 lg:pl-12">
          <p className="text-brass mb-7 flex items-center gap-3 text-[11px] font-medium tracking-[0.24em] uppercase">
            Outdoor Living, Reimagined
            <span aria-hidden className="bg-brass/50 h-px w-10" />
          </p>
          <h1 className="text-canvas font-display text-[3.4rem] leading-[0.94] tracking-[-0.02em] sm:text-[4.5rem] lg:text-[5.1rem]">
            Spaces
            <br />
            that slow
            <br />
            <span className="text-brass italic">life down</span>
          </h1>
          <p className="text-canvas/70 mt-8 max-w-sm text-[15px] leading-relaxed">
            Timeless design. Premium materials.
            <br />
            Beautiful spaces, built for life outdoors.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <AppLink
              href="/shop"
              className="bg-brass hover:bg-brass-deep flex h-12 items-center gap-2 rounded-md px-7 text-[12px] font-semibold tracking-[0.16em] text-white uppercase transition-colors"
            >
              Explore Collections
              <span aria-hidden>→</span>
            </AppLink>
            <AppLink
              href="/about"
              className="text-canvas/85 hover:text-canvas flex items-center gap-2 text-[12px] font-medium tracking-[0.16em] uppercase transition-colors"
            >
              Our Story <span aria-hidden>→</span>
            </AppLink>
          </div>
        </div>

        {/* Right — cinematic image with floating product card */}
        <div className="relative min-h-[440px] lg:min-h-[40rem]">
          <Image
            src="/images/garden-after.jpg"
            alt="A lit garden terrace at dusk"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
          <div className="from-basalt/70 pointer-events-none absolute inset-0 bg-gradient-to-r via-transparent to-transparent" />
          <div className="from-basalt/60 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />

          {featured ? (
            <AppLink
              href={`/shop/${featured.category}/${featured.slug}`}
              className="group border-white/12 bg-basalt/70 hover:border-brass/40 absolute right-5 bottom-5 flex items-center gap-4 rounded-xl border p-3 backdrop-blur-md transition-colors sm:right-8 sm:bottom-8"
            >
              <span className="relative block size-16 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={featured.image ?? "/images/steam-lake.jpg"}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </span>
              <span className="pr-3">
                <span className="text-canvas block text-[14px] font-medium">
                  {featured.name}
                </span>
                <span className="text-brass mt-0.5 block text-[13px]">
                  From {formatPrice(featured.priceFrom)}
                </span>
                <span className="text-canvas/60 group-hover:text-canvas mt-1.5 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.16em] uppercase transition-colors">
                  Explore Wellness <span aria-hidden>→</span>
                </span>
              </span>
            </AppLink>
          ) : null}
        </div>
      </div>
    </section>
  );
}
