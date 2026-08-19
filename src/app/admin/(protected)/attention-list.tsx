import Link from "next/link";

import type { AttentionSummary } from "@/server/actions/hq-attention";
import type { AttentionSeverity } from "@/server/hq/attention";

/**
 * The first thing on the dashboard: what needs doing, worst first.
 *
 * Each row carries the customer consequence, not just the internal state.
 * "Promised dispatch date has passed" is a fact; "the customer was given this
 * date, tell them before they notice" is the reason to click it now. The screen
 * has to survive being looked at every day, and an operator only keeps trusting
 * a list that explains itself.
 */

const SEVERITY_STYLE: Record<
  AttentionSeverity,
  { dot: string; chip: string; label: string }
> = {
  critical: {
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700",
    label: "Now",
  },
  warning: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-800",
    label: "Today",
  },
  due: {
    dot: "bg-neutral-400",
    chip: "bg-neutral-100 text-neutral-600",
    label: "When you can",
  },
};

export function AttentionList({ summary }: { summary: AttentionSummary }) {
  const { items, counts } = summary;

  return (
    <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
          Needs you
        </p>
        {counts.total > 0 ? (
          <div className="flex items-center gap-1.5">
            {counts.critical > 0 ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                {counts.critical} now
              </span>
            ) : null}
            {counts.warning > 0 ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                {counts.warning} today
              </span>
            ) : null}
            {counts.due > 0 ? (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                {counts.due} when you can
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          Nothing is late and nothing is waiting on you. Every paid order is on
          order with its supplier, and every promised date is still ahead.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {items.map((item) => {
            const style = SEVERITY_STYLE[item.severity];
            return (
              <li
                key={item.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <Link
                  href={`/admin/orders/${item.orderId}`}
                  className="flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-neutral-50"
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${style.dot}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-medium text-neutral-900">
                        {item.title}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase ${style.chip}`}
                      >
                        {style.label}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-500">
                      {item.detail}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-neutral-400">
                      {item.consequence}
                    </span>
                  </span>
                  <span className="mt-1 text-neutral-300" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
