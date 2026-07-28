import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAuthorizedAdmin } from "@/server/auth/admin";
import { createAdminClient } from "@/server/supabase/admin";

export interface OrderLineItem {
  description: string | null;
  quantity: number | null;
  amountTotal: number | null;
  slug: string | null;
  sku: string | null;
  category: string | null;
  supplier: string | null;
  selectedOptions: Record<string, string> | null;
}

export interface OrderShippingAddress {
  name: string;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    postal_code: string | null;
    state: string | null;
    country: string | null;
  };
}

export interface OrderSummary {
  id: string;
  createdAt: string;
  amountTotal: number;
  currency: string;
  status: string;
  email: string;
  stage: string;
  flagged: boolean;
  lineItems: OrderLineItem[];
  shippingAddress: OrderShippingAddress | null;
  phone: string | null;
}

interface OrderRow {
  id: string;
  created_at: string;
  amount_total: number;
  currency: string;
  status: string;
  email: string;
  stage: string;
  flagged: boolean;
  line_items: {
    description?: string | null;
    quantity?: number | null;
    amount_total?: number | null;
    slug?: string | null;
    sku?: string | null;
    category?: string | null;
    supplier?: string | null;
    selectedOptions?: Record<string, string> | null;
  }[];
  shipping_address: OrderShippingAddress | null;
  phone: string | null;
}

function toOrderSummary(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    createdAt: row.created_at,
    amountTotal: row.amount_total,
    currency: row.currency,
    status: row.status,
    email: row.email,
    stage: row.stage,
    flagged: row.flagged,
    lineItems: Array.isArray(row.line_items)
      ? row.line_items.map((li) => ({
          description: li.description ?? null,
          quantity: li.quantity ?? null,
          amountTotal: li.amount_total ?? null,
          slug: li.slug ?? null,
          sku: li.sku ?? null,
          category: li.category ?? null,
          supplier: li.supplier ?? null,
          selectedOptions: li.selectedOptions ?? null,
        }))
      : [],
    shippingAddress: row.shipping_address ?? null,
    phone: row.phone ?? null,
  };
}

export async function listOrders(): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as OrderRow[]).map(toOrderSummary);
}

/**
 * All orders, for the admin dashboard — not scoped to a signed-in customer.
 * Re-checks admin authorization itself (not just the /admin/(protected)
 * layout gate) since this uses the service-role client, which bypasses RLS.
 */
export async function listAllOrdersForAdmin(): Promise<OrderSummary[]> {
  if (!(await getAuthorizedAdmin())) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return (data as OrderRow[]).map(toOrderSummary);
}
