"use client";

import { Columns3, Flower2, Leaf, Lightbulb, Sofa } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import type { SanityLink } from "@/types/sanity-content";

const DEFAULT_THUMBS = [
  "/images/garden-after.jpg",
  "/images/cedar.jpg",
  "/images/steam-lake.jpg",
  "/images/dark-water.jpg",
];

const LENSES = [
  { icon: Columns3, label: "Structures" },
  { icon: Sofa, label: "Furniture" },
  { icon: Lightbulb, label: "Lighting" },
  { icon: Leaf, label: "Wellness" },
  { icon: Flower2, label: "Decor" },
];

export interface GardenStudioContent {
  eyebrow?: string;
  headline?: string;
  body?: string;
  beforeImage?: string | null;
  afterImage?: string | null;
  thumbnails?: string[];
  cta?: SanityLink | null;
}

/**
 * Garden Studio — the visualiser moment. A draggable before/after reveal sits
 * between an editorial statement and a strip of scene thumbnails, with the
 * design lenses below. Outcome-led throughout: it sells what you get to see,
 * never the technology behind it.
 */
export function GardenStudio({ content }: { content?: GardenStudioContent }) {
  const [pos, setPos] = React.useState(50);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);

  const afterImage = content?.afterImage ?? "/images/garden-after.jpg";
  const beforeImage = content?.beforeImage ?? "/images/garden-before.jpg";
  const thumbs = content?.thumbnails?.length
    ? content.thumbnails
    : DEFAULT_THUMBS;
  const cta = content?.cta ?? {
    label: "Visualise Your Space",
    href: "/tools/garden-visualiser",
  };

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
    <section className="bg-basalt border-b border-white/10">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14">
          {/* Left — statement */}
          <div>
            <p className="text-brass mb-4 text-[12px] font-medium tracking-[0.24em] uppercase">
              {content?.eyebrow ?? "Design Studio"}
            </p>
            <h2 className="text-canvas font-display text-4xl leading-[1.02] tracking-tight sm:text-5xl">
              {content?.headline ? (
                content.headline
              ) : (
                <>
                  See it.
                  <br />
                  <span className="text-brass italic">Love it.</span>
                  <br />
                  Live in it.
                </>
              )}
            </h2>
            <p className="text-canvas/65 mt-6 max-w-sm text-[15px] leading-relaxed">
              {content?.body ??
                "Transform any room with the Design Studio. Upload a photo of your own space and explore endless possibilities — see it before you commit to a single piece."}
            </p>
            <div className="mt-8 flex flex-col items-start gap-4">
              <AppLink
                href={cta.href}
                className="bg-brass hover:bg-brass-deep flex h-12 items-center gap-2 rounded-md px-7 text-[12px] font-semibold tracking-[0.16em] text-white uppercase transition-colors"
              >
                {cta.label}
                <span aria-hidden>→</span>
              </AppLink>
              <AppLink
                href="/guided-buying"
                className="text-canvas/70 hover:text-canvas flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors"
              >
                How It Works <span aria-hidden>→</span>
              </AppLink>
            </div>
          </div>

          {/* Right — reveal + thumbnails + lenses */}
          <div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              {/* Before / after reveal */}
              <div
                ref={frameRef}
                className="relative aspect-[16/10] touch-none overflow-hidden rounded-xl border border-white/8 select-none"
              >
                <Image
                  src={afterImage}
                  alt="Your space, transformed"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
                >
                  <Image
                    src={beforeImage}
                    alt="Your space today"
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover"
                  />
                </div>

                <span className="bg-basalt/80 text-canvas absolute top-4 left-4 rounded-md px-3 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase backdrop-blur-sm">
                  Before
                </span>
                <span className="bg-brass absolute top-4 right-4 rounded-md px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-white uppercase">
                  After
                </span>

                <div
                  className="pointer-events-none absolute inset-y-0 z-20 w-px bg-white/80"
                  style={{ left: `${pos}%` }}
                >
                  <button
                    type="button"
                    aria-label="Drag to reveal the transformation"
                    onPointerDown={(e) => {
                      dragging.current = true;
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }}
                    className="bg-brass pointer-events-auto absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full text-white shadow-[0_4px_18px_rgba(0,0,0,0.55)]"
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
              </div>

              {/* Thumbnail strip */}
              <div className="hidden w-[72px] flex-col gap-3 sm:flex">
                {thumbs.map((src, i) => (
                  <span
                    key={src}
                    className={`relative block aspect-square overflow-hidden rounded-lg border ${
                      i === 0 ? "border-brass/60" : "border-white/10"
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </span>
                ))}
              </div>
            </div>

            {/* Design lenses */}
            <div className="mt-5 grid grid-cols-5 gap-2 border-t border-white/10 pt-5">
              {LENSES.map((lens) => (
                <div
                  key={lens.label}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <lens.icon
                    className="text-brass size-5"
                    strokeWidth={1.4}
                    aria-hidden
                  />
                  <span className="text-canvas/70 text-[11px] tracking-[0.06em]">
                    {lens.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
