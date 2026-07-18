import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage() {
  return (
    <ComingSoon
      eyebrow="Compare"
      title="Side-by-side comparison"
      intro="Compare products across a category on the specifications that actually matter, laid out side by side. This tool is coming soon."
    />
  );
}
