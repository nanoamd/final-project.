import Link from "next/link";

import { listSuppliers } from "@/server/actions/hq-suppliers";

/**
 * The supplier blotter. Design: docs/kaiku-hq-design.md §4.7.
 *
 * Late rate and response-time trend need a timeline of promised-vs-actual
 * dispatch dates per supplier order, which the order snapshot does not yet
 * carry per supplier (only per order) — that is real future work, not
 * something to fake with a number. What is real today: how many products
 * each supplier has live, and how many orders touched them in the last 90
 * days, both computed straight from Sanity and Supabase rather than stored.
 */
export default async function AdminSuppliersPage() {
  const suppliers = await listSuppliers();

  return (
    <section className="hq-panel">
      <div className="hq-panel-head">
        <span>Suppliers</span>
        <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
          {suppliers.length}
        </span>
      </div>

      {suppliers.length === 0 ? (
        <p
          className="px-2.5 py-4 text-[12px]"
          style={{ color: "var(--hq-dim)" }}
        >
          No suppliers in Sanity yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--hq-line)" }}>
                <Th>Supplier</Th>
                <Th align="right">Products</Th>
                <Th align="right">Orders (90d)</Th>
                <Th align="right">Lead time</Th>
                <Th>Contact</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.name} className="hq-row hq-row-hover">
                  <Td>
                    <Link
                      href={`/admin/suppliers/${encodeURIComponent(supplier.name)}`}
                      style={{ color: "var(--hq-text)" }}
                    >
                      {supplier.name}
                    </Link>
                    {supplier.archived ? (
                      <span
                        className="hq-label ml-1.5"
                        style={{ color: "var(--hq-faint)" }}
                      >
                        archived
                      </span>
                    ) : null}
                    {!supplier.hasOperationalProfile ? (
                      <span
                        className="hq-label ml-1.5"
                        title="No HQ operational profile yet (order method, terms, SLA) — will be created on first order, or from the supplier's page now"
                        style={{ color: "var(--hq-warn)" }}
                      >
                        incomplete profile
                      </span>
                    ) : null}
                  </Td>
                  <Td align="right" mono dim>
                    {supplier.productCount}
                  </Td>
                  <Td align="right" mono dim>
                    {supplier.ordersLast90d}
                  </Td>
                  <Td align="right" mono dim>
                    {supplier.leadTimeDays !== null
                      ? `${supplier.leadTimeDays}d`
                      : "—"}
                  </Td>
                  <Td dim>
                    <span className="block max-w-[220px] truncate">
                      {supplier.contactName || supplier.email || "—"}
                    </span>
                  </Td>
                  <Td align="right">
                    <Link
                      href={`/admin/suppliers/${encodeURIComponent(supplier.name)}`}
                      style={{ color: "var(--hq-faint)" }}
                      aria-label={`Open ${supplier.name}`}
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
