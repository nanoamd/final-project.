"use client";

import dynamic from "next/dynamic";
import * as React from "react";

/**
 * A calculator embedded in the body of a buying guide.
 *
 * Damien: "the tools should also be in the buying guides so you can calculate
 * it on the same page." The guides give the arithmetic — two-thirds of the
 * furniture width, half to two-thirds of the arrangement height — and then
 * sent the reader to /tools to run it, which is a bounce dressed up as a link.
 *
 * Loaded lazily rather than imported statically. Even scoped to articles, a
 * static import would put all eight calculators into the client bundle of
 * every journal post and guide, most of which embed none of them.
 * `next/dynamic` inside a client component splits each into its own chunk,
 * fetched only when a page that actually embeds it is rendered.
 *
 * It lives in the article feature rather than in components/shared because a
 * shared component may not import its siblings, and this is a switch over
 * ten of them.
 */
const TOOLS = {
  "planter-size": {
    label: "Planter size and compost calculator",
    href: "/tools/planter-size-calculator",
    Component: dynamic(() =>
      import("@/components/shared/planter-size-calculator").then(
        (m) => m.PlanterSizeCalculator,
      ),
    ),
  },
  "pendant-light": {
    label: "Pendant light size and drop calculator",
    href: "/tools/pendant-light-size-calculator",
    Component: dynamic(() =>
      import("@/components/shared/pendant-light-calculator").then(
        (m) => m.PendantLightCalculator,
      ),
    ),
  },
  "mirror-size": {
    label: "Mirror size and hanging height calculator",
    href: "/tools/mirror-size-calculator",
    Component: dynamic(() =>
      import("@/components/shared/mirror-size-calculator").then(
        (m) => m.MirrorSizeCalculator,
      ),
    ),
  },
  "dining-space": {
    label: "Dining set space calculator",
    href: "/tools/dining-set-size-calculator",
    Component: dynamic(() =>
      import("@/components/shared/dining-space-calculator").then(
        (m) => m.DiningSpaceCalculator,
      ),
    ),
  },
  "patio-heat": {
    label: "Patio heater and fire pit output calculator",
    href: "/tools/patio-heater-size-calculator",
    Component: dynamic(() =>
      import("@/components/shared/patio-heat-calculator").then(
        (m) => m.PatioHeatCalculator,
      ),
    ),
  },
  "furniture-material": {
    label: "Garden furniture material selector",
    href: "/tools/garden-furniture-material-selector",
    Component: dynamic(() =>
      import("@/components/shared/furniture-material-selector").then(
        (m) => m.FurnitureMaterialSelector,
      ),
    ),
  },
  "wall-clock-size": {
    label: "Wall clock size and height calculator",
    href: "/tools/wall-clock-size-calculator",
    Component: dynamic(() =>
      import("@/components/shared/wall-clock-size-calculator").then(
        (m) => m.WallClockSizeCalculator,
      ),
    ),
  },
  "vase-size": {
    label: "Vase size and stem calculator",
    href: "/tools/vase-size-calculator",
    Component: dynamic(() =>
      import("@/components/shared/vase-size-calculator").then(
        (m) => m.VaseSizeCalculator,
      ),
    ),
  },
  "bed-size": {
    label: "Bed size and room fit calculator",
    href: "/tools/bed-size-calculator",
    Component: dynamic(() =>
      import("@/components/shared/bed-size-calculator").then(
        (m) => m.BedSizeCalculator,
      ),
    ),
  },
  "dining-table-space": {
    label: "Dining table size and seating calculator",
    href: "/tools/dining-table-size-calculator",
    Component: dynamic(() =>
      import("@/components/shared/dining-space-calculator").then(
        (m) => m.DiningSpaceCalculator,
      ),
    ),
  },
} as const;

export type GuideToolName = keyof typeof TOOLS;

export const GUIDE_TOOL_NAMES = Object.keys(TOOLS) as GuideToolName[];

export function guideToolLabel(name: string): string | null {
  return name in TOOLS ? TOOLS[name as GuideToolName].label : null;
}

export function GuideToolEmbed({
  tool,
  caption,
}: {
  tool: string;
  caption?: string;
}) {
  // An unknown name renders nothing rather than an error box. A guide is a
  // published document and a typo in it should cost a section, not the page.
  if (!(tool in TOOLS)) return null;
  const { label, href, Component } = TOOLS[tool as GuideToolName];

  return (
    <section className="border-line bg-paper my-10 rounded-2xl border p-6 sm:p-8">
      <p className="text-muted text-[12px] tracking-[0.14em] uppercase">
        Work it out here
      </p>
      <h3 className="font-display text-ink mt-2 text-xl tracking-tight">
        {caption ?? label}
      </h3>
      <div className="mt-6">
        <Component />
      </div>
      <a
        href={href}
        className="text-muted hover:text-ink mt-5 inline-block text-[13px] underline underline-offset-4 transition-colors"
      >
        Open the full {label.toLowerCase()}
      </a>
    </section>
  );
}
