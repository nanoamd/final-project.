import * as React from "react";

import { BrandIllustration } from "@/components/ui/brand-illustration";
import { cn } from "@/lib/utils";
import type { IllustrationKind, SurfaceTone } from "@/types/catalog";

/**
 * A designed tonal surface that frames content at a fixed aspect ratio with a
 * subtle grain and a brand motif. It is the swap-ready stand-in for real
 * photography: replace the internals with <Image> later; callers don't change.
 */

const tones: Record<SurfaceTone, string> = {
  sand: "bg-sand text-ink/[0.13]",
  clay: "bg-clay text-ink/[0.15]",
  stone: "bg-stone text-ink/[0.18]",
  mist: "bg-mist text-ink/[0.11]",
  charcoal: "bg-charcoal text-canvas/[0.16]",
};

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export interface PlaceholderImageProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  illustration?: IllustrationKind;
  /** Tailwind aspect-ratio class, e.g. "aspect-[4/5]". */
  aspect?: string;
  /** Override the motif size/position. */
  motifClassName?: string;
  /** Hide the motif (e.g. a pure tonal field behind text). */
  hideMotif?: boolean;
}

export function PlaceholderImage({
  tone = "sand",
  illustration = "leaf",
  aspect = "aspect-[4/5]",
  motifClassName,
  hideMotif = false,
  className,
  children,
  ...props
}: PlaceholderImageProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden",
        tones[tone],
        aspect,
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
      {!hideMotif && (
        <div className="absolute inset-0 flex items-center justify-center p-[16%]">
          <BrandIllustration
            kind={illustration}
            className={cn("h-auto w-full max-w-[58%]", motifClassName)}
          />
        </div>
      )}
      {children ? (
        <div className="relative h-full w-full">{children}</div>
      ) : null}
    </div>
  );
}
