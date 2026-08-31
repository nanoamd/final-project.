"use server";

import "server-only";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * The money truth GA4 can't show, because GA4 doesn't know trade costs.
 * Design: docs/kaiku-hq-design.md §4.11. "Database: entirely v_orders_flat,
 * v_daily_revenue, abandoned_checkouts. Zero new infrastructure" — this reads
 * exactly those three, already created by migration 0003.
 *
 * Figures are gross, in pence throughout (matching `orders.amount_total`),
 * converted to pounds only at render time — the same convention as every
 * other HQ money figure.
 */

export type Period = "7d" | "30d" | "90d" | "12m";

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

export interface Money {
  revenue: number;
  grossProfit: number;
  orders: number;
  aov: number;
}

export interface AnalyticsData {
  period: Period;
  current: Money;
  previous: Money;
  dailyRevenue: { day: string; revenue: number; grossProfit: number }[];
  productsByRevenue: ProductRow[];
  productsByGrossProfit: ProductRow[];
  categories: CategoryRow[];
  abandoned: {
    count: number;
    value: number;
    withEmail: number;
    recovered: number;
    recoveredValue: number;
  };
  customers: { new: number; returning: number };
}

export interface ProductRow {
  slug: string;
  description: string | null;
  unitsSold: number;
  revenue: number;
  grossProfit: number;
}

export interface CategoryRow {
  category: string;
  revenue: number;
  grossProfit: number;
  unitsSold: number;
}

const EMPTY_MONEY: Money = { revenue: 0, grossProfit: 0, orders: 0, aov: 0 };
const EMPTY: AnalyticsData = {
  period: "30d",
  current: EMPTY_MONEY,
  previous: EMPTY_MONEY,
  dailyRevenue: [],
  productsByRevenue: [],
  productsByGrossProfit: [],
  categories: [],
  abandoned: {
    count: 0,
    value: 0,
    withEmail: 0,
    recovered: 0,
    recoveredValue: 0,
  },
  customers: { new: 0, returning: 0 },
};

interface FlatRow {
  order_id: string;
  created_at: string;
  email: string | null;
  description: string | null;
  slug: string | null;
  category: string | null;
  quantity: number;
  line_amount_total: number;
  line_gross_profit: number;
}

export async function getAnalytics(
  period: Period = "30d",
): Promise<AnalyticsData> {
  if (!(await getAuthorizedAdmin())) return { ...EMPTY, period };
  const admin = createAdminClient();

  const days = PERIOD_DAYS[period];
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);

  const { data: rows, error } = await admin
    .from("v_orders_flat")
    .select(
      "order_id, created_at, email, description, slug, category, quantity, line_amount_total, line_gross_profit",
    )
    .gte("created_at", prevStart.toISOString())
    .limit(20000);

  if (error) {
    console.warn("[analytics] could not read v_orders_flat:", error.message);
    return { ...EMPTY, period };
  }

  const flat = (rows ?? []) as FlatRow[];
  const currentRows = flat.filter((r) => new Date(r.created_at) >= start);
  const previousRows = flat.filter((r) => new Date(r.created_at) < start);

  const current = summarise(currentRows);
  const previous = summarise(previousRows);

  const { data: dailyRows } = await admin
    .from("v_daily_revenue")
    .select("day, revenue, gross_profit")
    .gte("day", start.toISOString().slice(0, 10))
    .order("day", { ascending: true });

  const dailyRevenue = (dailyRows ?? []).map((d) => ({
    day: d.day,
    revenue: d.revenue ?? 0,
    grossProfit: d.gross_profit ?? 0,
  }));

  const byProduct = new Map<string, ProductRow>();
  const byCategory = new Map<string, CategoryRow>();
  for (const row of currentRows) {
    if (row.slug) {
      const p = byProduct.get(row.slug) ?? {
        slug: row.slug,
        description: row.description,
        unitsSold: 0,
        revenue: 0,
        grossProfit: 0,
      };
      p.unitsSold += row.quantity ?? 1;
      p.revenue += row.line_amount_total ?? 0;
      p.grossProfit += row.line_gross_profit ?? 0;
      byProduct.set(row.slug, p);
    }
    const categoryName = row.category || "Uncategorised";
    const c = byCategory.get(categoryName) ?? {
      category: categoryName,
      revenue: 0,
      grossProfit: 0,
      unitsSold: 0,
    };
    c.revenue += row.line_amount_total ?? 0;
    c.grossProfit += row.line_gross_profit ?? 0;
    c.unitsSold += row.quantity ?? 1;
    byCategory.set(categoryName, c);
  }

  const products = [...byProduct.values()];
  const productsByRevenue = [...products]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 25);
  const productsByGrossProfit = [...products]
    .sort((a, b) => b.grossProfit - a.grossProfit)
    .slice(0, 25);
  const categories = [...byCategory.values()].sort(
    (a, b) => b.revenue - a.revenue,
  );

  const { data: abandonedRows } = await admin
    .from("abandoned_checkouts")
    .select("email, amount_total, recovered_order_id, created_at")
    .gte("created_at", start.toISOString())
    .limit(5000);

  const abandonedList = abandonedRows ?? [];
  const recoveredList = abandonedList.filter((a) => a.recovered_order_id);
  const abandoned = {
    count: abandonedList.length,
    value: abandonedList.reduce((sum, a) => sum + (a.amount_total ?? 0), 0),
    withEmail: abandonedList.filter((a) => a.email).length,
    recovered: recoveredList.length,
    recoveredValue: recoveredList.reduce(
      (sum, a) => sum + (a.amount_total ?? 0),
      0,
    ),
  };

  const customers = await newVsReturning(admin, currentRows, start);

  return {
    period,
    current,
    previous,
    dailyRevenue,
    productsByRevenue,
    productsByGrossProfit,
    categories,
    abandoned,
    customers,
  };
}

function summarise(rows: FlatRow[]): Money {
  const orderIds = new Set(rows.map((r) => r.order_id));
  const revenue = rows.reduce((sum, r) => sum + (r.line_amount_total ?? 0), 0);
  const grossProfit = rows.reduce(
    (sum, r) => sum + (r.line_gross_profit ?? 0),
    0,
  );
  const orders = orderIds.size;
  return {
    revenue,
    grossProfit,
    orders,
    aov: orders > 0 ? revenue / orders : 0,
  };
}

async function newVsReturning(
  admin: ReturnType<typeof createAdminClient>,
  currentRows: FlatRow[],
  periodStart: Date,
): Promise<{ new: number; returning: number }> {
  const emails = [
    ...new Set(currentRows.map((r) => r.email).filter(Boolean)),
  ] as string[];
  if (emails.length === 0) return { new: 0, returning: 0 };

  const { data: earliest } = await admin
    .from("orders")
    .select("email, created_at")
    .eq("status", "paid")
    .in("email", emails)
    .order("created_at", { ascending: true });

  const firstOrderAt = new Map<string, string>();
  for (const row of earliest ?? []) {
    if (!row.email) continue;
    if (!firstOrderAt.has(row.email))
      firstOrderAt.set(row.email, row.created_at);
  }

  let newCount = 0;
  let returningCount = 0;
  for (const email of emails) {
    const first = firstOrderAt.get(email);
    if (first && new Date(first) >= periodStart) newCount += 1;
    else returningCount += 1;
  }
  return { new: newCount, returning: returningCount };
}
