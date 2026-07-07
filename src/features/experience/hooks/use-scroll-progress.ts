"use client";

import * as React from "react";

import { progressStore } from "@/features/experience/lib/progress-store";

/**
 * Drives `progressStore` from how far the user has scrolled through a tall
 * "track" element. progress=0 when the track's top reaches the top of the
 * viewport; progress=1 when the track's bottom reaches the bottom of the
 * viewport (i.e. exactly the scrollable distance the track contributes).
 *
 * The raw scroll value is smoothed (lerped toward the target every frame) so
 * fast flicks glide instead of jumping — reversible in both directions.
 */
export function useScrollProgress(
  trackRef: React.RefObject<HTMLElement | null>,
) {
  React.useEffect(() => {
    let raf = 0;
    let damped = progressStore.value;
    const DAMPING = 0.08;

    function tick() {
      const track = trackRef.current;
      if (track) {
        const rect = track.getBoundingClientRect();
        const scrollableDistance = rect.height - window.innerHeight;
        const scrolledInto = -rect.top;
        const raw =
          scrollableDistance > 0
            ? clamp(scrolledInto / scrollableDistance, 0, 1)
            : 0;

        damped += (raw - damped) * DAMPING;
        // Snap once close enough to avoid an endless tiny-delta tail.
        if (Math.abs(raw - damped) < 0.0005) damped = raw;

        progressStore.set(damped);
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trackRef]);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
