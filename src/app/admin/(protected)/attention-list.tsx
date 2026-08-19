import Link from "next/link";

import type { AttentionSummary } from "@/server/actions/hq-attention";
import type { AttentionSeverity } from "@/server/hq/attention";

/**
 * ALERTS — the first panel, worst first.
 *
 * Each row carries the customer consequence, not just the internal state.
 * "Promised dispatch date has passed" is a fact; "they were given this date,
 * tell them before they notice" is the reason to click it now. This screen has
 * to survive being looked at every day, and an operator only keeps trusting a
 * list that explains itself.
 */

const SEVERITY: Record<AttentionSeverity, { colour: string; tag: string }> = {
  critical: { colour: "var(--hq-down)", tag: "NOW" },
  warning: { colour: "var(--hq-warn)", tag: "TODAY" },
  due: { colour: "var(--hq-dim)", tag: "QUEUE" },
};

export function AttentionList({ summary }: { summary: AttentionSummary }) {
  const { items, counts } = summary;

  return (
    <section className="hq-panel">
      <div className="hq-panel-head">
        <span>Alerts</span>
        <span className="hq-num" style={{ color: "var(--hq-faint)" }}>
          {counts.total === 0 ? "0" : `${counts.critical}/${counts.total}`}
        </span>
      </div>

      {items.length === 0 ? (
        <p
          className="px-2.5 py-4 text-[12px]"
          style={{ color: "var(--hq-dim)" }}
        >
          Nothing late, nothing waiting. Every paid order is on order with its
          supplier and every promised date is still ahead.
        </p>
      ) : (
        <ul>
          {items.map((item) => {
            const style = SEVERITY[item.severity];
            return (
              <li key={item.id} className="hq-row">
                <Link
                  href={`/admin/orders/${item.orderId}`}
                  className="hq-row-hover flex items-start gap-2.5 px-2.5 py-2"
                >
                  {/* A colour bar rather than a dot: it reads as a severity
                      gutter down the whole list at a glance. */}
                  <span
                    className="mt-0.5 w-0.5 shrink-0 self-stretch"
                    style={{ background: style.colour }}
                    aria-hidden
                  />
                  <span
                    className="hq-num mt-px w-12 shrink-0 text-[9px] font-semibold tracking-[0.1em]"
                    style={{ color: style.colour }}
                  >
                    {style.tag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[12.5px]"
                      style={{ color: "var(--hq-text)" }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="hq-num mt-0.5 block truncate text-[11px]"
                      style={{ color: "var(--hq-dim)" }}
                    >
                      {item.detail}
                    </span>
                    <span
                      className="mt-0.5 block text-[11px] leading-snug"
                      style={{ color: "var(--hq-faint)" }}
                    >
                      {item.consequence}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
