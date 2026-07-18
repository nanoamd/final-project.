import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Inspiration" };

export default function InspirationPage() {
  return (
    <ComingSoon
      eyebrow="Inspiration"
      title="Real spaces, thoughtfully finished"
      intro="A gathering of beautifully finished homes and the rituals built around them. We're curating it now."
    />
  );
}
