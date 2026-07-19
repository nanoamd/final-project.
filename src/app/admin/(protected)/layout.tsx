import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { env } from "@/env";
import { createClient } from "@/lib/supabase/server";
import { signOutAdmin } from "@/server/actions/admin-auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Gates every route under /admin except /admin/login (a sibling outside this
 * route group, so it isn't wrapped by this check). Single-admin model: there's
 * no self-signup and no roles table — the only account that gets in is the one
 * whose email matches ADMIN_EMAIL.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = env.ADMIN_EMAIL;
  const authorized =
    !!user?.email &&
    !!adminEmail &&
    user.email.toLowerCase() === adminEmail.toLowerCase();

  if (!authorized) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <span className="font-display text-lg">Kaiku Admin</span>
        <form action={signOutAdmin}>
          <button
            type="submit"
            className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}
