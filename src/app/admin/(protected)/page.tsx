import Link from "next/link";

import { formatPriceExact } from "@/lib/format";
import { getDashboardData } from "@/server/actions/hq-dashboard";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <h1 className="font-display text-2xl">Dashboard</h1>

      {/* Money */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
            Revenue this month
          </p>
          <p className="font-display mt-1 text-2xl tabular-nums">
            {formatPriceExact(data.revenueThisMonth / 100)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
            Orders this month
          </p>
          <p className="font-display mt-1 text-2xl tabular-nums">
            {data.ordersThisMonth}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
            Average order value
          </p>
          <p className="font-display mt-1 text-2xl tabular-nums">
            {formatPriceExact(data.aov / 100)}
          </p>
        </div>
      </div>

      {/* Needs action */}
      <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-5">
        <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
          Needs action
        </p>
        {data.needsAction.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Nothing needs you. Go sell something.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {data.needsAction.map((item, i) => (
              <li key={i}>
                <Link
                  href={`/admin/orders/${item.orderId}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors hover:bg-neutral-50"
                >
                  <span>
                    <span className="font-medium text-neutral-900">
                      {item.label}
                    </span>
                    <span className="text-neutral-500"> — {item.detail}</span>
                  </span>
                  <span className="text-neutral-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Pipeline */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
            Pipeline
          </p>
          {data.pipeline.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">No orders yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {data.pipeline.map((p) => (
                <li
                  key={p.stage}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-700">{p.label}</span>
                  <span className="text-neutral-900 tabular-nums">
                    {p.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pulse */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
            Recent activity
          </p>
          {data.pulse.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">
              Nothing has happened yet.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {data.pulse.map((p, i) => (
                <li key={i} className="text-sm">
                  {p.orderId ? (
                    <Link
                      href={`/admin/orders/${p.orderId}`}
                      className="text-neutral-700 hover:text-neutral-900"
                    >
                      {p.title}
                    </Link>
                  ) : (
                    <span className="text-neutral-700">{p.title}</span>
                  )}
                  <span className="ml-2 text-xs text-neutral-400">
                    {new Date(p.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/import"
          className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-400"
        >
          <p className="font-display text-lg">Import product from URL</p>
          <p className="mt-1 text-sm text-neutral-500">
            Paste a supplier&rsquo;s product page and get a draft ready to
            review in Studio.
          </p>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-400"
        >
          <p className="font-display text-lg">Orders</p>
          <p className="mt-1 text-sm text-neutral-500">
            Every paid order with SKU, supplier and delivery address, ready to
            action.
          </p>
        </Link>
      </div>
    </div>
  );
}
