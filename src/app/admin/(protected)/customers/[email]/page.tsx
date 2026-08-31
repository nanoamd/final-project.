import Link from "next/link";
import { notFound } from "next/navigation";

import { formatPriceExact } from "@/lib/format";
import { getCustomerDetail } from "@/server/actions/hq-customers";
import { stageLabel } from "@/server/hq/workflows";

/**
 * One customer: orders and open conversations. Design:
 * docs/kaiku-hq-design.md §4.6.
 *
 * The Emails tab and the GDPR export/erase actions are not built here — both
 * are real obligations, not nice-to-haves, and doing them properly (a true
 * export of every row keyed by this email, an erase that anonymises rather
 * than half-deletes) deserves its own pass rather than being squeezed in
 * alongside five other pages in one session.
 */
export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);
  const customer = await getCustomerDetail(email);
  if (!customer) notFound();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-[16px]" style={{ color: "var(--hq-text)" }}>
            {customer.name || customer.email}
          </h1>
          {customer.name ? (
            <p className="text-[12px]" style={{ color: "var(--hq-faint)" }}>
              {customer.email}
            </p>
          ) : null}
        </div>
        <Link
          href="/admin/customers"
          className="text-[11px]"
          style={{ color: "var(--hq-faint)" }}
        >
          ← Customers
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="LTV" value={formatPriceExact(customer.ltv / 100)} />
        <Metric label="Orders" value={String(customer.orders.length)} />
        <Metric label="Subscriber" value={customer.subscriber ? "Yes" : "No"} />
      </div>

      <section className="hq-panel">
        <div className="hq-panel-head">
          <span>Orders</span>
        </div>
        {customer.orders.length === 0 ? (
          <p
            className="px-2.5 py-4 text-[12px]"
            style={{ color: "var(--hq-dim)" }}
          >
            No paid orders.
          </p>
        ) : (
          <ul>
            {customer.orders.map((order) => (
              <li key={order.id} className="hq-row">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="hq-row-hover flex items-center gap-2.5 px-2.5 py-1.5 text-[12px]"
                >
                  <span
                    className="hq-num"
                    style={{ color: "var(--hq-accent)" }}
                  >
                    {order.orderNumber ?? order.id.slice(0, 8)}
                  </span>
                  <span
                    className="hq-num shrink-0"
                    style={{ color: "var(--hq-faint)" }}
                  >
                    {new Date(order.createdAt).toLocaleDateString("en-GB")}
                  </span>
                  <span style={{ color: "var(--hq-dim)" }}>
                    {stageLabel(order.stage)}
                  </span>
                  <span className="hq-num ml-auto">
                    {formatPriceExact(order.amountTotal / 100)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="hq-panel">
        <div className="hq-panel-head">
          <span>Conversations</span>
        </div>
        {customer.tickets.length === 0 ? (
          <p
            className="px-2.5 py-4 text-[12px]"
            style={{ color: "var(--hq-dim)" }}
          >
            No tickets from this customer.
          </p>
        ) : (
          <ul>
            {customer.tickets.map((ticket) => (
              <li
                key={ticket.id}
                className="hq-row flex items-center gap-2.5 px-2.5 py-1.5 text-[12px]"
              >
                <span
                  className="hq-num shrink-0"
                  style={{ color: "var(--hq-faint)" }}
                >
                  {new Date(ticket.createdAt).toLocaleDateString("en-GB")}
                </span>
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{ color: "var(--hq-text)" }}
                >
                  {ticket.subject}
                </span>
                <span
                  className="hq-label"
                  style={{
                    color:
                      ticket.status === "resolved"
                        ? "var(--hq-up)"
                        : "var(--hq-warn)",
                  }}
                >
                  {ticket.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="hq-panel px-2.5 py-2">
      <p className="hq-label">{label}</p>
      <p
        className="hq-num mt-1 text-[18px] leading-none"
        style={{ color: "var(--hq-text)" }}
      >
        {value}
      </p>
    </div>
  );
}
