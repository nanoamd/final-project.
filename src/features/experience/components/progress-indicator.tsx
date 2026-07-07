"use client";

import { useProgressValue } from "@/features/experience/lib/progress-store";

/** Thin progress bar — the "never trap the user" escape valve: always shows
 * how far through the experience they are. */
export function ProgressIndicator() {
  const progress = useProgressValue();

  return (
    <div
      className="bg-canvas/10 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1"
      role="progressbar"
      aria-label="Scroll progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="bg-canvas/70 h-full transition-[width] duration-75 ease-linear"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
