import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Guided Buying" };

export default function GuidedBuyingPage() {
  return (
    <ComingSoon
      eyebrow="Coming next"
      title="A consultant in software form"
      intro="Answer a few questions about your space, goals and budget, and we'll recommend a complete, correctly-specified setup — and explain exactly why. This is the heart of the platform, and it's what we're building next."
    />
  );
}
