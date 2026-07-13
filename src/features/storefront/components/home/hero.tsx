"use client";

import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";

/**
 * Hero — a faithful recreation of the Kaiku concept: a draggable before/after
 * garden slider with the transformation copy anchored to the lower-left.
 * Scaled to ~65–70vh so the trust bar peeks in on a laptop rather than filling
 * the screen. Imagery is placeholder (one photo, two grades) pending the real
 * before/after garden pair.
 */
export function Hero() {
  const [pos, setPos] = React.useState(50);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);

  const setFromClientX = React.useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(97, Math.max(3, pct)));
  }, []);

  React.useEffect(() => {
    function move(e: PointerEvent) {
      if (!dragging.current) return;
      setFromClientX(e.clientX);
    }
    function up() {
      dragging.current = false;
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [setFromClientX]);

  return (
    <section className="bg-basalt relative isolate overflow-hidden">
      <div
        ref={frameRef}
        className="relative h-[68vh] max-h-[600px] min-h-[440px] w-full touch-none select-none"
      >
        {/* AFTER — warm, lit, full width underneath. */}
        <div className="absolute inset-0">
          <Image
            src="/images/steam-lake.jpg"
            alt="Your garden, transformed"
            fill
            priority
            sizes="100vw"
            className="object-cover [filter:saturate(1.3)_brightness(0.95)_sepia(0.28)_hue-rotate(-14deg)]"
          />
        </div>

        {/* BEFORE — cold, dark, clipped to the left of the handle. */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <Image
            src="/images/steam-lake.jpg"
            alt="Your garden today"
            fill
            priority
            sizes="100vw"
            className="object-cover [filter:grayscale(0.75)_brightness(0.42)_contrast(1.05)]"
          />
        </div>

        {/* Left-weighted darkening so the copy reads over the before side. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(11,8,5,0.92)_0%,rgba(11,8,5,0.55)_38%,rgba(11,8,5,0.15)_68%,transparent_100%)]" />
        <div className="from-basalt pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t to-transparent" />

        {/* Divider + handle */}
        <div
          className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white/75"
          style={{ left: `${pos}%` }}
        >
          <button
            type="button"
            aria-label="Drag to reveal the transformation"
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            className="bg-brass text-basalt-deep pointer-events-auto absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full shadow-[0_4px_18px_rgba(0,0,0,0.55)]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 6l-4 6 4 6M15 6l4 6-4 6" />
            </svg>
          </button>
        </div>

        {/* Hero copy — lower-left, measured to the concept, scaled ~15% down. */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end px-6 pb-[7%]">
          <div className="max-w-[420px]">
            <p className="text-brass mb-[14px] text-[11px] font-medium tracking-[0.2em] uppercase">
              Inside. Outside. Every detail.
            </p>
            <h1 className="font-display text-canvas text-[2.85rem] leading-[0.98] tracking-[-0.01em]">
              Transform
              <br />
              how you
              <br />
              <span className="text-brass">live.</span>
            </h1>
            <p className="text-canvas/85 mt-[18px] text-[15px] leading-[1.5]">
              Premium products.
              <br />
              Expert guidance.
              <br />
              Considered design.
              <br />
              Beautiful spaces, inside and out.
            </p>
            <div className="mt-[24px] flex flex-col gap-[10px]">
              <AppLink
                href="/shop"
                className="bg-brass text-basalt-deep hover:bg-brass-deep flex h-[46px] w-full items-center justify-center gap-2 rounded-[8px] text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors"
              >
                Explore Collection
                <span aria-hidden>→</span>
              </AppLink>
              <AppLink
                href="/guided-buying"
                className="text-canvas flex h-[46px] w-full items-center justify-center rounded-[8px] border border-white/25 text-[12px] font-medium tracking-[0.14em] uppercase transition-colors hover:border-white/60"
              >
                Garden Studio
              </AppLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
