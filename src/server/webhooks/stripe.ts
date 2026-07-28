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

/**
 * Deliberately does NOT catch its own errors. Stripe automatically retries a
 * webhook delivery (with backoff, for up to 3 days) whenever the endpoint
 * responds with a non-2xx status — letting a genuine failure here propagate
 * up to the route handler's 500 response is what makes that retry actually
 * happen. Swallowing it here would mean a transient Supabase/Stripe hiccup
 * silently loses the order from this table forever, with Stripe's dashboard
 * as the only remaining record.
 */
async function persistOrder(session: Stripe.Checkout.Session): Promise<void> {
  // Expanding the line item's product surfaces the metadata (slug, sku,
  // category, supplier) attached at checkout — see checkout.ts — so an
  // order can be fulfilled by looking up the real Sanity product/supplier
  // instead of parsing a free-text description by hand.
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ["data.price.product"],
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
      phone: session.customer_details?.phone ?? null,
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? "gbp",
      status: "paid",
      line_items: lineItems.data.map((item) => {
        const product =
          item.price && typeof item.price.product === "object"
            ? (item.price.product as Stripe.Product)
            : null;
        const metadata = product?.metadata ?? {};
        return {
          description: item.description,
          quantity: item.quantity,
          amount_total: item.amount_total,
          slug: metadata.slug || null,
          sku: metadata.sku || null,
          category: metadata.category || null,
          supplier: metadata.supplier || null,
          selectedOptions: metadata.selectedOptions
            ? (JSON.parse(metadata.selectedOptions) as Record<string, string>)
            : null,
        };
      }),
      shipping_address: session.collected_information?.shipping_details ?? null,
    },
    { onConflict: "stripe_session_id" },
  );
  if (error) {
    throw new Error(
      `Failed to persist order for session ${session.id}: ${error.message}`,
    );
  }
}
