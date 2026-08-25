import { notFound } from "next/navigation";

import { getOrderDetail } from "@/server/actions/hq-orders";
import { getSupplierOrderDrafts } from "@/server/actions/supplier-orders";

import { OrderDetailView } from "./order-detail-view";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  // Drafted server-side so the page arrives with the purchase orders already
  // built — the supplier lookup hits Sanity, and doing it on click would put a
  // spinner in front of the one action the page exists to make quick.
  const supplierDrafts = await getSupplierOrderDrafts(id);

  return <OrderDetailView order={order} supplierDrafts={supplierDrafts} />;
}
