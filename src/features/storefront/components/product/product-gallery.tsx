"use client";

import { ChevronLeft, ChevronRight, Play, ZoomIn } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { cn } from "@/lib/utils";
import type { SanityProductVideo } from "@/types/sanity-content";

import { ImageLightbox } from "./image-lightbox";

/**
 * Product gallery — a large primary image with a thumbnail row and prev/next
 * controls, driven by the product's real gallery. A product with no photos
 * yet shows one honest tonal placeholder rather than reused stock imagery.
 *
 * A product video, where there is one, becomes the second slide. Second and
 * not first deliberately: the first slide is `priority` and loads with the
 * page, and a video there would spend the page's opening bandwidth on
 * something most visitors never play. It still sits early enough that its
 * thumbnail, with a play badge, is the first thing after the hero shot.
 */
export function ProductGallery({
  images,
  name,
  video,
}: {
  images: { url: string; alt?: string }[];
  name: string;
  video?: SanityProductVideo | null;
}) {
  /**
   * Slides are images with the video spliced in at index 1, so `active`
   * indexes one list and the arrows, thumbnails and keyboard order all agree
   * without a special case for "is the video showing".
   */
  const slides: (
    | { kind: "image"; url: string; alt?: string }
    | { kind: "video"; video: SanityProductVideo }
  )[] = React.useMemo(() => {
    const list = images.map(
      (img) => ({ kind: "image", url: img.url, alt: img.alt }) as const,
    );
    if (!video?.url) return [...list];
    const at = Math.min(1, list.length);
    return [
      ...list.slice(0, at),
      { kind: "video", video } as const,
      ...list.slice(at),
    ];
  }, [images, video]);

  const [active, setActive] = React.useState(0);
  const go = (delta: number) =>
    setActive((i) => (i + delta + slides.length) % slides.length);

  /**
   * Which photo the viewer is showing, or null when it is closed.
   *
   * Indexed against `images` rather than `slides`: the viewer shows photographs,
   * and a video has its own controls and no business being zoomed. So the two
   * lists need translating between — hence `imageIndexOf` below.
   */
  const [zoomAt, setZoomAt] = React.useState<number | null>(null);

  // The parent re-filters `images` when a colour/option is selected — reset
  // to the first shot of the new set rather than an index that may no
  // longer exist (or now points at an unrelated photo). Compared by content
  // (a joined key), not array identity — the parent rebuilds `images` with a
  // fresh `.map()` on every render regardless of whether the selection
  // actually changed the photo set, so a reference check would reset the
  // gallery back to photo #1 on every option click, even an unrelated one
  // (e.g. picking a Size when only Colour affects photos).
  const imagesKey = images.map((img) => img.url).join("|");
  const [lastImagesKey, setLastImagesKey] = React.useState(imagesKey);
  if (imagesKey !== lastImagesKey) {
    setLastImagesKey(imagesKey);
    setActive(0);
  }

  /** The `images` index of a slide, or null for the video slide. */
  const imageIndexOf = (slideIndex: number): number | null => {
    const slide = slides[slideIndex];
    if (!slide || slide.kind !== "image") return null;
    const found = images.findIndex((img) => img.url === slide.url);
    return found === -1 ? null : found;
  };

  const openZoom = () => {
    const imageIndex = imageIndexOf(active);
    if (imageIndex !== null) setZoomAt(imageIndex);
  };

  if (!slides.length) {
    return (
      <PlaceholderImage
        tone="sand"
        illustration="leaf"
        aspect="aspect-[3/2]"
        className="rounded-2xl"
      />
    );
  }

  const current = slides[active] ?? slides[0]!;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-line bg-paper relative aspect-[3/2] overflow-hidden rounded-2xl border">
        {current.kind === "video" ? (
          /**
           * `controls` rather than autoplay: this is product footage a visitor
           * chooses to watch, not decoration, and an autoplaying video on a
           * page someone is reading is an interruption. `preload="none"` so
           * arriving at the page costs nothing until they press play —
           * `metadata` still fetches on every load, which for a 3 MB file on
           * mobile data is a charge for something usually unwatched.
           * `playsInline` keeps iOS from hijacking the screen full-screen.
           */
          <video
            key={current.video.url}
            controls
            preload="none"
            playsInline
            poster={current.video.poster ?? undefined}
            aria-label={current.video.alt || `${name} — product video`}
            className="absolute inset-0 size-full bg-black object-contain"
          >
            <source src={current.video.url} type="video/mp4" />
            Your browser cannot play this video.
          </video>
        ) : (
          <>
            {/* object-contain, not object-cover — the main shot always shows
                the whole photo. A cover crop looks fine on a photo composed
                for exactly this frame, but supplier photos vary wildly in
                aspect ratio and composition, and cover crops any mismatch
                into a tight, arbitrary zoom on whatever happens to be in the
                centre. Thumbnails below stay cover — small squares read fine
                cropped, and it's the main shot people zoom in on mentally. */}
            {/* The photo itself opens the viewer, not just the button. Clicking
                a product photo to see it bigger is the expectation; making the
                small corner button the only way to do it is a puzzle. */}
            <button
              type="button"
              onClick={openZoom}
              aria-label={`Enlarge ${current.alt || name}`}
              className="absolute inset-0 cursor-zoom-in"
            >
              <Image
                key={active}
                src={current.url}
                alt={current.alt || name}
                fill
                priority={active === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
              />
            </button>

            {/* Kept as well as the clickable photo: it is the visible signal
                that zooming is possible at all. */}
            <button
              type="button"
              onClick={openZoom}
              aria-label="Enlarge image"
              className="text-ink/70 hover:text-ink absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors"
            >
              <ZoomIn className="size-[18px]" strokeWidth={1.6} />
            </button>
          </>
        )}
      </div>

      {slides.length > 1 ? (
        <div className="flex items-center gap-3">
          {/* Arrows are hidden on mobile. At 390px the two 36px buttons plus
              gaps leave ~246px for thumbnails, so a four-shot strip wrapped to
              a second row and the arrows — vertically centred against the whole
              two-row block — ended up stranded at the far screen edges, level
              with nothing. The strip scrolls horizontally there instead, which
              is the gesture a thumbnail row invites anyway; from sm up there is
              room for one row and the arrows sit beside it as before. */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="border-line text-ink/60 hover:text-ink hover:border-ink/40 flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors max-sm:hidden"
          >
            <ChevronLeft className="size-4" strokeWidth={1.8} />
          </button>

          <div className="flex flex-1 gap-3 max-sm:[scrollbar-width:none] max-sm:overflow-x-auto max-sm:[mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] sm:flex-wrap">
            {slides.map((slide, index) => (
              <button
                key={slide.kind === "video" ? slide.video.url : slide.url}
                type="button"
                onClick={() => setActive(index)}
                aria-label={
                  slide.kind === "video"
                    ? slide.video.alt || `${name} — play product video`
                    : slide.alt || `${name} — view ${index + 1}`
                }
                aria-pressed={active === index}
                className={cn(
                  "border-line bg-paper relative size-16 shrink-0 overflow-hidden rounded-lg border transition-colors",
                  active === index
                    ? "border-brass ring-brass/30 ring-1"
                    : "hover:border-ink/30",
                )}
              >
                {slide.kind === "video" ? (
                  <>
                    {/* The poster stands in for the video, so the strip stays a
                        row of images — a 64px <video> would download the file
                        the preload="none" above is there to avoid. */}
                    {slide.video.poster ? (
                      <Image
                        src={slide.video.poster}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="bg-basalt absolute inset-0" />
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-black/35">
                      <Play
                        className="size-5 fill-white text-white"
                        strokeWidth={1.5}
                      />
                    </span>
                  </>
                ) : (
                  <Image
                    src={slide.url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="border-line text-ink/60 hover:text-ink hover:border-ink/40 flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors max-sm:hidden"
          >
            <ChevronRight className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      ) : null}

      {zoomAt !== null ? (
        <ImageLightbox
          images={images}
          index={zoomAt}
          name={name}
          onClose={() => setZoomAt(null)}
          onIndexChange={(next) => {
            setZoomAt(next);
            // Keep the page behind in step, so closing the viewer leaves you on
            // the photo you were last looking at rather than the one you opened.
            const slideIndex = slides.findIndex(
              (slide) =>
                slide.kind === "image" && slide.url === images[next]?.url,
            );
            if (slideIndex !== -1) setActive(slideIndex);
          }}
        />
      ) : null}
    </div>
  );
}
