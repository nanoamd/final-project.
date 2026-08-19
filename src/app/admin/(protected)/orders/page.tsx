import Link from "next/link";

import { formatPriceExact } from "@/lib/format";
import { listAllOrdersForAdmin } from "@/server/actions/orders";
import { stageLabel } from "@/server/hq/workflows";

export default async function AdminOrdersPage() {
  const orders = await listAllOrdersForAdmin();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl">Orders</h1>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          ← Dashboard
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          No orders yet — paid orders will show up here as soon as they come
          through.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="relative rounded-xl border border-neutral-200 bg-white p-6"
            >
              <Link
                href={`/admin/orders/${order.id}`}
                className="absolute inset-0"
                aria-label="View order"
              />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-3">
                  {/* The order number leads, because it is what Damien and the
                      customer both say out loud. Before this the row opened
                      with a price and identified the order only by the UUID in
                      its link, which is unreadable and unquotable. */}
                  <p className="font-display text-lg">
                    {order.orderNumber ?? "No number"}
                  </p>
                  <p className="text-base text-neutral-600">
                    {formatPriceExact(order.amountTotal / 100)}
                  </p>
                </div>
                <p className="text-sm text-neutral-500">
                  {new Date(order.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                {order.email || "(no email)"}
                {order.phone ? ` · ${order.phone}` : ""}
              </p>
              <p className="mt-1 flex items-center gap-2 text-xs tracking-[0.08em] uppercase">
                <span className="text-neutral-400">{order.status}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600 normal-case">
                  {stageLabel(order.stage)}
                </span>
                {order.flagged ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 normal-case">
                    ⚑ Flagged
                  </span>
                ) : null}
              </p>

              {order.lineItems.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4">
                  {order.lineItems.map((item, index) => (
                    <li key={index} className="text-sm">
                      <p className="text-neutral-900">
                        {item.quantity ? `${item.quantity} × ` : ""}
                        {item.description ?? "Item"}
                      </p>
                      <p className="text-neutral-500">
                        {item.sku ? `SKU ${item.sku}` : "SKU unknown"}
                        {item.supplier ? ` · Supplier: ${item.supplier}` : ""}
                        {item.slug ? (
                          <>
                            {" · "}
                            <Link
                              href={`/shop/${item.category}/${item.slug}`}
                              className="underline underline-offset-2"
                              target="_blank"
                            >
                              View product
                            </Link>
                          </>
                        ) : null}
                      </p>
                      {item.selectedOptions ? (
                        <p className="text-neutral-500">
                          {Object.entries(item.selectedOptions)
                            .map(([label, value]) => `${label}: ${value}`)
                            .join(" · ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              {order.shippingAddress ? (
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
                    Delivery address
                  </p>
                  <p className="mt-1 text-sm text-neutral-700">
                    {order.shippingAddress.name}
                    <br />
                    {[
                      order.shippingAddress.address.line1,
                      order.shippingAddress.address.line2,
                      order.shippingAddress.address.city,
                      order.shippingAddress.address.postal_code,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
