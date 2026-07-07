import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Request a Quote" };

export default function QuotePage() {
  return (
    <ComingSoon
      eyebrow="Request a quote"
      title="A considered, no-obligation quotation"
      intro="Tell us about your space and how you intend to use it, and we'll prepare a complete, correctly-specified quotation. The full request flow is being built next."
    />
  );
}
