"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";
import * as React from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * How much of the remaining scroll distance Lenis covers each frame.
 *
 * This was 0.09 — slower than Lenis's own default — and it is what Damien was
 * describing when he said the site felt laggy. At 0.09 the page closes 9% of
 * the gap per frame, so at 60fps it takes roughly 25 frames (about 0.4s) to
 * settle after the wheel stops. That delay between input and response is what
 * reads as lag, even though nothing is actually slow: the storefront is
 * statically rendered, and the heavy JS chunks are Sanity Studio on /studio
 * (4MB) and Three.js on /experience, neither of which a shopper loads.
 *
 * 0.18 keeps the smoothing visible while responding closely enough to feel
 * direct. Raise it towards 1 for snappier still — 1 is effectively native
 * scrolling — or set `smoothWheel: false` below to turn smoothing off
 * entirely.
 */
const SCROLL_LERP = 0.18;

/**
 * App-wide smooth scrolling (Lenis) driven off GSAP's ticker, which is the
 * correct way to keep scroll-linked GSAP/ScrollTrigger animations in perfect
 * sync with the smoothed scroll position. Reduced-motion handling lives in
 * `SmoothScroll` below.
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
  /*
   * The docstring above used to claim this "respects reduced-motion by leaving
   * Lenis effectively pass-through", and it did not — there was no check of any
   * kind, so smoothing was applied to everyone regardless of their OS setting.
   * The hook already existed and was used elsewhere in the codebase; it simply
   * was not wired in here.
   *
   * With reduced motion requested, smoothing is switched off and the lerp set
   * to 1, which hands scrolling straight back to the browser.
   */
  const reducedMotion = useReducedMotion();

  return (
    <ReactLenis
      root
      options={{
        // We drive Lenis from GSAP's ticker instead of Lenis's own rAF loop.
        autoRaf: false,
        lerp: reducedMotion ? 1 : SCROLL_LERP,
        smoothWheel: !reducedMotion,
      }}
    >
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  );
}
