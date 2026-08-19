import Link from "next/link";

import { formatPriceExact } from "@/lib/format";
import { getAttention } from "@/server/actions/hq-attention";
import { getDashboardData } from "@/server/actions/hq-dashboard";

import { AttentionList } from "./attention-list";

/**
 * The HQ dashboard: one screen, four panels, no scrolling to find out whether
 * anything is wrong.
 *
 * Laid out so the eye lands on ALERTS first and the money strip is read second.
 * A terminal's value is that the important thing is already on screen — a
 * dashboard you have to scroll is a report.
 */
export default async function AdminDashboardPage() {
  const [data, attention] = await Promise.all([
    getDashboardData(),
    getAttention(),
  ]);

  const pipelineTotal = data.pipeline.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Money strip. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label="Revenue MTD"
          value={formatPriceExact(data.revenueThisMonth / 100)}
          accent="var(--hq-up)"
        />
        <Metric label="Orders MTD" value={String(data.ordersThisMonth)} />
        <Metric label="AOV" value={formatPriceExact(data.aov / 100)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        {/* What needs you, and what it costs the customer if it waits. */}
        <AttentionList summary={attention} />

        <div className="flex min-w-0 flex-col gap-3">
          {/* Pipeline — where every open order actually is. */}
          <section className="hq-panel">
            <div className="hq-panel-head">
              <span>Pipeline</span>
              <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
                {pipelineTotal}
              </span>
            </div>
            {data.pipeline.length === 0 ? (
              <p
                className="px-2.5 py-3 text-[12px]"
                style={{ color: "var(--hq-faint)" }}
              >
                No orders yet.
              </p>
            ) : (
              <ul>
                {data.pipeline.map((p) => (
                  <li
                    key={p.stage}
                    className="hq-row flex items-center gap-2 px-2.5 py-1.5"
                  >
                    <span
                      className="flex-1 truncate text-[12px]"
                      style={{ color: "var(--hq-dim)" }}
                    >
                      {p.label}
                    </span>
                    {/* A proportional bar, so the shape of the pipeline reads
                        without doing arithmetic on the counts. */}
                    <span
                      className="h-1 w-16 shrink-0"
                      style={{ background: "var(--hq-line)" }}
                      aria-hidden
                    >
                      <span
                        className="block h-1"
                        style={{
                          width: `${pipelineTotal ? (p.count / pipelineTotal) * 100 : 0}%`,
                          background: "var(--hq-accent)",
                        }}
                      />
                    </span>
                    <span
                      className="hq-num w-6 shrink-0 text-right text-[12px]"
                      style={{ color: "var(--hq-text)" }}
                    >
                      {p.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* The tape — everything that has happened, newest first. */}
          <section className="hq-panel min-w-0 flex-1">
            <div className="hq-panel-head">
              <span>Tape</span>
              <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
                LIVE
              </span>
            </div>
            {data.pulse.length === 0 ? (
              <p
                className="px-2.5 py-3 text-[12px]"
                style={{ color: "var(--hq-faint)" }}
              >
                Nothing has happened yet.
              </p>
            ) : (
              <ul className="max-h-[420px] overflow-y-auto">
                {data.pulse.map((p, i) => (
                  <li key={i} className="hq-row">
                    <TapeRow
                      title={p.title}
                      createdAt={p.createdAt}
                      orderId={p.orderId}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickAction
          href="/admin/import"
          title="Import product from URL"
          detail="Paste a supplier's product page and get a draft."
        />
        <QuickAction
          href="/admin/emails"
          title="Preview and test emails"
          detail="Every customer email, HTML and plain text."
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="hq-panel px-2.5 py-2">
      <p className="hq-label">{label}</p>
      <p
        className="hq-num mt-1 text-[22px] leading-none"
        style={{ color: accent ?? "var(--hq-text)" }}
      >
        {value}
      </p>
    </div>
  );
}

function TapeRow({
  title,
  createdAt,
  orderId,
}: {
  title: string;
  createdAt: string;
  orderId: string | null;
}) {
  const stamp = new Date(createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  });

  const body = (
    <>
      <span
        className="hq-num shrink-0 text-[10px]"
        style={{ color: "var(--hq-faint)" }}
      >
        {stamp}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-[12px]"
        style={{ color: "var(--hq-dim)" }}
      >
        {title}
      </span>
    </>
  );

  if (!orderId) {
    return (
      <div className="flex items-baseline gap-2 px-2.5 py-1.5">{body}</div>
    );
  }
  return (
    <Link
      href={`/admin/orders/${orderId}`}
      className="hq-row-hover flex items-baseline gap-2 px-2.5 py-1.5"
    >
      {body}
    </Link>
  );
}

function QuickAction({
  href,
  title,
  detail,
}: {
  href: "/admin/import" | "/admin/emails";
  title: string;
  detail: string;
}) {
  return (
    <Link href={href} className="hq-panel hq-row-hover block px-2.5 py-2.5">
      <p className="text-[13px]" style={{ color: "var(--hq-text)" }}>
        {title}
      </p>
      <p className="mt-0.5 text-[11px]" style={{ color: "var(--hq-faint)" }}>
        {detail}
      </p>
    </Link>
  );
}
