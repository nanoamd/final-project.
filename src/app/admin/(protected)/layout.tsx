import "./hq.css";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";
import { signOutAdmin } from "@/server/actions/admin-auth";
import { getAttentionCounts } from "@/server/actions/hq-attention";
import { searchOrders } from "@/server/actions/hq-search";
import { getAuthorizedAdmin } from "@/server/auth/admin";

import { CommandPalette, type PaletteCommand } from "./command-palette";
import { HqClock } from "./hq-clock";

/**
 * Kaiku HQ's shell.
 *
 * "make my admin page feel like a bloomberg terminal." What makes a terminal a
 * terminal is not the dark colour — it is that the whole screen is information,
 * numbers line up because they are tabular monospace, colour only ever means
 * something, and you navigate by typing rather than pointing. So: hairline
 * panels instead of cards, 11-13px type, a persistent status bar, and ⌘K as the
 * primary way around with `g`-then-key jumps behind it.
 *
 * The skin is scoped to `[data-hq]` (see hq.css) so none of it can leak into the
 * storefront, which is a warm off-white shop and stays one.
 */

const NAV_ITEMS: {
  label: string;
  href:
    | "/admin"
    | "/admin/orders"
    | "/admin/products"
    | "/admin/inbox"
    | "/admin/newsletter"
    | "/admin/emails"
    | "/admin/import"
    | "/admin/returns"
    | "/admin/customers"
    | "/admin/suppliers"
    | "/admin/tasks"
    | "/admin/analytics"
    | "/admin/seo";
  /** Second key after `g`. */
  key: string;
}[] = [
  { label: "Dashboard", href: "/admin", key: "d" },
  { label: "Orders", href: "/admin/orders", key: "o" },
  { label: "Returns", href: "/admin/returns", key: "u" },
  { label: "Products", href: "/admin/products", key: "r" },
  { label: "Customers", href: "/admin/customers", key: "c" },
  { label: "Suppliers", href: "/admin/suppliers", key: "s" },
  { label: "Inbox", href: "/admin/inbox", key: "i" },
  { label: "Tasks", href: "/admin/tasks", key: "t" },
  { label: "Analytics", href: "/admin/analytics", key: "a" },
  { label: "SEO", href: "/admin/seo", key: "q" },
  { label: "Emails", href: "/admin/emails", key: "e" },
  { label: "Newsletter", href: "/admin/newsletter", key: "n" },
  { label: "Import product", href: "/admin/import", key: "p" },
];

const PALETTE_COMMANDS: PaletteCommand[] = [
  ...NAV_ITEMS.map((item) => ({
    id: item.href,
    label: item.label,
    hint: item.href,
    href: item.href,
    shortcut: item.key,
  })),
  {
    id: "studio",
    label: "Sanity Studio",
    hint: "Catalogue, content, emails",
    href: "/studio",
    shortcut: "s",
  },
  {
    id: "shop",
    label: "View the shop",
    hint: "The storefront as a customer sees it",
    href: "/shop",
  },
];

export const metadata: Metadata = {
  title: "Kaiku HQ",
  robots: { index: false, follow: false },
};

/**
 * Gates every route under /admin except /admin/login (a sibling outside this
 * route group, so it isn't wrapped by this check). Authorization goes through
 * getAuthorizedAdmin() — ADMIN_EMAIL is always the owner, and additional staff
 * accounts come from the `admin_users` table (see
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

  // On every page, not just the dashboard: the point of a count is that you see
  // it while you are somewhere else.
  const attention = await getAttentionCounts();

  return (
    <div
      data-hq
      className="flex min-h-screen flex-col"
      style={{ background: "var(--hq-bg)", color: "var(--hq-text)" }}
    >
      {/* Top bar — identity, clock, live counts, how to drive it. */}
      <header
        className="flex shrink-0 items-center gap-3 px-3 py-1.5"
        style={{
          borderBottom: "1px solid var(--hq-line)",
          background: "var(--hq-panel)",
        }}
      >
        <Link
          href="/admin"
          className="text-[11px] font-semibold tracking-[0.18em] uppercase"
          style={{ color: "var(--hq-accent)" }}
        >
          Kaiku HQ
        </Link>
        <span className="hidden sm:block">
          <HqClock />
        </span>

        <div className="ml-auto flex items-center gap-2">
          <TopCount
            label="Now"
            value={attention.critical}
            colour="var(--hq-down)"
          />
          <TopCount
            label="Today"
            value={attention.warning}
            colour="var(--hq-warn)"
          />
          <TopCount
            label="Queue"
            value={attention.due}
            colour="var(--hq-dim)"
          />
          <span
            className="hq-num ml-2 hidden border px-1.5 py-0.5 text-[10px] md:block"
            style={{
              borderColor: "var(--hq-line)",
              color: "var(--hq-faint)",
            }}
          >
            ⌘K
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Rail — a reminder of what exists, with the keys to get there. */}
        <aside
          className="flex w-44 shrink-0 flex-col"
          style={{
            borderRight: "1px solid var(--hq-line)",
            background: "var(--hq-panel)",
          }}
        >
          <nav className="flex flex-col py-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hq-row-hover flex items-center gap-2 px-3 py-1.5 text-[12px]"
                style={{ color: "var(--hq-text)" }}
              >
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === "/admin" && attention.total > 0 ? (
                  <span
                    className="hq-num text-[10px]"
                    style={{
                      color:
                        attention.critical > 0
                          ? "var(--hq-down)"
                          : "var(--hq-warn)",
                    }}
                  >
                    {attention.critical > 0
                      ? attention.critical
                      : attention.total}
                  </span>
                ) : null}
                <span
                  className="hq-num text-[10px]"
                  style={{ color: "var(--hq-faint)" }}
                >
                  g{item.key}
                </span>
              </Link>
            ))}
          </nav>

          <div
            className="mt-auto flex flex-col gap-1 p-3"
            style={{ borderTop: "1px solid var(--hq-line-soft)" }}
          >
            <AppLink
              href="/studio"
              className="text-[11px]"
              style={{ color: "var(--hq-info)" }}
            >
              Sanity Studio ↗
            </AppLink>
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="text-[11px]"
                style={{ color: "var(--hq-faint)" }}
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden p-3">{children}</main>
      </div>

      {/* Status bar. */}
      <footer
        className="flex shrink-0 items-center gap-3 px-3 py-1 text-[10px]"
        style={{
          borderTop: "1px solid var(--hq-line)",
          background: "var(--hq-panel)",
          color: "var(--hq-faint)",
        }}
      >
        <span
          className="hq-caret"
          style={{ color: "var(--hq-up)" }}
          aria-hidden
        >
          ▍
        </span>
        <span className="hq-num">{admin.email}</span>
        <span className="hq-num uppercase">{admin.role}</span>
        <span className="hq-num ml-auto">
          {attention.total === 0
            ? "ALL CLEAR"
            : `${attention.total} OPEN · ${attention.critical} URGENT`}
        </span>
      </footer>

      <CommandPalette commands={PALETTE_COMMANDS} searchOrders={searchOrders} />
    </div>
  );
}

function TopCount({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: string;
}) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="hq-label" style={{ color: "var(--hq-faint)" }}>
        {label}
      </span>
      <span
        className="hq-num text-[12px] font-semibold"
        style={{ color: value > 0 ? colour : "var(--hq-faint)" }}
      >
        {value}
      </span>
    </span>
  );
}
