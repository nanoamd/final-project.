import "server-only";

import { siteConfig } from "@/config/site";
import { getProductsBySlugs } from "@/lib/sanity/queries";
import type { createAdminClient } from "@/server/supabase/admin";

import type { OrderEmailData } from "./format";
import { emailKeyForStage, type StageContext } from "./order-stage";
import { resolveStageEmail } from "./resolve-email";
import { sendBuiltEmail } from "./transport";

/**
 * Emails the customer about a stage change, if that stage is one they should
 * hear about.
 *
 * Three properties matter more than the copy:
 *
 * **It never throws.** A stage change is a database fact the operator has
 * already committed; an email problem must not turn a successful "mark as
 * dispatched" into an error and leave Damien unsure what happened. Everything
 * is inside one try/catch, and `sendBuiltEmail` swallows its own failures too.
 *
 * **It never sends twice.** Stages get set and re-set — a mis-click corrected,
 * an order moved back a step and forward again. Without a guard the customer
 * gets "your order is on its way" three times. Before sending, this looks for an
 * `email_sent` event already recorded against this order for this stage, and
 * stops if it finds one.
 *
 * **It leaves a record.** A successful send writes an `email_sent` event onto
 * the order's timeline, so the admin page shows what the customer was actually
 * told and when — which is the difference between an operator who knows where
 * things stand and one who guesses.
 */
export async function sendStageEmail({
  admin,
  orderId,
  stage,
  context = {},
}: {
  admin: ReturnType<typeof createAdminClient>;
  orderId: string;
  stage: string;
  context?: StageContext;
}): Promise<void> {
  try {
    const templateKey = emailKeyForStage(stage);
    // Internal stage — the customer hears nothing, by design.
    if (!templateKey) return;

    const { data: alreadySent } = await admin
      .from("order_events")
      .select("id")
      .eq("order_id", orderId)
      .eq("type", "email_sent")
      .eq("stage", stage)
      .maybeSingle();
    if (alreadySent) return;

    const { data: order, error } = await admin
      .from("orders")
      .select(
        "id, order_number, email, customer_name, phone, amount_total, currency, line_items, shipping_address, created_at, tracking_carrier, tracking_number, tracking_url, promised_delivery_date",
      )
      .eq("id", orderId)
      .single();
    if (error || !order?.email) return;

    const rawLines = Array.isArray(order.line_items) ? order.line_items : [];
    const slugs = rawLines
      .map((item: { slug?: string | null }) => item.slug)
      .filter((slug: unknown): slug is string => typeof slug === "string");
    // Lead times come from Sanity per product, verbatim — never invented. A
    // product we cannot resolve simply contributes none.
    const products = slugs.length ? await getProductsBySlugs(slugs) : [];
    const leadTimeBySlug = new Map(
      products.map((product) => [
        product.slug,
        product.deliveryLeadTime ?? null,
      ]),
    );

    const emailData: OrderEmailData = {
      orderId: order.id as string,
      orderNumber: (order.order_number as string | null) ?? null,
      placedAt: new Date(order.created_at as string),
      customerName: (order.customer_name as string | null) ?? null,
      customerEmail: order.email as string,
      customerPhone: (order.phone as string | null) ?? null,
      amountTotal: (order.amount_total as number) ?? 0,
      currency: (order.currency as string) ?? "gbp",
      items: rawLines.map(
        (item: {
          description?: string | null;
          quantity?: number | null;
          amount_total?: number | null;
          slug?: string | null;
          sku?: string | null;
          supplier?: string | null;
          selectedOptions?: Record<string, string> | null;
        }) => ({
          description: item.description ?? null,
          quantity: item.quantity ?? null,
          amountTotal: item.amount_total ?? null,
          leadTime: item.slug ? (leadTimeBySlug.get(item.slug) ?? null) : null,
          slug: item.slug ?? null,
          sku: item.sku ?? null,
          supplier: item.supplier ?? null,
          selectedOptions: item.selectedOptions ?? null,
        }),
      ),
      shippingAddress:
        (order.shipping_address as OrderEmailData["shippingAddress"]) ?? null,
      siteUrl: siteConfig.url,
    };

    const fullContext: StageContext = {
      trackingCarrier:
        context.trackingCarrier ?? (order.tracking_carrier as string | null),
      trackingNumber:
        context.trackingNumber ?? (order.tracking_number as string | null),
      trackingUrl: context.trackingUrl ?? (order.tracking_url as string | null),
      promisedDeliveryDate:
        context.promisedDeliveryDate ??
        (order.promised_delivery_date as string | null),
      note: context.note ?? null,
    };

    // Exactly what /admin/emails previews — one resolver, so the preview can
    // never drift from what actually reaches a customer.
    const resolved = await resolveStageEmail({
      stage,
      order: emailData,
      context: fullContext,
    });
    if (!resolved) return;
    const { built, source } = resolved;

    await sendBuiltEmail(emailData.customerEmail, built);

    await admin.from("order_events").insert({
      order_id: orderId,
      type: "email_sent",
      stage,
      title: `Emailed the customer: ${built.subject}`,
      detail:
        source === "studio"
          ? "Sent using your Studio template."
          : "Sent using the built-in template.",
      actor: "system",
    });
  } catch (err) {
    // Logged, never rethrown — see the note at the top.
    console.error(
      `[email] stage notification failed for order ${orderId} at stage ${stage}`,
      err,
    );
  }
}
