import "server-only";

import type Stripe from "stripe";

import { siteConfig } from "@/config/site";
import { env } from "@/env";
import {
  formatMinimum,
  SECOND_ORDER_MINIMUM_PENCE,
  shouldOfferSecondOrderDiscount,
} from "@/lib/commerce/second-order-offer";
import { getProductsBySlugs } from "@/lib/sanity/queries";
import { absoluteUrl, type OrderEmailData } from "@/server/emails/format";
import { buildOrderAlertEmail } from "@/server/emails/order-alert";
import {
  resolveConfirmationEmail,
  resolveSecondOrderOfferEmail,
} from "@/server/emails/resolve-email";
import {
  buildSecondOrderOfferEmail,
  type SecondOrderOfferData,
} from "@/server/emails/second-order-offer";
import { sendBuiltEmail } from "@/server/emails/transport";
import { assignWorkflow } from "@/server/hq/workflows";
import { getStripe } from "@/server/stripe/client";
import { issueSecondOrderCode } from "@/server/stripe/second-order-offer";
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
      const { orderId, orderNumber, lineItems } = await persistOrder(session);
      // Stamps the order number onto the payment itself, so Stripe's own
      // Transactions list reads "Kaiku KH-1000" instead of a raw pi_ id. Same
      // fail-soft rule as the emails below: a failure here must never make this
      // webhook answer non-2xx, because Stripe would retry a charge that has
      // already succeeded.
      await labelPayment(session, orderId, orderNumber, lineItems);
      // Deliberately after the order is safely persisted, and deliberately not
      // inside persistOrder's throwing path. Every send in sendOrderEmails is
      // fail-soft by contract, so a Resend outage logs and moves on — it must
      // never make this webhook answer 500, because Stripe would then retry a
      // charge that already succeeded and the shop would look broken over a
      // payment that worked.
      await sendOrderEmails(session, orderId, orderNumber, lineItems);
      // After the confirmation, not instead of it — see
      // maybeSendSecondOrderOffer for why this is deliberately a second,
      // later-feeling email rather than folded into the receipt.
      await maybeSendSecondOrderOffer(session, orderId, orderNumber);
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
async function persistOrder(session: Stripe.Checkout.Session): Promise<{
  orderId: string;
  orderNumber: string | null;
  lineItems: MappedLineItem[];
}> {
  // Expanding the line item's product surfaces the metadata (slug, sku,
  // category, supplier) attached at checkout — see checkout.ts — so an
  // order can be fulfilled by looking up the real Sanity product/supplier
  // instead of parsing a free-text description by hand.
  const lineItems = await getStripe().checkout.sessions.listLineItems(
    session.id,
    { limit: 100, expand: ["data.price.product"] },
  );
  const mappedLineItems = lineItems.data.map((item) => {
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
  });

  const admin = createAdminClient();
  const { data: orderRow, error } = await admin
    .from("orders")
    .upsert(
      {
        user_id: session.client_reference_id || null,
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
        email: session.customer_details?.email ?? "",
        phone: session.customer_details?.phone ?? null,
        customer_name: session.customer_details?.name ?? null,
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? "gbp",
        status: "paid",
        stage: "paid",
        workflow: assignWorkflow(mappedLineItems.map((item) => item.category)),
        line_items: mappedLineItems,
        shipping_address:
          session.collected_information?.shipping_details ?? null,
      },
      { onConflict: "stripe_session_id" },
    )
    .select("id, order_number")
    .single();
  if (error || !orderRow) {
    throw new Error(
      `Failed to persist order for session ${session.id}: ${error?.message}`,
    );
  }

  // Seeds the order's timeline — the first entry a real customer's order
  // will ever have, and what makes the order detail page's stepper start
  // from a real event instead of an empty list. Unlike the upsert above,
  // `order_events` has no unique constraint to key an upsert off — guard
  // with a lookup instead, so a genuine Stripe retry of an already-processed
  // event (e.g. our 200 response was lost in transit) doesn't insert a
  // second "Order placed and paid" entry on the same order's timeline.
  const { data: existingEvent, error: lookupError } = await admin
    .from("order_events")
    .select("id")
    .eq("order_id", orderRow.id)
    .eq("stage", "paid")
    .eq("type", "stage_change")
    .maybeSingle();
  if (lookupError) {
    throw new Error(
      `Failed to check existing order_event for session ${session.id}: ${lookupError.message}`,
    );
  }
  if (!existingEvent) {
    const { error: eventError } = await admin.from("order_events").insert({
      order_id: orderRow.id,
      type: "stage_change",
      stage: "paid",
      title: "Order placed and paid",
      actor: "stripe",
    });
    if (eventError) {
      throw new Error(
        `Failed to write initial order_event for session ${session.id}: ${eventError.message}`,
      );
    }
  }

  return {
    orderId: orderRow.id as string,
    // Generated by the column default in migration 0005 and read straight back,
    // so the confirmation email can quote it without a second query.
    orderNumber: (orderRow.order_number as string | null) ?? null,
    lineItems: mappedLineItems,
  };
}

/**
 * Writes the Kaiku order number back onto the Stripe PaymentIntent.
 *
 * Damien, looking at Stripe's Transactions list: "order numbers should show here
 * too". Without this the Description column shows the payment intent id —
 * `pi_3U6FWWB6fKxUzUPh05AeN0ur` — which is unmatchable against anything in
 * /admin/orders without opening both and comparing timestamps.
 *
 * Done here rather than at checkout because the order number does not exist
 * until the order row does; the alternative, reserving a number before payment,
 * would burn a number on every abandoned basket.
 *
 * Metadata as well as the description: the description is what the list shows,
 * and the metadata is what Stripe's search box can actually find. Searching
 * "KH-1000" in Stripe now lands on the payment.
 */
async function labelPayment(
  session: Stripe.Checkout.Session,
  orderId: string,
  orderNumber: string | null,
  lineItems: MappedLineItem[],
): Promise<void> {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!paymentIntentId || !orderNumber) return;

  // The first item, so the row says what was bought as well as which order it
  // was. Stripe truncates the column, hence the number first.
  const firstItem = lineItems[0]?.description?.trim();
  const description = firstItem
    ? `Kaiku ${orderNumber} — ${firstItem}`
    : `Kaiku ${orderNumber}`;

  try {
    await getStripe().paymentIntents.update(paymentIntentId, {
      description,
      metadata: {
        kaiku_order_number: orderNumber,
        kaiku_order_id: orderId,
        kaiku_admin_url: `${siteConfig.url}/admin/orders/${orderId}`,
      },
    });
  } catch (error) {
    // Cosmetic. The order is already saved and the customer is already being
    // emailed; a failure to relabel the payment is not worth a retried webhook.
    console.error(
      `[stripe] could not label payment ${paymentIntentId} with ${orderNumber}`,
      error,
    );
  }
}

/** The line-item shape persistOrder writes into `orders.line_items`. */
interface MappedLineItem {
  description: string | null;
  quantity: number | null;
  amount_total: number | null;
  slug: string | null;
  sku: string | null;
  category: string | null;
  supplier: string | null;
  selectedOptions: Record<string, string> | null;
}

/**
 * The customer's confirmation and the owner's alert.
 *
 * Never throws: `sendBuiltEmail` swallows and logs its own failures, and the two
 * things that could throw here — the Sanity lookup and the email build — are inside
 * a try/catch for the same reason. An order that has been paid for and persisted
 * must not be re-delivered by Stripe because an email failed.
 *
 * Lead times come from Sanity, per product, verbatim. They are not in the Stripe
 * metadata, and they must not be guessed: telling a customer "2-5 days" for a piece
 * that takes eight weeks is the single easiest way to earn a chargeback. A product
 * we cannot resolve gets `null`, which the template renders as a promise to confirm
 * rather than as a date.
 */
async function sendOrderEmails(
  session: Stripe.Checkout.Session,
  orderId: string,
  orderNumber: string | null,
  lineItems: MappedLineItem[],
): Promise<void> {
  try {
    const email = session.customer_details?.email;
    if (!email) {
      console.warn(
        `[stripe] session ${session.id} has no customer email — no confirmation sent`,
      );
      return;
    }

    const slugs = lineItems
      .map((item) => item.slug)
      .filter((slug): slug is string => Boolean(slug));
    const products = slugs.length ? await getProductsBySlugs(slugs) : [];
    const leadTimeBySlug = new Map(
      products.map((product) => [
        product.slug,
        product.deliveryLeadTime ?? null,
      ]),
    );

    const order: OrderEmailData = {
      orderId,
      orderNumber,
      placedAt: new Date(),
      customerName: session.customer_details?.name ?? null,
      customerEmail: email,
      customerPhone: session.customer_details?.phone ?? null,
      amountTotal: session.amount_total ?? 0,
      currency: session.currency ?? "gbp",
      items: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        amountTotal: item.amount_total,
        leadTime: item.slug ? (leadTimeBySlug.get(item.slug) ?? null) : null,
        slug: item.slug,
        sku: item.sku,
        supplier: item.supplier,
        selectedOptions: item.selectedOptions,
      })),
      shippingAddress:
        (session.collected_information?.shipping_details as
          OrderEmailData["shippingAddress"] | undefined) ?? null,
      siteUrl: siteConfig.url,
    };

    // Through the resolver, so a confirmation template written in Studio wins
    // over the built-in one. Falls back to built-in on its own.
    const { built } = await resolveConfirmationEmail(order);
    await sendBuiltEmail(email, built);

    // The owner alert is a separate send on purpose: if the customer's address
    // bounces, Damien should still learn that a sale happened.
    if (env.ADMIN_EMAIL)
      await sendBuiltEmail(env.ADMIN_EMAIL, buildOrderAlertEmail(order), {
        replyTo: email,
      });
    else
      console.warn(
        "[stripe] ADMIN_EMAIL is not set — no owner alert sent for a paid order",
      );
  } catch (error) {
    console.error(
      `[stripe] failed to send order emails for session ${session.id}`,
      error,
    );
  }
}

/**
 * Sends the second-order offer, exactly once, after a customer's first order.
 *
 * The brief: *"Prompt customers to create an account to receive 10% off
 * their second order... Position it as: Join the Kaiku community."* Damien
 * later put a floor under it: *"the second order discount is fine, as long
 * as its on orders over £100"* — see `lib/commerce/second-order-offer.ts` for
 * why that floor is what makes the arithmetic survive a 20% margin.
 *
 * Guarded on the **count of this user's paid orders**, not on account
 * creation, because sign-in is required to check out at all now — every
 * order already has an account behind it, so "created an account" is no
 * longer a distinct moment to reward. The count includes the order this very
 * webhook call just wrote, so `=== 1` means "this is their first ever".
 *
 * Fail-soft in the same way as `sendOrderEmails`, and for the same reason: a
 * Stripe or Resend failure here must never make this webhook answer non-2xx,
 * or a charge that already succeeded gets retried.
 */
async function maybeSendSecondOrderOffer(
  session: Stripe.Checkout.Session,
  orderId: string,
  orderNumber: string | null,
): Promise<void> {
  try {
    const userId = session.client_reference_id || null;
    const email = session.customer_details?.email;
    if (!userId || !email) return;

    const admin = createAdminClient();
    const { count, error } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "paid");
    if (error) {
      console.error(
        `[stripe] could not count orders for user ${userId}:`,
        error,
      );
      return;
    }

    if (
      !shouldOfferSecondOrderDiscount({
        userId,
        ordersByThisUser: count ?? 0,
      })
    ) {
      return;
    }

    const offer = await issueSecondOrderCode(orderNumber);
    if (!offer) return;

    const customerName = session.customer_details?.name ?? null;
    const data: SecondOrderOfferData = {
      customerName,
      code: offer.code,
      minimumPence: SECOND_ORDER_MINIMUM_PENCE,
      percentOff: offer.percentOff,
      siteUrl: siteConfig.url,
    };

    // Through the resolver, exactly like the order confirmation above, so a
    // template written in Studio wins over the built-in copy and falls back
    // to it automatically otherwise.
    const { built } = await resolveSecondOrderOfferEmail(
      {
        customerName: customerName ?? "there",
        code: offer.code,
        minimum: formatMinimum(SECOND_ORDER_MINIMUM_PENCE),
        percentOff: String(offer.percentOff),
        shopUrl: absoluteUrl(siteConfig.url, "/shop"),
      },
      () => buildSecondOrderOfferEmail(data),
    );
    await sendBuiltEmail(email, built);
  } catch (error) {
    console.error(
      `[stripe] failed to send the second-order offer for session ${session.id} (order ${orderId})`,
      error,
    );
  }
}
