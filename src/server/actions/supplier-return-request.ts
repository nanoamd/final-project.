"use server";

import "server-only";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import { sendBuiltEmail } from "@/server/emails/transport";
import { createAdminClient } from "@/server/supabase/admin";
import {
  getOrderableProducts,
  getSupplierContacts,
} from "@/server/suppliers/contacts";
import {
  buildSupplierReturnRequestEmail,
  type ReturnRequestItem,
  type ReturnRequestProblem,
  returnRequestProblems,
} from "@/server/suppliers/return-request";

/**
 * Notifying the supplier a customer's return exists — the half of "the
 * admin returns screen" that was still missing once the screen itself was
 * checked and found already built. Same two-step draft/send shape as
 * `supplier-orders.ts` for the same reason: an outward-facing message to a
 * trade supplier gets read before it goes.
 *
 * One draft per supplier, same as a purchase order — a return can only ever
 * be for the items on one order, but that order can span suppliers.
 */

export interface SupplierReturnRequestDraft {
  supplierName: string;
  supplierEmail: string | null;
  contactName: string | null;
  subject: string;
  html: string;
  text: string;
  problems: ReturnRequestProblem[];
  alreadySentAt: string | null;
  notes: string | null;
}

const EVENT_TYPE = "supplier_return_request";

export async function getSupplierReturnRequestDrafts(
  returnId: string,
): Promise<SupplierReturnRequestDraft[]> {
  if (!(await getAuthorizedAdmin())) return [];
  const admin = createAdminClient();

  const { data: ret, error: returnError } = await admin
    .from("returns")
    .select(
      "id, return_number, order_id, reason, detail, return_shipping_paid_by, photo_urls, created_at",
    )
    .eq("id", returnId)
    .single();
  if (returnError || !ret) return [];

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("order_number, customer_name, phone, shipping_address, line_items")
    .eq("id", ret.order_id)
    .single();
  if (orderError || !order) return [];

  const lineItems = Array.isArray(order.line_items)
    ? (order.line_items as {
        description?: string | null;
        quantity?: number | null;
        slug?: string | null;
        sku?: string | null;
        supplier?: string | null;
        selectedOptions?: Record<string, string> | null;
      }[])
    : [];
  if (!lineItems.length) return [];

  const products = await getOrderableProducts(
    lineItems.map((item) => item.slug ?? "").filter(Boolean),
  );

  const bySupplier = new Map<string, ReturnRequestItem[]>();
  for (const item of lineItems) {
    const product = item.slug ? products.get(item.slug) : undefined;
    const supplierName =
      item.supplier?.trim() || product?.supplierName?.trim() || "";
    const key = supplierName || "Unknown supplier";

    const existing = bySupplier.get(key) ?? [];
    existing.push({
      title: item.description?.trim() || product?.title || "Item",
      supplierSku: product?.supplierSku ?? null,
      kaikuSku: item.sku ?? product?.sku ?? null,
      quantity: item.quantity ?? 1,
      options: item.selectedOptions ?? null,
    });
    bySupplier.set(key, existing);
  }

  const contacts = await getSupplierContacts([...bySupplier.keys()]);

  const { data: sentEvents } = await admin
    .from("order_events")
    .select("title, detail, created_at")
    .eq("order_id", ret.order_id)
    .eq("type", EVENT_TYPE);

  const photoUrls = Array.isArray(ret.photo_urls)
    ? (ret.photo_urls as string[])
    : [];

  const drafts: SupplierReturnRequestDraft[] = [];
  for (const [supplierName, items] of bySupplier) {
    const contact = contacts.get(supplierName);
    const input = {
      supplierName,
      contactName: contact?.contactName ?? null,
      returnNumber: ret.return_number,
      orderNumber: order.order_number ?? ret.order_id,
      requestedAt: new Date(ret.created_at),
      reason: ret.reason,
      customerDetail: ret.detail,
      items,
      returnShippingPaidBy: ret.return_shipping_paid_by as "kaiku" | "customer",
      photoUrls,
      collectionAddress: order.shipping_address ?? null,
      customerName: order.customer_name ?? null,
      customerPhone: order.phone ?? null,
    };

    const built = buildSupplierReturnRequestEmail(input);
    const sent = (sentEvents ?? []).find((event) =>
      (event.detail ?? "").includes(`${ret.return_number} — ${supplierName}`),
    );

    drafts.push({
      supplierName,
      supplierEmail: contact?.email?.trim() || null,
      contactName: contact?.contactName ?? null,
      subject: built.subject,
      html: built.html,
      text: built.text,
      problems: returnRequestProblems(input),
      alreadySentAt: sent?.created_at ?? null,
      notes: contact?.notes ?? null,
    });
  }

  return drafts;
}

export interface SendSupplierReturnRequestResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function sendSupplierReturnRequest(
  returnId: string,
  supplierName: string,
): Promise<SendSupplierReturnRequestResult> {
  if (!(await getAuthorizedAdmin()))
    return { ok: false, error: "Not signed in." };

  const drafts = await getSupplierReturnRequestDrafts(returnId);
  const draft = drafts.find((entry) => entry.supplierName === supplierName);
  if (!draft)
    return { ok: false, error: `No lines on this return for ${supplierName}.` };

  if (!draft.supplierEmail) {
    return {
      ok: false,
      error: `No email address for ${supplierName}. Add one in Studio under Catalog → Suppliers, then reload this page.`,
    };
  }

  const blocking = draft.problems.find(
    (problem) => problem.kind === "missing-address",
  );
  if (blocking) return { ok: false, error: blocking.detail };

  await sendBuiltEmail(draft.supplierEmail, {
    subject: draft.subject,
    html: draft.html,
    text: draft.text,
  });

  const admin = createAdminClient();
  const { data: ret } = await admin
    .from("returns")
    .select("return_number, order_id")
    .eq("id", returnId)
    .single();
  if (!ret) return { ok: false, error: "That return no longer exists." };

  await admin.from("order_events").insert({
    order_id: ret.order_id,
    type: EVENT_TYPE,
    title: `Return request sent to ${supplierName}`,
    detail: `${ret.return_number} — ${supplierName} — ${draft.supplierEmail}. ${draft.subject}`,
    actor: "admin",
  });

  return {
    ok: true,
    message: `Sent to ${draft.supplierEmail}.`,
  };
}
