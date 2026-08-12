import { NextResponse } from "next/server";

import { env, requireEnv } from "@/env";
import { getStripe } from "@/server/stripe/client";
import { handleStripeEvent } from "@/server/webhooks/stripe";

/**
 * Verifies the Stripe signature against the raw request body, then delegates
 * to src/server/webhooks/stripe.ts. Signature verification requires the
 * exact raw bytes Stripe signed — reading via request.text() rather than
 * request.json() is what makes that possible.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      requireEnv(
        "STRIPE_WEBHOOK_SECRET",
        env.STRIPE_WEBHOOK_SECRET,
        "payment confirmations cannot be verified",
      ),
    );
  } catch (error) {
    console.error("[stripe webhook] signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    console.error("[stripe webhook] handler failed:", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
