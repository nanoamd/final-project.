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
  buildPurchaseOrderEmail,
  type PurchaseOrderItem,
  type PurchaseOrderProblem,
  purchaseOrderProblems,
} from "@/server/suppliers/purchase-order";

/**
 * Placing the order with the supplier — the last step in the chain that was
 * still done from memory, by hand, per order.
 *
 * "one place to track all orders easily then quickly order it by pressing a
 * link". Deliberately two steps rather than one: `getSupplierOrderDrafts` shows
 * exactly what will be sent and what is wrong with it, and `sendSupplierOrder`
 * sends it. A purchase order is an outward-facing commitment to a trade
 * supplier — a wrong one costs money and credibility, so it gets read before it
 * goes, and problems are surfaced rather than hidden.
 *
 * One draft per supplier, because an order can span two (a sauna and an
 * accessory), and each supplier only ever sees their own lines.
 */

export interface SupplierOrderDraft {
  supplierName: string;
  /** Where it will be sent. Null means the supplier has no email in Studio. */
  supplierEmail: string | null;
  contactName: string | null;
  subject: string;
  html: string;
  text: string;
  /** Things that will cause the supplier to come back with a query. */
  problems: PurchaseOrderProblem[];
  /** When this supplier was already sent this order, from the timeline. */
  alreadySentAt: string | null;
  /** Supplier notes from Studio — order portals, minimum order terms. */
  notes: string | null;
}

/** The timeline event type recording a sent purchase order. */
const PO_EVENT_TYPE = "supplier_order";

export async function getSupplierOrderDrafts(
  orderId: string,
): Promise<SupplierOrderDraft[]> {
  if (!(await getAuthorizedAdmin())) return [];
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_number, created_at, customer_name, phone, shipping_address, line_items",
    )
    .eq("id", orderId)
    .single();
  if (error || !order) return [];

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

  // supplierSku is not in the order snapshot, so it comes from Sanity by slug.
  const products = await getOrderableProducts(
    lineItems.map((item) => item.slug ?? "").filter(Boolean),
  );

  // Group by supplier. The snapshot's supplier name is preferred over Sanity's
  // current one: if a product changed supplier after the order was placed, the
  // order was placed with the old one.
  const bySupplier = new Map<string, PurchaseOrderItem[]>();
  for (const item of lineItems) {
    const product = item.slug ? products.get(item.slug) : undefined;
    const supplierName =
      item.supplier?.trim() || product?.supplierName?.trim() || "";
    // No supplier recorded means nobody to order from — surfaced under a named
    // bucket rather than silently dropped, so the gap is visible on the page.
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
    .eq("order_id", orderId)
    .eq("type", PO_EVENT_TYPE);

  const drafts: SupplierOrderDraft[] = [];
  for (const [supplierName, items] of bySupplier) {
    const contact = contacts.get(supplierName);
    const input = {
      supplierName,
      contactName: contact?.contactName ?? null,
      orderNumber: order.order_number ?? order.id,
      placedAt: new Date(order.created_at),
      items,
      deliveryAddress: order.shipping_address ?? null,
      customerName: order.customer_name ?? null,
      customerPhone: order.phone ?? null,
    };

    const built = buildPurchaseOrderEmail(input);
    const sent = (sentEvents ?? []).find((event) =>
      (event.detail ?? "").includes(supplierName),
    );

    drafts.push({
      supplierName,
      supplierEmail: contact?.email?.trim() || null,
      contactName: contact?.contactName ?? null,
      subject: built.subject,
      html: built.html,
      text: built.text,
      problems: purchaseOrderProblems(input),
      alreadySentAt: sent?.created_at ?? null,
      notes: contact?.notes ?? null,
    });
  }

  return drafts;
}

export interface SendSupplierOrderResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function sendSupplierOrder(
  orderId: string,
  supplierName: string,
): Promise<SendSupplierOrderResult> {
  if (!(await getAuthorizedAdmin()))
    return { ok: false, error: "Not signed in." };

  const drafts = await getSupplierOrderDrafts(orderId);
  const draft = drafts.find((entry) => entry.supplierName === supplierName);
  if (!draft)
    return { ok: false, error: `No lines on this order for ${supplierName}.` };

  if (!draft.supplierEmail) {
    return {
      ok: false,
      error: `No email address for ${supplierName}. Add one in Studio under Catalog → Suppliers, then reload this page.`,
    };
  }

  // A missing delivery address is the one problem that makes the order
  // meaningless rather than merely awkward, so it blocks. The others are
  // warnings the operator has already seen in the draft.
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
  await admin.from("order_events").insert({
    order_id: orderId,
    type: PO_EVENT_TYPE,
    title: `Purchase order sent to ${supplierName}`,
    // The address is recorded as well as the name: "we ordered it" is worth
    // less than "we ordered it, and here is where that went".
    detail: `${supplierName} — ${draft.supplierEmail}. ${draft.subject}`,
    actor: "admin",
  });

  return {
    ok: true,
    message: `Sent to ${draft.supplierEmail}.`,
  };
}
