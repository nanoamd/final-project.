import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

// This route is currently a placeholder shell shared across several
// not-yet-built pages — noindexed until real content replaces it, to avoid
// several near-identical "coming soon" pages reading as duplicate content.
export const metadata: Metadata = {
  title: "Inspiration",
  robots: { index: false, follow: true },
};

export default function InspirationPage() {
  return (
    <ComingSoon
      eyebrow="Inspiration"
      title="Real spaces, thoughtfully finished"
      intro="A gathering of beautifully finished homes and the rituals built around them. We're curating it now."
    />
  );
}
