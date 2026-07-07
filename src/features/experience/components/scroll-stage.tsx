"use client";

import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { ExperienceCanvas } from "@/features/experience/components/experience-canvas";
import { ProgressIndicator } from "@/features/experience/components/progress-indicator";
import { useScrollProgress } from "@/features/experience/hooks/use-scroll-progress";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * The pinned, scroll-scrubbed stage. A tall track provides scroll distance;
 * the viewport-height content stays put via `position: sticky` while
 * useScrollProgress reads how far we've scrolled into the track (0 -> 1).
 *
 * Escape valves, per the architecture's non-negotiables: a visible progress
 * bar, a minimal always-present "KAIKU / SHOP" nav (SHOP bypasses the
 * animation entirely), and a static fallback for prefers-reduced-motion —
 * scroll-hijacking must never trap the user.
 */
export function ScrollStage() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // When reduced motion is on, the tracked element never mounts, so
  // trackRef.current stays null and the hook simply idles.
  useScrollProgress(trackRef);

  if (reducedMotion) {
    return (
      <div className="bg-charcoal text-canvas flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <MinimalNav />
        <p className="font-display text-3xl tracking-tight">
          Kaiku — a garden, becoming a sanctuary.
        </p>
        <p className="text-canvas/70 max-w-md text-sm">
          Motion is reduced on this device. Continue to explore the collection.
        </p>
        <AppLink
          href="/shop/outdoor-saunas"
          className={buttonVariants({ variant: "onDark" })}
        >
          Enter Kaiku
        </AppLink>
      </div>
    );
  }

  return (
    <div ref={trackRef} className="relative h-[600vh]">
      <div className="bg-charcoal sticky top-0 h-screen w-full overflow-hidden">
        <ExperienceCanvas />
        <ProgressIndicator />
        <MinimalNav />
      </div>
    </div>
  );
}

/** Top-left minimal nav — always present, never hidden by the animation. */
function MinimalNav() {
  return (
    <div className="absolute top-6 left-6 z-10 flex items-center gap-6">
      <AppLink
        href="/"
        className="font-display text-canvas text-xl tracking-tight"
      >
        Kaiku
      </AppLink>
      <AppLink
        href="/shop"
        className="text-canvas/80 hover:text-canvas text-sm tracking-wide transition-colors"
      >
        Shop
      </AppLink>
    </div>
  );
}
