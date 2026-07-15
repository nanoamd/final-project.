import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Checkout Cancelled" };

export default function CheckoutCancelPage() {
  return (
    <Container className="py-24 text-center md:py-32">
      <h1 className="font-display text-ink text-3xl tracking-tight sm:text-4xl">
        Checkout cancelled
      </h1>
      <p className="text-muted mt-3">
        No payment was taken. Your basket is still here whenever you&rsquo;re ready.
      </p>
      <AppLink
        href="/cart"
        className="bg-ink text-canvas mt-8 inline-flex h-12 items-center justify-center rounded-lg px-8 text-[12px] font-semibold tracking-[0.14em] uppercase"
      >
        Back to Basket
      </AppLink>
    </Container>
  );
}
