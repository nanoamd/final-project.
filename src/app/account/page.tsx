import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <ComingSoon
      eyebrow="Account"
      title="Your saved briefs and quotes"
      intro="Save the products you're considering, return to your guided-buying brief, and track quotations. Accounts arrive alongside checkout."
    />
  );
}
