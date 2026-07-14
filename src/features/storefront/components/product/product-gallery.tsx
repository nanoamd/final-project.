"use client";

import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { BrandIllustration } from "@/components/ui/brand-illustration";
import { cn } from "@/lib/utils";
import type { IllustrationKind } from "@/types/catalog";

type Slide =
  | { kind: "image"; src: string }
  | { kind: "drawing"; illustration: IllustrationKind };

/**
 * Product gallery — a large primary image with a thumbnail row and prev/next
 * controls. Photography is a small licensed set reused across views; the final
 * thumbnail is an honest line drawing standing in for a dimensioned spec sheet.
 */
export function ProductGallery({
  image,
  illustration,
  name,
}: {
  image?: string;
  illustration: IllustrationKind;
  name: string;
}) {
  const slides: Slide[] = [
    { kind: "image", src: image ?? "/images/cedar.jpg" },
    { kind: "image", src: "/images/steam-lake.jpg" },
    { kind: "image", src: "/images/dark-water.jpg" },
    { kind: "image", src: "/images/cedar.jpg" },
    { kind: "drawing", illustration },
  ];
  const [active, setActive] = React.useState(0);
  const go = (delta: number) =>
    setActive((i) => (i + delta + slides.length) % slides.length);
  const current: Slide = slides[active] ?? slides[0]!;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-2xl border">
        {current.kind === "image" ? (
          <Image
            key={active}
            src={current.src}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="text-ink/15 flex h-full w-full items-center justify-center p-[18%]">
            <BrandIllustration
              kind={current.illustration}
              className="h-auto w-full max-w-[70%]"
            />
          </div>
        )}

        <button
          type="button"
          aria-label="Zoom image"
          className="text-ink/70 hover:text-ink absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors"
        >
          <ZoomIn className="size-[18px]" strokeWidth={1.6} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous image"
          className="border-line text-ink/60 hover:text-ink hover:border-ink/40 flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors"
        >
          <ChevronLeft className="size-4" strokeWidth={1.8} />
        </button>

        <div className="grid flex-1 grid-cols-5 gap-3">
          {slides.map((slide, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${name} — view ${index + 1}`}
              aria-pressed={active === index}
              className={cn(
                "border-line bg-paper relative aspect-square overflow-hidden rounded-lg border transition-colors",
                active === index ? "border-brass ring-brass/30 ring-1" : "hover:border-ink/30",
              )}
            >
              {slide.kind === "image" ? (
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="text-ink/25 flex h-full w-full items-center justify-center p-2">
                  <BrandIllustration
                    kind={slide.illustration}
                    className="h-auto w-full max-w-[80%]"
                  />
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next image"
          className="border-line text-ink/60 hover:text-ink hover:border-ink/40 flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors"
        >
          <ChevronRight className="size-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
