"use client";

import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { cn } from "@/lib/utils";

/**
 * Product gallery — a large primary image with a thumbnail row and prev/next
 * controls, driven by the product's real gallery. A product with no photos
 * yet shows one honest tonal placeholder rather than reused stock imagery.
 */
export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = React.useState(0);
  const go = (delta: number) =>
    setActive((i) => (i + delta + images.length) % images.length);

  // The parent re-filters `images` when a colour/option is selected — reset
  // to the first shot of the new set rather than an index that may no
  // longer exist (or now points at an unrelated photo).
  const [lastImages, setLastImages] = React.useState(images);
  if (images !== lastImages) {
    setLastImages(images);
    setActive(0);
  }

  if (!images.length) {
    return (
      <PlaceholderImage
        tone="sand"
        illustration="leaf"
        aspect="aspect-[3/2]"
        className="rounded-2xl"
      />
    );
  }

  const current = images[active] ?? images[0]!;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-line bg-paper relative aspect-[3/2] overflow-hidden rounded-2xl border">
        {/* object-contain, not object-cover — the main shot always shows
            the whole photo. A cover crop looks fine on a photo composed
            for exactly this frame, but supplier photos vary wildly in
            aspect ratio and composition, and cover crops any mismatch
            into a tight, arbitrary zoom on whatever happens to be in the
            centre. Thumbnails below stay cover — small squares read fine
            cropped, and it's the main shot people zoom in on mentally. */}
        <Image
          key={active}
          src={current}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain"
        />

        <button
          type="button"
          aria-label="Zoom image"
          className="text-ink/70 hover:text-ink absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors"
        >
          <ZoomIn className="size-[18px]" strokeWidth={1.6} />
        </button>
      </div>

      {images.length > 1 ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="border-line text-ink/60 hover:text-ink hover:border-ink/40 flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors"
          >
            <ChevronLeft className="size-4" strokeWidth={1.8} />
          </button>

          <div className="flex flex-1 flex-wrap gap-3">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${name} — view ${index + 1}`}
                aria-pressed={active === index}
                className={cn(
                  "border-line bg-paper relative size-16 shrink-0 overflow-hidden rounded-lg border transition-colors",
                  active === index
                    ? "border-brass ring-brass/30 ring-1"
                    : "hover:border-ink/30",
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
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
      ) : null}
    </div>
  );
}
