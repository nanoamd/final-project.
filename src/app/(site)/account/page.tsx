import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <ComingSoon
      eyebrow="Account"
      title="Your orders and saved pieces"
      intro="Track your orders, save the products you're considering, and revisit past quotations — all in one place. Accounts are next on our roadmap; for now, checkout works as a guest and order confirmations are sent by email."
    />
  );
}
