"use server";

import "server-only";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import {
  assessOrders,
  attentionCounts,
  type AttentionItem,
  type AttentionOrder,
} from "@/server/hq/attention";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * Feeds the attention rules with real order data.
 *
 * The rules themselves are a pure function in `hq/attention.ts`; this is the
 * only part that touches the database, which is what keeps them testable.
 *
 * Two facts the `orders` table does not hold are derived from the timeline
 * instead: whether a purchase order has been sent, and whether the supplier has
 * confirmed. Both are events, not states — the point of an append-only timeline
 * is that "has this happened" is a question you ask of history rather than a
 * column somebody has to remember to update.
 */

export interface AttentionSummary {
  items: AttentionItem[];
  counts: { critical: number; warning: number; due: number; total: number };
}

const EMPTY: AttentionSummary = {
  items: [],
  counts: { critical: 0, warning: 0, due: 0, total: 0 },
};

export async function getAttention(): Promise<AttentionSummary> {
  if (!(await getAuthorizedAdmin())) return EMPTY;
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select(
      "id, order_number, email, customer_name, amount_total, created_at, stage, flagged, promised_dispatch_date, promised_delivery_date, actual_delivery_date, tracking_number, review_requested_at, line_items",
    )
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(300);

  if (!orders?.length) return EMPTY;

  const { data: events } = await admin
    .from("order_events")
    .select("order_id, type, stage, detail, created_at")
    .in(
      "order_id",
      orders.map((order) => order.id),
    )
    .in("type", ["supplier_order", "stage_change"])
    .order("created_at", { ascending: true });

  // Purchase orders sent, per order, keyed by the supplier named in the event.
  const posByOrder = new Map<string, Set<string>>();
  const firstPoAt = new Map<string, string>();
  const confirmedAt = new Map<string, string>();

  for (const event of events ?? []) {
    if (event.type === "supplier_order") {
      const set = posByOrder.get(event.order_id) ?? new Set<string>();
      // The event detail is "<supplier> — <email>. <subject>"; the supplier name
      // is everything before the em dash.
      const supplier = (event.detail ?? "").split("—")[0]?.trim();
      if (supplier) set.add(supplier);
      posByOrder.set(event.order_id, set);
      if (!firstPoAt.has(event.order_id))
        firstPoAt.set(event.order_id, event.created_at);
      continue;
    }
    // A supplier confirming is recorded as reaching that stage.
    if (
      event.stage === "supplier_confirmed" &&
      !confirmedAt.has(event.order_id)
    ) {
      confirmedAt.set(event.order_id, event.created_at);
    }
  }

  const assessable: AttentionOrder[] = orders.map((order) => {
    const suppliers = suppliersOn(order.line_items);
    const ordered = posByOrder.get(order.id) ?? new Set<string>();
    const awaiting = suppliers.filter((name) => !ordered.has(name));

    return {
      id: order.id,
      orderNumber: order.order_number ?? null,
      email: order.email ?? null,
      customerName: order.customer_name ?? null,
      amountTotal: order.amount_total ?? 0,
      createdAt: order.created_at,
      stage: order.stage,
      flagged: Boolean(order.flagged),
      promisedDispatchDate: order.promised_dispatch_date ?? null,
      promisedDeliveryDate: order.promised_delivery_date ?? null,
      actualDeliveryDate: order.actual_delivery_date ?? null,
      trackingNumber: order.tracking_number ?? null,
      reviewRequestedAt: order.review_requested_at ?? null,
      // An order with no identifiable supplier cannot be "fully ordered", so it
      // stays on the list rather than passing silently.
      purchaseOrderSent: suppliers.length > 0 && awaiting.length === 0,
      suppliersAwaitingOrder: awaiting,
      supplierNotifiedAt: firstPoAt.get(order.id) ?? null,
      supplierConfirmedAt: confirmedAt.get(order.id) ?? null,
    };
  });

  const items = assessOrders(assessable);
  return { items, counts: attentionCounts(items) };
}

/** The distinct supplier names on an order's line items. */
function suppliersOn(lineItems: unknown): string[] {
  if (!Array.isArray(lineItems)) return [];
  const names = new Set<string>();
  for (const item of lineItems) {
    const supplier = (item as { supplier?: unknown }).supplier;
    if (typeof supplier === "string" && supplier.trim())
      names.add(supplier.trim());
  }
  return [...names];
}

/**
 * Just the counts, for the nav badge.
 *
 * Its own function so the shared layout does not pay for the full assessment on
 * every admin page load — though it does run the same rules, because a badge
 * that disagrees with the list it links to is worse than no badge.
 */
export async function getAttentionCounts(): Promise<
  AttentionSummary["counts"]
> {
  const { counts } = await getAttention();
  return counts;
}
