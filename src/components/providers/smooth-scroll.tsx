"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";
import * as React from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * App-wide smooth scrolling (Lenis) driven off GSAP's ticker, which is the
 * correct way to keep scroll-linked GSAP/ScrollTrigger animations in perfect
 * sync with the smoothed scroll position. Respects reduced-motion by leaving
 * Lenis effectively pass-through.
 *
 * This is deliberately a thin, permanent piece of plumbing: any component in
 * the tree can now use ScrollTrigger and rely on `lenis` being the source of
 * truth for scroll — no per-page wiring.
 */
function LenisGsapBridge() {
  const lenis = useLenis();

  React.useEffect(() => {
    if (!lenis) return;

    function raf(time: number) {
      lenis?.raf(time * 1000);
    }

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(raf);
      lenis.off("scroll", ScrollTrigger.update);
    };
  }, [lenis]);

  return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        // We drive Lenis from GSAP's ticker instead of Lenis's own rAF loop.
        autoRaf: false,
        lerp: 0.09,
        smoothWheel: true,
      }}
    >
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  );
}
