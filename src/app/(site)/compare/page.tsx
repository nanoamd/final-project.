import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Compare" };

export default function ComparePage() {
  return (
    <ComingSoon
      eyebrow="Compare"
      title="Honest, side-by-side comparison"
      intro="Compare saunas, heaters and cold therapy on the specifications that actually matter — never weighted by who pays the most. In development."
    />
  );
}
