"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import { sendStageEmail } from "@/server/emails/send-stage-email";
import { nextStage, stageLabel } from "@/server/hq/workflows";
import { createAdminClient } from "@/server/supabase/admin";

export interface HqOrderLineItem {
  description: string | null;
  quantity: number | null;
  amountTotal: number | null;
  slug: string | null;
  sku: string | null;
  category: string | null;
  supplier: string | null;
  selectedOptions: Record<string, string> | null;
}

export interface HqOrderEvent {
  id: string;
  type: string;
  stage: string | null;
  title: string;
  detail: string | null;
  actor: string;
  createdAt: string;
}

export interface HqOrderDetail {
  id: string;
  /** The readable "KH-1042" reference. Null on orders predating migration 0005. */
  orderNumber: string | null;
  createdAt: string;
  amountTotal: number;
  currency: string;
  status: string;
  email: string;
  phone: string | null;
  customerName: string | null;
  stage: string;
  workflow: string;
  flagged: boolean;
  promisedDispatchDate: string | null;
  promisedDeliveryDate: string | null;
  actualDispatchDate: string | null;
  actualDeliveryDate: string | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  tradeCostTotal: number | null;
  reviewRequestedAt: string | null;
  warrantyRegisteredAt: string | null;
  lineItems: HqOrderLineItem[];
  shippingAddress: {
    name: string;
    address: {
      line1: string | null;
      line2: string | null;
      city: string | null;
      postal_code: string | null;
      state: string | null;
      country: string | null;
    };
  } | null;
  events: HqOrderEvent[];
}

interface HqActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<boolean> {
  return (await getAuthorizedAdmin()) !== null;
}

export async function getOrderDetail(
  orderId: string,
): Promise<HqOrderDetail | null> {
  if (!(await requireAdmin())) return null;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error || !order) return null;

  const { data: events } = await admin
    .from("order_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  return {
    id: order.id,
    orderNumber: order.order_number ?? null,
    createdAt: order.created_at,
    amountTotal: order.amount_total,
    currency: order.currency,
    status: order.status,
    email: order.email,
    phone: order.phone ?? null,
    customerName: order.customer_name ?? null,
    stage: order.stage,
    workflow: order.workflow,
    flagged: order.flagged,
    promisedDispatchDate: order.promised_dispatch_date ?? null,
    promisedDeliveryDate: order.promised_delivery_date ?? null,
    actualDispatchDate: order.actual_dispatch_date ?? null,
    actualDeliveryDate: order.actual_delivery_date ?? null,
    trackingCarrier: order.tracking_carrier ?? null,
    trackingNumber: order.tracking_number ?? null,
    trackingUrl: order.tracking_url ?? null,
    tradeCostTotal: order.trade_cost_total ?? null,
    reviewRequestedAt: order.review_requested_at ?? null,
    warrantyRegisteredAt: order.warranty_registered_at ?? null,
    lineItems: Array.isArray(order.line_items) ? order.line_items : [],
    shippingAddress: order.shipping_address ?? null,
    events: (events ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      stage: e.stage ?? null,
      title: e.title,
      detail: e.detail ?? null,
      actor: e.actor,
      createdAt: e.created_at,
    })),
  };
}

async function writeEvent(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  event: {
    type: string;
    stage?: string;
    title: string;
    detail?: string;
  },
): Promise<void> {
  await admin.from("order_events").insert({
    order_id: orderId,
    type: event.type,
    stage: event.stage ?? null,
    title: event.title,
    detail: event.detail ?? null,
    actor: "admin",
  });
}

function revalidateOrder(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

/** Advances the order to the next stage in its assigned workflow. The
 * one-click contract from docs/kaiku-hq-design.md §3.3 — stage update +
 * timeline event in one action. Suggested-email drawer is a follow-up
 * build, not this one. */
export async function advanceOrderStage(
  orderId: string,
  customerNote?: string,
): Promise<HqActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized." };
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select("stage, workflow")
    .eq("id", orderId)
    .single();
  if (error || !order) return { ok: false, error: "Order not found." };

  const next = nextStage(order.workflow, order.stage);
  if (!next) {
    return { ok: false, error: "This order is already at its final stage." };
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({ stage: next })
    .eq("id", orderId);
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await writeEvent(admin, orderId, {
    type: "stage_change",
    stage: next,
    title: `Moved to ${stageLabel(next)}`,
  });

  // Tells the customer, if this is a stage they should hear about. Never
  // throws and never sends twice — see sendStageEmail. `note` becomes
  // {{customerNote}} in the email, and is recorded on the timeline below so
  // there is a record of exactly what the customer was told.
  const note = customerNote?.trim() || null;
  await sendStageEmail({
    admin,
    orderId,
    stage: next,
    context: note ? { note } : undefined,
  });
  if (note) {
    await writeEvent(admin, orderId, {
      type: "note",
      title: "Note included in the customer's email",
      detail: note,
    });
  }

  revalidateOrder(orderId);
  return { ok: true };
}

/** Jumps directly to any stage in the workflow (re-opening an earlier stage
 * after a mis-click, or setting an exception state like on_hold/cancelled/
 * refunded, which are reachable from anywhere). Always logged, so history
 * never quietly disappears. */
export async function setOrderStage(
  orderId: string,
  stage: string,
  customerNote?: string,
): Promise<HqActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized." };
  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from("orders")
    .update({ stage })
    .eq("id", orderId);
  if (updateError) return { ok: false, error: updateError.message };

  await writeEvent(admin, orderId, {
    type: "stage_change",
    stage,
    title: `Set to ${stageLabel(stage)}`,
  });

  // Jumping straight to cancelled/refunded/on_hold is exactly when the
  // customer most needs telling, so this path notifies as well — and it is
  // where the note matters most, since "cancelled" with no reason given is
  // worse than no email.
  const note = customerNote?.trim() || null;
  await sendStageEmail({
    admin,
    orderId,
    stage,
    context: note ? { note } : undefined,
  });
  if (note) {
    await writeEvent(admin, orderId, {
      type: "note",
      title: "Note included in the customer's email",
      detail: note,
    });
  }

  revalidateOrder(orderId);
  return { ok: true };
}

export async function addOrderNote(
  orderId: string,
  note: string,
): Promise<HqActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized." };
  if (!note.trim()) return { ok: false, error: "Note can't be empty." };
  const admin = createAdminClient();

  await writeEvent(admin, orderId, {
    type: "note",
    title: "Note added",
    detail: note.trim(),
  });

  revalidateOrder(orderId);
  return { ok: true };
}

export async function toggleOrderFlag(
  orderId: string,
  flagged: boolean,
): Promise<HqActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized." };
  const admin = createAdminClient();

  const { error } = await admin
    .from("orders")
    .update({ flagged })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await writeEvent(admin, orderId, {
    type: "edit",
    title: flagged ? "Flagged for attention" : "Flag cleared",
  });

  revalidateOrder(orderId);
  return { ok: true };
}

export async function setOrderTracking(
  orderId: string,
  input: { carrier: string; number: string; url?: string },
): Promise<HqActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized." };
  if (!input.carrier.trim() || !input.number.trim()) {
    return { ok: false, error: "Carrier and tracking number are required." };
  }
  const admin = createAdminClient();

  const { error } = await admin
    .from("orders")
    .update({
      tracking_carrier: input.carrier.trim(),
      tracking_number: input.number.trim(),
      tracking_url: input.url?.trim() || null,
      actual_dispatch_date: new Date().toISOString().slice(0, 10),
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await writeEvent(admin, orderId, {
    type: "edit",
    title: `Tracking added — ${input.carrier.trim()} ${input.number.trim()}`,
  });

  // Entering tracking is the moment a dispatch email becomes worth sending —
  // it is the first point at which there is something for the customer to
  // follow. Passing the values explicitly avoids racing the update above.
  await sendStageEmail({
    admin,
    orderId,
    stage: "tracking",
    context: {
      trackingCarrier: input.carrier.trim(),
      trackingNumber: input.number.trim(),
      trackingUrl: input.url?.trim() || null,
    },
  });

  revalidateOrder(orderId);
  return { ok: true };
}

export async function setPromisedDates(
  orderId: string,
  input: { dispatchDate?: string; deliveryDate?: string },
): Promise<HqActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized." };
  const admin = createAdminClient();

  const patch: Record<string, string> = {};
  if (input.dispatchDate) patch.promised_dispatch_date = input.dispatchDate;
  if (input.deliveryDate) patch.promised_delivery_date = input.deliveryDate;
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }

  const { error } = await admin.from("orders").update(patch).eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await writeEvent(admin, orderId, {
    type: "edit",
    title: "Delivery estimate updated",
  });

  revalidateOrder(orderId);
  return { ok: true };
}

export async function setWarrantyRegistered(
  orderId: string,
): Promise<HqActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized." };
  const admin = createAdminClient();

  const { error } = await admin
    .from("orders")
    .update({ warranty_registered_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await writeEvent(admin, orderId, {
    type: "edit",
    title: "Warranty registered",
  });

  revalidateOrder(orderId);
  return { ok: true };
}

export async function updateTradeCost(
  orderId: string,
  tradeCostTotal: number,
): Promise<HqActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "Unauthorized." };
  const admin = createAdminClient();

  const { error } = await admin
    .from("orders")
    .update({ trade_cost_total: tradeCostTotal })
    .eq("id", orderId);
  if (error) return { ok: false, error: error.message };

  await writeEvent(admin, orderId, {
    type: "edit",
    title: "Trade cost updated",
  });

  revalidateOrder(orderId);
  return { ok: true };
}
