"use server";

import "server-only";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * Customers (docs/kaiku-hq-design.md §4.6).
 *
 * "No separate CRM database... a customer = the union of everything keyed by
 * their email." The design doc names a `v_customers` view to materialise
 * that; it does not exist yet (no migration creates it), and adding one means
 * asking Damien to run SQL he isn't around to run mid-flow. This computes the
 * same union in application code instead — a few more queries per page load
 * against tables that are already small, against a view that needs a
 * migration before this page can even render.
 */

export interface CustomerListRow {
  email: string;
  name: string | null;
  orderCount: number;
  ltv: number;
  lastOrderAt: string | null;
  subscriber: boolean;
  openTickets: number;
}

export async function listCustomers(): Promise<CustomerListRow[]> {
  if (!(await getAuthorizedAdmin())) return [];
  const admin = createAdminClient();

  const { data: orders, error } = await admin
    .from("orders")
    .select("email, customer_name, amount_total, created_at")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.warn("[customers] could not read orders:", error.message);
    return [];
  }

  const byEmail = new Map<string, CustomerListRow>();
  for (const order of orders ?? []) {
    if (!order.email) continue;
    const key = order.email.toLowerCase();
    const existing = byEmail.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.ltv += order.amount_total ?? 0;
      if (!existing.name && order.customer_name)
        existing.name = order.customer_name;
    } else {
      byEmail.set(key, {
        email: order.email,
        name: order.customer_name ?? null,
        orderCount: 1,
        ltv: order.amount_total ?? 0,
        lastOrderAt: order.created_at,
        subscriber: false,
        openTickets: 0,
      });
    }
  }

  const emails = [...byEmail.keys()];
  if (emails.length === 0) return [];

  const [{ data: subscribers }, { data: tickets }] = await Promise.all([
    admin
      .from("subscribers")
      .select("email")
      .is("unsubscribed_at", null)
      .in(
        "email",
        emails.map((e) => byEmail.get(e)!.email),
      ),
    admin
      .from("tickets")
      .select("customer_email, status")
      .in("status", ["open", "waiting_customer", "waiting_supplier"])
      .in(
        "customer_email",
        emails.map((e) => byEmail.get(e)!.email),
      ),
  ]);

  for (const sub of subscribers ?? []) {
    const row = byEmail.get(sub.email.toLowerCase());
    if (row) row.subscriber = true;
  }
  for (const ticket of tickets ?? []) {
    if (!ticket.customer_email) continue;
    const row = byEmail.get(ticket.customer_email.toLowerCase());
    if (row) row.openTickets += 1;
  }

  return [...byEmail.values()].sort((a, b) => b.ltv - a.ltv);
}

export interface CustomerOrderRow {
  id: string;
  orderNumber: string | null;
  amountTotal: number;
  createdAt: string;
  stage: string;
}

export interface CustomerTicketRow {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
}

export interface CustomerDetail {
  email: string;
  name: string | null;
  orders: CustomerOrderRow[];
  tickets: CustomerTicketRow[];
  ltv: number;
  subscriber: boolean;
}

export async function getCustomerDetail(
  email: string,
): Promise<CustomerDetail | null> {
  if (!(await getAuthorizedAdmin())) return null;
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, amount_total, created_at, stage, customer_name")
    .eq("email", email)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (!orders?.length) {
    // A customer might exist only as a ticket or subscriber, with no order —
    // check before declaring them not found.
    const { data: ticketOnly } = await admin
      .from("tickets")
      .select("id")
      .eq("customer_email", email)
      .limit(1);
    if (!ticketOnly?.length) return null;
  }

  const { data: tickets } = await admin
    .from("tickets")
    .select("id, subject, status, created_at")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });

  const { data: subscriber } = await admin
    .from("subscribers")
    .select("email")
    .eq("email", email)
    .is("unsubscribed_at", null)
    .maybeSingle();

  return {
    email,
    name: orders?.[0]?.customer_name ?? null,
    orders: (orders ?? []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      amountTotal: o.amount_total ?? 0,
      createdAt: o.created_at,
      stage: o.stage,
    })),
    tickets: (tickets ?? []).map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      createdAt: t.created_at,
    })),
    ltv: (orders ?? []).reduce((sum, o) => sum + (o.amount_total ?? 0), 0),
    subscriber: Boolean(subscriber),
  };
}
