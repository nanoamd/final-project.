import Link from "next/link";

import { listNewsletterSubscribers } from "@/server/actions/hq-content";

import { ExportCsvButton } from "./export-csv-button";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminNewsletterPage() {
  const { subscribers, newThisWeek } = await listNewsletterSubscribers();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl">Newsletter</h1>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
            Subscribers
          </p>
          <p className="font-display mt-1 text-2xl tabular-nums">
            {subscribers.length}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
            New this week
          </p>
          <p className="font-display mt-1 text-2xl tabular-nums">
            {newThisWeek}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs tracking-[0.08em] text-neutral-400 uppercase">
            All subscribers
          </p>
          {subscribers.length ? (
            <ExportCsvButton
              rows={subscribers.map((s) => ({
                email: s.email,
                subscribedAt: s.subscribedAt,
              }))}
            />
          ) : null}
        </div>
        {subscribers.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            No subscribers yet — signups from the site land here instantly.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-neutral-100">
            {subscribers.map((subscriber) => (
              <li
                key={subscriber.id}
                className="flex items-baseline justify-between gap-4 py-2.5 text-sm"
              >
                <span className="text-neutral-800">{subscriber.email}</span>
                <span className="text-neutral-400">
                  {formatDate(subscriber.subscribedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
