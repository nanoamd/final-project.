import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <ComingSoon
      eyebrow="The journal"
      title="In-depth guides, publishing soon"
      intro="Practical, jargon-free buying guides and editorial on saunas, cold therapy and building a wellness garden that lasts. This is where our knowledge base will live."
    />
  );
}
