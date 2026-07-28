"use server";

import "server-only";

import { env } from "@/env";
import { createClient } from "@/lib/supabase/server";
import { stageLabel } from "@/server/hq/workflows";
import { createAdminClient } from "@/server/supabase/admin";

export interface DashboardNeedsAction {
  orderId: string;
  label: string;
  detail: string;
}

export interface DashboardPulseItem {
  title: string;
  createdAt: string;
  orderId: string | null;
}

export interface DashboardData {
  revenueThisMonth: number;
  ordersThisMonth: number;
  aov: number;
  needsAction: DashboardNeedsAction[];
  pulse: DashboardPulseItem[];
  pipeline: { stage: string; label: string; count: number }[];
}

const EMPTY: DashboardData = {
  revenueThisMonth: 0,
  ordersThisMonth: 0,
  aov: 0,
  needsAction: [],
  pulse: [],
  pipeline: [],
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = env.ADMIN_EMAIL;
  const authorized =
    !!user?.email &&
    !!adminEmail &&
    user.email.toLowerCase() === adminEmail.toLowerCase();
  if (!authorized) return EMPTY;

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
    .select("id, email, created_at, stage, flagged")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(200);

  const needsAction: DashboardNeedsAction[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  for (const order of allOrders ?? []) {
    const ageMs = Date.now() - new Date(order.created_at).getTime();
    if ((order.stage === "paid" || order.stage === "review") && ageMs > dayMs) {
      needsAction.push({
        orderId: order.id,
        label: "Unacknowledged order",
        detail: `${order.email || "Guest"} — placed ${Math.floor(ageMs / dayMs)}d ago`,
      });
    }
    if (order.flagged) {
      needsAction.push({
        orderId: order.id,
        label: "Flagged for attention",
        detail: order.email || "Guest",
      });
    }
  }

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
    needsAction: needsAction.slice(0, 10),
    pulse: (events ?? []).map((e) => ({
      title: e.title,
      createdAt: e.created_at,
      orderId: e.order_id,
    })),
    pipeline,
  };
}
