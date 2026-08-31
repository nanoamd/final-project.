import Link from "next/link";

import { formatPriceExact } from "@/lib/format";
import { getAnalytics, type Period } from "@/server/actions/hq-analytics";

const PERIODS: { key: Period; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "12m", label: "12M" },
];

/**
 * The money truth. Design: docs/kaiku-hq-design.md §4.11.
 *
 * GA4-style behavioural analytics (sessions, bounce, sources) is deliberately
 * not rebuilt here — "one honest link instead of a half-rebuilt clone" is the
 * design doc's own call, and it is the right one.
 */
export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period: Period = PERIODS.some((p) => p.key === rawPeriod)
    ? (rawPeriod as Period)
    : "30d";
  const data = await getAnalytics(period);

  const revenueDelta = delta(data.current.revenue, data.previous.revenue);
  const gpDelta = delta(data.current.grossProfit, data.previous.grossProfit);
  const ordersDelta = delta(data.current.orders, data.previous.orders);
  const marginPct =
    data.current.revenue > 0
      ? (data.current.grossProfit / data.current.revenue) * 100
      : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/admin/analytics?period=${p.key}`}
              className="hq-num px-2 py-1 text-[11px]"
              style={{
                color: p.key === period ? "#14100e" : "var(--hq-dim)",
                background:
                  p.key === period ? "var(--hq-accent)" : "transparent",
                border: "1px solid var(--hq-line)",
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noreferrer"
          className="text-[11px]"
          style={{ color: "var(--hq-info)" }}
        >
          Sessions, bounce, sources → GA4 ↗
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        <Metric
          label="Revenue"
          value={formatPriceExact(data.current.revenue / 100)}
          delta={revenueDelta}
        />
        <Metric
          label="Gross profit"
          value={formatPriceExact(data.current.grossProfit / 100)}
          delta={gpDelta}
          accent="var(--hq-up)"
        />
        <Metric label="Margin" value={`${marginPct.toFixed(1)}%`} />
        <Metric
          label="Orders"
          value={String(data.current.orders)}
          delta={ordersDelta}
        />
        <Metric label="AOV" value={formatPriceExact(data.current.aov / 100)} />
      </div>

      <section className="hq-panel">
        <div className="hq-panel-head">
          <span>Daily revenue &amp; GP</span>
        </div>
        {data.dailyRevenue.length === 0 ? (
          <p
            className="px-2.5 py-4 text-[12px]"
            style={{ color: "var(--hq-dim)" }}
          >
            No paid orders in this period yet.
          </p>
        ) : (
          <RevenueChart rows={data.dailyRevenue} />
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <ProductsPanel
          title="Products by revenue"
          rows={data.productsByRevenue}
          metric="revenue"
        />
        <ProductsPanel
          title="Products by gross profit"
          rows={data.productsByGrossProfit}
          metric="grossProfit"
        />
      </div>

      <section className="hq-panel">
        <div className="hq-panel-head">
          <span>Categories</span>
        </div>
        {data.categories.length === 0 ? (
          <p
            className="px-2.5 py-4 text-[12px]"
            style={{ color: "var(--hq-dim)" }}
          >
            Nothing sold in this period yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--hq-line)" }}>
                  <Th>Category</Th>
                  <Th align="right">Units</Th>
                  <Th align="right">Revenue</Th>
                  <Th align="right">GP</Th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c) => (
                  <tr key={c.category} className="hq-row">
                    <Td dim>{c.category}</Td>
                    <Td align="right" mono dim>
                      {c.unitsSold}
                    </Td>
                    <Td align="right" mono>
                      {formatPriceExact(c.revenue / 100)}
                    </Td>
                    <Td align="right" mono>
                      {formatPriceExact(c.grossProfit / 100)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="hq-panel">
          <div className="hq-panel-head">
            <span>Abandoned checkouts</span>
          </div>
          <dl className="grid grid-cols-2 gap-2 px-2.5 py-2.5 text-[12px]">
            <Stat label="Count" value={String(data.abandoned.count)} />
            <Stat
              label="Value"
              value={formatPriceExact(data.abandoned.value / 100)}
            />
            <Stat label="With email" value={String(data.abandoned.withEmail)} />
            <Stat
              label="Recovered"
              value={`${data.abandoned.recovered} (${formatPriceExact(data.abandoned.recoveredValue / 100)})`}
            />
          </dl>
        </section>

        <section className="hq-panel">
          <div className="hq-panel-head">
            <span>Customers</span>
          </div>
          <dl className="grid grid-cols-2 gap-2 px-2.5 py-2.5 text-[12px]">
            <Stat label="New" value={String(data.customers.new)} />
            <Stat label="Returning" value={String(data.customers.returning)} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function delta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

function Metric({
  label,
  value,
  delta: deltaPct,
  accent,
}: {
  label: string;
  value: string;
  delta?: number | null;
  accent?: string;
}) {
  return (
    <div className="hq-panel px-2.5 py-2">
      <p className="hq-label">{label}</p>
      <p
        className="hq-num mt-1 text-[20px] leading-none"
        style={{ color: accent ?? "var(--hq-text)" }}
      >
        {value}
      </p>
      {deltaPct !== undefined && deltaPct !== null ? (
        <p
          className="hq-num mt-1 text-[11px]"
          style={{ color: deltaPct >= 0 ? "var(--hq-up)" : "var(--hq-down)" }}
        >
          {deltaPct >= 0 ? "+" : ""}
          {deltaPct.toFixed(1)}% vs prior period
        </p>
      ) : null}
    </div>
  );
}

function RevenueChart({
  rows,
}: {
  rows: { day: string; revenue: number; grossProfit: number }[];
}) {
  const max = Math.max(...rows.map((r) => r.revenue), 1);
  return (
    <div
      className="flex items-end gap-0.5 overflow-x-auto px-2.5 py-3"
      style={{ height: 120 }}
    >
      {rows.map((r) => (
        <div
          key={r.day}
          className="flex min-w-[6px] flex-1 flex-col justify-end"
          title={`${r.day}: ${formatPriceExact(r.revenue / 100)} revenue, ${formatPriceExact(r.grossProfit / 100)} GP`}
        >
          <div
            style={{
              height: `${Math.max((r.revenue / max) * 100, 2)}%`,
              background: "var(--hq-line)",
            }}
          />
          <div
            style={{
              height: `${Math.max((r.grossProfit / max) * 100, 1)}%`,
              background: "var(--hq-accent)",
              marginTop: `-${Math.max((r.grossProfit / max) * 100, 1)}%`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ProductsPanel({
  title,
  rows,
  metric,
}: {
  title: string;
  rows: {
    slug: string;
    description: string | null;
    unitsSold: number;
    revenue: number;
    grossProfit: number;
  }[];
  metric: "revenue" | "grossProfit";
}) {
  return (
    <section className="hq-panel">
      <div className="hq-panel-head">
        <span>{title}</span>
      </div>
      {rows.length === 0 ? (
        <p
          className="px-2.5 py-4 text-[12px]"
          style={{ color: "var(--hq-dim)" }}
        >
          Nothing sold in this period yet.
        </p>
      ) : (
        <ul className="max-h-[360px] overflow-y-auto">
          {rows.map((row) => (
            <li
              key={row.slug}
              className="hq-row flex items-center gap-2.5 px-2.5 py-1.5 text-[12px]"
            >
              <span
                className="min-w-0 flex-1 truncate"
                style={{ color: "var(--hq-text)" }}
              >
                {row.description || row.slug}
              </span>
              <span
                className="hq-num shrink-0"
                style={{ color: "var(--hq-faint)" }}
              >
                {row.unitsSold}u
              </span>
              <span className="hq-num shrink-0">
                {formatPriceExact(
                  (metric === "revenue" ? row.revenue : row.grossProfit) / 100,
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="hq-label">{label}</dt>
      <dd
        className="hq-num mt-0.5 text-[14px]"
        style={{ color: "var(--hq-text)" }}
      >
        {value}
      </dd>
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
