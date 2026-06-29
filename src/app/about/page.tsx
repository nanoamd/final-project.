import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ComingSoon
      eyebrow="About"
      title="A knowledge-first retailer"
      intro="We're building the UK's most considered garden wellness platform — one where the advice is as carefully made as the products. More on our approach, and the people behind it, soon."
    />
  );
}
