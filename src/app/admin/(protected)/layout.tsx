import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { signOutAdmin } from "@/server/actions/admin-auth";
import { getAuthorizedAdmin } from "@/server/auth/admin";

const NAV_ITEMS: {
  label: string;
  href: "/admin" | "/admin/orders" | "/admin/import";
}[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Import product", href: "/admin/import" },
];

// Named here so the shell shows the intended shape of Kaiku HQ (per
// docs/kaiku-hq-design.md §4.1) without pretending unbuilt pages work —
// each renders disabled with no href until its page actually exists.
const UPCOMING_NAV_ITEMS = [
  "Inbox",
  "Customers",
  "Suppliers",
  "Newsletter",
  "Tasks",
  "Analytics",
  "SEO",
];

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Gates every route under /admin except /admin/login (a sibling outside this
 * route group, so it isn't wrapped by this check). Authorization now goes
 * through getAuthorizedAdmin() — ADMIN_EMAIL is always the owner, and
 * additional staff accounts come from the `admin_users` table (see
 * supabase/migrations/0004_admin_users.sql).
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getAuthorizedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-6">
        <span className="font-display px-2 text-lg">Kaiku HQ</span>
        <span className="mt-1 px-2 text-xs text-neutral-400">
          {admin.email} · {admin.role}
        </span>
        <nav className="mt-8 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 border-t border-neutral-100 pt-3">
            {UPCOMING_NAV_ITEMS.map((label) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-neutral-300"
              >
                {label}
                <span className="text-[10px] tracking-wide uppercase">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </nav>
        <form action={signOutAdmin} className="mt-auto pt-6">
          <button
            type="submit"
            className="px-2.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
          >
            Sign out
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-10">{children}</main>
    </div>
  );
}
