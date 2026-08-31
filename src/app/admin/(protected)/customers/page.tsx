import Link from "next/link";

import { formatPriceExact } from "@/lib/format";
import { listCustomers } from "@/server/actions/hq-customers";

/**
 * Who is this person and what is our whole history with them. Design:
 * docs/kaiku-hq-design.md §4.6. Sorted by LTV, per the design's default.
 */
export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <section className="hq-panel">
      <div className="hq-panel-head">
        <span>Customers</span>
        <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
          {customers.length}
        </span>
      </div>

      {customers.length === 0 ? (
        <p
          className="px-2.5 py-4 text-[12px]"
          style={{ color: "var(--hq-dim)" }}
        >
          No paid orders yet — customers appear here the moment one comes in.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hq-line)" }}>
                <Th>Customer</Th>
                <Th align="right">Orders</Th>
                <Th align="right">LTV</Th>
                <Th>Last order</Th>
                <Th>Subscriber</Th>
                <Th align="right">Open tickets</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.email} className="hq-row hq-row-hover">
                  <Td>
                    <Link
                      href={`/admin/customers/${encodeURIComponent(customer.email)}`}
                      style={{ color: "var(--hq-text)" }}
                    >
                      {customer.name || customer.email}
                    </Link>
                    {customer.name ? (
                      <span
                        className="ml-1.5 block max-w-[220px] truncate"
                        style={{ color: "var(--hq-faint)" }}
                      >
                        {customer.email}
                      </span>
                    ) : null}
                  </Td>
                  <Td align="right" mono dim>
                    {customer.orderCount}
                  </Td>
                  <Td align="right" mono>
                    {formatPriceExact(customer.ltv / 100)}
                  </Td>
                  <Td dim mono>
                    {customer.lastOrderAt
                      ? new Date(customer.lastOrderAt).toLocaleDateString(
                          "en-GB",
                        )
                      : "—"}
                  </Td>
                  <Td>
                    {customer.subscriber ? (
                      <span style={{ color: "var(--hq-up)" }}>yes</span>
                    ) : (
                      <span style={{ color: "var(--hq-faint)" }}>—</span>
                    )}
                  </Td>
                  <Td align="right" mono>
                    {customer.openTickets > 0 ? (
                      <span style={{ color: "var(--hq-warn)" }}>
                        {customer.openTickets}
                      </span>
                    ) : (
                      <span style={{ color: "var(--hq-faint)" }}>0</span>
                    )}
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/customers/${encodeURIComponent(customer.email)}`}
                      style={{ color: "var(--hq-faint)" }}
                      aria-label={`Open ${customer.email}`}
                    >
                      →
                    </Link>
                  </Td>
                </tr>
              ))}
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
