import * as React from "react";

import { cn } from "@/lib/utils";
import type { IllustrationKind } from "@/types/catalog";

/**
 * Minimal line-art motifs used as art direction while product photography is
 * pending. Drawn with `currentColor` so the parent surface controls the stroke
 * tone. These are honest illustrations — not stand-ins pretending to be photos.
 */
export function BrandIllustration({
  kind,
  className,
  ...props
}: { kind: IllustrationKind } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-full w-full", className)}
      {...props}
    >
      {motifs[kind]}
    </svg>
  );
}

const motifs: Record<IllustrationKind, React.ReactNode> = {
  sauna: (
    <>
      <path d="M44 96 L120 48 L196 96" />
      <path d="M64 96 V164 H176 V96" />
      <rect x="104" y="120" width="32" height="44" />
      <rect x="78" y="112" width="22" height="22" />
      <path d="M88 164 V178 M152 164 V178" />
    </>
  ),
  barrel: (
    <>
      <ellipse cx="72" cy="104" rx="16" ry="46" />
      <path d="M72 58 H168 M72 150 H168" />
      <ellipse cx="168" cy="104" rx="16" ry="46" />
      <circle cx="168" cy="104" r="23" />
      <path d="M92 150 V166 M148 150 V166" />
    </>
  ),
  plunge: (
    <>
      <rect x="58" y="78" width="124" height="84" rx="16" />
      <path d="M74 104 q14 -9 28 0 t28 0 t28 0" />
      <path d="M74 124 q14 -9 28 0 t28 0 t28 0" />
    </>
  ),
  heater: (
    <>
      <rect x="82" y="92" width="76" height="80" />
      <circle cx="100" cy="90" r="6" />
      <circle cx="120" cy="86" r="6" />
      <circle cx="140" cy="90" r="6" />
      <path d="M104 70 q-6 -8 0 -16 M120 66 q-6 -8 0 -16 M136 70 q-6 -8 0 -16" />
      <path d="M82 150 H158" />
    </>
  ),
  chiller: (
    <>
      <rect x="70" y="80" width="100" height="82" rx="6" />
      <circle cx="128" cy="121" r="24" />
      <circle cx="128" cy="121" r="3" />
      <path d="M82 98 H104 M82 110 H100 M82 122 H96" />
    </>
  ),
  leaf: (
    <>
      <path d="M120 40 C162 72 162 132 120 166 C78 132 78 72 120 40 Z" />
      <path d="M120 56 V152" />
      <path d="M120 92 L98 78 M120 92 L142 78 M120 118 L100 106 M120 118 L140 106" />
    </>
  ),
};
