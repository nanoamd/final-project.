"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Pillar = {
  index: string;
  kicker: string;
  title: string;
  copy: string;
  href: string;
  image: string;
  align: "left" | "right";
};

const PILLARS: Pillar[] = [
  {
    index: "01",
    kicker: "The heat",
    title: "Saunas built for the garden.",
    copy: "Cedar cabins and barrel saunas, correctly specified and made to last — the fifteen minutes that loosen the whole day.",
    href: "/shop/outdoor-saunas",
    image: "/images/cedar.jpg",
    align: "left",
  },
  {
    index: "02",
    kicker: "The cold",
    title: "Cold water, on purpose.",
    copy: "Cold plunge and chillers that hold a precise temperature — the coldest thing you'll ever choose, then choose again tomorrow.",
    href: "/shop/cold-plunge",
    image: "/images/dark-water.jpg",
    align: "right",
  },
  {
    index: "03",
    kicker: "The rest",
    title: "The part you stay for.",
    copy: "Fire, light and the evening air doing the last of the work. This is what you build the whole garden around.",
    href: "/shop",
    image: "/images/steam-lake.jpg",
    align: "left",
  },
];

/**
 * The scroll centrepiece: three full-bleed photographic bands. Each image
 * parallaxes against the scroll (driven by the global Lenis→GSAP sync) and its
 * copy wipes up as it enters. This is where the photography and the "expensive
 * scrolling" motion live together, rather than motion for its own sake.
 */
export function RitualPillars() {
  const rootRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const bands = gsap.utils.toArray<HTMLElement>("[data-band]");
      bands.forEach((band) => {
        const img = band.querySelector<HTMLElement>("[data-parallax]");
        const content = band.querySelector<HTMLElement>("[data-content]");

        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -12 },
            {
              yPercent: 12,
              ease: "none",
              scrollTrigger: {
                trigger: band,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }

        if (content) {
          gsap.from(content.children, {
            yPercent: 60,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: band,
              start: "top 70%",
            },
          });
        }
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="bg-basalt text-canvas">
      {PILLARS.map((p) => (
        <article
          key={p.index}
          data-band
          className="relative isolate flex min-h-[92vh] items-center overflow-hidden"
        >
          <div
            data-parallax
            className="absolute inset-x-0 top-[-12%] bottom-[-12%] -z-10"
          >
            <Image
              src={p.image}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="from-basalt/90 via-basalt/50 to-basalt/70 absolute inset-0 bg-gradient-to-r" />
          </div>

          <div
            className={`mx-auto flex w-full max-w-[1280px] px-6 sm:px-8 lg:px-12 ${
              p.align === "right" ? "justify-end" : "justify-start"
            }`}
          >
            <div data-content className="max-w-md">
              <p className="text-brass mb-4 flex items-center gap-3 text-[13px] font-medium tracking-[0.22em] uppercase">
                <span className="font-display text-base">{p.index}</span>
                {p.kicker}
              </p>
              <h2 className="font-display text-[2rem] leading-[1.06] tracking-tight text-balance sm:text-5xl">
                {p.title}
              </h2>
              <p className="text-canvas/75 mt-5 text-lg leading-relaxed text-pretty">
                {p.copy}
              </p>
              <AppLink
                href={p.href}
                className="text-canvas group mt-7 inline-flex items-center gap-2 text-[15px] tracking-wide"
              >
                <span className="border-canvas/40 group-hover:border-canvas border-b pb-1 transition-colors">
                  Explore {p.kicker.replace("The ", "")}
                </span>
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </AppLink>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
