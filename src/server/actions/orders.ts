import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface OrderLineItem {
  description: string | null;
  quantity: number | null;
  amountTotal: number | null;
}

export interface OrderSummary {
  id: string;
  createdAt: string;
  amountTotal: number;
  currency: string;
  status: string;
  lineItems: OrderLineItem[];
}

interface OrderRow {
  id: string;
  created_at: string;
  amount_total: number;
  currency: string;
  status: string;
  line_items: {
    description?: string | null;
    quantity?: number | null;
    amount_total?: number | null;
  }[];
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

  return (data as OrderRow[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    amountTotal: row.amount_total,
    currency: row.currency,
    status: row.status,
    lineItems: Array.isArray(row.line_items)
      ? row.line_items.map((li) => ({
          description: li.description ?? null,
          quantity: li.quantity ?? null,
          amountTotal: li.amount_total ?? null,
        }))
      : [],
  }));
}
