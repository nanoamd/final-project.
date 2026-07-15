import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { ClearCartOnMount } from "@/features/storefront/components/content/clear-cart-on-mount";
import { formatPriceExact } from "@/lib/format";
import { stripe } from "@/server/stripe/client";

export const metadata: Metadata = { title: "Order Confirmed" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let amount: number | null = null;
  let email: string | null = null;
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      amount = session.amount_total ? session.amount_total / 100 : null;
      email = session.customer_details?.email ?? null;
    } catch (error) {
      console.error("[checkout/success] failed to retrieve session:", error);
    }
  }

  return (
    <Container className="py-24 text-center md:py-32">
      <ClearCartOnMount />
      <CheckCircle2 className="text-brass mx-auto size-12" strokeWidth={1.3} />
      <h1 className="font-display text-ink mt-6 text-3xl tracking-tight sm:text-4xl">
        Thank you for your order
      </h1>
      <p className="text-muted mt-3 max-w-md mx-auto">
        {email
          ? `A confirmation has been sent to ${email}.`
          : "Your order has been placed."}
        {amount ? ` Total: ${formatPriceExact(amount)}.` : ""}
      </p>
      <AppLink
        href="/shop"
        className="bg-ink text-canvas mt-8 inline-flex h-12 items-center justify-center rounded-lg px-8 text-[12px] font-semibold tracking-[0.14em] uppercase"
      >
        Continue Shopping
      </AppLink>
    </Container>
  );
}
