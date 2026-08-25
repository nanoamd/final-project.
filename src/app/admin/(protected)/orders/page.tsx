import Link from "next/link";

import { formatPriceExact } from "@/lib/format";
import { listAllOrdersForAdmin } from "@/server/actions/orders";
import { stageLabel } from "@/server/hq/workflows";

/**
 * The order blotter.
 *
 * Was a card per order — six lines of detail each, three orders visible at once,
 * and no way to compare them. A card is right when you have one thing to read
 * and wrong when you have a book of them: the question this page answers is
 * "what is the state of the book", which needs rows, aligned columns and a
 * screen that holds thirty of them.
 *
 * Line items, addresses and options moved to the order page, which is where you
 * go once you have found the order. This page's job is finding it.
 */
export default async function AdminOrdersPage() {
  const orders = await listAllOrdersForAdmin();

  const totalValue = orders.reduce((sum, order) => sum + order.amountTotal, 0);

  return (
    <section className="hq-panel">
      <div className="hq-panel-head">
        <span>Orders</span>
        <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
          {orders.length} · {formatPriceExact(totalValue / 100)}
        </span>
      </div>

      {orders.length === 0 ? (
        <p
          className="px-2.5 py-4 text-[12px]"
          style={{ color: "var(--hq-dim)" }}
        >
          No orders yet. Paid orders appear here the moment the Stripe webhook
          records them.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hq-line)" }}>
                <Th>Ref</Th>
                <Th>Placed</Th>
                <Th>Customer</Th>
                <Th align="right">Total</Th>
                <Th>Stage</Th>
                <Th align="right">Items</Th>
                <Th>Supplier</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const itemCount = order.lineItems.reduce(
                  (sum, item) => sum + (item.quantity ?? 1),
                  0,
                );
                const suppliers = [
                  ...new Set(
                    order.lineItems
                      .map((item) => item.supplier)
                      .filter((name): name is string => Boolean(name)),
                  ),
                ];

                return (
                  <tr key={order.id} className="hq-row hq-row-hover">
                    <Td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="hq-num"
                        style={{ color: "var(--hq-accent)" }}
                      >
                        {order.orderNumber ?? order.id.slice(0, 8)}
                      </Link>
                      {order.flagged ? (
                        <span
                          title="Flagged"
                          className="ml-1.5"
                          style={{ color: "var(--hq-warn)" }}
                        >
                          ⚑
                        </span>
                      ) : null}
                    </Td>
                    <Td dim mono>
                      {new Date(order.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "Europe/London",
                      })}
                    </Td>
                    <Td dim>
                      <span className="block max-w-[220px] truncate">
                        {order.email || "(no email)"}
                      </span>
                    </Td>
                    <Td align="right" mono>
                      {formatPriceExact(order.amountTotal / 100)}
                    </Td>
                    <Td dim>{stageLabel(order.stage)}</Td>
                    <Td align="right" mono dim>
                      {itemCount}
                    </Td>
                    <Td dim>
                      <span className="block max-w-[180px] truncate">
                        {suppliers.length ? suppliers.join(", ") : "—"}
                      </span>
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{ color: "var(--hq-faint)" }}
                        aria-label={`Open order ${order.orderNumber ?? order.id}`}
                      >
                        →
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className="hq-label px-2.5 py-1.5"
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  dim,
  mono,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  dim?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      className={`px-2.5 py-1.5 align-top ${mono ? "hq-num" : ""}`}
      style={{
        textAlign: align,
        color: dim ? "var(--hq-dim)" : "var(--hq-text)",
      }}
    >
      {children}
    </td>
  );
}
