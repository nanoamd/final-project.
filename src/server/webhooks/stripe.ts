import "server-only";

import type Stripe from "stripe";

import { siteConfig } from "@/config/site";
import { env } from "@/env";
import { getProductsBySlugs } from "@/lib/sanity/queries";
import type { OrderEmailData } from "@/server/emails/format";
import { buildOrderAlertEmail } from "@/server/emails/order-alert";
import { buildOrderConfirmationEmail } from "@/server/emails/order-confirmation";
import { sendBuiltEmail } from "@/server/emails/transport";
import { assignWorkflow } from "@/server/hq/workflows";
import { getStripe } from "@/server/stripe/client";
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
      // Deliberately after the order is safely persisted, and deliberately not
      // inside persistOrder's throwing path. Every send in sendOrderEmails is
      // fail-soft by contract, so a Resend outage logs and moves on — it must
      // never make this webhook answer 500, because Stripe would then retry a
      // charge that already succeeded and the shop would look broken over a
      // payment that worked.
      await sendOrderEmails(session, orderId, orderNumber, lineItems);
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

    await sendBuiltEmail(email, buildOrderConfirmationEmail(order));

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
