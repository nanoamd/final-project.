"use server";

import "server-only";

import { createAdminClient } from "@/server/supabase/admin";

export interface PublicOrderEvent {
  stage: string;
  title: string;
  createdAt: string;
}

export interface PublicOrderLineItem {
  description: string | null;
  quantity: number | null;
}

export interface PublicOrderStatus {
  id: string;
  /** The readable "KH-1042" reference. Null only for orders predating it. */
  orderNumber: string | null;
  createdAt: string;
  stage: string;
  workflow: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  promisedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  lineItems: PublicOrderLineItem[];
  events: PublicOrderEvent[];
}

/**
 * Public order status, keyed by the order's UUID alone — no login required.
 * Checkout now requires an account, so the owner can always reach this from
 * /account/orders, but the link is also emailed and gets forwarded, opened on
 * a phone that is not signed in, and pasted to whoever is waiting in for the
 * delivery. The UUID has enough entropy to serve as a bearer token (the same
 * pattern Shopify's order-status pages use) — which is also why the *readable*
 * order number is never the key here: "KH-1042" is guessable, and the page it
 * unlocks is somebody's address and delivery date.
 *
 * The query below is still deliberately narrow: only stage/
 * tracking/line-item-description fields are selected, and only
 * `stage_change` events are returned. Trade cost, margin, internal notes,
 * and the customer's own admin-facing edit history never reach this action,
 * regardless of what the admin client could otherwise read.
 */
export async function getPublicOrderStatus(
  orderId: string,
): Promise<PublicOrderStatus | null> {
  if (!orderId) return null;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_number, created_at, stage, workflow, tracking_carrier, tracking_number, tracking_url, promised_delivery_date, actual_delivery_date, line_items",
    )
    .eq("id", orderId)
    .single();
  if (error || !order) return null;

  const { data: events } = await admin
    .from("order_events")
    .select("stage, title, created_at, type")
    .eq("order_id", orderId)
    .eq("type", "stage_change")
    .order("created_at", { ascending: true });

  return {
    id: order.id,
    orderNumber: order.order_number ?? null,
    createdAt: order.created_at,
    stage: order.stage,
    workflow: order.workflow,
    trackingCarrier: order.tracking_carrier ?? null,
    trackingNumber: order.tracking_number ?? null,
    trackingUrl: order.tracking_url ?? null,
    promisedDeliveryDate: order.promised_delivery_date ?? null,
    actualDeliveryDate: order.actual_delivery_date ?? null,
    lineItems: Array.isArray(order.line_items)
      ? order.line_items.map(
          (item: {
            description?: string | null;
            quantity?: number | null;
          }) => ({
            description: item.description ?? null,
            quantity: item.quantity ?? null,
          }),
        )
      : [],
    events: (events ?? []).map((e) => ({
      stage: e.stage ?? "",
      title: e.title,
      createdAt: e.created_at,
    })),
  };
}
