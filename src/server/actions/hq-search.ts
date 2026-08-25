"use server";

import "server-only";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * Order lookup for the command palette.
 *
 * A server action rather than filtering a client-side list, because HQ's order
 * rows carry customer names, email addresses and totals — none of which should
 * be sitting in a browser bundle waiting to be searched. Every call re-checks
 * the admin gate: a server action is a public endpoint, and "only the admin UI
 * calls it" is not an authorisation model.
 */

export interface OrderSearchHit {
  id: string;
  orderNumber: string | null;
  email: string;
  customerName: string | null;
  amountTotal: number;
  stage: string;
}

export async function searchOrders(query: string): Promise<OrderSearchHit[]> {
  if (!(await getAuthorizedAdmin())) return [];

  const q = query.trim();
  if (q.length < 2) return [];

  // Escaped for PostgREST's `or` filter grammar, where a comma separates terms
  // and a bare `%` or `(` would break the expression rather than search for one.
  const safe = q.replace(/[,()\\%*]/g, " ").trim();
  if (!safe) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("id, order_number, email, customer_name, amount_total, stage")
    .or(
      `order_number.ilike.%${safe}%,email.ilike.%${safe}%,customer_name.ilike.%${safe}%`,
    )
    .order("created_at", { ascending: false })
    .limit(8);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    orderNumber: row.order_number ?? null,
    email: row.email ?? "",
    customerName: row.customer_name ?? null,
    amountTotal: row.amount_total ?? 0,
    stage: row.stage ?? "",
  }));
}
