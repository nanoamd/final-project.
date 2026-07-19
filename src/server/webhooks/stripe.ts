import "server-only";

import type Stripe from "stripe";

import { stripe } from "@/server/stripe/client";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * Processes a verified Stripe webhook event. Stripe's own dashboard remains
 * the authoritative payment record; the `orders` table is a local, queryable
 * copy written here so signed-in customers can see their own order history.
 * Guest checkouts (no `client_reference_id`) still get a row, just with no
 * `user_id` — nobody can read it back until they have an account.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log(
        `[stripe] checkout completed: session=${session.id} amount=${session.amount_total} currency=${session.currency}`,
      );
      await persistOrder(session);
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      console.log(`[stripe] checkout expired: session=${session.id}`);
      break;
    }
    default:
      // Unhandled event types are expected — Stripe sends many more than we
      // act on. Acknowledging with 200 (see the route handler) is correct.
      break;
  }
}

async function persistOrder(session: Stripe.Checkout.Session): Promise<void> {
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
    });
    const admin = createAdminClient();
    const { error } = await admin.from("orders").upsert(
      {
        user_id: session.client_reference_id || null,
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
        email: session.customer_details?.email ?? "",
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? "gbp",
        status: "paid",
        line_items: lineItems.data.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          amount_total: item.amount_total,
        })),
        shipping_address: session.customer_details?.address ?? null,
      },
      { onConflict: "stripe_session_id" },
    );
    if (error) {
      console.error("[stripe webhook] failed to persist order:", error.message);
    }
  } catch (err) {
    console.error("[stripe webhook] persistOrder threw:", err);
  }
}
