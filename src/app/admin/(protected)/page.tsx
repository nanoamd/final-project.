import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-display text-2xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
      </div>
    </div>
  );
}
