"use client";

import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * The first viewport: a draggable before/after slider over one garden
 * photograph. The left ("before") half is graded cold and dark; the right
 * ("after") half is graded warm and bright — so dragging the handle reveals
 * the transformation, tying the hero directly to "see your future garden
 * before you build it." One image, two grades — swap for a real before/after
 * pair when photography lands; the interaction doesn't change.
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
    setPos(Math.min(98, Math.max(2, pct)));
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
        className="relative h-[86vh] min-h-[560px] w-full touch-none select-none"
      >
        {/* AFTER — warm, brighter, full width underneath. */}
        <div className="absolute inset-0">
          <Image
            src="/images/steam-lake.jpg"
            alt="Your garden, transformed"
            fill
            priority
            sizes="100vw"
            className="object-cover [filter:saturate(1.25)_brightness(0.9)_sepia(0.25)_hue-rotate(-12deg)]"
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
            className="object-cover [filter:grayscale(0.7)_brightness(0.5)_contrast(1.05)]"
          />
        </div>

        {/* Consistent darkening for text legibility, over both. */}
        <div className="from-basalt/90 via-basalt/45 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="from-basalt pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent" />

        {/* Divider + handle */}
        <div
          className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white/70"
          style={{ left: `${pos}%` }}
        >
          <button
            type="button"
            aria-label="Drag to reveal the transformation"
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            className="bg-brass text-basalt-deep pointer-events-auto absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full shadow-[0_6px_24px_rgba(0,0,0,0.5)]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M8 7l-4 5 4 5M16 7l4 5-4 5" />
            </svg>
          </button>
        </div>

        {/* Hero copy */}
        <Container className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center">
          <div className="pointer-events-auto max-w-xl">
            <p className="text-brass animate-in fade-in slide-in-from-bottom-3 mb-5 text-[13px] font-medium tracking-[0.24em] uppercase duration-700 motion-reduce:animate-none">
              Inside. Outside. Every detail.
            </p>
            <h1 className="animate-in fade-in slide-in-from-bottom-4 font-display text-canvas text-[3.25rem] leading-[0.98] tracking-tight text-balance duration-700 motion-reduce:animate-none sm:text-7xl">
              Transform
              <br />
              how you <span className="text-brass italic">live.</span>
            </h1>
            <p className="text-canvas/80 animate-in fade-in slide-in-from-bottom-3 mt-6 text-lg leading-relaxed delay-150 duration-700 motion-reduce:animate-none">
              Premium products.
              <br />
              Expert design.
              <br />
              Timeless living.
            </p>
            <div className="animate-in fade-in slide-in-from-bottom-2 mt-9 flex flex-col gap-3 delay-300 duration-700 motion-reduce:animate-none sm:flex-row sm:items-center">
              <AppLink
                href="/shop"
                className={buttonVariants({ variant: "accent", size: "lg" })}
              >
                Explore Collections{" "}
                <span aria-hidden className="ml-1">
                  →
                </span>
              </AppLink>
              <AppLink
                href="/guided-buying"
                className={buttonVariants({ variant: "onDark", size: "lg" })}
              >
                Try AI Design{" "}
                <span aria-hidden className="text-brass ml-1">
                  ✦
                </span>
              </AppLink>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
