import Link from "next/link";

import { listContactSubmissions } from "@/server/actions/hq-content";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminInboxPage() {
  const submissions = await listContactSubmissions();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-2xl">Inbox</h1>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          ← Dashboard
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Every contact form enquiry, newest first. Replying opens your own email
        client addressed to the customer.
      </p>

      {submissions.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          No enquiries yet — submissions land here (and in your email, once
          Resend is configured) the moment someone uses the contact form.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {submissions.map((submission) => (
            <li
              key={submission.id}
              className="rounded-xl border border-neutral-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display text-lg">{submission.name}</p>
                <p className="text-sm text-neutral-500">
                  {formatDate(submission.submittedAt)}
                </p>
              </div>
              <p className="mt-0.5 text-sm text-neutral-500">
                {submission.email}
              </p>
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-neutral-800">
                {submission.message}
              </p>
              <a
                href={`mailto:${submission.email}?subject=${encodeURIComponent("Re: your enquiry to Kaiku")}`}
                className="mt-4 inline-block rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-400"
              >
                Reply by email
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
