"use client";

import * as React from "react";

import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { cn } from "@/lib/utils";
import type { IllustrationKind, SurfaceTone } from "@/types/catalog";

const views: SurfaceTone[] = ["sand", "stone", "charcoal", "mist"];

export function ProductGallery({
  illustration,
  name,
}: {
  illustration: IllustrationKind;
  name: string;
}) {
  const [active, setActive] = React.useState(0);

  return (
    <div className="flex flex-col gap-4">
      <PlaceholderImage
        tone={views[active]}
        illustration={illustration}
        aspect="aspect-[4/5]"
      />
      <div className="grid grid-cols-4 gap-3">
        {views.map((tone, index) => (
          <button
            key={tone}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`${name} — view ${index + 1}`}
            aria-pressed={active === index}
            className={cn(
              "overflow-hidden border transition-colors",
              active === index ? "border-ink" : "border-transparent",
            )}
          >
            <PlaceholderImage
              tone={tone}
              illustration={illustration}
              aspect="aspect-square"
              motifClassName="max-w-[52%]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
