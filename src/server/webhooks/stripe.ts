import "server-only";

import type Stripe from "stripe";

/**
 * Processes a verified Stripe webhook event. Order persistence is
 * deliberately out of scope for this pass — Stripe's own dashboard is the
 * order record — this just acknowledges and logs the events that matter so
 * failures are visible, without pretending to write anywhere durable.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log(
        `[stripe] checkout completed: session=${session.id} amount=${session.amount_total} currency=${session.currency}`,
      );
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
