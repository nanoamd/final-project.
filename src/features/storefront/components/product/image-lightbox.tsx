"use client";

import { useLenis } from "lenis/react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { clampOffset, type Offset, zoomToPoint } from "./zoom-math";

/**
 * Full-screen image viewer for the product gallery.
 *
 * The gallery's magnifier button had no `onClick` — it rendered, invited a
 * click, and did nothing, which is worse than not being there. On a shop selling
 * a £6,379 sauna, "let me look at that properly" is not a nice-to-have: it is the
 * question the photograph exists to answer.
 *
 * Zoom is 1x → 2.5x on click, anchored on the point clicked rather than the
 * centre, because the thing you want a closer look at is the thing you clicked.
 * Drag to pan once zoomed, wheel to zoom continuously, and every offset is
 * clamped so the image can never be flung off screen and lost.
 *
 * Lenis runs in `root` mode across the storefront with `smoothWheel` on, so it
 * would keep scrolling the page underneath this overlay and swallow the wheel
 * gestures meant for zooming. It is stopped for as long as the viewer is open.
 */

export interface LightboxImage {
  url: string;
  alt?: string;
}

const MAX_ZOOM = 4;
const CLICK_ZOOM = 2.5;

export function ImageLightbox({
  images,
  index,
  name,
  onClose,
  onIndexChange,
}: {
  images: LightboxImage[];
  index: number;
  name: string;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const lenis = useLenis();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState<Offset>({ x: 0, y: 0 });
  /**
   * The last pointer position lives in a ref (it changes on every move and must
   * not re-render), but *whether* a drag is happening is state, because it
   * decides whether the transform animates. Reading a ref during render is not
   * allowed and would go stale here anyway.
   */
  const lastPointer = React.useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const current = images[index] ?? images[0];
  const many = images.length > 1;

  /** Keeps the image overlapping the stage whatever the zoom or drag. */
  const clamp = React.useCallback((next: Offset, atZoom: number): Offset => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return next;
    return clampOffset(
      next,
      { width: rect.width, height: rect.height },
      atZoom,
    );
  }, []);

  const reset = React.useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const step = React.useCallback(
    (delta: number) => {
      reset();
      onIndexChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndexChange, reset],
  );

  // Stop Lenis while open. Body overflow alone is not enough: Lenis translates
  // the page itself and listens on window, so it would keep moving underneath.
  React.useEffect(() => {
    lenis?.stop();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      lenis?.start();
      document.body.style.overflow = overflow;
    };
  }, [lenis]);

  // Focus the dialog on open and hand focus back to whatever opened it.
  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          break;
        case "ArrowLeft":
          if (many) {
            event.preventDefault();
            step(-1);
          }
          break;
        case "ArrowRight":
          if (many) {
            event.preventDefault();
            step(1);
          }
          break;
        case "0":
          event.preventDefault();
          reset();
          break;
        case "+":
        case "=":
          event.preventDefault();
          setZoom((z) => Math.min(MAX_ZOOM, z + 0.5));
          break;
        case "-":
          event.preventDefault();
          setZoom((z) => {
            const next = Math.max(1, z - 0.5);
            if (next === 1) setOffset({ x: 0, y: 0 });
            return next;
          });
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [many, onClose, reset, step]);

  if (!current) return null;

  /** Click to zoom in on the point clicked; click again to zoom back out. */
  function onStageClick(event: React.MouseEvent) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (zoom > 1) {
      reset();
      return;
    }
    setZoom(CLICK_ZOOM);
    setOffset(
      zoomToPoint({
        point: { x: event.clientX - rect.left, y: event.clientY - rect.top },
        stage: { width: rect.width, height: rect.height },
        zoom: CLICK_ZOOM,
      }),
    );
  }

  function onPointerDown(event: React.PointerEvent) {
    if (zoom === 1) return;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    const from = lastPointer.current;
    if (!from) return;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    setOffset((prev) => clamp({ x: prev.x + dx, y: prev.y + dy }, zoom));
  }

  function endDrag() {
    lastPointer.current = null;
    setIsDragging(false);
  }

  function onWheel(event: React.WheelEvent) {
    event.preventDefault();
    setZoom((z) => {
      const next = Math.min(
        MAX_ZOOM,
        Math.max(1, z - event.deltaY * 0.0025 * z),
      );
      if (next === 1) setOffset({ x: 0, y: 0 });
      else setOffset((prev) => clamp(prev, next));
      return next;
    });
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — image ${index + 1} of ${images.length}`}
      tabIndex={-1}
      /* Opaque, not bg-black/95: this exists so a photograph can be examined,
         and the shop showing faintly through competes with the only thing on
         screen that matters. */
      className="fixed inset-0 z-[90] flex flex-col bg-black outline-none"
    >
      {/* Bar: counter, zoom state, close. */}
      <div className="flex shrink-0 items-center gap-3 px-4 py-3 text-white/70">
        <span className="font-mono text-[12px] tabular-nums">
          {index + 1} / {images.length}
        </span>
        <span className="hidden text-[12px] sm:block">
          {zoom > 1 ? "Drag to move · click to fit" : "Click the image to zoom"}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label={zoom > 1 ? "Zoom out" : "Zoom in"}
            onClick={() =>
              zoom > 1
                ? reset()
                : (setZoom(CLICK_ZOOM), setOffset({ x: 0, y: 0 }))
            }
          >
            {zoom > 1 ? (
              <ZoomOut className="size-5" strokeWidth={1.6} />
            ) : (
              <ZoomIn className="size-5" strokeWidth={1.6} />
            )}
          </IconButton>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-5" strokeWidth={1.6} />
          </IconButton>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center">
        {/* Clicking the backdrop closes; clicking the photo zooms. The photo is
            inside the stage, so the stage's own click handler does the zooming
            and this sits behind it. */}
        <button
          type="button"
          aria-label="Close image viewer"
          onClick={onClose}
          className="absolute inset-0 cursor-zoom-out"
          tabIndex={-1}
        />

        {many ? <NavButton side="left" onClick={() => step(-1)} /> : null}

        <div
          ref={stageRef}
          onClick={onStageClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          className="relative mx-auto size-full max-h-full max-w-[min(1400px,92vw)] touch-none overflow-hidden select-none"
          style={{ cursor: zoom > 1 ? "grab" : "zoom-in" }}
        >
          <div
            className="absolute inset-0 motion-safe:transition-transform motion-safe:duration-200"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              // No animation mid-drag, or the image lags behind the pointer.
              transitionProperty: isDragging ? "none" : undefined,
            }}
          >
            <Image
              // Keyed so switching photos does not briefly show the old one at
              // the new one's dimensions.
              key={current.url}
              src={current.url}
              alt={current.alt || name}
              fill
              priority
              sizes="100vw"
              className="object-contain"
              draggable={false}
            />
          </div>
        </div>

        {many ? <NavButton side="right" onClick={() => step(1)} /> : null}
      </div>

      {/* Thumbnails, so a long gallery is navigable without stepping through it. */}
      {many ? (
        <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 py-3">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => {
                reset();
                onIndexChange(i);
              }}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={`relative size-12 shrink-0 overflow-hidden rounded border transition-opacity ${
                i === index
                  ? "border-white opacity-100"
                  : "border-white/20 opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="60px"
                className="bg-white object-contain"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white ${
        side === "left" ? "left-2 sm:left-4" : "right-2 sm:right-4"
      }`}
    >
      {side === "left" ? (
        <ChevronLeft className="size-5" strokeWidth={1.8} />
      ) : (
        <ChevronRight className="size-5" strokeWidth={1.8} />
      )}
    </button>
  );
}
