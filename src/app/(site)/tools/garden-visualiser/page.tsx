import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { GardenVisualiserTool } from "@/features/garden-visualiser";

export const metadata: Metadata = {
  title: "AI Garden Visualiser",
  description:
    "Upload a photo of your garden and see it redesigned with a sauna, hot tub or decking.",
};

export default function GardenVisualiserPage() {
  return (
    <Container className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <Eyebrow>Tools</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          AI Garden Visualiser
        </h1>
        <p className="text-muted mt-6 text-lg leading-relaxed text-pretty">
          Upload a photo of your garden, pick a style, and see it redesigned in
          seconds.
        </p>

        <div className="mt-12">
          <GardenVisualiserTool />
        </div>
      </div>
    </Container>
  );
}
