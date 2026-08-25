import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { TrackPurchase } from "@/features/storefront/components/analytics/track-purchase";
import { ClearCartOnMount } from "@/features/storefront/components/content/clear-cart-on-mount";
import type { AnalyticsItem } from "@/lib/analytics/events";
import { formatPriceExact } from "@/lib/format";
import { getStripe } from "@/server/stripe/client";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let amount: number | null = null;
  let email: string | null = null;
  // The lines are read back from Stripe rather than from the basket, because
  // ClearCartOnMount empties the basket on this very page and the two would race.
  // Each line carries the product slug in its metadata (set in the checkout action),
  // which is the same identifier the Merchant feed uses — so GA4, Meta and Merchant
  // Centre all name the product the same way.
  let items: AnalyticsItem[] = [];
  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id, {
        expand: ["line_items.data.price.product"],
      });
      amount = session.amount_total ? session.amount_total / 100 : null;
      email = session.customer_details?.email ?? null;
      items = (session.line_items?.data ?? []).flatMap((line) => {
        const product = line.price?.product;
        if (!product || typeof product === "string" || product.deleted)
          return [];
        const slug = product.metadata?.slug;
        if (!slug) return [];
        return [
          {
            slug,
            name: product.name ?? slug,
            price: (line.price?.unit_amount ?? 0) / 100,
            quantity: line.quantity ?? 1,
            category: product.metadata?.category,
          },
        ];
      });
    } catch (error) {
      console.error("[checkout/success] failed to retrieve session:", error);
    }
  }

  return (
    <Container className="py-24 text-center md:py-32">
      <ClearCartOnMount />
      {session_id ? (
        <TrackPurchase
          orderId={session_id}
          items={items}
          value={amount ?? undefined}
        />
      ) : null}
      <CheckCircle2 className="text-brass mx-auto size-12" strokeWidth={1.3} />
      <h1 className="font-display text-ink mt-6 text-3xl tracking-tight sm:text-4xl">
        Thank you for your order
      </h1>
      <p className="text-muted mx-auto mt-3 max-w-md">
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
