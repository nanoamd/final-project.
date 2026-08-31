"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import {
  type ReturnStatus,
  TERMINAL_RETURN_STATUSES,
} from "@/server/hq/returns";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * The returns queue (docs/kaiku-hq-design.md §3 / migration 0006).
 *
 * The storefront already writes to this table — `server/actions/returns.ts`
 * runs `assessReturn` the moment a customer asks, and gives most of them an
 * immediate accept/review/decline. What did not exist until now is anywhere
 * to see the queue or move a return past that first assessment: `status` was
 * being set once, at creation, and never again. "A return's status is
 * Kaiku's to set" is the RLS comment on the table itself — this is that.
 */

const TERMINAL = TERMINAL_RETURN_STATUSES;

export interface HqReturn {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string | null;
  email: string;
  customerName: string | null;
  reason: string;
  detail: string | null;
  decision: "accept" | "review" | "decline";
  decisionNotes: string[];
  returnShippingPaidBy: "kaiku" | "customer";
  supplierWindowLikelyClosed: boolean;
  status: ReturnStatus;
  resolutionNote: string | null;
  refundAmount: number | null;
  createdAt: string;
  resolvedAt: string | null;
}

const SELECT =
  "id, return_number, order_id, email, customer_name, reason, detail, decision, decision_notes, return_shipping_paid_by, supplier_window_likely_closed, status, resolution_note, refund_amount, created_at, resolved_at, orders(order_number)";

interface Row {
  id: string;
  return_number: string;
  order_id: string;
  email: string;
  customer_name: string | null;
  reason: string;
  detail: string | null;
  decision: "accept" | "review" | "decline";
  decision_notes: unknown;
  return_shipping_paid_by: "kaiku" | "customer";
  supplier_window_likely_closed: boolean | null;
  status: ReturnStatus;
  resolution_note: string | null;
  refund_amount: number | null;
  created_at: string;
  resolved_at: string | null;
  orders:
    { order_number: string | null } | { order_number: string | null }[] | null;
}

function toReturn(row: Row): HqReturn {
  const orderRow = Array.isArray(row.orders) ? row.orders[0] : row.orders;
  return {
    id: row.id,
    returnNumber: row.return_number,
    orderId: row.order_id,
    orderNumber: orderRow?.order_number ?? null,
    email: row.email,
    customerName: row.customer_name,
    reason: row.reason,
    detail: row.detail,
    decision: row.decision,
    decisionNotes: Array.isArray(row.decision_notes)
      ? (row.decision_notes as string[])
      : [],
    returnShippingPaidBy: row.return_shipping_paid_by,
    supplierWindowLikelyClosed: Boolean(row.supplier_window_likely_closed),
    status: row.status,
    resolutionNote: row.resolution_note,
    refundAmount: row.refund_amount,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export interface ReturnLists {
  open: HqReturn[];
  resolved: HqReturn[];
}

const EMPTY: ReturnLists = { open: [], resolved: [] };

export async function listReturns(): Promise<ReturnLists> {
  if (!(await getAuthorizedAdmin())) return EMPTY;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("returns")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.warn("[returns] could not read returns:", error.message);
    return EMPTY;
  }

  const all = (data ?? []).map((row) => toReturn(row as unknown as Row));
  return {
    open: all.filter((r) => !TERMINAL.includes(r.status)),
    resolved: all.filter((r) => TERMINAL.includes(r.status)),
  };
}

export async function updateReturnStatus(formData: FormData): Promise<void> {
  if (!(await getAuthorizedAdmin())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ReturnStatus;
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 2000);
  const refundRaw = String(formData.get("refundAmount") ?? "").trim();
  if (!id || !status) return;

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("returns")
    .select("return_number, order_id, status")
    .eq("id", id)
    .single();
  if (!current) return;

  const update: Record<string, unknown> = { status };
  if (note) update.resolution_note = note;
  if (TERMINAL.includes(status)) update.resolved_at = new Date().toISOString();
  if (status === "refunded" && refundRaw) {
    const amount = Number(refundRaw);
    if (Number.isFinite(amount) && amount >= 0) update.refund_amount = amount;
  }

  await admin.from("returns").update(update).eq("id", id);

  await admin.from("order_events").insert({
    order_id: current.order_id,
    type: "note",
    title: `Return ${current.return_number} — ${current.status} → ${status}`,
    detail: note || null,
    actor: "admin",
  });

  revalidatePath("/admin/returns");
}
