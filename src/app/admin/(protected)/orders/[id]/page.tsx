import { notFound } from "next/navigation";

import { getOrderDetail } from "@/server/actions/hq-orders";

import { OrderDetailView } from "./order-detail-view";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  return <OrderDetailView order={order} />;
}
