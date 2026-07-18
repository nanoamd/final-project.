import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Guided Buying" };

export default function GuidedBuyingPage() {
  return (
    <ComingSoon
      eyebrow="Coming next"
      title="Your personal shopping assistant"
      intro="Answer a few questions about your space, goals and budget, and we'll recommend a complete, tailored setup — and explain exactly why. This is coming soon."
    />
  );
}
