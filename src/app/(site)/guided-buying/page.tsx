import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

// See inspiration/page.tsx — same placeholder-shell reasoning applies.
export const metadata: Metadata = {
  title: "Guided Buying",
  robots: { index: false, follow: true },
};

export default function GuidedBuyingPage() {
  return (
    <ComingSoon
      eyebrow="Coming next"
      title="Your personal shopping assistant"
      intro="Answer a few questions about your space, goals and budget, and we'll recommend a complete, tailored setup — and explain exactly why. This is coming soon."
    />
  );
}
