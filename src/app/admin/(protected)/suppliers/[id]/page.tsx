import Link from "next/link";
import { notFound } from "next/navigation";

import { formatPriceExact } from "@/lib/format";
import {
  createSupplierProfile,
  getSupplierDetail,
} from "@/server/actions/hq-suppliers";

/**
 * One supplier: contact & terms, every product they supply with its margin,
 * and their trade-price history. Design: docs/kaiku-hq-design.md §4.7.
 *
 * Orders and Emails tabs from the design doc are not built yet — an
 * order-by-order supplier view needs the order snapshot to carry a per-line
 * supplier confirmation timestamp it does not have today, and the email log
 * has no supplier_id column to filter by. Both are real Phase 2 work, not
 * done here to keep this page honest about what it can actually show.
 */
export default async function AdminSupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const name = decodeURIComponent(id);
  const supplier = await getSupplierDetail(name);
  if (!supplier) notFound();

  const liveProducts = supplier.products.filter((p) => p.status === "live");
  const withMargin = liveProducts.filter((p) => p.marginPct !== null);
  const avgMargin =
    withMargin.length > 0
      ? withMargin.reduce((sum, p) => sum + (p.marginPct ?? 0), 0) /
        withMargin.length
      : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-[16px]" style={{ color: "var(--hq-text)" }}>
          {supplier.name}
        </h1>
        <Link
          href="/admin/suppliers"
          className="text-[11px]"
          style={{ color: "var(--hq-faint)" }}
        >
          ← Suppliers
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <section className="hq-panel">
          <div className="hq-panel-head">
            <span>Contact &amp; terms</span>
          </div>
          <dl className="flex flex-col gap-1.5 px-2.5 py-2.5 text-[12px]">
            <Row label="Contact" value={supplier.contactName} />
            <Row label="Email" value={supplier.email} />
            <Row label="Phone" value={supplier.phone} />
            <Row
              label="Order method"
              value={supplier.orderMethod ?? "email (default)"}
            />
            <Row label="Portal" value={supplier.portalUrl} />
            <Row label="Payment terms" value={supplier.paymentTerms} />
            <Row
              label="Lead time"
              value={
                supplier.leadTimeDays !== null
                  ? `${supplier.leadTimeDays} days`
                  : null
              }
            />
            <Row
              label="Carriage"
              value={
                supplier.carriageIncludedInCost
                  ? "Included in trade price"
                  : "Billed separately"
              }
            />
            <Row label="Returns policy" value={supplier.returnsPolicy} />
            {supplier.sanityNotes ? (
              <Row label="Notes (Sanity)" value={supplier.sanityNotes} />
            ) : null}
            {supplier.opsNotes ? (
              <Row label="Notes (HQ)" value={supplier.opsNotes} />
            ) : null}
          </dl>
          {!supplier.supabaseId ? (
            <form
              action={createSupplierProfile}
              className="flex items-center gap-2 px-2.5 py-2"
              style={{ borderTop: "1px solid var(--hq-line)" }}
            >
              <input type="hidden" name="name" value={supplier.name} />
              <p
                className="flex-1 text-[11px]"
                style={{ color: "var(--hq-warn)" }}
              >
                No HQ profile yet — order method, terms and SLA aren&apos;t set.
              </p>
              <button
                type="submit"
                className="hq-num px-2 py-1 text-[10px] font-semibold uppercase"
                style={{ background: "var(--hq-accent)", color: "#14100e" }}
              >
                Create profile
              </button>
            </form>
          ) : null}
        </section>

        <div className="grid grid-cols-3 gap-3">
          <Metric label="Live products" value={String(liveProducts.length)} />
          <Metric
            label="Drafts"
            value={String(supplier.products.length - liveProducts.length)}
          />
          <Metric
            label="Avg margin"
            value={avgMargin !== null ? `${avgMargin.toFixed(1)}%` : "—"}
          />
        </div>
      </div>

      <section className="hq-panel">
        <div className="hq-panel-head">
          <span>Products</span>
          <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
            {supplier.products.length}
          </span>
        </div>
        {supplier.products.length === 0 ? (
          <p
            className="px-2.5 py-4 text-[12px]"
            style={{ color: "var(--hq-dim)" }}
          >
            No products reference this supplier.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hq-line)" }}>
                  <Th>Title</Th>
                  <Th>SKU</Th>
                  <Th align="right">Price</Th>
                  <Th align="right">Cost</Th>
                  <Th align="right">Margin</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {[...supplier.products]
                  .sort((a, b) => (a.marginPct ?? 999) - (b.marginPct ?? 999))
                  .map((product) => (
                    <tr key={product.slug} className="hq-row hq-row-hover">
                      <Td>
                        <span className="block max-w-[320px] truncate">
                          {product.title}
                        </span>
                      </Td>
                      <Td dim mono>
                        {product.sku ?? "—"}
                      </Td>
                      <Td align="right" mono>
                        {product.price !== null
                          ? formatPriceExact(product.price)
                          : "—"}
                      </Td>
                      <Td align="right" mono dim>
                        {product.costPrice !== null
                          ? formatPriceExact(product.costPrice)
                          : "—"}
                      </Td>
                      <Td align="right" mono>
                        {product.marginPct !== null ? (
                          <span
                            style={{
                              color:
                                product.marginPct < 17
                                  ? "var(--hq-down)"
                                  : "var(--hq-text)",
                            }}
                          >
                            {product.marginPct.toFixed(1)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td dim>{product.status}</Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="hq-panel">
        <div className="hq-panel-head">
          <span>Price history</span>
          <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
            {supplier.priceHistory.length}
          </span>
        </div>
        {supplier.priceHistory.length === 0 ? (
          <p
            className="px-2.5 py-4 text-[12px]"
            style={{ color: "var(--hq-dim)" }}
          >
            No logged price changes yet.
          </p>
        ) : (
          <ul>
            {supplier.priceHistory.map((event) => (
              <li
                key={event.id}
                className="hq-row flex items-center gap-2.5 px-2.5 py-1.5 text-[12px]"
              >
                <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
                  {event.effectiveDate
                    ? new Date(event.effectiveDate).toLocaleDateString("en-GB")
                    : "—"}
                </span>
                <span style={{ color: "var(--hq-dim)" }}>
                  {event.sku ?? event.productSlug ?? "—"}
                </span>
                <span className="hq-num">
                  {event.oldTradePrice !== null
                    ? formatPriceExact(event.oldTradePrice)
                    : "—"}{" "}
                  →{" "}
                  {event.newTradePrice !== null
                    ? formatPriceExact(event.newTradePrice)
                    : "—"}
                </span>
                {event.source ? (
                  <span style={{ color: "var(--hq-faint)" }}>
                    {event.source}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
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

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt
        className="hq-label w-28 shrink-0"
        style={{ color: "var(--hq-faint)" }}
      >
        {label}
      </dt>
      <dd style={{ color: "var(--hq-text)" }}>{value}</dd>
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
