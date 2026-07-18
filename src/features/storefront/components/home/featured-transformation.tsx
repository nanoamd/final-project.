import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";

/**
 * Featured Transformation — the first editorial beat after the core
 * storefront sections. A large "after" photograph carries a small framed
 * "before" inset in the corner, deliberately distinct from Garden Studio's
 * draggable slider elsewhere on the page. Copy speaks to everyday life, not
 * just gardens — this is where the homepage starts widening the story.
 */
export function FeaturedTransformation() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto mb-6 max-w-xl text-center sm:mb-14">
          <p className="text-muted mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            A Kaiku Transformation
          </p>
          <h2 className="text-ink font-display text-2xl leading-[1.05] tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Designed around the way you live
          </h2>
          <p className="text-muted mt-4 text-[15px] leading-relaxed sm:text-base">
            Every project starts the same way — not with a product, but with a
            question: how should this space actually feel to live in.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="relative aspect-[16/11] overflow-hidden rounded-xl sm:aspect-[16/9]">
            <Image
              src="/images/garden-after.jpg"
              alt="A finished outdoor living space at dusk"
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-cover"
            />
          </div>
          <div className="border-canvas absolute -bottom-6 -left-3 w-28 overflow-hidden rounded-lg border-4 shadow-xl sm:-bottom-8 sm:-left-8 sm:w-44">
            <div className="relative aspect-[4/5]">
              <Image
                src="/images/garden-before.jpg"
                alt="The same space before its redesign"
                fill
                sizes="180px"
                className="object-cover"
              />
            </div>
            <p className="bg-canvas text-ink py-1 text-center text-[10px] font-semibold tracking-[0.14em] uppercase">
              Before
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center sm:mt-16">
          <AppLink
            href="/tools/garden-visualiser"
            className="text-brass flex items-center gap-2 text-[12px] font-medium tracking-[0.16em] uppercase"
          >
            See what&rsquo;s possible for your space <span aria-hidden>→</span>
          </AppLink>
        </div>
      </div>
    </section>
  );
}
