import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { formatPrice } from "@/lib/format";
import type { SanityLink, SanityProduct } from "@/types/sanity-content";

export interface HeroContent {
  eyebrow?: string;
  headline?: string;
  highlight?: string;
  subcopy?: string;
  image?: string | null;
  ctaPrimary?: SanityLink | null;
  ctaSecondary?: SanityLink | null;
  featuredProduct?: SanityProduct | null;
}

/**
 * Home hero — a single cinematic garden photograph spans the full section,
 * with the statement and CTAs sitting directly on top of it. A dark gradient
 * fades in from the left (matching the basalt ground) so the photo emerges
 * out of the text rather than sitting beside it as a separate block. Content
 * comes from the Sanity `homepage` singleton, falling back to these defaults
 * so the hero looks identical before content is set.
 */
export function Hero({ content }: { content?: HeroContent }) {
  const eyebrow = content?.eyebrow ?? "Home Improvement, Reimagined";
  const headline = content?.headline ?? "Spaces\nthat slow";
  const highlight = content?.highlight ?? "life down";
  const image = content?.image ?? "/images/garden-after.jpg";
  const ctaPrimary = content?.ctaPrimary ?? {
    label: "Explore Collections",
    href: "/shop",
  };
  const ctaSecondary = content?.ctaSecondary ?? {
    label: "Our Story",
    href: "/about",
  };
  const featured = content?.featuredProduct;
  const headlineLines = headline.split("\n");

  return (
    <section className="bg-basalt relative isolate overflow-hidden">
      <div className="relative min-h-[620px] lg:min-h-[40rem]">
        <Image
          src={image}
          alt="A lit garden terrace at dusk"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Left-to-right fade: solid basalt under the text, dissolving into
            the clear photograph — the seam the image "fades into the text". */}
        <div className="from-basalt via-basalt/85 to-basalt/0 pointer-events-none absolute inset-0 bg-gradient-to-r from-5% via-35% to-80% lg:to-70%" />
        <div className="from-basalt/40 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />

        <div className="relative mx-auto flex h-full max-w-[1440px] items-center">
          <div className="flex flex-col justify-center px-6 py-16 sm:px-8 lg:max-w-xl lg:py-24 lg:pl-12">
            <p className="text-brass mb-7 flex items-center gap-3 text-[11px] font-medium tracking-[0.24em] uppercase">
              {eyebrow}
              <span aria-hidden className="bg-brass/50 h-px w-10" />
            </p>
            <h1 className="text-canvas font-display text-[3.4rem] leading-[0.94] tracking-[-0.02em] sm:text-[4.5rem] lg:text-[5.1rem]">
              {headlineLines.map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
              <span className="text-brass italic">{highlight}</span>
            </h1>
            <p className="text-canvas/70 mt-8 max-w-sm text-[15px] leading-relaxed">
              {content?.subcopy ?? (
                <>
                  Timeless design. Premium materials.
                  <br />
                  Beautiful spaces, indoors and out.
                </>
              )}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <AppLink
                href={ctaPrimary.href}
                className="bg-brass hover:bg-brass-deep flex h-12 items-center gap-2 rounded-md px-7 text-[12px] font-semibold tracking-[0.16em] text-white uppercase transition-colors"
              >
                {ctaPrimary.label}
                <span aria-hidden>→</span>
              </AppLink>
              <AppLink
                href={ctaSecondary.href}
                className="text-canvas/85 hover:text-canvas flex items-center gap-2 text-[12px] font-medium tracking-[0.16em] uppercase transition-colors"
              >
                {ctaSecondary.label} <span aria-hidden>→</span>
              </AppLink>
            </div>
          </div>
        </div>

        {featured ? (
          <AppLink
            href={`/shop/${featured.category}/${featured.slug}`}
            className="group bg-basalt/70 hover:border-brass/40 absolute right-5 bottom-5 flex items-center gap-4 rounded-xl border border-white/12 p-3 backdrop-blur-md transition-colors sm:right-8 sm:bottom-8"
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
                From {formatPrice(featured.price)}
              </span>
              <span className="text-canvas/60 group-hover:text-canvas mt-1.5 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.16em] uppercase transition-colors">
                Explore Wellness <span aria-hidden>→</span>
              </span>
            </span>
          </AppLink>
        ) : null}
      </div>
    </section>
  );
}
