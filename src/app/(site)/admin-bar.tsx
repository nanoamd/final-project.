import { LayoutDashboard, Mail, Package, PenSquare } from "lucide-react";
import { cookies } from "next/headers";

import { AppLink } from "@/components/ui/app-link";
import { getAuthorizedAdmin } from "@/server/auth/admin";

import { AdminBarShell } from "./admin-bar-shell";

/**
 * A private way into the admin, from the site itself.
 *
 * "accessible only for me on the website and not visible to other customers, it
 * makes it quicker to access."
 *
 * A Server Component that resolves the admin identity server-side and renders
 * **nothing at all** for everybody else. That distinction matters more than it
 * looks: a bar hidden with CSS, or rendered and then removed on the client,
 * still ships its markup to every visitor, so anyone reading the page source
 * learns the admin URLs exist and what they are called. Here a signed-out
 * visitor's HTML contains no trace of it.
 *
 * Not a security boundary — /admin gates every page and every action itself.
 * This is a shortcut for the one person already allowed in.
 *
 * The collapsed/expanded preference is a cookie read here rather than
 * localStorage read in an effect, so the first render is already correct: no
 * hydration mismatch, and no flash of a bar over the storefront.
 */
export const ADMIN_BAR_COOKIE = "kaiku_admin_bar";

export async function AdminBar() {
  const admin = await getAuthorizedAdmin();
  if (!admin) return null;

  const store = await cookies();
  const collapsed = store.get(ADMIN_BAR_COOKIE)?.value === "collapsed";

  const linkClass =
    "flex items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-white/10";

  return (
    <AdminBarShell
      email={admin.email}
      role={admin.role}
      defaultCollapsed={collapsed}
    >
      <AppLink href="/admin" className={linkClass}>
        <LayoutDashboard className="size-3.5" aria-hidden />
        Dashboard
      </AppLink>
      <AppLink href="/admin/orders" className={linkClass}>
        <Package className="size-3.5" aria-hidden />
        Orders
      </AppLink>
      <AppLink href="/admin/emails" className={linkClass}>
        <Mail className="size-3.5" aria-hidden />
        Emails
      </AppLink>
      <AppLink href="/studio" className={linkClass}>
        <PenSquare className="size-3.5" aria-hidden />
        Studio
      </AppLink>
    </AdminBarShell>
  );
}
