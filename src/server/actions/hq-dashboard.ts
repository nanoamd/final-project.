"use server";

import "server-only";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import { stageLabel } from "@/server/hq/workflows";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * The "needs action" list used to be computed here, with two rules
 * (unacknowledged, flagged). It now lives in `hq/attention.ts`, which covers
 * both of those and six more, and is pure and tested. Two implementations of
 * "what needs doing" would drift, and the one on screen would not be the one
 * anybody trusted.
 */
export interface DashboardPulseItem {
  title: string;
  createdAt: string;
  orderId: string | null;
}

export interface DashboardData {
  revenueThisMonth: number;
  ordersThisMonth: number;
  aov: number;
  pulse: DashboardPulseItem[];
  pipeline: { stage: string; label: string; count: number }[];
}

const EMPTY: DashboardData = {
  revenueThisMonth: 0,
  ordersThisMonth: 0,
  aov: 0,
  pulse: [],
  pipeline: [],
};

export async function getDashboardData(): Promise<DashboardData> {
  const authorizedAdmin = await getAuthorizedAdmin();
  if (!authorizedAdmin) return EMPTY;

  const admin = createAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthOrders } = await admin
    .from("orders")
    .select("amount_total")
    .eq("status", "paid")
    .gte("created_at", monthStart.toISOString());

  const revenueThisMonth = (monthOrders ?? []).reduce(
    (sum, o) => sum + (o.amount_total ?? 0),
    0,
  );
  const ordersThisMonth = (monthOrders ?? []).length;
  const aov = ordersThisMonth > 0 ? revenueThisMonth / ordersThisMonth : 0;

  const { data: allOrders } = await admin
    .from("orders")
    .select("id, created_at, stage")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(200);

  const pipeline: { stage: string; label: string; count: number }[] = [];
  const stageCounts = new Map<string, number>();
  for (const order of allOrders ?? []) {
    stageCounts.set(order.stage, (stageCounts.get(order.stage) ?? 0) + 1);
  }
  for (const [stage, count] of stageCounts.entries()) {
    pipeline.push({ stage, label: stageLabel(stage), count });
  }
  pipeline.sort((a, b) => b.count - a.count);

  const { data: events } = await admin
    .from("order_events")
    .select("title, created_at, order_id")
    .order("created_at", { ascending: false })
    .limit(15);

  return {
    revenueThisMonth,
    ordersThisMonth,
    aov,
    pulse: (events ?? []).map((e) => ({
      title: e.title,
      createdAt: e.created_at,
      orderId: e.order_id,
    })),
    pipeline,
  };
}
